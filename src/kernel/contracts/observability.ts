import type { CanonicalHealthStatus } from './health';

export type { CanonicalHealthStatus } from './health';
export type SystemHealthStatus = CanonicalHealthStatus;

/**
 * Annotate a value with an optional severity level.
 */
export type SeverityLabel = 'info' | 'warning' | 'error' | 'critical';

// ── Observability type definitions (moved from services for contract purity) ──

export interface TimeSeriesPoint {
    timestamp: number;
    value: number;
    label?: string;
}

export interface AggregatedMetrics {
    totalRequests: number;
    totalTokens: number;
    estimatedCost: number;
    avgLatency: number;
    avgTTFT: number;
    avgTPS: number;
    successRate: number;
    errorRate: number;
    activeProviders: number;
    totalProviders: number;
    decisions: number;
    violations: number;
}

export interface ProviderMetricSummary {
    id: string;
    avgLatency: number;
    avgTTFT: number;
    avgTPS: number;
    successCount: number;
    errorCount: number;
    totalTokens: number;
    reliability: number;
    stabilityIndex: number;
    reputationScore: number;
    currentConcurrent: number;
    status: string;
}

export interface MetricsThreshold {
    metric: string;
    warning: number;
    critical: number;
    operator: 'gt' | 'lt';
}

export interface MetricAlert {
    id: string;
    metric: string;
    value: number;
    threshold: number;
    severity: 'warning' | 'critical';
    timestamp: number;
    resolved: boolean;
}

export interface TraceFilter {
    status?: 'running' | 'completed' | 'failed';
    provider?: string;
    model?: string;
    startTime?: number;
    endTime?: number;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface TraceStep {
    id: string;
    nodeId: string;
    label: string;
    status: 'pending' | 'active' | 'done' | 'error';
    timestamp: number;
    duration?: number;
    output?: string;
    metadata?: Record<string, unknown>;
}

export interface TraceDataQuality {
    tokenCount?: {
        source: 'actual' | 'estimated';
        method?: 'provider_usage' | 'character_divisor';
        divisor?: number;
        note?: string;
    };
    retention?: {
        inMemoryLimit: number;
        dbLoadLimit: number;
        policy: 'newest-first';
        evictedOlderEntries?: boolean;
    };
}

export interface ExecutionTrace {
    id: string;
    startTime: number;
    endTime?: number;
    input: string;
    output?: string;
    status: 'running' | 'completed' | 'failed';
    steps: TraceStep[];
    provider?: string;
    model?: string;
    totalTokens?: number;
    estimatedCost?: number;
    dataQuality?: TraceDataQuality;
    isApproximate?: boolean;
    retentionLimited?: boolean;
}

export interface TraceExport {
    version: string;
    exportedAt: number;
    count: number;
    retention?: TraceDataQuality['retention'];
    traces: ExecutionTrace[];
}

export interface TimelineEvent {
    readonly id: string;
    readonly type: TimelineEventType;
    readonly category: TimelineCategory;
    readonly timestamp: number;
    readonly title: string;
    readonly description?: string;
    readonly severity?: 'info' | 'warning' | 'error' | 'critical';
    readonly source?: string;
    readonly metadata?: Record<string, unknown>;
    readonly traceId?: string;
    readonly duration?: number;
}

export type TimelineEventType =
    | 'request_start'
    | 'request_complete'
    | 'request_error'
    | 'provider_switch'
    | 'provider_health_change'
    | 'provider_quota_exceeded'
    | 'provider_error'
    | 'budget_alert'
    | 'cost_spike'
    | 'debate_start'
    | 'debate_consensus'
    | 'cognitive_step'
    | 'tool_execution'
    | 'policy_violation'
    | 'system_event'
    | 'config_change'
    | 'agent_action';

export type TimelineCategory =
    | 'request'
    | 'provider'
    | 'budget'
    | 'debate'
    | 'cognitive'
    | 'tool'
    | 'policy'
    | 'system'
    | 'config'
    | 'agent';

export interface TimelineFilter {
    categories?: TimelineCategory[];
    types?: TimelineEventType[];
    startTime?: number;
    endTime?: number;
    severity?: TimelineEvent['severity'];
    source?: string;
    traceId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface ITimelineContract {
    getEvents(filter?: TimelineFilter): TimelineEvent[];
    getEvent(id: string): TimelineEvent | undefined;
    addEvent(event: Omit<TimelineEvent, 'id'>): TimelineEvent;
    addEvents(events: Array<Omit<TimelineEvent, 'id'>>): TimelineEvent[];
    clearEvents(): void;
    getEventStats(): {
        total: number;
        byCategory: Record<string, number>;
        bySeverity: Record<string, number>;
    };
    getTimeRange(from: number, to: number): TimelineEvent[];
}
