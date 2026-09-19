# 04_DEBATE_ROLE — `agent-ux` in Debate

## CURRENT state

`agent-ux` can be added as a debate **participant** like any node. When it speaks:

- `debate-agent-executor.ts:38-117` runs the LLM with the node system prompt (`topology-defaults.ts:334-340`) + the selected **PersonaSelector** variant (`persona-selector.ts:243-309`).
- The persona is chosen by **topic keyword match**, NOT by agent identity. The 11 variants (cautious_scientist, passionate_advocate, pragmatic_economist, legal_expert, historian, technologist, philosopher, diplomat, critic, strategist) contain **no UX/research-oriented variant** — e.g., none triggers on `usability`, `heuristic`, `interview`, `user journey`, `accessibility`. **[VERIFIED]**
- It emits `DEBATE_*` events; the debate runtime does **not** emit cognitive events, so a `agent-ux` debate turn is invisible to the cognitive stream/stats from the debate path. **[VERIFIED]** (shared context + `event-registry.ts` debate vs cognitive separation).

So today `agent-ux` in a debate behaves as a generic analyst with a "UX researcher" label — there is no UX-specific reasoning scaffold.

## POTENTIAL (justified)

1. **Add a `ux_researcher` persona variant** to `persona-selector.ts` triggering on UX keywords (`usability, heuristic, interview, accessibility, user journey, UX, wireframe, prototype, retention, friction, onboarding, persona, A/B`). Justified: the selector is the established, low-risk extension point and would make `agent-ux` actually reason like a UX researcher in debates. **[VERIFIED extension point]**
2. **Usability heuristic scorer**: a debate-side post-processor that scores arguments for usability principles (Nielsen's 10). Reuses the `lens-engine`/`junction-engine` scoring pattern. **[INFERRED reuse]**
3. **User-advocate role**: assign `agent-ux` as the permanent `con` or `neutral` voice representing the end user in product/policy debates. Justified by specializations (User Research, Usability).

## RECOMMENDED

Make `agent-ux` the **default user-advocate / usability critic** in product, design, and policy debates via (a) a dedicated `ux_researcher` persona variant and (b) a lightweight heuristic-scoring decorator. This reuses `persona-selector.ts` + `lens-engine` and requires no new architecture.

## Scenarios

1. **Product feature debate** — proposition: "Add a dark-mode toggle." `agent-ux` (user-advocate) raises discoverability, contrast/accessibility (WCAG), and onboarding-friction concerns; `agent-designer` counters with visual consistency. Produces a balanced verdict.
2. **Policy debate** — "Mandatory ID verification." `agent-ux` injects the end-user friction and accessibility-for-marginalized-users perspective, balanced against `agent-security`/`agent-ethics`.
3. **Post-launch retro** — feed a debate the support-ticket summary; `agent-ux` applies heuristic evaluation to propose top-3 usability fixes.

**[VERIFIED]** current behavior; **[INFERRED]** reuse paths; **[OPINION]** recommendations.
