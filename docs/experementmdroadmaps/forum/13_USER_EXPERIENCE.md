# 13 — User Experience Assessment: ForumPanel (RESEARCH-ONLY)

> Status: read-only deep-dive. No source modified. Tags: **VERIFIED** / **INFERRED** / **OPINION**.
> Components reviewed: `ForumPanel.tsx`, `TopicList.tsx`, `TopicView.tsx`, `PostComposer.tsx`, `AuthorBadge.tsx`, `ModerationQueue.tsx`, `ForumHeatmap.tsx`. i18n: `src/i18n/translations/{en,ru}/analytics.ts:327-346`.
> **Headline finding (VERIFIED):** `ForumPanel.tsx:4` does `import { forumService } from '../../kernel/instances'`, but `forumService` is **not exported** by `src/kernel/instances` (grep over `src/kernel/instances/**` for `forumService` → 0 matches; `forumService` only exists as a container registration `phase18-forum.ts:32` and a phase label `service-phases.ts:219,634`). LSP reports `Module '"../../kernel/instances"' has no exported member 'forumService'`. **The Forum UI almost certainly fails to compile/load as written** — this is the dominant UX blocker and should be resolved (export `forumService` from `instances`, matching the `conversationDirector`/`invocationEngine` lazy-service pattern in `instances/services-extras.ts`) before any UX polish.

---

## 1. Reading experience

**VERIFIED — Topic list is a flat, manual-refresh sidebar.** `TopicList.tsx:53-110` renders topics passed in from `ForumPanel.refreshTopics` (`ForumPanel.tsx:29-37`), which loads `listTopics({page:0,pageSize:50})` sorted by `lastActivityAt` (repository `forum-repository.ts:46`). There is **no search box**, no category filter UI, no tag filter UI, no pagination control (the `TopicFilter.page/pageSize` exists in contract `forum-types.ts:90-98` but the UI never exposes it). New topics appear only after clicking the ↻ refresh button (`ForumPanel.tsx:91-104`) — the panel does **not** subscribe to `FORUM_TOPIC_CREATED`/`FORUM_POST_ADDED`.

**VERIFIED — Thread view is read-only-friendly but loses data.** `TopicView.tsx:78-142` renders posts (`PostCard`, lines 20-73) via `dangerouslySetInnerHTML` from `renderedHtml` (`forum-service.ts:325-336` — escapes HTML, supports links/bold/italic/code). Each post shows author badge + score + token cost + hide/remove buttons. **No vote (up/down) control is rendered**, although `votePost` exists in the service (`forum-service.ts:149-193`) and `FORUM_POST_VOTED` is emitted — voting is fully implemented backend, **unused in UI**.

**VERIFIED — Consensus badge discards its own detail.** `ForumPanel.openThread` (`ForumPanel.tsx:43-44`) stores only `cv?.status` (`setConsensus(cv?.status ?? null)`); the rich `ConsensusVerdict.summary` and `confidence` (`forum-service.ts:283-307`) are thrown away. `TopicView` shows only a colored label `forum.consensus_{status}` (`TopicView.tsx:104-116`), never _why_ a thread is contested or the confidence number.

**OPINION — Reading is acceptable for a low-volume forum but feels static.** No realtime, no unread state, no "jump to latest".

---

## 2. Writing experience

**VERIFIED — Only the local human can post.** `ForumPanel.tsx:11-15` hardcodes `currentAuthor = { kind:'human', id:'local-user', displayName:'Вы' }`. `PostComposer` (`PostComposer.tsx`) posts as that human. There is **no UI path for an agent to author a post** (see `10_CONVERSATION_INTEGRATION.md §2` — only `SYSTEM_AUTHOR` posts programmatically). So "agent interaction" from the forum is non-existent by design of the UI.

**VERIFIED — Composer is minimal.** `PostComposer.tsx:11-65`: a 2-row textarea, submit on Ctrl/Cmd+Enter or button. Supports markdown-ish syntax via `renderBody` but **no toolbar, no preview, no reply/quote button**. Replying to a specific post is impossible in the UI even though `parentId` exists (`forum-types.ts:51`, `contracts/forum.ts:27-33`) — every post is a flat sibling. No edit (`editedAt` field exists, `forum-types.ts:53`, but no `editPost` method in `IForumService`).

**VERIFIED — Topic creation is bare.** `TopicList.tsx:58-85`: title + free-text `category` input (no taxonomy/dropdown), no tags, no body-on-create affordance (body is optional in `CreateTopicInput` `forum-types.ts:81-88` but the UI never sends it). Tags (`topic.tags`) are never set from the UI though the schema indexes them (`dexie-schema.ts:532` `*tags`).

---

## 3. Threading / discoverability-within-topic

**VERIFIED — Flat, chronological.** `getThread` returns posts ordered by `createdAt` (`forum-repository.ts:65-66`); no tree reconstruction in UI. `parentId` is writeable but never written. **INFERRED — the "challenge a claim" narrative (file 12) cannot be expressed structurally today**; it would be free-text mentions only.

---

## 4. Agent interaction

**VERIFIED — Agent presence is display-only.** `AuthorBadge.tsx:16-52` resolves an agent's avatar/name via `resolveAgentIdentity` (`src/kernel/services/agent-identity`) and shows `◆ roleId`. But agents never appear as authors except `SYSTEM_AUTHOR` (system). A real topology agent (e.g. `System Architect`) is shown only if something posts as it — nothing does. `agentProvenance` is surfaced as a tiny "{tokensCost} tok" label (`TopicView.tsx:43-46`); `traceId`/`modelId` are **not** clickable or shown.

**OPINION — Highest-leverage UX win:** make `agentProvenance.traceId` expandable ("show reasoning") — the data is already there (`forum-service.ts:121-129`) and the timeline concept in `12_COGNITIVE_INTEGRATION.md` consumes it. Zero new events.

---

## 5. Moderation

**VERIFIED — Unrestricted, local-user-only.** `ModerationQueue.tsx:13-67` lists posts with `moderation.status !== 'normal'` and offers only a **warn** button (calls `moderatePost(id,'warn')`). `TopicView.PostCard` offers hide (`○`) and remove (`×`) directly (`TopicView.tsx:51-64`), wired to `handleModerate` → `forumService.moderatePost`. **No moderator role / permission check** — the hardcoded `local-user` can moderate anything. There is no "restore"/"approve" action (a post moved to `hidden`/`removed` can only be warned back, not un-hidden via UI). Removed posts are filtered from `getThread` (`forum-service.ts:232`) so they vanish from the thread but still appear in the ModerationQueue as a tombstone.

**OPINION — Moderation is functional but crude:** no audit trail UI (who moderated, when — `ModerationState.moderatedBy/at` exist at `forum-types.ts:37-43` but are never populated; `moderatePost` sets no `moderatedBy`), no reason capture beyond the literal `'модерация'` string (`ForumPanel.tsx:67`).

---

## 6. Consensus

**VERIFIED — Shown as a badge, explained nowhere.** See §1. `getConsensus` runs a deterministic heuristic (`forum-service.ts:262-308`: needs ≥3 posts; balance from votes; diversity from author count; thresholds hardcoded). The badge appears once a topic is opened. There is **no "escalate to debate" action** on a `contested` verdict (the dead bridge — `10_CONVERSATION_INTEGRATION.md §4`), even though the verdict text says "requires a debate".

---

## 7. Pain-point summary (OPINION, prioritized)

| #   | Pain point                                                      | Evidence                                          | Severity |
| --- | --------------------------------------------------------------- | ------------------------------------------------- | -------- |
| P0  | `forumService` not exported from `instances` → panel won't load | `ForumPanel.tsx:4` + grep                         | Blocker  |
| P1  | No realtime — manual ↻ only; no event subscription              | `ForumPanel.tsx:91-104`                           | High     |
| P2  | No search / filter UI (category/tag/pagination unused)          | `TopicList.tsx`, `forum-types.ts:90-98`           | High     |
| P3  | Voting implemented but no UI button                             | `forum-service.ts:149-193`, `TopicView.tsx:48`    | Med      |
| P4  | Consensus summary/confidence discarded                          | `ForumPanel.tsx:43-44`                            | Med      |
| P5  | No agent posting from UI; agents only `SYSTEM`                  | `ForumPanel.tsx:11-15`, `phase18-forum.ts:24`     | Med      |
| P6  | No reply/threading UI (`parentId` unused)                       | `TopicView.tsx`, `forum-types.ts:51`              | Med      |
| P7  | Moderation unrestrained, no `moderatedBy`/reason/restore        | `ModerationQueue.tsx`, `forum-service.ts:245-260` | Med      |
| P8  | `agentProvenance.traceId` orphaned (no "show reasoning")        | `forum-service.ts:121-129`                        | Low/Med  |
| P9  | No tags/category taxonomy from UI                               | `TopicList.tsx:76-81`                             | Low      |

---

## 8. N/A items

- **Realtime collaboration / live cursors:** N/A (no store, no WS; out of scope).
- **Rich text editor / attachments:** N/A (markdown-lite only).
- **Mobile layout:** N/A (fixed 340px sidebar `ForumPanel.tsx:109-116`).

---

_Citations: ForumPanel.tsx:4,11-15,29-44,91-104; TopicList.tsx:53-110; TopicView.tsx:20-73,104-116; PostComposer.tsx:11-65; AuthorBadge.tsx:16-52; ModerationQueue.tsx:13-67; ForumHeatmap.tsx; forum-service.ts:121-129,149-193,232,245-260,262-308,325-336; forum-types.ts:37-43,51,81-98; contracts/forum.ts:27-33; dexie-schema.ts:532; phase18-forum.ts:24,32; instances export gap (grep)._
