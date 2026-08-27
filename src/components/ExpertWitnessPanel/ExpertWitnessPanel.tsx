import React, { useMemo, useState } from 'react';
import { UserCheck, Search, Quote, RefreshCw, Info, CheckCircle } from 'lucide-react';
import { ExpertWitnessService } from '../../kernel/services/debate-runtime/expert-witness-service';
import type { ExpertWitness } from '../../kernel/contracts/debate-expert-witness';
import { useTranslation } from '../../i18n/useTranslation';
import { useRealAgents } from '../../hooks/useRealAgents';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';

export const ExpertWitnessPanel: React.FC = () => {
    const { t } = useTranslation();
    const realAgents = useRealAgents();
    const allExperts: ExpertWitness[] = useMemo(
        () => realAgents.map((a) => ({ id: a.id, domain: a.role || '', title: a.name, credential: '', perspective: '' })),
        [realAgents],
    );
    const svc = useMemo(() => new ExpertWitnessService(allExperts), [allExperts]);
    const [topic, setTopic] = useState('Should we invest heavily in AI governance and safety?');
    const [query, setQuery] = useState('artificial intelligence and regulation');
    const [expert, setExpert] = useState<ExpertWitness | null>(null);
    const [testimony, setTestimony] = useState<string | null>(null);

    const handleFind = () => {
        const ex = svc.findExpert(topic, query);
        setExpert(ex ?? null);
        setTestimony(null);
    };

    const handleTestimony = () => {
        if (!expert) return;
        const txt = svc.generateTestimony(expert, topic, 'English');
        svc.markSummoned(expert.id);
        setTestimony(txt);
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserCheck size={22} color="#7c3aed" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Expert Witness — {t('nav.expert_witness')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(124,58,237,0.15)', color: '#a78bfa', fontWeight: 600 }}>P1.14</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                On-demand expert witness summoner — keyword match (10 domains) → best expert → testimony prompt block. No agent spawning, track summoned to prevent repeat.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Topic
                    <input value={topic} onChange={e => setTopic(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Query (keywords)
                    <input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. ai, climate, market, ethics" style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="primary" onClick={handleFind}><Search size={14} /> Find expert</Button>
                <Button variant="ghost" onClick={handleTestimony} disabled={!expert}><Quote size={14} /> Generate testimony</Button>
                <Button variant="ghost" onClick={() => { svc.clearSession(); setExpert(null); setTestimony(null); }}><RefreshCw size={14} /> Clear session</Button>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)', alignSelf: 'center' }}>{allExperts.length} experts — keyword → domain fallback</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><UserCheck size={16} color="#7c3aed" /> Expert — {expert ? expert.title : 'none selected'}</div>
                    {!expert ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No expert — enter topic/query and click Find expert. Try “ai”, “climate”, “market”, “ethics”.</div>
                    ) : (
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#7c3aed', borderRadius: 4, padding: '2px 8px' }}>{expert.domain}</span>
                                {svc.wasSummoned(expert.id) && <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(234,179,8,0.15)', color: '#facc15' }}>summoned</span>}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-100)' }}>{expert.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--slate-400)', lineHeight: 1.4 }}>{expert.credential}</div>
                            <div style={{ fontSize: 12, color: 'var(--slate-300)', lineHeight: 1.4, padding: '8px 10px', borderRadius: 6, background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.06)' }}>{expert.perspective}</div>
                            {testimony && (
                                <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#86efac' }}>
                                    <CheckCircle size={14} /> Summoned — testimony generated below.
                                </div>
                            )}
                        </div>
                    )}
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {allExperts.map(e => (
                            <span key={e.id} style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, background: expert?.id === e.id ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${expert?.id === e.id ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`, color: expert?.id === e.id ? '#c4b5fd' : 'var(--slate-500)' }}>{e.title.split(',')[0]}</span>
                        ))}
                    </div>
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Quote size={16} color="#7c3aed" /> Testimony prompt</div>
                    {!testimony ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No testimony — find an expert then click Generate testimony.</div>
                    ) : (
                        <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-300)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.06)', maxHeight: 260, overflowY: 'auto' }}>{testimony}</pre>
                    )}
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Injected as prompt block — no agent spawning. See <code style={{ color: '#a78bfa' }}>expert-witness-service.ts:184</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default ExpertWitnessPanel;
