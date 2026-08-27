# 11_OPPORTUNITIES — Quick wins, medium, big ideas for `agent-creative`

> Each item: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies,
> Existing infra, Why now.

## 5 QUICK WINS (days)

**Q1 — Add `creative_visionary` + `brand_strategist` persona variants**

- Desc: Append two `PersonaVariant`s to `VARIANTS` in `persona-selector.ts:3-241` with
  creative trigger keywords (brand, story, narrative, campaign, tagline, concept…).
- User value: debates finally use the agent's real strength; brand topics get a creative voice.
- Reuse: `PersonaSelector` interface + `selectVariant` already support it.
- Effort: S (1 file, additive).
- Risk: Low (no behavior change for non-creative topics).
- Deps: none. Infra: `persona-selector.ts`. Why now: fixes P1 directly.

**Q2 — Surface assigned persona on agent chip**

- Desc: Render `PersonaVariant.name` next to `agent-creative` in debate UI using the value
  `PersonaSelector.selectForTopic` already returns (`persona-selector.ts:300-308`).
- User value: transparency; closes identity/behavior drift (P5).
- Reuse: existing return value; `AgentIdentityChip`.
- Effort: S. Risk: Low. Deps: Q1 optional. Infra: `DebateRuntimePanel/AgentControlPanel`.
- Why now: trivial honesty fix.

**Q3 — Auto-tag journal entries with specializations**

- Desc: In `agent-journal-service.ts:206-227` `record()`, push `agent-creative`'s
  `specializations` into `JournalEntry.tags`.
- User value: `listByTag('Brand')` becomes a real creative search (`agent-journal-service.ts:257`).
- Reuse: `listByTag` already exists. Effort: S. Risk: Low. Deps: none.
- Infra: `agent-journal-service.ts`. Why now: zero new storage.

**Q4 — "Invoke for…" quick actions on AgentCard**

- Desc: Buttons on `AgentCard` that pre-fill RoomPanel with `target.agentId='agent-creative'`
  - a creative task template.
- User value: discoverability — users learn what the agent is for.
- Reuse: `invocationEngine.invoke` (`phase21-invocation.ts`), RoomPanel picker.
- Effort: S-M. Risk: Low. Deps: none. Infra: `AgentCard.tsx`, `RoomPanel`.
- Why now: capability exists but is hidden.

**Q5 — "Creative Council" debate preset**

- Desc: A saved debate preset pre-selecting `agent-creative`, `agent-designer`,
  `agent-content`, `agent-ux` (`prompt-audit-service.ts:21-24`).
- User value: one-click brand/UX brainstorm with the right panel.
- Reuse: debate participant selection; audit grouping already defines the set.
- Effort: S. Risk: Low. Deps: none. Infra: debate config UI. Why now: grouping already known.

## 5 MEDIUM (1–3 weeks)

**M1 — Specialization-aware persona bias**

- Desc: Extend `selectVariant` (`persona-selector.ts:251-290`) to accept the agent's
  `specializations` and boost creative variants for Creative-group agents.
- User value: `agent-creative` reliably sounds creative when appropriate.
- Reuse: `resolveAgentIdentity` already returns specializations (`agent-identity.ts:135`).
- Effort: M. Risk: Medium (must not break other agents' persona choice). Deps: Q1.
- Infra: `persona-selector.ts`, `debate-orchestrator.ts`. Why now: P1 root-cause fix.

**M2 — Add a `lens:brand-voice` / `lens:ideation` lens**

- Desc: New builtin lens(es) in `lens-library.ts` (mirror existing `lens:optimistic`).
- User value: creative agent gets a consistent cognitive framing; reusable by Synthesis.
- Reuse: `LENS_LIBRARY` array + `Lens` type; `resolveAgentIdentity` reads `lensIds`.
- Effort: M. Risk: Low. Deps: none. Infra: `lens-library.ts`, `agent-identity.ts`.
- Why now: P2; fills the only missing category.

**M3 — Brand-voice Crystal continuity**

- Desc: Route strong creative brand definitions through `crystalVault.propose`
  (existing `crystal-debate-bridge`); future sessions load as context.
- User value: genuine cross-session brand consistency (fixes P4).
- Reuse: crystal vault + bridge, already event-driven.
- Effort: M. Risk: Medium (crystallization threshold tuning). Deps: none.
- Infra: `crystal-vault-service.ts`, `crystal-debate-bridge.ts`. Why now: memory gap.

**M4 — Agent-scoped creative memory view**

- Desc: Read-only tab joining journal + crystals + forum by `agentId`.
- User value: "creative lineage" — draft → review → crystal.
- Reuse: `AgentJournalService.listByAgent`, crystal/forum stores, `AuthorBadge`.
- Effort: M. Risk: Low. Deps: Q3. Infra: `AgentDetailPanel`, stores. Why now: P4/P6.

**M5 — Router specialization hints**

- Desc: Let the Mission Router consider `specializations` when fanning out
  (`topology-defaults.ts:478` edges are static; router is LLM-based). Add a hint that
  brand/narrative tasks prefer Creative-group agents.
- User value: creative tasks actually reach `agent-creative` automatically.
- Reuse: `routerService` + `resolveAgentIdentity`. Effort: M. Risk: Medium (routing regressions).
- Deps: none. Infra: `chat-executor.ts`, router. Why now: P3 wasted signal.

## 3 BIG IDEAS (months)

**B1 — "Creative Director" meta-agent**

- Desc: A higher-level orchestration that uses `agent-creative` + critic + content + ux in a
  divergence→convergence loop (Director `ConversationScenario` already supports multi-turn).
- User value: end-to-end campaign/brand generation, not single replies.
- Reuse: `ConversationDirectorService`, `HybridPolicy`, `ScenarioEditor` (B5.3).
- Effort: L. Risk: Medium. Deps: M1,M3. Infra: Director + Creative Council.
- Why now: all primitives exist; only composition missing.

**B2 — Brand-memory knowledge graph**

- Desc: Structured per-brand creative memory (crystals + journal tags + forum) queryable by
  `agent-creative` before drafting.
- User value: the agent "remembers" every brand it has touched.
- Reuse: Crystal vault, Junction engine, journal tags (Q3).
- Effort: L. Risk: Medium. Deps: M3,M4. Infra: crystal/junction stores.
- Why now: continuity is the biggest creative-agent weakness (P4).

**B3 — Lens-driven creative critique loop**

- Desc: Apply `lens:brand-voice` + `lens:critical` to `agent-creative` outputs automatically,
  producing self-critiqued drafts.
- User value: higher-quality, on-brand first drafts.
- Reuse: Lens engine (`lens-engine-service`), existing transform kinds.
- Effort: L. Risk: Low-Medium. Deps: M2. Infra: `lens-engine`. Why now: P2 + quality.
