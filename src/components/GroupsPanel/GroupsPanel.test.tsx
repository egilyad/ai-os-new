import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let groups: Array<Record<string, unknown>> = [];
let keys: Array<Record<string, unknown>> = [];
let getGroupsImpl: () => Array<Record<string, unknown>> = () => groups;

vi.mock('../../kernel/instances', () => ({
    groupManager: {
        getGroups: () => getGroupsImpl(),
        createGroup: vi.fn(async () => {}),
        renameGroup: vi.fn(async () => {}),
        deleteGroup: vi.fn(async () => {}),
        assignKeyToGroup: vi.fn(async () => {}),
    },
    keyService: {
        getBurstCapacity: () => ({ availableBurst: 3, totalQuota: 10 }),
        getQuotaShare: () => ({ available: 1, sharedPool: 5 }),
    },
    rootLogger: {
        child: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
    },
}));

vi.mock('../../stores/useKeyStore', () => ({
    useKeyStore: (selector: (s: { keys: unknown[] }) => unknown) => selector({ keys }),
    refreshKeyStore: vi.fn(),
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

beforeEach(() => {
    groups = [];
    keys = [];
    getGroupsImpl = () => groups;
});

describe('GroupsPanel', () => {
    it('renders groups with key counts', async () => {
        groups = [
            { id: '__default__', name: 'Default', createdAt: 1, keyIds: ['k1'] },
            { id: 'g1', name: 'Team', createdAt: 2, keyIds: ['k2', 'k3'] },
        ];
        const Panel = (await import('./GroupsPanel')).default;
        render(<Panel />);
        expect(screen.getByText('groups.title')).toBeDefined();
        expect(screen.getByText('Team')).toBeDefined();
        expect(screen.getByText('2')).toBeDefined();
    });

    it('tolerates a legacy group without keyIds without crashing', async () => {
        groups = [{ id: 'legacy', name: 'Legacy', createdAt: 1 } as Record<string, unknown>];
        const Panel = (await import('./GroupsPanel')).default;
        render(<Panel />);
        fireEvent.click(screen.getByText('Legacy'));
        expect(document.body.textContent).toContain('groups.keys_in_group');
        expect(document.body.textContent).not.toContain('undefined');
    });

    it('shows an error banner when loading groups fails', async () => {
        getGroupsImpl = () => {
            throw new Error('boom');
        };
        const Panel = (await import('./GroupsPanel')).default;
        render(<Panel />);
        expect(screen.getByText('groups.error.load')).toBeDefined();
    });
});
