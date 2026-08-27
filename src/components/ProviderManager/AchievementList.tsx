import React, { useState } from 'react';
import { Trophy, Award, Zap, Route, Cpu, Star, Shield, Compass, Target } from 'lucide-react';
import type {
    ProviderAchievement,
    AchievementProgress,
} from '../../kernel/contracts/provider-achievements';
import { textXsMuted } from '../../styles/common';

const TIER_COLORS: Record<string, string> = {
    bronze: '#cd7f32',
    silver: '#c0c0c0',
    gold: '#ffd700',
    platinum: '#e5e4e2',
};

const TIER_BG: Record<string, string> = {
    bronze: 'rgba(205,127,50,0.15)',
    silver: 'rgba(192,192,192,0.15)',
    gold: 'rgba(255,215,0,0.15)',
    platinum: 'rgba(229,228,226,0.15)',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    speed: <Zap size={14} />,
    reliability: <Shield size={14} />,
    routing: <Route size={14} />,
    power: <Cpu size={14} />,
    discovery: <Compass size={14} />,
    mastery: <Target size={14} />,
};

const TIER_ICONS: Record<string, React.ReactNode> = {
    bronze: <Award size={16} />,
    silver: <Award size={16} />,
    gold: <Star size={16} />,
    platinum: <Trophy size={16} />,
};

interface AchievementListProps {
    achievements: ProviderAchievement[];
    progress: AchievementProgress[];
    onRefresh?: () => void;
}

export const AchievementList: React.FC<AchievementListProps> = ({ achievements, progress }) => {
    const [filter, setFilter] = useState<'all' | 'locked' | 'unlocked'>('all');

    const progressMap = new Map(progress.map((p) => [p.id, p]));
    const unlocked = progress.filter((p) => p.achieved).length;
    const total = achievements.length;

    const filtered = achievements.filter((a) => {
        const p = progressMap.get(a.id);
        if (filter === 'unlocked') return p?.achieved;
        if (filter === 'locked') return !p?.achieved;
        return true;
    });

    const grouped = (() => {
        const g: Record<string, ProviderAchievement[]> = {};
        for (const a of filtered) {
            if (!g[a.category]) g[a.category] = [];
            g[a.category]!.push(a);
        }
        return g;
    })();

    const CARD: React.CSSProperties = {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '1rem',
    };

    return (
        <div>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                }}
            >
                <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Achievements</div>
                    <div style={{ ...textXsMuted, fontSize: '0.8rem' }}>
                        {unlocked} / {total} unlocked
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {(['all', 'unlocked', 'locked'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: filter === f ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: filter === f ? '#e2e8f0' : '#64748b',
                            }}
                        >
                            {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Locked'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Progress bar */}
            <div
                style={{
                    height: 4,
                    borderRadius: 2,
                    background: 'var(--border-subtle)',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                }}
            >
                <div
                    style={{
                        height: '100%',
                        borderRadius: 2,
                        width: `${(unlocked / total) * 100}%`,
                        background: 'linear-gradient(90deg, #f59e0b, #a855f7)',
                        transition: 'width 0.5s ease',
                    }}
                />
            </div>

            {/* Categories */}
            {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat} style={{ marginBottom: '1rem' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: '0.5rem',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: 'var(--slate-400)',
                            textTransform: 'capitalize',
                        }}
                    >
                        {CATEGORY_ICONS[cat]}
                        {cat}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {items.map((a) => {
                            const p = progressMap.get(a.id);
                            const achieved = p?.achieved ?? false;
                            const pct = p && p.target > 0 ? (p.current / p.target) * 100 : 0;
                            return (
                                <div
                                    key={a.id}
                                    style={{
                                        ...CARD,
                                        padding: '0.6rem 0.75rem',
                                        opacity: achieved ? 1 : 0.6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            background: achieved
                                                ? TIER_BG[a.tier]
                                                : 'rgba(255,255,255,0.03)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: achieved ? TIER_COLORS[a.tier] : '#64748b',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {TIER_ICONS[a.tier]}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                color: achieved ? '#e2e8f0' : '#94a3b8',
                                            }}
                                        >
                                            {a.title}
                                        </div>
                                        <div style={{ ...textXsMuted, fontSize: '0.75rem' }}>
                                            {a.description}
                                        </div>
                                        {p && p.target > 1 && (
                                            <div
                                                style={{
                                                    marginTop: 4,
                                                    height: 3,
                                                    borderRadius: 2,
                                                    background: 'rgba(255,255,255,0.06)',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        height: '100%',
                                                        borderRadius: 2,
                                                        width: `${Math.min(100, pct)}%`,
                                                        background: achieved
                                                            ? '#22c55e'
                                                            : '#f59e0b',
                                                        transition: 'width 0.3s ease',
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            color: achieved ? '#22c55e' : '#64748b',
                                            textTransform: 'uppercase',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {achieved ? '✓' : a.tier}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--slate-500)', padding: '2rem' }}>
                    <Trophy size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                    <div style={{ fontSize: '0.85rem' }}>No achievements match this filter</div>
                </div>
            )}
        </div>
    );
};
