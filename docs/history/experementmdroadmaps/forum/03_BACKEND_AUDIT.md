# 03 — BACKEND AUDIT (ForumService / ForumRepository)

> Grouped by **ROOT CAUSE**, not just a bug list. VERIFIED = read source. INFERRED = implied.
> file:line cited. Read-only; no source modified.

## ROOT CAUSE A — Forum is unreachable from the app (binding gap)

**A1. `forumService` is never exported from the instances barrel.**

- `ForumPanel.tsx:4` does `import { forumService } from '../../kernel/instances'`.
- No `export const forumService` exists anywhere in `src` (VERIFIED grep across `src`). No `lazyService('forumService')` in `services-extras.ts` (contrast: `conversationDirector` at `services-extras.ts:173`, `invocationEngine` at `:71`).
- The container registers it (`phase18-forum.ts:32` `register('forumService', …)`) but nothing re-exports the resolved value to the UI.
- **Impact (INFERRED):** ForumPanel would throw at runtime (`forumService` undefined) or fail `tsc`. Either way the panel is non-functional. This is the single highest-severity backend-side defect even though it lives at the wiring boundary.
- **Fix (OPINION):** add `export const forumService = lazyService<IForumService>('forumService')` to `services-extras.ts`, mirroring `conversationDirector`.

## ROOT CAUSE B — Denormalized / duplicated state in Dexie records

**B1. `ForumTopicRecord.topic` is a redundant full copy of the flat fields.** (`forum-types.ts:121-135`; `forum-service.ts:373-388` `saveTopic` writes both the 11 flat columns AND `topic: {...}`). `Topic` (`:64-77`) is structurally identical to the flat columns, so the nested object is pure duplication.
**B2. `ForumPostRecord.post` is the same redundancy.** (`forum-types.ts:137-152`; `forum-service.ts:390-406` `toPostRecord`).

- **Risk (INFERRED):** two sources of truth per row. Any future code path that updates one shape and not the other desyncs reads (`getTopic`/`getPost` return flat columns; mappers `toTopic`/`toPost` read flat columns, so the nested object is currently write-only dead weight — but it bloats storage and invites future bugs).
- **Fix (OPINION):** drop `topic?`/`post?` from the records; mappers already only read flat fields.

## ROOT CAUSE C — Contract over-promises vs implementation

**C1. Threading is advertised but absent.** `contracts/forum.ts:27` — "`postMessage` … (threaded when `parentId` is set)". Real `postMessage` signature (`forum-service.ts:93`) has **no `parentId`**; `parentId` is only copied in mappers (`:363,397`). No caller ever sets it.
**C2. Debate escalation is advertised but absent.** `contracts/forum.ts:22` — "consensus check can escalate contested threads to a debate". `getConsensus` (`:262-308`) computes `contested` but **never emits** any escalation event; test asserts `forum:topic:escalated-to-debate` is absent (`forum-service.test.ts:297-308`).

- **Impact (VERIFIED):** two contract-level capabilities are fiction. Consumers reading the interface will write code expecting threading/escalation that silently does nothing.
- **Fix (OPINION):** either implement (add `parentId` param + tree render; emit escalation → `debateService`) or soften the contract comments.

## ROOT CAUSE D — Dead / orphan code

**D1. `ForumRepository.listPostsByAuthor` (`:75-79`) has no caller** in `ForumService` (VERIFIED grep of `forum-service.ts`). Orphan DAL method.
**D2. `SYNTHESIS_EXPORTED_TO_FORUM` event is emitted (`synthesis-engine-service.ts:230`) but has zero subscribers** (VERIFIED grep: only definition + emit). One-way dead event.
**D3. `subscribe` emits no event** (`forum-service.ts:195-207`; no `FORUM_SUBSCRIBED` in `event-registry.ts`). Subscription is silently persisted, invisible to the rest of the system.
**D4. `init`/`destroy` are no-ops** (`:51-58`) — lifecycle flag only; `ILifecycle` is satisfied but provides no real setup/teardown.

- **Fix (OPINION):** remove D1 if unused; decide D2/D3 (consume or delete).

## ROOT CAUSE E — Moderation semantics are incoherent

**E1. `moderatePost(action:'warn')` sets `moderation.status:'normal'`** (`forum-service.ts:253-258` — warn maps to `status:'normal'`, only `action:'warn'`). `ModerationQueue` filters `status !== 'normal'` (`ModerationQueue.tsx:15`), so a warned post **never appears** in the queue and shows no visual change in the thread. Net: `warn` is a no-op.
**E2. `hidden` posts are not filtered from the thread.** `getThread` filters only `status === 'removed'` (`:229-233`); `hidden` posts still render with no distinction (`TopicView.tsx` renders every post). So "hide" has no user-visible effect either.

- **Fix (OPINION):** make `warn`/`hide` produce visible state (queue entry + thread styling), or remove the actions.

## ROOT CAUSE F — Incomplete lifecycle / missing mutations

**F1. No topic status transitions in the API.** `Topic.status` (`'open'|'closed'|'archived'`, `forum-types.ts:62`) exists, and `postMessage` rejects `closed`/`archived` (`:104-106`), but there is **no `closeTopic`/`archiveTopic`/`setTopicStatus` method** (VERIFIED grep, no such methods in kernel). Tests reach `archived` only by raw DB update (`forum-service.test.ts:176`).
**F2. No edit/delete for topics or posts.** `editedAt`/`score` columns exist but no `editTopic`/`editPost`/`deleteTopic`/`deletePost` (VERIFIED grep). Forum is append-only + moderate-only.

- **Fix (OPINION):** add lifecycle methods if closing/archiving/editing is a product requirement; otherwise document Forum as append+moderate only.

## ROOT CAUSE G — Concurrency / performance smells

**G1. `votePost` is non-transactional across post + topic score.** Reads post, computes delta, then `putPost` + `putTopic` separately (`:174-185`). Concurrent votes on the same post can interleave and lose score updates (Dexie is async; no `ITransaction` used here despite `_tx?` param on `postMessage` only).
**G2. `enforceFloodBudget` loads ALL posts in the topic** (`listPosts(topicId)` returns every row, `forum-repository.ts:61-73`) then filters by time window (`:315-317`). O(n) per post; degrades on high-volume topics. Budget is per-author-per-topic (not global), which may be too narrow.
**G3. `listTopics` loads all rows then filters/sorts in JS** (`forum-repository.ts:41-48`) — fine at forum scale, but pagination is done in-memory after `toArray()`, not at the DB level.

## ROOT CAUSE H — Validation / safety

**H1. Minimal input validation.** `createTopic` checks only non-empty title (`:61-62`); no category normalization, tag limits, or author presence check. `postMessage` checks empty body + topic status (`:99-106`). No length cap, no rate-limit beyond flood budget.
**H2. `renderBody` HTML injection is escaped but relies on string replace** (`forum-service.ts:325-336`): `<`/`>`/`&` escaped first (so raw `<script>` is neutralized — safe), then URL/markdown substitution. `dangerouslySetInnerHTML` in `TopicView.tsx:69` is therefore safe for current code, but the escaping is hand-rolled (fragile if extended). URL substitution requires `https?://` so `javascript:` links are blocked (VERIFIED regex `:329`).
**H3. `agentProvenance.tokensCost` is a fake heuristic** (`40 + ceil(len/4)`, `:127`) — not a real token count. Cosmetic only.

## ROOT CAUSE I — Event model gaps

**I1. Only 3 `forum:*` events** (`event-registry.ts:1392-1417`); brief's "4" is false. No `forum:consensus`, `forum:topic:subscribed`, `forum:topic:escalated-to-debate`.
**I2. Consensus is computed but never broadcast** — consumers (e.g. a future escalation UI, or `directorStore`-style observers) cannot react to consensus changes.
**I3. `forum:post:added` drives the generator bridge but the bridge skips `authorId === 'system'`** (`phase18-forum.ts:86`) — intended, but means system/bridge posts never trigger knowledge generation (correct, just note the coupling).

## Prioritized backend fixes (OPINION)

1. **A1** — export `forumService` (blocks everything).
2. **C1/C2** — reconcile contract with reality (threading, escalation).
3. **E1/E2** — make moderation meaningful.
4. **B1/B2** — drop duplicated nested objects.
5. **F1/F2** — decide topic/post lifecycle.
6. **D2/D3/I1/I2** — close event gaps or remove dead events.
7. **G1/G2** — harden vote/flood under concurrency/scale.
