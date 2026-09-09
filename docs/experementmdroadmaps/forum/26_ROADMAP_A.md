# 26 — FORUM ROADMAP A: PRODUCT-FIRST

> Make the Forum maximally useful to **humans** fast. The backend is already rich;
> the UI is the thinnest of any major subsystem (`FORUM_ROADMAP.md:9`). This roadmap
> is **UI + glue only**, reusing `ForumService`/`ForumRepository` verbatim.
> Every task cites the existing code/service it reuses and the proposed UI.

---

## Phase 0 — Foundations (search + surfaced voting/pinning)

**Goal:** turn the read-only board into a navigable, interactive community surface.

### A0.1 — Search & filter bar

- **Task:** Add a search box + category/tag/status filters above `TopicList` (`TopicList.tsx:53`). Wire to `listTopics({category,status,tag})` (`forum-service.ts:209`) — filters already supported in `ForumRepository.listTopics` (`forum-repository.ts:34-49`). Client-side text match on title/body for now (full-text deferred, see `25_DO_NOT_BUILD_YET.md` (d)).
- **Existing code:** `ForumRepository.listTopics`, `ForumPanel.refreshTopics` (`ForumPanel.tsx:29`).
- **Proposed UI:** Search input + dropdown filters in the left sidebar header.
- **Deps:** i18n keys (`forum.search` etc. — currently **absent**, `analytics.ts:329-346`).
- **Effort:** S (0.5–1 day).
- **Risk:** Low.
- **Expected result:** Users find topics instantly; no new backend.

### A0.2 — Voting UI (up/down)

- **Task:** Render up/down vote buttons on each `PostCard` (`TopicView.tsx:20-73`) calling `forumService.votePost` (`forum-service.ts:149`). The method is fully implemented (idempotent, score cascades to topic `:174-185`) but **has no UI** (`FORUM_ROADMAP.md:14`).
- **Existing code:** `votePost`, `ForumVoteRecord` (`forum-types.ts:154`).
- **Proposed UI:** ▲/▼ buttons + score; highlight the user's active vote.
- **Deps:** `currentAuthor` is fixed `local-user` (`ForumPanel.tsx:11`) — acceptable for v1.
- **Effort:** S (0.5 day).
- **Risk:** Low.
- **Expected result:** Community scoring live; heatmap already reflects `score`.

### A0.3 — Pinning

- **Task:** Pin/unpin toggle in `TopicList` row (`TopicList.tsx:28-47`) calling `forumService.pinTopic` (`forum-service.ts:237`). No UI today (`FORUM_ROADMAP.md:15`).
- **Existing code:** `pinTopic`, `Topic.pinned` (`forum-types.ts:70`).
- **Proposed UI:** 📌 toggle on hover; pinned topics sort first (already `pinned` field).
- **Effort:** S.
- **Risk:** Low.
- **Expected result:** Important threads stay visible.

---

## Phase 1 — Consensus visibility & moderation UX

**Goal:** surface the dormant consensus signal and make moderation legible.

### A1.1 — Consensus panel + "contested" affordance

- **Task:** `getConsensus` IS already called in `openThread` (`ForumPanel.tsx:43`) and rendered as a badge (`TopicView.tsx:104-116`), but **no action** on `contested`. Add a "Why?" popover showing `ConsensusVerdict.summary`/`confidence` (`forum-service.ts:283-307`).
- **Existing code:** `getConsensus`, `ConsensusVerdict` (`forum-types.ts:113`).
- **Proposed UI:** Tooltip/expandable summary under the badge.
- **Effort:** S.
- **Risk:** Low.
- **Expected result:** Users understand thread health.

### A1.2 — Moderation UX hardening

- **Task:** `moderatePost` is already wired (hide/remove buttons `TopicView.tsx:51-63`, warn in `ModerationQueue.tsx:51`). Add a **reason input** and surface `moderation.reason`/`at` on hidden posts (`forum-types.ts:37-43`). Keep ungated v1 (role gate deferred, `25_DO_NOT_BUILD_YET.md` (h)).
- **Existing code:** `moderatePost`, `ModerationState`.
- **Proposed UI:** Reason prompt on hide/remove; strikethrough + reason on moderated posts.
- **Effort:** S–M.
- **Risk:** Low.
- **Expected result:** Transparent moderation.

---

## Phase 2 — Agent answers (human asks, agent responds)

**Goal:** let humans get agent answers inside threads, reusing the Invocation Engine.

### A2.1 — "Ask an agent" in a topic

- **Task:** Add an "Ask agent" button in `TopicView` that opens the agent picker (pattern from `RoomPanel`) and calls `invocationEngine.invoke({target:{agentId}, context:{type:'forum-topic', ref: topicId}, constraints:{mode:'chat'}})`. The debate/chat handoff already exists (`phase21-invocation.ts:61-109`). The agent's response can be posted back as a `Post` with `author.kind:'agent'` + `agentProvenance` (`forum-service.ts:121-129`).
- **Existing code:** `invocationEngine` lazyService (`AGENTS.md` Step 5), `agentProvenance`.
- **Proposed UI:** Agent-picker modal → posts agent reply as a `◆` badge post (reuses `AuthorBadge` `AuthorBadge.tsx`).
- **Deps:** `invocationEngine` available; `forumService.postMessage` needs an `agentProvenance`-bearing `ForumAuthor` (already typed).
- **Effort:** M (1–2 days).
- **Risk:** Medium — agent reply must be captured and re-posted; need a bridge from invocation `done` → forum post (reuse `FORUM_POST_ADDED` consumer pattern).
- **Expected result:** Humans get on-demand expert answers in-thread.

### A2.2 — Agent provenance card

- **Task:** `agentProvenance` is only shown as "`N tok`" (`TopicView.tsx:43-46`). Expand to a hover card: `modelId`/`traceId`/cost (`forum-types.ts:27-33`).
- **Existing code:** `AgentProvenance`, `resolveAgentIdentity` (`AuthorBadge.tsx:19`).
- **Effort:** S.
- **Risk:** Low.
- **Expected result:** Transparent AI contributions.

---

## Phase 3 — Realtime + subscriptions

**Goal:** live updates and reply notifications.

### A3.1 — Realtime post/vote via event bus

- **Task:** Subscribe to `FORUM_POST_ADDED`/`FORUM_POST_VOTED` (`event-registry.ts:1401/1409`) in `ForumPanel` and incrementally refresh the open thread (pattern: `directorStore`/`invocationStore` observers in `AGENTS.md` B4/B5). No new transport (`25_DO_NOT_BUILD_YET.md` (e)).
- **Existing code:** `IEventBus`, `onSafe`.
- **Proposed UI:** New-post toast + auto-append; vote-count live update.
- **Effort:** M.
- **Risk:** Low–Medium (dedupe vs manual refresh).
- **Expected result:** Threads feel live.

### A3.2 — Subscribe + alerts

- **Task:** `subscribe` is implemented (`forum-service.ts:195`) and stored (`forumSubs` `forum-repository.ts:103-116`) but has **no notification UI** (`FORUM_ROADMAP.md:18`). Add "Follow" button + a lightweight alerts list (reuse `AlertLayer` if present, else a panel badge) driven by `FORUM_POST_ADDED` for subscribed topics.
- **Existing code:** `subscribe`, `listSubs` (`forum-repository.ts:114`).
- **Effort:** M.
- **Risk:** Low.
- **Expected result:** Users return to active threads.

---

## Phase 4 — Knowledge loop (product-facing)

**Goal:** surface the existing knowledge bridges to end users.

### A4.1 — "Generated from this discussion" links

- **Task:** The forum→knowledge-generator bridge already fires on question patterns (`phase18-forum.ts:82-114`) and `knowledge-generator-service.ts:450` handles `forum-question`. Surface a "Knowledge generated" panel in `TopicView` linking to the produced crystal/knowledge (crystal formation already announced `phase18-forum.ts:66-79`).
- **Existing code:** `phase18` bridges, `generator.kind_forum-question` i18n (`analytics.ts:296`).
- **Proposed UI:** A side card listing generated knowledge items for the topic.
- **Effort:** M.
- **Risk:** Low–Medium (need job/topic linkage; currently `forum-question` trigger carries `topicId` `generator-types.ts:15`).
- **Expected result:** Discussions visibly produce durable knowledge.

---

## Effort / Value summary

| Phase | Focus                     | Effort | Risk    | Reuse                        | User value             |
| ----- | ------------------------- | ------ | ------- | ---------------------------- | ---------------------- |
| 0     | Search + vote + pin       | S–M    | Low     | ForumService                 | High (basic usability) |
| 1     | Consensus + moderation UX | S–M    | Low     | getConsensus/moderatePost    | Medium                 |
| 2     | Agent answers in-thread   | M      | Medium  | Invocation + agentProvenance | High                   |
| 3     | Realtime + subscribe      | M      | Low–Med | event bus + subscribe        | Medium–High            |
| 4     | Knowledge loop UI         | M      | Low–Med | phase18 bridges              | Medium                 |

**Recommended starting point (OPINION):** Phase 0. It is almost entirely backend-ready
UI glue and yields the highest quick-win density (`FORUM_ROADMAP.md:31` rates this P0).
Final decision left to human.
