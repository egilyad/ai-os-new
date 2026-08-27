# 10_PROBLEMS_AND_LIMITATIONS — concrete, verified problems for `agent-risk`

All items below are grounded in source. "Shared-infra limit" means the gap is systemic, not agent-risk-specific, but it bites agent-risk hardest given its名义 role.

## P1 — Specializations are decorative, not capabilities (VERIFIED)

- `agent-risk` has NO risk-modeling engine, NO Monte-Carlo solver, NO compliance checker. The strings `Risk Modeling / Monte Carlo / Compliance` (agent-profiles.ts:40) are labels only. Any user expecting actual quantitative risk analysis gets a generic LLM answer framed by a static prompt.
- Impact: high trust-violation risk — the agent _looks_ like a Risk Analyst but cannot compute.

## P2 — Declared model pin ignored (VERIFIED)

- `AGENT_PROFILES.model = openrouter/meta-llama/llama-3.3-70b-instruct` (agent-profiles.ts:39) is NOT used at runtime because topology `config.model='auto'` (topology-defaults.ts:165) and `resolveAgent` returns `undefined` model for `'auto'` (agent-service.ts:351-353). Routing layer decides the actual model.
- Impact: the advertised analytical model is not guaranteed; quality/reproducibility of risk reasoning varies with routing.

## P3 — Debate side assigned positionally, ignoring specialization (VERIFIED)

- `debate-api.ts:307-311` `roleOrder[i % 3]` → agent-risk can be `pro`/`con`/`neutral` arbitrarily. A Risk Analyst may be forced into `pro` (defending a risky action) — semantically wrong.
- Impact: debates about risk are frequently mis-cast, weakening the very value proposition.

## P4 — No risk-specific debate persona (VERIFIED)

- `persona-selector.ts` has 10 topic-keyword variants; NONE is risk/compliance. Best match is generic `cautious_scientist`/`pragmatic_economist`. The STRIDE/DREAD/FAIR prompt competes with injected persona.
- Impact: risk framing is incidental, not deliberate.

## P5 — No agent-specific memory / continuity (VERIFIED/INFERRED)

- Memory stores support `agentId` queries (episodic-memory.ts:53, social-memory.ts:33) but nothing auto-loads agent-risk history into turns. Each turn is stateless.
- Impact: the agent cannot "remember" prior risk reviews; repeated analyses don't compound.

## P6 — Cognitive decision visibility dead (VERIFIED)

- `cognitive:decision:made` emitted (cognitive-service.ts:414) but skipped by event-recorder (event-recorder.ts:232,261) and has no handler. So any risk "decision" is invisible.
- Impact: the single most valuable risk output (a quantified decision) is dropped.

## P7 — Debate emits no cognitive events (VERIFIED, systemic)

- Per AGENTS.md: "Debate emits NO cognitive events." So agent-risk's debate contributions never appear in the cognitive stream — only ConversationCore/standalone steps do.
- Impact: most of agent-risk's real work (debates) is invisible cognitively.

## P8 — Avatar inconsistency (VERIFIED)

- `AgentAvatar.getAgentAvatar` is hash-based (AgentAvatar.tsx:47), ignoring `AGENT_PROFILES` 📊/#ef4444 in raw avatar contexts. Curated avatar only appears via `AgentIdentityView`.
- Impact: minor brand/identity inconsistency across UI.

## P9 — Specializations hidden in UI (VERIFIED)

- AgentCard does not prominently show `specializations`; the risk prompt is editor-only (UI-HIDDEN per 02). Users can't tell agent-risk is a Risk Analyst from the card.

## P10 — Tools may not be honored (INFERRED/PARTIAL)

- `tools: ANALYTICS_TOOLS` (topology-defaults.ts:164) — whether the executor actually grants `data_analysis`/`visualization`/`web_search` to agent-risk turns is executor-dependent; no agent-risk-specific verification that Monte-Carlo/risk tooling is invoked.

## P11 — No scheduler / proactive invocation (VERIFIED N/A)

- agent-risk is purely reactive (human/debate/scenario). No scheduled "risk sweep" or proactive compliance monitoring exists.

## Shared-infra limits (VERIFIED, bite agent-risk)

- Single prompt + `auto` model + positional debate side + dead decision consumer + no auto memory = the generic-agent ceiling. agent-risk is the canonical example of an agent whose _identity promises more than its machinery delivers_.
