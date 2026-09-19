# NIGHTLY CONTINUOUS RESEARCH — MASTER INDEX

Project: SuperAgents OS (v4.5.0 / ConversationCore + Cognitive Modules + Invocation Engine)
Mode: RESEARCH ONLY — no code changes, no commits, no fixes, no new services/components.
Started: 2026-08-15

## Counters (live)

- Research cycles completed: 17
- Total findings recorded: 41 (24 backend EB + 8 integration IN + 9 frontend FE)
  - CONFIRMED: 39
  - LIKELY: 2 (EB-23, EB-24)
  - POSSIBLE: 0
  - QUESTION: 0
- Severity breakdown:
  - Critical: 0
  - High: 12 (EB-01, EB-05, EB-06, EB-07, EB-09, EB-12, EB-15, EB-16, IN-01, EB-20, EB-22, FE-01)
  - Medium: 24 (EB-02, EB-03, EB-08, EB-10, EB-11, EB-13, EB-17, EB-18, IN-02, IN-03, IN-04, EB-19, EB-21, EB-23, EB-24, FE-02, FE-03, FE-04, IN-07, FE-06, FE-07, IN-06, FE-08, FE-09)
  - Low: 5 (EB-04, EB-14, IN-05, FE-05, IN-08)
- Rejected hypotheses: 3 (RH-01, RH-02, RH-03)
- New architecture questions: 0
- New opportunities: 0

## Findings by file

| File                         | Findings                    |
| ---------------------------- | --------------------------- |
| 01_BACKEND_FINDINGS.md       | 24                          |
| 02_FRONTEND_FINDINGS.md      | 9                           |
| 03_ARCHITECTURE_FINDINGS.md  | 8 (AR-01..AR-08, synthesis) |
| 04_INTEGRATION_FINDINGS.md   | 8                           |
| 05_TESTING_FINDINGS.md       | 5 (TE, synthesis)           |
| 06_PERFORMANCE_FINDINGS.md   | 4 (PE, synthesis)           |
| 07_SECURITY_RELIABILITY.md   | 3 (SEC, synthesis + new)    |
| 08_UX_FINDINGS.md            | 6 (UX-01..UX-06)            |
| 09_DOCUMENTATION_FINDINGS.md | 4 (DOC-01..DOC-04)          |
| 10_CODE_HEALTH.md            | 7 (CH-01..CH-07)            |
| 11_OPPORTUNITIES.md          | 14 (OP-01..OP-14)           |
| 12_OPEN_QUESTIONS.md         | 9 (OQ-01..OQ-09)            |
| 13_VERIFIED_FINDINGS.md      | 10 hypotheses re-validated  |
| 14_REJECTED_HYPOTHESES.md    | 0                           |

## Areas investigated

- Kernel / EventBus: ✅ (Cycle 2) — emitOnce constant-key loss, strict drop, recursion reorder, DI-bypass
- ConversationCore / ConversationDirector lifecycle: ✅ (Cycle 3) — 10 confirmed bugs (EB-05..EB-14)
- Debate runtime / caller / sync / persistence: ✅ (Cycle 4) — singleton single-debate, llm-caller god-fn, emitOnce DEBATE_UPDATED (EB-15..EB-18)
- Forum service + backend↔frontend integration: ✅ (Cycle 5) — escalation phantom, votePost/subscribe no UI, checkpoints ephemeral, override CHALLENGE (IN-01..IN-05)
- Invocation Engine + Room: ✅ (Cycle 6) — executing post-hoc, orphaned accepted on failure, premature done (debate) (EB-19..EB-21)
- LLM adapters / routing / governor: ✅ (Cycle 7) — openai-compatible+gemini 60s timeout miss, cache key no agent/session, dual routing services (EB-22..EB-24)
- Frontend stores / routing / route-registry: ✅ (Cycle 8) — duplicate builder nav id, observer-store leaks, no sessionId filter, no design system (FE-01..FE-05)
- Forum service + backend↔frontend integration (negative research): ✅ (Cycle 5 + Cycle 10) — escalation phantom, votePost/subscribe no UI, KEY_COMPROMISED/ROLE_ASSIGNED/METRICS_ALERT_RESOLVED no consumer
- Invocation Engine + Room: ✅ (Cycle 6)
- LLM adapters / routing / execution governor / race executor: ✅ (Cycle 7)
- Frontend stores / routing / route-registry: ✅ (Cycle 8)
- Frontend panels (Director/RunTab, Room, Debate, Forum, cognitive): ⬜ (RoomPanel C11, DebatePanel C13, Director RunTab C17; cognitive scan C18)
- Cross-module flows (Forum↔Debate, Invocation↔ConversationCore, etc.): ⬜
- Negative research (events with no emitter/consumer, unused services): ✅ partial (IN-06/IN-07, Cycle 10)
- Documentation mismatches ✅ (Cycle 15: DOC-01..04)
- Dead / suspicious code / duplication ✅ (Cycle 15: CH-01..07, IN-08, SEC-03)
- Security / reliability (auth, secrets, key handling) ✅ partial (Cycle 11: SEC-01..SEC-03, IN-06 reclass)
- UX research (live/streaming interfaces) ✅ (Cycle 16: UX-01..UX-06)

## Top findings (filled as research progresses)

(none yet)
