import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

// DebateArena lazily loads these heavy panels; mock them so the route shell
// can be tested in isolation (the panels themselves are covered elsewhere).
vi.mock('./DebatePanel/DebatePanel', () => ({
    default: () => <div>DebatePanel-mock</div>,
}));
vi.mock('./DebateRuntimePanel/DebateRuntimePanel', () => ({
    default: () => <div>DebateRuntimePanel-mock</div>,
}));

vi.mock('../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

describe('DebateArena (FT-03) — route shell', () => {
    it('renders the classic/runtime tabs and loads the classic panel by default', async () => {
        const DebateArena = (await import('./DebateArena')).default;
        render(
            <MemoryRouter initialEntries={['/debate']}>
                <DebateArena />
            </MemoryRouter>,
        );
        expect(await screen.findByText('nav.debate_arena')).toBeDefined();
        expect(screen.getByText('nav.debate_runtime_arena')).toBeDefined();
        expect(await screen.findByText('DebatePanel-mock')).toBeDefined();
    });

    it('switches to the runtime panel when the runtime tab is clicked', async () => {
        const DebateArena = (await import('./DebateArena')).default;
        render(
            <MemoryRouter initialEntries={['/debate']}>
                <DebateArena />
            </MemoryRouter>,
        );
        await screen.findByText('nav.debate_runtime_arena');
        fireEvent.click(screen.getByText('nav.debate_runtime_arena'));
        expect(await screen.findByText('DebateRuntimePanel-mock')).toBeDefined();
    });
});
