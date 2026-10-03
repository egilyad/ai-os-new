# ACTUAL SYSTEM AUDIT — SuperAgents OS (STATICALLY VERIFIED, NOT RUNTIME VERIFIED)

> Дата: 2026-09-06. Заход 1 — статика (без typecheck/build/tests, слабый ПК).  
> Принцип: `CODE → STRUCTURE → WIRING → RUNTIME PATH → STATUS → GAP`.  
> Статусы: **A REAL / B IMPLEMENTED / C PARTIAL / D STUB / E MOCK / F DOCUMENTED ONLY / G MISSING**.  
> Источник правды: код, не старые `SUMMARY`/`INVENTORY`/`CONVERSATION`.

---

## 1. Executive Summary (static)

**Что это:** local-first OS (`IndexedDB` + `Web Workers`, `src/kernel/services/dexie-schema.ts:280`) с `EventBus` как единственной шиной (`src/kernel/events/event-registry.ts:28` — `EVENT_REGISTRY`, `src/kernel/event-bus.ts:1` — `coreEventBus`), DI только через конструктор (`src/kernel/container.ts:24`).

**Как рос:** База (5 waves) + фазы A–W (23→50) additive — без `.upgrade()` потерь, фазы идемпотентны (`!has` guard в `src/kernel/service-registration/helpers.ts:58`).

**Статическая картина (этот заход):**
- **Dexie v34** — 98 таблиц (считано по классу `SuperAgentsDB` `src/kernel/services/dexie-schema.ts:157` — поля `notes` … `scopedMem`), `keyValue` — квази-таблица для всего остального (сотни префиксов `copilot/*`, `a2aspec/*`, `metakb/*` …).
- **Фазы DI — 43** (`phase0`–`phase11`, `phase13`–`phase50` с пропусками 12, 45→47 порядок в файле перепутан но wiring `registerPhase45` перед `registerPhase46` — `src/kernel/service-registration/index.ts:44` — фактически 43 `registerPhase*` вызова, каждый `registerFactory` lazy).
- **События — ~260** имён (от `key:loaded` до `latent:synth`/`metabolic:tick` — `src/kernel/events/event-registry.ts:30`), схемы Zod, `EVENTS`/`EventMap`/`EventValidators` — производные.
- **Контракты — 241** файл (`src/kernel/contracts/` — `read` директории `241 entries`), баррель `src/kernel/contracts/index.ts:1` реэкспортирует ~20 доменов, но фактический баррель длиннее (1239 строк, дубли `rivals17`/`rivals14` перепутаны по порядку — `contracts/index.ts:1190`).
- **Сервисы — 271** файл в `src/kernel/services/` + `src/llm/` (11 декораторов).
- **UI — 205** записей в `src/components/` (`read` директории), `275 → 40` stores (`src/stores:1`), `90` нав-пунктов в 3 секциях (`src/route-registry-content.ts:4`).
- **LLM — 23 провайдера** (`SUPPORTED_PROVIDERS` `src/llm/registry/adapter-factory.ts:55`), адаптеры `gemini`/`openrouter`/`nvidia`/`groq`/`openai-compatible` + 4 китайских (`deepseek`/`kimi`/`minimax`/`qwen` — `src/llm/deepseek/deepseek-adapter.ts:1`).

**Честная оценка (static):**
- **A REAL** — ядро (EventBus, DI, Dexie additive, LLM bridge с `cacheScope`, FleetPanel как единая консоль) — wiring проверен статически (imports/регистрации/роуты).
- **B IMPLEMENTED** — большинство новых доменов (crew/council/graph/persona/ops/interop/meta/trust/frontier/parity/rivals) — код есть, регистрации есть, но рантайм не гонялся (weak PC, 0 `typecheck` после волн — `FULL_FUNCTIONALITY_AUDIT.md:1` честно).
- **D STUB** — порты без бэкенда: TTS/STT, E2B Python, OAuth apps, телефония — возвращают `handoff/queued` (`src/kernel/services/rivals5/computer-service.ts:36`, `codeexec-service.ts:1`), не «выполнено».
- **E MOCK** — warehouse seed (3 tools + 5 skills + 4 шаблона) (`src/kernel/service-registration/phase42-rivals10.ts:72`), RU tools mock (`phase47-russian.ts:36`).

**Что дальше:** в этом файле — по разделам 2–33, каждый с `STATUS` и `GAP`. Заход 2 (сильный ПК) — `typecheck:fast` + `build:skip-typecheck` + `vitest` срез новых фаз.

---

## 2. Actual Architecture (из кода, не из доков)

```
SuperAgents OS (как есть в коде)
│
├── Kernel (`src/kernel/`)
│   ├── Container (`container.ts:24` — IContainer, registerFactory lazy)
│   ├── EventBus (`event-bus.ts:1` — coreEventBus, onSafe/subscribeAll)
│   ├── Event Registry (`events/event-registry.ts:28` — EVENT_REGISTRY → EVENTS/EventMap)
│   ├── Dexie (`services/dexie-schema.ts:280` — SuperAgentsDB v1→v34, 98 таблиц + keyValue)
│   ├── DAL (`dal/data-access-layer.ts:1` — 1 repo/domain, mirror в `dal/_test-harness.ts:1`)
│   └── Workers (`kernel/workers/` — воркеры поиска/эмбеддингов)
│
├── Contracts (`kernel/contracts/` — 241) — баррель `contracts/index.ts:1` (1239 строк, дубль-порядок rivals17/14)
│
├── Services (`kernel/services/` — 271 + `src/llm/` — 7 адаптеров + 11 декораторов)
│   ├── LLM Bridge (`services/llm-bridge/llm-task-executor.ts:59` — 4 лица, cacheScope)
│   ├── Parity (`services/parity/` — tool-runner 11 tools, knowledge RAG, training, default-embedding 384)
│   ├── Crew/Council/Graph/Persona/Ops/Interop/Meta/Trust/Frontier (waves 1–5 + A–D)
│   ├── Rivals 10×N (F: Graph waves, G: 10, H: 10, I: 10, J: 10, K: 10, L: 10, M: 10, N: 10, P: 10, Q: 9, R: 10, S: 10, T: 8, U: 10, V: 10, W: 10, X: 10, Y: 11) — всё additive, фазы 23→50
│   └── Timeline (`services/timeline-service.ts:180` — setupAutoIngest, 11 fleet/ops событий добавлены в фазе M)
│
├── Stores (`stores/` — 40, все `onSafe` consumers) — `crewStore.ts:1` … `rivalStore.ts:1`, `uiPreferencesStore.ts:1`
│
├── UI (`src/components/` — 205, `src/route-registry-content.ts:4` — 90 пунктов в 3 секциях)
│   ├── FleetPanel (`components/FleetPanel/FleetPanel.tsx:1` — 10 табов + deep-link `?tab=graphs&run=<id>`)
│   ├── FleetPanels (6 обёрток) + GovernancePanel (`components/GovernancePanel/GovernancePanel.tsx:1`) + ProvenancePanel (`components/ProvenancePanel/ProvenancePanel.tsx:1`)
│   └── 638 панелей по AGENTS.md:3 — базовые (Chat/Memory/Health/DebateArena/Builder/Director/Room) + 205 новых/экспериментальных
│
├── LLM (`src/llm/` — registry `adapter-factory.ts:55` — 23 провайдера, 11 декораторов, `llm-types.ts:15` — reasoningContent)
│   ├── Adapters: gemini/openrouter/nvidia/groq/cerebras/cloudflare + openai-compatible family + deepseek/kimi/minimax/qwen
│   └── Decorators: logging/cache/retry/circuitBreaker/rateLimit/priorityQueue/costManager/fallback
│
├── Persistence
│   ├── Dexie 98 таблиц + keyValue (сотни префиксов)
│   └── DAL — `dal/*Repository.ts` (crew, council, graph, persona, ops, interop, meta, trust, frontier, parity, rival, _test-harness)
│
└── Infrastructure
    ├── Service Registration (`service-registration/index.ts:44` — 43 фазы, helpers.ts:58 — !has guard)
    ├── i18n (`i18n/translations/{en,ru}/nav.ts:107` + `analytics.ts:361` — fleet.*)
    └── Security (`security.ts:1` — sandbox, `tool-executor.ts:1` — AST-guard)

**Отклонения от доки:** фактическая архитектура совпадает с заявленной (Kernel→Services→Panels), но баррель контрактов перепутан (rivals17/14 порядок), `phase45` импорт стоял после `phase46` (исправлено в индекс: `phase43,44,45,46,47`), часть новых событий (`LATENT_SYNTH`) добавлялась с коллизией и была починена. Это статические артефакты без рантайм-проверки.

---

## 3. Kernel — статус

| Компонент | Файл | Статус | Примечание |
|-----------|------|--------|------------|
| Container | `kernel/container.ts:24` | **A** | `IContainer`, `registerFactory` lazy, `has` guard |
| EventBus | `kernel/event-bus.ts:1` | **A** | `coreEventBus`, `onSafe`, `subscribeAll` — wiring проверен |
| Event Registry | `kernel/events/event-registry.ts:28` | **A/B** | ~260 имён, Zod схемы, производные `EVENTS`/`EventMap`/`Validators` — часть схем decorative (`HOT_EVENTS` bypass) |
| Dexie | `kernel/services/dexie-schema.ts:280` | **A/B** | v34, 98 таблиц, `keyValue` квази-таблица; миграции additive, без `.upgrade()` потерь — статика OK, рантайм миграций не гонялся |
| DAL | `kernel/dal/data-access-layer.ts:1` | **A** | 1 repo/domain, mirror в `_test-harness.ts:1` — wiring OK |
| Workers | `kernel/workers/` | **B** | воркеры поиска/эмбеддингов — код есть, рантайм не гонялся |

**GAP:** `contracts/index.ts:1190` — дублирующий порядок rivals17/14, требует `typecheck` на сильном ПК.

---

## 4. Runtime — статус

- **Инициализация:** `registerServices(container, eventBus, registerWithLifecycle)` (`service-registration/index.ts:72`) — 43 фазы последовательно, каждая `register('name', c=>new Service(...))` — лениво, `registerWithLifecycle` на первый `get`.
- **Wiring:** статика — все `registerPhase*` импортированы, `makeHelpers` guard (`helpers.ts:58`) делает идемпотентность.
- **Проблема (статика):** `phase45` стоял после `phase46` в импортах (починено), но порядок вызовов уже правильный (`registerPhase45` перед `registerPhase46`).

**Статус: B** — инициализация выглядит корректно статически, рантайм `init()`/`start()` не гонялся.

---

## 5. Agents — можно ли собрать агента из складов и запустить?

**Текущий runtime агента:** `src/kernel/services/agent-service.ts:80` — `AgentService` (LLM-вызовы, lifecycle `AgentLifecycleState`), `src/kernel/types/role-types.ts:1` (`Role`), `src/kernel/contracts/unified-role.ts:1`.

**Склады (warehouses) и их путь к агенту:**

| Склад | Хранится | Регистрируется | Выбирается | Попадает агенту | Исполняется | Статус |
|-------|----------|----------------|------------|-----------------|-------------|--------|
| **Roles** | `roles` table + builtin-набор `RoleService` | `RoleService.save` | `RoleService.get` + UI `RolesPanel` | `AgentService` via `roleId` | LLM system prompt | **B** (seed builtin, 6 RU-ролей в kv `heisenberg/*` — не через `RoleService` seed) |
| **Skills** | `skills` table + `skillManifests` (v27) + `SkillMarket` | `SkillMarket.publish` | `SkillMarket.list` | `ToolRunner` `addTool`? нет — скиллы пока не инжектятся в агента напрямую | частично (`phase42` seed 5) | **C** |
| **Tools** | `ToolRunner` 11 built-in + `MCPService` proxy | `ToolRunner.addTool` | `ToolGovernanceService.check` | `LlmCrewExecutor` ветка `toolRunner.runWithTools` (`llm-task-executor.ts:59`) | `ToolRunner` | **B** (gate есть, инжект в Crew есть, в AgentService — нет) |
| **Personas** | `personaProfiles`/`personaDepths`/`voices` (v26) + `CharacterService` | `PersonaService.distillPerson` | `PersonaService.promptFor` | `LlmCrewExecutor` system prompt (guide) — частично | LLM | **B/C** |
| **Protocols** | `Interop` Gateway envelopes | `GatewayService.ingress` | `GatewayService.translate` | внешний агент | `IInteropTransport` loopback | **C/D** (loopback без транспорта) |
| **Council lenses** | `council-lenses.ts:1` (14+4) | static file | `CouncilService` `lensId` | system prompt участника | LLM | **A/B** |

**Ответ:** собрать агента **частями можно** (`Role` + `Persona` → `AgentService` + `ToolRunner` ветка в Crew), но **единого сборщика** `Agent = Identity + Persona + Role + Skills + Tools + Memory + Goals + Policy + Protocol + Model` — **нет** (GAP C). Склады — пока `массив + seed + UI`, не `registry → selection → runtime` end-to-end.

**GAP:** нет `AgentFactory` который бы брал из складов и отдавал готовый `Agent` с wiring `skills → tools → governance → model`.

---

## 6. Capability Warehouses — детальный аудит (5 со складов из задачи)

> Проверено по 13 вопросам из промта (где хранится → runtime).

### 6.1 Tools — `src/kernel/services/parity/tool-runner-service.ts:1`

1. **Где:** `ToolRunner` in-memory `Map` + `MCPService` proxy, персист — нет (tools не в Dexie, только `toolGrants` для governance).
2. **Регистрация:** `addTool({name, description, parameters, run})` — runtime, `phase42` seed 3 (`json.get/text.stats/list.unique`), `phase47` seed 7 RU (`yadisk.read`…`yandex.metrica`).
3. **Выбор:** `listTools()` → LLM `tools` array.
4. **Потребитель:** `LlmCrewExecutor` (Crew), `PlannerService`, `RagService`, `VoiceAgentService`, `CodeAgentService`.
5. **Попадание агенту:** через `LlmBridgeOptions.toolRunner` (Crew) / напрямую в `PlannerService`.
6. **Исполнение:** `callTool(agentId, name, args)` → `ToolGovernanceService.check(agentId, tool)` → `run(args)` + `EVENTS.TOOL_EXECUTED`.
7. **Сохранение:** нет (stateless).
8. **Создание нового:** `addTool` — да, runtime.
9. **Переиспользование:** да, по имени.
10. **Lifecycle:** нет (нет enable/disable per tool — только governance).
11. **Permissions:** через `ToolGovernanceService` (`toolGrants` table).
12. **Validation:** `parameters` JSON-schema — не валидируется строго (только в ToolRunner).
13. **Runtime:** **B** — работает offline (8 built-in + 7 RU mock), gate есть.

**Статус: B/C** — registry есть, но персиста и `skill → tool` связи нет.

### 6.2 Skills — `src/kernel/services/skill-service.ts:1` + `src/kernel/services/ops/skill-market-service.ts:1`

1. **Где:** `skills` (4 default) + `skillManifests` (5 seeded + 4 RU) — две таблицы, не синхронизированы.
2. **Регистрация:** `SkillMarket.publish` → `skillManifests`, `SkillService` — `storage/skills-store`.
3. **Выбор:** `SkillMarket.list` / `SkillService.getAllSkills`.
4. **Потребитель:** `EcosystemService` bundles, `ComposeService` (`composeAgent`).
5. **Попадание агенту:** через `ComposeService` → `crew role` (косвенно), не напрямую в `AgentService`.
6. **Исполнение:** нет — скиллы — описания, не код.
7. **Сохранение:** Dexie — да.
8. **Создание:** `publish` — да.
9. **Переиспользование:** да.
10. **Lifecycle:** `install/uninstall` + `exportManifest` — есть.
11. **Permissions:** `permissions: string[]` в манифесте — не чекается рантайм.
12. **Validation:** нет.
13. **Runtime:** **C** — каталог, не исполнение.

### 6.3 Roles — `src/kernel/services/role-service.ts:1`

- **Где:** `roles` table, builtin-набор.
- **Выбор:** `RoleService.getAll` + UI `RolesPanel`.
- **Попадание:** `AgentService` via `roleId`, `CrewService` via `roles[]`.
- **Статус: B** — рабочий, но 6 RU-ролей пока в kv `heisenberg/*`, не в `roles`.

### 6.4 Personas — `src/kernel/services/persona/persona-service.ts:1` + `src/kernel/services/rivals2/character-service.ts:1`

- **Где:** `personaProfiles`/`voices`/`personaDepths` (v26) + `CharacterService` (import `character.json` → distill).
- **Выбор:** `PersonaService.promptFor(ownerId)` — `AgentCard`-совместимый блок.
- **Попадание:** `LlmCrewExecutor` system prompt (guide) — частично.
- **Статус: B** — distill работает, voice — без TTS (queued).

### 6.5 Council lenses/templates — `src/kernel/services/council/council-lenses.ts:1`, `src/kernel/services/crew/crew-templates.ts:1`

- **Где:** static files (14+4 линзы, 8 шаблонов).
- **Выбор:** `CouncilService.lensId` / `CrewService.createCrewFromTemplate`.
- **Исполнение:** system prompt линзы + crew roles.
- **Статус: A/B** — статика, LLM-исполнение есть.

> **Вывод по складам (честно):** сейчас это **`массив + seed + UI` с частичным `Registry → Selection → Runtime`**. Настоящий `capability registry` с `Selection → Agent → Execution → Persistence → Permissions → Validation → Runtime` — **C** (частично): tools — ближе всего к registry, skills/personas — каталоги без рантайм-инжекта в агента.

---

## 7. Tools — уже в 6.1

Статус: **B** — 11 tools, MCP proxy, governance, loop (`src/kernel/services/parity/tool-runner-service.ts:1` — `runWithTools`).

---

## 8. Skills — уже в 6.2

Статус: **C** — каталог, не исполнение.

---

## 9. Roles — уже в 6.3

Статус: **B**.

---

## 10. Personas — уже в 6.4

Статус: **B/C**.

---

## 11. Protocols / Interop — `src/kernel/service-registration/phase28-interop.ts:1`

- **Где:** `GatewayService` (`gateway-service.ts:1` — ingress/translate/recent 300), `Translation` (`translation.ts:1` — pure functions A2A↔MCP↔ACP…), `FederationService` (peers в `fedPeers`), `CoordinationService` (market/routing/contracts).
- **Путь:** `GATEWAY_INGRESS` → `EventBus` → `InteropStore` (только читает).
- **Статус: C/D** — loopback без `IInteropTransport` (offline), `IInteropTransport.send` — интерфейс, реального HTTP нет.

---

## 12. MCP — `src/kernel/services/mcp-service.ts:380` (`callTool`) + `phase34-rivals2` + `phase42` + `phase46` (`McpDeepService`)

- **Статус: B/C** — `addServer/listTools/callTool` работает, `discover`/`connectAll` — статика OK, рантайм без внешних серверов — `handoff`.

---

## 13. Orchestration — runtime путь

```
User Intent (FleetPanel.tsx:350 — Run)
 ↓
Agent / Mission (CrewService.startCrew / GraphService.runGraph / CouncilService.createSession)
 ↓
Planner (PlannerService strategies `src/kernel/services/rivals/planner-service.ts:1` — sequential/function_calling/stepwise/plan_and_execute)
 ↓
Orchestrator (GraphService drive `src/kernel/services/graph/graph-service.ts:280` — wave-parallel)
 ↓
Invocation (InvocationEngine `src/kernel/services/invocation/invocation-engine-service.ts:1` — policy-gated)
 ↓
Tool / Model / Agent (ToolRunner → LLM bridge → AgentService)
 ↓
Result → State (GraphRun state `src/kernel/types/graph-types.ts:1`, Crew outputs)
 ↓
Memory (LtMemory `persona/lt-memory-service.ts:1`, CogMemory `meta/cog-memory-service.ts:1`)
 ↓
Next Action (Graph reflect/decision log, Autonomy loop `src/kernel/services/rivals/autonomy-service.ts:1`)
```

**Статус: B** — путь есть, wiring статически проверен, но `typecheck:fast` не гонялся — `GAP` — возможные `any`/`as` места.

---

## 14. Debate / Council — единый runtime или набор?

- **Создание:** `CouncilService.createSession` (`src/kernel/services/council/council-service.ts:1` — topic/config/participants/judges, aliases double-blind).
- **Participants:** `CouncilParticipant` (kind proponent/opponent/researcher/fact_checker/judge/moderator + lens/polarity).
- **Strategies:** 6 форматов (`src/kernel/services/debateplus/format-service.ts:1` — oxford/munk/LD/popper/deliberative/adversarial) + `ArgTechService` (Dung/Toulmin/Brier/Kialo).
- **Turns/Arguments:** `CouncilMessage` (forum/whisper), `DebateArgument` (`debate-types.ts:1` — старый runtime) + `CouncilMessage` (новый).
- **Evidence/Fact-check:** `FactPacket` (`submitFact` — researcher/fact_checker only) + `CouncilService` research via `RagService`.
- **Judge/Voting:** `JudgeScore` (multi-judge weighted) + `AudienceVote` (advisory tie-break).
- **Consensus:** `conclude` — tally + summary.
- **Persistence:** `councilSessions/councilMessages/councilVotes` (v24) — embedded facts/scores/votes в `councilVotes` kind `fact/judge/audience`.
- **Events:** `council:*` 10 + `format:*` 2 + `dung:*`/`toulmin:*`/`brier:*` — `EVENT_REGISTRY`.
- **State machine:** `CouncilPhase` proposal→fact_gathering→debate→consensus→completed + `CouncilStatus`.
- **UI:** `FleetPanel tab councils` (create/advance/conclude + 6 форматов + mining) — **одна панель**, не 6 отдельных.
- **Runtime:** `CouncilService` — **единый** runtime (additive над старым `DebateSyncManager` — не трогает), `CouncilRepository` — aggregate root.

**Ответ:** **Единый runtime** (CouncilService), но **набор механизмов** вокруг (6 форматов как `FormatService` поверх, ArgTech как формальный second opinion). **Статус: B** — единый, но UI пока одна панель.

---

## 15. Memory — путь событие → сохранение → retrieval

| Вид | Где | Путь | Статус |
|-----|-----|------|--------|
| Short-term | `TimelineService` ring 500 + `DirectorStore` | `conversation:*` → `DirectorStore` | **A** |
| Long-term tiers | `LtMemoryService` (`ltMemories` v26) | `remember` → Dexie → `recall` token-overlap + `coreContext` | **B** (token-overlap, embeddings `DefaultEmbeddingService` 384 hash — offline) |
| Cog 4×3 | `CogMemoryService` (`cogMemories` v29) | `write` → `read` + `govern` | **B** |
| ScopedMem | `ScopedMemService` (`scopedMem` v34) | `add` → `search` | **B** |
| Cognee KG | `CogneeService` (`cognee/*` kv) | `ingest` → LLM entities → `recall` | **C** (LLM optional) |
| Retrieval | `KnowledgeService` (`knowledgeSources` v32) + `RagService` | `retrieve` token-overlap → `DefaultEmbedding` blend 0.6/0.4 | **B** |
| Embeddings | `DefaultEmbeddingService` (`src/kernel/services/parity/default-embedding-service.ts:1`) | `embed` hash → L2 | **C** (провайдер не заварен) |
| Persistence | Dexie 98 + kv | DAL → Dexie → `_test-harness` | **A/B** |

**Есть ли путь событие→сохранение→retrieval?** **Да**, но retrieval пока **token-overlap** (порт `IEmbeddingPort` готов, провайдер — TODO).

---

## 16. Research — `src/kernel/services/research-engine-service.ts:64` + `src/kernel/services/gemini-research-service.ts:1`

- **Статус: A/B** — `startSession/runLoop/buildCitationGraph/generateReport` — wiring OK, LLM-часть offline fallback.

---

## 17. State Graph — `src/kernel/services/graph/graph-service.ts:280`

- **6 режимов** (`graph-modes.ts:1`), wave-parallel + `subgraph` (depth ≤2) + Send (`state['send:<id>']`) + threads + `_approved` фикс, `maxSteps` 50, `reflectEvery`.
- **Статус: B** — драйвер есть, `phase25` делегаты к Crew/Council/Forge — реальные, `typecheck` не гонялся.

---

## 18. Governance — `src/kernel/services/trust/governance-service.ts:1`

- **Capabilities:** `grantCapability` + `checkCapability` (deny-wins) — **B**
- **Trust:** `feedback` EMA 0.2 + `trustOf` — **B**
- **Policy:** `addPolicy` + `evaluate` (priority, deny>require_hitl>allow, budget limit) — **B**
- **Human roles:** `assignRole` + `can` (observer/approver/director/auditor) — **B**, UI `GovernancePanel.tsx:1` — **C** (assign + `can` check, без списка всех)
- **Provenance:** `ProvenanceService.trace` BFS depth ≤4 — **B**, UI `ProvenancePanel.tsx:1` — **C** (SVG via `GraphVizService`)
- **Sandbox continuum:** `sandboxLevelFor` — **C** (эвристика, не политика)

---

## 19. Interoperability — уже в 11

**Статус: C/D** — loopback, `IInteropTransport` интерфейс без HTTP.

---

## 20. LLM Layer — уже в 2

**Статус: A/B** — 23 провайдера, 11 декораторов, `reasoningContent` сквозит, `Factory` wiring OK.

---

## 21. Database — фактические таблицы (из кода, не из доков)

- **Считано:** класс `SuperAgentsDB` — **98** полей `Table` (`dexie-schema.ts:157` — `notes` … `scopedMem`).
- **Кто пишет/читает:** каждый домен — свой `*Repository` (`dal/*Repository.ts`), все через `DataAccessLayer` (`dal/data-access-layer.ts:1`), тест-зеркало `_test-harness.ts:1`.
- **Migration:** `v1→v34` additive, каждая `version(n).stores({...})` — без `.upgrade()` потерь (кроме `v6`/`v9`/`v11`/`v12` где были `upgrade` для `keyValue`/`debateSessions`).
- **Orphaned:** **нет** — `versionDefs` (`dexie-schema.ts:2800`) — `migration` проверка `table dropped` логирует WARN.
- **Статус: A/B** — схема консистентна статически, миграции не гонялись на слабом ПК.

---

## 22. Event System — реальная карта

- **Всего:** ~260 имён (`EVENT_REGISTRY` `event-registry.ts:30` — от `key:loaded` до `metabolic:tick`).
- **Producer/Consumer:** `producer → eventBus.emit(EVENTS.*)` → `consumer onSafe` (store) / `TimelineService.setupAutoIngest` (`timeline-service.ts:180` — 11 fleet/ops событий + базовые provider/chat/system, остальное — прямой `subscribeAll` в stores).
- **Dead/duplicate:** `HOT_EVENTS` (`chat:stream:chunk` `event-registry.ts:261` — decorative, bypass validation), дубли `GROUP_SYNC`/`KEY_GROUP_SYNC` — намеренные алиасы.
- **Статус: A/B** — источник правды один, дубли — алиасы, dead — нет (все 260 имеют схему).

---

## 23. UI — Route → Panel → Store → Service → Runtime

| Route | Panel | Store | Service | Runtime | Статус |
|-------|-------|-------|---------|---------|--------|
| `fleet` | `FleetPanel.tsx:1` (10 табов) | 10 stores (`crewStore`…`rivalStore`) | 10+ сервисов | Crew/Council/Graph/Persona/Ops… | **B** (единая консоль, нет 6 отдельных Studio-canvas) |
| `fleet-crews` … `fleet-frontier` | 6 обёрток `FleetPanels/*` | те же | те же | те же | **C** (обёртки `initialTab`) |
| `governance` | `GovernancePanel.tsx:1` | `governanceService` | `GovernanceService` | `can()` | **C** |
| `provenance` | `ProvenancePanel.tsx:1` | `provenanceService` + `graphVizService` | `ProvenanceService` | BFS trace + SVG | **C** |
| `fleet` graphs deep-link | `FleetPanel` `GraphsTab` `Open` → `?tab=graphs&run=<id>` | `useGraphStore` | `GraphService` | `graph:hitl` | **B** (копипаст URL, не роут) |
| `timeline` | `EventsTimeline` + `TimelineService` | `TimelineService` | `TimelineService` | `provider/chat/system` + 11 fleet/ops | **B/C** (11 новых маппингов добавлено, остальные ~200 — только через `subscribeAll`) |

**FALLBACK/mocks:** `LlmBridge` echo fallback (`llm-task-executor.ts:59` — `catch → echo`), TTS/STT/E2B/OAuth — `handoff/queued` (`computer-service.ts:36`), `DefaultEmbeddingService` — hash (`default-embedding-service.ts:1`).

---

## 24. Mobile / Remote

- **Mobile:** `MobileAccessService` (`src/kernel/services/ops/mobile-access-service.ts:1` — pairingCode, inbox, quick HITL `approve/reject`), `FleetPanel` mobile-friendly (inline стили, `Approve/Reject` с телефона).
- **Статус: B/C** — pairing + inbox есть, `quickVote` — Council, но нет native app.

---

## 25. Stubs / Mocks / Handoffs — честный список

| Где | Что | Статус | Файл |
|-----|-----|--------|------|
| LLM | echo fallback без ключа | **D** | `llm-task-executor.ts:59` `catch → echo` |
| TTS/STT | queued text note | **D** | `voice-service.ts:1` (`VoiceDelegates`) |
| E2B Python | validated queued ticket | **D** | `codeexec-service.ts:1` |
| Browser/Computer Use | `handoff: open_url... (no approved ticket)` | **D** | `computer-service.ts:36` |
| OAuth apps | `conn/*` только имя референса | **D** | `integrations-service.ts:1` |
| Telephony | queued transcript | **D** | `voice-service.ts:1` |
| Search providers | local-knowledge fallback | **D** | `search-service.ts:1` |
| Embeddings | hash 384 | **E** | `default-embedding-service.ts:1` |
| Warehouse seed | 3 tools + 5+4 skills + 4 lenses | **E** | `phase42:72` + `phase47:36` |

---

## 26. Dead / Orphaned Code

- **Баррель `contracts/index.ts:1190`** — порядок `rivals17`/`rivals14` перепутан (статический артефакт, не рантайм).
- **Контракты без панелей:** `rivals9` (OpenClaw/DSH) — панели нет, только Fleet `rivals` tab — **C**.
- **События без consumer:** часть `rival` событий (`rck:*`, `metan:*`) — пока только `emit`, consumer — Timeline (11) + stores (4) — остальные — dead (ожидают UI).

---

## 27. External Project Matrix (фактически перенесённые механизмы, не `covered`)

> Формат: `Project | Capability | Exists | Status | Impl | Runtime | Gap` — как в промте.

| Project | Capability | Exists | Status | Impl | Runtime | Gap |
|---------|------------|--------|--------|------|---------|-----|
| CrewAI | Crew | yes | **B** | `CrewService` | partial | execution validation |
| CrewAI | Tool system | yes | **C** | `ToolRunner` | partial | capability injection |
| OpenClaw | SOUL | yes | **C** | `OpenClawService` (`phase47`) | partial | real scheduler |
| OpenClaw | HEARTBEAT | yes | **C** | `OpenClawService.dueCron` | partial | Gateway not wired |
| MCP | Tool protocol | yes | **B** | `MCPService`/`McpDeepService` | unknown | integration validation |
| DeepSeek Harness | Plugins/presets | yes | **B** | `DshService` | partial | trajectory replay |
| Kimi | Adapter | yes | **A** | `KimiAdapter` | working (with key) | — |
| RCK | HRR/VSA | yes | **C** | `RckService` (`hv/bind/bundle`) | partial | provenance depth |
| ... | ... | ... | ... | ... | ... | ... |

*(Полная матрица — 100+ строк, не влазит в static — в `docs/INVENTORY_REPORT.md:8` — там же, но теперь с A-G.)*

---

## 28. GAP Matrix (приоритет)

| GAP | Статус | Что делать |
|-----|--------|------------|
| `Warehouse Registry → Agent` | **C** | Нужен `AgentFactory` (склейка Role+Skills+Tools+Persona+Policy+Model) |
| `Skills → Tools` | **C** | Связь `skill.manifest → tool.addTool` (сейчас только `ComposeService`) |
| `Vector search` | **C** | Заваять `IEmbeddingPort` провайдер (сейчас hash) |
| `Timeline full mapping` | **C** | 11 → 260 (сейчас только 11 fleet/ops маппингов) |
| `RBAC panel` | **C** | Доделать список всех + `Policy → Governance` wiring |
| `Provenance UI` | **C** | `ProvenancePanel` уже есть, но без рута `decisionId` из URL |
| `Fleet split` | **C** | 6 обёрток есть, но нет Studio-canvas (drag-drop) |
| `typecheck/build` | **G** (отложено) | Заход 2 на сильном ПК |

---

## 29. Critical Architectural Problems (static)

1. **Баррель контрактов перепутан** — `rivals17`/`rivals14`/`rivals13` порядок — `contracts/index.ts:1190` — статика, не рантайм, но сломает `typecheck`.
2. **Dotprompt vs PromptHub** — два мира `dotprompt/*` vs `prompts/*` — `phase42` unify пытается `try PromptHub first`, но персист разный — `DotpromptService` (`rivals10/dotprompt-service.ts:57`) — **C**.
3. **Fleet как монолит** — 1107 строк `FleetPanel.tsx:1` — 10 табов в одном файле — резать на 6 файлов уже начали (`FleetPanels/*`), но логика дублируется.
4. **Dexie v34 — миграции не гонялись** — additive, но `versionDefs` (`dexie-schema.ts:2800`) — 34 версии — нужен `TestDexie` прогон.

---

## 30. What Is Actually Strong Already (A)

- **EventBus + DI + Dexie additive** — ядро не ломано, фазы идемпотентны — **A**.
- **LLM bridge + ToolRunner** — `cacheScope` + per-agent model + governance gate — **A/B**.
- **Council + ArgTech + 6 форматов** — единый runtime + формальный second opinion — **B**, близко к **A**.
- **Graph wave-parallel + subgraph + Send + threads + `_approved`** — **B**, близко к **A**.
- **Fleet консоль** — 10 табов + deep-link `?tab=...&run=...` — **B**.

---

## 31. What Is Mostly Skeleton (C/D)

- **Warehouses** — каталоги без рантайм-инжекта в агента — **C**.
- **Interop Federation** — loopback `IInteropTransport` — **D**.
- **Voice/TTS/STT/E2B/OAuth** — handoff — **D**.
- **Marketplace backend** — local `SkillMarket.list` — **C** (remote JSON feed TODO).
- **Provenance/GraphViz** — панели есть, но без URL `decisionId` — **C**.

---

## 32. What Is Missing (G)

- **Embedding provider** — порт есть, реализации нет (hash — **E**).
- **Deploy** — `DeployPanel.tsx:1` базовый, нет `crew deploy push` анало́га (zip+env+logs) — **G**.
- **Studio canvas** — drag-drop граф/crew builder — **G** (есть `CognitiveBuilder` старый, но не для новых доменов).

---

## 33. Recommended Next Architecture (после Захода 2)

1. **AgentFactory** — `Role + Skills + Tools + Persona + Policy + Model → Agent` (1 сервис, закрывает GAP складов).
2. **Vector provider** — один embedding-провайдер (любой) + `KnowledgeService.setEmbedder` wiring (уже `DefaultEmbedding` — заменить).
3. **Timeline full** — `subscribeAll` → `timeline-service.ts:180` маппинг всех 260 (сейчас 11).
4. **Fleet split** — 6 файлов уже есть (`FleetPanels/*`), доделать Studio-canvas (drag-drop) как `CognitiveBuilder` для crews/councils.
5. **Deploy** — `crew deploy push` (zip + env + logs) + marketplace remote feed.
6. **Заход 2** — `typecheck:fast` → `build:skip-typecheck` → `vitest` срез новых фаз → починка барреля + фаз.

---

## STATICALLY VERIFIED / NOT RUNTIME VERIFIED

- **STATICALLY VERIFIED:** imports (все `registerPhase*` импортированы), exports (баррель `contracts/index.ts:1` — 1239 строк, `services-extras.ts:1` — 40+ lazy), registrations (43 фазы в `index.ts:44`), route wiring (`route-registry-content.ts:4` — 90 пунктов, `route-imports.ts:171` — 10+ lazy), DI (`helpers.ts:58` guard), DB tables (98 + keyValue), dead refs (нет висячих `registerPhase12`).
- **NOT RUNTIME VERIFIED:** `typecheck`/`build`/`tests` — 0 прогонов (weak PC), LLM-вызовы — echo/handoff без ключей, Dexie миграции — не гонялись.

> Следующий шаг — **Заход 2** на сильном ПК. До него — добивка складов по 3–5 за раз (как в Фазе P) + Fleet deep-links.

