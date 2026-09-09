import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';

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

vi.mock('@xyflow/react', () => ({
    ReactFlow: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="react-flow">{children}</div>
    ),
    Controls: () => <div>Controls</div>,
    Background: () => <div>Background</div>,
    useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
    addEdge: vi.fn(() => ({})),
    Panel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Handle: () => <div>Handle</div>,
    Position: { Top: 'top', Bottom: 'bottom' },
}));

const mockKeys = [
    { id: 'k1', provider: 'OpenRouter', status: 'active', availableModels: ['gpt-4'] },
];

vi.mock('../../stores/useKeyStore', () => ({
    useKeyStore: () => ({ keys: mockKeys }),
}));

vi.mock('../../kernel/instances', () => ({
    toolService: { getTools: vi.fn(() => []) },
    orchestrator: { mount: vi.fn() },
    settingsService: {
        getSettings: vi.fn(() => ({ language: 'en' })),
        subscribe: vi.fn(() => vi.fn()),
    },
}));

vi.mock('../../kernel/events/event-bus', () => ({
    eventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
    EVENTS: { NOTIFICATION: 'notification' },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'builder.title': 'Visual Graph Builder',
                'builder.subtitle': 'Design and deploy multi-agent topologies',
                'builder.save': 'Save Workflow',
                'builder.deploy': 'Deploy to Engine',
                'builder.runtime_idle': 'RUNTIME: IDLE',
                'builder.blocks': 'INTELLIGENCE BLOCKS',
                'builder.inspector': 'PROPERTIES INSPECTOR',
                'builder.no_node_selected': 'No Node Selected',
                'builder.no_node_hint': 'Click on a node to inspect its configuration',
                'builder.node.agent': 'Autonomous Agent',
                'builder.node.router': 'Semantic Router',
                'builder.node.guardrail': 'Safety Guardrail',
                'builder.node.tool': 'External Tool',
                'builder.node.agent_desc': 'LLM-powered reasoning core',
                'builder.node.router_desc': 'Directs execution flow via ML',
                'builder.node.guardrail_desc': 'Validates & sanitizes I/O',
                'builder.node.tool_desc': 'Executes API calls & scripts',
            };
            return labels[key] || key;
        },
    }),
}));

describe('CognitiveBuilder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Visual Graph Builder heading', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText('Visual Graph Builder')).toBeDefined();
    });

    it('renders component palette items', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText('Autonomous Agent')).toBeDefined();
        expect(screen.getByText('Semantic Router')).toBeDefined();
        expect(screen.getByText('Safety Guardrail')).toBeDefined();
        expect(screen.getByText('External Tool')).toBeDefined();
    });

    it('renders palette section title', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText('INTELLIGENCE BLOCKS')).toBeDefined();
    });

    it('renders canvas react-flow container', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        const flows = document.querySelectorAll('[data-testid="react-flow"]');
        expect(flows.length).toBe(1);
    });

    it('renders Save Workflow button', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText('Save Workflow')).toBeDefined();
    });

    it('renders Deploy to Engine button', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText('Deploy to Engine')).toBeDefined();
    });

    it('renders PROPERTIES INSPECTOR section', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText('PROPERTIES INSPECTOR')).toBeDefined();
    });

    it('shows RUNTIME IDLE status', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText(/RUNTIME: IDLE/)).toBeDefined();
    });

    it('shows "No Node Selected" by default', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText('No Node Selected')).toBeDefined();
    });

    it('shows palette item descriptions', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText('LLM-powered reasoning core')).toBeDefined();
        expect(screen.getByText('Directs execution flow via ML')).toBeDefined();
        expect(screen.getByText('Validates & sanitizes I/O')).toBeDefined();
        expect(screen.getByText('Executes API calls & scripts')).toBeDefined();
    });

    it('renders Controls component', async () => {
        const CognitiveBuilder = (await import('./CognitiveBuilder')).default;
        render(<CognitiveBuilder />);
        expect(await screen.findByText('Controls')).toBeDefined();
    });
});
