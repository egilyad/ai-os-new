import { describe, it, expect, vi } from 'vitest';
import { DebateEvaluator } from './debate-evaluator';
import type { Claim, ReasoningChain, AgentScore } from '../../contracts/debate-runtime';

function claim(overrides?: Partial<Claim>): Claim {
    return {
        id: 'c1',
        text: 'Standard test claim',
        agentId: 'agent-1',
        speaker: 'agent-1',
        role: 'participant',
        round: 1,
        confidence: 0.7,
        ...overrides,
    };
}

function chain(overrides?: Partial<ReasoningChain>): ReasoningChain {
    return {
        agentId: 'agent-1',
        topic: 'test',
        steps: [],
        coherence: 0.8,
        ...overrides,
    };
}

describe('DebateEvaluator', () => {
    it('scores arguments with basic metrics', () => {
        const eval_ = new DebateEvaluator();
        const score = eval_.scoreArguments('agent-1', [claim()], [chain()]);
        expect(score.agentId).toBe('agent-1');
        expect(score.overall).toBeGreaterThan(0);
        expect(score.argumentQuality).toBeGreaterThan(0);
        expect(score.rebuttalStrength).toBeGreaterThanOrEqual(0);
        expect(score.coherence).toBe(0.8);
        expect(score.persuasiveness).toBeGreaterThan(0);
        expect(score.factuality).toBeGreaterThan(0);
    });

    it('handles empty claims and chain', () => {
        const eval_ = new DebateEvaluator();
        const score = eval_.scoreArguments('agent-1', [], []);
        expect(score.agentId).toBe('agent-1');
        expect(score.overall).toBeGreaterThanOrEqual(0);
        expect(score.argumentQuality).toBe(0);
        expect(score.coherence).toBe(0);
    });

    it('detects rebuttal claims', () => {
        const eval_ = new DebateEvaluator();
        const rebuttalClaim = claim({ text: 'However, this argument is flawed because...' });
        const score = eval_.scoreArguments('agent-1', [rebuttalClaim], [chain()]);
        expect(score.rebuttalStrength).toBeGreaterThan(0);
    });

    it('detects rebuttal claims with but + argument pattern', () => {
        const eval_ = new DebateEvaluator();
        const rebuttalClaim = claim({ text: 'But this argument is wrong and contains a flaw' });
        const score = eval_.scoreArguments('agent-1', [rebuttalClaim], [chain()]);
        expect(score.rebuttalStrength).toBeGreaterThan(0);
    });

    it('uses DPO preference score when sampler is provided', () => {
        const mockSampler = {
            scorePreference: vi.fn().mockReturnValue({
                overall: 0.9,
                relevance: 0.9,
                novelty: 0.5,
                persuasiveness: 0.8,
            }),
            rankByPreference: vi.fn(),
        };
        const eval_ = new DebateEvaluator(mockSampler);
        const score = eval_.scoreArguments('agent-1', [claim()], [chain()]);
        expect(mockSampler.scorePreference).toHaveBeenCalled();
        expect(score.overall).toBeGreaterThanOrEqual(0.3);
    });

    it('falls back to neutral when DPO sampler throws', () => {
        const mockSampler = {
            scorePreference: vi.fn().mockImplementation(() => {
                throw new Error('DPO error');
            }),
            rankByPreference: vi.fn(),
        };
        const eval_ = new DebateEvaluator(mockSampler);
        const score = eval_.scoreArguments('agent-1', [claim()], [chain()]);
        expect(score.overall).toBeGreaterThanOrEqual(0);
    });

    it('scores steelman quality for english patterns', () => {
        const eval_ = new DebateEvaluator();
        const steelmanClaim = claim({
            text: "Let me make sure I understand your strongest argument correctly. You're saying that...",
        });
        const score = eval_.scoreArguments('agent-1', [steelmanClaim], [chain()]);
        expect(score.steelmanQuality).toBeGreaterThan(0);
    });

    it('scores steelman quality for multiple english patterns in same text', () => {
        const eval_ = new DebateEvaluator();
        const steelmanClaim = claim({
            text: "Let me make sure I understand your strongest argument. If I read correctly, you're saying that the policy has benefits.",
        });
        const score = eval_.scoreArguments('agent-1', [steelmanClaim], [chain()]);
        expect(score.steelmanQuality).toBeGreaterThan(0);
    });

    it('returns 0 steelman quality for direct attack with no restatement', () => {
        const eval_ = new DebateEvaluator();
        const attackClaim = claim({ text: 'You are completely wrong about everything' });
        const score = eval_.scoreArguments('agent-1', [attackClaim], [chain()]);
        expect(score.steelmanQuality).toBe(0);
    });

    it('ranks participants by overall score descending', () => {
        const eval_ = new DebateEvaluator();
        const scores: AgentScore[] = [
            {
                agentId: 'a1',
                overall: 0.5,
                argumentQuality: 0.5,
                rebuttalStrength: 0,
                coherence: 0.5,
                persuasiveness: 0.5,
                factuality: 0.5,
                steelmanQuality: 0,
            },
            {
                agentId: 'a2',
                overall: 0.8,
                argumentQuality: 0.8,
                rebuttalStrength: 0,
                coherence: 0.8,
                persuasiveness: 0.8,
                factuality: 0.8,
                steelmanQuality: 0,
            },
        ];
        const ranked = eval_.rankParticipants(scores);
        expect(ranked[0].agentId).toBe('a2');
        expect(ranked[1].agentId).toBe('a1');
    });

    it('favors higher confidence and multiple arguments', () => {
        const eval_ = new DebateEvaluator();
        const lowScore = eval_.scoreArguments(
            'a-low',
            [claim({ id: 'c1', confidence: 0.3 })],
            [chain({ coherence: 0.3 })],
        );
        const highScore = eval_.scoreArguments(
            'a-high',
            [
                claim({ id: 'c2', confidence: 0.9 }),
                claim({ id: 'c3', confidence: 0.85, text: 'However, consider this rebuttal...' }),
            ],
            [chain({ coherence: 0.9 })],
        );
        expect(highScore.overall).toBeGreaterThan(lowScore.overall);
    });
});
