# 04 — DEBATE ROLE

> VERIFIED mechanics, POTENTIAL roles, RECOMMENDED role, scenarios.

## CURRENT (VERIFIED)

- `agent-po` is a selectable debate **participant** (topology node). Role assigned by debate config (`pro`/`con`/`neutral`), e.g. `InvitationExecutionDelegate` forces `role:'neutral'` for invocation debates (`phase21-invocation.ts:81`).
- **Persona injection** (`persona-selector.ts`): gated by `isQ('dynamic-persona')` (`debate-llm-prompt-context.ts:873`). When on, it selects a variant by `participant.role` + topic keywords. `agent-po`'s **specializations are ignored** for persona selection.
- **Critical finding (VERIFIED):** `PersonaSelector` `suitableRoles` are only `pro`/`con`/`neutral` (`persona-selector.ts:23,46,70,94,119,144,168,191,214,238`). The agent's _product-owner_ identity plays **no part** — a PO in a debate is just "neutral participant #N" with a generic scientist/economist/etc. persona bolted on by topic.
- No `product-owner` persona variant exists in the library (`persona-selector.ts:3-241`).

## POTENTIAL roles (OPINION, justified)

1. **Vision-holder / Scope-guardian** — PO's `Vision` + `Prioritization` specs map naturally to a debate role that constantly re-anchors arguments to _user value_ and _scope_. Justified: no existing persona defends "does this serve the user / is this in scope?"
2. **Synthesizer** — PO already mediates between stakeholders (specialization `Prioritization` = trade-off decisions). A `Diplomat`-like synthesizer variant specialized for product trade-offs is missing.
3. **Backlog Refiner** — converts debate conclusions into prioritized, acceptance-criteria-bearing backlog items (bridge to Crystal/Workflow).

## RECOMMENDED (OPINION)

Add a dedicated `persona:product-owner` variant to `persona-selector.ts` (suitableRoles `pro`/`con`/`neutral`, minRound 1) whose `promptInjection` re-anchors every argument to user value, scope, and prioritization — and **key it on agent identity** (not just debate role) so that when `agent-po` (or any agent with specialization `Prioritization`/`Vision`) is a participant, the PO persona is preferred. This requires `persona-selector` to receive `specializations` (already available via `AgentResolverDirectory` → `resolveAgent`, `phase21-invocation.ts:47-55`), not just `role`.

## Scenarios (OPINION)

- **S1 — Feature scope dispute:** PO as `neutral` re-anchors "should we build X?" to user-value + backlog priority. Currently no agent does this.
- **S2 — Post-debate synthesis:** After a technical debate, PO distill the verdict into prioritized backlog items (needs Workflow/Crystal bridge — see `11`).
- **S3 — Stakeholder trade-off:** PO + `lens:multi-stakeholder` jointly surface whose needs are served; today `multi-stakeholder` lens exists (`lens-library.ts:126`) but is never auto-applied to `agent-po`.
