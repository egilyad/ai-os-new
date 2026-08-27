# 07_COGNITIVE_ROLE — cognitive event surfacing for `agent-risk`

> Scope: display/integration improvements ONLY. No new event system. Reuses the
> 4 existing cognitive events + AgentService stats consumption.

## Current cognitive events (VERIFIED)

- `cognitive:trace:updated` (event-registry.ts:736) — full trace array.
- `cognitive:step:active` (event-registry.ts:755) — nodeId + traceId.
- `cognitive:step:completed` (event-registry.ts:763) — nodeId, duration, output, model. **Consumed by AgentService for stats** (agent-service.ts:184).
- `cognitive:decision:made` (event-registry.ts:776) — emitted by cognitive-service.ts:414 but **dead at consumer** (event-recorder.ts:232,261 skip; event-bridge.ts:31 lists but no handler).

## What agent-risk currently surfaces (VERIFIED)

- Only `COGNITIVE_STEP_COMPLETED` → feeds `AgentStats` (calls, tokens, latency, errors, cost) shown in `AgentStatsDashboard` / `AgentObservabilityTab`.
- The LiveActivityStream (AgentsPanel) shows activity derived from stats/lifecycle — not the cognitive event stream directly.

## Recommended surfacing improvements (OPINION)

1. **Decision visibility (cheap, high value):** the `cognitive:decision:made` event already exists and is emitted; it is simply dropped. Wire a consumer (e.g. in `AgentObservabilityTab` or a new cognitive-stream panel) to render agent-risk's decisions. This makes "Risk Analyst decided X with confidence Y" visible — exactly the kind of output a risk agent should expose. No new event, just a handler. (Reuses existing event + CognitiveDecisionSchema.)
2. **Step trace in AgentDetailPanel:** show last N `cognitive:step:completed` outputs for agent-risk (the actual risk analysis text), so the card isn't just a name+avatar. Reuses `cognitive:trace:updated`/step payloads already on the bus.
3. **Risk decision badge:** if a decision's `metadata` carries a risk score/confidence, render a colored badge (green/amber/red) — maps naturally to the 📊/#ef4444 identity.
4. **Cross-agent cognitive timeline:** a panel that correlates agent-risk's `cognitive:step:completed` with the debate/conversation turn it answered, giving a "why did the Risk Analyst say that" trail. Reuses existing events + `DirectorStore`/`debate` joins.

## Why no new events (OPINION)

- The 4-event vocabulary is sufficient. Adding `risk:assessed` would be premature abstraction (see 15). Agent-specific value comes from **consuming** what already exists, not emitting more.

## Caveat (VERIFIED)

- Debate emits NO cognitive events (per AGENTS.md shared context). So agent-risk's debate contributions are invisible in the cognitive stream — only ConversationCore/standalone cognitive steps surface. This is a system-wide gap, not agent-risk-specific.
