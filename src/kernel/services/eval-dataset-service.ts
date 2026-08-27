import type {
    EvalDataset,
    EvalRun,
    EvalRunResult,
    IEvalDatasetService,
} from '../contracts/eval-dataset';
import type { IProviderAdapter } from '../contracts/provider-adapter';

const STORE_KEY = 'eval_datasets_v2';

let datasetLock: Promise<void> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = datasetLock;
    let release: () => void;
    datasetLock = new Promise<void>((resolve) => {
        release = resolve;
    });
    return prev.then(fn).finally(() => release!());
}

interface DatasetStore {
    version: number;
    datasets: EvalDataset[];
}

async function loadStore(): Promise<DatasetStore> {
    const { storageAdapter } = await import('../instances');
    const raw = storageAdapter.getItem(STORE_KEY);
    if (raw) {
        try {
            const parsed: DatasetStore = JSON.parse(raw);
            return {
                version: typeof parsed.version === 'number' ? parsed.version : 0,
                datasets: Array.isArray(parsed.datasets) ? parsed.datasets : [],
            };
        } catch {
            return { version: 0, datasets: [] };
        }
    }
    return { version: 0, datasets: [] };
}

async function writeStore(store: DatasetStore): Promise<void> {
    const { storageAdapter } = await import('../instances');
    storageAdapter.setItem(STORE_KEY, JSON.stringify(store));
}

async function mutateDatasets(
    mutator: (datasets: EvalDataset[]) => EvalDataset[],
): Promise<EvalDataset[]> {
    const store = await loadStore();
    const datasets = mutator(store.datasets);
    await writeStore({ ...store, version: store.version + 1, datasets });
    return datasets;
}

export class EvalDatasetService implements IEvalDatasetService {
    constructor(
        private adapterRegistry: { getAdapter(provider: string): IProviderAdapter | null },
    ) {}

    async list(): Promise<EvalDataset[]> {
        return withLock(async () => {
            const store = await loadStore();
            return store.datasets;
        });
    }

    async get(id: string): Promise<EvalDataset | undefined> {
        return withLock(async () => {
            const store = await loadStore();
            return store.datasets.find((d) => d.id === id);
        });
    }

    async create(
        dataset: Omit<EvalDataset, 'id' | 'createdAt' | 'updatedAt' | 'runs'>,
    ): Promise<string> {
        return withLock(async () => {
            const id = crypto.randomUUID();
            const now = Date.now();
            const entry = { ...dataset, id, createdAt: now, updatedAt: now, runs: [] };
            await mutateDatasets((datasets) => [...datasets, entry]);
            return id;
        });
    }

    async update(id: string, updates: Partial<EvalDataset>): Promise<void> {
        return withLock(async () => {
            await mutateDatasets((datasets) => {
                const idx = datasets.findIndex((d) => d.id === id);
                if (idx < 0) throw new Error(`Dataset ${id} not found`);
                const updated = [...datasets];
                updated[idx] = { ...updated[idx]!, ...updates, updatedAt: Date.now() };
                return updated;
            });
        });
    }

    async delete(id: string): Promise<void> {
        return withLock(async () => {
            await mutateDatasets((datasets) => datasets.filter((d) => d.id !== id));
        });
    }

    async runEval(datasetId: string, provider: string, model: string): Promise<EvalRun> {
        return withLock(async () => {
            const store = await loadStore();
            const dataset = store.datasets.find((d) => d.id === datasetId);
            if (!dataset) throw new Error(`Dataset ${datasetId} not found`);

            const adapter = this.adapterRegistry.getAdapter(provider);
            if (!adapter) throw new Error(`Provider ${provider} not found`);

            const instances = await import('../instances');
            const keys = instances.keyService?.getKeys() || [];
            const key = keys.find((k: { provider: string }) => k.provider === provider);
            if (!key) throw new Error(`No key for provider ${provider}`);

            const apiKey = typeof key.key === 'string' ? key.key : '';

            const results: EvalRunResult[] = [];
            for (let i = 0; i < dataset.prompts.length; i++) {
                const prompt = dataset.prompts[i]!;
                const start = Date.now();
                try {
                    const response = await adapter.sendMessage(
                        [{ role: 'user', content: prompt.input }],
                        model,
                        apiKey,
                    );
                    const latencyMs = Date.now() - start;
                    const actualOutput =
                        typeof response.content === 'string' ? response.content : '';
                    const tkns = response.tokens;
                    const tokensRecord =
                        tkns && typeof tkns === 'object' ? (tkns as Record<string, number>) : {};
                    const inputTokens = tokensRecord.input || 0;
                    const outputTokens = tokensRecord.output || 0;
                    const score = prompt.expectedOutput
                        ? computeSimilarity(actualOutput, prompt.expectedOutput)
                        : 0;
                    results.push({
                        promptIndex: i,
                        input: prompt.input,
                        expectedOutput: prompt.expectedOutput,
                        actualOutput,
                        latencyMs,
                        tokens: { input: inputTokens, output: outputTokens },
                        cost: 0,
                        passed: score >= 0.7,
                        score,
                    });
                } catch (err) {
                    results.push({
                        promptIndex: i,
                        input: prompt.input,
                        expectedOutput: prompt.expectedOutput,
                        actualOutput: '',
                        latencyMs: Date.now() - start,
                        tokens: { input: 0, output: 0 },
                        cost: 0,
                        passed: false,
                        score: 0,
                        error: String(err),
                    });
                }
            }

            const run: EvalRun = {
                id: crypto.randomUUID(),
                datasetId,
                provider,
                model,
                timestamp: Date.now(),
                results,
                summary: {
                    total: results.length,
                    passed: results.filter((r) => r.passed).length,
                    failed: results.filter((r) => !r.passed).length,
                    avgLatency: results.reduce((s, r) => s + r.latencyMs, 0) / results.length,
                    avgScore: results.reduce((s, r) => s + r.score, 0) / results.length,
                    totalCost: results.reduce((s, r) => s + r.cost, 0),
                },
            };

            await mutateDatasets((datasets) => {
                const idx = datasets.findIndex((d: EvalDataset) => d.id === datasetId);
                if (idx < 0) return datasets;
                const updated = [...datasets];
                const existing = updated[idx]!;
                updated[idx] = { ...existing, runs: [...existing.runs, run] };
                if (updated[idx]!.runs.length > 50) {
                    updated[idx]!.runs = updated[idx]!.runs.slice(-50);
                }
                updated[idx]!.updatedAt = Date.now();
                return updated;
            });

            return run;
        });
    }

    async getRun(datasetId: string, runId: string): Promise<EvalRun | undefined> {
        const dataset = await this.get(datasetId);
        return dataset?.runs.find((r) => r.id === runId);
    }
}

function computeSimilarity(a: string, b: string): number {
    const aWords = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
    const bWords = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
    if (aWords.size === 0 && bWords.size === 0) return 0;
    const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
    const union = new Set([...aWords, ...bWords]);
    return intersection.size / union.size;
}
