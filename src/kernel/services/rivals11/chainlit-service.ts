/**
 * ChainlitService — Q.2 (run step tree + elements, additive).
 *
 * Runs own a nested step tree (start/end with outputs), message elements
 * (text/file/image refs), thumbs feedback and a task list. All in DAL kv
 * (`chainlit/*`) — a headless mirror of the Chainlit run model our Fleet
 * panel can render later.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IChainlitService } from '../../contracts/rivals11';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Chainlit');

interface StepDoc {
    id: string;
    name: string;
    parentId?: string;
    output?: string;
    ended: boolean;
}

interface RunDoc {
    id: string;
    title: string;
    steps: StepDoc[];
    elements: Array<{ kind: 'text' | 'file' | 'image'; ref: string }>;
    feedback?: 'up' | 'down';
    tasks: Array<{ name: string; status: 'todo' | 'doing' | 'done' }>;
}

export class ChainlitService implements IChainlitService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Chainlit', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async startRun(title: string): Promise<string> {
        const doc: RunDoc = {
            id: genId('clrun'),
            title: title.slice(0, 160),
            steps: [],
            elements: [],
            tasks: [],
        };
        await this.dal.kv.set(`chainlit/${doc.id}`, doc);
        return doc.id;
    }

    async startStep(runId: string, name: string, parentId?: string): Promise<string> {
        const run = await this.require(runId);
        if (parentId && !run.steps.some((s) => s.id === parentId)) {
            throw new Error(`Parent step not found: ${parentId}`);
        }
        const step: StepDoc = { id: genId('clstep'), name: name.slice(0, 160), parentId, ended: false };
        run.steps.push(step);
        await this.dal.kv.set(`chainlit/${runId}`, run);
        return step.id;
    }

    async endStep(stepId: string, output = ''): Promise<void> {
        const rows = await this.dal.kv.list('chainlit/');
        for (const row of rows) {
            const run = row.value as RunDoc;
            const step = run.steps.find((s) => s.id === stepId);
            if (step) {
                step.output = output.slice(0, 4000);
                step.ended = true;
                await this.dal.kv.set(row.id, run);
                this.events.emit(EVENTS.CHAINLIT_STEP, { stepId, runId: run.id });
                return;
            }
        }
        throw new Error(`Step not found: ${stepId}`);
    }

    async attach(runId: string, kind: 'text' | 'file' | 'image', ref: string): Promise<void> {
        const run = await this.require(runId);
        run.elements.push({ kind, ref: ref.slice(0, 500) });
        await this.dal.kv.set(`chainlit/${runId}`, run);
    }

    async feedback(runId: string, vote: 'up' | 'down'): Promise<void> {
        const run = await this.require(runId);
        run.feedback = vote;
        await this.dal.kv.set(`chainlit/${runId}`, run);
    }

    async tree(runId: string): Promise<string> {
        const run = await this.require(runId);
        const children = new Map<string, StepDoc[]>();
        const roots: StepDoc[] = [];
        for (const s of run.steps) {
            if (s.parentId) {
                const list = children.get(s.parentId) ?? [];
                list.push(s);
                children.set(s.parentId, list);
            } else {
                roots.push(s);
            }
        }
        const lines: string[] = [`run: ${run.title}`];
        const walk = (steps: StepDoc[], depth: number) => {
            for (const s of steps) {
                lines.push(`${'  '.repeat(depth)}- ${s.name}${s.ended ? ` ✓ ${String(s.output ?? '').slice(0, 80)}` : ' …'}`);
                walk(children.get(s.id) ?? [], depth + 1);
            }
        };
        walk(roots, 1);
        if (run.elements.length > 0) {
            lines.push(`elements: ${run.elements.map((e) => `${e.kind}:${e.ref.slice(0, 40)}`).join(', ')}`);
        }
        return lines.join('\n').slice(0, 6000);
    }

    private async require(id: string): Promise<RunDoc> {
        const run = await this.dal.kv.get<RunDoc>(`chainlit/${id}`);
        if (!run) throw new Error(`Chainlit run not found: ${id}`);
        return run;
    }
}
