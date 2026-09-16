import { useState, useEffect } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import { flexColGap4 } from '../../styles/common';

interface Props {
    profile: { defaultWeights: { ttft: number; tps: number; reliability: number } };
    actions: {
        updateActiveProfileWeights: (w: {
            ttft: number;
            tps: number;
            reliability: number;
        }) => Promise<void>;
    };
}

function WeightTunerInner({ profile, actions }: Props) {
    const w = profile?.defaultWeights ?? { ttft: 0.5, tps: 0.3, reliability: 0.2 };
    const [localWeights, setLocalWeights] = useState(w);
    const [saved, setSaved] = useState(true);

    useEffect(() => {
        setLocalWeights(w);
        setSaved(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        profile?.defaultWeights?.ttft,
        profile?.defaultWeights?.tps,
        profile?.defaultWeights?.reliability,
    ]);

    if (!profile)
        return <div style={{ color: 'var(--slate-500)', fontSize: '0.8rem' }}>No active profile</div>;

    const hasChanges =
        localWeights.ttft !== w.ttft ||
        localWeights.tps !== w.tps ||
        localWeights.reliability !== w.reliability;

    const updateWeight = (key: 'ttft' | 'tps' | 'reliability', value: number) => {
        setLocalWeights((prev) => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    return (
        <div style={flexColGap4}>
            {(['ttft', 'tps', 'reliability'] as const).map((key) => {
                const labels = {
                    ttft: 'TTFT \u2014 Time to First Token',
                    tps: 'TPS \u2014 Tokens Per Second',
                    reliability: 'Reliability \u2014 Success Rate',
                };
                const colors = { ttft: '#3b82f6', tps: '#10b981', reliability: '#8b5cf6' };
                return (
                    <div key={key}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '0.35rem',
                            }}
                        >
                            <span
                                style={{ fontSize: '0.75rem', color: colors[key], fontWeight: 600 }}
                            >
                                {labels[key]}
                            </span>
                            <span
                                style={{
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    color: 'var(--slate-200)',
                                }}
                            >
                                {localWeights[key].toFixed(2)}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={localWeights[key]}
                            onChange={(e) => updateWeight(key, parseFloat(e.target.value))}
                            style={{ width: '100%', accentColor: colors[key] }}
                        />
                    </div>
                );
            })}
            <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontStyle: 'italic' }}>
                Weights are renormalized automatically
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                    onClick={async () => {
                        await actions.updateActiveProfileWeights(localWeights);
                        setSaved(true);
                    }}
                    disabled={!hasChanges}
                    style={{
                        padding: '0.5rem 1.25rem',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: hasChanges ? 'pointer' : 'default',
                        background: hasChanges ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.2)',
                        color: hasChanges ? '#60a5fa' : '#475569',
                        border: '1px solid rgba(59,130,246,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Save size={12} /> {saved ? 'Saved' : 'Save'}
                </button>
                <button
                    onClick={() => {
                        setLocalWeights(w);
                        setSaved(true);
                    }}
                    disabled={!hasChanges}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: hasChanges ? 'pointer' : 'default',
                        background: 'transparent',
                        color: 'var(--slate-500)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <RotateCcw size={12} /> Reset
                </button>
            </div>
        </div>
    );
}

export default WeightTunerInner;
