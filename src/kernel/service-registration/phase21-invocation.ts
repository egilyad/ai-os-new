/**
 * Phase 21 — Invocation Engine.
 *
 * Registers `invocationEngineService`: the dispatch layer that policy-gates
 * agent invocations and hands execution off to existing subsystems
 * (ConversationDirector for chat/director-scenario, Debate for structured
 * dispute). The engine owns the `Invocation` aggregate exclusively (D7);
 * it never runs an agent itself (D5).
 *
 * No new buses/adapters/facades — the execution delegate is a thin handoff
 * over the already-registered `scenarioRepository`, `conversationDirectorService`
 * and `debateService`. Agent resolution reuses `agentService`.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import type { AgentService } from '../services/agent-service';
import type { ScenarioRepository } from '../dal/scenario-repository';
import type { ConversationDirectorService } from '../services/conversation-director-service';
import type { DebateSyncManager } from '../services/debate-runtime/debate-sync-manager';
import type {
    AgentRef,
    ExecutionMode,
    ExecutionTarget,
    InvocationContext,
} from '../contracts/invocation';
import type { IBudgetService } from '../contracts/budget';
import type { TurnProposal } from '../contracts/conversation/turn';
import type { DebateParticipant, DebateRole } from '../contracts/debate-types';
import {
    InvocationEngineService,
    type AgentDirectory,
    type IExecutionDelegate,
} from '../services/invocation/invocation-engine-service';
import { InvocationRepository } from '../services/invocation/invocation-repository';
import { EVENTS } from '../events/event-names';

/** Minimal shape the engine's `AgentDirectory` needs from `agentService`. */
interface AgentDirectorySource {
    getAgents(): Array<{ id: string; name: string; role: string; status?: string }>;
    resolveAgent(id: string): { id: string; specializations?: string[] } | null;
}

/** `AgentDirectory` adapter over the existing `agentService` (adds specializations). */
class AgentResolverDirectory implements AgentDirectory {
    constructor(private src: AgentDirectorySource) {}

    getAgents(): Array<{ id: string; name: string; role: string; specializations?: string[] }> {
        return this.src.getAgents().map((a) => {
            const resolved = this.src.resolveAgent(a.id);
            return {
                id: a.id,
                name: a.name,
                role: a.role,
                specializations: resolved?.specializations,
            };
        });
    }
}

/** Thin handoff: invocation intent → ConversationDirector / Debate session. */
class InvocationExecutionDelegate implements IExecutionDelegate {
    constructor(
        private repo: ScenarioRepository,
        private director: ConversationDirectorService,
        private debate: DebateSyncManager,
    ) {}

    async start(
        agents: AgentRef[],
        context: InvocationContext,
        mode: ExecutionMode,
        invocationId?: string,
    ): Promise<{ target: ExecutionTarget; completed: Promise<void> }> {
        const participants = agents.map((a) => ({ id: a.id, role: a.role ?? a.id }));

        if (mode === 'debate') {
            const owner = `invocation:${invocationId ?? agents.map((a) => a.id).join(',')}`;
            const session = await this.debate.startDebate(
                context.ref || 'Invocation-triggered debate',
                agents.map<DebateParticipant>((a) => ({
                    id: a.id,
                    name: a.id,
                    role: 'neutral' as DebateRole,
                })),
                'round_robin',
                5,
                undefined,
                undefined,
                owner,
            );
            // B-16: await the real end of the debate run (not just startDebate's
            // return) so the Invocation lifecycle `executing -> done` is genuine.
            const completed = this.debate.getRunCompletion(session.id) ?? Promise.resolve();
            return { target: { kind: 'debate', ref: session.id }, completed };
        }

        // chat / director-scenario → ConversationDirector scenario (ConversationCore).
        const topic = context.ref || 'Invocation-triggered conversation';
        const turns: TurnProposal[] = agents.map((a) => ({
            participantId: a.id,
            objective: {
                type: 'INTRODUCE',
                description: `Participate in ${topic}`,
                constraints: [],
            },
        }));
        const scenario = await this.repo.create({
            name: `Invocation · ${mode}`,
            description: `Auto-created by Invocation Engine (context ${context.type}:${context.ref}).`,
            topic,
            participants,
            turns,
        });
        await this.director.loadScenario(scenario.id, invocationId);
        // Fire the run without awaiting here; the engine awaits `completed`
        // (the same promise) so executing is genuinely in-flight (B-17).
        const completed = this.director.run();
        return { target: { kind: 'conversation', ref: scenario.id }, completed };
    }
}

/**
 * Default production/dev policy for *manual* Room invocations.
 *
 * It matches on `source: 'human-mention'` ONLY — it does NOT constrain the
 * agent. Per `InvocationEngineService` (D7), `matches()` never compares
 * `policy.actions.target` to the request, and `invoke()` resolves agents from
 * `req.target` (the agent the human picked in RoomPanel). So this policy gates
 * the *type* of call (a human manually invoking from Room) and lets the human
 * choose any registered agent. Non-registered ids are still rejected later by
 * `resolveAgents` (which only yields ids present in the agent directory).
 *
 * `actions.target` is a placeholder — it is intentionally unused for resolution.
 */
const DEFAULT_ROOM_POLICY_NAME = 'Manual Room Chat (human-selected agent)';

async function seedDefaultRoomPolicy(svc: InvocationEngineService): Promise<void> {
    try {
        const existing = await svc.listPolicies();
        if (existing.some((p) => p.name === DEFAULT_ROOM_POLICY_NAME)) return;
        await svc.createPolicy({
            name: DEFAULT_ROOM_POLICY_NAME,
            enabled: true,
            createdBy: 'system',
            match: { source: 'human-mention' },
            actions: { target: { agentId: '__human_selected__' }, mode: 'chat' },
            allowAgentInitiatedInvocation: false,
            priority: 0,
        });
    } catch {
        // Non-fatal: a manual invocation is simply rejected until a policy exists.
        // (Best-effort so lazy service construction never throws.)
    }
}

const DEFAULT_SCHEDULE_POLICY_NAME = 'Scheduled Tasks (system-triggered)';

async function seedDefaultSchedulePolicy(svc: InvocationEngineService): Promise<void> {
    try {
        const existing = await svc.listPolicies();
        if (existing.some((p) => p.name === DEFAULT_SCHEDULE_POLICY_NAME)) return;
        await svc.createPolicy({
            name: DEFAULT_SCHEDULE_POLICY_NAME,
            enabled: true,
            createdBy: 'system',
            match: { source: 'schedule' },
            actions: { target: { agentId: '__scheduled__' }, mode: 'chat' },
            allowAgentInitiatedInvocation: false,
            priority: 0,
        });
    } catch {
        // Non-fatal: a scheduled invocation is simply rejected until a policy exists.
    }
}

/**
 * Q1 — Scheduler → Invocation bridge.
 *
 * The SchedulerService emits `SCHEDULE_TRIGGERED` (scheduler-service.ts:300) but
 * nothing consumed it. This subscriber turns each fired schedule into a real
 * invocation: a registered `agentId` is dispatched via the Invocation Engine
 * (policy-gated, budget-gated) to run `taskParams.prompt` as a chat turn. The
 * scheduler stays decoupled — it only emits an event; the invocation phase owns
 * the dispatch. Best-effort: a malformed payload or rejected invocation never
 * breaks the scheduler.
 */
function bridgeSchedulerToInvocation(svc: InvocationEngineService, eventBus: IEventBus): void {
    eventBus.on(EVENTS.SCHEDULE_TRIGGERED, (data: unknown) => {
        try {
            const d = data as {
                scheduleId?: string;
                agentId?: string;
                taskParams?: { prompt?: string };
                timestamp?: number;
            };
            if (!d?.agentId) return;
            void svc.invoke({
                source: 'schedule',
                caller: { kind: 'schedule', id: d.scheduleId ?? 'scheduler' },
                target: { agentId: d.agentId },
                reason: d.taskParams?.prompt ?? 'Scheduled task',
                context: { type: 'scheduled', ref: d.scheduleId ?? d.agentId },
                constraints: { mode: 'chat' },
            });
        } catch {
            // best-effort bridge — never break the scheduler on a bad payload
        }
    });
}

export const registerPhase21: Phase = ({ register }) => {
    register('invocationRepository', (c: IContainer) => {
        return new InvocationRepository(c.get<DatabaseService>('database'));
    });

    register('invocationEngineService', (c: IContainer) => {
        const directory = new AgentResolverDirectory(c.get<AgentService>('agentService'));
        const execution = new InvocationExecutionDelegate(
            c.get<ScenarioRepository>('scenarioRepository'),
            c.get<ConversationDirectorService>('conversationDirectorService'),
            c.get<DebateSyncManager>('debateService'),
        );
        const svc = new InvocationEngineService(
            c.get<InvocationRepository>('invocationRepository'),
            c.get<IEventBus>('eventBus'),
            directory,
            execution,
            c.get<IBudgetService>('budgetService'),
        );
        // Seed the default manual-Room policy once, on first resolution.
        void seedDefaultRoomPolicy(svc);
        // Seed the default scheduled-tasks policy + bridge scheduler events in.
        void seedDefaultSchedulePolicy(svc);
        bridgeSchedulerToInvocation(svc, c.get<IEventBus>('eventBus'));
        return svc;
    });
};
