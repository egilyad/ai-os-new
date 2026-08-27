import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockCreate = vi.fn((input: Record<string, unknown>) =>
    Promise.resolve({
        id: 'scenario-x',
        version: 1,
        status: 'draft',
        createdAt: 1,
        updatedAt: 1,
        ...input,
    }),
);

vi.mock('../../kernel/instances/services-extras', () => ({
    scenarioRepository: {
        create: (input: Record<string, unknown>) => mockCreate(input),
        list: () => Promise.resolve([]),
        duplicate: () => Promise.resolve(undefined),
        archive: () => Promise.resolve(undefined),
        delete: () => Promise.resolve(undefined),
    },
}));

vi.mock('../../kernel/instances/services-core', () => ({
    agentService: {
        getAgents: () => [
            {
                id: 'p1',
                name: 'Agent P1',
                role: 'Architect',
                status: 'active',
                stats: {
                    calls: 0,
                    tokens: 0,
                    latency: 0,
                    errors: 0,
                    avgTokensPerCall: 0,
                    lastActive: 0,
                    estimatedCost: 0,
                },
            },
        ],
    },
}));

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

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'director.configure.heading': 'Configure scenario',
                'director.configure.name': 'Name',
                'director.configure.name_placeholder': 'Scenario name',
                'director.configure.description': 'Description',
                'director.configure.description_placeholder': 'What is this about?',
                'director.configure.objective': 'Objective / Topic',
                'director.configure.objective_placeholder': 'Optional guiding topic',
                'director.configure.participants': 'Participants',
                'director.configure.add_participant': 'Add participant',
                'director.configure.select_agent': 'Select agent',
                'director.configure.no_agents': 'No agents available',
                'director.configure.participant_id': 'ID',
                'director.configure.participant_role': 'Role',
                'director.configure.turns': 'Turns (ordered)',
                'director.configure.add_turn': 'Add turn',
                'director.configure.turn_participant': 'Participant',
                'director.configure.turn_type': 'Objective type',
                'director.configure.turn_description': 'Instruction',
                'director.configure.turn_constraints': 'Constraints',
                'director.configure.add_constraint': 'Add constraint',
                'director.configure.move_up': 'Move up',
                'director.configure.move_down': 'Move down',
                'director.configure.remove': 'Remove',
                'director.configure.save_draft': 'Save Draft',
                'director.configure.saved': 'Scenario saved as draft.',
                'director.configure.name_required': 'Name is required.',
                'director.configure.needs_participant': 'Add at least one participant.',
            };
            return labels[key] || key;
        },
    }),
}));

describe('ScenarioEditor (B5.3)', () => {
    beforeEach(() => {
        mockCreate.mockClear();
    });

    it('renders the editor sections and Save Draft button', async () => {
        const ScenarioEditor = (await import('./ScenarioEditor')).default;
        render(<ScenarioEditor />);
        expect(screen.getByText('Configure scenario')).toBeDefined();
        expect(screen.getByLabelText('Name')).toBeDefined();
        expect(screen.getByLabelText('Description')).toBeDefined();
        expect(screen.getByLabelText('Objective / Topic')).toBeDefined();
        expect(screen.getByText('Participants')).toBeDefined();
        expect(screen.getByText('Turns (ordered)')).toBeDefined();
        expect(screen.getByText('Save Draft')).toBeDefined();
    });

    it('shows a validation error and blocks create when name is empty', async () => {
        const ScenarioEditor = (await import('./ScenarioEditor')).default;
        render(<ScenarioEditor />);
        fireEvent.click(screen.getByText('Save Draft'));
        expect(await screen.findByText('Name is required.')).toBeDefined();
        expect(mockCreate).not.toHaveBeenCalled();
    });

    it('constructs a ConversationScenario and calls repository.create', async () => {
        const onSaved = vi.fn();
        const ScenarioEditor = (await import('./ScenarioEditor')).default;
        render(<ScenarioEditor onSaved={onSaved} />);

        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My Scenario' } });
        fireEvent.change(screen.getByLabelText('Objective / Topic'), {
            target: { value: 'review architecture' },
        });

        fireEvent.change(screen.getByLabelText('Select agent'), { target: { value: 'p1' } });
        fireEvent.click(screen.getByText('Add participant'));

        fireEvent.click(screen.getByText('Add turn'));
        fireEvent.change(screen.getByLabelText('Instruction'), {
            target: { value: 'introduce the topic' },
        });
        fireEvent.click(screen.getByText('Add constraint'));
        fireEvent.change(screen.getByLabelText('Constraints 1'), {
            target: { value: 'be concise' },
        });

        fireEvent.click(screen.getByText('Save Draft'));

        expect(await screen.findByText('Scenario saved as draft.')).toBeDefined();
        await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
        const input = mockCreate.mock.calls[0]![0]! as Record<string, unknown>;
        expect(input.name).toBe('My Scenario');
        expect(input.topic).toBe('review architecture');
        expect(input.participants).toEqual([{ id: 'p1', role: 'Architect' }]);
        const turns = input.turns as Array<Record<string, unknown>>;
        expect(turns).toHaveLength(1);
        expect((turns[0]!.objective as Record<string, unknown>).description).toBe(
            'introduce the topic',
        );
        expect((turns[0]!.objective as Record<string, unknown>).constraints).toEqual([
            'be concise',
        ]);
        expect(await mockCreate.mock.results[0]!.value).toMatchObject({
            status: 'draft',
            version: 1,
        });
        expect(onSaved).toHaveBeenCalled();
    });

    it('reorders turns before save', async () => {
        const ScenarioEditor = (await import('./ScenarioEditor')).default;
        render(<ScenarioEditor />);

        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Reorder' } });
        fireEvent.change(screen.getByLabelText('Select agent'), { target: { value: 'p1' } });
        fireEvent.click(screen.getByText('Add participant'));

        fireEvent.click(screen.getByText('Add turn'));
        fireEvent.change(screen.getAllByLabelText('Instruction')[0]!, {
            target: { value: 'first' },
        });
        fireEvent.click(screen.getByText('Add turn'));
        fireEvent.change(screen.getAllByLabelText('Instruction')[1]!, {
            target: { value: 'second' },
        });

        const moveUps = screen.getAllByLabelText('Move up');
        fireEvent.click(moveUps[1]!);

        fireEvent.click(screen.getByText('Save Draft'));
        await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
        const turns = mockCreate.mock.calls[0]![0]!.turns as Array<Record<string, unknown>>;
        const descs = turns.map((tr) => (tr.objective as Record<string, unknown>).description);
        expect(descs).toEqual(['second', 'first']);
    });
});
