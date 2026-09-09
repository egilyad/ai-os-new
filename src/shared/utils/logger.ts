import type { ILogger, LogEntry, ITraceContext } from '../../kernel/contracts/logger';

type ConsoleMethod = (message?: unknown, ...optionalParams: unknown[]) => void;

function makeLogger(level: string): ConsoleMethod {
    const method = (console as unknown as Record<string, unknown>)[level];
    return typeof method === 'function' ? method.bind(console) : console.log.bind(console);
}

function formatLog(
    service: string,
    level: string,
    message: string,
    meta?: Record<string, unknown>,
): void {
    const ts = new Date().toISOString();
    const prefix = `[${ts}] ${level.toUpperCase()} [${service}]`;
    const logFn = makeLogger(level);
    if (meta && Object.keys(meta).length > 0) {
        logFn(prefix, message, meta);
    } else {
        logFn(prefix, message);
    }
}

export const FALLBACK_LOGGER: ILogger = {
    debug(service: string, message: string, meta?: Record<string, unknown>): void {
        formatLog(service, 'debug', message, meta);
    },
    info(service: string, message: string, meta?: Record<string, unknown>): void {
        formatLog(service, 'info', message, meta);
    },
    warn(service: string, message: string, meta?: Record<string, unknown>): void {
        formatLog(service, 'warn', message, meta);
    },
    error(service: string, message: string, meta?: Record<string, unknown>): void {
        formatLog(service, 'error', message, meta);
    },
    child(): ILogger {
        return this;
    },
    getBuffer(): ReadonlyArray<LogEntry> {
        return [];
    },
    query(): LogEntry[] {
        return [];
    },
    clear(): void {},
    setTraceContext(_tc?: ITraceContext): void {},
    exportLogs(): string {
        return '';
    },
};
