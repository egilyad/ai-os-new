# Карта наблюдаемости и диагностики — Observability & Diagnostics Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `e08ab8e` (Oct 31, 2026, ветка `main`)
> **Дата анализа:** 2026-10-31
> **Метод:** статический анализ observability-панелей (HealthPanel, TracesPanel, LogsPanel, ServiceRegistryPanel, StateInspectorPanel, etc.), bootstrap phase visibility, error events, AgentJournal, cross-nav из diagnostic panels, поиск UI exposure для MemoryWatchdog/DLQ/CircuitBreaker/EventRegistry
> **Парные документы:** 13 предыдущих карт
> **Главный результат:** **18 observability панелей** (богатая инфраструктура), **НО 6 ключевых diagnostics без UI exposure**, **0 cross-nav из diagnostic panels к source**, и **нет unified «объясни своё состояние» dashboard**.

---

## 1. Исполнительное резюме

SuperAgents OS имеет **богатую observability-инфраструктуру**: 18+ панелей для monitoring/tracing/debugging. Bootstrap имеет явный state machine (`pending → kernel → services → topology → ready/degraded/failed`), `LifecycleManager.getStatuses()` возвращает `InitStatus[]`, `ErrorBoundary` ловит errors на 3 уровнях (panel + app + global), `EVENTS.NOTIFICATION` имеет **195 references** — главная error-notification система.

**НО:**

- **0 cross-panel navigation из diagnostic panels** (Integration Map §3.5) — пользователь видит симптомы, но не может перейти к source
- **6 ключевых diagnostics без UI exposure**: MemoryWatchdog (heap в логах), DeadLetterQueue (service без UI), CircuitBreaker state (no UI), Bootstrap report (no UI), Event registry (198 schemas, no UI), Subscription stats (method exists, no UI)
- **Нет unified «объясни своё состояние» dashboard** — данные разбросаны по 18 панелям
- **HealthSlaPanel = `@deprecated MOCK`** — visible в nav, показывает simulated SLA

**Сводные метрики observability:**

| Метрика                             |                                                                                                   Значение | Оценка           |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------: | ---------------- |
| Observability панелей               |                                                                                                    **18+** | 🟢 много         |
| HealthPanel секций                  |    6 (KernelServices, DistributedNodes, ProbeResults, HealthScore, HealthTimeline, RateLimitIntrospection) | 🟢 rich          |
| TracesPanel sub-components          | 6 (CognitiveMicroscope, DecisionGraph, MicroscopeTimeline, StepAnalysis, TopologyTraceView, TraceDebugger) | 🟢 rich          |
| Bootstrap phases visible            |                                                 6 (pending/kernel/services/topology/ready/degraded/failed) | 🟢 но **нет UI** |
| LifecycleManager.getStatuses()      |                                                                                           ✅ method exists | 🟢 но **нет UI** |
| ErrorBoundary уровней               |                                                                          3 (panel + app + global handlers) | 🟢🟢 excellent   |
| EVENTS.NOTIFICATION references      |                                                                                                    **195** | 🟢 pervasive     |
| EVENTS.ERROR_BOUNDARY_CAUGHT        |                                                                                                     6 refs | 🟢 wired         |
| AlertLayer (notification UI)        |                                                                                                  341 строк | 🟢               |
| AgentJournalPanel (execution trail) |                                                                                                  ✅ exists | 🟢               |
| ServiceRegistryPanel                |                                                                             421 строка + 5 sub-компонентов | 🟢 rich          |
| **Cross-nav из diagnostic panels**  |                                                                                                      **0** | 🔴 NONE          |
| MemoryWatchdog UI                   |                                                                                          ❌ только в логах | 🔴               |
| DeadLetterQueue UI                  |                                                                                          ❌ service без UI | 🔴               |
| CircuitBreaker state UI             |                                                                                                   ❌ no UI | 🔴               |
| Bootstrap report UI                 |                                                                                                   ❌ no UI | 🔴               |
| Event registry UI (198 schemas)     |                                                                                                   ❌ no UI | 🔴               |
| Subscription stats UI               |                                                                                           ❌ method без UI | 🔴               |
| Unified «explain state» dashboard   |                                                                                                     ❌ нет | 🔴               |

**Главные сильные стороны:**

- **18 observability панелей** — богатый выбор
- **3-уровневая error recovery** (ErrorBoundary + GlobalErrorBoundary + global handlers)
- **195 EVENTS.NOTIFICATION refs** — pervasive error notification
- **ServiceRegistryPanel** (421 строка) — rich service browser с statuses + detail panel
- **TracesPanel** — 6 sub-components включая CognitiveMicroscope и DecisionGraph
- **Bootstrap state machine** — явный phase tracking

**Главные слабые стороны:**

- **0 cross-nav из diagnostic panels к source** — главный observability gap
- **6 ключевых diagnostics без UI exposure** (MemoryWatchdog, DLQ, CircuitBreaker, Bootstrap report, Event registry, Subscription stats)
- **Нет unified dashboard** — данные разбросаны
- **HealthSlaPanel = MOCK** visible в nav
- **Diagnostic panels изолированы** — TracesPanel/HealthPanel/LogsPanel не связаны

**Observability Score: 6.0/10** — богатая инфраструктура, но fragmented и без unified «explain state».

---

## 2. Методология: 6 вопросов

| #   | Вопрос                                 | Что проверяем                                                |
| --- | -------------------------------------- | ------------------------------------------------------------ |
| 1   | Можно ли увидеть состояние сервиса?    | ServiceRegistryPanel, HealthPanel, KernelServicesSection     |
| 2   | Понятно ли, почему панель не работает? | ErrorBoundary, error events, UI feedback                     |
| 3   | Видны ли ошибки инициализации?         | Bootstrap phase, LifecycleManager.getStatuses(), UI exposure |
| 4   | Можно ли отследить цепочку выполнения? | TracesPanel, AgentJournalPanel, RouterTraceView              |
| 5   | Видны ли активные агенты и задачи?     | AgentsPanel, TasksPanel, MissionControl                      |
| 6   | Можно ли определить источник проблемы? | Cross-nav из diagnostics, source identification              |

**Принцип:** «Насколько сама ОС способна объяснить своё состояние» — focus на **self-explanation capability**.

---

## 3. 18 Observability панелей — inventory

### 3.1. Health-домен (4 панели)

| Панель              | Строк | Что показывает                                                                                                                      |
| ------------------- | ----: | ----------------------------------------------------------------------------------------------------------------------------------- |
| `HealthPanel`       |   530 | Vitals (CPU/memory/throughput), KernelServices, DistributedNodes, ProbeResults, HealthScore, HealthTimeline, RateLimitIntrospection |
| `SystemHealthPanel` |   219 | Системное здоровье (overlap с HealthPanel)                                                                                          |
| `DocsHealthPanel`   |   218 | Documentation health (links, sources, completeness)                                                                                 |
| `HealthSlaPanel`    |   441 | 🔴 **`@deprecated MOCK`** — simulated SLA                                                                                           |

**HealthPanel секции (6):**

1. `KernelServicesSection` — состояние kernel сервисов
2. `DistributedNodesSection` — distributed nodes (keys + bees)
3. `ProbeResultsSection` — active probe results
4. `HealthScoreSection` — composite health score
5. `HealthTimelineSection` — timeline of health events
6. `RateLimitIntrospection` — rate limit status

### 3.2. Traces-домен (богатый)

| Панель              |       Строк | Что показывает                                                                                                                |
| ------------------- | ----------: | ----------------------------------------------------------------------------------------------------------------------------- |
| `TracesPanel`       |         743 | 6 sub-components: CognitiveMicroscope, DecisionGraph, MicroscopeTimeline, StepAnalysisPanel, TopologyTraceView, TraceDebugger |
| `RouterTraceView`   |           — | Routing decisions trace                                                                                                       |
| `AgentJournalPanel` | 383 (3 sub) | Execution trail «журнал супервайзеров»                                                                                        |
| `DecisionLogPanel`  |         312 | Decision history + export (JSON)                                                                                              |
| `AuditLogView`      |         376 | Audit log + export (JSON + CSV)                                                                                               |

### 3.3. Logs & State

| Панель                     |       Строк | Что показывает                        |
| -------------------------- | ----------: | ------------------------------------- |
| `LogsPanel`                |         520 | Log browser с filters                 |
| `StateInspectorPanel`      | 301 (3 sub) | Tree view state + StatBox             |
| `DiagnosticPanel`          |         565 | General diagnostics                   |
| `PerformanceProfilerPanel` |         265 | Performance profiling                 |
| `PressureMapPanel`         | 384 (5 sub) | Pressure map + alerts + gauge + trend |
| `CustomMetricsPanel`       |           — | Custom metrics                        |
| `TopologyGalleryPanel`     |           — | Topology visualization                |

### 3.4. Service Registry

| Панель                 |       Строк | Что показывает                                                                                                  |
| ---------------------- | ----------: | --------------------------------------------------------------------------------------------------------------- |
| `ServiceRegistryPanel` | 421 (5 sub) | Service list + statuses (phase/uptime/servicesReady/servicesTotal) + detail panel + unmapped panel + status bar |
| `AlertLayer`           |         341 | Notification display (overlay)                                                                                  |

**ServiceRegistryPanel возможности:**

- Search services
- Filter by tab
- Status: `phase`, `uptime`, `servicesReady`, `servicesTotal`
- Detail panel per service
- Unmapped services panel
- Export decisions

---

## 4. Анализ по 6 вопросам

### 4.1. Вопрос 1: Можно ли увидеть состояние сервиса?

**✅ ДА — частично.**

**ServiceRegistryPanel** (421 строка):

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
- **MemoryWatchdog** — heap только в логах
- **Subscription stats** — `eventBus.getSubscriptionStats()` существует, но нет UI

**Вердикт:** 🟡 **6/10** — service state виден в ServiceRegistryPanel, но 4 ключевых runtime states без UI.

### 4.2. Вопрос 2: Понятно ли, почему панель не работает?

**✅ ДА — хорошо.**

**3-уровневая error recovery** (см. Lifecycle Map §13):

1. **Panel-level ErrorBoundary** — ловит React render errors, показывает error UI + Reload button, emits `EVENTS.ERROR_BOUNDARY_CAUGHT` + `EVENTS.NOTIFICATION`
2. **App-level GlobalErrorBoundary** — fallback на `window.location.reload()`
3. **Global handlers** (main.tsx) — `unhandledrejection` + `error` (EH6-04)

**EVIDENCE:**

- `EVENTS.NOTIFICATION` — **195 references** — pervasive notification mechanism
- `EVENTS.ERROR_BOUNDARY_CAUGHT` — 6 refs — wired
- AlertLayer (341 строка) — notification display overlay
- ErrorBoundary имеет `variant: 'panel' | 'page'` + Reset button

**Вердикт:** 🟢 **8/10** — ошибки видны, есть reload, notifications pervasive.

### 4.3. Вопрос 3: Видны ли ошибки инициализации?

**🟡 ЧАСТИЧНО.**

**Backend (есть):**

- `Bootstrap.phase` state machine: `pending → kernel → services → topology → ready/degraded/failed`
- `Bootstrap.getPhase(): InitPhase` — method exists
- `LifecycleManager.getStatuses(): InitStatus[]` — returns `{name, status: 'ok'|'error'|'skipped', error?}[]`
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

**TracesPanel** (743 строки) — 6 sub-components:

1. `CognitiveMicroscope` — cognitive trace inspection
2. `DecisionGraph` — decision graph visualization
3. `MicroscopeTimeline` — timeline view
4. `StepAnalysisPanel` — per-step analysis
5. `TopologyTraceView` — topology trace
6. `TraceDebugger` — interactive debugging

**AgentJournalPanel** — «журнал супервайзеров» execution trail с JournalEntryCard + StatMini + filter by agent.

**RouterTraceView** — routing decisions trace.

**DecisionLogPanel** (312) — decision history + export.

**AuditLogView** (376) — audit log + export (JSON + CSV).

**EVIDENCE:** `cognitiveService.getTraces()` используется в TracesPanel ✅

**Вердикт:** 🟢🟢 **9/10** — богатая trace infrastructure, 6 sub-components в TracesPanel.

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
| DiagnosticPanel     |    (probably 0) |

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

**Backend:** `src/kernel/utils/memory-watchdog.ts` — логирует heap каждые 5s, warns при growth > 100 MB или absolute > 200 MB.

**UI:** ❌ **НЕТ** — данные только в logger.

**Gap:** пользователь не видит heap pressure в UI.

### 5.2. DeadLetterQueue — service без UI

**Backend:** `event-bus-deadletter.test.ts` существует (DLQ для failed events).

**UI:** ❌ **НЕТ** — DLQ не visible.

**Gap:** failed events копятся в DLQ без UI warning.

### 5.3. CircuitBreaker state — no UI

**Backend:** `circuit-breaker.test.ts` в stable gate, decorators на LLM adapters.

**UI:** ❌ **НЕТ** — circuit breaker state не visible.

**Gap:** если circuit breaker open для провайдера — пользователь не знает.

### 5.4. Bootstrap report — no UI

**Backend:** `Bootstrap.getPhase()`, `LifecycleManager.getStatuses()`, `InitStatus[]`.

**UI:** ❌ **НЕТ** — только `runtimeStatus: online/degraded/offline` в Sidebar.

**Gap:** если init упал на service X — user не знает какой.

### 5.5. Event registry — 198 schemas, no UI

**Backend:** `event-registry.ts` (2 772 строки, 198 event schemas).

**UI:** ❌ **НЕТ** — нет panel «all events».

**Gap:** невозможно увидеть все events и кто subscribe.

### 5.6. Subscription stats — method без UI

**Backend:** `eventBus.getSubscriptionStats()` — метод существует (1 ref в коде).

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

| Вопрос                          |   Оценка   | Комментарий                                               |
| ------------------------------- | :--------: | --------------------------------------------------------- |
| 1. Состояние сервиса?           |  🟡 6/10   | ServiceRegistryPanel rich, но 4 runtime states без UI     |
| 2. Почему панель не работает?   |  🟢 8/10   | 3-уровневая error recovery, 195 NOTIFICATION refs         |
| 3. Ошибки инициализации?        |  🟡 5/10   | Backend отличный, UI только 3-state                       |
| 4. Цепочка выполнения?          | 🟢🟢 9/10  | TracesPanel 6 sub-components + AgentJournal               |
| 5. Активные агенты/задачи?      |  🟢 7/10   | TasksPanel + AgentsPanel + MissionControl, но fragmented  |
| 6. Источник проблемы?           |  🔴 2/10   | 0 cross-nav из diagnostics                                |
| **Overall Observability Score** | **6.0/10** | Богатая инфраструктура, fragmented, без unified dashboard |

---

## 8. «Объясни своё состояние» — self-explanation capability audit

### 8.1. Что ОС может объяснить о себе

| Что                         | Backend                                | UI                                                    | Self-explanation? |
| --------------------------- | -------------------------------------- | ----------------------------------------------------- | ----------------- |
| Текущая phase bootstrap     | ✅ getPhase()                          | 🟡 только online/degraded/offline в sidebar           | 🟡 partial        |
| Service init status         | ✅ getStatuses()                       | 🟡 ServiceRegistryPanel показывает, но не init errors | 🟡 partial        |
| Service dependencies        | ✅ DI graph                            | ✅ ServiceRegistryPanel.DetailPanel                   | 🟢 yes            |
| Active traces               | ✅ cognitiveService.getTraces()        | ✅ TracesPanel 6 sub-components                       | 🟢 yes            |
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
| Heap usage                  | ✅ MemoryWatchdog                      | 🔴 **только в логах**                                 | 🔴 NO             |
| Failed events (DLQ)         | ✅ deadLetterQueue                     | 🔴 **нет UI**                                         | 🔴 NO             |
| Circuit breaker state       | ✅ circuitBreakerDecorator             | 🔴 **нет UI**                                         | 🔴 NO             |
| Event registry              | ✅ 198 schemas                         | 🔴 **нет UI**                                         | 🔴 NO             |
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

**Проблема:** 0 cross-panel navigation из 4 diagnostic panels. 12 missing links identified.

**Влияние:** пользователь видит симптом (red provider, error log, failed trace), но должен **вручную** найти source panel.

**Fix:** добавить «Open in X» buttons (см. Opportunity Map 3.2, 3.6).

### 9.2. 🔴 6 diagnostics без UI exposure

**Проблема:** MemoryWatchdog, DLQ, CircuitBreaker, Bootstrap report, Event registry, Subscription stats — все backend есть, UI нет.

**Влияние:** «invisible» runtime states. Пользователь не знает о heap pressure, failed events в DLQ, open circuit breakers.

**Fix:** wire to UI (HealthPanel extensions или новые panels).

### 9.3. 🟡 Fragmented observability — нет unified dashboard

**Проблема:** 18 observability панелей, нет single «system state» view.

**Влияние:** для понимания «что происходит» нужно открыть 3–5 панелей.

**Fix:** unified SystemDashboard (или расширить DashboardPanel).

### 9.4. 🟡 HealthSlaPanel = MOCK visible

**Проблема:** `@deprecated MOCK` HealthSlaPanel visible в nav, показывает simulated SLA.

**Влияние:** пользователь видит mock data без предупреждения.

**Fix:** hide или remove (см. Dead Code Map §3.2, Opportunity Map 3.7).

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

### 10.2. 3-уровневая error recovery

- Panel-level ErrorBoundary (с Reset)
- App-level GlobalErrorBoundary (с reload)
- Global handlers (unhandledrejection + error)
- `EVENTS.NOTIFICATION` pervasive (195 refs)
- `EVENTS.ERROR_BOUNDARY_CAUGHT` wired (6 refs)
- AlertLayer notification overlay

### 10.3. ServiceRegistryPanel — rich service browser

- Service list с search + filter
- Status: phase, uptime, servicesReady, servicesTotal
- Detail panel per service
- Unmapped services panel
- Export decisions

### 10.4. AgentJournalPanel — execution trail

- «Журнал супервайзеров» framing
- JournalEntryCard + StatMini
- Filter by agent
- resolveAgentIdentity for avatar

### 10.5. Bootstrap state machine

- 6 phases (pending/kernel/services/topology/ready/degraded/failed)
- CRITICAL_SERVICES check
- Degraded mode (continue on partial failure)
- 3 retries с exponential backoff

### 10.6. HealthPanel — 6 sections

- KernelServicesSection
- DistributedNodesSection
- ProbeResultsSection
- HealthScoreSection
- HealthTimelineSection
- RateLimitIntrospection

---

## 11. Рекомендации

### 🔴 P0 — закрыть critical observability gaps

1. **Add cross-nav links из diagnostic panels** (12 missing links, см. §6). HealthPanel→ProviderManager, TracesPanel→AgentsPanel, LogsPanel→ServiceRegistry, etc. (см. Opportunity Map 3.2, 3.6).

2. **Wire MemoryWatchdog to UI** — добавить heap gauge в HealthPanel (или отдельная `ResourceMonitorPanel`). Сейчас только в логах.

3. **Wire DeadLetterQueue to UI** — показать failed events count + list. DLQ panel или раздел в HealthPanel.

4. **Wire CircuitBreaker state to UI** — показать open/half-open/closed per provider в ProviderManager или HealthPanel.

5. **Add Bootstrap Report panel** — показать `getPhase()` + `getStatuses()` (549 services init status). Сейчас только 3-state sidebar.

6. **Add Event Registry panel** — показать 198 event schemas, кто emit, кто subscribe. Сейчас 2 772 строки event-registry.ts без UI.

### 🟡 P1 — улучшить existing observability

7. **Add Subscription stats UI** — `eventBus.getSubscriptionStats()` метод существует, вызвать из UI (HealthPanel или Event Registry panel).

8. **Add Background Services overview** — показать 15+ `setInterval` timers (name, interval, last tick, next tick, error count).

9. **Remove HealthSlaPanel** (MOCK) — либо merge в HealthPanel, либо удалить (см. Dead Code Map §3.2).

10. **Merge SystemHealthPanel в HealthPanel** — убрать overlap (см. Duplication Map §3.2).

11. **Add unified SystemDashboard** — single view: phase + services + traces + errors + heap + DLQ + circuit breakers.

### 🟢 P2 — strategic observability

12. **Add OpenTelemetry-style tracing** — distributed tracing across services (не только React traces).

13. **Add observability for cognitive chain** — trace debate → synthesis → crystal → forum pipeline end-to-end.

14. **Add «explain this error» AI feature** — LLM-powered error explanation для non-technical users.

15. **Add observability dashboard export** — export diagnostics bundle для bug reports (logs + traces + state + heap).

---

## 12. Итоговый вердикт по observability

| Метрика                         |   Оценка   | Комментарий                         |
| ------------------------------- | :--------: | ----------------------------------- |
| Observability панелей           |  🟢 8/10   | 18+ панелей, rich                   |
| HealthPanel sections            |  🟢 9/10   | 6 sections                          |
| TracesPanel sub-components      | 🟢🟢 10/10 | 6 sub-components                    |
| Error recovery                  | 🟢🟢 9/10  | 3-уровневая + 195 NOTIFICATION refs |
| Bootstrap tracking              |  🟢 8/10   | 6 phases + retries + degraded       |
| Service Registry                |  🟢 8/10   | Rich browser с statuses             |
| Cross-nav из diagnostics        |  🔴 2/10   | **0 links** — critical gap          |
| 6 diagnostics UI exposure       |  🔴 2/10   | Все без UI                          |
| Unified dashboard               |  🔴 3/10   | Fragmented                          |
| Self-explanation capability     |  🟡 6/10   | Backend excellent, UI partial       |
| **Overall Observability Score** | **6.0/10** | Богатая инфраструктура, fragmented  |

**Сильные стороны:**

- **18 observability панелей** — богатый выбор
- **TracesPanel** — 6 sub-components, лучшая trace infrastructure
- **3-уровневая error recovery** — panel + app + global
- **195 EVENTS.NOTIFICATION refs** — pervasive error notification
- **ServiceRegistryPanel** — rich service browser
- **Bootstrap state machine** — 6 phases, retries, degraded mode
- **AgentJournalPanel** — execution trail с filter

**Слабые стороны:**

- **0 cross-nav из diagnostic panels** — главный gap, пользователь не может найти source
- **6 ключевых diagnostics без UI** (MemoryWatchdog, DLQ, CircuitBreaker, Bootstrap report, Event registry, Subscription stats)
- **Нет unified «explain state» dashboard** — данные fragmented
- **HealthSlaPanel = MOCK** visible в nav
- **Diagnostic panels изолированы** — TracesPanel/HealthPanel/LogsPanel не связаны

**Главный вывод (как предсказывало задание):** «Насколько сама ОС способна объяснить своё состояние» — **6.0/10**. Backend observability отличный (state machine, statuses, traces, error recovery), но **UI fragmented** и **6 ключевых diagnostics invisible**. ОС **может** объяснить state через 18 панелей, но **не ведёт** пользователя от симптома к source.

**Главный рычаг:** закрыть 12 cross-nav links + wire 6 diagnostics to UI + create unified dashboard. Это поднимет observability score с 6.0 до ~8.0/10.

---

## Приложение A. Все observability-метрики в цифрах

| Метрика                           |                                                   Значение | Источник                                       |
| --------------------------------- | ---------------------------------------------------------: | ---------------------------------------------- |
| Observability панелей             |                                                        18+ | ls + grep                                      |
| HealthPanel секций                |                                                          6 | чтение                                         |
| TracesPanel sub-components        |                                                          6 | ls                                             |
| ServiceRegistryPanel строк        |                                  421 + 5 sub (1 021 total) | wc -l                                          |
| StateInspectorPanel строк         |                                    301 + 3 sub (468 total) | wc -l                                          |
| Bootstrap phases                  | 6 (pending/kernel/services/topology/ready/degraded/failed) | bootstrap.ts                                   |
| CRITICAL_SERVICES                 |      4 (kernel, configService, keyService, pricingService) | bootstrap-phases.ts                            |
| LifecycleManager.getStatuses()    |                                           ✅ method exists | lifecycle-manager.ts                           |
| InitStatus type                   |           {name, status: 'ok'\|'error'\|'skipped', error?} | lifecycle-manager.ts                           |
| tryInit retries                   |                                    3 + exponential backoff | lifecycle-manager.ts                           |
| ErrorBoundary уровней             |                                   3 (panel + app + global) | ErrorBoundary + GlobalErrorBoundary + main.tsx |
| EVENTS.NOTIFICATION references    |                                                    **195** | grep                                           |
| EVENTS.ERROR_BOUNDARY_CAUGHT refs |                                                          6 | grep                                           |
| AlertLayer строк                  |                                                        341 | wc -l                                          |
| AgentJournalPanel sub-components  |             3 (JournalEntryCard, JournalAddForm, StatMini) | ls                                             |
| DecisionLogPanel строк            |                                                        312 | wc -l                                          |
| AuditLogView строк                |                                                        376 | wc -l                                          |
| MemoryWatchdog UI                 |                                                     ❌ нет | grep                                           |
| DeadLetterQueue UI                |                                                     ❌ нет | grep                                           |
| CircuitBreaker state UI           |                                                     ❌ нет | grep                                           |
| Bootstrap report UI               |                                                     ❌ нет | grep                                           |
| Event registry UI (198 schemas)   |                                                     ❌ нет | grep                                           |
| Subscription stats UI             |                              ❌ нет (method exists, 1 ref) | grep                                           |
| Cross-nav из diagnostic panels    |                                                      **0** | grep per panel                                 |
| Missing cross-nav links           |                                                         12 | this report                                    |
| runtimeStatus в Sidebar           |                          3-state (online/degraded/offline) | Sidebar.tsx                                    |
| Background timers без UI          |                                                        15+ | Resource Map                                   |

---

## Приложение B. Источники и метод

| Что                        | Где                                                    | Как проверено                                   |
| -------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Observability panels       | `src/components/`                                      | ls + grep health\|trace\|log\|debug\|diagnostic |
| HealthPanel sections       | `src/components/HealthPanel/`                          | ls + чтение imports                             |
| TracesPanel sub-components | `src/components/TracesPanel/`                          | ls                                              |
| ServiceRegistryPanel       | `src/components/ServiceRegistryPanel/` (5 files)       | wc -l + head                                    |
| Bootstrap phases           | `src/kernel/bootstrap.ts`                              | grep phase                                      |
| LifecycleManager           | `src/kernel/services/lifecycle-manager.ts`             | grep statuses                                   |
| Error events               | `src/kernel/events/event-names.ts`                     | grep ERROR\|NOTIFICATION                        |
| EVENTS.NOTIFICATION usage  | `src/`                                                 | grep -rE                                        |
| ErrorBoundary              | `src/components/Common/ErrorBoundary.tsx`              | полное чтение (см. Lifecycle Map)               |
| Cross-nav audit            | `src/components/{Logs,Traces,Health,StateInspector}*/` | grep navigate() per dir                         |
| MemoryWatchdog UI          | `src/components/`                                      | grep memoryWatchdog                             |
| DLQ UI                     | `src/components/`                                      | grep deadLetter                                 |
| CircuitBreaker UI          | `src/components/`                                      | grep circuitBreaker                             |
| Event registry UI          | `src/components/`                                      | grep event-registry\|EventRegistry              |
| Subscription stats         | `src/`                                                 | grep getSubscriptionStats                       |
| runtimeStatus в Sidebar    | `src/components/Sidebar.tsx`                           | grep runtimeStatus                              |

---

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e_. Анализ статический; runtime observability (actual dashboard screenshots) не проводился. Парные отчёты: 13 предыдущих карт (готовность, ценность, техсостояние, ресурсы, дублирование, зависимости, lifecycle, доступность, пробелы, интеграция, user journeys, потенциал, мёртвый код).*
