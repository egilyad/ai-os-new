# 01 — CURRENT ARCHITECTURE (restored from source)

> VERIFIED = read in source. INFERRED = implied. file:line cited. Read-only.

## Layer diagram (VERIFIED)

```
UI:  src/components/ForumPanel/{ForumPanel,TopicList,TopicView,PostComposer,
                                 AuthorBadge,ModerationQueue,ForumHeatmap}.tsx
        │  (local React useState; manual refresh; NO store; NO liveQuery)
        ▼  calls forumService.*
Service: src/kernel/services/forum/forum-service.ts  (ForumService)
        │  deps: repository (ForumRepository), eventBus (IEventBus)
        ▼
DAL: src/kernel/dal/forum-repository.ts  (ForumRepository)
        ▼
Dexie v17: forumTopics / forumPosts / forumVotes / forumSubs
        (indexes: dexie-schema.ts:532-535)
EventBus: forum:topic:created / forum:post:added / forum:post:voted
        │  (event-registry.ts:1392-1417)
        ▼
Other modules (bridges, phase18-forum.ts):
   DEBATE_VERDICT_GENERATED → case-study post        (REAL, :47-64)
   CRYSTAL_FORMED           → announcement post       (REAL, :66-79)
   FORUM_POST_ADDED         → knowledge generator     (REAL, :82-114)
```

## Layer 1 — UI (`src/components/ForumPanel/`)

**What exists (VERIFIED):**

- `ForumPanel.tsx` — shell: header + refresh button, left topics column, right thread column, heatmap, moderation queue.
- `TopicList.tsx` — topic create form (title + free-text category) + list rows (shows 📌 pin, category, postCount, score).
- `TopicView.tsx` — posts + consensus badge + `PostComposer`; hides no UI for `hidden` moderation.
- `PostComposer.tsx` — textarea (Ctrl/Cmd+Enter to submit).
- `AuthorBadge.tsx` — human/agent badge; agent resolves identity via `resolveAgentIdentity` + `AgentAvatar`.
- `ModerationQueue.tsx` — lists posts with `moderation.status !== 'normal'`; offers `warn` re-action only.
- `ForumHeatmap.tsx` — per-category activity bars derived from topic list.

**What's used (VERIFIED):** `listTopics`, `getThread`, `getConsensus`, `createTopic`, `postMessage`, `moderatePost`. (`ForumPanel.tsx:30-67`.)

**Exists-but-unused in UI (VERIFIED):**

- `votePost` — never called; no vote button exists.
- `subscribe` / `pinTopic` — `pinTopic` not called (pin shown read-only); `subscribe` never called.
- `forumService` symbol itself is **not exported** (see G1 in master map) → the whole panel's imports are unresolved.

**UI expects but backend lacks (VERIFIED):** nothing the UI calls is missing in backend; the UI simply never calls `votePost`/`subscribe`/`pinTopic`.

**Backend provides but UI hides (VERIFIED):** voting, pin control, subscribe, tag filter, category filter, pagination controls, edit/delete, reply, realtime. See `02`/`04`.

**State model (VERIFIED):** pure local `useState` (`ForumPanel.tsx:23-27`); re-fetched after every mutation (`refreshTopics`/`openThread`). No store, no `liveQuery`, no EventBus listener in UI. **No dedicated store file exists** (VERIFIED: `src/stores/` has no forum file).

## Layer 2 — Store (NONE)

VERIFIED: there is no `forumStore`. All state lives in `ForumPanel` component. Contrast with Director (`stores/directorStore.ts`) and Invocation (`stores/invocationStore.ts`) which have real Zustand stores. Forum is the only one of the three cognitive/async panels without a store.

## Layer 3 — Service (`forum-service.ts`)

VERIFIED method inventory (all 9 contract methods implemented):
`init`/`destroy` (`:51-58`, trivial lifecycle flag), `createTopic` (`:60`), `postMessage` (`:93`), `votePost` (`:149`), `subscribe` (`:195`), `listTopics` (`:209`), `getThread` (`:223`), `pinTopic` (`:237`), `moderatePost` (`:245`), `getConsensus` (`:262`).

**Used vs unused internals:** `enforceFloodBudget` (`:312`, used by `postMessage`), `renderBody` (`:325`, used), mappers (`:340-406`, used). No dead private methods. Full audit in `03`.

## Layer 4 — Repository (`forum-repository.ts`)

VERIFIED methods: `putTopic/getTopic/listTopics/putPost/getPost/listPosts/listPostsByAuthor/putVote/getVote/deleteVote/putSub/getSub/listSubs/clear`.

- **`listPostsByAuthor` (`:75-79`) is UNUSED by `ForumService`** — orphan method (VERIFIED: no caller in forum-service.ts).
- No `deleteTopic`, `deletePost`, `updateTopic`, `updatePost` — only put/get/list/clear (VERIFIED grep, no edit/delete methods anywhere in kernel).

## Layer 5 — Dexie v17 (`dexie-schema.ts:101-104, 532-535`)

Tables + indexes VERIFIED. `ForumTopicRecord` and `ForumPostRecord` each store **both flat columns AND a redundant nested full object** (`topic`/`post`) — see `03` ROOT CAUSE B. `forumSubs` table exists; `forumVotes` uses composite `[postId+voterId]` index.

## Layer 6 — EventBus (`event-registry.ts:1392-1417`)

Exactly **3** `forum:*` events (VERIFIED): `forum:topic:created`, `forum:post:added`, `forum:post:voted`. No `forum:consensus`, `forum:topic:subscribed`, `forum:topic:escalated-to-debate`. The brief's "4 events" is **false** (VERIFIED grep). `SYNTHESIS_EXPORTED_TO_FORUM` (`synthesis:exported-to-forum`, `:1344`) is emitted by Synthesis but **has no consumer** (VERIFIED grep: only emit site).

## Layer 7 — Other modules (bridges, phase18-forum.ts)

- Debate→case-study: REAL (`:47-64`).
- Crystal→announcement: REAL (`:66-79`).
- Forum question→knowledge generator: REAL (`:82-114`, `QUESTION_PATTERN` regex).
- Forum→Debate escalation: DEAD (never emitted; test `forum-service.test.ts:307`).
- Synthesis→Forum: DEAD (event emitted, no consumer).
- Invocation engine: `forum-topic` is a valid invocation context (`contracts/invocation.ts:17`) and debate mode exists (`phase21-invocation.ts`), but **not wired into ForumPanel** — separate RoomPanel flow.

## Cross-cutting (VERIFIED)

- Route: `forum` registered in `route-registry-content.ts:98` (KNOWLEDGE section, `nav.forum`, `experimental:true`); lazy import `ForumPanelLazy` (`route-imports.ts:167,349`).
- i18n: `forum.*` keys exist in `{en,ru}/analytics.ts:327-347` but cover only a subset (no keys for vote/tags/search/filter/pagination/edit/delete/status/mention/notification). VERIFIED.
- `currentAuthor` is hardcoded to one human (`ForumPanel.tsx:11-15`) — UI cannot post as an agent; agent posts appear only via bridges.
