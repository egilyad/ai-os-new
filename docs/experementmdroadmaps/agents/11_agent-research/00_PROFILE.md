# 00 — PROFILE: `agent-research` (Mira Castellan)

**Status:** VERIFIED from source. All facts below cite `file:line`.

## Identity

- **Node id:** `agent-research` — a topology NODE, not a standalone service. `src/kernel/state/agent-profiles.ts:122-131`
- **Display name:** Mira Castellan (`agent-profiles.ts:123-125`)
- **First / Last:** Mira / Castellan (`agent-profiles.ts:123-124`)
- **Base role:** Research Analyst (`agent-profiles.ts:126`)
- **Avatar:** emoji `🧪`, color `#6366f1` (`agent-profiles.ts:127`)
- **Provider:** `openrouter` (`agent-profiles.ts:128`)
- **Model:** `openrouter/meta-llama/llama-3.3-70b-instruct` (`agent-profiles.ts:129`)
- **Specializations:** `['Literature Review', 'Synthesis', 'Citations']` (`agent-profiles.ts:130`)

## Topology node / system prompt

- **Node definition** (`src/kernel/state/topology-defaults.ts:268-279`): `type:'agent'`, `label:'Research Analyst'`, `roleName:'Research Analyst'`, `temperature:0.4`, `tools: SEARCH_TOOLS`, `model:'auto'`.
- **System prompt** (`topology-defaults.ts:273-274`): _"You are a research analyst. Gather and synthesize information from multiple sources. Evaluate evidence quality. Flag uncertainty and conflicting findings."_
- **Tools** (`topology-defaults.ts:10`): `SEARCH_TOOLS = ['web_search', 'summarize', 'document_query']`. agent-research, agent-data, agent-ux, and one other share these.
- **Edges:** `e-router-research` router→agent-research (`topology-defaults.ts:476`); `e-research-agg` agent-research→aggregator (`topology-defaults.ts:528`). So it participates in the default canned topology flow.

## Identity normalization (model/provider actually applied)

`normalizeAgentIdentity()` (`topology-defaults.ts:91-119`) OVERRIDES `next.provider` and `next.model` with the curated profile values for every profiled node (`topology-defaults.ts:104-105`). Therefore at runtime the node carries `provider:'openrouter'`, `model:'openrouter/meta-llama/llama-3.3-70b-instruct'`, `avatar`, `specializations`, `firstName/lastName`, `displayName`, `baseRole`, and `lensIds:[]` (forced empty for agents without a lens — `topology-defaults.ts:106`).

- **CONFIRMED:** the profile model/provider is NOT cosmetic — it is written into the live node config and is what `AgentService.resolveAgent` returns (`agent-service.ts:351-388`), so the pinned model is used when this node is executed.

## Lens

- **No lens is bound** to agent-research. `topology-defaults.ts:106` forces `lensIds:[]` for all profiled agents (only `lensIds` left undefined is defaulted; the profiles never set them). `agent-identity.ts:116` will then resolve an empty `lensNames`.
- Lens library (≥11 defined in `lens-library.ts`: `lens:critical`, `second-order`, `security`, `economic`, `multi-stakeholder`, `meta-consensus`, `meta-dissent`, `meta-uncertainty`, `optimistic`, `long-term`, `meta-meta`; AGENTS.md states 15). None is attached to this agent.
- **Inference:** `lens:critical` and `lens:meta-uncertainty` would be the natural complements to "Literature Review / Synthesis / Citations" — but they are NOT wired.

## Persona (debate)

- There is **no agent-specific persona**. Debate persona selection is topic/keyword-driven via `PersonaSelector` (`debate-runtime/persona-selector.ts:3-241`). The variant `cautious_scientist` (`persona-selector.ts:4-25`) has trigger keywords `['research','study','evidence','data','peer-reviewed','hypothesis','empirical','methodology',…]` — strongly matching this agent's domain, so when agent-research is a debate participant on a research-y topic it is most likely to receive the `cautious_scientist` injection. This is INFERRED from keyword overlap, not a hard binding.

## Where it is used (UI surfaces)

- `AgentsPanel` (generic node renderer): `AgentsPanelContainer.tsx:43-49` builds agents via `resolveAgentIdentity`; `AgentCard.tsx:23`, `AgentDetailPanel.tsx:19`, `AgentIdentityEditor.tsx:70`, `AgentAvatar.tsx:47` (`getAgentAvatar` reads `AGENT_PROFILES`).
- Also consumed by: `DirectorPanel/AgentIdentityChip`, `DebateRuntimePanel/AgentControlPanel`, `ForumPanel/AuthorBadge`, `AgentComparisonPanel`, `DashboardPanel/AgentLiveBoard`, `DebateAnalytics` (per AGENTS.md; verified resolver path).
- `EloLeaderboard.tsx:153`, `LiveActivityStream.tsx:68` — generic identity resolution.

## Related agents

- Sibling "Analytical" group (`prompt-audit-service.ts:17-31`): `agent-critic`, `agent-data`, `agent-research`, `agent-risk`, `agent-ethics` are all grouped `'Analytical'`.
- Direct topology neighbors: `router` (in), `aggregator` (out) (`topology-defaults.ts:476,528`).

## Systems that can invoke it

1. **Debate** — human-selected participant; routed via `debate-query-engine` (`debate-runtime/debate-query-engine.ts`) + `debate-agent-executor.ts`.
2. **ConversationCore / Director** — `ConversationOrchestrator` resolves participants through `agentService.resolveAgent` (`agent-service.ts:337`); chat/director scenarios can name `agent-research`.
3. **Invocation Engine** — `phase21-invocation.ts` `AgentResolverDirectory` wraps `agentService`; `RoomPanel` lets a human pick ANY registered agent including `agent-research` (`phase21-invocation.ts:43-58`, policy `human-mention`).
4. **AgentService groups** — `executeGroup` can run it in `parallel/sequential/consensus/pipeline/debate` patterns (`agent-service.ts:688-762`).
5. **Topology orchestrator** — generic `orchestrator.execute` when the router routes a task to it.

## NOT invoked by

- The separate **Research Engine subsystem** (phase9: `researchRunService`, `researchEngine`, `geminiResearchService`, `researchReportService`) — VERIFIED it does **not** reference `agent-research` (grep of `research-run-service.ts` for `agent-research` → 0 matches). That subsystem is source/engine-driven, not agent-driven.
- **Knowledge Generator** (phase17) and **Crystal/Synthesis** — lens-driven, not agent-specific (verified grep: no `agent-research` in those services).
