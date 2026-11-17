# Карта функциональных пробелов — Capability Gap Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `29d85f4` (Nov 17, 2026, ветка `main`)
> **Дата анализа:** 2026-11-17
> **Метод:** статический анализ: grep по export/import паттернам в `src/components/**`, чтение `BuilderPanel/ComponentPalette.tsx` + `kernel/services/builder/node-catalog.ts`, сверка `kernel/services/*` (85 зарегистрированных сервисов по `docs/wiki/dev-reality-map.md`) с тем, что exposed as Builder tool, анализ cross-linking (`navigate()`, `agentMemory`, `debateMemory`), поиск unified overview панелей
> **Парные документы:** 8 предыдущих карт (готовность, ценность, техсостояние, ресурсы, дублирование, зависимости, lifecycle, доступность) + свежая `docs/wiki/dev-reality-map.md` (2026-11-17)
> **Главный результат:** найдено **42 функциональных пробела**; к 2026-11-17 **закрыто или частично закрыто ~9**: Builder (4/8 killer-сервисов exposed + runtime dispatch), agentMemory UI, Settings search, Wiki autocomplete, MemoryCenter агрегация, crystal refuted event, debate→crystal, cross-panel links, graph workbench navigation.

---

## 1. Исполнительное резюме

SuperAgents OS имеет **85 зарегистрированных сервисов ядра** (по dev-reality-map; всего 3390 TS/TSX-файлов). **Builder теперь может вызывать 8 node-type**: 4 core (agent, router, guardrail, tool) + 4 cognitive (crystal, synthesis, lens, time-machine) через `kernel/services/builder/node-catalog.ts` с runtime-dispatch в `orchestration-service.ts`. Из 8 killer-сервисов **4 exposed** (crystalVault, synthesisEngine, lensEngine, timeMachineService); **4 всё ещё скрыты** (federatedMemoryService, forumService, directorService, memoryOrchestrator).

**Export/Import gaps:**

- **11 панелей без export** (Governance, Director, Aquarium, Lenses, Policy, Guardrails, MCP, Connectors, Planner, Analytics, Traces, Health) — без изменений
- **9 панелей с export, но без import** (Chat, Memory, Crystal, Roles, Settings, Knowledge, Builder, Budget, Health) — broken round-trip, без изменений

**Cross-linking gaps:**

- **~104 `navigate()` calls в 23+ компонентах** (было 14) — cross-panel navigation заметно выросла (P2-6: links в 10 панелях)
- `agentMemory` table → **UI появился**: `AgentDetailPanel` имеет таб `MemoryTab` (читает/пишет `agentMemory` по `agentId`)
- **Нет debate→memory link** (debate X used memory Y) — по-прежнему нет поля `memoryIds` в `DebateSession`
- Decision → Crystal linking расширен: `VerdictActionButtons` имеет save-as-crystal (debate → crystal)

**Unified overview gaps:**

- Нет единого `agentOverview` — AgentsPanel имеет 30 табов/компонентов, но нет single «state of all agents» view
- MemoryCenterPanel **теперь агрегирует**: карта памяти системы — 27 источников, табы overview/storage/explorer/search/graph/health (counts, категории, владельцы)
- DashboardPanel — общий, но не domain-specific unified overviews

**Сводные метрики пробелов:**

| Категория пробелов                             |                          Кол-во | Severity        |
| ---------------------------------------------- | ------------------------------: | --------------- |
| Панели без export                              |                          **11** | 🟡 MED          |
| Панели с broken round-trip (export без import) |                           **9** | 🟡 MED          |
| Killer-сервисов NOT exposed as Builder tool    |                      **4 of 8** | 🟠 HIGH→PARTIAL |
| Cross-panel navigate() calls                   |            ~104 (было 14, рост) | 🟢 OK           |
| agentMemory table без UI                       |                               0 | 🟢 закрыт       |
| debateMemory link отсутствует                  |                               1 | 🟡 MED          |
| Domain unified overviews отсутствуют           |  3 (agents, debates, providers) | 🟡 MED          |
| Settings без search/tooltips                   |                          0 gaps | 🟢 закрыт       |
| Assistant catalog невостребован                |       1 (см. Accessibility Map) | 🟡 MED          |
| 64 панели без wiki                             | 64 (см. Accessibility Map §5.1) | 🔴 HIGH         |

**Главные пробелы (top-5):**

1. **Builder может вызывать 4 из 8 killer-сервисов** (crystal, synthesis, lens, time-machine); скрыты: memory, forum, director, memory-orchestrator
2. **9 панелей с broken round-trip** — export без import (нельзя восстановить из бэкапа)
3. **Нет debate→memory provenance** — невозможно отследить, какие memories повлияли на вывод дебатов
4. **Нет unified agent state overview** — 30 компонентов в AgentsPanel, но нет single view
5. **Нет unified background services overview** — 15+ timers невидимы

**Gap Score: 6.5/10** (было 5.5) — закрыт top-1 пробел частично (Builder), закрыты несколько P2-пробелов, но export/import round-trip и unified overviews остаются.

---

## 2. Методология: типы пробелов

| #   | Тип пробела                            | Что ищем                                       | Пример                                          |
| --- | -------------------------------------- | ---------------------------------------------- | ----------------------------------------------- |
| 1   | **Missing export**                     | Панель без export                              | GovernancePanel хранит роли, но нельзя export   |
| 2   | **Missing import (broken round-trip)** | Export без import                              | ChatPanel export→JSON, но нельзя import обратно |
| 3   | **Service not exposed**                | Сервис есть, но не вызывается через UI/Builder | crystalVault нельзя вызвать из Builder          |
| 4   | **Missing cross-link**                 | Объекты не связаны                             | Debate → Memory (использовала memory X?)        |
| 5   | **Missing unified overview**           | Multiple components, no single view            | Agents: 30 tabs, no «state of all»              |
| 6   | **Missing search/filter**              | Нет поиска в домене                            | Settings без search                             |
| 7   | **Missing batch operation**            | Только по одному                               | Mass approve all alerts?                        |
| 8   | **Missing sharing/collaboration**      | Single-user only                               | FederatedMemory experimental, но не для team    |
| 9   | **Missing API/SDK**                    | Только UI, нет programmatic access             | Wiki API для external scripts?                  |
| 10  | **Missing notifications**              | Событие есть, но не notifies                   | Crystal refuted — уведомление?                  |

**Принцип:** ищем не баги, а **отсутствующие возможности**, которые закроют реальные потребности.

---

## 3. 🔴 Builder integration gaps — killer-сервисы (частично закрыт)

### 3.1. Builder теперь поддерживает 8 node-type (4 core + 4 cognitive)

`src/components/BuilderPanel/ComponentPalette.tsx` — палитра собрана из `paletteItems` (4 core) + cognitive-узлов из каталога:

```typescript
// src/kernel/services/builder/node-catalog.ts
{ kind: 'agent', category: 'core', exposed: true },
{ kind: 'router', category: 'core', exposed: true },
{ kind: 'guardrail', category: 'core', exposed: true },
{ kind: 'tool', category: 'core', exposed: true },
{ kind: 'crystal', category: 'cognitive', exposed: true },
{ kind: 'synthesis', category: 'cognitive', exposed: true },
{ kind: 'lens', category: 'cognitive', exposed: true },
{ kind: 'time-machine', category: 'cognitive', exposed: true },
{ kind: 'memory', category: 'cognitive', exposed: false },
{ kind: 'forum', category: 'cognitive', exposed: false },
{ kind: 'director', category: 'cognitive', exposed: false },
{ kind: 'memory-orchestrator', category: 'cognitive', exposed: false },
```

**Runtime dispatch реализован** в `src/kernel/services/orchestration-service.ts`: case `'crystal' | 'synthesis' | 'lens' | 'time-machine'` вызывают `executeCrystalNode/executeSynthesisNode/executeLensNode/executeTimeMachineNode` (crystalVault, synthesisEngine, lensEngine, timeMachineService).

### 3.2. 4 из 8 killer-сервисов exposed as Builder tool (было 0 из 8)

| Сервис                   | Ценность (из Feature Value Map) | Exposed as Builder tool?     | Gap                                                     |
| ------------------------ | :-----------------------------: | ---------------------------- | ------------------------------------------------------- |
| `crystalVault` ⭐        |              9/10               | ✅ YES (node `crystal`)      | Pipeline «debate → save conclusion as crystal» возможен |
| `synthesisEngine` ⭐     |              9/10               | ✅ YES (node `synthesis`)    | «multi-perspective → synthesis → export» возможен       |
| `lensEngine`             |             7.5/10              | ✅ YES (node `lens`)         | «apply lens X to data Y» возможен                       |
| `timeMachineService` ⭐  |              8/10               | ✅ YES (node `time-machine`) | «snapshot before risky operation» возможен              |
| `federatedMemoryService` |       4/10 (experimental)       | ❌ NO                        | Experimental, всё ещё не exposed                        |
| `forumService`           |              6/10               | ❌ NO                        | Нельзя «post synthesis to forum» автоматически          |
| `directorService`        |              6/10               | ❌ NO                        | Нельзя «run director scenario» в pipeline               |
| `memoryOrchestrator`     |              8/10               | ❌ NO                        | Нельзя «search memory → feed to agent» в pipeline       |

**Статус:** главный архитектурный пробел **частично закрыт** (commit `1667dc3`, 2026-11-08): 4 из 8 killer-сервисов доступны как Builder-узлы с runtime dispatch. Осталось: memory, forum, director, memory-orchestrator.

### 3.3. Пример pipeline, который теперь МОЖНО построить

```
[Agent: gather info] → [Lens: apply security lens] → [Synthesis: multi-perspective] → [Crystal: save as crystal] → [Forum: post for review]
```

Первые 4 шага — exposed. **Шаг [Forum] невозможен** (node `forum` скрыт).

---

## 4. Export / Import gaps

> **Сверка 2026-11-17:** изменений не обнаружено — по-прежнему 11 панелей без export и 9 с broken round-trip. Пробел открыт.

### 4.1. 11 панелей без export 🔴

| Панель            | Что хранит         | Почему нужен export               |
| ----------------- | ------------------ | --------------------------------- |
| `GovernancePanel` | RBAC roles         | Audit / backup role assignments   |
| `DirectorPanel`   | Сценарии           | Share scenarios между установками |
| `AquariumPanel`   | (decorative)       | Low priority                      |
| `LensesPanel`     | Custom lenses      | Share lens definitions            |
| `PolicyPanel`     | Policies           | Compliance / audit                |
| `GuardrailsPanel` | Guardrail rules    | Backup safety config              |
| `MCPPanel`        | MCP server configs | Backup / share                    |
| `ConnectorsPanel` | Connector configs  | Backup / share                    |
| `PlannerPanel`    | Plans              | Backup plans                      |
| `AnalyticsPanel`  | Custom analytics   | Export reports                    |
| `TracesPanel`     | Execution traces   | Share for debugging               |
| `HealthPanel`     | Health snapshots   | Share diagnostics                 |

### 4.2. 9 панелей с broken round-trip (export без import) 🔴

| Панель              | Has export?                  | Has import? | Gap                                  |
| ------------------- | ---------------------------- | ----------- | ------------------------------------ |
| `ChatPanel`         | ✅ (ChatExportPanel, 9 refs) | ❌ NO       | Нельзя восстановить chat из backup   |
| `MemoryPanel`       | ✅ (15 files)                | ❌ NO       | Нельзя импортировать memory dump     |
| `CrystalVaultPanel` | ✅ (4 files)                 | ❌ NO       | Нельзя импортировать crystals        |
| `RolesPanel`        | ✅ (32 files)                | ❌ NO       | Нельзя импортировать role config     |
| `SettingsPanel`     | ✅ (11 files)                | ❌ NO       | Нельзя восстановить settings         |
| `KnowledgePanel`    | ✅ (6 files)                 | ❌ NO       | Нельзя импортировать knowledge base  |
| `BuilderPanel`      | ✅ (6 files)                 | ❌ NO       | Нельзя импортировать workflows       |
| `BudgetPanel`       | ✅ (6 files)                 | ❌ NO       | Нельзя импортировать budget config   |
| `HealthPanel`       | (limited)                    | ❌ NO       | Нельзя импортировать health snapshot |

**Проблема:** пользователь может export свои данные, но **не может восстановить** из backup. Это violates local-first principle.

### 4.3. ExportImportPanel exists, но coverage partial

`src/components/ExportImportPanel.tsx` (643 строки) — generic export/import. Но судя по gaps выше, **не покрывает все домены**.

---

## 5. Cross-linking gaps — нет navigation между связанными объектами

### 5.1. Agent ↔ Memory linking ✅ ЗАКРЫТ

**EVIDENCE:** `dexie-schema.ts` имеет таблицу `agentMemory` (`'++id, agentId, type, createdAt, expiresAt'`).

**ТЕПЕРЬ:** `src/components/AgentsPanel/AgentDetailPanel.tsx` содержит таб `MemoryTab` — читает `agentMemory.where('agentId').equals(agentId)` и пишет новые записи. Provenance «какой агент написал какую memory» прослеживается.

### 5.2. Debate ↔ Memory linking 🔴 ОТКРЫТ

**Gap:** нет link «debate X used memories Y, Z» — невозможно отследить, какие memories повлияли на вывод дебатов.

**Stat:** `DebateSession` (src/kernel/contracts/debate-types.ts) по-прежнему **не содержит** `memoryIds`. `DebateMemoryPanel` — это карта сессий дебатов, а не provenance memory→debate.

### 5.3. Decision ↔ Crystal linking 🟡 ЧАСТИЧНО ЗАКРЫТ

**EVIDENCE:** `SynthesisPanel` имеет `exportToCrystal(id)` — synthesis → crystal. **Добавлен** `VerdictActionButtons.tsx` (save-as-crystal, commit `2df1537`, 2026-11-08) — debate → crystal.

**НО:** DecisionLogPanel по-прежнему не показывает «decision X based on crystal Y».

### 5.4. Cross-panel navigation — выросла (14 → ~104)

**~104 `navigate()` calls в 23+ компонентах** (было 14, для 268 панелей = 5%). Причина: P2-6 (commit `8583071`, 2026-11-08) — cross-panel links в 10 панелях.

**Остались открытыми (примеры):**

- В TracesPanel, при trace agent X — нет «Open agent in AgentsPanel»
- В BudgetPanel, при budget alert — нет «Open SREAgentPanel for optimization»

### 5.5. Knowledge graph navigation 🟡 ЧАСТИЧНО

**GraphWorkbenchPanel / UniversalGraphPanel** — визуализация графа, **появились `useNavigate`/`navigate()` при клике** (переходы к связанным панелям). Topic-graph (Nov 2026) добавил react-flow/vis-network движки, zoom/pan/hover/details, auto-open.

**НО:** «show related entities» из wiki-графа всё ещё не полноценная navigation-панель.

---

## 6. Missing unified overviews

### 6.1. Agents — нет единого «state of all agents» view 🔴

**AgentsPanel** содержит 30 компонентов:

```
AgentAvatar, AgentCapabilitiesTab, AgentCard, AgentComparison, AgentConfigTab,
AgentDetailPanel, AgentGroupsSection, AgentHandoffsTab, AgentHistoryTab,
AgentIdentityEditor, AgentInfraTab, AgentObservabilityTab, AgentPolicySection,
AgentProfileTab, AgentStatsDashboard, AgentWizard, AgentsPanelContainer,
AgentsPanelContext, AgentsPanelView, AgentsTable, EloLeaderboard, LiveActivityStream,
QuickCreateAgentModal, agent-templates, sidebar-tabs, ...
```

**Есть:** AgentStatsDashboard (статистика), LiveActivityStream (activity), EloLeaderboard (ratings).

**НЕТ:** единого overview «all agents, current state, health, last activity, current task» в одном view.

**Gap:** чтобы понять «что делают все агенты сейчас» — нужно открыть несколько табов.

### 6.2. Memory — агрегация хранилищ появилась ✅/🟡

**MemoryCenterPanel** (переработан) — «карта памяти системы»: **27 источников хранения** (чат, дебаты, агенты, знания, исследования, конфиг, выполнение, флот, журналы) с табами:

- `overview` — категории, кол-во источников и записей
- `storage` — таблица (источник/хранилище/таблица/владелец/статус/записей)
- `explorer` — поиск по названию/владельцу + фильтр категорий
- `search` — гибридный поиск (memory + wiki + crystal)
- `graph` / `health` — граф и health&gaps

**Осталось:** MemoryPanel (главная) не фильтрует именно по 8 типам памяти (episodic vs semantic vs emotional) — фильтры по collection/importance.

### 6.3. Debates — нет «all debates state» view 🟡

**DebatesManagerPanel** (714 строк) — менеджер дебатов, но фокус на list + manage.

**Gap:** нет unified «current debates: live/paused/completed, participants, rounds remaining, expected conclusion time».

### 6.4. Providers — нет «all providers state» view 🟡

**ProviderDashboard** (670 строк) — dashboard, но overlap с ProviderManager (см. Duplication Map §3.3).

**Gap:** unified «all providers: health, latency, cost, reputation, last error» в одном real-time view.

### 6.5. Background services — нет unified «what's running» view 🔴

**15+ background `setInterval`** в сервисах (heartbeat, cleanup, snapshot, monitor — см. Resource Map §4).

**Gap:** нет UI «all background timers: active, last tick, next tick, error count». Только MemoryWatchdog в логах.

---

## 7. Missing search/filter capabilities

### 7.1. Settings без search ✅ ЗАКРЫТ

**SettingsPanel** — 8 табов (General/Writing/Reading/Alerts/Advanced/Notifications/Appearance/Prompts). **Добавлен search** (`settingsSearch` state + фильтрация табов, commit `8583071`, 2026-11-08) + tooltips (`settings.search_placeholder`).

**Gap закрыт:** поиск по всем табам одновременно.

### 7.2. AgentsPanel — нет global filter 🟡

30 компонентов, но нет единого filter «show only agents with status=X, role=Y, last active > Z».

### 7.3. Debates — нет filter by technique 🟡

**75 техник качества** + **33 стратегии**, но в DebatesManagerPanel нет filter «show debates using technique X».

### 7.4. Memory — нет filter by type 🟡

8 типов памяти, но MemoryPanel не фильтрует по типу (episodic vs semantic vs emotional…).

### 7.5. Wiki — нет autocomplete ✅ ЗАКРЫТ

WikiPanel has search + **добавлены autocomplete-подсказки** (`searchWikiQuick(q, 8)` → suggestions, commit `8583071`, 2026-11-08).

---

## 8. Missing batch operations

### 8.1. GovernancePanel — нет mass role assignment 🟡

Только single-user role assignment. Нельзя «assign role X to users [A, B, C]».

### 8.2. ApprovalsPanel — нет mass approve/reject 🟡

`approvals` route существует, но **нет** «approve all pending approvals from agent X».

### 8.3. AgentsPanel — нет mass deploy/configure 🟡

Нельзя «deploy same skill to agents [A, B, C]» или «set same policy to all pro agents».

### 8.4. MemoryPanel — нет mass delete/tag 🟡

Нельзя «delete all memories older than X» или «tag all memories from debate Y as `debate-Y`».

### 8.5. TracesPanel — нет mass export 🟡

Нельзя «export all traces from date X to Y» — только single trace export (если есть).

---

## 9. Missing notifications / proactive alerts

### 9.1. Crystal refuted — нет notification ✅ ЗАКРЫТ

Когда crystal помечается `refuted` — `CrystalVaultPanel` подписан на `EVENTS.CRYSTAL_REFUTED` (`eventBus.on(EVENTS.CRYSTAL_REFUTED, ...)`) и обновляет UI.

### 9.2. Debate concluded — нет notification 🟡

Когда долгий debate завершается, нет proactive notification (только если пользователь смотрит на DebateArena).

### 9.3. Provider health degraded — notification есть через NavBadge 🟢

NavBadge на Providers показывает health status. ✅

### 9.4. Budget exceeded — notification есть через BudgetAlertsPanel 🟢

BudgetAlertsPanel (322 строки) + polling. ✅

### 9.5. Memory worker failed — нет notification 🔴

`memory-engine.ts`: «Worker re-init after clear failed» — только в логах (см. Lifecycle Map §14.5). Нет user-visible notification.

### 9.6. Audit #6 double-init — нет notification 🔴

Если сервис double-subscribe из-за Audit #6 (см. Lifecycle Map §14.1), нет warning.

---

## 10. Missing API/SDK for external access

### 10.1. Wiki API 🟡

`WikiGraphService` (122 строки) + `WikiQueryService` — есть services, но **нет REST/CLI API** для external scripts.

**Gap:** нельзя из внешнего скрипта сделать `wiki.search("crystal")` — только через UI.

### 10.2. Memory API 🟡

`memoryOrchestrator` — есть service, но нет external API.

**Gap:** нельзя из CLI сделать `memory.search("topic X")`.

### 10.3. Crystal API 🟡

`crystalVault` — service, но нет external API.

**Gap:** нельзя из external script сделать `crystal.list()` или `crystal.propose(...)`.

### 10.4. CLI exists, но coverage? 🟡

`cli/superagents.mjs` (главный CLI, data-dir аргумент) + `cli/tasks-mcp-server.mjs` (MCP-сервер задач). **Нет** CLI-команд для Wiki/Memory/Crystal.

### 10.5. Server-side API 🟡

`server/` (корень репо): `sync-server.mjs`, `tasks-router.mjs`, `ws-auth.mjs`, `adapters.mjs`, `write-queue.mjs`, `heartbeat-loop.mjs`; `server/tests/` (13 тестов). WebSocket + ws-auth. **По-прежнему не exposed** REST для Wiki/Memory/Crystal.

---

## 11. Missing observability of capabilities themselves

### 11.1. Нет «capability registry» UI 🔴 ОТКРЫТ

**Assistant catalog** (описывает capabilities) — **по-прежнему нет UI** для просмотра «что умеет система» (в manifest только wiki-статья `wiki:capabilities`, не панель).

### 11.2. Нет «service registry» UI 🟡

**ServiceRegistryPanel** существует (`/service-registry`) — coverage не менялся, полного ревью нет.

### 11.3. Нет «event registry» UI 🟡

**Нет UI** для просмотра всех событий.

### 11.4. Нет «policy registry» UI 🟡

**Нет UI** для просмотра всех active policies.

---

## 12. Сводная карта пробелов — 42 пункта

### 12.1. По категориям

| Категория                                                                          |                                   Кол-во gaps | Priority |
| ---------------------------------------------------------------------------------- | --------------------------------------------: | -------- |
| Builder integration (8 killer-сервисов)                                            |                            8 → **4 осталось** | 🔴 P0    |
| Missing export                                                                     |                                            11 | 🟡 P1    |
| Broken round-trip (export без import)                                              |                                             9 | 🟡 P1    |
| Cross-linking (agent↔memory закрыт, debate↔memory, etc.)                           |                            5 → **2 осталось** | 🟡 P1    |
| Unified overviews (agents, debates, providers, background; memory закрыт частично) |                            5 → **4 осталось** | 🟡 P1    |
| Missing search/filter                                                              |                            5 → **3 осталось** | 🟡 P2    |
| Missing batch operations                                                           |                                             5 | 🟡 P2    |
| Missing notifications                                                              |                            3 → **2 осталось** | 🟡 P2    |
| Missing external API/SDK                                                           |                                             5 | 🟢 P3    |
| Missing capability/event/policy registry UI                                        |                                             4 | 🟢 P3    |
| **Total**                                                                          | **~60 sub-gaps** в **42 пунктах**, закрыто ~9 | —        |

### 12.2. Top-10 critical gaps (close first)

| #   | Gap                                                                                           | Почему critical                                        |
| --- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | **Builder вызывает 4 из 8 killer-сервисов**; скрыты memory/forum/director/memory-orchestrator | Cognitive pipelines частично возможны, остальные 4 нет |
| 2   | **9 панелей с broken round-trip** (export без import)                                         | Local-first violated — нельзя восстановить из backup   |
| 3   | **Нет debate→memory provenance**                                                              | Невозможно отследить influence                         |
| 4   | **Нет unified agent state overview**                                                          | 30 компонентов, нет single view                        |
| 5   | **agentMemory UI** ✅ закрыт (MemoryTab в AgentDetailPanel)                                   | Закрыт 2026-11-08                                      |
| 6   | **MemoryCenter агрегирует хранилища** ✅ частично                                             | Карта 27 источников есть; фильтр по 8 типам памяти нет |
| 7   | **~104 navigate() calls** ✅ выросло                                                          | Cross-panel navigation улучшена (P2-6)                 |
| 8   | **Settings search** ✅ закрыт                                                                 | Search по всем 8 табам                                 |
| 9   | **Нет capability registry UI**                                                                | Assistant catalog невидим                              |
| 10  | **Background services без UI overview**                                                       | 15+ timers невидимы                                    |

---

## 13. Рекомендации — закрывать пробелы, не добавлять random features

### 🔴 P0 — закрыть немедленно (high-impact, low-effort)

1. **Добавить Builder nodes для killer-сервисов**: ✅ **частично реализовано** (commit `1667dc3`, 2026-11-08): `<CrystalNode>`, `<SynthesisNode>`, `<LensNode>`, `<TimeMachineNode>` — через `node-catalog.ts` + runtime dispatch в orchestration-service. **Осталось:** `<MemoryNode>`, `<ForumNode>`, `<DirectorNode>`, `<MemoryOrchestratorNode>`.

2. **Добавить import в 9 панелей с export**: ChatPanel, MemoryPanel, CrystalVaultPanel, RolesPanel, SettingsPanel, KnowledgePanel, BuilderPanel, BudgetPanel, HealthPanel. Использовать existing `ExportImportPanel` infrastructure. **Закроет: round-trip gap.** — ❌ ещё не реализовано.

3. **Добавить debate→memory provenance link**: при RAG-debate, сохранить `memoryIds: string[]` в debate record. В DebatePanel показать «Memory used: [link to memory]». В MemoryPanel показать «Used in debates: [link to debate]». **Закроет: cross-linking gap.** — ❌ ещё не реализовано.

4. **Добавить agentMemory UI**: ✅ **реализовано** — в AgentsPanel (`AgentDetailPanel`) добавлен таб `MemoryTab` «Memory written by this agent». Фильтр «by author agent» в MemoryPanel — ❌ остался.

### 🟡 P1 — важное (в квартал)

5. **Добавить unified «Agent State Overview»**: single view «all agents, current state, health, last activity, current task, Elo». Aggregate из AgentStatsDashboard + LiveActivityStream + EloLeaderboard. **Закроет: unified overview gap.**

6. **Добавить unified «Memory Types Overview»**: в MemoryCenterPanel aggregate 8 IMemoryStore impls — показать distribution by type, cross-references, timeline. **Закроет: memory fragmentation gap.**

7. **Добавить unified «Background Services Overview»**: показать все 15+ `setInterval` timers — name, interval, last tick, next tick, error count. В HealthPanel или отдельная `BackgroundServicesPanel`. **Закроет: invisible background gap.**

8. **Добавить cross-panel navigation links**: ✅ **частично реализовано** (P2-6, commit `8583071`, 2026-11-08): управ в 10 панелях; navigate() ≥14 → ~104. HealthPanel→ProviderManager и др. остались.

9. **Добавить search в SettingsPanel**: ✅ **реализовано** (commit `8583071`, 2026-11-08): filter по всем 8 табам. **Закрыто.**

10. **Добавить export в 11 панелей без него**: Governance, Director, Lenses, Policy, Guardrails, MCP, Connectors, Planner, Analytics, Traces, Health. Использовать existing pattern (`createObjectURL` + `a.download`). **Закроет: export gap.** — ❌ ещё не реализовано.

### 🟢 P2 — стратегические (долгосрочно)

11. **Capability Registry UI**: отдельная панель «What can this OS do?» — aggregate из `panel-actions-catalog.ts` (4 832 строки) + service registry + event registry. Search, filter by category. **Закроет: invisible capabilities gap.**

12. **Event Registry UI**: показать все 198 event schemas, кто emit, кто subscribe. **Закроет: invisible events gap.**

13. **Mass operations**: mass approve/reject в ApprovalsPanel, mass role assign в Governance, mass deploy skill в Agents, mass delete/tag в Memory. **Закроет: batch gap.**

14. **External API/SDK**: REST/CLI для Wiki, Memory, Crystal, Debate — позволить external scripts. **Закроет: API gap.**

15. **Notifications для silent failures**: ✅ **частично**: crystal refuted → `EVENTS.CRYSTAL_REFUTED` + подписка в CrystalVaultPanel. Debate concluded, memory worker failed, Audit #6 double-init — ❌ остались.

16. **Filter by technique in DebatesManager**: «show debates using technique X» из 75 техник. **Закроет: filter gap.** — ❌ ещё не реализовано.

17. **Memory filter by type**: episodic vs semantic vs emotional в MemoryPanel. **Закроет: filter gap.** — ❌ ещё не реализовано (есть фильтры по collection/importance).

---

## 14. Итоговый вердикт по functional gaps

| Метрика                             |   Оценка   | Комментарий                                                                    |
| ----------------------------------- | :--------: | ------------------------------------------------------------------------------ |
| Builder integration coverage        |  🟠 6/10   | 4 из 8 killer-сервисов exposed + runtime dispatch                              |
| Export coverage                     |  🟡 6/10   | 16 панелей с export, 11 без (без изменений)                                    |
| Import coverage (round-trip)        |  🔴 4/10   | 9 панелей с broken round-trip (без изменений)                                  |
| Cross-linking                       | 🟡 7.5/10  | ~104 navigate() calls; agentMemory UI закрыт; debate→memory открыт             |
| Unified overviews                   |  🟡 6/10   | MemoryCenter агрегирует 27 источников; agents/debates/providers/background нет |
| Search/filter in panels             |  🟡 8/10   | Settings search ✅, Wiki autocomplete ✅; техники/типы памяти нет              |
| Batch operations                    |  🔴 4/10   | Almost none (без изменений)                                                    |
| Notifications for silent events     |  🟡 8/10   | Provider/Budget + crystal refuted ✅; memory worker/debate нет                 |
| External API/SDK                    |  🟡 5/10   | CLI + server exist, coverage unclear (без изменений)                           |
| Capability/event/policy registry UI |  🔴 3/10   | Catalogs hidden in code (без изменений)                                        |
| **Overall Gap Score**               | **6.5/10** | было 5.5; закрыты top-1 частично + несколько P2                                |

**Сильные стороны (что НЕ gap):**

- **Export exists в 16 панелях** — Chat, Debate, Memory, Knowledge, Crystal, Synthesis, Agents, Roles, Tasks, Budget, Health, Traces, Logs, Settings, Wiki, Builder
- **ChatExportPanel** — rich export (Markdown + JSON + HTML)
- **DecisionLogPanel + AuditLogView** — export в JSON + CSV
- **Synthesis → Crystal linking** (`exportToCrystal`) — единственный существующий cross-domain link
- **WikiGraphService** — graph queries есть (но UI limited)
- **DashboardPanel** — 18 компонентов, общий overview
- **AgentStatsDashboard + LiveActivityStream + EloLeaderboard** — partial agent overview
- **MemoryWatchdog** — встроенный monitoring (но в логах)
- **NavBadge** — уведомления на sidebar items
- **BudgetAlertsPanel** — proactive alerts

**Слабые стороны (gaps):**

- **Builder: 4 killer-сервисов всё ещё скрыты** (memory, forum, director, memory-orchestrator) — не все cognitive pipelines возможны
- **9 панелей с broken round-trip** — local-first violated
- **Нет debate→memory provenance** — influence tracking невозможен
- **Нет unified agent/debate/provider/background overview** — fragmented (memory — закрыт частично)
- **~104 navigate() calls** — заметно лучше, но часть cross-links отсутствует
- **Settings search** ✅ закрыт; **Wiki autocomplete** ✅ закрыт; остались фильтры по технике/типу памяти
- **Нет batch operations** — всё по одному
- **Capability/event/policy registries invisible в UI**
- **Silent failures без notification** (memory worker fail, debate concluded, Audit #6)
- **agentMemory UI** ✅ закрыт (MemoryTab в AgentDetailPanel)

**Главный вывод (как предсказывало задание):** «Развивать ОС не случайными новыми функциями, а закрывать реальные пробелы» — **подтверждено**. Найдено **42 functional gaps** вместо 42 random features; к 2026-11-17 **закрыто ~9**. **Top-3 critical**:

1. **Builder integration с killer-сервисами** — **частично закрыт** (4/8 exposed); оставшиеся 4 — когнитивные pipelines
2. **Import в 9 панелях** — закрыть = local-first round-trip работает
3. **Cross-linking debate↔memory** — закрыть = provenance tracking (agent↔memory уже закрыт)

**Gap Score: 6.5/10** (было 5.5) — много функций реализовано, закрыты top-1 частично и несколько P2, но round-trip, unified overviews и registry UI остаются. Закрытие оставшихся top-10 gaps поднимёт score до ~7.5/10.

---

## Приложение A. Все 42 functional gaps в цифрах

| Категория                     |                                    Кол-во | Examples                                                                                                               |
| ----------------------------- | ----------------------------------------: | ---------------------------------------------------------------------------------------------------------------------- |
| Builder node-types missing    |                                         4 | federated, forum, director, memoryOrchestrator (crystal/synthesis/lens/time-machine — ✅ закрыты)                      |
| Panels without export         |                                        11 | Governance, Director, Aquarium, Lenses, Policy, Guardrails, MCP, Connectors, Planner, Analytics, Traces, Health        |
| Panels with broken round-trip |                                         9 | Chat, Memory, Crystal, Roles, Settings, Knowledge, Builder, Budget, Health                                             |
| Cross-linking missing         |                                         2 | debate↔memory, decision↔crystal (agent↔memory ✅, debate↔crystal частично, graph nav частично)                         |
| Unified overviews missing     |                                         4 | agents, debates, providers, background services (memory ✅ частично)                                                   |
| Search/filter missing         |                                         3 | Agents, Debates (by technique), Memory (by type) (Settings ✅, Wiki autocomplete ✅)                                   |
| Batch operations missing      |                                         5 | Governance (mass role), Approvals (mass approve), Agents (mass deploy), Memory (mass delete/tag), Traces (mass export) |
| Notifications missing         |                                         2 | Debate concluded, Memory worker failed (Crystal refuted ✅)                                                            |
| External API missing          |                                         5 | Wiki, Memory, Crystal, Debate, Server API                                                                              |
| Registry UI missing           |                                         4 | Capability, Service (partial), Event, Policy                                                                           |
| **Total gaps**                | **~60 sub-gaps в 42 пунктах**, закрыто ~9 | —                                                                                                                      |

---

## Приложение B. Источники и метод

| Что                     | Где                                                                                               | Как проверено                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Export patterns         | `src/components/**/*.tsx`                                                                         | `grep -rE "exportChat\|exportData\|handleExport\|onExport\|downloadBlob\|saveAs\|createObjectURL"` |
| Per-panel export        | 18 panels                                                                                         | `grep -rl` per directory                                                                           |
| Import patterns         | `src/components/**/*.tsx`                                                                         | `grep -rE "importData\|importFile\|importJSON\|handleImport\|onImport\|fileInput"`                 |
| Builder nodes           | `src/components/BuilderPanel/ComponentPalette.tsx`, `src/kernel/services/builder/node-catalog.ts` | полное чтение                                                                                      |
| Service → tool exposure | `src/kernel/services/**`                                                                          | чтение `node-catalog.ts` (+ `orchestration-service.ts` runtime dispatch) for 8 killer services     |
| Cross-linking           | `src/kernel/services/**`, `src/components/**`                                                     | `grep -rE "agentMemory\|debateMemory\|memoryAuthor\|writtenBy\|debate.*memory.*link"`              |
| navigate() calls        | `src/components/**/*.tsx`                                                                         | `grep -rE "navigate\("` → ~104 results (23+ компонентов)                                           |
| agentMemory table       | `src/kernel/services/dexie-schema.ts`, `src/components/AgentsPanel/AgentDetailPanel.tsx`          | grep + чтение MemoryTab                                                                            |
| Unified overview search | `src/components/**`                                                                               | `grep -rlE "agentOverview\|agentsOverview\|agentsStatus\|unifiedAgent\|agentDashboard"`            |
| Memory center           | `src/components/MemoryCenterPanel/`, `src/kernel/services/memory-center/memory-registry.ts`       | ls + чтение (27 источников)                                                                        |
| DashboardPanel          | `src/components/DashboardPanel/` (18 файлов)                                                      | ls + wc                                                                                            |
| SettingsPanel           | `src/components/SettingsPanel/`                                                                   | grep search (settingsSearch)                                                                       |
| Total kernel services   | `docs/wiki/dev-reality-map.md` (2026-11-17)                                                       | 85 зарегистрированных сервисов; 3390 TS/TSX-файлов                                                 |

---

## Сверка с аудитами (волны 2–8)

Дополнительные факты по пробелам из волн аудитов:

- W4-042: `parseAndWriteFiles` пишет файлы из raw LLM-вывода без Approval/ToolGovernance/AgentPermission/ToolPipeline.
- W4-043: `autonomy-agent`/`autonomy-loop` не зарегистрированы в permission (обходят `guarded`).
- W4-044: пресет AUTOPILOT без admin-гейта; `autoApproveAfterMin` (исправлено: ≥60 мин).
- W2-016: произвольный voterId/pickId в голосовании (исправлено).
- W8-009: LLM JSON без schema-валидации (исправлено частично → tool-loop).
- W3-006: export/import покрывает 16/136 доменов (round-trip неполный).
- W7-ANA-007: multi-tab потеря данных (LWW).
- W8-019: ChannelService — unbounded/ghost cursors/private bypass.

---

_Отчёт сгенерирован 2026-10-31, актуализирован 2026-11-17 на основе коммита `29d85f4` (HEAD). Сверка фактов с `docs/wiki/dev-reality-map.md`. Анализ статический; runtime capability testing не проводился. Парные отчёты: «Карта готовности панелей», «Карта функциональной ценности», «Карта технического состояния», «Карта использования ресурсов», «Карта функционального дублирования», «Карта зависимостей», «Карта жизненного цикла», «Карта доступности возможностей»._
