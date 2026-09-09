# 17_SEARCH_AND_NAVIGATION.md — Forum Search, Filter, Sort, Pagination, Navigation

> RESEARCH-ONLY. No source modified. Labels: VERIFIED / INFERRED / OPINION.

## 1. Text search — DOES NOT EXIST

- VERIFIED: `TopicFilter` (forum-types.ts:90-98) has only category, authorId, status, tag, page, pageSize. No free-text query field.
- VERIFIED: `ForumRepository.listTopics` filters only by those four keys (forum-repository.ts:34-49). No substring/FTS on title or body.
- VERIFIED: `IForumService.listTopics` simply forwards the filter (forum-service.ts:209-221) — no search layer.
- INFERRED: There is no way to find a topic by title or a post by content through the service API. Topics grow unbounded (UI requests pageSize:50) and become unsearchable.
- OPINION: Add query?: string to TopicFilter; implement a Dexie .filter() substring match on title (and optionally post bodies via listPosts) in the repository. Low effort, high value.

## 2. Filtering — partial, UI-incomplete

- Backend supports (forum-repository.ts:42-45): category, authorId, status, tag.
- UI reality: TopicList.tsx exposes only a title input + a category input (TopicList.tsx:67-84). There is:
  - No tag filter (despite tag being in the filter and Topic.tags[] existing — forum-types.ts:69).
  - No status filter (open/closed/archived — forum-types.ts:62 — never selectable in UI).
  - No author filter (despite authorId in filter).
  - No category dropdown — category is free-text, so categories fragment (e.g. "general" vs "General").
- VERIFIED: handleCreate always sends category verbatim (ForumPanel.tsx:52-56); no controlled vocabulary.
- OPINION: Add a category select (derived from existing topics), plus tag/status filter chips. Reuse listTopics filter — zero backend change.

## 3. Sorting — backend default only, no UI control

- VERIFIED: ForumRepository.listTopics hard-sorts by lastActivityAt desc (forum-repository.ts:46). No sort parameter in TopicFilter.
- VERIFIED: Topic.score is aggregated from votes (forum-service.ts:179-185) and shown in TopicList (TopicList.tsx:45), but there is no "sort by score" / "sort by activity" / "sort by newest" toggle.
- OPINION: Pinned topics SHOULD sort above others (they render with pin but fall anywhere in the activity-sorted list — TopicList.tsx:28-29). Add a stable pin-first sort, either in repo or UI.

## 4. Pagination — fully supported backend, absent UI

- VERIFIED: TopicFilter.page/pageSize + Paginated<T> return (forum-types.ts:95-105); listTopics slices correctly (forum-service.ts:210-220).
- VERIFIED: ForumPanel.refreshTopics calls listTopics({ page:0, pageSize:50 }) (ForumPanel.tsx:30) and renders all 50 with no pager, no "load more", no page indicator.
- INFERRED: With >50 topics the UI silently truncates. The backend is page-aware but the UI treats it as a single page.
- OPINION: Add incremental "Load more" / paging using the existing page/total from Paginated. No backend change.

## 5. In-thread navigation — flat list, no threading UI

- VERIFIED: Post.parentId exists (forum-types.ts:51) and ForumPostRecord stores it (forum-types.ts:143), but postMessage signature is (topicId, author, body) with no parentId (contracts/forum.ts:27-33, forum-service.ts:93-98). TopicView/PostComposer never set it. The "threaded posts" claim in the contract (contracts/forum.ts:27) is not exposed — every post is a flat reply to the topic.
- VERIFIED: getThread supports sincePostId incremental load (forum-service.ts:223-235) but ForumPanel.openThread always fetches the full thread (ForumPanel.tsx:39-45). No live append, no "new posts" indicator.
- OPINION: Either expose parentId (add to postMessage + composer "reply") or drop the threading claim. Today it is dead capability (see 19 FC-12).

## 6. Route / entry navigation

- VERIFIED: forum nav item registered in route-registry-content.ts:98-99 (nav.forum); lazy panel mounted there. Entry point exists and is reachable.
- VERIFIED: No per-topic URL/route. ForumPanel keeps selectedId in component state (ForumPanel.tsx:24); reloading the page loses the open thread; no deep-link/share.
- OPINION: Add /forum/:topicId route param (mirroring how RoomPanel opens /director?session=) for shareable threads.

## 7. Gap summary

| Feature          | Backend               | UI                  | Effort to expose            |
| ---------------- | --------------------- | ------------------- | --------------------------- |
| Free-text search | NO                    | NO                  | Med (add query+repo filter) |
| Category filter  | YES                   | partial (free-text) | Low                         |
| Tag filter       | YES                   | NO                  | Low                         |
| Status filter    | YES                   | NO                  | Low                         |
| Author filter    | YES                   | NO                  | Low                         |
| Sort by score    | NO (default activity) | NO                  | Low-Med                     |
| Pin-first sort   | NO                    | NO (pin only)       | Low                         |
| Pagination UI    | YES                   | NO (truncates)      | Low                         |
| Threaded replies | partial (type only)   | NO                  | Med                         |
| Per-topic route  | NO                    | NO                  | Low-Med                     |
