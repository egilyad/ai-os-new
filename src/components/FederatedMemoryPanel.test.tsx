import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import FederatedMemoryPanel from './FederatedMemoryPanel';

const fed = vi.hoisted(() => ({
    syncAll: vi.fn(),
    syncNode: vi.fn(),
}));

vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

vi.mock('../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
        EVENTS: { ERROR_BOUNDARY_CAUGHT: 'error:boundary' },
        federatedMemoryService: {
            getConfig: () => ({ allowedPeers: [] }),
            getNodes: () => [
                { id: 'n1', name: 'Node 1', status: 'connected', lastSync: undefined },
            ],
            getSyncHistory: () => [],
            syncAll: (...args: unknown[]) => (fed.syncAll as (...a: unknown[]) => Promise<unknown>)(...args),
            syncNode: (...args: unknown[]) => (fed.syncNode as (...a: unknown[]) => Promise<unknown>)(...args),
            disconnectNode: vi.fn(),
            connectNode: vi.fn(),
        },
    };
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('FederatedMemoryPanel sync honesty (Zone 4)', () => {
    it('recovers the button and shows the error when syncAll fails', async () => {
        fed.syncAll.mockRejectedValueOnce(new Error('peer unreachable'));
        render(<FederatedMemoryPanel />);
        const btn = screen.getByText('Sync All');
        fireEvent.click(btn);
        expect(await screen.findByText(/Sync failed:/)).toBeDefined();
        expect(screen.getByText(/peer unreachable/)).toBeDefined();
        expect((screen.getByText('Sync All').closest('button') as HTMLButtonElement).disabled).toBe(false);
    });

    it('says never instead of a huge counter for unsynced nodes', () => {
        render(<FederatedMemoryPanel />);
        expect(screen.getByText('never')).toBeDefined();
    });
});
