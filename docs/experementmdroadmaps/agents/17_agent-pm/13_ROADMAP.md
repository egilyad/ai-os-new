# 13 — ROADMAP (Plan A: incremental, data/UI over existing seams)

> Phase0→Phase4. Each: task, existing code/service, proposed UI, deps, effort, risk, expected result. Tags **VERIFIED** / **OPINION**.

## Phase 0 — Truth & visibility (1–2 days)

- **P0.1 Correct the model-pin documentation + add failover note.** Existing: `agent-profiles.ts:189`, `topology-defaults.ts:104-105`, `agent-service.ts:351-353`. UI: none (doc + maybe a tooltip "pinned · no auto-failover"). Deps: none. Effort: S. Risk: low. Result: accurate mental model; user knows explicit-model trade-off.
- **P0.2 Surface "Management" audit badge.** Existing: `prompt-audit-service.ts:18,192`. UI: `AgentCard`/`AgentDetailPanel` badge. Deps: none. Effort: S. Risk: low. Result: explains PM audit inclusion.

## Phase 1 — Make specializations live (3–5 days)

- **P1.1 Specialization-aware persona + hints.** Existing: `persona-selector.ts:251-308`, `agent-identity.ts:135`, `phase21-invocation.ts:47-57`. UI: `RoomPanel` expertise hint + PM→`diplomat`/`neutral` bias. Deps: none. Effort: S–M. Risk: low. Result: PM behaves like a PM (flag P1 fixed).
- **P1.2 PM quick-action chips.** Existing: `RoomPanel` + `phase21-invocation.ts:89-108`. UI: _Plan/Risk/Retro_ chips. Deps: P1.1. Effort: S. Risk: low. Result: one-click PM jobs.

## Phase 2 — Facilitation & artifacts (1–2 weeks)

- **P2.1 Curated "PM Facilitation" Director scenario.** Existing: `ConversationDirectorService`+`HybridPolicy`+`ChatExecutor`, `ScenarioRepository.create`. UI: template in `ScenarioEditor`/`RoomPanel`. Deps: P1. Effort: M. Risk: low. Result: real facilitator role (flags 04/05).
- **P2.2 Structured plan → Crystal/Forum.** Existing: `CrystalVault.propose/crystallize`, `ForumService`, `conversation:turn:complete`. UI: "Save plan as Crystal / Post to Forum" on PM turns. Deps: P2.1. Effort: M. Risk: med (parse). Result: plans become artifacts.
- **P2.3 Debate→journal bridge.** Existing: `agent-journal-service.ts:174`. UI: PM debate turns appear in history. Deps: none. Effort: S. Risk: low. Result: closes P4.

## Phase 3 — Continuity & framing (1–2 weeks)

- **P3.1 `FACILITATE`/`SUMMARIZE` objective types.** Existing: `contracts/conversation/turn.ts` (`TurnProposal`). UI: `TurnsField` options. Deps: none. Effort: M. Risk: med (contract change). Result: declarative PM roles.
- **P3.2 Recall last plan.** Existing: `AgentJournalService.listByAgent/search`, `CrystalRepository`. UI: "Open last plan" on `AgentCard`. Deps: P2.2. Effort: M. Risk: low. Result: cross-session continuity.
- **P3.3 Assign PM lenses.** Existing: `normalizeAgentIdentity` lensIds (`topology-defaults.ts:106`), `lens-engine`. UI: identity shows lenses. Deps: none. Effort: S. Risk: low. Result: consistent synthesis framing.

## Phase 4 — Decision ledger & conductor (2–4 weeks)

- **P4.1 Revive `cognitive:decision:made` for PM.** Existing: `event-registry.ts:776` (event exists, dead-at-consumer), `AgentService`/`DirectorStore` consumer pattern. UI: Decisions panel / DirectorStore badge. Deps: P3.1. Effort: L. Risk: med. Result: auditable PM decisions.
- **P4.2 "Program Manager" template library.** Existing: all of the above + 25 agents. UI: `RoomPanel` "Run a program" flow. Deps: P2.1,P3.1. Effort: L. Risk: med. Result: `agent-pm` as default coordinator (see `12`).

## Expected end state

`agent-pm` evolves from a cosmetic PM node into a **functional coordinator** using only verified existing seams — no new runtime, no new tables, no new events beyond what already exists.
