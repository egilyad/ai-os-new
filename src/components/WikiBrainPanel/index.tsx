import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { tokens } from '../../styles/tokens';
import BrainAbout from './brain-about';
import BrainLinks from './brain-links';
import BrainPages from './brain-pages';
import BrainSearch from './brain-search';
import BrainIngest from './brain-ingest';
import BrainGraph from './brain-graph';
import BrainLint from './brain-lint';
import BrainVault from './brain-vault';
import { useWikiEvents, useWikiStats } from './use-wiki-brain';

type TabId = 'overview' | 'pages' | 'search' | 'ingest' | 'graph' | 'lint' | 'vault' | 'links';

const TABS: Array<{ id: TabId; label: string }> = [
    { id: 'overview', label: 'Обзор' },
    { id: 'pages', label: 'Страницы' },
    { id: 'search', label: 'Поиск' },
    { id: 'ingest', label: 'Ингест' },
    { id: 'graph', label: 'Граф' },
    { id: 'lint', label: 'Lint' },
    { id: 'vault', label: 'Vault' },
    { id: 'links', label: 'Связи' },
];

export default function WikiBrainPanel() {
    const [tab, setTab] = useState<TabId>('overview');
    const [refreshKey, setRefreshKey] = useState(0);
    const [initialSlug, setInitialSlug] = useState<string | undefined>(undefined);
    const [params] = useSearchParams();
    const { stats } = useWikiStats(refreshKey);
    const events = useWikiEvents();

    useEffect(() => {
        const slug = params.get('slug');
        if (slug) {
            setInitialSlug(slug);
            setTab('pages');
        }
    }, [params]);

    useEffect(() => {
        // Авто-наполнение из встроенного корпуса, если хранилище пусто.
        let alive = true;
        void (async () => {
            try {
                const { getBrain } = await import('./use-wiki-brain');
                const store = getBrain().store;
                const pages = await store.listPages({ limit: 1 });
                if (!alive) return;
                if (pages.length === 0) {
                    const { WIKI_ARTICLES } = await import('../WikiPanel/wiki-articles');
                    const now = new Date().toISOString();
                    const list = WIKI_ARTICLES.slice(0, 100).map((a, i) => ({
                        id: `corpus-page-${i}`,
                        slug: a.slug,
                        frontmatter: {
                            slug: a.slug,
                            title: a.title,
                            type: a.section === 'dev' ? 'dev' : 'concept',
                            sources: [],
                            aliases: [],
                            tags: a.tags ?? [],
                            language: 'ru',
                            createdAt: now,
                            updatedAt: now,
                            reviewState: 'auto',
                            graphIn: 0,
                            graphOut: 0,
                        },
                        body: a.body ?? '',
                        sha256: `corpus-${i}`,
                        rawMarkdown: `# ${a.title}\n\n${a.body ?? ''}`,
                    }));
                    await store.bulkPutPages(list as never);
                    setRefreshKey((k) => k + 1);
                }
            } catch {
                /* store may be unavailable - ignore */
            }
        })();
        return () => {
            alive = false;
        };

    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                    padding: '0.75rem 1rem',
                    borderBottom: `1px solid ${tokens.borderSubtle}`,
                }}
            >
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Wiki-Brain</h2>
                <button
                    onClick={() => setRefreshKey((k) => k + 1)}
                    style={{
                        marginLeft: 'auto',
                        background: tokens.surface,
                        color: tokens.slate[200],
                        border: `1px solid ${tokens.borderDefault}`,
                        borderRadius: 8,
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: 13,
                    }}
                >
                    Обновить
                </button>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0.5rem 1rem', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
                {TABS.map((tabs) => (
                    <button
                        key={tabs.id}
                        onClick={() => setTab(tabs.id)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 999,
                            fontSize: 13,
                            border: '1px solid transparent',
                            cursor: 'pointer',
                            background: tab === tabs.id ? tokens.accent : tokens.surface,
                            color: tab === tabs.id ? tokens.slate[950] : tokens.slate[300],
                        }}
                    >
                        {tabs.label}
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {tab === 'overview' && <BrainAbout stats={stats} events={events} />}
                {tab === 'pages' && (
                    <BrainPages initialSlug={initialSlug} onConsumedSlug={() => setInitialSlug(undefined)} />
                )}
                {tab === 'search' && <BrainSearch />}
                {tab === 'ingest' && <BrainIngest />}
                {tab === 'graph' && <BrainGraph />}
                {tab === 'lint' && <BrainLint />}
                {tab === 'vault' && <BrainVault />}
                {tab === 'links' && <BrainLinks />}
            </div>
        </div>
    );
}
