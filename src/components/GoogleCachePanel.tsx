import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HardDrive, Trash2, RefreshCw, Plus, Database, DollarSign, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirm } from '../hooks/useConfirm';
import { geminiCacheService } from '../kernel/instances';
import type { CachedContent, FreeTierUsage } from '../kernel/contracts/gemini-cache';
import { textXsMuted, textSecondaryXs, flexBetween } from '../styles/common';

const CARD: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '1rem',
};

const STAT: React.CSSProperties = {
    ...CARD,
    flex: 1,
    minWidth: 140,
};

const INPUT: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '0.5rem 0.75rem',
    color: 'var(--slate-200)',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
};

const BTN: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0.5rem 1rem',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
};

const TABS = ['cached', 'free-tier', 'savings'] as const;
type Tab = (typeof TABS)[number];

const fmt = (ts: number) => {
    const d = Date.now() - ts;
    if (d < 60000) return 'just now';
    if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return `${Math.floor(d / 86400000)}d ago`;
};

function Bar(pct: number): React.CSSProperties {
    return {
        height: '100%',
        borderRadius: 3,
        width: `${Math.min(100, pct)}%`,
        background: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e',
        transition: 'width 0.5s ease',
    };
}

const GoogleCachePanel: React.FC = () => {
    const { confirm, ConfirmDialog } = useConfirm();
    const isMounted = useRef(true);

    const [tab, setTab] = useState<Tab>('cached');
    const [caches, setCaches] = useState<CachedContent[]>([]);
    const [freeTier, setFreeTier] = useState<FreeTierUsage[]>([]);
    const [savings, setSavings] = useState<{ totalSaved: number; cacheHitRate: number }>({
        totalSaved: 0,
        cacheHitRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newPrompt, setNewPrompt] = useState('');
    const [newModel, setNewModel] = useState('gemini-3.1-flash-lite');
    const [newTtl, setNewTtl] = useState('1h');
    const [creating, setCreating] = useState(false);

    const load = useCallback(() => {
        if (!isMounted.current) return;
        setCaches(geminiCacheService.list());
        Promise.resolve(geminiCacheService.getFreeTierUsage())
            .then(setFreeTier)
            .catch(() => {});
        setSavings(geminiCacheService.getEstimatedSavings());
        setLoading(false);
    }, []);

    useEffect(() => {
        isMounted.current = true;
        load();
        return () => {
            isMounted.current = false;
        };
    }, [load]);

    const handleCreate = async () => {
        if (!newPrompt.trim()) return;
        setCreating(true);
        try {
            await geminiCacheService.create({
                systemPrompt: newPrompt.trim(),
                model: newModel,
                ttl: newTtl,
            });
            load();
            setShowCreate(false);
            setNewPrompt('');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (
            !(await confirm({
                title: 'Delete Cached Content',
                message: 'Remove this cached content?',
                variant: 'danger',
            }))
        )
            return;
        geminiCacheService.delete(id);
        load();
    };

    const totalHits = caches.reduce((s, c) => s + c.hits, 0);
    const totalTokens = caches.reduce((s, c) => s + c.sizeTokens, 0);

    if (loading) {
        return (
            <div style={{ padding: '2rem', color: 'var(--slate-500)', textAlign: 'center' }}>
                Loading Google Cache...
            </div>
        );
    }

    return (
        <div style={{ padding: '1.5rem', maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
                <HardDrive size={24} color="#4285F4" />
                <h2 style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>
                    Google Cache & Cost Optimization
                </h2>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem',
                }}
            >
                <div style={STAT}>
                    <div style={{ ...textXsMuted, marginBottom: 4 }}>Cached Contents</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{caches.length}</div>
                </div>
                <div style={STAT}>
                    <div style={{ ...textXsMuted, marginBottom: 4 }}>Cache Hit Rate</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {(savings.cacheHitRate * 100).toFixed(0)}%
                    </div>
                </div>
                <div style={STAT}>
                    <div style={{ ...textXsMuted, marginBottom: 4 }}>Estimated Saved</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        ${savings.totalSaved.toFixed(4)}
                    </div>
                </div>
                <div style={STAT}>
                    <div style={{ ...textXsMuted, marginBottom: 4 }}>Total Tokens Cached</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        {totalTokens.toLocaleString()}
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    paddingBottom: '0.75rem',
                }}
            >
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            ...BTN,
                            background: tab === t ? 'rgba(66,133,244,0.15)' : 'transparent',
                            color: tab === t ? '#4285F4' : '#94a3b8',
                            border:
                                tab === t
                                    ? '1px solid rgba(66,133,244,0.3)'
                                    : '1px solid transparent',
                        }}
                    >
                        {t === 'cached' && <Database size={14} />}
                        {t === 'free-tier' && <TrendingUp size={14} />}
                        {t === 'savings' && <DollarSign size={14} />}
                        {t === 'cached'
                            ? 'Cached Content'
                            : t === 'free-tier'
                              ? 'Free Tier Usage'
                              : 'Estimated Savings'}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                >
                    {tab === 'cached' && (
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <button
                                    onClick={() => setShowCreate(!showCreate)}
                                    style={{
                                        ...BTN,
                                        background: 'rgba(66,133,244,0.15)',
                                        color: '#4285F4',
                                        border: '1px solid rgba(66,133,244,0.3)',
                                    }}
                                >
                                    <Plus size={14} /> New Cached Content
                                </button>
                                <button
                                    onClick={load}
                                    style={{
                                        ...BTN,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--slate-400)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>
                            <AnimatePresence>
                                {showCreate && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ overflow: 'hidden', marginBottom: '1rem' }}
                                    >
                                        <div style={CARD}>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    marginBottom: '0.75rem',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                Create Cached Content
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.75rem',
                                                }}
                                            >
                                                <textarea
                                                    value={newPrompt}
                                                    onChange={(e) => setNewPrompt(e.target.value)}
                                                    placeholder="System prompt to cache..."
                                                    rows={3}
                                                    style={{
                                                        ...INPUT,
                                                        resize: 'vertical',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.8rem',
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div
                                                            style={{
                                                                ...textXsMuted,
                                                                marginBottom: 4,
                                                            }}
                                                        >
                                                            Model
                                                        </div>
                                                        <select
                                                            value={newModel}
                                                            onChange={(e) =>
                                                                setNewModel(e.target.value)
                                                            }
                                                            style={INPUT}
                                                        >
                                                            <option value="gemini-3.1-flash-lite">
                                                                Gemini 3.1 Flash Lite
                                                            </option>
                                                            <option value="gemini-3.1-flash">
                                                                Gemini 3.1 Flash
                                                            </option>
                                                            <option value="gemini-3.1-pro">
                                                                Gemini 3.1 Pro
                                                            </option>
                                                        </select>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div
                                                            style={{
                                                                ...textXsMuted,
                                                                marginBottom: 4,
                                                            }}
                                                        >
                                                            TTL
                                                        </div>
                                                        <select
                                                            value={newTtl}
                                                            onChange={(e) =>
                                                                setNewTtl(e.target.value)
                                                            }
                                                            style={INPUT}
                                                        >
                                                            <option value="30m">30 minutes</option>
                                                            <option value="1h">1 hour</option>
                                                            <option value="2h">2 hours</option>
                                                            <option value="4h">4 hours</option>
                                                            <option value="24h">24 hours</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: '0.5rem',
                                                        justifyContent: 'flex-end',
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => setShowCreate(false)}
                                                        style={{
                                                            ...BTN,
                                                            background: 'transparent',
                                                            color: 'var(--slate-400)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleCreate}
                                                        disabled={creating || !newPrompt.trim()}
                                                        style={{
                                                            ...BTN,
                                                            background: 'rgba(66,133,244,0.2)',
                                                            color: '#4285F4',
                                                            border: '1px solid rgba(66,133,244,0.3)',
                                                            opacity:
                                                                creating || !newPrompt.trim()
                                                                    ? 0.5
                                                                    : 1,
                                                        }}
                                                    >
                                                        {creating ? 'Creating...' : 'Create'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {caches.length === 0 ? (
                                <div
                                    style={{
                                        ...CARD,
                                        textAlign: 'center',
                                        color: 'var(--slate-500)',
                                        padding: '2rem',
                                    }}
                                >
                                    <Database
                                        size={32}
                                        style={{ opacity: 0.3, marginBottom: '0.5rem' }}
                                    />
                                    <div>No cached content yet</div>
                                    <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                                        Create cached content to save costs on repeated system
                                        prompts
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem',
                                    }}
                                >
                                    {caches.map((c) => (
                                        <motion.div
                                            key={c.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            style={CARD}
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
                                                            fontWeight: 600,
                                                            fontSize: '0.9rem',
                                                        }}
                                                    >
                                                        {c.displayName}
                                                    </div>
                                                    <div style={{ ...textXsMuted, marginTop: 2 }}>
                                                        {c.model} · {c.sizeTokens.toLocaleString()}{' '}
                                                        tokens · TTL: {c.ttl}
                                                    </div>
                                                    <div
                                                        style={{ ...textSecondaryXs, marginTop: 2 }}
                                                    >
                                                        Created {fmt(c.createTime)} · Expires{' '}
                                                        {fmt(c.expireTime)} · {c.hits} hits
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    style={{
                                                        ...BTN,
                                                        background: 'var(--error-tint)',
                                                        color: 'var(--error)',
                                                        border: '1px solid rgba(239,68,68,0.2)',
                                                        padding: '0.35rem 0.75rem',
                                                    }}
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'free-tier' && (
                        <div>
                            {freeTier.length === 0 ? (
                                <div
                                    style={{
                                        ...CARD,
                                        textAlign: 'center',
                                        color: 'var(--slate-500)',
                                        padding: '2rem',
                                    }}
                                >
                                    <TrendingUp
                                        size={32}
                                        style={{ opacity: 0.3, marginBottom: '0.5rem' }}
                                    />
                                    <div>No free tier data available</div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                    }}
                                >
                                    {freeTier.map((f) => (
                                        <div key={f.model} style={CARD}>
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    marginBottom: '0.75rem',
                                                }}
                                            >
                                                {f.model}
                                            </div>
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <div style={{ ...flexBetween, marginBottom: 4 }}>
                                                    <span style={textSecondaryXs}>Requests</span>
                                                    <span style={textXsMuted}>
                                                        {f.requestsUsed.toLocaleString()} /{' '}
                                                        {f.requestsLimit.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        background: 'var(--border-subtle)',
                                                        overflow: 'hidden',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <div
                                                        style={Bar(
                                                            (f.requestsUsed / f.requestsLimit) *
                                                                100,
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ ...flexBetween, marginBottom: 4 }}>
                                                    <span style={textSecondaryXs}>Tokens</span>
                                                    <span style={textXsMuted}>
                                                        {f.tokensUsed.toLocaleString()} /{' '}
                                                        {f.tokensLimit.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        background: 'var(--border-subtle)',
                                                        overflow: 'hidden',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <div
                                                        style={Bar(
                                                            (f.tokensUsed / f.tokensLimit) * 100,
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div
                                                style={{ ...textSecondaryXs, marginTop: '0.5rem' }}
                                            >
                                                Resets {fmt(f.resetsAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'savings' && (
                        <div>
                            <div
                                style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    flexWrap: 'wrap',
                                    marginBottom: '1rem',
                                }}
                            >
                                <div style={{ ...STAT, textAlign: 'center' }}>
                                    <div style={{ ...textXsMuted, marginBottom: 4 }}>
                                        Total Saved
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '2rem',
                                            fontWeight: 700,
                                            color: 'var(--success)',
                                        }}
                                    >
                                        ${savings.totalSaved.toFixed(4)}
                                    </div>
                                </div>
                                <div style={{ ...STAT, textAlign: 'center' }}>
                                    <div style={{ ...textXsMuted, marginBottom: 4 }}>
                                        Cache Hit Rate
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '2rem',
                                            fontWeight: 700,
                                            color: '#4285F4',
                                        }}
                                    >
                                        {(savings.cacheHitRate * 100).toFixed(1)}%
                                    </div>
                                </div>
                                <div style={{ ...STAT, textAlign: 'center' }}>
                                    <div style={{ ...textXsMuted, marginBottom: 4 }}>
                                        Hits Saved
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '2rem',
                                            fontWeight: 700,
                                            color: 'var(--warning)',
                                        }}
                                    >
                                        {totalHits}
                                    </div>
                                </div>
                            </div>
                            <div style={CARD}>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        marginBottom: '0.5rem',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    Savings Breakdown
                                </div>
                                {caches.length === 0 ? (
                                    <div style={{ ...textXsMuted }}>
                                        No cached content to calculate savings from
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.5rem',
                                        }}
                                    >
                                        {caches.map((c) => (
                                            <div
                                                key={c.id}
                                                style={{
                                                    ...flexBetween,
                                                    padding: '0.5rem',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        {c.displayName}
                                                    </div>
                                                    <div style={textXsMuted}>
                                                        {c.hits} hits ·{' '}
                                                        {c.sizeTokens.toLocaleString()} tokens
                                                    </div>
                                                </div>
                                                <div style={{ color: 'var(--success)', fontWeight: 600 }}>
                                                    $
                                                    {(
                                                        c.sizeTokens *
                                                        savings.cacheHitRate *
                                                        0.00000125
                                                    ).toFixed(6)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ ...CARD, marginTop: '0.75rem' }}>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        marginBottom: '0.25rem',
                                        fontSize: '0.9rem',
                                    }}
                                >
                                    How Savings Are Calculated
                                </div>
                                <div style={{ ...textSecondaryXs, lineHeight: 1.6 }}>
                                    Estimated savings = cached tokens × cache hit rate × $0.00125/1K
                                    tokens (input cost). Actual savings depend on your usage
                                    patterns and cache hit distribution.
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
            <ConfirmDialog />
        </div>
    );
};

export default GoogleCachePanel;
