# 10 — PROBLEMS & LIMITATIONS (concrete, VERIFIED)

1. **Specializations are decorative.** `['Backlog','Vision','Prioritization']` (`agent-profiles.ts:200`) drive **zero** behavior — not used in persona selection (`persona-selector.ts`), routing, or invocation expertise matching (RoomPanel uses name pick, `phase21-invocation.ts`). _Impact: the agent's defining trait is inert._

2. **Model pin is dropped at runtime.** `AGENT_PROFILES.model:'llama-3.3-70b-versatile'` (`agent-profiles.ts:199`) is overridden by topology `config.model:'auto'` (`topology-defaults.ts:365`), and `resolveAgent` returns model only when ≠ `'auto'`/`'default'` (`agent-service.ts:351-353`). _Impact: `agent-po` does NOT run on groq as configured; silently uses router-assigned model. VERIFIED mismatch._

3. **Provider pin is decorative.** `provider:'groq'` (`agent-profiles.ts:198`) is surfaced in identity view only; execution uses runtime provider-resolution. _Impact: no guarantee of groq._

4. **Debate persona ignores PO identity.** `PersonaSelector` keys on `participant.role` (pro/con/neutral) + topic (`persona-selector.ts:251-290`, caller `debate-llm-prompt-context.ts:873-884`); no `product-owner` variant exists (`persona-selector.ts:3-241`). _Impact: in debate PO is a generic neutral voice._

5. **Persona injection is feature-flag-gated.** `isQ('dynamic-persona')` (`debate-llm-prompt-context.ts:873`) — if off, PO gets **no** persona at all (pure system prompt). _Impact: debate behavior depends on a flag the agent cannot control._

6. **No structured product output.** PO chat/debate output is free text; no backlog schema, acceptance criteria, or prioritization structure. _Impact: outputs not machine-usable (cannot feed Workflow/Crystal)._

7. **`invocation-types` module missing (repo-wide).** `invocation-repository.ts:4`, `dexie-schema.ts:20`, `interfaces.ts:8` cannot resolve `./invocation-types`. _Impact: blocks typecheck of the Invocation path that `agent-po` relies on for RoomPanel invocation. Pre-existing, not PO-specific, but a real blocker._

8. **`COGNITIVE_DECISION_MADE` dead-at-consumer** (`event-registry.ts:776`, AGENTS.md). _Impact: PO's natural "decision" outputs (prioritization) have no first-class event consumer._

9. **No PO lens.** Lens library has 11 lenses (`lens-library.ts`), none product/vision-oriented; `agent-po` has `lensIds:[]`. _Impact: no perspective transform amplifies PO viewpoint._

10. **No PO-specific groups/teams preconfigured.** `AgentGroupsSection` exists but PO is not pre-grouped with PM/Lead beyond the prompt-audit `'Management'` label (`prompt-audit-service.ts:18-20`). _Impact: cross-agent PO workflows not pre-wired._
