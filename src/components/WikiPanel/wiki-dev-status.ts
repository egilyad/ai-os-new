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

export const DEV_STATUS_ARTICLES: WikiArticle[] = ENTRIES.map((entry) => {
    if (entry.slug === 'dev-status-testing') {
        return {
            slug: entry.slug,
            title: entry.title,
            section: 'dev-status',
            tags: entry.tags,
            freshness: 'verified' as const,
            sources: ['package.json', 'vitest.config.ts'],
            related: ENTRIES.filter((other) => other.slug !== entry.slug).map(
                (other) => other.slug,
            ),
            body: `## Как запускать

- \`npm test\` — весь набор (vitest run).
- \`npm run test:stable\` — курируемый набор для CI: ядро (stores/hooks/events/workers), ключевые сервисы, LLM-декораторы, wiki-тесты, панели памяти и провайдеров, каталог моделей, эмбеддинги.
- Локально стабильный пул — \`forks\` (\`--pool=forks\`). Пул \`vmThreads\` не подходит: в нём нет \`crypto.subtle\`, из-за чего падают security/key-vault тесты. При большом параллелизме пул forks может не поднять воркер (\`Failed to start forks worker\`) — это флаки окружения, конкретные файлы проходят по отдельности.

## Что закрыто недавно

- \`src/components/ChatPanel/ChatPanel.test.tsx\` — был сломан: мок \`useChatStore\` не имел \`getState()\`, панель поиска сообщений поднимала message-index сервис без зарегистрированной БД, а ожидания устарели (кнопки режимов исполнения уехали в RoomPanel). Тест починен и включён в \`test:stable\`.
- \`src/components/ProviderManager/ProviderManager.test.tsx\` — в моке \`kernel/instances\` не было \`rootLogger.child()\`, а динамический импорт панели укладывался в хук-таймаут. Переведён на статический импорт, мок и ожидания исправлены; файл включён в \`test:stable\`.
- \`src/components/MemoryPanel/MemoryPanel.test.tsx\` — в моке не было \`rootLogger\`; панель памяти добавлена в \`test:stable\`.

## Известные пробелы

- Часть компонентных тестов вне \`test:stable\` (например, отдельные панели) запускаются только вручную — при поломке они не ловятся CI.
- Покрытие wiki/панелей описывает статический снимок: \`checks\` показывает tests 43%, panels 78%.`,
        };
    }
    return {
        slug: entry.slug,
        title: entry.title,
        section: 'dev-status',
        tags: entry.tags,
        freshness: 'needs-check' as const,
        sources: [],
        related: ENTRIES.filter((other) => other.slug !== entry.slug).map((other) => other.slug),
        body: 'текст в разработке',
    };
});
