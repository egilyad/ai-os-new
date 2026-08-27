import { z } from 'zod';
import { rootLogger } from './logger-service';
import { PROVIDER_DEFAULT_MODELS } from '../utils/provider-default-models';
import type {
    IGeminiResearchService,
    GeminiEnhancedSearchResult,
    GeminiResearchSource,
    GeminiClaimAnalysis,
    GeminiEnhancedSummary,
    GeminiAnomalyResult,
    GeminiPeerReviewOutput,
} from '../contracts/gemini-research';
import type { GoogleGenAIService } from './google-genai-service';
import type { ResearchEngineService } from './research-engine-service';
import type { ChatMessage } from '../types/llm-types';
import type { ResearchSession } from '../contracts/research-engine';

const LOGGER = rootLogger.child('GeminiResearch');

function buildMessages(system: string, user: string): ChatMessage[] {
    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

function extractJson<T>(text: string, schema: z.ZodType<T>): T | null {
    const cleaned = text
        .replace(/```(?:json)?\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
    const objStart = cleaned.indexOf('{');
    const objEnd = cleaned.lastIndexOf('}');
    if (objStart === -1 || objEnd === -1 || objEnd <= objStart) return null;
    const candidate = cleaned.slice(objStart, objEnd + 1);
    try {
        const parsed = JSON.parse(candidate);
        const result = schema.safeParse(parsed);
        if (result.success) return result.data;
        LOGGER.warn('GeminiResearch', 'extractJson schema validation failed', {
            error: result.error.message,
            preview: candidate.slice(0, 200),
        });
        return null;
    } catch (e) {
        LOGGER.warn('GeminiResearch', 'extractJson parse failed', {
            error: e instanceof Error ? e.message : String(e),
            preview: candidate.slice(0, 200),
        });
        return null;
    }
}

const SearchResponseSchema = z.object({
    answer: z.string(),
    sources: z
        .array(
            z.object({
                title: z.string(),
                uri: z.string(),
                snippet: z.string(),
                relevanceScore: z.number().optional(),
            }),
        )
        .optional(),
    confidence: z.number().optional(),
});

const ClaimAnalysisResponseSchema = z.object({
    analyses: z.array(
        z.object({
            claimId: z.string(),
            claim: z.string(),
            assessment: z.enum([
                'supported',
                'contradicted',
                'unverifiable',
                'partially_supported',
            ]),
            confidence: z.number(),
            reasoning: z.string(),
            suggestedCorrection: z.string().optional(),
        }),
    ),
});

const SummaryResponseSchema = z.object({
    abstract: z.string(),
    keyFindings: z.array(z.string()).optional(),
    methodology: z.string().optional(),
    limitations: z.array(z.string()).optional(),
    futureWork: z.array(z.string()).optional(),
});

const PeerReviewResponseSchema = z.object({
    originality: z.number(),
    methodology: z.number(),
    clarity: z.number(),
    significance: z.number(),
    overall: z.number(),
    recommendation: z.enum(['accept', 'minor_revision', 'major_revision', 'reject']),
    summary: z.string(),
    comments: z
        .array(
            z.object({
                section: z.string(),
                type: z.enum(['major_issue', 'minor_issue', 'question', 'suggestion', 'praise']),
                severity: z.enum(['critical', 'major', 'minor', 'cosmetic']),
                comment: z.string(),
            }),
        )
        .optional(),
});

const AnomalyResponseSchema = z.object({
    anomalies: z.array(
        z.object({
            type: z.enum(['contradiction', 'data_gap', 'methodology_flaw', 'source_bias']),
            severity: z.enum(['critical', 'warning', 'info']),
            description: z.string(),
            affectedClaims: z.array(z.string()).optional(),
            recommendation: z.string(),
        }),
    ),
});

const SEARCH_PROMPT = `You are a research assistant. Answer the question thoroughly using your knowledge. For each factual claim, provide a source reference. Return your answer as JSON:
{
  "answer": "detailed answer",
  "sources": [{"title": "source name", "uri": "url or reference", "snippet": "relevant excerpt", "relevanceScore": 0.0-1.0}],
  "confidence": 0.0-1.0
}`;

const CLAIM_ANALYSIS_PROMPT = `You are a fact-checking analyst. Evaluate each claim against available evidence. Return JSON:
{
  "analyses": [{"claimId": "...", "claim": "...", "assessment": "supported|contradicted|unverifiable|partially_supported", "confidence": 0.0-1.0, "reasoning": "...", "suggestedCorrection": "..."}]
}`;

const SUMMARY_PROMPT = `You are a research summarizer. Analyze the research session data and produce a structured summary. Return JSON:
{
  "abstract": "comprehensive abstract",
  "keyFindings": ["finding 1", "finding 2"],
  "methodology": "methodology description",
  "limitations": ["limitation 1"],
  "futureWork": ["future direction 1"]
}`;

const PEER_REVIEW_PROMPT = `You are a peer reviewer. Evaluate the research thoroughly. Return JSON:
{
  "originality": 0-100,
  "methodology": 0-100,
  "clarity": 0-100,
  "significance": 0-100,
  "overall": 0-100,
  "recommendation": "accept|minor_revision|major_revision|reject",
  "summary": "brief summary of review",
  "comments": [{"section": "...", "type": "major_issue|minor_issue|question|suggestion|praise", "severity": "critical|major|minor|cosmetic", "comment": "..."}]
}`;

const ANOMALY_PROMPT = `You are a research integrity analyst. Examine the session for contradictions, gaps, biases, and flaws. Return JSON:
{
  "anomalies": [{"type": "contradiction|data_gap|methodology_flaw|source_bias", "severity": "critical|warning|info", "description": "...", "affectedClaims": ["..."], "recommendation": "..."}]
}`;

export class GeminiAugmentedResearchService implements IGeminiResearchService {
    private _initialized = false;
    private _model = PROVIDER_DEFAULT_MODELS.gemini;
    private _abortController = new AbortController();

    constructor(
        private deps: {
            googleGenAI: GoogleGenAIService;
            researchEngine: ResearchEngineService;
        },
    ) {}

    get isAvailable(): boolean {
        return this.deps.googleGenAI.isConfigured;
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        LOGGER.info('GeminiResearch', 'Gemini Research augmentation initialized');
    }

    async start(): Promise<void> {
        LOGGER.info('GeminiResearch', 'Gemini Research augmentation started');
    }

    async destroy(): Promise<void> {
        this._abortController.abort();
        this._abortController = new AbortController();
        this._initialized = false;
    }

    async enhancedSearch(query: string): Promise<GeminiEnhancedSearchResult> {
        const start = Date.now();
        try {
            if (this._abortController.signal.aborted) {
                return { query, answer: 'Cancelled', sources: [], confidence: 0, latency: 0 };
            }
            const resp = await this.deps.googleGenAI.generateContent(
                buildMessages(SEARCH_PROMPT, query),
                this._model,
                { temperature: 0.3, googleSearchGrounding: true },
                this._abortController.signal,
            );
            const parsed = extractJson(resp.content, SearchResponseSchema);
            if (parsed) {
                const sources: GeminiResearchSource[] = (parsed.sources || []).map((s) => ({
                    title: s.title,
                    uri: s.uri,
                    snippet: s.snippet.slice(0, 300),
                    relevanceScore: s.relevanceScore ?? 0.5,
                }));
                return {
                    query,
                    answer: parsed.answer,
                    sources,
                    confidence: parsed.confidence ?? 0.5,
                    latency: Date.now() - start,
                };
            }
            return {
                query,
                answer: resp.content || 'No answer generated',
                sources: [],
                confidence: 0.3,
                latency: Date.now() - start,
            };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            LOGGER.error('GeminiResearch', 'enhancedSearch failed', { query, error: msg });
            return {
                query,
                answer: `Search failed: ${msg}`,
                sources: [],
                confidence: 0,
                latency: Date.now() - start,
            };
        }
    }

    async analyzeClaims(sessionId: string): Promise<GeminiClaimAnalysis[]> {
        const session = this.deps.researchEngine.getSession(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);
        try {
            const allClaims = session.loops.flatMap((l) => l.claims);
            if (allClaims.length === 0) return [];
            const batchSize = 10;
            const results: GeminiClaimAnalysis[] = [];
            for (let i = 0; i < allClaims.length; i += batchSize) {
                if (this._abortController.signal.aborted) break;
                const batch = allClaims.slice(i, i + batchSize);
                const context = batch
                    .map((c) => `[${c.id}] ${c.text} (confidence: ${c.confidence})`)
                    .join('\n');
                const resp = await this.deps.googleGenAI.generateContent(
                    buildMessages(CLAIM_ANALYSIS_PROMPT, `Analyze these claims:\n${context}`),
                    this._model,
                    { temperature: 0.2 },
                    this._abortController.signal,
                );
                const parsed = extractJson(resp.content, ClaimAnalysisResponseSchema);
                if (parsed) {
                    for (const a of parsed.analyses) {
                        results.push({
                            claimId: a.claimId,
                            claim: a.claim,
                            assessment: a.assessment,
                            confidence: a.confidence,
                            reasoning: a.reasoning,
                            suggestedCorrection: a.suggestedCorrection,
                        });
                    }
                }
            }
            return results;
        } catch (e) {
            LOGGER.error('GeminiResearch', 'analyzeClaims failed', { sessionId, error: String(e) });
            return [];
        }
    }

    async generateEnhancedSummary(sessionId: string): Promise<GeminiEnhancedSummary> {
        const session = this.deps.researchEngine.getSession(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);
        try {
            const context = this.buildSessionContext(session);
            const resp = await this.deps.googleGenAI.generateContent(
                buildMessages(
                    SUMMARY_PROMPT,
                    `Research session: "${session.title}"\nQuestion: ${session.initialQuestion}\n\nData:\n${context}`,
                ),
                this._model,
                { temperature: 0.3 },
                this._abortController.signal,
            );
            const parsed = extractJson(resp.content, SummaryResponseSchema);
            if (parsed) {
                return {
                    sessionId,
                    title: session.title,
                    abstract: parsed.abstract,
                    keyFindings: parsed.keyFindings ?? [],
                    methodology: parsed.methodology ?? '',
                    limitations: parsed.limitations ?? [],
                    futureWork: parsed.futureWork ?? [],
                };
            }
            return {
                sessionId,
                title: session.title,
                abstract: resp.content.slice(0, 500),
                keyFindings: [],
                methodology: '',
                limitations: [],
                futureWork: [],
            };
        } catch (e) {
            LOGGER.error('GeminiResearch', 'generateEnhancedSummary failed', {
                sessionId,
                error: String(e),
            });
            return {
                sessionId,
                title: 'Summary failed',
                abstract: '',
                keyFindings: [],
                methodology: '',
                limitations: [],
                futureWork: [],
            };
        }
    }

    async detectAnomalies(sessionId: string): Promise<GeminiAnomalyResult> {
        const session = this.deps.researchEngine.getSession(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);
        try {
            const context = this.buildSessionContext(session);
            const resp = await this.deps.googleGenAI.generateContent(
                buildMessages(ANOMALY_PROMPT, `Examine this research for anomalies:\n${context}`),
                this._model,
                { temperature: 0.2 },
                this._abortController.signal,
            );
            const parsed = extractJson(resp.content, AnomalyResponseSchema);
            if (parsed) {
                return {
                    anomalies: parsed.anomalies.map((a) => ({
                        type: a.type,
                        severity: a.severity,
                        description: a.description,
                        affectedClaims: a.affectedClaims ?? [],
                        recommendation: a.recommendation,
                    })),
                };
            }
            return { anomalies: [] };
        } catch (e) {
            LOGGER.error('GeminiResearch', 'detectAnomalies failed', {
                sessionId,
                error: String(e),
            });
            return { anomalies: [] };
        }
    }

    async runEnhancedPeerReview(sessionId: string): Promise<GeminiPeerReviewOutput> {
        const session = this.deps.researchEngine.getSession(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);
        try {
            const context = this.buildSessionContext(session);
            const resp = await this.deps.googleGenAI.generateContent(
                buildMessages(
                    PEER_REVIEW_PROMPT,
                    `Peer review this research:\nTitle: ${session.title}\nQuestion: ${session.initialQuestion}\n\nData:\n${context}`,
                ),
                this._model,
                { temperature: 0.2 },
                this._abortController.signal,
            );
            const parsed = extractJson(resp.content, PeerReviewResponseSchema);
            if (parsed) {
                const clamp = (v: number) => Math.min(100, Math.max(0, v));
                return {
                    originality: clamp(parsed.originality),
                    methodology: clamp(parsed.methodology),
                    clarity: clamp(parsed.clarity),
                    significance: clamp(parsed.significance),
                    overall: clamp(parsed.overall),
                    recommendation: parsed.recommendation,
                    summary: parsed.summary,
                    comments: parsed.comments ?? [],
                };
            }
            return {
                originality: 0,
                methodology: 0,
                clarity: 0,
                significance: 0,
                overall: 0,
                recommendation: 'major_revision',
                summary: 'Peer review could not be completed.',
                comments: [],
            };
        } catch (e) {
            LOGGER.error('GeminiResearch', 'runEnhancedPeerReview failed', {
                sessionId,
                error: String(e),
            });
            return {
                originality: 0,
                methodology: 0,
                clarity: 0,
                significance: 0,
                overall: 0,
                recommendation: 'major_revision',
                summary: `Peer review failed: ${e instanceof Error ? e.message : String(e)}`,
                comments: [],
            };
        }
    }

    private buildSessionContext(session: ResearchSession): string {
        const parts: string[] = [];
        for (const loop of session.loops) {
            parts.push(`Loop: ${loop.question.text}`);
            parts.push(
                `Sources (${loop.sources.length}): ${loop.sources.map((s) => s.title).join(', ')}`,
            );
            parts.push(
                `Claims (${loop.claims.length}): ${loop.claims.map((c) => c.text.slice(0, 100)).join(' | ')}`,
            );
            if (loop.synthesis) {
                parts.push(`Findings: ${loop.synthesis.keyFindings.join('; ')}`);
                parts.push(`Gaps: ${loop.synthesis.gaps.join('; ')}`);
            }
        }
        return parts.join('\n').slice(0, 8000);
    }
}
