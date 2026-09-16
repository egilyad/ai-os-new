import React, { useMemo, useState } from 'react';
import { GitCommit, Zap, RefreshCw, Lightbulb, Info } from 'lucide-react';
import { GoTDeliberation } from '../../kernel/services/debate-runtime/got-deliberation';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';

export const GoTDeliberationPanel: React.FC = () => {
    const { t } = useTranslation();
    const got = useMemo(() => new GoTDeliberation(), []);
    const [topic, setTopic] = useState('Should we invest heavily in solar energy vs nuclear for baseload?');
    const [perspective, setPerspective] = useState('Pro-solar: emphasize cost and scalability');
    const [opposing, setOpposing] = useState('Nuclear 92% capacity factor vs 24% solar; Silver constraints limit PV to 3x;');
    const [result, setResult] = useState<Awaited<ReturnType<GoTDeliberation['deliberate']>> | null>(null);
    const [loading, setLoading] = useState(false);

    const handleDeliberate = async () => {
        setLoading(true);
        try {
            const claims = opposing.split(';').map(s => s.trim()).filter(Boolean);
            const r = await got.deliberate(topic, perspective, claims);
            setResult(r);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GitCommit size={22} color="#a855f7" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>GoT Deliberation — {t('nav.got_deliberation')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(168,85,247,0.15)', color: '#c4b5fd', fontWeight: 600 }}>P1.28</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Graph-of-Thoughts: generates 3 reasoning branches (deductive/inductive/abductive/analogical/consequentialist) deterministically from topic+perspective, synthesizes strongest by confidence+novelty, diversity score.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(168,85,247,0.15)' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Topic
                    <input value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Perspective
                    <input value={perspective} onChange={e => setPerspective(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)', gridColumn: '1 / -1' }}>
                    Opposing claims (semicolon separated)
                    <input value={opposing} onChange={e => setOpposing(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="primary" onClick={handleDeliberate} disabled={loading}><Zap size={14} /> {loading ? 'Deliberating…' : 'Deliberate (3 branches)'}</Button>
                <Button variant="ghost" onClick={() => setResult(null)}><RefreshCw size={14} /> Clear</Button>
            </div>

            {!result ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Click Deliberate to generate 3 branches and synthesis.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 14, alignItems: 'start' }}>
                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Lightbulb size={16} color="#a855f7" /> Branches — 3 · diversity {(result.diversityScore * 100).toFixed(0)}% · selected <span style={{ color: '#a78bfa', marginLeft: 4 }}>{result.selectedType}</span></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {result.branches.map((b, i) => {
                                const isSelected = b.type === result.selectedType;
                                return (
                                    <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: isSelected ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isSelected ? 'rgba(168,85,247,0.3)' : 'rgba(255,255,255,0.06)'}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: isSelected ? '#8b5cf6' : '#475569', borderRadius: 4, padding: '2px 8px' }}>{b.type}</span>
                                            {isSelected && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700 }}>SELECTED</span>}
                                            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)' }}>conf {(b.confidence * 100).toFixed(0)}% · nov {(b.novelty * 100).toFixed(0)}%</span>
                                        </div>
                                        <div style={{ fontSize: 11, color: '#c4b5fd', marginBottom: 4, fontWeight: 600 }}>Premise: {b.premise}</div>
                                        <div style={{ fontSize: 11, color: 'var(--slate-400)', lineHeight: 1.4, marginBottom: 4 }}>{b.reasoning.slice(0, 140)}…</div>
                                        <div style={{ fontSize: 12, color: 'var(--slate-200)', fontWeight: 600, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{b.conclusion.slice(0, 160)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} color="#22c55e" /> Synthesis — {result.selectedType}</div>
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 13, color: 'var(--slate-200)', lineHeight: 1.5 }}>{result.synthesis}</div>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Best by confidence*0.4 + novelty*0.6. Diversity = unique types / 5. See <code style={{ color: '#a78bfa' }}>got-deliberation.ts:30</code>.</div>
                    </div>
                </div>
            )}

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

function Target(props: { size: number; color: string }) {
    return <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
}

export default GoTDeliberationPanel;
