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

const list = vi.fn(() => Promise.resolve([]));
const getSources = vi.fn(() => Promise.resolve([]));
const detect = vi.fn(() => Promise.resolve([]));
const submitCounterargument = vi.fn(async () => undefined);

vi.mock('../../kernel/instances', () => ({
    junctionEngine: { list, getSources, detect, submitCounterargument },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('JunctionPanel (FT-01)', () => {
    it('renders the title and loads junctions + sources on mount', async () => {
        const JunctionPanel = (await import('./JunctionPanel')).default;
        render(<JunctionPanel />);
        expect(await screen.findByText('junctions.title')).toBeDefined();
        expect(screen.getByText('0 junctions.total')).toBeDefined();
        expect(list).toHaveBeenCalled();
        expect(getSources).toHaveBeenCalled();
    });

    it('runs detection and shows the detected count when the detect button is clicked', async () => {
        const JunctionPanel = (await import('./JunctionPanel')).default;
        render(<JunctionPanel />);
        await screen.findByText('junctions.title');
        fireEvent.click(screen.getByText('junctions.detect'));
        expect(await screen.findByText('0 junctions.detected_suffix')).toBeDefined();
        expect(detect).toHaveBeenCalled();
    });
});
