import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

const list = vi.fn(async (): Promise<unknown[]> => []);
const synthesize = vi.fn(async () => undefined);
const exportToCrystal = vi.fn(async () => undefined);
const exportToForum = vi.fn(async () => undefined);
const refine = vi.fn(async () => undefined);

vi.mock('../../kernel/instances', () => ({
    synthesisEngine: { list, synthesize, exportToCrystal, exportToForum, refine },
    lensEngine: { listLenses: vi.fn(() => []) },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SynthesisPanel (FT-01)', () => {
    it('renders the title, loads syntheses and shows the empty state', async () => {
        const SynthesisPanel = (await import('./SynthesisPanel')).default;
        render(<SynthesisPanel />);
        expect(await screen.findByText('synthesis.title')).toBeDefined();
        expect(list).toHaveBeenCalledWith({});
        expect(await screen.findByText('synthesis.no_syntheses')).toBeDefined();
    });

    it('reloads syntheses when the refresh button is clicked', async () => {
        const SynthesisPanel = (await import('./SynthesisPanel')).default;
        render(<SynthesisPanel />);
        await screen.findByText('synthesis.title');
        fireEvent.click(screen.getByTitle('synthesis.refresh'));
        expect(list.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('banners a load failure instead of failing silently', async () => {
        list.mockRejectedValueOnce(new Error('store down'));
        const SynthesisPanel = (await import('./SynthesisPanel')).default;
        render(<SynthesisPanel />);
        expect(await screen.findByText('store down')).toBeDefined();
        expect(screen.getByRole('alert')).toBeDefined();
    });

    it('renders legacy syntheses without nested fields', async () => {
        list.mockResolvedValueOnce([{ id: 'legacy-1' }]);
        const SynthesisPanel = (await import('./SynthesisPanel')).default;
        render(<SynthesisPanel />);
        await screen.findByText('synthesis.title');
        expect(document.body.textContent).not.toContain('NaN');
    });
});
