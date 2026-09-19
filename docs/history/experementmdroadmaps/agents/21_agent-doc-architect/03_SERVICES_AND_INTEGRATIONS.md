# 03_SERVICES_AND_INTEGRATIONS — `agent-doc-architect`

> Every service that touches this agent. **VERIFIED** by file:line.

## 1. AgentService (core resolver) — `src/kernel/services/agent-service.ts`

- Implements `IAgentResolver` (`agent-service.ts:71`); registered in `phase4-agents-roles.ts:86` (per shared context).
- `getAgents()` (`agent-service.ts:306`) iterates topology nodes; doc-architect appears as `{ id:'agent-doc-architect', name:'Architect Agent', role:'Documentation Architect', status, stats }`.
- `resolveAgent(id)` (`agent-service.ts:337`) returns the merged config (model, prompt, specializations, avatar, provider). **This is the single source of truth for the agent's runtime identity.**
- `getStats()` (`agent-service.ts:288`), `getAllStats`, `getTopAgents` — per-node stats.
- Lifecycle: `toggleAgent` (`agent-service.ts:460`), `pauseAllAgents`/`resumeAllAgents`, `restartAgent`, `spawnAgent`, `deleteAgent`. Generic across all 25 agents.
- `autoSpawnConfig` (`agent-service.ts:81`) + `evaluateAutoSpawn` — uniform, no doc special-case.

## 2. agent-identity.ts — `src/kernel/services/agent-identity.ts`

- `resolveAgentIdentity('agent-doc-architect')` (`agent-identity.ts:62`) → `AgentIdentityView` consumed by Director/Debate/Chat/Workflow UI. Falls back gracefully if resolver/lens missing (`agent-identity.ts:90`).

## 3. prompt-audit-service.ts — `src/kernel/services/prompt-audit-service.ts`

- `inferGroup` (`prompt-audit-service.ts:45-48`): `node.id.startsWith('agent-doc-')` → `'Documentation'`. **The only id-prefix special-casing of the doc cluster in production code.** Affects prompt-quality audit grouping only.

## 4. consistency-checker.ts — `src/kernel/services/consistency-checker.ts`

- `docAgents` default (`consistency-checker.ts:346-352`) uses **label strings** ("Architect Agent" …), not node ids.
- `runDocumentationDebate` (`consistency-checker.ts:491-529`) builds a textual pipeline description naming the doc agents but **does not invoke them** (returns a `string` consensus block). No execution coupling.

## 5. Memory / Observability services (nodeId-keyed, generic)

- `agent-journal-service.ts:130,150` — per-agent journal from `COGNITIVE_STEP_ACTIVE`/`COMPLETED`.
- `memory-engine.ts:181` — memory store from `COGNITIVE_STEP_COMPLETED`.
- `agent-health-monitor.ts:66,75` — health from cognitive events.
- `metrics-service.ts:187`, `policy-service.ts:275`, `advisor-service.ts:119`, `snapshot-service.ts:114` — all consume cognitive events keyed by nodeId.

## 6. Invocation — `src/kernel/service-registration/phase21-invocation.ts`

- `AgentResolverDirectory` (`phase21-invocation.ts:43-58`) wraps `agentService` (adds `specializations`). Used by `InvocationEngineService` (`phase21-invocation.ts:152`).
- `InvocationExecutionDelegate` (`phase21-invocation.ts:61-110`) hands off to `debateService` / `conversationDirectorService` + `scenarioRepository`. doc-architect reachable as a human-selected `target.agentId`.

## 7. ConversationCore / Director — (per shared context; VERIFIED path)

- `ConversationOrchestrator` + `ChatExecutor` resolve participants through `agentService.resolveAgent`; `ConversationDirectorService` uses `agentService`. So doc-architect turns use its pinned 70B model + architect prompt.

## 8. Debate — (per shared context; VERIFIED absence of special-case)

- `debate-runtime/persona-selector.ts` selects personas by **topic keywords + role + round** (`persona-selector.ts:251-290`); specializations are ignored. `debate-agent-executor.ts` / `debate-meta-agent-controller.ts` contain **no** `agent-doc-architect` reference (grep: 0 matches in `debate-runtime`).

## Integration map (text)

```
AGENT_PROFILES ─┐
                ├─► normalizeAgentIdentity ─► topology node (model/provider/specs/avatar)
topology-defaults┘                                          │
                                                            ▼
AgentService.resolveAgent ◄── AgentIdentity / Debate / ConversationCore / Director / Invocation
            │
            ├─► prompt-audit (group "Documentation" via id prefix)
            ├─► COGNITIVE_STEP_COMPLETED(nodeId) ─► stats / journal / memory / health / metrics
            └─► RoomPanel (human pick) ─► InvocationEngine ─► ConversationCore | Debate
```
