import type { ILifecycle } from './lifecycle';

export type ResearchStatus =
    'idle' | 'formulating' | 'searching' | 'extracting' | 'synthesizing' | 'complete' | 'error';
export type SourceCategory = 'web' | 'academic' | 'news' | 'code' | 'document';

export interface ResearchQuestion {
    id: string;
    text: string;
    parentId: string | null;
    depth: number;
    timestamp: number;
}

export type SourceType =
    | 'duckduckgo'
    | 'google_custom_search'
    | 'wikipedia'
    | 'arxiv'
    | 'pubmed'
    | 'pubmed_central'
    | 'semantic_scholar'
    | 'openalex'
    | 'crossref'
    | 'dblp'
    | 'core'
    | 'base'
    | 'science_gov'
    | 'hal'
    | 'openaire'
    | 'biorxiv'
    | 'medrxiv'
    | 'chemrxiv'
    | 'ieee_xplore'
    | 'acm_dl'
    | 'jstor'
    | 'scopus'
    | 'web_of_science'
    | 'ssrn'
    | 'academia_edu'
    | 'researchgate'
    | 'philpapers'
    | 'open_library'
    | 'wolfram_alpha'
    | 'news_api'
    | 'reddit'
    | 'github'
    | 'stack_overflow'
    | 'google_patents';

import { z } from 'zod';

export const ResearchSourceSchema = z.object({
    id: z.string(),
    title: z.string().max(200),
    url: z.string(),
    snippet: z.string().max(500),
    category: z.enum(['web', 'academic', 'news', 'code', 'document']),
    sourceType: z.string(),
    relevanceScore: z.number().min(0).max(1),
    timestamp: z.number(),
    authors: z.array(z.string()).optional(),
    year: z.number().optional(),
    doi: z.string().optional(),
    citationCount: z.number().optional(),
});

export interface ResearchSource {
    id: string;
    title: string;
    url: string;
    snippet: string;
    category: SourceCategory;
    sourceType: SourceType;
    relevanceScore: number;
    timestamp: number;
    authors?: string[];
    year?: number;
    doi?: string;
    citationCount?: number;
}

export interface ResearchClaim {
    id: string;
    text: string;
    sourceId: string;
    confidence: number;
    contradictions: string[];
    timestamp: number;
}

export interface ResearchSynthesis {
    summary: string;
    keyFindings: string[];
    confidence: number;
    gaps: string[];
    newQuestions: string[];
    timestamp: number;
}

export interface EpistemicLoopResult {
    question: ResearchQuestion;
    sources: ResearchSource[];
    claims: ResearchClaim[];
    synthesis: ResearchSynthesis | null;
    status: ResearchStatus;
    error?: string;
    startedAt: number;
    completedAt?: number;
}

export interface ResearchSession {
    id: string;
    title: string;
    initialQuestion: string;
    loops: EpistemicLoopResult[];
    status: ResearchStatus;
    createdAt: number;
    updatedAt: number;
}

// ═══════════════════════════════════════════════════════════
// Phase 6: Citation Graph
// ═══════════════════════════════════════════════════════════

export interface CitationNode {
    id: string;
    title: string;
    authors: string[];
    year: number;
    source: string;
    doi?: string;
    citationsCount: number;
    influenceScore: number;
}

export interface CitationLink {
    source: string;
    target: string;
    weight: number;
}

export interface CitationGraph {
    nodes: CitationNode[];
    links: CitationLink[];
    totalPapers: number;
    totalCitations: number;
    avgInfluence: number;
    hIndex: number;
}

// ═══════════════════════════════════════════════════════════
// Phase 6: Knowledge Graph
// ═══════════════════════════════════════════════════════════

export interface KnowledgeEntity {
    id: string;
    name: string;
    type: 'concept' | 'person' | 'organization' | 'technology' | 'location' | 'event' | 'work';
    aliases: string[];
    mentions: number;
    confidence: number;
}

export interface KnowledgeRelation {
    id: string;
    source: string;
    target: string;
    type:
        | 'is_a'
        | 'part_of'
        | 'related_to'
        | 'contradicts'
        | 'supports'
        | 'causes'
        | 'influences'
        | 'authored_by';
    weight: number;
    evidence: string[];
}

export interface KnowledgeGraph {
    entities: KnowledgeEntity[];
    relations: KnowledgeRelation[];
    density: number;
    clusters: KnowledgeCluster[];
}

export interface KnowledgeCluster {
    id: string;
    label: string;
    entityIds: string[];
    centralConcept: string;
    cohesion: number;
}

// ═══════════════════════════════════════════════════════════
// Phase 4: PRISMA Systematic Review
// ═══════════════════════════════════════════════════════════

export interface PrismaFlow {
    identification: number;
    afterDedup: number;
    dedupRemoved?: number;
    screened: number;
    excludedAtScreening: { reason: string; count: number }[];
    fullTextAssessed: number;
    excludedAtFullText: { reason: string; count: number }[];
    included: number;
}

export interface InclusionCriterion {
    id: string;
    field: string;
    operator: 'contains' | 'equals' | 'gt' | 'lt' | 'regex';
    value: string;
}

export interface ExclusionCriterion {
    id: string;
    field: string;
    operator: 'contains' | 'equals' | 'gt' | 'lt' | 'regex';
    value: string;
}

export interface SystematicReviewConfig {
    inclusionCriteria: InclusionCriterion[];
    exclusionCriteria: ExclusionCriterion[];
    maxSources: number;
}

export interface SystematicReview {
    id: string;
    sessionId: string;
    query: string;
    prismaFlow: PrismaFlow;
    includedSources: ResearchSource[];
    excludedSources: { source: ResearchSource; reason: string }[];
    config: SystematicReviewConfig;
    biasAssessment: BiasAssessment;
    createdAt: number;
}

export interface BiasAssessment {
    selectionBias: 'low' | 'medium' | 'high';
    informationBias: 'low' | 'medium' | 'high';
    publicationBias: 'low' | 'medium' | 'high';
    overall: 'low' | 'medium' | 'high';
    notes: string[];
}

// ═══════════════════════════════════════════════════════════
// Phase 5: Fact-Checking
// ═══════════════════════════════════════════════════════════

export interface FactCheckResult {
    id: string;
    claim: string;
    status: 'supported' | 'contradicted' | 'unverifiable' | 'partially_supported';
    supportingSources: ResearchSource[];
    contradictingSources: ResearchSource[];
    confidence: number;
    explanation: string;
    timestamp: number;
}

export interface FactCheckReport {
    sessionId: string;
    checks: FactCheckResult[];
    overallAccuracy: number;
    verifiedCount: number;
    contradictedCount: number;
    unverifiableCount: number;
    createdAt: number;
}

// ═══════════════════════════════════════════════════════════
// Phase 7: Anomaly Detection
// ═══════════════════════════════════════════════════════════

export type AnomalySeverity = 'info' | 'warning' | 'critical';
export type AnomalyType =
    | 'contradiction'
    | 'outdated_info'
    | 'data_gap'
    | 'methodology_flaw'
    | 'statistical_anomaly'
    | 'source_bias'
    | 'temporal_inconsistency';

export interface ResearchAnomaly {
    id: string;
    type: AnomalyType;
    severity: AnomalySeverity;
    description: string;
    sources: string[];
    affectedClaims: string[];
    recommendation: string;
    timestamp: number;
}

export interface AnomalyReport {
    sessionId: string;
    anomalies: ResearchAnomaly[];
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    createdAt: number;
}

// ═══════════════════════════════════════════════════════════
// Phase 10: Citation Generation
// ═══════════════════════════════════════════════════════════

export type CitationFormat = 'bibtex' | 'apa' | 'mla' | 'chicago';

export interface CitationEntry {
    id: string;
    source: ResearchSource;
    bibtex: string;
    apa: string;
    mla: string;
    chicago: string;
}

export interface CitationExport {
    entries: CitationEntry[];
    format: CitationFormat;
    content: string;
}

// ═══════════════════════════════════════════════════════════
// Phase 11: Peer Review Simulation
// ═══════════════════════════════════════════════════════════

export interface PeerReviewComment {
    id: string;
    reviewerId: string;
    section: string;
    comment: string;
    type: 'major_issue' | 'minor_issue' | 'question' | 'suggestion' | 'praise';
    severity: 'critical' | 'major' | 'minor' | 'cosmetic';
}

export interface PeerReview {
    id: string;
    reportId: string;
    reportTitle: string;
    reviewers: { id: string; name: string; expertise: string }[];
    comments: PeerReviewComment[];
    scores: {
        originality: number;
        methodology: number;
        clarity: number;
        significance: number;
        overall: number;
    };
    recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject';
    summary: string;
    createdAt: number;
}

// ═══════════════════════════════════════════════════════════
// Phase 12: Auto-Discovery
// ═══════════════════════════════════════════════════════════

export interface DiscoveryTopic {
    id: string;
    name: string;
    description: string;
    sourceKeywords: string[];
    frequency: number;
    trend: 'rising' | 'falling' | 'stable' | 'emerging';
    relevanceScore: number;
    relatedTopics: string[];
    lastObserved: number;
}

export interface DiscoveryResult {
    topics: DiscoveryTopic[];
    trends: { topic: string; change: number }[];
    emergingTopics: DiscoveryTopic[];
    recommendations: { topicId: string; reason: string }[];
    analyzedAt: number;
}

// ═══════════════════════════════════════════════════════════
// Phase 8: Multi-Document Summarization
// ═══════════════════════════════════════════════════════════

export type SummaryStyle = 'abstractive' | 'extractive' | 'hybrid';
export type SummaryLength = 'brief' | 'normal' | 'detailed';

export interface SummarizationResult {
    id: string;
    sessionId: string;
    style: SummaryStyle;
    length: SummaryLength;
    summary: string;
    sourceCount: number;
    compressionRatio: number;
    keyPoints: string[];
    createdAt: number;
}

// ═══════════════════════════════════════════════════════════
// Expanded IResearchEngine
// ═══════════════════════════════════════════════════════════

export interface IResearchEngine extends ILifecycle {
    // Core epistemic loop
    startSession(title: string, question: string): Promise<string>;
    getSession(id: string): ResearchSession | undefined;
    getAllSessions(): ResearchSession[];
    runLoop(sessionId: string): Promise<EpistemicLoopResult>;
    deleteSession(id: string): void;
    clearHistory(): void;

    // Phase 6: Citation Graph
    buildCitationGraph(sessionId: string): Promise<CitationGraph>;
    getCitationGraph(sessionId: string): CitationGraph | undefined;

    // Phase 6: Knowledge Graph
    buildKnowledgeGraph(sessionId: string): Promise<KnowledgeGraph>;
    getKnowledgeGraph(sessionId: string): KnowledgeGraph | undefined;

    // Phase 4: Systematic Review (PRISMA)
    runSystematicReview(
        sessionId: string,
        config: SystematicReviewConfig,
    ): Promise<SystematicReview>;
    getSystematicReview(sessionId: string): SystematicReview | undefined;

    // Phase 5: Fact-Checking
    runFactCheck(sessionId: string): Promise<FactCheckReport>;
    getFactCheckReport(sessionId: string): FactCheckReport | undefined;

    // Phase 7: Anomaly Detection
    detectAnomalies(sessionId: string): Promise<AnomalyReport>;
    getAnomalyReport(sessionId: string): AnomalyReport | undefined;

    // Phase 8: Summarization
    generateSummary(
        sessionId: string,
        style: SummaryStyle,
        length: SummaryLength,
    ): Promise<SummarizationResult>;
    getSummaries(sessionId: string): SummarizationResult[];

    // Phase 10: Citation Generation
    generateCitations(sessionId: string, format: CitationFormat): Promise<CitationExport>;
    getCitationExport(sessionId: string): CitationExport | undefined;

    // Phase 11: Peer Review
    runPeerReview(sessionId: string): Promise<PeerReview>;
    getPeerReview(sessionId: string): PeerReview | undefined;

    // Phase 12: Auto-Discovery
    runDiscovery(): Promise<DiscoveryResult>;
    getDiscoveryResult(): DiscoveryResult | undefined;

    // Research Reports (combines all phases)
    generateResearchReport(sessionId: string, format: ReportFormat): Promise<ResearchReport>;
    getResearchReport(sessionId: string): ResearchReport | undefined;
}

// ═══════════════════════════════════════════════════════════
// Research Report
// ═══════════════════════════════════════════════════════════

export type ReportFormat = 'markdown' | 'html' | 'json';
export type ReportStatus = 'draft' | 'generating' | 'ready' | 'error';

export interface ResearchReportSection {
    id: string;
    title: string;
    content: string;
    wordCount: number;
}

export interface ResearchReport {
    id: string;
    sessionId: string;
    title: string;
    format: ReportFormat;
    status: ReportStatus;
    sections: ResearchReportSection[];
    sources: number;
    tokens: number;
    citations: CitationEntry[];
    peerReview?: PeerReview;
    createdAt: number;
    completedAt?: number;
}
