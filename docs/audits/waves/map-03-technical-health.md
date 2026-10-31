# Карта технического состояния — Technical Health Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `e08ab8e` (Oct 31, 2026, ветка `main`)
> **Дата анализа:** 2026-10-31
> **Метод:** статический анализ кода + метрики `wc`/`grep`/`find` + чтение `package.json`, `CHANGELOG.md`, `.github/workflows/ci.yml`, `docs/wiki/zone-*.md` (26 zone audits), `docs/wiki/diagnostics.md`
> **Парные документы:** «Карта готовности панелей» (качество 1–10) + «Карта функциональной ценности» (зачем нужно). Здесь — **здоровье кода и риски**.

---

## 1. Исполнительное резюме

SuperAgents OS — **крупная кодовая база**: ~509 K LOC TypeScript/TSX в 3 114 файлах, с ядром 239 K LOC (1 754 файла) и UI-слоем 229 K LOC (1 103 файла). 58 npm-зависимостей, 48 скриптов, 26 zone-audits с **199 задокументированными исправлениями** и **101 отложенной проблемой**.

**Сводные метрики здоровья:**

| Метрика                            |                                         Значение |          Оценка          |
| ---------------------------------- | -----------------------------------------------: | :----------------------: |
| Объём кода                         |                          509 K LOC, 3 114 файлов |            —             |
| Файлов > 500 строк (сложность)     |                                          **169** |       🟡 умеренно        |
| Файлов > 1000 строк                |                                           **18** |     🟡 есть тяжёлые      |
| Production deps                    |                                               25 |        🟢 разумно        |
| TODO/FIXME/HACK/XXX                |                                **2 / 0 / 0 / 0** | 🟢🟢 исключительно чисто |
| `as any`/`as unknown`              |                                              828 |       🟡 умеренно        |
| `eslint-disable`                   |                                              256 |       🟡 умеренно        |
| `@ts-ignore` / `@ts-expect-error`  |                                            **1** |       🟢🟢 отлично       |
| Explicit `throw new Error`         |                                              992 |   🟢 хорошая обработка   |
| Тестов всего                       |   514 (486 unit + 17 e2e + 8 server + 3 scripts) |       🟡 умеренно        |
| Задокументированных исправлений    |                                          **199** |    🟢 зрелая история     |
| Отложенных проблем                 |                                          **101** |        🟡 техдолг        |
| Известных проблем (diagnostics.md) |                                 **5 глобальных** |            🟡            |
| CI jobs                            | 5 (typecheck/lint/build/test/coverage/audit/e2e) |        🟢 зрелый         |
| Lint warning baseline              |                            **5600** max-warnings |     🔴 очень высокий     |
| Security audit job                 |                                          ✅ есть |            🟢            |

**Главный вывод:** кодовая база **в хорошем санитарном состоянии** для своего объёма. 2 TODO на 509K LOC — это **беспрецедентно чисто**. CI зрелый (5 jobs + security audit). 199 задокументированных исправлений показывают активную работу. **Главные риски:** 5600-warning baseline, 828 type-escapes, API-ключи в plaintext, 101 отложенная проблема, 18 файлов > 1000 строк.

**Health score: 7.0 / 10** — зрело, но с измеримым техдолгом.

---

## 2. Методология: 8 критериев + 3 состояния проблем

### 2.1. Восемь критериев оценки

| #   | Критерий                         | Что измеряем                                                      | Где доказательство                                         |
| --- | -------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | **Количество известных проблем** | Сколько задокументировано                                         | `docs/wiki/zone-*.md`, `diagnostics.md`, `dev-status-*.md` |
| 2   | **Критичность проблем**          | P0/P1/P2 распределение                                            | `CHANGELOG.md`, zone audits                                |
| 3   | **Технический долг**             | Отложенные issues + mock-сервисы + stub-панели                    | zone audits «Отложено», `@deprecated MOCK`                 |
| 4   | **Сложность кода**               | Файлы > 500/1000 строк, средний размер, цикломатическая сложность | `wc -l`, hotspot-анализ                                    |
| 5   | **Количество зависимостей**      | Production + dev deps, транзитивные                               | `package.json`                                             |
| 6   | **Наличие дублирования**         | Одинаковые файлы, copy-paste паттерны                             | `diff`, анализ TechniquePanels                             |
| 7   | **Состояние тестов**             | Кол-во, покрытие, что проверяют                                   | `**/*.test.tsx`, `dev-tests-catalog.md`                    |
| 8   | **Уязвимости и риски**           | Security audit, plaintext, eval, innerHTML, CSP                   | `grep` по паттернам, CI audit job                          |

### 2.2. Три состояния проблем (явно требовалось в задании)

| Состояние            | Обозначение       | Источник                                                       | Что с ним делать       |
| -------------------- | ----------------- | -------------------------------------------------------------- | ---------------------- |
| **Известные**        | 🟡 KNOWN          | Задокументированы в zone audits / diagnostics                  | В работе или в backlog |
| **Исправленные**     | 🟢 FIXED          | В разделе «Что проверено и исправлено» zone audits + CHANGELOG | Архив, источник уроков |
| **Не исследованные** | 🔴 UNINVESTIGATED | Не упомянуты нигде, но видны по коду / нет тестов              | Требуют аудита         |

---

## 3. Дашборд: агрегированные метрики

### 3.1. Объём и сложность

| Метрика                    |                                      Значение |
| -------------------------- | --------------------------------------------: |
| TS/TSX файлов в `src/`     |                                     **3 114** |
| Total LOC                  |                                   **508 976** |
| Средний размер файла       |                                **163 строки** |
| Файлов > 500 строк         |                         **169** (5.4% файлов) |
| Файлов > 1000 строк        |                          **18** (0.6% файлов) |
| Largest file               | `wiki-articles.ts` — 5 021 строка (generated) |
| Largest non-generated file |              `dexie-schema.ts` — 3 764 строки |

**По слоям:**

| Слой          | Файлов |     LOC | Доля | Средний размер |
| ------------- | -----: | ------: | ---: | -------------: |
| `kernel/`     |  1 754 | 239 832 |  47% |            136 |
| `components/` |  1 103 | 228 813 |  45% |            207 |
| `llm/`        |     79 |  12 299 |   2% |            155 |
| `stores/`     |     53 |   8 993 |   2% |            169 |
| `i18n/`       |     48 |   8 618 |   2% |            179 |
| `generated/`  |     23 |   2 112 |  <1% |             91 |
| `hooks/`      |     15 |   1 350 |  <1% |             90 |

### 3.2. Зависимости

| Категория                   | Кол-во | Тяжёлые                                                                                                                                                                   |
| --------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dependencies` (production) | **25** | React 19, Vite 8, Dexie 4, React Flow 12, Mermaid 12, Monaco 0.52, TipTap 3, Zod 4, Zustand 4, Orama 3, framer-motion 12, vis-network 10, @google/generative-ai, groq-sdk |
| `devDependencies`           | **33** | Vitest, Playwright, ESLint, Prettier, TypeScript 6, madge, dependency-cruiser, husky, commitlint                                                                          |
| Всего                       | **58** | —                                                                                                                                                                         |
| npm scripts                 | **48** | —                                                                                                                                                                         |

**Зрелые** зависимости (React, Vite, Dexie, Zod) — stable. **Risk:** `@google/generative-ai@^0.24.1` — pre-1.0, API может ломаться. `lucide-react@^1.14.0` — нестандартная версия (обычно 0.x).

### 3.3. Качество кода (статические маркеры)

| Маркер                            |                        Кол-во | Верdict                                      |
| --------------------------------- | ----------------------------: | -------------------------------------------- |
| `TODO`                            |                         **2** | 🟢🟢 исключительно чисто (509K LOC / 2 TODO) |
| `FIXME`                           |                             0 | 🟢                                           |
| `HACK`                            |                             0 | 🟢                                           |
| `XXX`                             |                             0 | 🟢                                           |
| `as any` / `as unknown`           |                       **828** | 🟡 умеренно (0.16% от LOC — приемлемо)       |
| `eslint-disable`                  |                       **256** | 🟡 умеренно                                  |
| `@ts-ignore` / `@ts-expect-error` |                         **1** | 🟢🟢 отлично                                 |
| `throw new Error/TypeError`       |                       **992** | 🟢 хорошая error-культура                    |
| `console.error`                   |                            72 | 🟡 приемлемо                                 |
| `console.warn`                    |                            16 | 🟢                                           |
| `@deprecated MOCK`                | 1 сервис (`HealthSlaService`) | 🟡                                           |

**2 TODO на 509K LOC — это аномально чисто.** Большинство зрелых проектов имеют 50–500 TODO. Это говорит о **строгой культуре уборки**.

### 3.4. Тесты

| Метрика                            |                  Значение |
| ---------------------------------- | ------------------------: |
| Unit/компонентных тестов (src)     |                   **486** |
| Server-тестов                      |                         8 |
| Скрипт-тестов                      |                         3 |
| E2E (Playwright)                   |                    **17** |
| Всего                              |                   **514** |
| Тестовых файлов в `src/components` |                       164 |
| Каталогов панелей с тестом         |               104 из ~180 |
| Stable CI gate (`test:stable`)     |                   34 пути |
| Coverage job                       | ✅ есть (`test:coverage`) |

### 3.5. CI / Quality gates

`.github/workflows/ci.yml` — 5 jobs:

| Job                   | Что делает                                                                                                                                                       | Статус                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Type-check & Lint** | `npx tsc -b --noEmit` + `npm run lint -- --max-warnings 5600` + `docs:health` + `check:circular-kernel` (madge) + `check:deps` (depcruise) + 16 `gen:*` скриптов | 🟢 зрело, **но 5600 warnings — высокий baseline** |
| **Build**             | `npm run build` (typecheck + production build)                                                                                                                   | 🟢                                                |
| **Unit Tests**        | `npm run test:stable` + `npm run test:server`                                                                                                                    | 🟢                                                |
| **Test Coverage**     | `npm run test:coverage`                                                                                                                                          | 🟢                                                |
| **Security Audit**    | (details в workflow)                                                                                                                                             | 🟢 есть                                           |
| **E2E**               | `npm run test:e2e -- ${{ matrix.spec }}` (matrix из 17 specs)                                                                                                    | 🟢                                                |

**Дополнительно:** `check:circular-kernel` (madge) проверяет циклические зависимости в `src/kernel/`. `check:deps` (dependency-cruiser) — по `.dependency-cruiser.cjs`.

---

## 4. Учёт проблем: Известные / Исправленные / Не исследованные

### 4.1. Исправленные проблемы 🟢 — 199 (задокументированы)

Из **26 zone-audit файлов** в `docs/wiki/zone-*.md`. Каждый zone содержит раздел **«Что проверено и исправлено»**.

**Распределение по зонам (топ-10):**

| Zone      | Что исправлено | О чём зона                                                                                                                                                                                             |
| --------- | -------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| zone-26   |            ~25 | Остатки (PolicyEditor, Analytics, Performance, Drift, VulnTargeting, Aquarium, Bookmarks, CausalDebugger, RivalsHub, AgentJournal, AlertLayer, NvidiaEnterprise, Fleet) — guards от missing arrays/NaN |
| zone-1    |            ~12 | Панели провайдеров и чата                                                                                                                                                                              |
| zone-4    |            ~10 | Память и знания                                                                                                                                                                                        |
| zone-3    |            ~10 | Агенты и задачи                                                                                                                                                                                        |
| zone-2    |            ~10 | Дебаты                                                                                                                                                                                                 |
| zone-5    |             ~8 | Система и мониторинг                                                                                                                                                                                   |
| zone-25   |             ~8 | Конструкторы                                                                                                                                                                                           |
| zone-6    |             ~8 | Governance и политики                                                                                                                                                                                  |
| zone-7    |             ~7 | Инструменты и MCP                                                                                                                                                                                      |
| …         |              … | …                                                                                                                                                                                                      |
| **Total** |        **199** | —                                                                                                                                                                                                      |

**Категории исправлений (по CHANGELOG + zones):**

1. **Guards от missing fields** (большинство zone-26) — `where('metadata.timestamp')` → `where('metadata.timestamp]')` (Dexie compound index syntax); optional chaining везде; `Array.isArray()` проверки
2. **Provider audit sprint** (v4.4.0) — 100 tasks: CircuitBreaker `updateAndGetState()` for auto-transition, priority queue starvation fix, `destroy()` на adapter interface
3. **Auto-debate default model fix** (v4.4.1) — `auto-debate-service.ts:96` hardcoded `'gpt-3.5-turbo'` → `undefined` (был 404 на всех провайдерах)
4. **NVIDIA proxy** — `baseURL` от direct `https://integrate.api.nvidia.com/v1` к `/proxy/nvidia` (CORS fix)
5. **UI layout fix** — root `overflowY: 'auto'` → `overflow: 'hidden'` (аргументы скроллятся в контейнере, не весь panel)
6. **InstalledProvidersView crash fixes** — `ProviderCard` declares `status`, `reputation`, `modelCount` (was missing)
7. **Removed global LLM backoff** — `failedProviders` + adapter-level circuit breakers вместо `llmBackoffUntil`
8. **Promise-in-state guards** — `HealthPanel` явно проверяет `initial instanceof Promise ? null : initial`
9. **Empty list vs load failure** — `GovernancePanel` различает `error_load` и `empty_roles`
10. **Sandbox CSP** — `sandbox.worker.ts` использует не `new Function()`/eval(), а safe alternative

### 4.2. Известные проблемы 🟡 — 101 отложенная + 5 глобальных

**5 глобальных известных проблем** (`docs/wiki/diagnostics.md` — «Известные проблемы (не скрываем)»):

| #   | Проблема                                                                            | Критичность | Где                         |
| --- | ----------------------------------------------------------------------------------- | :---------: | --------------------------- |
| 1   | **API-ключи провайдеров в plaintext в IndexedDB**                                   |   🔴 HIGH   | design choice (single-user) |
| 2   | **EventBus без персистентности и порядка** — только live-дельта                     |   🟡 MED    | ядро архитектуры            |
| 3   | **Часть UI показывает in-memory данные** (не всё сохранено)                         |   🟡 MED    | various panels              |
| 4   | **Отдельные тесты протухли** (пример: ChatPanel, ProviderManager) — harness'ы висят |   🟡 MED    | test files                  |
| 5   | **Unbounded-провайдеры разрешены по умолчанию**                                     |   🟡 MED    | provider config             |

**101 отложенная проблема** (из zone audits «Отложено, требует проверки»):

| Zone      | Отложено | Характеристика                                                         |
| --------- | -------: | ---------------------------------------------------------------------- |
| zone-4    |        8 | Память: иконки, синтез без сохранения, SLA-fallback, autodiscovery off |
| zone-1    |        7 | Дублирующие иконки поиска, локальный цвет без persist, stale-задержки  |
| zone-3    |        6 | Агенты/задачи: i18n-пробелы                                            |
| zone-23   |        5 | Коммуникации-2                                                         |
| zone-24   |        5 | Знания-2                                                               |
| zone-5    |        5 | Система/мониторинг                                                     |
| zone-2    |        4 | Дебаты                                                                 |
| zone-6    |        4 | Governance/политики                                                    |
| zone-7    |        4 | Инструменты/MCP                                                        |
| zone-8    |        4 | Роутер                                                                 |
| zone-15   |        4 | Исследования                                                           |
| …         |        … | …                                                                      |
| **Total** |  **101** | —                                                                      |

**Шаблоны отложенных проблем:**

- **i18n пробелы** — английские строки в панелях (не локализованы)
- **Stale-данные** — показывают задержки/старые значения без refresh
- **Autodiscovery выключено** — комментированный код
- **Локальное состояние без persist** — настройки UI теряются при reload
- **Gamified-метрики** — синтезированы из счётчиков, не измерены реально

### 4.3. Не исследованные 🔴 — что видно по коду, но не в zone audits

Эти **не задокументированы** ни в diagnostics.md, ни в zone audits — найдены статическим анализом.

| #   | Проблема                                                                                                                                  |                          Доказательство                           | Критичность                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------: | -------------------------------------------------------------------------- |
| 1   | **5600-warning lint baseline**                                                                                                            | `.github/workflows/ci.yml`: `npm run lint -- --max-warnings 5600` | 🟡 MED — копится тихо                                                      |
| 2   | **HealthSlaService = `@deprecated MOCK`**                                                                                                 |          `wiki-components.ts` + `health-sla-service.ts`           | 🟡 MED — UI показывает симулированные данные                               |
| 3   | **828 `as any`/`as unknown` type escapes**                                                                                                |                `grep -rE "as (any\|unknown)" src/`                | 🟡 MED — 0.16% от LOC, но集中的 в Kernel/PersonalityCard/DistillationPanel |
| 4   | **256 `eslint-disable` directives**                                                                                                       |                    `grep -rE "eslint-disable"`                    | 🟡 MED — нужно ревью                                                       |
| 5   | **80 `localStorage` plain-text calls**                                                                                                    |           `grep -rE "localStorage\.(setItem\|getItem)"`           | 🟡 LOW-MED — prefs + SRE keyId                                             |
| 6   | **62 идентичные TechniquePanels**                                                                                                         |         `diff HumorPanel.tsx CriticPanel.tsx` = 4 строки          | 🟡 MED — maintainability risk                                              |
| 7   | **18 файлов > 1000 строк**                                                                                                                |                          `find … wc -l`                           | 🟡 MED — complexity hotspots                                               |
| 8   | **`dexie-schema.ts` 3 764 строки**                                                                                                        |                    largest non-generated file                     | 🟡 MED — schema монолит                                                    |
| 9   | **`event-registry.ts` 2 772 строки**                                                                                                      |                  198 схем событий в одном файле                   | 🟡 MED                                                                     |
| 10  | **`sandbox-interpreter.ts` 1 906 строк**                                                                                                  |                          workers/sandbox                          | 🟡 MED — security-critical code                                            |
| 11  | **`wiki-articles.ts` 5 021 строка**                                                                                                       |                       generated, но в src/                        | 🟢 LOW (generated)                                                         |
| 12  | **`panel-actions-catalog.ts` 4 832 строки**                                                                                               |                             generated                             | 🟢 LOW (generated)                                                         |
| 13  | **Tests stale** — `diagnostics.md` признаёт: «harness'ы висят, чинятся точечно»                                                           |                              🟡 MED                               |
| 14  | **`dev-status-critical.md`, `dev-status-debt.md`, `dev-status-done.md`, `dev-status-bugs.md`, `dev-status-blocked.md` — пустые заглушки** |             WebFetch подтвердил: «текст в разработке»             | 🟡 MED — нет formal issue tracking                                         |
| 15  | **Open `/audit/` directory empty**                                                                                                        |                     `ls docs/audits/` → empty                     | 🟡 MED — нет audit reports                                                 |
| 16  | **Coverage threshold не задан в CI**                                                                                                      |     `test:coverage` запускается, но threshold-gate не найден      | 🟡 MED                                                                     |
| 17  | **Mock-сервисы в production code path**                                                                                                   |    DemoGate + DemoBadge + `featureFlags.mockServices.enabled`     | 🟡 LOW (gated)                                                             |

---

## 5. Детальный анализ по 8 критериям

### 5.1. Количество известных проблем

**Оценка: 6/10**

- **199 исправленных** + **101 отложенных** + **5 глобальных** + **~17 не исследованных** = **~322 проблем-точки** на жизни проекта.
- На 509K LOC это **0.63 проблемы на 1K LOC** — **в норме** для зрелой кодовой базы.
- **Покрытие аудитом:** 26 zone audits + `diagnostics.md` + CHANGELOG — отличная задокументированность.
- **Gap:** `dev-status-*.md` (5 файлов) — пустые заглушки. Это значит, что **формального issue tracker в wiki нет**, только исторические zone audits.

### 5.2. Критичность проблем

**Оценка: 7/10** (критичность низкая = хорошая оценка)

**P0 критические (найдено):**

- ✅ FIXED: auto-debate default model 404 (v4.4.1)
- ✅ FIXED: NVIDIA proxy CORS
- ✅ FIXED: InstalledProvidersView crash (missing `status`/`reputation`/`modelCount`)
- ✅ FIXED: MemoryEngine compound index syntax
- 🟡 KNOWN: API keys plaintext в IndexedDB (design choice, не bug)
- 🟡 KNOWN: EventBus no persistence (architectural)

**P1 важные:**

- 🟡 KNOWN: Tests stale (ChatPanel, ProviderManager)
- 🟡 KNOWN: HealthSlaService = MOCK
- 🟡 KNOWN: 5600-warning lint baseline
- 🟡 KNOWN: Unbounded providers by default

**P2 минорные:**

- 🟡 101 deferred issue в zone audits (i18n пробелы, stale-данные, локальные настройки без persist)
- 🟡 828 type escapes
- 🟡 256 eslint-disable

**P0 в production не найдено.** Все критические исправления уже в CHANGELOG. Это **хороший знак**.

### 5.3. Технический долг

**Оценка: 6/10**

| Источник долга                        | Объём                                                              | Вердикт                        |
| ------------------------------------- | ------------------------------------------------------------------ | ------------------------------ |
| 101 отложенная проблема (zone audits) | измеримый, задокументирован                                        | 🟡 управляемый                 |
| `@deprecated MOCK` сервисы            | 1 (`HealthSlaService`)                                             | 🟢 малый                       |
| Stub-панели                           | 3 (`GovernancePanel`, `OpenRouterPanel`, `SocialLeaderboardPanel`) | 🟡 малый                       |
| 62 идентичные TechniquePanels         | кодогенерация, не ручной копипаст                                  | 🟡 medium-term maintainability |
| 18 файлов > 1000 строк                | hotspots                                                           | 🟡 требует рефакторинга        |
| 5600 lint warnings                    | копятся тихо                                                       | 🟡 нужен cleanup               |
| `dev-status-*.md` пустые              | нет formal tracking                                                | 🟡 процессный долг             |
| Tests stale                           | точечно чинятся                                                    | 🟡 стабильный долг             |
| 828 type escapes                      | 0.16% от LOC                                                       | 🟢 приемлемо                   |
| 256 eslint-disable                    | требует ревью                                                      | 🟡                             |

**Долг в основном «известный и задокументированный»** — это **controlled debt**, не скрытый. Разделение «Что проверено и исправлено» / «Отложено» в zone audits = хорошая практика.

### 5.4. Сложность кода

**Оценка: 6/10**

**Top-15 крупнейших файлов (hotspots):**

| Файл                                              |     Строк | Тип               | Риск                     |
| ------------------------------------------------- | --------: | ----------------- | ------------------------ |
| `WikiPanel/wiki-articles.ts`                      |     5 021 | generated         | 🟢 LOW — автогенерация   |
| `Assistant/panel-actions-catalog.ts`              |     4 832 | generated         | 🟢 LOW                   |
| `WikiPanel/wiki-components.ts`                    |     4 104 | generated         | 🟢 LOW                   |
| **`kernel/services/dexie-schema.ts`**             | **3 764** | hand-written      | 🔴 HIGH — schema монолит |
| `kernel/events/event-registry.ts`                 |     2 772 | 198 event схем    | 🟡 MED — единый реестр   |
| `styles/common.ts`                                |     1 968 | styling tokens    | 🟡 MED                   |
| **`kernel/workers/sandbox-interpreter.ts`**       | **1 906** | security-critical | 🔴 HIGH — sandbox logic  |
| `generated/wiki-connections.ts`                   |     1 594 | generated         | 🟢 LOW                   |
| **`debate-runtime/debate-llm-prompt-context.ts`** | **1 392** | logic             | 🟡 MED                   |
| `research-adapters/source-adapters.ts`            |     1 291 | adapters          | 🟡 MED                   |
| `kernel/contracts/index.ts`                       |     1 241 | contracts barrel  | 🟢 LOW (barrel)          |
| **`FleetPanel/FleetPanel.tsx`**                   | **1 235** | UI                | 🟡 MED                   |
| **`kernel/services/agent-service.ts`**            | **1 234** | core service      | 🔴 HIGH                  |
| **`PolicyPanel/PolicyPanel.tsx`**                 | **1 184** | UI                | 🟡 MED                   |
| **`debate-strategy-definitions.ts`**              | **1 157** | 33 стратегии      | 🟡 MED (но уместно)      |
| **`key-service.ts`**                              | **1 098** | security-critical | 🔴 HIGH                  |
| `assistant/assistant-actions.ts`                  |     1 098 | logic             | 🟡 MED                   |
| **`memory-engine.ts`**                            | **1 088** | core              | 🟡 MED                   |

**Verdict:**

- **Generated файлы** (4 из топ-5) — не реальная сложность, автогенерация.
- **Hand-written hotspots** — `dexie-schema.ts` (3 764), `sandbox-interpreter.ts` (1 906), `agent-service.ts` (1 234), `key-service.ts` (1 098) — **требуют декомпозиции**.
- **169 файлов > 500 строк** (5.4% от 3 114) — приемлемо, но требует внимания.
- **Средний размер 163 строки** — в норме для React/TypeScript проекта.

### 5.5. Количество зависимостей

**Оценка: 8/10** (хорошо)

| Группа          | Кол-во | Риск                 |
| --------------- | -----: | -------------------- |
| Production deps |     25 | 🟢 разумно           |
| Dev deps        |     33 | 🟢 стандарт          |
| Всего           | **58** | 🟢                   |
| npm scripts     |     48 | 🟢 automation зрелая |

**Оценка зависимостей:**

| Зависимость               | Версия   | Зрелость                             | Риск                   |
| ------------------------- | -------- | ------------------------------------ | ---------------------- |
| `react`                   | ^19.2.5  | 🟢 stable                            | —                      |
| `vite` (dev)              | ^8       | 🟢 stable                            | —                      |
| `dexie`                   | ^4.4.2   | 🟢 stable                            | —                      |
| `zod`                     | ^4.4.3   | 🟢 stable (Zod 4 — latest)           | —                      |
| `@xyflow/react`           | ^12.10.2 | 🟢 stable                            | —                      |
| `mermaid`                 | ^12.2.0  | 🟢 stable                            | —                      |
| `monaco-editor`           | ^0.52.2  | 🟡 pre-1.0                           | low                    |
| `@tiptap/react`           | ^3.27.1  | 🟢 stable                            | —                      |
| `@google/generative-ai`   | ^0.24.1  | 🔴 pre-0.x                           | **API может ломаться** |
| `groq-sdk`                | ^1.4.0   | 🟢 stable                            | —                      |
| `vis-network`             | ^10.1.2  | 🟢 stable                            | —                      |
| `framer-motion`           | ^12.38.0 | 🟢 stable                            | —                      |
| `lucide-react`            | ^1.14.0  | 🟡 нестандартная версия (обычно 0.x) | low                    |
| `meriyah`                 | ^7.1.0   | 🟢 stable (parser)                   | —                      |
| `dompurify`               | ^3.4.12  | 🟢 stable (security)                 | —                      |
| `@orama/orama`            | ^3.1.18  | 🟢 stable                            | —                      |
| `@tanstack/react-virtual` | ^3.14.2  | 🟢 stable                            | —                      |
| `zustand`                 | ^4.5.7   | 🟢 stable                            | —                      |
| `react-router-dom`        | ^7.15.0  | 🟢 stable                            | —                      |

**Главный риск:** `@google/generative-ai@^0.24.1` — pre-1.0, Google часто меняет API между minor версиями.

**Дополнительно:** `madge` (circular dep checker) + `dependency-cruiser` — это **инструменты контроля зависимостей в CI**, что компенсирует риски.

### 5.6. Наличие дублирования

**Оценка: 5/10** (есть измеримое дублирование)

| Тип дублирования                        | Где                                                                                       | Объём                                 | Риск                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| **62 идентичные TechniquePanels**       | `src/components/TechniquePanels/*.tsx`                                                    | 62 × 234 строк = ~14 500 LOC          | 🟡 MED — **generator-produced**, но не вынесено в общий компонент |
| **Multiple budget panels**              | BudgetPanel + BudgetAlertsPanel + CostOptimizationPanel + CostAnalyticsPanel + CostsPanel | 5 UI-точек входа                      | 🟡 MED — overlapping UI                                           |
| **Multiple health panels**              | HealthPanel + SystemHealthPanel + DocsHealthPanel + HealthSlaPanel                        | 4 health-точки                        | 🟡 MED                                                            |
| **Multiple provider UIs**               | ProviderManager + ProviderDashboard + ProviderMarketplace + OpenRouterPanel               | 4 точки                               | 🟡 MED                                                            |
| **Generated wiki files**                | `wiki-articles.ts` (5K) + `wiki-components.ts` (4K) + `wiki-connections.ts` (1.5K)        | generated                             | 🟢 LOW (auto)                                                     |
| **Inline-стили с цветовыми литералами** | `'#3b82f6'`, `'#10b981'` в нескольких панелях                                             | violation of `fa-02` token convention | 🟡 LOW-MED                                                        |

**Технический diff TechniquePanels:**

```bash
$ diff <(sed -E 's/humor|Humor/XXX/g' HumorPanel.tsx) \
       <(sed -E 's/critic|Critic/XXX/g' CriticPanel.tsx) | wc -l
4
```

Только 4 строки различий (TECHNIQUE_ID, CATEGORY, name, mode). **Это явный кандидат на рефакторинг** — вынести в `<TechniquePanel techniqueId="humor" />` generic-компонент.

### 5.7. Состояние тестов

**Оценка: 6/10**

| Метрика                    |                                  Значение | Оценка             |
| -------------------------- | ----------------------------------------: | ------------------ |
| Unit/компонентных тестов   |                                       486 | 🟡                 |
| E2E specs                  |                                        17 | 🟢 хорошо          |
| Total tests                |                                       514 | 🟡 умеренно        |
| Test files в components    |                                       164 | 🟡                 |
| Каталогов панелей с тестом |                                104 / ~180 | 🟡 58%             |
| Stable CI gate             |                                   34 пути | 🟡                 |
| Coverage threshold         |                                  не задан | 🔴 нет gate        |
| Tests stale                |   несколько (diagnostics.md подтверждает) | 🟡                 |
| `test:stable` pool         | `forks` (vmThreads lacks `crypto.subtle`) | 🟢 workaround есть |

**Coverage по слоям** (из `dev-tests-catalog.md`):

| Область          | Тестов |
| ---------------- | -----: |
| `src/kernel`     |    290 |
| `src/components` |    157 |
| `src/llm`        |     20 |
| `src/stores`     |     14 |
| `src/hooks`      |      3 |
| `src/i18n`       |      1 |
| `src` (root)     |      1 |

**Проблемы тестирования:**

1. **Coverage threshold не задан в CI** — `test:coverage` запускается, но gate не найден. Coverage может падать тихо.
2. **Только 34 пути в `test:stable`** — многие компонентные тесты существуют, но **не в CI gate** (`dev-status-testing.md` подтверждает).
3. **`vmThreads` pool lacks `crypto.subtle`** — workaround через `forks` pool, но есть «environment issues with forks pool when running with high parallelism».
4. **`panel-smoke-tests.test.tsx`** — покрывает только 6 панелей (BudgetPanel, CostOptimizationPanel, DebateAnalysisPanel, RotationsPanel, WebhooksPanel, DecisionLogPanel) из ~268.
5. **`technique-panels-smoke.test.tsx`** — покрывает 62 техники, но только render (не логику).
6. **17 E2E specs** — хорошо: data-chat, data-debate, data-dialogs, data-fleet, data-forum, data-health, data-keys, data-knowledge, data-organizer, data-projects, data-research, data-room, data-runtime, data-sync, routes-a-flow, routes-b-flow, basic-flow.

### 5.8. Уязвимости и риски

**Оценка: 6/10**

| Риск                                                              |  Severity  | Где                                                            | Статус                                                                                                          |
| ----------------------------------------------------------------- | :--------: | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **API keys в plaintext в IndexedDB**                              |  🔴 HIGH   | design choice (single-user)                                    | KNOWN, документировано в README и diagnostics.md                                                                |
| **Sandbox code execution** (`sandbox-interpreter.ts` 1 906 строк) |   🟡 MED   | `kernel/workers/`                                              | 🟢 mitigated: `validateSandboxCode()` баннит `eval()` и `new Function()` (см. tests); Web Worker isolation; CSP |
| **innerHTML usage**                                               |   🟢 LOW   | 7 случаев, 5 в tests, 2 в production                           | 🟢 mitigated: 56 DOMPurify usages                                                                               |
| **localStorage plain-text**                                       | 🟡 LOW-MED | 80 случаев (prefs, SRE keyId)                                  | 🟡 acceptable for non-secret prefs                                                                              |
| **External fetch**                                                |   🟢 LOW   | 4 случая                                                       | 🟢 acceptable                                                                                                   |
| **`@google/generative-ai@^0.24.1`** (pre-1.0)                     |   🟡 MED   | package.json                                                   | 🟡 supply-chain risk                                                                                            |
| **Mock services в code path**                                     |   🟡 LOW   | DemoGate + `featureFlags.mockServices.enabled`                 | 🟢 gated                                                                                                        |
| **No hardcoded secrets в коде**                                   |     🟢     | только в `prompt-security-service.test.ts` (testing detection) | 🟢 отлично                                                                                                      |
| **`@ts-ignore` только 1**                                         |     🟢     | type safety сильная                                            | 🟢                                                                                                              |
| **`throw new Error` 992**                                         |     🟢     | хорошая error-культура                                         | 🟢                                                                                                              |
| **Security audit CI job**                                         |     🟢     | `.github/workflows/ci.yml`                                     | 🟢 есть                                                                                                         |
| **`eslint-disable` 256**                                          |     🟡     | требует ревью                                                  | 🟡 unknown content                                                                                              |
| **Unbounded providers by default**                                |   🟡 MED   | diagnostics.md                                                 | KNOWN                                                                                                           |
| **Husky + commitlint**                                            |     🟢     | conventional commits enforced                                  | 🟢                                                                                                              |
| **dependabot**                                                    | не найден  | —                                                              | 🔴 нет auto-dependency-update                                                                                   |

**Security CI:** `npm audit` presumably в Security Audit job. `check:deps` (dependency-cruiser) контролирует архитектурные зависимости.

**Главные security-риски:**

1. **API keys plaintext** — design choice для single-user, но **если кто-то получит доступ к IndexedDB — все ключи видны**. README явно предупреждает: «не использовать на общих машинах».
2. **`@google/generative-ai` pre-1.0** — supply-chain risk.
3. **`sandbox-interpreter.ts` 1 906 строк** — security-critical код, требующий audit.

**Хорошие security-практики:**

- DOMPurify для HTML sanitization
- Web Worker + CSP для sandbox
- `validateSandboxCode()` ban list
- `key-vault` service (есть тест `key-vault.test.ts` в stable gate)
- `local-secret-store` + `external-secrets-service` (есть тесты)
- `prompt-security-service` (есть тесты — detect leaked keys в prompts)
- Husky pre-commit hooks
- `persist-credentials: false` в CI checkout (L-9)

---

## 6. Топ-10 complexity hotspots — приоритеты рефакторинга

| #   | Файл                                                          |   LOC | Почему важно                                      |
| --- | ------------------------------------------------------------- | ----: | ------------------------------------------------- |
| 1   | `kernel/services/dexie-schema.ts`                             | 3 764 | Schema монолит — разбить на per-table definitions |
| 2   | `kernel/workers/sandbox-interpreter.ts`                       | 1 906 | Security-critical, требует audit + decomposition  |
| 3   | `kernel/services/key-management/key-service.ts`               | 1 098 | Security-critical, manage keys                    |
| 4   | `kernel/services/agent-service.ts`                            | 1 234 | Core service, central                             |
| 5   | `kernel/services/debate-runtime/debate-llm-prompt-context.ts` | 1 392 | Prompt construction logic                         |
| 6   | `kernel/services/research-adapters/source-adapters.ts`        | 1 291 | Adapters bundle                                   |
| 7   | `FleetPanel/FleetPanel.tsx`                                   | 1 235 | Largest UI panel                                  |
| 8   | `PolicyPanel/PolicyPanel.tsx`                                 | 1 184 | UI complexity                                     |
| 9   | `kernel/services/memory-engine.ts`                            | 1 088 | Core memory logic                                 |
| 10  | `kernel/services/key-management/key-registry.ts`              |   942 | Key registry                                      |

**Все 10 — в `kernel/services/` кроме 2 UI-панелей.** Это значит, что **ядро — главный кандидат на рефакторинг**.

---

## 7. Техдолг-реестр (по приоритетам)

### P0 — критический долг (требует внимания)

| #   | Долг                                                   | Действие                                                                                      |
| --- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 1   | API keys plaintext в IndexedDB                         | Документировать warning (уже есть) + рассматривать WebCrypto encryption для multi-user future |
| 2   | `dexie-schema.ts` 3 764 строки монолит                 | Разбить на per-table schema files                                                             |
| 3   | `sandbox-interpreter.ts` 1 906 строк security-critical | Внешний security audit + decomposition                                                        |
| 4   | 5 600-warning lint baseline                            | Снизить до < 1000 за квартал                                                                  |
| 5   | Coverage threshold не задан в CI                       | Добавить minimum coverage gate (80% kernel, 60% components)                                   |

### P1 — важный долг

| #   | Долг                                                   | Действие                                          |
| --- | ------------------------------------------------------ | ------------------------------------------------- |
| 6   | 62 идентичные TechniquePanels                          | Рефакторинг в generic `<TechniquePanel id="…" />` |
| 7   | `dev-status-*.md` пустые (5 файлов)                    | Заполнить или удалить из wiki-меню                |
| 8   | Tests stale (ChatPanel, ProviderManager)               | Починить harness'ы                                |
| 9   | HealthSlaService `@deprecated MOCK`                    | Либо реализовать, либо удалить                    |
| 10  | Stub-панели: Governance, OpenRouter, SocialLeaderboard | Расширить или удалить                             |
| 11  | `@google/generative-ai` pre-1.0                        | Pin версия + мониторить breaking changes          |
| 12  | 828 type escapes                                       | Ревью, заменить на proper types где возможно      |

### P2 — минорный долг

| #   | Долг                                           | Действие                           |
| --- | ---------------------------------------------- | ---------------------------------- |
| 13  | 256 eslint-disable                             | Ревью содержимого                  |
| 14  | 101 deferred issue из zone audits              | Постепенно закрывать               |
| 15  | i18n пробелы (английские строки в RU-панелях)  | Локализация                        |
| 16  | Multiple budget/health/provider panels overlap | Объединить (см. Feature Value Map) |
| 17  | `docs/audits/` пустая                          | Завести audit reports              |
| 18  | Dependabot не настроен                         | Добавить auto-PR для deps          |

---

## 8. Сводная оценочная таблица по 8 критериям

| #           | Критерий                     |   Оценка   | Главное доказательство                                                                                   |
| ----------- | ---------------------------- | :--------: | -------------------------------------------------------------------------------------------------------- |
| 1           | Количество известных проблем |  **6/10**  | 199 fixed + 101 deferred + 5 global + ~17 uninvestigated ≈ 322 problem-points                            |
| 2           | Критичность проблем          |  **7/10**  | P0 в production не найдено; все критические уже fixed в CHANGELOG                                        |
| 3           | Технический долг             |  **6/10**  | 101 deferred, 1 MOCK, 3 stubs, 62 duplicated panels, 18 files >1000 LOC                                  |
| 4           | Сложность кода               |  **6/10**  | 169 files >500 LOC, 18 >1000 LOC; `dexie-schema` 3764, `sandbox` 1906                                    |
| 5           | Количество зависимостей      |  **8/10**  | 58 deps (25 prod + 33 dev), все major stable; risk: `@google/generative-ai` pre-1.0                      |
| 6           | Наличие дублирования         |  **5/10**  | 62 идентичные TechniquePanels (diff=4 строки); 5 budget / 4 health / 4 provider UI overlap               |
| 7           | Состояние тестов             |  **6/10**  | 514 tests (486 unit + 17 e2e), 104/180 panel dirs tested, но coverage threshold не задан, tests stale    |
| 8           | Уязвимости и риски           |  **6/10**  | API keys plaintext (design), DOMPurify 56, sandbox CSP, security CI job; risk: sandbox code, pre-1.0 dep |
| **Overall** |                              | **6.9/10** | Зрело, с измеримым контролируемым долгом                                                                 |

---

## 9. Рекомендации

### Быстрые победы (high-ROI, low-effort)

1. **Заполнить `dev-status-*.md`** (5 файлов сейчас пустые «текст в разработке»). Либо заполнить, либо удалить из wiki-навигации. Сейчас это создаёт впечатление незавершённости.
2. **Завести `docs/audits/`** с хотя бы 1 аудитом (security или complexity). Папка пустая.
3. **Снизить lint warning baseline** с 5600 до 4000 за спринт ( delegated cleanup). `-max-warnings 5600` — это зелёный light для копления.
4. **Добавить coverage threshold** в CI: `npm run test:coverage` уже запускается, добавить `--check-coverage --lines 70 --branches 60`.
5. **Удалить `OpenRouterPanel.tsx`** (29 строк, дубликат) и `SocialLeaderboardPanel.tsx` (34 строки, обёртка). Это чистая чистка.
6. **Pin `@google/generative-ai`** к конкретной версии + добавить тест на API compatibility.
7. **Добавить Dependabot config** (`.github/dependabot.yml`) для auto-PR на dep updates.

### Среднесрочные (квартал)

8. **Рефакторинг TechniquePanels** — вынести в generic `<TechniquePanel techniqueId="humor" />`. Сэкономит ~14 500 LOC и сделает добавление новых тривиальным.
9. **Декомпозиция `dexie-schema.ts`** (3 764 строки) — разбить на per-table schema files (`dexie-schema/keys.ts`, `dexie-schema/chat.ts`, и т.д.).
10. **Security audit `sandbox-interpreter.ts`** (1 906 строк) — внешний review, добавить fuzzing tests.
11. **Закрыть 101 deferred issue** из zone audits — schedule по 10 за спринт = 10 спринтов.
12. **Починить stale tests** (ChatPanel, ProviderManager harnesses).
13. **Объединить 5 budget / 4 health / 4 provider panels** (см. Feature Value Map рекомендации).

### Стратегические

14. **Внедрить formal issue tracker** — сейчас проблемы разбросаны по 26 zone audits + `diagnostics.md` + `dev-status-*.md` (пустые) + CHANGELOG. Единого реестра нет. GitHub Issues с labels `P0/P1/P2`, `bug/debt/feature` — и ссылками на zone audits.
15. **Coverage dashboard** — опубликовать coverage report (Codecov / Coveralls) для прозрачности.
16. **Complexity budget** — установить лимит: ни один файл не должен превышать 1000 строк без ADR (Architecture Decision Record).
17. **Migration plan для API keys** — даже для single-user, рассмотреть WebCrypto encryption для at-rest keys. Это закроет главный security risk.
18. **Внешний security audit** — для проекта такого размера и с security-critical кодом (sandbox, keys, prompt-security), разовый внешний audit будет полезен.

---

## 10. Итоговый вердикт по здоровью кода

| Метрика                                |                             Оценка                             |
| -------------------------------------- | :------------------------------------------------------------: |
| Санитарное состояние (TODO/FIXME/HACK) |                           🟢🟢 9/10                            |
| Архитектура (DI, EventBus, contracts)  |                            🟢 8/10                             |
| CI/CD зрелость                         |         🟢 8/10 (5 jobs + security + circular + deps)          |
| Тестирование                           |             🟡 6/10 (умеренно, без coverage gate)              |
| Сложность                              |                     🟡 6/10 (18 hotspots)                      |
| Дублирование                           |           🟡 5/10 (62 идентичные + overlapping UIs)            |
| Security                               | 🟡 6/10 (plaintext keys + pre-1.0 dep, но хорошие mitigations) |
| Документирование проблем               |  🟢 8/10 (26 zone audits + diagnostics, но dev-status пустые)  |
| Техдолг                                |          🟡 6/10 (controlled, измеримый, но copится)           |

**Overall Health Score: 6.9 / 10** — зрелая кодовая база с измеримым контролируемым долгом.

**Сравнение с行业标准:**

| Метрика               |        SuperAgents OS         | Типичный зрелый проект | Verdict                |
| --------------------- | :---------------------------: | :--------------------: | ---------------------- |
| TODO per KLOC         |             0.004             |        0.1–1.0         | 🟢🟢 в 25–250 раз чище |
| `@ts-ignore` per KLOC |             0.002             |        0.05–0.5        | 🟢🟢 в 25–250 раз чище |
| Files > 1000 LOC      |           18 (0.6%)           |          1–3%          | 🟢 лучше среднего      |
| Test-to-code ratio    | 514 tests / 3114 files = 0.17 |        0.2–0.5         | 🟡 ниже среднего       |
| CI jobs               |   5 + security + e2e matrix   |          3–5           | 🟢 выше среднего       |
| Dependencies          |              58               |         50–150         | 🟢 разумно             |

**Главные сильные стороны:**

- **Беспрецедентно чистый код** по маркерам TODO/FIXME/HACK/`@ts-ignore`
- **Зрелый CI** с typecheck + lint + build + tests + coverage + security + e2e + circular-dep + dep-cruiser
- **199 задокументированных исправлений** — культура аудита
- **26 zone audits** — пошаговая история работ
- **Сильная error-культура** (992 explicit throws)
- **Security mitigations** (DOMPurify, sandbox CSP, key-vault, prompt-security-service)

**Главные риски:**

- **5 600-warning lint baseline** — копится тихо
- **Coverage threshold не задан** — может падать
- **62 идентичные TechniquePanels** — maintainability
- **API keys plaintext** — design risk
- **18 complexity hotspots** — требуют рефакторинга
- **`dev-status-*.md` пустые** — нет formal issue tracking
- **`@google/generative-ai` pre-1.0** — supply-chain

**Итог:** проект **готов к production** для single-user scenarios (как заявлено в README), но требует **ценностной фокусировки** (см. Feature Value Map) и **долговременной стратегии по сокращению complexity hotspots и lint baseline**.

---

## Приложение A. Метрики в цифрах (для сравнения)

| Метрика                   |                               Значение | Источник                                          |
| ------------------------- | -------------------------------------: | ------------------------------------------------- |
| Total TS/TSX files        |                                  3 114 | `find src -name "*.ts" -o -name "*.tsx" \| wc -l` |
| Total LOC                 |                                508 976 | sum of `wc -l` per file                           |
| Avg LOC/file              |                                    163 | total/files                                       |
| Files > 500 LOC           |                                    169 | complexity indicator                              |
| Files > 1000 LOC          |                                     18 | hotspot indicator                                 |
| TODO                      |                                      2 | `grep -rE "TODO" src/`                            |
| FIXME                     |                                      0 | `grep -rE "FIXME" src/`                           |
| HACK                      |                                      0 | `grep -rE "HACK" src/`                            |
| `as any` / `as unknown`   |                                    828 | `grep -rE "as (any\|unknown)"`                    |
| `eslint-disable`          |                                    256 | `grep -rE "eslint-disable"`                       |
| `@ts-ignore`              |                                      1 | `grep -rE "@ts-ignore"`                           |
| `throw new Error`         |                                    992 | `grep -rE "throw new (Error\|TypeError)"`         |
| `console.error`           |                                     72 | `grep -rE "console.error"`                        |
| `console.warn`            |                                     16 | `grep -rE "console.warn"`                         |
| Production deps           |                                     25 | `package.json`                                    |
| Dev deps                  |                                     33 | `package.json`                                    |
| npm scripts               |                                     48 | `package.json`                                    |
| Unit tests                |                                    486 | `dev-tests-catalog.md`                            |
| E2E specs                 |                                     17 | `ls e2e/*.spec.ts`                                |
| Total tests               |                                    514 | sum                                               |
| Test files in components  |                                    164 | `find src/components -name "*.test.tsx"`          |
| Zone audits               |                                     26 | `ls docs/wiki/zone-*.md`                          |
| Fixed issues (documented) |                                    199 | sum across zones                                  |
| Deferred issues           |                                    101 | sum across zones                                  |
| Global known issues       |                                      5 | `diagnostics.md`                                  |
| Lint warning CI baseline  |                                   5600 | `.github/workflows/ci.yml`                        |
| CI jobs                   |                         5 + e2e matrix | `.github/workflows/ci.yml`                        |
| innerHTML usages          |                          7 (5 в tests) | `grep -rE "innerHTML"`                            |
| DOMPurify usages          |                                     56 | `grep -rE "DOMPurify\|dompurify\|sanitize"`       |
| localStorage usages       |                                     80 | `grep -rE "localStorage"`                         |
| External fetch calls      |                                      4 | `grep -rE "fetch\(['\"]https?://"`                |
| Hardcoded API keys        | 0 (только в tests для prompt-security) | `grep -rE "sk-[a-zA-Z0-9]{20,}"`                  |

---

## Приложение B. Источники и метод проверки

| Что           | Где                                                                   | Как проверено                                 |
| ------------- | --------------------------------------------------------------------- | --------------------------------------------- |
| Объём кода    | `src/**`                                                              | `find` + `wc -l` per file                     |
| Зависимости   | `package.json`                                                        | `node -e` parse                               |
| Качество кода | `src/**`                                                              | `grep -rE` по паттернам                       |
| CI            | `.github/workflows/ci.yml`                                            | полный чтение                                 |
| CHANGELOG     | `CHANGELOG.md`                                                        | `head -100`, `grep`                           |
| Zone audits   | `docs/wiki/zone-*.md` (26 файлов)                                     | awk-фильтр «Что проверено» / «Отложено» + sum |
| Diagnostics   | `docs/wiki/diagnostics.md`                                            | полный чтение                                 |
| Dev status    | `docs/wiki/dev-status-*.md`                                           | WebFetch (5 файлов — пустые)                  |
| Tests         | `**/*.test.tsx`, `dev-tests-catalog.md`                               | `find`, чтение catalog                        |
| Hotspots      | top-15 largest files                                                  | `find + wc -l + sort`                         |
| Duplication   | TechniquePanels                                                       | `diff` после sed-нормализации                 |
| Security      | `grep` по 8 паттернам (eval, innerHTML, fetch, localStorage, secrets) | comprehensive scan                            |

---

## Сверка с аудитами (волны 2–8)

Дополнительные факты по техническому состоянию из волн аудитов:

- W2-008/035: ключевые сервисы (key-management и др.) без юнит-тестов.
- W4-002: CI гоняет только `test:stable` (44 пути из 596 тест-файлов) — покрытие не является гейтом.
- W3-010/011: a11y-правила не в lint; 5 UI-нарушений.
- W6-027: `engines.node` >=22 без `.nvmrc`; lint-staged требует >=22.22.1.
- W6-025: unpinned `npx @sentry/cli`/`datadog-ci` в deploy (supply-chain).
- W6-026: `ws`/`playwright` в devDependencies, но используются production-серверами.
- W7-HTTP: 301 вместо 308 для POST; SSE без Last-Event-ID.
- W3-013: build target es2023 (progressive enhancement).
- W8-001: `company-store.mjs` — синхронный JSON-файл-как-DB (не durable).

---

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e`. Все метрики — статический анализ; runtime-поведение и реальный CI run не проверялись. Парные отчёты: «Карта готовности панелей» (качество) и «Карта функциональной ценности» (зачем нужно) — dort._
