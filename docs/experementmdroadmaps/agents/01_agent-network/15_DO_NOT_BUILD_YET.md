# 15_DO_NOT_BUILD_YET — things to AVOID for `agent-network`

> Tempting, expensive, or premature. Especially: do NOT spawn 25 mini-frameworks.

## 1. A dedicated "Network Agent Engine" / "NetworkService"

- **Why avoid:** The entire point of the architecture (AGENTS.md) is that agents are topology nodes driven by SHARED infra (AgentService, Debate, ConversationCore, Invocation, Memory). Nadia needs zero agent-specific backend. A `NetworkAgentService` would duplicate `AgentService` and violate the dependency rule + "no 25 mini-frameworks" warning.
- **Instead:** reuse `AgentService` + `resolveAgentIdentity`. If she needs networking behavior, put it in the **persona/prompt/side/lens**, not a new service.

## 2. A new "networking cognitive event" or "network trace bus"

- **Why avoid:** Cognitive events are intentionally generic (`event-registry.ts:736-776`). Adding `cognitive:network:*` fractures the model and creates a per-agent event taxonomy for all 25 agents.
- **Instead:** reuse existing `COGNITIVE_STEP_COMPLETED` / `cognitive:decision:made` (revive the dead consumer, 07).

## 3. A separate "Network Memory" store

- **Why avoid:** The memory subsystem already supports `agentId` filtering (`episodic-memory.ts:53`, `social-memory.ts:33`, `service-backed-memory.ts:46`). A `network-memory.ts` would be a 14th+ duplicate store and a maintenance tax.
- **Instead:** seed + recall via existing `semantic-memory` keyed by `agentId:'agent-network'` (08/M1/M2).

## 4. Giving her a private agent-to-agent call path

- **Why avoid:** AGENTS.md D3 — "agent may request another agent, but only via the engine." A direct `agent-network -> agent-security` call would fork the architecture and break auditability.
- **Instead:** coordination only through Invocation Engine / Director / Debate.

## 5. A "Network Engineer Studio" SPA

- **Why avoid:** premature abstraction; duplicates AgentsPanel/DetailPanel/RoomPanel/DebatePanel. High build + maintenance cost for one agent.
- **Instead:** fold improvements into existing panels (09/13).

## 6. Hardcoding networking facts into her system prompt as a huge blob

- **Why avoid:** bloats every request, costs tokens, goes stale. The prompt is already good (`topology-defaults.ts:150`).
- **Instead:** seeded semantic memory + read-before-speak (M1/M2) keeps the prompt lean and the facts updatable.

## 7. Auto-assigning her to EVERY network-ish debate

- **Why avoid:** reduces user control and may spam debates; also the engine's `matches()` is source/expertise-gated, not topic-forced (`invocation-engine-service.ts:191`). Forcing participation bypasses the policy model.
- **Instead:** suggest a side / expertise preset; let the human confirm (Q4/M4).

## 8. Building tools before the agent is grounded

- **Why avoid:** tools (B1) are high-risk (sandbox/security) and most valuable only after she has persona + memory. Premature tooling without grounding yields confident-but-wrong actions.
- **Instead:** Phase 0-2 first (expose, specialize, remember), then Phase 3 tools.

## 9. Per-agent stats dashboards that duplicate AgentService

- **Why avoid:** `AgentService.getStats`/`getTopAgents` (`agent-service.ts:288-304`) already exist; a Nadia-only stats service duplicates it.
- **Instead:** render existing stats in her DetailPanel/Journal tab.

## 10. Forking the PersonaSelector into a NetworkPersonaSelector

- **Why avoid:** 10 generic variants already cover her; a fork diverges from the shared debate pipeline.
- **Instead:** extend `persona-selector.ts` to consult `specializations` (Q2) — one shared improvement benefits all specialized agents.

## Guiding principle

Maximize **reuse of shared infra**; express Nadia's distinctiveness through **data** (profile, prompt, specializations, lens, memory, group, policy) — never through **new engines, events, stores, or SPAs**. This keeps the 25-agent system coherent and avoids the "25 mini-frameworks" trap.
