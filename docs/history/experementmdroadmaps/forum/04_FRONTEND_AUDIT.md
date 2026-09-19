# 04 — FRONTEND AUDIT (ForumPanel + children)

> VERIFIED = read source. INFERRED = implied. file:line cited. Read-only.
> Explicit BACKEND-EXISTS→UI-MISSING and UI-EXISTS→BACKEND-MISSING matrices at the end.

## 1. Component inventory & responsibilities (VERIFIED)

- `ForumPanel.tsx` — shell + state owner. `currentAuthor` hardcoded human `local-user` (`:11-15`). Calls `forumService.*` (`:30-67`). Manual `refreshTopics` (`:29-37`) + `openThread` refetch (`:39-45`). No store, no `liveQuery`, no EventBus listener.
- `TopicList.tsx` — create form (title + free-text category) + rows. Shows 📌, category, postCount, score. No tag input, no category filter, no search, no sort, no pagination.
- `TopicView.tsx` — posts + consensus badge + `PostComposer`. Renders `renderedHtml` via `dangerouslySetInnerHTML` (`:69`). Hide/remove buttons per post (`:51-64`). **No vote button, no reply button, no pin control, no edit/delete.**
- `PostComposer.tsx` — textarea; Ctrl/Cmd+Enter submits. No markdown preview, no mention support.
- `AuthorBadge.tsx` — human/agent badge; agent resolves identity (`resolveAgentIdentity`) + `AgentAvatar`.
- `ModerationQueue.tsx` — lists `moderation.status !== 'normal'` posts; offers `warn` re-action only. Hidden/removed posts shown but never un-hidden.
- `ForumHeatmap.tsx` — per-category bars from topic list counts.

## 2. UX / navigation (VERIFIED)

- Single-screen split view (topics left, thread right). No routing within forum (no per-topic URL). Refresh is manual (↻ button, `ForumPanel.tsx:91`).
- No breadcrumbs, no "back" — selecting a topic just swaps the right pane.
- Discovery: topics are listed newest-activity-first (backend sort). No search/filter means discovery degrades as topic count grows.
- **Empty states exist**: `no_topics` (`TopicList.tsx:87-98`), `select_topic` (`TopicView.tsx:81-93`), `no_posts` (`:122-133`), `no_activity` (`ForumHeatmap.tsx:13-17`). ✅ good.
- **Loading states: NONE.** All async calls (`listTopics`/`getThread`/`getConsensus`) have no spinner/skeleton; UI just blanks until resolved (INFERRED from absence of any loading flag in `ForumPanel.tsx:23-45`).
- **Error states: NONE.** `handleCreate`/`handleCompose`/`handleModerate` (`ForumPanel.tsx:52-69`) `await` without try/catch; a thrown `forumService` error (e.g. flood budget, archived topic) would crash the component / surface as an unhandled rejection. No user-facing error toast.

## 3. Realtime / stale state (VERIFIED)

- No `liveQuery`, no EventBus subscription. After an agent posts via a bridge (debate/crystal), the UI updates **only on manual refresh or when the user re-opens the thread** (`ForumPanel.tsx:91` / `:39`). So agent-authored content is invisible until the human refreshes. Stale-by-design.
- `consensus` is fetched once on `openThread` (`:43-44`); does not refresh as votes arrive.

## 4. Pagination / search / filtering (VERIFIED)

- UI requests `page:0, pageSize:50` (`ForumPanel.tsx:30`). No pager UI; topics beyond 50 are unreachable. Backend supports pagination (`:209-221`) but UI doesn't expose it → **BACKEND-EXISTS→UI-MISSING**.
- No search box (backend has none either → both missing).
- No category/tag/status filter UI (backend supports all three → **BACKEND-EXISTS→UI-MISSING**).

## 5. Moderation UX (VERIFIED)

- Hide/remove buttons present (`TopicView.tsx:51-64`) and functional (post `hide`/`remove`).
- `warn` button exists only in `ModerationQueue` (`:51-62`) and is a **no-op**: `moderatePost('warn')` sets `status:'normal'` (`forum-service.ts:253-258`), queue filters `!== 'normal'` (`ModerationQueue.tsx:15`) → warned post vanishes from the queue and shows no change in thread. Confusing UX.
- `hidden` posts still render in thread (backend `getThread` keeps `hidden`, `forum-service.ts:229-233`; `TopicView` renders all) with no visual marker → "hide" looks broken.
- No moderator role gate — any viewer can hide/remove any post (`ForumPanel.tsx:65-69` calls `moderatePost` unconditionally). No permission model (backend also has none).

## 6. Topic / post creation UX (VERIFIED)

- Topic create: title + free-text category only (`TopicList.tsx:67-84`). No tags, no body (so opening post never created despite backend supporting `input.body`, `ForumPanel.tsx:53` omits it → **BACKEND-EXISTS→UI-MISSING** for opening post).
- Post create: plain textarea (`PostComposer.tsx`). Markdown rendered on read (`renderBody`), but no preview, no toolbar.
- **No reply UI** despite `parentId` column existing → user cannot reply to a specific post, only append to topic.

## 7. Voting / consensus / agent interaction UX (VERIFIED)

- **Voting: zero UI.** `TopicView.tsx:48` shows `post.score` as text only. No up/down control though `votePost` is fully implemented → **BACKEND-EXISTS→UI-MISSING (major)**.
- Consensus: badge shown (`TopicView.tsx:104-116`) with color + i18n label. No action (no "escalate to debate" button) even when `contested` → matches dead backend escalation.
- Agent interaction: agents appear via `AuthorBadge` (identity-resolved) and `agentProvenance.tokensCost` shown (`TopicView.tsx:43-47`). But the human **cannot post as an agent** (`currentAuthor` hardcoded, `ForumPanel.tsx:11`); agent posts arrive only via bridges. No @mention, no agent picker.

## 8. Info hierarchy / discoverability (VERIFIED/OPINION)

- Left pane mixes topic list + heatmap with no section divider beyond a label (`ForumPanel.tsx:123-128`). Heatmap is a weak "analytics" surrogate.
- Score/pin/category are present but pin is read-only and score is non-interactive (no vote). Visual emphasis is thin.
- Moderation queue is squashed at the bottom of the thread pane (`ForumPanel.tsx:139-144`), easy to miss.

## 9. Explicit mismatch matrices

### BACKEND-EXISTS → UI-MISSING (VERIFIED)

| Backend capability                                 | Evidence                    | UI gap                                                       |
| -------------------------------------------------- | --------------------------- | ------------------------------------------------------------ |
| `votePost` (up/down + aggregate)                   | `forum-service.ts:149-193`  | No vote control anywhere (`TopicView.tsx` shows score only)  |
| `pinTopic`                                         | `:237-243`                  | Pin shown (📌) but no pin/unpin control (`TopicList.tsx:29`) |
| `subscribe`                                        | `:195-207`                  | Never called; no subscribe UI                                |
| `listTopics` pagination                            | `:209-221`                  | UI fetches page 0/50, no pager (`ForumPanel.tsx:30`)         |
| `listTopics` filter (category/authorId/status/tag) | `forum-repository.ts:34-49` | No filter UI; tags never set on create                       |
| `createTopic` `tags` + `body`                      | `forum-service.ts:60-91`    | `handleCreate` sends neither (`ForumPanel.tsx:53`)           |
| `agentProvenance` (agent posts)                    | `:121-129`                  | Read-only; no human-as-agent posting                         |
| Consensus `contested` → escalate                   | `:300-302`                  | No escalate button; escalation event dead                    |

### UI-EXISTS → BACKEND-MISSING (VERIFIED)

| UI surface                                               | Evidence                    | Backend gap                                                                                                |
| -------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| None significant. The UI only calls implemented methods. | `ForumPanel.tsx:30-67`      | —                                                                                                          |
| `warn` moderation button (UI)                            | `ModerationQueue.tsx:51-62` | `warn` is a no-op in backend (`forum-service.ts:253-258`) — backend "exists" but is incoherent, not absent |
| Consensus badge (UI)                                     | `TopicView.tsx:104-116`     | Backend computes but never emits/acts (no escalation)                                                      |

> Net: the UI is **conservative** (it only invokes real methods) but **under-exposes** the backend. The only "UI-exists→backend-missing" case is the `warn` action, which is a backend semantic bug, not a missing method.

## 10. Prioritized frontend fixes (OPINION)

1. **Unblock** — fix A1 (`forumService` export) before any UI work is observable.
2. **Vote + pin + tag controls** — backend ready; add buttons/inputs (closes 4 of the ⚠️ rows in `02`).
3. **Pagination + filters + search** — at least pagination + category/tag filter.
4. **Realtime** — add a Forum store (`liveQuery`/`EventBus`) like `directorStore`/`invocationStore`; auto-refresh on bridge posts.
5. **Loading/error states** — wrap async handlers in try/catch + skeletons.
6. **Moderation coherence** — make `warn`/`hide` visible; add role gate.
7. **Reply threading** — only after backend adds `parentId` (see `03` C1).
8. **Opening post + human-as-agent authoring** — wire `body` into `handleCreate`; consider an author picker.
