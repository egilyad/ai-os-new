import { rootLogger } from './logger-service';
import { genId } from '../../utils/gen-id';
const LOGGER = rootLogger.child('ResearchRunService');

export interface ResearchRun {
    id: string;
    module: string;
    parameters: Record<string, unknown>;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: number;
    completedAt?: number;
    findings?: string[];
    summary?: string;
    error?: string;
}

interface ResearchRunServiceDeps {
    database: {
        getKv: <T>(id: string) => Promise<T | null>;
        setKv: <T>(id: string, value: T) => Promise<void>;
    };
}

const STORAGE_KEY = 'research_run_history';

export class ResearchRunService {
    private runs: ResearchRun[] = [];
    private deps: ResearchRunServiceDeps;
    private persistTimer: ReturnType<typeof setTimeout> | null = null;
    private static readonly MAX_RUNS = 200;
    /** 2b F2: flush on tab close so debounced writes aren't lost */
    private _onUnload: (() => void) | null = null;
    private _initialized = false;

    constructor(deps: ResearchRunServiceDeps) {
        this.deps = deps;
    }

    async init() {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const stored = await this.deps.database.getKv<ResearchRun[]>(STORAGE_KEY);
            if (stored) this.runs = stored;
        } catch (e) {
            LOGGER.error('ResearchRunService', 'Failed to load', { error: e });
        }
        if (typeof window !== 'undefined') {
            this._onUnload = () => {
                this._flushPersist();
            };
            window.addEventListener('beforeunload', this._onUnload);
        }
    }

    destroy(): void {
        this._initialized = false;
        this._flushPersist();
        if (this._onUnload && typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', this._onUnload);
            this._onUnload = null;
        }
    }

    startRun(module: string, parameters: Record<string, unknown>): ResearchRun {
        const run: ResearchRun = {
            id: genId(),
            module,
            parameters,
            status: 'running',
            startedAt: Date.now(),
        };
        this.runs.unshift(run);
        if (this.runs.length > ResearchRunService.MAX_RUNS)
            this.runs.length = ResearchRunService.MAX_RUNS;
        void this.persist();
        return run;
    }

    completeRun(id: string, findings: string[], summary: string) {
        const run = this.runs.find((r) => r.id === id);
        if (run) {
            run.status = 'completed';
            run.completedAt = Date.now();
            run.findings = findings;
            run.summary = summary;
            void this.persist();
        }
    }

    failRun(id: string, error: string) {
        const run = this.runs.find((r) => r.id === id);
        if (run) {
            run.status = 'failed';
            run.completedAt = Date.now();
            run.error = error;
            void this.persist();
        }
    }

    getAllRuns(): ResearchRun[] {
        return [...this.runs];
    }

    getRunsByModule(module: string): ResearchRun[] {
        return this.runs.filter((r) => r.module === module);
    }

    getRecentRuns(limit = 10): ResearchRun[] {
        return this.runs.slice(0, limit);
    }

    deleteRun(id: string) {
        this.runs = this.runs.filter((r) => r.id !== id);
        void this.persist();
    }

    clearAll() {
        this.runs = [];
        void this.persist();
    }

    /** Flush pending debounced persist immediately */
    private _flushPersist(): void {
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
            this.deps.database
                .setKv(STORAGE_KEY, this.runs)
                .catch((e) => LOGGER.error('ResearchRunService', 'Flush failed', { error: e }));
        }
    }

    private persist() {
        if (this.persistTimer) clearTimeout(this.persistTimer);
        this.persistTimer = setTimeout(() => {
            this.deps.database
                .setKv(STORAGE_KEY, this.runs)
                .catch((e) => LOGGER.error('ResearchRunService', 'Persist failed', { error: e }));
        }, 1000);
    }
}
