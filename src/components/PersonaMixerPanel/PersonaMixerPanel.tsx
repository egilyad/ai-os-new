import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Shuffle, RefreshCw, Info } from 'lucide-react';
import { PersonaMixer } from '../../kernel/services/debate-runtime/persona-mixer';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { Button } from '../Common';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

export const PersonaMixerPanel: React.FC = () => {
    const { t } = useTranslation();
    const mixer = useMemo(() => new PersonaMixer(), []);
    const realAgents = useRealAgents();
    const { args: liveArgs, topic: liveTopic, sessionId, hasLiveDebate } = useDebateArguments();
    const agents = realAgents;
    const loadDebate = useCallback(() => { if (liveTopic) setBasePersona(liveTopic); }, [liveTopic]);
    const [agentId, setAgentId] = useState<string>(() => agents[0]?.id ?? '');
    useEffect(() => {
        if (!agents.some((a) => a.id === agentId)) setAgentId(agents[0]?.id ?? '');
    }, [agents, agentId]);
    const [round, setRound] = useState(1);
    const [basePersona, setBasePersona] = useState('');
    const [mix, setMix] = useState<ReturnType<PersonaMixer['getMix']> | null>(null);
    const [history, setHistory] = useState<Array<{ round: number; mix: ReturnType<PersonaMixer['getMix']> }>>([]);

    useEffect(() => { if (hasLiveDebate) loadDebate(); }, [sessionId]);

    const handleMix = () => {
        const others = agents
            .filter((a) => a.id !== agentId)
            .map((a) => ({ id: a.id, name: a.name, role: 'pro', persona: '' }));
        const ctx = {
            agentId,
            agentName: agents.find((a) => a.id === agentId)?.name ?? agentId,
            basePersona,
            agentRole: 'pro',
            round,
            otherParticipants: others,
            usedPersonaKeys: history.filter(h => h.round < round).map(h => h.mix.variationKey),
        };
        const m = mixer.getMix(ctx);
        mixer.recordMix(agentId, round, m.variationKey);
        setMix(m);
        setHistory(h => [...h, { round, mix: m }]);
    };

    return (
        <div style={{ padding: 20, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Shuffle size={22} color="#8b5cf6" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--slate-50)' }}>Persona Mixer — {t('nav.persona_mixer')}</h2>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontWeight: 600 }}>P1.9</span>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Live</span>
                {hasLiveDebate && (
                    <span title={sessionId ?? ''} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(34,197,94,0.12)', color: '#10b981', fontWeight: 600, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Active debate: {liveTopic}
                    </span>
                )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)', lineHeight: 1.5 }}>
                Linear interpolation of persona traits + noise each round — 8 variations (primary/skeptic/synthesizer/pragmatist/visionary/critic/historian/bridge_builder) + optional blend from another participant. Fingerprint tracked.
            </p>

            {agents.length === 0 && (
                <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#f87171' }}>
                    No agents available
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, alignItems: 'end', padding: '10px 14px', borderRadius: 10, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(139,92,246,0.15)', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Agent
                    <select value={agentId} onChange={e => { setAgentId(e.target.value); }} style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }}>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)' }}>
                    Round
                    <input type="number" min={1} max={20} value={round} onChange={e => setRound(parseInt(e.target.value) || 1)} style={{ width: 70, padding: '6px 8px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--slate-300)', flex: 1, minWidth: 300 }}>
                    Base persona
                    <input value={basePersona} onChange={e => setBasePersona(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--slate-900)', color: 'var(--slate-100)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13 }} />
                </label>
                <Button variant="primary" onClick={handleMix}><Shuffle size={14} /> Mix</Button>
                <Button variant="secondary" onClick={loadDebate} disabled={!hasLiveDebate} title={sessionId ?? ''}>Load active debate</Button>
                <Button variant="ghost" onClick={() => { mixer.clearSession(); setMix(null); setHistory([]); }}><RefreshCw size={14} /> Clear session</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}>
                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Shuffle size={16} color="#8b5cf6" /> Mix — r{round} for {agentId}</div>
                    {!mix ? (
                        <div style={{ padding: 16, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>Click Mix to generate variation for {agentId} r{round}.</div>
                    ) : (
                        <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#8b5cf6', borderRadius: 4, padding: '2px 8px' }}>{mix.variationKey}</span>
                                {mix.blendedFrom && <span style={{ fontSize: 11, color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4, padding: '1px 6px' }}>blended from {mix.blendedFrom}</span>}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--slate-200)', lineHeight: 1.5, padding: '8px 10px', borderRadius: 6, background: 'var(--slate-900)', border: '1px solid rgba(255,255,255,0.06)' }}>{mix.personaText}</div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(mix.personaText)}><Copy size={12} /> Copy</Button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ padding: 14, borderRadius: 12, background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--slate-200)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Users size={16} color="#8b5cf6" /> History — {history.length} mixes</div>
                    {history.length === 0 ? (
                        <div style={{ padding: 12, textAlign: 'center', color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8 }}>No mixes yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                            {history.map((h, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 12 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)' }}>r{h.round}</span>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#8b5cf6', borderRadius: 3, padding: '1px 6px' }}>{h.mix.variationKey}</span>
                                    <span style={{ flex: 1, color: 'var(--slate-400)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.mix.personaText.slice(0, 60)}…</span>
                                    {h.mix.blendedFrom && <span style={{ fontSize: 10, color: '#fbbf24' }}>↔ {h.mix.blendedFrom}</span>}
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)', display: 'flex', gap: 6, alignItems: 'center' }}><Info size={12} /> 8 variations, deterministic hash, blend after round 1. See <code style={{ color: '#a78bfa' }}>persona-mixer.ts:74</code>.</div>
                </div>
            </div>

            <ModuleInfo moduleKey="debate" />
        </div>
    );
};

function Users(props: { size: number; color: string }) {
    return <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke={props.color} strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
function Copy(props: { size: number }) {
    return <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3" /></svg>;
}

export default PersonaMixerPanel;
