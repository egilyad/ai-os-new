import React, { useState } from 'react';
import { Clock, RotateCcw, Trash2, Camera, GitCompare } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { timeMachineService } from '../kernel/instances';
import type { SnapshotScope } from '../kernel/contracts/time-machine';

const SCOPES: SnapshotScope[] = ['full', 'config', 'memory', 'keys', 'debates'];

const SCOPE_COLORS: Record<SnapshotScope, string> = {
    full: '#8b5cf6',
    config: '#3b82f6',
    memory: '#10b981',
    keys: '#f59e0b',
    debates: '#ef4444',
};

const TimeMachinePanelContent: React.FC = () => {
    const [snapshots, setSnapshots] = useState(() => timeMachineService.getSnapshots());
    const [showCreate, setShowCreate] = useState(false);
    const [label, setLabel] = useState('');
    const [scope, setScope] = useState<SnapshotScope>('full');
    const [compare, setCompare] = useState<string[]>([]);
    const [diff, setDiff] = useState<{ key: string; before: string; after: string }[] | null>(null);

    const refresh = () => setSnapshots(timeMachineService.getSnapshots());

    const handleCreate = () => {
        if (!label.trim()) return;
        timeMachineService.createSnapshot(label, scope);
        setShowCreate(false);
        setLabel('');
        refresh();
    };

    const handleRestore = (id: string) => {
        timeMachineService.restoreSnapshot(id);
        refresh();
    };

    const handleDelete = (id: string) => {
        timeMachineService.deleteSnapshot(id);
        refresh();
    };

    const toggleCompare = (id: string) => {
        setCompare((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : prev.length < 2
                  ? [...prev, id]
                  : ([prev[1]!, id] as string[]),
        );
    };

    const handleCompare = () => {
        if (compare.length !== 2) return;
        setDiff(timeMachineService.compareSnapshots(compare[0]!, compare[1]!));
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
                        <Clock size={20} color="#8b5cf6" /> Time Machine
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)' }}>
                        System snapshots — capture, compare, restore
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {compare.length === 2 && (
                        <button
                            onClick={handleCompare}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 12,
                                background: 'rgba(139,92,246,0.2)',
                                color: 'var(--purple)',
                            }}
                        >
                            <GitCompare size={14} /> Compare
                        </button>
                    )}
                    <button
                        onClick={() => setShowCreate(!showCreate)}
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
                            background: showCreate
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(139,92,246,0.15)',
                            color: showCreate ? '#ef4444' : '#8b5cf6',
                        }}
                    >
                        {showCreate ? <Trash2 size={16} /> : <Camera size={16} />}
                        {showCreate ? 'Cancel' : 'Snapshot'}
                    </button>
                </div>
            </div>

            {showCreate && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="Snapshot label..."
                        style={{
                            width: '100%',
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'var(--slate-900)',
                            color: 'var(--slate-200)',
                            fontSize: 13,
                            outline: 'none',
                            marginBottom: 12,
                        }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        {SCOPES.map((s) => (
                            <button
                                key={s}
                                onClick={() => setScope(s)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    background:
                                        scope === s
                                            ? `${SCOPE_COLORS[s]}30`
                                            : 'rgba(255,255,255,0.05)',
                                    color: scope === s ? SCOPE_COLORS[s] : '#94a3b8',
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={!label.trim()}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            background: 'rgba(139,92,246,0.2)',
                            color: 'var(--purple)',
                            fontSize: 13,
                            fontWeight: 600,
                            opacity: label.trim() ? 1 : 0.5,
                        }}
                    >
                        <Camera size={14} /> Capture
                    </button>
                </div>
            )}

            {diff && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 12,
                        border: '1px solid rgba(139,92,246,0.2)',
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 8,
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--slate-200)' }}>
                            Comparison
                        </h3>
                        <button
                            onClick={() => {
                                setDiff(null);
                                setCompare([]);
                            }}
                            style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 10,
                                background: 'rgba(239,68,68,0.15)',
                                color: 'var(--error)',
                            }}
                        >
                            Close
                        </button>
                    </div>
                    {diff.map((d) => (
                        <div
                            key={d.key}
                            style={{
                                padding: '6px 8px',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                fontSize: 11,
                            }}
                        >
                            <div style={{ fontWeight: 600, color: 'var(--slate-400)', marginBottom: 2 }}>
                                {d.key}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <span style={{ color: 'var(--success)' }}>{d.before}</span>
                                <span style={{ color: 'var(--slate-600)' }}>→</span>
                                <span style={{ color: 'var(--accent)' }}>{d.after}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {snapshots.map((s) => (
                    <div
                        key={s.id}
                        style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            background: compare.includes(s.id)
                                ? 'rgba(139,92,246,0.06)'
                                : '#0f172a',
                            border: `1px solid ${compare.includes(s.id) ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.04)'}`,
                            cursor: 'pointer',
                        }}
                        onClick={() => toggleCompare(s.id)}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 4,
                                    }}
                                >
                                    <span
                                        style={{ fontWeight: 600, fontSize: 14, color: 'var(--slate-200)' }}
                                    >
                                        {s.label}
                                    </span>
                                    <span
                                        style={{
                                            padding: '2px 6px',
                                            borderRadius: 4,
                                            fontSize: 10,
                                            fontWeight: 600,
                                            textTransform: 'capitalize',
                                            background: `${SCOPE_COLORS[s.scope]}20`,
                                            color: SCOPE_COLORS[s.scope],
                                        }}
                                    >
                                        {s.scope}
                                    </span>
                                    {compare.includes(s.id) && (
                                        <span style={{ fontSize: 10, color: 'var(--purple)' }}>
                                            Selected
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: 'var(--slate-600)',
                                        display: 'flex',
                                        gap: 12,
                                    }}
                                >
                                    <span>{(s.size / 1024).toFixed(1)}KB</span>
                                    <span>{new Date(s.timestamp).toLocaleString()}</span>
                                </div>
                                {s.changes.length > 0 && (
                                    <div style={{ marginTop: 4, fontSize: 11, color: 'var(--slate-500)' }}>
                                        {s.changes.slice(0, 2).map((c, i) => (
                                            <div key={`${s.timestamp}-${i}`}>• {c}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div
                                style={{ display: 'flex', gap: 4 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => handleRestore(s.id)}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 10,
                                        background: 'rgba(16,185,129,0.15)',
                                        color: 'var(--success)',
                                    }}
                                >
                                    <RotateCcw size={10} /> Restore
                                </button>
                                <button
                                    onClick={() => handleDelete(s.id)}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 10,
                                        background: 'rgba(239,68,68,0.15)',
                                        color: 'var(--error)',
                                    }}
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TimeMachinePanel: React.FC = () => (
    <PanelLoader name="Time Machine">
        <TimeMachinePanelContent />
    </PanelLoader>
);

export default TimeMachinePanel;
