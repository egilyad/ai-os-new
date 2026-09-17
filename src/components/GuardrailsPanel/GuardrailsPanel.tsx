import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { guardrailService } from '../../kernel/instances/services-extras';
import type { GuardrailRule } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

type Kind = GuardrailRule['kind'];
type Tripwire = GuardrailRule['tripwire'];

const KINDS: Kind[] = ['contains', 'regex', 'minLength', 'maxLength'];
const TRIPWIRES: Tripwire[] = ['block', 'flag'];

export default function GuardrailsPanel() {
    const { t } = useTranslation();
    const [rules, setRules] = useState<GuardrailRule[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [kind, setKind] = useState<Kind>('contains');
    const [pattern, setPattern] = useState('');
    const [value, setValue] = useState('280');
    const [tripwire, setTripwire] = useState<Tripwire>('block');

    const [probe, setProbe] = useState('');
    const [verdict, setVerdict] = useState<{ ok: boolean; hits: string[] } | null>(null);
    const [search, setSearch] = useState('');

    const fail = (e: unknown) => {
        console.error('[GuardrailsPanel]', e);
        setError(t('guardrails.error.generic'));
    };

    const reload = async () => {
        try {
            setRules(await guardrailService.listRules());
        } catch (e) {
            fail(e);
        }
    };

    useEffect(() => {
        void reload();
    }, []);

    const needsPattern = kind === 'contains' || kind === 'regex';

    const handleAdd = async () => {
        setError(null);
        setNotice(null);
        if (!name.trim() || (needsPattern && !pattern.trim())) {
            setNotice(t('guardrails.validation.rule'));
            return;
        }
        setBusy(true);
        try {
            await guardrailService.addRule({
                name: name.trim().slice(0, 80),
                kind,
                pattern: needsPattern ? pattern.trim().slice(0, 500) : undefined,
                value: needsPattern ? undefined : Math.max(1, Number(value) || 1),
                tripwire,
            });
            setName('');
            setPattern('');
            await reload();
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const handleRemove = async (id: string) => {
        setError(null);
        setBusy(true);
        try {
            await guardrailService.removeRule(id);
            await reload();
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const handleCheck = async () => {
        setError(null);
        setVerdict(null);
        if (!probe) return;
        setBusy(true);
        try {
            setVerdict(await guardrailService.check(probe));
        } catch (e) {
            fail(e);
        } finally {
            setBusy(false);
        }
    };

    const filtered = search.trim()
        ? rules.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || (r.pattern ?? '').toLowerCase().includes(search.toLowerCase()))
        : rules;

    const kindColor: Record<string, string> = { contains: '#3b82f6', regex: '#a855f7', minLength: '#f59e0b', maxLength: '#ef4444' };

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--slate-900)', color: 'var(--slate-200)' }}>
            {/* Sidebar — rules */}
            <div style={{ width: 360, minWidth: 360, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{t('guardrails.title')}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>{t('guardrails.subtitle')}</div>
                    {error && <div style={{ marginTop: 8, color: 'var(--error)', fontSize: 12 }}>{error}</div>}
                    {notice && <div style={{ marginTop: 8, color: '#f59e0b', fontSize: 12 }}>{notice}</div>}
                </div>

                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <input placeholder={t('common.search') ?? 'Search rules…'} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12 }} />
                    <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 6 }}>{filtered.length} / {rules.length} rules</div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: 'var(--slate-500)', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>{rules.length === 0 ? t('guardrails.rules.empty') : 'No matches'}</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {filtered.map((r) => (
                                <div key={r.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${kindColor[r.kind] ?? '#64748b'}` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: 12 }}>{r.name}</span>
                                        <StatusBadge status={r.kind} label={t(`guardrails.kind.${r.kind}`)} />
                                        <StatusBadge status={r.tripwire} label={t(`guardrails.tripwire.${r.tripwire}`)} />
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 6, wordBreak: 'break-all', background: 'rgba(0,0,0,0.2)', padding: '4px 6px', borderRadius: 6, fontFamily: 'monospace' }}>{r.pattern ?? (r.value !== undefined ? String(r.value) : '—')}</div>
                                    <Button variant="danger" size="sm" disabled={busy} onClick={() => void handleRemove(r.id)} style={{ marginTop: 8 }}>{t('guardrails.remove')}</Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Main — add + check */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 8 }}>{t('guardrails.add.heading')}</div>
                    <input placeholder={t('guardrails.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 12, marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} style={{ flex: 1, minWidth: 120, padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'inherit', fontSize: 11 }}>
                            {KINDS.map((k) => <option key={k} value={k}>{t(`guardrails.kind.${k}`)}</option>)}
                        </select>
                        {needsPattern ? (
                            <input placeholder={t('guardrails.patternPlaceholder')} value={pattern} onChange={(e) => setPattern(e.target.value)} style={{ flex: 2, minWidth: 160, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 11 }} />
                        ) : (
                            <input type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} style={{ flex: 1, maxWidth: 100, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: 11 }} />
                        )}
                        <select value={tripwire} onChange={(e) => setTripwire(e.target.value as Tripwire)} style={{ padding: '7px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'inherit', fontSize: 11 }}>
                            {TRIPWIRES.map((w) => <option key={w} value={w}>{t(`guardrails.tripwire.${w}`)}</option>)}
                        </select>
                        <Button variant="primary" size="sm" disabled={busy} onClick={() => void handleAdd()}>{t('guardrails.add.submit')}</Button>
                    </div>
                </div>

                <div style={{ padding: '16px 20px', flex: 1, overflowY: 'auto' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 10 }}>{t('guardrails.check.heading')}</div>
                    <textarea placeholder={t('guardrails.probePlaceholder')} value={probe} onChange={(e) => setProbe(e.target.value)} rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'inherit', fontSize: 12, resize: 'vertical', marginBottom: 10 }} />
                    <Button variant="secondary" size="sm" disabled={busy || !probe} onClick={() => void handleCheck()}>{t('guardrails.check.submit')}</Button>

                    {verdict !== null && (
                        <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: verdict.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${verdict.ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}` }}>
                            <StatusBadge status={verdict.ok ? 'allowed' : 'blocked'} label={t(verdict.ok ? 'guardrails.verdict.allowed' : 'guardrails.verdict.blocked')} />
                            {verdict.hits.length > 0 ? (
                                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {verdict.hits.map((h) => (
                                        <div key={h} style={{ padding: '6px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', fontSize: 11, fontFamily: 'monospace' }}>{h}</div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--slate-500)' }}>No hits — clean</div>
                            )}
                        </div>
                    )}

                    {verdict === null && (
                        <div style={{ marginTop: 16, textAlign: 'center', padding: 24, color: 'var(--slate-500)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}>Paste text above and check against {rules.length} guardrail{rules.length !== 1 ? 's' : ''}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
