import type { DebateSessionSnapshot, TimelineEntry } from '../../contracts/debate-runtime';
import type {
    DebateVerdict,
    ConclusionType,
    StanceResult,
    VerdictKeyArgument,
    VerdictFeedback,
    VerdictFeedbackVote,
} from '../../contracts/debate-types';
import type { DebateStore } from '../../contracts/storage/debate-store';
import { DebateVerdictRecordSchema } from '../../types/schema-types';
import type { IAdapterRegistry } from '../../contracts/provider-adapter';
import { rootLogger } from '../logger-service';
import { safeJsonParse } from '../../../kernel/utils/safe-json';
import { sanitizePromptVar } from '../../../shared/utils/sanitize';
import type { DebateProviderResolver } from './debate-query-engine';
import { DEBATE_MODEL_PRIORITY } from './debate-query-engine';

const LOGGER = rootLogger.child('DebateConclusionEngine');

export type LlmCallFn = (prompt: string, signal?: AbortSignal) => Promise<string>;

interface JudgeResult {
    label: string;
    summary: string;
    reasoning: string;
}

function combineSignals(...signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();
    for (const sig of signals) {
        if (sig.aborted) {
            controller.abort(new Error('CombinedSignalAlreadyAborted'));
            return controller.signal;
        }
        sig.addEventListener('abort', () => controller.abort(new Error('CombinedSignalAborted')), {
            once: true,
        });
    }
    return controller.signal;
}

const MAX_ENHANCED_SESSIONS = 500;

export class DebateConclusionEngine {
    private feedbackLog: VerdictFeedback[] = [];
    private enhancedSessions = new Set<string>();
    private enhancementInFlight = false;
    private enhancementRetryAfter = 0;

    private pruneEnhancedSessions(): void {
        if (this.enhancedSessions.size > MAX_ENHANCED_SESSIONS) {
            const entries = Array.from(this.enhancedSessions);
            this.enhancedSessions = new Set(entries.slice(-MAX_ENHANCED_SESSIONS));
        }
    }

    constructor(private llmCall?: LlmCallFn) {}

    generateVerdict(snapshot: DebateSessionSnapshot, timeline: TimelineEntry[]): DebateVerdict {
        const agentResponses = timeline.filter((e) => e.type === 'agent:responded');
        const keyArguments = this.extractKeyArguments(agentResponses, snapshot);
        const conclusionType = this.determineConclusionType(snapshot, keyArguments);
        const stanceResult = this.determineStanceResult(keyArguments);
        const summary = this.buildSummary(snapshot, conclusionType, stanceResult, keyArguments);
        const reasoning = this.buildReasoning(conclusionType, stanceResult, keyArguments, snapshot);

        return {
            sessionId: snapshot.id,
            topic: snapshot.topic,
            summary,
            conclusionType,
            stanceResult,
            keyArguments,
            reasoning,
            confidence:
                snapshot.totalTokens > 0
                    ? Math.min(0.95, 0.5 + (snapshot.round / Math.max(1, snapshot.round + 3)) * 0.3)
                    : 0.3,
            generatedAt: Date.now(),
            roundsTotal: snapshot.round,
            totalTokens: snapshot.totalTokens,
        };
    }

    private extractKeyArguments(
        responses: TimelineEntry[],
        snapshot: DebateSessionSnapshot,
    ): VerdictKeyArgument[] {
        const nameMap = new Map<string, string>();
        if (snapshot.topology?.nodes) {
            for (const node of snapshot.topology.nodes) {
                nameMap.set(node.id, node.label);
            }
        }
        const args: VerdictKeyArgument[] = [];
        for (const resp of responses) {
            const payload = resp.payload as { agentId: string; content: string; round: number };
            if (!payload?.agentId || !payload?.content) continue;
            const stance = this.inferStance(payload.content);
            args.push({
                agentId: payload.agentId,
                agentName: nameMap.get(payload.agentId) || payload.agentId,
                content: payload.content.slice(0, 500),
                stance,
                strength: this.estimateStrength(payload.content),
            });
        }
        return args;
    }

    private inferStance(content: string): 'pro' | 'con' | 'neutral' {
        const lower = content.toLowerCase();
        const proSignals = [
            'поддерживаю',
            'согласен',
            'верно',
            'преимущество',
            'плюс',
            'за',
            'advantage',
            'support',
            'agree',
            'benefit',
        ];
        const conSignals = [
            'возражают',
            'несогласен',
            'нет',
            'против',
            'минус',
            'риск',
            'disagree',
            'against',
            'risk',
            'drawback',
        ];
        const proCount = proSignals.filter((s) => lower.includes(s)).length;
        const conCount = conSignals.filter((s) => lower.includes(s)).length;
        if (proCount > conCount + 1) return 'pro';
        if (conCount > proCount + 1) return 'con';
        return 'neutral';
    }

    private estimateStrength(content: string): number {
        const len = content.length;
        const sentences = content.split(/[.!?]+/).length;
        const hasNumbers = /\d/.test(content) ? 0.1 : 0;
        const hasEvidence = /доказательств|исследовани|данных|evidence|study|data/i.test(content)
            ? 0.15
            : 0;
        const lengthScore = Math.min(0.4, len / 2000);
        const structureScore = Math.min(0.3, sentences / 20);
        return Math.min(1, lengthScore + structureScore + hasNumbers + hasEvidence + 0.2);
    }

    private determineConclusionType(
        snapshot: DebateSessionSnapshot,
        keyArguments: VerdictKeyArgument[],
    ): ConclusionType {
        const proCount = keyArguments.filter((a) => a.stance === 'pro').length;
        const conCount = keyArguments.filter((a) => a.stance === 'con').length;
        const total = keyArguments.length;
        if (total === 0) return 'inconclusive';
        if (snapshot.totalTokens < 500) return 'inconclusive';
        const dominantRatio = Math.max(proCount, conCount) / total;
        if (dominantRatio > 0.75) return 'dominance';
        if (proCount > 0 && conCount > 0 && dominantRatio < 0.6) return 'partial_agreement';
        if (proCount > 0 && conCount > 0) return 'consensus';
        return 'stalemate';
    }

    private determineStanceResult(keyArguments: VerdictKeyArgument[]): StanceResult {
        const proStrength = keyArguments
            .filter((a) => a.stance === 'pro')
            .reduce((s, a) => s + a.strength, 0);
        const conStrength = keyArguments
            .filter((a) => a.stance === 'con')
            .reduce((s, a) => s + a.strength, 0);
        const diff = proStrength - conStrength;
        if (diff > 0.5) return 'pro_wins';
        if (diff < -0.5) return 'con_wins';
        if (Math.abs(diff) < 0.15) return 'balanced';
        return 'no_clear_winner';
    }

    private buildSummary(
        snapshot: DebateSessionSnapshot,
        conclusionType: ConclusionType,
        stanceResult: StanceResult,
        _keyArguments: VerdictKeyArgument[],
    ): string {
        const typeLabels: Record<ConclusionType, string> = {
            consensus: 'участники пришли к общему мнению',
            dominance: 'одна сторона доминировала',
            stalemate: 'не удалось достичь согласия',
            partial_agreement: 'есть частичное согласие по отдельным аспектам',
            inconclusive: 'недостаточно данных для вывода',
        };
        const stanceLabels: Record<StanceResult, string> = {
            pro_wins: 'аргументы "за" убедительнее',
            con_wins: 'аргументы "против" убедительнее',
            balanced: 'аргументы сбалансированы',
            no_clear_winner: 'ясного победителя нет',
        };
        return `Тема: ${snapshot.topic}. ${typeLabels[conclusionType]}. ${stanceLabels[stanceResult]}. Участников: ${snapshot.agentStates?.length ?? 0}, раундов: ${snapshot.round}.`;
    }

    private buildReasoning(
        conclusionType: ConclusionType,
        stanceResult: StanceResult,
        keyArguments: VerdictKeyArgument[],
        snapshot: DebateSessionSnapshot,
    ): string {
        const lines: string[] = [];
        lines.push(
            `Заключение основано на ${keyArguments.length} аргументах за ${snapshot.round} раундов.`,
        );
        if (conclusionType === 'dominance') {
            const dominant =
                stanceResult === 'pro_wins'
                    ? 'за'
                    : stanceResult === 'con_wins'
                      ? 'против'
                      : 'одной стороне';
            lines.push(`Сторона ${dominant} выдвинула более убедительные аргументы.`);
        } else if (conclusionType === 'partial_agreement') {
            lines.push('Участники согласны по некоторым пунктам, но расходятся по другим.');
        } else if (conclusionType === 'stalemate') {
            lines.push('Аргументы обеих сторон оказались равносильными.');
        }
        if (keyArguments.length > 0) {
            const strongest = keyArguments.reduce(
                (best, a) => (a.strength > best.strength ? a : best),
                keyArguments[0]!,
            );
            lines.push(
                `Самый сильный аргумент: "${strongest.content.slice(0, 100)}..." (${strongest.agentName}).`,
            );
        }
        return lines.join(' ');
    }

    async generateVerdictWithLLM(
        snapshot: DebateSessionSnapshot,
        timeline: TimelineEntry[],
        signal?: AbortSignal,
    ): Promise<DebateVerdict> {
        const base = this.generateVerdict(snapshot, timeline);
        if (!this.llmCall) return base;
        if (this.enhancedSessions.has(snapshot.id)) return base;
        if (this.enhancementInFlight) return base;

        const now = Date.now();
        if (now < this.enhancementRetryAfter) {
            return base;
        }

        this.enhancementInFlight = true;
        try {
            const round = snapshot.round;
            const agentCount = snapshot.agentStates.length;

            // P2.2 Judge Deliberation: call LLM from 3 perspectives and merge
            const perspectives: Array<{ label: string; instruction: string }> = [
                {
                    label: 'Pro-Judge',
                    instruction:
                        'You are a judge sympathetic to the PRO side. Evaluate which arguments for the proposition were strongest and why they should carry more weight.',
                },
                {
                    label: 'Con-Judge',
                    instruction:
                        'You are a judge sympathetic to the CON side. Evaluate which arguments against the proposition were strongest and why they should carry more weight.',
                },
                {
                    label: 'Neutral-Judge',
                    instruction:
                        'You are a neutral judge seeking the most objective truth. Weigh both sides impartially and identify the strongest overall case regardless of stance.',
                },
            ];

            const timeoutMs = 30_000;
            const perJudgeTimeoutMs = Math.min(15_000, Math.floor(timeoutMs / perspectives.length));

            const judgeResults: JudgeResult[] = [];

            for (const perspective of perspectives) {
                const judgeController = new AbortController();
                const judgeTimer = setTimeout(
                    () => judgeController.abort(new Error(`${perspective.label}TimedOut`)),
                    perJudgeTimeoutMs,
                );
                const combinedSig = signal
                    ? combineSignals(signal, judgeController.signal)
                    : judgeController.signal;

                try {
                    const prompt = this.buildLLMPrompt(
                        base,
                        round,
                        agentCount,
                        perspective.label,
                        perspective.instruction,
                    );
                    const response = await this.llmCall(prompt, combinedSig);
                    clearTimeout(judgeTimer);
                    const parsed = this.parseJudgeResponse(response);
                    judgeResults.push({
                        label: perspective.label,
                        summary: parsed.summary || `[${perspective.label}] No summary generated`,
                        reasoning:
                            parsed.reasoning || `[${perspective.label}] No reasoning generated`,
                    });
                } catch {
                    clearTimeout(judgeTimer);
                    judgeResults.push({
                        label: perspective.label,
                        summary: `[${perspective.label}] Judge deliberation failed`,
                        reasoning: `[${perspective.label}] Unable to complete analysis`,
                    });
                }
            }

            const mergedSummary = this.mergeJudgeSummaries(judgeResults, base);
            const mergedReasoning = this.mergeJudgeReasonings(judgeResults, base);

            const enhanced: DebateVerdict = {
                ...base,
                summary: mergedSummary,
                reasoning: mergedReasoning,
            };
            this.enhancedSessions.add(snapshot.id);
            this.pruneEnhancedSessions();
            return enhanced;
        } catch (e) {
            if (signal?.aborted) {
                this.enhancementInFlight = false;
                return base;
            }
            this.enhancedSessions.add(snapshot.id);
            this.pruneEnhancedSessions();
            this.enhancementRetryAfter = Date.now() + 10 * 60 * 1000;
            LOGGER.warn(
                'DebateConclusionEngine',
                'LLM verdict enhancement failed, using heuristic base',
                { error: e },
            );
            return base;
        } finally {
            this.enhancementInFlight = false;
        }
    }

    private parseJudgeResponse(response: string): { summary?: string; reasoning?: string } {
        const cleaned = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        const parsed = safeJsonParse(cleaned) as { summary?: string; reasoning?: string };
        return parsed;
    }

    private mergeJudgeSummaries(results: JudgeResult[], base: DebateVerdict): string {
        const nonEmpty = results.filter((r) => r.summary && !r.summary.includes('failed'));
        if (nonEmpty.length === 0) return base.summary;
        if (nonEmpty.length === 1) return nonEmpty[0]!.summary;

        const neutral = nonEmpty.find((r) => r.label === 'Neutral-Judge');
        if (neutral) return neutral.summary;

        return nonEmpty.map((r) => `[${r.label}] ${r.summary}`).join(' ');
    }

    private mergeJudgeReasonings(results: JudgeResult[], base: DebateVerdict): string {
        const nonEmpty = results.filter((r) => r.reasoning && !r.reasoning.includes('failed'));
        if (nonEmpty.length === 0) return base.reasoning;

        const sections = nonEmpty.map((r) => `=== ${r.label} Analysis ===\n${r.reasoning}`);
        sections.push(
            `=== Aggregate ===\nMulti-perspective deliberation across ${results.length} judges.`,
        );
        return sections.join('\n\n');
    }

    private buildLLMPrompt(
        verdict: DebateVerdict,
        round: number,
        agentCount: number,
        judgeLabel?: string,
        judgeInstruction?: string,
    ): string {
        const argsSummary = verdict.keyArguments
            .slice(0, 10)
            .map(
                (a, i) =>
                    `${i + 1}. [${a.stance}] ${sanitizePromptVar(a.agentName)}: ${sanitizePromptVar(a.content.slice(0, 300))}`,
            )
            .join('\n');

        const judgePrefix = judgeLabel
            ? `\n\nYou are acting as ${judgeLabel}.\n${judgeInstruction}\n`
            : '';

        return `You are a debate analyst. Analyze the following debate verdict and provide an enhanced summary and reasoning.${judgePrefix}

DEBATE TOPIC: ${sanitizePromptVar(verdict.topic)}
ROUNDS: ${round}
PARTICIPANTS: ${agentCount}
CONCLUSION TYPE: ${verdict.conclusionType}
STANCE: ${verdict.stanceResult}

KEY ARGUMENTS:
${argsSummary}

Respond in JSON format:
{
  "summary": "A concise 2-3 sentence summary of the debate outcome from your perspective",
  "reasoning": "A detailed explanation of WHY this conclusion was reached from your perspective, citing specific arguments and patterns"
}

Respond ONLY with valid JSON, no markdown.`;
    }

    destroy(): void {
        this.feedbackLog = [];
        this.llmCall = undefined;
        this.enhancedSessions.clear();
        this.enhancementInFlight = false;
        this.enhancementRetryAfter = 0;
    }

    recordFeedback(sessionId: string, vote: VerdictFeedbackVote, comment?: string): void {
        this.feedbackLog.push({ sessionId, vote, comment, timestamp: Date.now() });
        if (this.feedbackLog.length > 500) this.feedbackLog.shift();
    }

    getFeedback(sessionId?: string): VerdictFeedback[] {
        return sessionId
            ? this.feedbackLog.filter((f) => f.sessionId === sessionId)
            : [...this.feedbackLog];
    }

    getFeedbackStats(sessionId: string): { agrees: number; disagrees: number; ratio: number } {
        const fb = this.getFeedback(sessionId);
        const agrees = fb.filter((f) => f.vote === 'agree').length;
        const disagrees = fb.filter((f) => f.vote === 'disagree').length;
        const total = agrees + disagrees;
        return { agrees, disagrees, ratio: total > 0 ? agrees / total : 0.5 };
    }
}

export interface ConclusionLlmDeps {
    getAdapterRegistry(): IAdapterRegistry;
    getKeyService(): {
        getKeys(): Array<{
            id: string;
            key: string;
            provider: string;
            status: string;
            model?: string;
            availableModels?: string[];
        }>;
    };
    getKeyStateStore?(): {
        get(
            id: string,
        ):
            | { flags: { authFailed: boolean; circuitOpen: boolean; rateLimited: boolean } }
            | undefined;
        update(id: string, patch: { flags: Record<string, boolean> }): void;
    };
    providerResolver: DebateProviderResolver;
}

export function buildConclusionLlmCall(
    deps: ConclusionLlmDeps,
): (prompt: string, signal?: AbortSignal) => Promise<string> {
    return async (prompt: string, signal?: AbortSignal): Promise<string> => {
        const adapterRegistry = deps.getAdapterRegistry();
        const keyService = deps.getKeyService();
        const keys = keyService.getKeys();
        const preferredProviders = ['groq', 'gemini', 'openrouter', 'nvidia'];
        const messages = [{ role: 'user' as const, content: prompt }];
        const stateStore = deps.getKeyStateStore?.();
        const candidateKeys = [
            ...preferredProviders.flatMap((provider) =>
                keys.filter(
                    (k) =>
                        k.provider.toLowerCase() === provider &&
                        k.status === 'active' &&
                        !deps.providerResolver.isKeyAuthFailed(k.id),
                ),
            ),
            ...keys.filter(
                (k) => k.status === 'active' && !deps.providerResolver.isKeyAuthFailed(k.id),
            ),
        ];

        for (const activeKey of candidateKeys) {
            const keyState = stateStore?.get(activeKey.id);
            if (
                keyState?.flags.authFailed ||
                keyState?.flags.circuitOpen ||
                keyState?.flags.rateLimited
            )
                continue;
            const providerStatus = adapterRegistry.getProviderRuntimeStatus(activeKey.provider);
            if (providerStatus.circuitOpen || providerStatus.rateLimited) continue;

            const adapter = adapterRegistry.getAdapter(activeKey.provider);
            if (!adapter) continue;

            const model =
                activeKey.model && activeKey.model !== 'auto'
                    ? activeKey.model
                    : (DEBATE_MODEL_PRIORITY[activeKey.provider.toLowerCase()] ?? [])[0] || 'auto';

            try {
                const result = await adapter.sendMessage(messages, model, activeKey.key, signal);
                return typeof result.content === 'string' ? result.content : String(result.content);
            } catch (error) {
                const sc = (error as { statusCode?: number }).statusCode;
                const msg = String(error);
                const isProviderAuthError =
                    sc === 401 ||
                    sc === 402 ||
                    sc === 403 ||
                    msg.includes('401') ||
                    msg.includes('402') ||
                    msg.includes('403') ||
                    msg.includes('Unauthorized') ||
                    msg.includes('Forbidden') ||
                    msg.includes('Payment Required');
                const isProviderThrottle =
                    sc === 429 ||
                    msg.includes('429') ||
                    msg.includes('Too Many Requests') ||
                    msg.includes('Rate limit');
                if (isProviderAuthError || isProviderThrottle) {
                    const kss = deps.getKeyStateStore?.();
                    if (kss) {
                        try {
                            kss.update(activeKey.id, {
                                flags: {
                                    ...(keyState?.flags ?? {
                                        circuitOpen: false,
                                        rateLimited: false,
                                        authFailed: false,
                                    }),
                                    authFailed:
                                        (keyState?.flags.authFailed ?? false) ||
                                        isProviderAuthError,
                                    rateLimited:
                                        (keyState?.flags.rateLimited ?? false) ||
                                        isProviderThrottle,
                                },
                            });
                        } catch {
                            /* best-effort */
                        }
                    }
                    continue;
                }
                throw error;
            }
        }

        throw new Error('No usable key for conclusion LLM');
    };
}

export async function validateAndSaveVerdict(
    store: DebateStore,
    verdict: Omit<DebateVerdict, 'keyArguments'> & { keyArguments: string },
): Promise<void> {
    const vp = DebateVerdictRecordSchema.safeParse(verdict);
    if (!vp.success) {
        LOGGER.warn('DebateEngine', 'verdict validation failed', { errors: vp.error.issues });
        return;
    }
    await store.saveVerdict(verdict);
}
