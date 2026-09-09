import React, { useMemo, useState } from 'react';
import { Megaphone, Sparkles, Info, RefreshCw } from 'lucide-react';
import { RhetoricalDeviceSelector } from '../../kernel/services/debate-runtime/rhetorical-device-selector';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';

const DEVICES = [
    { id: 'socratic_irony', name: 'Socratic Irony', desc: 'Feigned ignorance to expose contradictions', roles: 'pro/con/neutral', minRound: 2 },
    { id: 'reductio', name: 'Reductio ad absurdum', desc: 'Push logic to absurd extreme', roles: 'pro/con', minRound: 2 },
    { id: 'anaphora', name: 'Anaphora', desc: 'Repetition for emphasis', roles: 'pro/con', minRound: 3 },
    { id: 'pathos', name: 'Pathos', desc: 'Emotional appeal via story', roles: 'pro/con', minRound: 1 },
    { id: 'logos', name: 'Logos', desc: 'Structured logical premises', roles: 'all', minRound: 1 },
    { id: 'analogy', name: 'Analogy', desc: 'Compare to familiar domain', roles: 'all', minRound: 2 },
    { id: 'rhetorical_question', name: 'Rhetorical Question', desc: 'Questions implying answer', roles: 'pro/con', minRound: 1 },
    { id: 'concession_rebuttal', name: 'Concession & Rebuttal', desc: 'Concede then reframe', roles: 'all', minRound: 3 },
    { id: 'historical_precedent', name: 'Historical Precedent', desc: 'Past events', roles: 'all', minRound: 2 },
    { id: 'triad', name: 'Rule of Three', desc: 'Triple listing', roles: 'pro/con', minRound: 3 },
];

export const RhetoricPanel: React.FC = () => {
    const { t } = useTranslation();
    const selector = useMemo(() => new RhetoricalDeviceSelector(), []);
    const [role, setRole] = useState('pro');
    const [round, setRound] = useState(3);
    const [prompt, setPrompt] = useState<string | null>(null);

    const handleGet = () => {
        const p = selector.getDevicePrompt(role, round, 'English');
        setPrompt(p ?? 'No device for this role/round — try higher round or different role.');
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Megaphone size={22} color="#ec4899" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Rhetoric — {t('nav.rhetoric')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(236,72,153,0.15)', color: '#f472b6', fontWeight: 600 }}>P2.6</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Rhetorical Persona Matrix — 10 devices (Socratic Irony, Reductio, Anaphora, Pathos, Logos, Analogy…) matched to role + round. Deterministic selection, prompt injection.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(236,72,153,0.15)', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Role
                    <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                        <option value="pro">Pro</option>
                        <option value="con">Con</option>
                        <option value="neutral">Neutral</option>
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Round
                    <input type="number" min={1} max={10} value={round} onChange={e => setRound(parseInt(e.target.value) || 1)} style={{ width: 70, padding: '6px 8px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleGet}><Sparkles size={14} /> Get device prompt</Button>
                <Button variant="ghost" onClick={() => setPrompt(null)}><RefreshCw size={14} /> Clear</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Sparkles size={16} color="#ec4899" /> Prompt — {prompt ? 'active' : 'empty'}</div>
                    {!prompt ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Select role/round and click Get device prompt.</div>
                    ) : (
                        <pre style={{ margin: 0, padding: '10px 12px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-300)', fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5, border: '1px solid rgba(255,255,255,0.06)' }}>{prompt}</pre>
                    )}
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10 }}>All devices — 10</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {DEVICES.map(d => (
                            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-200)', minWidth: 120 }}>{d.name}</span>
                                <span style={{ fontSize: 11, color: 'var(--slate-500)', flex: 1 }}>{d.desc}</span>
                                <span style={{ fontSize: 10, color: 'var(--slate-500)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 5px' }}>{d.roles}</span>
                                <span style={{ fontSize: 10, color: 'var(--slate-500)' }}>r≥{d.minRound}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> Selection: deterministic `(round*7 + roleLen) % available`. See <code style={{ color: '#f472b6' }}>rhetorical-device-selector.ts:102</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

export default RhetoricPanel;
