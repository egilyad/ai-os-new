import type { WikiArticle } from './wiki-types';

// Development handbook — how the OS is built, wired and shipped.
// Bodies are template literals: escape inline backticks as \` , never use ${.
export const DEV_ARTICLES: WikiArticle[] = [
    {
        slug: 'dev-overview',
        title: 'Разработчикам: обзор и слои',
        section: 'dev',
        tags: ['dev', 'архитектура', 'слои'],
        freshness: 'verified',
        sources: ['.dependency-cruiser.cjs', 'src/kernel/DEPENDENCY_MAP.md'],
        related: ['for-developers', 'architecture', 'dev-layout', 'dev-boot'],
        body: `## Что это за код

Браузерное SPA: React + TypeScript + Vite, сборка в статику, данные — локально (IndexedDB/Dexie). Опционально рядом живут sidecar (browser/computer-use), sync-server и CORS-прокси, но ядро работает без сервера.

## Слои (жёстко enforced)

Направление зависимостей только в одну сторону: **UI → Application → Kernel → Infrastructure**. Правила проверяет dependency-cruiser на CI (\`npm run check:deps\`), 0 нарушений — гейт.

\`\`\`mermaid
flowchart LR
    UI["UI: src/components (панели)"] --> APP["Application: src/stores, hooks, i18n"]
    APP --> KRN["Kernel: src/kernel (DI, шина, сервисы)"]
    KRN --> INF["Infrastructure: src/llm (адаптеры), Dexie, воркеры"]
    KRN -. composition root .-> INF
\`\`\`

- Панель не имеет права импортировать адаптер или Dexie напрямую — только сервис или контракт.
- Composition root (bootstrap) — единственное исключение: там слои соединяются.

## Куда идти дальше

- Дерево каталогов: [[dev-layout]].
- Как поднимается ядро: [[dev-boot]].
- Сервисы и lazyService: [[dev-services]].
- События: [[dev-events]]. Панели: [[dev-components]]. Ворота: [[dev-ci]].
- Авто-каталоги (генерируются из кода): [[dev-component-catalog]] (компоненты и связи), [[dev-event-catalog]] (события шины), [[dev-service-map]] (DI-граф ядра), [[dev-contracts]] (интерфейсы ядра и их реализации), [[dev-store-catalog]] (сторы), [[dev-i18n-catalog]] (локали).
- Скрипты и команды: [[dev-scripts]]. Тестовая поверхность: [[dev-tests-catalog]].
- Рецепты типовых задач: [[dev-cookbook]].
- Короткая версия для онбординга — [[for-developers]].`,
    },
    {
        slug: 'dev-layout',
        title: 'Разработчикам: карта каталогов',
        section: 'dev',
        tags: ['dev', 'структура'],
        freshness: 'verified',
        sources: ['package.json', 'src/'],
        related: ['dev-overview', 'dev-components', 'dev-generators'],
        body: `## Верхний уровень

\`\`\`text
src/
  kernel/       ядро: DI-контейнер, шина, сервисы, контракты, bootstrap, тип-баррели
  components/   панели UI (по папке на фичу) + WikiPanel
  stores/       состояние UI (Zustand-подобные сторы)
  i18n/         локали en/ru + тест паритета
  llm/          адаптеры провайдеров, декораторы, HTTP/SSE
  generated/    сгенерированные данные (commits-feed, wiki-panel-map, каталоги)
  route-*.ts    реестр маршрутов и lazy-импортов
scripts/        генераторы, sidecar-ctl, smoke, cors-прокси
server/         sync-server, dev-хост, server-тесты
e2e/            Playwright-спеки
cli/            superagents CLI
docs/           манифесты, аудиты, roadmap
\`\`\`

## Ядро изнутри (src/kernel)

- Корень: \`bootstrap.ts\`, \`bootstrap-phases.ts\`, \`container.ts\`, \`kernel.ts\`, \`runtime.ts\`, \`security.ts\`, \`service-helper.ts\`.
- Каталоги: \`agents\`, \`contracts\` (интерфейсы), \`dal\`, \`events\`, \`instances\` (паблик-баррели), \`services\`, \`state\`, \`types\`, \`utils\`, \`workers\`.

## Точки входа для чтения кода

1. \`src/kernel/DEPENDENCY_MAP.md\` — карта инъекций «кто от кого зависит».
2. \`src/kernel/instances/index.ts\` — что вообще доступно панелям.
3. \`src/route-imports.ts\` — соответствие «id панели → файл компонента».`,
    },
    {
        slug: 'dev-boot',
        title: 'Разработчикам: boot, DI и контейнер',
        section: 'dev',
        tags: ['dev', 'bootstrap', 'DI'],
        freshness: 'verified',
        sources: ['src/kernel/bootstrap.ts', 'src/kernel/bootstrap-phases.ts', 'src/kernel/container.ts'],
        related: ['dev-services', 'dev-events', 'dev-overview'],
        body: `## Как поднимается ядро

Boot разбит на фазы (\`bootstrap.ts\` + \`bootstrap-phases.ts\`): сначала инфраструктура (Container, EventBus, БД, Security), затем сервисы, затем runtime. Панели не создают сервисы сами — они берут их из барреля \`src/kernel/instances\` (лениво).

\`\`\`mermaid
sequenceDiagram
    participant Boot as bootstrap
    participant C as Container
    participant Bus as EventBus
    participant Svc as Services
    participant UI as Панели
    Boot->>C: register/registerFactory (infra)
    Boot->>Bus: создать шину
    Boot->>Svc: зарегистрировать сервисы по фазам
    Boot-->>UI: готово (Runtime)
    UI->>C: get через lazyService (при первом обращении)
\`\`\`

## Контейнер (src/kernel/container.ts)

- \`register\` — готовый singleton; \`registerFactory\` — ленивый singleton; \`registerTransient\` — новый инстанс на каждый \`get\`.
- \`override\` — подмена реализации для тестов (без module-mock).
- Защита от циклов: повторный \`get\` во время резолва бросает «Circular dependency detected».
- Кэш провалов фабрик: 5с TTL — не долбит падающий сервис на каждом обращении.
- \`clear()\` уничтожает сервисы в LIFO-порядке (если есть \`destroy\`), с таймаутом 5с на каждый.
- \`getDependencies()\` отдаёт граф связей — используется диагностикой и \`lazyService\`.

## Правило

Сервис получает зависимости через конструктор (\`constructor(deps)\`). Если сервису нужен другой сервис в рантайме — через контейнер, а не импортом конкретного класса.`,
    },
    {
        slug: 'dev-events',
        title: 'Разработчикам: шина событий',
        section: 'dev',
        tags: ['dev', 'события', 'шина'],
        freshness: 'verified',
        sources: ['src/kernel/events/event-bus.ts', 'src/kernel/events/event-names.ts', 'src/kernel/events/event-registry.ts'],
        related: ['dev-event-catalog', 'dev-services', 'dev-boot'],
        body: `## Где что

- \`event-bus.ts\` — реализация шины (on/emit/onSafe/subscribeAll/off) + DLQ (dead-letter с ретраями).
- \`event-names.ts\` — объект \`EVENTS\` с именами (единый словарь).
- \`event-registry.ts\` — реестр типов событий (метаданные/валидация).
- Доменные файлы: \`chat-events\`, \`debate-runtime-events\`, \`provider-events\`, \`cognitive-events\`, \`workspace-events\`, \`system-events\`, \`observability-events\`.

## Ключевое свойство: шина lossy

Шина in-memory и не гарантирует порядок и доставку при перезагрузке. Значит менеджеры и панели обязаны **гидрироваться из durable-хранилища (Dexie/KV)**, а не полагаться на то, что «событие придёт».

\`\`\`mermaid
flowchart LR
    Svc["Сервис"] -- emit(EVENTS.X) --> Bus["EventBus (in-memory)"]
    Bus -- live-дельта --> UI["Подписчик (панель)"]
    Svc -- durable write --> Dex["Dexie / KV"]
    Dex -- hydrate при загрузке --> UI
\`\`\`

## Практика

- Доменные события добавляй в соответствующий \`*-events.ts\` и в \`EVENTS\`.
- \`onSafe\` — когда нельзя допустить исключение из хендлера в шину.
- Для порядко-зависимой логики не полагайся на последовательность эмитов — читай состояние из БД.

Полный перечень имён — в авто-каталоге [[dev-event-catalog]].`,
    },
    {
        slug: 'dev-services',
        title: 'Разработчикам: сервисы и lazyService',
        section: 'dev',
        tags: ['dev', 'сервисы', 'DI', 'lazyService'],
        freshness: 'verified',
        sources: ['src/kernel/service-helper.ts', 'src/kernel/instances/'],
        related: ['dev-service-map', 'dev-boot', 'dev-events', 'dev-components'],
        body: `## Баррели-фасады

Панели импортируют сервисы только из \`src/kernel/instances\`, собранного из:
- \`services-core\` / \`services-extras\` — сервисы;
- \`events\` — \`eventBus\`, \`EVENTS\`, тип \`EventMap\`;
- \`core-references\` / \`extra-references\` — ссылки на ресурсы;
- \`infra\` — инфраструктура (БД, security, logger).

\`\`\`mermaid
flowchart LR
    Panel["Панель"] --> Barrel["kernel/instances (баррель)"]
    Barrel --> Proxy["lazyService Proxy"]
    Proxy --> Container["DI-контейнер"]
    Container --> Svc["Сервис (реализация)"]
    Svc --> Contract["Контракт (contracts/)"]
\`\`\`

## lazyService (src/kernel/service-helper.ts)

Это Proxy, который резолвит сервис из контейнера **при первом обращении к свойству**, кэширует инстанс и биндит методы.

- Пока сервис не зарегистрирован — обращение бросает \`ServiceNotRegisteredError\` (кроме \`then\`/\`toJSON\`/\`symbol\`).
- Есть негативный кэш на 1с — не спамит контейнер при отсутствии.
- \`invalidateLazyServiceNotFound(name)\` — сбросить негативный кэш после ручной регистрации.
- \`clearResolvedServices()\` — сброс на shutdown.

## Паттерн в компоненте

Панель пишет \`import { keyService, eventBus, EVENTS } from '../../kernel/instances'\` и вызывает методы. Исключение из резолва кидать не должна — оборачивай в try/catch и показывай баннер (см. [[dev-conventions]]).

## Как добавить сервис

1. Контракт — в \`src/kernel/contracts\`.
2. Реализация — в \`src/kernel/services/...\`.
3. Регистрация — в фазе bootstrap.
4. Экспорт — из нужного барреля \`instances/*\`.

Полный граф «кто от кого зависит» — в [[dev-service-map]] (из DEPENDENCY_MAP.md). Перечень контрактов и их реализаций — в [[dev-contracts]].`,
    },
    {
        slug: 'dev-components',
        title: 'Разработчикам: компоненты и панели',
        section: 'dev',
        tags: ['dev', 'компоненты', 'панели'],
        freshness: 'verified',
        sources: ['src/components/', 'src/components/ChatPanel/MarkdownRenderer.tsx'],
        related: ['dev-routing', 'dev-i18n', 'dev-conventions', 'panel-chat'],
        body: `## Анатомия панели

\`\`\`mermaid
flowchart TD
    Route["route-registry: id + labelKey"] --> Imports["route-imports.ts: lazy(import(...))"]
    Imports --> Panel["Компонент панели (React)"]
    Panel --> Hook["hooks / stores"]
    Panel --> Svc["kernel/instances (сервисы)"]
    Panel --> I18n["useTranslation (en+ru)"]
    Panel --> Bound["ErrorBoundary (изоляция сбоя)"]
\`\`\`

- Каждая панель — ленивый компонент; сбой внутри гасит только её (ErrorBoundary), ОС продолжает работать.
- Только сервисы и контракты, без прямых импортов адаптеров/Dexie.
- Строки — через \`useTranslation\`, не хардкод.
- Цвета — через токены (\`var(--token)\`), а не сырые литералы (правило fa-02).

## Общее

- \`src/components/Common/\` — переиспользуемые утилиты/хуки (\`usePolling\`, gatewayApi и др.).
- Чат-рендер markdown/mermaid/code — \`src/components/ChatPanel/\` (\`MarkdownRenderer\`), переиспользуется в вики.

## Durable vs live

Компонент показывает либо live-состояние (события/стор), либо durable (прочитано из БД). Не смешивай: если данные обязаны пережить перезагрузку — читай из хранилища, а событие используй как сигнал «обнови».`,
    },
    {
        slug: 'dev-routing',
        title: 'Разработчикам: маршруты и добавление панели',
        section: 'dev',
        tags: ['dev', 'роутинг', 'панель'],
        freshness: 'verified',
        sources: ['src/route-registry-core.ts', 'src/route-registry-content.ts', 'src/route-registry-system.ts', 'src/route-imports.ts'],
        related: ['dev-components', 'dev-i18n'],
        body: `## Реестр маршрутов

- \`route-registry-core.ts\`, \`route-registry-content.ts\`, \`route-registry-system.ts\` — секции меню (\`NAV_SECTIONS\`) и пункты (id + labelKey).
- \`route-imports.ts\` — карта «id панели → React.lazy(import(компонент))».
- По этим данным генерируется \`src/generated/wiki-panel-map.ts\` (id → путь файла).

\`\`\`mermaid
flowchart TD
    Id["id панели"] --> Registry["route-registry-* (секция + labelKey)"]
    Registry --> Imports["route-imports.ts lazy(import)"]
    Imports --> Route["Роут + пункт сайдбара + поиск"]
    Imports --> Map["generated/wiki-panel-map.ts"]
    Map --> Docs["docs/wiki (зеркало на GitHub)"]
\`\`\`

## Новая панель за 4 шага

1. Два i18n-ключа: en + ru (иначе падает тест паритета \`i18n-keys.test.ts\`).
2. Запись в реестре: id и labelKey в одной из секций \`route-registry-*\`.
3. Lazy-импорт + строка в карте \`route-imports.ts\`.
4. Готово: роут, пункт сайдбара, крошки и поиск появляются автоматически.

## Проверка

После добавления — \`node scripts/gen-wiki-data.mjs\` обновит карту «панель → файл», чтобы вики знала про новую панель.`,
    },
    {
        slug: 'dev-stores',
        title: 'Разработчикам: состояние (stores) и хуки',
        section: 'dev',
        tags: ['dev', 'stores', 'состояние'],
        freshness: 'verified',
        sources: ['src/stores/', 'src/hooks/'],
        related: ['dev-store-catalog', 'dev-components', 'dev-services'],
        body: `## Сторы

\`src/stores/\` — Zustand-подобные сторы на фичу: \`useChatStore\`, \`useKeyStore\`, \`useNotificationStore\`, \`activeDebateStore\`, \`debateLiveStore\`, \`directorStore\`, \`personaStore\`, \`councilStore\`, \`crewStore\`, \`graphStore\`, \`rivalStore\`, \`opsStore\` и др. Каждый сторы держат UI-состояние и (где нужно) синхронизируются с сервисами.

\`\`\`mermaid
flowchart LR
    Panel["Панель"] --> Store["Store (Zustand)"]
    Store --> Svc["Kernel-сервис"]
    Svc --> Dex["Dexie / KV"]
    Bus["EventBus"] -. live-сигнал .-> Store
\`\`\`

## Хуки

\`src/hooks/\` — общие хуки (поллинг, таймеры, видимость и т.п.). Пример комплексного: \`usePolling\` в \`components/Common\`.

## Правило

Прежде чем класть данные в стор — реши, обязаны ли они переживать reload. Если да — источник правды в сервисе/БД, а стор — кэш для рендера.

Полный список хуков, типов состояния и вспомогательных экспортов — в [[dev-store-catalog]].`,
    },
    {
        slug: 'dev-i18n',
        title: 'Разработчикам: локализация (i18n)',
        section: 'dev',
        tags: ['dev', 'i18n', 'локали'],
        freshness: 'verified',
        sources: ['src/i18n/', 'src/i18n/i18n-keys.test.ts'],
        related: ['dev-i18n-catalog', 'dev-components', 'dev-routing'],
        body: `## Структура

- \`src/i18n/translations/{en,ru}/<namespace>.ts\` — словари по неймспейсам (chat, debate, memory, providers, settings, workspace, agents, analytics, budget, common, dashboard, dyad, errors, governance, groupChat, integrations, nav, observability, quality).
- \`index.ts\` собирает их через spread.
- \`useTranslation()\` → функция \`t(key, params?)\`. Пропущенный ключ рендерится как сырой ключ.

## Жёсткое правило: паритет

Тест \`src/i18n/i18n-keys.test.ts\` требует совпадения наборов ключей en ↔ ru. Добавил ключ в en — добавь в ru (и наоборот), иначе CI красный.

## Как добавить строку

1. Ключ в нужный неймспейс en и ru (наборы — идентичны).
2. В компоненте \`const { t } = useTranslation();\` и \`t('ns.key')\`.
3. Никакого хардкода UI-текста и «временных» английских строк.

Счётчики ключей по неймспейсам и верхнеуровневые префиксы — в [[dev-i18n-catalog]].`,
    },
    {
        slug: 'dev-testing',
        title: 'Разработчикам: тесты',
        section: 'dev',
        tags: ['dev', 'тесты', 'vitest', 'playwright'],
        freshness: 'verified',
        sources: ['vitest.config.ts', 'package.json', 'e2e/'],
        related: ['dev-tests-catalog', 'dev-ci', 'dev-conventions'],
        body: `## Уровни

- **Unit/компонентные** — Vitest + Testing Library (\`.test.ts/.test.tsx\` рядом с кодом).
- **Server** — \`node --test\` для sync-server (атомарность, очереди, адаптеры): \`npm run test:server\`.
- **E2E** — Playwright (\`e2e/\`), холодный boot + маршруты.

## Команды

- \`npm run test:stable\` — проверенный стабильный набор (то, что гоняет CI как гейт; полный \`vitest run\` на общих раннерах не тянет).
- \`npm run test:coverage\` — тот же набор с покрытием (пороги в \`vitest.config.ts\`).
- \`npm run test:server\`, \`npm run test:e2e\`.

## Грабли (проверено болью)

- Нестабильный \`t\` в моке → петля рендера. Стабилизируй через \`vi.hoisted\`.
- Мок-фабрика, ссылающаяся на top-level \`let\`, падает на статическом импорте (TDZ) — используй \`vi.hoisted\` или динамический \`import\` внутри теста.
- \`useVirtualizer\` в jsdom рендерит 0 строк (нет layout) — мокируй виртуализатор или ассерти по данным, не по DOM.
- Протухшие моки ядра (\`rootLogger\`, \`services-core\`, \`useKeyStore\`) — чини мок, а не панель.

## Когда локальный прогон недоступен

Если пул воркеров в окружении мёртв — валидируй синтаксис транспиляцией, гоняй eslint на файл и опирайся на CI как гейт.`,
    },
    {
        slug: 'dev-ci',
        title: 'Разработчикам: ворота качества и CI',
        section: 'dev',
        tags: ['dev', 'CI', 'гейт', 'сборка'],
        freshness: 'verified',
        sources: ['.github/workflows/ci.yml', 'package.json'],
        related: ['dev-testing', 'dev-generators', 'dev-scripts', 'dev-tests-catalog', 'for-developers'],
        body: `## Конвейер (.github/workflows/ci.yml)

\`\`\`mermaid
flowchart LR
    Q["Type-check & Lint"] --> B["Build"]
    Q --> T["Unit Tests (test:stable)"]
    Q --> C["Test Coverage"]
    Q --> S["Security Audit (npm audit --audit-level=high)"]
    Q --> CC["Circular Deps (madge — kernel)"]
    Q --> DG["Dependency Graph (dependency-cruiser)"]
    B --> E["E2E (Playwright, 12 шардов)"]
    E --> D["Deploy: GitHub Pages"]
\`\`\`

## Что именно проверяется

- **Type-check**: \`npx tsc -b --noEmit\` (именно \`-b\`: solution-конфиг с references на app+node; голый \`tsc --noEmit\` компилит ноль файлов — ложное «зелёно»).
- **ESLint**: \`npm run lint -- --max-warnings 5200\` — 0 ошибок обязательно, варнинги (React Compiler, raw colors, restricted imports) считаются и трендятся вниз.
- **Security**: \`npm audit --audit-level=high\` — любой high/critical валит билд.
- **Circular**: \`madge --circular src/kernel/\` — цикл в ядре валит.
- **Dependency rules**: \`depcruise\` — направление слоёв UI→Application→Kernel→Infrastructure.
- **E2E**: прогон против собранного артефакта \`dist\`, замороженного build-джобой.
- **Deploy**: sourcemaps \`hidden\`, \`.map\` вырезаются перед заливкой (в прод не утекают).

## Сборка

\`npm run build\` = \`tsc -b\` + \`vite build\`. Есть аварийный \`build:skip-typecheck\` — только локально, в CI/шипе не использовать.`,
    },
    {
        slug: 'dev-generators',
        title: 'Разработчикам: генераторы и сгенерированные файлы',
        section: 'dev',
        tags: ['dev', 'генераторы', 'scripts'],
        freshness: 'verified',
        sources: ['scripts/', 'src/generated/'],
        related: ['dev-ci', 'dev-routing', 'dev-layout', 'dev-scripts'],
        body: `## Что генерируется

- \`src/generated/commits-feed.ts\` — лента коммитов (git log, 40 записей) для раздела «Новости».
- \`src/generated/wiki-panel-map.ts\` — карта «id панели → путь компонента» (из \`route-imports.ts\`).
- \`src/generated/wiki-component-catalog.ts\` — каталог компонентов и их связей (статья [[dev-component-catalog]]).
- \`src/generated/wiki-event-catalog.ts\` — каталог событий шины (статья [[dev-event-catalog]]).

## Скрипты

- \`node scripts/gen-wiki-data.mjs\` — обновить ленту коммитов и карту панелей.
- \`node scripts/gen-wiki-catalog.mjs\` — каталог компонентов (обойти дерево src/components).
- \`node scripts/gen-wiki-events.mjs\` — каталог событий (из event-registry.ts).
- \`node scripts/gen-technique-panels.mjs\` — панели техник дебатов.
- \`node scripts/gen-readme-maps.mjs\` — карты для README.

## Правило

Сгенерированные файлы не редактируются руками (в шапке — «do not hand-edit»). Меняешь содержимое — правь генератор и перезапусти его.`,
    },
    {
        slug: 'dev-conventions',
        title: 'Разработчикам: конвенции кода',
        section: 'dev',
        tags: ['dev', 'стиль', 'конвенции'],
        freshness: 'verified',
        sources: ['eslint.config.js', '.dependency-cruiser.cjs'],
        related: ['dev-components', 'dev-services', 'dev-testing'],
        body: `## Стиль

- Без комментариев в коде, если не попросили явно.
- Строки — только через i18n; цвета — только через токены.
- Не тянуть библиотеку, которой нет в проекте; сверяйся с соседними файлами и \`package.json\`.

## Guard-паттерн (важнейший)

Данные из БД/легаси/частичных полезных нагрузок могут быть неполными. Каждое обращение к потенциально отсутствующему полю защищай:
- массивы — \`Array.isArray(x) ? x : []\` (не \`x.map\` на сыром значении);
- строки — \`(x ?? '')\` перед \`.slice/.toLowerCase/.includes\`;
- числа — \`(x ?? 0)\` перед арифметикой/форматированием (\`—\` вместо \`NaN\`/\`Invalid Date\`);
- любые сервисные вызовы — \`try/catch\` с видимым баннером, а не молчание.

Это не паранойя: интерфейс обязан переживать старые записи и частичные payload'ы (см. статьи зон в [[diagnostics]]).

## Коммиты

Стиль: \`feat(zoneN): <область> — <описание> (Zone N)\`. Тире — em-dash; чтобы не помять не-ASCII, сообщение пиши через \`git commit -F <файл>\`. Коммит/пуш — только по явной команде.`,
    },
    {
        slug: 'dev-glossary',
        title: 'Разработчикам: глоссарий',
        section: 'dev',
        tags: ['dev', 'глоссарий', 'термины'],
        freshness: 'verified',
        sources: ['src/kernel/', 'src/components/'],
        related: ['dev-overview', 'dev-services'],
        body: `## Термины

- **Панель** — экран/фича UI (\`src/components/<Feature>\`), подключённая через реестр маршрутов.
- **Сервис** — единица логики ядра (\`src/kernel/services\`), доступна через баррель \`instances\`.
- **Контракт** — интерфейс сервиса (\`src/kernel/contracts\`), единственный, что видит UI.
- **Шина** — in-memory EventBus; lossy, требует гидрации из БД.
- **lazyService** — Proxy-обёртка, резолвит сервис из контейнера при первом обращении.
- **Стор** — Zustand-подобное UI-состояние (\`src/stores\`).
- **Зона** — шаг аудита интерфейса; результат в [[diagnostics]] и статьях \`zone-*\`.
- **freshness** — метка происхождения статьи: подтверждено кодом / из документов / требует проверки / не реализовано.
- **RAG** — поиск по памяти/дебатам (BM25 + хэш-вектор).
- **Кристалл / джанкшн / линза** — артефакты синтеза: затвердевшее знание, пересечение дебатов, точка зрения.
- **Persona** — профиль агента-роли в дебате.
- **Sidecar** — внешний процесс (browser/computer-use) рядом с ОС; CSP loopback, approve-гейт.`,
    },
    {
        slug: 'dev-cookbook',
        title: 'Рецепты: типовые задачи',
        section: 'dev',
        tags: ['dev', 'рецепты', 'how-to'],
        freshness: 'verified',
        sources: ['src/route-registry-*.ts', 'src/kernel/', 'src/i18n/'],
        related: ['dev-routing', 'dev-services', 'dev-events', 'dev-i18n', 'dev-testing', 'dev-conventions', 'dev-generators'],
        body: `## Как что-то добавить или починить

Короткие рецепты. Детали — по ссылкам.

### Добавить панель
1. Два i18n-ключа (en+ru, иначе красный \`i18n-keys.test.ts\`).
2. Запись id+labelKey в реестр секций (\`route-registry-*\`).
3. Lazy-импорт + строка в \`route-imports.ts\`.
4. \`node scripts/gen-wiki-data.mjs\` — обновить карту «панель → файл».
   Полностью: [[dev-routing]].

### Добавить сервис ядра
1. Контракт в \`src/kernel/contracts\`.
2. Реализация в \`src/kernel/services/...\`, зависимости — через \`constructor(deps)\`.
3. Регистрация в фазе bootstrap.
4. Экспорт из барреля \`instances/*\`.
   Граф — [[dev-service-map]], контракты — [[dev-contracts]], детали — [[dev-services]].

### Добавить событие
1. Запись в \`EVENT_REGISTRY\` (\`event-registry.ts\`) — имя + Zod-схема; производные EVENTS/валидаторы подхватят её сами.
2. Эмит через \`eventBus.emit(EVENTS.X, payload)\`.
3. Подписка через \`eventBus.on(...)\` / \`onSafe(...)\`.
4. Помни: шина lossy — durable-состояние храни в БД, событие — только сигнал.
   Полный список — [[dev-event-catalog]], детали — [[dev-events]].

### Добавить строку i18n
1. Ключ в en и ru (наборы обязаны совпадать).
2. В компоненте \`t('ns.key')\`.
   Счётчики — [[dev-i18n-catalog]], детали — [[dev-i18n]].

### Защитить панель от «грязных» данных
- массивы: \`Array.isArray(x) ? x : []\`;
- строки: \`(x ?? '')\` перед \`.slice/.toLowerCase\`;
- числа: \`(x ?? 0)\` перед арифметикой; \`—\` вместо NaN/Invalid Date;
- сервисные вызовы: \`try/catch\` + видимый баннер.
  Детали — [[dev-conventions]], примеры фиксов — зоны в [[diagnostics]].

### Добавить тест
- Рядом с кодом: \`*.test.ts(x)\` (Vitest + Testing Library).
- Если мок ссылается на top-level \`let\` — \`vi.hoisted\` или динамический \`import\`.
- Обзор и грабли — [[dev-testing]], поверхность — [[dev-tests-catalog]].

### Обновить сгенерированные данные
- \`node scripts/gen-wiki-data.mjs\` — лента коммитов + карта панелей.
- \`node scripts/gen-wiki-catalog.mjs\` — каталог компонентов.
- \`node scripts/gen-wiki-events.mjs\` — каталог событий.
- \`node scripts/gen-wiki-contracts.mjs\` — контракты.
- \`node scripts/gen-wiki-stores.mjs\`, \`gen-wiki-i18n.mjs\`, \`gen-wiki-scripts.mjs\`, \`gen-wiki-tests.mjs\`, \`gen-wiki-depmap.mjs\`.
  Детали — [[dev-generators]] и [[dev-scripts]].

### Провайдер-адаптер
- Реализация в \`src/llm\`, регистрация в реестре адаптеров (\`src/llm/registry/adapter-factory\`); выбор — через сервис роутера. Кто от кого зависит — [[dev-service-map]].`,
    },
    {
        slug: 'dev-adr',
        title: 'Реестр архитектурных решений (ADR)',
        section: 'dev',
        tags: ['adr', 'решения', 'архитектура', 'история'],
        freshness: 'documented',
        sources: ['docs/audits/DOCS_INVENTORY_2026-10-17.md', 'docs/audits/DOCS_PROGRAM_REPORT_2026-10-17.md'],
        related: ['dev-history', 'docs-index', 'dev-conventions'],
        body: `## Статус реестра

Серия ADR-001…ADR-005 фиксировала ключевые решения проекта. Исходные файлы **отсутствуют в репозитории** — это зафиксировано в аудите \`docs/audits/DOCS_INVENTORY_2026-10-17.md\` (разделы A и B). Реестр ниже честно показывает, что известно и где искать следы; недостающие звенья не придумываются.

| ID | Решение | След в репозитории | Статус |
| --- | --- | --- | --- |
| ADR-001 | Event-driven architecture | \`001-event-driven-architecture.md\` (утерян) | только упоминания |
| ADR-002 | Worker sandboxing | \`002-worker-sandboxing.md\` (утерян) | только упоминания |
| ADR-003 | Dexie as primary storage | \`003-dexie-as-primary-storage.md\` (утерян) | только упоминания |
| ADR-004 | Hybrid search strategy | \`004-hybrid-search-strategy.md\` (утерян) | только упоминания |
| ADR-005 | MCP integration | \`005-mcp-integration.md\` (утерян) | только упоминания |

## Правила ведения

- Новые решения — в \`docs/reference/adr/NNN-краткое-имя.md\` плюс строка в этой таблице.
- Исторические ADR не переписываются; уточнения — отдельным документом со ссылкой на исходный.
- Пока исходник не найден, статус остаётся «только упоминания», а не «действует».
- Каждая строка должна указывать проверяемый след (файл, аудит, коммит), а не пересказ.

## Где искать следы

- [[dev-history]] — хроника проекта и архив решений.
- \`docs/audits/DOCS_INVENTORY_2026-10-17.md\` — разделы A/B о потерянных и полупотерянных файлах.
- [[docs-index]] — общая карта документации.`,
    },
];
