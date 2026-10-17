import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let sessions: Array<Record<string, unknown>> = [];

vi.mock('../../stores/useChatStore', () => ({
    useChatStore: (selector: (s: { sessions: unknown[] }) => unknown) => selector({ sessions }),
}));

beforeEach(() => {
    sessions = [];
});

describe('ChatDock', () => {
    it('renders the dock toggle', async () => {
        const ChatDock = (await import('./ChatDock')).default;
        render(<ChatDock />);
        expect(screen.getByTitle('Chat Dock')).toBeDefined();
    });

    it('tolerates legacy sessions without title/text without crashing', async () => {
        sessions = [
            {
                id: 'legacy-session',
                history: [{ id: 'e1', role: 'user' }],
            },
        ];
        const ChatDock = (await import('./ChatDock')).default;
        render(<ChatDock />);
        fireEvent.click(screen.getByTitle('Chat Dock'));
        fireEvent.click(screen.getByText('legacy-session'));
        expect(document.body.textContent).not.toContain('undefined');
    });
});
