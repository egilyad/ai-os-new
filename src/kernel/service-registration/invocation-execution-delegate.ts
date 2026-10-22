/**
 * Execution delegate of the Invocation Engine.
 *
 * Kept in its own module (instead of inside the phase file) so it can be unit
 * tested without importing the whole phase composition.
 */
import type { ScenarioRepository } from '../dal/scenario-repository';
import type { ConversationDirectorService } from '../services/conversation-director-service';
import type { DebateSyncManager } from '../services/debate-runtime/debate-sync-manager';
import type {
    AgentRef,
    ExecutionMode,
    ExecutionTarget,
    InvocationContext,
} from '../contracts/invocation';
import type { TurnProposal } from '../contracts/conversation/turn';
import type { DebateParticipant, DebateRole } from '../contracts/debate-types';
import type { IExecutionDelegate } from '../services/invocation/invocation-engine-service';
import { ASSISTANT_AGENT_ID } from '../services/assistant/assistant-agent';

/** The assistant's brain, as much of it as a scheduled run needs. */
export interface ScheduledAssistantBrain {
    ask(input: { text: string }): Promise<{ content: string }>;
}

export interface ScheduledAssistantDiary {
    write(input: {
        kind: 'action';
        text: string;
        evidence?: string;
        outcome?: 'success' | 'failure' | 'partial';
        tags?: string[];
    }): Promise<unknown>;
}

/** Thin handoff: invocation intent → ConversationDirector / Debate session. */
export class InvocationExecutionDelegate implements IExecutionDelegate {
    constructor(
        private repo: ScenarioRepository,
        private director: ConversationDirectorService,
        private debate: DebateSyncManager,
        private assistant?: () => ScheduledAssistantBrain | undefined,
        private assistantDiary?: () => ScheduledAssistantDiary | undefined,
    ) {}

    async start(
        agents: AgentRef[],
        context: InvocationContext,
        mode: ExecutionMode,
        invocationId?: string,
    ): Promise<{ target: ExecutionTarget; completed: Promise<void> }> {
        // A scheduled task addressed to the assistant is not a director
        // scenario: it must run through the assistant's own brain, with its
        // knowledge, actions and permission gate. Otherwise the prompt would
        // reference tools the generic path never gives it.
        const only = agents.length === 1 ? agents[0] : undefined;
        if (mode !== 'debate' && only?.id === ASSISTANT_AGENT_ID) {
            const brain = this.assistant?.();
            if (brain) {
                const prompt = context.ref || 'Scheduled task';
                const completed = (async () => {
                    try {
                        const answer = await brain.ask({ text: prompt });
                        await this.assistantDiary
                            ?.()
                            ?.write({
                                kind: 'action',
                                text: `Scheduled run "${prompt}" → ${(answer.content || '')
                                    .replace(/\s+/g, ' ')
                                    .slice(0, 200)}`,
                                outcome: 'success',
                                tags: ['schedule'],
                            })
                            .catch(() => undefined);
                    } catch (e) {
                        await this.assistantDiary
                            ?.()
                            ?.write({
                                kind: 'action',
                                text: `Scheduled run "${prompt}" failed: ${
                                    e instanceof Error ? e.message : String(e)
                                }`,
                                outcome: 'failure',
                                tags: ['schedule'],
                            })
                            .catch(() => undefined);
                        throw e;
                    }
                })();
                return {
                    target: {
                        kind: 'conversation',
                        ref: `assistant:${invocationId ?? Date.now()}`,
                    },
                    completed,
                };
            }
        }

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
