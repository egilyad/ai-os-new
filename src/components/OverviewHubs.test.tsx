import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('../kernel/instances/events', () => ({
    eventBus: { on: () => () => undefined },
    EVENTS: { NOTIFICATION: 'system:notification', KERNEL_UPDATED: 'kernel:updated' },
}));
vi.mock('../kernel/instances/services-core', () => ({
    agentService: {
        getAgents: () => [{ id: 'a1' }, { id: 'a2', status: 'paused' }],
    },
    memoryService: { getMemories: () => [{ id: 'm1' }, { id: 'm2' }] },
}));
vi.mock('../kernel/instances/services-extras', async (importActual) => {
    const actual = await importActual<Record<string, unknown>>();
    return {
        ...actual,
        runHistoryService: {
            list: async () => [{ runId: 'r1' }, { runId: 'r2' }],
            listFailures: async () => [{ runId: 'r1', nodeId: 'n1' }],
        },
        notificationInboxService: { list: () => [] },
    };
});
vi.mock('../stores/activeDebateStore', () => ({
    useActiveDebateStore: { getState: () => ({ sessions: { d1: {}, d2: {} } }) },
}));
vi.mock('../stores/useKeyStore', () => ({
    useKeyStore: (selector: (s: { keys: unknown[] }) => unknown) =>
        selector({ keys: [{ id: 'k1', status: 'active' }] }),
}));

import OverviewHubs from './OverviewHubs';

describe('OverviewHubs', () => {
    it('показывает пять карточек и навигирует по клику', async () => {
        const onNavigate = vi.fn();
        render(<OverviewHubs onNavigate={onNavigate} />);

        await waitFor(() => expect(screen.getByLabelText('Overview hubs')).toBeTruthy());
        expect(screen.getByLabelText('Agents: 1')).toBeTruthy();
        expect(screen.getByLabelText('Memory: 2')).toBeTruthy();
        expect(screen.getByLabelText('Debates: 2')).toBeTruthy();
        expect(screen.getByLabelText('Providers: 1')).toBeTruthy();
        expect(screen.getByLabelText('Background: 1')).toBeTruthy();

        fireEvent.click(screen.getByLabelText('Agents: 1'));
        expect(onNavigate).toHaveBeenCalledWith('agents');
    });
});
