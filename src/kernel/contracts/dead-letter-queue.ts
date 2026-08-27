export interface DeadLetterEntry {
    id: string;
    event: string;
    payload: unknown;
    error: string;
    context?: Record<string, unknown>;
    failedAt: number;
    retryCount: number;
    lastError?: string;
}

export interface IDeadLetterQueue {
    push(entry: Omit<DeadLetterEntry, 'id' | 'failedAt'>): Promise<void>;
    list(): Promise<DeadLetterEntry[]>;
    retry(id: string): Promise<boolean>;
    remove(id: string): Promise<void>;
    clear(): Promise<void>;
    count(): Promise<number>;
}
