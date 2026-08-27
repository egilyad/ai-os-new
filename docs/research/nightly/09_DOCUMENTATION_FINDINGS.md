# DOCUMENTATION FINDINGS — doc/contract vs reality mismatches

RESEARCH-ONLY. Each item links to a primary finding.

## DOC-01 (CONFIRMED, Medium) — Event contract surface advertises events that have no consumer

- Category: Documentation / Contract
- Location: `kernel/events/event-registry.ts` (declares `KEY_COMPROMISED`, `COMPROMISE_SIGNAL`, `ROLE_ASSIGNED`, `ROLE_UNASSIGNED`, `METRICS_ALERT_RESOLVED`, `KEY_COMPROMISE_SIGNAL`, and others as part of the public event surface).
- Evidence: per Cycles 10–11, `KEY_COMPROMISED` (IN-06), `ROLE_ASSIGNED`/`METRICS_ALERT_RESOLVED` (IN-07), and `KEY_COMPROMISE_SIGNAL` (IN-08) have no subscriber anywhere in `src`. The registry presents them as first-class system events, implying observers that do not exist.
- Why it matters: a reader of the contract (or a future integrator) will assume these signals drive UI/alerts/telemetry and build against a void. The "event-driven" architecture is only partially realized; the contract over-promises.
- Confidence: High.
- Related: IN-06, IN-07, IN-08, OP-03.

## DOC-02 (CONFIRMED, Medium) — Prior research audits are stale relative to the G-01..G-03 runtime-hardening fixes

- Category: Documentation
- Location: `docs/research/BACKEND_IMPROVEMENT_REVIEW.md` / `FRONTEND_IMPROVEMENT_REVIEW.md` vs `AGENTS.md` "Runtime fixes (from console-log triage)".
- Evidence: `AGENTS.md` records fixes G-01 (HTTP timeout 60s→120s for nvidia/openrouter/cloudflare/groq), G-02 (SSE idle reclassified as timeout), G-03 (sse-parser abort settles stream), and the governor +402 + gemini-retire fixes. These directly address timeout/turn-loss hypotheses the prior audits raised (e.g., B-19), yet the audit reports were never updated. NOTE: the G-01 fix itself missed two adapters (`openai-compatible` + `gemini`) — that gap is EB-22, still open.
- Why it matters: an engineer reading the old audits may "re-fix" already-fixed issues or mis-rank priorities. The audit corpus needs a reconciliation pass marking which hypotheses are now mitigated (and which, like EB-22, are only partially mitigated).
- Confidence: High.
- Related: EB-22, AR-*, the verified-findings file (13_VERIFIED_FINDINGS.md).

## DOC-03 (CONFIRMED, Medium) — AGENTS.md documents the Invocation lifecycle as realized, but `executing` is not faithfully implemented

- Category: Documentation / Behavior
- Location: `AGENTS.md` "Step 4 Engine" + `docs/road/INVOCATION_ENGINE.md` §9 (lifecycle `requested→accepted→executing→done`).
- Evidence: the docs state the engine answers "who/why/context/constraints" and that `executing` = "execution started + session ref". In code (`invocation-engine-service.ts:39-122`), `executing` is set synchronously AFTER `execution.start()` resolves, and for debate mode `startDebate` returns immediately so `INVOCATION_DONE` fires while the debate is still running (EB-19, EB-21, AR-06). The documented lifecycle is aspirational, not behavioral.
- Why it matters: the canonical design doc describes a property the implementation does not yet guarantee; future work keyed off the doc will assume stronger guarantees than exist.
- Confidence: High.
- Related: EB-19, EB-21, AR-06, OQ-02, OP-14.

## DOC-04 (CONFIRMED, Low) — Forum→Debate escalation is implied by the contract/negative test but unimplemented

- Category: Documentation / Contract
- Location: `contracts/forum.ts` / `event-registry.ts` (`forum:topic:escalated-to-debate` referenced in a NEGATIVE test) vs `ForumPanel/**` (no escalation UI/code, Cycle 13 grep: zero matches for `escalat|debate`).
- Evidence: a test asserts the escalation does NOT exist; no producer or UI exists. The capability is named but absent.
- Why it matters: the contract/test surface hints at a bridge that was never built, misleading maintainers about actual Forum↔Debate integration (only debate→forum and forum→generator are real — IN-01).
- Confidence: High.
- Related: IN-01, OP-11.

---

_Next: 10_CODE_HEALTH.md._
