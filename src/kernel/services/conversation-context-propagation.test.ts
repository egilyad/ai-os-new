/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { ChatExecutionEngine } from './conversation-execution-engine';
import { ConversationOrchestrator } from './conversation-orchestrator';
import { HybridPolicy } from './conversation-hybrid-policy';
import type { ConversationContext, TurnProposal } from '../contracts/conversation/context';
import { eventBus, EVENTS } from '../events/event-bus';

/**
 * Context propagation seam: verify that for a 3-agent sequential scenario,
 * each agent's LLM request carries (a) the shared Topic on every turn,
 * (b) the prior turn(s) as conversation history, and (c) that turn 1 has no
 * history. Drives the REAL ChatExecutionEngine + ConversationOrchestrator
 * + HybridPolicy; only the LLM transport (chatService) is faked to capture
 * the messages[] each agent actually receives.
 */
function makeFakeChatService(captured: any[]) {
    return {
        handleMessage: (req: any) => {
            captured.push(req.messages);
            const agentId = req.options?.metadata?.agentId ?? '?';
            Promise.resolve().then(() =>
                eventBus.emit(EVENTS.MESSAGE_RESPONSE, {
                    id: 'resp-' + agentId,
                    requestId: req.requestId,
                    provider: 'mock',
                    model: 'mock-model',
                    content: 'ANSWER-FROM-' + agentId,
                    latency: 1,
                    status: 'done',
                    tokens: 1,
                }),
            );
        },
        cancelRequest: () => {},
    };
}

describe('Conversation context propagation (3 sequential agents)', () => {
    it('carries topic + prior turns into each prompt; turn 1 has no history', async () => {
        const captured: any[] = [];
        const chatService = makeFakeChatService(captured);
        const engine = new ChatExecutionEngine(chatService as any, eventBus, undefined);
        const context = {
            topic: 'Проектирование архитектуры многоагентной системы',
            participants: [
                { id: 'architect', role: 'Architect' },
                { id: 'critic', role: 'Critic' },
                { id: 'synthesizer', role: 'Synthesizer' },
            ],
            history: [] as Array<{ role: string; content: string }>,
            metadata: {},
        } as ConversationContext;
        const turns: TurnProposal[] = [
            {
                participantId: 'architect',
                objective: {
                    type: 'INTRODUCE',
                    description: 'Предложите архитектуру системы',
                    constraints: [],
                },
            },
            {
                participantId: 'critic',
                objective: {
                    type: 'CRITIQUE',
                    description: 'Раскритикуйте предложенную архитектуру',
                    constraints: [],
                },
            },
            {
                participantId: 'synthesizer',
                objective: {
                    type: 'SYNTHESIZE',
                    description: 'Синтезируйте итоговое решение',
                    constraints: [],
                },
            },
        ];
        const orch = new ConversationOrchestrator(new HybridPolicy(turns), engine, context);
        await orch.processNextStep('s1');
        await orch.processNextStep('s1');
        await orch.processNextStep('s1');

        // Turn 1: topic present, NO history, own objective, no prior answer.
        const t1 = JSON.stringify(captured[0]);
        expect(t1).toContain('Topic: Проектирование архитектуры многоагентной системы');
        expect(t1).not.toContain('Conversation so far:');
        expect(t1).toContain('Предложите архитектуру системы');
        expect(t1).not.toContain('ANSWER-FROM-');

        // Turn 2: sees turn 1 answer, not its own yet.
        const t2 = JSON.stringify(captured[1]);
        expect(t2).toContain('Topic: Проектирование архитектуры многоагентной системы');
        expect(t2).toContain('Conversation so far:');
        expect(t2).toContain('ANSWER-FROM-architect');
        expect(t2).not.toContain('ANSWER-FROM-critic');
        expect(t2).toContain('Раскритикуйте предложенную архитектуру');

        // Turn 3: sees both prior answers.
        const t3 = JSON.stringify(captured[2]);
        expect(t3).toContain('ANSWER-FROM-architect');
        expect(t3).toContain('ANSWER-FROM-critic');
        expect(t3).toContain('Синтезируйте итоговое решение');

        // Shared context.history accumulated in order with prior answers.
        expect(context.history.map((h) => h.role)).toEqual(['architect', 'critic', 'synthesizer']);
        expect(context.history[0]!.content).toBe('ANSWER-FROM-architect');
        expect(context.history[1]!.content).toBe('ANSWER-FROM-critic');
    });
});
