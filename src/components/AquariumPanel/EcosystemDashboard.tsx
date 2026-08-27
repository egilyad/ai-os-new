/**
 * Cognitive-aux / research panel (Experimental).
 * Ecosystem dashboard showcase — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Fish,
    Sparkles,
    Palette,
    Trophy,
    Heart,
    Activity,
    CheckCircle2,
    Lock,
    Star,
    TrendingUp,
    Layers,
} from 'lucide-react';
import type {
    IEcosystemEngine,
    Creature,
    Achievement,
    Theme,
} from '../../kernel/contracts/ecosystem';
import { ecosystemEngine } from '../../kernel/instances';

const RARITY_COLORS: Record<string, string> = {
    common: '#94a3b8',
    uncommon: '#22c55e',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b',
};

const RARITY_BG: Record<string, string> = {
    common: 'rgba(148,163,184,0.1)',
    uncommon: 'rgba(34,197,94,0.1)',
    rare: 'rgba(59,130,246,0.1)',
    epic: 'rgba(168,85,247,0.1)',
    legendary: 'rgba(245,158,11,0.1)',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    first_steps: <Star size={12} />,
    provider_mastery: <Activity size={12} />,
    debate_champion: <Trophy size={12} />,
    memory_keeper: <Layers size={12} />,
    collector: <Fish size={12} />,
    streak: <TrendingUp size={12} />,
    hidden: <Sparkles size={12} />,
};

const CATEGORY_COLORS: Record<string, string> = {
    first_steps: '#22c55e',
    provider_mastery: '#3b82f6',
    debate_champion: '#f59e0b',
    memory_keeper: '#a855f7',
    collector: '#06b6d4',
    streak: '#ef4444',
    hidden: '#64748b',
};

const CreatureCard: React.FC<{ creature: Creature }> = ({ creature }) => (
    <motion.div
        layout
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: creature.isUnlocked ? RARITY_BG[creature.rarity] : 'rgba(255,255,255,0.02)',
            border: `1px solid ${creature.isUnlocked ? RARITY_COLORS[creature.rarity] : 'rgba(255,255,255,0.05)'}`,
            opacity: creature.isUnlocked ? 1 : 0.4,
        }}
    >
        <span style={{ fontSize: '1.3rem' }}>{creature.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div
                style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: creature.isUnlocked ? '#e2e8f0' : '#475569',
                }}
            >
                {creature.name}
            </div>
            <div style={{ fontSize: '0.62rem', color: RARITY_COLORS[creature.rarity] }}>
                {creature.rarity}
            </div>
        </div>
        {creature.isUnlocked ? (
            <CheckCircle2 size={14} color={RARITY_COLORS[creature.rarity]} />
        ) : (
            <Lock size={12} color="#475569" />
        )}
    </motion.div>
);

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
    <motion.div
        layout
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            borderRadius: 8,
            background: achievement.isUnlocked ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${achievement.isUnlocked ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)'}`,
            opacity: achievement.isUnlocked ? 1 : 0.5,
        }}
    >
        <span style={{ fontSize: '1rem' }}>{achievement.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
            <div
                style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: achievement.isUnlocked ? '#e2e8f0' : '#64748b',
                }}
            >
                {achievement.title}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>{achievement.description}</div>
        </div>
        <div
            style={{
                fontSize: '0.6rem',
                color: CATEGORY_COLORS[achievement.category],
                fontWeight: 600,
            }}
        >
            +{achievement.points}
        </div>
    </motion.div>
);

const ThemeCard: React.FC<{ theme: Theme }> = ({ theme }) => (
    <motion.div
        layout
        style={{
            padding: '10px',
            borderRadius: 10,
            background: theme.isUnlocked
                ? `linear-gradient(135deg, ${theme.bgGradient[0]}, ${theme.bgGradient[1]})`
                : 'rgba(255,255,255,0.02)',
            border: `1px solid ${theme.isUnlocked ? theme.colors[0] : 'rgba(255,255,255,0.05)'}`,
            opacity: theme.isUnlocked ? 1 : 0.4,
        }}
    >
        <div
            style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.isUnlocked ? '#e2e8f0' : '#475569',
                marginBottom: 2,
            }}
        >
            {theme.name}
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)', marginBottom: 4 }}>
            {theme.description}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
            {theme.colors.slice(0, 3).map((c, i) => (
                <div
                    key={i}
                    style={{ width: 12, height: 12, borderRadius: '50%', background: c }}
                />
            ))}
        </div>
    </motion.div>
);

type Tab = 'creatures' | 'achievements' | 'themes';

export const EcosystemDashboard: React.FC = () => {
    const [tab, setTab] = useState<Tab>('creatures');
    const [state, setState] = useState<ReturnType<IEcosystemEngine['getState']> | null>(null);
    const engineRef = useRef<IEcosystemEngine>(ecosystemEngine);
    const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        try {
            engineRef.current.tick();
        } catch {
            /* non-critical — ecosystem tick failed */
        }
        setState(engineRef.current.getState());
        refreshRef.current = setInterval(() => {
            try {
                engineRef.current.tick();
            } catch {
                /* non-critical — ecosystem tick failed */
            }
            setState(engineRef.current.getState());
        }, 10000);
        return () => {
            if (refreshRef.current) clearInterval(refreshRef.current);
        };
    }, []);

    if (!state)
        return <div style={{ padding: '1rem', color: 'var(--slate-500)' }}>Loading ecosystem...</div>;

    const unlockedCount = state.creatures.filter((c) => c.isUnlocked).length;
    const unlockedAchievements = state.achievements.filter((a) => a.isUnlocked).length;
    const unlockedThemes = state.themes.filter((t) => t.isUnlocked).length;

    return (
        <div style={{ padding: '1rem', maxWidth: 600, margin: '0 auto' }}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 8,
                    marginBottom: '1rem',
                }}
            >
                {[
                    {
                        label: 'Happiness',
                        value: `${state.happiness}%`,
                        icon: <Heart size={14} />,
                        color: 'var(--error)',
                    },
                    {
                        label: 'Creatures',
                        value: `${unlockedCount}/${state.creatures.length}`,
                        icon: <Fish size={14} />,
                        color: 'var(--success)',
                    },
                    {
                        label: 'Achievements',
                        value: `${unlockedAchievements}`,
                        icon: <Trophy size={14} />,
                        color: 'var(--warning)',
                    },
                    {
                        label: 'Themes',
                        value: `${unlockedThemes}/${state.themes.length}`,
                        icon: <Palette size={14} />,
                        color: '#a855f7',
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        style={{
                            padding: '10px',
                            borderRadius: 10,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            textAlign: 'center',
                        }}
                    >
                        <div style={{ color: stat.color, marginBottom: 4 }}>{stat.icon}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            {stat.value}
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: '0.75rem' }}>
                {(['creatures', 'achievements', 'themes'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: 6,
                            border: 'none',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background:
                                tab === t ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                            color: tab === t ? '#a78bfa' : '#64748b',
                        }}
                    >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {tab === 'creatures' && (
                    <motion.div
                        key="creatures"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {state.creatures.map((c) => (
                                <CreatureCard key={c.id} creature={c} />
                            ))}
                        </div>
                    </motion.div>
                )}
                {tab === 'achievements' && (
                    <motion.div
                        key="achievements"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {(
                            [
                                'first_steps',
                                'provider_mastery',
                                'debate_champion',
                                'memory_keeper',
                                'collector',
                                'streak',
                                'hidden',
                            ] as const
                        ).map((cat) => {
                            const catAchievements = state.achievements.filter(
                                (a) => a.category === cat,
                            );
                            const catUnlocked = catAchievements.filter((a) => a.isUnlocked).length;
                            return (
                                <div key={cat} style={{ marginBottom: '0.75rem' }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            marginBottom: 4,
                                        }}
                                    >
                                        {CATEGORY_ICONS[cat]}
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                color: CATEGORY_COLORS[cat],
                                            }}
                                        >
                                            {cat.replace(/_/g, ' ')} ({catUnlocked}/
                                            {catAchievements.length})
                                        </span>
                                    </div>
                                    <div
                                        style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                                    >
                                        {catAchievements.map((a) => (
                                            <AchievementCard key={a.id} achievement={a} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                )}
                {tab === 'themes' && (
                    <motion.div
                        key="themes"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {state.themes.map((t) => (
                                <ThemeCard key={t.id} theme={t} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EcosystemDashboard;
