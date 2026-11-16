import React, { useState } from 'react';
import { tokens } from '../../styles/tokens';
import { getBrain } from './use-wiki-brain';
import type { WikiQueryResult } from '../../kernel/contracts/wiki-brain/wiki-query.service';

const label: React.CSSProperties = {
    fontSize: 12,
    color: tokens.slate[500],
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
};

const input: React.CSSProperties = {
    width: '100%',
    background: tokens.surface,
    border: `1px solid ${tokens.borderDefault}`,
    borderRadius: 8,
    padding: '8px 10px',
    color: tokens.slate[200],
    fontSize: 14,
    marginBottom: 12,
};

const buttonStyle: React.CSSProperties = {
    background: tokens.accent,
    color: tokens.slate[950],
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 700,
    cursor: 'pointer',
};

export default function BrainSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<WikiQueryResult[]>([]);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const runSearch = async () => {
        const q = query.trim();
        if (!q) return;
        setBusy(true);
        setMessage('');
        try {
            const hits = await getBrain().query.search(q, { topK: 8 });
            setResults(hits);
            if (hits.length === 0) setMessage('Ничего не найдено');
        } catch (e) {
            setMessage(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <div style={label}>Поиск по Wiki-Brain (BM25)</div>
            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    style={input}
                    placeholder="Запрос…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') void runSearch();
                    }}
                />
                <button style={buttonStyle} disabled={busy || !query.trim()} onClick={() => void runSearch()}>
                    {busy ? '…' : 'Найти'}
                </button>
            </div>

            {message && <div style={{ color: tokens.slate[500], fontSize: 13, marginTop: 8 }}>{message}</div>}

            {results.map((r) => (
                <div
                    key={r.page.slug}
                    style={{
                        background: tokens.surface,
                        border: `1px solid ${tokens.borderSubtle}`,
                        borderRadius: 10,
                        padding: 12,
                        marginTop: 10,
                    }}
                >
                    <div style={{ fontWeight: 700, color: tokens.slate[200] }}>
                        [[{r.page.slug}]] {r.page.frontmatter.title}
                    </div>
                    <div style={{ fontSize: 13, color: tokens.slate[400], marginTop: 4 }}>{r.snippet}</div>
                    {r.sources.length > 0 && (
                        <div style={{ fontSize: 11, color: tokens.slate[500], marginTop: 6 }}>
                            Источники: {r.sources.map((s) => s.origin).join(', ')}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
