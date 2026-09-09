/**
 * CouncilPanel — D2.1 Fleet — Councils canonical wiring.
 *
 * Path: Fleet — Councils → councilStore → CouncilService → Dexie councilSessions/Messages/Votes.
 * No new runtime, no ArgTech, no Provenance — wiring only.
 * Mobile: stacked via ResponsiveShell (isMobile ? 1fr : 380px 1fr).
 */

import React, { useEffect, useState } from 'react';
import { useCouncilStore } from '../../stores/councilStore';
import { useResponsive } from '../Layout/ResponsiveShell';
import { lazyService } from '../../kernel/service-helper';
import type { ICouncilService } from '../../kernel/contracts/council';
import type { CouncilSession } from '../../kernel/types/council-types';

const councilService = lazyService<ICouncilService>('councilService');

const btn: React.CSSProperties = { padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer', border: '1px solid #2a2a35', background: 'transparent', color: 'inherit' };
const primaryBtn: React.CSSProperties = { ...btn, background: '#a855f7', color: '#fff', fontWeight: 700 };
const card: React.CSSProperties = { border: '1px solid #2a2a35', borderRadius: 8, padding: '0.6rem 0.8rem', marginBottom: '0.5rem' };
const inputStyle: React.CSSProperties = { padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #2a2a35', background: 'transparent', color: 'inherit', width: '100%', boxSizing: 'border-box' };

export const CouncilPanel: React.FC = () => {
    const { isMobile } = useResponsive();
    const sessions = useCouncilStore((s) => s.sessions);
    const activeId = useCouncilStore((s) => s.activeSessionId);
    const refresh = useCouncilStore((s) => s.refresh);
    const select = useCouncilStore((s) => s.select);
    const [topic, setTopic] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [detail, setDetail] = useState<CouncilSession | null>(null);
    const [msgBody, setMsgBody] = useState('');
    const [factClaim, setFactClaim] = useState('');

    useEffect(() => { void refresh(); }, [refresh]);

    useEffect(() => {
        if (!activeId) { setDetail(null); return; }
        councilService.getSession(activeId).then(setDetail).catch((e) => setError(e instanceof Error ? e.message : String(e)));
    }, [activeId, sessions]);

    const run = async (fn: () => Promise<unknown>) => {
        setBusy(true); setError(null);
        try { await fn(); await refresh(); if (activeId) { const d = await councilService.getSession(activeId); setDetail(d); } } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
    };

    const create = async () => {
        if (!topic.trim()) return;
        await run(async () => {
            const s = await councilService.createSession({ topic: topic.trim(), config: { doubleBlind: true, factGathering: true } });
            select(s.id);
            setTopic('');
        });
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden', padding: '0.75rem 0' }}>
            <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Fleet — Councils</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>Canonical wiring: Store → CouncilService → Dexie (no new runtime, no ArgTech/Provenance)</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input style={{ ...inputStyle, flex: '1 1 260px' }} placeholder="Topic — e.g. Should we prioritize X?" value={topic} onChange={(e) => setTopic(e.target.value)} />
                <button style={primaryBtn} disabled={busy || !topic.trim()} onClick={() => void create()}>Create Council</button>
                <button style={btn} disabled={busy} onClick={() => void refresh()}>Refresh</button>
            </div>

            {error && <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>}

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '380px 1fr', gap: '0.75rem', minHeight: 0, overflow: 'hidden' }}>
                {/* List */}
                <div style={{ overflowY: 'auto', border: '1px solid #2a2a35', borderRadius: 8, padding: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Sessions ({sessions.length})</div>
                    {sessions.length === 0 && <p style={{ opacity: 0.5, fontSize: '0.85rem' }}>No councils yet — create one.</p>}
                    {sessions.map((s) => (
                        <div key={s.id} onClick={() => select(s.id)} style={{ ...card, cursor: 'pointer', background: activeId === s.id ? 'rgba(168,85,247,0.12)' : 'transparent', borderColor: activeId === s.id ? '#a855f7' : '#2a2a35' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.topic.slice(0, 80)}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{s.phase} · {s.status} · {s.messages.length} msgs · {s.facts.length} facts · {s.scores.length} judges {s.winnerId ? `· winner ${s.winnerId.slice(0, 8)}` : ''}</div>
                        </div>
                    ))}
                </div>

                {/* Detail */}
                <div style={{ overflowY: 'auto', border: '1px solid #2a2a35', borderRadius: 8, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {!detail && <p style={{ opacity: 0.5 }}>Select a council to see detail / act.</p>}
                    {detail && (
                        <>
                            <div style={{ fontWeight: 700 }}>{detail.topic}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{detail.phase} · {detail.status} · aliases: {detail.aliases ? Object.values(detail.aliases).join(', ') : '—'}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Participants: {detail.participants.map((p) => `${p.name}(${p.kind}${p.lensId ? `:${p.lensId}` : ''})`).join(', ')}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Judges: {detail.judges.map((j) => `${j.name} w${j.weight ?? 1}`).join(', ') || '—'} {detail.winnerId ? `→ winner ${detail.winnerId}` : ''}</div>
                            {detail.summary && <div style={{ fontSize: '0.8rem', background: 'rgba(168,85,247,0.08)', padding: '0.5rem', borderRadius: 6 }}>{detail.summary}</div>}

                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <button style={btn} disabled={busy} onClick={() => void run(() => councilService.advancePhase(detail.id))}>Advance Phase</button>
                                <button style={primaryBtn} disabled={busy} onClick={() => void run(() => councilService.conclude(detail.id))}>Conclude (tally)</button>
                                <button style={btn} disabled={busy} onClick={() => void run(() => councilService.abort(detail.id))}>Abort</button>
                            </div>

                            <div style={{ borderTop: '1px solid #2a2a35', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Forum / Whisper (double-blind)</div>
                                <div style={{ maxHeight: 160, overflowY: 'auto', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                    {detail.messages.length === 0 && <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>No messages</span>}
                                    {detail.messages.slice(-20).map((m) => (
                                        <div key={m.id} style={{ fontSize: '0.78rem', background: m.channel === 'whisper' ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', padding: '0.35rem 0.5rem', borderRadius: 6 }}>
                                            <b>{m.channel}</b> {m.authorId.slice(0, 8)}→{m.toId?.slice(0, 8) ?? 'forum'}: {m.body.slice(0, 200)}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Forum message (first participant)" value={msgBody} onChange={(e) => setMsgBody(e.target.value)} />
                                    <button style={btn} disabled={busy || !msgBody.trim()} onClick={() => {
                                        const author = detail.participants[0]?.id;
                                        if (!author) return;
                                        void run(() => councilService.postMessage(detail.id, author, msgBody.trim()).then(() => setMsgBody('')));
                                    }}>Post</button>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #2a2a35', paddingTop: '0.5rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Facts ({detail.facts.length})</div>
                                {detail.facts.slice(-5).map((f) => (
                                    <div key={f.id} style={{ fontSize: '0.78rem', opacity: 0.8 }}>{f.verdict} — {f.claim.slice(0, 120)} {f.sources?.length ? `· sources ${f.sources.length}` : ''}</div>
                                ))}
                                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                                    <input style={{ ...inputStyle, flex: 1 }} placeholder="Fact claim (researcher)" value={factClaim} onChange={(e) => setFactClaim(e.target.value)} />
                                    <button style={btn} disabled={busy || !factClaim.trim()} onClick={() => {
                                        const researcher = detail.participants.find((p) => p.kind === 'researcher' || p.kind === 'fact_checker')?.id ?? detail.participants[0]?.id;
                                        if (!researcher) return;
                                        void run(() => councilService.submitFact(detail.id, researcher, factClaim.trim(), 'unverifiable', []).then(() => setFactClaim('')));
                                    }}>Add Fact</button>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #2a2a35', paddingTop: '0.5rem' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Judging ({detail.scores.length})</div>
                                {detail.scores.slice(-5).map((s, i) => (
                                    <div key={i} style={{ fontSize: '0.78rem' }}>{s.judgeId.slice(0, 8)} → {s.winnerId} {s.blind ? '(blind)' : ''}</div>
                                ))}
                                <button style={btn} disabled={busy} onClick={() => {
                                    const judge = detail.judges[0]?.id;
                                    const pick = detail.participants[0]?.id;
                                    if (!judge || !pick) return;
                                    void run(() => councilService.submitJudgeScore(detail.id, judge, pick, {}, 'wiring check'));
                                }}>Judge (first judge → first participant)</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CouncilPanel;
