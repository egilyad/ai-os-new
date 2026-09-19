# 11 — OPPORTUNITIES

> 5 QUICK WINS + 5 MEDIUM + 3 BIG IDEAS. Each: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.

## 5 QUICK WINS (S effort)

**Q1 — Activate specializations for routing/persona (flag P1).**

- Desc: Read `agent-pm.specializations` to (a) bias `PersonaSelector` toward `neutral`/`diplomat` for PM, (b) offer "Risk" tasks to `agent-pm`/`agent-risk` in RoomPanel expertise hints.
- User value: PM finally behaves like a PM, not a generic node.
- Reuse: `persona-selector.ts:251-308`, `resolveAgentIdentity.specializations` (`agent-identity.ts:135`), `AgentResolverDirectory` (`phase21-invocation.ts:47-57`).
- Effort: S. Risk: low (soft bias only). Deps: none. Infra: existing resolver. Why now: P1 verified, zero new tables/events.

**Q2 — Surface "Management" audit badge (flag P5).**

- Desc: Show "Audited · Management" on `AgentCard`/`AgentDetailPanel` for group members.
- User value: explains why tool-less PM is audited.
- Reuse: `prompt-audit-service.ts:18,192`; `AgentCard.tsx`.
- Effort: S. Risk: low. Deps: none. Infra: existing group map. Why now: cheap trust/clarity win.

**Q3 — PM quick-action chips in RoomPanel (flag 09-1).**

- Desc: _Plan / Risk assess / Retro_ chips pre-fill Task + Mode=Scenario.
- User value: one click to the PM's real job.
- Reuse: `RoomPanel` picker (`AGENTS.md` Step 6 rework), `phase21-invocation.ts:89-108`.
- Effort: S. Risk: low. Deps: none. Infra: existing invocation. Why now: high UX payoff, no backend.

**Q4 — Debate→journal bridge for PM (flag P4).**

- Desc: `AgentJournalService` also subscribe to `debate:argument` (it already does `debate:runtime:agent:error`, `agent-journal-service.ts:174`).
- User value: PM debate turns become recallable/continuous.
- Reuse: `agent-journal-service.ts:174-190`.
- Effort: S. Risk: low (extra subscription). Deps: none. Infra: existing journal. Why now: closes observability gap.

**Q5 — Assign PM lenses via config (flag P7).**

- Desc: set `lensIds:['meta-consensus','meta-uncertainty']` on `agent-pm` profile (or `normalizeAgentIdentity` default for `baseRole==='Project Manager'`).
- User value: PM turns framed through synthesis lenses consistently.
- Reuse: `normalizeAgentIdentity` already copies `lensIds` (`topology-defaults.ts:106`); `agent-identity.ts:116-124` resolves names.
- Effort: S. Risk: low. Deps: none. Infra: `lens-engine`. Why now: config-only, no code.

## 5 MEDIUM (M effort)

**M1 — Curated "PM Facilitation" Director scenario (flags 04/05).**

- Desc: one-click scenario where `agent-pm` opens agenda → runs rounds → consensus/risk summary; ships as a template in `ScenarioEditor`/`RoomPanel`.
- User value: turns `agent-pm` into a real facilitator.
- Reuse: `ConversationDirectorService`+`HybridPolicy`+`ChatExecutionEngine`+`ChatExecutor` (AGENTS.md B3–B6.2), `ScenarioRepository.create`.
- Effort: M. Risk: low. Deps: none. Infra: Director already generic. Why now: all seams verified, just a template.

**M2 — Structured plan output → Crystal/Forum.**

- Desc: after a PM plan turn, offer "Save as Crystal" / "Post to Forum" (parse plan text → crystal/forum post).
- User value: plans become queryable artifacts, not chat vapor.
- Reuse: `CrystalVault.propose`/`crystallize` (Module 2), `ForumService` (Module 6), `conversation:turn:complete` event.
- Effort: M. Risk: med (parsing quality). Deps: M1. Infra: existing modules. Why now: gives PM output permanence.

**M3 — Add `FACILITATE`/`SUMMARIZE` objective types.**

- Desc: extend `TurnProposal.objective.type` enum so PM role is declarative, not prompt-only.
- User value: scenarios express PM intent precisely; enables policy/analytics.
- Reuse: `contracts/conversation/turn.ts` (`TurnProposal`), B5.3 editor.
- Effort: M. Risk: med (contract change → downstream switch coverage). Deps: none. Infra: ConversationCore. Why now: unlocks declarative PM roles.

**M4 — PM "recall last plan" context injection.**

- Desc: query `agent-journal`/`crystals` by `agentId:'agent-pm'` + plan keywords, inject as scenario context.
- User value: continuity across sessions.
- Reuse: `AgentJournalService.listByAgent`/`search` (`agent-journal-service.ts:253,262`), `CrystalRepository`.
- Effort: M. Risk: low. Deps: M2 (artifact existence). Infra: existing stores. Why now: continuity is the missing PM superpower.

**M5 — Expertise-aware RoomPanel hints.**

- Desc: when a human types a planning/risk task, suggest `agent-pm` (+`agent-risk`) as matches using `specializations`.
- User value: discoverability of the right agent.
- Reuse: `AgentResolverDirectory.specializations` (`phase21-invocation.ts:47-57`), `RoomPanel`.
- Effort: M. Risk: low. Deps: Q1. Infra: invocation. Why now: pairs with Q1.

## 3 BIG IDEAS (L effort)

**B1 — "Program Manager" orchestration layer (realized, no new runtime).**

- Desc: a Director scenario _template library_ where `agent-pm` is the default facilitator and auto-assembles participants (architect for tech, risk for risk, po for scope) from a natural-language goal. Pure composition of existing agents + Director.
- User value: "run a program" not "configure a debate."
- Reuse: `ConversationDirectorService`, `ScenarioRepository`, `HybridPolicy`, all 25 agents.
- Effort: L. Risk: med (orchestration quality). Deps: M1,M3. Infra: Director + scenario store. Why now: the 7 cognitive modules + Director are done; PM is the natural conductor.

**B2 — PM decision ledger (revive `cognitive:decision:made`).**

- Desc: when `agent-pm` emits a plan/risk decision, emit `cognitive:decision:made` with `{agentId, decision, rationale}` and build a Decisions panel + DirectorStore consumer.
- User value: auditable PM decisions across sessions.
- Reuse: `event-registry.ts:776` (event exists, dead-at-consumer), `AgentService`/`DirectorStore` consumer pattern.
- Effort: L. Risk: med (event currently unused; need real consumer). Deps: M3. Infra: cognitive event stream. Why now: the event already exists — only a producer+consumer missing.

**B3 — Agent-pm as default human-facing coordinator (see `12_FUTURE_AGENT_CONCEPT.md`).**

- Desc: make `agent-pm` the suggested default for any planning/roadmap/risk/retro human mention in RoomPanel, with a curated persona variant + facilitation scenario.
- User value: one obvious "ask the PM" entry point.
- Reuse: Q1,Q3,M1,M5 + `phase21-invocation.ts` policy.
- Effort: L. Risk: low. Deps: Q1,M1. Infra: invocation + Director. Why now: low-risk, high-clarity win.
