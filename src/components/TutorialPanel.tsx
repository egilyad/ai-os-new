import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PanelLoader from './PanelLoader';
import { tutorialService } from '../kernel/instances';
import { usePolling } from './Common/usePolling';
import type { Tutorial, TutorialProgress } from '../kernel/contracts/tutorial';

const CATEGORY_ICONS: Record<string, string> = {
    getting_started: '\uD83D\uDE80',
    providers: '\u26A1',
    debates: '\uD83C\uDF96\uFE0F',
    memory: '\uD83E\uDDE0',
    advanced: '\uD83D\uDD25',
};

const TutorialCard: React.FC<{
    tutorial: Tutorial;
    progress: TutorialProgress;
    onStart: () => void;
}> = ({ tutorial, progress, onStart }) => {
    const completed = progress.completedSteps.length;
    const total = tutorial.steps.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isDone = progress.completedAt !== null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: '1rem',
                borderRadius: '10px',
                background: isDone ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isDone ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{tutorial.icon}</span>
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                        }}
                    >
                        {tutorial.title}
                        {isDone && (
                            <span
                                style={{
                                    marginLeft: '0.3rem',
                                    fontSize: '0.7rem',
                                    color: 'var(--success)',
                                }}
                            >
                                Done
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {tutorial.description}
                    </div>
                </div>
                <div
                    style={{
                        textAlign: 'right',
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {tutorial.estimatedMinutes} min
                    {tutorial.required && (
                        <div style={{ color: 'var(--warning)', fontWeight: 600 }}>Required</div>
                    )}
                </div>
            </div>

            {completed > 0 && (
                <div
                    style={{
                        width: '100%',
                        height: 4,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,0.05)',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            borderRadius: 2,
                            width: `${pct}%`,
                            background: isDone ? '#22c55e' : '#3b82f6',
                            transition: 'width 0.5s',
                        }}
                    />
                </div>
            )}

            <div
                style={{
                    display: 'flex',
                    gap: '0.3rem',
                    flexWrap: 'wrap',
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                }}
            >
                {tutorial.steps.map((s, i) => (
                    <span
                        key={s.id}
                        style={{
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                            background: progress.completedSteps.includes(s.id)
                                ? 'rgba(34,197,94,0.15)'
                                : 'rgba(255,255,255,0.04)',
                            color: progress.completedSteps.includes(s.id)
                                ? '#22c55e'
                                : 'var(--text-muted)',
                        }}
                    >
                        {i + 1}. {s.title}
                    </span>
                ))}
            </div>

            <button
                onClick={onStart}
                style={{
                    alignSelf: 'flex-start',
                    padding: '0.3rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: isDone
                        ? 'rgba(34,197,94,0.15)'
                        : completed > 0
                          ? 'rgba(59,130,246,0.2)'
                          : 'rgba(59,130,246,0.3)',
                    color: isDone ? '#22c55e' : '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                }}
            >
                {isDone ? 'Replay' : completed > 0 ? 'Continue' : 'Start'}
            </button>
        </motion.div>
    );
};

const TutorialPanel: React.FC = () => {
    const [tutorials, setTutorials] = useState<Tutorial[]>([]);
    const [progressMap, setProgressMap] = useState<Record<string, TutorialProgress>>({});
    const [filter, setFilter] = useState<string>('all');

    const refresh = () => {
        const ts = tutorialService ? tutorialService.getTutorials() : [];
        setTutorials(ts);
        const pm: Record<string, TutorialProgress> = {};
        for (const t of ts) {
            pm[t.id] = tutorialService.getProgress(t.id);
        }
        setProgressMap(pm);
    };

    useEffect(() => {
        refresh();
    }, []);

    // C-95: usePolling gates on document.hidden
    usePolling(refresh, 2000);

    const handleStart = (tutorialId: string) => {
        tutorialService?.startTutorial(tutorialId);
        refresh();
    };

    const handleCompleteAll = () => {
        if (!tutorialService) return;
        for (const t of tutorials) {
            tutorialService.completeTutorial(t.id);
        }
        refresh();
    };

    const handleResetAll = () => {
        if (!tutorialService) return;
        for (const t of tutorials) {
            tutorialService.resetTutorial(t.id);
        }
        refresh();
    };

    const overall = tutorialService ? tutorialService.getOverallProgress() : 0;
    const onboarding = tutorialService ? tutorialService.isOnboardingComplete() : false;

    const categories = Array.from(new Set(tutorials.map((t) => t.category)));
    const filtered = filter === 'all' ? tutorials : tutorials.filter((t) => t.category === filter);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header stats */}
            <div
                style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}
            >
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        OVERALL PROGRESS
                    </div>
                    <div
                        style={{
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            color:
                                overall >= 100 ? '#22c55e' : overall > 50 ? '#fbbf24' : '#3b82f6',
                        }}
                    >
                        {overall}%
                    </div>
                </div>
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ONBOARDING</div>
                    <div
                        style={{
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            color: onboarding ? '#22c55e' : '#f59e0b',
                        }}
                    >
                        {onboarding ? 'Done' : 'Pending'}
                    </div>
                </div>
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>TUTORIALS</div>
                    <div
                        style={{
                            fontSize: '1.3rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                        }}
                    >
                        {Object.values(progressMap).filter((p) => p.completedAt !== null).length}/
                        {tutorials.length}
                    </div>
                </div>
                <div style={{ flex: 1 }} />
                <button
                    onClick={handleCompleteAll}
                    style={{
                        padding: '0.3rem 0.8rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(34,197,94,0.15)',
                        color: 'var(--success)',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                    }}
                >
                    Complete All
                </button>
                <button
                    onClick={handleResetAll}
                    style={{
                        padding: '0.3rem 0.8rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'rgba(239,68,68,0.15)',
                        color: 'var(--error)',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                    }}
                >
                    Reset All
                </button>
            </div>

            {/* Category filter */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                    onClick={() => setFilter('all')}
                    style={{
                        padding: '0.2rem 0.6rem',
                        borderRadius: '4px',
                        border: 'none',
                        background: filter === 'all' ? 'rgba(59,130,246,0.3)' : 'transparent',
                        color: filter === 'all' ? '#60a5fa' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                    }}
                >
                    All
                </button>
                {categories.map((c) => (
                    <button
                        key={c}
                        onClick={() => setFilter(c)}
                        style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '4px',
                            border: 'none',
                            background: filter === c ? 'rgba(59,130,246,0.3)' : 'transparent',
                            color: filter === c ? '#60a5fa' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                        }}
                    >
                        {CATEGORY_ICONS[c] || '\uD83D\uDCCB'} {c.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Tutorial list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filtered.map((t) => (
                    <TutorialCard
                        key={t.id}
                        tutorial={t}
                        progress={
                            progressMap[t.id] || {
                                tutorialId: t.id,
                                completedSteps: [],
                                startedAt: 0,
                                completedAt: null,
                            }
                        }
                        onStart={() => handleStart(t.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default function TutorialPanelWrapper() {
    return (
        <PanelLoader title="Tutorials & Onboarding">
            <TutorialPanel />
        </PanelLoader>
    );
}
