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
        '- **Authz/роли** — fail-open в permission middleware (W2-001), мутации без авторизации (W2-002/017/018), admin-гейт AUTOPILOT (W4-044), bearer-токен в localStorage (W2-015).',
        '- **CSAM/модерация изображений отсутствует** — требуется внешний сервис (W7-UGC-009).',
        '- **Cost-enforcement** — CostManagerDecorator только логирует, не блокирует (W2-012, W4-030/031/032).',
        '- **Внешний аудит sandbox** — нужен до того, как предлагать расширения как безопасные (Tech Map §6).',
        '',
        'Закрыто 07.11.2026: **P0-1** passphrase-vault (шифрование at-rest, fail-closed, миграция ключей) и **P0-2** multi-tenant IDOR (per-company секреты, WS-скоупинг). До создания vault ключи остаются незашифрованными — см. README.',
        '',
        'Коды и детали — в `docs/known-issues-deferred.md`, разделы 12–13.',
    ].join('\n'),
    'dev-status-debt': [
        'Технический долг (крупные рефакторинги, требуют проверки регрессий):',
        '',
        '- CacheDecorator `streamMessage` без in-flight dedup (W6-039 закрыт, P1-5).',
        '- Singleton `ArgumentGraphService` — cross-session clobber (W6-014 закрыт, P1-6).',
        '- Feature-flag UI: безопасный flatten через `flattenFeatureFlags()` (W6-018 закрыт).',
        '- ReDoS-риски: защита `isReDoSPattern()` в пользовательских regex (W6-023 закрыт).',
        '- CI: деплой уже гейтится quality/build/test/coverage/e2e; открыто — расширение `test:stable` и отказ от `--ignore-scripts` (W4-001/002/036).',
        '- Prompt-versioning: 156 unversioned «You are…» (W4-041 закрыт, P0-4).',
        '- Retrieval: O(N) сканы, recall-перезапись (W8-012/013/014/015; P1-7 пропущен по решению пользователя).',
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
        '- Полная карта прогресса — `docs/known-issues-deferred.md`.',
    ].join('\n'),
    'dev-status-docs': [
        'Документация: активная, автогенерируемая (wiki-зеркало из корпуса).',
        '',
        '- Карта отложенных проблем — `docs/known-issues-deferred.md`.',
        '- Инвентарь/манифест/граф генерируются (`gen:wiki-*`); CI проверяет синхронизацию.',
    ].join('\n'),
    'dev-status-blocked': [
        'Заблокировано / требует продуктового решения:',
        '',
        '- Права/роли: модель RBAC (admin / user / observer), admin-гейт для AUTOPILOT, authz-рефакторинги (W2-001/002/017/018, W4-044).',
        '- Внешний сервис CSAM/модерации изображений (W7-UGC-009) — выбор провайдера и юридическая оценка.',
        '- Протокол федерации A2A — внутренний или внешний стандарт (до 01.03.2027).',
        '- i18n-стратегия — полный RU/EN или EN-каркас с RU-fallback (до 15.02.2027).',
        '',
        'Passphrase-vault (12.1/12.2) закрыт 07.11.2026 — больше не блокер.',
    ].join('\n'),
    'dev-status-roadmaps': [
        'Направления (актуализировано 2026-11-15):',
        '',
        '- Закрыто: E2E для SRE/Health/Diagnostics (data-sre-health-diagnostics.spec.ts, data-health.spec.ts); visual regression (visual-regression.spec.ts, screenshots.spec.ts); статьи техник-панелей (docs/wiki/panel-*.md).',
        '- Закрыто: роадмап Wiki-Brain F0–F8 (см. dev-wiki-brain-progress); Assistant M0–M4; AGEMS M0–M5; Universal Graph (dev-universal-graph).',
        '- Открыто: web-провайдер литературы (F5b, сейчас stub), Perplexity-ключ для deep-research, автозапуск OpenCode Sidekick с Windows и упаковка в EXE.',
    ].join('\n'),
    'dev-status-files': [
        'Ключевые файлы состояния:',
        '',
        '- `docs/known-issues-deferred.md` — карта отложенных.',
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

## Релизный гейт

Обязательные проверки, блокирующие деплой: \`test:stable\` (включая \`key-vault-migration.integration.test.ts\` — миграция legacy-профиля, заблокированный vault, экспорт без утечек), \`test:coverage\`, \`e2e\`, \`check:circular-kernel\`, \`docs:health\` и синхронизация wiki. Полная матрица тестов запускается отдельной задачей CI; критические сценарии ключей должны присутствовать в \`test:stable\`.

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
