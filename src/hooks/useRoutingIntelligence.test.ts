import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { EVENTS } from '../kernel/events/event-names';

const { mockEventBus, mockRouterService, mockSettingsService, emit } = vi.hoisted(() => {
    const handlers = new Map<string, Array<(data: unknown) => void>>();
    const subscribe = (event: string, cb: (data: unknown) => void) => {
        const list = handlers.get(event) ?? [];
        list.push(cb);
        handlers.set(event, list);
        return () => {
            const current = handlers.get(event);
            if (!current) return;
            const i = current.indexOf(cb);
            if (i >= 0) current.splice(i, 1);
        };
    };
    const emit = vi.fn((event: string, data: unknown) => {
        (handlers.get(event) ?? []).forEach((cb) => cb(data));
    });
    const mockRouterService = {
        getDecisionHistory: vi.fn(() => []),
        getRawConfig: vi.fn(() => null),
        getABTest: vi.fn(() => null),
        setFallbackChain: vi.fn(),
        setDowngradeChain: vi.fn(),
        setActiveProfile: vi.fn(async () => {}),
        updateActiveProfileWeights: vi.fn(async () => {}),
        startABTest: vi.fn(async () => true),
        stopABTest: vi.fn(async () => {}),
    };
    const mockSettingsService = {
        getSettings: vi.fn(() => ({ slaMode: 'BALANCED' })),
        updateSettings: vi.fn(() => {}),
    };
    return {
        mockEventBus: { on: subscribe, onSafe: subscribe, emit },
        mockRouterService,
        mockSettingsService,
        emit,
    };
});

vi.mock('../kernel/instances', () => ({
    eventBus: mockEventBus,
    EVENTS,
    routerService: mockRouterService,
    settingsService: mockSettingsService,
}));

import { useRoutingIntelligence } from './useRoutingIntelligence';

const makeConfig = () => ({
    history: { maxDecisions: 50 },
    latency: {},
    activeProfile: 'balanced',
    weightProfiles: {},
    abTest: null,
    classification: {},
    affinity: {},
    priority: {},
    providerByComplexity: {},
    fallbackChains: {
        round_robin: [
            { provider: 'groq', model: 'llama' },
            { provider: 'openrouter', model: 'gpt-4o-mini' },
        ],
    },
    modelDowngradeChains: {},
    slaMode: 'BALANCED',
    fallbackHistory: [],
    penaltyHistory: [],
    penaltySettings: {},
});

const makeDecision = () => ({
    provider: 'groq',
    model: 'llama-3',
    confidence: 0.9,
    reasoning: 'fast',
});

const makeABTest = () => ({
    enabled: true,
    controlProfile: 'a',
    experimentProfile: 'b',
    splitPercent: 50,
    startedAt: 1,
    metrics: {
        control: { requests: 0, totalLatency: 0, successCount: 0, totalScore: 0 },
        experiment: { requests: 0, totalLatency: 0, successCount: 0, totalScore: 0 },
    },
});

describe('useRoutingIntelligence', () => {
    beforeEach(() => {
        emit.mockClear();
        mockRouterService.getDecisionHistory.mockClear();
        mockRouterService.getRawConfig.mockClear();
        mockRouterService.getABTest.mockClear();
        mockRouterService.setFallbackChain.mockClear();
        mockRouterService.setDowngradeChain.mockClear();
        mockRouterService.setActiveProfile.mockClear();
        mockRouterService.updateActiveProfileWeights.mockClear();
        mockRouterService.startABTest.mockClear();
        mockRouterService.stopABTest.mockClear();
        mockSettingsService.getSettings.mockClear();
        mockSettingsService.updateSettings.mockClear();
        mockRouterService.getDecisionHistory.mockImplementation(() => []);
        mockRouterService.getRawConfig.mockImplementation(() => makeConfig() as never);
        mockRouterService.getABTest.mockImplementation(() => null);
        mockSettingsService.getSettings.mockImplementation(() => ({ slaMode: 'BALANCED' }));
        mockRouterService.setActiveProfile.mockImplementation(async () => {});
        mockRouterService.updateActiveProfileWeights.mockImplementation(async () => {});
        mockRouterService.startABTest.mockImplementation(async () => true);
        mockRouterService.stopABTest.mockImplementation(async () => {});
    });

    it('initializes with decisions, config, slaMode and abTest', () => {
        mockRouterService.getDecisionHistory.mockImplementation(() => [makeDecision()] as never);
        mockRouterService.getABTest.mockImplementation(() => makeABTest() as never);
        const { result } = renderHook(() => useRoutingIntelligence());
        expect(result.current.decisions).toHaveLength(1);
        expect(result.current.config?.activeProfile).toBe('balanced');
        expect(result.current.slaMode).toBe('BALANCED');
        expect(result.current.abTest?.enabled).toBe(true);
    });

    it('defaults slaMode to BALANCED when settings have none', () => {
        mockSettingsService.getSettings.mockImplementation(() => ({}) as never);
        const { result } = renderHook(() => useRoutingIntelligence());
        expect(result.current.slaMode).toBe('BALANCED');
    });

    it('refreshes decisions on ROUTER_SIGNAL event', () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        mockRouterService.getDecisionHistory.mockImplementation(() => [makeDecision()] as never);
        act(() => {
            emit(EVENTS.ROUTER_SIGNAL, {});
        });
        expect(result.current.decisions).toHaveLength(1);
    });

    it('refreshes decisions on KEY_UPDATED event', () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        mockRouterService.getDecisionHistory.mockImplementation(() => [makeDecision()] as never);
        act(() => {
            emit(EVENTS.KEY_UPDATED, []);
        });
        expect(result.current.decisions).toHaveLength(1);
    });

    it('unsubscribes on unmount', () => {
        const { unmount } = renderHook(() => useRoutingIntelligence());
        unmount();
        mockRouterService.getDecisionHistory.mockImplementation(() => [makeDecision()] as never);
        act(() => {
            emit(EVENTS.ROUTER_SIGNAL, {});
        });
        expect(mockRouterService.getDecisionHistory).toHaveBeenCalledTimes(1);
    });

    it('setFallbackChain delegates and refreshes config', () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        const chain = [{ provider: 'openai', model: 'gpt-4o' }];
        act(() => {
            result.current.actions.setFallbackChain('round_robin', chain);
        });
        expect(mockRouterService.setFallbackChain).toHaveBeenCalledWith('round_robin', chain);
        expect(mockRouterService.getRawConfig).toHaveBeenCalled();
    });

    it('setDowngradeChain delegates and refreshes config', () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        act(() => {
            result.current.actions.setDowngradeChain('gpt-4o', ['gpt-3.5']);
        });
        expect(mockRouterService.setDowngradeChain).toHaveBeenCalledWith('gpt-4o', ['gpt-3.5']);
    });

    it('updateFallbackLink patches a single link and persists via settings', () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        mockSettingsService.getSettings.mockImplementation(() => ({
            slaMode: 'BALANCED',
            fallbackChains: {
                round_robin: [
                    { provider: 'groq', model: 'llama' },
                    { provider: 'openrouter', model: 'gpt-4o-mini' },
                ],
            },
        }));
        act(() => {
            result.current.actions.updateFallbackLink('round_robin', 0, { model: 'llama-3.1' });
        });
        expect(result.current.config?.fallbackChains.round_robin[0]).toMatchObject({
            provider: 'groq',
            model: 'llama-3.1',
        });
        expect(mockSettingsService.updateSettings).toHaveBeenCalled();
    });

    it('updateFallbackLink is a no-op when config is null', () => {
        mockRouterService.getRawConfig.mockImplementation(() => null);
        const { result } = renderHook(() => useRoutingIntelligence());
        act(() => {
            result.current.actions.updateFallbackLink('round_robin', 0, { model: 'x' });
        });
        expect(mockSettingsService.updateSettings).not.toHaveBeenCalled();
    });

    it('setSlaMode updates state and settings', () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        act(() => {
            result.current.actions.setSlaMode('LOW_LATENCY');
        });
        expect(result.current.slaMode).toBe('LOW_LATENCY');
        expect(mockSettingsService.updateSettings).toHaveBeenCalledWith({ slaMode: 'LOW_LATENCY' });
    });

    it('getActiveProfile reads from config', () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        expect(result.current.actions.getActiveProfile()).toBe('balanced');
    });

    it('setActiveProfile delegates and refreshes config', async () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        await act(async () => {
            await result.current.actions.setActiveProfile('performance');
        });
        expect(mockRouterService.setActiveProfile).toHaveBeenCalledWith('performance');
    });

    it('updateActiveProfileWeights delegates and refreshes config', async () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        await act(async () => {
            await result.current.actions.updateActiveProfileWeights({
                ttft: 0.4,
                tps: 0.4,
                reliability: 0.2,
            });
        });
        expect(mockRouterService.updateActiveProfileWeights).toHaveBeenCalledWith({
            ttft: 0.4,
            tps: 0.4,
            reliability: 0.2,
        });
    });

    it('startABTest returns true and updates abTest state', async () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        mockRouterService.getABTest.mockImplementation(() => makeABTest() as never);
        const ok = await act(async () =>
            result.current.actions.startABTest('control', 'experiment', 30),
        );
        expect(ok).toBe(true);
        expect(mockRouterService.startABTest).toHaveBeenCalledWith('control', 'experiment', 30);
        expect(result.current.abTest?.splitPercent).toBe(50);
    });

    it('startABTest returns false and leaves abTest unchanged on failure', async () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        mockRouterService.startABTest.mockImplementation(async () => false);
        mockRouterService.getABTest.mockClear();
        const ok = await act(async () =>
            result.current.actions.startABTest('control', 'experiment', 30),
        );
        expect(ok).toBe(false);
        expect(mockRouterService.getABTest).not.toHaveBeenCalled();
    });

    it('stopABTest clears abTest state', async () => {
        const { result } = renderHook(() => useRoutingIntelligence());
        mockRouterService.getABTest.mockImplementation(() => makeABTest() as never);
        await act(async () => {
            await result.current.actions.startABTest('a', 'b', 50);
        });
        expect(result.current.abTest).not.toBeNull();
        await act(async () => {
            await result.current.actions.stopABTest();
        });
        expect(mockRouterService.stopABTest).toHaveBeenCalled();
        expect(result.current.abTest).toBeNull();
    });
});
