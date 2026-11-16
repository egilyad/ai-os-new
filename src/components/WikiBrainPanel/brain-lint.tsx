import React, { useCallback, useEffect, useState } from 'react';
import { tokens } from '../../styles/tokens';
import { useTranslation } from '../../i18n/useTranslation';
import { getBrain } from './use-wiki-brain';
import type { TWikiLintIssue } from '../../kernel/contracts/wiki-brain/types';

const label: React.CSSProperties = {
    fontSize: 12,
    color: tokens.slate[500],
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
};

const buttonStyle: React.CSSProperties = {
    background: tokens.accent,
    color: tokens.slate[950],
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: 12,
};

export default function BrainLint() {
    const { t } = useTranslation();
    const [issues, setIssues] = useState<TWikiLintIssue[]>([]);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const list = await getBrain().lint.listIssues();
            setIssues(list.slice(0, 30));
        } catch {
            setIssues([]);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    const run = async () => {
        setBusy(true);
        try {
            await getBrain().lint.runAll();
            await load();
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <div style={label}>Проверки (lint)</div>
            <button style={buttonStyle} disabled={busy} onClick={() => void run()}>
                {busy ? '...' : 'Запустить проверки'}
            </button>
            {issues.length === 0 ? (
                <div style={{ color: tokens.slate[500], fontSize: 14 }}>{t('wiki.no_lint')}</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {issues.map((i) => (
                        <li
                            key={`${i.rule}-${i.message}`}
                            style={{
                                background: tokens.surface,
                                border: `1px solid ${tokens.borderSubtle}`,
                                borderRadius: 8,
                                padding: '10px 12px',
                                marginBottom: 6,
                            }}
                        >
                            <div>
                                <span style={{ fontWeight: 600 }}>{i.rule}</span>{' '}
                                <span style={{ color: tokens.slate[500], fontSize: 13 }}>[{i.severity}]</span>
                            </div>
                            <div style={{ color: tokens.slate[400], fontSize: 13, marginTop: 2 }}>{i.message}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
