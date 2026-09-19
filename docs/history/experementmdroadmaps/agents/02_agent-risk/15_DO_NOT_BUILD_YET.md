# 15_DO_NOT_BUILD_YET — temptations to avoid for `agent-risk`

> Guardrail list. These are attractive but premature, duplicated, platform-level, or
> new-architecture ideas that should NOT be built now. Many would create one of the "25
> mini-frameworks" the AGENTS.md warns against.

## N1 — A dedicated `RiskAgentService` class

- Tempting: give agent-risk its own service with risk methods.
- Why avoid: agents are topology NODES; behavioral machinery is SHARED by design (AGENTS.md,
  agent-identity.ts:1-12). A per-agent service duplicates `AgentService` + breaks the "one
  resolver" rule. Agent-specific value comes from prompt/persona/memory wiring, not a new class.

## N2 — A new `risk` event family (`risk:assessed`, `risk:breach`, …)

- Tempting: emit rich risk events.
- Why avoid: `cognitive:decision:made` already exists and is simply dropped (P6). Reuse it with
  risk metadata; do NOT spawn a parallel event taxonomy. New events = EventBus sprawl.

## N3 — A standalone Risk Modeling / Monte-Carlo microservice

- Tempting: build a real quant engine behind agent-risk.
- Why avoid: premature architecture. First bind the EXISTING `ANALYTICS_TOOLS` (data_analysis/
  visualization/web_search, topology-defaults.ts:8) + a thin `risk_model` tool (B2). A separate
  service duplicates the LLM-tool contract and adds deployment/cost burden.

## N4 — A risk-specific memory store (separate from the 16 existing)

- Tempting: `risk-memory.ts` with probability/impact schema.
- Why avoid: existing semantic/episodic stores already support `agentId` + `metadata.tags`
  (episodic-memory.ts:53). Add `tags:['risk']`; do NOT fork the memory subsystem (would be
  mini-framework #N). Respects P2.20 caps.

## N5 — Agent self-invocation / autonomous risk patrol

- Tempting: agent-risk wakes itself to scan the system.
- Why avoid: D6 (authority = human; agents never self-invoke). Invocation engine explicitly
  blocks agent-initiated calls unless policy allows (invocation-engine-service.ts:140). Scheduled
  sweeps (B3/4.1) must be human-policy-gated, NOT agent-autonomous.

## N6 — A Risk Agent UI panel separate from AgentsPanel

- Tempting: dedicated RiskAnalystPanel with dashboards.
- Why avoid: AgentsPanel already provides card/detail/stats/elo/live/observability tabs
  (src/components/AgentsPanel/*). Add widgets there (M5/2.4); do not fork the agent UI.

## N7 — Debate-side ML classifier for specialization→role

- Tempting: train/prompt a model to assign debate sides by specialization.
- Why avoid: a 5-line rule consulting `AGENT_PROFILES.specializations` (Q4/1.1) suffices. ML
  classifier is over-engineering for 25 fixed agents.

## N8 — Compliance rule database / regulatory KB

- Tempting: embed a regulations store agent-risk queries.
- Why avoid: premature. First prove agent-risk journals/composes compliance gaps (M3) from LLM
  - web_search tool. A regulatory KB is a later, separate knowledge project — not agent-risk's
    own subsystem.

## N9 — Per-agent fine-tuned model for risk

- Tempting: fine-tune llama-3.3 for risk reasoning.
- Why avoid: infra/cost heavy; the `auto` routing + good prompt + tools (B2) likely enough.
  Revisit only if quality metrics (Elo/decision accuracy, 4.3) show a gap.

## N10 — Generic "agent capability registry" to power specializations

- Tempting: a system that knows each agent's real capabilities (not just labels).
- Why avoid: this is a PLATFORM-level change affecting all 25 agents; out of scope for one agent.
  If built, it must be global, not agent-risk-specific. Defer to a platform epic.

## Guiding principle

Maximize reuse of: AgentService, AgentIdentityView, memory stores (agentId), cognitive events,
Invocation, Director scenarios, Crystal/Forum bridges. Every "do not build" above is something
already coverable by an existing piece if wired correctly.
