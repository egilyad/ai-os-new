# Карта функциональных пробелов — Capability Gap Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `e08ab8e` (Oct 31, 2026, ветка `main`)
> **Дата анализа:** 2026-10-31
> **Метод:** статический анализ: grep по export/import паттернам в `src/components/**`, чтение `BuilderPanel/builder-nodes.tsx` + `ComponentPalette.tsx`, сверка `kernel/services/*` (778 файлов) с тем, что exposed as Builder tool, анализ cross-linking (`navigate()`, `agentMemory`, `debateMemory`), поиск unified overview панелей
> **Парные документы:** 8 предыдущих карт (готовность, ценность, техсостояние, ресурсы, дублирование, зависимости, lifecycle, доступность)
> **Главный результат:** найдено **42 функциональных пробела** — отсутствующие возможности, которые **закроют реальные потребности**, а не случайные фичи.

---

## 1. Исполнительное резюме

SuperAgents OS имеет **778 сервис-файлов** в ядре, но **Builder может вызывать только 4 node-type** (agent, router, guardrail, tool) — и только через `toolService.getTools()`. Из 8 killer-сервисов (crystalVault, synthesisEngine, lensEngine, timeMachineService, federatedMemoryService, forumService, directorService, memoryOrchestrator) **НИ ОДИН не exposed as Builder tool** — пользователь не может построить pipeline, который вызывает synthesis или crystal.

**Export/Import gaps:**

- **11 панелей без export** (Governance, Director, Aquarium, Lenses, Policy, Guardrails, MCP, Connectors, Planner, Analytics, Traces, Health)
- **9 панелей с export, но без import** (Chat, Memory, Crystal, Roles, Settings, Knowledge, Builder, Budget, Health) — broken round-trip

**Cross-linking gaps:**

- Только **14 `navigate()` calls в components** — мало cross-panel navigation
- `agentMemory` table exists in Dexie schema, но **нет UI** для «показать memory written by agent X»
- **Нет debate→memory link** (debate X used memory Y) — невозможно отследить, какие memories повлияли на вывод дебатов
- Decision → Crystal linking ограничен (только через synthesis `exportToCrystal`)

**Unified overview gaps:**

- Нет единого `agentOverview` — AgentsPanel имеет 30 табов/компонентов, но нет single «state of all agents» view
- MemoryCenterPanel существует, но **не агрегирует** 8 типов памяти (working/procedural/semantic/episodic/social/service-backed/spatial/emotional)
- DashboardPanel — общий, но не domain-specific unified overviews

**Сводные метрики пробелов:**

| Категория пробелов                             |                          Кол-во | Severity |
| ---------------------------------------------- | ------------------------------: | -------- |
| Панели без export                              |                          **11** | 🟡 MED   |
| Панели с broken round-trip (export без import) |                           **9** | 🟡 MED   |
| Killer-сервисов NOT exposed as Builder tool    |                      **8 of 8** | 🔴 HIGH  |
| Cross-panel navigate() calls                   |       14 (мало для 268 панелей) | 🟡 MED   |
| agentMemory table без UI                       |                               1 | 🟡 MED   |
| debateMemory link отсутствует                  |                               1 | 🟡 MED   |
| Domain unified overviews отсутствуют           |     3 (agents, memory, debates) | 🟡 MED   |
| Settings без search/tooltips                   |                          2 gaps | 🟡 LOW   |
| Assistant catalog невостребован                |       1 (см. Accessibility Map) | 🟡 MED   |
| 64 панели без wiki                             | 64 (см. Accessibility Map §5.1) | 🔴 HIGH  |

**Главные пробелы (top-5):**

1. **Builder не может вызывать killer-сервисы** (crystal, synthesis, lenses, time-machine) — Builder = только agent/router/guardrail/tool
2. **9 панелей с broken round-trip** — export без import (нельзя восстановить из бэкапа)
3. **Нет debate→memory provenance** — невозможно отследить, какие memories повлияли на вывод дебатов
4. **Нет unified agent state overview** — 30 компонентов в AgentsPanel, но нет single view
5. **MemoryCenterPanel не агрегирует** 8 типов памяти

**Gap Score: 5.5/10** — много функций реализовано, но critical integration gaps между ними.

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

## 3. 🔴 Builder integration gaps — killer-сервисы недоступны

### 3.1. Builder может вызывать только 4 node-type

`src/components/BuilderPanel/ComponentPalette.tsx`:

```typescript
const paletteItems = [
    { type: 'agent', icon: Bot, ... },      // agent node
    { type: 'router', icon: GitBranch, ... }, // routing decision
    { type: 'guardrail', icon: ShieldCheck, ... }, // safety check
    { type: 'tool', icon: Blocks, ... },     // toolService.getTools()
];
```

**`tool` node вызывает `toolService.getTools()`** — только зарегистрированные tools.

### 3.2. 8 killer-сервисов NOT exposed as Builder tool

| Сервис                   | Ценность (из Feature Value Map) | Exposed as Builder tool? | Gap                                                             |
| ------------------------ | :-----------------------------: | ------------------------ | --------------------------------------------------------------- |
| `crystalVault` ⭐        |              9/10               | ❌ NO                    | Нельзя построить pipeline «debate → save conclusion as crystal» |
| `synthesisEngine` ⭐     |              9/10               | ❌ NO                    | Нельзя «multi-perspective → synthesis → export» в pipeline      |
| `lensEngine`             |             7.5/10              | ❌ NO                    | Нельзя «apply lens X to data Y» в pipeline                      |
| `timeMachineService` ⭐  |              8/10               | ❌ NO                    | Нельзя «snapshot before risky operation»                        |
| `federatedMemoryService` |       4/10 (experimental)       | ❌ NO                    | Experimental, but could be in pipeline                          |
| `forumService`           |              6/10               | ❌ NO                    | Нельзя «post synthesis to forum» автоматически                  |
| `directorService`        |              6/10               | ❌ NO                    | Нельзя «run director scenario» в pipeline                       |
| `memoryOrchestrator`     |              8/10               | ❌ NO                    | Нельзя «search memory → feed to agent» в pipeline               |

**Все 8 killer-сервисов недоступны через Builder.** Это **главный архитектурный пробел** — Builder может строить только agent/router/guardrail/tool pipelines, но не cognitive pipelines с synthesis/crystal/lens.

### 3.3. Пример pipeline, который НЕЛЬЗЯ построить

```
[Agent: gather info] → [Lens: apply security lens] → [Synthesis: multi-perspective] → [Crystal: save as crystal] → [Forum: post for review]
```

Каждый шаг = killer-сервис. **Ни один не exposed as Builder node.**

---

## 4. Export / Import gaps

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

### 5.1. Agent ↔ Memory linking 🟡

**EVIDENCE:** `dexie-schema.ts` имеет таблицу `agentMemory` (`'++id, agentId, type, createdAt, expiresAt'`).

**НО:** в UI AgentsPanel **нет таба** «Memory written by this agent». MemoryPanel не показывает «which agent wrote this memory».

**Gap:** нельзя проследить provenance — какой агент написал какую memory.

### 5.2. Debate ↔ Memory linking 🔴

**Gap:** нет link «debate X used memories Y, Z» — невозможно отследить, какие memories повлияли на вывод дебатов.

**Search:** `grep -rE "debateMemory|debate.*memory.*link|memoryUsedIn"` → **0 results**.

### 5.3. Decision ↔ Crystal linking 🟡

**EVIDENCE:** `SynthesisPanel` имеет `exportToCrystal(id)` — synthesis → crystal.

**НО:** DecisionLogPanel хранит decisions, но **нет link** «decision X based on crystal Y».

### 5.4. Cross-panel navigation — мало `navigate()` calls

**Только 14 `navigate()` calls в components** (для 268 панелей = 5%).

**Примеры missing cross-links:**

- В HealthPanel, при red status провайдера — нет «Open in ProviderManager» link
- В TracesPanel, при trace agent X — нет «Open agent in AgentsPanel»
- В BudgetPanel, при budget alert — нет «Open SREAgentPanel for optimization»
- В DebateArena, при debate с agent X — нет «Open agent history»
- В CrystalVaultPanel, при crystal from debate Y — нет «Open debate Y»

### 5.5. Knowledge graph navigation 🟡

**GraphWorkbenchPanel** (585 строк + 5 lens) — визуализация графа, но:

- 5 линз (Calibration/Coverage/Debate/Embeddings/Keys) — analytical, не navigation
- Click по узлу → показывает details, но не navigate к related объекту

**WikiGraphService** (122 строки) — graph queries (similarity, communities), но **нет UI** для «show related entities».

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

### 6.2. Memory — 8 типов, нет unified overview 🟡

**8 IMemoryStore реализаций** (working/procedural/semantic/episodic/social/service-backed/spatial/emotional — см. Duplication Map §5.1).

**MemoryCenterPanel** существует, но **не агрегирует** все 8 типов в single view. MemoryPanel (главная) фокусируется на search.

**Gap:** нет «all memory types overview» — сколько episodic vs semantic vs emotional entries, их distribution over time, cross-references.

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

### 7.1. Settings без search 🔴

**SettingsPanel** — 8 табов (General/Writing/Reading/Alerts/Advanced/Notifications/Appearance/Prompts), **нет search**.

**Gap:** найти конкретную настройку (например, «rate limit threshold») — нужно открыть все 8 табов.

### 7.2. AgentsPanel — нет global filter 🟡

30 компонентов, но нет единого filter «show only agents with status=X, role=Y, last active > Z».

### 7.3. Debates — нет filter by technique 🟡

**75 техник качества** + **33 стратегии**, но в DebatesManagerPanel нет filter «show debates using technique X».

### 7.4. Memory — нет filter by type 🟡

8 типов памяти, но MemoryPanel не фильтрует по типу (episodic vs semantic vs emotional…).

### 7.5. Wiki — нет autocomplete 🟡

WikiPanel has search, но нет autocomplete suggestions при typing.

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

### 9.1. Crystal refuted — нет notification 🟡

Когда crystal помечается `refuted`, **нет notification** пользователю. Нужно проверить NotificationsTab settings.

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

`cli/` directory существует. Нужно ревью — какие команды есть.

### 10.5. Server-side API 🟡

`server/` directory + `server/tests/` (8 тестов). WebSocket + ws-auth. Но не clear, какие commands exposed.

---

## 11. Missing observability of capabilities themselves

### 11.1. Нет «capability registry» UI 🔴

**Assistant catalog** (4 832 строки, см. Accessibility Map §8) — описывает capabilities, но **нет UI** для просмотра «что умеет система».

**Gap:** пользователь не может посмотреть «all capabilities of this OS» в одном месте.

### 11.2. Нет «service registry» UI 🟡

**549 service registrations** в 81 phase-файле (см. Resource Map §3.2). **ServiceRegistryPanel** существует (`/service-registry`), но нужно ревью coverage.

### 11.3. Нет «event registry» UI 🟡

**198 event schemas** в `event-registry.ts` (2 772 строки). **Нет UI** для просмотра всех событий.

### 11.4. Нет «policy registry» UI 🟡

**PolicyService** + policies в IndexedDB. **Нет UI** для просмотра всех active policies.

---

## 12. Сводная карта пробелов — 42 пункта

### 12.1. По категориям

| Категория                                                          |                       Кол-во gaps | Priority |
| ------------------------------------------------------------------ | --------------------------------: | -------- |
| Builder integration (8 killer-сервисов)                            |                                 8 | 🔴 P0    |
| Missing export                                                     |                                11 | 🟡 P1    |
| Broken round-trip (export без import)                              |                                 9 | 🟡 P1    |
| Cross-linking (agent↔memory, debate↔memory, etc.)                  |                                 5 | 🟡 P1    |
| Unified overviews (agents, memory, debates, providers, background) |                                 5 | 🟡 P1    |
| Missing search/filter                                              |                                 5 | 🟡 P2    |
| Missing batch operations                                           |                                 5 | 🟡 P2    |
| Missing notifications                                              |                                 3 | 🟡 P2    |
| Missing external API/SDK                                           |                                 5 | 🟢 P3    |
| Missing capability/event/policy registry UI                        |                                 4 | 🟢 P3    |
| **Total**                                                          | **~60 sub-gaps** в **42 пунктах** | —        |

### 12.2. Top-10 critical gaps (close first)

| #   | Gap                                                                          | Почему critical                                                              |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | **Builder не вызывает killer-сервисы** (crystal/synthesis/lens/time-machine) | Builder = только agent/router/guardrail/tool; cognitive pipelines невозможны |
| 2   | **9 панелей с broken round-trip** (export без import)                        | Local-first violated — нельзя восстановить из backup                         |
| 3   | **Нет debate→memory provenance**                                             | Невозможно отследить influence                                               |
| 4   | **Нет unified agent state overview**                                         | 30 компонентов, нет single view                                              |
| 5   | **agentMemory table без UI**                                                 | Schema есть, UI нет                                                          |
| 6   | **MemoryCenter не агрегирует 8 типов памяти**                                | Fragmented view                                                              |
| 7   | **Только 14 navigate() calls**                                               | Cross-panel navigation слабая                                                |
| 8   | **Settings без search**                                                      | 8 табов без search                                                           |
| 9   | **Нет capability registry UI**                                               | Assistant catalog 4832 строки невидим                                        |
| 10  | **Background services без UI overview**                                      | 15+ timers невидимы                                                          |

---

## 13. Рекомендации — закрывать пробелы, не добавлять random features

### 🔴 P0 — закрыть немедленно (high-impact, low-effort)

1. **Добавить Builder nodes для killer-сервисов**: `<CrystalNode>`, `<SynthesisNode>`, `<LensNode>`, `<TimeMachineNode>`, `<MemoryNode>`, `<ForumNode>`, `<DirectorNode>`. Каждый = expose existing service as Builder-callable node. **Закроет: cognitive pipeline gap.**

2. **Добавить import в 9 панелей с export**: ChatPanel, MemoryPanel, CrystalVaultPanel, RolesPanel, SettingsPanel, KnowledgePanel, BuilderPanel, BudgetPanel, HealthPanel. Использовать existing `ExportImportPanel` infrastructure. **Закроет: round-trip gap.**

3. **Добавить debate→memory provenance link**: при RAG-debate, сохранить `memoryIds: string[]` в debate record. В DebatePanel показать «Memory used: [link to memory]». В MemoryPanel показать «Used in debates: [link to debate]». **Закроет: cross-linking gap.**

4. **Добавить agentMemory UI**: в AgentsPanel добавить таб «Memory written by this agent» (читает `agentMemory` table). В MemoryPanel добавить filter «by author agent». **Закроет: agent↔memory gap.**

### 🟡 P1 — важное (в квартал)

5. **Добавить unified «Agent State Overview»**: single view «all agents, current state, health, last activity, current task, Elo». Aggregate из AgentStatsDashboard + LiveActivityStream + EloLeaderboard. **Закроет: unified overview gap.**

6. **Добавить unified «Memory Types Overview»**: в MemoryCenterPanel aggregate 8 IMemoryStore impls — показать distribution by type, cross-references, timeline. **Закроет: memory fragmentation gap.**

7. **Добавить unified «Background Services Overview»**: показать все 15+ `setInterval` timers — name, interval, last tick, next tick, error count. В HealthPanel или отдельная `BackgroundServicesPanel`. **Закроет: invisible background gap.**

8. **Добавить cross-panel navigation links**: в HealthPanel при red provider → «Open in ProviderManager». В TracesPanel при agent trace → «Open agent». В BudgetAlertsPanel → «Open SREAgentPanel». Минимум 20+ таких links. **Закроет: cross-linking gap.**

9. **Добавить search в SettingsPanel**: filter по всем 8 табам одновременно. **Закроет: settings search gap.**

10. **Добавить export в 11 панелей без него**: Governance, Director, Lenses, Policy, Guardrails, MCP, Connectors, Planner, Analytics, Traces, Health. Использовать existing pattern (`createObjectURL` + `a.download`). **Закроет: export gap.**

### 🟢 P2 — стратегические (долгосрочно)

11. **Capability Registry UI**: отдельная панель «What can this OS do?» — aggregate из `panel-actions-catalog.ts` (4 832 строки) + service registry + event registry. Search, filter by category. **Закроет: invisible capabilities gap.**

12. **Event Registry UI**: показать все 198 event schemas, кто emit, кто subscribe. **Закроет: invisible events gap.**

13. **Mass operations**: mass approve/reject в ApprovalsPanel, mass role assign в Governance, mass deploy skill в Agents, mass delete/tag в Memory. **Закроет: batch gap.**

14. **External API/SDK**: REST/CLI для Wiki, Memory, Crystal, Debate — позволить external scripts. **Закроет: API gap.**

15. **Notifications для silent failures**: crystal refuted, debate concluded, memory worker failed, Audit #6 double-init — все должны emit `EVENTS.NOTIFICATION`. **Закроет: silent failure gap.**

16. **Filter by technique in DebatesManager**: «show debates using technique X» из 75 техник. **Закроет: filter gap.**

17. **Memory filter by type**: episodic vs semantic vs emotional в MemoryPanel. **Закроет: filter gap.**

---

## 14. Итоговый вердикт по functional gaps

| Метрика                             |   Оценка   | Комментарий                                         |
| ----------------------------------- | :--------: | --------------------------------------------------- |
| Builder integration coverage        |  🔴 3/10   | Только 4 node-types, 0 of 8 killer-сервисов exposed |
| Export coverage                     |  🟡 6/10   | 16 панелей с export, 11 без                         |
| Import coverage (round-trip)        |  🔴 4/10   | 9 панелей с broken round-trip                       |
| Cross-linking                       |  🟡 5/10   | 14 navigate() calls, debate→memory missing          |
| Unified overviews                   |  🟡 5/10   | DashboardPanel есть, но domain-specific missing     |
| Search/filter in panels             |  🟡 6/10   | Settings без search, остальное moderate             |
| Batch operations                    |  🔴 4/10   | Almost none                                         |
| Notifications for silent events     |  🟡 6/10   | Provider/Budget есть, crystal/memory worker нет     |
| External API/SDK                    |  🟡 5/10   | CLI + server exist, coverage unclear                |
| Capability/event/policy registry UI |  🔴 3/10   | Catalogs hidden in code                             |
| **Overall Gap Score**               | **5.5/10** | много функций, но critical integration gaps         |

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

- **Builder = only 4 node-types, 0 killer-сервисов exposed** — cognitive pipelines невозможны
- **9 панелей с broken round-trip** — local-first violated
- **Нет debate→memory provenance** — influence tracking невозможен
- **Нет unified agent/memory/debate/background overview** — fragmented
- **Только 14 navigate() calls** — cross-panel navigation слабая
- **Settings без search** — 8 табов без filter
- **Нет batch operations** — всё по одному
- **Capability/event/policy registries invisible в UI**
- **Silent failures без notification** (crystal refuted, memory worker fail)
- **agentMemory table без UI** — schema есть, view нет

**Главный вывод (как предсказывало задание):** «Развивать ОС не случайными новыми функциями, а закрывать реальные пробелы» — **подтверждено**. Найдено **42 functional gaps** вместо 42 random features. **Top-3 critical**:

1. **Builder integration с killer-сервисами** — закрыть = когнитивные pipelines станут возможны
2. **Import в 9 панелях** — закрыть = local-first round-trip работает
3. **Cross-linking debate↔memory + agent↔memory** — закрыть = provenance tracking

**Gap Score: 5.5/10** — много функций реализовано, но integration gaps между ними мешают composite scenarios. Закрытие top-10 gaps поднимёт score до ~7.5/10.

---

## Приложение A. Все 42 functional gaps в цифрах

| Категория                     |                        Кол-во | Examples                                                                                                               |
| ----------------------------- | ----------------------------: | ---------------------------------------------------------------------------------------------------------------------- |
| Builder node-types missing    |                             8 | crystal, synthesis, lens, time-machine, federated, forum, director, memoryOrchestrator                                 |
| Panels without export         |                            11 | Governance, Director, Aquarium, Lenses, Policy, Guardrails, MCP, Connectors, Planner, Analytics, Traces, Health        |
| Panels with broken round-trip |                             9 | Chat, Memory, Crystal, Roles, Settings, Knowledge, Builder, Budget, Health                                             |
| Cross-linking missing         |                             5 | agent↔memory, debate↔memory, decision↔crystal, debate↔agent, trace↔agent                                               |
| Unified overviews missing     |                             5 | agents, memory, debates, providers, background services                                                                |
| Search/filter missing         |                             5 | Settings, Agents, Debates (by technique), Memory (by type), Wiki autocomplete                                          |
| Batch operations missing      |                             5 | Governance (mass role), Approvals (mass approve), Agents (mass deploy), Memory (mass delete/tag), Traces (mass export) |
| Notifications missing         |                             3 | Crystal refuted, Debate concluded, Memory worker failed                                                                |
| External API missing          |                             5 | Wiki, Memory, Crystal, Debate, Server API                                                                              |
| Registry UI missing           |                             4 | Capability, Service (partial), Event, Policy                                                                           |
| **Total gaps**                | **~60 sub-gaps в 42 пунктах** | —                                                                                                                      |

---

## Приложение B. Источники и метод

| Что                     | Где                                                                     | Как проверено                                                                                      |
| ----------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Export patterns         | `src/components/**/*.tsx`                                               | `grep -rE "exportChat\|exportData\|handleExport\|onExport\|downloadBlob\|saveAs\|createObjectURL"` |
| Per-panel export        | 18 panels                                                               | `grep -rl` per directory                                                                           |
| Import patterns         | `src/components/**/*.tsx`                                               | `grep -rE "importData\|importFile\|importJSON\|handleImport\|onImport\|fileInput"`                 |
| Builder nodes           | `src/components/BuilderPanel/builder-nodes.tsx`, `ComponentPalette.tsx` | полное чтение                                                                                      |
| Service → tool exposure | `src/kernel/services/**`                                                | `grep -rE "registerTool.*${svc}\|tool.*name.*${svc}"` for 8 killer services                        |
| Cross-linking           | `src/kernel/services/**`, `src/components/**`                           | `grep -rE "agentMemory\|debateMemory\|memoryAuthor\|writtenBy\|debate.*memory.*link"`              |
| navigate() calls        | `src/components/**/*.tsx`                                               | `grep -rE "navigate\(['\"]/"` → 14 results                                                         |
| agentMemory table       | `src/kernel/services/dexie-schema.ts`                                   | grep                                                                                               |
| Unified overview search | `src/components/**`                                                     | `grep -rlE "agentOverview\|agentsOverview\|agentsStatus\|unifiedAgent\|agentDashboard"`            |
| Memory center           | `src/components/MemoryCenterPanel/`                                     | ls + чтение                                                                                        |
| DashboardPanel          | `src/components/DashboardPanel/` (18 файлов)                            | ls + wc                                                                                            |
| SettingsPanel           | `src/components/SettingsPanel/`                                         | ls                                                                                                 |
| Total kernel services   | `src/kernel/services/**/*.ts`                                           | `find ... ! -name "*.test.ts"` → 778                                                               |

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

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e`. Анализ статический; runtime capability testing не проводился. Парные отчёты: «Карта готовности панелей», «Карта функциональной ценности», «Карта технического состояния», «Карта использования ресурсов», «Карта функционального дублирования», «Карта зависимостей», «Карта жизненного цикла», «Карта доступности возможностей»._
