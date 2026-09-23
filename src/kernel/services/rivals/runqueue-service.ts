/**
 * RunQueueService — F.3 (SuperAGI-style run queue + toolkits, additive).
 *
 * Enqueued crew/graph runs processed with a concurrency cap (waves of N).
 * Toolkits are named tool-prefix packs gating ToolRunner calls by prefix.
 */
import type { IEventBus } from '../../types/interfaces';
import type { RivalRepository } from '../../dal/rival-repository';
import type { ICrewService } from '../../contracts/crew';
import type { IGraphService } from '../../contracts/graph';
import type { IEvalService } from '../../contracts/frontier';
import type { IRunQueueService } from '../../contracts/rivals';
import type { QueuedRun, Toolkit } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('RunQueue');

function now(): number {
    return Date.now();
}

export interface RunQueueDeps {
    repo: RivalRepository;
    events: IEventBus;
    crews: ICrewService;
    graphs: IGraphService;
    evals?: IEvalService;
}

export class RunQueueService implements IRunQueueService {
    private toolkits = new Map<string, Toolkit>();

    constructor(private deps: RunQueueDeps) {}

    /** J.1 — attach the eval backend for 'eval' queue items. */
    setEvals(evals: IEvalService): void {
        this.deps.evals = evals;
    }

    async init(): Promise<void> {
        LOGGER.info('RunQueue', 'init', {});
    }

    async destroy(): Promise<void> {
        this.toolkits.clear();
    }

    async enqueue(
        kind: QueuedRun['kind'],
        refId: string,
        input: Record<string, unknown> = {},
    ): Promise<QueuedRun> {
        const t = now();
        const item: QueuedRun = {
            id: genId('queue'),
            kind,
            refId,
            input: { ...input },
            status: 'queued',
            createdAt: t,
            updatedAt: t,
        };
        await this.deps.repo.putQueued(item);
        this.deps.events.emit(EVENTS.QUEUE_ENQUEUED, { runId: item.id, kind });
        return item;
    }

    async drain(concurrency = 1): Promise<QueuedRun[]> {
        const cap = Math.max(1, Math.min(4, concurrency));
        const pending = (await this.deps.repo.listQueued()).filter((q) => q.status === 'queued');
        const done: QueuedRun[] = [];
        for (let i = 0; i < pending.length; i += cap) {
            const wave = pending.slice(i, i + cap);
            const results = await Promise.all(wave.map((q) => this.execute(q)));
            done.push(...results);
        }
        return done;
    }

    async list(): Promise<QueuedRun[]> {
        return this.deps.repo.listQueued();
    }

    async defineToolkit(name: string, prefixes: string[]): Promise<Toolkit> {
        const toolkit: Toolkit = { id: genId('toolkit'), name, prefixes: [...prefixes], createdAt: now() };
        this.toolkits.set(toolkit.id, toolkit);
        return toolkit;
    }

    async listToolkits(): Promise<Toolkit[]> {
        return [...this.toolkits.values()];
    }

    async toolkitAllows(toolkitId: string, tool: string): Promise<boolean> {
        const pack = this.toolkits.get(toolkitId);
        if (!pack) throw new Error(`Toolkit not found: ${toolkitId}`);
        return pack.prefixes.some((p) => tool.startsWith(p));
    }

    private async execute(item: QueuedRun): Promise<QueuedRun> {
        item.status = 'running';
        item.updatedAt = now();
        await this.deps.repo.putQueued(item);
        try {
            if (item.kind === 'crew') {
                const res = await this.deps.crews.startCrew(item.refId);
                item.result = `crew ${res.status} (${Object.keys(res.outputs).length} outputs)`;
            } else if (item.kind === 'eval') {
                if (!this.deps.evals) throw new Error('eval backend unavailable');
                const subject =
                    typeof item.input?.['subject'] === 'string' ? (item.input['subject'] as string) : 'queue';
                const res = await this.deps.evals.runBenchmark(item.refId, subject);
                item.result = `eval ${res.total}/${res.maxTotal} (${res.scores.filter((s) => s.passed).length}/${res.scores.length} passed)`;
            } else {
                const res = await this.deps.graphs.runGraph(item.refId, item.input ?? {});
                item.result = `graph ${res.status} (${res.stepCount} steps)`;
            }
            item.status = 'done';
        } catch (e) {
            item.status = 'failed';
            item.result = e instanceof Error ? e.message : String(e);
            LOGGER.warn('RunQueue', 'queued run failed', { runId: item.id, error: item.result });
        }
        item.updatedAt = now();
        await this.deps.repo.putQueued(item);
        return item;
    }
}
