# OPPORTUNITIES — concrete improvement directions

Each opportunity references the primary finding(s) that motivate it. RESEARCH-ONLY: no code written; directions are suggestions for a future implementation phase.

## OP-01 — Replace the `emitOnce` constant-key pattern with a "latest-wins" throttled publisher

- Motivated by: EB-01, EB-02, EB-17, FE-08.
- The current `emitOnce(key, payload, ttl)` dedups by `(event,key)` and DROPS everything after the first emit within `ttl`. With constant keys (`'all'`, `'global'`, `session.id`) the effect is "first wins", which silently starves consumers during rapid bursts (memory/skills/keys updates, debate round deltas). A `emitThrottled`/`emitLatest` that always delivers the most recent value (trailing-edge) would preserve liveness without spamming.
- Scope: `event-bus.ts` + the ~96 `emitOnce` call sites. Flag only.

## OP-02 — Provide a `SessionScopedStore` base to kill the unscoped-subscription class of bugs

- Motivated by: FE-03, FE-07, AR-04, EB-15.
- Multiple observer stores (`directorStore`, `invocationStore`, `keyStore`, `systemStatus`) subscribe globally and either ignore `sessionId` or filter ad hoc. A shared base that (a) registers handlers, (b) filters by an active-session set, and (c) unsubscribes on teardown would eliminate cross-session contamination and leak variants in one place.

## OP-03 — Dev-time "emit with no consumer" detector for the EventBus

- Motivated by: IN-06, IN-07, IN-08.
- Three emitted events (`KEY_COMPROMISED`, `ROLE_ASSIGNED`, `METRICS_ALERT_RESOLVED`, `KEY_COMPROMISE_SIGNAL`) have no consumer. A dev-only mode that logs `emit(X)` when zero listeners are registered would surface dead-event contracts immediately and prevent future drift. (Pairs with OP-11 to remove or wire them.)

## OP-04 — Unify the two key-compromise signals

- Motivated by: SEC-01, IN-06, IN-08.
- `compromiseKey()` emits `KEY_COMPROMISED` (unconsumed) while `COMPROMISE_SIGNAL` is the wired notification path. Pick one canonical signal and route internal quarantines through it, or subscribe an audit listener. Removes the asymmetric-wiring confusion.

## OP-05 — Reconcile the dual routing services

- Motivated by: EB-24.
- `RouterService` (live) and `SmartRoutingService` (panel) are disjoint; the bridge is a third service `RoutingPolicyService`. Either make `RouterService` the single authority and have the panel edit its rules, or formally declare `SmartRoutingService` deprecated and remove its UI to avoid a "config that does nothing" trap (same failure mode as SEC-03).

## OP-06 — Add lifecycle unit + integration tests for ConversationDirector

- Motivated by: EB-05, EB-06, EB-07, EB-09, EB-10, EB-11, EB-13, TE-02.
- The abort→error (H1), first-turn-abort-not-cancelled (H2), resume-after-abort→completed (H3) bugs would all have been caught by assertions on `service.getState()` + `useDirectorStore`. Today only 2 E2E tests exist. A focused lifecycle suite is the highest-leverage test investment.

## OP-07 — Unit-test `debate-llm-caller`

- Motivated by: EB-16, TE-01.
- A 1168-line function classifying errors via string matching with ZERO tests is the single largest untested risk in the codebase. Extract the classifier (timeout/payment/abort) into a pure, tested function; the G-01/G-02/G-03 fixes show how brittle the current classification is.

## OP-08 — Centralize `StatusBadge` into the design system

- Motivated by: FE-04.
- Three incompatible `StatusBadge` implementations exist; `Common/index.ts` exports only `ErrorBoundary`; ~9.7k inline style blocks. Promote one `Badge` to `Common`, export it, and route panels through it. Reduces duplicated bug surface and visual drift.

## OP-09 — Enforce route-id uniqueness at registry boot

- Motivated by: FE-01, FE-05.
- The `builder` duplicate arose because `route-registry-core.ts` + `route-registry-content.ts` both declare `id:'builder'` with no guard. A boot-time assertion that all nav ids are unique would have caught FE-01 and prevents recurrence.

## OP-10 — Persist ConversationDirector checkpoints to Dexie

- Motivated by: IN-04.
- Director checkpoints are shown in RunTab but live only in `this.session` (in-memory). Storing them in a Dexie table makes runs resumable, auditable, and survive reload — consistent with how scenarios/invocations are persisted.

## OP-11 — Build or delete the Forum→Debate escalation

- Motivated by: IN-01.
- The escalation is advertised (negative test asserts its absence) but never implemented — no method, no UI, no emitter. Either implement `forum:topic:escalated-to-debate` end-to-end (forum topic → new debate), or remove the claim and the negative test so the contract stops implying a capability that does not exist.

## OP-12 — Store `webhookSecret` in the encrypted vault, not plaintext `localStorage`

- Motivated by: SEC-02, SEC-04.
- The `SecurityService` already encrypts API keys at rest; route the webhook secret through it instead of `localStorage.setItem(..., secret)`. Removes the XSS-exfil vector.

## OP-13 — Harden ConversationCore execution lifecycle

- Motivated by: EB-05..EB-14.
- Add `try/catch` around `run()`/`resume()` that preserves `aborted`; abort/cancel the in-flight turn's `AbortController` (not just the next proposal); clear the permanent `aborted` flag on a fresh `loadScenario`; and stop emitting redundant `CONVERSATION_COMPLETED`. These are targeted, low-risk fixes to confirmed bugs.

## OP-14 — Make Invocation `executing` pre-hoc and failure-safe

- Motivated by: EB-19, EB-20, EB-21.
- Set `executing` BEFORE `execution.start()` and wrap `start()` in try/catch that transitions the aggregate to a failed/errored state (not orphaned `accepted`); for debate mode, await the actual debate completion (or track its session) before `INVOCATION_DONE` so the lifecycle is truthful.

---

_Next: 09_DOCUMENTATION_FINDINGS.md and 10_CODE_HEALTH.md to complete the deliverable set._
