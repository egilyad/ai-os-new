import { CONFIG } from './config-registry';
import type { ILogger, LogEntry, LogLevel, ITraceContext } from '../contracts/logger';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

type LoggerState = {
    buffer: LogEntry[];
    currentTrace?: ITraceContext;
    seq: number;
};

export interface LoggerPersistenceDeps {
    getKv: <T>(id: string) => Promise<T | null>;
    setKv: <T>(id: string, value: T) => Promise<void>;
}

export class LoggerService implements ILogger {
    private state: LoggerState;
    private readonly maxBuffer = CONFIG?.services?.logger?.maxBuffer ?? 500;
    private minLevel: number;
    private minLevelName: LogLevel;
    private persistDeps?: LoggerPersistenceDeps;
    private persistTimer: ReturnType<typeof setInterval> | null = null;
    private persistDirty = false;

    constructor(_service: string = 'system', minLevel: LogLevel = 'info', state?: LoggerState) {
        this.minLevel = LEVELS[minLevel];
        this.minLevelName = minLevel;
        this.state = state ?? { buffer: [], seq: 0 };
    }

    init(deps?: LoggerPersistenceDeps): void {
        this.persistDeps = deps;
        if (deps) {
            this.restorePersisted();
            this.persistTimer = setInterval(() => this.flushPersist(), 30000);
        }
    }

    destroy(): void {
        if (this.persistTimer) {
            clearInterval(this.persistTimer);
            this.persistTimer = null;
        }
        if (this.persistDeps && this.persistDirty) this.flushPersist();
    }

    private async restorePersisted(): Promise<void> {
        if (!this.persistDeps) return;
        try {
            const saved = await this.persistDeps.getKv<LogEntry[]>('logger:buffer');
            if (saved && Array.isArray(saved)) {
                for (const entry of saved) {
                    this.state.buffer.push(entry);
                    if (this.state.buffer.length > this.maxBuffer) this.state.buffer.shift();
                }
                if (saved.length > 0) {
                    const lastSeq = Math.max(...saved.map((l: LogEntry) => l.seq ?? 0));
                    if (lastSeq > this.state.seq) this.state.seq = lastSeq + 1;
                }
            }
        } catch {
            /* best-effort */
        }
    }

    private flushPersist(): void {
        if (!this.persistDeps || !this.persistDirty) return;
        this.persistDirty = false;
        this.persistDeps
            .setKv('logger:buffer', this.state.buffer.slice(-500))
            .catch((err) => console.error('[LoggerService] Failed to persist log buffer', err));
    }

    setTraceContext(tc?: ITraceContext) {
        this.state.currentTrace = tc;
    }

    setLevel(level: LogLevel): void {
        this.minLevel = LEVELS[level];
        this.minLevelName = level;
    }

    child(service: string): ILogger {
        return new LoggerService(service, this.minLevelName, { buffer: this.state.buffer, seq: 0 });
    }

    debug(service: string, message: string, meta?: Record<string, unknown>): void {
        this.log('debug', service, message, meta);
    }

    info(service: string, message: string, meta?: Record<string, unknown>): void {
        this.log('info', service, message, meta);
    }

    warn(service: string, message: string, meta?: Record<string, unknown>): void {
        this.log('warn', service, message, meta);
    }

    error(service: string, message: string, meta?: Record<string, unknown>, err?: unknown): void {
        this.log('error', service, message, meta, err);
    }

    private log(
        level: LogLevel,
        service: string,
        message: string,
        meta?: Record<string, unknown>,
        err?: unknown,
    ): void {
        if (LEVELS[level] < this.minLevel) return;

        const entry: LogEntry = {
            level,
            message,
            service,
            timestamp: Date.now(),
            seq: this.state.seq++,
            traceId: this.state.currentTrace?.traceId ?? (meta?.traceId as string | undefined),
            correlationId:
                this.state.currentTrace?.correlationId ??
                (meta?.correlationId as string | undefined),
            latency: meta?.latency as number | undefined,
            error: err,
            meta,
        };

        this.state.buffer.push(entry);
        if (this.state.buffer.length > this.maxBuffer) this.state.buffer.shift();
        this.persistDirty = true;

        switch (level) {
            case 'error':
                console.error(formatLog(entry));
                break;
            case 'warn':
                console.warn(formatLog(entry));
                break;
            default:
                console.log(formatLog(entry));
                break;
        }
    }

    getBuffer(): ReadonlyArray<LogEntry> {
        return this.state.buffer.slice();
    }

    query(filter?: Partial<{ service: string; level: LogLevel; traceId: string }>): LogEntry[] {
        let result = this.state.buffer;
        if (filter?.service) result = result.filter((e) => e.service === filter.service);
        if (filter?.level) result = result.filter((e) => e.level === filter.level);
        if (filter?.traceId) result = result.filter((e) => e.traceId === filter.traceId);
        return result;
    }

    clear(): void {
        this.state.buffer.length = 0;
    }

    /** C-107: Export logs as formatted string for download */
    exportLogs(
        format: 'json' | 'text' | 'csv' = 'text',
        filter?: Partial<{ service: string; level: LogLevel; traceId: string }>,
    ): string {
        const entries = filter ? this.query(filter) : this.state.buffer.slice();
        if (entries.length === 0) return '';

        switch (format) {
            case 'json':
                return JSON.stringify(entries, null, 2);
            case 'csv': {
                const header = 'timestamp,level,service,traceId,message';
                const rows = entries.map((e) =>
                    [
                        new Date(e.timestamp).toISOString(),
                        e.level,
                        `"${e.service}"`,
                        e.traceId || '',
                        `"${e.message.replace(/"/g, '""')}"`,
                    ].join(','),
                );
                return [header, ...rows].join('\n');
            }
            case 'text':
            default:
                return entries.map((e) => formatLog(e)).join('\n');
        }
    }
}

function formatLog(entry: LogEntry): string {
    const ts = new Date(entry.timestamp).toISOString().slice(11, 23);
    const trace = entry.traceId ? ` [${entry.traceId.slice(0, 8)}]` : '';
    const extra = entry.action ? ` ${entry.action}` : '';
    let error = '';
    if (entry.error instanceof Error) {
        error = `: ${entry.error.message}`;
    } else if (entry.error) {
        error = `: ${String(entry.error).slice(0, 120)}`;
    }
    const metaStr = formatMeta(entry.meta);
    return `[${ts}] ${entry.level.toUpperCase().padEnd(5)} [${entry.service}]${trace}${extra} ${entry.message}${error}${metaStr}`;
}

function formatMeta(meta?: Record<string, unknown>): string {
    if (!meta) return '';
    const parts: string[] = [];
    for (const [k, v] of Object.entries(meta)) {
        if (v === undefined || v === null) continue;
        let val: string;
        if (v instanceof Error) {
            val = v.message;
        } else if (typeof v === 'string') {
            val = v.length > 200 ? v.slice(0, 200) + '…' : v;
        } else {
            try {
                val = JSON.stringify(v);
                if (val && val.length > 200) val = val.slice(0, 200) + '…';
            } catch {
                val = String(v);
            }
        }
        // Single-line: collapse newlines so the log entry stays one line
        val = val.replace(/\s+/g, ' ');
        parts.push(`${k}=${val}`);
    }
    return parts.length > 0 ? ` {${parts.join(', ')}}` : '';
}

export const rootLogger = new LoggerService(
    'System',
    (CONFIG?.services?.logger?.level as LogLevel) ?? 'info',
);

/**
 * Runtime log level configuration.
 * Call `setLogLevel('debug')` from Settings to change verbosity.
 */
export function setLogLevel(level: LogLevel): void {
    rootLogger.setLevel(level);
}
