import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModelCatalogView from './ModelCatalogView';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) =>
            ({
                'providers.catalog.search_placeholder': 'Search models',
                'providers.catalog.provider': 'Provider',
                'providers.catalog.all_providers': 'All providers',
                'providers.catalog.cap_toolCall': 'Tools',
                'providers.catalog.cap_vision': 'Vision',
                'providers.catalog.cap_reasoning': 'Reasoning',
                'providers.catalog.sort': 'Sort by',
                'providers.catalog.sort_price': 'Price',
                'providers.catalog.sort_context': 'Context window',
                'providers.catalog.sort_name': 'Name',
                'providers.catalog.found': 'Models found: {0}',
                'providers.catalog.show_more': 'Show more ({0})',
            })[key] ?? key,
    }),
}));

describe('ModelCatalogView', () => {
    it('lists catalog models with context and price', () => {
        render(<ModelCatalogView />);
        fireEvent.change(screen.getByLabelText('Search models'), {
            target: { value: 'gpt-4o' },
        });
        expect(screen.getAllByText('GPT-4o').length).toBeGreaterThan(0);
        expect(screen.getByText('openai/gpt-4o')).toBeTruthy();
        expect(screen.getAllByText(/128k/).length).toBeGreaterThan(0);
        expect(document.body.textContent).toContain('$2.50');
        expect(document.body.textContent).toContain('$10.00');
    });

    it('filters by search query', () => {
        render(<ModelCatalogView />);
        fireEvent.change(screen.getByLabelText('Search models'), {
            target: { value: 'claude-opus-4-7' },
        });
        expect(screen.getByText('Claude Opus 4.7')).toBeTruthy();
        expect(screen.queryByText('GPT-4o')).toBeNull();
    });

    it('filters by provider', () => {
        render(<ModelCatalogView />);
        fireEvent.change(screen.getByLabelText('Provider'), {
            target: { value: 'anthropic' },
        });
        expect(screen.getByText('anthropic/claude-opus-4-7')).toBeTruthy();
        expect(screen.queryByText('openai/gpt-4o')).toBeNull();
    });

    it('filters by capability', () => {
        render(<ModelCatalogView />);
        fireEvent.change(screen.getByLabelText('Search models'), {
            target: { value: 'gpt-4o' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Vision/ }));
        expect(screen.getByText('openai/gpt-4o')).toBeTruthy();

        // GPT-4o has no reasoning support — adding the filter must drop it.
        fireEvent.click(screen.getByRole('button', { name: /Reasoning/ }));
        expect(screen.queryByText('openai/gpt-4o')).toBeNull();
    });
});
