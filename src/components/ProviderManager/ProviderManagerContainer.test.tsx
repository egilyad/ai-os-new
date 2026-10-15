import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import ProviderManagerContainer from './ProviderManagerContainer';

const busEmit = vi.hoisted(() => vi.fn());
const keyStoreState = vi.hoisted(() => ({
    keys: [] as unknown[],
    checkingIds: new Set<string>(),
    exportKeys: vi.fn(() => Promise.resolve('{}')),
}));

vi.mock('../../stores/useKeyStore', () => ({
    useKeyStore: (selector?: (s: Record<string, unknown>) => unknown) => {
        const state = {
            keys: keyStoreState.keys,
            checkingIds: keyStoreState.checkingIds,
            removeKey: vi.fn(),
            checkHealth: vi.fn(),
            checkAllHealth: vi.fn(),
            toggleKeyStatus: vi.fn(),
            enableAllKeys: vi.fn(),
            disableAllKeys: vi.fn(),
            exportKeys: (...args: unknown[]) =>
                (keyStoreState.exportKeys as (...a: unknown[]) => Promise<string>)(...args),
            importKeys: vi.fn(() => Promise.resolve(0)),
            updateKey: vi.fn(),
            addKey: vi.fn(),
            getAlerts: vi.fn(() => []),
        };
        if (typeof selector === 'function') return selector(state);
        return state;
    },
}));

vi.mock('../../kernel/instances', () => {
    const makeLogger = () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() });
    return {
        rootLogger: { ...makeLogger(), child: vi.fn(() => makeLogger()) },
        eventBus: {
            emit: (...args: unknown[]) =>
                (busEmit as (...a: unknown[]) => void)(...args),
            on: vi.fn(),
            off: vi.fn(),
        },
        groupManager: { createKey: vi.fn(() => Promise.resolve({ ok: true, key: {} })) },
        EVENTS: { NOTIFICATION: 'notification' },
        settingsService: {
            getSettings: () => ({ language: 'en' as const, theme: 'dark' as const }),
            subscribe: () => () => {},
        },
        probeService: {},
        keyStateStore: {},
        adapterRegistry: { getAllProviders: () => [] },
    };
});

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({ t: (k: string) => k, lang: 'en' }),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('ProviderManagerContainer export failure (Zone 1)', () => {
    it('emits an error notification instead of failing silently', async () => {
        (keyStoreState.exportKeys as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
            new Error('disk full'),
        );
        render(<ProviderManagerContainer />);
        fireEvent.click(screen.getByLabelText('provider_manager.aria.export'));
        await waitFor(() =>
            expect(
                busEmit.mock.calls.some(
                    (c: unknown[]) =>
                        (c[1] as { type?: string; message?: string })?.type === 'error' &&
                        ((c[1] as { message?: string }).message ?? '').includes('disk full'),
                ),
            ).toBe(true),
        );
    });
});
