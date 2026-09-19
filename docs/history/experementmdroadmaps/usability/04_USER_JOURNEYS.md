# 04 — User Journeys

> Task-based walkthroughs from a first-time user's perspective. Evidence: VERIFIED (panel code read) + INFERRED for unread paths. Marked per 00.

## Journey 1 — "I want to talk to an AI agent" (Chat)

- **Path:** Dashboard → (GetStarted "Explore" → chat) OR Sidebar → Chat.
- **VERIFIED strengths:** ChatPanel is the most mature; sessions, model/key pickers, export.
- **Friction:** No inline "send your first message" prompt; model/key selectors assume knowledge of providers. New user with zero keys sees errors, not guidance (GetStarted only appears at _zero keys total_, then disappears).
- **Verdict:** Completable. Learnability medium.

## Journey 2 — "I want agents to debate a topic" (Debate)

- **Path:** Sidebar → Debates → Debate Arena (classic/runtime toggle) → start session.
- **VERIFIED:** DebateArena toggle is clean. Real debate engine exists.
- **Friction:** Under Debates sits ~30 `ComingSoonPanel` stubs — user may click 5 "features" before finding the real arena. Empty DebateLive arena has no "how to start" copy.
- **Verdict:** Completable but discovery polluted by stubs.

## Journey 3 — "I want to run a guided multi-step agent plan" (Director)

- **Path:** Knowledge → Director → Configure (build scenario) → Library (save) → Run tab.
- **VERIFIED:** Rich RunTab (scenario select, live turn log, progress, override, checkpoints). Empty state present.
- **Friction:** "Scenario / TurnProposal / override" vocabulary is expert-only; no plain-language explainer. Configure/Editor is powerful but unguided.
- **Verdict:** Completable for determined users; steep for newcomers.

## Journey 4 — "I want to make an agent do a task for me" (Room / Invocation)

- **Path:** Knowledge → Room → pick agent → "Where" → "Mode" → "Task" → Invoke.
- **VERIFIED (05/07):** Agent picker lists registered agents (good). But "Where/Mode" abstract; rejection shows raw `no matching enabled policy`; feed is global.
- **Friction:** The core concept ("invocation") is never named in UI. First-timer can't predict what "Mode: debate" vs "chat" produces. Failure is a dead-end error string.
- **Verdict:** Completable only with trial/error or docs. High friction.

## Journey 5 — "I want to organize knowledge from debates" (Forum/Crystals)

- **Path:** Knowledge → Forum → read topic.
- **VERIFIED (03/05):** Forum shows consensus status but **no** vote/pin/moderate UI though backend supports it; author hardcoded "Вы".
- **Friction:** User can read but not act; feels read-only/limited.
- **Verdict:** Partial completion — view works, participate is blocked by missing UI.

## Journey 6 — "I want to schedule something" (Scheduler) — BROKEN

- **Path:** Sidebar → Scheduler → toggle a schedule.
- **VERIFIED (07-FORM-1):** Toggles only flip a settings flag; `SchedulerService` never called. User believes scheduling works; it does not.
- **Verdict:** **Not completable** — silent dead control. Highest-severity journey failure.

## Journey 7 — "I want to find any panel fast" (Command Palette)

- **Path:** Press ⌘K → fuzzy search → Enter.
- **VERIFIED (11-DISC-3):** Excellent palette. But no in-UI hint it exists.
- **Verdict:** Best-in-class once known; undiscoverable.

## Cross-journey insight

The product supports rich **expert** journeys but every first-time journey hits at least one of: stub pollution, hidden vocabulary, missing UI for existing backend, or a silent dead control (Scheduler). Fixing P0 items (01/002/003/004 + stub labeling) removes the worst friction from _all_ journeys at once.
