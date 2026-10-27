import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MemoryCenterPanel from './MemoryCenterPanel';

vi.mock('../../kernel/instances', () => ({
    memoryService: { search: vi.fn().mockResolvedValue([]) },
    wikiBrainService: { query: { search: vi.fn().mockResolvedValue([]) } },
    crystalVault: { search: vi.fn().mockResolvedValue([]), list: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../../kernel/services/memory-center/memory-registry', () => ({
    listMemorySources: () => [
        {
            id: 'test.source',
            name: 'Тестовый источник',
            category: 'knowledge',
            description: 'desc',
            owner: 'owner',
            storageType: 'dexie',
            table: 'memories',
            capabilities: { read: true, search: false, count: true, edit: false, delete: false, export: false },
            status: 'verified',
            openRoute: 'memory',
        },
    ],
    computeMemoryCounts: async () => [{ sourceId: 'test.source', count: 5 }],
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('./MemoryGraph', () => ({ default: () => <div data-testid="memory-graph" /> }));

const renderPanel = () =>
    render(
        <MemoryRouter>
            <MemoryCenterPanel />
        </MemoryRouter>,
    );

describe('MemoryCenterPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => cleanup());

    it('renders header and source rows', async () => {
        renderPanel();
        expect(screen.getByText('Memory Center — карта памяти системы')).toBeDefined();
        await waitFor(() => {
            expect(screen.getByText('Тестовый источник')).toBeDefined();
        });
    });
});
