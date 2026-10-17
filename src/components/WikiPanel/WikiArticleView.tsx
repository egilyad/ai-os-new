import React, { useMemo, useRef } from 'react';
import { MarkdownRenderer } from '../ChatPanel/MarkdownRenderer';
import { inlineMarkdown } from '../ChatPanel/inline-markdown';
import {
    getArticle,
    freshnessLabel,
    type WikiArticle,
    type WikiFreshness,
} from './wiki-articles';

const FRESH_COLORS: Record<WikiFreshness, string> = {
    verified: '#10b981',
    documented: '#3b82f6',
    'needs-check': '#f59e0b',
    'not-implemented': '#ef4444',
};

export function FreshBadge({ freshness }: { freshness: WikiFreshness }): React.ReactNode {
    return (
        <span
            style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: FRESH_COLORS[freshness],
                border: `1px solid ${FRESH_COLORS[freshness]}`,
                borderRadius: 999,
                padding: '2px 10px',
                whiteSpace: 'nowrap',
            }}
            title="Происхождение информации: подтверждено кодом / из документов / требует проверки / не реализовано"
        >
            {freshnessLabel(freshness)}
        </span>
    );
}

function Toc({ body, onJump }: { body: string; onJump: (i: number) => void }): React.ReactNode {
    const heads = useMemo(() => {
        const out: Array<{ level: number; text: string }> = [];
        for (const line of body.split('\n')) {
            const m = line.match(/^(#{1,3})\s+(.+)$/);
            if (m) out.push({ level: m[1]!.length, text: m[2]!.trim() });
        }
        return out;
    }, [body]);
    if (heads.length < 2) return null;
    return (
        <nav
            style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '0.75rem 1rem',
                margin: '0 0 1rem',
                fontSize: '0.82rem',
            }}
        >
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Содержание</div>
            {heads.map((h, i) => (
                <div key={i} style={{ paddingLeft: `${(h.level - 1) * 1}rem`, lineHeight: 1.8 }}>
                    <button
                        type="button"
                        onClick={() => onJump(i)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#60a5fa',
                            fontSize: 'inherit',
                            padding: 0,
                            textAlign: 'left',
                        }}
                    >
                        {h.text}
                    </button>
                </div>
            ))}
        </nav>
    );
}

/** A line with [[slug]] / [[slug|label]] links: list prefix preserved, runs via inlineMarkdown. */
function renderLinkedLine(
    line: string,
    openSlug: (slug: string) => void,
    keyPrefix: string,
): React.ReactNode {
    const listMatch = line.match(/^(\s*(?:[-*]|\d+\.)\s+)([\s\S]*)$/);
    const prefix = listMatch ? listMatch[1]! : '';
    const rest = listMatch ? listMatch[2]! : line;
    const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    const parts: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    let k = 0;
    const pushText = (text: string) => {
        if (text) parts.push(<React.Fragment key={`${keyPrefix}-t${k++}`}>{inlineMarkdown(text)}</React.Fragment>);
    };
    while ((m = re.exec(rest)) !== null) {
        pushText(rest.slice(last, m.index));
        const slug = m[1]!.trim();
        const label = (m[2] ?? slug).trim();
        if (getArticle(slug)) {
            parts.push(
                <button
                    key={`${keyPrefix}-l${k++}`}
                    type="button"
                    onClick={() => openSlug(slug)}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#60a5fa',
                        textDecoration: 'underline',
                        fontSize: 'inherit',
                        padding: 0,
                    }}
                >
                    {label}
                </button>,
            );
        } else {
            // Unknown slug: muted text, no fake page.
            parts.push(
                <span
                    key={`${keyPrefix}-l${k++}`}
                    title={`Статьи «${slug}» пока нет`}
                    style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
                >
                    {label}
                </span>,
            );
        }
        last = m.index + m[0].length;
    }
    pushText(rest.slice(last));
    const inner = <>{parts}</>;
    if (prefix.trim().startsWith('-') || prefix.trim().startsWith('*')) {
        return (
            <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                <li style={{ lineHeight: 1.7 }}>{inner}</li>
            </ul>
        );
    }
    if (/^\d+\.\s/.test(prefix)) {
        return (
            <ol style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                <li style={{ lineHeight: 1.7 }}>{inner}</li>
            </ol>
        );
    }
    return (
        <p style={{ margin: '0.25rem 0', lineHeight: 1.7 }}>{inner}</p>
    );
}

export function WikiArticleView({
    article,
    sectionTitle,
    openSlug,
}: {
    article: WikiArticle;
    sectionTitle: string;
    openSlug: (slug: string) => void;
}): React.ReactNode {
    const bodyRef = useRef<HTMLDivElement>(null);
    // Lines without [[links]] accumulate into MarkdownRenderer chunks (block
    // structure intact); lines with links render inline with internal buttons.
    const blocks = useMemo(() => {
        const out: React.ReactNode[] = [];
        let md: string[] = [];
        const flush = (key: string) => {
            if (md.length > 0) {
                out.push(<MarkdownRenderer key={key} content={md.join('\n')} />);
                md = [];
            }
        };
        article.body.split('\n').forEach((line, i) => {
            if (line.includes('[[')) {
                flush(`md-${i}`);
                out.push(
                    <React.Fragment key={`wl-${i}`}>
                        {renderLinkedLine(line, openSlug, `wl-${i}`)}
                    </React.Fragment>,
                );
            } else {
                md.push(line);
            }
        });
        flush('md-tail');
        return out;
    }, [article.body, openSlug]);
    const jump = (i: number) => {
        const el = bodyRef.current?.querySelectorAll('h1,h2,h3')[i];
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Вики / {sectionTitle} / {article.title}
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    marginBottom: '0.75rem',
                }}
            >
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{article.title}</h2>
                <FreshBadge freshness={article.freshness} />
            </div>
            <Toc body={article.body} onJump={jump} />
            <div ref={bodyRef}>{blocks}</div>
            {article.sources.length > 0 && (
                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Источники</div>
                    {article.sources.map((s) => (
                        <div key={s} style={{ fontFamily: 'monospace' }}>
                            {s}
                        </div>
                    ))}
                </div>
            )}
            {article.related.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <div
                        style={{
                            fontWeight: 700,
                            marginBottom: '0.5rem',
                            fontSize: '0.85rem',
                        }}
                    >
                        Связанные материалы
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {article.related.map((slug) => {
                            const rel = getArticle(slug);
                            if (!rel) return null;
                            return (
                                <button
                                    key={slug}
                                    type="button"
                                    onClick={() => openSlug(slug)}
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 8,
                                        padding: '0.4rem 0.8rem',
                                        cursor: 'pointer',
                                        color: 'inherit',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {rel.title}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

/** Stub for panels without a written article: honest, no invented instructions. */
export function WikiPanelStub({
    title,
    sectionTitle,
    componentFile,
    openSlug,
}: {
    title: string;
    sectionTitle: string;
    componentFile?: string;
    openSlug?: (slug: string) => void;
}): React.ReactNode {
    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Вики / {sectionTitle} / {title}
            </div>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                }}
            >
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{title}</h2>
                <FreshBadge freshness="needs-check" />
            </div>
            <p style={{ lineHeight: 1.7 }}>
                Подробная инструкция по этой панели пока не написана — мы не выдумываем
                возможности. Открой панель из основного меню и сверься с её интерфейсом.
            </p>
            {componentFile && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Реализация</div>
                    <div style={{ fontFamily: 'monospace' }}>{componentFile}</div>
                </div>
            )}
            {openSlug && getArticle('dev-component-catalog') && (
                <p style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
                    Что этот компонент импортирует (сервисы ядра, сторы, i18n) — в авто-каталоге{' '}
                    <button
                        type="button"
                        onClick={() => openSlug('dev-component-catalog')}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#60a5fa',
                            textDecoration: 'underline',
                            fontSize: 'inherit',
                            padding: 0,
                        }}
                    >
                        Каталог компонентов OS
                    </button>
                    .
                </p>
            )}
        </div>
    );
}
