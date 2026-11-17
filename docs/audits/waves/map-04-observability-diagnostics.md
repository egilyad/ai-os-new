# Карта наблюдаемости и диагностики — Observability & Diagnostics Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `ae2dad8` (Nov 17, 2026, ветка `main`)
> **Дата анализа:** 2026-11-17 (актуализация карты от 2026-10-31, commit `e08ab8e`)
> **Метод:** статический анализ observability-панелей (HealthPanel, HealthHub, TracesPanel, LogsPanel, ServiceRegistryPanel, StateInspectorPanel, SREAgentPanel, ExceptionsPanel, DefectMapPanel, EventsTimeline, UsageHeatmap, etc.), bootstrap phase visibility, error events, AgentJournal, cross-nav из diagnostic panels, поиск UI exposure для MemoryWatchdog/DLQ/CircuitBreaker/EventRegistry. Проверки: `Test-Path` (файлы), `Select-String` по `src/route-registry-*.ts` и `src/route-imports.ts` (регистрация маршрутов), `Get-ChildItem src/**/*.test.ts(x)` (тесты), `git log --oneline --since=2026-10-31` (изменения).
> **Парные документы:** 13 предыдущих карт + свежая `docs/wiki/dev-reality-map.md`
> **Главный результат:** **23+ observability панелей** (богатая инфраструктура, +5 новых с октября), **НО 6 ключевых diagnostics без UI exposure**, **0 cross-nav из diagnostic panels к source**, и **нет unified «объясни своё состояние» dashboard**.

---

## 1. Исполнительное резюме

SuperAgents OS имеет **богатую observability-инфраструктуру**: 23+ панелей для monitoring/tracing/debugging (+SREAgentPanel, ExceptionsPanel, EventsTimeline, UsageHeatmap, DefectMapPanel с октября 2026). Bootstrap имеет явный state machine (`pending → kernel → services → topology → ready/degraded/failed`), `LifecycleManager.getStatuses()` возвращает `InitStatus[]`, `ErrorBoundary` ловит errors на 3 уровнях (panel + app + global). **Появился полноценный сервисный tracing** (`trace-service.ts`, 539 строк: TraceRepository, персистенция, retry) — раньше traces жили только в `cognitiveService.getTraces()`.

**НО:**

- **0 cross-panel navigation из diagnostic panels** (Integration Map §3.5) — пользователь видит симптомы, но не может перейти к source (проверено: `navigate(`/`useNavigate` = 0 рефов в LogsPanel/TracesPanel/HealthPanel/StateInspectorPanel/DiagnosticPanel/AuditLogView/DecisionLogPanel/AgentJournalPanel)
- **6 ключевых diagnostics без UI exposure**: MemoryWatchdog (heap в логах; появились onPressure-callback'и + eventBus, но UI нет), DeadLetterQueue (выделен отдельный сервис `dead-letter-queue-service.ts`, UI нет), CircuitBreaker state (no UI), Bootstrap report (no UI), Event registry (**286 schemas**, no UI), Subscription stats (method exists, no UI)
- **Нет unified «объясни своё состояние» dashboard** — данные разбросаны по 23+ панелям
- **HealthSlaPanel** — больше НЕ `@deprecated MOCK`: панель переведена на реальный `healthSlaService` (управление профилями SLA), но id `health-sla` **не зарегистрирован в route-registry** — в nav отсутствует, доступна только через deep-link/PANEL_COMPONENTS

**Сводные метрики observability:**

| Метрика                             |                                                                                                   Значение | Оценка           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------: | ---------------- |
| Observability панелей               |                                                                                                    **23+** | 🟢 много         |
| HealthPanel секций                  |    6 (KernelServices, DistributedNodes, ProbeResults, HealthScore, HealthTimeline, RateLimitIntrospection) | 🟢 rich          |
| TracesPanel sub-components          | 6 (CognitiveMicroscope, DecisionGraph, MicroscopeTimeline, StepAnalysis, TopologyTraceView, TraceDebugger) | 🟢 rich          |
| Bootstrap phases visible            |                                                 6 (pending/kernel/services/topology/ready/degraded/failed) | 🟢 но **нет UI** |
| LifecycleManager.getStatuses()      |                                                                                           ✅ method exists | 🟢 но **нет UI** |
| ErrorBoundary уровней               |                                                                          3 (panel + app + global handlers) | 🟢🟢 excellent   |
| EVENTS.NOTIFICATION references      |                                                                                                     **16** | 🟡 уменьшилось   |
| EVENTS.ERROR_BOUNDARY_CAUGHT        |                                                                                                     2 refs | 🟡 уменьшилось   |
| AlertLayer (notification UI)        |                                                                                                  327 строк | 🟢               |
| AgentJournalPanel (execution trail) |                                                                                                  ✅ exists | 🟢               |
| ServiceRegistryPanel                |                                                                                      392 строки + 8 файлов | 🟢 rich          |
| TraceService (сервисный tracing)    |                                                                                ✅ 539 строк + персистенция | 🟢 новый         |
| **Cross-nav из diagnostic panels**  |                                                                                                      **0** | 🔴 NONE          |
| MemoryWatchdog UI                   |                                                                                          ❌ только в логах | 🔴               |
| DeadLetterQueue UI                  |                                                                                          ❌ service без UI | 🔴               |
| CircuitBreaker state UI             |                                                                                                   ❌ no UI | 🔴               |
| Bootstrap report UI                 |                                                                                                   ❌ no UI | 🔴               |
| Event registry UI (286 schemas)     |                                                                                                   ❌ no UI | 🔴               |
| Subscription stats UI               |                                                                                           ❌ method без UI | 🔴               |
| Unified «explain state» dashboard   |                                                                                                     ❌ нет | 🔴               |

**Главные сильные стороны:**

- **23+ observability панелей** — богатый выбор (+5 новых)
- **TraceService** — сервисный tracing с персистенцией (новое)
- **3-уровневая error recovery** (ErrorBoundary + GlobalErrorBoundary + global handlers)
- **16 EVENTS.NOTIFICATION refs** — error notification жива (но масштаб сократился с 195)
- **ServiceRegistryPanel** (392 строки) — rich service browser с statuses + detail panel
- **TracesPanel** — 6 sub-components включая CognitiveMicroscope и DecisionGraph
- **Bootstrap state machine** — явный phase tracking

**Главные слабые стороны:**

- **0 cross-nav из diagnostic panels к source** — главный observability gap
- **6 ключевых diagnostics без UI exposure** (MemoryWatchdog, DLQ, CircuitBreaker, Bootstrap report, Event registry, Subscription stats)
- **Нет unified dashboard** — данные разбросаны
- **HealthSlaPanel** — больше не MOCK, но выпал из nav
- **Diagnostic panels изолированы** — TracesPanel/HealthPanel/LogsPanel не связаны

**Observability Score: 6.0/10** — богатая инфраструктура, но fragmented и без unified «explain state».

---

## 2. Методология: 6 вопросов

| #   | Вопрос                                 | Что проверяем                                                 |
| --- | -------------------------------------- | ------------------------------------------------------------- |
| 1   | Можно ли увидеть состояние сервиса?    | ServiceRegistryPanel, HealthPanel, KernelServicesSection      |
| 2   | Понятно ли, почему панель не работает? | ErrorBoundary, error events, UI feedback                      |
| 3   | Видны ли ошибки инициализации?         | Bootstrap phase, LifecycleManager.getStatuses(), UI exposure  |
| 4   | Можно ли отследить цепочку выполнения? | TracesPanel, TraceService, AgentJournalPanel, RouterTraceView |
| 5   | Видны ли активные агенты и задачи?     | AgentsPanel, TasksPanel, MissionControl                       |
| 6   | Можно ли определить источник проблемы? | Cross-nav из diagnostics, source identification               |

**Принцип:** «Насколько сама ОС способна объяснить своё состояние» — focus на **self-explanation capability**.

---

## 3. 23+ Observability панелей — inventory

Проверка: `Test-Path` по `src/components/<Panel>` + `Get-ChildItem` (строки) + `Select-String` по `src/route-imports.ts` (подключение к роутеру).

### 3.1. Health-домен (5 панелей + HealthHub)

| Панель              | Строк | Что показывает                                                                                                                                 |
| ------------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `HealthHub`         |    57 | 🆕 Таб-агрегатор: `health` (HealthPanel) / `system` (SystemHealthPanel) — route id `health`                                                    |
| `HealthPanel`       |   505 | Vitals (CPU/memory/throughput), KernelServices, DistributedNodes, ProbeResults, HealthScore, HealthTimeline, RateLimitIntrospection            |
| `SystemHealthPanel` |   207 | Системное здоровье (overlap с HealthPanel)                                                                                                     |
| `DocsHealthPanel`   |   260 | Documentation health (links, sources, completeness) + **тест** DocsHealthPanel.test.tsx                                                        |
| `HealthSlaPanel`    |   424 | 🟡 **больше НЕ MOCK** — реальный `healthSlaService` (профили, правила, evaluate). id `health-sla` нет в route-registry → **в nav отсутствует** |

**HealthPanel секции (6):**

1. `KernelServicesSection` — состояние kernel сервисов
2. `DistributedNodesSection` — distributed nodes (keys + bees)
3. `ProbeResultsSection` — active probe results
4. `HealthScoreSection` — composite health score
5. `HealthTimelineSection` — timeline of health events
6. `RateLimitIntrospection` — rate limit status

### 3.2. Traces-домен (богатый)

| Панель              |       Строк | Что показывает                                                                                                                        |
| ------------------- | ----------: | ------------------------------------------------------------------------------------------------------------------------------------- |
| `TracesPanel`       |         718 | 6 sub-components: CognitiveMicroscope, DecisionGraph, MicroscopeTimeline, StepAnalysisPanel, TopologyTraceView, TraceDebugger (+тест) |
| `RouterTraceView`   |         246 | Routing decisions trace (4 файла в каталоге)                                                                                          |
| `AgentJournalPanel` | 420 + 4 sub | Execution trail «журнал супервайзеров» (main + JournalEntryCard, JournalAddForm, StatMini, жур-constants)                             |
| `DecisionLogPanel`  |         299 | Decision history + export (JSON) (+DecisionCard, ScoreRow, StatBox, типы; тест DecisionCard)                                          |
| `AuditLogView`      |         366 | Audit log + export (JSON + CSV). route id `audit`                                                                                     |

**🆕 Сервисный tracing (backend):**

- `trace-service.ts` (539 строк) — `TraceService`: активные traces, персистенция через `TraceRepository`, retry-очередь (MAX_RETRY_ATTEMPTS=3), `getTraces()/getTraceStats()`, PII-редэкция
- `trace-context.ts` (100 строк) — контекст трассировки
- `MonitoringService` потребляет `traceService.getTraces()/getTraceStats()`

### 3.3. Logs & State

| Панель                     |          Строк | Что показывает                                                         |
| -------------------------- | -------------: | ---------------------------------------------------------------------- |
| `LogsPanel`                |            497 | Log browser с filters (+тест)                                          |
| `StateInspectorPanel`      |            292 | Tree view state + StatBox + TreeNode (+auto-clear errors, P2-12)       |
| `DiagnosticPanel`          |            543 | General diagnostics                                                    |
| `PerformanceProfilerPanel` |    253 + 3 sub | Performance profiling (components, ServiceDetailPanel, profiler-utils) |
| `PressureMapPanel`         | 367 (7 файлов) | Pressure map + alerts + gauge + trend                                  |
| `CustomMetricsPanel`       |            327 | Custom metrics (+custom-metrics-service.ts)                            |
| `TopologyGalleryPanel`     |            203 | Topology visualization (route id `topology-templates`)                 |

### 3.4. Service Registry

| Панель                 |          Строк | Что показывает                                                                                                                                |
| ---------------------- | -------------: | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `ServiceRegistryPanel` | 392 (8 файлов) | Service list + statuses (phase/uptime/servicesReady/servicesTotal) + detail panel + unmapped panel + status bar (route id `service-registry`) |
| `AlertLayer`           |            327 | Notification display (overlay) (+тест)                                                                                                        |

**ServiceRegistryPanel возможности:**

- Search services
- Filter by tab
- Status: `phase`, `uptime`, `servicesReady`, `servicesTotal`
- Detail panel per service
- Unmapped services panel
- Export decisions

### 3.5. 🆕 Новые панели (добавлены после 2026-10-31)

| Панель            |       Строк | Что показывает                                                                        | Route id     | Тест |
| ----------------- | ----------: | ------------------------------------------------------------------------------------- | ------------ | ---- |
| `SREAgentPanel`   | 480 + 7 sub | SRE-агент: suggestions, alerts, what-if, caching advice, metric cards, auto-fix       | `sre`        | ✅   |
| `ExceptionsPanel` |         286 | Управление шаблонами исключений (exception-store, exception-veto, scopes/match modes) | `exceptions` | —    |
| `EventsTimeline`  |         612 | Timeline событий (legacy маршрут `/timeline`)                                         | legacy       | ✅   |
| `UsageHeatmap`    |         113 | Heatmap использования ключей (внутри ProviderManager/ResourcePoolsView)               | встроен      | ✅   |
| `DefectMapPanel`  |         395 | Регистрация/карта дефектов (defect-store, классы, severity)                           | `defect-map` | —    |

---

## 4. Анализ по 6 вопросам

### 4.1. Вопрос 1: Можно ли увидеть состояние сервиса?

**✅ ДА — частично.**

**ServiceRegistryPanel** (392 строки):

- `status: { phase, uptime, servicesReady, servicesTotal }` — visible
- Service list с search + filter
- Detail panel per service
- Unmapped services panel

**HealthPanel.KernelServicesSection:**

- Состояние kernel сервисов
- Vitals (CPU/memory/throughput/tokens)

**НО:**

- **15+ background timers** (Resource Map §4) — **нет UI** для «все активные timers»
- **CircuitBreaker state** — нет UI
- **MemoryWatchdog** — heap только в логах (появились `onPressure` + eventBus, UI по-прежнему нет)
- **Subscription stats** — `eventBus.getSubscriptionStats()` существует (event-bus.ts:303), но нет UI

**Вердикт:** 🟡 **6/10** — service state виден в ServiceRegistryPanel, но 4 ключевых runtime states без UI.

### 4.2. Вопрос 2: Понятно ли, почему панель не работает?

**✅ ДА — хорошо.**

**3-уровневая error recovery** (см. Lifecycle Map §13):

1. **Panel-level ErrorBoundary** — ловит React render errors, показывает error UI + Reload button, emits `EVENTS.ERROR_BOUNDARY_CAUGHT` + `EVENTS.NOTIFICATION`
2. **App-level GlobalErrorBoundary** — fallback на `window.location.reload()`
3. **Global handlers** (main.tsx) — `unhandledrejection` + `error` (EH6-04)

**EVIDENCE:**

- `EVENTS.NOTIFICATION` — **16 references** (прямых `EVENTS.NOTIFICATION`; событие `system:notification`, event-bus.ts:259) — механизм жив, но масштаб использования сократился с 195
- `EVENTS.ERROR_BOUNDARY_CAUGHT` — 2 refs (определение в event-registry-group-1 + observability-events.ts)
- AlertLayer (327 строк) — notification display overlay (+тест)
- ErrorBoundary имеет `variant: 'panel' | 'page'` + Reset button (+тест ErrorBoundary.test.tsx)

**Вердикт:** 🟢 **8/10** — ошибки видны, есть reload, notifications работают.

### 4.3. Вопрос 3: Видны ли ошибки инициализации?

**🟡 ЧАСТИЧНО.**

**Backend (есть):**

- `Bootstrap.phase` state machine: `pending → kernel → services → topology → ready/degraded/failed`
- `Bootstrap.getPhase(): InitPhase` — method exists
- `LifecycleManager.getStatuses(): InitStatus[]` — returns `{name, status: 'ok'|'error'|'skipped', error?}[]` (lifecycle-manager.ts, 185 строк)
- `LifecycleManager.tryInit` — 3 retries с exponential backoff, log on failure
- `CRITICAL_SERVICES` check — aborts if critical fails
- `phase = 'degraded'` — app continues on partial failure

**UI (НЕТ):**

- **Bootstrap report UI** — не найдено
- **LifecycleManager.getStatuses() в UI** — не найдено
- **Phase visibility для пользователя** — только `runtimeStatus: 'online'|'degraded'|'offline'` в Sidebar (3-state)

**Вердикт:** 🟡 **5/10** — backend tracking отличный, но UI показывает только 3-state summary, не детальный init report.

### 4.4. Вопрос 4: Можно ли отследить цепочку выполнения?

**✅ ДА — отлично.**

**TracesPanel** (718 строк) — 6 sub-components:

1. `CognitiveMicroscope` — cognitive trace inspection
2. `DecisionGraph` — decision graph visualization
3. `MicroscopeTimeline` — timeline view
4. `StepAnalysisPanel` — per-step analysis
5. `TopologyTraceView` — topology trace
6. `TraceDebugger` — interactive debugging

**🆕 TraceService (backend)** — сервисный tracing: активные traces, TraceRepository, персистенция с retry, `getTraces()/getTraceStats()`. `MonitoringService` потребляет его.

**AgentJournalPanel** — «журнал супервайзеров» execution trail с JournalEntryCard + StatMini + filter by agent.

**RouterTraceView** — routing decisions trace (246 строк).

**DecisionLogPanel** (299) — decision history + export.

**AuditLogView** (366) — audit log + export (JSON + CSV).

**EVIDENCE:** `cognitiveService.getTraces()` используется в TracesPanel ✅ (TracesPanel.tsx:31); `traceService.getTraces()` в monitoring-service ✅

**Вердикт:** 🟢🟢 **9/10** — богатая trace infrastructure, 6 sub-components в TracesPanel + новый сервисный TraceService.

### 4.5. Вопрос 5: Видны ли активные агенты и задачи?

**✅ ДА — хорошо.**

**TasksPanel** (903 строки):

- Kanban (5 колонок: pending/running/completed/failed + AGEMS)
- Stats (active/queued/completed/exceptions)
- Filter (all/running/completed/failed)
- AGEMS tasks separate
- Pipeline execution view

**AgentsPanel** (30 компонентов):

- AgentStatsDashboard, LiveActivityStream, EloLeaderboard
- AgentHistoryTab, AgentIdentityEditor, AgentCapabilitiesTab, AgentConfigTab
- AgentDetailPanel, AgentGroupsSection, AgentHandoffsTab, AgentInfraTab
- AgentObservabilityTab, AgentPolicySection, AgentProfileTab
- AgentsTable, AgentsPanelContainer, AgentsPanelView, AgentsPanelContext
- QuickCreateAgentModal, agent-templates, sidebar-tabs

**MissionControl** (LiveCognition) — live workspace с ControlActions, EventLog, LiveStatCard.

**🆕 SREAgentPanel** (480 строк) — мониторинг здоровья провайдеров/ключей, оптимизационные рекомендации.

**НО:**

- **Нет unified «all agents current state» overview** (Capability Gap Map §6.1)
- 30 компонентов в AgentsPanel — fragmented

**Вердикт:** 🟢 **7/10** — активные tasks и agents видны, но нет unified single view.

### 4.6. Вопрос 6: Можно ли определить источник проблемы?

**🔴 НЕТ — главный observability gap.**

**0 cross-panel navigate() в diagnostic panels** (Integration Map §3.5):

| Diagnostic panel    | Cross-nav calls |
| ------------------- | --------------: |
| LogsPanel           |           **0** |
| TracesPanel         |           **0** |
| HealthPanel         |           **0** |
| StateInspectorPanel |           **0** |
| DiagnosticPanel     |           **0** |
| AuditLogView        |           **0** |
| DecisionLogPanel    |           **0** |
| AgentJournalPanel   |           **0** |

**Пример missing links:**

- HealthPanel (red provider) → ProviderManager — **НЕТ**
- TracesPanel (trace agent X) → AgentsPanel — **НЕТ**
- LogsPanel (error from service Y) → ServiceRegistryPanel — **НЕТ**
- StateInspectorPanel (state issue) → relevant panel — **НЕТ**
- DecisionLogPanel (decision based on crystal Y) → CrystalVaultPanel — **НЕТ**
- AuditLogView (audit event) → source — **НЕТ**

**Вердикт:** 🔴 **2/10** — diagnostic panels показывают симптомы, но **не ведут к source**. Пользователь должен сам переключиться.

---

## 5. 🔴 6 ключевых diagnostics без UI exposure

### 5.1. MemoryWatchdog — heap только в логах

**Backend:** `src/kernel/utils/memory-watchdog.ts` (108 строк) — логирует heap каждые 5s, warns при growth > 100 MB или absolute > 200 MB. **🆕** появились `onPressure(cb)` callback'и и необязательный `eventBus`, `absoluteThresholdMB` по умолчанию 200.

**UI:** ❌ **НЕТ** — данные только в logger.

**Gap:** пользователь не видит heap pressure в UI.

### 5.2. DeadLetterQueue — сервис выделен, UI нет

**Backend:** **🆕** `src/kernel/services/dead-letter-queue-service.ts` (76 строк) + контракт `contracts/dead-letter-queue.ts` (`IDeadLetterQueue`: push/list/drain) + `event-bus-deadletter.test.ts`. Раньше DLQ существовал только как sink внутри event-bus тестов.

**UI:** ❌ **НЕТ** — DLQ не visible.

**Gap:** failed events копятся в DLQ без UI warning.

### 5.3. CircuitBreaker state — no UI

**Backend:** `src/llm/decorators/circuit-breaker.ts` (421 строка) + тест, decorators на LLM adapters.

**UI:** ❌ **НЕТ** — circuit breaker state не visible.

**Gap:** если circuit breaker open для провайдера — пользователь не знает.

### 5.4. Bootstrap report — no UI

**Backend:** `Bootstrap.getPhase()`, `LifecycleManager.getStatuses()`, `InitStatus[]`.

**UI:** ❌ **НЕТ** — только `runtimeStatus: online/degraded/offline` в Sidebar.

**Gap:** если init упал на service X — user не знает какой.

### 5.5. Event registry — 286 schemas, no UI

**Backend:** `event-registry.ts` реорганизован: **🆕 9 групп** в `src/kernel/events/registry-groups/` (session-binding 53, conversation-core-lifecycle 34, trust-ecosystem 49, rival-parity 60, deploy-bundle 50, persona 18, provider-catalog 16, debate-extras 1, python-runtime 5 = **286 schemas**; было 198).

**UI:** ❌ **НЕТ** — нет panel «all events».

**Gap:** невозможно увидеть все events и кто subscribe.

### 5.6. Subscription stats — method без UI

**Backend:** `eventBus.getSubscriptionStats()` — метод существует (`event-bus.ts:303`, возвращает `{ totalCallbacks, perEvent }`), используется только в тестах.

**UI:** ❌ **НЕТ** — не вызывается из UI.

**Gap:** невозможно увидеть active subscription count.

---

## 6. Cross-nav audit — где нет «Open in X» links

| Из diagnostic panel                          | К source panel       | Link?      |
| -------------------------------------------- | -------------------- | ---------- |
| HealthPanel (red provider)                   | ProviderManager      | 🔴 **НЕТ** |
| HealthPanel (kernel service error)           | ServiceRegistryPanel | 🔴 **НЕТ** |
| TracesPanel (trace agent X)                  | AgentsPanel          | 🔴 **НЕТ** |
| TracesPanel (trace debate Y)                 | DebatePanel          | 🔴 **НЕТ** |
| LogsPanel (error from service Y)             | ServiceRegistryPanel | 🔴 **НЕТ** |
| StateInspectorPanel (state issue)            | relevant panel       | 🔴 **НЕТ** |
| DecisionLogPanel (decision based on crystal) | CrystalVaultPanel    | 🔴 **НЕТ** |
| AuditLogView (audit event from panel X)      | panel X              | 🔴 **НЕТ** |
| PressureMapPanel (pressure on provider)      | ProviderManager      | 🔴 **НЕТ** |
| PerformanceProfilerPanel (slow service)      | ServiceRegistryPanel | 🔴 **НЕТ** |
| AgentJournalPanel (entry from agent X)       | AgentsPanel          | 🔴 **НЕТ** |
| DiagnosticPanel (issue detected)             | source panel         | 🔴 **НЕТ** |

**12 missing cross-nav links** — это **главный observability gap**.

---

## 7. Сводная матрица observability по 6 вопросам

| Вопрос                          |   Оценка   | Комментарий                                                    |
| ------------------------------- | :--------: | -------------------------------------------------------------- |
| 1. Состояние сервиса?           |  🟡 6/10   | ServiceRegistryPanel rich, но 4 runtime states без UI          |
| 2. Почему панель не работает?   |  🟢 8/10   | 3-уровневая error recovery, 16 NOTIFICATION refs               |
| 3. Ошибки инициализации?        |  🟡 5/10   | Backend отличный, UI только 3-state                            |
| 4. Цепочка выполнения?          | 🟢🟢 9/10  | TracesPanel 6 sub-components + AgentJournal + TraceService     |
| 5. Активные агенты/задачи?      |  🟢 7/10   | TasksPanel + AgentsPanel + MissionControl + SRE, но fragmented |
| 6. Источник проблемы?           |  🔴 2/10   | 0 cross-nav из diagnostics                                     |
| **Overall Observability Score** | **6.0/10** | Богатая инфраструктура, fragmented, без unified dashboard      |

---

## 8. «Объясни своё состояние» — self-explanation capability audit

### 8.1. Что ОС может объяснить о себе

| Что                         | Backend                                | UI                                                    | Self-explanation? |
| --------------------------- | -------------------------------------- | ----------------------------------------------------- | ----------------- |
| Текущая phase bootstrap     | ✅ getPhase()                          | 🟡 только online/degraded/offline в sidebar           | 🟡 partial        |
| Service init status         | ✅ getStatuses()                       | 🟡 ServiceRegistryPanel показывает, но не init errors | 🟡 partial        |
| Service dependencies        | ✅ DI graph                            | ✅ ServiceRegistryPanel.DetailPanel                   | 🟢 yes            |
| Active traces               | ✅ TraceService + cognitiveService     | ✅ TracesPanel 6 sub-components                       | 🟢 yes            |
| Active agents               | ✅ agentService.getAgents()            | ✅ AgentsPanel (30 components)                        | 🟢 yes            |
| Active tasks                | ✅ cognitiveService + agemsTaskService | ✅ TasksPanel kanban                                  | 🟢 yes            |
| Active debates              | ✅ debateEngine.getAllSessions()       | ✅ DebateArena + DebatesManagerPanel                  | 🟢 yes            |
| Health vitals               | ✅ adminService.getSystemHealth()      | ✅ HealthPanel 6 sections                             | 🟢 yes            |
| Probe results               | ✅ probeService                        | ✅ ProbeResultsSection                                | 🟢 yes            |
| Rate limits                 | ✅ keyStateStore                       | ✅ RateLimitIntrospection                             | 🟢 yes            |
| Errors (React)              | ✅ ErrorBoundary                       | ✅ error UI + reload                                  | 🟢 yes            |
| Errors (async)              | ✅ unhandledrejection handler          | ✅ EVENTS.NOTIFICATION → AlertLayer                   | 🟢 yes            |
| Errors (sync outside React) | ✅ global error handler (EH6-04)       | ✅ EVENTS.NOTIFICATION                                | 🟢 yes            |
| Decisions made              | ✅ decisionLogService                  | ✅ DecisionLogPanel                                   | 🟢 yes            |
| Audit trail                 | ✅ auditLogService                     | ✅ AuditLogView                                       | 🟢 yes            |
| Heap usage                  | ✅ MemoryWatchdog (+onPressure)        | 🔴 **только в логах**                                 | 🔴 NO             |
| Failed events (DLQ)         | ✅ dead-letter-queue-service           | 🔴 **нет UI**                                         | 🔴 NO             |
| Circuit breaker state       | ✅ circuitBreakerDecorator             | 🔴 **нет UI**                                         | 🔴 NO             |
| Event registry              | ✅ 286 schemas (9 групп)               | 🔴 **нет UI**                                         | 🔴 NO             |
| Active subscriptions        | ✅ getSubscriptionStats()              | 🔴 **нет UI**                                         | 🔴 NO             |
| Background timers           | ✅ 15+ setInterval                     | 🔴 **нет UI**                                         | 🔴 NO             |
| Bootstrap report            | ✅ BootstrapReport type                | 🔴 **нет UI**                                         | 🔴 NO             |

### 8.2. Self-explanation scorecard

| Capability                        |             Score              |
| --------------------------------- | :----------------------------: |
| Что происходит сейчас (state)     |            🟢 8/10             |
| Что делалось (history/traces)     |            🟢 9/10             |
| Почему сломалось (errors)         |            🟢 8/10             |
| Где источник проблемы (source ID) |            🔴 2/10             |
| Что под капотом (internals)       | 🟡 5/10 (6 diagnostics без UI) |
| **Overall self-explanation**      |           **6.0/10**           |

---

## 9. Главные observability gaps

### 9.1. 🔴 Cross-nav из diagnostic panels (critical)

**Проблема:** 0 cross-panel navigation из 8 diagnostic panels (проверено: 0 рефов `navigate(`/`useNavigate`). 12 missing links identified.

**Влияние:** пользователь видит симптом (red provider, error log, failed trace), но должен **вручную** найти source panel.

**Fix:** добавить «Open in X» buttons (см. Opportunity Map 3.2, 3.6).

### 9.2. 🔴 6 diagnostics без UI exposure

**Проблема:** MemoryWatchdog, DLQ, CircuitBreaker, Bootstrap report, Event registry, Subscription stats — все backend есть (DLQ теперь отдельный сервис), UI нет.

**Влияние:** «invisible» runtime states. Пользователь не знает о heap pressure, failed events в DLQ, open circuit breakers.

**Fix:** wire to UI (HealthPanel extensions или новые panels).

### 9.3. 🟡 Fragmented observability — нет unified dashboard

**Проблема:** 23+ observability панелей, нет single «system state» view.

**Влияние:** для понимания «что происходит» нужно открыть 3–5 панелей.

**Fix:** unified SystemDashboard (или расширить DashboardPanel).

### 9.4. 🟡 HealthSlaPanel — выпал из nav

**Проблема:** раньше `@deprecated MOCK` visible в nav; теперь панель переведена на реальный `healthSlaService`, но id `health-sla` отсутствует в route-registry — **в nav не видна** (доступна только через deep-link/PANEL_COMPONENTS).

**Влияние:** SLA-управление недоступно из интерфейса.

**Fix:** зарегистрировать маршрут или удалить (если не нужно).

### 9.5. 🟡 Bootstrap report не exposed

**Проблема:** `Bootstrap.getPhase()` + `LifecycleManager.getStatuses()` — backend отличный, UI только 3-state sidebar.

**Влияние:** если init упал на service X — user видит «degraded» но не знает какой service.

**Fix:** Bootstrap Report panel (или раздел в ServiceRegistryPanel).

---

## 10. Сильные стороны observability (что работает хорошо)

### 10.1. TracesPanel — богатая trace infrastructure

**6 sub-components:**

- `CognitiveMicroscope` — inspect cognitive trace
- `DecisionGraph` — decision graph viz
- `MicroscopeTimeline` — timeline view
- `StepAnalysisPanel` — per-step analysis
- `TopologyTraceView` — topology trace
- `TraceDebugger` — interactive debug

### 10.2. 🆕 TraceService — сервисный tracing

- `TraceService` (539 строк) + `TraceRepository`
- Персистенция с retry (MAX_RETRY_ATTEMPTS=3), активные traces
- `getTraces()/getTraceStats()`, PII-редэкция
- Потребляется `MonitoringService`

### 10.3. 3-уровневая error recovery

- Panel-level ErrorBoundary (с Reset)
- App-level GlobalErrorBoundary (с reload)
- Global handlers (unhandledrejection + error)
- `EVENTS.NOTIFICATION` (16 refs)
- `EVENTS.ERROR_BOUNDARY_CAUGHT` (2 refs)
- AlertLayer notification overlay

### 10.4. ServiceRegistryPanel — rich service browser

- Service list с search + filter
- Status: phase, uptime, servicesReady, servicesTotal
- Detail panel per service
- Unmapped services panel
- Export decisions

### 10.5. AgentJournalPanel — execution trail

- «Журнал супервайзеров» framing
- JournalEntryCard + StatMini
- Filter by agent
- resolveAgentIdentity for avatar

### 10.6. Bootstrap state machine

- 6 phases (pending/kernel/services/topology/ready/degraded/failed)
- CRITICAL_SERVICES check
- Degraded mode (continue on partial failure)
- 3 retries с exponential backoff

### 10.7. HealthPanel — 6 sections

- KernelServicesSection
- DistributedNodesSection
- ProbeResultsSection
- HealthScoreSection
- HealthTimelineSection
- RateLimitIntrospection

### 10.8. 🆕 SREAgentPanel — мониторинг провайдеров

- MetricCards, alerts, suggestions
- What-if, caching advice, auto-fix
- Тест SREAgentPanel.test.tsx

---

## 11. Рекомендации

### 🔴 P0 — закрыть critical observability gaps

1. **Add cross-nav links из diagnostic panels** (12 missing links, см. §6). HealthPanel→ProviderManager, TracesPanel→AgentsPanel, LogsPanel→ServiceRegistry, etc. (см. Opportunity Map 3.2, 3.6).

2. **Wire MemoryWatchdog to UI** — добавить heap gauge в HealthPanel (или отдельная `ResourceMonitorPanel`). Сейчас только в логах (плюс появились `onPressure`-колбэки — осталось вывести в UI).

3. **Wire DeadLetterQueue to UI** — показать failed events count + list. DLQ panel или раздел в HealthPanel (сервис `dead-letter-queue-service.ts` уже готов).

4. **Wire CircuitBreaker state to UI** — показать open/half-open/closed per provider в ProviderManager или HealthPanel.

5. **Add Bootstrap Report panel** — показать `getPhase()` + `getStatuses()` (список сервисов инициализации). Сейчас только 3-state sidebar.

6. **Add Event Registry panel** — показать 286 event schemas (9 групп), кто emit, кто subscribe. Сейчас event-registry.ts без UI.

### 🟡 P1 — улучшить existing observability

7. **Add Subscription stats UI** — `eventBus.getSubscriptionStats()` метод существует (event-bus.ts:303), вызвать из UI (HealthPanel или Event Registry panel).

8. **Add Background Services overview** — показать 15+ `setInterval` timers (name, interval, last tick, next tick, error count).

9. **Register HealthSlaPanel в nav** — панель переведена на реальный сервис (не MOCK), но пропала из route-registry.

10. **Merge SystemHealthPanel в HealthPanel** — убрать overlap (HealthHub уже объединяет табами; см. Duplication Map §3.2).

11. **Add unified SystemDashboard** — single view: phase + services + traces + errors + heap + DLQ + circuit breakers.

### 🟢 P2 — strategic observability

12. **Add OpenTelemetry-style tracing** — distributed tracing across services (появился TraceService — расширять до трассировки между сервисами).

13. **Add observability for cognitive chain** — trace debate → synthesis → crystal → forum pipeline end-to-end.

14. **Add «explain this error» AI feature** — LLM-powered error explanation для non-technical users.

15. **Add observability dashboard export** — export diagnostics bundle для bug reports (logs + traces + state + heap).

---

## 12. Итоговый вердикт по observability

| Метрика                         |   Оценка   | Комментарий                        |
| ------------------------------- | :--------: | ---------------------------------- |
| Observability панелей           |  🟢 8/10   | 23+ панелей, rich                  |
| HealthPanel sections            |  🟢 9/10   | 6 sections                         |
| TracesPanel sub-components      | 🟢🟢 10/10 | 6 sub-components + TraceService    |
| Error recovery                  | 🟢🟢 9/10  | 3-уровневая + 16 NOTIFICATION refs |
| Bootstrap tracking              |  🟢 8/10   | 6 phases + retries + degraded      |
| Service Registry                |  🟢 8/10   | Rich browser с statuses            |
| Cross-nav из diagnostics        |  🔴 2/10   | **0 links** — critical gap         |
| 6 diagnostics UI exposure       |  🔴 2/10   | Все без UI                         |
| Unified dashboard               |  🔴 3/10   | Fragmented                         |
| Self-explanation capability     |  🟡 6/10   | Backend excellent, UI partial      |
| **Overall Observability Score** | **6.0/10** | Богатая инфраструктура, fragmented |

**Сильные стороны:**

- **23+ observability панелей** — богатый выбор (+5 новых)
- **TraceService** — сервисный tracing с персистенцией (новое)
- **TracesPanel** — 6 sub-components, лучшая trace infrastructure
- **3-уровневая error recovery** — panel + app + global
- **16 EVENTS.NOTIFICATION refs** — error notification работает
- **ServiceRegistryPanel** — rich service browser
- **Bootstrap state machine** — 6 phases, retries, degraded mode
- **AgentJournalPanel** — execution trail с filter

**Слабые стороны:**

- **0 cross-nav из diagnostic panels** — главный gap, пользователь не может найти source
- **6 ключевых diagnostics без UI** (MemoryWatchdog, DLQ, CircuitBreaker, Bootstrap report, Event registry, Subscription stats)
- **Нет unified «explain state» dashboard** — данные fragmented
- **HealthSlaPanel** — больше не MOCK, но выпал из nav
- **Diagnostic panels изолированы** — TracesPanel/HealthPanel/LogsPanel не связаны

**Главный вывод (как предсказывало задание):** «Насколько сама ОС способна объяснить своё состояние» — **6.0/10**. Backend observability отличный (state machine, statuses, traces, error recovery, новый TraceService), но **UI fragmented** и **6 ключевых diagnostics invisible**. ОС **может** объяснить state через 23+ панелей, но **не ведёт** пользователя от симптома к source.

**Главный рычаг:** закрыть 12 cross-nav links + wire 6 diagnostics to UI + create unified dashboard. Это поднимет observability score с 6.0 до ~8.0/10.

---

## Приложение A. Все observability-метрики в цифрах

| Метрика                           |                                                   Значение | Источник                                         |
| --------------------------------- | ---------------------------------------------------------: | ------------------------------------------------ |
| Observability панелей             |                                                        23+ | Test-Path + Get-ChildItem                        |
| HealthPanel секций                |                                                          6 | чтение                                           |
| TracesPanel sub-components        |                                                          6 | ls                                               |
| ServiceRegistryPanel строк        |                                             392 + 8 файлов | wc -l                                            |
| StateInspectorPanel строк         |                                                292 + 3 sub | wc -l                                            |
| Bootstrap phases                  | 6 (pending/kernel/services/topology/ready/degraded/failed) | bootstrap.ts                                     |
| CRITICAL_SERVICES                 |      4 (kernel, configService, keyService, pricingService) | bootstrap-phases.ts                              |
| LifecycleManager.getStatuses()    |                                           ✅ method exists | lifecycle-manager.ts                             |
| InitStatus type                   |           {name, status: 'ok'\|'error'\|'skipped', error?} | lifecycle-manager.ts                             |
| tryInit retries                   |                                    3 + exponential backoff | lifecycle-manager.ts                             |
| TraceService строк                |                                    539 + trace-context 100 | wc -l                                            |
| ErrorBoundary уровней             |                                   3 (panel + app + global) | ErrorBoundary + GlobalErrorBoundary + main.tsx   |
| EVENTS.NOTIFICATION references    |                                                     **16** | grep                                             |
| EVENTS.ERROR_BOUNDARY_CAUGHT refs |                                                          2 | grep                                             |
| AlertLayer строк                  |                                                        327 | wc -l                                            |
| AgentJournalPanel строк           |                                          420 + 4 sub-файла | wc -l                                            |
| DecisionLogPanel строк            |                                                        299 | wc -l                                            |
| AuditLogView строк                |                                                        366 | wc -l                                            |
| Схем событий (event registry)     |                                                    **286** | grep event(' в 9 группах                         |
| MemoryWatchdog UI                 |                                                     ❌ нет | grep                                             |
| DeadLetterQueue UI                |                                                     ❌ нет | grep (сервис есть: dead-letter-queue-service.ts) |
| CircuitBreaker state UI           |                                                     ❌ нет | grep                                             |
| Bootstrap report UI               |                                                     ❌ нет | grep                                             |
| Event registry UI (286 schemas)   |                                                     ❌ нет | grep                                             |
| Subscription stats UI             |                              ❌ нет (method exists, 1 ref) | grep                                             |
| Cross-nav из diagnostic panels    |                                                      **0** | grep per panel                                   |
| Missing cross-nav links           |                                                         12 | this report                                      |
| runtimeStatus в Sidebar           |                          3-state (online/degraded/offline) | Sidebar.tsx                                      |
| Background timers без UI          |                                                        15+ | Resource Map                                     |

---

## Приложение B. Источники и метод

| Что                          | Где                                                     | Как проверено                                                                       |
| ---------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Observability panels         | `src/components/`                                       | Test-Path + ls + grep health\|trace\|log\|debug\|diagnostic\|sre\|exception\|defect |
| HealthPanel sections         | `src/components/HealthPanel/`                           | ls + чтение imports                                                                 |
| TracesPanel sub-components   | `src/components/TracesPanel/`                           | ls                                                                                  |
| ServiceRegistryPanel         | `src/components/ServiceRegistryPanel/` (8 файлов)       | wc -l + head                                                                        |
| Route-registry (подключение) | `src/route-registry-*.ts`, `src/route-imports.ts`       | Select-String по id                                                                 |
| Bootstrap phases             | `src/kernel/bootstrap.ts`                               | grep phase                                                                          |
| LifecycleManager             | `src/kernel/services/lifecycle-manager.ts`              | grep statuses                                                                       |
| TraceService                 | `src/kernel/services/trace-service.ts`                  | чтение + wc -l                                                                      |
| Error events                 | `src/kernel/events/event-names.ts`, `event-registry.ts` | grep ERROR\|NOTIFICATION                                                            |
| EVENTS.NOTIFICATION usage    | `src/`                                                  | Select-String -Pattern "EVENTS.NOTIFICATION"                                        |
| ErrorBoundary                | `src/components/Common/ErrorBoundary.tsx`               | полное чтение (см. Lifecycle Map)                                                   |
| Cross-nav audit              | `src/components/{Logs,Traces,Health,StateInspector}*/`  | grep navigate() per dir                                                             |
| MemoryWatchdog UI            | `src/components/`                                       | grep memoryWatchdog                                                                 |
| DLQ UI                       | `src/components/`                                       | grep deadLetter                                                                     |
| CircuitBreaker UI            | `src/components/`                                       | grep circuitBreaker                                                                 |
| Event registry UI            | `src/components/`                                       | grep event-registry\|EventRegistry                                                  |
| Subscription stats           | `src/`                                                  | grep getSubscriptionStats                                                           |
| runtimeStatus в Sidebar      | `src/components/Sidebar.tsx`                            | grep runtimeStatus                                                                  |
| Свежая карта реальности      | `docs/wiki/dev-reality-map.md` (2026-11-17, HEAD)       | чтение (сверка метрик)                                                              |

---

## Сверка с аудитами (волны 2–8)

Дополнительные факты по наблюдаемости из волн аудитов:

- W2-033: TraceRepository хранил raw input/output (исправлено: PII-редэкция; TraceService продолжает редэктить).
- W2-034: LoggerService exportLogs отдавал raw meta.
- W4-011: alert-события (BUDGET/METRICS/AGENT_HEALTH/SYSTEM_HEALTH/KEY_COMPROMISED) не уходят в alerting-каналы; Webhook не в bootstrap.
- W6-003: фабрикация percentiles в UI (исправлено: «—» без данных).
- W6-033: counters/gauges не персистятся (исправлено: `persist counters and gauges (W6-033)` в git log).
- W8-020: SSE без Last-Event-ID — события теряются на реконнекте.
- W5-006: nginx отдаёт X-Real-IP/XFF провайдерам.
- W6-029: sync-server SIGTERM закрывал только HTTP-listener (исправлено: WS/SSE drain).

---

## Приложение C. Изменения с 2026-10-31 (git log HEAD~30 → HEAD)

| Область              | Что изменилось                                                                                                                                                       | Как проверено                 |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| Новые панели         | `SREAgentPanel` (480+7 sub, тест), `ExceptionsPanel` (286), `EventsTimeline` (612, тест), `UsageHeatmap` (113, тест, внутри ProviderManager), `DefectMapPanel` (395) | Test-Path + git log           |
| Health               | `HealthHub` (57) — таб-агрегатор health/system; `DocsHealthPanel` 260 + тест; `HealthSlaPanel` 424, больше не MOCK, вне nav                                          | чтение + grep deprecated/MOCK |
| Tracing              | `TraceService` (539) + `trace-context.ts` (100) + `TraceRepository` — сервисный tracing с персистенцией и retry                                                      | чтение + wc -l                |
| Observability-сервис | `project-observability-service.ts` (130) — activity/tool calls/errors/file changes                                                                                   | чтение                        |
| DLQ                  | `dead-letter-queue-service.ts` (76) + контракт `IDeadLetterQueue`                                                                                                    | чтение                        |
| Agent health         | `agent-health-monitor.ts` (276) + тест — мониторинг здоровья агентов                                                                                                 | чтение                        |
| Event registry       | Реорганизован в 9 групп `registry-groups/`, **198 → 286 schemas**                                                                                                    | grep event(' по группам       |
| Events               | `EVENTS.NOTIFICATION` 195 → 16 refs; `ERROR_BOUNDARY_CAUGHT` 6 → 2 refs                                                                                              | Select-String                 |
| MemoryWatchdog       | `onPressure` callback'и + eventBus (UI по-прежнему нет)                                                                                                              | чтение                        |
| Минорные правки      | StateInspectorPanel/CustomMetricsPanel auto-clear errors (P2-12), hooks/стили, тесты трассировки, рендер wiki-артефактов                                             | git log                       |

---

_Отчёт актуализирован 2026-11-17 на основе коммита `ae2dad8` (было `e08ab8e`, 2026-10-31). Анализ статический (Test-Path, Select-String, Get-ChildItem, git log); runtime observability (actual dashboard screenshots) не проводился. Парные отчёты: 13 предыдущих карт (готовность, ценность, техсостояние, ресурсы, дублирование, зависимости, lifecycle, доступность, пробелы, интеграция, user journeys, потенциал, мёртвый код)._
