import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { AgentHistoryTab } from './AgentHistoryTab';

const busEmit = vi.hoisted(() => vi.fn());
const getVersions = vi.hoisted(() =>
    vi.fn(async (_agentId?: string) => [
        { id: 'v1', timestamp: 1000, message: 'first' },
        { id: 'v2', timestamp: 2000, message: 'second' },
    ]),
);

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        eventBus: {
            emit: (...args: unknown[]) => (busEmit as (...a: unknown[]) => void)(...args),
            on: vi.fn(),
            off: vi.fn(),
        },
        agentVersionService: {
            getVersions: (agentId: string) => getVersions(agentId),
            rollback: vi.fn(async () => ({ prompt: 'x' })),
        },
        EVENTS: { NOTIFICATION: 'notification' },
    };
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('AgentHistoryTab rollback refresh (Zone 3)', () => {
    it('reloads the version list after rollback', async () => {
        render(<AgentHistoryTab agentId="a1" />);
        expect(await screen.findByText('Rollback to this version')).toBeDefined();
        const callsBefore = getVersions.mock.calls.length;
        fireEvent.click(screen.getByText('Rollback to this version'));
        await new Promise((r) => setTimeout(r, 50));
        expect(getVersions.mock.calls.length).toBeGreaterThan(callsBefore);
        expect(busEmit).toHaveBeenCalled();
    });
});
