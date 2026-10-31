// Wiki section: development status ("Состояние разработки").
// Placeholder articles for tracking the state of the project. They are
// cross-linked with each other and will be filled in over time.

import type { WikiArticle } from './wiki-types';

const ENTRIES: Array<{ slug: string; title: string; tags: string[] }> = [
    {
        slug: 'dev-status-done',
        title: 'Завершённые задачи',
        tags: ['состояние разработки', 'прогресс'],
    },
    {
        slug: 'dev-status-active',
        title: 'Активная разработка',
        tags: ['состояние разработки', 'прогресс'],
    },
    {
        slug: 'dev-status-critical',
        title: 'Критические проблемы',
        tags: ['состояние разработки', 'риски'],
    },
    { slug: 'dev-status-debt', title: 'Технический долг', tags: ['состояние разработки', 'долг'] },
    { slug: 'dev-status-bugs', title: 'Отложенные баги', tags: ['состояние разработки', 'баги'] },
    {
        slug: 'dev-status-testing',
        title: 'Состояние тестирования',
        tags: ['состояние разработки', 'тесты'],
    },
    {
        slug: 'dev-status-docs',
        title: 'Документация',
        tags: ['состояние разработки', 'документация'],
    },
    {
        slug: 'dev-status-blocked',
        title: 'Заблокированные задачи',
        tags: ['состояние разработки', 'риски'],
    },
    { slug: 'dev-status-roadmaps', title: 'Roadmaps', tags: ['состояние разработки', 'планы'] },
    {
        slug: 'dev-status-files',
        title: 'MD и другие файлы от разработки',
        tags: ['состояние разработки', 'процесс'],
    },
];

const BODIES: Record<string, string> = {
    'dev-status-critical': [
        'Актуальные критические проблемы (не закрыты, отложены до продуктового решения):',
        '',
        '- **KeyVault fail-open + deviceKey в plaintext** (localStorage) — шифрование ключей обесценивается; нужен passphrase-UI.',
        '- **API-ключи/секреты в открытом виде в IndexedDB** — зависит от vault.',
        '- **Multi-tenant IDOR / общий SYNC_SECRET / WS cross-tenant leak** — нужен server-скоупинг.',
        '- **CSAM/модерация изображений отсутствует** — требуется внешний сервис.',
        '',
        'Коды и детали — в [`docs/known-issues-deferred.md`](../../known-issues-deferred.md), разделы 12–13.',
    ].join('\n'),
    'dev-status-debt': [
        'Технический долг (крупные рефакторинги, требуют проверки регрессий):',
        '',
        '- CacheDecorator `streamMessage` без in-flight dedup (W6-039).',
        '- Singleton `ArgumentGraphService` — cross-session clobber (W6-014).',
        '- Feature-flag UI: `as unknown as Record<string, boolean>` (W6-018).',
        '- ReDoS-риски: 6 мест с пользовательскими regex (W6-023).',
        '- CI: deploy-гейт без тестов, `test:stable` неполный, `--ignore-scripts` (W4-001/002/036).',
        '- Prompt-versioning: 156 unversioned «You are…» (W4-041).',
        '- Retrieval: O(N) сканы, recall-перезапись (W8-012/013/014/015).',
    ].join('\n'),
    'dev-status-bugs': [
        'Зафиксированные отложенные баги/расхождения:',
        '',
        '- `browser-use-service.test.ts` — завышенное ожидание («is it running») vs реальное сообщение.',
        '- `metrics-service` — 3 теста про эмиссию алертов флакают в окружении (не связаны с правками).',
        '- Cross-tab: последний пишущий побеждает, silent message loss (W6-019, W7-ANA-007).',
        '- `isStaleSessionWrite` — guard обходится через `SessionRepository.save` (W6-011).',
    ].join('\n'),
    'dev-status-done': [
        'Недавно закрыто (серия security/resilience-фиксов):',
        '',
        '- Sidecar: loopback-биндинг, Bearer, SSRF-allowlist (W4-025).',
        '- LLM tool args: отклонение невалидного JSON (W8-009).',
        '- PII-редэкция: трейсы, память, чат, tool-вывод, event log.',
        '- Dangerous-блоклист: CSAM/самоповреждение/оружие/наркотики (W4-026).',
        '- sync-server: XFF trust opt-in, WS maxPayload, SIGTERM drain (W6-024/029/030).',
        '- SSRF-гвард http-адаптера (W6-021); jitter retry-after (W6-016).',
        '- Перцентили с интерполяцией (W6-034); counters persist (W6-033); budget retention (W6-032).',
    ].join('\n'),
    'dev-status-active': [
        'Активная разработка — системный проход по аудитам (волны 2–8):',
        '',
        '- В каждой волне закрываются безопасные/локальные пункты, остальное уходит в карту отложенных.',
        '- Полная карта прогресса — [`docs/known-issues-deferred.md`](../../known-issues-deferred.md).',
    ].join('\n'),
    'dev-status-docs': [
        'Документация: активная, автогенерируемая (wiki-зеркало из корпуса).',
        '',
        '- Карта отложенных проблем — [`docs/known-issues-deferred.md`](../../known-issues-deferred.md).',
        '- Инвентарь/манифест/граф генерируются (`gen:wiki-*`); CI проверяет синхронизацию.',
    ].join('\n'),
    'dev-status-blocked': [
        'Заблокировано / требует продуктового решения:',
        '',
        '- Passphrase-vault + ключи в IndexedDB (12.1/12.2 в карте отложенных).',
        '- Права/роли: admin-гейт для AUTOPILOT, authz-рефакторинги (W2-001/002/017/018).',
    ].join('\n'),
    'dev-status-roadmaps': [
        'Направления (не текущее состояние):',
        '',
        '- E2E для SRE/Health/Diagnostics.',
        '- Индивидуальные статьи для техник-панелей (19 из 62 отсутствуют).',
        '- Visual regression для 62 техник-панелей.',
    ].join('\n'),
    'dev-status-files': [
        'Ключевые файлы состояния:',
        '',
        '- [`docs/known-issues-deferred.md`](../../known-issues-deferred.md) — карта отложенных.',
        '- `docs/audits/waves/` — карты системной разведки (10).',
        '- `docs/inventory.json`, `docs/manifest.json`, `docs/graph.json` — машиночитаемые индексы.',
    ].join('\n'),
};

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
        body: BODIES[entry.slug] ?? 'текст в разработке',
    };
});
