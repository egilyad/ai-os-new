export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
    level: LogLevel;
    message: string;
    service: string;
    timestamp: number;
    seq?: number;
    traceId?: string;
    correlationId?: string;
    latency?: number;
    action?: string;
    error?: unknown;
    meta?: Record<string, unknown>;
}

export interface ILogger {
    debug(service: string, message: string, meta?: Record<string, unknown>): void;
    info(service: string, message: string, meta?: Record<string, unknown>): void;
    warn(service: string, message: string, meta?: Record<string, unknown>): void;
    error(service: string, message: string, meta?: Record<string, unknown>, err?: unknown): void;
    child(service: string): ILogger;
    getBuffer(): ReadonlyArray<LogEntry>;
    query(filter?: Partial<{ service: string; level: LogLevel; traceId: string }>): LogEntry[];
    clear(): void;
    setTraceContext(tc?: ITraceContext): void;
    /** C-107: Export logs as formatted string for download */
    exportLogs(
        format?: 'json' | 'text' | 'csv',
        filter?: Partial<{ service: string; level: LogLevel; traceId: string }>,
    ): string;
}

export interface ITraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    correlationId?: string;
}
