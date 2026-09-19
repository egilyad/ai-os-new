# 30 — AGENT PLATFORM ROADMAP

> Three strategic variants for evolving the 25-agent platform. Read-only synthesis. Each variant is grounded in the **verified shared-infra reality** (agents are topology nodes; behavior is shared infra; no new frameworks are implied unless stated). Every claim carries `VERIFIED` (source/per-agent doc) or `INFERRED`/`OPINION`.
>
> Verified anchors: `agent-profiles.ts:21-272` (25 identities, `specializations` unused in debate); `persona-selector.ts:251-290` (specialization-blind persona); `event-registry.ts:736-776` (cognitive events exist but `cognitive:decision:made` is dead-at-consumer, debate emits none); `agent-service.ts:184` (`COGNITIVE_STEP_COMPLETED` consumed only for stats); `phase21-invocation.ts` (invocation engine, human-authority); `agent-service.ts:688-762` (`executeGroup` patterns); `AGENTS.md` (groups user-created, none seeded; `agent-journal-service` for memory).

---

# VARIANT A — Agent Quality First

**Thesis:** The 25 agents already _exist_ with rich specializations, avatars, and pinned models — but almost none of that identity is _activated_ at runtime. Variant A spends effort making each agent actually behave like its specialization (specialization-aware persona, correct model pin, cognitive visibility, agent-specific memory). Low architectural risk: it tunes existing seams.

## Phase 0 — Inventory & verification (1 wk, VERIFIED basis)

- Audit every agent's effective system prompt vs. its `specializations` (grep `topology-defaults.ts` prompts vs `agent-profiles.ts:21-272`).
- Confirm model-pin fidelity: `normalizeAgentIdentity` writes `profile.model` onto the node (`topology-defaults.ts:104-105`) **but** `ChatExecutor` is reported to force `'auto'` for provider (`agent-doc-checker/00_PROFILE.md:24`) and `agent-risk/00_PROFILE.md:24` flags a `auto` vs pinned mismatch. Resolve which path is authoritative.
- **Benefit:** eliminates guesswork before any change. **Risk:** low. **Deps:** none. **Effort:** S. **Impact:** clarity.

## Phase 1 — Fix model-pin / persona mismatch (1–2 wk)

- Ensure the curated `provider`/`model` from `agent-profiles.ts` is honored in `ChatExecutor`/debate participant build (`DebatePanel.tsx:232-252` already passes `node.config.provider/model`), and reconcile the `auto` behavior.
- **Benefit:** agents run on their intended (often smaller, cheaper) models; cost + latency predictable; removes a real correctness bug. **Risk:** low–med (routing-layer change). **Deps:** Phase 0. **Effort:** M. **Impact:** correctness, cost.

## Phase 2 — Specialization-aware persona (2–3 wk)

- Add a declarative `specializations → variant` affinity map to `persona-selector.ts:251-290` (no new service) so an agent's `specializations` bias variant selection; inject `specializations` into the debate system prompt (`agent-security/04_DEBATE_ROLE.md:26`, `agent-data/04_DEBATE_ROLE.md:18`). Add three missing variants: `security_reviewer`, `red_team`, `quant_skeptic` (`persona-selector.ts:3-241` has none).
- **Benefit:** the debate matrix in doc 28 becomes real; `agent-critic` becomes a true Critic/Red-team seat; `agent-security` speaks STRIDE/Zero-Trust. **Risk:** med (persona regression in unrelated debates — needs fixture tests). **Deps:** Phase 1. **Effort:** M. **Impact:** quality of every debate/conversation.

## Phase 3 — Cognitive visibility (2 wk)

- Surface existing events: `COGNITIVE_STEP_COMPLETED` (`event-registry.ts:763`) already feeds `AgentService` stats (`agent-service.ts:184`); add `cognitive:trace:updated` / `cognitive:step:active` (`event-registry.ts:736,755`) to a per-agent cognitive timeline. Decide whether `cognitive:decision:made` (`:776`) gets a consumer or is retired (currently dead-at-consumer — VERIFIED).
- **Benefit:** operators see _what each agent is thinking_, not just its final text. **Risk:** med (event volume; needs the EventRecorder filter already built for streaming spam — `AGENTS.md` runtime hardening). **Deps:** Phase 1. **Effort:** M. **Impact:** observability/trust.

## Phase 4 — Agent-specific memory (2–3 wk)

- Bind `agent-journal-service` memory to the agent identity (`AGENTS.md` shared context) so a specialist accrues domain memory across invocations/debates; today debate emits no `COGNITIVE_STEP_COMPLETED` (`agent-critic/04_DEBATE_ROLE.md:12`) so specialists are amnesiac between debates.
- **Benefit:** agents get better over time within their domain. **Risk:** med (memory bloat, privacy). **Deps:** Phase 2, Phase 3. **Effort:** M–L. **Impact:** long-term quality.

## Variant A summary

- **Benefits:** maximizes ROI on already-built identity; corrects real bugs; lowest architectural risk.
- **Risks:** none structural; main risk is persona-test regression and event-volume.
- **Dependencies:** none external; pure internal tuning.
- **Effort:** ~8–13 dev-weeks total.
- **Expected product impact:** every debate/conversation/conversation suddenly "feels" specialized; cost predictable; foundation for B/C.

---

# VARIANT B — Agent Collaboration First

**Thesis:** The individual agents are fine; the _value_ is in how they combine. Build teams/groups, cross-agent debate orchestration, invocation orchestration, and a shared capability profile. Higher architectural surface than A, but reuses `executeGroup`, `AgentResolverDirectory`, and the Invocation Engine.

## Phase 0 — Capability profile & discovery (1 wk)

- Expose the already-available `specializations`/`role` from `AgentResolverDirectory` (`phase21-invocation.ts:44-57`) as a queryable "capability catalog" (`getAgents()` already returns them). No new store.
- **Benefit:** other phases can _find_ the right agents. **Risk:** low. **Deps:** none. **Effort:** S. **Impact:** foundation.

## Phase 1 — Persistent teams/groups (2 wk)

- Today `AgentService.groups` are **user-created, none seeded** (`agent-network/00_PROFILE.md:51`) and `executeGroup` supports `parallel/sequential/consensus/pipeline/debate` (`agent-research/00_PROFILE.md:55`, `agent-service.ts:688-762`). Seed a few domain teams (e.g., "Security Triad" = architect+security+critic; "Doc Quality" = writer+doc-checker+doc-auditor) as reusable group definitions.
- **Benefit:** one-click multi-agent collaboration matching doc 28's best combos. **Risk:** low–med (group lifecycle/UI). **Deps:** Phase 0. **Effort:** M. **Impact:** usability of collaboration.

## Phase 2 — Cross-agent debate orchestration (2–3 wk)

- Add a "debate template" builder that pre-fills participants + sides from the doc-28 matrix (e.g., secure-design triad auto-assigns Architect=Pro, Security=Con, Critic=Red-team). Reuses `debateService.startDebate` (`phase21-invocation.ts:75-87`).
- **Benefit:** debates are composed by _role fit_, not manual pick-each. **Risk:** med (side auto-assignment logic; must respect `persona-selector` limits). **Deps:** Phase 1, Variant A Phase 2 (for real personas). **Effort:** M. **Impact:** debate quality + speed.

## Phase 3 — Invocation orchestration (2–3 wk)

- Extend the **existing** Invocation Engine with _orchestrated multi-step_ invocations (a policy can chain `chat→debate→chat` as one `Invocation` aggregate) — **without** adding agent→agent spontaneity (honor D3/D6). The engine already owns the aggregate (`phase21-invocation.ts:7`); only the `ExecutionDelegate` gains a sequencing branch.
- **Benefit:** complex human-authored workflows ("research, then debate, then write") in one invocation. **Risk:** med–high (aggregate state machine). **Deps:** Phase 1, Variant A. **Effort:** L. **Impact:** powerful workflows.

## Phase 4 — Shared capability & learning loop (3 wk)

- Aggregate per-group performance (reuse `AgentService` stats from `COGNITIVE_STEP_COMPLETED`, `agent-service.ts:184`) into a team reputation; feed back into group suggestions.
- **Benefit:** system learns which teams work. **Risk:** med. **Deps:** Phase 1–3. **Effort:** M–L. **Impact:** continuous improvement.

## Variant B summary

- **Benefits:** unlocks the combinatorial value of 25 agents; builds directly on `executeGroup` + Invocation Engine.
- **Risks:** larger surface; cross-agent orchestration can reintroduce the agent→agent spontaneity the design forbids (must guard D3/D6).
- **Dependencies:** Variant A Phase 2 (personas) strongly recommended; otherwise collaborations are generic.
- **Effort:** ~11–17 dev-weeks.
- **Expected product impact:** the platform shifts from "25 chatbots" to "compose-able agent teams."

---

# VARIANT C — Agent Product/UI First

**Thesis:** Users don't care about internals until they can _see and trust_ agents. Invest in the `AgentsPanel` UX: rich agent cards (activity, performance, reputation), live streams, and cognitive events surfaced in the UI. Lowest backend risk; highest visible product payoff per week.

## Phase 0 — Agent card enrichment (1–2 wk)

- `AgentsPanel` already has `AgentCard`, `AgentDetailPanel`, `AgentStatsDashboard`, `EloLeaderboard`, `LiveActivityStream`, `AgentObservabilityTab`, `AgentHistoryTab`, `AgentGroupsSection` (`agent-risk/00_PROFILE.md:38`, `agent-data/00_PROFILE.md:38`). Wire `specializations` + avatar (`agent-profiles.ts` identity, surfaced via `resolveAgentIdentity`/`AgentAvatar`) into the card so each agent _reads_ as its role.
- **Benefit:** immediate visual specialization. **Risk:** low. **Deps:** none. **Effort:** S–M. **Impact:** UX polish.

## Phase 1 — Activity & performance surfaces (2 wk)

- Surface `AgentService` stats (`calls/tokens/latency/errors/cost` from `COGNITIVE_STEP_COMPLETED`, `agent-service.ts:184-209`) onto `AgentStatsDashboard` / `EloLeaderboard`. Repair `AgentAvatar` hash-fallback caveat so curated avatars always show (`agent-risk/00_PROFILE.md:39`).
- **Benefit:** users see who is effective. **Risk:** low. **Deps:** Phase 0. **Effort:** M. **Impact:** trust/transparency.

## Phase 2 — Live streams per agent (2 wk)

- Render `LiveActivityStream` (`agent-research/00_PROFILE.md:43`) from `conversation:*` + `invocation:*` events (`AGENTS.md` RoomPanel store already subscribes). Reuse the `EventRecorder` streaming-spam filter from runtime hardening (`AGENTS.md`) so high-frequency events don't melt the UI.
- **Benefit:** "agent is alive" feel. **Risk:** med (perf). **Deps:** Phase 1. **Effort:** M. **Impact:** engagement.

## Phase 3 — Cognitive events in UI (2–3 wk)

- Visualize `cognitive:trace:updated` / `cognitive:step:active` / `cognitive:step:completed` (`event-registry.ts:736,755,763`) as a per-agent "thinking" timeline; resolve the `cognitive:decision:made` dead-consumer (`:776`) by either consuming or retiring it.
- **Benefit:** transparency into reasoning, not just output. **Risk:** med (event volume; needs filter). **Deps:** Variant A Phase 3 ideally, but can be UI-only. **Effort:** M. **Impact:** trust/differentiation.

## Phase 4 — Reputation & discovery UX (2 wk)

- Turn `EloLeaderboard` + group membership into a "recommended agent for this task" hint in `RoomPanel` (leverages `AgentResolverDirectory.specializations`, `phase21-invocation.ts:44-57`) — suggestion only, human confirms (D6).
- **Benefit:** closes the discoverability gap from doc 29 §3. **Risk:** low. **Deps:** Phase 1–2. **Effort:** M. **Impact:** adoption.

## Variant C summary

- **Benefits:** fastest visible product improvement; almost entirely UI; leverages existing panels and events.
- **Risks:** low; main risk is event-volume perf (mitigated by existing filters).
- **Dependencies:** none hard; pairs well with Variant A Phase 3 (cognitive visibility) and Variant B Phase 1 (groups).
- **Effort:** ~9–14 dev-weeks.
- **Expected product impact:** the agent platform becomes a _visible, trustworthy product_ rather than invisible infra.

---

# Cross-cutting dependencies & sequencing (INFERRED)

- **A Phase 2 enables B Phase 2 and C Phase 3** — without specialization-aware personas, collaboration and cognitive UIs show generic agents.
- **B Phase 1 reuses C Phase 0/1** data (capability catalog, stats) — build the catalog once.
- **C Phase 4 reuses B Phase 0** capability profile — single source of `specializations`.
- All three **reuse** (not replace): `persona-selector`, `AgentService`, `AgentResolverDirectory`, Invocation Engine, `event-registry`, `AgentsPanel` family, `EventRecorder` filters. No new framework is required by any variant (VERIFIED by reading the cited sources).

_Recommendations/sequencing are OPINION; final decision rests with the human. See doc 31 for the comparison & recommended hybrid._
