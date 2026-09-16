# 01_CURRENT_STATE — What `agent-risk` ACTUALLY does now

> Honesty note (VERIFIED): This agent has **no dedicated code path**. Its "behavior" is
> produced entirely by SHARED infrastructure — the topology node's `config.prompt`, the
> LLM routing layer, the debate runtime, the ConversationCore executor, and the AgentService.
> There is no `agent-risk.ts` service, no risk-modeling engine, no Monte-Carlo solver, no
> compliance checker. The specializations are **labels**, not capabilities.

## Creation / registration (VERIFIED)

- Seeded as a topology node in `topology-defaults.ts:157-167` and curated in `AGENT_PROFILES` `agent-profiles.ts:32-41`.
- `AgentService` (implements `IAgentResolver`) is registered in `phase4-agents-roles.ts:86` and resolves agent-risk via `resolveAgent` (agent-service.ts:337-390) from the active topology node.
- No per-agent registration, no risk-specific bootstrap.

## Persona / prompts (VERIFIED)

- Single static system prompt: "You are a risk analyst. Categorize risks by probability and impact. Propose mitigation strategies using frameworks like STRIDE, DREAD, or FAIR." (`topology-defaults.ts:162`).
- This prompt is the ONLY behavioral machinery. It is sent verbatim as the system prompt in debate (`debate-api.ts:312-314` prefers `node.config.prompt`).
- No dynamic risk framing, no tool-orchestration prompt for "Monte Carlo" or "Compliance" beyond naming them in the profile.

## Models (VERIFIED / INFERRED)

- Declared `openrouter/meta-llama/llama-3.3-70b-instruct` (`agent-profiles.ts:39`) — identity/display only.
- Execution model = `auto` (`topology-defaults.ts:165`) → routing layer picks the model; the pin is ignored. VERIFIED mismatch (see 00).
- provider `openrouter` declared but topology config has no `provider` set, so `resolveAgent` returns `provider: undefined` (agent-service.ts:387) and routing decides.

## Services touched (VERIFIED)

- `AgentService` — stats, lifecycle, groups, resolveAgent.
- `AgentIdentityView` (agent-identity.ts) — UI identity (avatar emoji/color, lens names, provider display).
- `prompt-audit-service` — groups it `Analytical` for prompt-quality audit (prompt-audit-service.ts:28).
- `agent-journal-service` — generic journal storage queryable by agentId (no agent-risk-specific writes observed in execution path).
- Memory: `debate-knowledge-sync.ts:60,84` writes debate arguments to `memoryService` (semantic/episodic), but this is debate-global, not agent-risk-scoped reading.

## Events in/out (VERIFIED)

- **OUT (as participant):** `COGNITIVE_STEP_COMPLETED` when its node executes a cognitive step (consumed by AgentService for stats — agent-service.ts:184); `STREAM_END` for token stats (agent-service.ts:219); `AGENT_LIFECYCLE_CHANGE` / `AGENT_HEALTH_CHANGE` (agent-service.ts:249-254).
- **Debate events:** emitted as debate participant (`debate:argument`, etc.) but agent-risk has no special selector — same as any node.
- **IN:** none agent-specific. It reacts only to whatever execution context the orchestrator/debate hands it.

## Debate participation (VERIFIED)

- Auto-selected into debates via `debate-api.ts:299-321`. Side (`pro`/`con`/`neutral`) is assigned by **positional index**: `roleOrder[i % 3]` (line 307-311). So agent-risk's debate side depends ONLY on its position in the selected participant list — **not** on its specialization. It can be `pro`, `con`, or `neutral` arbitrarily.
- Persona injection (`dynamic-persona`) is topic-keyword-driven (persona-selector.ts), not specialization-driven. None of the 10 variants is risk/compliance-specific; best-matching by topic keywords (e.g. "data", "statistics" hit cautious_scientist/pragmatic_economist).

## ConversationCore / Director participation (INFERRED)

- Director `HybridPolicy`/`ConversationOrchestrator` resolve participants via `agentService.resolveAgent` and run turns through `ChatExecutor`. If a scenario includes `agent-risk` as a participant, it speaks with the static risk-analyst prompt + `auto` model. No risk-specific turn logic exists.

## Invocation participation (VERIFIED)

- RoomPanel lets a human select `agent-risk` (`RoomPanel.tsx:91,181`) and invoke with mode `chat|debate|director-scenario` and context `room|forum-topic|conversation` (lines 26-30). The `Manual Room Chat (human-mention)` policy (phase21-invocation.ts) permits any registered human-selected agent; engine resolves `target.agentId` directly (invocation-engine-service.ts:160-161). Lifecycle: requested→accepted→executing→done.

## Research / Knowledge / Crystal / Forum / Workflow / Scheduler (VERIFIED — N/A)

- **No agent-specific code** in any of these. agent-risk participates only as a generic agent node if included in a workflow/topology that touches those subsystems. Cross-cutting, not per-agent.

## Memory (VERIFIED/INFERRED)

- Memory stores support `agentId` filtering (episodic-memory.ts:53, social-memory.ts:33, service-backed-memory.ts:46) — so agent-scoped memory queries ARE possible.
- However, there is **no verified code path that injects agent-risk's past memory into its turns** or reads a risk-specific memory store during execution. INFERRED: agent-risk has no persistent, self-loaded memory of prior risk analyses; each turn is stateless w.r.t. its own history.

## Cognitive-stream visibility (VERIFIED)

- `COGNITIVE_STEP_COMPLETED` (nodeId=`agent-risk`) is emitted when it performs a cognitive step (agent-service.ts:184). This feeds stats only.
- `cognitive:decision:made` is emitted by `cognitive-service.ts:414` but is **dead at the consumer** (event-recorder.ts:232,261 explicitly skip it; event-bridge.ts:31 lists it but no handler). So any "decision" agent-risk makes is never surfaced.

## UI (VERIFIED)

- Rendered by `AgentsPanel` (`AgentCard`, `AgentDetailPanel`, `AgentStatsDashboard`, `EloLeaderboard`, `LiveActivityStream`, `AgentObservabilityTab`, `AgentHistoryTab`).
- Avatar: `AgentAvatar.getAgentAvatar` is hash-based (AgentAvatar.tsx:47) — emoji/color NOT from profile in raw avatar contexts.
- Activity/last-active from stats (agent-service.ts:206 `lastActive`).

## Settings (VERIFIED)

- Editable via `AgentIdentityEditor` / `AgentConfigTab` (topology node config). temperature 0.15, tools ANALYTICS_TOOLS, model `auto` are the persisted config knobs.

## Honest verdict

agent-risk is a **prompt + topology wiring**, not a "Risk Analyst" in any computational sense. Its specializations (Risk Modeling, Monte Carlo, Compliance) are decorative labels with zero backing machinery. The closest real machinery is the generic debate/ConversationCore/Invocation execution + generic memory stores.
