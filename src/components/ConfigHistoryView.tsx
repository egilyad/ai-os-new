import React, { useEffect, useState } from 'react';
import { History, RotateCcw, Activity, Camera, Clock, AlertTriangle } from 'lucide-react';
import { snapshotService } from '../kernel/instances';
import { eventBus, EVENTS } from '../kernel/instances';
import type { SystemSnapshot } from '../kernel/instances';

const ConfigHistoryView: React.FC = () => {
    const [snapshots, setSnapshots] = useState<SystemSnapshot[]>([]);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [restoreError, setRestoreError] = useState<string | null>(null);

    useEffect(() => {
        const refresh = () => {
            setSnapshots(snapshotService.getRecent(50) ?? []);
            setRestoreError(null);
        };
        refresh();
        const unsub = eventBus.on(EVENTS.SNAPSHOT_CAPTURED, refresh);
        return () => {
            unsub();
        };
    }, []);

    const handleRestore = async (id: string) => {
        setRestoring(id);
        try {
            const ok = snapshotService.restoreById(id);
            if (ok) {
                setRestoreError(null);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Config restored to snapshot',
                    type: 'success',
                });
            } else {
                setRestoreError('Failed to restore snapshot');
            }
        } catch (e) {
            setRestoreError(e instanceof Error ? e.message : 'Failed to restore snapshot');
        } finally {
            setRestoring(null);
        }
    };

    const handleCaptureNow = () => {
        snapshotService.capture(
            'manual',
            'manual',
            `Manual snapshot ${new Date().toLocaleString()}`,
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <History size={20} color="#f59e0b" />
                    <h2
                        style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-50)' }}
                    >
                        Config History & Rollback
                    </h2>
                    <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                        ({snapshots.length} snapshots)
                    </span>
                </div>
                <button
                    onClick={handleCaptureNow}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        border: '1px solid rgba(245,158,11,0.3)',
                        background: 'var(--warning-tint)',
                        color: 'var(--warning)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Camera size={14} /> Snapshot Now
                </button>
            </div>

            {restoreError && (
                <div
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        background: 'var(--error-tint)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#fca5a5',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <AlertTriangle size={14} /> {restoreError}
                </div>
            )}

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                }}
            >
                {snapshots.length > 0 ? (
                    snapshots.map((s) => (
                        <div
                            key={s.id}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: 10,
                                background:
                                    restoring === s.id
                                        ? 'rgba(245,158,11,0.1)'
                                        : 'rgba(0,0,0,0.15)',
                                border: `1px solid ${restoring === s.id ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.03)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div
                                style={{
                                    padding: '0.4rem',
                                    borderRadius: 8,
                                    background: 'var(--warning-tint)',
                                    color: 'var(--warning)',
                                    display: 'flex',
                                    flexShrink: 0,
                                }}
                            >
                                <Clock size={16} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        color: 'var(--slate-200)',
                                    }}
                                >
                                    {s.label || `Snapshot ${s.id}`}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                        marginTop: '0.15rem',
                                        fontFamily: 'monospace',
                                    }}
                                >
                                    {new Date(s.timestamp).toLocaleString()} · {s.traceId} ·{' '}
                                    {s.stepId}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        marginTop: '0.1rem',
                                    }}
                                >
                                    {Object.keys(s.runtime.kernel.providers || {}).length} providers
                                    · {s.runtime.kernel.totalRequests} requests · $
                                    {s.runtime.kernel.estimatedCost.toFixed(4)} cost
                                </div>
                            </div>
                            <button
                                onClick={() => handleRestore(s.id)}
                                disabled={restoring === s.id}
                                style={{
                                    padding: '0.5rem 0.8rem',
                                    borderRadius: 8,
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    background:
                                        restoring === s.id
                                            ? 'rgba(245,158,11,0.2)'
                                            : 'rgba(245,158,11,0.1)',
                                    color: 'var(--warning)',
                                    cursor: restoring === s.id ? 'default' : 'pointer',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    opacity: restoring === s.id ? 0.6 : 1,
                                    flexShrink: 0,
                                }}
                            >
                                <RotateCcw
                                    size={12}
                                    className={restoring === s.id ? 'animate-spin' : ''}
                                />
                                {restoring === s.id ? 'Restoring...' : 'Rollback'}
                            </button>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                        <Activity size={32} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                            No Config History
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>
                            Snapshots are captured automatically during topology changes. Click
                            "Snapshot Now" to capture the current state.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfigHistoryView;
