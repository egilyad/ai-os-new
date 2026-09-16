import { rootLogger } from './logger-service';
import type { CachedContent, FreeTierUsage, IGeminiCacheService } from '../contracts/gemini-cache';

const LOGGER = rootLogger.child('GeminiCache');

const GEMINI_API_BASE =
    typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.host}/proxy/gemini`
        : 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiCacheService implements IGeminiCacheService {
    private caches: CachedContent[] = [];

    async create(content: {
        systemPrompt: string;
        model: string;
        ttl?: string;
    }): Promise<CachedContent> {
        const now = Date.now();
        const ttlSeconds = parseTTL(content.ttl ?? '1h') / 1000;
        const cached: CachedContent = {
            id: `local-${now}`,
            name: `cache-${content.model}-${now}`,
            model: content.model,
            displayName: `System Prompt — ${content.model}`,
            sizeTokens: Math.ceil(content.systemPrompt.length / 4),
            createTime: now,
            expireTime: now + parseTTL(content.ttl ?? '1h'),
            ttl: content.ttl ?? '1h',
            hits: 0,
        };
        this.caches.push(cached);

        const apiKey = await this.#getApiKey();
        if (apiKey) {
            try {
                const res = await fetch(`${GEMINI_API_BASE}/cachedContents`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey,
                    },
                    body: JSON.stringify({
                        model: `models/${content.model}`,
                        ttl: `${ttlSeconds}s`,
                        contents: [{ role: 'user', parts: [{ text: content.systemPrompt }] }],
                        displayName: cached.displayName,
                    }),
                    signal: AbortSignal.timeout(10000),
                });
                if (res.ok) {
                    const data = (await res.json()) as { name?: string };
                    if (data.name) {
                        cached.id = data.name;
                        cached.name = data.name;
                    }
                } else {
                    res.body?.cancel()?.catch(() => {});
                }
            } catch (e) {
                LOGGER.warn('GeminiCache', 'create failed', { error: String(e) });
            }
        }
        return cached;
    }

    list(): CachedContent[] {
        return [...this.caches];
    }

    async syncFromApi(): Promise<void> {
        const apiKey = await this.#getApiKey();
        if (!apiKey) return;
        try {
            const res = await fetch(`${GEMINI_API_BASE}/cachedContents`, {
                headers: { 'x-goog-api-key': apiKey },
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) {
                res.body?.cancel()?.catch(() => {});
                return;
            }
            const data = (await res.json()) as {
                cachedContents?: Array<{
                    name: string;
                    model: string;
                    displayName?: string;
                    createTime?: string;
                    expireTime?: string;
                    ttl?: string;
                }>;
            };
            if (data.cachedContents) {
                const remote: CachedContent[] = data.cachedContents.map((r) => ({
                    id: r.name,
                    name: r.name,
                    model: r.model.replace('models/', ''),
                    displayName: r.displayName ?? r.name,
                    sizeTokens: 0,
                    createTime: r.createTime ? new Date(r.createTime).getTime() : Date.now(),
                    expireTime: r.expireTime ? new Date(r.expireTime).getTime() : Date.now(),
                    ttl: r.ttl ?? '1h',
                    hits: 0,
                }));
                const remoteIds = new Set(remote.map((r) => r.id));
                this.caches = [...remote, ...this.caches.filter((c) => !remoteIds.has(c.id))];
            }
        } catch (e) {
            LOGGER.warn('GeminiCache', 'syncFromApi failed', { error: String(e) });
        }
    }

    get(id: string): CachedContent | null {
        return this.caches.find((c) => c.id === id) ?? null;
    }

    async delete(id: string): Promise<void> {
        const idx = this.caches.findIndex((c) => c.id === id);
        if (idx !== -1) this.caches.splice(idx, 1);

        if (id.startsWith('cachedContents/')) {
            const apiKey = await this.#getApiKey();
            if (apiKey) {
                try {
                    await fetch(`${GEMINI_API_BASE}/${id}`, {
                        method: 'DELETE',
                        headers: { 'x-goog-api-key': apiKey },
                        signal: AbortSignal.timeout(10000),
                    });
                } catch (e) {
                    LOGGER.warn('GeminiCache', 'delete remote failed', { error: String(e) });
                }
            }
        }
    }

    async getFreeTierUsage(): Promise<FreeTierUsage[]> {
        const apiKey = await this.#getApiKey();
        if (!apiKey) return [];
        try {
            const res = await fetch(`${GEMINI_API_BASE}/v1beta/models?pageSize=50`, {
                headers: { 'X-Goog-Api-Key': apiKey },
                signal: AbortSignal.timeout(10000),
            });
            if (!res.ok) {
                res.body?.cancel()?.catch(() => {});
                return [];
            }
            const data = (await res.json()) as {
                models?: Array<{
                    name: string;
                    description?: string;
                    inputTokenLimit?: number;
                    outputTokenLimit?: number;
                    supportedGenerationMethods?: string[];
                }>;
            };
            if (!data.models) return [];
            return data.models
                .filter(
                    (m) =>
                        m.supportedGenerationMethods?.includes('generateContent') &&
                        m.name.startsWith('models/gemini-'),
                )
                .map((m) => ({
                    model: m.name.replace('models/', ''),
                    requestsUsed: 0,
                    requestsLimit: 1500,
                    tokensUsed: 0,
                    tokensLimit: m.inputTokenLimit ?? 1_000_000,
                    resetsAt: Date.now() + 86_400_000,
                }));
        } catch {
            return [];
        }
    }

    recordHit(id: string): void {
        const cached = this.caches.find((c) => c.id === id);
        if (cached) cached.hits++;
    }

    getEstimatedSavings(): { totalSaved: number; cacheHitRate: number } {
        const totalHits = this.caches.reduce((s, c) => s + c.hits, 0);
        const totalTokens = this.caches.reduce((s, c) => s + c.sizeTokens, 0);
        if (totalHits === 0 || totalTokens === 0) return { totalSaved: 0, cacheHitRate: 0 };
        const cacheHitRate = Math.min(1, totalHits / (totalHits + totalTokens * 0.001));
        const totalSaved = totalTokens * cacheHitRate * 0.00000125;
        return { totalSaved, cacheHitRate };
    }

    async #getApiKey(): Promise<string | null> {
        try {
            const { keyService } = await import('../instances/core-references');
            const key = keyService.selectFromPool('gemini');
            return key?.key ?? null;
        } catch (e) {
            LOGGER.warn('GeminiCache', 'getApiKey failed', { error: String(e) });
            return null;
        }
    }
}

function parseTTL(ttl: string): number {
    const match = ttl.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000;
    const num = parseInt(match[1]!, 10);
    const unit = match[2]!;
    const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return num * (multipliers[unit]! ?? 3600000);
}
