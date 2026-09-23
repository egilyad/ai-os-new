/**
 * A2aSpecService — P.1 (Google A2A spec shapes, additive).
 *
 * AgentCards (capabilities/streaming/skills), tasks with the full TaskState
 * machine + artifacts (parts), SSE-frame log per task, push-notification
 * config. All in DAL kv (`a2aspec/*`).
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { A2APart, A2ATaskState, IA2aSpecService } from '../../contracts/rivals10';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('A2ASpec');

const TRANSITIONS: Record<A2ATaskState, A2ATaskState[]> = {
    submitted: ['working', 'rejected', 'canceled'],
    working: ['input-required', 'completed', 'failed', 'canceled'],
    'input-required': ['working', 'canceled'],
    completed: [],
    canceled: [],
    failed: ['submitted'],
    rejected: [],
};

interface TaskDoc {
    id: string;
    agentId: string;
    state: A2ATaskState;
    parts: A2APart[];
    artifacts: A2APart[][];
    pushUrl?: string;
    frames: Array<{ event: string; data: unknown; at: number }>;
}

export class A2aSpecService implements IA2aSpecService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('A2ASpec', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async buildCard(input: {
        name: string;
        description?: string;
        capabilities?: string[];
        streaming?: boolean;
        skills?: Array<{ id: string; name: string; description?: string }>;
    }): Promise<string> {
        const id = `a2a-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}`;
        const card = {
            name: input.name,
            description: input.description ?? '',
            capabilities: input.capabilities ?? [],
            streaming: input.streaming ?? false,
            skills: input.skills ?? [],
            protocolVersion: '0.3',
        };
        await this.dal.kv.set(`a2aspec-card/${id}`, card);
        this.events.emit(EVENTS.A2ASPEC_CARD, { agentId: id });
        return id;
    }

    async getCard(agentId: string): Promise<Record<string, unknown> | null> {
        const card = await this.dal.kv.get<Record<string, unknown>>(`a2aspec-card/${agentId}`);
        return card ?? null;
    }

    async submitTask(agentId: string, parts: A2APart[]): Promise<string> {
        const card = await this.getCard(agentId);
        if (!card) throw new Error(`A2A agent not found: ${agentId}`);
        const doc: TaskDoc = {
            id: genId('a2atask'),
            agentId,
            state: 'submitted',
            parts: parts.map((p) => ({ ...p })),
            artifacts: [],
            frames: [{ event: 'submitted', data: {}, at: Date.now() }],
        };
        await this.dal.kv.set(`a2aspec-task/${doc.id}`, doc);
        return doc.id;
    }

    async taskState(taskId: string): Promise<A2ATaskState> {
        const doc = await this.require(taskId);
        return doc.state;
    }

    async transition(taskId: string, to: A2ATaskState): Promise<void> {
        const doc = await this.require(taskId);
        if (!TRANSITIONS[doc.state].includes(to)) {
            throw new Error(`Illegal A2A transition ${doc.state} → ${to}`);
        }
        doc.state = to;
        doc.frames.push({ event: to, data: {}, at: Date.now() });
        if (doc.frames.length > 200) doc.frames.splice(0, doc.frames.length - 200);
        await this.dal.kv.set(`a2aspec-task/${taskId}`, doc);
        this.events.emit(EVENTS.A2ASPEC_TASK, { taskId, state: to });
    }

    async addArtifact(taskId: string, parts: A2APart[]): Promise<void> {
        const doc = await this.require(taskId);
        doc.artifacts.push(parts.map((p) => ({ ...p })));
        doc.frames.push({ event: 'artifact', data: { parts: parts.length }, at: Date.now() });
        await this.dal.kv.set(`a2aspec-task/${taskId}`, doc);
    }

    async streamFrames(taskId: string): Promise<Array<{ event: string; data: unknown }>> {
        const doc = await this.require(taskId);
        return doc.frames.map((f) => ({ event: f.event, data: f.data }));
    }

    async setPush(taskId: string, url: string): Promise<void> {
        const doc = await this.require(taskId);
        if (!/^https?:\/\//i.test(url)) throw new Error('Push URL must be http(s)');
        doc.pushUrl = url;
        await this.dal.kv.set(`a2aspec-task/${taskId}`, doc);
    }

    private async require(id: string): Promise<TaskDoc> {
        const doc = await this.dal.kv.get<TaskDoc>(`a2aspec-task/${id}`);
        if (!doc) throw new Error(`A2A task not found: ${id}`);
        return doc;
    }
}
