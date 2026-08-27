import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

vi.mock('../../kernel/instances', () => ({
    eventBus: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
    rootLogger: { error: vi.fn() },
    settingsService: {
        getSettings: () => ({ language: 'en' }),
        subscribe: () => () => {},
    },
}));

vi.mock('../../kernel/events/event-names', () => ({
    EVENTS: {
        ERROR_BOUNDARY_CAUGHT: 'error:boundary:caught',
        NOTIFICATION: 'system:notification',
    },
}));

vi.mock('../../i18n/translations', () => ({
    t: (key: string) => {
        const map: Record<string, string> = {
            'error_boundary.panel_crashed': 'Panel crashed',
            'error_boundary.page_title': 'Something went wrong',
            'error_boundary.page_desc': 'An unexpected error occurred',
            'error_boundary.reload': 'Reload',
            'error_boundary.go_home': 'Go Home',
            'error_boundary.unexpected_error': 'An unexpected error occurred',
        };
        return map[key] ?? key;
    },
    setLanguage: () => {},
}));

vi.mock('../../i18n/translations/index', () => ({
    loadLocale: () => Promise.resolve({}),
}));

const CrashChild = () => {
    throw new Error('Test crash');
};

describe('ErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div>OK</div>
            </ErrorBoundary>,
        );
        expect(screen.getByText('OK')).toBeDefined();
    });

    it('catches error and shows panel fallback', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary variant="panel" name="Test">
                <CrashChild />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Test: Panel crashed')).toBeDefined();
        expect(screen.getByText('Test crash')).toBeDefined();
        expect(screen.getByText('Reload')).toBeDefined();
    });

    it('catches error and shows page fallback', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary>
                <CrashChild />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Something went wrong')).toBeDefined();
        expect(screen.getByText('Go Home')).toBeDefined();
    });

    it('shows default panel name when no name provided', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary variant="panel">
                <CrashChild />
            </ErrorBoundary>,
        );
        expect(screen.getByText('Panel crashed')).toBeDefined();
    });

    it('emits eventBus notification on error', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const { eventBus } = await import('../../kernel/instances');
        render(
            <ErrorBoundary name="TestPanel" variant="panel">
                <CrashChild />
            </ErrorBoundary>,
        );
        expect(eventBus.emit).toHaveBeenCalledWith('system:notification', {
            message: '[ErrorBoundary:TestPanel] Test crash',
            type: 'error',
        });
    });

    it('has alert role on fallback', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary variant="panel">
                <CrashChild />
            </ErrorBoundary>,
        );
        expect(screen.getByRole('alert')).toBeDefined();
    });
});
