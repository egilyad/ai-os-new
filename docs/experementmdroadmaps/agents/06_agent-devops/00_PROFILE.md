# 00_PROFILE — `agent-devops`

> Status legend used across this research:
> **VERIFIED** = read directly from source; **INFERRED** = derived from source but not directly confirmed; **OPINION** = recommendation/assessment.

## Identity (VERIFIED)

| Field             | Value                            | Source                                                                                               |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Node id           | `agent-devops`                   | `src/kernel/state/agent-profiles.ts:72`, `src/kernel/state/topology-defaults.ts:207`                 |
| First / Last name | Tomas Berg                       | `agent-profiles.ts:73-74` (curated)                                                                  |
| Display name      | `Tomas Berg`                     | merged into topology node `normalizeAgentIdentity` `topology-defaults.ts:98`                         |
| Base role         | DevOps Engineer                  | `agent-profiles.ts:76` → `topology-defaults.ts:101`                                                  |
| Avatar            | ⚙️ / `#f59e0b`                   | `agent-profiles.ts:77` → `topology-defaults.ts:103` → `resolveAgentIdentity` `agent-identity.ts:111` |
| Provider          | `groq`                           | `agent-profiles.ts:78` → `topology-defaults.ts:104`                                                  |
| Model             | `llama-3.1-8b-instant`           | `agent-profiles.ts:79` → `topology-defaults.ts:105` (overrides the node's literal `model: 'auto'`)   |
| Specializations   | CI/CD, Kubernetes, Observability | `agent-profiles.ts:80` → `topology-defaults.ts:102`                                                  |
| Lens ids          | `[]` (none)                      | `topology-defaults.ts:106` (defaults to empty array)                                                 |

## Node placement in default topology (VERIFIED)

- Node `agent-devops` is an `agent`-type node, label `DevOps Engineer`, `temperature: 0.2`, `tools: CODER_TOOLS`, `model: 'auto'` (then normalized to `llama-3.1-8b-instant`). `topology-defaults.ts:206-217`.
- System prompt (VERIFIED, `topology-defaults.ts:212`):
  > "You are a DevOps engineer. Design CI/CD pipelines, infrastructure-as-code, and deployment strategies. Focus on reliability, observability, and incident response."
- `CODER_TOOLS = ['code_interpreter', 'code_review', 'sandbox_exec']` (`topology-defaults.ts:7`).
- Edges (VERIFIED): `e-router-devops` router → `agent-devops` trigger `data_flow` (`topology-defaults.ts:469`); `e-devops-agg` `agent-devops` → `aggregator` trigger `on_success` (`topology-defaults.ts:521`).

## Persona (VERIFIED + INFERRED)

- **Static identity** is fully curated and applied at boot via `normalizeAgentIdentity`. Tomas Berg is a distinct named character with a fixed emoji/color/model/specializations.
- **Runtime persona** (debate) is NOT derived from the devops specialization — see `04_DEBATE_ROLE.md`. The `PersonaSelector` picks a generic variant by _topic keywords_ + debate _side_ (`pro`/`con`/`neutral`), never by specialization. INFERRED from `persona-selector.ts:251-290`.
- **Prompt** (the only behavior-shaping text actually sent to the model) is the generic DevOps sentence above — there is no per-agent scaffold that injects "you are Tomas Berg, a Groq-powered DevOps engineer".

## Where used in the UI (VERIFIED)

- `AgentAvatar` reads emoji/color from the resolved identity (`agent-identity.ts:111`), so Tomas Berg renders as ⚙️ `#f59e0b` in: AgentsPanel, DebateAnalytics, DashboardPanel/AgentLiveBoard, AgentComparisonPanel, ForumPanel/AuthorBadge, DirectorPanel/AgentIdentityChip, DebateRuntimePanel/AgentControlPanel.
- Appears in the global agent picker of `RoomPanel` (`RoomPanel.tsx:89` reads `agentService.getAgents()`).
- Participates as a debate/conversation participant wherever the topology/meta-agent/ director selects it.

## Related agents (INFERRED — by domain adjacency)

- `agent-architect` (Distributed Systems / Scalability) — closest peer; infra design overlap.
- `agent-security` (AppSec / Zero Trust) — CI/CD security, supply-chain.
- `agent-perf` (Profiling / Load Testing) — observability/perf overlap.
- `agent-database` (Replication / Data Modeling) — deployment target.
- `agent-quality` (Test Automation) — CI gate overlap.

## Systems that can invoke `agent-devops` (VERIFIED / INFERRED)

1. **Topology orchestrator** — direct node execution (`agent-service.ts:764 executeSingleNode`).
2. **Debate runtime** — selected as a participant via meta-agent controller / topology (`persona-selector.ts`). VERIFIED route exists.
3. **ConversationCore / Director** — `ConversationOrchestrator` + `ChatExecutor` resolve the node via `agentService.resolveAgent` (`agent-service.ts:337`); model `llama-3.1-8b-instant` is honored (model is non-`auto`). VERIFIED by contract, INFERRED for devops specifically.
4. **Invocation Engine (human)** — `RoomPanel` lets a human pick Tomas Berg and invoke `chat`/`debate`/`director-scenario` (`phase21-invocation.ts:43-58`, `RoomPanel.tsx:84-90`). Policy `Manual Room Chat (human-selected agent)` permits any registered agent (`phase21-invocation.ts:125-144`).
5. **Builder / Workflow** — node is invocable as a `agent` workflow step, BUT the debate hook is broken (emits non-existent `debate:start`, `builder-agent-service.ts:40`). See `10_PROBLEMS_AND_LIMITATIONS.md`.
6. **Agent groups / auto-spawn** — `AgentService.createGroup`/`executeGroup` (`agent-service.ts:667-762`) and `evaluateAutoSpawn` (`agent-service.ts:614`) can include `agent-devops`.
