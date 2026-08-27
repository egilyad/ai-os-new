import { expect, test, vi } from 'vitest';
import { ConversationOrchestrator } from './conversation-orchestrator';
import { DebatePolicy } from './debate-runtime/debate-policy';
import { DebateTopologyService } from './debate-runtime/debate-topology';
import type { IExecutionEngine } from '../contracts/conversation/execution';
import type { ConversationContext } from '../contracts/conversation/context';

test('Vertical slice: Policy -> Orchestrator -> Execution', async () => {
    // 1. Setup
    const policy = new DebatePolicy(new DebateTopologyService());

    // Mock Engine
    const engine: IExecutionEngine = {
        execute: vi.fn().mockResolvedValue({ success: true, content: 'Mocked response' }),
    };

    const context: ConversationContext = {
        topic: 'Water',
        participants: [{ id: 'sci', role: 'Scientist' }],
        history: [],
        metadata: {
            topology: {
                type: 'roundtable',
                maxRounds: 1,
                nodes: [{ id: 'sci', label: 'Scientist' }],
                edges: [],
            },
        },
    };

    const orchestrator = new ConversationOrchestrator(policy, engine, context);

    // 2. Action
    await orchestrator.processNextStep('session-1');

    // 3. Assert
    expect(engine.execute).toHaveBeenCalled();
});
