import React, { useState, useEffect, useCallback } from 'react';
import { List, Play, RefreshCw, FileText } from 'lucide-react';
import type { WorkflowManifest, WorkflowStatus } from '../../kernel/types/builder-types';
import { builderAgent } from '../../kernel/instances/services-extras';

const STATUS_COLORS: Record<WorkflowStatus, string> = {
    draft: '#94a3b8',
    validated: '#f59e0b',
    compiled: '#3b82f6',
    deployed: '#10b981',
    deprecated: '#ef4444',
};

interface WorkflowListPanelProps {
    onLoadManifest: (manifest: WorkflowManifest) => void;
    onDeploy: (flowId: string) => void;
}

const WorkflowListPanel: React.FC<WorkflowListPanelProps> = ({ onLoadManifest, onDeploy }) => {
    const [flows, setFlows] = useState<WorkflowManifest[]>([]);
    const [loading, setLoading] = useState(false);

    const loadFlows = useCallback(async () => {
        setLoading(true);
        try {
            const list = await builderAgent.listFlows();
            setFlows(list);
        } catch {
            // service not available yet
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadFlows();
    }, [loadFlows]);

    return (
        <div
            style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                    }}
                >
                    <List size={16} color="#3b82f6" aria-hidden="true" />
                    Saved Workflows
                </div>
                <button
                    onClick={loadFlows}
                    disabled={loading}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        padding: 4,
                    }}
                    aria-label="Refresh workflows"
                >
                    <RefreshCw
                        size={14}
                        className={loading ? 'animate-spin' : ''}
                        aria-hidden="true"
                    />
                </button>
            </div>
            {flows.length === 0 ? (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--slate-500)', textAlign: 'center' }}>
                    No saved workflows. Use the AI generator or save from the canvas.
                </p>
            ) : (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        maxHeight: 200,
                        overflowY: 'auto',
                    }}
                >
                    {flows.map((flow) => (
                        <div
                            key={flow.workflow_id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    flex: 1,
                                    minWidth: 0,
                                }}
                            >
                                <FileText size={14} color="#64748b" aria-hidden="true" />
                                <div style={{ minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            color: 'var(--slate-200)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {flow.title}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                        {flow.nodes.length} nodes ·{' '}
                                        <span style={{ color: STATUS_COLORS[flow.status] }}>
                                            {flow.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                    onClick={() => onLoadManifest(flow)}
                                    style={{
                                        background: 'none',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'var(--slate-400)',
                                        cursor: 'pointer',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontSize: '0.7rem',
                                    }}
                                    aria-label={`Load ${flow.title}`}
                                >
                                    Load
                                </button>
                                {flow.status !== 'deployed' && (
                                    <button
                                        onClick={() => onDeploy(flow.workflow_id)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid rgba(16,185,129,0.3)',
                                            color: 'var(--success)',
                                            cursor: 'pointer',
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: '0.7rem',
                                        }}
                                        aria-label={`Deploy ${flow.title}`}
                                    >
                                        <Play size={10} aria-hidden="true" /> Deploy
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkflowListPanel;
