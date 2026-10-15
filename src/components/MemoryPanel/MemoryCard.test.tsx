import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import MemoryCard from './MemoryCard';
import type { MemoryEntry } from '../../types/memory';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

afterEach(cleanup);

function entry(over: Partial<MemoryEntry> = {}): MemoryEntry {
    return {
        id: 'm1',
        content: 'test content here',
        metadata: { source: 'test', type: 'note', timestamp: Date.now(), importance: 0.5 },
        ...over,
    } as MemoryEntry;
}

function renderCard(memory: MemoryEntry) {
    return render(
        <MemoryCard memory={memory} index={0} searchQuery="" isSearching={false} onDelete={vi.fn()} />,
    );
}

describe('MemoryCard embedding details (Zone 4)', () => {
    it('expands to show vector dims and preview', () => {
        renderCard(entry({ vector: [0.1, 0.2, 0.3, 0.4] }));
        fireEvent.click(screen.getByLabelText('View embedding details'));
        expect(screen.getByText(/dims: 4/)).toBeDefined();
        expect(screen.getByText(/0\.100/)).toBeDefined();
    });

    it('says so honestly when no embedding is stored', () => {
        renderCard(entry({}));
        fireEvent.click(screen.getByLabelText('View embedding details'));
        expect(screen.getByText('No embedding stored for this entry.')).toBeDefined();
    });
});
