import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import InstalledProvidersView from './InstalledProvidersView';
import type { ApiKey } from '../../types/metrics';

const probeMocks = vi.hoisted(() => ({ probeAll: vi.fn() }));

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        eventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
        settingsService: {
            getSettings: () => ({ theme: 'dark' }),
            subscribe: () => () => {},
            updateSettings: vi.fn(),
        },
        probeService: {
            probeAll: () => probeMocks.probeAll() as Promise<never[]>,
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

function renderView() {
    return render(
        <InstalledProvidersView
            keys={[apiKey]}
            onSelect={vi.fn()}
            onCheckHealth={vi.fn()}
            onToggleStatus={vi.fn()}
            onRemoveKey={vi.fn()}
            onEnableAll={vi.fn()}
            onDisableAll={vi.fn()}
            checkingIds={new Set<string>()}
        />,
    );
}

describe('InstalledProvidersView probe-all failure (Zone 1)', () => {
    it('shows an inline error instead of failing silently', async () => {
        probeMocks.probeAll.mockRejectedValueOnce(new Error('boom'));
        renderView();
        fireEvent.click(screen.getByText('provider.quick_test_all'));
        expect(await screen.findByText(/Probe all failed:/)).toBeDefined();
        expect(screen.getByText(/boom/)).toBeDefined();
    });
});
