import type { ApiKey, KeyExtendedStats, KeyHistoryEntry } from '../../types/metrics-types';
import { CONFIG } from '../config-registry';
import { z } from 'zod';

export const ImportKeySchema = z.object({
    id: z.string().min(1),
    provider: z.string().min(1),
    key: z.string().min(1),
    label: z.string().min(1),
    isEncrypted: z.boolean().optional(),
    stats: z.record(z.string(), z.unknown()).optional(),
    history: z.array(z.record(z.string(), z.unknown())).optional(),
});

export const VALID_IMPORT_PROVIDERS = [
    'groq',
    'gemini',
    'openrouter',
    'nvidia',
    'openai',
    'anthropic',
    'perplexity',
    'cerebras',
    'cloudflare',
];

export async function computeFingerprint(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function initStats() {
    return {
        successCount: 0,
        errorCount: 0,
        totalTokens: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        extended: initExtendedStats(),
    };
}

export function initExtendedStats(): KeyExtendedStats {
    return {
        reputationScore: 100,
        stabilityForecast: 'stable',
        fingerprint: crypto.randomUUID().slice(0, 6),
        state: 'HEALTHY',
        activeSLA: 'BALANCED',
        stabilityIndex: 1,
        retryImpactScore: 0,
        rateLimitPressure: 0,
        keyAgeScore: 1,
        latencyBreakdown: { ttft: 0, total: 0, tokensPerSec: 0 },
        coldStartLatency: 0,
        warmStartLatency: 0,
        throughputHistory: [],
        errorBreakdown: {
            rateLimit: 0,
            timeout: 0,
            serverError: 0,
            validationError: 0,
            other: 0,
            provider: 0,
        },
        estimatedCost: 0,
        tokenEfficiency: 1,
        quality: {
            score: 1,
            semanticDrift: 0,
            instructionFollowing: 1,
            structureConsistency: 1,
        },
        contextUtilization: 0,
        retentionCurve: [],
        streaming: {},
        userPreferenceScore: 0.5,
        manualSwitches: 0,
        cancellations: 0,
        traces: [],
        fourSignals: { latency: 0, throughput: 0, errorRate: 0, saturation: 0 },
        rules: structuredClone(CONFIG.keys.defaultRules),
        learning: {
            specialization: [],
            performanceByTask: {},
            taskMatrix: {},
            advisorInsights: { recommendedFor: [], avoidFor: [], confidence: 0 },
            lastFiveResults: [],
        },
        currentConcurrentRequests: 0,
        usageToday: { tokens: 0, weightedTokens: 0, requests: 0, estimatedCost: 0 },
        usageMonthly: { tokens: 0, requests: 0, estimatedCost: 0 },
        alerts: [],
        lastUsageDate: new Date().toISOString().slice(0, 10),
        hourlyUsage: new Array(24).fill(0),
    };
}

export function buildImportKeys(
    items: unknown[],
    existingKeys: ApiKey[],
): { newKeys: ApiKey[]; count: number } {
    let count = 0;
    const now = Date.now();
    const newKeys = [...existingKeys];
    for (const item of items) {
        const parsed = ImportKeySchema.safeParse(item);
        if (!parsed.success) continue;
        const { id, provider, key, label, isEncrypted, stats, history } = parsed.data;
        const normalizedProvider = provider.toLowerCase();
        if (!VALID_IMPORT_PROVIDERS.includes(normalizedProvider)) continue;
        const exists = newKeys.some((k) => k.id === id);
        if (!exists) {
            const cappedHistory = (history ?? []).slice(-100) as unknown as KeyHistoryEntry[];
            newKeys.push({
                id,
                provider: normalizedProvider,
                label,
                key,
                isEncrypted: isEncrypted ?? false,
                stats: (stats as ApiKey['stats']) ?? initStats(),
                history: [
                    ...cappedHistory,
                    {
                        id: crypto.randomUUID(),
                        timestamp: now,
                        action: 'added' as const,
                        detail: `Imported key for ${normalizedProvider}`,
                    },
                ],
            } as ApiKey);
            count++;
        }
    }
    return { newKeys, count };
}

export async function buildExportData(
    keys: ApiKey[],
    encryptFn: (plaintext: string) => Promise<string | null>,
): Promise<string> {
    const exportData = await Promise.all(
        keys.map(async (k) => {
            const encryptedKey = await encryptFn(k.key);
            if (encryptedKey === null) {
                throw new Error('Vault locked — cannot export keys in plaintext');
            }
            return {
                id: k.id,
                provider: k.provider,
                group: k.group,
                account: k.account,
                key: encryptedKey ?? k.key,
                label: k.label,
                tags: k.tags,
                status: k.status,
                isEncrypted: !!encryptedKey,
                availableModels: k.availableModels,
                notes: k.notes,
                stats: k.stats,
                history: k.history,
            };
        }),
    );
    return JSON.stringify(exportData, null, 2);
}

export function getStats(keys: ApiKey[]) {
    let active = 0,
        inactive = 0,
        error = 0;
    let totalTokens = 0,
        totalCost = 0;
    const providers = new Set<string>();
    for (const k of keys) {
        if (k.status === 'active') active++;
        else if (k.status === 'inactive') inactive++;
        else if (k.status === 'error') error++;
        totalTokens += k.stats?.totalTokens || 0;
        totalCost += k.stats?.extended?.estimatedCost || 0;
        providers.add(k.provider);
    }
    return {
        total: keys.length,
        active,
        inactive,
        error,
        totalTokens,
        totalCost,
        providers: providers.size,
    };
}

export function ensureExtendedStats(key: ApiKey): void {
    if (!key.stats) key.stats = initStats();
    if (!key.stats.extended) key.stats.extended = initExtendedStats();
    const ext = key.stats.extended!;
    if (!ext.usageToday)
        ext.usageToday = { tokens: 0, weightedTokens: 0, requests: 0, estimatedCost: 0 };
    if (!ext.usageMonthly) ext.usageMonthly = { tokens: 0, requests: 0, estimatedCost: 0 };
    if (!ext.latencyBreakdown) ext.latencyBreakdown = { ttft: 0, total: 0, tokensPerSec: 0 };
    if (!ext.errorBreakdown)
        ext.errorBreakdown = {
            rateLimit: 0,
            timeout: 0,
            serverError: 0,
            validationError: 0,
            other: 0,
            provider: 0,
        };
    if (!ext.fourSignals)
        ext.fourSignals = { latency: 0, throughput: 0, errorRate: 0, saturation: 0 };
    if (!ext.rules) ext.rules = structuredClone(CONFIG.keys.defaultRules);
}

export type RestoreKeyInput = {
    id: string;
    provider: string;
    key?: string;
    model?: string;
    status?: string;
    label?: string;
};

export function buildRestoreKeys(keysData: RestoreKeyInput[]): ApiKey[] {
    return keysData.map((k) => ({
        id: k.id,
        provider: k.provider,
        key: k.key || '',
        model: k.model || '',
        status: (k.status as ApiKey['status']) || 'active',
        label: k.label || k.id,
        stats: {
            successCount: 0,
            errorCount: 0,
            totalTokens: 0,
            avgLatency: 0,
            minLatency: 0,
            maxLatency: 0,
        },
    }));
}
