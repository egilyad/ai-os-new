import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../kernel/instances', () => ({
    eventBus: {
        emit: vi.fn(),
        on: vi.fn(() => vi.fn()),
        off: vi.fn(),
    },
    EVENTS: {
        NAVIGATE: 'navigate',
        KEY_UPDATED: 'key:updated',
        KEY_STATE_CHANGED: 'key:state:changed',
        SETTINGS_UPDATED: 'settings:updated',
        ROUTER_SIGNAL: 'router:signal',
    },
    routerService: {
        getDecisionHistory: vi.fn(() => []),
        getRawConfig: vi.fn(() => ({
            fallbackChains: {},
            modelDowngradeChains: {},
        })),
        getABTest: vi.fn(() => null),
        setFallbackChain: vi.fn(),
        setDowngradeChain: vi.fn(),
        setActiveProfile: vi.fn(),
        updateActiveProfileWeights: vi.fn(),
        startABTest: vi.fn(),
        stopABTest: vi.fn(),
    },
    keyService: {
        getKeys: vi.fn(() => []),
    },
    settingsService: {
        getSettings: vi.fn(() => ({ slaMode: 'BALANCED', language: 'en' })),
        updateSettings: vi.fn(),
        subscribe: vi.fn(() => () => {}),
    },
}));

vi.mock('../../i18n/useTranslation', () => {
    const translations: Record<string, string> = {
        'routing.title': 'Routing Intelligence',
        'routing.subtitle': 'Real-time provider routing analytics and optimization',
        'routing.tab.history': 'Decision Trace',
        'routing.tab.decision_tree': 'Decision Tree',
        'routing.tab.advanced': 'Advanced Control',
        'routing.history.empty': 'No routing decisions yet',
        'routing.detail.selected': 'Selected Provider',
        'routing.detail.fallback': 'Fallback',
        'routing.detail.estimated_cost': 'Estimated Cost',
        'routing.detail.table.provider': 'Provider',
        'routing.detail.table.score': 'Score',
        'routing.detail.table.ttft': 'TTFT',
        'routing.detail.table.tps': 'TPS',
        'routing.detail.table.reliability': 'Reliability',
        'routing.detail.table.cost': 'Cost',
        'nav.routing_ai': 'Routing AI',
        'info.routing':
            'Routing intelligence module for provider selection analytics and optimization\nMonitor routing decisions, configure fallback chains, and tune weight profiles.',
        'info.related': 'Related',
    };
    return {
        useTranslation: () => ({
            t: (key: string) => translations[key] ?? key,
            lang: 'en',
        }),
    };
});

describe('RoutingIntelligence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Routing Intelligence heading', async () => {
        const RoutingIntelligence = (await import('./RoutingIntelligence')).default;
        render(<RoutingIntelligence />);
        expect(await screen.findByText('Routing Intelligence')).toBeDefined();
    });

    it('renders three tab buttons', async () => {
        const RoutingIntelligence = (await import('./RoutingIntelligence')).default;
        render(<RoutingIntelligence />);
        expect(screen.getByText('Decision Trace')).toBeDefined();
        expect(screen.getByText('Decision Tree')).toBeDefined();
        expect(screen.getByText('Advanced Control')).toBeDefined();
    });

    it('shows empty state when no decisions', async () => {
        const RoutingIntelligence = (await import('./RoutingIntelligence')).default;
        render(<RoutingIntelligence />);
        expect(await screen.findByText(/No routing decisions yet/)).toBeDefined();
    });

    it('switches to decision tree tab', async () => {
        const RoutingIntelligence = (await import('./RoutingIntelligence')).default;
        render(<RoutingIntelligence />);
        fireEvent.click(screen.getByText('Decision Tree'));
        expect(await screen.findByText(/No routing decisions yet/)).toBeDefined();
    });

    it('switches to advanced control tab', async () => {
        const RoutingIntelligence = (await import('./RoutingIntelligence')).default;
        render(<RoutingIntelligence />);
        fireEvent.click(screen.getByText('Advanced Control'));
        expect(await screen.findByText('Fallback Chains')).toBeDefined();
        expect(screen.getByText('Model Downgrade Map')).toBeDefined();
    });
});
