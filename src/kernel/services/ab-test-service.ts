import type {
    ABTestRequest,
    ABTestResult,
    ABTestComparison,
    ABTestHistory,
} from '../contracts/ab-test-types';

const STORAGE_KEY = 'ab_test_history';
const MAX_HISTORY = 50;

let nextId = Date.now();
function uid(): string {
    return `ab-${nextId++}-${Math.random().toString(36).slice(2, 8)}`;
}

function jaccardSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
    const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
    if (wordsA.size === 0 && wordsB.size === 0) return 1;
    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);
    return intersection.size / union.size;
}

export async function runABTest(request: ABTestRequest): Promise<ABTestResult> {
    const { adapterRegistry, keyService } = await import('../instances');
    const { pricingService } = await import('../instances');
    const allKeys = keyService.getKeys();

    const runSingle = async (
        provider: string,
        model: string,
    ): Promise<{
        content: string;
        latency: number;
        tokens: number;
        cost: number;
        error?: string;
    }> => {
        const startTime = Date.now();
        try {
            const adapter = adapterRegistry.getAdapter(provider);
            if (!adapter) throw new Error(`Adapter not found: ${provider}`);
            const key = allKeys.find((k) => k.provider === provider);
            if (!key) throw new Error(`No key for ${provider}`);

            const response = await adapter.sendMessage(
                [{ role: 'user', content: request.prompt }],
                model,
                key.key,
                undefined,
                { temperature: request.temperature ?? 0.7 },
            );

            const latency = Date.now() - startTime;
            const tokens = response.tokens ?? 0;
            const cost = pricingService.calculateCost(
                model,
                Math.round(tokens * 0.5),
                Math.round(tokens * 0.5),
            );
            return { content: response.content ?? '', latency, tokens, cost };
        } catch (err) {
            return {
                content: '',
                latency: Date.now() - startTime,
                tokens: 0,
                cost: 0,
                error: String(err),
            };
        }
    };

    const [respA, respB] = await Promise.all([
        runSingle(request.providerA, request.modelA),
        runSingle(request.providerB, request.modelB),
    ]);

    const comparison: ABTestComparison = {
        latencyDiff: respA.latency - respB.latency,
        latencyWinner: respA.error
            ? 'B'
            : respB.error
              ? 'A'
              : respA.latency < respB.latency
                ? 'A'
                : respA.latency > respB.latency
                  ? 'B'
                  : 'tie',
        costDiff: respA.cost - respB.cost,
        costWinner: respA.error
            ? 'B'
            : respB.error
              ? 'A'
              : respA.cost < respB.cost
                ? 'A'
                : respA.cost > respB.cost
                  ? 'B'
                  : 'tie',
        lengthDiff: respA.content.length - respB.content.length,
        lengthWinner: respA.error
            ? 'B'
            : respB.error
              ? 'A'
              : Math.abs(respA.content.length - respB.content.length) < 50
                ? 'tie'
                : respA.content.length > respB.content.length
                  ? 'A'
                  : 'B',
        contentSimilarity:
            respA.content && respB.content ? jaccardSimilarity(respA.content, respB.content) : 0,
    };

    const result: ABTestResult = {
        request,
        responseA: { provider: request.providerA, model: request.modelA, ...respA },
        responseB: { provider: request.providerB, model: request.modelB, ...respB },
        comparison,
        timestamp: Date.now(),
    };

    // Persist
    const { database } = await import('../instances');
    const existing = (await database.getKv<ABTestHistory[]>(STORAGE_KEY)) || [];
    const entry: ABTestHistory = {
        id: uid(),
        timestamp: result.timestamp,
        prompt: request.prompt,
        providerA: request.providerA,
        modelA: request.modelA,
        providerB: request.providerB,
        modelB: request.modelB,
        latencyWinner:
            comparison.latencyWinner === 'A'
                ? request.providerA
                : comparison.latencyWinner === 'B'
                  ? request.providerB
                  : 'tie',
        costWinner:
            comparison.costWinner === 'A'
                ? request.providerA
                : comparison.costWinner === 'B'
                  ? request.providerB
                  : 'tie',
    };
    existing.push(entry);
    await database.setKv(STORAGE_KEY, existing.slice(-MAX_HISTORY));

    return result;
}

export async function getABTestHistory(): Promise<ABTestHistory[]> {
    const { database } = await import('../instances');
    const existing = (await database.getKv<ABTestHistory[]>(STORAGE_KEY)) || [];
    return existing.reverse();
}
