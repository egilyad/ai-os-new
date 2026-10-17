import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useResponsive } from '../Layout/ResponsiveShell';
import { NAV_SECTIONS } from '../../route-registry';
import { MarkdownRenderer } from '../ChatPanel/MarkdownRenderer';
import { WIKI_SECTIONS, articlesBySection, getArticle } from './wiki-articles';
import { searchSnippet, searchWiki } from './wiki-search';
import { COMMITS_FEED } from '../../generated/commits-feed';
import { WIKI_PANEL_MAP } from '../../generated/wiki-panel-map';
import { WikiArticleView, WikiPanelStub } from './WikiArticleView';

type WikiView =
    | { name: 'home' }
    | { name: 'map' }
    | { name: 'coverage' }
    | { name: 'search' }
    | { name: 'news' }
    | { name: 'article'; slug: string }
    | { name: 'panel'; panelId: string; title: string; sectionTitle: string };

/** Panels that open a written panel guide or a covering concept article; else an honest stub. */
const PANEL_ARTICLES: Record<string, string> = {
    chat: 'panel-chat',
    keys: 'panel-providers',
    'agent-tasks': 'panel-agent-tasks',
    settings: 'panel-settings',
    governance: 'panel-governance',
    policies: 'panel-governance',
    'policy-editor': 'panel-governance',
    guardrails: 'panel-governance',
    sop: 'panel-governance',
    security: 'panel-governance',
    knowledge: 'panel-knowledge',
    sre: 'panel-sre',
    debate: 'debates',
    agents: 'agents',
    memory: 'memory',
    diagnostics: 'diagnostics',
    'agent-journal': 'execution-trail',
};

const shellStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    height: '100%',
    minHeight: 0,
};

const sideStyle: React.CSSProperties = {
    width: 250,
    flexShrink: 0,
    overflowY: 'auto',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    paddingRight: '1rem',
};

const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    minWidth: 0,
    paddingBottom: '2rem',
};

function navButton(active: boolean): React.CSSProperties {
    return {
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: active ? 'rgba(255,255,255,0.07)' : 'none',
        border: 'none',
        borderRadius: 8,
        padding: '0.45rem 0.7rem',
        cursor: 'pointer',
        color: 'inherit',
        fontSize: '0.85rem',
        marginBottom: 2,
    };
}

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactNode {
    return (
        <div
            style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                margin: '0.9rem 0 0.3rem',
            }}
        >
            {children}
        </div>
    );
}

export const WikiPanel: React.FC = () => {
    const { t } = useTranslation();
    const { isMobile } = useResponsive();
    const [view, setView] = useState<WikiView>({ name: 'home' });
    const [query, setQuery] = useState('');
    const [hits, setHits] = useState<Array<{ slug: string; score: number }>>([]);
    const [menuOpen, setMenuOpen] = useState(false);

    const openSlug = (slug: string) => {
        if (getArticle(slug)) {
            setView({ name: 'article', slug });
            setMenuOpen(false);
        }
    };

    const openPanel = (panelId: string, title: string, sectionTitle: string) => {
        const articleSlug = PANEL_ARTICLES[panelId];
        if (articleSlug && getArticle(articleSlug)) {
            openSlug(articleSlug);
        } else {
            setView({ name: 'panel', panelId, title, sectionTitle });
            setMenuOpen(false);
        }
    };

    useEffect(() => {
        if (view.name !== 'search') return;
        const q = query.trim();
        if (q.length < 2) {
            setHits([]);
            return;
        }
        let cancelled = false;
        const timer = setTimeout(() => {
            searchWiki(q, 15).then((h) => {
                if (!cancelled) setHits(h);
            });
        }, 200);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query, view.name]);

    const crumbs = useMemo(() => {
        if (view.name === 'article') {
            const a = getArticle(view.slug);
            const sec = WIKI_SECTIONS.find((s) => s.id === a?.section);
            return ['Вики', sec?.title ?? '', a?.title ?? ''];
        }
        if (view.name === 'panel') return ['Вики', 'Карта ОС', view.title];
        const names: Record<string, string> = {
            home: 'Главная',
            map: 'Карта ОС',
            coverage: 'Покрытие документации',
            search: 'Поиск',
            news: 'Новости',
        };
        return ['Вики', names[view.name] ?? ''];
    }, [view]);

    const sidebar = (
        <div>
            <button type="button" onClick={() => setView({ name: 'home' })} style={navButton(view.name === 'home')}>
                Главная
            </button>
            <button type="button" onClick={() => setView({ name: 'map' })} style={navButton(view.name === 'map')}>
                Карта ОС
            </button>
            <button
                type="button"
                onClick={() => setView({ name: 'coverage' })}
                style={navButton(view.name === 'coverage')}
            >
                Покрытие
            </button>
            <button type="button" onClick={() => setView({ name: 'search' })} style={navButton(view.name === 'search')}>
                Поиск
            </button>
            <button type="button" onClick={() => setView({ name: 'news' })} style={navButton(view.name === 'news')}>
                Новости ({COMMITS_FEED.commits.length})
            </button>
            <SectionLabel>Разделы</SectionLabel>
            {WIKI_SECTIONS.map((s) => {
                const n = articlesBySection(s.id).length;
                if (n === 0) return null;
                const active =
                    view.name === 'article' && getArticle(view.slug)?.section === s.id;
                return (
                    <div key={s.id}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0.4rem 0 0.15rem' }}>
                            {s.title} ({n})
                        </div>
                        {articlesBySection(s.id).map((a) => (
                            <button
                                key={a.slug}
                                type="button"
                                onClick={() => openSlug(a.slug)}
                                style={navButton(active && view.name === 'article' && view.slug === a.slug)}
                            >
                                {a.title}
                            </button>
                        ))}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div style={{ padding: '1.5rem', height: '100%', overflow: 'hidden' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                }}
            >
                {isMobile && (
                    <button
                        type="button"
                        onClick={() => setMenuOpen((v) => !v)}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                            padding: '0.4rem 0.8rem',
                            cursor: 'pointer',
                            color: 'inherit',
                        }}
                    >
                        Разделы
                    </button>
                )}
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>SuperAgents OS — Wiki</h2>
            </div>
            <div style={shellStyle}>
                {(!isMobile || menuOpen) && (
                    <div style={isMobile ? { ...sideStyle, width: '100%', borderRight: 'none' } : sideStyle}>
                        {sidebar}
                    </div>
                )}
                {(!isMobile || !menuOpen) && (
                    <div style={contentStyle}>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                marginBottom: '0.75rem',
                            }}
                        >
                            {crumbs.filter(Boolean).join(' / ')}
                        </div>
                        {view.name === 'home' && (
                            <WikiHome openSlug={openSlug} go={(v: WikiView) => setView(v)} />
                        )}
                        {view.name === 'map' && (
                            <WikiMap t={t as (k: string) => string} openPanel={openPanel} />
                        )}
                        {view.name === 'coverage' && (
                            <WikiCoverage t={t as (k: string) => string} openPanel={openPanel} />
                        )}
                        {view.name === 'search' && (
                            <WikiSearch
                                query={query}
                                setQuery={setQuery}
                                hits={hits}
                                openSlug={openSlug}
                            />
                        )}
                        {view.name === 'news' && <WikiNews />}
                        {view.name === 'article' &&
                            (() => {
                                const a = getArticle(view.slug);
                                if (!a) return <p>Статья не найдена.</p>;
                                const sec = WIKI_SECTIONS.find((s) => s.id === a.section);
                                return (
                                    <WikiArticleView
                                        article={a}
                                        sectionTitle={sec?.title ?? ''}
                                        openSlug={openSlug}
                                    />
                                );
                            })()}
                        {view.name === 'panel' && (
                            <WikiPanelStub
                                title={view.title}
                                sectionTitle={view.sectionTitle}
                                componentFile={WIKI_PANEL_MAP[view.panelId]}
                                openSlug={openSlug}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

function WikiHome({
    openSlug,
    go,
}: {
    openSlug: (slug: string) => void;
    go: (v: WikiView) => void;
}): React.ReactNode {
    const card: React.CSSProperties = {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: '1rem',
        marginBottom: '1rem',
    };
    const linkBtn: React.CSSProperties = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#60a5fa',
        textDecoration: 'underline',
        fontSize: 'inherit',
        padding: 0,
    };
    return (
        <div>
            <div style={card}>
                <h3 style={{ marginTop: 0 }}>О проекте</h3>
                <p style={{ lineHeight: 1.7 }}>
                    SuperAgents OS — браузерная ОС для оркестрации интеллекта: модели,
                    агенты, память и инструменты в одной среде, данные — локально. Это
                    не чат-бот, а система с шиной событий, роутером провайдеров и
                    исполняемыми контурами. Подробнее:{' '}
                    <button type="button" onClick={() => openSlug('what-is')} style={linkBtn}>
                        Что такое SuperAgents OS
                    </button>
                    .
                </p>
            </div>
            <div style={card}>
                <h3 style={{ marginTop: 0 }}>Возможности</h3>
                <p style={{ lineHeight: 1.7 }}>
                    <button type="button" onClick={() => openSlug('debates')} style={linkBtn}>
                        Дебаты
                    </button>
                    {', '}
                    <button type="button" onClick={() => openSlug('agents')} style={linkBtn}>
                        агенты
                    </button>
                    {', '}
                    <button type="button" onClick={() => openSlug('providers')} style={linkBtn}>
                        провайдеры
                    </button>
                    {', '}
                    <button type="button" onClick={() => openSlug('memory')} style={linkBtn}>
                        память
                    </button>
                    {', '}
                    <button type="button" onClick={() => openSlug('diagnostics')} style={linkBtn}>
                        диагностика
                    </button>
                    {' — '}<button type="button" onClick={() => openSlug('capabilities')} style={linkBtn}>
                        полный список
                    </button>
                    .
                </p>
            </div>
            <div style={card}>
                <h3 style={{ marginTop: 0 }}>
                    Карта системы{' '}
                    <button type="button" onClick={() => go({ name: 'map' })} style={linkBtn}>
                        (открыть полностью)
                    </button>{' '}
                    <button type="button" onClick={() => go({ name: 'coverage' })} style={linkBtn}>
                        · покрытие документации
                    </button>
                </h3>
                <p style={{ lineHeight: 1.7 }}>
                    {NAV_SECTIONS.length} разделов меню,{' '}
                    {NAV_SECTIONS.reduce((n, s) => n + s.items.length, 0)} панелей — дерево
                    строится из живого реестра, а не из памяти авторов.
                </p>
            </div>
            <div style={card}>
                <h3 style={{ marginTop: 0 }}>
                    Последние изменения{' '}
                    <button type="button" onClick={() => go({ name: 'news' })} style={linkBtn}>
                        (все новости)
                    </button>
                </h3>
                {COMMITS_FEED.commits.length === 0 && (
                    <p style={{ color: 'var(--text-muted)' }}>
                        Лента коммитов не сгенерирована — запусти{' '}
                        <span style={{ fontFamily: 'monospace' }}>node scripts/gen-wiki-data.mjs</span>.
                    </p>
                )}
                {COMMITS_FEED.commits.slice(0, 5).map((c) => (
                    <div key={c.hash} style={{ marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {c.hash}
                        </span>{' '}
                        {c.subject}
                    </div>
                ))}
            </div>
            <div style={card}>
                <h3 style={{ marginTop: 0 }}>Состояние проекта</h3>
                <p style={{ lineHeight: 1.7 }}>
                    Реализовано: дебаты P1–P4 памяти и истории, журнал инструментов,
                    живой поиск, rich-ответы. Ограничения:{' '}
                    <button type="button" onClick={() => openSlug('diagnostics')} style={linkBtn}>
                        известные проблемы
                    </button>
                    . Направления:{' '}
                    <button type="button" onClick={() => openSlug('roadmap-notes')} style={linkBtn}>
                        планы
                    </button>
                    .
                </p>
            </div>
            <div style={card}>
                <h3 style={{ marginTop: 0 }}>Разработчикам</h3>
                <p style={{ lineHeight: 1.7 }}>
                    Как устроена ОС и как её менять:{' '}
                    <button type="button" onClick={() => openSlug('dev-overview')} style={linkBtn}>
                        обзор и слои
                    </button>
                    ,{' '}
                    <button type="button" onClick={() => openSlug('for-developers')} style={linkBtn}>
                        краткий онбординг
                    </button>
                    . Авто-каталоги из кода:{' '}
                    <button type="button" onClick={() => openSlug('dev-component-catalog')} style={linkBtn}>
                        компоненты
                    </button>
                    {', '}
                    <button type="button" onClick={() => openSlug('dev-event-catalog')} style={linkBtn}>
                        события
                    </button>
                    {', '}
                    <button type="button" onClick={() => openSlug('dev-service-map')} style={linkBtn}>
                        DI-граф
                    </button>
                    {', '}
                    <button type="button" onClick={() => openSlug('dev-contracts')} style={linkBtn}>
                        контракты
                    </button>
                    {', '}
                    <button type="button" onClick={() => openSlug('dev-store-catalog')} style={linkBtn}>
                        сторы
                    </button>
                    {', '}
                    <button type="button" onClick={() => openSlug('dev-i18n-catalog')} style={linkBtn}>
                        локали
                    </button>
                    .
                </p>
            </div>
        </div>
    );
}

function WikiCoverage({
    t,
    openPanel,
}: {
    t: (k: string) => string;
    openPanel: (panelId: string, title: string, sectionTitle: string) => void;
}): React.ReactNode {
    const isDocumented = (id: string) => {
        const slug = PANEL_ARTICLES[id];
        return Boolean(slug && getArticle(slug));
    };
    const total = NAV_SECTIONS.reduce((n, s) => n + s.items.length, 0);
    const documented = NAV_SECTIONS.reduce(
        (n, s) => n + s.items.filter((i) => isDocumented(i.id)).length,
        0,
    );
    const badge = (ok: boolean): React.CSSProperties => ({
        fontSize: '0.65rem',
        fontWeight: 700,
        color: ok ? '#10b981' : '#f59e0b',
        border: `1px solid ${ok ? '#10b981' : '#f59e0b'}`,
        borderRadius: 999,
        padding: '1px 8px',
        whiteSpace: 'nowrap',
    });
    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Покрытие документации</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                Честная картина: {documented} из {total} панелей имеют материал — гайд по панели
                или покрывающую обзорную статью; остальные открывают заглушку. Список строится из
                живого реестра маршрутов.
            </p>
            {NAV_SECTIONS.map((s) => (
                <div
                    key={s.id}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        padding: '0.9rem 1rem',
                        marginBottom: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 700 }}>{t(s.labelKey)}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {s.items.filter((i) => isDocumented(i.id)).length}/{s.items.length}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {s.items.map((item) => {
                            const ok = isDocumented(item.id);
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => openPanel(item.id, t(item.labelKey), t(s.labelKey))}
                                    title={WIKI_PANEL_MAP[item.id] ?? ''}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: 8,
                                        padding: '0.35rem 0.7rem',
                                        cursor: 'pointer',
                                        color: 'inherit',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {t(item.labelKey)}
                                    <span style={badge(ok)}>{ok ? 'материал' : 'заглушка'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

function WikiMap({
    t,
    openPanel,
}: {
    t: (k: string) => string;
    openPanel: (panelId: string, title: string, sectionTitle: string) => void;
}): React.ReactNode {
    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Карта ОС — дерево из живого реестра</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                Панели с материалом открывают гайд или покрывающую статью; остальные — честную
                заглушку «уточняется» (не выдуманное описание).
            </p>
            {NAV_SECTIONS.map((s) => (
                <div key={s.id} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.35rem' }}>
                        {t(s.labelKey)} ({s.items.length})
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {s.items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => openPanel(item.id, t(item.labelKey), t(s.labelKey))}
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: 8,
                                    padding: '0.35rem 0.7rem',
                                    cursor: 'pointer',
                                    color: 'inherit',
                                    fontSize: '0.8rem',
                                }}
                            >
                                {t(item.labelKey)}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function WikiSearch({
    query,
    setQuery,
    hits,
    openSlug,
}: {
    query: string;
    setQuery: (q: string) => void;
    hits: Array<{ slug: string; score: number }>;
    openSlug: (slug: string) => void;
}): React.ReactNode {
    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Поиск по Wiki</h3>
            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Панели, возможности, инструкции, сервисы…"
                aria-label="Поиск по Wiki"
                style={{
                    width: '100%',
                    padding: '0.6rem 0.9rem',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.25)',
                    color: 'inherit',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                }}
            />
            {query.trim().length >= 2 && hits.length === 0 && (
                <p style={{ color: 'var(--text-muted)' }}>Ничего не найдено.</p>
            )}
            {hits.map((h) => {
                const a = getArticle(h.slug);
                if (!a) return null;
                return (
                    <div key={h.slug} style={{ marginBottom: '0.9rem' }}>
                        <button
                            type="button"
                            onClick={() => openSlug(h.slug)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#60a5fa',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                padding: 0,
                                textAlign: 'left',
                            }}
                        >
                            {a.title}
                        </button>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {searchSnippet(a.body, query)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function WikiNews(): React.ReactNode {
    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Новости проекта — лента коммитов</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Сгенерировано {COMMITS_FEED.generatedAt.slice(0, 10)} скриптом
                gen-wiki-data (заголовки коммитов как есть, без пересказа).
            </p>
            {COMMITS_FEED.commits.length === 0 && (
                <p style={{ color: 'var(--text-muted)' }}>
                    Лента пуста: нет .git-истории или скрипт не запускался.
                </p>
            )}
            {COMMITS_FEED.commits.map((c) => (
                <div
                    key={c.hash}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 8,
                        padding: '0.6rem 0.9rem',
                        marginBottom: '0.5rem',
                    }}
                >
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.subject}</div>
                    <div
                        style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-muted)',
                            fontFamily: 'monospace',
                            marginTop: '0.2rem',
                        }}
                    >
                        {c.hash} · {c.date.slice(0, 10)}
                    </div>
                    {c.body.trim().length > 0 && (
                        <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', lineHeight: 1.6 }}>
                            <MarkdownRenderer content={c.body} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default WikiPanel;
