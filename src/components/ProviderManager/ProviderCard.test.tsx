import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import ProviderCard from './ProviderCard';
import type { ApiKey } from '../../types/metrics';

const probeMocks = vi.hoisted(() => ({ probeForDebate: vi.fn() }));

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
    eventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
    probeService: {
        probeForDebate: (...args: unknown[]) =>
            (probeMocks.probeForDebate as (...a: unknown[]) => Promise<unknown>)(...args),
    },
    keyService: { getAlerts: () => [] },
    keyStateStore: {},
    };
});

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

const apiKey = {
    id: 'k1',
    provider: 'OpenRouter',
    key: 'sk-or-1',
    label: 'OpenRouter Pro',
    status: 'active',
    availableModels: ['gpt-4'],
} as ApiKey;

function renderCard() {
    return render(
        <ProviderCard
            apiKey={apiKey}
            onSelect={vi.fn()}
            onToggleStatus={vi.fn()}
            onCheckHealth={vi.fn()}
            onRemoveKey={vi.fn()}
            isChecking={false}
            searchQuery=""
        />,
    );
}

describe('ProviderCard probe failure (Zone 1)', () => {
    it('shows an inline error instead of failing silently', async () => {
        probeMocks.probeForDebate.mockRejectedValueOnce(new Error('net down'));
        renderCard();
        const buttons = await screen.findAllByTitle('provider.tooltip_probe');
        fireEvent.click(buttons[0]!);
        expect(await screen.findByText(/Probe failed:/)).toBeDefined();
        expect(screen.getByText(/net down/)).toBeDefined();
    });

    it('shows probe results on success', async () => {
        probeMocks.probeForDebate.mockResolvedValueOnce(
            new Map([['k1', { status: 'ready', latency: 120 }]]),
        );
        renderCard();
        const buttons = await screen.findAllByTitle('provider.tooltip_probe');
        fireEvent.click(buttons[0]!);
        expect(await screen.findByText('ready')).toBeDefined();
    });
});
