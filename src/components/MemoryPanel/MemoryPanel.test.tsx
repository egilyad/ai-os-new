import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockMemories = [
    {
        id: 'm1',
        content: 'Important fact about AI',
        metadata: { source: 'test', type: 'fact', timestamp: Date.now(), importance: 0.9 },
    },
    {
        id: 'm2',
        content: 'User preference stored',
        metadata: { source: 'chat', type: 'observation', timestamp: Date.now(), importance: 0.5 },
    },
    {
        id: 'm3',
        content: 'System configuration saved',
        metadata: { source: 'system', type: 'config', timestamp: Date.now(), importance: 0.7 },
    },
];

vi.mock('../../kernel/instances', () => ({
    CONFIG: {
        services: {
            memory: {
                semanticEnabled: false,
                autoEmbedOnStore: false,
            },
        },
    },
    memoryService: {
        getMemories: vi.fn(() => mockMemories),
        search: vi.fn(() => Promise.resolve(mockMemories.slice(0, 2))),
        deleteMemory: vi.fn(() => Promise.resolve()),
        clear: vi.fn(() => Promise.resolve()),
        ensureSemantic: vi.fn(() => Promise.resolve()),
    },
    settingsService: {
        getSettings: vi.fn(() => ({
            notifications: true,
            autoHealthCheck: true,
            defaultMode: 'smart',
            streamingEnabled: true,
            historyPersistence: true,
            fallbackEnabled: true,
            debugMode: false,
            theme: 'dark',
            language: 'en',
            explorationFactor: 0.1,
            slaMode: 'BALANCED',
        })),
        subscribe: vi.fn(() => vi.fn()),
    },
    configService: {
        updateServices: vi.fn(() => Promise.resolve()),
    },
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        onSafe: vi.fn(() => vi.fn()),
        off: vi.fn(),
    },
    EVENTS: { NOTIFICATION: 'system:notification' },
}));

vi.mock('../../kernel/events/event-bus', () => ({
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        off: vi.fn(),
        onSafe: vi.fn(() => vi.fn()),
    },
    EVENTS: { NOTIFICATION: 'system:notification' },
}));

vi.mock('../../kernel/services/config-registry', () => ({
    CONFIG: {
        services: {
            memory: {
                semanticEnabled: false,
            },
        },
    },
}));

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const labels: Record<string, string> = {
                'memory.title': 'Vector Memory Mesh',
                'memory.subtitle': 'Explore and manage memory entries',
                'memory.wipe_index': 'Wipe Index',
                'memory.export_vectors': 'Export Vectors',
                'memory.index_params': 'Index Parameters',
                'memory.knowledge_growth': 'Knowledge Growth',
                'memory.entries_label': 'Memory Entries',
                'memory.dimensions_label': 'Dimensions',
                'memory.density_label': 'Index Density',
                'memory.clarity_label': 'Semantic Clarity',
                'memory.tab.long_term': 'Long-Term Memory',
                'memory.tab.ephemeral': 'Ephemeral Context',
                'memory.tab.rag': 'RAG Knowledge',
                'memory.context_fallback': 'context',
                'memory.loading': 'Loading memory...',
                'memory.empty_collection': 'No entries',
                'memory.empty_search': 'No results',
                'memory.search_semantic': 'Search semantically...',
                'memory.search_exact': 'Search text...',
                'memory.switch_search_aria': 'Switch to {0}',
                'memory.retrieval_latency': 'Avg retrieval: ',
                'memory.fragments_added': '{0} fragments {1}',
                'memory.today': 'today',
                'memory.days_ago': 'days ago',
                'memory.knowledge_desc': 'Knowledge base with {0} entries',
                'memory.error_search': 'Search failed',
                'memory.error_wipe': 'Wipe failed',
                'memory.error_delete': 'Delete failed',
                'memory.error_export': 'Export failed',
                'common.dismiss_error': 'Dismiss',
            };
            return labels[key] ?? key;
        },
        lang: 'en',
        setLanguage: () => {},
        settingsService: { subscribe: () => () => {} },
    }),
}));

describe('MemoryPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Vector Memory Mesh heading', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        expect(await screen.findByText('Vector Memory Mesh')).toBeDefined();
    });

    it('displays memory items', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        expect(await screen.findByText('Important fact about AI')).toBeDefined();
        expect(screen.getByText('User preference stored')).toBeDefined();
        expect(screen.getByText('System configuration saved')).toBeDefined();
    });

    it('has search input', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        await screen.findByText('Vector Memory Mesh');
        const inputs = document.querySelectorAll('input');
        expect(inputs.length).toBeGreaterThan(0);
    });

    it('renders collection tabs', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        expect(await screen.findByText('Long-Term Memory')).toBeDefined();
        expect(screen.getByText('Ephemeral Context')).toBeDefined();
        expect(screen.getByText('RAG Knowledge')).toBeDefined();
    });

    it('renders Wipe Index button', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        expect(await screen.findByText('Wipe Index')).toBeDefined();
    });

    it('renders Export Vectors button', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        expect(await screen.findByText('Export Vectors')).toBeDefined();
    });

    it('shows index parameters panel', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        expect(await screen.findByText('Index Parameters')).toBeDefined();
    });

    it('shows Knowledge Growth panel', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        expect(await screen.findByText('Knowledge Growth')).toBeDefined();
    });

    it('shows semantic toggle button', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        expect(await screen.findByText('Semantic')).toBeDefined();
    });

    it('displays total vectors count', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        await screen.findByText('Vector Memory Mesh');
        const entries = await screen.findByText('Memory Entries');
        const countEl = entries.nextElementSibling;
        expect(countEl?.textContent).toBe('3');
    });

    it('shows memory type badges', async () => {
        const MemoryPanel = (await import('./MemoryPanel')).default;
        render(<MemoryPanel />);
        await screen.findByText('Important fact about AI');
        const badges = document.querySelectorAll('[style*="text-transform: uppercase"]');
        const typeBadges = Array.from(badges).filter((b) =>
            b.textContent?.match(/^(fact|observation|config)$/i),
        );
        expect(typeBadges.length).toBeGreaterThan(0);
    });
});
