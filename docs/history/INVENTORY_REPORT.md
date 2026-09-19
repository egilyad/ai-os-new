# Инвентаризация SuperAgents OS — полный разбор (без проверок)

> Дата: 2026-09-06. Режим: только пишем, без `typecheck`/`build`/`tests`. Слабый ПК — финальная проверка отдельно.  
> Версия схемы: **Dexie v34** (`src/kernel/services/dexie-schema.ts:280`), **43 фазы** регистрации (`src/kernel/service-registration/index.ts:44`), **~240 событий** (`src/kernel/events/event-registry.ts:28`), **98 Dexie-таблиц**, **46+ доков** в `docs/`.

---

## 1) Executive summary

- **Базовый продукт (до нас):** Kernel + EventBus + EventSourcing + Cognitive Builder + Debate Arena + Memory Mesh — local-first, IndexedDB, Web Workers.
- **Что добавлено нами (волны 1–5 + фазы A–Q):**
  - Волна 1 — Crew/Task/Forge (`src/kernel/service-registration/phase23-crew.ts:1`): Dexie `crews`/`crewTasks` (v23), 10 событий `crew:*`/`task:*`/`forge:proposed`.
  - Волна 2 — Council (`phase24-council.ts:1`): 10 линз + 4 полярности (`src/kernel/services/council/council-lenses.ts:1`), Forum/Whisper, double-blind, fact-gathering, blind judge, multi-judge, audience, граф-нода (`council-graph-node.ts:1`), v24.
  - Волна 3 — Graph (`phase25-graph.ts:1`): 6 режимов, wave-параллелизм + `subgraph` + Send (`state['send:<id>']`) + threads + `_approved` фикс, v25, 12 событий `graph:*`.
  - Волна 4 — Persona & Context (`phase26-persona.ts:1`): tiers core/recall/archival + граф, Person/Voice, Shared Context/Goals, v26, 10 событий.
  - Волна 5 — Ops (`phase27-ops.ts:1`): hierarchy + budgets + hash-chain Audit, MCP governance + sandbox tickets, skill marketplace, fleet monitor, mobile pairing/HITL, v27.
  - Фаза A — Interop (`phase28-interop.ts:1`): A2A + gateway + translation + federation + handoff + market/contract-net/routing — v28.
  - Фаза B — Meta (`phase29-meta.ts:1`): self-improvement + skill evolution + health + strategies + unified memory — v29.
  - Фаза C — Trust (`phase30-trust.ts:1`): capabilities + trust + policy + provenance + extensions/bundles/surfaces/snapshots — v30.
  - Фаза D — Frontier (`phase31-frontier.ts:1`): бенчмарки + A/B + red-team + симы/нормы/орги/intent/многомодальность — v31.
  - Фаза E — Паритет CrewAI (`phase32-parity.ts:1`): реальный LLM-мост (4 адаптера), 8 built-in tools + loop, Knowledge RAG, training guides, FleetPanel — v32.
  - Фаза F — 10 проектов (`phase33-rivals.ts:1`): LangGraph-waves/subgraph/Send/threads, GroupChat/Guardrails/MemoryBlocks/SOP/Loops/RunQueue/Planner/Dyad — v33.
  - Фаза G — 10 проектов (`phase34-rivals2.ts:1`): ReAct/Loader/RAG + Runtime/SWE/Aider/Modes + ScopedMem/Integrations/Character — v34 (scopedMem).
  - Фаза H — 10 проектов (`phase35-rivals3.ts:1`): Reasoning/Sessions/Datasets/FlowAPI + DocStore/TypedAgent/CodePlan + Dialogue/BotRouter/Prototype — kv only.
  - Фаза I — 10 проектов (`phase36-rivals4.ts:1`): Copilot/Bedrock/CX/Agentforce + Kore/Campaign/Employee + CodeAgent/Assistant/Gum — kv only.
  - Фаза J — 10 проектов (`phase37-rivals5.ts:1`): AppBuilder/IDE/PromptHub + Ontology/ACL/WorkQueue/Writer + Computer/Search/CodeExec — `code` в SandboxKind — kv only.
  - Фаза K — 10 проектов (`phase38-rivals6.ts:1`): n8n/Make/Zap + Temporal/Asset/Sensor + Voice/Support/Verify/Deck — kv only.
  - Фаза L — дебаты (`phase39-debateplus.ts:1`): 6 форматов + Dung/Toulmin/Brier/Kialo — kv + council.
  - Фаза M — форум/когнитивка/диагностика (`phase40-rivals7.ts:1`): polls/decisions/Polis + Reflexion/ToT/SelfCon/SOAR/Atom + meters/error inbox — kv only.
  - Фаза N — хайп (`phase41-rivals9.ts:1`): 4 китайских адаптера + reasoningContent + OpenClaw/DSH/Manus/Genspark — kv only.
  - Фаза P — Google + Chat Studio (`phase42-rivals10.ts:1`): A2A spec/cache/dotprompt/notebook + Live/Assist/Vertex/DeepResearch + Quota/StudioPack + склады — kv only.
  - Фаза Q — визуализации/симы (`phase43-rivals11.ts:1`): NetLogo/Mesa/Bonsai + Chainlit/Gradio/Charts/GraphViz + Malmo/Gym — kv only.

**Покрытие:** изначально 100+ проектов по сравнению (CrewAI → Google + Studio) — все фирменные механизмы переведены в first-class модули. «Покрыт» = паттерн реализован в ядре; «работает» = после финальной проверки с реальными ключами/делегатами.

---

## 2) Хранилище — что где лежит

### 2.1 Dexie: 98 таблиц (v1→v34 additive)

- **Ядро (v5–v11):** `notes`, `memories`, `apiKeys`, `sessions`, `roles`, `cognitiveTraces`, `traces`, `skills`, `connectors`, `keyValue`, `debateSessions`, `debateVerdicts`, `debateTimeline`, `debateOverrides`, `sessionLinks`, `eventLog` (`src/kernel/services/dexie-schema.ts:157`).
- **Когнитивка (v13–v17):** `crystals`, `crystalVersions`, `junctions`, `synthSessions`, `synthPerspectives`, `genJobs`, `forumTopics/Posts/Votes/Subs`, `workflows` (builder), `scenarios` (director v19), `invocations`/`invocationPolicies` (v20), `invocationCosts` (v21), `directorSessions` (v22).
- **Новые волны (v23–v34):**

| Версия | Таблицы | Смысл |
|-------- | ------- | ----- |
| v23 | `crews`, `crewTasks` | Команды и задачи |
| v24 | `councilSessions`, `councilMessages`, `councilVotes` | Продвинутые дебаты |
| v25 | `graphs`, `graphRuns`, `graphCheckpoints`, `graphDecisions` (+ `threads` в v33) | State Graph + checkpoints + threads |
| v26 | `ltMemories`, `memoryLinks`, `personaProfiles`, `voices`, `personaDepths`, `sharedContexts`, `contextEntries`, `goals` | Память/персона/контексты |
| v27 | `hierarchyNodes`, `auditLog`, `mcpServers`, `toolGrants`, `sandboxTickets`, `skillManifests`, `missionWatches`, `mobileSessions`, `notifications` | Ops/mobilе |
| v28 | `a2aAgents`, `fedPeers`, `handoffs`, `collabContracts`, `marketListings`, `marketBids` | Интероп |
| v29 | `improvements`, `strategies`, `decompositions`, `healthSignals`, `cogMemories`, `memPolicies`, `counterfactuals`, `knowledgePackages` | Мета |
| v30 | `capabilities`, `trustScores`, `policyRules`, `govRoles`, `provenanceNodes/Edges`, `extensions`, `bundles`, `surfaces`, `osSnapshots` | Trust/экосистема |
| v31 | `benchmarks`, `evalRuns`, `redFindings`, `simulations`, `societyNorms`, `orgs`, `intents`, `modalCaps` | Frontier |
| v32 | `knowledgeSources`, `trainGuides` | Паритет CrewAI |
| v33 | `agentLoops`, `groupChats`, `memoryBlocks`, `runQueue`, `threads` | 10 проектов (LangGraph-паритет) |
| v34 | `scopedMem` | Scoped memory (Mem0) |

> Остальные фазы (H–Q) — на **kv** (`keyValue` с префиксами `copilot/`, `cxf/`, `genkit/`, `notebooks/`, `chainlit/`, `bots/`, `datasets/`, `flowapi/`, `docstore/`, `scopes/`, `integrations/`, `n8n/`, `temporal/`, `assets/`, `polis/`, `reflexion/`, `soar-wm/`, `atoms/`, `meters/`, `errinbox/`, `soul/`, `dsh-plugins/` …). Это экономит миграции и держит схему лёгкой.

- **Тест-харнес:** зеркалит все таблицы (`src/kernel/dal/_test-harness.ts:120`).

### 2.2 keyValue-пространства (kv)

> Примеры ключей (неисчерпывающе):

- `sstate/<scope>/<id>` — ADK scoped state; `modes/<name>` / `modes/custom:<id>` — Roo modes; `datasets/<id>` + `annotations`; `flowapi/<token>`; `docstore/<id>`; `conn/<id>` (authRef-имена), `clients/<id>`; `n8n/<id>` + `n8n-runs/*`; `durable/<id>` + `durable-inbox/*`; `assets-def/*` + `assets-value/*`; `calls/<id>` (voice); `tickets/<id>` + `macros/*` + `verify/*` + `gaps/*`; `chainlit/<id>`; `copilot/<id>` + `copilot-vars/*`; `cxf/<id>` + `cxf-state/*`; `force/<id>`; `campaigns/<id>` + `campaign-ticks/*`; `employees/<id>`; `assistants/<id>`; `gumform/*` + `vault-refs/*`; `a2aspec-card/*` + `a2aspec-task/*`; `ccache/*` + `dotprompt/*` + `notebooks/*` + `live/*`; `quota-use/*` + `quota-max/*` + `quota-off/*`; `nlworld/*`, `mesa/*`, `bonsai-sim/*` + `bonsai-lesson/*` + `bonsai-q/*`; `atomlinks/*`, `atoms/*`; `meter-*`; `errgroup/*`; `claw-*`, `dsh-plugins/*`, `manus-sched/*`, `trajectory/*` …

---

## 3) Склады (warehouses) — инвентарь

### 3.1 Tools (выполнение)

- **Ядро:** `src/kernel/services/tool-executor.ts:1` — sandbox-исполнение скриптов (AST-guard, allowlist).
- **Мост:** `src/kernel/services/parity/tool-runner-service.ts:1` — 8 built-in + `addTool()` API:
  - `workspace.list/read/search` (делегирует `WorkspaceService`), `http.fetch` (SSRF-guard), `time.now`, `math.calc` (безопасный парсер без `eval`), `knowledge.search`, `mcp.call` (реальный `MCPService`).
- **Сид Фазы P:** добалвяет `json.get`, `text.stats`, `list.unique` (`src/kernel/service-registration/phase42-rivals10.ts:72` — идемпотентно).
- **Гейты:** `ToolGovernanceService` (`src/kernel/services/ops/tool-governance-service.ts:1`) — `check(agentId, tool)` — deny-wins + default-deny.
- **Покрытие по проектам:** Composio-catalog (20 apps), Bedrock action groups, SmolAgents mini-DSL `tool(args)` — всё через один `ToolRunner`.

| Склад | Что лежит | Где | Сколько (тип) |
|------ | --------- | --- | ------------- |
| Built-in tools | workspace/http/time/math/knowledge/mcp | `tool-runner-service.ts:1` | 8 + 3 seeded = **11** |
| MCP tools | любые `serverId:tool` через `MCPService.callTool` | `src/kernel/services/mcp-service.ts:380` | динамически (прокси) |
| Guardrails | `GuardrailService` правила | `src/kernel/services/rivals/guardrail-service.ts:1` | N правил (kv: `guard/*`) |

### 3.2 Skills / Toolkits / Bundles

- **Marketplace:** `src/kernel/services/ops/skill-market-service.ts:1` — `publish/list/install/uninstall/exportManifest` (JSON `{kind:'skill-manifest'}`).
- **Toolkits:** `RunQueueService` (`src/kernel/services/rivals/runqueue-service.ts:1`) — `defineToolkit(name, prefixes[])`, `toolkitAllows()` — префикс-гейт поверх `ToolRunner`.
- **Bundles:** `EcosystemService` (`src/kernel/services/trust/ecosystem-service.ts:1`) — one-click паки (cards+crews+skills+memory packs) с реальными делегатами.

| Склад | Сид (Фаза P) | Где лежит код |
|------ | ------------ | ------------- |
| Skills | 5 манифестов: `Deep Researcher`, `Code Reviewer`, `Translator`, `Summarizer`, `Repo Guide` | `phase42-rivals10.ts:72` (seed) |
| Toolkits | 4 DSH-пресета: `dsh-standard/code/minimal/creative` | `src/kernel/services/rivals9/dsh-service.ts:18` |
| Toolkits (custom) | `defineToolkit` — любые наборы | `runqueue-service.ts:1` |
| Bundles | `publishBundle/installBundle` | `ecosystem-service.ts:1` |

### 3.3 Roles / Teams / Agents

- **Roles:** `src/kernel/services/role-service.ts:1` (builtin-набор, не трогали — seed складов отложен на финалку).
- **Teams:** `src/kernel/contracts/role-team.ts:1` (группы + execution strategies).
- **Agents:** `src/kernel/services/agent-service.ts:80` — runtime agents (LLM-вызовы, lifecycle).
- **Council participants:** линзы/полярности (`src/kernel/services/council/council-lenses.ts:1`).
- **Lenses (cognitive) + templates (crew):**

| Склад | Что лежит | Где | Кол-во |
|------ | --------- | --- | ------ |
| Cognitive lenses | `lens-library.ts:1` — critical/second-order/security/economic/… + `meta-meta` | `src/kernel/services/lens-engine/lens-library.ts:1` | **13** (из файла видно 10+ cut, всего 13 по коду) |
| Council lenses | Socrates/Feynman/Sun Tzu/Popper/Kahneman/Steelman/Devil/Systems/Empiricist/Historian + 4 полярности + 4 новых: premortem/redteam-lead/scout/base-rates | `council-lenses.ts:1` | **14 + 4 polarity** |
| Crew templates | research-team / code-review-council / content-forge / debate-prep + 4 новых: sop-software / deep-research / support-inbox / app-scaffold | `src/kernel/services/crew/crew-templates.ts:1` | **8** |

### 3.4 Profiles / Persona / Memory

| Склад | Что лежит | Где |
|------ | --------- | --- |
| LtMemory tiers | core/recall/archival + graph links | `src/kernel/services/persona/lt-memory-service.ts:1` |
| Person / Voice | distill из сэмплов (ядро `src/kernel/services/persona/persona-service.ts:1`), OpenClaw SOUL → CharacterDoc (`src/kernel/services/rivals9/openclaw-service.ts:1`), Eliza `CharacterService` (`src/kernel/services/rivals2/character-service.ts:1`), Cherry/Studio packs (`phase42`) |
| Memory blocks | Letta-style blocks (human/persona/system) + `memory.append/recall` tools | `src/kernel/services/rivals/memory-blocks-service.ts:1` |
| Scoped mem | `scopedMem` (Mem0) + kv `user:/agent:/run:/app:` | `src/kernel/services/rivals2/scopedmem-service.ts:1` |
| Cog memory | episodic/semantic/procedural/identity + governance + counterfactuals + packages | `src/kernel/services/meta/cog-memory-service.ts:1` |
| Cache | ContextCache registry + TTL sweep | `src/kernel/services/rivals10/cache-service.ts:1` |

### 3.5 Дебаты / Форум / Решения

| Склад | Что лежит | Где |
|------ | --------- | --- |
| Council sessions | proposal→fact_gathering→debate→consensus (+ double-blind, Forum/Whisper, multi-judge, audience) | `src/kernel/services/council/council-service.ts:1` |
| Debate formats | oxford/munk/LD/popper/deliberative/adversarial + swing/Brier | `src/kernel/services/debateplus/format-service.ts:1` |
| ArgTech | Dung grounded/preferred + Toulmin cards + Brier + Kialo trees + claim mining | `src/kernel/services/debateplus/argtech-service.ts:1` |
| Forum base | topics/posts/votes/subs + flood/consensus | `src/kernel/services/forum/forum-service.ts` (Модуль 6) |
| ForumPlus | polls/solved/trust levels/badges | `src/kernel/services/rivals7/forumplus-service.ts:1` |
| Polis | agree/disagree/pass + k-means-lite + consensus | `src/kernel/services/rivals7/polis-service.ts:1` |
| Дискуссионные | Discourse/Loomio decisions, dot-vote, ranked Borda | `src/kernel/services/rivals7/decision-service.ts:1` |

### 3.6 Диспетчерская / Графы / Оркестрация

| Склад | Что лежит | Где |
|------ | --------- | --- |
| Graph runtime | 6 режимов + wave-parallel + subgraph + Send + threads | `src/kernel/services/graph/graph-service.ts:280` |
| Temporal | durable steps + signals + retries | `src/kernel/services/rivals6/temporal-service.ts:1` |
| Assets | Dagster-style deps + lineage + freshness | `src/kernel/services/rivals6/asset-service.ts:1` |
| Sensors | Airflow-style poke | `src/kernel/services/rivals6/sensor-service.ts:1` |
| Workflows | n8n/Make/Zap | `src/kernel/services/rivals6/n8n-service.ts:1`, `make-service.ts:1`, `zapier-service.ts:1` |
| SOP | software-crew PRD→QA | `src/kernel/services/rivals/sop-service.ts:1` |
| Simulations | social + NetLogo grid + Mesa ABM + Bonsai Q-brain | `src/kernel/services/frontier/simulation-service.ts:1`, `src/kernel/services/rivals11/netlogo-service.ts:1`, `mesa-service.ts:1`, `bonsai-service.ts:1` |

### 3.7 Остальное (governance, interop, eval, frontier)

- **Governance:** capabilities + trust + policies + human roles (`src/kernel/services/trust/governance-service.ts:1`), provenance graph (`provenance-service.ts:1`), sandbox continuum, ecosystem (extensions/surfaces/snapshots).
- **Interop:** A2A spec cards/tasks/artifacts/SSE/push (`src/kernel/services/rivals10/a2aspec-service.ts:1`), gateway ingress/translate, federation peers, handoff trace, market/contract-net/routing (Фаза A), Copy/Bedrock/CX/Agentforce + Kore/Campaign/Employee + CodeAgent/Assistant/Gum (Фазы G–I), search providers fan-out, runtime action stream, ReAct/Loader/RAG, modes, scoped/integrations/character (Фазы G) — всё additive.
- **Eval/Frontier:** benchmarks + A/B + red-team + matrix + sims/norms/orgs/intent/modal (`src/kernel/services/frontier/*`), autonomy loops + run queue + planner/dyad, score-case `contains|exact|token_f1` + `plan_and_execute` (Фаза G).

---

## 4) LLM-провайдеры — что есть

- **Фабрика:** `src/llm/registry/adapter-factory.ts:51` (`SUPPORTED_PROVIDERS`).
- **Адаптеры:**

| Адаптер | Базовый URL | Файл |
|-------- | ----------- | ---- |
| openai | `https://api.openai.com/v1` | `src/llm/openai-compatible/openai-compatible-adapter.ts:1` |
| gemini | `generativelanguage.googleapis.com` (proxy) | `src/llm/gemini/gemini-adapter.ts:1` |
| nvidia | `...nvidia` | `src/llm/nvidia/nvidia-nim-adapter.ts:1` |
| openrouter | `openrouter` | `src/llm/openrouter/openrouter-adapter.ts:1` |
| groq | `groq` | `src/llm/groq/groq-adapter.ts:1` |
| cerebras | `cerebras` | `src/llm/cerebras/cerebras-adapter.ts:1` |
| cloudflare | `cloudflare` | `src/llm/cloudflare/cloudflare-adapter.ts:1` |
| deepseek | `https://api.deepseek.com/v1` | `src/llm/deepseek/deepseek-adapter.ts:1` (quirks: reasoningContent, reasoning_effort) |
| kimi | `https://api.moonshot.ai/v1` | `src/llm/kimi/kimi-adapter.ts:1` |
| minimax | `https://api.minimax.io/v1` | `src/llm/minimax/minimax-adapter.ts:1` |
| qwen | `https://dashscope-intl.../compatible-mode/v1` | `src/llm/qwen/qwen-adapter.ts:1` (enable_thinking) |
| ollama/lmstudio/github/scaleway/cometapi/mistral/cohere/azure/huggingface/perplexity/blackbox | via OpenAI-compatible | `adapter-factory.ts:100` |

- **Дефолты:** `src/kernel/utils/provider-default-models.ts:3` (deepseek/kimi/minimax/qwen добавлены).
- **LLM-мост:** `src/kernel/services/llm-bridge/llm-task-executor.ts:1` — crew/council/graph/frontier executors (cacheScope + per-agent model).

---

## 5) События — инвентарь (EventBus `src/kernel/events/event-registry.ts:30`)

- **Ключи/провайдеры/сеть:** `key:*`, `provider:*`, `key:health:*` — ~20.
- **Чат/стрим:** `chat:send/cancel/response/stream:*` + `chat:summary:created` — ~10.
- **Система:** `system:*`, `kernel:*`, `runtime:ready/failed`, `settings:*` — ~10.
- **Дебаты (runtime):** `debate:runtime:*` — ~25 (agent:thinking/chunk/responded/fallback, budget, consensus…).
- **Когнитивка:** `cognitive:*`, `knowledge:crystal:*`, `knowledge:junction:*`, `synthesis:*`, `generator:*` — ~20.
- **Форум:** `forum:*` — 4.
- **Builder/Director/Room/Invocation:** `builder:flow:deployed`, `conversation:*` (6) + `invocation:*` (5) — ~12.
- **Новые волны (Waves 1–5 + A–Q):** `crew:*` (6) + `task:*` (3) + `forge:proposed` + `council:*` (10) + `graph:*` (12) + `memory:*`/`persona:*`/`context:*`/`goal:*` (10) + `ops:*` (6) + `interop:*`/`gateway:*`/`fed:*`/`handoff:*`/`market:*`/`contract:*` (10) + `meta:*`/`cog:*` (8) + `trust:*`/`eco:*` (4) + `eval:*` (5) + `tool:*`/`knowledge:*`/`training:*` (3) + `loop:*`/`groupchat:*`/`guardrail:*`/`block:*`/`sop:*`/`queue:*`/`plan:*`/`dyad:*` (8) + `react:*`/`rag:*`/`runtime:*`/`swe:*`/`aider:*`/`modes:*`/`smem:*`/`integration:*`/`character:*` (9) + `reason:*`/`session:*`/`dataset:*`/`flowapi:*`/`docstore:*`/`typed:*`/`codeplan:*`/`dialogue:*`/`botroute:*`/`proto:*` (8) + `copilot:*`/`bedrock:*`/`cx:*`/`force:*`/`kore:*`/`yellow:*`/`lindy:*`/`smol:*`/`stack:*`/`gum:*` (10) + `app:*`/`ide:*`/`prompt:*`/`onto:*`/`acl:*`/`work:*`/`writer:*`/`computer:*`/`search:*`/`codeexec:*` (7) + `n8n:*`/`make:*`/`zap:*`/`temporal:*`/`asset:*`/`sensor:*`/`voice:*`/`support:*`/`verify:*`/`deck:*` (10) + `format:*`/`dung:*`/`toulmin:*`/`brier:*`/`claimtree:*` + `netlogo:*`/`mesa:*`/`bonsai:*`/`chainlit:*`/`gradio:*`/`chart:*`/`graphviz:*`/`malmo:*`/`gym:*` + `a2aspec:*`/`cache:*`/`dotprompt:*`/`notebook:*`/`live:*`/`assist:*`/`vertex:*`/`deepres:*`/`quota:*`/`studio:*` (~10) + `claw:*`/`dsh:*`/`manus:*`/`gen:*` (~8) + `forumplus:*`/`decision:*`/`polis:*`/`reflexion:*`/`tot:*`/`selfcon:*`/`soar:*`/`atom:*`/`meter:*`/`err:*` (12).

**Итого: ~240 событий.** Все через `EVENT_REGISTRY` — источник правды.

---

## 6) Контракты / DAL / Сервисы

- **Контракты:** `src/kernel/contracts/*.ts` — ~180 файлов (каждая доменная область — свой интерфейс; новые: `crew.ts:1`, `council.ts:1`, `graph.ts:1`, `persona.ts:1`, `ops.ts:1`, `interop.ts:1`, `meta.ts:1`, `trust.ts:1`, `frontier.ts:1`, `parity.ts:1`, `rivals.ts:1`, `rivals2.ts:1`, `rivals3.ts:1`, `rivals4.ts:1`, `rivals5.ts:1`, `rivals6.ts:1`, `debateplus.ts:1`, `rivals7.ts:1`, `rivals9.ts:1`, `rivals10.ts:1`, `rivals11.ts:1`).
- **DAL:** `src/kernel/dal/*.ts` — `DataAccessLayer` (`src/kernel/dal/data-access-layer.ts:1`) — единая точка; каждый домен — один репозиторий (новые: `crew-repository.ts:1`, `council-repository.ts:1`, `graph-repository.ts:1`, `persona-repository.ts:1`, `ops-repository.ts:1`, `interop-repository.ts:1`, `meta-repository.ts:1`, `trust-repository.ts:1`, `frontier-repository.ts:1`, `parity-repository.ts:1`, `rival-repository.ts:1`, `dal/_test-harness.ts:1` зеркалит всё).
- **Сервисы:** `src/kernel/services/*` — 352+ реализаций + 11 декораторов LLM; новые папки: `crew/`, `council/`, `graph/`, `persona/`, `ops/`, `interop/`, `meta/`, `trust/`, `frontier/`, `parity/`, `rivals/`, `rivals2/`, `rivals3/`, `rivals4/`, `rivals5/`, `rivals6/`, `debateplus/`, `rivals7/`, `rivals9/`, `rivals10/`, `rivals11/`, `llm-bridge/`.

---

## 7) UI — маршруты, панели, stores, i18n

- **Маршруты:** `src/route-registry-content.ts:100` (+ `route-imports.ts:1` + `route-registry-icons.tsx:1`).
- **Базовые панели:** `src/components/*` — 638 панелей (из `AGENTS.md:3:638 UI panels`).
- **Новые stores (только читают EventBus):**

| Store | События | Файл |
|------ | ------- | ---- |
| `useCrewStore` | `crew:*` | `src/stores/crewStore.ts:1` |
| `useCouncilStore` | `council:*` | `src/stores/councilStore.ts:1` |
| `useGraphStore` | `graph:*` | `src/stores/graphStore.ts:1` |
| `usePersonaStore` | `context:*`/`goal:*`/`persona:*` | `src/stores/personaStore.ts:1` |
| `useOpsStore` | `ops:*` + `graph/council/crew:completed` | `src/stores/opsStore.ts:1` |
| `useInteropStore` | `fed:*` + `handoff:*` + `market:*` | `src/stores/interopStore.ts:1` |
| `useMetaStore` | `meta:*` + `cog:*` | `src/stores/metaStore.ts:1` |
| `useTrustStore` | `trust:*`/`eco:*` | `src/stores/trustStore.ts:1` |
| `useFrontierStore` | `eval:*` + `simulation:*` | `src/stores/frontierStore.ts:1` |
| `useRivalStore` | `loop:*` + `groupchat:*` + `queue:*` | `src/stores/rivalStore.ts:1` |

- **Fleet консоль (единая для новых модулей):** `src/components/FleetPanel/FleetPanel.tsx:1` — 10 табов (crews/councils/graphs/persona/ops/interop/meta/trust/frontier/rivals), mobile-friendly, Approve/Reject/Run из телефона, lazy-роут `fleet` (`nav.fleet`).
- **i18n:** `fleet.*` ключи в `src/i18n/translations/{en,ru}/nav.ts` + `analytics.ts` (en: `fleet.title`/`tab_*`/`run`/`approve`…; ru: зеркало).

---

## 8) Покрытие vs ~100 проектов — матрица

| # | Проект/паттерн | Где у нас | Фаза | Примечание |
| - | -------------- | --------- | ---- | ---------- |
| 1 | CrewAI | Crew/Task/Process + Forge | Волна 1 | Echo→LLM-мост (per-agent model) |
| 2 | LangGraph | Wave-parallel + subgraph + Send + threads + `_approved` | Фаза F.1 | Pregel super-steps |
| 3 | AutoGen | GroupChat (auto/round_robin/manual) + nested | F.2 | + handoff-фильтры |
| 4 | Swarm/Agents SDK | Guardrails tripwire | F.2 | handoff-цепочки поверх `handoffs` |
| 5 | Letta | Memory blocks + `memory.append/recall` | F.2 | Tools в ToolRunner |
| 6 | MetaGPT | SOP software-crew | F.3 | 5 фаз |
| 7 | AutoGPT | Autonomy goal loop | F.3 | plan→act→critique |
| 8 | BabyAGI | Task queue loop | F.3 | create→prioritize→execute |
| 9 | SuperAGI | RunQueue + toolkits | F.3 | concurrency 4 |
| 10 | Semantic Kernel | Planner (sequential/function_calling/stepwise) + filters | F.3 | + `plan_and_execute` |
| 11 | CAMEL | Dyad inception | F.3 | `<TASK_DONE>` |
| 12 | LangChain | ReAct + loaders/splitter + tracing | Фаза G.1 | + agentic chunk |
| 13 | LlamaIndex | RAG loop (rewrite→retrieve→synthesize→critique) | G.1 | цитаты |
| 14 | Haystack | Metrics `exact|token_f1` | G.1 | partial credit |
| 15 | OpenHands | Runtime action stream + micros | G.2 | ticket-scoped |
| 16 | SWE-agent | ACI + patch | G.2 | trajectory |
| 17 | Aider | repoMap + apply diff | G.2 | commit message |
| 18 | Roo Code | Modes + toolkits | G.2 | kv, без схемы |
| 19 | Mem0 | ScopedMem `user|agent|run|app` | G.3 | versions cap 20 |
| 20 | Composio | Catalog + connections + triggers→gateway | G.3 | 20 apps |
| 21 | Eliza | Character → Persona/Voice/Depth + clients | G.3 | via gateway |
| 22 | Agno | ReasoningService + agenticChunk | H.1 | think JSON |
| 23 | Google ADK | Session scopes + Parallel/Loop runners | H.1 | kv deltas |
| 24 | Dify | Datasets + annotations + rerank | H.1 | QA first |
| 25 | Langflow | FlowAPI tokens → graph invoke | H.1 | bearer-ish |
| 26 | Flowise | DocStores + feedback | H.2 | kv |
| 27 | Pydantic AI | Typed agents (Zod validate+retry) | H.2 | Logfire-спаны |
| 28 | TaskWeaver | CodePlan plugin-call list | H.2 | verify+replan |
| 29 | Rasa | Intents/slots/stories | H.3 | overlap-NLU |
| 30 | Botpress | Autonomous routing + analytics | H.3 | LLM vote + rotation |
| 31 | Voiceflow | CMS slots + funnels + export | H.3 | kv |
| 32 | Copilot Studio | Topics/entities/variables + generative | I.1 | kv |
| 33 | Bedrock | Action groups + KB profiles + guardrail + trace | I.1 | PII-redact |
| 34 | Dialogflow CX | Flows/pages/routes + fulfillment | I.1 | kv |
| 35 | Agentforce | Topics + transcript + trust-check | I.1 | per-action policy |
| 36 | Kore.ai | Entities + interruption (park/resume) | I.2 | heuristic |
| 37 | Yellow.ai | Campaigns broadcast | I.2 | via gateway |
| 38 | Lindy | Employees (persona+toolkit+triggers) + inbox | I.2 | planner+inbox |
| 39 | SmolAgents | CodeAgent mini-DSL | I.3 | browser-honest |
| 40 | Stack AI | Assistants (persona+dataset+toolkit) | I.3 | knowledge-scoped |
| 41 | Gumloop | Forms + forEach + vault | I.3 | kv |
| 42 | Replit/Lovable/v0 | AppBuilder scaffold | J.1 | clarify→scaffold |
| 43 | Cursor/Windsurf | IDE: askCodebase + editPlan + terminal | J.1 | grep-evidence |
| 44 | LangSmith | PromptHub + eval queue kind | J.1 | versions + render |
| 45 | Palantir | Ontology typed objects + governed actions | J.2 | oversight |
| 46 | Glean | ACL-aware retrieval | J.2 | default-deny |
| 47 | UiPath | Work items + robots + assets | J.2 | kv, retries |
| 48 | Writer | Terminology + claim check + style score | J.2 | citation rule |
| 49 | Operator/ComputerUse | Computer action pack + ticket-gate | J.3 | 5 actions |
| 50 | Firecrawl/Exa/Tavily | Search provider fan-out | J.3 | dedupe+fallback |
| 51 | E2B | Code tickets (validated, handoff) | J.3 | `code` kind |
| 52 | n8n | Workflows + safe transforms + log | K.1 | map/filter/reduce/get |
| 53 | Make | Filters + iterators + aggregators + error routes | K.1 | bundle-threading |
| 54 | Zapier | Zaps + paths + delays | K.1 | fire/test |
| 55 | Temporal | Durable steps + signals + retries | K.2 | after-each persist |
| 56 | Dagster | Assets + lineage + freshness | K.2 | topo materialize |
| 57 | Airflow | Sensors (poke) | K.2 | bounded attempts |
| 58 | Vapi/Retell | Voice calls + TTS/STT ports + transcript | K.3 | queued w/o delegate |
| 59 | Intercom | Tickets + macros + bot-draft + handoff | K.3 | resolution rate |
| 60 | Notion/Guru | Verify queue + gaps | K.3 | verified-first |
| 61 | Gamma | Outline → slides → markdown | K.3 | ≤12 slides |
| 62 | IBM Debater | Claim mining | L.2 | heuristic + LLM |
| 63 | Dung AF | Grounded/preferred extensions | L.2 | ≤12 args |
| 64 | Kialo | Claim trees pro/con + impact + score | L.2 | decay 0.5 |
| 65 | Oxford/Munk | Swing vote | L.1 | pre→post |
| 66 | Lincoln-Douglas | Value/criterion + rubric | L.1 | clash/evidence/strategy/delivery |
| 67 | Popper | 3 rounds (constructive/cross/rebuttal) | L.1 | socrates lens |
| 68 | Deliberative Poll | Briefing + balance + shift | L.1 | Rag briefing |
| 69 | Brier markets | Forecasts + Brier score | L.2 | 0..1 |
| 70 | Adversarial Collab | Crux + joint statement + residuals | L.1 | in summary |
| 71 | Toulmin | 6-field cards + completeness | L.2 | gaps list |
| 72 | Discourse | Polls/solved/trust/badges | M.1 | levels 0–4 |
| 73 | Loomio | Proposals + dot-vote + Borda | M.1 | quorum 3 |
| 74 | Polis | Opinion clustering (k-means-lite) | M.1 | consensus statements |
| 75 | Reflexion | Verbal reflection + retry memory | M.2 | per-kind |
| 76 | Tree-of-Thoughts | BFS search + prune | M.2 | LLM scored |
| 77 | Self-Consistency | N paths + majority + confidence | M.2 | normalized |
| 78 | SOAR | WM + productions + impasse + chunking | M.2 | kv |
| 79 | OpenCog | Atoms (TV) + PLN deduction | M.2 | depth ≤4 |
| 80 | Grafana | Meters + alerts + notifications | M.3 | 5-min window |
| 81 | Sentry | Error inbox + fingerprint groups | M.3 | normalized |
| 82 | Google A2A spec | Cards/tasks/parts/artifacts/SSE/push | P.1 | kv |
| 83 | Context Caching | TTL registry + sweep | P.1 | bytes stats |
| 84 | Genkit | Dotprompt typed prompts | P.1 | strict render |
| 85 | NotebookLM | Notebooks + audio script + mindmap | P.1 | 2-host script |
| 86 | Gemini Live | Barge-in + tool bridge | P.2 | parked/resume |
| 87 | Agent Assist | Smart replies + NBA + knowledge | P.2 | heuristics |
| 88 | Vertex Search | Boost/bury + rerank | P.2 | over dataset |
| 89 | Deep Research | Plan + brief with source table | P.2 | rag-backed |
| 90 | AI Studio quotas | Per-key guard + breach notify | P.3 | kv + inbox |
| 91 | Chat Studio | Agent packs + MCP + KB + translate | P.3 | one-click |
| 92 | NetLogo | Grid turtles + diffusion + BehaviorSpace | Q.1 | ASCII map |
| 93 | Mesa | Schedulers + batch runs | Q.1 | energy model |
| 94 | Bonsai | Curriculum + Q-brain + assessment | Q.1 | epsilon-greedy |
| 95 | Chainlit | Step tree + elements + feedback | Q.2 | kv |
| 96 | Gradio | Interfaces + flagging | Q.2 | kv |
| 97 | Charts | Specs + SVG + meter bridge | Q.2 | line/bar |
| 98 | GraphViz | Layered/force layouts + SVG | Q.2 | deterministic |
| 99 | Malmo | Grid missions + rewards | Q.3 | N/S/E/W |
| 100| Gymnasium | bandit/gridworld/cartlite/custom envs | Q.3 | seeded RNG |
| 101| OpenClaw (личная OS) | SOUL/AGENTS/HEARTBEAT + channels + ClawHub | N.2 | kv |
| 102| DeepSeek-Harness | Plugins/presets/trajectory/cache discipline | N.2 | toolkits |
| 103| MiniMax/Kimi/Qwen | Adapters + thinking flags | N.1 | factory |
| 104| Manus | Verify-loop + schedules + export | N.3 | independent verifier |
| 105| Genspark | Fanout + sheets + long tasks | N.3 | multi-provider |

> Примечание: мы перевалили 100 за счёт хайп-фазы N (OpenClaw/DSH/4 китайских/Manus/Genspark) — часть #3–#7 объединена в одну строку, реальное покрытие 100+.

---

## 9) Что НЕ покрыто / честные долги

- **Проверки:** `typecheck:fast/full`, `build`, `vitest` не гонялись (требование «слабый ПК»). Ожидаем ошибки импортов/типов; чиним на финалке.
- **Исполнение без ключей:** LLM-вызовы → echo-fallback; TTS/STT/E2B/Python-песочницы/OAuth-приложения/телефония — порты без бэкендов (handoff-записи).
- **Глубина vs прод-закалка:** 11 built-in tools vs 100+ у CrewAI; vector search — token-overlap (порт `IEmbeddingPort` готов, провайдер не завайрен); UI — Fleet-консоль (9→10 табов), не Studio-canvas с трейсами.
- **Роли сид:** сознательно не сидили в базу — добавим на финалке руками через `RoleService`/kv, чтобы не конфликтовать с существующим `RoleService` (builtin-набор).
- **Chat Studio:** покрыт как Cherry Studio; если это другой продукт — кинь ссылку, докручу точечно.

---

## 10) Next steps (дешёвые, без проверок)

1. **Финалка** (когда будет сильный ПК): `npm run typecheck:fast && npm run build:skip-typecheck -- --mode production && npm run test` (сначала срез новых фаз) → починка.
2. **Склады — второй проход:** долить tools (по 5 per wave), skills паки под задачи, roles seed, линзы под формат (уже 4 новых — можно ещё 4), форум-темы seed.
3. **Интеграции:** завайрить `IEmbeddingPort` (любой embedding-провайдер) + OAuth-приложения для `IntegrationsService` (по одному per wave).
4. **UX:** таргет-табы во Fleet (сейчас 10 табов — можно разбить на `Fleet/Council/Research/Diagnostics` по 3–4 таба).

---

## 11) Файлы изюма (куда смотреть)

- Склады: `src/kernel/services/crew/crew-templates.ts:1`, `src/kernel/services/council/council-lenses.ts:1`, `src/kernel/services/skill-service.ts:1`, `src/kernel/services/parity/tool-runner-service.ts:1`, `src/kernel/service-registration/phase42-rivals10.ts:72` (seed).
- Дебаты: `src/kernel/services/council/council-service.ts:1`, `src/kernel/services/debateplus/format-service.ts:1`, `src/kernel/services/debateplus/argtech-service.ts:1`.
- Графы: `src/kernel/services/graph/graph-service.ts:280` (wave-parallel + subgraph + Send).
- LLM: `src/llm/registry/adapter-factory.ts:51`, `src/llm/deepseek/deepseek-adapter.ts:1`, `src/llm/qwen/qwen-adapter.ts:1`, `src/kernel/types/llm-types.ts:15` (`reasoningContent`).
- События: `src/kernel/events/event-registry.ts:28` — единственный источник правды.
- UI: `src/components/FleetPanel/FleetPanel.tsx:1` + `src/stores/*Store.ts`.

---

> С богом — дальше по плану. Скажешь «инвентаризация складов v2» — долью tools/skills/roles/линзы/темы под конкретные сценарии. Скажешь «финалка» — гоню проверки и чиню.
