import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThumbsUp, ThumbsDown, Minus, Lightbulb, RefreshCcw } from 'lucide-react';
import { kernel, keyService, adapterRegistry } from '../kernel/instances';
import type { ProviderRanking } from '../kernel/types/interfaces';
import { usePolling } from './Common/usePolling';
import PanelLoader from './PanelLoader';
import {
    glassPanel,
    glassPanelPad15r,
    flexBetween,
    emptyState,
    emptyStateTitle,
    emptyStateSubtitle,
} from '../styles/common';
import { eventBus } from '../kernel/instances';
import { EVENTS } from '../kernel/events/event-names';
import { PROVIDER_META } from './AddKeyModal/add-key-constants';

interface Suggestion {
    provider: string;
    reason: string;
    matchScore: number;
}

const REC_BADGES = {
    recommended: { label: 'Recommended', color: 'var(--success)', icon: <ThumbsUp size={12} /> },
    good: { label: 'Good', color: 'var(--accent)', icon: <Minus size={12} /> },
    fair: { label: 'Fair', color: 'var(--warning)', icon: <ThumbsDown size={12} /> },
    avoid: { label: 'Avoid', color: 'var(--error)', icon: <ThumbsDown size={12} /> },
} as const;

const ProviderMarketplace: React.FC = () => {
    const [rankings, setRankings] = useState<ProviderRanking[]>([]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [error, setError] = useState<string | null>(null);

    const catalog = useMemo(() => adapterRegistry.getAllProviders(), []);
    const [keyVersion, setKeyVersion] = useState(0);
    useEffect(() => {
        const unsubs = [
            eventBus.on(EVENTS.KEY_ADDED, () => setKeyVersion((v) => v + 1)),
            eventBus.on(EVENTS.KEY_REMOVED, () => setKeyVersion((v) => v + 1)),
            eventBus.on(EVENTS.KEY_UPDATED, () => setKeyVersion((v) => v + 1)),
        ];
        return () => unsubs.forEach((u) => u());
    }, []);
    const installed = useMemo(() => {
        void keyVersion;
        return [...new Set(keyService.getKeys().map((k) => k.provider.toLowerCase()))];
    }, [keyVersion]);

    const refresh = useCallback(() => {
        try {
            setRankings(kernel.getProviderRankings(catalog));
            setSuggestions(kernel.getCollaborativeSuggestions(installed));
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load marketplace');
        }
    }, [catalog, installed]);

    useEffect(() => {
        const unsub = eventBus.on(EVENTS.KERNEL_UPDATED, refresh);
        return () => unsub();
    }, [refresh]);

    usePolling(refresh, 15000);

    const getScoreColor = (s: number) =>
        s > 0.8 ? '#10b981' : s > 0.6 ? '#3b82f6' : s > 0.3 ? '#f59e0b' : '#ef4444';

    const getMeta = (provider: string) => {
        const key = provider.charAt(0).toUpperCase() + provider.slice(1);
        const alias: Record<string, string> = {
            openai: 'OpenAI',
            nvidia: 'NVIDIA',
            huggingface: 'HuggingFace',
            blackbox: 'Custom',
            scaleway: 'Custom',
            cometapi: 'Custom',
            github: 'Custom',
            ollama: 'Custom',
            lmstudio: 'Custom',
        };
        const metaKey = alias[provider] || key;
        return PROVIDER_META[metaKey];
    };

    if (rankings.length === 0 && catalog.length === 0) {
        return (
            <PanelLoader title="Provider Marketplace">
                <div style={error ? { ...emptyState, color: 'var(--error)' } : emptyState}>
                    {error ? (
                        <>
                            <p style={emptyStateTitle}>Failed to load marketplace</p>
                            <p style={emptyStateSubtitle}>{error}</p>
                        </>
                    ) : (
                        <>
                            <p style={emptyStateTitle}>No providers available</p>
                            <p style={emptyStateSubtitle}>The provider catalog is empty.</p>
                        </>
                    )}
                </div>
            </PanelLoader>
        );
    }

    return (
        <PanelLoader title="Provider Marketplace">
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    padding: 16,
                    height: '100%',
                    overflow: 'auto',
                }}
            >
                <div style={{ ...flexBetween }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                        Rankings from live metrics · {installed.length} installed
                    </span>
                    <button
                        type="button"
                        onClick={refresh}
                        style={{
                            background: 'rgba(59,130,246,0.12)',
                            border: '1px solid rgba(59,130,246,0.25)',
                            borderRadius: 8,
                            padding: '0.35rem 0.65rem',
                            color: '#93c5fd',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: 12,
                        }}
                    >
                        <RefreshCcw size={14} /> Refresh
                    </button>
                </div>

                {suggestions.length > 0 && (
                    <div className="glass-panel" style={{ ...glassPanelPad15r }}>
                        <div style={{ ...flexBetween, marginBottom: 8 }}>
                            <span
                                style={{ fontSize: '0.85rem', color: 'var(--slate-200)', fontWeight: 600 }}
                            >
                                Suggestions
                            </span>
                            <Lightbulb size={16} style={{ color: 'var(--warning)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {suggestions.slice(0, 5).map((s) => {
                                const meta = getMeta(s.provider);
                                return (
                                    <div
                                        key={s.provider}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            fontSize: 12,
                                            color: '#e4e4e7',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                color: 'var(--warning)',
                                                minWidth: 80,
                                            }}
                                        >
                                            {meta?.name || s.provider}
                                        </span>
                                        <span style={{ color: '#a1a1aa', flex: 1 }}>
                                            {s.reason}
                                        </span>
                                        <span style={{ fontSize: 11, color: '#71717a' }}>
                                            {(s.matchScore * 100).toFixed(0)}% match
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: 12,
                    }}
                >
                    {rankings.map((r) => {
                        const badge = REC_BADGES[r.recommendation];
                        const meta = getMeta(r.provider);
                        return (
                            <div
                                key={r.provider}
                                className="glass-panel"
                                style={{
                                    ...glassPanel,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                }}
                            >
                                <div style={flexBetween}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontWeight: 700,
                                                color: '#e4e4e7',
                                                fontSize: 14,
                                            }}
                                        >
                                            {meta?.name || r.provider}
                                        </span>
                                        {r.installed && (
                                            <span
                                                style={{
                                                    padding: '0.1rem 0.35rem',
                                                    borderRadius: 999,
                                                    fontSize: '0.6rem',
                                                    background: 'rgba(34,197,94,0.15)',
                                                    color: 'var(--success)',
                                                }}
                                            >
                                                Installed
                                            </span>
                                        )}
                                        <span
                                            style={{
                                                padding: '0.1rem 0.4rem',
                                                borderRadius: 999,
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                background: `${badge.color}20`,
                                                color: badge.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 3,
                                            }}
                                        >
                                            {badge.icon} {badge.label}
                                        </span>
                                    </div>
                                    <span
                                        style={{
                                            fontSize: 20,
                                            fontWeight: 700,
                                            color: getScoreColor(r.score),
                                        }}
                                    >
                                        {(r.score * 100).toFixed(0)}
                                    </span>
                                </div>

                                <div style={{ fontSize: 11, color: '#71717a', lineHeight: 1.4 }}>
                                    {meta?.desc || ''}
                                </div>

                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 4,
                                        fontSize: 11,
                                        color: '#a1a1aa',
                                    }}
                                >
                                    <span>
                                        Reliability:{' '}
                                        <strong style={{ color: '#e4e4e7' }}>
                                            {(r.reliability * 100).toFixed(0)}%
                                        </strong>
                                    </span>
                                    <span>
                                        Latency:{' '}
                                        <strong style={{ color: '#e4e4e7' }}>
                                            {r.avgLatency.toFixed(0)}ms
                                        </strong>
                                    </span>
                                    <span>
                                        Requests:{' '}
                                        <strong style={{ color: '#e4e4e7' }}>{r.requests}</strong>
                                    </span>
                                    <span>
                                        Cost/req:{' '}
                                        <strong style={{ color: '#e4e4e7' }}>
                                            ${r.costPerRequest.toFixed(4)}
                                        </strong>
                                    </span>
                                </div>

                                <div
                                    style={{
                                        height: 4,
                                        borderRadius: 2,
                                        background: 'rgba(255,255,255,0.06)',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            width: `${Math.min(100, r.score * 100)}%`,
                                            background: getScoreColor(r.score),
                                            borderRadius: 2,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {rankings.length === 0 && (
                    <div
                        className="glass-panel"
                        style={{
                            ...glassPanelPad15r,
                            textAlign: 'center',
                            color: 'var(--slate-500)',
                            fontSize: 13,
                        }}
                    >
                        No provider metrics yet. Start using providers to see rankings.
                    </div>
                )}
            </div>
        </PanelLoader>
    );
};

export default ProviderMarketplace;
