import type {
    IResearchEngine,
    ResearchSession,
    ResearchSource,
    EpistemicLoopResult,
    SystematicReview,
    SystematicReviewConfig,
    FactCheckReport,
    AnomalyReport,
    SummarizationResult,
    SummaryStyle,
    SummaryLength,
    CitationGraph,
    CitationExport,
    CitationFormat,
    KnowledgeGraph,
    PeerReview,
    DiscoveryResult,
    ResearchReport,
    ReportFormat,
} from '../contracts/research-engine';
import type { SourceAdapterConfig } from '../contracts/research-adapter';
import type { SourceType } from '../contracts/research-engine';
import { EVENTS } from '../events/event-names';
import { rootLogger } from './logger-service';
import type { SourceAdapterRegistry } from './research-adapters/source-adapter-registry';
import { BucketStorageAdapter } from './storage-adapter';
import {
    getNextQuestion,
    searchSources as searchSourcesAlgo,
    extractClaims,
    synthesize,
    trimSessions,
    allText,
    computeCitationGraph,
    computeKnowledgeGraph,
    computeSystematicReview,
    computeFactCheck,
    computeAnomalies,
    computeSummary,
    computeCitations,
    computePeerReview,
    computeDiscovery,
} from './research-algorithms';

const LOGGER = rootLogger.child('ResearchEngine');
const MAX_SESSIONS = 50;
const MAX_SUMMARIES_PER_SESSION = 20;

interface ResearchEngineState {
    sessions: Record<string, ResearchSession>;
    citationGraphs: Record<string, CitationGraph>;
    knowledgeGraphs: Record<string, KnowledgeGraph>;
    systematicReviews: Record<string, SystematicReview>;
    factCheckReports: Record<string, FactCheckReport>;
    anomalyReports: Record<string, AnomalyReport>;
    summarizations: Record<string, SummarizationResult[]>;
    citationExports: Record<string, CitationExport>;
    peerReviews: Record<string, PeerReview>;
    researchReports: Record<string, ResearchReport>;
    discoveryResult: DiscoveryResult | null;
}

export class ResearchEngineService implements IResearchEngine {
    private sessions: Map<string, ResearchSession> = new Map();
    private citationGraphs: Map<string, CitationGraph> = new Map();
    private knowledgeGraphs: Map<string, KnowledgeGraph> = new Map();
    private systematicReviews: Map<string, SystematicReview> = new Map();
    private factCheckReports: Map<string, FactCheckReport> = new Map();
    private anomalyReports: Map<string, AnomalyReport> = new Map();
    private summarizations: Map<string, SummarizationResult[]> = new Map();
    private citationExports: Map<string, CitationExport> = new Map();
    private peerReviews: Map<string, PeerReview> = new Map();
    private _discoveryResult: DiscoveryResult | null = null;
    private researchReports: Map<string, ResearchReport> = new Map();
    private _initialized = false;
    private _abortController = new AbortController();

    /** 2b E13: remove entries from related maps whose session no longer exists */
    private _pruneOrphanedMaps(): void {
        const activeIds = new Set(this.sessions.keys());
        for (const map of [
            this.citationGraphs,
            this.knowledgeGraphs,
            this.systematicReviews,
            this.factCheckReports,
            this.anomalyReports,
            this.summarizations,
            this.citationExports,
            this.peerReviews,
            this.researchReports,
        ]) {
            for (const id of map.keys()) {
                if (!activeIds.has(id)) map.delete(id);
            }
        }
    }
    private _storageLoaded = false;

    constructor(
        private deps: {
            eventBus: { emit: (event: string, data?: unknown) => void };
            sourceAdapterRegistry: SourceAdapterRegistry;
        },
    ) {}

    async #ensureLoaded(): Promise<void> {
        if (this._storageLoaded) return;
        this._storageLoaded = true;
        try {
            const raw =
                await BucketStorageAdapter.RESEARCH.get<ResearchEngineState>('research_engine_v1');
            if (!raw) return;
            this.sessions = new Map(Object.entries(raw.sessions ?? {}));
            this.citationGraphs = new Map(Object.entries(raw.citationGraphs ?? {}));
            this.knowledgeGraphs = new Map(Object.entries(raw.knowledgeGraphs ?? {}));
            this.systematicReviews = new Map(Object.entries(raw.systematicReviews ?? {}));
            this.factCheckReports = new Map(Object.entries(raw.factCheckReports ?? {}));
            this.anomalyReports = new Map(Object.entries(raw.anomalyReports ?? {}));
            this.summarizations = new Map(Object.entries(raw.summarizations ?? {}));
            this.citationExports = new Map(Object.entries(raw.citationExports ?? {}));
            this.peerReviews = new Map(Object.entries(raw.peerReviews ?? {}));
            this.researchReports = new Map(Object.entries(raw.researchReports ?? {}));
            this._discoveryResult = raw.discoveryResult ?? null;
            LOGGER.info('ResearchEngine', 'State loaded from storage', {
                sessions: this.sessions.size,
            });
        } catch (e) {
            LOGGER.warn('ResearchEngine', 'Failed to load state from storage', { error: e });
        }
    }

    async #persistState(): Promise<void> {
        const state: ResearchEngineState = {
            sessions: Object.fromEntries(this.sessions),
            citationGraphs: Object.fromEntries(this.citationGraphs),
            knowledgeGraphs: Object.fromEntries(this.knowledgeGraphs),
            systematicReviews: Object.fromEntries(this.systematicReviews),
            factCheckReports: Object.fromEntries(this.factCheckReports),
            anomalyReports: Object.fromEntries(this.anomalyReports),
            summarizations: Object.fromEntries(this.summarizations),
            citationExports: Object.fromEntries(this.citationExports),
            peerReviews: Object.fromEntries(this.peerReviews),
            researchReports: Object.fromEntries(this.researchReports),
            discoveryResult: this._discoveryResult,
        };
        try {
            await BucketStorageAdapter.RESEARCH.set('research_engine_v1', state);
        } catch (e) {
            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                LOGGER.warn(
                    'ResearchEngine',
                    'localStorage quota exceeded — pruning old sessions and retrying',
                );
                const sorted = Array.from(this.sessions.entries()).sort(
                    ([, a], [, b]) => b.updatedAt - a.updatedAt,
                );
                const toKeep = new Set(sorted.slice(0, 10).map(([id]) => id));
                for (const id of this.sessions.keys()) {
                    if (!toKeep.has(id)) this.sessions.delete(id);
                }
                this._pruneOrphanedMaps();
                const trimmed: ResearchEngineState = {
                    sessions: Object.fromEntries(this.sessions),
                    citationGraphs: Object.fromEntries(this.citationGraphs),
                    knowledgeGraphs: Object.fromEntries(this.knowledgeGraphs),
                    systematicReviews: Object.fromEntries(this.systematicReviews),
                    factCheckReports: Object.fromEntries(this.factCheckReports),
                    anomalyReports: Object.fromEntries(this.anomalyReports),
                    summarizations: Object.fromEntries(this.summarizations),
                    citationExports: Object.fromEntries(this.citationExports),
                    peerReviews: Object.fromEntries(this.peerReviews),
                    researchReports: Object.fromEntries(this.researchReports),
                    discoveryResult: this._discoveryResult,
                };
                await BucketStorageAdapter.RESEARCH.set('research_engine_v1', trimmed);
                LOGGER.info('ResearchEngine', 'Pruned to 10 sessions after quota exceeded');
            } else {
                throw e;
            }
        }
    }

    getSourceAdapterRegistry() {
        return this.deps.sourceAdapterRegistry;
    }

    updateSourceConfig(config: Partial<SourceAdapterConfig>): void {
        this.deps.sourceAdapterRegistry.updateConfig(config);
    }

    getEnabledSources(): SourceType[] {
        return this.deps.sourceAdapterRegistry.getConfig().enabledSources;
    }

    getSourceStats(): { total: number; enabled: number; byCategory: Record<string, number> } {
        const all = this.deps.sourceAdapterRegistry.getAllAdapters();
        const enabled = this.deps.sourceAdapterRegistry.getEnabledAdapters();
        const byCategory: Record<string, number> = {};
        for (const a of all) {
            byCategory[a.category] = (byCategory[a.category] || 0) + 1;
        }
        return {
            total: all.length,
            enabled: enabled.length,
            byCategory,
        };
    }

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        await this.#ensureLoaded();
        LOGGER.info('ResearchEngine', 'Research Engine initialized', {
            sessions: this.sessions.size,
        });
    }

    async start(): Promise<void> {
        LOGGER.info('ResearchEngine', 'Research Engine started');
    }

    async destroy(): Promise<void> {
        this._abortController.abort();
        this._initialized = false;
        await this.#persistState();
        this.sessions.clear();
        this.citationGraphs.clear();
        this.knowledgeGraphs.clear();
        this.systematicReviews.clear();
        this.factCheckReports.clear();
        this.anomalyReports.clear();
        this.summarizations.clear();
        this.citationExports.clear();
        this.peerReviews.clear();
        this._discoveryResult = null;
        this.researchReports.clear();
    }

    async startSession(title: string, question: string): Promise<string> {
        await this.#ensureLoaded();
        const id = genId_('rs');
        const session: ResearchSession = {
            id,
            title,
            initialQuestion: question,
            loops: [],
            status: 'idle',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        this.sessions.set(id, session);
        trimSessions(this.sessions, MAX_SESSIONS);
        this._pruneOrphanedMaps();
        await this.#persistState();
        this.deps.eventBus.emit(EVENTS.RESEARCH_SESSION_UPDATED, {
            action: 'session_started',
            sessionId: id,
        });
        return id;
    }

    getSession(id: string): ResearchSession | undefined {
        return this.sessions.get(id);
    }

    getAllSessions(): ResearchSession[] {
        return Array.from(this.sessions.values()).sort((a, b) => b.createdAt - a.createdAt);
    }

    async runLoop(sessionId: string, externalSignal?: AbortSignal): Promise<EpistemicLoopResult> {
        await this.#ensureLoaded();
        if (this._abortController.signal.aborted) throw new Error('ResearchEngine destroyed');
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const effectiveSignal = externalSignal ?? this._abortController.signal;

        const questionText = getNextQuestion(session);
        const question = {
            id: genId_('rq'),
            text: questionText,
            parentId:
                session.loops.length > 0
                    ? session.loops[session.loops.length - 1]!.question.id
                    : null,
            depth: session.loops.length,
            timestamp: Date.now(),
        };

        const result: EpistemicLoopResult = {
            question,
            sources: [],
            claims: [],
            synthesis: null,
            status: 'formulating',
            startedAt: Date.now(),
        };

        try {
            if (effectiveSignal.aborted) throw new DOMException('Aborted', 'AbortError');
            result.status = 'searching';
            const sources = await Promise.race([
                searchSourcesAlgo(questionText, this.deps.sourceAdapterRegistry),
                new Promise<ResearchSource[]>((_, reject) =>
                    setTimeout(() => reject(new Error('searchSources timed out')), 30000),
                ),
            ]);
            result.sources = sources;

            if (effectiveSignal.aborted) throw new DOMException('Aborted', 'AbortError');
            result.status = 'extracting';
            const claims = extractClaims(sources, questionText);
            result.claims = claims;

            if (effectiveSignal.aborted) throw new DOMException('Aborted', 'AbortError');
            result.status = 'synthesizing';
            const synthesis = synthesize(claims, questionText);
            result.synthesis = synthesis;

            result.status = 'complete';
            result.completedAt = Date.now();
        } catch (e) {
            result.status = 'error';
            result.error = e instanceof Error ? e.message : String(e);
            result.completedAt = Date.now();
            LOGGER.error('ResearchEngine', 'Loop failed', { sessionId, error: result.error });
        }

        session.loops.push(result);
        session.status = result.status;
        session.updatedAt = Date.now();
        await this.#persistState();
        this.deps.eventBus.emit(EVENTS.RESEARCH_SESSION_UPDATED, {
            action: 'loop_completed',
            sessionId,
        });
        return result;
    }

    async deleteSession(id: string): Promise<void> {
        await this.#ensureLoaded();
        this.sessions.delete(id);
        this.citationGraphs.delete(id);
        this.knowledgeGraphs.delete(id);
        this.systematicReviews.delete(id);
        this.factCheckReports.delete(id);
        this.anomalyReports.delete(id);
        this.summarizations.delete(id);
        this.citationExports.delete(id);
        this.peerReviews.delete(id);
        this.researchReports.delete(id);
        await this.#persistState();
        this.deps.eventBus.emit(EVENTS.RESEARCH_SESSION_UPDATED, {
            action: 'session_deleted',
            sessionId: id,
        });
    }

    async clearHistory(): Promise<void> {
        await this.#ensureLoaded();
        this.sessions.clear();
        this.citationGraphs.clear();
        this.knowledgeGraphs.clear();
        this.systematicReviews.clear();
        this.factCheckReports.clear();
        this.anomalyReports.clear();
        this.summarizations.clear();
        this.citationExports.clear();
        this.peerReviews.clear();
        this.researchReports.clear();
        await this.#persistState();
    }

    async buildCitationGraph(sessionId: string): Promise<CitationGraph> {
        await this.#ensureLoaded();
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const allClaims = session.loops.flatMap((l) => l.claims);
        const allSources = session.loops.flatMap((l) => l.sources);
        const graph = computeCitationGraph(allClaims, allSources);

        this.citationGraphs.set(sessionId, graph);
        await this.#persistState();
        return graph;
    }

    getCitationGraph(sessionId: string): CitationGraph | undefined {
        return this.citationGraphs.get(sessionId);
    }

    async buildKnowledgeGraph(sessionId: string): Promise<KnowledgeGraph> {
        await this.#ensureLoaded();
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const graph = computeKnowledgeGraph(session);

        this.knowledgeGraphs.set(sessionId, graph);
        await this.#persistState();
        return graph;
    }

    getKnowledgeGraph(sessionId: string): KnowledgeGraph | undefined {
        return this.knowledgeGraphs.get(sessionId);
    }

    async runSystematicReview(
        sessionId: string,
        config: SystematicReviewConfig,
    ): Promise<SystematicReview> {
        await this.#ensureLoaded();
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const review = computeSystematicReview(session, config);

        this.systematicReviews.set(sessionId, review);
        await this.#persistState();
        return review;
    }

    getSystematicReview(sessionId: string): SystematicReview | undefined {
        return this.systematicReviews.get(sessionId);
    }

    async runFactCheck(sessionId: string): Promise<FactCheckReport> {
        await this.#ensureLoaded();
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const allClaims = session.loops.flatMap((l) => l.claims);
        const MAX_FACT_CHECK = 100;
        if (allClaims.length > MAX_FACT_CHECK) {
            LOGGER.warn(
                'ResearchEngine',
                `runFactCheck truncated ${allClaims.length} to ${MAX_FACT_CHECK} claims`,
            );
        }

        const data = computeFactCheck(session, MAX_FACT_CHECK);
        const report: FactCheckReport = { ...data, createdAt: Date.now() };

        this.factCheckReports.set(sessionId, report);
        await this.#persistState();
        return report;
    }

    getFactCheckReport(sessionId: string): FactCheckReport | undefined {
        return this.factCheckReports.get(sessionId);
    }

    async detectAnomalies(sessionId: string): Promise<AnomalyReport> {
        await this.#ensureLoaded();
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const report = computeAnomalies(session);

        this.anomalyReports.set(sessionId, report);
        await this.#persistState();
        return report;
    }

    getAnomalyReport(sessionId: string): AnomalyReport | undefined {
        return this.anomalyReports.get(sessionId);
    }

    async generateSummary(
        sessionId: string,
        style: SummaryStyle,
        length: SummaryLength,
    ): Promise<SummarizationResult> {
        await this.#ensureLoaded();
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const data = computeSummary(session, style, length);
        const result: SummarizationResult = {
            id: genId_('sum'),
            sessionId,
            ...data,
            createdAt: Date.now(),
        };

        const existing = this.summarizations.get(sessionId) || [];
        existing.push(result);
        if (existing.length > MAX_SUMMARIES_PER_SESSION)
            existing.splice(0, existing.length - MAX_SUMMARIES_PER_SESSION);
        this.summarizations.set(sessionId, existing);
        await this.#persistState();
        return result;
    }

    getSummaries(sessionId: string): SummarizationResult[] {
        return this.summarizations.get(sessionId) || [];
    }

    async generateCitations(sessionId: string, format: CitationFormat): Promise<CitationExport> {
        await this.#ensureLoaded();
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const export_ = computeCitations(session, format);

        this.citationExports.set(sessionId, export_);
        await this.#persistState();
        return export_;
    }

    getCitationExport(sessionId: string): CitationExport | undefined {
        return this.citationExports.get(sessionId);
    }

    async runPeerReview(sessionId: string): Promise<PeerReview> {
        await this.#ensureLoaded();
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const review = computePeerReview(session);

        this.peerReviews.set(sessionId, review);
        await this.#persistState();
        return review;
    }

    getPeerReview(sessionId: string): PeerReview | undefined {
        return this.peerReviews.get(sessionId);
    }

    async runDiscovery(): Promise<DiscoveryResult> {
        await this.#ensureLoaded();
        const allSessions = Array.from(this.sessions.values());

        const result = computeDiscovery(allSessions);

        this._discoveryResult = result;
        await this.#persistState();
        return result;
    }

    getDiscoveryResult(): DiscoveryResult | undefined {
        return this._discoveryResult || undefined;
    }

    async generateResearchReport(sessionId: string, format: ReportFormat): Promise<ResearchReport> {
        await this.#ensureLoaded();
        const session = this.sessions.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        const allSources = session.loops.flatMap((l) => l.sources);
        const allClaims = session.loops.flatMap((l) => l.claims);

        const summaryStyle: SummaryStyle = format === 'json' ? 'extractive' : 'hybrid';
        const summaryLength: SummaryLength = format === 'json' ? 'brief' : 'detailed';
        const summaryResult = await this.generateSummary(sessionId, summaryStyle, summaryLength);
        let peerReview = this.peerReviews.get(sessionId);
        if (!peerReview) peerReview = await this.runPeerReview(sessionId);

        const citations = await this.generateCitations(sessionId, 'bibtex');
        await this.buildCitationGraph(sessionId);
        await this.buildKnowledgeGraph(sessionId);

        const sections: ResearchReport['sections'] = [
            {
                id: genId_('rsec'),
                title: 'Abstract',
                content: summaryResult.summary.slice(0, 500),
                wordCount: summaryResult.summary.split(/\s+/).length,
            },
            {
                id: genId_('rsec'),
                title: 'Methodology',
                content: `Epistemic loop methodology with ${session.loops.length} iterations. Sources: ${allSources.length} documents across ${new Set(allSources.map((s) => s.category)).size} categories.`,
                wordCount: 50,
            },
            {
                id: genId_('rsec'),
                title: 'Key Findings',
                content: summaryResult.keyPoints.map((kp, i) => `${i + 1}. ${kp}`).join('\n\n'),
                wordCount: summaryResult.keyPoints.length * 15,
            },
            {
                id: genId_('rsec'),
                title: 'Analysis',
                content: `Analyzed ${allClaims.length} claims from ${allSources.length} sources. Fact-check accuracy: ${(this.factCheckReports.get(sessionId)?.overallAccuracy || 0) * 100}%. ${allClaims.filter((c) => c.contradictions.length > 0).length} claims have contradictions.`,
                wordCount: 60,
            },
            {
                id: genId_('rsec'),
                title: 'Limitations',
                content: `Source limitations: ${allSources.length} sources analyzed. ${session.loops.flatMap((l) => l.synthesis?.gaps || []).join('; ') || 'No specific gaps identified.'}`,
                wordCount: 40,
            },
            {
                id: genId_('rsec'),
                title: 'Conclusions',
                content: `Research on "${session.title}" completed with ${session.loops.length} epistemic loops. Peer review score: ${peerReview.scores.overall}/100. Recommendation: ${peerReview.recommendation}.`,
                wordCount: 35,
            },
            {
                id: genId_('rsec'),
                title: 'References',
                content: citations.entries.map((e) => e.bibtex).join('\n\n'),
                wordCount: citations.entries.length * 5,
            },
        ];

        const report: ResearchReport = {
            id: genId_('rr'),
            sessionId,
            title: session.title,
            format,
            status: 'ready',
            sections,
            sources: new Set(allSources.map((s) => s.id)).size,
            tokens: allText(session).split(/\s+/).length,
            citations: citations.entries,
            peerReview,
            createdAt: Date.now(),
            completedAt: Date.now(),
        };

        this.researchReports.set(sessionId, report);
        await this.#persistState();
        return report;
    }

    getResearchReport(sessionId: string): ResearchReport | undefined {
        return this.researchReports.get(sessionId);
    }
}

function genId_(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
