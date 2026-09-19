# TEN SYSTEM COMPARISON — SuperAgents OS vs 10 Multi-Agent Frameworks

> Дата: 2026-09-06. Тип: **бумажный аудит, без кода** (промт A). Источник SuperAgents — `STATICALLY VERIFIED` (код `src/kernel/*`, `src/llm/*`, `phase23-53`, Dexie v34) — runtime `⏳` до Захода 2. Цель — не доказать «мы лучше», а ответить: *что есть у каждой системы, как реализовано, чем отличается, что позаимствовать*.

---

## Легенда

- **SuperAgents refs:** `AgentFactory` (`capability/agent-factory.ts:1`), `CapabilityResolver` (`capability-resolver.ts:1`), `ToolRunner` (`parity/tool-runner-service.ts:1`), `CrewService` (`crew/crew-service.ts:59`), `CouncilService` + `FormatService` (6 форматов), `GraphService` (`graph-service.ts:280` wave/subgraph/Send), `KnowledgeService`/`RagService`/`DefaultEmbedding` (hash 384), `Dexie v34` (98 таблиц), `TimelineService` (11→260), `GovernanceService`/`ProvenanceService`.
- **Статус SuperAgents:** `B ⏳` — реализовано, не гонялось на сильном ПК; `hash 384` — честно `medium` vs prod vector DB.

---

## 1) CrewAI

**Architecture:** Python, Crew = Agents + Tasks + Process (sequential/hierarchical/consensual). YAML/DSL config, `crewai-tools`.

**Agent model:** Role/Goal/Backstory + `allow_delegation`/`max_iter` + `memory: true`. `AgentFactory` SuperAgents — обобщает `Role`+`Persona`+`Skill→Tool`+`Model`+`Memory` в `ResolvedAgent`.

**Multi-agent:** `Process.hierarchical` = manager LLM delegates. SuperAgents — `hierarchical` + `consensual` (vote 3) + `contextTaskIds`.

**Tools:** 100+ (`crewai-tools`). SuperAgents — 11 built-in + `ToolRunner.addTool` (плюс платформенные skills как tools) — уже close, но зрелость каталога меньше.

**Skills:** CrewAI Tools как skills. SuperAgents — `SkillRegistry` (seed `json.get`/`text.stats`/`list.unique` + RU `yadisk/mail/vk/wb/metrica`) → `ToolRunner`.

**Memory:** Short/long-term + entity memory (Chroma). SuperAgents — `LtMemory` (core/recall/archival) + `CogMemory` (4×3 + governance) + `ScopedMem` — архитектурой глубже, retrieval: hash 384 (слабее Chroma hybrid).

**Planning:** `planning: True` = LLM генерирует план перед стартом. SuperAgents — `PlannerService` (4 strategies + plan_and_execute).

**Workflow/Graph:** Crews + Flows (декларативный). SuperAgents — `GraphService` (узлы `task/crew/council/subgraph`, edges `key=value`, wave-parallel `Promise.all`, `Send`, threads) — глубже run-time.

**HITL:** `human_input: True` на Task. SuperAgents — `humanInput` (Crew `awaiting_human`) + Graph `human`/`approve` (мобильный `approve(svg)`).

**MCP/Interop:** Нет first-class. SuperAgents — `MCPService` (discover) + `InteropService` (A2A/ACP выставлен в JSON-RPC, loopback).

**Evaluation:** `--eval`. SuperAgents — `EvalService` (contains/exact/token_f1).

**Governance:** Org-level RBAC (enterprise). SuperAgents — 6 ролей (capabilities/trust/policy/human) + Audit hash-chain.

**Persistence:** DB ext. SuperAgents — IndexedDB Dexie v34 (98 tables, local-first).

**UI:** Studio (drag-drop) + execution view. SuperAgents — Fleet 10 tabs (+ 6 проспектов), deep-link `?tab=` — без canvas.

**Strengths SuperAgents:** Graph wave-parallel, Council formal (Dung/Toulmin), local-first persistence, Dexie additive.

**Gaps:** Tool catalog зрелость, Studio canvas, vector DB гибрид.

**Differently:** CrewAI — YAML crews; SuperAgents — `AgentDefinition` + runtime composition.

**Borrow:** Studio execution view (timeline + raw traces) → `TimelineService` расширить 11→260.

---

## 2) LangGraph

**Architecture:** Python/JS, Pregel graph, StateGraph, checkpointers (LangGraph Platform). Studio + LangSmith.

**Agent model:** Node = LLM call; State = TypedDict. SuperAgents — `AgentFactory.execute` → LLM + ToolRunner loop — узел скрыт за `task`/`crew` нодами.

**Multi-agent:** Swarm/Network as graph. SuperAgents — `GraphService` with `crew`/`council` as nodes (higher-level).

**Tools:** `@tool` → LangChain tools. SuperAgents — `ToolRunner` (Zod schema + gate).

**Memory:** Checkpoint (MemorySaver) + Store. SuperAgents — `graphCheckpoints` + `CogMemory` (scope-aware).

**Planning:** `plan_and_execute` agent. SuperAgents — `PlannerService` аналогично.

**Workflow:** Pregel supersteps + `Send` + `subgraph`. SuperAgents — уже `wave-parallel` + `Send` + `subgraph depth ≤2` (почти паритет).

**HITL:** `interrupt_before/after` + `Command(resume=)`. SuperAgents — `editState`/`approve`/`restoreCheckpoint` — близко.

**MCP:** MCP adaptor в LangChain. SuperAgents — `McpDeepService` (client harness).

**Evaluation:** LangSmith evals (строже). SuperAgents — базовые `EvalService`.

**Governance:** Cloud RBAC. SuperAgents — `GovernanceService` локально.

**UI:** Studio canvas — reference.

**Strengths:** SuperAgents уже паритет по graph semantics; Council debate — уникально.

**Gaps:** LangSmith trace depth, Studio.

**Borrow:** LangGraph Studio canvas → после рантайма построить на `GraphService`.

---

## 3) AutoGen (AG2)

**Architecture:** Python, `ConversableAgent` + `GroupChat` + `GroupChatManager`.

**Agent model:** `ConversableAgent` auto-reply loop. SuperAgents — `AgentFactory` + `InvocationEngine` (loopback).

**Multi-agent:** `GroupChat` (round_robin / auto / manual) + Swarm handoff. SuperAgents — `InvocationEngine` (4 topologies) + `Gateway` + Council (debate).

**Tools:** `register_tool` + `can_execute`. SuperAgents — `ToolRunner` + `ToolGovernance`.

**Memory:** Conversation history only (ext.memory). SuperAgents — `LtMemory` + `CogMemory` deeper.

**HITL:** `human_input_mode`. SuperAgents — `awaiting_human` + Fleet mobile.

**MCP:** Нет. SuperAgents — есть.

**Strengths:** SuperAgents — memory + provenance глубже.

**Gaps:** AutoGen conversational loop зрелость (hour-long sessions).

**Differently:** AutoGen — chat-centric; SuperAgents — task/graph-centric.

**Borrow:** `GroupChatManager` speaker selection UX → Fleet Councils.

---

## 4) LlamaIndex

**Architecture:** Python/TS, data framework (loaders → index → query engine → agent).

**Agent model:** `ReActAgent`/`OpenAIAgent` over data. SuperAgents — `LlmBridge` (4 адаптера + `cacheScope`) + `ToolRunner`.

**Multi-agent:** Workflows (declarative) + AgentWorkflow. SuperAgents — `GraphService` (аналог Workflows).

**RAG:** Лучший в классе (vector + keyword + hybrid + rerank). SuperAgents — `KnowledgeService` (chunk + token-overlap + hash blend) — честно `medium` (позаимствовать hybrid).

**Persistence:** Vector DB pluggable. SuperAgents — IndexedDB (локально) + hash fallback.

**Strengths:** SuperAgents — OS (agents + governance + timeline); LlamaIndex — data depth.

**Gaps:** Hybrid retrieval maturity.

**Borrow:** Hybrid retrieval (BM25 + vector + rerank) → заменить hash blend.

---

## 5) OpenAI Agents SDK (Swarm → Agents SDK / Codex)

**Architecture:** Python/JS, `Agent` + `handoff` + `guardrail`, Codex CLI (terminal agent).

**Agent model:** System prompt + tools + handoffs. SuperAgents — `ResolvedAgent` (5 bindings) — шире.

**Multi-agent:** Swarm handoff (`transfer_to_*`). SuperAgents — `Gateway` handoff + Crew delegation.

**Tools:** Tool loop + `guardrail`. SuperAgents — `ToolRunner` + `ToolGovernance` (аналог guardrail).

**HITL:** Approvals in Codex. SuperAgents — Graph approve + Crews humanInput.

**MCP:** Via Codex ext. SuperAgents — first-class `MCPService`.

**Deployment:** Cloud-first. SuperAgents — `G missing` (нет `deploy push`).

**Strengths:** SuperAgents — composition (5 bindings) + local-first; OpenAI — hosted simplicity.

**Borrow:** Guardrail pattern (already `ToolGovernance`, усилить).

---

## 6) Google ADK

**Architecture:** Python, `Agent` + `Session` + `Runner` (Sequential/Parallel/Loop).

**Agent model:** `LlmAgent` + tools. SuperAgents — `AgentFactory` + `LlmBridge` multi-provider (23).

**Multi-agent:** `SequentialAgent`/`ParallelAgent`/`LoopAgent` + Swarm. SuperAgents — `GraphService` (task/crew/council) + `Fleet`.

**Memory:** Session scopes. SuperAgents — `SharedContext` (isolation + handoff) — аналогично.

**HITL:** `ask_user`. SuperAgents — `human` node.

**MCP:** MCP Toolbox for Databases. SuperAgents — loopback.

**Strengths:** SuperAgents — debate + metabolic (нестандарт).

**Gaps:** Vertex AI ecosystem depth.

**Borrow:** ADK `ParallelAgent` UX → Fleet wave визуализация.

---

## 7) MetaGPT

**Architecture:** Python, SOP = roles (Product Manager/Architect/Project Manager/Engineer) → artifacts (PRD/design/tasks/code).

**Workflow:** SOP flow 5 фаз. SuperAgents — `Phase52` `sop-software` crew (4 роли) + Graph 6 modes — близко; `software-crew` + `app-scaffold`.

**Agent model:** Role-based predefined prompts. SuperAgents — `RoleService` + `PersonaService` (15 lenses) — гибче.

**Tools:** Code interpreter ext. SuperAgents — `CodeExecService` (`code` kind, shallow).

**Strengths:** SuperAgents — общая OS vs MetaGPT заточен под software SOP.

**Gaps:** MetaGPT PRD/design артефакты зрелее.

**Borrow:** PRD→Design→Tasks артефакты как `Graph` nodes → `sop-software` усилить.

---

## 8) Mastra

**Architecture:** TS, agents + workflows + evals + `deployer` (Mastra Cloud).

**Agent model:** `Agent` + `Memory` (working + semantic). SuperAgents — `CogMemory` + `ScopedMem` — паритет.

**Memory:** Mastra Memory (thread-scoped). SuperAgents — `memoryScope` per-agent + `LtMemory`.

**Workflow:** `Workflow.step` (типобезопас). SuperAgents — `GraphService` (typed edges).

**Evaluation:** Built-in evals + scorers. SuperAgents — `EvalService` базовый (позаимствовать scorers).

**Deployment:** `mastra deploy` — reference (у SuperAgents `G missing`).

**Strengths:** SuperAgents — Council debate + governance локально.

**Gaps:** Mastra deploy/cloud зрелость.

**Borrow:** `mastra deploy` → `DeployPanel` (zip+env+logs).

---

## 9) Pydantic AI

**Architecture:** Python, typed agents (`Agent[Deps, Output]`), `result_type` (Pydantic), Logfire spans.

**Agent model:** `Agent` + `deps_type` + `result_validators` (retry). SuperAgents — `TypedAgent` (`depsType` + `outputSchema` + Zod validate+retry) — паритет.

**Tools:** `@agent.tool` typed. SuperAgents — `ToolRunner` (Zod).

**Memory:** Via Logfire + deps. SuperAgents — `CogMemory` deeper.

**Strengths:** SuperAgents — multi-agent orchestration поверх typed agents.

**Gaps:** Pydantic validation + Logfire maturity (глубже Zod).

**Borrow:** Logfire spans → усилить `TimelineService` + typed errors.

---

## 10) smolagents (Hugging Face)

**Architecture:** Python, `CodeAgent` (LLM пишет Python) + `ToolCallingAgent`, 3 lines to agent.

**Tools:** `@tool` + `PythonInterpreterTool`. SuperAgents — `CodeExecService` + `ToolRunner` (shallow, позаимствовать sandbox depth).

**Memory:** Minimal. SuperAgents — deep memory.

**Planning:** Code generation as planning. SuperAgents — `PlannerService` explicit.

**Strengths:** SuperAgents — OS completeness (governance/provenance/timeline).

**Gaps:** Code execution sandbox зрелость (smolagents — E2B-like).

**Borrow:** `CodeAgent` mini-DSL + `InterpreterService` → усилить `CodeExecService`.

---

## Сводка: где SuperAgents глубже / где уступает / уникальное

**Глубже (честно, `deep`):** Multi-agent (Crew wave-parallel + Council formal + Graph Send/subgraph), Governance (6 ролей + Audit hash-chain), Persistence (Dexie 98 tables local-first), LLM bridge (23 providers + cacheScope + per-agent model), HITL (mobile approve).

**Уступает (честно, `medium/shallow`):** Tool catalog maturity (11 vs 100+), RAG hybrid (hash 384 vs vector+BM25+rerank), Studio canvas (Fleet tabs vs drag-drop), Deployment (`G missing`), Browser/CodeExec (ticket-gated shallow).

**Уникальное:** Council 6 форматов + Dung/Toulmin/Brier/Kialo second opinion, Metabolic neuro-runtime (`self/star/field/self-eng` в `A self.ts:1`), ScopedMem + Cognee KG + LtMemory together, Provenance hypergraph.

**Что позаимствовать (приоритет):**
1. Hybrid RAG (BM25 + vector + rerank) — после замены hash на prod embed
2. Studio execution view (timeline raw traces) — `TimelineService` 11→260 уже начат
3. Deployment (`mastra deploy` / CrewAI `deploy push`) — zip + env + logs
4. Code sandbox depth (smolagents/E2B) — усилить `CodeExecService`

---

## Следующий шаг

**Заход 2 на сильном ПК** — `typecheck:fast` → `build:skip-typecheck` → `vitest` → Dexie v23→v34 → LLM smoke → E2E `AgentFactory.createResolved → execute(tool) → CogMemory` (`golden-e2e.test.ts:1`). До него — никаких `FINAL_GAP_ANALYSIS` (нужен `RUNTIME GAP`).
