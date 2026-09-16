# 04_DEBATE_ROLE — Debate participation for `agent-creative`

## CURRENT (VERIFIED)

`agent-creative` is a **generic debate participant**. When a debate's participant list
includes its node id, the runtime executes the node's `prompt` + pinned model. Two facts
dominate its actual debate behavior:

1. **Persona is topic-keyword driven, not role-driven.**
   `PersonaSelector.selectForTopic` (`persona-selector.ts:243-290`) scores 10 hardcoded
   persona variants (`cautious_scientist`, `passionate_advocate`, `pragmatic_economist`,
   `legal_expert`, `historian`, `technologist`, `philosopher`, `diplomat`, `cultural_critic`,
   `strategist`) by matching topic keywords. It never reads `agent-creative`'s
   `specializations` or `baseRole`. So a "brand strategy" debate may assign it
   `pragmatic_economist` or `strategist` purely by keyword overlap, ignoring its creative
   identity.

2. **No creative-specific debate module.** There is no `creative` persona variant, no
   brand/narrative debate strategy. The node behaves like any other agent with a different
   prompt.

Net: today `agent-creative` in a debate = "a high-temperature openrouter-70B node with a
'think outside the box' prompt, wearing whatever persona the topic keywords pick."

## POTENTIAL (justified, INFERRED from code seams)

- **Add a `creative_visionary` persona variant** to `VARIANTS` in `persona-selector.ts`
  (the array is the extension point; `selectVariant` already supports `suitableRoles` and
  `triggerKeywords`). Trigger keywords: `brand`, `story`, `narrative`, `campaign`,
  `ideation`, `tagline`, `design`, `metaphor`, `slogan`, `concept`. This would let the
  selector _choose_ creativity when the topic warrants, instead of ignoring the agent.
- **Specialization-aware persona bias:** extend `selectVariant` to accept the agent's
  `specializations` and boost creative variants when the agent is `agent-creative`/
  Creative-group. Low risk — additive, behind the same interface.
- **Team it with Creative-group peers** (`agent-designer`, `agent-content`, `agent-ux`,
  `prompt-audit-service.ts:21-24`) in a "Creative Council" debate for brand/UX topics.

## RECOMMENDED

1. Add `creative_visionary` (+ optionally `brand_strategist`) persona variant(s) to
   `persona-selector.ts`. (Quick win, see `11_OPPORTUNITIES.md` Q1.)
2. Make `PersonaSelector` persona selection optionally **agent-aware** so that when
   `agent-creative` is a participant and the topic matches creative keywords, the creative
   persona wins deterministically.
3. Document a "Creative Council" debate preset that pre-selects the 4 Creative-group agents.

## 2–3 Scenario sketches

- **S1 — Brand repositioning debate.** Topic: "Reposition our developer-tool brand for
  non-technical founders." Participants: `agent-creative`, `agent-content`, `agent-ux`,
  `agent-strategist`(if exists) / `agent-pm`. Creative persona drives ideation; critic/
  economist provide counterweights. Current code: works, but `agent-creative` may get a
  non-creative persona.
- **S2 — Narrative coherence check.** A story/script is debated for internal consistency;
  `agent-creative` proposes alternative narrative arcs. Today feasible via manual
  participant selection.
- **S3 — Ad-campaign concept clash.** Pro/con debate of two campaign concepts; creative
  agent argues both sides' emotional resonance. Feasible now; persona assignment luck-based.
