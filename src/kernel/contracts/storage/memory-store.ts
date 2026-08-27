import type { MemoryEntry } from '../../types/memory-types';
export type { MemoryEntry } from '../../types/memory-types';

export interface MemoryStore {
  saveEntry(entry: MemoryEntry): Promise<void>;
  getEntry(id: string): Promise<MemoryEntry | null>;
  queryEntries(options: {
    type?: string;
    before?: number;
    after?: number;
    limit?: number;
    order?: 'asc' | 'desc';
  }): Promise<MemoryEntry[]>;
  deleteEntry(id: string): Promise<void>;
  updateEntry(id: string, updates: Partial<MemoryEntry>): Promise<void>;
  count(): Promise<number>;
  bulkAdd(entries: MemoryEntry[]): Promise<void>;
  clear(): Promise<void>;
  exportAll(): Promise<string>;
  importAll(payload: string): Promise<void>;
  deleteBefore(timestamp: number): Promise<void>;
}
