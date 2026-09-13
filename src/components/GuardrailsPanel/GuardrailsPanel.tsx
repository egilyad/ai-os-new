import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { guardrailService } from '../../kernel/instances/services-extras';
import type { GuardrailRule } from '../../kernel/contracts/rivals';
import { Button, StatusBadge } from '../../components/Common';

type Kind = GuardrailRule['kind'];
type Tripwire = GuardrailRule['tripwire'];

const KINDS: Kind[] = ['contains', 'regex', 'minLength', 'maxLength'];
const TRIPWIRES: Tripwire[] = ['block', 'flag'];

const inputStyle: React.CSSProperties = {
    width: '100%',
    marginBottom: '0.35rem',
    background: 'var(--bg-elevated)',
    color: 'inherit',
    border: '1px solid var(--border-subtle)',
    borderRadius: 6,
    padding: '0.3rem 0.5rem',
};

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    return (
        <div style={{ padding: '0.75rem 1rem' }}>
            <h2 style={{ margin: 0 }}>{t('guardrails.title')}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('guardrails.subtitle')}</p>
            {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
            {notice && <p style={{ opacity: 0.8 }}>{notice}</p>}

            <section aria-label={t('guardrails.rules.heading')}>
                <h3>{t('guardrails.rules.heading')}</h3>
                {rules.length === 0 ? (
                    <p style={{ opacity: 0.6 }}>{t('guardrails.rules.empty')}</p>
                ) : (
                    <ul>
                        {rules.map((r) => (
                            <li key={r.id}>
                                <strong>{r.name}</strong> <StatusBadge status={r.kind} label={t(`guardrails.kind.${r.kind}`)} />{' '}
                                <StatusBadge status={r.tripwire} label={t(`guardrails.tripwire.${r.tripwire}`)} />{' '}
                                <span style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                                    {r.pattern ?? (r.value !== undefined ? String(r.value) : '')}
                                </span>{' '}
                                <Button variant="danger" size="sm" disabled={busy} onClick={() => void handleRemove(r.id)}>
                                    {t('guardrails.remove')}
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section aria-label={t('guardrails.add.heading')}>
                <h3>{t('guardrails.add.heading')}</h3>
                <input
                    aria-label={t('guardrails.name')}
                    placeholder={t('guardrails.namePlaceholder')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <select
                        aria-label={t('guardrails.kind')}
                        value={kind}
                        onChange={(e) => setKind(e.target.value as Kind)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 170 }}
                    >
                        {KINDS.map((k) => (
                            <option key={k} value={k}>
                                {t(`guardrails.kind.${k}`)}
                            </option>
                        ))}
                    </select>
                    {needsPattern ? (
                        <input
                            aria-label={t('guardrails.pattern')}
                            placeholder={t('guardrails.patternPlaceholder')}
                            value={pattern}
                            onChange={(e) => setPattern(e.target.value)}
                            style={{ ...inputStyle, marginBottom: 0 }}
                        />
                    ) : (
                        <input
                            aria-label={t('guardrails.value')}
                            type="number"
                            min={1}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            style={{ ...inputStyle, marginBottom: 0, maxWidth: 130 }}
                        />
                    )}
                    <select
                        aria-label={t('guardrails.tripwire')}
                        value={tripwire}
                        onChange={(e) => setTripwire(e.target.value as Tripwire)}
                        style={{ ...inputStyle, marginBottom: 0, maxWidth: 140 }}
                    >
                        {TRIPWIRES.map((w) => (
                            <option key={w} value={w}>
                                {t(`guardrails.tripwire.${w}`)}
                            </option>
                        ))}
                    </select>
                    <Button variant="primary" size="sm" disabled={busy} onClick={() => void handleAdd()}>
                        {t('guardrails.add.submit')}
                    </Button>
                </div>
            </section>

            <section aria-label={t('guardrails.check.heading')}>
                <h3>{t('guardrails.check.heading')}</h3>
                <textarea
                    aria-label={t('guardrails.probe')}
                    placeholder={t('guardrails.probePlaceholder')}
                    value={probe}
                    onChange={(e) => setProbe(e.target.value)}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                />
                <Button variant="secondary" size="sm" disabled={busy || !probe} onClick={() => void handleCheck()}>
                    {t('guardrails.check.submit')}
                </Button>
                {verdict !== null && (
                    <div style={{ marginTop: '0.4rem' }}>
                        <StatusBadge
                            status={verdict.ok ? 'allowed' : 'blocked'}
                            label={t(verdict.ok ? 'guardrails.verdict.allowed' : 'guardrails.verdict.blocked')}
                        />
                        {verdict.hits.length > 0 && (
                            <ul>
                                {verdict.hits.map((h) => (
                                    <li key={h}>{h}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
