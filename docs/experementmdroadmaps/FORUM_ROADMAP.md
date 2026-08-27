# FORUM ROADMAP (Phase 13 — Forum)

> Research-only. ForumPanel + ForumService. Backend is rich; UI is the thinnest of any major subsystem.
>
> **Cycle 2 — panel roadmap: Forum.**

## Current state

- `ForumPanel.tsx` (+ TopicList, TopicView, PostComposer, AuthorBadge, ModerationQueue?, ForumHeatmap) renders topics/threads.
- `ForumService` (`forum/forum-service.ts`) fully implements vote/pin/moderate/consensus/subscribe — **none surfaced**.

## Top gaps (file:line)

- `votePost` :149 — **no UI** (R-02/R-22).
- `pinTopic` :237 — **no UI** (R-22).
- `moderatePost` :245 — **no UI** (R-22).
- `getConsensus` :262 — computed, **never called**; returning `contested` should trigger debate escalation (R-03/R-23).
- `subscribe` :195 — stored, **no notification UI** (R-15/alerts).
- Escalation event `forum:topic:escalated-to-debate` is **NOT in event-registry** (only asserted-absent in `forum-service.test.ts:307`) — must be registered + wired (R-23).

## Roadmap (phased)

1. **Voting + pin (M).** Vote buttons call `votePost`; pin toggle calls `pinTopic`. Backend-ready. (R-22)
2. **Moderation (M).** Moderation menu (`moderatePost` warn/hide/remove) for authorized roles; render `moderation.status` on posts. (R-22)
3. **Consensus → Debate escalation (M).** On thread open, call `getConsensus`; if `contested`, show "Escalate to debate" → register + emit `forum:topic:escalated-to-debate` → `invocationEngine.invoke({mode:'debate', context:{type:'forum-topic', ref}})`. (R-03/R-23) — **flagship cross-module win.**
4. **Subscriptions → alerts (S).** `subscribe` + `notification-webhook-service` / AlertLayer for new replies. (R-18/C9)
5. **Heatmap already exists** — wire it to `getConsensus` confidence for a community-health view.

## Value / Effort

Steps 1–3 turn a read-only board into a living community with a debate on-ramp. Almost entirely backend-ready → UI only. **Priority: P0 (highest quick-win density after Research expose).**
