import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

const demoRun = vi.fn().mockResolvedValue({ ok: true });

vi.mock('./rivalLabsConfig', () => ({
    RIVAL_PHASES: [
        {
            id: 'r',
            services: [
                {
                    key: 'demo',
                    title: 'DemoSvc',
                    svc: {},
                    method: 'demo',
                    args: 'a',
                    map: (a: string) => [a],
                    run: demoRun,
                },
            ],
        },
        { id: 't', services: [] },
    ],
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('RivalLabsPanel', () => {
    it('renders title, phase tabs and service cards', async () => {
        const Panel = (await import('./RivalLabsPanel')).default;
        render(<Panel />);
        expect(await screen.findByText('rivalLabs.title')).toBeDefined();
        expect(screen.getByText('rivalLabs.phase.r')).toBeDefined();
        expect(screen.getByText('DemoSvc')).toBeDefined();
    });

    it('runs the service through the card and shows the result', async () => {
        const Panel = (await import('./RivalLabsPanel')).default;
        render(<Panel />);
        fireEvent.change(screen.getByPlaceholderText('rivalLabs.inputA'), {
            target: { value: 'hello' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'rivalLabs.run' }));
        await waitFor(() => expect(demoRun).toHaveBeenCalledWith('hello', ''));
        expect(await screen.findByText(/"ok": true/)).toBeDefined();
    });

    it('switches phases and shows the empty state', async () => {
        const Panel = (await import('./RivalLabsPanel')).default;
        render(<Panel />);
        fireEvent.click(await screen.findByText('rivalLabs.phase.t'));
        expect(await screen.findByText('rivalLabs.empty')).toBeDefined();
    });
});
