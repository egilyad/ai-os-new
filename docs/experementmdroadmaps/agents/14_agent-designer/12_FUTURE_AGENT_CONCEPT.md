# 12_FUTURE_AGENT_CONCEPT — The realized "Design Critic"

> Concept realized **entirely from existing capabilities** (no new agent, no new runtime). This is
> what `agent-designer` becomes when its already-present identity fields are actually exercised.

## The gap (VERIFIED)

Today `agent-designer` carries `specializations:['UX','Prototyping','Design Systems']`
(`agent-profiles.ts:160`) and a design prompt (`topology-defaults.ts:312`) but NONE of that is
actioned. The runtime treats it as a generic node.

## The realized concept

Take the **existing** pieces and wire them so the design identity is _performed_, not just displayed:

1. **Persona** — `design_critic` variant added to the existing `persona-selector.ts` VARIANTS
   (data, Q1). Reuses `PersonaVariant` + `selectForTopic` scoring.
2. **Expertise injection** — `resolveAgent` already returns `specializations`
   (`agent-service.ts:385`); the debate/conversation caller appends them as a scoped line (Q2).
   Now "UX / Prototyping / Design Systems" actually shape the prompt.
3. **Lens** — a `lens:design` added to `LENS_LIBRARY` (M1) and auto-attached to design nodes in
   `normalizeAgentIdentity` (Q4). The designer then benefits from the Synthesis/Conversation lens
   pipeline like every other lens-bearing agent.
4. **Memory** — journal entries for `agent-designer` are auto-tagged `['ux','design']` and named
   "Kai Mendez" (Q3), enabling `listByTag('ux')` history and a Design portfolio tab (M2).
5. **Crystallization** — high-confidence design critiques bridge to Crystal Vault (M4), so design
   patterns accumulate as reusable crystals.
6. **Invocation** — a `design-role` policy (Q5) lets a human invoke the designer for UX review and
   preserves its `pro` stance in debates (fixes `phase21-invocation.ts:81` neutral bug).

## Result

The "Design Critic" is not a new subsystem — it is `agent-designer` with its **already-declared**
specializations, lenses, and journal finally connected to the shared infrastructure. Every building
block exists; the concept is the _integration_ of Q1+Q2+Q4+M1+M2+M4 (the BIG IDEA B1 in
`11_OPPORTUNITIES.md`).

## Why this is the right shape

- Honors the AGENTS.md architecture: shared infra, no globals, events-first, contracts at boundaries.
- Does not create a 26th agent or a design-specific bus — it reuses topology, persona-selector,
  lenses, journal, crystals, invocation.
- The agent's "design-ness" becomes observable in debate, conversation, memory, and knowledge — not
  just on an avatar.
