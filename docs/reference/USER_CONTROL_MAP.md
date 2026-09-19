# Карта пользовательского управления — сотни сервисов → понятная OS

> Дата: 2026-09-06. Цель промта 4: объяснить как использовать сотни сервисов — что внутреннее, что доменное, что рантайм, какой UI канонический, где дубли.

---

## 1) Три слоя сервисов

| Слой | Что это | Примеры (файлы) | Трогает ли пользователь напрямую? |
|------|---------|-----------------|-----------------------------------|
| **A. Internal implementation** | Инфра, без доменной логики. Хранители, декораторы, мосты. | `event-bridge/projection-registry` (`phase0-event-bridge.ts:18`), `dexie-schema.ts:280` (`SuperAgentsDB`), `database-service.ts:1` (`DatabaseService`), `lifecycle-manager.ts:1`, `execution-governor.ts:1`, `provider-adapter-registry.ts:1`, `llm/registry/adapter-factory.ts:55` (11 декораторов), `tool-executor.ts:1` (AST-guard) | **Нет** — через доменные сервисы |
| **B. Domain services** | Бизнес-логика домена. CRUD + валидация + события. | `crew-service.ts:59` (`ICrewService`), `council-service.ts:1`, `graph-service.ts:280`, `persona/lt-memory-service.ts:1`, `ops/hierarchy-service.ts:1`, `trust/governance-service.ts:1`, `frontier/eval-service.ts:1`, `rivals/*`, `rivals10/*` … (271 файл) | **Через UI или через AgentFactory** |
| **C. Runtime entry points** | Точки где реально что-то выполняется (LLM/Tool/Memory). | `AgentFactory.execute(id, task)` (`capability/agent-factory.ts:31`), `CrewService.startCrew`/`resumeCrew`, `GraphService.runGraph`/`approve`, `ToolRunner.runWithTools`, `CouncilService.conclude`, `KnowledgeService.retrieve`, `CogMemoryService.write/read` | **Да — это кнопки в UI** |

**Правило:** Пользователь **никогда** не зовёт `A` напрямую. Он зовёт `C` (кнопка) → `C` зовёт `B` → `B` зовёт `A`.

---

## 2) Домен → Каноническая точка входа (UI) → Рантайм

> Одна строка = один пользовательский сценарий. Всё остальное — детали.

| Домен | Канонический UI (куда идти) | Что нажать (рантайм) | Что происходит под капотом |
|-------|-----------------------------|----------------------|----------------------------|
| **Агенты (сборка)** | `Fleet — Persona` + `Governance` (скоро `AgentFactoryPanel`) | `AgentFactory.createResolved({roleId, personaId, skillIds, toolIds, model})` → `AgentFactory.execute(id, task)` | `CapabilityResolver` → `skill→tool` (проверено `phase53`), `persona→prompt`, `role→policy`, `model→LLM`, `memory→retrieval` → `kv: agent-def/*` → `ToolRunner` → `CogMemory` |
| **Команды** | `Fleet — Crews` (хаб) + `Fleet — Crews` (разрез) | `Forge` (goal→proposal) → `Run` | `AgentForgeService.propose` → `CrewService.createCrew` → `startCrew` (wave-parallel, `consensual`/`humanInput`) |
| **Дебаты** | `Fleet — Councils` (6 форматов + mining) | `Create` → `Advance` → `Conclude` (или `FormatService.run(oxford/ld/popper…)`) | `CouncilService` (единый runtime, `councilSessions` v24) + `ArgTechService` (Dung/Toulmin/Brier/Kialo) |
| **Графы/Оркестрация** | `Fleet — Graphs` + `CognitiveBuilder` (старый) | `Build & run graph` → `Approve/Reject` (телефон) | `GraphService.runGraph` (wave-parallel, subgraph, Send, threads, `_approved`) → `checkpoints` v25 |
| **Память** | `Fleet — Persona` (contexts/goals) + `MemoryPanel` / `FederatedMemory` | `remember` / `addSource` / `Ask RAG` | `LtMemoryService` (tiers) + `CogMemoryService` (4×3) + `KnowledgeService` (blend 0.6) + `DefaultEmbedding` |
| **Инструменты** | `Skills` / `Tools` (старые) + `Fleet — Ops` | `callTool` | `ToolRunner` (11 tools) + `ToolGovernance.check` → `MCPService.callTool` |
| **Governance** | `Governance / RBAC` (новый) | `Assign` (observer→auditor) | `GovernanceService.assignRole` → `can()` gate перед `AgentFactory` |
| **Provenance** | `Provenance Graph` (новый) | `Trace` (decisionId→SVG) | `ProvenanceService.trace` → `GraphVizService` |
| **Interop** | `Fleet — Interop` | `Add peer` / `Handoff` | `GatewayService` / `FederationService` (loopback) |
| **Eval/Frontier** | `Fleet — Frontier` + `EvalDatasets` | `Run benchmark` | `EvalService` (`contains|exact|token_f1`) |
| **Rivals (все 100+)** | `Fleet — Rivals` (10 табов + ReAct/RAG/CodeAgent/Assistant/Scaffold/AskCode) | `Run goal / dyad / group chat / ReAct / RAG / scaffold` | `AutonomyService` / `GroupChatService` / `ReactService` / `RagService` / `AppBuilderService` |
| **Русская школа** | `Fleet — Rivals` (metabolic tick) | `Metabolic tick` | `MetabolicService` (доминанта Ухтомского) |

> **Вывод:** Для 90% задач пользователю нужны **5 канонических входов**: `AgentFactory` (агенты), `Fleet — Crews` (команды), `Fleet — Councils` (дебаты), `Fleet — Graphs` (графы), `Fleet — Persona` (память). Остальное — детали этих пяти.

---

## 3) Дублирующие панели — что оставить

| Дубли | Файлы | Канонический | Что делать с остальными |
|-------|-------|--------------|--------------------------|
| **Debate** (6+ панелей) | `DebateArena.tsx:1`, `DebatePanel/`, `DebateReplayPanel.tsx:1`, `DebateRuntimePanel/`, `ArgumentGraphPanel/`, `SteelmanPanel/`, `FrameTrackerPanel/`… | **`Fleet — Councils` + `DebateArena`** (runtime) | Остальные — `experimental:true`, скрыть из дефолтной навигации, оставить по прямому URL |
| **Memory** (4 панели) | `MemoryPanel.tsx:1`, `FederatedMemoryPanel.tsx:1`, `MemoryTransferPanel.tsx:1`, `PersonaMarketplacePanel.tsx:1` | **`MemoryPanel` (локальная) + `FederatedMemory` (федерация)** | `MemoryTransfer` — в `Settings → Export/Import` |
| **Roles/Agents** | `RolesPanel/`, `AgentsPanel/`, `AgentMarketplacePanel.tsx:1`, `AgentJournalPanel/` | **`RolesPanel` + `AgentFactory`** (новый) | `AgentJournal` — в `Fleet — Persona` |
| **Skills/Tools** | `SkillsPanel/`, `ToolsPanel/`, `MCPPanel.tsx:1` | **`Skills` + `Tools` (единый `Fleet — Ops` для governance)** | `MCPPanel` — в `Integrations` секцию |
| **Graph/Builder** | `BuilderPanel/CognitiveBuilder`, `WorkflowPanel.tsx:1`, `Fleet — Graphs` | **`Fleet — Graphs`** (runtime) + `CognitiveBuilder` (визуальный, старый) | `WorkflowPanel` — alias к `Graphs` |
| **Fleet vs 6 разрезов** | `FleetPanel.tsx:1` (1107 строк, 10 табов) + `FleetPanels/*` (6 обёрток) | **`Fleet` (хаб) + 6 разрезов** (`fleet-crews`…`fleet-frontier`) + `Governance`/`Provenance` | `FleetPanel` — порезать на 6 файлов `FleetPanel/tabs/*.tsx` (без canvas, как условились) |

**Правило дедупликации:** один домен → один `nav.*` канонический, остальные — `experimental:true` + `lazy:true` (уже так: `route-registry-content.ts:4` — 90 пунктов, большинство `experimental`).

---

## 4) Как пользоваться всем этим — 3 сценария (копипаст)

### Сценарий A: Собрать одного агента и запустить задачу (через `AgentFactory` — канон)

```ts
// 1. Выбрать из складов (DISCOVER → SELECT)
const roleId = 'analyst'; // из RolesPanel
const personaId = 'persona1'; // из Persona
const skillIds = ['skill1']; // из SkillMarket
const toolIds: string[] = []; // skill→tool резолвится сам

// 2. Создать (VALIDATE → AUTHORIZE → BIND → PERSIST)
const agent = await agentFactory.createResolved({
  name: 'GoldenAgent',
  roleId, personaId, skillIds, toolIds,
  model: 'auto', // per-agent model via LlmBridge
});

// 3. Выполнить (EXECUTE → OBSERVE)
const { output, toolCalls } = await agentFactory.execute(agent.definition.id, 'calculate 21*2');
// → LLM → ToolRunner (math.calc) → CogMemory (episodic) → kv: agent-run/* → EVENTS.AGENT_EXECUTED
```

### Сценарий B: Команда (Crew)

```
Fleet — Crews → Forge (goal) → Run → [humanInput? → Submit → Resume] → outputs
// Под капотом: AgentForgeService.propose → CrewService.createCrew (8 шаблонов) → startCrew (wave-parallel, consensual, guardrails, humanInput)
```

### Сценарий C: Дебаты с форматом

```
Fleet — Councils → Topic → Create → Advance (proposal→fact→debate→consensus) → Conclude
// Или: FormatService.run('oxford', topic) → pre→council→post→swing
// ArgTech: mineClaims → Dung grounded → Toulmin card → Brier forecast → Kialo tree
```

---

## 5) Что ещё дублирует и что постепенно мигрировать

| Старый путь | Новый канон | Миграция |
|-------------|-------------|----------|
| `ComposeService.composeAgent` | `AgentFactory.createResolved` | Обёртка: `compose → factory` (постепенно) |
| `AgentService` (lifecycle) | `AgentFactory` (definition) + `AgentService` (runtime) | Оставить оба: `Factory` — сборка, `Service` — lifecycle |
| `Crew roles[]` | `AgentDefinition` per member | Crew остаётся командой, не агентом — не мигрировать |
| `Council participants` | `AgentDefinition` per participant | Оставить Council runtime отдельным |
| `CharacterService` / `StudioPack` | `AgentFactory` + `personaId` | Добавить `personaId` в `AgentFactory` (уже есть) |

**Принцип из промта 3:** `OLD PATH → AgentFactory? → YES: адаптер → NO: оставить legacy` (`docs/LEGACY_AGENT_PATHS.md:1`).

---

## 6) Итого — куда идти в UI

- **Оставь как есть:** `Fleet` (хаб, 10 табов) + 6 разрезов (`fleet-crews`…), `Governance`, `Provenance` — это уже канонические точки, mobile-friendly, deep-link `?tab=graphs&run=<id>`.
- **Не делай сейчас:** Studio canvas (drag-drop) — после рантайма (`typecheck` + `build` + `vitest` → Заход 2).
- **Следующий UI-шаг (дешёвый):** порезать `FleetPanel.tsx:1` (1107 строк) на `FleetPanel/tabs/*.tsx` — структура, не фича.

> Сотни сервисов теперь — не «зоопарк», а **5 канонических сценариев** через `AgentFactory`/`Crew`/`Council`/`Graph`/`Memory`. Остальное — детали этих пяти.
