import React, { useMemo, useState } from 'react';
import { Shield, Star, Plus, Trash2, BarChart3, Info } from 'lucide-react';
import { CredibilityScorer } from '../../kernel/services/debate-runtime/debate-credibility-service';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';

const TIER_COLOR: Record<number, string> = { 1: '#22c55e', 2: '#84cc16', 3: '#eab308', 4: '#f97316', 5: '#ef4444' };

export const CredibilityPanel: React.FC = () => {
    const { t } = useTranslation();
    const scorer = useMemo(() => new CredibilityScorer(), []);
    const [sources, setSources] = useState<string[]>([]);
    const [input, setInput] = useState('');

    const result = useMemo(() => scorer.scoreSources(sources), [scorer, sources]);

    const add = () => {
        const v = input.trim();
        if (!v) return;
        setSources(s => [...s, v]);
        setInput('');
    };
    const remove = (idx: number) => setSources(s => s.filter((_, i) => i !== idx));

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shield size={22} color="#f59e0b" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Credibility — {t('nav.credibility')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontWeight: 600 }}>P0.12</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Scores sources by domain authority (Tier 1 Academic/Gov → Tier 5 Social/Wiki), recency (year bonus), and citation format. Injects credibility-aware prompts and evaluator penalties.
            </p>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Paste source URL or citation — e.g. https://nature.com/article or 'According to WHO 2024...'" style={{ flex: 1, minWidth: 300, padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                <Button variant="primary" onClick={add}><Plus size={14} /> Add</Button>
                <span style={{ fontSize: 12, color: 'var(--slate-500)', marginLeft: 8 }}>avg {(result.average * 10).toFixed(1)}/10 · lowest Tier {result.lowestTier} · {sources.length} sources</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><BarChart3 size={16} color="#f59e0b" /> Scores</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {result.scores.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: TIER_COLOR[s.domainTier] ?? '#64748b', borderRadius: 4, padding: '2px 6px', minWidth: 28, textAlign: 'center' }}>T{s.domainTier}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, color: 'var(--slate-200)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.source}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{s.domainLabel}</div>
                                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 4, overflow: 'hidden' }}>
                                        <div style={{ width: `${s.score * 100}%`, height: '100%', background: TIER_COLOR[s.domainTier] ?? '#64748b', transition: 'width 0.3s' }} />
                                    </div>
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: TIER_COLOR[s.domainTier] ?? 'var(--slate-400)', minWidth: 44, textAlign: 'right' }}>{(s.score * 10).toFixed(1)}/10</span>
                                <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer', padding: 2 }}><Trash2 size={14} /></button>
                            </div>
                        ))}
                        {result.scores.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No sources — add a URL or citation above.</div>}
                    </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><Star size={16} color="#f59e0b" /> Summary</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Average</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: result.average > 0.7 ? '#22c55e' : result.average > 0.4 ? '#eab308' : '#ef4444' }}>{(result.average * 10).toFixed(1)}/10</div>
                        </div>
                        <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>Weakest tier</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: TIER_COLOR[result.lowestTier] ?? '#64748b' }}>Tier {result.lowestTier}</div>
                        </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', lineHeight: 1.5, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        Base: Tier 1 0.9 · Tier2 0.75 · Tier3 0.6 · Tier4 0.4 · Tier5 0.2. Recency +0.1 (≤2y), +0.05 (≤5y), −0.1 (&gt;15y). Journal `vol./pp.` +0.1. See <code style={{ color: '#fbbf24' }}>debate-credibility-service.ts:66</code>.
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Tier 1 Academic/Gov → Tier 5 Wiki/Social · lowestTier = max tier in set.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default CredibilityPanel;
