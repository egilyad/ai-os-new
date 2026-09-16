# 01_CURRENT_STATE — `agent-doc-architect`

> Snapshot of how `agent-doc-architect` actually exists in the running system today. **VERIFIED** unless noted.

## What it is

A single topology **node** (`type: 'agent'`) in the default `AuditorTopology` (`topology-defaults.ts:397`). It is one of 25 curated agents. Its identity (name, avatar, model, specializations, provider) is curated in `AGENT_PROFILES` (`agent-profiles.ts:222`) and merged into the node config at topology-build time by `normalizeAgentIdentity` (`topology-defaults.ts:91-119`).

## What it can do today

- **Speak as a participant** in any execution path that resolves it via `agentService.resolveAgent` — debate, ConversationCore chat, and the Conversation Director (`directorService` → `ChatExecutor` → `agentService`). It then uses its pinned 70B OpenRouter model + the "documentation architect" system prompt (`topology-defaults.ts:402`).
- **Be selected** in RoomPanel by a human (Invocation Engine, `phase21-invocation.ts`) — any registered agent is reachable, policy only gates the _call type_ (`human-mention`), not the agent (`phase21-invocation.ts:112-144`).
- **Accrue stats / journal / health** when it executes, because `AgentService` (`agent-service.ts:184`), `agent-journal-service` (`agent-journal-service.ts:130,150`), `memory-engine` (`memory-engine.ts:181`) and `agent-health-monitor` (`agent-health-monitor.ts:66`) all key off `COGNITIVE_STEP_COMPLETED.nodeId` = `agent-doc-architect`.
- **Be audited** as part of the "Documentation" group by `prompt-audit-service` (`prompt-audit-service.ts:46` — `node.id.startsWith('agent-doc-')` → group `'Documentation'`). This is the **only** code path that specially categorizes the doc cluster by id prefix.

## What it cannot do today

- **Ground its output.** Its node `tools: []` (`topology-defaults.ts:404`). It has no `CODER_TOOLS`, `SEARCH_TOOLS`, or `ANALYTICS_TOOLS` (contrast `agent-architect` which has `CODER_TOOLS` at `topology-defaults.ts:190`). Its prompt commands "never invent features… traceable to specific source files" (`topology-defaults.ts:402`) but it has **no tool to read source** to honor that. (VERIFIED empty tools; IMPACT is INFERRED.)
- **Drive any automation by itself.** No scenario, debate config, scheduler, or event subscription names `agent-doc-architect` as a default participant. It only runs when explicitly chosen.
- **Coordinate with its doc siblings.** The 5 doc nodes are independent; nothing wires architect→auditor→simplifier→historian→checker into a pipeline. `consistency-checker.ts` only _textually_ names them (`consistency-checker.ts:347,513`) inside a self-healing report template — it does **not** invoke them (`runDocumentationDebate` returns a string, `consistency-checker.ts:491-529`).

## Lifecycle / operability

- Lifecycle is generic: `ready`/`paused`/`initializing`/`terminated` via `AgentService.transitionLifecycle` (`agent-service.ts`, e.g. `toggleAgent:460`). No doc-specific lifecycle.
- `autoSpawnConfig` (`agent-service.ts:81`) applies uniformly; `evaluateAutoSpawn` does not special-case doc agents.

## Summary line

A **fully-provisioned but tool-less persona node**: rich identity + right model, but no grounding tools, no lenses, no coordination, and no default participation. It is a latent capability, not an active one.
