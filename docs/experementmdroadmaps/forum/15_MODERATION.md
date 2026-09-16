# 15_MODERATION.md — Forum Moderation Capabilities

> RESEARCH-ONLY deep-dive. No source modified. Status labels: **VERIFIED** (read from code), **INFERRED** (reasoned from code), **OPINION** (recommendation).

## 1. Backend moderation surface

- `ForumService.moderatePost(postId, action: 'warn'|'hide'|'remove', reason?)` — `src/kernel/services/forum/forum-service.ts:245-260`.
  - Persists a `ModerationState` onto the post record: `status`, `action`, `reason`, `at` (timestamp).
  - Mapping: `hide` -> status `hidden`; `remove` -> status `removed`; `warn` -> status **`normal`** (action `warn` flag only).
- `getThread()` filters out removed posts: `r.moderation.status !== 'removed'` — `forum-service.ts:232`. So **removed posts vanish from the thread entirely**; only `hidden` posts remain visible in the list.
- `ModerationState` type — `src/kernel/types/forum-types.ts:37-43` — declares `moderatedBy?: ForumAuthor` and `at?: number`. **VERIFIED:** `moderatePost` sets `at` but **never sets `moderatedBy`** (`forum-service.ts:253-258`). The `moderatedBy` field is a **dead/orphan field** — it is never written anywhere in the codebase (grep: only the type definition references it).
- No `editPost`, no `restorePost`, no `unhidePost` method. Once `hidden`/`removed`, the only path back is calling `moderatePost` again (e.g. `warn` resets status to `normal`).
- No permission/role model. `moderatePost` has no caller identity check — **any caller can moderate any post**. The UI passes a hardcoded reason `'модерация'` (`ForumPanel.tsx:67`). There is no concept of moderator vs participant.

## 2. Flood / anti-abuse budgeting (related, not moderation per se)

- `enforceFloodBudget(author, topicId)` — `forum-service.ts:312-323`. Hard cap `maxPostsPerMinute: 10` per author per topic, 60s sliding window.
- **VERIFIED:** the `limits` injection path exists (`forum-service.ts:45,48`) but `phase18-forum.ts:33-36` never passes `limits`, so the default `10` is always used. No UI surfaces the budget; when exceeded it `throw`s, which in `handleCompose` (`ForumPanel.tsx:58-63`) is **unwrapped and uncaught** -> would surface as an unhandled promise rejection to the user.
- No per-topic/topic-wide rate display, no warn-then-ban ladder.

## 3. UI moderation surface

- `ModerationQueue.tsx` — `src/components/ForumPanel/ModerationQueue.tsx`. **VERIFIED wired to real data:** `ForumPanel.tsx:139-144` passes `thread.posts`; the component filters `p.moderation.status !== 'normal'` and renders the offending posts.
- **VERIFIED limitation:** because `getThread` strips `removed` posts, the queue can only ever show `hidden` posts. Removed posts never reach it.
- The queue's only action button is **`warn`** (`ModerationQueue.tsx:51-62`), which re-calls `onModerate(p.id,'warn')`. But `warn` does **not** change `status` away from `hidden` (it sets `normal` regardless). **INFERRED:** clicking warn on an already-hidden post would un-hide it (status->`normal`), counter-intuitive for a review queue. There is no "keep hidden" or "delete" affordance in the queue.
- `TopicView.PostCard` also has inline **hide** (`o`) and **remove** (`x`) buttons — `TopicView.tsx:51-64` -> `onModerate(post.id,'hide'|'remove')`. These are the real moderation controls. Note: no `warn` button there, and no "un-moderate" control.
- Only the **current local human** (`currentAuthor`, `ForumPanel.tsx:11-15`) can moderate; there's no actor provenance recorded (ties back to orphan `moderatedBy`).

## 4. Events & persistence

- Events: `FORUM_TOPIC_CREATED`, `FORUM_POST_ADDED`, `FORUM_POST_VOTED` (`event-registry.ts:1392-1417`). **VERIFIED:** there is **NO `forum:post:moderated` / `forum:moderation` event.** Moderation changes are silent — no event emitted from `moderatePost` (`forum-service.ts:245-260` emits nothing). So other subscribers / the live layer never learn a post was moderated.
- Persistence: `ForumPostRecord.moderation` is stored in Dexie `forumPosts` (`forum-repository.ts:53-55`, type `forum-types.ts:149`). Survives reload. **VERIFIED** working (test `forum-service.test.ts:250,254` asserts `hide`/`remove`).

## 5. Proposed Moderator UX (no new architecture)

Do **not** build a separate moderation service. Extend the existing `moderatePost` + `ModerationQueue`:

- **OPINION:** record `moderatedBy` (pass current author into `moderatePost`, set the field) — tiny change, removes the orphan field and gives an audit trail.
- **OPINION:** emit a `forum:post:moderated` event (one line in `moderatePost`) so a future live layer / audit log can react.
- **OPINION:** give `ModerationQueue` real actions: "keep hidden", "restore", "delete", and show `reason`/`at`/`moderatedBy` (already in the type). Today it only offers a confusing `warn`.
- **OPINION:** distinguish `warn` intent. Today `warn` is a visibility no-op. Either make `warn` render a visible "warned" badge (UI reads `action==='warn'`), or drop it from the queue.
- **OPINION:** surface flood-budget errors gracefully (catch in `handleCompose`, show a toast) instead of an unhandled rejection.
- **OPINION:** add a minimal permission gate — only allow moderate when `currentAuthor` is flagged moderator — without a new service, just an injected predicate.

## 6. Status summary

| Capability            | Backend            | UI                                           | Event   | Notes                    |
| --------------------- | ------------------ | -------------------------------------------- | ------- | ------------------------ |
| warn/hide/remove      | YES VERIFIED       | YES (hide/remove in PostCard; warn in Queue) | NO none | warn is visibility no-op |
| moderatedBy audit     | NO never set       | n/a                                          | n/a     | orphan field             |
| reason/at             | YES                | NO not shown                                 | n/a     | stored, invisible        |
| un-moderate / restore | WARN via re-call   | NO                                           | n/a     | not exposed              |
| permission model      | NO                 | NO                                           | n/a     | anyone can moderate      |
| moderation event      | NO                 | n/a                                          | NO      | silent                   |
| flood budget          | YES (hardcoded 10) | NO (errors uncaught)                         | n/a     | default only             |
