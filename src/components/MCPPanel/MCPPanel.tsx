import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Search, RefreshCw, Server, AlertTriangle, Power, PowerOff } from 'lucide-react';
import {
    mcpService,
    type MCPServerConfig,
    type MCPTool,
    type MCPResource,
} from '../../kernel/instances';
import { eventBus, EVENTS, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('MCPPanel');
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import { useConfirm } from '../../hooks/useConfirm';
import ModuleInfo from '../ModuleInfo';
import { MCPServerCard } from './MCPServerCard';
import { MCPEditorModal } from './MCPEditorModal';

const MCPPanel: React.FC = () => {
    const { confirm, ConfirmDialog } = useConfirm();
    const [servers, setServers] = useState<MCPServerConfig[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingServer, setEditingServer] = useState<Partial<MCPServerConfig> | null>(null);
    const [expandedServer, setExpandedServer] = useState<string | null>(null);
    const [serverTools, setServerTools] = useState<Record<string, MCPTool[]>>({});
    const [serverResources, setServerResources] = useState<Record<string, MCPResource[]>>({});
    const [loadingTools, setLoadingTools] = useState<Record<string, boolean>>({});
    const [error, setError] = useState<string | null>(null);
    const [, setConnectingId] = useState<string | null>(null);
    const { t } = useTranslation();
    const isMountedRef = useRef(true);
    const clearError = useAutoClearError(setError);

    useEffect(() => {
        isMountedRef.current = true;
        setServers(mcpService.getServers() ?? []);
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const stats = (() => {
        try {
            return mcpService.getConnectionStats();
        } catch {
            return null;
        }
    })();

    const handleConnect = useCallback(
        async (id: string) => {
            setConnectingId(id);
            try {
                await mcpService.connect(id);
                setServers(mcpService.getServers());
            } catch (err) {
                setServers(mcpService.getServers());
                setError(
                    `${t('mcp.error_connect')}: ${err instanceof Error ? err.message : String(err)}`,
                );
                clearError();
            } finally {
                setConnectingId(null);
            }
        },
        [clearError, t],
    );

    const handleDisconnect = useCallback(async (id: string) => {
        setConnectingId(id);
        try {
            await mcpService.disconnect(id);
            setServers(mcpService.getServers());
        } finally {
            setConnectingId(null);
        }
    }, []);

    const handleReconnectAll = useCallback(async () => {
        try {
            const count = await mcpService.reconnectAll();
            setServers(mcpService.getServers());
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Reconnected ${count} server(s)`,
                type: 'success',
            });
        } catch {
            setError(t('mcp.error_reconnect'));
            clearError();
        }
    }, [clearError, t]);

    const handleRemoveServer = useCallback(
        async (server: MCPServerConfig) => {
            if (
                !(await confirm({
                    title: 'Remove Server',
                    message: `Remove server "${server.name}"?`,
                    variant: 'danger',
                }))
            )
                return;
            mcpService.removeServer(server.id);
            setServers(mcpService.getServers());
        },
        [confirm],
    );

    const toggleExpand = useCallback(
        async (id: string) => {
            if (expandedServer === id) {
                setExpandedServer(null);
                return;
            }
            setExpandedServer(id);
            const server = servers.find((s) => s.id === id);
            if (!server) return;
            if (!serverTools[id]) {
                setLoadingTools((prev) => ({ ...prev, [id]: true }));
                try {
                    const [tools, resources] = await Promise.all([
                        mcpService.listTools(id),
                        mcpService.listResources(id),
                    ]);
                    if (isMountedRef.current) {
                        setServerTools((prev) => ({ ...prev, [id]: tools }));
                        setServerResources((prev) => ({ ...prev, [id]: resources }));
                    }
                } catch (err) {
                    LOGGER.warn('Failed to fetch tools/resources', String(err));
                    if (isMountedRef.current) {
                        setError(t('mcp.error_list'));
                        clearError();
                    }
                } finally {
                    if (isMountedRef.current) {
                        setLoadingTools((prev) => ({ ...prev, [id]: false }));
                    }
                }
            }
        },
        [expandedServer, servers, serverTools, clearError, t],
    );

    const filteredServers = (servers ?? []).filter(
        (s) =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.url.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div
            style={{
                color: 'var(--text-main)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                overflowY: 'auto',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    paddingBottom: '1.5rem',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            margin: '0 0 0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            color: 'var(--slate-50)',
                        }}
                    >
                        <Server size={28} color="#a855f7" /> {t('mcp.title')}
                    </h2>
                    <p style={{ color: 'var(--slate-400)', margin: 0, fontSize: '0.85rem' }}>
                        {t('mcp.subtitle')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleReconnectAll}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0.75rem 1.25rem',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: 'var(--accent-tint)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                        }}
                    >
                        <RefreshCw size={18} /> {t('mcp.reconnect_all')}
                    </button>
                    <button
                        onClick={() => setEditingServer({})}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(90deg, #a855f7, #9333ea)',
                            border: 'none',
                            color: 'white',
                            borderRadius: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(168,85,247,0.3)',
                        }}
                    >
                        <Plus size={18} /> {t('mcp.add')}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '0.75rem 1rem',
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 12,
                            color: '#fca5a5',
                            fontSize: '0.9rem',
                        }}
                        role="alert"
                    >
                        <AlertTriangle size={18} /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={{
                                marginLeft: 'auto',
                                background: 'none',
                                border: 'none',
                                color: '#fca5a5',
                                cursor: 'pointer',
                            }}
                            aria-label={t('common.dismiss_error')}
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {stats && (
                <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}
                >
                    {[
                        {
                            label: t('mcp.stats.total'),
                            value: stats.total,
                            color: '#a855f7',
                            icon: <Server size={20} />,
                        },
                        {
                            label: t('mcp.stats.connected'),
                            value: stats.connected,
                            color: 'var(--success)',
                            icon: <Power size={20} />,
                        },
                        {
                            label: t('mcp.stats.disconnected'),
                            value: stats.disconnected,
                            color: 'var(--slate-500)',
                            icon: <PowerOff size={20} />,
                        },
                        {
                            label: t('mcp.stats.errors'),
                            value: stats.error,
                            color: 'var(--error)',
                            icon: <AlertTriangle size={20} />,
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            style={{
                                padding: '1.25rem',
                                borderRadius: 16,
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(255,255,255,0.02)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    marginBottom: '0.5rem',
                                    color: stat.color,
                                }}
                            >
                                {stat.icon}
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        color: 'var(--slate-400)',
                                    }}
                                >
                                    {stat.label}
                                </span>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ position: 'relative', width: '100%', maxWidth: 450 }}>
                <Search
                    size={16}
                    style={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--slate-500)',
                    }}
                />
                <input
                    type="text"
                    placeholder={t('mcp.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.85rem 1rem 0.85rem 2.75rem',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 12,
                        color: 'white',
                        fontSize: '0.9rem',
                        outline: 'none',
                    }}
                />
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                }}
            >
                {filteredServers.length === 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 16,
                            height: '100%',
                            color: 'var(--slate-500)',
                        }}
                    >
                        <Server size={48} style={{ opacity: 0.3 }} />
                        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            {searchQuery ? t('mcp.empty_search') : t('mcp.empty_none')}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                            {t('mcp.empty_desc')}
                        </p>
                    </div>
                ) : (
                    filteredServers.map((server) => (
                        <MCPServerCard
                            key={server.id}
                            server={server}
                            isExpanded={expandedServer === server.id}
                            tools={serverTools[server.id]}
                            resources={serverResources[server.id]}
                            loadingTools={loadingTools[server.id] || false}
                            onToggleExpand={toggleExpand}
                            onConnect={handleConnect}
                            onDisconnect={handleDisconnect}
                            onEdit={setEditingServer}
                            onRemove={handleRemoveServer}
                        />
                    ))
                )}
            </div>

            <MCPEditorModal
                server={editingServer}
                onClose={() => setEditingServer(null)}
                onSaved={() => setServers(mcpService.getServers())}
            />
            <ModuleInfo moduleKey="mcp" />
            <ConfirmDialog />
        </div>
    );
};

export default MCPPanel;
