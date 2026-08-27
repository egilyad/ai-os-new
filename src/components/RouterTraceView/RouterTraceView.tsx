import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { GitBranch, Activity, Search } from 'lucide-react';
import ProviderIcon from '../ProviderIcon/ProviderIcon';
import { eventBus } from '../../kernel/instances';
import type { DecisionPayload } from '../../kernel/events';
import { ClassificationBadge, providerColor } from './router-trace-components';
import DecisionDetail from './DecisionDetail';
import {
    cardHeaderRow,
    feedItemDefault,
    flexCenterSmGap,
    flexColGap1,
    liveFeedPanel,
    searchInputCompact,
    tagSmall,
} from '../../styles/common';
import { useTranslation } from '../../i18n/useTranslation';

const STRATEGY_LABELS: Record<string, string> = {
    broadcast: 'router_trace.strategy.broadcast',
    performance: 'router_trace.strategy.performance',
    reliability: 'router_trace.strategy.reliability',
    latency: 'router_trace.strategy.latency',
    auto: 'router_trace.strategy.auto',
    race: 'router_trace.strategy.race',
    cost: 'router_trace.strategy.cost',
    free_first: 'router_trace.strategy.free_first',
};

const RouterTraceView: React.FC = () => {
    const { t } = useTranslation();
    const [decisions, setDecisions] = useState<DecisionPayload[]>([]);
    const [selected, setSelected] = useState<DecisionPayload | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const unsub = eventBus.onSafe<DecisionPayload>('system:decision', (d) => {
            setDecisions((prev) => [d, ...prev].slice(0, 100));
        });
        return unsub;
    }, []);

    const filteredDecisions = useMemo(() => {
        if (!searchQuery.trim()) return decisions;
        const q = searchQuery.toLowerCase();
        return decisions.filter(
            (d) =>
                d.selected?.toLowerCase().includes(q) ||
                d.strategy?.toLowerCase().includes(q) ||
                d.requestId?.toLowerCase().includes(q),
        );
    }, [decisions, searchQuery]);

    const handleSelect = useCallback((d: DecisionPayload) => {
        setSelected((prev) => (prev?.requestId === d.requestId ? null : d));
    }, []);

    return (
        <div
            style={{
                padding: '2rem',
                maxWidth: 1400,
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <GitBranch size={24} style={{ color: 'var(--purple)' }} />
                        <div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                                {t('router_trace.title')}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                                {t('router_trace.subtitle')}
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ position: 'relative', width: 220 }}>
                    <Search
                        size={12}
                        style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }}
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('router_trace.search_placeholder')}
                        aria-label={t('router_trace.search_aria')}
                        style={searchInputCompact}
                    />
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: selected ? '380px 1fr' : '1fr',
                    gap: '1.5rem',
                    alignItems: 'start',
                }}
            >
                <div className="glass-panel" style={liveFeedPanel}>
                    <div style={cardHeaderRow}>
                        <Activity size={16} style={{ color: '#a855f7' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            {t('router_trace.live_decisions')}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)', marginLeft: 'auto' }}>
                            {filteredDecisions.length}
                        </span>
                    </div>
                    {filteredDecisions.length > 0 ? (
                        <div style={flexColGap1}>
                            {filteredDecisions.map((d, i) => {
                                const isSelected = selected?.requestId === d.requestId;
                                const topScore = d.scores[0];
                                return (
                                    <div
                                        key={`${d.requestId}-${i}`}
                                        onClick={() => handleSelect(d)}
                                        style={{
                                            ...feedItemDefault,
                                            background: isSelected
                                                ? 'rgba(139,92,246,0.1)'
                                                : 'rgba(0,0,0,0.12)',
                                            border: `1px solid ${isSelected ? 'rgba(139,92,246,0.3)' : 'transparent'}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginBottom: '0.25rem',
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: '0.6rem',
                                                    color: 'var(--slate-500)',
                                                    fontFamily: 'monospace',
                                                }}
                                            >
                                                {new Date(d.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span
                                                style={{
                                                    ...tagSmall,
                                                    background: 'var(--purple-tint)',
                                                    color: '#a855f7',
                                                }}
                                            >
                                                {t(STRATEGY_LABELS[d.strategy] || d.strategy)}
                                            </span>
                                            {d.profile && d.profile !== 'default' && (
                                                <span
                                                    style={{
                                                        fontSize: '0.55rem',
                                                        padding: '0.1rem 0.35rem',
                                                        borderRadius: 3,
                                                        background: 'rgba(245,158,11,0.15)',
                                                        color: 'var(--warning)',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    {d.profile}
                                                </span>
                                            )}
                                            {d.isExperiment && (
                                                <span
                                                    style={{
                                                        fontSize: '0.55rem',
                                                        padding: '0.1rem 0.35rem',
                                                        borderRadius: 3,
                                                        background: 'rgba(239,68,68,0.15)',
                                                        color: 'var(--error)',
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    A/B
                                                </span>
                                            )}
                                        </div>
                                        <div style={flexCenterSmGap}>
                                            {topScore && (
                                                <ProviderIcon provider={d.selected} size={14} />
                                            )}
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: providerColor(d.selected),
                                                    fontWeight: 700,
                                                }}
                                            >
                                                {d.selected}
                                            </span>
                                            {topScore && (
                                                <span
                                                    style={{
                                                        fontSize: '0.6rem',
                                                        color: 'var(--slate-500)',
                                                        marginLeft: 'auto',
                                                    }}
                                                >
                                                    score {topScore.s}
                                                </span>
                                            )}
                                        </div>
                                        {d.classification && (
                                            <div style={{ marginTop: '0.25rem' }}>
                                                <ClassificationBadge cls={d.classification} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '2rem',
                                color: 'var(--slate-500)',
                                fontSize: '0.8rem',
                            }}
                        >
                            {t('router_trace.empty')}
                        </div>
                    )}
                </div>

                {selected && <DecisionDetail decision={selected} />}
            </div>
        </div>
    );
};

export default RouterTraceView;
