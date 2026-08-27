import { rootLogger } from './logger-service';
import { EVENTS } from '../events/event-names';
import type { DebateArgument } from '../contracts/debate-types';
import { sanitizePromptVar } from '../utils/sanitize';
import { PROVIDER_DEFAULT_MODELS } from '../utils/provider-default-models';
import { SeededRng } from '../utils/seedable-rng';

export type FactVerdict = 'verified' | 'disputed' | 'false' | 'no_evidence' | 'pending' | 'error';

export interface FactCheckResult {
    claim: string;
    verdict: FactVerdict;
    confidence: number;
    reasoning: string;
    checkedAt: number;
}

export interface ArgumentFactCheck {
    argumentId: string;
    results: FactCheckResult[];
    overallScore: number;
    checkedAt: number;
}

export type FactCheckLevel = 'off' | 'sampled' | 'all';

interface FactCheckServiceDeps {
    eventBus: { emit: (event: string, payload: unknown) => void };
    getApiKey: (provider: string) => string | undefined;
    sendMessage: (
        messages: Array<{ role: string; content: string }>,
        model: string,
        apiKey: string,
        signal?: AbortSignal,
    ) => Promise<{ content: string }>;
}

const CLAIM_PATTERNS = [
    /\b\d{4}\b\s+(was|is|had|has|were|did)/i,
    /\b\d+\.?\d*%/,
    /\b\d+\s+(million|billion|trillion|thousand|hundred)/i,
    /\bstud(y|ies|ied)\s+(that|show|shows|found|indicates)/i,
    /\bresearch\s+(by|from|at|shows|indicates|suggests)/i,
    /\baccording\s+to/i,
    /\bproven\b|\bconfirmed\b|\bestablished\b/,
    /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i,
];

const VERIFICATION_PROMPT = `You are a fact-checking assistant. For each factual claim below, respond with EXACTLY one line per claim in this format:
CLAIM: <text> | VERDICT: verified|disputed|false|no_evidence | CONFIDENCE: 0.0-1.0 | REASON: <brief explanation>

Rules:
- "verified" = well-established fact, widely accepted
- "disputed" = some evidence but contested
- "false" = contradicted by reliable sources
- "no_evidence" = cannot verify or refute

Claims to check:`;

const MAX_CACHE = 200;
const MAX_ARG_RESULTS = 200;

export class FactCheckService {
    private cache = new Map<string, FactCheckResult>();
    private argumentResults = new Map<string, ArgumentFactCheck>();
    private level: FactCheckLevel = 'sampled';
    private checkInterval = 0.2;
    private deps: FactCheckServiceDeps;
    private _abortController = new AbortController();
    private _rng = new SeededRng();

    constructor(deps: FactCheckServiceDeps) {
        this.deps = deps;
    }

    setLevel(level: FactCheckLevel): void {
        this.level = level;
    }

    setSampleRate(rate: number): void {
        this.checkInterval = Math.max(0, Math.min(1, rate));
    }

    shouldCheck(): boolean {
        if (this.level === 'off') return false;
        if (this.level === 'all') return true;
        return this._rng.chance(this.checkInterval);
    }

    extractClaims(text: string): string[] {
        const sentences = text
            .split(/[.!?]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 15);
        return sentences.filter((s) => CLAIM_PATTERNS.some((p) => p.test(s)));
    }

    async checkArgument(
        arg: DebateArgument,
        externalSignal?: AbortSignal,
    ): Promise<ArgumentFactCheck | null> {
        if (!this.shouldCheck()) return null;
        if (this.argumentResults.has(arg.id)) return this.argumentResults.get(arg.id)!;
        if (this._abortController.signal.aborted) return null;

        const claims = this.extractClaims(arg.content);
        if (claims.length === 0) return null;

        const effectiveSignal = externalSignal ?? this._abortController.signal;

        const results: FactCheckResult[] = [];
        for (const claim of claims.slice(0, 5)) {
            if (effectiveSignal.aborted) break;
            const cached = this.cache.get(claim);
            if (cached) {
                results.push(cached);
                continue;
            }
            const result = await this.verifyClaim(claim, effectiveSignal);
            this.cache.set(claim, result);
            if (this.cache.size > MAX_CACHE) {
                const oldest = this.cache.keys().next().value;
                if (oldest !== undefined) this.cache.delete(oldest);
            }
            results.push(result);
        }

        const overallScore =
            results.length > 0
                ? results.filter((r) => r.verdict === 'verified').length / results.length
                : 0;

        const factCheck: ArgumentFactCheck = {
            argumentId: arg.id,
            results,
            overallScore,
            checkedAt: Date.now(),
        };

        this.argumentResults.set(arg.id, factCheck);
        if (this.argumentResults.size > MAX_ARG_RESULTS) {
            const oldest = this.argumentResults.keys().next().value;
            if (oldest !== undefined) this.argumentResults.delete(oldest);
        }
        this.deps.eventBus.emit(EVENTS.DEBATE_FACT_CHECKED, {
            argumentId: arg.id,
            factCheck,
        });

        return factCheck;
    }

    private apiKeyCache = new Map<string, { key: string; provider: string }>();

    private getCachedApiKey(): { key: string; provider: string } | null {
        const cached = this.apiKeyCache.get('default');
        if (cached && cached.key) return cached;

        for (const provider of ['groq', 'gemini', 'openrouter'] as const) {
            const key = this.deps.getApiKey(provider);
            if (key) {
                const entry = { key, provider };
                this.apiKeyCache.set('default', entry);
                return entry;
            }
        }
        return null;
    }

    private async verifyClaim(claim: string, signal?: AbortSignal): Promise<FactCheckResult> {
        try {
            if (signal?.aborted) {
                return {
                    claim,
                    verdict: 'no_evidence',
                    confidence: 0,
                    reasoning: 'Cancelled',
                    checkedAt: Date.now(),
                };
            }
            const cached = this.getCachedApiKey();
            if (!cached) {
                return {
                    claim,
                    verdict: 'no_evidence',
                    confidence: 0,
                    reasoning: 'No API key available',
                    checkedAt: Date.now(),
                };
            }
            const { key: apiKey, provider } = cached;
            const model =
                provider === 'groq'
                    ? PROVIDER_DEFAULT_MODELS.groq
                    : provider === 'gemini'
                      ? PROVIDER_DEFAULT_MODELS.gemini_flash
                      : 'meta-llama/llama-3.3-70b-instruct';

            const response = await this.deps.sendMessage(
                [
                    {
                        role: 'user',
                        content: `${VERIFICATION_PROMPT}\n\n- ${sanitizePromptVar(claim)}`,
                    },
                ],
                model!,
                apiKey,
                signal,
            );

            return this.parseVerdict(claim, response.content);
        } catch (e) {
            rootLogger.warn('FactCheck', 'Verification failed', {
                error: e,
                claim: claim.slice(0, 80),
            });
            return {
                claim,
                verdict: 'error',
                confidence: 0,
                reasoning: 'Verification failed',
                checkedAt: Date.now(),
            };
        }
    }

    private parseVerdict(claim: string, response: string): FactCheckResult {
        const line = response.split('\n').find((l) => l.includes('VERDICT:'));
        if (!line)
            return {
                claim,
                verdict: 'no_evidence',
                confidence: 0,
                reasoning: 'Could not parse response',
                checkedAt: Date.now(),
            };

        const verdictMatch = line.match(/VERDICT:\s*(\w+)/);
        const confidenceMatch = line.match(/CONFIDENCE:\s*([\d.]+)/);
        const reasonMatch = line.match(/REASON:\s*(.+)/);

        const verdictStr = verdictMatch?.[1]?.toLowerCase() || 'no_evidence';
        const verdicts: Record<string, FactVerdict> = {
            verified: 'verified',
            disputed: 'disputed',
            false: 'false',
            no_evidence: 'no_evidence',
        };

        return {
            claim,
            verdict: verdicts[verdictStr] || 'no_evidence',
            confidence: parseFloat(confidenceMatch?.[1] || '0.5'),
            reasoning: reasonMatch?.[1]?.trim() || '',
            checkedAt: Date.now(),
        };
    }

    getForArgument(argumentId: string): ArgumentFactCheck | undefined {
        return this.argumentResults.get(argumentId);
    }

    getAll(): ArgumentFactCheck[] {
        return [...this.argumentResults.values()];
    }

    getScore(): number {
        const all = [...this.argumentResults.values()];
        if (all.length === 0) return 1;
        return all.reduce((sum, fc) => sum + fc.overallScore, 0) / all.length;
    }

    destroy(): void {
        this._abortController.abort();
        this.cache.clear();
        this.argumentResults.clear();
    }
}
