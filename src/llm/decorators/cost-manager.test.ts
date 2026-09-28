import { describe, it, expect, vi } from 'vitest';
import { CostManagerDecorator } from './cost-manager';
import type { ChatMessage, LLMProviderAdapter } from '../core/types';

const MESSAGES = [{ role: 'user', content: 'hi' }] as unknown as ChatMessage[];

const PRICING = { 'test-model': { inputPer1K: 0.01, outputPer1K: 0.03 } };

function makeInner(tokens = 100): LLMProviderAdapter {
    return {
        id: 'test',
        sendMessage: vi.fn(async () => ({ content: 'ok', tokens })),
        checkHealth: vi.fn(async () => ({ status: 'active', latency: 1, models: [] })),
        getAvailableModels: vi.fn(async () => []),
    } as unknown as LLMProviderAdapter;
}

describe('CostManagerDecorator', () => {
    it('records cost and summarizes per model', async () => {
        const inner = makeInner(100);
        const cm = new CostManagerDecorator(inner, { pricing: PRICING, logCosts: false });
        await cm.sendMessage(MESSAGES, 'test-model', 'sk-1');
        const summary = cm.getCosts();
        expect(summary.requestCount).toBe(1);
        expect(summary.totalInputTokens).toBeGreaterThan(0);
        expect(summary.totalCost).toBeGreaterThan(0);
        expect(summary.byModel['test-model']?.requests).toBe(1);
    });

    it('blocks requests after the daily budget is exceeded', async () => {
        const inner = makeInner(100000);
        const cm = new CostManagerDecorator(inner, {
            pricing: PRICING,
            dailyBudget: 0.000001,
            logCosts: false,
        });
        await cm.sendMessage(MESSAGES, 'test-model', 'sk-1');
        await expect(cm.sendMessage(MESSAGES, 'test-model', 'sk-1')).rejects.toThrow(
            /Budget exceeded/,
        );
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(1);
    });

    it('downgrades the model instead of blocking when configured', async () => {
        const inner = makeInner(100000);
        const cm = new CostManagerDecorator(inner, {
            pricing: PRICING,
            dailyBudget: 0.000001,
            onExceeded: 'downgrade',
            downgradeModel: 'cheap-model',
            logCosts: false,
        });
        await cm.sendMessage(MESSAGES, 'test-model', 'sk-1');
        await cm.sendMessage(MESSAGES, 'test-model', 'sk-1');
        const models = vi.mocked(inner.sendMessage).mock.calls.map((c) => c[1]);
        expect(models).toEqual(['test-model', 'cheap-model']);
    });

    it('resetBudget clears the block', async () => {
        const inner = makeInner(100000);
        const cm = new CostManagerDecorator(inner, {
            pricing: PRICING,
            dailyBudget: 0.000001,
            logCosts: false,
        });
        await cm.sendMessage(MESSAGES, 'test-model', 'sk-1');
        await expect(cm.sendMessage(MESSAGES, 'test-model', 'sk-1')).rejects.toThrow(
            /Budget exceeded/,
        );
        cm.resetBudget();
        await cm.sendMessage(MESSAGES, 'test-model', 'sk-1');
        expect(vi.mocked(inner.sendMessage)).toHaveBeenCalledTimes(2);
    });
});
