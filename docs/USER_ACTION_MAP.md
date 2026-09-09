# USER ACTION → RESULT — 5 канонов SuperAgents OS (карта, без кода)

> Дата: 2026-09-06. Промт 5: не писать код, построить окончательную карту `USER ACTION → CANONICAL UI → RUNTIME ENTRY → SERVICES → RESULT`. Fleet резать — не сейчас.

---

## Как читать

```
USER ACTION          — что нажимает пользователь (кнопка)
CANONICAL UI         — куда идти (1 из 5 канонов)
RUNTIME ENTRY        — какую функцию зовёт UI (C-слой)
SERVICES             — какие B-сервисы реально работают
RESULT               — что видит пользователь + где persists
```

---

### 1) Создать агента

```
Создать агента
 ↓
Fleet / Persona  →  [Create]  (будущий AgentFactoryPanel, сейчас — Fleet — Persona)
 ↓
AgentFactory.createResolved({
  roleId,          // RolesPanel → RoleService
  personaId,       // PersonaService.promptFor
  skillIds,        // SkillMarket.list
  toolIds,         // ToolRunner.listTools
  model,           // adapter-factory (23 провайдера)
  memoryScope,     // SharedContext / CogMemory
})
 ↓
CapabilityResolver
 ├─ Role     → GovernanceService.checkCapability(role:execute)
 ├─ Persona  → PersonaService.promptFor → system prompt
 ├─ Skill    → SkillMarket.permissions → ToolRunner tools
 ├─ Tool     → ToolGovernance.check
 ├─ Model    → LlmBridge (cacheScope + per-agent model)
 └─ Memory   → CogMemoryService / LtMemoryService (scope)
 ↓
kv: agent-def/<id>  (persist)
 ↓
AgentFactory.execute(id, task)
 ↓
LLM (cacheScope) → ToolRunner.runWithTools (maxRounds 2) → CogMemory.write(episodic) → kv: agent-run/<id>/<ts> → EventBus: agent:executed
 ↓
RESULT: { output, toolCalls } + episodic memory (retrievable) + timeline event
```

**Статус:** `A/B` — wiring есть (`capability-resolver.ts:1`, `agent-factory.ts:1`, `phase53-capability`), E2E тест написан (`golden-e2e.test.ts:1`) — не гонялся.

---

### 2) Создать команду

```
Создать команду
 ↓
Fleet — Crews → Forge (goal) → Run  (или Template)
 ↓
AgentForgeService.propose(goal) → CrewService.createCrew({roles, tasks}) → CrewService.startCrew(id)
   ├─ 8 шаблонов (research-team, code-review, content-forge, debate-prep, sop-software, deep-research, support-inbox, app-scaffold)
   ├─ Process: sequential / hierarchical (+delegation) / consensual (vote 3) / + humanInput → paused → submitHumanTask → resumeCrew
   ├─ Guardrails: outputSchema (contains/minLength) → retry 1
   └─ Context: contextTaskIds (CrewAI `context`)
 ↓
LlmCrewExecutor (per-agent model + guideFor + toolRunner branch)
 ↓
kv: crews / crewTasks (v23) + checkpoints (если через Graph)
 ↓
RESULT: CrewRunResult { status: completed|failed|paused, outputs: Record<taskId,string> } + events crew:* / task:*
```

---

### 3) Создать дебаты

```
Создать дебаты
 ↓
Fleet — Councils → Topic → Create → Advance → Conclude
  (или FormatService.run('oxford'|'ld'|'popper'|'deliberative'|'munk'|'adversarial', topic))
 ↓
CouncilService.createSession({topic, config, participants (proponent/opponent/researcher/fact_checker + lens/polarity), judges})
 ↓
Phases: proposal → fact_gathering (Researcher) → debate (Forum/Whisper, double-blind aliases Speaker A…) → consensus
 ↓
Judge: multi-judge weighted tally + audience advisory → winnerId + summary
  + ArgTech second opinion: Dung grounded/preferred, Toulmin completeness, Brier, Kialo treeScore
  + Evidence: FactPacket (verified/disputed) + sources (KnowledgeService)
 ↓
kv: councilSessions/councilMessages/councilVotes (v24, facts/scores/votes в councilVotes kind)
 ↓
RESULT: CouncilSession { winnerId, summary, facts, scores, votes } + events council:* / format:*
```

---

### 4) Создать workflow (граф)

```
Создать workflow
 ↓
Fleet — Graphs → Build & run graph → Approve/Reject (телефон)
  (или CognitiveBuilder — старый визуальный)
 ↓
GraphService.defineGraph({nodes, edges, entryNodeId}) → GraphService.runGraph(id, input)
  ├─ Nodes: task / crew / council / reflection / gate / human / subgraph (depth ≤2)
  ├─ Edges: condition `key=value` / `key!=value` / truthy
  ├─ Execution: wave-parallel (Promise.all) + deterministic merge + Send (`state['send:<id>']`) + `_approved` fix
  ├─ Delegates: runCrew → CrewService, runCouncil → CouncilService, forgeDraft → AgentForgeService
  └─ HITL: requireApproval/human → paused → approve(editedState) / reject / editState / restoreCheckpoint
 ↓
kv: graphs / graphRuns / graphCheckpoints / graphDecisions / threads (v25+v33)
 ↓
RESULT: GraphRun { status: completed|paused|failed, visited, state, result } + decisionLog + checkpoints + events graph:*
```

---

### 5) Работа со знаниями

```
Работа со знаниями
 ↓
Memory (Fleet — Persona: contexts/goals + MemoryPanel)
 ↓
KnowledgeService.addSource({kind:url|text, title, uri/content}) → chunk → KnowledgeSource (v32)
  ↓ retrieve(query) — token-overlap + DefaultEmbedding (384 hash, blend 0.6/0.4) → cited
RagService.answer(query, refineRounds) — rewrite→retrieve→synthesize→critique→refine
LtMemoryService (core/recall/archival) + CogMemoryService (4×3 + governance) + ScopedMem (Mem0) + Cognee KG
 ↓
kv: knowledgeSources + ltMemories / cogMemories / scopedMem / cognee/*
 ↓
RESULT: cited answer + persisted memory (episodic) + timeline event
```

---

## Что это даёт

- Пользователю — **5 кнопок** вместо 260 событий и 271 сервиса.
- Системе — **один путь на домен**: `UI → Runtime Entry → Domain → Infrastructure` (EventBus/Dexie/DI — под капотом).
- Команде — **приоритет**: не новые capabilities, а **Заход 2** (typecheck → build → vitest → Dexie → LLM smoke → E2E `agent → tool → memory`).

> Fleet резать — не сейчас (1107 строк неприятно, но не главная проблема). Canvas — после рантайма.

---

## Дальше

```
Phase X ✅ → 5 bindings hardening ✅ → Golden E2E (written) ✅ → Legacy map ✅ → Timeline declarative (3/260) → Fleet wrappers (6)
 ↓
USER_ACTION_MAP ✅ (этот файл)
 ↓
─────────────────
ЗАХОД 2 (сильный ПК)
typecheck:fast → build:skip → vitest → Dexie migrations → LLM smoke → real Tool → E2E Agent → Tool → Memory
─────────────────
```

С богом — карта готова, новых систем не добавляем до Захода 2.
