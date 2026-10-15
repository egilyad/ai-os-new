import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import IndexStatsPanel from './IndexStatsPanel';
import type { MemoryEntry } from '../../types/memory';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

afterEach(cleanup);

describe('IndexStatsPanel honest fallbacks (Zone 4)', () => {
    it('shows a dash for dimensions with no data instead of 1536', () => {
        render(
            <IndexStatsPanel memories={[]} filteredMemories={[]} totalEntries={0} avgRetrievalMs={0} />,
        );
        expect(screen.getByText('—')).toBeDefined();
    });

    it('shows real dims when vectors exist', () => {
        const mem = {
            id: 'm1',
            content: 'x',
            vector: [0.1, 0.2],
            metadata: { source: 't', type: 'n', timestamp: 1, importance: 1 },
        } as MemoryEntry;
        render(
            <IndexStatsPanel memories={[mem]} filteredMemories={[mem]} totalEntries={1} avgRetrievalMs={5} />,
        );
        expect(screen.getByText('2')).toBeDefined();
    });
});
