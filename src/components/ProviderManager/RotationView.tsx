import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Repeat, Timer, Link2 } from 'lucide-react';
import { keyService, rotationService, sessionAffinityStore, keyStateStore, rootLogger } from '../../kernel/instances';
import { usePolling } from '../Common/usePolling';
import { PROVIDER_DEFAULT_MODELS } from '../../kernel/utils/provider-default-models';
import { DEBATE_MODEL_PRIORITY } from '../../kernel/services/debate-runtime/debate-query-engine';
import type { ApiKey } from '../../types/metrics';
import type { PoolStrategy } from '../../kernel/contracts/pool-selector';

const LOGGER = rootLogger.child('RotationView');

// Debate provider order is hardcoded in router-debate-selector.ts PRIORITY — readout only.
const DEBATE_PROVIDER_ORDER = ['groq', 'gemini', 'openrouter', 'nvidia', 'cerebras'];

const STRATEGIES: PoolStrategy[] = ['round-robin', 'least-usage', 'random'];

interface RotationViewProps {
    keys: ApiKey[];
}

function maskKey(id: string): string {
    return id.length > 16 ? `${id.slice(0, 12)}…${id.slice(-6)}` : id;
}

function formatLeft(ms: number): string {
    if (ms <= 0) return '—';
    const h = Math.floor(ms / 3600000);
    if (h < 48) return `${h}h`;
    return `${Math.floor(h / 24)}d ${h % 24}h`;
}

const RotationView: React.FC<RotationViewProps> = ({ keys }) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [strategies, setStrategies] = useState<Record<string, PoolStrategy>>({});
    const [ttlHours, setTtlHours] = useState<Record<string, string>>({});
    const [autoRotate, setAutoRotate] = useState<Record<string, boolean>>({});
    const [ttlInfo, setTtlInfo] = useState<Record<string, { remainingMs: number; expiresAt: string | null; active: boolean }>>({});
    const [bindings, setBindings] = useState<Array<{ session: string; key: string; provider: string; status: string }>>([]);

    const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
    usePolling(refresh, 15000);

    useEffect(() => {
        const providers = [...new Set(keys.map((k) => k.provider.toLowerCase()))];
        const s: Record<string, PoolStrategy> = {};
        for (const p of providers) {
            try {
                s[p] = keyService.getPoolStrategy(p);
            } catch {
                s[p] = 'round-robin';
            }
        }
        setStrategies(s);

        const t: Record<string, { remainingMs: number; expiresAt: string | null; active: boolean }> = {};
        const hours: Record<string, string> = {};
        const auto: Record<string, boolean> = {};
        for (const k of keys) {
            try {
                t[k.id] = rotationService.getTTLStatus(k.id);
            } catch {
                t[k.id] = { remainingMs: 0, expiresAt: null, active: false };
            }
            hours[k.id] = String(k.rotationConfig?.ttlHours ?? '');
            auto[k.id] = k.rotationConfig?.autoRotate ?? false;
        }
        setTtlInfo(t);
        setTtlHours(hours);
        setAutoRotate(auto);

        try {
            const raw = sessionAffinityStore.getAllBindings();
            setBindings(
                raw.slice(0, 20).map((b) => {
                    let status = 'unknown';
                    try {
                        status = keyStateStore?.get(b.keyId)?.status ?? 'unknown';
                    } catch { /* ignore */ }
                    return { session: b.sessionId, key: maskKey(b.keyId), provider: b.provider, status };
                }),
            );
        } catch {
            setBindings([]);
        }
    }, [keys, refreshKey]);

    const handleStrategy = async (provider: string, strategy: PoolStrategy) => {
        setStrategies((prev) => ({ ...prev, [provider]: strategy }));
        try {
            await keyService.setPoolStrategy(provider, strategy);
        } catch (e) {
            LOGGER.warn('RotationView', 'setPoolStrategy failed', { error: e });
        }
    };

    const handleSetTTL = (keyId: string) => {
        const h = Number(ttlHours[keyId]);
        if (!h || h <= 0) return;
        try {
            rotationService.setKeyTTL(keyId, h, autoRotate[keyId] ?? false);
            refresh();
        } catch (e) {
            LOGGER.warn('RotationView', 'setKeyTTL failed', { error: e });
        }
    };

    const handleCancelTTL = (keyId: string) => {
        try {
            rotationService.cancelRotation(keyId);
            refresh();
        } catch (e) {
            LOGGER.warn('RotationView', 'cancelRotation failed', { error: e });
        }
    };

    const handleRotateNow = async (keyId: string) => {
        try {
            await rotationService.rotateNow(keyId);
            refresh();
        } catch (e) {
            LOGGER.warn('RotationView', 'rotateNow failed', { error: e });
        }
    };

    const providers = [...new Set(keys.map((k) => k.provider.toLowerCase()))].sort();
    const ttlKeys = keys.filter((k) => k.rotationConfig || ttlInfo[k.id]?.active);

    const poolStatus = (provider: string): string => {
        try {
            const st = keyService.getPoolStatus(provider);
            return st.limit > 0 ? `${st.used}/${st.limit}` : `${st.used}`;
        } catch {
            return '—';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Repeat size={22} color="#8b5cf6" aria-hidden="true" />
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Rotation</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Three separate mechanisms decide which key answers. This tab shows all three live.
                    </p>
                </div>
                <button
                    onClick={refresh}
                    aria-label="Refresh rotation state"
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer', color: 'var(--slate-300)', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* 1. Mechanisms explainer */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>1 · Per-request pick</strong>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Pool strategy per provider (round-robin / least-usage / random) + router scoring (health ≥ 75, circuit, cost, latency). Change the strategy below — it persists.
                    </p>
                </div>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>2 · Session affinity</strong>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        A healthy bound key serves its session until circuit/rate/auth flags or health drops. {bindings.length > 0 ? `${bindings.length} live bindings shown below.` : 'No live bindings right now.'}
                    </p>
                </div>
                <div className="glass-panel" style={{ padding: '1rem' }}>
                    <strong>3 · TTL secret rotation</strong>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Expiry timers per key (RotationService, 60s tick). TTL ≠ request routing — it rotates the secret itself.
                    </p>
                </div>
            </div>

            {/* 2. Live per-provider table */}
            <div className="glass-panel" style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Live selection state per provider</h4>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '0.4rem' }}>Provider</th>
                                <th style={{ padding: '0.4rem' }}>Keys on/off</th>
                                <th style={{ padding: '0.4rem' }}>Pool strategy</th>
                                <th style={{ padding: '0.4rem' }}>Pool used</th>
                                <th style={{ padding: '0.4rem' }}>Default model</th>
                                <th style={{ padding: '0.4rem' }}>Debate models</th>
                                <th style={{ padding: '0.4rem' }}>Debate order</th>
                            </tr>
                        </thead>
                        <tbody>
                            {providers.map((p) => {
                                const on = keys.filter((k) => k.provider.toLowerCase() === p && k.status === 'active').length;
                                const total = keys.filter((k) => k.provider.toLowerCase() === p).length;
                                return (
                                    <tr key={p} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                        <td style={{ padding: '0.4rem', fontWeight: 700 }}>{p}</td>
                                        <td style={{ padding: '0.4rem' }}>{on}/{total}</td>
                                        <td style={{ padding: '0.4rem' }}>
                                            <select
                                                value={strategies[p] ?? 'round-robin'}
                                                onChange={(e) => void handleStrategy(p, e.target.value as PoolStrategy)}
                                                aria-label={`Pool strategy for ${p}`}
                                                style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--slate-200)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.25rem 0.5rem' }}
                                            >
                                                {STRATEGIES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ padding: '0.4rem' }}>{poolStatus(p)}</td>
                                        <td style={{ padding: '0.4rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>{PROVIDER_DEFAULT_MODELS[p] ?? '—'}</td>
                                        <td style={{ padding: '0.4rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>{(DEBATE_MODEL_PRIORITY[p] ?? []).join(', ') || '—'}</td>
                                        <td style={{ padding: '0.4rem' }}>{DEBATE_PROVIDER_ORDER.indexOf(p) >= 0 ? `#${DEBATE_PROVIDER_ORDER.indexOf(p) + 1}` : '—'}</td>
                                    </tr>
                                );
                            })}
                            {providers.length === 0 && (
                                <tr><td colSpan={7} style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>No keys installed.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. TTL rotation */}
            <div className="glass-panel" style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Timer size={15} /> TTL secret rotation
                </h4>
                {ttlKeys.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        No TTL timers set. Set hours per key below to schedule secret rotation.
                    </p>
                ) : (
                    ttlKeys.map((k) => (
                        <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: 'monospace' }}>{maskKey(k.id)}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{k.provider}</span>
                            <span>left: <strong>{formatLeft(ttlInfo[k.id]?.remainingMs ?? 0)}</strong></span>
                            <span style={{ color: ttlInfo[k.id]?.active ? '#22c55e' : 'var(--text-muted)' }}>
                                {ttlInfo[k.id]?.active ? 'active' : 'idle'}
                            </span>
                            <input
                                type="number"
                                min={1}
                                placeholder="hours"
                                value={ttlHours[k.id] ?? ''}
                                onChange={(e) => setTtlHours((prev) => ({ ...prev, [k.id]: e.target.value }))}
                                aria-label={`TTL hours for ${maskKey(k.id)}`}
                                style={{ width: 80, background: 'rgba(0,0,0,0.3)', color: 'var(--slate-200)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.25rem 0.5rem' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    checked={autoRotate[k.id] ?? false}
                                    onChange={(e) => setAutoRotate((prev) => ({ ...prev, [k.id]: e.target.checked }))}
                                />
                                auto
                            </label>
                            <button onClick={() => handleSetTTL(k.id)} style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '0.25rem 0.7rem', cursor: 'pointer', color: '#93c5fd' }}>Set</button>
                            <button onClick={() => handleCancelTTL(k.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.25rem 0.7rem', cursor: 'pointer', color: 'var(--slate-300)' }}>Cancel</button>
                            <button onClick={() => void handleRotateNow(k.id)} style={{ background: 'transparent', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 8, padding: '0.25rem 0.7rem', cursor: 'pointer', color: '#fbbf24' }}>Rotate now</button>
                        </div>
                    ))
                )}
            </div>

            {/* 4. Affinity snapshot */}
            <div className="glass-panel" style={{ padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link2 size={15} /> Session affinity snapshot
                </h4>
                {bindings.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        No bound sessions. Full table lives at /session-bindings.
                    </p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '0.4rem' }}>Session</th>
                                <th style={{ padding: '0.4rem' }}>Key</th>
                                <th style={{ padding: '0.4rem' }}>Provider</th>
                                <th style={{ padding: '0.4rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bindings.map((b, i) => (
                                <tr key={`${b.session}-${i}`} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                    <td style={{ padding: '0.4rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>{b.session}</td>
                                    <td style={{ padding: '0.4rem', fontFamily: 'monospace', fontSize: '0.72rem' }}>{b.key}</td>
                                    <td style={{ padding: '0.4rem' }}>{b.provider}</td>
                                    <td style={{ padding: '0.4rem' }}>{b.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default RotationView;
