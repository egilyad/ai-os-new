import type { TWikiLogEntry } from './types';

export interface IWikiLogService {
    append(entry: Omit<TWikiLogEntry, 'id' | 'ts'>): Promise<TWikiLogEntry>;
    list(opts?: { limit?: number; op?: TWikiLogEntry['op'] }): Promise<TWikiLogEntry[]>;
    materializeAsMarkdown(): Promise<string>;
}
