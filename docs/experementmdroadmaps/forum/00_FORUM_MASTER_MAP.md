# 00 — FORUM MASTER MAP

> Classification legend used in this research pack:
> **VERIFIED** = read directly in source; **INFERRED** = strongly implied, not directly read; **OPINION** = recommendation, final call left to human.
> All claims carry `file:line`. No source was modified; this is read-only research.

## 1. What the Forum IS (VERIFIED)

Agent Forum is an **async, persistent, threaded discussion space** where humans and agents post messages to topics, vote, and where a lightweight heuristic reports a consensus verdict. It is the "library/café" counterpart to synchronous `Debate` (contract comment `src/kernel/contracts/forum.ts:16-23`).

- **Backend**: `ForumService` (`src/kernel/services/forum/forum-service.ts:37`, 407 lines) implements `IForumService` (`src/kernel/contracts/forum.ts:24`, 9 methods).
- **Persistence**: `ForumRepository` (`src/kernel/dal/forum-repository.ts:21`) over 4 Dexie v17 tables (`src/kernel/services/dexie-schema.ts:101-104`): `forumTopics`, `forumPosts`, `forumVotes`, `forumSubs`.
- **Events**: exactly **3** `forum:*` events (`event-registry.ts:1392-1417`): `forum:topic:created`, `forum:post:added`, `forum:post:voted`. (See §3 — the brief's "4 events" is wrong.)
- **Bridges** (Phase 18, `phase18-forum.ts`): Debate verdict → case-study post (REAL, `:47-64`); Crystal formed → announcement (REAL, `:66-79`); Forum question → knowledge-generator trigger (REAL, `:82-114`). System author = agent id `system` (`:24`).
- **UI**: `src/components/ForumPanel/` — 7 files, local React state only, **no dedicated store** (VERIFIED: `src/stores/` has no forum file; components call `forumService` directly).

## 2. Architecture layers (one-line each, VERIFIED)

UI (`ForumPanel` + 6 children) → calls `forumService` → `ForumService` → `ForumRepository` → Dexie v17 → EventBus (emits 3 events) → other modules (Debate/Crystal/Synthesis/Generator via bridges). No `Store` layer exists for Forum; UI re-fetches manually on every action (`ForumPanel.tsx:47-69`).

## 3. Top capabilities (what actually works, VERIFIED)

1. Create topic (+ optional opening post) — `forum-service.ts:60-91`
2. Post message (human; agent via bridges) with markdown/html rendering — `:93-147`
3. Vote up/down (idempotent, one per voter, aggregates to topic score) — `:149-193`
4. Subscribe (idempotent, no event) — `:195-207`
5. List topics with filter + pagination — `:209-221`
6. Get thread (with `sincePostId`, hides `removed` posts) — `:223-235`
7. Pin/unpin topic — `:237-243`
8. Moderate post warn/hide/remove — `:245-260`
9. Consensus verdict (open/consensus/contested) heuristic — `:262-308`
10. Cross-module feeds: debate case-studies, crystal announcements, question→generator (phase18)

## 4. Top gaps (VERIFIED / INFERRED)

- **G1 — `forumService` not exported from the instances barrel.** `ForumPanel.tsx:4` imports `forumService` from `../../kernel/instances`, but no `lazyService('forumService')` or any `export const forumService` exists anywhere in `src` (every other panel uses the `services-extras.ts` lazy pattern, e.g. `conversationDirector` at `services-extras.ts:173`). **VERIFIED** import + absence; **INFERRED** impact = ForumPanel is broken at runtime / `tsc` error on that import. Highest-priority finding.
- **G2 — Threading/replies are dead.** Contract claims `postMessage` is "threaded when `parentId` is set" (`contracts/forum.ts:27`) but the real signature has no `parentId` param (`forum-service.ts:93`); `parentId` is only mapped to/from storage (`:363,397`), never written. UI has no reply UI. **VERIFIED.**
- **G3 — Voting has no UI.** Backend fully supports votes; `TopicView.tsx:48` shows score but there is **no up/down button anywhere**. **VERIFIED.**
- **G4 — `SYNTHESIS_EXPORTED_TO_FORUM` is a dead one-way event.** Emitted by Synthesis (`synthesis-engine-service.ts:230`) but has zero consumers (grep: only definition + emit). Forum never ingests synthesis exports. **VERIFIED.**
- **G5 — Forum→Debate escalation is dead.** Contract comment promises escalation (`contracts/forum.ts:22`); `getConsensus` never emits; `forum:topic:escalated-to-debate` is never emitted (test asserts absence, `forum-service.test.ts:297-308`). **VERIFIED.**
- **G6 — No realtime / no store.** UI uses manual refresh + refetch (`ForumPanel.tsx:91-104, 47-69`); no `liveQuery`, no EventBus subscription in UI. **VERIFIED.**
- **G7 — No search, sort control, tag input/filter, category filter, or pagination controls** in UI though backend supports most filters (`forum-service.ts:209-221`, `forum-types.ts:90-98`). **VERIFIED.**

## 5. Top opportunities (OPINION)

- **O1 (P0):** Fix G1 — add `export const forumService = lazyService<IForumService>('forumService')` to `services-extras.ts` (mirror `conversationDirector`). Without this, the entire Forum UI is non-functional.
- **O2 (P1):** Add vote buttons + pin control + tag input to the UI (G3/G4-sized gaps; backend is ready).
- **O3 (P1):** Either implement reply threading (extend `postMessage` with `parentId`) or delete the misleading contract claim (G2).
- **O4 (P2):** Wire a Forum store + `liveQuery`/EventBus so the panel updates in realtime and survives agent-authored posts from bridges.
- **O5 (P2):** Decide the fate of dead bridges/escalation: either implement `forum:topic:escalated-to-debate` (invoke `debateService`) and consume `SYNTHESIS_EXPORTED_TO_FORUM`, or remove the unused event + contract comment to stop implying capabilities that don't exist.
- **O6 (P3):** Dedup the redundant nested `topic`/`post` objects in the Dexie records (see `03_BACKEND_AUDIT.md` §ROOT CAUSE B) — cheap correctness win.

## 6. How to read the rest of this pack

- `01_CURRENT_ARCHITECTURE.md` — full layer-by-layer reality map (what exists / used / unused / missing).
- `02_CAPABILITY_AUDIT.md` — the big capability matrix (24 capabilities × 6 columns).
- `03_BACKEND_AUDIT.md` — `ForumService`/`ForumRepository` defects grouped by **root cause**.
- `04_FRONTEND_AUDIT.md` — `ForumPanel` UX + the explicit "backend-exists→UI-missing" / "UI-exists→backend-missing" matrix.

## 7. Recommended direction (OPINION, final call to human)

The Forum backend is **structurally complete for a v1** (CRUD, vote, moderate, consensus, bridges) but is **currently unreachable from the UI** (G1) and **over-promises** (threading G2, escalation G5, synthesis bridge G4). The smallest high-value fix is **O1** (unblock the panel), followed by **O2/O3** (expose existing backend in the UI, stop the dead threading claim). Escalation + synthesis ingestion are genuine product features but should be **built deliberately**, not implied by dead code. Leave the final sequencing call to the human.
