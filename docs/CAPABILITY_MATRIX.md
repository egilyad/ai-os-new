# CAPABILITY MATRIX — SuperAgents OS (STATICALLY VERIFIED, NOT RUNTIME VERIFIED)

> Дата: 2026-09-06. Статусы: **A REAL / B IMPLEMENTED ⏳ / C PARTIAL / D STUB / E MOCK / F DOC ONLY / G MISSING**. `⏳` = runtime не гонялся (слабый ПК). Глубина: `deep` = production-like, `medium` = working but shallow, `shallow` = stub.

## Метод

- **Existence** — есть ли код?
- **Integration** — подключено ли к остальной OS (DI/EventBus/DAL)?
- **Runtime** — гонялось ли (Заход 2)?
- **Maturity** — насколько глубоко vs reference.

Бары — 10 делений: `██████████` = 10, `█████` = 5.

---

## 1) CORE CAPABILITIES

| Capability | SuperAgents | Код | Existence | Integration | Runtime | Maturity | Глубина |
|------------|-------------|-----|-----------|-------------|---------|----------|---------|
| **Agent creation/composition** | ✅ | `AgentFactory` (`capability/agent-factory.ts:1`), `CapabilityResolver` (`capability-resolver.ts:1`), `AgentDefinition` (`types/capability-types.ts:1`) | 8 | 7 | 3 ⏳ | 6 | medium | `createResolved` → `ResolvedAgent` (5 bindings) |
| **Tool calling** | ✅ | `ToolRunner` (`parity/tool-runner-service.ts:1`, 11 tools) + `ToolCatalogService` (`catalog/tool-catalog-service.ts:1` — unified catalog runner∪skillMarket∪mcp, phase55) | 9 | 8 | 4 ⏳ | 8 | deep (gate+loop+catalog) |
| **Memory** | ✅ | `CogMemory`/`LtMemory`/`ScopedMem`/`Cognee` (`services/meta/`, `persona/`, `rivals2/scopedmem`) | 9 | 7 | 3 ⏳ | 6 | medium (hash 384, не vector DB) |
| **RAG / Knowledge** | ✅ | `KnowledgeService` (`parity/knowledge-service.ts:1`), `HybridRetrievalService` (`rag/hybrid-retrieval-service.ts:1` — BM25+RRF+rerank, phase54), `RagService` (`rivals2/rag-service.ts:1`) | 8 | 7 | 3 ⏳ | 7 | medium→deep static (BM25+vector+RRF+StubRerank done; provider embed/rerank = PROVIDER-PENDING BLOCKED-RUNTIME) |
| **Multi-agent (Crews)** | ✅ | `CrewService` (`crew/crew-service.ts:59`) — 8 шаблонов | 9 | 8 | 4 ⏳ | 8 | deep (wave-parallel, consensual, humanInput) |
| **Council / Debate** | ✅ | `CouncilService` (`council/council-service.ts:1`) + `FormatService` (6 форматов) + `ArgTech` | 9 | 8 | 4 ⏳ | 8 | deep (single runtime + formal second opinion) |
| **Graph / Workflow** | ✅ | `GraphService` (`graph/graph-service.ts:280` — wave, subgraph, Send, threads) | 9 | 8 | 4 ⏳ | 8 | deep |
| **Planning** | ✅ | `PlannerService` (`rivals/planner-service.ts:1` — 4 strategies + `plan_and_execute`), `ReasoningService` | 8 | 6 | 3 ⏳ | 6 | medium |
| **HITL** | ✅ | `Graph` (human/approve) + `Crew` (`awaiting_human`) + `Mobile` | 9 | 7 | 4 ⏳ | 7 | deep |
| **MCP** | ⚠️ | `MCPService` (`services/mcp-service.ts:380`) + `McpHarnessService` (`interop/mcp-harness-service.ts:1` — reconnect+proxy+health, phase60) | 7 | 6 | 2 ⏳ | 6 | medium (reconnect+proxy done; real servers BLOCKED) |
| **Browser / Computer use** | ⚠️ | `ComputerService` (`rivals5/computer-service.ts:18`) + `BrowserHarnessService` (`browser/browser-harness-service.ts:1` — strict schemas 8 + policy + handoff artifact, phase59) | 7 | 5 | 1 ⏳ | 5 | shallow→medium static (schemas+artifact done; real browser BLOCKED-RUNTIME) |
| **Code execution** | ⚠️ | `CodeExecService` (`rivals5/codeexec-service.ts:1`) + `CodeSandboxService` (`sandbox/code-sandbox-service.ts:1` — policy+timeout+artifact, phase58) | 7 | 5 | 1 ⏳ | 5 | shallow→medium static (policy+timeout+artifact done; real E2B BLOCKED-RUNTIME) |
| **Governance** | ✅ | `GovernanceService` (`trust/governance-service.ts:1` — capabilities/trust/policy/human roles) | 8 | 6 | 3 ⏳ | 6 | medium |
| **Permissions / Trust** | ✅ | `ToolGovernance` + `TrustScores` + `PolicyRules` (v30) | 8 | 6 | 3 ⏳ | 6 | medium |
| **Observability** | ✅ | `TimelineService` (`timeline-service.ts:180`) + `ExecutionVizService` (`timeline/execution-viz-service.ts:1` — overlay+trace, TIMELINE_MAP 60 phase56) | 8 | 7 | 3 ⏳ | 7 | medium→deep static (60 mapped + overlay; canvas drag-drop BLOCKED) |
| **Provenance** | ✅ | `ProvenanceService` (`trust/provenance-service.ts:1` — BFS), `GraphVizService` | 7 | 5 | 3 ⏳ | 5 | medium |
| **Evaluation** | ✅ | `EvalService` (`frontier/eval-service.ts:1` — contains/exact/token_f1) + `ScorerRegistryService` (`eval/scorer-registry-service.ts:1` — 3 builtins + registry) + `LlmJudgeService` (`eval/llm-judge-service.ts:1` — stub PROVIDER-PENDING, phase61) | 8 | 6 | 3 ⏳ | 7 | medium→deep static (registry+judge done; real LLM judge BLOCKED-RUNTIME) |
| **LLM providers** | ✅ | `AdapterFactory` (`llm/registry/adapter-factory.ts:55` — 23) + 11 decorators + `reasoningContent` | 9 | 9 | 5 ⏳ | 8 | deep |
| **Persistence** | ✅ | `Dexie v34` (98 таблиц) + `DAL` + `_test-harness` | 10 | 9 | 4 ⏳ | 8 | deep (additive, не гонялось) |
| **Agent identity / Persona** | ✅ | `PersonaService` + `CharacterService` + `AgentCard` | 8 | 6 | 3 ⏳ | 6 | medium |
| **Communication / handoff** | ✅ | `InvocationEngine` + `Gateway` + `Federation` (loopback) | 7 | 5 | 2 ⏳ | 4 | medium (transport loopback) |
| **Deployment** | ⚠️ | `DeployService` (`deploy-service.ts:1` MOCK) + `DeployBundleService` (`deploy/deploy-bundle-service.ts:1` — bundle env REDACTED+startScript+files+hash, phase57) | 7 | 5 | 1 ⏳ | 5 | shallow→medium static (local bundle done; real zip/cloud BLOCKED-RUNTIME) |
| **Browser LLM (Studio canvas)** | ❌ | `CognitiveBuilder` старый | 3 | 2 | 0 | 2 | G missing (drag-drop для новых доменов) |

**Пример глубины (честно):**

```
Memory

Existence       ██████████  (есть)
Integration     ████████    (подключено к AgentFactory)
Runtime         ███         (⏳ не гонялось)
Maturity        ██████      (hash 384, не vector DB + hybrid rerank)
→ У конкурента с Pinecone + hybrid → Maturity █████████
→ На чекбоксе оба ✅, по факту — разные миры
```

---

## 2) 10-SYSTEM COMPARISON (сильные / слабые / иначе / уникальное)

> Не проценты. `strengths` — где SuperAgents сильнее, `gaps` — где уступает, `иначе` — другая архитектура, `уникальное` — есть только у нас. Runtime `⏳` — честно.

### CrewAI
- **SuperAgents сильнее:** Graph wave-parallel + Council formal (Dung/Toulmin) + Fleet deep-links
- **Уступает:** 11 tools vs 100+, Studio canvas (drag-drop) vs Fleet tabs
- **Иначе:** Crew templates 8 vs CrewAI YAML
- **Уникальное:** hash-chain Audit + Provenance

### LangGraph
- **Сильнее:** Council debate как first-class, Fleet mobile HITL
- **Уступает:** Studio/LangSmith полноценный
- **Иначе:** Graph `Send`/`subgraph` уже есть, но Pregel super-steps — wave-parallel (близко)
- **Уникальное:** Metabolic (русская школа) — нет аналога

### AutoGen
- **Сильнее:** GroupChat + Guardrails + MemoryBlocks (Letta) в одном OS
- **Уступает:** ConversableAgent auto-reply зрелость
- **Иначе:** Speaker selection auto/round_robin/manual — так же
- **Уникальное:** 6 форматов дебатов (Oxford/LD/Popper…)

### LlamaIndex
- **Сильнее:** RAG loop + knowledge + vector fallback в одной OS
- **Уступает:** LlamaIndex data connectors зрелость
- **Иначе:** retrieve→synthesize→critique одинаково
- **Уникальное:** Cognee KG + LtMemory tiers

### OpenAI Agents (Codex / Swarm)
- **Сильнее:** Fleet HITL approve/reject с телефона
- **Уступает:** Swarm handoff фильтры тонкой настройки
- **Иначе:** tool loop `runWithTools` одинаково
- **Уникальное:** 6 governance ролей

### Google ADK
- **Сильнее:** Persona/Voice distill + Council lenses
- **Уступает:** Vertex AI integration depth
- **Иначе:** Session scopes + Parallel/Loop runners — так же
- **Уникальное:** Metabolic neuro-runtime

### MetaGPT
- **Сильнее:** Graph 6 режимов vs SOP 5 фаз
- **Уступает:** SOP артефакты (PRD/design) зрелость
- **Иначе:** software-crew 4 роли vs MetaGPT 5 — близко
- **Уникальное:** Provenance hypergraph

### Mastra
- **Сильнее:** Evals + simulation + orgs/intent/modal в одном
- **Уступает:** Mastra deploy/cloud зрелость
- **Иначе:** Tool calling одинаково
- **Уникальное:** ErrorInbox fingerprint

### Pydantic AI
- **Сильнее:** TypedAgent (Zod validate+retry) + Memory
- **Уступает:** Pydantic Logfire spans
- **Иначе:** deps injection одинаково
- **Уникальное:** Council Brier calibration

### smolagents (CodeAgent)
- **Сильнее:** CodeAgent mini-DSL + ToolRunner gate
- **Уступает:** smolagents code execution sandbox зрелость
- **Иначе:** tool(args) DSL одинаково
- **Уникальное:** Dreamer WorldModel + NeuroSymbolic

---

## 3) Что выглядит реализованным, но runtime ⏳

- **AgentFactory** — код есть (`capability/agent-factory.ts:1`), wiring есть (`phase53-capability`), но `typecheck:fast` + `golden-e2e.test.ts:1` не гонялись → **B ⏳**
- **Tool calling** — `ToolRunner` deep, но Crew tool-loop ветка (`llm-task-executor.ts:59`) — новая, не гонялась → **B ⏳**
- **Memory** — hash 384 — deep, но provider embed не заварен → **B ⏳**
- **MCP/Browser/CodeExec/Deployment** — **C/D** + **G** — stub, не гонялось

---

## 4) Идеи стоит позаимствовать (честно)

- **LangGraph Studio** — canvas для Graph/Crew (после рантайма)
- **CrewAI Studio** — execution view (timeline + raw traces)
- **Pydantic Logfire** — spans для TypedAgent
- **MCP Deep** — client harness auto-reconnect (уже `McpDeepService`, но нужен real server test)

---

## Статус

**STATICALLY VERIFIED / NOT RUNTIME VERIFIED** — матрица построена по коду (`src/kernel/services/*`, `src/llm/*`, `src/components/*`, `docs/INVENTORY_REPORT.md` как контекст, не как факт). Runtime бары `⏳` — до Захода 2 на сильном ПК.

Следующий шаг — **RUNTIME VERIFICATION** (typecheck → build → vitest → Dexie → LLM smoke → E2E `agent → tool → memory`).
