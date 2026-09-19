# 11_OPPORTUNITIES — Wins for `agent-designer`

Each: ID | Description | User value | Technical reuse | Effort | Risk | Dependencies |
Existing infra | Why now.

## 5 QUICK WINS (data/config only, no new services)

- **Q1 — Add `design_critic` persona variant.**
  Description: append a `PersonaVariant` to `persona-selector.ts` VARIANTS (keywords: design, ux,
  accessibility, usability, prototype, wireframe, hierarchy, typography, interaction, heuristic).
  User value: designer actually critiques UX in debates. Reuse: existing `PersonaVariant` shape +
  `selectForTopic`. Effort: S. Risk: low (additive). Deps: none. Infra: `persona-selector.ts:3`.
  Why now: specializations are inert (#1); this is the cheapest way to make them matter.

- **Q2 — Bind `specializations` into debate system prompt.**
  Description: in the debate caller, append `specializations` (already returned by `resolveAgent`
  `agent-service.ts:385`) as a scoped-expertise line. User value: designer speaks from its real
  expertise. Reuse: `resolveAgent`. Effort: S. Risk: low. Deps: debate caller. Infra:
  `agent-service.ts:337`. Why now: same root cause as Q1.

- **Q3 — Fix journal `agentName` + `tokensUsed`.**
  Description: store friendly name via `resolveAgentIdentity` and populate `tokensUsed` from
  `COGNITIVE_STEP_COMPLETED.output` estimate. User value: accurate design history. Reuse:
  `agent-journal-service.ts:130-190`. Effort: S. Risk: low. Deps: none. Infra: existing journal.
  Why now: history is currently anonymous/broken (#6,#7).

- **Q4 — Assign `lens:design` + `lens:critical` to design agents.**
  Description: in `normalizeAgentIdentity`, set `lensIds=['lens:design','lens:critical']` for
  design/ux/creative nodes (after adding `lens:design`). User value: designer benefits from lenses
  in Synthesis/Conversation. Reuse: `normalizeAgentIdentity` `topology-defaults.ts:91`. Effort: S.
  Risk: low. Deps: Q-lens (add `lens:design`). Infra: `LENS_LIBRARY`. Why now: closes #3.

- **Q5 — Add a `design-role` Invocation policy + preserve design stance.**
  Description: seed a policy permitting `agent-designer` for `context.type:room` and, for
  `mode:debate`, set role `pro` instead of neutral. User value: design debates keep their stance.
  Reuse: `createPolicy` `phase21-invocation.ts:127`. Effort: S. Risk: low. Deps: none. Infra:
  existing engine. Why now: fixes #4.

## 5 MEDIUM (small feature work, reuse existing subsystems)

- **M1 — Design lens `lens:design` in LENS_LIBRARY.** Perspective-inject questions on accessibility,
  consistency, hierarchy, emotional impact. User value: design perspective reusable by all agents.
  Reuse: `Lens` type + library. Effort: M. Risk: low. Deps: none. Infra: `lens-library.ts`. Why now:
  pairs with Q4.

- **M2 — Design portfolio tab in AgentDetailPanel.** Render crystallized design patterns (Crystal
  Vault) + recent `listByTag('ux')` journal. User value: see designer's accumulated design wisdom.
  Reuse: `CrystalCard`, `AgentHistoryTab`. Effort: M. Risk: low. Deps: M4/Crystal. Infra:
  `AgentDetailPanel.tsx`. Why now: memory is untapped (#8).

- **M3 — Prototype preview pane.** When designer emits HTML/markdown, render in iframe (reuse
  `KnowledgeGenPanel` preview). User value: "see" the design, not just read it. Reuse: existing
  preview components. Effort: M. Risk: med (sanitization). Deps: none. Infra: `KnowledgeGenPanel`.
  Why now: text-only design output is weak.

- **M4 — Design→Crystal bridge.** Designer critiques → `crystalVault.propose` when confidence high.
  User value: design patterns become reusable knowledge. Reuse: `crystal-vault-service` (Module 2).
  Effort: M. Risk: med. Deps: Crystal Vault. Infra: Module 2. Why now: closes #8 continuity gap.

- **M5 — Specializations→prompt-injection editor preview.** Show how `UX/Prototyping/Design Systems`
  would shape the system prompt; let user toggle injection. User value: transparency + control.
  Reuse: `AgentIdentityEditor`. Effort: M. Risk: low. Deps: Q2. Infra: `AgentIdentityEditor.tsx`.
  Why now: currently over-promises (#2).

## 3 BIG IDEAS (architectural, still reuse shared infra)

- **B1 — "Design Critic" realized agent (no new agent).** Combine Q1+Q2+Q4+M1+M4 so `agent-designer`
  becomes the system's UX conscience across debate, conversation, and crystals. User value: a real
  design authority, not a skin. Reuse: ALL existing (persona, lens, journal, crystal, invocation).
  Effort: L. Risk: med. Deps: Q1,Q2,Q4,M1,M4. Infra: shared. Why now: foundation is ready.

- **B2 — Design review workflow (Builder + Director + Invocation).** A Builder template that deploys
  a UI, then auto-invokes `agent-designer` (via Invocation, `mode:chat`) to critique and write
  findings to a Crystal. User value: automated design QA in the build pipeline. Reuse: Builder
  (Module 7) + Invocation (Phase 21) + Crystal (Module 2). Effort: L. Risk: med. Deps: B1, Builder.
  Infra: Modules 2/7 + Phase 21. Why now: pipeline exists end-to-end.

- **B3 — Design decision ledger (revive `cognitive:decision:made`).** Make designer emit design
  decisions; render a Design Decision timeline in its detail panel. User value: auditable design
  rationale. Reuse: `CognitiveDecisionSchema` (`event-registry.ts:776`), `AgentDetailPanel`. Effort: L.
  Risk: med (revive dead consumer). Deps: none. Infra: cognitive events. Why now: event exists but
  is dead (#8).
