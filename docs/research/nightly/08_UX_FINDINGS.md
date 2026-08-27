# UX FINDINGS — user-facing behavior/interface problems

RESEARCH-ONLY. UX lens on primary findings; each links to its source ID.

## UX-01 (CONFIRMED, Medium) — RoomPanel "Clear" clears only the live view; history silently returns on reload

- Category: UX / Expectation mismatch
- Location: `RoomPanel.tsx:242` (Clear → `clear()`) + `invocationStore.ts:236` (in-memory only) + `:206-235` (`loadHistory` re-reads Dexie).
- Evidence: Clear resets `invocations/order/log/feed` in memory; persisted `invocations` in Dexie are untouched, and `useEffect(loadHistory)` re-hydrates them on every mount (FE-06).
- UX impact: user clicks "Clear" expecting the list to vanish, navigates away/back, and the list reappears — feels broken / non-destructive control that behaves as view-only.
- Confidence: High. Related: FE-06, OQ-09.

## UX-02 (CONFIRMED, Medium) — RoomPanel live feed intermixes unrelated sessions

- Category: UX / Information correctness
- Location: `invocationStore.ts:160-197` (global `CONVERSATION_TURN_*` handlers) + `RoomPanel.tsx:334-357` (single `feed`).
- Evidence: every conversation turn (own invocation, a Director RunTab run, any concurrent session) appends to one unscoped feed with no session attribution (FE-07).
- UX impact: the "live output" panel becomes an unlabeled cross-session log; the user cannot tell which agent/session a line belongs to. With Director tab open, the feed is confusing.
- Confidence: High. Related: FE-07, AR-04, EB-15.

## UX-03 (CONFIRMED, Medium) — DebatePanel live view lags reality (lossy event stream)

- Category: UX / Freshness
- Location: `useDebatePanelSubscriptions.ts:82` (`debate:updated`) fed by producer `emitOnce(session.id, …)` (EB-17).
- Evidence: the producer dedups to first-emit-per-30s-per-session, so the panel can miss intermediate rounds/arguments during fast debates (FE-08).
- UX impact: round counter and argument list visibly lag the real debate; the "live" label over-promises. (Note: the panel correctly scopes by session id, so this is a freshness issue, not cross-session leakage.)
- Confidence: High. Related: FE-08, EB-17.

## UX-04 (CONFIRMED, High) — Duplicate "Builder" entry in the sidebar/navigation

- Category: UX / Navigation
- Location: `route-registry-content.ts:106` + `route-registry-core.ts:146` both `id:'builder'` (FE-01).
- Evidence: both merged in `route-registry.tsx:1-3` → two Builder nav items and a duplicate route.
- UX impact: users see two identical Builder links; clicking either may resolve to different component instances → confusing, and a classic symptom of registry split without uniqueness guard.
- Confidence: High. Related: FE-01, FE-05, OP-09.

## UX-05 (CONFIRMED, Medium) — Invocation status badges over-promise: "executing"/"done" don't reflect real work

- Category: UX / Status honesty
- Location: `invocation-engine-service.ts:39-122` (lifecycle) + `RoomPanel.tsx:312` (`room.status.${v.status}`).
- Evidence: `executing` is set synchronously AFTER `execution.start()` resolves; for debate mode `startDebate` returns immediately so `done` fires while the debate still runs (EB-19, EB-21, AR-06, DOC-03).
- UX impact: a user invoking a debate sees "Done" almost instantly while the actual debate is still in progress elsewhere; the status is not truthful. (For chat mode the await hides this; for debate mode it is glaring.)
- Confidence: High. Related: EB-19, EB-21, AR-06, DOC-03, OQ-02.

## UX-06 (CONFIRMED, Low) — No in-app alert when an API key is compromised

- Category: UX / Security visibility
- Location: `key-status.ts:174` (`KEY_COMPROMISED` emitted, unconsumed) vs `AlertLayer` (subscribes `KEY_UPDATED` only).
- Evidence: key quarantine happens inline (SEC-01) and `notify()` updates ProviderManager state, but no high-visibility alert/banner is raised for the operator (IN-06).
- UX impact: a compromised key is isolated silently; the operator only notices if they happen to be looking at the provider panel. No proactive warning.
- Confidence: High. Related: IN-06, SEC-01, OP-04.

---

_Next: residual source areas (Director RunTab, cognitive panels, cross-module handoffs) until STOP._
