/**
 * TemporalService — K.2 (durable runs, additive).
 *
 * Each step persists state to DAL kv AFTER it completes, so a crash/reload
 * resumes from the last finished step (`resume()`). Signals land in a per-run
 * inbox consumed at step boundaries. Activities retry with linear backoff
 * (bounded, no real sleeping beyond short waits). Definitions are versioned.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IToolRunnerService } from '../../contracts/parity';
import type { ITemporalService } from '../../contracts/rivals6';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Temporal');

interface DurableStep {
    name: string;
    tool?: string;
    args?: Record<string, unknown>;
    retries?: number;
}

interface DurableRun {
    id: string;
    name: string;
    version: number;
    steps: DurableStep[];
    doneSteps: number;
    state: Record<string, unknown>;
    status: 'running' | 'paused' | 'completed' | 'failed';
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export class TemporalService implements ITemporalService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async startRun(input: {
        name: string;
        steps: DurableStep[];
        version?: number;
    }): Promise<string> {
        if (input.steps.length === 0) throw new Error('Durable run needs steps');
        const run: DurableRun = {
            id: genId('durable'),
            name: input.name.slice(0, 120),
            version: input.version ?? 1,
            steps: input.steps.slice(0, 30).map((s) => ({ ...s, retries: s.retries ?? 2 })),
            doneSteps: 0,
            state: {},
            status: 'running',
        };
        await this.dal.kv.set(`durable/${run.id}`, run);
        await this.drive(run.id);
        return run.id;
    }

    async signal(runId: string, key: string, value: unknown): Promise<void> {
        await this.require(runId);
        const inbox = (await this.dal.kv.get<Record<string, unknown>>(`durable-inbox/${runId}`)) ?? {};
        inbox[key.slice(0, 80)] = value;
        await this.dal.kv.set(`durable-inbox/${runId}`, inbox);
        this.events.emit(EVENTS.TEMPORAL_SIGNAL, { runId, key });
    }

    async queryState(runId: string): Promise<Record<string, unknown>> {
        const run = await this.require(runId);
        return { ...run.state, _status: run.status, _doneSteps: run.doneSteps };
    }

    async resume(runId: string): Promise<string> {
        const run = await this.require(runId);
        if (run.status !== 'paused' && run.status !== 'failed') {
            throw new Error(`Run ${runId} is ${run.status} (nothing to resume)`);
        }
        run.status = 'running';
        await this.dal.kv.set(`durable/${runId}`, run);
        await this.drive(runId);
        const final = await this.require(runId);
        return `resumed → ${final.status} (${final.doneSteps}/${final.steps.length} steps)`;
    }

    private async drive(runId: string): Promise<void> {
        const run = await this.require(runId);
        while (run.doneSteps < run.steps.length) {
            if (run.status !== 'running') break;
            // Consume signals at the boundary.
            const inbox = (await this.dal.kv.get<Record<string, unknown>>(`durable-inbox/${runId}`)) ?? {};
            for (const [k, v] of Object.entries(inbox)) {
                run.state[`signal:${k}`] = v;
            }
            if (Object.keys(inbox).length > 0) {
                await this.dal.kv.set(`durable-inbox/${runId}`, {});
            }
            const step = run.steps[run.doneSteps]!;
            const out = await this.activity(run, step);
            if (out === null) {
                run.status = 'paused';
                await this.dal.kv.set(`durable/${runId}`, run);
                this.events.emit(EVENTS.TEMPORAL_PAUSED, { runId, step: step.name });
                return;
            }
            run.state[`step:${step.name}`] = out;
            run.state['lastOutput'] = out;
            run.doneSteps += 1;
            await this.dal.kv.set(`durable/${runId}`, run);
            this.events.emit(EVENTS.TEMPORAL_STEP, { runId, step: step.name });
        }
        if (run.doneSteps >= run.steps.length) {
            run.status = 'completed';
            await this.dal.kv.set(`durable/${runId}`, run);
        }
    }

    /** Returns output string, or null when the step must pause the run. */
    private async activity(run: DurableRun, step: DurableStep): Promise<string | null> {
        if (!step.tool) return `(step ${step.name}: no tool — checkpointed)`;
        if (!this.tools) return null;
        const attempts = Math.max(0, Math.min(5, step.retries ?? 2)) + 1;
        let lastError = '';
        for (let a = 0; a < attempts; a++) {
            try {
                return await this.tools.callTool('temporal', step.tool, {
                    ...(step.args ?? {}),
                    ...run.state,
                });
            } catch (e) {
                lastError = e instanceof Error ? e.message : String(e);
                LOGGER.warn('activity failed, retrying', { step: step.name, attempt: a + 1 });
                await sleep(Math.min(2000, 200 * (a + 1)));
            }
        }
        run.state[`error:${step.name}`] = lastError;
        return null;
    }

    private async require(id: string): Promise<DurableRun> {
        const run = await this.dal.kv.get<DurableRun>(`durable/${id}`);
        if (!run) throw new Error(`Durable run not found: ${id}`);
        return run;
    }
}
