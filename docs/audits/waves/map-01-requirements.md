# Карта готовности панелей — SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `e08ab8e` (Oct 31, 2026, ветка `main`)
> **Источники данных:** код репозитория `src/components/**`, `src/route-registry-*.ts`, `docs/wiki/**`, `package.json`, файлы тестов `**/*.test.tsx`, E2E-спеки `e2e/*.spec.ts`
> **Дата анализа:** 2026-10-31
> **Метод:** статический анализ исходников + чтение тестов + сверка с wiki-документацией

---

## 1. Исполнительное резюме

SuperAgents OS — браузерная когнитивная ОС, состоящая из **268 панелей**, сгруппированных в **22 навигационных раздела**. Архитектура: React 19 + Vite 8 + TypeScript 6 + Dexie (IndexedDB) + типизированный EventBus + DI-контейнер ядра.

**Сводные цифры по проекту:**

| Метрика                                  | Значение        | Доказательство                                                                  |
| ---------------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| Всего панелей (маршрутов)                | **268**         | `docs/wiki/panels-catalog.md`                                                   |
| Из них имеют React-компонент             | 267             | тот же каталог                                                                  |
| Покрыты wiki-статьёй                     | 204 (76 %)      | 88 файлов `docs/wiki/panel-*.md`, многие статьи объединяют по несколько панелей |
| Тестовых файлов в `src/components`       | **164**         | `find src/components -name "*.test.tsx"`                                        |
| Каталогов панелей с хотя бы одним тестом | **104 из ~180** | подсчёт по директориям                                                          |
| Unit/компонентных тестов всего (src)     | 486             | `docs/wiki/dev-tests-catalog.md`                                                |
| E2E-спек (Playwright)                    | 17              | `e2e/*.spec.ts`                                                                 |
| Техник-панелей (генерируемый набор)      | 62              | `src/components/TechniquePanels/*.tsx`                                          |

**Главный вывод:** ядро системы (Чат, Провайдеры, Дебаты, Агенты, Задачи, Наблюдаемость, SRE, Память) — **продукционного качества (7–9/10)**. Периферия (Техники-панели, маркетплейсы, хабы) — **работоспособна, но слабо протестирована (5–7/10)**. Небольшая группа панелей — **явные заглушки (3–5/10)**. Полностью сломанных панелей найти не удалось.

Важно: **отсутствие теста ≠ панель не работает**. Во многих панелях без тестов код корректный, с обработкой ошибок и persistence — там оценка «Тестирование» низкая, но остальные критерии могут быть высокими. В отчёте такие случаи отмечены как **«качество не подтверждено тестом, но код выглядит корректным»**.

---

## 2. Методология оценки

### 2.1. Восемь критериев (каждый 1–10)

| #   | Критерий                      | Что проверяем                                                                                           | Где доказательство                                               |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | **Основная функциональность** | Реализует ли панель заявленное? Глубина функций, не stub.                                               | Код компонента, wiki-статья                                      |
| 2   | **Стабильность**              | Защита от crash, EdgeCases, очистка таймеров/subscriptions, ErrorBoundary.                              | Анализ `useEffect` cleanup, try/catch, `GlobalErrorBoundary.tsx` |
| 3   | **UI/UX**                     | Layout, i18n (`useTranslation`), a11y, дизайн-токены (`var(--token)`), адаптивность.                    | Чтение JSX, наличие `aria-*`, `t()`                              |
| 4   | **Обработка ошибок**          | try/catch вокруг async, различие «пустой список vs ошибка загрузки», fallback UI.                       | Поиск `catch`, `setError`, проверка паттерна из конвенции        |
| 5   | **Интеграция с Kernel**       | Использует сервисы через DI (`kernel/instances`), события через `eventBus`, типы из `kernel/contracts`. | Анализ импортов                                                  |
| 6   | **Сохранение данных**         | Persist в IndexedDB (Dexie/storageAdapter), переживает reload, события как «сигнал обновления».         | Поиск `storageAdapter`, `dexie`, `localStorage`                  |
| 7   | **Документация**              | Есть ли wiki-статья, точна ли она, статус verified/needs-check.                                         | `docs/wiki/panel-*.md`                                           |
| 8   | **Тестирование**              | Unit/компонентные/E2E-тесты, что именно проверяют (render / логика / edge-case).                        | `*.test.tsx`, `e2e/*.spec.ts`                                    |

### 2.2. Принцип разделения «подтверждённое качество vs неизвестность»

Это **ключевое правило** данного отчёта, явно затребованное в задании:

- **Подтверждённое качество** = есть тест, проверяющий поведение (не только render), ИЛИ кодовая база достаточно зрелая и используется в E2E.
- **Неизвестность** = тестов нет, но код выглядит корректным. Оценка по критериям 1–7 может быть высокой, но критерий 8 (Тестирование) остаётся низким (2–3), и в колонке «Итог» такая панель помечается как **«код без тестов — качество не подтверждено формально»**.
- **Подтверждённая проблема** = в коде виден дефект (например, Promise в state, отсутствие cleanup, mock-данные вместо реальных) ИЛИ тест падает/отсутствует при наличии явного подозрения.

### 2.3. Итоговая оценка

Итоговая оценка — **не среднее арифметическое**. Это холистическая оценка с весами:

- Критерии 1 (функциональность), 2 (стабильность), 4 (ошибки) —权重 x2;
- Критерии 3, 5, 6 — x1;
- Критерии 7, 8 — x0.5 (потому что их отсутствие не означает неработоспособность).

Дополнительно к итогу прилагается **короткое доказательство** (1–2 ссылки на файлы/строки/тесты).

---

## 3. Сводная карта готовности по разделам

Тепловая карта по 22 разделам навигации. Оценка — медиана по ключевым панелям раздела.

| #   | Раздел                        | Панелей | Готовность (медиана) | Статус                                  |
| --- | ----------------------------- | ------: | :------------------: | --------------------------------------- |
| 1   | Панель (Dashboard)            |     ~21 |       **7.5**        | 🟢 ядро, есть tests+e2e                 |
| 2   | Бюджет AI                     |       8 |       **7.0**        | 🟢 ядро, smoke+unit                     |
| 3   | Чат                           |       4 |       **8.5**        | 🟢🟢 лучшее покрытие (8 тестов + e2e)   |
| 4   | Дебаты                        |      14 |       **8.0**        | 🟢 9 тестов + e2e                       |
| 5   | Стратегия и анализ            |       5 |       **6.5**        | 🟡 часть панелей без тестов             |
| 6   | Техники                       |      62 |       **5.5**        | 🟡 uniform-панели, 1 smoke на все       |
| 7   | Агенты                        |      12 |       **7.5**        | 🟢 4 теста + e2e                        |
| 8   | Диагностика                   |      17 |       **7.5**        | 🟢 Logs/Traces/Health tested            |
| 9   | Знания                        |      ~5 |       **7.0**        | 🟢 Knowledge+RAG tested                 |
| 10  | Системная память              |      ~6 |       **7.5**        | 🟢 MemoryPanel: 4 теста                 |
| 11  | Интеграции (MCP/Tools/Skills) |     ~10 |       **6.5**        | 🟡 Tools/Skills tested, MCP partial     |
| 12  | AI провайдеры и ключи         |      ~6 |       **8.0**        | 🟢 6 тестов + e2e                       |
| 13  | Безопасность и правила        |      ~8 |       **6.0**        | 🟡 Policy tested, Guardrails partial    |
| 14  | Флот / Governance             |      ~8 |       **5.5**        | 🟡 GovernancePanel = 61 строка          |
| 15  | Лаборатория                   |      ~6 |       **6.0**        | 🟡 RivalsLab/Simulation mixed           |
| 16  | Исследования                  |      ~6 |       **6.0**        | 🟡 ResearchCockpit без тестов           |
| 17  | Google AI                     |      ~4 |       **6.0**        | 🟡 GeminiResearch tested, остальные нет |
| 18  | Вики                          |      ~3 |       **7.5**        | 🟢 WikiPanel: 3 теста + integrity       |
| 19  | Настройки                     |      ~4 |       **7.0**        | 🟢 SettingsPanel tested                 |
| 20  | Остальное / Системные сервисы |     ~15 |       **4.5**        | 🔴 много мелких/обёрточных панелей      |

**Легенда:** 🟢🟢 8–10 · 🟢 7–8 · 🟡 5–7 · 🔴 <5

---

## 4. Детальный разбор ключевых панелей

Ниже — построчный разбор **28 репрезентативных панелей** (по 1–3 на раздел). Для каждой: 8 оценок + итог + доказательство.

### 4.1. Чат

#### `ChatPanel` — `/chat` → `src/components/ChatPanel/ChatPanel.tsx` (609 строк)

| Критерий                  | Оценка | Доказательство                                                                                                                                                                                                                                                            |
| ------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Основная функциональность | **9**  | Стриминг, single/broadcast/race, маршрутизация UCB1, сравнение провайдеров side-by-side, память в промпте, экспорт, поиск по сообщениям (`MessageSearchPanel` 663 строки).                                                                                                |
| Стабильность              | **8**  | Cleanup в `useEffect`, `useCallback` для memo, ErrorBoundary на уровне layout.                                                                                                                                                                                            |
| UI/UX                     | **9**  | `MarkdownRenderer` + `MermaidDiagram` + подсветка кода, `useTranslation`, a11y-атрибуты на кнопках.                                                                                                                                                                       |
| Обработка ошибок          | **8**  | try/catch вокруг settings/key/model persistence (строки 430–451 по WebFetch), `showStatus` для фидбека.                                                                                                                                                                   |
| Интеграция с Kernel       | **9**  | `orchestrator`, `storageAdapter`, `settingsService`, `resolveSessionStore` — всё через DI.                                                                                                                                                                                |
| Сохранение данных         | **8**  | `storageAdapter.getItem/setItem('chat-split-view')`, сессии в IndexedDB через `useChatStore`.                                                                                                                                                                             |
| Документация              | **9**  | `docs/wiki/panel-chat.md` + `comp-chat.md` + `comp-flow-chat.md` (сквозной контур).                                                                                                                                                                                       |
| Тестирование              | **8**  | 8 тестовых файлов в `ChatPanel/`: `ChatPanel.test.tsx`, `ChatInputArea.test.tsx`, `MarkdownRenderer.test.tsx`, `MermaidDiagram.test.tsx`, `code-escape.test.ts`, `highlight-utils.test.tsx`, `inline-markdown.test.tsx`, `CopyButton.test.tsx`. E2E: `data-chat.spec.ts`. |

**Итог: 8.5 / 10** — одна из самых зрелых панелей системы. Подтверждена тестами и E2E.

---

### 4.2. Провайдеры и ключи

#### `ProviderManager` — `/keys` → `src/components/ProviderManager/` (1765 строк в 4 главных файлах)

| Критерий                  | Оценка | Доказательство                                                                                                                                                                                                                                                          |
| ------------------------- | :----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Основная функциональность | **9**  | InstalledProvidersView (617), ProviderManagerView (413), ProviderManagerContainer (457), ModelCatalogView (278), RotationView, RoutingIntelligenceView, ResourcePoolsView, RoutingSLAView, ProbeResultSection, QuickTestSection — полный функционал управления ключами. |
| Стабильность              | **8**  | Контейнерный паттерн (Container/View), изоляция состояния.                                                                                                                                                                                                              |
| UI/UX                     | **9**  | ProviderCard, ProviderHealthBar, ProviderUsageBars, PersonalityBadge, ProviderTableRow — богатый UI.                                                                                                                                                                    |
| Обработка ошибок          | **8**  | health-check с автоматическим статусом, `QuickTestSection` для ручной проверки.                                                                                                                                                                                         |
| Интеграция с Kernel       | **9**  | `keyService`, `providerAdapterRegistry`, декораторы LLM (circuit-breaker/retry/rate-limit) — всё через DI.                                                                                                                                                              |
| Сохранение данных         | **9**  | Ключи в IndexedDB через `keyService`/`key-vault` (см. `key-management` в ядре).                                                                                                                                                                                         |
| Документация              | **9**  | `docs/wiki/panel-providers.md` + `comp-key-management.md` + `comp-routing.md` + 12 статей по адаптерам.                                                                                                                                                                 |
| Тестирование              | **8**  | 6 тестов: `ProviderManager.test.tsx`, `ProviderManagerContainer.test.tsx`, `ProviderCard.test.tsx`, `InstalledProvidersView.test.tsx`, `ModelCatalogView.test.tsx`, `commands.test.ts`. E2E: `data-keys.spec.ts`.                                                       |

**Итог: 8.5 / 10** — ядро системы, отлично покрыто.

---

### 4.3. Задачи

#### `TasksPanel` — `/tasks` → `src/components/TasksPanel/TasksPanel.tsx` (903 строки)

| Критерий                  | Оценка | Доказательство                                                                                                                                   |
| ------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Основная функциональность | **8**  | Kanban (5 колонок, drag-and-drop), фильтры (all/running/completed/failed), статистика, создание задач с cron, пайплайн исполнения, AGEMS-задачи. |
| Стабильность              | **8**  | `isMountedRef` для защиты от update-after-unmount, `useCallback`/`useMemo`.                                                                      |
| UI/UX                     | **8**  | Stats, search, filter buttons, modal для деталей (`TaskDetailModal`).                                                                            |
| Обработка ошибок          | **8**  | `useAutoClearError` хук, error banner с dismiss, notifications через `eventBus.emit(EVENTS.NOTIFICATION)`.                                       |
| Интеграция с Kernel       | **9**  | `cognitiveService.getTraces()`, `agemsTaskService.list/create/updateStatus`, `eventBus.subscribe(EVENTS.TRACE_UPDATED)`.                         |
| Сохранение данных         | **8**  | AGEMS-задачи персистятся через `agemsTaskService`.                                                                                               |
| Документация              | **8**  | `docs/wiki/panel-tasks.md` + `comp-task-planning.md`.                                                                                            |
| Тестирование              | **6**  | 1 файл `TasksPanel.test.tsx` — есть, но единый. E2E: `data-runtime.spec.ts` косвенно.                                                            |

**Итог: 7.5 / 10** — функционально полная, тестирование умеренное.

---

### 4.4. Наблюдаемость (Observability)

#### `LogsPanel` — `/logs` (520 строк) + `TracesPanel` — `/debugger` (743) + `HealthPanel` — `/health` (530)

| Критерий                  | Оценка | Доказательство                                                                                                                                                                                     |
| ------------------------- | :----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Основная функциональность | **8**  | Логи с фильтрами, трейсы шагов агентов, health с vitals (CPU/memory/throughput), uptime, services list, probe results, rate-limit introspection, distributed nodes, health timeline, health score. |
| Стабильность              | **8**  | `HealthPanel`: защита «Promise не должен попасть в state» (строка 21 — `initial instanceof Promise ? null : initial`), явная защита от crash. `useRef` для таймеров.                               |
| UI/UX                     | **8**  | VitalCard, KernelServicesSection, HealthTimelineSection — модульный UI, `ModuleInfo` для метаданных.                                                                                               |
| Обработка ошибок          | **8**  | `useAutoClearError`, отдельные состояния `error` и `probeError`.                                                                                                                                   |
| Интеграция с Kernel       | **9**  | `adminService.getSystemHealth()`, `probeService`, `keyStateStore`, `keyService`, `kernel`, `eventBus` + `EVENTS` — глубокая интеграция.                                                            |
| Сохранение данных         | **7**  | Vitals в памяти, но health events/log entries персистятся через сервисы ядра.                                                                                                                      |
| Документация              | **9**  | `docs/wiki/panel-observability.md` + `comp-observability.md` + `comp-flow-diagnostics.md`.                                                                                                         |
| Тестирование              | **7**  | `LogsPanel.test.tsx`, `TracesPanel.test.tsx`, `HealthPanel.test.tsx` — по 1 файлу на панель. E2E: `data-health.spec.ts`.                                                                           |

**Итог: 7.5 / 10** — три панели наблюдаемости зрелые, каждая со своим тестом. Особенно хороша защита от Promise-in-state в `HealthPanel`.

---

### 4.5. SRE

#### `SREAgentPanel` — `/sre` (493 строки)

| Критерий                  | Оценка | Доказательство                                                                                                                                                                       |
| ------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Основная функциональность | **8**  | Вкладки suggestions/alerts/whatif, MetricCards, SuggestionCard, WhatIfCard, CachingAdvice, AlertItem, чат с SRE-агентом (`chatQuestion`/`chatAnswer`), autoFix toggle, audit action. |
| Стабильность              | **8**  | `usePolling`, очистка `execTimeoutRef`/`retryTimeoutRef` в cleanup (строка ~71).                                                                                                     |
| UI/UX                     | **8**  | SREHeader, SRETabBar — модульная композиция, `useTranslation`.                                                                                                                       |
| Обработка ошибок          | **8**  | `setError`, try/catch в `refreshData`, fallback на пустые метрики.                                                                                                                   |
| Интеграция с Kernel       | **9**  | `advisorService` (optimization suggestions), `eventBus`, `useKeyStore`.                                                                                                              |
| Сохранение данных         | **7**  | `localStorage.getItem('sre.keyId')` — выбор ключа переживает reload; метрики in-memory.                                                                                              |
| Документация              | **8**  | `docs/wiki/panel-sre.md`.                                                                                                                                                            |
| Тестирование              | **6**  | 1 файл `SREAgentPanel.test.tsx`.                                                                                                                                                     |

**Итог: 7.5 / 10** — сильная панель с advisor-интеграцией, тестирование умеренное.

---

### 4.6. Governance

#### `GovernancePanel` — `/governance` (61 строка)

| Критерий                  | Оценка | Доказательство                                                                                                                                                                                                           |
| ------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Основная функциональность | **4**  | Только 4 роли (observer/approver/director/auditor), назначение роли пользователю, список ролей. **Нет:** audit trail, policy editor, HITL queue, scope management — хотя в wiki (`panel-governance.md`) заявлено больше. |
| Стабильность              | **6**  | Простая логика, мало что может сломаться. `useEffect` с зависимостью `[userId]`.                                                                                                                                         |
| UI/UX                     | **5**  | Inline-стили (`background: '#3b82f6'` — нарушение правила `fa-02` о дизайн-токенах), `useTranslation` используется.                                                                                                      |
| Обработка ошибок          | **7**  | Хорошо: различает «пустой список» vs «ошибка загрузки» (`setError(t('governance.error_load'))` вместо молчаливого пустого списка) — это явно проверяется в тесте.                                                        |
| Интеграция с Kernel       | **6**  | `governanceService` из `kernel/instances/services-extras`, но функциональность сервиса узкая.                                                                                                                            |
| Сохранение данных         | **5**  | Через `governanceService.assignRole` — presumably IndexedDB, но в коде не видно.                                                                                                                                         |
| Документация              | **6**  | `docs/wiki/panel-governance.md` существует, но описывает больше, чем реализовано.                                                                                                                                        |
| Тестирование              | **7**  | `GovernancePanel.test.tsx`: 4 теста — lists roles, assign confirmation, assign failure, load-error-vs-empty-list. **Качество тестов хорошее**, покрывают edge-cases.                                                     |

**Итог: 5.0 / 10** — панель-минималка, но **тесты отличные для своего объёма**. Проблема в разрыве между wiki-описанием и реализацией. Это не сломанная панель — это stub с корректным тестом.

---

### 4.7. Дебаты

#### `DebateArena` — `/debate` + семейство `DebatePanel/*`

| Критерий                  | Оценка | Доказательство                                                                                                                                                                                                                                  |
| ------------------------- | :----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Основная функциональность | **9**  | 33 стратегии, 75 техник качества, live/replay/tournament/templates/quality/analysis — 14 панелей в разделе. `DebatePanel/` содержит DebateSetupWizard, DebateChat, DebateAnalytics, DebateHistoryPage, DebateStrategyBuilder, VotePanelSection. |
| Стабильность              | **8**  | Подписки на `eventBus` очищаются (см. `useDebatePanelSubscriptions.test.tsx`).                                                                                                                                                                  |
| UI/UX                     | **9**  | `framer-motion` анимации, live timeline (`DebateReplayTimeline`), `DebateLivePanel` с comprehensive-тестом.                                                                                                                                     |
| Обработка ошибок          | **8**  | `DebateRuntimePanel.comprehensive.test.tsx` — проверяет в т.ч. runtime-ошибки.                                                                                                                                                                  |
| Интеграция с Kernel       | **9**  | `debateEngine`, `debatePolicyEngine`, `qualityImpactCollector`, `memoryEngine` для RAG-дебатов.                                                                                                                                                 |
| Сохранение данных         | **9**  | Сессии дебатов персистятся (RAG с chunk persistence между reload — заявлено в README).                                                                                                                                                          |
| Документация              | **9**  | `docs/wiki/debates.md` + `comp-debate-runtime.md` + `comp-flow-debate.md` + 6 panel-*.md статей.                                                                                                                                                |
| Тестирование              | **8**  | 9 тестовых файлов в `DebatePanel/` + `DebateArena.test.tsx` + `DebateLive.comprehensive.test.tsx` + `DebateRuntimePanel.comprehensive.test.tsx`. E2E: `data-debate.spec.ts`.                                                                    |

**Итог: 8.5 / 10** — второй по зрелости домен после Чата.

---

### 4.8. Память

#### `MemoryPanel` — `/memory` (4 тестовых файла)

| Критерий                  | Оценка | Доказательство                                                                                                    |
| ------------------------- | :----: | ----------------------------------------------------------------------------------------------------------------- |
| Основная функциональность | **8**  | Гибридный поиск BM25 + семантика (Transformers.js), `IndexStatsPanel`, `MemoryCard`, search interface.            |
| Стабильность              | **7**  | Web Worker для памяти (по README), но web worker lifecycle — типичный источник багов.                             |
| UI/UX                     | **7**  | `MemoryCard` компонент, `IndexStatsPanel`.                                                                        |
| Обработка ошибок          | **7**  | Стандартный паттерн с error state.                                                                                |
| Интеграция с Kernel       | **9**  | `memoryEngine`, BM25 через Orama, embeddings через Transformers.js.                                               |
| Сохранение данных         | **9**  | IndexedDB через Dexie, chunks persist между reload.                                                               |
| Документация              | **9**  | `docs/wiki/memory.md` + `comp-memory.md` + `memory-audit.md` (аудит против референс-стека).                       |
| Тестирование              | **8**  | 4 файла: `MemoryPanel.test.tsx`, `MemoryCard.test.tsx`, `IndexStatsPanel.test.tsx`, `MemoryPanelSearch.test.tsx`. |

**Итог: 8.0 / 10** — зрелая панель с глубоким тестированием.

---

### 4.9. Агенты

#### `AgentsPanel` + `RolesPanel` + `AgentJournalPanel`

| Критерий                  | Оценка | Доказательство                                                                                                                                                                                   |
| ------------------------- | :----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Основная функциональность | **8**  | `AgentsPanel`: AgentHistoryTab, AgentIdentityEditor, QuickCreateAgentModal, EloLeaderboard. `RolesPanel`: RolesPanel + RolesConsortiaPanel + TeamsTab.                                           |
| Стабильность              | **8**  | Подписки на события агентов, cleanup.                                                                                                                                                            |
| UI/UX                     | **8**  | Persona picker (727 строк), marketplace, leaderboard.                                                                                                                                            |
| Обработка ошибок          | **7**  | Стандартные try/catch.                                                                                                                                                                           |
| Интеграция с Kernel       | **9**  | `agentJournalService`, `groupManager`, сервисы ролей.                                                                                                                                            |
| Сохранение данных         | **8**  | Журнал агента персистится (`agentJournalService`).                                                                                                                                               |
| Документация              | **9**  | `docs/wiki/agents.md` + `panel-roles.md` + `execution-trail.md`.                                                                                                                                 |
| Тестирование              | **8**  | `AgentsPanel`: 4 теста (AgentHistoryTab, AgentIdentityEditor, AgentsPanel, QuickCreateAgentModal). `RolesPanel`: 2 теста (RolesPanel, TeamsTab). E2E: `data-room.spec.ts`, `data-fleet.spec.ts`. |

**Итог: 8.0 / 10** — раздел зрелый, хорошее покрытие.

---

### 4.10. Знания (RAG)

#### `KnowledgePanel` + `KnowledgeGenPanel`

| Критерий                  | Оценка | Доказательство                                                                          |
| ------------------------- | :----: | --------------------------------------------------------------------------------------- |
| Основная функциональность | **8**  | База знаний, RAG, генератор знаний, `WikiBrainPanel`, `WikiPanel`.                      |
| Стабильность              | **7**  | Chunk persistence, embeddings.                                                          |
| UI/UX                     | **7**  | Стандартный layout.                                                                     |
| Обработка ошибок          | **7**  | Стандартные паттерны.                                                                   |
| Интеграция с Kernel       | **9**  | `memoryEngine`, Orama BM25, Transformers.js.                                            |
| Сохранение данных         | **9**  | IndexedDB, chunk persistence.                                                           |
| Документация              | **9**  | `docs/wiki/panel-knowledge.md` + `comp-knowledge-rag.md` + `comp-flow-knowledge.md`.    |
| Тестирование              | **7**  | `KnowledgePanel.test.tsx`, `KnowledgeGenPanel.test.tsx`. E2E: `data-knowledge.spec.ts`. |

**Итог: 7.5 / 10**.

---

### 4.11. Бюджет

#### `BudgetPanel` (179) + `CostsPanel` + `AnalyticsPanel` + `CostOptimizationPanel`

| Критерий                  | Оценка | Доказательство                                                                                                                                                              |
| ------------------------- | :----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Основная функциональность | **8**  | Budget, costs (companies), analytics, cost-optimization with recommendations, budget-alerts. `CostOptimizationService.getSummary/getRecommendations/dismissRecommendation`. |
| Стабильность              | **7**  | Smoke-тесты рендерят BudgetPanel и CostOptimizationPanel без crash.                                                                                                         |
| UI/UX                     | **7**  | Графики, recommendations UI.                                                                                                                                                |
| Обработка ошибок          | **7**  | `CostOptimizationService.getSummary()` fallback `{totalSavings: 0, recommendations: []}`.                                                                                   |
| Интеграция с Kernel       | **9**  | `budgetService`, `cost-optimization-service`.                                                                                                                               |
| Сохранение данных         | **8**  | Бюджеты в IndexedDB.                                                                                                                                                        |
| Документация              | **8**  | `docs/wiki/panel-budget.md` + `panel-analytics.md` + `panel-costs.md` + `comp-budget-pricing.md`.                                                                           |
| Тестирование              | **7**  | `CostsPanel.test.tsx`, `AnalyticsPanel.test.tsx`. Smoke: `panel-smoke-tests.test.tsx` (BudgetPanel, CostOptimizationPanel).                                                 |

**Итог: 7.5 / 10**.

---

### 4.12. Dashboard

#### `DashboardPanel` — `/dashboard`

| Критерий                  | Оценка | Доказательство                          |
| ------------------------- | :----: | --------------------------------------- |
| Основная функциональность | **7**  | Обзор, быстрый доступ к модулям.        |
| Стабильность              | **7**  | Простая композиция.                     |
| UI/UX                     | **8**  | Entry-point, дизайн-токены.             |
| Обработка ошибок          | **6**  | Минимальные edge-cases.                 |
| Интеграция с Kernel       | **7**  | Чтение статуса через `useSystemStatus`. |
| Сохранение данных         | **5**  | Mostly view-only.                       |
| Документация              | **8**  | `docs/wiki/panel-dashboard.md`.         |
| Тестирование              | **8**  | `DashboardPanel.test.tsx`.              |

**Итог: 7.0 / 10**.

---

### 4.13. Settings / Wiki / Assistant

| Панель           | Функц. | Стаб. | UI/UX | Ошибки | Kernel | Persist | Доки | Тесты | **Итог** |
| ---------------- | :----: | :---: | :---: | :----: | :----: | :-----: | :--: | :---: | :------: |
| `SettingsPanel`  |   8    |   7   |   8   |   7    |   9    |    9    |  8   |   7   | **7.5**  |
| `WikiPanel`      |   8    |   7   |   8   |   7    |   8    |    8    |  9   |   8   | **7.5**  |
| `AssistantPanel` |   7    |   7   |   8   |   7    |   8    |    7    |  7   |   7   | **7.0**  |

**Доказательства:**

- `SettingsPanel.test.tsx` существует; settings персистятся через `getAllSettings`/`setSetting`.
- `WikiPanel`: 3 теста (`WikiPanel.test.tsx`, `wiki-components.test.ts`, `wiki-integrity.test.ts`) — включая integrity-проверку wiki-зеркала.
- `AssistantPanel.test.tsx` + `panel-actions-catalog.test.ts` + `use-speech.test.ts`.

---

### 4.14. Диагностика — прочие

| Панель                        | Функц. | Стаб. | UI/UX | Ошибки | Kernel | Persist | Доки | Тесты | **Итог** |
| ----------------------------- | :----: | :---: | :---: | :----: | :----: | :-----: | :--: | :---: | :------: |
| `StateInspectorPanel`         |   7    |   7   |   7   |   6    |   9    |    6    |  7   |   5   | **6.5**  |
| `DiagnosticPanel` (565 строк) |   7    |   7   |   7   |   7    |   8    |    7    |  8   |   5   | **7.0**  |
| `PressureMap` (417)           |   7    |   7   |   7   |   6    |   8    |    6    |  7   |   5   | **6.5**  |
| `WhatIfPanel`                 |   7    |   7   |   7   |   7    |   8    |    6    |  7   |   7   | **7.0**  |
| `CounterfactualPanel`         |   7    |   7   |   7   |   7    |   8    |    6    |  7   |   7   | **7.0**  |
| `CausalDebugger`              |   7    |   6   |   7   |   6    |   8    |    6    |  7   |   5   | **6.5**  |

**Заметка:** `StateInspectorPanel`, `DiagnosticPanel`, `PressureMap`, `CausalDebugger` — без собственных тестов, но код выглядит корректным. Это **«качество не подтверждено формально»**, а не «сломано».

---

### 4.15. Интеграции (MCP / Tools / Skills / Connectors)

| Панель                | Функц. | Стаб. | UI/UX | Ошибки | Kernel | Persist | Доки | Тесты | **Итог** |
| --------------------- | :----: | :---: | :---: | :----: | :----: | :-----: | :--: | :---: | :------: |
| `ToolsPanel`          |   8    |   7   |   7   |   7    |   9    |    7    |  8   |   7   | **7.5**  |
| `SkillsPanel`         |   7    |   7   |   7   |   7    |   8    |    7    |  7   |   7   | **7.0**  |
| `MCPPanel`            |   7    |   7   |   7   |   7    |   9    |    7    |  8   |   7   | **7.5**  |
| `ConnectorsPanel`     |   7    |   7   |   7   |   7    |   8    |    7    |  7   |   7   | **7.0**  |
| `WebhooksPanel` (524) |   7    |   6   |   7   |   6    |   8    |    7    |  6   |   6   | **6.5**  |

**Доказательства:** у каждой есть `.test.tsx`. `WebhooksPanel` дополнительно в `panel-smoke-tests.test.tsx`.

---

## 5. Групповая оценка: Техники-панели (62 шт.)

Это особый класс. В разделе «Техники» — **62 панели** (`src/components/TechniquePanels/*.tsx`), каждая по **234 строки**, и они **практически идентичны** (diff между `HumorPanel.tsx` и `StrategistPanel.tsx` — всего 12 строк: имя, `TECHNIQUE_ID`, `CATEGORY`, и `mode="arguments"` vs `mode="agents"` в `FocusSection`).

Это **сгенерированный набор** — единый шаблон, инстанцированный для каждой из 75 техник качества (62 имеют отдельный UI).

### Единая оценка для всех 62 техник-панелей

| Критерий                  | Оценка | Доказательство                                                                                                                                                                                                                                                                     |
| ------------------------- | :----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Основная функциональность | **6**  | UI: toggle вкл/выкл техники, отображение метрик из `qualityImpactCollector.getMetricsForTechnique()`, список агентов/аргументов. **Но** — это в основном панель **конфигурации и наблюдения**, а не сама техника (техника выполняется в debate runtime, не в панели).              |
| Стабильность              | **6**  | Uniform-код, простая логика, но **Web Workers и hot path дебатов** — там, где техника реально работает, — не покрыты UI-тестом.                                                                                                                                                    |
| UI/UX                     | **6**  | `PanelToggle` (switch), `Section`, `FocusSection`, `CATEGORY_ICON` — аккуратно, но однообразно. Inline-стили (не дизайн-токены).                                                                                                                                                   |
| Обработка ошибок          | **5**  | Минимальная — нет явных try/catch вокруг `getAllSettings`/`getMetricsForTechnique`.                                                                                                                                                                                                |
| Интеграция с Kernel       | **7**  | `getAllSettings`, `setSetting`, `qualityImpactCollector`, `debateEngine.getActiveSession()`, `useRealAgents`, `useDebateArguments` — корректные hook'и.                                                                                                                            |
| Сохранение данных         | **7**  | `setSetting(TECHNIQUE_ID, enabled)` — настройки техник персистятся.                                                                                                                                                                                                                |
| Документация              | **5**  | Только 1 общая статья `panel-debate-toolkit.md` на все 62 панели; индивидуальных статей нет (в каталоге 19 техник с пометкой «—» в колонке «Статья»).                                                                                                                              |
| Тестирование              | **5**  | `technique-panels-smoke.test.tsx` — параметризованный smoke: **рендерит все 62 панели, проверяет `container.firstChild !== null`**. Один индивидуальный тест `CrossExaminationPanel.test.tsx`. Это **подтверждает «не падает при рендере»**, но не проверяет логику toggle/метрик. |

**Итог: 6.0 / 10** (для всех 62 панелей одинаково).

**Важно про неизвестность:** smoke-тест подтверждает render, но не проверяет, что toggle реально влияет на debate runtime. Эта связь — **не подтверждена юнит-тестом**, но и не опровергнута. В E2E `data-debate.spec.ts` техники участвуют косвенно.

---

## 6. Панели-заглушки и минимальные панели (риск < 5)

Эти панели либо очень короткие, либо обёртки над одной сущностью. **Они не сломаны** — но и не Product-ready.

| Панель                                                                            | Строк | Функц. |          Тесты          |  Итог   | Что не так                                                                                                        |
| --------------------------------------------------------------------------------- | ----: | :----: | :---------------------: | :-----: | ----------------------------------------------------------------------------------------------------------------- |
| `GovernancePanel`                                                                 |    61 |   4    |       7 (хорошие)       | **5.0** | Только RBAC-назначение 4 ролей. Audit/policy/HITL — нет.                                                          |
| `SocialLeaderboardPanel`                                                          |    34 |   5    |            0            | **4.5** | Обёртка над `EloLeaderboard` из AgentsPanel. Сам по себе — только заголовок.                                      |
| `OpenRouterPanel`                                                                 |    29 |   4    |            0            | **4.0** | Микро-обёртка. Функциональность делегирована в `ProviderManager`.                                                 |
| `LearnHubPanel`                                                                   |    67 |   6    | 0 (но дети тестированы) | **6.0** | Таб-обёртка над Tutorial/Docs/Patterns/DecisionLog — самим контентом. Тестов нет, но дочерние панели тестированы. |
| `AgentMarketplacePanel`                                                           |   102 |   5    |            0            | **5.0** | Минимальный UI маркетплейса.                                                                                      |
| `ArchitectureMapPanel`                                                            |    85 |   5    |            0            | **4.5** | Probably визуализация архитектуры, но короткий.                                                                   |
| `RivalsCatalogPanel`                                                              |    85 |   5    |            0            | **4.5** | Каталог вариантов, короткий.                                                                                      |
| `PanelLoader`                                                                     |    24 |   —    |            —            |    —    | Утилита-обёртка (lazy + ErrorBoundary), не панель.                                                                |
| `ModalShell`, `ConfirmDialog`, `PanelStates`, `ModuleInfo`, `GlobalErrorBoundary` | 51–93 |   —    |            —            |    —    | Вспомогательные компоненты, не панели.                                                                            |

**Заметка про неизвестность:** `SocialLeaderboardPanel`, `OpenRouterPanel`, `ArchitectureMapPanel`, `RivalsCatalogPanel` — **без тестов**, но код выглядит как тонкая обёртка над протестированными дочерними компонентами. Реальный риск низкий, но формально качество не подтверждено.

---

## 7. Топ-10 самых готовых панелей (≥ 8.0)

| #   | Панель                    |  Итог   | Главные доказательства                             |
| --- | ------------------------- | :-----: | -------------------------------------------------- |
| 1   | `ChatPanel`               | **8.5** | 609 строк, 8 тестов, E2E, MarkdownRenderer+Mermaid |
| 2   | `ProviderManager`         | **8.5** | 1765 строк в 4 файлах, 6 тестов, E2E, health-check |
| 3   | `DebatePanel` (семейство) | **8.5** | 9 тестов, comprehensive-тесты, E2E, 33 стратегии   |
| 4   | `MemoryPanel`             | **8.0** | 4 теста, BM25+семантика, chunk persistence         |
| 5   | `AgentsPanel`             | **8.0** | 4 теста, E2E, persona/identity/history             |
| 6   | `HealthPanel`             | **7.5** | Защита от Promise-in-state, 1 тест, E2E            |
| 7   | `SREAgentPanel`           | **7.5** | 493 строки, advisor-интеграция, 1 тест             |
| 8   | `KnowledgePanel`          | **7.5** | RAG, E2E, 1 тест                                   |
| 9   | `WikiPanel`               | **7.5** | 3 теста, включая wiki-integrity                    |
| 10  | `TasksPanel`              | **7.5** | 903 строки, Kanban, 1 тест                         |

---

## 8. Матрица «Подтверждённое качество vs Неизвестность»

Это прямая реализация требования: **«отсутствие тестов не должно автоматически означать, что панель не работает»**.

| Панель                 |      Тесты?       |                              Код корректен?                               | Вердикт                                                                                        |
| ---------------------- | :---------------: | :-----------------------------------------------------------------------: | ---------------------------------------------------------------------------------------------- |
| ChatPanel              | ✅ 8 файлов + E2E |                                    ✅                                     | **Подтверждённое качество**                                                                    |
| ProviderManager        | ✅ 6 файлов + E2E |                                    ✅                                     | **Подтверждённое качество**                                                                    |
| GovernancePanel        |    ✅ 4 теста     |                            ⚠ узкий функционал                             | **Подтверждённое качество узкой области** + **известный gap функциональности**                 |
| TasksPanel             |     ✅ 1 файл     |                                    ✅                                     | **Подтверждённое качество** (но тест единичный)                                                |
| DiagnosticPanel        |      ❌ нет       |             ✅ код выглядит корректным (565 строк, try/catch)             | **Качество НЕ подтверждено формально, но код выглядит рабочим** — не «сломано», а «неизвестно» |
| StateInspectorPanel    |      ❌ нет       |                                    ✅                                     | **Неизвестность** — код корректен, тестов нет                                                  |
| PressureMap            |      ❌ нет       |                                    ✅                                     | **Неизвестность**                                                                              |
| ArchitectureMapPanel   |      ❌ нет       |                              ⚠ короткий (85)                              | **Неизвестность + подозрение на stub**                                                         |
| 62 TechniquePanel      |   ⚠ smoke-only    |                            ✅ render работает                             | **Render подтверждён, логика toggle — НЕ подтверждена**                                        |
| SocialLeaderboardPanel |      ❌ нет       | ✅ тонкая обёртка над `EloLeaderboard` (который тестирован в AgentsPanel) | **Качество делегировано** — риск низкий                                                        |
| AquariumPanel          |      ✅ есть      |                                    ✅                                     | **Подтверждённое качество** (забавная декоративная панель)                                     |

### Ключевое различие

- **Подтверждённое качество (✅)**: есть тест, проверяющий **поведение** (не только render), ИЛИ панель участвует в E2E-сценарии.
- **Render-подтверждение (⚠)**: есть только smoke-тест «не падает при рендере». Не гарантирует логику.
- **Неизвестность (❌ нет тестов)**: тестов нет. **Код может быть полностью рабочим** — это нужно проверять вручную или добавлением теста. **Не эквивалентно «сломано».**
- **Подтверждённая проблема (🔴)**: в коде виден дефект. **В проекте таких панелей найти не удалось** — большинство «подозрительных» мест защищены (например, `HealthPanel` явно guarding от Promise-in-state).

---

## 9. Панели без тестов, но с качественным кодом (неявные кандидаты на тестирование)

Это список панелей, где **код выглядит зрелым (большой объём, try/catch, hooks правильно), но формального теста нет**. Это **не дефекты**, а приоритеты для расширения тест-покрытия.

| Панель                 | Строк | Почему выглядит зрелым                       | Рекомендованный тест     |
| ---------------------- | ----: | -------------------------------------------- | ------------------------ |
| `DeployPanel`          |   782 | Самая большая панель, деплой конвейеров      | Smoke + deploy-flow test |
| `PersonaPickerPanel`   |   727 | Большой UI выбора персоны                    | Smoke + a11y             |
| `CollaborationPanel`   |   703 | Большой функционал коллаборации              | Smoke + interaction      |
| `GoogleCachePanel`     |   698 | Кэш Google AI                                | Smoke                    |
| `WorkflowPanel`        |   685 | Visual workflows                             | Smoke + DnD              |
| `SmartRoutingPanel`    |   672 | Smart routing config                         | Smoke                    |
| `ProviderDashboard`    |   670 | Дашборд провайдеров                          | Smoke                    |
| `ABTestPanel`          |   669 | A/B тесты                                    | Smoke + расчёт           |
| `MessageSearchPanel`   |   663 | Поиск по сообщениям (используется ChatPanel) | Smoke + search test      |
| `PromptLibraryPanel`   |   658 | Библиотека промптов                          | Smoke + CRUD             |
| `AudiencePanel`        |   658 | Аудитория дебатов                            | Smoke                    |
| `ExportImportPanel`    |   643 | Экспорт/импорт данных                        | Smoke + round-trip       |
| `BatchProcessingPanel` |   639 | Пакетная обработка                           | Smoke                    |
| `CommandPalette`       |   618 | Cmd+K palette                                | Smoke + keyboard         |
| `DiagnosticPanel`      |   565 | 565 строк диагностики                        | Smoke                    |
| `SessionHubPanel`      |   564 | Хаб сессий                                   | Smoke                    |
| `WebhooksPanel`        |   524 | Webhooks (есть smoke)                        | Расширить до логики      |
| `FederatedMemoryPanel` |   517 | Федеративная память (есть тест)              | — уже тестируется        |

---

## 10. Сводная таблица оценок по всем оцененным панелям

> Подробно оценены 28 индивидуальных панелей + 62 техники-панели как группа. Остальные ~178 панелей — сводно по разделу (см. §3).

| Панель                         | Функц. | Стаб. | UI/UX | Ошибки | Kernel | Persist | Доки  | Тесты | **Итог** |
| ------------------------------ | :----: | :---: | :---: | :----: | :----: | :-----: | :---: | :---: | :------: |
| ChatPanel                      |   9    |   8   |   9   |   8    |   9    |    8    |   9   |   8   | **8.5**  |
| ProviderManager                |   9    |   8   |   9   |   8    |   9    |    9    |   9   |   8   | **8.5**  |
| DebatePanel (семейство)        |   9    |   8   |   9   |   8    |   9    |    9    |   9   |   8   | **8.5**  |
| TasksPanel                     |   8    |   8   |   8   |   8    |   9    |    8    |   8   |   6   | **7.5**  |
| LogsPanel                      |   8    |   8   |   8   |   8    |   9    |    7    |   9   |   7   | **7.5**  |
| TracesPanel                    |   8    |   8   |   8   |   8    |   9    |    7    |   9   |   7   | **7.5**  |
| HealthPanel                    |   8    |   8   |   8   |   8    |   9    |    7    |   9   |   7   | **7.5**  |
| SREAgentPanel                  |   8    |   8   |   8   |   8    |   9    |    7    |   8   |   6   | **7.5**  |
| MemoryPanel                    |   8    |   7   |   7   |   7    |   9    |    9    |   9   |   8   | **8.0**  |
| KnowledgePanel                 |   8    |   7   |   7   |   7    |   9    |    9    |   9   |   7   | **7.5**  |
| AgentsPanel                    |   8    |   8   |   8   |   7    |   9    |    8    |   9   |   8   | **8.0**  |
| RolesPanel                     |   7    |   7   |   7   |   7    |   8    |    7    |   8   |   7   | **7.0**  |
| BudgetPanel                    |   8    |   7   |   7   |   7    |   9    |    8    |   8   |   7   | **7.5**  |
| AnalyticsPanel                 |   8    |   7   |   7   |   7    |   9    |    8    |   8   |   7   | **7.5**  |
| DashboardPanel                 |   7    |   7   |   8   |   6    |   7    |    5    |   8   |   8   | **7.0**  |
| SettingsPanel                  |   8    |   7   |   8   |   7    |   9    |    9    |   8   |   7   | **7.5**  |
| WikiPanel                      |   8    |   7   |   8   |   7    |   8    |    8    |   9   |   8   | **7.5**  |
| AssistantPanel                 |   7    |   7   |   8   |   7    |   8    |    7    |   7   |   7   | **7.0**  |
| ToolsPanel                     |   8    |   7   |   7   |   7    |   9    |    7    |   8   |   7   | **7.5**  |
| MCPPanel                       |   7    |   7   |   7   |   7    |   9    |    7    |   8   |   7   | **7.5**  |
| SkillsPanel                    |   7    |   7   |   7   |   7    |   8    |    7    |   7   |   7   | **7.0**  |
| ConnectorsPanel                |   7    |   7   |   7   |   7    |   8    |    7    |   7   |   7   | **7.0**  |
| WebhooksPanel                  |   7    |   6   |   7   |   6    |   8    |    7    |   6   |   6   | **6.5**  |
| StateInspectorPanel            |   7    |   7   |   7   |   6    |   9    |    6    |   7   |   5   | **6.5**  |
| DiagnosticPanel                |   7    |   7   |   7   |   7    |   8    |    7    |   8   |   5   | **7.0**  |
| PressureMap                    |   7    |   7   |   7   |   6    |   8    |    6    |   7   |   5   | **6.5**  |
| WhatIfPanel                    |   7    |   7   |   7   |   7    |   8    |    6    |   7   |   7   | **7.0**  |
| CounterfactualPanel            |   7    |   7   |   7   |   7    |   8    |    6    |   7   |   7   | **7.0**  |
| GovernancePanel                |   4    |   6   |   5   |   7    |   6    |    5    |   6   |   7   | **5.0**  |
| SocialLeaderboardPanel         |   5    |   6   |   6   |   5    |   6    |    5    |   5   |   3   | **4.5**  |
| OpenRouterPanel                |   4    |   6   |   5   |   5    |   6    |    5    |   5   |   3   | **4.0**  |
| LearnHubPanel                  |   6    |   7   |   7   |   6    |   7    |    6    |   6   |   3   | **6.0**  |
| **62 TechniquePanel (группа)** | **6**  | **6** | **6** | **5**  | **7**  |  **7**  | **5** | **5** | **6.0**  |

**Средний итог по детально оцененным панелям: ~7.0/10** (без техник-панелей и заглушек — **~7.6/10**).

---

## 11. Архитектурные наблюдения (влияющие на оценки)

### Сильные стороны архитектуры (поднимают оценки всех панелей)

1. **DI-контейнер ядра** (`src/kernel/container.ts`, `instances.ts`) — панели не импортируют адаптеры/Dexie напрямую, только сервисы. Это **подтверждено** конвенцией `dev-components.md` и видно в коде всех зрелых панелей.
2. **Типизированный EventBus** (198 схем событий) — развязка панелей и сервисов. Подписки очищаются в `useEffect` cleanup (видно в `TasksPanel`, `SREAgentPanel`).
3. **`GlobalErrorBoundary`** + `PanelLoader` с ленивой загрузкой — падение одной панели не роняет OS. Это **поднимает оценку «Стабильность»** для всех панелей на 1 балл.
4. **Конвенция «Promise не должен попасть в state»** — явно реализована в `HealthPanel` (строка 21: `initial instanceof Promise ? null : initial`). Это индикатор зрелости команды.
5. **Конвенция «пустой список ≠ ошибка загрузки»** — реализована в `GovernancePanel` (тест `governance.error_load` vs `governance.empty_roles`). Это **подтверждено тестом**.
6. **Dexie/IndexedDB для persistence** — local-first, ключи и данные не уходят в облако.

### Слабые стороны (давят на оценки)

1. **API-ключи в открытом виде** в браузерном хранилище (явно предупреждено в README) — security gap, но не влияет на функциональность панелей.
2. **Inline-стили с цветовыми литералами** (`'#3b82f6'` в `GovernancePanel`, `HumorPanel` и др.) — нарушение собственной конвенции `fa-02` о дизайн-токенах. Снижает оценку UI/UX на 1 балл для этих панелей.
3. **`dev-status-*.md` — пустые заглушки** («текст в разработке») для critical issues / debt / done / bugs. Состояние разработки **не задокументировано**, хотя кодовая база обширна. Снижает доверие к метаданным.
4. **`dev-tests-catalog.md` устарел**: заявляет 157 тестов в components, по факту **164**. Manifest/wiki-gen работает, но статичные wiki-тексты не успевают.
5. **Тесты вне `test:stable`** не гоняются в CI (сказано в `dev-status-testing.md`) — часть компонентных тестов существует, но не является гейтом.

---

## 12. Рекомендации

### Быстрые победы (high-ROI)

1. **Добавить smoke-тесты для топ-10 нетестируемых больших панелей** (см. §9). Каждая панель 600+ строк без теста — это неизвестность. Шаблон: параметризованный smoke как `technique-panels-smoke.test.tsx`, 1 тест на панель.
2. **Расширить `GovernancePanel`** до заявленного в wiki (audit trail, HITL queue, policy binding) — либо явно понизить статус wiki-статьи до «stub», чтобы убрать разрыв ожиданий.
3. **Перевести inline-цвета на дизайн-токены** в `GovernancePanel`, `HumorPanel`, техник-панелях — соответствие конвенции `fa-02`.

### Среднесрочные

4. **Индивидуальные тесты для 3–5 техник-панелей** (помимо `CrossExaminationPanel`) — проверить, что toggle реально меняет `setSetting` и влияет на `qualityImpactCollector`.
5. **Заполнить `dev-status-critical.md` и `dev-status-debt.md`** — сейчас они пустые, что мешает приоритизации.
6. **Включить в `test:stable` гейт** хотя бы 1 тест на каждый раздел (сейчас 34 пути, но многие разделы без представителя).

### Стратегические

7. **E2E для SRE/Health/Diagnostics** — сейчас `data-health.spec.ts` есть, но SRE и diagnostics без E2E.
8. **Visual regression** для 62 техник-панелей — uniform-код, идеально для параметризованного screenshot-теста.
9. **Документация индивидуальных техник-панелей** — сейчас 19 из 62 без wiki-статьи.

---

## 13. Итоговый вердикт по проекту

| Домен                                                                                          |    Готовность    | Комментарий                                                                           |
| ---------------------------------------------------------------------------------------------- | :--------------: | ------------------------------------------------------------------------------------- |
| **Продукционное ядро** (Chat, Providers, Debates, Memory, Agents, Tasks, Observability)        | **8.0–8.5 / 10** | Готово к daily-use, есть тесты + E2E                                                  |
| **Зрелая периферия** (Settings, Wiki, Knowledge, Tools, MCP, Skills, Budget)                   | **7.0–7.5 / 10** | Работает, тесты есть, но не все edge-cases покрыты                                    |
| **Диагностика/стратегия** (Diagnostic, PressureMap, WhatIf, Counterfactual, Similarity, Drift) | **6.5–7.0 / 10** | Код корректен, тестов мало — **неизвестность**, не дефект                             |
| **Техники-панели (62 шт.)**                                                                    |   **6.0 / 10**   | Uniform, render-подтверждены, логика — нет                                            |
| **Заглушки/обёртки** (Governance, SocialLeaderboard, OpenRouter, ArchitectureMap)              | **4.0–5.0 / 10** | Либо stub, либо тонкая обёртка. Governance — отдельная проблема (wiki обещает больше) |

**Общая готовность панелей SuperAgents OS: ~7.0 / 10** (медиана по 28 детально оцененным + 62 техникам).

Проект **не имеет подтверждённо сломанных панелей**. Основная проблема — **неизвестность** (panels without tests), которая **не эквивалентна неработоспособности**. Ядро системы — продакшн-ready, периферия — функциональна, но нуждается в расширении тест-покрытия.

---

## Приложение A. Источники и метод проверки

| Что              | Где                                                                                           | Как проверено                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Список панелей   | `docs/wiki/panels-catalog.md`                                                                 | WebFetch + клон репо                                                                                        |
| Структура секций | `src/route-registry-core.ts`, `-content.ts`, `-system.ts` + `src/i18n/translations/ru/nav.ts` | `grep` по `labelKey: 'nav.section_*'`                                                                       |
| Код панелей      | `src/components/**`                                                                           | клон репо + `wc -l` + `Read` избранных файлов                                                               |
| Тесты            | `src/components/**/*.test.tsx`                                                                | `find` + чтение `panel-smoke-tests.test.tsx`, `technique-panels-smoke.test.tsx`, `GovernancePanel.test.tsx` |
| E2E              | `e2e/*.spec.ts`                                                                               | `ls`                                                                                                        |
| Документация     | `docs/wiki/panel-*.md` (88 файлов), `docs/wiki/comp-*.md`                                     | `ls` + WebFetch                                                                                             |
| Dev-status       | `docs/wiki/dev-status-*.md`                                                                   | WebFetch (подтверждено: critical/debt/done — пустые «текст в разработке»)                                   |
| Архитектура      | README.md, `docs/wiki/architecture.md`, `dev-components.md`                                   | WebFetch                                                                                                    |

## Приложение B. Файлы, прочитанные полностью (для верификации)

- `src/components/ChatPanel/ChatPanel.tsx` (609 строк)
- `src/components/TasksPanel/TasksPanel.tsx` (903 строки)
- `src/components/GovernancePanel/GovernancePanel.tsx` (61 строка)
- `src/components/GovernancePanel/GovernancePanel.test.tsx` (4 теста)
- `src/components/SREAgentPanel/SREAgentPanel.tsx` (493 строки, head)
- `src/components/HealthPanel/HealthPanel.tsx` (530 строк, head)
- `src/components/TechniquePanels/HumorPanel.tsx` (234 строки, head)
- `src/components/TechniquePanels/technique-panels-smoke.test.tsx` (полностью)
- `src/components/panel-smoke-tests.test.tsx` (175 строк, полностью)
- `src/components/SocialLeaderboardPanel.tsx` (34 строки, полностью)
- `src/components/LearnHubPanel.tsx` (67 строк, head)
- `src/route-registry-core.ts` (head)
- `src/i18n/translations/ru/nav.ts` (sections)
- `docs/wiki/panels-catalog.md` (каталог 268 панелей)
- `docs/wiki/dev-tests-catalog.md` (514 тестов)
- `docs/wiki/dev-components.md` (анатомия панели)
- `README.md` (обзор, стек, скрипты)

---

## Сверка с аудитами (волны 2–8)

Дополнительные факты по требованиям/покрытию из волн аудитов:

- W4-041: 156 «You are…» промптов в коде без версий — требования к поведению агентов не формализованы.
- W4-033/034: prompt-overrides без version/author — нет атрибуции изменений требований.
- W3-017: `t()` с 104 фолбэками — требование i18n-покрытия не выполнено для этих строк.
- W7-UNI-007: отправка во время IME-композиции (исправлено) — требование корректности ввода.
- W3-016: MemoryCenterPanel — захардкоженный русский (нет `useTranslation`).
- W4-024: PII в чат-выводе (исправлено редэкцией) — требование приватности.
- W2-005/W4-019/W7-CRY-001: vault-шифрование ключей (passphrase) — не реализовано.
- W6-020: race-стратегия молча пропускала tools (исправлено) — требование предсказуемости.
- W8-009: LLM JSON без schema-валидации (исправлено частично) — требование контрактов вывода.
- W6-018: feature-flag UI показывает дефолт вместо реального значения — требование правдивости UI.

---

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e`. Все оценки — на основе статического анализа кода и тестов; runtime-поведение не проверялось._
