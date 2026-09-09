import React, { useMemo, useState } from 'react';
import { TrendingUp, Target, BarChart3, Info, Zap } from 'lucide-react';
import { OutcomeForecaster } from '../../kernel/services/debate-runtime/outcome-forecaster';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';

export const OutcomeForecasterPanel: React.FC = () => {
    const { t } = useTranslation();
    const forecaster = useMemo(() => new OutcomeForecaster(), []);
    const [scoresStr, setScoresStr] = useState('0.55, 0.62, 0.58');
    const [role, setRole] = useState('pro');
    const [opponents, setOpponents] = useState('Empirical Overload, Moral High Ground');
    const [topic, setTopic] = useState('Should we invest heavily in solar energy?');
    const [result, setResult] = useState<ReturnType<OutcomeForecaster['forecast']> | null>(null);

    const handleForecast = () => {
        const previousScores = scoresStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
        const opponentStrengths = opponents.split(',').map(s => s.trim()).filter(Boolean);
        const r = forecaster.forecast(previousScores, role, opponentStrengths, topic, 'English');
        setResult(r);
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp size={22} color="#06b6d4" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Outcome Forecaster — {t('nav.outcome_forecaster')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(6,182,214,0.15)', color: '#22d3ee', fontWeight: 600 }}>P1.30</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Predicts judge score impact for 8 argument angles (Empirical, Moral, Pragmatic, Bold Prediction…), selects max-expected-value. Novelty vs opponent strengths + trend + risk bias.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(6,182,214,0.15)' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Previous scores (comma, 0-1)
                    <input value={scoresStr} onChange={e => setScoresStr(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Topic
                    <input value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Agent role
                    <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                        <option value="pro">Pro</option>
                        <option value="con">Con</option>
                        <option value="neutral">Neutral</option>
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Opponent strengths (comma)
                    <input value={opponents} onChange={e => setOpponents(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="primary" onClick={handleForecast}><Zap size={14} /> Forecast</Button>
                <span style={{ fontSize: 11, color: 'var(--slate-500)', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: 4 }}><Info size={12} /> 8 angles ranked by expectedScore = base + novelty*0.15 − risk*0.1</span>
            </div>

            {result ? (
                <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 14, alignItems: 'start' }}>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} color="#06b6d4" /> Recommended — {result.recommendedLabel}</div>
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(6,182,214,0.08)', border: '1px solid rgba(6,182,214,0.2)' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee', marginBottom: 4 }}>{result.recommendedLabel}</div>
                            <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4 }}>{result.recommendedAngle}</div>
                            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)' }}>Expected gain +{(result.expectedScoreGain * 100).toFixed(1)}%</div>
                        </div>
                    </div>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={16} color="#06b6d4" /> All variants — expectedScore</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {result.variants.map(v => (
                                <div key={v.variantId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: v.label === result.recommendedLabel ? 'rgba(6,182,214,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${v.label === result.recommendedLabel ? 'rgba(6,182,214,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-200)', minWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.label}</span>
                                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                        <div style={{ width: `${v.expectedScore * 100}%`, height: '100%', background: v.label === result.recommendedLabel ? '#06b6d4' : '#64748b' }} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: v.label === result.recommendedLabel ? '#22d3ee' : 'var(--slate-400)', minWidth: 36, textAlign: 'right' }}>{(v.expectedScore * 100).toFixed(0)}%</span>
                                    <span style={{ fontSize: 10, color: 'var(--slate-500)', minWidth: 50, textAlign: 'right' }}>conf {(v.confidence * 100).toFixed(0)}% · risk {(v.riskFactor * 100).toFixed(0)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Set inputs and click Forecast to see 8 angles ranked.</div>
            )}

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default OutcomeForecasterPanel;
