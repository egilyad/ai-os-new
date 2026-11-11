import type { WikiArticle } from './wiki-articles';

/**
 * Статьи о тестировании и CI (актуальное состояние на конец 2026-11).
 * Числа в статьях — реальные замеры на момент написания.
 */
export const TESTING_ARTICLES: WikiArticle[] = [
    {
        slug: 'testing-architecture',
        title: 'Архитектура тестирования',
        section: 'dev',
        tags: ['тесты', 'vitest', 'playwright', 'архитектура'],
        freshness: 'verified',
        sources: [
            'package.json',
            'vitest.config.ts',
            'e2e/playwright.config.ts',
            '.github/workflows/ci.yml',
        ],
        related: ['testing-runbook', 'ci-architecture', 'testing-catalog'],
        body: `## Уровни проверок

Проект использует четыре независимых уровня проверок, запускаемых в CI:

1. **Unit-тесты (Vitest).** Тестовые файлы лежат рядом с кодом: \`src/**/*.test.{ts,tsx}\`.
   Среда: jsdom + \`fake-indexeddb/auto\` + лёгкий setup (\`src/tests/setup-light.ts\`).
   Пул: \`forks\` (\`--pool=forks\` в CI); покрытие — v8.
2. **E2E-тесты (Playwright).** Все спек-файлы в \`e2e/*.spec.ts\` (23 файла).
   Запускаются против свежесобранного \`dist/\` через \`vite preview\` (порт 5199)
   и test-only sync-server (порт 3001).
3. **Визуальные/демо-проверки.** \`e2e/screenshots.spec.ts\` и \`visual-regression.spec.ts\`
   генерируют PNG и обновляют \`docs/demos/img/\`.
4. **Статические и системные проверки.** TypeScript (\`tsc --noEmit\`), ESLint,
   проверка связности (\`dependency-cruiser\`-стиль), Security Audit (\`npm audit\`),
   покрытие c порогами.

## Как unit-тесты организованы

Каталоги:

- \`src/kernel/**\` — логика ядра: сервисы, DAL, события, контракты, утилиты (453 файла);
- \`src/components/**\` — UI-компоненты и панели (169 файлов);
- \`src/llm/**\` — HTTP-клиенты и декораторы LLM-провайдеров (27 файлов);
- \`src/stores/**\`, \`src/hooks/**\`, \`src/tests/**\` — сторы, хуки, интеграционные бут-тесты.

Полная unit-матрица в CI разбита на 23 среза (см. «CI/CD Architecture»),
чтобы уложиться в лимит памяти раннера и ускорить параллельность.
Фактический пул исполнения в CI — "forks" ("--pool=forks" в команде),
который переопределяет настройки vitest.config.ts.

## Как E2E-тесты организованы

Каждый спек стартует с общего \`boot(page)\`-гейта (\`e2e/helpers.ts\`):
ждём появления заголовка \`Mission Control\`, что означает завершённую гидратацию SPA.
Затем тесты работают с реальным приложением через роуты и UI.

Шарды E2E (12): basic-routes-a, routes-b, health-chat-sync, debate, forum, projects,
organizer, dialogs, knowledge, research, fleet, runtime.
`,
    },
    {
        slug: 'testing-catalog',
        title: 'Каталог тестов',
        section: 'dev',
        tags: ['тесты', 'каталог', 'покрытие'],
        freshness: 'verified',
        sources: ['src/kernel/services', 'src/components', 'e2e'],
        related: ['testing-architecture', 'testing-stats'],
        body: `## О «каталоге»

Это обзор ключевых групп и файлов, а не исчерпывающий перечень (файлов ~671).
Полный актуальный список формируется командой:

\`\`\`powershell
Get-ChildItem -Recurse src -Include *.test.ts,*.test.tsx -File |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  ForEach-Object { $_.FullName }
\`\`\`

## Ключевые группы unit-тестов

### Ядро (src/kernel/services)
- **Сервисы дебатов/ривалов** — \`debate-runtime/**\`, \`rivals*/**\`: оркестрация,
  фазы, губернатор, интерпретатор, таймлайны, граф аргументов.
- **Сервисы агентов** — \`agent-service.test.ts\`, \`agent-runtime/**\`,
  \`agent-identity.test.ts\`: резолвинг агентов, рантайм, секьюрити-гейты.
- **Бюджет и алерты** — \`budget-service.test.ts\`, \`budget-alert-service.test.ts\`.
- **Конфигурация и история** — \`config-history.test.ts\`, \`config-service.test.ts\`,
  \`config-registry.test.ts\`.
- **Директор/сценарии** — \`conversation-director-service.runtime.test.ts\`,
  \`director-demo-seed.test.ts\`.
- **Очереди/исполнение** — \`execution-queue.test.ts\`, \`race-executor.test.ts\`,
  \`chat-executor.test.ts\`, \`ChatService.autoRouting.test.ts\`.
- **Хранилища (DAL)** — \`dal/**\` на Dexie (\`_test-harness\`).
- **Утилиты** — \`utils/**\`: percentile, hash, regex-safe, pii-redact, safe-json и др.
- **Бут-тесты** — \`src/tests/boot-smoke.test.ts\`, \`src/kernel/kernel.test.ts\`.

### UI (src/components)
- **Панели** — \`*Panel.test.tsx\`: рендер, взаимодействие, пустые/ошибочные состояния.
- **Модальные и формы** — \`AddKeyModal/**\`, \`DirectorPanel/**\`, \`PlannerPanel/**\`.
- **Графы/визуализация** — \`ArgumentGraphPanel/**\`, \`DebateRuntimePanel/**\`,
  \`TracesPanel/**\` (VisGraph мокается в setup).
- **Вики** — \`WikiPanel/wiki-*.test.ts(x)\`: целостность корпуса, поиск, рендер статей.

### E2E (e2e/)
Всего 23 спек-файла; CI запускает их матрицей из 12 шардов
(см. «CI/CD Architecture»), которая покрывает 17 файлов:

- Навигация/роуты: \`basic-flow.spec.ts\`, \`routes-a-flow.spec.ts\`,
  \`routes-b-flow.spec.ts\`;
- Доменные данные (\`data-*.spec.ts\`, 15): chat, debate, dialogs, fleet, forum,
  health, keys, knowledge, organizer, projects, research, room, runtime, sync,
  sre-health-diagnostics. Из них в CI-матрице участвуют 14 (без
  \`data-sre-health-diagnostics.spec.ts\`);
- Не входят в стандартную матрицу: \`a11y-basic.spec.ts\` (доступность),
  \`assistant-panel.spec.ts\`, \`wiki-brain.spec.ts\` (вики-поиск),
  \`screenshots.spec.ts\` и \`visual-regression.spec.ts\` (демо-скриншоты;
  screenshots гоняется отдельной джобой demos на main).
`,
    },
    {
        slug: 'testing-stats',
        title: 'Статистика тестов',
        section: 'dev',
        tags: ['тесты', 'статистика', 'метрики'],
        freshness: 'documented',
        sources: ['package.json', 'vitest.config.ts'],
        related: ['testing-catalog'],
        body: `## Реальные замеры (на момент написания)

| Метрика | Значение |
| --- | --- |
| Unit-тест-файлов (src) | **671** |
| Unit-тестов (it/test) | **≈ 4426** |
| E2E-спек-файлов | **23** |
| E2E-тестов | **≈ 65** |
| Срезов полной unit-матрицы CI | **23** |
| E2E-шардов CI | **12** |
| Проверок в джобе Unit Tests | **2** (test:stable + test:server) |

Метод замера: Get-ChildItem -Recurse src -Include *.test.ts,*.test.tsx и подсчёт
регуляркой ^\\s*(it|test) по содержимому. Дата замера: 2026-11-11.

### Распределение unit-файлов по каталогам

| Каталог | Файлов |
| --- | --- |
| src/kernel | 453 |
| src/components | 169 |
| src/llm | 27 |
| src/stores | 14 |
| src/hooks | 3 |
| src/tests | 2 |
| src/shared | 1 |
| src/i18n | 1 |
| корень src (единичные файлы) | 1 |

### Что значат «23 среза»

Полная unit-матрица: kernel-debate, kernel-svc-a, kernel-svc-r1a1, kernel-svc-r1a2,
kernel-svc-r1a2-2, kernel-svc-r1a2-3, kernel-svc-r1a2b, kernel-svc-r1b, kernel-svc-r2,
kernel-svc-a2, kernel-svc-a3, kernel-svc-a4, kernel-svc-b, kernel-rest,
components-a, components-b1 … components-b7, rest.
`,
    },
    {
        slug: 'ci-architecture',
        title: 'CI/CD Architecture',
        section: 'dev',
        tags: ['ci', 'github actions', 'workflow'],
        freshness: 'verified',
        sources: ['.github/workflows/ci.yml'],
        related: ['ci-checks-full', 'testing-architecture'],
        body: `## Workflow: один файл \`.github/workflows/ci.yml\`

### Джобы и зависимости

| Джоба | needs | Что делает |
| --- | --- | --- |
| **quality** | — | TypeScript type-check, ESLint (порог warnings 4300), синхронизация вики, документация |
| **build** | quality | \`npm run build\` + проверка размера бандла, upload артефакта \`dist\` |
| **test** | quality | Стабильный набор юнит-тестов (\`npm run test:stable\`) |
| **coverage** | quality | Покрытие v8 с порогами (statements/branches/functions/lines) |
| **full-tests** | quality | Полная матрица: 23 среза unit-тестов (\`--pool=forks\`, heap 12288) |
| **e2e** | quality, build | 12 шардов Playwright; каждая джоба сама собирает dist (base "/") и ставит chromium с ретраями |
| **demos** | build | Демо-скриншоты (screenshots/visual-regression), upload PNG |
| **security-audit** | — | \`npm audit\` + проверка секретов |
| **circular-check** | quality | Проверка циклических зависимостей |
| **dep-graph** | quality | Проверка графа зависимостей |
| **deploy** | quality, build, test, coverage, security-audit, circular-check, dep-graph, e2e | Deploy GitHub Pages (только main/master) |

### Ключевые решения

- **23 среза unit** — чтобы каждая джоба укладывалась в память раннера (heap 12288;
  команда CI явно задаёт \`--pool=forks\`, переопределяя конфиг).
- **E2E собирает dist сама** — исключает зависимость от артефакта; \`VITE_BASE_PATH=/\`
  обязательно, иначе ассеты по \`/ai-os-new/\` 404 и SPA пуст.
- **Install Playwright с ретраями** — против транзиентных DNS/apt-сбоев раннеров.
- **Gates публикации**: \`deploy.needs\` = quality, build, test, coverage, security-audit,
  circular-check, dep-graph, e2e. Полная матрица (full-tests) и Demo screenshots (demos)
  выполняются независимо и НЕ блокируют Deploy.

\`\`\`mermaid
flowchart LR
    Q[quality] --> B[build]
    Q --> T[test]
    Q --> C[coverage]
    Q --> F[full-tests: 23 shards]
    B --> E[e2e: 12 shards]
    B --> D[demos]
    Q --> CC[circular-check]
    Q --> DG[dep-graph]
    B --> DEP[deploy]
    T --> DEP
    C --> DEP
    E --> DEP
    CC --> DEP
    DG --> DEP
\`\`\`
`,
    },
    {
        slug: 'ci-checks-full',
        title: 'Полный перечень проверок CI',
        section: 'dev',
        tags: ['ci', 'проверки', 'гейты'],
        freshness: 'verified',
        sources: ['.github/workflows/ci.yml'],
        related: ['ci-architecture', 'testing-runbook'],
        body: `## Все реально включённые проверки

1. **TypeScript type-check** — \`tsc --noEmit\` по проектным tsconfig-ссылкам.
2. **ESLint** — 0 ошибок, порог предупреждений 4300.
3. **Build (Vite)** — \`npm run build\` + предупреждение, если dist > 30 МБ.
4. **Unit Tests** — \`npm run test:stable\` + \`npm run test:server\` (Node test-runner,
   серверные и скриптовые тесты).
5. **Full Unit Tests** — 23 среза, включая kernel, components, rest.
6. **Test Coverage** — v8: statements ≥ 31, branches ≥ 25, functions ≥ 30, lines ≥ 32.
7. **E2E Tests** — 12 шардов Playwright (матрица покрывает 17 из 23 спек-файлов, ~65 тестов).
8. **Demo screenshots** — \`npm run gen:demos\` (screenshots + visual regression);
   CI загружает PNG артефактом для просмотра и не обновляет закоммиченные изображения
   автоматически (обновление — \`npm run gen:demos\` локально).
9. **Security Audit** — \`npm audit\` (provenance/audit флаги).
10. **Circular Dependency Check** — поиск циклов в графе импортов.
11. **Dependency Graph Check** — целостность графа зависимостей ядра.
12. **Wiki docs in sync** — генераторы вики должны давать нулевой diff.
13. **Documentation health** — проверка источников статей и внутренних ссылок вики.
14. **Deploy to GitHub Pages** — только на main/master и только если гейты из
    \`deploy.needs\` зелёные (см. CI/CD Architecture; full-tests и demos в needs нет).
`,
    },
    {
        slug: 'testing-fixes-history',
        title: 'История исправлений тестов',
        section: 'dev',
        tags: ['тесты', 'история', 'фиксы'],
        freshness: 'documented',
        sources: ['.github/workflows/ci.yml', 'src/kernel/services', 'src/components'],
        related: ['testing-gaps', 'ci-architecture'],
        body: `## Эпопея «починить полную матрицу» (ноябрь 2026)

### Проблемы и что было сделано

- **OOM в полном прогоне kernel** → матрица разбита на kernel-срезы (сейчас 14);
  CI-команда задаёт \`--pool=forks\`, heap поднят до 12288 МБ (для
  kernel-svc-r1a2 — 15360, один воркер).
- **Нестабильные моки сервисов** → ленивые сервисы (\`lazyService\`) замоканы через
  \`vi.mock\` с hoisted-фабриками (например, GovernancePanel, ChatService.autoRouting).
- **«Зависшая» TasksPanel** → причина: нестабильный \`t\` из мока useTranslation вызывал
  бесконечный ре-рендер useEffect. Исправлено стабильным \`stableT\` + мок agemsTaskService.
- **Порядок E2E**: preview-сервер не находил dist → сборка in-job; затем SPA была пустой
  из-за \`VITE_BASE_PATH=/ai-os-new/\` — исправлено на \`/\`.
- **DNS/apt-сбои при \`playwright install\`** → ретраи (3 попытки) + диагностика stderr.
- **Вики**: исправлены тесты целостности (slug, источники), добавлены новые статьи.
- **Типизация тестов** → исправлены неявные any, контравариантность onSafe, results моков.

### Принципы, которые были применены

- Не менять прод-код ради зелёного CI без необходимости (исключения: исправления
  реальных багов, найденных тестами — например, \`formatDate\` с NaN, \`flush\`-логика).
- Не отключать тесты «насовсем»: вместо этого разбирать причину (skip только с явной пометкой).
- Диагностика должна быть честной: аннотации с реальными stderr/path.
`,
    },
    {
        slug: 'testing-gaps',
        title: 'Пробелы покрытия',
        section: 'dev',
        tags: ['тесты', 'пробелы', 'покрытие'],
        freshness: 'needs-check',
        sources: ['src', 'e2e'],
        related: ['testing-catalog', 'testing-stats'],
        body: `## Где тестов не хватает

- **Взаимодействие с canvas/графами (VisGraph)** — узлы внутри canvas недоступны для
  jsdom-кликов; DOM-взаимодействие с графами практически не покрыто (например,
  KnowledgePanel Zone 4 временно пропущен с пометкой). E2E-покрытие графов отсутствует.
- **Реальные LLM-вызовы** — везде используются стабы; интеграция с настоящими
  провайдерами не тестируется в CI (осознанно).
- **Сервисы без unit-тестов** — часть сервисов ядра имеет только smoke/demo-seed тесты;
  полный список можно получить, сравнив \`src/kernel/services/**\` с \`*.test.ts\`.
- **Интернационализация** — переводы проверяются частично (i18n-ключи), но не
  для всех экранов.
- **E2E-покрытие новых панелей** — шарды покрывают доменные сценарии, но не каждую
  панель UI.
- **RAG/векторные операции** — memory/rag-сервисы имеют ограниченное покрытие (без
  реальных эмбеддингов).
- **Плагины** — вики-статьи есть, а вот тестов на runtime плагинов мало.

### Ближайшие кандидаты на добавление

1. Компонентные тесты для canvas-слоёв (через абстракцию на мок-событиях).
2. E2E-спек на граф/панель знаний.
3. Тесты runtime плагинов (pluginHost).
4. Расширение секции stable-тестов новыми сервисами.
`,
    },
    {
        slug: 'testing-runbook',
        title: 'Инструкция по запуску тестов',
        section: 'dev',
        tags: ['тесты', 'инструкция', 'команды'],
        freshness: 'verified',
        sources: ['package.json', 'vitest.config.ts', 'e2e/playwright.config.ts'],
        related: ['ci-architecture', 'testing-architecture'],
        body: `## Локальный запуск

### Unit-тесты (Vitest)

\`\`\`bash
# Один файл
npx vitest run src/kernel/services/budget-service.test.ts --pool=forks --no-coverage

# Группа файлов
npx vitest run src/components/PlannerPanel src/components/CostsPanel.test.tsx --pool=forks --no-coverage

# Стабильный набор (используется джобой test)
npm run test:stable

# Полные прогоны (как в CI)
npm run test:full:kernel
npm run test:full:components
npm run test:full:rest

# Покрытие
npm run test:coverage
\`\`\`

> На слабых машинах используйте \`--pool=forks\` и избегайте полного прогона src/kernel
> целиком (OOM) — лучше по каталогам.

### E2E (Playwright)

\`\`\`bash
# Сначала собрать приложение (обязательно с base "/"):
VITE_BASE_PATH=/ npm run build

# Один спек
npx playwright test --config=e2e/playwright.config.ts e2e/basic-flow.spec.ts

# Группа
npx playwright test --config=e2e/playwright.config.ts e2e/data-forum.spec.ts e2e/data-projects.spec.ts

# Все E2E
npm run test:e2e

# Демо-скриншоты
npm run gen:demos
\`\`\`

### Полный CI локально

Полный CI локально не запускается одной командой — он состоит из джоб.
Последовательность, эквивалентная CI:

\`\`\`bash
npx tsc --noEmit
npm run lint -- --max-warnings 4300
npm run build
npm run test:stable
npm run test:coverage
VITE_BASE_PATH=/ npm run build && npm run test:e2e
npm run gen:demos
npm audit
\`\`\`

### Полезные флаги

- \`--pool=forks\` / \`--pool=threads\` — выбор пула;
- \`--no-coverage\` — быстрее, без v8;
- \`-t "имя теста"\` — запуск одного теста по имени;
- \`--reporter=verbose\` — подробный вывод.
`,
    },
];
