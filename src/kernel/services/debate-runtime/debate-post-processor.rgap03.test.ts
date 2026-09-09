import { describe, it, expect, vi } from 'vitest';
import { DebatePostProcessor } from './debate-post-processor';
import type { DebateArgument } from '../../contracts/debate-types';

// R-GAP-03 regression: governor feeding must NOT suppress FactCheck bridge (separate Sets)
describe('DebatePostProcessor R-GAP-03', () => {
    it('processGovernorFeeding + processFactCheck on same args — both execute', async () => {
        const checkArgument = vi.fn().mockResolvedValue({ argumentId: 'a1', results: [], overallScore: 0, checkedAt: Date.now() });
        const factCheckService = { checkArgument } as unknown as import('../fact-check-service').FactCheckService;
        const proc = new DebatePostProcessor({ factCheckService });
        const governor = {
            ingestArgument: vi.fn(),
            updateContradictions: vi.fn(),
            computeConvergence: vi.fn(),
            computeNovelty: vi.fn(),
            updateDiversity: vi.fn(),
        } as unknown as import('./debate-governor').DebateGovernor;

        const args: DebateArgument[] = [
            { id: 'a1', agentId: 'agent1', agentName: 'A1', content: 'Study shows X is true with 42% improvement', confidence: 0.8, timestamp: Date.now(), round: 1 },
            { id: 'a2', agentId: 'agent2', agentName: 'A2', content: 'Research by MIT confirms Y', confidence: 0.7, timestamp: Date.now(), round: 1 },
        ];

        // Bridge path order: governor feeding first, then FactCheck (was dead before R-GAP-03)
        proc.processGovernorFeeding(args, governor);
        await proc.processFactCheck(args);

        expect(governor.ingestArgument).toHaveBeenCalledTimes(2);
        expect(checkArgument).toHaveBeenCalledTimes(2);
        expect(checkArgument).toHaveBeenCalledWith(args[0]);
        expect(checkArgument).toHaveBeenCalledWith(args[1]);
    });

    it('second processFactCheck on same ids is deduped (FactCheck Set)', async () => {
        const checkArgument = vi.fn().mockResolvedValue(null);
        const factCheckService = { checkArgument } as unknown as import('../fact-check-service').FactCheckService;
        const proc = new DebatePostProcessor({ factCheckService });
        const args: DebateArgument[] = [
            { id: 'a1', agentId: 'agent1', agentName: 'A1', content: 'Claim', confidence: 0.8, timestamp: Date.now(), round: 1 },
        ];
        await proc.processFactCheck(args);
        await proc.processFactCheck(args);
        expect(checkArgument).toHaveBeenCalledTimes(1);
    });
});
