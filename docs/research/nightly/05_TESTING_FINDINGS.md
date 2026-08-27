# TESTING FINDINGS — Nightly Research

> Research-only. Dangerous zones with weak or missing tests.

## TE-01 (CONFIRMED, High) — `debate-llm-caller.ts` (1168 lines, most fragile error classification) has ZERO unit tests

- Category: Testing / Reliability
- Location: `debate-llm-caller.ts`; no `debate-llm-caller.test.ts` in `debate-runtime/` (verified — tests exist for budget/consensus/evaluator/orchestrator/policy/memory/shadow only).
- Evidence: error classification is by string-matching (`errStr.includes('rate_limit_exceeded')`, `abortReason.includes('TimedOut')`, regex `/[^\d]413[^\d]/`, EB-16). No test covers any branch.
- Why it matters: this module decides retry/timeout/payment/auth — the exact failure class that required three production fixes (AGENTS.md G-01..G-03). A provider message change can silently mis-classify (timeout→no-retry abort→agent loses turn) with no test to catch it.
- Confidence: High.
- Related: EB-16.

## TE-02 (LIKELY, Medium) — Director lifecycle failure modes are not asserted

- Category: Testing / Coverage
- Location: `conversation-director-service.test.ts`, `directorControls.test.ts` (per AGENTS.md B5.4b, 7 tests covering pause/resume/skip/override/abort).
- Evidence: shipped code contains EB-05 (abort→status `error` not `aborted`), EB-07 (resume-after-abort→`completed`), EB-09 (empty-sessionId pause event lost). These are reachable via the existing `directorControls` harness, yet the bugs exist in `main`, implying the tests assert status loosely (e.g. only "reaches 2 turns") without checking the post-abort/`resume` status value.
- Why it matters: the lifecycle controls are the highest-value Director surface, yet their failure semantics are unverified. A test asserting `getState().status === 'aborted'` after an in-flight abort (and after `resume()` on an aborted session) would catch EB-05/EB-07.
- Confidence: Medium-Likely.
- Related: EB-05, EB-07, EB-09.

## TE-03 (CONFIRMED, Medium) — Only 2 app-wide integration/E2E tests; most cross-module flows untested

- Category: Testing / Integration
- Location: `room-invocation-e2e.integration.test.tsx` (3 tests), `director-e2e.integration.test.tsx` (2 tests) per AGENTS.md B6.1. No integration test for Forum↔Debate, Forum↔Generator, Invocation(debate mode), or cognitive-module flows.
- Evidence: the phantom forum→debate escalation (IN-01), unused forum votePost (IN-02), and premature `INVOCATION_DONE` for debate (EB-21) have no integration coverage that would have flagged them.
- Why it matters: cross-module contracts are exactly where silent breakage hides (phantom integrations, premature/delayed lifecycle events). Two E2E tests is far too thin for 7 cognitive modules + 4 execution engines.
- Confidence: High.
- Related: IN-01, IN-02, EB-21.

## TE-04 (CONFIRMED, Medium) — Cognitive modules + key panels lack component tests

- Category: Testing / Frontend
- Location: `LensesPanel/`, `CrystalVaultPanel/`, `JunctionPanel/`, `SynthesisPanel/`, `KnowledgeGenPanel/`, `ForumPanel/`, `BuilderPanel/`, `DebatePanel/DebateArena` — no `.test.tsx` per AGENTS.md ("cognitive modules 1–5 + ForumPanel + DebateArena have no component tests").
- Evidence: AGENTS.md Current Session lists rich backend suites (11-17 tests each) but no UI component tests for these panels.
- Why it matters: UI regressions (e.g. FE-01 duplicate route, FE-04 StatusBadge divergence) ship undetected; the frontend is the user-facing surface.
- Confidence: High (per AGENTS.md; spot-check: ForumPanel has no `.test.tsx` in the folder listing from Cycle 5).
- Related: FE-01, FE-04.

## TE-05 (LIKELY, Medium) — EventBus delivery semantics (drop / defer / reorder) untested

- Category: Testing / Core
- Location: `event-bus.ts` (EB-01..EB-04).
- Evidence: the bus has strict-mode drop (EB-01/02 strict), recursion-deferral reordering (EB-03), and `emitOnce` TTL (EB-01). No test verifies that a constant-key `emitOnce` drops updates, that strict mode blocks a malformed payload, or that deep-recursion emits reorder.
- Why it matters: the bus is the backbone; its lossy/reordering behaviors are exactly what caused prior event-loss incidents. Untested invariants drift.
- Confidence: Medium-Likely.
- Related: EB-01..EB-04.

---

_Next areas appended as research continues._
