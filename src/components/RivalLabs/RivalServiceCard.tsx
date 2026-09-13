import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../../components/Common';
import type { RivalServiceDef } from './rivalLabsConfig';

function stringify(value: unknown): string {
    try {
        if (typeof value === 'string') return value;
        return JSON.stringify(value, null, 2) ?? String(value);
    } catch {
        return String(value);
    }
}

export default function RivalServiceCard({ def }: { def: RivalServiceDef }) {
    const { t } = useTranslation();
    const [a, setA] = useState('');
    const [b, setB] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    const run = async () => {
        setBusy(true);
        setFailed(false);
        setResult(null);
        try {
            if (def.run) {
                setResult(stringify(await def.run(a, b)));
            } else {
                const target = def.svc as unknown as Record<string, (...args: never[]) => Promise<unknown>>;
                // dynamic dispatch over the lazyService proxy: the method name
                // comes from rivalLabsConfig, typed at the config boundary.
                const fn = target[def.method];
                if (!fn) throw new Error(`Unknown RivalLabs method: ${def.method}`);
                setResult(stringify(await fn(...(def.map(a, b) as never[]))));
            }
        } catch (e) {
            // Never render raw errors (FX-03 discipline); details go to console.
            console.error(`[RivalLabs:${def.key}]`, e);
            setFailed(true);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div
            style={{
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: '0.6rem 0.75rem',
                background: 'var(--surface)',
            }}
        >
            <div style={{ fontWeight: 600, marginBottom: '0.4rem' }}>{def.title}</div>
            {def.args !== 'none' && (
                <input
                    aria-label={t('rivalLabs.inputA')}
                    placeholder={t('rivalLabs.inputA')}
                    value={a}
                    onChange={(e) => setA(e.target.value)}
                    style={{
                        width: '100%',
                        marginBottom: '0.35rem',
                        background: 'var(--bg-elevated)',
                        color: 'inherit',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '0.3rem 0.5rem',
                    }}
                />
            )}
            {def.args === 'ab' && (
                <input
                    aria-label={t('rivalLabs.inputB')}
                    placeholder={t('rivalLabs.inputB')}
                    value={b}
                    onChange={(e) => setB(e.target.value)}
                    style={{
                        width: '100%',
                        marginBottom: '0.35rem',
                        background: 'var(--bg-elevated)',
                        color: 'inherit',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 6,
                        padding: '0.3rem 0.5rem',
                    }}
                />
            )}
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => void run()}>
                {busy ? t('rivalLabs.running') : t('rivalLabs.run')}
            </Button>
            {failed && <p style={{ color: 'var(--error)' }}>{t('rivalLabs.error.generic')}</p>}
            {result !== null && (
                <pre
                    style={{
                        marginTop: '0.4rem',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: 220,
                        overflow: 'auto',
                    }}
                >
                    {result}
                </pre>
            )}
        </div>
    );
}
