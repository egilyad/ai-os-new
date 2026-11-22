import type {
    IRunHistoryService,
    RunHistoryFailure,
    RunHistoryRecord,
} from '../../contracts/run-history';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('RunHistoryService');
const PREFIX = 'run-history:';
const INDEX_KEY = 'run-history:index';
const MAX_RUNS = 200;
const MAX_STEPS = 200;
const MAX_CONTENT = 2000;

interface RunHistoryDeps {
    database: {
        getKv<T>(id: string): Promise<T | null>;
        setKv<T>(id: string, value: T): Promise<void>;
    };
}

export class RunHistoryService implements IRunHistoryService {
    constructor(private deps: RunHistoryDeps) {}

    async save(record: RunHistoryRecord): Promise<void> {
        const stored: RunHistoryRecord = {
            ...record,
            steps: record.steps.slice(-MAX_STEPS),
            artifacts: record.artifacts.map((a) => ({
                ...a,
                content: a.content.slice(0, MAX_CONTENT),
            })),
        };
        try {
            await this.deps.database.setKv(`${PREFIX}${stored.runId}`, stored);
            const index = (await this.deps.database.getKv<string[]>(INDEX_KEY)) ?? [];
            if (!index.includes(stored.runId)) {
                await this.deps.database.setKv(
                    INDEX_KEY,
                    [...index, stored.runId].slice(-MAX_RUNS),
                );
            }
        } catch (e) {
            LOGGER.error('RunHistoryService', 'Failed to persist run', {
                runId: record.runId,
                error: e,
            });
        }
    }

    async get(runId: string): Promise<RunHistoryRecord | null> {
        try {
            return await this.deps.database.getKv<RunHistoryRecord>(`${PREFIX}${runId}`);
        } catch (e) {
            LOGGER.error('RunHistoryService', 'Failed to read run', { runId, error: e });
            return null;
        }
    }

    async list(): Promise<RunHistoryRecord[]> {
        try {
            const index = (await this.deps.database.getKv<string[]>(INDEX_KEY)) ?? [];
            const records = await Promise.all(index.map((id) => this.get(id)));
            return records
                .filter((r): r is RunHistoryRecord => r !== null)
                .sort((a, b) => b.finishedAt - a.finishedAt);
        } catch (e) {
            LOGGER.error('RunHistoryService', 'Failed to list runs', { error: e });
            return [];
        }
    }

    async listFailures(query?: string): Promise<RunHistoryFailure[]> {
        const needle = query?.trim().toLowerCase() ?? '';
        const records = await this.list();
        const failures: RunHistoryFailure[] = [];
        for (const record of records) {
            for (const step of record.steps) {
                const error = step.output['error'];
                if (typeof error !== 'string' || error.length === 0) continue;
                if (needle && !error.toLowerCase().includes(needle)) continue;
                failures.push({
                    runId: record.runId,
                    nodeId: step.nodeId,
                    error: error.slice(0, MAX_CONTENT),
                    timestamp: step.timestamp,
                });
            }
        }
        return failures.sort((a, b) => b.timestamp - a.timestamp);
    }
}
