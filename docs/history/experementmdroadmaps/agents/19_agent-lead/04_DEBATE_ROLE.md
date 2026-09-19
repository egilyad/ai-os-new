# 04_DEBATE_ROLE — `agent-lead` in Debates

> Tags VERIFIED / INFERRED / OPINION. `file:line` throughout.

## CURRENT state (VERIFIED)

- **Participant only.** If `agent-lead` is added to a debate, `debate-agent-executor.ts:45 findParticipant` resolves it by node id; it speaks its team-lead prompt.
- **Persona is topic-driven, not identity-driven.** `PersonaSelector.selectForTopic` (`persona-selector.ts:251-308`) scores persona variants by topic keywords and round. agent-lead gets the _same_ candidate pool as any agent. For a "team/coordination/architecture" debate it could receive `diplomat` (consensus/negotiation keywords `:177-193`), `strategist`, or `technologist` — but never a "lead" persona, because none exists.
- **Tactical meta-role is graph-driven.** `MetaAgentController.getDirective` (`debate-meta-agent-controller.ts:21-102`) can promote an agent to `synthesizer` (`:97-99`) when its claims have high centrality in late rounds. This is the _closest_ thing to a lead role and agent-lead can earn it — but purely on centrality math, not its profile.
- **No moderator/ chair role** exists in `debate-meta-agent.ts` (`TacticalRole` = standard/devils_advocate/synthesizer/evidence_harvester/rhetoric_optimizer, `:6-7`). There is no `moderator`/`lead`/`coordinator` tactical role.

## POTENTIAL roles (INFERRED — natural fits for a "Team Lead")

1. **Coordinator / Facilitator** — open the debate by framing scope, then periodically (round ≥ 3) issue `synthesizer`-style directives to converge. Reuses `MetaAgentController` + a new `TacticalRole:'coordinator'`.
2. **Synthesizer (default for lead)** — bias `MetaAgentController` to assign `synthesizer` to agent-lead earlier (round ≥ 2) and more often, since its profile is "Mentoring/Coordination".
3. **Architecture reviewer** — in technical debates, agent-lead's `Architecture` specialization maps to `lens:security`/`lens:long-term` style scrutiny; could be surfaced as a debate persona `architect_reviewer`.

## RECOMMENDED (OPINION)

Make agent-lead the **default synthesizer/coordinator** in debates where it participates: add a `coordinator` tactical role to `debate-meta-agent.ts` and have `MetaAgentController` prefer agent-lead (or any agent whose `specializations` include `Coordination`) for `synthesizer`/`coordinator` directives from round 2. This converts the unused `Coordination` specialization (02_CAPABILITIES row 5) into debate behavior with **zero new buses**.

## Scenarios (INFERRED)

- **S1 — Architecture decision debate.** 6 agents argue monolith vs microservices. agent-lead (Architecture spec) is auto-assigned `coordinator` from round 2, issues synthesis directives, and at round 4 produces the convergence summary. Today this would happen only by luck of centrality.
- **S2 — Cross-team conflict.** agent-pm (scope) vs agent-security (risk) vs agent-lead (coordination). agent-lead mediates via `diplomat` persona + `synthesizer` meta-role → faster consensus.
- **S3 — Post-debate mentoring.** After `DEBATE_CONSENSUS`, agent-lead summarizes action items for the human ("unblock obstacles, ensure code quality" — its prompt). Pure prompt leverage, no code.

## Risk / Dependencies (VERIFIED)

- Adding `coordinator` role requires editing `debate-meta-agent.ts:6` (contract) + `MetaAgentController._buildDirective` (`debate-meta-agent-controller.ts:104-151`). Low risk, additive.
- Must NOT break the generic path: only _bias_ assignment when agent-lead (or a Coordination agent) is present.
