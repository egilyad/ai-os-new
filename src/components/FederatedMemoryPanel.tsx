/**
 * Cognitive-aux / research panel (Experimental).
 * Federated memory — research-grade, not production surface (P1.21).
 */
import React, { useState } from 'react';
import { Server, Wifi, WifiOff, RefreshCw, Clock, Activity, Plus, X } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { federatedMemoryService } from '../kernel/instances';
import type {
    FederatedNode,
    FederationConfig,
    FederationRole,
} from '../kernel/contracts/federated-memory';

const STATUS_ICONS: Record<string, React.ReactNode> = {
    connected: <Wifi size={14} color="#10b981" />,
    syncing: <Activity size={14} color="#f59e0b" />,
    disconnected: <WifiOff size={14} color="#64748b" />,
    error: <WifiOff size={14} color="#ef4444" />,
};

const ROLE_COLORS: Record<string, string> = {
    hub: '#8b5cf6',
    node: '#3b82f6',
    peer: '#10b981',
};

const FederatedMemoryPanelContent: React.FC = () => {
    const [config, setConfig] = useState<FederationConfig>(() =>
        federatedMemoryService.getConfig(),
    );
    const [nodes, setNodes] = useState<FederatedNode[]>(() => federatedMemoryService.getNodes());
    const [syncHistory, setSyncHistory] = useState(() => federatedMemoryService.getSyncHistory());
    const [syncing, setSyncing] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [nodeId, setNodeId] = useState('');
    const [nodeName, setNodeName] = useState('');
    const [nodeEndpoint, setNodeEndpoint] = useState('');
    const [nodeRole, setNodeRole] = useState<FederationRole>('peer');

    const refresh = () => {
        setConfig(federatedMemoryService.getConfig());
        setNodes(federatedMemoryService.getNodes());
        setSyncHistory(federatedMemoryService.getSyncHistory());
    };

    const handleSyncAll = async () => {
        setSyncing(true);
        await federatedMemoryService.syncAll();
        refresh();
        setSyncing(false);
    };

    const handleSyncNode = async (id: string) => {
        setSyncing(true);
        await federatedMemoryService.syncNode(id);
        refresh();
        setSyncing(false);
    };

    const handleDisconnect = (id: string) => {
        federatedMemoryService.disconnectNode(id);
        refresh();
    };

    const handleAddNode = () => {
        if (!nodeId.trim() || !nodeName.trim() || !nodeEndpoint.trim()) return;
        federatedMemoryService.connectNode(nodeId, nodeName, nodeEndpoint, nodeRole);
        setShowAdd(false);
        setNodeId('');
        setNodeName('');
        setNodeEndpoint('');
        setNodeRole('peer');
        refresh();
    };

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: '0 0 4px',
                            fontSize: 18,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Server size={20} color="#3b82f6" /> Federated Memory
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)' }}>
                        Distributed memory synchronization across nodes
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setShowAdd(!showAdd)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            background: showAdd ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                            color: showAdd ? '#ef4444' : '#3b82f6',
                        }}
                    >
                        {showAdd ? <X size={16} /> : <Plus size={16} />}
                        {showAdd ? 'Cancel' : 'Add Node'}
                    </button>
                    <button
                        onClick={handleSyncAll}
                        disabled={syncing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            background: 'rgba(16,185,129,0.15)',
                            color: 'var(--success)',
                            opacity: syncing ? 0.6 : 1,
                        }}
                    >
                        <RefreshCw size={16} className={syncing ? 'spin' : ''} /> Sync All
                    </button>
                </div>
            </div>

            {showAdd && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <input
                            value={nodeId}
                            onChange={(e) => setNodeId(e.target.value)}
                            placeholder="Node ID..."
                            style={{
                                flex: 1,
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                        <input
                            value={nodeName}
                            onChange={(e) => setNodeName(e.target.value)}
                            placeholder="Display Name..."
                            style={{
                                flex: 1,
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                        <input
                            value={nodeEndpoint}
                            onChange={(e) => setNodeEndpoint(e.target.value)}
                            placeholder="https://..."
                            style={{
                                flex: 2,
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                        <select
                            value={nodeRole}
                            onChange={(e) => setNodeRole(e.target.value as FederationRole)}
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        >
                            <option value="hub">Hub</option>
                            <option value="node">Node</option>
                            <option value="peer">Peer</option>
                        </select>
                    </div>
                    <button
                        onClick={handleAddNode}
                        disabled={!nodeId.trim() || !nodeName.trim() || !nodeEndpoint.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            background: 'rgba(59,130,246,0.2)',
                            color: 'var(--accent)',
                            fontSize: 13,
                            fontWeight: 600,
                            opacity:
                                nodeId.trim() && nodeName.trim() && nodeEndpoint.trim() ? 1 : 0.5,
                        }}
                    >
                        <Plus size={14} /> Connect
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Nodes ({nodes.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {nodes.map((n) => (
                            <div
                                key={n.id}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    background: 'var(--slate-900)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 4,
                                    }}
                                >
                                    {STATUS_ICONS[n.status] || (
                                        <WifiOff size={14} color="#64748b" />
                                    )}
                                    <span
                                        style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-200)' }}
                                    >
                                        {n.name}
                                    </span>
                                    <span
                                        style={{
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            background: `${ROLE_COLORS[n.role]}20`,
                                            color: ROLE_COLORS[n.role],
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {n.role}
                                    </span>
                                    <span
                                        style={{
                                            marginLeft: 'auto',
                                            fontSize: 10,
                                            color: n.status === 'connected' ? '#10b981' : '#64748b',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {n.status}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--slate-600)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <span>
                                        {n.id} · {n.endpoint}
                                    </span>
                                    <span>
                                        {n.syncedMemories}/{n.totalMemories} memories
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: 10,
                                        color: 'var(--slate-600)',
                                        marginTop: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={10} />{' '}
                                        {Math.round((Date.now() - n.lastSync) / 60000)}m ago
                                    </span>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button
                                            onClick={() => handleSyncNode(n.id)}
                                            disabled={n.status !== 'connected'}
                                            style={{
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                border: 'none',
                                                cursor:
                                                    n.status === 'connected'
                                                        ? 'pointer'
                                                        : 'not-allowed',
                                                fontSize: 10,
                                                background: 'rgba(16,185,129,0.15)',
                                                color:
                                                    n.status === 'connected'
                                                        ? '#10b981'
                                                        : '#475569',
                                            }}
                                        >
                                            Sync
                                        </button>
                                        <button
                                            onClick={() => handleDisconnect(n.id)}
                                            disabled={n.status === 'disconnected'}
                                            style={{
                                                padding: '2px 6px',
                                                borderRadius: 4,
                                                border: 'none',
                                                cursor:
                                                    n.status !== 'disconnected'
                                                        ? 'pointer'
                                                        : 'not-allowed',
                                                fontSize: 10,
                                                background: 'rgba(239,68,68,0.15)',
                                                color:
                                                    n.status !== 'disconnected'
                                                        ? '#ef4444'
                                                        : '#475569',
                                            }}
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <h3
                            style={{
                                margin: '0 0 8px',
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'var(--slate-200)',
                            }}
                        >
                            Config
                        </h3>
                        <div
                            style={{
                                padding: '10px 12px',
                                borderRadius: 8,
                                background: 'var(--slate-900)',
                                border: '1px solid rgba(255,255,255,0.04)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: 12,
                                    color: 'var(--slate-400)',
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: 8,
                                }}
                            >
                                <span>
                                    Role:{' '}
                                    <strong style={{ color: ROLE_COLORS[config.role] }}>
                                        {config.role}
                                    </strong>
                                </span>
                                <span>Sync: {config.syncInterval / 1000}s</span>
                                <span>Encryption: {config.encryptionEnabled ? '🟢' : '🔴'}</span>
                                <span>
                                    Payload: {(config.maxPayloadSize / 1024 / 1024).toFixed(1)}MB
                                </span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--slate-600)', marginTop: 6 }}>
                                Peers: {config.allowedPeers.join(', ')}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Sync History ({syncHistory.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {syncHistory.map((s) => (
                            <div
                                key={s.id}
                                style={{
                                    padding: '8px 10px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    background: 'var(--slate-900)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                    borderLeft: `3px solid ${s.status === 'completed' ? '#10b981' : s.status === 'in_progress' ? '#f59e0b' : '#ef4444'}`,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        marginBottom: 2,
                                    }}
                                >
                                    <span style={{ color: 'var(--slate-400)', fontWeight: 600 }}>
                                        {s.peerNodeId}
                                    </span>
                                    <span style={{ color: 'var(--slate-500)', textTransform: 'capitalize' }}>
                                        {s.direction}
                                    </span>
                                </div>
                                <div style={{ color: 'var(--slate-500)' }}>
                                    {s.memoriesTransferred} memories · {s.status}
                                </div>
                                <div style={{ marginTop: 2, color: 'var(--slate-600)' }}>
                                    {new Date(s.startedAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const FederatedMemoryPanel: React.FC = () => (
    <PanelLoader name="Federated Memory">
        <FederatedMemoryPanelContent />
    </PanelLoader>
);

export default FederatedMemoryPanel;
