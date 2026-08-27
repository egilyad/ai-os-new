import type { ILifecycle } from './lifecycle';

export interface GeminiEnhancedSearchResult {
    query: string;
    answer: string;
    sources: GeminiResearchSource[];
    confidence: number;
    latency: number;
}

export interface GeminiResearchSource {
    title: string;
    uri: string;
    snippet: string;
    relevanceScore: number;
}

export interface GeminiClaimAnalysis {
    claimId: string;
    claim: string;
    assessment: 'supported' | 'contradicted' | 'unverifiable' | 'partially_supported';
    confidence: number;
    reasoning: string;
    suggestedCorrection?: string;
}

export interface GeminiEnhancedSummary {
    sessionId: string;
    title: string;
    abstract: string;
    keyFindings: string[];
    methodology: string;
    limitations: string[];
    futureWork: string[];
}

export interface GeminiPeerReviewOutput {
    originality: number;
    methodology: number;
    clarity: number;
    significance: number;
    overall: number;
    recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject';
    summary: string;
    comments: Array<{
        section: string;
        type: 'major_issue' | 'minor_issue' | 'question' | 'suggestion' | 'praise';
        severity: 'critical' | 'major' | 'minor' | 'cosmetic';
        comment: string;
    }>;
}

export interface GeminiAnomalyResult {
    anomalies: Array<{
        type: 'contradiction' | 'data_gap' | 'methodology_flaw' | 'source_bias';
        severity: 'critical' | 'warning' | 'info';
        description: string;
        affectedClaims: string[];
        recommendation: string;
    }>;
}

export interface IGeminiResearchService extends ILifecycle {
    readonly isAvailable: boolean;
    enhancedSearch(query: string): Promise<GeminiEnhancedSearchResult>;
    analyzeClaims(sessionId: string): Promise<GeminiClaimAnalysis[]>;
    generateEnhancedSummary(sessionId: string): Promise<GeminiEnhancedSummary>;
    detectAnomalies(sessionId: string): Promise<GeminiAnomalyResult>;
    runEnhancedPeerReview(sessionId: string): Promise<GeminiPeerReviewOutput>;
}
