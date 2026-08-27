import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plug, PlugZap, Wrench, Trash2, FileText } from 'lucide-react';
import { getStatusColor } from '../Common/status-vocabulary';
import { useTranslation } from '../../i18n/useTranslation';
import type { MCPServerConfig, MCPTool, MCPResource } from '../../kernel/instances';

interface MCPServerCardProps {
    server: MCPServerConfig;
    isExpanded: boolean;
    tools?: MCPTool[];
    resources?: MCPResource[];
    loadingTools: boolean;
    onToggleExpand: (id: string) => void;
    onConnect: (id: string) => void;
    onDisconnect: (id: string) => void;
    onEdit: (server: MCPServerConfig) => void;
    onRemove: (server: MCPServerConfig) => void;
}

export const MCPServerCard = memo(function MCPServerCard({
    server,
    isExpanded,
    tools,
    resources,
    loadingTools,
    onToggleExpand,
    onConnect,
    onDisconnect,
    onEdit,
    onRemove,
}: MCPServerCardProps) {
    const { t } = useTranslation();
    const statusLabel = (status: string) => {
        switch (status) {
            case 'connected':
                return t('mcp.status.connected');
            case 'disconnected':
                return t('mcp.status.disconnected');
            case 'error':
                return t('mcp.status.error');
            default:
                return t('mcp.status.unknown');
        }
    };

    return (
        <div
            style={{
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                }}
                onClick={() => onToggleExpand(server.id)}
            >
                <div
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: getStatusColor(server.status),
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${getStatusColor(server.status)}`,
                    }}
                />
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {server.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-400)', fontFamily: 'monospace' }}>
                        {server.url}
                    </div>
                </div>
                <div
                    style={{
                        padding: '0.3rem 0.6rem',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: `${getStatusColor(server.status)}15`,
                        border: `1px solid ${getStatusColor(server.status)}30`,
                        color: getStatusColor(server.status),
                    }}
                >
                    {statusLabel(server.status)}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {server.status !== 'connected' ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onConnect(server.id);
                            }}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 8,
                                background: 'var(--success-tint)',
                                border: '1px solid rgba(16,185,129,0.2)',
                                color: 'var(--success)',
                                cursor: 'pointer',
                            }}
                        >
                            <Plug size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDisconnect(server.id);
                            }}
                            style={{
                                padding: '0.5rem',
                                borderRadius: 8,
                                background: 'rgba(100,116,139,0.1)',
                                border: '1px solid rgba(100,116,139,0.2)',
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                            }}
                        >
                            <PlugZap size={16} />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(server);
                        }}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 8,
                            background: 'rgba(59,130,246,0.05)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                        }}
                    >
                        <Wrench size={16} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(server);
                        }}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 8,
                            background: 'rgba(239,68,68,0.05)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: 'var(--error)',
                            cursor: 'pointer',
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            padding: '1.5rem',
                        }}
                    >
                        {server.error && (
                            <div
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: 8,
                                    background: 'var(--error-tint)',
                                    color: '#fca5a5',
                                    fontSize: '0.85rem',
                                    marginBottom: '1rem',
                                }}
                            >
                                {t('mcp.error_prefix')} {server.error}
                            </div>
                        )}
                        {server.lastConnected && (
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--slate-500)',
                                    marginBottom: '1rem',
                                }}
                            >
                                Last connected: {new Date(server.lastConnected).toLocaleString()}
                            </div>
                        )}
                        {loadingTools ? (
                            <div style={{ color: 'var(--slate-400)', fontSize: '0.85rem' }}>
                                {t('mcp.loading_capabilities')}
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '1.5rem',
                                }}
                            >
                                <div>
                                    <h4
                                        style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-50)',
                                            marginBottom: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        <Wrench size={14} color="#3b82f6" /> Tools (
                                        {tools?.length || 0})
                                    </h4>
                                    {tools && tools.length > 0 ? (
                                        tools.map((tool) => (
                                            <div
                                                key={tool.name}
                                                style={{
                                                    padding: '0.75rem',
                                                    borderRadius: 10,
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    marginBottom: '0.5rem',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        color: 'var(--slate-200)',
                                                        marginBottom: '0.25rem',
                                                    }}
                                                >
                                                    {tool.name}
                                                </div>
                                                {tool.description && (
                                                    <div
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--slate-400)',
                                                        }}
                                                    >
                                                        {tool.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div
                                            style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--slate-500)',
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            {t('mcp.no_tools')}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4
                                        style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-50)',
                                            marginBottom: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        <FileText size={14} color="#10b981" /> Resources (
                                        {resources?.length || 0})
                                    </h4>
                                    {resources && resources.length > 0 ? (
                                        resources.map((res) => (
                                            <div
                                                key={res.uri}
                                                style={{
                                                    padding: '0.75rem',
                                                    borderRadius: 10,
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    background: 'rgba(0,0,0,0.2)',
                                                    marginBottom: '0.5rem',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '0.85rem',
                                                        fontWeight: 600,
                                                        color: 'var(--slate-200)',
                                                        marginBottom: '0.25rem',
                                                    }}
                                                >
                                                    {res.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        color: 'var(--slate-500)',
                                                        fontFamily: 'monospace',
                                                    }}
                                                >
                                                    {res.uri}
                                                </div>
                                                {res.description && (
                                                    <div
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--slate-400)',
                                                        }}
                                                    >
                                                        {res.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div
                                            style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--slate-500)',
                                                fontStyle: 'italic',
                                            }}
                                        >
                                            {t('mcp.no_resources')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
});
