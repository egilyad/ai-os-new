# 08 — Debate Integration (Forum ↔ Debate)

> Research-only. Tags: **[VERIFIED]** (file:line), **[INFERRED]**, **[OPINION]**.

## 1. Full lifecycle as designed vs as built

```
Designed:  Forum topic → (consensus=contested) → escalate to Debate
           → Verdict → post back to Forum → re-consensus
Built:     Forum topic → posts → getConsensus()=contested  ──(nothing happens)──┐
           Debate ─DEBATE_VERDICT_GENERATED─► Forum case-study post (one-way)  ←┘
```

The **Debate → Forum** direction is real; the **Forum → Debate** direction is dead.
`[VERIFIED]`

## 2. Verified REAL connection — Debate → Forum

- **Event:** `DEBATE_VERDICT_GENERATED` (`debate:verdict:generated`, payload `{sessionId, verdict}`)
  defined at `event-registry.ts:825-828`.
- **Consumer:** `wireForumBridge` in `phase18-forum.ts:48-64`.
- **Behavior:** ensures a `case-study` topic (idempotent via `ensureTopic`, `:116-119`) and posts
  a summary as `SYSTEM_AUTHOR`. Wrapped in `try/catch` → `LOGGER.warn` on failure.
- **Verdict fidelity:** the post body is a **lossy one-liner** — `"Итог дебатов <sessionId>:
зафиксирован вердикт (авто-пост)"` (`:57`). The rich `verdict` object is NOT rendered into the
  post; it remains only in `debateVerdicts` Dexie (`dexie-schema.ts:1141`). `[VERIFIED]`

## 3. Verified DEAD connection — Forum → Debate (escalation)

- `getConsensus` returns `'contested'` when `diversity>=2 && |balance|<0.25 && activity>=5`,
  with summary _"…требуется дебат"_ (`forum-service.ts:300-302`) — i.e. the code **declares** a
  debate is needed.
- **But nothing consumes that signal.** Specifically:
  - `forum:topic:escalated-to-debate` is **not defined** in `event-registry.ts` (only 3 forum
    events, `:1391-1417`).
  - `forum-service.ts` **never emits** any escalation event (grep: zero occurrence; the test
    `forum-service.test.ts:307` asserts it is _absent_).
  - **No consumer** listens for it (none registered in `phase18-forum.ts` or elsewhere).
- So a contested thread is **never** turned into a debate. The "requires debate" summary is
  cosmetic. `[VERIFIED]`

## 4. Advertised-but-missing integrations

| Advertised (AGENTS.md)                   | Status      | Evidence                                                                |
| ---------------------------------------- | ----------- | ----------------------------------------------------------------------- |
| `forum:topic:escalated-to-debate` bridge | **Missing** | not in `event-registry.ts`; never emitted (`forum-service.test.ts:307`) |
| Debate verdict → case-study post         | **Real**    | `phase18-forum.ts:48-64`                                                |
| Crystal formed → announcement            | **Real**    | `phase18-forum.ts:66-79`                                                |
| Forum post (question) → knowledgeGen     | **Real**    | `phase18-forum.ts:82-114`                                               |

## 5. Emitted-but-unconsumed / duplicated debate state

- `FORUM_TOPIC_CREATED`, `FORUM_POST_VOTED` have **no consumers** (`06_EVENT_FLOW.md` §3).
- Debate verdict is **duplicated**: stored in `debateVerdicts` Dexie **and** re-posted (degraded)
  into the forum `case-study` topic. Two copies, one lossy. `[VERIFIED]`
- After a verdict is posted to the forum, **consensus is never re-evaluated** from the debate
  outcome — `getConsensus` only looks at posts/votes, and debate posts land as `SYSTEM_AUTHOR`
  (not the original contested participants). The forum→debate→forum loop never closes. `[INFERRED]`

## 6. UI implying escalation but not performing it

- `TopicView.tsx:104-116` renders a **red `consensus_contested` badge** (`CONSENSUS_COLORS`
  `contested:'#ef4444'`, `:16`) when consensus is contested. This visually screams "needs
  attention/debate."
- **But there is no "Escalate to debate" control.** The only per-post actions are moderation
  `hide`/`remove` (`TopicView.tsx:51-64`) and a global refresh (`ForumPanel.tsx:91-104`). No
  button creates a debate from a topic. `[VERIFIED]`
- The Invocation Engine _can_ start a debate: `InvocationExecutionDelegate.start` with
  `mode==='debate'` calls `debate.startDebate(...)` (`phase21-invocation.ts:75-87`). That path is
  reachable from RoomPanel, **not** from the Forum. `[VERIFIED]`

## 7. Options (presented, NOT auto-picked)

**A) Forum fully independent (status quo, minimal).**
Keep forum as an async knowledge base; debate remains a separate subsystem. The
`case-study`/`announcements` inbound bridges stay. Risk: lowest. Effort: none.
_Trade-off:_ contested threads are never resolved; the red "contested" badge is misleading.

**B) Forum as debate launchpad (recommended middle ground).**
Add an **"Escalate to debate"** button on contested topics in `TopicView`/`ForumPanel`.
On click → `invocationEngine.invoke({target: participants, context:{type:'forum-topic',ref},
constraints:{mode:'debate'}})` (reuses `phase21-invocation.ts:75-87`) → on
`DEBATE_VERDICT_GENERATED`, the existing `wireForumBridge` already posts the case-study.
_New code needed:_ one UI button + a forum→invocation trigger (or call `debate.startDebate`
directly). Effort: low-medium. Closes the Forum→Debate direction without inventing events.

**C) Connected discussion lifecycle (full loop).**
Make escalation a **first-class, properly-defined event**: add `FORUM_TOPIC_CONTESTED`
(or fix `forum:topic:escalated-to-debate`: define in `event-registry.ts`, emit from
`getConsensus` when `'contested'`) → a consumer (policy or person) invokes a debate → on verdict,
post a structured case-study **and** re-run `getConsensus` so the topic reflects the resolution.
_New code needed:_ event definition + emit + consumer + optional re-consensus. Effort: medium-high.
_Trade-off:_ richest, but touches event registry, forum-service, and a new bridge.

## 8. Recommended (opinion, not executing)

Option **B** delivers the most value for the least change and reuses the already-working
`DEBATE_VERDICT_GENERATED → case-study` bridge. Option **C** is only worth it if the team wants
auditable, event-sourced escalation (which also fixes the `06` §2 missing-event defect). Option
**A** is acceptable only as a stopgap but should at minimum **remove/relabel the misleading
"contested → requires debate" UI/badge** until escalation exists. `[OPINION]`

## 9. Gaps summary

| Gap                                                     | Evidence                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| Forum→Debate escalation event undefined & never emitted | `event-registry.ts:1391-1417`; `forum-service.test.ts:307` |
| `getConsensus` says "requires debate" but nothing acts  | `forum-service.ts:300-302`                                 |
| No "escalate" UI control                                | `ForumPanel.tsx`, `TopicView.tsx` (moderation only)        |
| Verdict post is lossy duplicate of `debateVerdicts`     | `phase18-forum.ts:57`; `dexie-schema.ts:1141`              |
| Debate outcome never updates forum consensus            | `getConsensus` reads posts only (`forum-service.ts:262`)   |
