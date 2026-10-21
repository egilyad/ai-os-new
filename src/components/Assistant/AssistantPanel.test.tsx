import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { handlers, ask, confirmNav } = vi.hoisted(() => ({
    handlers: new Map<string, (payload: unknown) => void>(),
    ask: vi.fn(),
    confirmNav: vi.fn(),
}));

vi.mock('../../kernel/instances/services-core', () => ({
    projectAssistantService: { ask: (...args: unknown[]) => ask(...args) },
    assistantNavigationService: { confirm: (...args: unknown[]) => confirmNav(...args) },
    projectKnowledgeService: { setCorpusProvider: vi.fn() },
    assistantActionRegistry: { attachUiActions: vi.fn() },
    capabilityTrustService: { list: () => [] },
    keyService: { getKeys: () => [], checkHealth: async () => ({ id: 'k', status: 'ok' }) },
    mcpService: { getServers: () => [] },
    skillService: { getSkills: () => [] },
}));

vi.mock('../../kernel/instances', () => ({
    eventBus: {
        on: (name: string, handler: (payload: unknown) => void) => {
            handlers.set(name, handler);
            return () => handlers.delete(name);
        },
    },
    EVENTS: {
        ASSISTANT_NAVIGATION: 'assistant:navigation',
        ASSISTANT_CHUNK: 'assistant:chunk',
        ASSISTANT_TOOL_CALL: 'assistant:tool:call',
        ASSISTANT_DONE: 'assistant:done',
    },
}));

import AssistantPanel from './AssistantPanel';
import { useAssistantStore } from '../../stores/assistant-store';

function renderPanel() {
    return render(
        <MemoryRouter>
            <AssistantPanel />
        </MemoryRouter>,
    );
}

describe('AssistantPanel', () => {
    beforeEach(() => {
        ask.mockReset();
        ask.mockResolvedValue({ content: 'Панель памяти — /memory.', toolCalls: [], rounds: 1 });
        confirmNav.mockClear();
        useAssistantStore.setState({ messages: [], busy: false, error: null });
    });

    afterEach(() => cleanup());

    it('renders the assistant surface with suggestions', () => {
        renderPanel();
        expect(screen.getByText('Помощник проекта')).toBeDefined();
        expect(screen.getByRole('button', { name: /Где находится панель памяти/ })).toBeDefined();
    });

    it('sends a question and shows the answer', async () => {
        renderPanel();
        const input = screen.getByLabelText('Вопрос помощнику');
        fireEvent.change(input, { target: { value: 'где память?' } });
        fireEvent.click(screen.getByLabelText('Отправить'));

        await waitFor(() => {
            expect(screen.getByText('Панель памяти — /memory.')).toBeDefined();
        });
        expect(ask).toHaveBeenCalledWith({ text: 'где память?' });
        expect(screen.getByText('где память?')).toBeDefined();
    });

    it('confirms a navigation request coming from the kernel', () => {
        renderPanel();
        const nav = handlers.get('assistant:navigation');
        expect(nav).toBeDefined();
        act(() => {
            nav?.({ id: 'nav-1', route: '/memory' });
        });
        expect(confirmNav).toHaveBeenCalledWith('nav-1');
    });
});
