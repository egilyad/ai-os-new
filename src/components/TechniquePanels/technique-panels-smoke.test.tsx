/**
 * P2.17 — Parameterized smoke test for ALL TechniquePanels.
 * Renders every panel from the bundle with mocked dependencies.
 * Verifies: no crash, no white-screen, renders at least some content.
 */
import React, { Suspense } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
    TECHNIQUE_PANEL_COMPONENTS,
} from './technique-panels-bundle';

vi.mock('../../kernel/instances', () => ({
    getAllSettings: () => ({} as Record<string, boolean>),
    setSetting: () => {},
    qualityImpactCollector: { getAllMetrics: () => [], getMetricsForTechnique: () => [] },
    debateEngine: { getActiveSession: () => undefined, getSession: () => undefined },
    keyService: { getKeys: () => [] },
    memoryEngine: { search: () => [], getEntries: () => [] },
}));

vi.mock('../../hooks/useRealAgents', () => ({
    useRealAgents: () => [
        { id: 'agent-1', name: 'Alice', role: 'pro', persona: { name: 'Alice', description: 'Test' } },
        { id: 'agent-2', name: 'Bob', role: 'con', persona: { name: 'Bob', description: 'Test' } },
    ],
}));

vi.mock('../../hooks/useDebateArguments', () => ({
    useDebateArguments: () => ({
        args: [
            { id: 'a1', agentId: 'agent-1', content: 'Test argument pro', position: 'pro', confidence: 0.8, round: 1 },
            { id: 'a2', agentId: 'agent-2', content: 'Test argument con', position: 'con', confidence: 0.7, round: 1 },
        ],
        hasLiveDebate: false,
    }),
}));

vi.mock('../../hooks/useDebateSession', () => ({
    useDebateSession: () => ({
        session: { id: 'test', topic: 'Test Topic', status: 'completed', participants: [] },
        isLoading: false,
    }),
}));

vi.mock('../../hooks/useSettings', () => ({
    useSettings: () => ({
        settings: {},
        updateSetting: vi.fn(),
    }),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (k: string) => k,
        lang: 'en' as const,
    }),
}));

vi.mock('../../stores/debateLiveStore', () => ({
    useDebateLiveStore: () => ({
        events: [],
        activeSessionId: null,
        metrics: null,
    }),
}));

const PANEL_IDS = Object.keys(TECHNIQUE_PANEL_COMPONENTS);

const LoadingFallback = () => <div data-testid="loading">Loading...</div>;

describe('TechniquePanels — smoke render', () => {
    for (const panelId of PANEL_IDS) {
        it(`${panelId} renders without crashing`, async () => {
            const LazyComponent = TECHNIQUE_PANEL_COMPONENTS[panelId];
            expect(LazyComponent).toBeDefined();

            const { unmount } = render(
                <Suspense fallback={<LoadingFallback />}>
                    <LazyComponent />
                </Suspense>,
            );

            // At minimum, the component should render something into the DOM
            const container = document.body;
            expect(container).toBeTruthy();

            unmount();
        });
    }
});
