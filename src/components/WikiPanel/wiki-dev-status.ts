// Wiki section: development status ("Состояние разработки").
// Placeholder articles for tracking the state of the project. They are
// cross-linked with each other and will be filled in over time.

import type { WikiArticle } from './wiki-types';

const ENTRIES: Array<{ slug: string; title: string; tags: string[] }> = [
    { slug: 'dev-status-done', title: 'Завершённые задачи', tags: ['состояние разработки', 'прогресс'] },
    { slug: 'dev-status-active', title: 'Активная разработка', tags: ['состояние разработки', 'прогресс'] },
    { slug: 'dev-status-critical', title: 'Критические проблемы', tags: ['состояние разработки', 'риски'] },
    { slug: 'dev-status-debt', title: 'Технический долг', tags: ['состояние разработки', 'долг'] },
    { slug: 'dev-status-bugs', title: 'Отложенные баги', tags: ['состояние разработки', 'баги'] },
    { slug: 'dev-status-testing', title: 'Состояние тестирования', tags: ['состояние разработки', 'тесты'] },
    { slug: 'dev-status-docs', title: 'Документация', tags: ['состояние разработки', 'документация'] },
    { slug: 'dev-status-blocked', title: 'Заблокированные задачи', tags: ['состояние разработки', 'риски'] },
    { slug: 'dev-status-roadmaps', title: 'Roadmaps', tags: ['состояние разработки', 'планы'] },
    { slug: 'dev-status-files', title: 'MD и другие файлы от разработки', tags: ['состояние разработки', 'процесс'] },
];

export const DEV_STATUS_ARTICLES: WikiArticle[] = ENTRIES.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    section: 'dev-status',
    tags: entry.tags,
    freshness: 'needs-check',
    sources: [],
    related: ENTRIES.filter((other) => other.slug !== entry.slug).map((other) => other.slug),
    body: 'текст в разработке',
}));
