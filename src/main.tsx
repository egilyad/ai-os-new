import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';
import './theme-init'; // Must run before React mounts — sets dark class on <html>
import { runtime } from './kernel/runtime';
import { eventBus } from './kernel/instances';
import { defaultContainer } from './kernel/container';
import { registerDebateStoreAdapters } from './stores/register-debate-store-adapters';
import { BrowserRouter } from 'react-router-dom';

import ErrorBoundary from './components/Common/ErrorBoundary';

import { EVENTS } from './kernel/events/event-names';
import { rootLogger } from './kernel/services/logger-service';

const LOGGER = rootLogger.child('Main');

// Global unhandled rejection handler — catches ONLY errors that somehow bypass
// both the runtime.start() try/catch and all service-level error handlers.
// Stored in variable so HMR dispose() can remove it.
const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    if (event.defaultPrevented) return;
    console.error('[UnhandledRejection]', event.reason);
    eventBus.emit(EVENTS.NOTIFICATION, {
        message: `Unhandled async error: ${event.reason instanceof Error ? event.reason.message : String(event.reason)}`,
        type: 'error',
    });
    event.preventDefault();
};
window.addEventListener('unhandledrejection', unhandledRejectionHandler);

// Memory monitor — logs every 30 seconds (DEV only)
let memTimer: ReturnType<typeof setInterval> | undefined;
if (import.meta.env.DEV && typeof window !== 'undefined') {
    let memCount = 0;
    memTimer = setInterval(() => {
        const mem = (
            performance as unknown as {
                memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
            }
        ).memory;
        if (mem) {
            LOGGER.info(
                'Main',
                `[Memory] heap: ${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(mem.totalJSHeapSize / 1024 / 1024).toFixed(1)}MB`,
            );
        }
        memCount++;
        if (memCount > 10) {
            LOGGER.info('Main', '[Memory] Still alive after 5 minutes');
            memCount = 0;
        }
    }, 30000);
    window.addEventListener('beforeunload', () => clearInterval(memTimer), { once: true });
}

// C2: Render shell immediately so user sees a loading state, then bootstrap async
const root = ReactDOM.createRoot(document.getElementById('root')!);

const bootSplash = (
    <div
        style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            color: '#94a3b8',
            fontFamily: 'system-ui, sans-serif',
        }}
    >
        <div style={{ textAlign: 'center' }}>
            <div
                style={{
                    width: 32,
                    height: 32,
                    border: '3px solid #334155',
                    borderTopColor: '#3b82f6',
                    borderRadius: '50%',
                    margin: '0 auto 1rem',
                    animation: 'spin 0.8s linear infinite',
                }}
            />
            <div style={{ fontSize: '0.85rem' }}>Initializing system...</div>
        </div>
    </div>
);

root.render(bootSplash);

// UI composition root: register zustand-backed debate store adapters into the
// DI container BEFORE runtime.start() so service-registration phases can resolve
// them via container tokens (kernel must not import src/stores/).
registerDebateStoreAdapters(defaultContainer);

try {
    await runtime.start();
} catch (e) {
    console.error('[BOOT] Runtime failed to start:', e);
    root.render(
        <div
            style={{
                display: 'flex',
                height: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                color: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
                padding: '2rem',
                textAlign: 'center',
            }}
        >
            <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    System failed to initialize
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {e instanceof Error ? e.message : 'Unknown error'}
                </div>
            </div>
        </div>,
    );
    throw e;
}

root.render(
    <React.StrictMode>
        <ErrorBoundary name="Root" variant="page">
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>,
);

if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
        if (memTimer !== undefined) clearInterval(memTimer);
        (window as unknown as { __cleanupKeyStore?: () => void }).__cleanupKeyStore?.();
        runtime.shutdown();
    });
}

// Console helpers
interface WindowDebug {
    __getState: () => Promise<Record<string, unknown>>;
    __checkConsistency: () => Promise<unknown>;
    __probeAll: () => Promise<unknown>;
}
const w = window as unknown as WindowDebug;
w.__getState = async () => {
    const { kernel, keyService } = await import('./kernel/instances');
    const kState = kernel?.getState();
    const proj = (kState as unknown as Record<string, unknown>)?.['keys'] as
        Array<unknown> | undefined;
    const keys = keyService?.getKeys();
    return {
        keyServiceCount: Array.isArray(keys) ? keys.length : 0,
        projectionCount: Array.isArray(proj) ? proj.length : 0,
        providerCount: kState?.providers ? Object.keys(kState.providers).length : 0,
        dbsample:
            Array.isArray(keys) && keys.length > 0
                ? keys.slice(0, 3).map((k) => `${k.provider}/${k.label}`)
                : [],
    };
};

w.__checkConsistency = async () => {
    const { truthConsistencyMonitor, kernel } = await import('./kernel/instances');
    const kState = kernel?.getState();
    if (!kState) {
        LOGGER.warn('Main', '[Consistency] kernel not ready');
        return null;
    }
    const report = truthConsistencyMonitor?.check(kState.providers, {});
    LOGGER.info('Main', '[Consistency] Report', { value: JSON.stringify(report, null, 2) });
    return report;
};

w.__probeAll = async () => {
    const { probeService } = await import('./kernel/instances');
    if (probeService && typeof probeService.probeAll === 'function') {
        const result = await probeService.probeAll();
        LOGGER.info('Main', '[Probe] probeAll completed', { value: JSON.stringify(result) });
        return result;
    }
    LOGGER.warn('Main', '[Probe] probeService not available');
    return null;
};
