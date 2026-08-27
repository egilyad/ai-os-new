import { useState } from 'react';
import { Square, Play } from 'lucide-react';
import { eventBus, EVENTS } from '../../kernel/instances';
import MetricBar from './MetricBar';
import type { ABTestConfig } from '../../kernel/types/routing-types';
import {
    flex1,
    flexBetween,
    flexCenterGap2,
    flexColGap5,
    flexColGap6,
    grid4,
    labelUppercase,
    selectDark,
    textMutedWeight700Xs,
    textWhiteWeight700Sm,
} from '../../styles/common';

interface Props {
    abTest: ABTestConfig | null;
    profiles: string[];
    actions: {
        startABTest: (c: string, e: string, s: number) => Promise<boolean>;
        stopABTest: () => Promise<void>;
    };
}

function ABTestPanel({ abTest, profiles, actions }: Props) {
    const [control, setControl] = useState(profiles[0] || '');
    const [experiment, setExperiment] = useState(profiles[1] || profiles[0] || '');
    const [split, setSplit] = useState(30);

    if (abTest?.enabled) {
        const { control: cm, experiment: em } = abTest.metrics;
        return (
            <div style={flexColGap6}>
                <div style={flexBetween}>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                            A/B Test Running
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                            {abTest.controlProfile} vs {abTest.experimentProfile} &middot;{' '}
                            {abTest.splitPercent}% experiment
                        </div>
                    </div>
                    <button
                        onClick={actions.stopABTest}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 8,
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            color: 'var(--error)',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Square size={14} /> Stop Test
                    </button>
                </div>

                <div style={grid4}>
                    {[
                        { label: 'Requests (C)', value: cm.requests.toString(), color: 'var(--accent)' },
                        { label: 'Requests (E)', value: em.requests.toString(), color: 'var(--purple)' },
                        {
                            label: 'Started',
                            value: new Date(abTest.startedAt).toLocaleDateString(),
                            color: 'var(--slate-500)',
                        },
                        { label: 'Split', value: `${abTest.splitPercent}%`, color: 'var(--warning)' },
                    ].map((card) => (
                        <div
                            key={card.label}
                            style={{
                                padding: '1rem',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            <div style={textMutedWeight700Xs}>{card.label}</div>
                            <div
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 800,
                                    color: card.color,
                                    marginTop: '0.25rem',
                                }}
                            >
                                {card.value}
                            </div>
                        </div>
                    ))}
                </div>

                <div style={flexColGap5}>
                    <div style={textWhiteWeight700Sm}>Metrics Comparison</div>
                    <MetricBar
                        label="Avg Latency"
                        control={cm.requests > 0 ? cm.totalLatency / cm.requests : 0}
                        experiment={em.requests > 0 ? em.totalLatency / em.requests : 0}
                        higherIsBetter={false}
                        format={(v) => `${v.toFixed(0)}ms`}
                    />
                    <MetricBar
                        label="Success Rate"
                        control={cm.requests > 0 ? cm.successCount / cm.requests : 0}
                        experiment={em.requests > 0 ? em.successCount / em.requests : 0}
                        higherIsBetter={true}
                        format={(v) => `${(v * 100).toFixed(1)}%`}
                    />
                    <MetricBar
                        label="Avg Score"
                        control={cm.requests > 0 ? cm.totalScore / cm.requests : 0}
                        experiment={em.requests > 0 ? em.totalScore / em.requests : 0}
                        higherIsBetter={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={flexColGap6}>
            <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>A/B Test</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                    Compare two weight profiles to measure routing performance
                </div>
            </div>

            {profiles.length < 2 ? (
                <div
                    style={{
                        padding: '1rem',
                        borderRadius: 12,
                        background: 'rgba(234,179,8,0.08)',
                        border: '1px solid rgba(234,179,8,0.15)',
                        color: '#eab308',
                        fontSize: '0.85rem',
                    }}
                >
                    Need at least 2 weight profiles to run an A/B test
                </div>
            ) : (
                <>
                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'flex-end',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 160 }}>
                            <label style={labelUppercase}>Control Profile</label>
                            <select
                                value={control}
                                onChange={(e) => setControl(e.target.value)}
                                style={selectDark}
                            >
                                {profiles.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: 160 }}>
                            <label style={labelUppercase}>Experiment Profile</label>
                            <select
                                value={experiment}
                                onChange={(e) => setExperiment(e.target.value)}
                                style={selectDark}
                            >
                                {profiles.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: 120 }}>
                            <label style={labelUppercase}>Experiment %</label>
                            <div style={flexCenterGap2}>
                                <input
                                    type="range"
                                    min={1}
                                    max={99}
                                    value={split}
                                    onChange={(e) => setSplit(Number(e.target.value))}
                                    style={flex1}
                                />
                                <span
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 800,
                                        color: 'var(--warning)',
                                        minWidth: 40,
                                        textAlign: 'right',
                                    }}
                                >
                                    {split}%
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            const ok = await actions.startABTest(control, experiment, split);
                            if (!ok)
                                eventBus.emit(EVENTS.NOTIFICATION, {
                                    message: 'Failed to start A/B test',
                                    type: 'error',
                                });
                        }}
                        style={{
                            alignSelf: 'flex-start',
                            padding: '0.6rem 1.25rem',
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <Play size={16} /> Start A/B Test
                    </button>
                </>
            )}
        </div>
    );
}

export default ABTestPanel;
