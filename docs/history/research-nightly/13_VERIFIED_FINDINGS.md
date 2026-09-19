# VERIFIED FINDINGS — re-validation of prior audit hypotheses

This file maps the hypothesis bank from the PRIOR audit reports
(`docs/research/BACKEND_IMPROVEMENT_REVIEW.md`, `docs/research/FRONTEND_IMPROVEMENT_REVIEW.md`)
against the deep source verification performed in Cycles 2–11 of this nightly session.
Status legend: **CONFIRMED** (claim holds), **CONFIRMED-WITH-NUANCE** (holds but severity/mechanism differs),
**REJECTED** (claim does not hold after verification).

## Backend hypotheses

### B-01 — ConversationDirector `abort()` mislabeled as `error` ✅ CONFIRMED

- Prior claim: aborting a run surfaces as `error` instead of `aborted`.
- Verified: `conversation-director-service.ts:168-170` `run()` catch overwrites `this.phase='error'` even when the in-flight turn was aborted. Recorded as **EB-05** (High).

### B-02 / B-03 — EventBus is lossy (`emitOnce` drops updates) ✅ CONFIRMED

- Prior claim: dedup cache drops state updates.
- Verified: constant-key `emitOnce` (e.g. `MEMORY_UPDATED` key `'all'`, `KEY_UPDATED` key `'global'`) drops all-but-first per 30s window. Recorded as **EB-01** (High). Companion issues: LRU eviction wrong (**EB-02**, Med), recursion deferral reorders events (**EB-03**, Med), strict-mode drop (minor). The prior audit's concern is fully substantiated and broader than claimed.

### B-11 — `debate-llm-caller` is a god-function with fragile error handling ✅ CONFIRMED

- Prior claim: 1168-line caller, string-matching error classification, no unit tests.
- Verified: **EB-16** (High) — `debate-llm-caller.ts` is 1168 lines, classifies `AbortError`/timeout via `includes(...)` + regex on `413`/`402`, and there is NO `debate-llm-caller.test.ts`. Confirmed exactly as claimed (this also matches the AGENTS.md runtime-hardening notes about no-retry AbortErrors).

### B-17 / B-18 — Invocation Engine lifecycle is "fake" (executing-after-done, orphaned accepted) ✅ CONFIRMED

- Prior claim: `executing` is set after completion; failures leave aggregate in `accepted`.
- Verified: **EB-19** (executing set synchronously post-`start()`), **EB-20** (no try/catch → orphaned `accepted` on failure), **EB-21** (premature `done` for debate mode because `startDebate` returns immediately). All CONFIRMED against `invocation-engine-service.ts:39-122` + `phase21-invocation.ts`.

### B-19 — G-01 60s→120s timeout fix missed some adapters ✅ CONFIRMED

- Prior claim: some LLM adapters still build `LLMHttpClient` with default 60s.
- Verified: **EB-22** (High) — `OpenAiCompatibleAdapter` + `CerebrasAdapter` (extends it) + `GeminiAdapter` build the http client with NO timeout arg → default 60000, while nvidia/openrouter/cloudflare/groq correctly pass 120000. Confirmed exactly.

### B-20 — `CacheDecorator` key lacks agent/session identity ✅ CONFIRMED-WITH-NUANCE

- Prior claim: cache key can cross-contaminate between agents/sessions.
- Verified: **EB-23** (Med) — key = `apiKeyHash + JSON(messages,model,options)`. No agentId/sessionId. Contamination only on byte-identical prompts (low real risk), so severity is LOWER than the original claim implied. Mechanism confirmed; impact downgraded.

### B-21 — Two disjoint routing services (`RouterService` vs `SmartRoutingService`) ✅ CONFIRMED (Likely)

- Prior claim: live routing and the SmartRouting panel use separate, disconnected services.
- Verified: **EB-24** (Med, Likely) — `provider-router.ts` (live) and `smart-routing-service.ts` (panel) do not reference each other; bridge is a third service `RoutingPolicyService`. Confirmed; marked Likely because the exact runtime effect on live routing was not exhaustively traced (no consumer test found for SmartRouting rules).

## Frontend hypotheses

### FA-01 — Duplicate `builder` nav id in route registry ✅ CONFIRMED

- Prior claim: `builder` route declared twice → duplicate sidebar + route.
- Verified: **FE-01** (High) — `route-registry-content.ts:106` AND `route-registry-core.ts:146` both declare `id:'builder'`, merged in `route-registry.tsx:1-3`. Confirmed.

### FM-02 — Forum ↔ Debate escalation is broken ✅ CONFIRMED (more precisely: never implemented)

- Prior claim: forum→debate escalation does not work.
- Verified: **IN-01** (High) — there is NO forum method, NO UI, and NO emitter for `forum:topic:escalated-to-debate`; only a NEGATIVE test asserts its absence. The integration was never built (phantom), not merely broken. Phase18 wires debate→forum and forum→generator, but not forum→debate. Confirmed, with the sharper characterization that it is absent rather than malfunctioning.

### FM (votePost / subscribe / pin no UI) ✅ CONFIRMED

- Prior claim: backend forum capabilities have no UI.
- Verified: **IN-02** (`votePost`), **IN-03** (`subscribe`/`pinTopic`) — implemented + tested in `forum-service.ts` but no corresponding UI control. Confirmed.

## Claims REJECTED / REFINED this session

- **IN-06 (prior framing "silent security blind spot", High) → REJECTED as High, RECLASSIFIED Medium.** The original concern (compromised key not handled) does NOT hold: `compromiseKey()` quarantines the key inline (`key-status.ts:162-181`) and `notify()` updates UI. The orphaned `KEY_COMPROMISED` event is a dead telemetry signal (observability gap), not a protection failure. See SEC-01.
- **EB-23 contamination severity** downgraded from the original "cross-agent cache leak" to Med (only byte-identical prompts collide).
- **H5 (director line-163 type error)** from an earlier hypothesis bank was REJECTED (RH-01) — it is an LSP cascade false positive; `DirectorState` is 6-member and the code is type-correct.

## Net result

All 10 sampled prior-audit hypotheses (B-01, B-02/03, B-11, B-17/18, B-19, B-20, B-21, FA-01, FM-02, FM-vote/subscribe) are **substantiated** by direct source verification in this session (IDs EB-01..EB-24, IN-01..IN-03, FE-01). Two were refined downward (IN-06, EB-23) on evidence; none were fully contradicted. The prior audit's hypothesis bank is therefore a reliable seed, but its severity estimates for IN-06 and EB-23 were overstated.

---

_Next: continue frontend DebatePanel/ForumPanel deep dive (Cycle 13) and cross-module flows._
