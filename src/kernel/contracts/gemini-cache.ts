export interface CachedContent {
    id: string;
    name: string;
    model: string;
    displayName: string;
    sizeTokens: number;
    createTime: number;
    expireTime: number;
    ttl: string;
    hits: number;
}

export interface FreeTierUsage {
    model: string;
    requestsUsed: number;
    requestsLimit: number;
    tokensUsed: number;
    tokensLimit: number;
    resetsAt: number;
}

export interface IGeminiCacheService {
    create(content: { systemPrompt: string; model: string; ttl?: string }): Promise<CachedContent>;
    list(): CachedContent[];
    get(id: string): CachedContent | null;
    delete(id: string): Promise<void>;
    recordHit(id: string): void;
    getFreeTierUsage(): FreeTierUsage[] | Promise<FreeTierUsage[]>;
    getEstimatedSavings(): { totalSaved: number; cacheHitRate: number };
}
