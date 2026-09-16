/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, test, vi } from 'vitest';
import { ScriptedPolicy } from './conversation-scripted-policy';
import { ConversationOrchestrator } from './conversation-orchestrator';
import type { IExecutionEngine } from '../contracts/conversation/execution';
import type { ConversationContext } from '../contracts/conversation/context';
import type { TurnProposal } from '../contracts/conversation/turn';

test('Scripted vertical slice: controlled scenario of 5 turns', async () => {
    const script: TurnProposal[] = [
        {
            participantId: 'architect',
            objective: { type: 'INTRODUCE', description: 'Introduce design', constraints: [] },
        },
        {
            participantId: 'security',
            objective: { type: 'CRITIQUE', description: 'Critique design', constraints: [] },
        },
        {
            participantId: 'architect',
            objective: { type: 'RESPOND', description: 'Respond to security', constraints: [] },
        },
        {
            participantId: 'economist',
            objective: { type: 'ANALYZE', description: 'Analyze cost', constraints: [] },
        },
        {
            participantId: 'security',
            objective: { type: 'CHALLENGE', description: 'Challenge assumptions', constraints: [] },
        },
    ];

    const policy = new ScriptedPolicy(script as any);
    const engine: IExecutionEngine = {
        execute: vi.fn().mockResolvedValue({ success: true, content: 'ok' }),
    };
    const context: ConversationContext = {
        topic: 'Ashdod Water',
        participants: [
            { id: 'architect', role: 'Architect' },
            { id: 'security', role: 'Security' },
            { id: 'economist', role: 'Economist' },
        ],
        history: [],
        metadata: {},
    };

    const orchestrator = new ConversationOrchestrator(policy, engine, context);

    await orchestrator.processNextStep('sess-1');
    await orchestrator.processNextStep('sess-1');

    orchestrator.pause();
    await orchestrator.processNextStep('sess-1');
    expect(engine.execute).toHaveBeenCalledTimes(2);

    orchestrator.resume();
    await orchestrator.processNextStep('sess-1');
    await orchestrator.processNextStep('sess-1');
    await orchestrator.processNextStep('sess-1');

    expect(engine.execute).toHaveBeenCalledTimes(5);
});
