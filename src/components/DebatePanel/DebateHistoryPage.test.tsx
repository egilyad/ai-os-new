import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DebateHistoryPage from './DebateHistoryPage';

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        eventBus: {
            emit: vi.fn(),
            on: vi.fn(() => vi.fn()),
            onSafe: vi.fn(() => vi.fn()),
            off: vi.fn(),
        },
        sessionManager: {
            getDebateHistory: () => [],
            getTerminalHistory: async () => [],
        },
    };
});

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

afterEach(() => cleanup());

describe('DebateHistoryPage title (Zone 2)', () => {
    it('says History, not a generic title', () => {
        render(
            <MemoryRouter>
                <DebateHistoryPage />
            </MemoryRouter>,
        );
        // Page header + empty-state header both carry the History title.
        expect(screen.getAllByText('debate.history_title').length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText('debate_runtime.title')).toBeNull();
    });
});
