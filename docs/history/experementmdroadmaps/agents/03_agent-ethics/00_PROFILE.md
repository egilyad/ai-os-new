# 00 — PROFILE: `agent-ethics`

> Research-only deep-dive. No source modified. All claims tagged **VERIFIED** (read in repo), **INFERRED** (reasoned from code), or **OPINION** (recommendation/value judgment).

## Canonical Identity (VERIFIED — `src/kernel/state/agent-profiles.ts:42-51`)

- **Node id**: `agent-ethics` (this IS the system agent; topology NODE id = agent identity)
- **First/Last**: Elena Marchetti
- **Display name**: Elena Marchetti
- **Base role**: Ethics Officer
- **Avatar**: 🛡️ / color `#a855f7`
- **Provider**: `nvidia`
- **Model**: `meta/llama-3.3-70b-instruct`
- **Specializations**: `Ethical Reasoning`, `Policy`, `Bias Audit`

## Topology Node (VERIFIED — `src/kernel/state/topology-defaults.ts:169-179`)

- `type: 'agent'`, `label: 'Ethics Officer'`
- `config.roleName: 'Ethics Officer'`
- `config.prompt`: "You are an ethics officer. Evaluate decisions for fairness, transparency, accountability, and bias. Flag ethical risks and propose responsible alternatives."
- `config.temperature: 0.2`
- `config.tools: []`
- `config.model: 'auto'` (locally) — **overwritten** at load time, see below.

## Identity Normalization (VERIFIED — `topology-defaults.ts:91-119`)

`normalizeAgentIdentity()` merges every `AGENT_PROFILES` entry onto the matching node config:

- sets `displayName`, `firstName`, `lastName`, `baseRole`, `specializations`, `avatar`, **`provider = 'nvidia'`**, **`model = 'meta/llama-3.3-70b-instruct'`**, and empty `lensIds: []`.
- **Consequence (VERIFIED)**: the node's local `model: 'auto'` is discarded; at runtime the agent executes on **nvidia / meta/llama-3.3-70b-instruct**. The curated identity is authoritative for execution, not just display.

## Persona / System Prompt

- **Persona** = the topology node system prompt above (fairness / transparency / accountability / bias). (VERIFIED — `topology-defaults.ts:174`)
- The prompt-audit tooling (`prompt-audit-service.ts:29`) buckets it in the **`Analytical`** group ("Analytical" strategy classification — `classifyStrategy` matches "evaluate"/"asses"). (VERIFIED)
- No dedicated lens is attached: `lensIds: []` after normalization. (VERIFIED — `topology-defaults.ts:106`)

## Where used (VERIFIED — grep across repo)

- `topology-defaults.ts`: node `agent-ethics` + edges `e-router-ethics` (router→ethics) and `e-ethics-agg` (ethics→aggregator) — part of the default mission topology.
- `prompt-audit-service.ts:29`: grouped as `Analytical`.
- Rendered through the shared identity seam `resolveAgentIdentity` (`agent-identity.ts`) wherever an agent avatar/name is shown: AgentsPanel, DebateAnalytics, DashboardPanel/AgentLiveBoard, AgentComparisonPanel, ForumPanel/AuthorBadge, DirectorPanel/AgentIdentityChip, DebateRuntimePanel/AgentControlPanel. (VERIFIED references in AGENTS.md; no file hardcodes `agent-ethics`.)
- **Not hardcoded anywhere else** — it is a generic topology node with no code-level special-casing. (VERIFIED — grep `agent-ethics` returns only profile + topology + prompt-audit.)

## Related agents (INFERRED)

- `agent-risk` (Compliance/Risk overlap), `agent-critic` (Critical Auditor / fallacy detection — closest behavioral sibling), `agent-security` (responsible-alternatives overlap). All share the `Analytical` prompt-audit group (`prompt-audit-service.ts:25-29`).
- The `expert-ethics` domain expert in `expert-witness-service.ts:35` is a debate _feature_, not this agent, but semantically adjacent.

## Systems that can invoke it (VERIFIED/INFERRED)

- **Topology routing**: the default topology routes the `router` → `agent-ethics` → `aggregator`, so it can be triggered automatically by incoming tasks classified to it. (VERIFIED topology edges)
- **Debate**: any debate that lists it as a participant (human-created or template). (INFERRED from generic participant model)
- **ConversationCore / Director**: as a scenario participant via `agentService.resolveAgent`. (VERIFIED — `agent-service.ts:337`, AGENTS.md B3/B4)
- **Invocation (Room)**: human-selected from `agentService.getAgents()`; allowed by the seeded "Manual Room Chat" policy. (VERIFIED — phase21-invocation + RoomPanel)
- **Groups**: can be added to an `AgentGroup` and run via `executeGroup`. (VERIFIED — `agent-service.ts:667-799`)
