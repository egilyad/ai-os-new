import React, { useCallback, useEffect, useState } from 'react';
import { tokens } from '../../styles/tokens';
import { MarkdownRenderer } from '../ChatPanel/MarkdownRenderer';
import { getBrain } from './use-wiki-brain';
import type { TWikiPage } from '../../kernel/contracts/wiki-brain';

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
    padding: '6px 12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 12,
};

export default function BrainPages({
    initialSlug,
    onConsumedSlug,
}: {
    initialSlug?: string;
    onConsumedSlug?: () => void;
}) {
    const [pages, setPages] = useState<TWikiPage[]>([]);
    const [selected, setSelected] = useState<TWikiPage | null>(null);

    const load = useCallback(async () => {
        try {
            const store = getBrain().store;
            const all = await store.listPages({ limit: 10000 });
            setPages(all.slice(0, 50));
        } catch {
            setPages([]);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    useEffect(() => {
        if (!initialSlug) return;
        void (async () => {
            try {
                const page = await getBrain().store.getPageBySlug(initialSlug);
                setSelected(page ?? null);
            } catch {
                setSelected(null);
            }
            onConsumedSlug?.();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSlug]);

    const openPage = async (slug: string) => {
        try {
            const page = await getBrain().store.getPageBySlug(slug);
            setSelected(page ?? null);
        } catch {
            setSelected(null);
        }
    };

    const setReview = async (slug: string, state: 'auto' | 'flagged' | 'approved' | 'rejected') => {
        try {
            const store = getBrain().store;
            const page = await store.getPageBySlug(slug);
            if (!page) return;
            await store.putPage({
                ...page,
                frontmatter: {
                    ...page.frontmatter,
                    reviewState: state,
                    updatedAt: new Date().toISOString(),
                },
            });
            setSelected((cur) =>
                cur && cur.slug === slug
                    ? { ...cur, frontmatter: { ...cur.frontmatter, reviewState: state } }
                    : cur,
            );
            await load();
        } catch {
            /* ignore */
        }
    };

    return (
        <div>
            <div style={label}>Страницы</div>
            {pages.length === 0 ? (
                <div style={{ color: tokens.slate[500], fontSize: 14 }}>Страниц пока нет</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {pages.map((p) => (
                        <li
                            key={p.slug}
                            onClick={() => void openPage(p.slug)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: tokens.surface,
                                border: `1px solid ${tokens.borderSubtle}`,
                                borderRadius: 8,
                                padding: '10px 12px',
                                marginBottom: 6,
                                cursor: 'pointer',
                            }}
                        >
                            <span>{p.frontmatter.title}</span>
                            <span style={{ color: tokens.slate[500], fontSize: 13 }}>
                                {p.slug} · {p.frontmatter.type}
                            </span>
                        </li>
                    ))}
                </ul>
            )}

            {selected && (
                <div style={{ marginTop: 20, background: tokens.surface, border: `1px solid ${tokens.borderSubtle}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.frontmatter.title}</div>
                        <button style={{ ...buttonStyle, background: tokens.borderDefault }} onClick={() => setSelected(null)}>
                            ✕
                        </button>
                    </div>
                    <div style={{ color: tokens.slate[500], fontSize: 13, marginBottom: 12 }}>
                        {selected.slug} · {selected.frontmatter.type} · {selected.frontmatter.reviewState}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                        {(['auto', 'flagged', 'approved', 'rejected'] as const).map((state) => (
                            <button
                                key={state}
                                style={{
                                    ...buttonStyle,
                                    background:
                                        selected.frontmatter.reviewState === state ? tokens.accent : tokens.borderDefault,
                                }}
                                onClick={() => void setReview(selected.slug, state)}
                            >
                                {state}
                            </button>
                        ))}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                        <MarkdownRenderer content={selected.body} />
                    </div>
                </div>
            )}
        </div>
    );
}
