import React, { useMemo, useState } from 'react';
import { Users, Target, Info, Search, RefreshCw } from 'lucide-react';
import { StakeholderMapper } from '../../kernel/services/debate-runtime/stakeholder-mapper';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';

export const StakeholderPanel: React.FC = () => {
    const { t } = useTranslation();
    const mapper = useMemo(() => new StakeholderMapper(), []);
    const [topic, setTopic] = useState('');
    const [stakeholders, setStakeholders] = useState(() => mapper.analyzeTopic(''));
    const [language, setLanguage] = useState<'English' | 'Russian'>('English');

    const handleAnalyze = () => {
        setStakeholders(mapper.analyzeTopic(topic));
    };

    const formatted = useMemo(() => {
        if (stakeholders.length === 0) return '';
        return mapper.getFormattedStakeholders(stakeholders, language);
    }, [mapper, stakeholders, language]);

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={22} color="#ec4899" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Stakeholder — {t('nav.stakeholder')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(236,72,153,0.15)', color: '#f472b6', fontWeight: 600 }}>P1.24</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Identifies affected stakeholders from topic keywords (10 templates: patients, taxpayers, business, environment, workers…) and forces addressing their perspectives. Relevance 0-1 by keyword hits.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(236,72,153,0.15)', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)', flex: 1, minWidth: 300 }}>
                    Topic
                    <input value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Language
                    <select value={language} onChange={e => setLanguage(e.target.value as any)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                        <option value="English">English</option>
                        <option value="Russian">Russian</option>
                    </select>
                </label>
                <Button variant="primary" onClick={handleAnalyze}><Search size={14} /> Analyze</Button>
                <Button variant="ghost" onClick={() => mapper.clearSession()}><RefreshCw size={14} /> Clear</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16} color="#ec4899" /> Stakeholders — {stakeholders.length}</div>
                    {stakeholders.length === 0 ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No stakeholders — topic has no keyword match. Try “tax”, “health”, “environment”, “workers”.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {stakeholders.map(s => (
                                <div key={s.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-200)' }}>{s.label}</span>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: s.relevanceScore > 0.5 ? '#22c55e' : '#eab308' }}>{(s.relevanceScore * 100).toFixed(0)}%</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 6 }}>
                                        <div style={{ width: `${s.relevanceScore * 100}%`, height: '100%', background: '#ec4899' }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-400)', lineHeight: 1.4 }}>{s.keyConcern}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', display: 'flex', alignItems: 'center', gap: 6 }}><Target size={16} color="#ec4899" /> Prompt injection</div>
                    {!formatted ? (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No stakeholders — no prompt.</div>
                    ) : (
                        <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-300)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.06)', maxHeight: 260, overflowY: 'auto' }}>{formatted}</pre>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Top 3 stakeholders, relevance = hits/4. See <code style={{ color: '#f472b6' }}>stakeholder-mapper.ts:242</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default StakeholderPanel;
