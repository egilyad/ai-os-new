import { EVENTS } from '../../events/event-names';
import type { ILifecycle } from '../../contracts/lifecycle';
import type {
    IDiagnosticService,
    DiagnosticScope,
    ProviderDiagnostic,
    SystemDiagnostic,
    DiagnosticRunRecord,
} from '../../contracts/diagnostic-service';
import type { CognitiveIssue, SessionDiagnostic } from '../../contracts/cognitive-intelligence';
import type { CanonicalHealthStatus } from '../../contracts/health';

const MAX_DIAGNOSTIC_HISTORY = 200;
const DIAGNOSTIC_INTERVAL_MS = 30000;

export interface DiagnosticServiceDeps {
    eventBus: {
        on: (event: string, cb: (...args: unknown[]) => void) => () => void;
        emit: (event: string, data?: unknown) => void;
    };
    cognitiveIntelligenceService: {
        diagnoseSession: (sessionId: string) => SessionDiagnostic | undefined;
        getActiveIssues: () => CognitiveIssue[];
    };
}

export class DiagnosticService implements ILifecycle, IDiagnosticService {
    private deps: DiagnosticServiceDeps;
    private diagnosticHistory: DiagnosticRunRecord[] = [];
    private systemIssues: CognitiveIssue[] = [];
    private lastSystemDiagnostic: SystemDiagnostic | null = null;
    private providerDiagnostics = new Map<string, ProviderDiagnostic>();
    private sessionDiagnostics = new Map<string, SessionDiagnostic>();
    private listeners: Array<(record: DiagnosticRunRecord) => void> = [];
    private autoInterval: ReturnType<typeof setInterval> | null = null;
    private seq = 0;
    private _initialized = false;

    constructor(deps: DiagnosticServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        this.autoInterval = setInterval(() => {
            this.runDiagnostic('system');
        }, DIAGNOSTIC_INTERVAL_MS);
    }

    async start() {}

    getSystemDiagnostic(): SystemDiagnostic {
        const base = this.lastSystemDiagnostic?.issues?.length
            ? this.lastSystemDiagnostic.issues
            : this.deps.cognitiveIntelligenceService.getActiveIssues();
        const issues = [...base, ...this.systemIssues];
        const criticalCount = issues.filter((i) => i.severity === 'critical').length;
        const highCount = issues.filter((i) => i.severity === 'high').length;

        const health =
            criticalCount > 0
                ? ('critical' as const)
                : highCount > 0
                  ? ('degraded' as const)
                  : ('healthy' as const);
        const score = Math.max(0, Math.min(1, 1 - (criticalCount * 0.3 + highCount * 0.1)));

        const diagnostic: SystemDiagnostic = {
            health,
            score: Math.round(score * 100) / 100,
            sessionCount: this.sessionDiagnostics.size,
            providerCount: this.providerDiagnostics.size,
            activeIssueCount: issues.length,
            issues,
            updatedAt: Date.now(),
        };
        this.lastSystemDiagnostic = diagnostic;
        return diagnostic;
    }

    getSessionDiagnostic(sessionId: string): SessionDiagnostic | undefined {
        const cached = this.sessionDiagnostics.get(sessionId);
        if (cached) return cached;

        const result = this.deps.cognitiveIntelligenceService.diagnoseSession(sessionId);
        if (result) {
            this.sessionDiagnostics.set(sessionId, result);
            if (this.sessionDiagnostics.size > 50) {
                const oldest = this.sessionDiagnostics.keys().next().value;
                if (oldest !== undefined) this.sessionDiagnostics.delete(oldest);
            }
        }
        return result;
    }

    getProviderDiagnostic(provider: string): ProviderDiagnostic {
        const cached = this.providerDiagnostics.get(provider);
        if (cached) return cached;

        const diagnostic: ProviderDiagnostic = {
            provider,
            health: 'unknown',
            score: 0,
            issues: [
                {
                    type: 'agent_failure',
                    severity: 'low',
                    message: 'Provider never diagnosed',
                    timestamp: Date.now(),
                },
            ],
            metrics: { avgLatency: 0, errorRate: 0, successRate: 0, totalRequests: 0 },
            updatedAt: Date.now(),
        };
        this.providerDiagnostics.set(provider, diagnostic);
        return diagnostic;
    }

    getSessionIssues(sessionId: string): CognitiveIssue[] {
        const diag = this.sessionDiagnostics.get(sessionId);
        return diag?.issues || [];
    }

    getProviderIssues(provider: string): CognitiveIssue[] {
        const diag = this.providerDiagnostics.get(provider);
        return diag?.issues || [];
    }

    getAllActiveIssues(): CognitiveIssue[] {
        const cached = this.lastSystemDiagnostic?.issues || [];
        const sessionIssues = Array.from(this.sessionDiagnostics.values()).flatMap((d) => d.issues);
        const providerIssues = Array.from(this.providerDiagnostics.values()).flatMap(
            (d) => d.issues,
        );
        return [...this.systemIssues, ...cached, ...sessionIssues, ...providerIssues];
    }

    recordSystemIssue(issue: {
        type: CognitiveIssue['type'];
        severity: CognitiveIssue['severity'];
        message: string;
        details?: string;
    }): void {
        const entry: CognitiveIssue = {
            type: issue.type,
            severity: issue.severity,
            message: issue.message,
            timestamp: Date.now(),
            details: issue.details,
        };
        this.systemIssues.push(entry);
        if (this.systemIssues.length > 20) this.systemIssues.shift();
    }

    async runDiagnostic(scope: DiagnosticScope = 'system'): Promise<DiagnosticRunRecord> {
        const issues = this.deps.cognitiveIntelligenceService.getActiveIssues();
        const health = issues.some((i) => i.severity === 'critical')
            ? 'critical'
            : issues.some((i) => i.severity === 'high')
              ? 'degraded'
              : 'healthy';
        const score = Math.max(
            0,
            Math.min(1, 1 - issues.filter((i) => i.severity === 'critical').length * 0.3),
        );

        const record: DiagnosticRunRecord = {
            id: `diag_${++this.seq}_${Date.now()}`,
            scope,
            health,
            score: Math.round(score * 100) / 100,
            issueCount: issues.length,
            timestamp: Date.now(),
        };

        this.diagnosticHistory.unshift(record);
        if (this.diagnosticHistory.length > MAX_DIAGNOSTIC_HISTORY) this.diagnosticHistory.pop();

        this.lastSystemDiagnostic = {
            health: health as CanonicalHealthStatus,
            score: Math.round(score * 100) / 100,
            sessionCount: this.sessionDiagnostics.size,
            providerCount: this.providerDiagnostics.size,
            activeIssueCount: issues.length,
            issues,
            updatedAt: Date.now(),
        };

        this.deps.eventBus.emit(EVENTS.DIAGNOSTIC_COMPLETE, record);
        for (const cb of this.listeners) cb(record);
        return record;
    }

    getDiagnosticHistory(limit = 20): DiagnosticRunRecord[] {
        return this.diagnosticHistory.slice(0, limit);
    }

    onDiagnosticComplete(cb: (record: DiagnosticRunRecord) => void): () => void {
        this.listeners.push(cb);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== cb);
        };
    }

    destroy() {
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
        }
        this.diagnosticHistory = [];
        this.sessionDiagnostics.clear();
        this.providerDiagnostics.clear();
        this.lastSystemDiagnostic = null;
        this.listeners = [];
        this._initialized = false;
    }
}
