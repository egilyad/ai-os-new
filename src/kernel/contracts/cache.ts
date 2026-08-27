import type { Result } from './results';
import type { MemoryError } from './errors';

export interface CacheEntry {
    key: string;
    response: string;
    model: string;
    provider: string;
    promptTokens: number;
    completionTokens: number;
    timestamp: number;
    ttl: number;
    hitCount: number;
}

export interface ICacheService {
    get(
        key: string,
    ): { response: string; model: string; promptTokens: number; completionTokens: number } | null;
    set(
        key: string,
        response: string,
        model: string,
        provider: string,
        promptTokens: number,
        completionTokens: number,
        ttl?: number,
    ): void;
    generateKey(messages: Array<{ role: string; content: string }>, model: string): Promise<string>;
    getStats(): { hits: number; misses: number; size: number; hitRate: number };
    clear(): void;
    invalidate(model?: string): void;
    tryGet?(
        key: string,
    ): Result<
        { response: string; model: string; promptTokens: number; completionTokens: number },
        MemoryError
    >;
    trySet?(
        key: string,
        response: string,
        model: string,
        provider: string,
        promptTokens: number,
        completionTokens: number,
        ttl?: number,
    ): Result<void, MemoryError>;
}
