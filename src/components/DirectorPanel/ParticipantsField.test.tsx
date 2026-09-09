import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParticipantsField from './ParticipantsField';

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

const getAgents = vi.fn(() => [
    { id: 'agent-x', name: 'Alex Petrov', role: 'Critical Auditor', status: 'idle', stats: {} },
]);
const resolveAgent = vi.fn((id: string) => ({
    id,
    name: 'Alex Petrov',
    role: 'Critical Auditor',
    displayName: 'Alex Petrov',
    baseRole: 'Critical Auditor',
    specializations: ['Chemistry'],
    model: 'llama-3.3-70b-versatile',
    provider: 'groq',
}));

vi.mock('../../kernel/instances/services-core', () => ({
    agentService: {
        getAgents: () => getAgents(),
        resolveAgent: (id: string) => resolveAgent(id),
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const m: Record<string, string> = {
                'director.configure.participants': 'Participants',
                'director.configure.conversation_role': 'Conversation role',
                'director.configure.agent': 'Agent',
                'director.configure.select_agent': 'Select agent',
                'director.configure.add_participant': 'Add participant',
                'director.configure.remove': 'Remove',
                'director.configure.no_agents': 'no agents',
            };
            return m[key] ?? key;
        },
    }),
}));

describe('ParticipantsField (identity vs conversation role)', () => {
    it('shows the agent identity (name + specialization) and a separate conversation role', () => {
        render(
            <ParticipantsField value={[{ id: 'agent-x', role: 'Critic' }]} onChange={() => {}} />,
        );
        expect(screen.getByText('Alex Petrov')).toBeDefined();
        expect(screen.getByText(/Chemistry/)).toBeDefined();
        const roleInput = screen.getByLabelText('Conversation role') as HTMLInputElement;
        expect(roleInput.value).toBe('Critic');
        // Technical id must NOT be the primary displayed identity.
        expect(screen.queryByDisplayValue('agent-x')).toBeNull();
    });

    it('adds a participant preserving the per-conversation role in the DTO', () => {
        const onChange = vi.fn();
        render(<ParticipantsField value={[]} onChange={onChange} />);
        fireEvent.change(screen.getByLabelText('Select agent'), {
            target: { value: 'agent-x' },
        });
        fireEvent.click(screen.getByText('Add participant'));
        expect(onChange).toHaveBeenCalledWith([{ id: 'agent-x', role: 'Critical Auditor' }]);
    });
});
