import React, { useState, useEffect, useRef } from 'react';
import { GitCommit, TrendingUp, Flame } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { contributionService } from '../kernel/instances/services-extras';
import { eventBus, EVENTS } from '../kernel/instances/events';

const LEVEL_COLORS = ['#1e293b', '#0e4429', '#006d32', '#26a641', '#39d353'];

const ContributionGraphPanelContent: React.FC = () => {
    const isMounted = useRef(true);
    const [graph, setGraph] = useState(() => contributionService.getGraph());
    const [streak, setStreak] = useState(() => contributionService.getStreak());
    const [months] = useState(() => {
        const m = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];
        const now = new Date();
        const result: { label: string; index: number }[] = [];
        for (let i = 0; i < 12; i++) {
            const idx = (now.getMonth() - 11 + i + 12) % 12;
            if (i % 2 === 0 || i === 11) result.push({ label: m[idx]!, index: i });
        }
        return result;
    });

    useEffect(() => {
        isMounted.current = true;
        const refresh = () => {
            if (!isMounted.current) return;
            setGraph(contributionService.getGraph());
            setStreak(contributionService.getStreak());
        };
        const unsubs = [
            eventBus.on(EVENTS.STREAM_END, refresh),
            eventBus.on(EVENTS.DEBATE_AGENT_RESPONDED, refresh),
            eventBus.on(EVENTS.KEY_HEALTH_CHECK_COMPLETED, refresh),
        ];
        return () => {
            isMounted.current = false;
            unsubs.forEach((u) => u());
        };
    }, []);

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
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
                <GitCommit size={20} color="#10b981" /> Contribution Graph
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--slate-400)' }}>
                Your activity across the platform
            </p>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div
                    style={{
                        flex: 1,
                        padding: 16,
                        borderRadius: 12,
                        background: 'var(--slate-800)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--slate-200)' }}>
                        {graph.totalContributions}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--slate-500)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                        }}
                    >
                        <TrendingUp size={12} /> Total Contributions
                    </div>
                </div>
                <div
                    style={{
                        flex: 1,
                        padding: 16,
                        borderRadius: 12,
                        background: 'var(--slate-800)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>
                        {streak.current}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--slate-500)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                        }}
                    >
                        <Flame size={12} /> Current Streak
                    </div>
                </div>
                <div
                    style={{
                        flex: 1,
                        padding: 16,
                        borderRadius: 12,
                        background: 'var(--slate-800)',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--purple)' }}>
                        {streak.longest}
                    </div>
                    <div
                        style={{
                            fontSize: 11,
                            color: 'var(--slate-500)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                        }}
                    >
                        <Flame size={12} /> Longest Streak
                    </div>
                </div>
            </div>

            <div
                style={{
                    padding: 16,
                    borderRadius: 12,
                    background: 'var(--slate-800)',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--slate-500)' }}>
                        {months.map((m) => (
                            <span key={m.index} style={{ width: 14, textAlign: 'center' }}>
                                {m.label}
                            </span>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 2, overflowX: 'auto' }}>
                    {graph.weeks.map((week, wi) => (
                        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {week.days.map((day, di) => (
                                <div
                                    key={di}
                                    title={`${day.date}: ${day.count} contributions`}
                                    style={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: 2,
                                        background: LEVEL_COLORS[day.level],
                                        cursor: 'pointer',
                                        transition: 'opacity 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.target as HTMLElement).style.opacity = '0.8';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.target as HTMLElement).style.opacity = '1';
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 8,
                        fontSize: 11,
                        color: 'var(--slate-500)',
                    }}
                >
                    Less
                    {LEVEL_COLORS.map((c, i) => (
                        <div
                            key={i}
                            style={{ width: 10, height: 10, borderRadius: 2, background: c }}
                        />
                    ))}
                    More
                </div>
            </div>
        </div>
    );
};

const ContributionGraphPanel: React.FC = () => (
    <PanelLoader name="Contribution Graph">
        <ContributionGraphPanelContent />
    </PanelLoader>
);

export default ContributionGraphPanel;
