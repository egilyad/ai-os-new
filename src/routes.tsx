import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Search, MessageSquare, Home } from 'lucide-react';
import { useTranslation } from './i18n/useTranslation';
import ErrorBoundary from './components/Common/ErrorBoundary';
import ExperimentalBadge from './components/Common/ExperimentalBadge';
import { NAV_SECTIONS } from './route-registry';
import { PANEL_COMPONENTS, PanelLoader } from './route-imports';
const DashboardPanel = React.lazy(() => import('./components/DashboardPanel/DashboardPanel'));
const ProviderManager = React.lazy(() => import('./components/ProviderManager/ProviderManager'));
const GroupsPanel = React.lazy(() => import('./components/GroupsPanel/GroupsPanel'));
const ConnectorsPanel = React.lazy(() => import('./components/ConnectorsPanel/ConnectorsPanel'));
const MCPPanel = React.lazy(() => import('./components/MCPPanel/MCPPanel'));
const ChatAdminPanel = React.lazy(() => import('./components/ChatAdminPanel/ChatAdminPanel'));
const EventsTimeline = React.lazy(() => import('./components/EventsTimeline/EventsTimeline'));

function Panel(key: string): React.ComponentType<Record<string, unknown>> {
    const component = PANEL_COMPONENTS[key];
    if (!component) {
        const Fallback: React.FC = () => (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                Panel "{key}" not found
            </div>
        );
        return Fallback;
    }
    return component;
}

// Legacy routes NOT in sidebar (keep for deep-link compat):
// /events     → EventsPanel (replaced by /logs)
// /timeline   → EventsTimeline (merged into events surface)
// /chat-admin → ChatAdminPanel (admin-only, no nav entry)

const NotFound: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchVal, setSearchVal] = useState('');
    const suggestions = React.useMemo(() => {
        const allItems = NAV_SECTIONS.flatMap((s) => s.items);
        const pathPart = location.pathname.split('/').filter(Boolean).pop()?.toLowerCase() || '';
        if (pathPart) {
            return allItems
                .filter((item) => {
                    const label = t(item.labelKey).toLowerCase();
                    return label.includes(pathPart) || item.id.includes(pathPart);
                })
                .slice(0, 6);
        }
        return allItems.slice(0, 8);
    }, [location.pathname, t]);
    const filtered = React.useMemo(() => {
        if (!searchVal) return suggestions;
        const q = searchVal.toLowerCase();
        return NAV_SECTIONS.flatMap((s) => s.items)
            .filter((item) => {
                return t(item.labelKey).toLowerCase().includes(q) || item.id.includes(q);
            })
            .slice(0, 8);
    }, [searchVal, suggestions, t]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                gap: '1.5rem',
                padding: '2rem',
            }}
        >
            <div
                style={{
                    fontSize: '5rem',
                    fontWeight: 900,
                    color: '#64748b',
                    opacity: 0.15,
                    lineHeight: 1,
                    letterSpacing: '-0.05em',
                }}
            >
                404
            </div>
            <div style={{ fontSize: '1.2rem', color: '#94a3b8', fontWeight: 600 }}>
                {t('not_found.title')}
            </div>
            <div
                style={{
                    fontSize: '0.85rem',
                    color: '#64748b',
                    maxWidth: 400,
                    textAlign: 'center',
                }}
            >
                {t('not_found.description', { path: location.pathname })}
            </div>
            <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
                <Search
                    size={16}
                    style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b',
                        pointerEvents: 'none',
                    }}
                />
                <input
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder={t('not_found.search_placeholder')}
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.5rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        color: '#e2e8f0',
                        fontSize: '0.9rem',
                        outline: 'none',
                    }}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    justifyContent: 'center',
                    maxWidth: 500,
                }}
            >
                {filtered.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => navigate(`/${item.id}`)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.5rem 1rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 10,
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            transition: 'all 0.15s',
                        }}
                    >
                        {item.icon}
                        <span>{t(item.labelKey)}</span>
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0.6rem 1.2rem',
                        borderRadius: 8,
                        background: 'rgba(59,130,246,0.15)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        color: '#60a5fa',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    <Home size={16} /> Dashboard
                </button>
                <button
                    onClick={() => navigate('/chat')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '0.6rem 1.2rem',
                        borderRadius: 8,
                        background: 'rgba(16,185,129,0.15)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        color: '#34d399',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    <MessageSquare size={16} /> Chat
                </button>
            </div>
        </div>
    );
};

const DashboardWrapper: React.FC = () => {
    const navigate = useNavigate();
    return (
        <PanelLoader name="Dashboard">
            <DashboardPanel onNavigate={(p) => navigate(`/${p}`)} />
        </PanelLoader>
    );
};

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* ── Landing & dashboard ── */}
            <Route key="root" path="/" element={<DashboardWrapper />} />

            {/* ── Primary routes from registry ── */}
            {NAV_SECTIONS.flatMap((s) =>
                s.items
                    .filter((item) => item.id !== 'dashboard')
                    .map((item) => {
                        const Component = PANEL_COMPONENTS[item.id];
                        if (!Component) return null;
                        const routePath = item.path ?? `/${item.id}`;
                        const badge = item.experimental ? <ExperimentalBadge /> : null;
                        const wrapped = item.lazy ? (
                            <PanelLoader name={item.id}>
                                <Component />
                            </PanelLoader>
                        ) : (
                            <ErrorBoundary name={item.id} variant="panel">
                                <Component />
                            </ErrorBoundary>
                        );
                        return (
                            <Route
                                key={`${s.id}-${item.id}`}
                                path={routePath}
                                element={
                                    badge ? (
                                        <div style={{ padding: '0.5rem 1rem' }}>
                                            {badge}
                                            {wrapped}
                                        </div>
                                    ) : (
                                        wrapped
                                    )
                                }
                            />
                        );
                    }),
            )}

            {/* ── Redirects ── */}
            <Route
                key="redirect-dashboard"
                path="/dashboard"
                element={<Navigate to="/" replace />}
            />
            <Route
                key="redirect-events"
                path="/events"
                element={<Navigate to="/timeline" replace />}
            />
            <Route
                key="redirect-message-search"
                path="/message-search"
                element={<Navigate to="/chat" replace />}
            />
            <Route
                key="redirect-chat-export"
                path="/chat-export"
                element={<Navigate to="/chat" replace />}
            />
            <Route
                key="redirect-debate-runtime"
                path="/debate-runtime"
                element={<Navigate to="/debate?mode=runtime" replace />}
            />
            <Route
                key="redirect-topic-suggester"
                path="/topic-suggester"
                element={<Navigate to="/topics" replace />}
            />

            {/* ── Nested URL aliases (debates/*) ── */}
            <Route
                key="/debates/arena"
                path="/debates/arena"
                element={
                    <PanelLoader name="DebateArena">
                        {React.createElement(Panel('debate'))}
                    </PanelLoader>
                }
            />
            <Route
                key="/debates/live"
                path="/debates/live"
                element={
                    <PanelLoader name="DebateLive">
                        {React.createElement(Panel('debate-live'))}
                    </PanelLoader>
                }
            />
            <Route
                key="/debates/replay"
                path="/debates/replay"
                element={
                    <PanelLoader name="DebateReplay">
                        {React.createElement(Panel('debate-replay'))}
                    </PanelLoader>
                }
            />
            <Route
                key="/debates/tournament"
                path="/debates/tournament"
                element={
                    <PanelLoader name="Tournament">
                        {React.createElement(Panel('debate-tournament'))}
                    </PanelLoader>
                }
            />
            <Route
                key="/debates/history"
                path="/debates/history"
                element={
                    <PanelLoader name="DebateHistory">
                        {React.createElement(Panel('debate-history'))}
                    </PanelLoader>
                }
            />
            <Route
                key="/debates/analysis"
                path="/debates/analysis"
                element={
                    <PanelLoader name="DebateAnalysis">
                        {React.createElement(Panel('debate-analysis'))}
                    </PanelLoader>
                }
            />
            <Route
                key="/debates/graph"
                path="/debates/graph"
                element={
                    <PanelLoader name="ArgumentGraph">
                        {React.createElement(Panel('argument-graph'))}
                    </PanelLoader>
                }
            />
            <Route
                key="/debates/topics"
                path="/debates/topics"
                element={
                    <PanelLoader name="Topics">{React.createElement(Panel('topics'))}</PanelLoader>
                }
            />

            {/* ── Nested URL aliases (diagnostics/*) ── */}
            <Route
                key="/diagnostics/logs"
                path="/diagnostics/logs"
                element={
                    <PanelLoader name="Logs">{React.createElement(Panel('logs'))}</PanelLoader>
                }
            />
            <Route
                key="/diagnostics/health"
                path="/diagnostics/health"
                element={
                    <PanelLoader name="Health">{React.createElement(Panel('health'))}</PanelLoader>
                }
            />
            <Route
                key="/diagnostics/system"
                path="/diagnostics/system"
                element={
                    <PanelLoader name="SystemHealth">
                        {React.createElement(Panel('system-health'))}
                    </PanelLoader>
                }
            />
            <Route
                key="/diagnostics/traces"
                path="/diagnostics/traces"
                element={
                    <PanelLoader name="Traces">
                        {React.createElement(Panel('debugger'))}
                    </PanelLoader>
                }
            />
            <Route
                key="/diagnostics/memory"
                path="/diagnostics/memory"
                element={
                    <PanelLoader name="Memory">{React.createElement(Panel('memory'))}</PanelLoader>
                }
            />
            <Route
                key="/diagnostics/aquarium"
                path="/diagnostics/aquarium"
                element={
                    <PanelLoader name="Aquarium">
                        {React.createElement(Panel('aquarium'))}
                    </PanelLoader>
                }
            />

            {/* ── Nested URL aliases (services/*) ── */}
            <Route
                key="/services/keys"
                path="/services/keys"
                element={
                    <PanelLoader name="Providers">
                        <ProviderManager />
                    </PanelLoader>
                }
            />
            <Route
                key="/services/groups"
                path="/services/groups"
                element={
                    <PanelLoader name="Groups">
                        <GroupsPanel />
                    </PanelLoader>
                }
            />
            <Route
                key="/services/connectors"
                path="/services/connectors"
                element={
                    <PanelLoader name="Connectors">
                        <ConnectorsPanel />
                    </PanelLoader>
                }
            />
            <Route
                key="/services/mcp"
                path="/services/mcp"
                element={
                    <PanelLoader name="MCP">
                        <MCPPanel />
                    </PanelLoader>
                }
            />

            {/* ── Legacy admin route (no nav entry) ── */}
            <Route
                key="/chat-admin"
                path="/chat-admin"
                element={
                    <PanelLoader name="ChatAdmin">
                        <ChatAdminPanel />
                    </PanelLoader>
                }
            />

            {/* ── Legacy route for timeline/events ── */}
            <Route
                key="/timeline"
                path="/timeline"
                element={
                    <PanelLoader name="Timeline">
                        <EventsTimeline />
                    </PanelLoader>
                }
            />

            {/* ── 404 catch-all ── */}
            <Route key="*" path="*" element={<NotFound />} />
        </Routes>
    );
};
