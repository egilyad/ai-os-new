# 04_DEBATE_ROLE — `agent-designer` in Debate

> VERIFIED: debate persona = node system prompt + a generic `persona-selector` variant. There is
> **no design/UX/accessibility persona variant** (grep of `persona-selector.ts:3-241` confirms 10
> variants: cautious_scientist, passionate_advocate, pragmatic_economist, legal_expert, historian,
> technologist, philosopher, diplomat, critic, strategist — none design).

## CURRENT (VERIFIED)

- Selected as a debate participant via `debate-agent-executor.ts:45` (`findParticipant` → `callLLM`).
- Speaks with the hardcoded prompt `topology-defaults.ts:312` ("…user-centered design, interaction
  patterns, visual hierarchy…").
- In Invocation-triggered debates, it is forced to role `'neutral'` regardless of design stance
  (`phase21-invocation.ts:81`) — it loses its design perspective framing.
- `specializations` / `baseRole` are **never** injected into the debate system prompt
  (VERIFIED: grep `debate-runtime` → 0 matches for `specializations`/`baseRole`).

## POTENTIAL (justified from existing infra)

1. **`design_critic` persona variant** — add to `persona-selector.ts` VARIANTS with trigger keywords
   [design, ux, ui, accessibility, usability, prototype, wireframe, hierarchy, color, typography,
   interaction, user, heuristic]. Reuses the exact existing `PersonaVariant` shape — zero new infra.
2. **Bind `specializations` into the debate system prompt** — `resolveAgent` already returns
   `specializations` (`agent-service.ts:385`); the debate caller could append them as a scoped
   expertise line. Today they are dropped.
3. **Design-systems lens** — add a `lens:design` to `LENS_LIBRARY` (15 lenses today, no design one)
   and let the designer auto-carry it (`normalizeAgentIdentity` could set `lensIds` for design agents).

## RECOMMENDED

Make `agent-designer` a **first-class design critic** in debate by:

- Adding `design_critic` variant (low effort, high value).
- Appending `specializations` to debate persona construction.
- Assigning `lens:design` + `lens:critical` as default lenses for design agents.
  This turns "a generic agent that happens to have 🎨" into "the agent that actually critiques UX."

## Scenarios

1. **Feature design review** — designer (pro) vs engineer (con) on a new UI flow; designer flags
   accessibility/consistency gaps using `design_critic`.
2. **Accessibility audit debate** — designer argues WCAG violations; `lens:security`/`lens:critical`
   peers counter-balance; convergence yields an accessibility checklist.
3. **Design-vs-engineering tradeoff** — designer (emotional impact / hierarchy) vs architect
   (scalability) with `diplomat` moderator seeking synthesis.
