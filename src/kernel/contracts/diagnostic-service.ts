import type { CognitiveIssue, SessionDiagnostic } from './cognitive-intelligence';
import type { CanonicalHealthStatus } from './health';

export type DiagnosticScope = 'system' | 'session' | 'provider';

export interface ProviderDiagnostic {
    readonly provider: string;
    readonly health: CanonicalHealthStatus;
    readonly score: number;
    readonly issues: CognitiveIssue[];
    readonly metrics: {
        readonly avgLatency: number;
        readonly errorRate: number;
        readonly successRate: number;
        readonly totalRequests: number;
    };
    readonly updatedAt: number;
}

export interface SystemDiagnostic {
    readonly health: CanonicalHealthStatus;
    readonly score: number;
    readonly sessionCount: number;
    readonly providerCount: number;
    readonly activeIssueCount: number;
    readonly issues: CognitiveIssue[];
    readonly updatedAt: number;
}

export interface DiagnosticRunRecord {
    readonly id: string;
    readonly scope: DiagnosticScope;
    readonly health: string;
    readonly score: number;
    readonly issueCount: number;
    readonly timestamp: number;
}

export interface IDiagnosticService {
    getSystemDiagnostic(): SystemDiagnostic;
    getSessionDiagnostic(sessionId: string): SessionDiagnostic | undefined;
    getProviderDiagnostic(provider: string): ProviderDiagnostic;
    getSessionIssues(sessionId: string): CognitiveIssue[];
    getProviderIssues(provider: string): CognitiveIssue[];
    getAllActiveIssues(): CognitiveIssue[];
    recordSystemIssue(issue: {
        type: CognitiveIssue['type'];
        severity: CognitiveIssue['severity'];
        message: string;
        details?: string;
    }): void;
    runDiagnostic(scope?: DiagnosticScope): Promise<DiagnosticRunRecord>;
    getDiagnosticHistory(limit?: number): DiagnosticRunRecord[];
    onDiagnosticComplete(cb: (record: DiagnosticRunRecord) => void): () => void;
    destroy(): void;
}
