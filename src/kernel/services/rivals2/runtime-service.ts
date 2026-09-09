/**
 * RuntimeService — G.2 (OpenHands-style sandboxed runtime, additive).
 *
 * Action → observation event stream scoped to a SandboxBroker ticket.
 * Built-in micro-agent prompts (coder/browser/researcher). Runs persist as
 * AgentLoop records (kind 'autonomy' is taken — runtime keeps its own log
 * lines inside the loop's `log`, goal prefixed `runtime:`).
 */
import type { IEventBus } from '../../types/interfaces';
import type { RivalRepository } from '../../dal/rival-repository';
import type { ISandboxBrokerService } from '../../contracts/ops';
import type { IRuntimeService } from '../../contracts/rivals2';
import type { AgentLoop } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Runtime');

function now(): number {
    return Date.now();
}

export const MICRO_AGENTS: Record<string, string> = {
    coder: 'You are a senior engineer inside a sandbox. Prefer small, reversible edits. Explain each command before running it.',
    browser: 'You are a web operator. Narrate every navigation. Never submit forms with real credentials.',
    researcher: 'You are a researcher. Record sources for every claim. Prefer primary sources.',
};

const ALLOWED_ACTIONS = ['exec', 'browse', 'read', 'edit', 'note'];

export class RuntimeService implements IRuntimeService {
    constructor(
        private repo: RivalRepository,
        private events: IEventBus,
        private sandbox?: ISandboxBrokerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', { micros: Object.keys(MICRO_AGENTS).length });
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    microPrompt(name: string): string {
        return MICRO_AGENTS[name] ?? `You are ${name}, a sandboxed micro-agent. Be careful and explicit.`;
    }

    async startRun(goal: string, ticketId?: string): Promise<string> {
        if (ticketId && this.sandbox) {
            const ticket = await this.sandbox.get(ticketId);
            if (!ticket) throw new Error(`Sandbox ticket not found: ${ticketId}`);
            if (ticket.status !== 'approved' && ticket.status !== 'running') {
                throw new Error(`Ticket ${ticketId} is ${ticket.status} (needs approved)`);
            }
        }
        const t = now();
        const loop: AgentLoop = {
            id: genId('loop'),
            kind: 'autonomy',
            goal: `runtime: ${goal.slice(0, 300)}`,
            status: 'running',
            iterations: 0,
            maxIterations: 50,
            taskList: [],
            log: [`Runtime started${ticketId ? ` (ticket ${ticketId})` : ''}: ${goal.slice(0, 200)}`],
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putLoop(loop);
        this.events.emit(EVENTS.RUNTIME_STARTED, { runId: loop.id });
        return loop.id;
    }

    async act(runId: string, action: string, args: Record<string, unknown> = {}): Promise<string> {
        const loop = await this.require(runId);
        if (loop.status !== 'running') throw new Error(`Run ${runId} is ${loop.status}`);
        if (!ALLOWED_ACTIONS.includes(action)) {
            throw new Error(`Action ${action} not allowed (exec|browse|read|edit|note)`);
        }
        loop.iterations += 1;
        const summary = `${action} ${JSON.stringify(args).slice(0, 300)}`;
        loop.log.push(`action#${loop.iterations}: ${summary}`);
        loop.updatedAt = now();
        await this.repo.putLoop(loop);
        this.events.emit(EVENTS.RUNTIME_ACTION, { runId, action });
        // Execution itself is delegated: exec/browse go through approved tooling
        // outside this service; here we record intent + return the pending marker
        // the executor resolves into an observation via observe().
        return `pending-observation for ${summary}`;
    }

    async observe(runId: string, observation: string): Promise<void> {
        const loop = await this.require(runId);
        if (loop.status !== 'running') throw new Error(`Run ${runId} is ${loop.status}`);
        loop.log.push(`observation: ${observation.slice(0, 2000)}`);
        if (loop.log.length > 500) loop.log.splice(0, loop.log.length - 500);
        loop.updatedAt = now();
        await this.repo.putLoop(loop);
    }

    async finishRun(runId: string, result: string): Promise<string> {
        const loop = await this.require(runId);
        loop.status = 'completed';
        loop.result = result.slice(0, 4000);
        loop.log.push(`finished: ${loop.result.slice(0, 300)}`);
        loop.updatedAt = now();
        await this.repo.putLoop(loop);
        return loop.result;
    }

    private async require(id: string): Promise<AgentLoop> {
        const loop = await this.repo.getLoop(id);
        if (!loop) throw new Error(`Runtime run not found: ${id}`);
        return loop;
    }
}
