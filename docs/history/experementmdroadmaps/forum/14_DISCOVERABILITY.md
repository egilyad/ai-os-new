# 14 — Discoverability: Can Users FIND the Forum? (RESEARCH-ONLY)

> Status: read-only deep-dive. No source modified. Tags: **VERIFIED** / **INFERRED** / **OPINION**.
> Question set: find the forum • find topics • find agent contributions • find consensus • find debate links.

---

## 1. Finding the Forum panel (entry points)

**VERIFIED — Primary entry: KNOWLEDGE nav section.** `route-registry-content.ts:97-104` registers `{ id:'forum', labelKey:'nav.forum', icon:Icons.messagesSquare, color:'#8b5cf6', lazy:true, experimental:true }` inside the KNOWLEDGE group (alongside lenses/crystals/junctions/synthesis/generator/builder/director). Lazy import wired at `route-imports.ts:349` (`forum: ForumPanelLazy`). So the forum is one click in the left nav, but flagged `experimental` (visual "experimental" tag), which may deter users.

**VERIFIED — Secondary entry: Service Registry panel.** `service-phases.ts:513` maps `forum: '/forum'` and `:333` lists `'forum'` as a phase — the ServiceRegistryPanel deep-links to `/forum`. Developer-facing only.

**VERIFIED — Tertiary entry (agentic): Builder + Room.** The Builder agent recognizes `forum` keyword (`builder-agent-service.ts:29`, `BuilderAISidebar.tsx:8`) and can emit `forum:topic:create` / `forum:post:created` (`builder-agent-service.ts:42,52`). `RoomPanel` "Where" picker includes `📋 Forum topic` (`RoomPanel.tsx:22`) → `context.type:'forum-topic'` invocation. So agents/users can _target_ the forum, but see §4 for whether those writes land.

**INFERRED — No global search / command palette surfaces the forum.** There is no app-wide search indexing forum topics (file `11_KNOWLEDGE_INTEGRATION.md §1`); the only way in is the nav route + the above deep-links.

---

## 2. Finding topics

**VERIFIED — Inside the panel: flat list, no search.** `TopicList.tsx:53-110` shows topics from `refreshTopics` (max 50, `ForumPanel.tsx:29-37`). **No search box, no category filter, no tag filter, no pagination** in the UI — the `TopicFilter` contract supports all four (`forum-types.ts:90-98`) but none is exposed. A user with many topics must scroll; topics beyond page 1 (50) are unreachable from the UI.

**VERIFIED — No inbound topic deep-links from other panels.** A crystal announcement post (`phase18-forum.ts:66-79`) or a debate case-study post (`phase18-forum.ts:48-64`) contains a plain-text id, but nothing renders it as a clickable link into Crystal Vault / Debate. So a user reading "Сформирован кристалл <id>" cannot click through. `renderBody` supports `[text](url)` links (`forum-service.ts:328-331`) but the bridges don't use them for internal refs.

---

## 3. Finding agent contributions

**VERIFIED — Agent authors are visible but rare.** `AuthorBadge.tsx:16-52` renders a distinct `◆` agent badge with avatar (via `resolveAgentIdentity`) + role. **But** the only agent that ever posts is `SYSTEM_AUTHOR` (`phase18-forum.ts:24`) — real topology agents never author posts (file `10 §2`, `13 §5`). So "agent contributions" in the forum today = system summaries only. A user cannot browse "all posts by Agent X" — there is no author-filter UI, though `listTopics({authorId})`/`listPostsByAuthor` exist backend (`forum-repository.ts:43,75-79`) and are unused in UI.

**INFERRED — `agentProvenance` is the discoverability hook that's hidden.** Posts by agents carry `traceId`/`modelId`/`tokensCost` (`forum-service.ts:121-129`), shown only as "{tok} tok" (`TopicView.tsx:43-46`). No "filter by agent" or "show agent's reasoning" affordance.

---

## 4. Finding consensus

**VERIFIED — Consensus is shown only inside an open topic, as a colored label.** `TopicView.tsx:104-116` shows `forum.consensus_{open|consensus|contested}`. The list view (`TopicList.tsx`) shows no consensus indicator — a user scanning the topic list cannot tell which threads reached consensus without opening each. The richer `summary`/`confidence` are discarded (`ForumPanel.tsx:43-44`, file `13 §1`).

**VERIFIED — No "consensus" entry from elsewhere.** `getConsensus` is only called from `ForumPanel.openThread`. No Debate/Knowledge panel links to a forum consensus. The dead escalation (`10 §4`) means a `contested` badge offers no path forward.

---

## 5. Finding debate links

**VERIFIED — Debate→Forum is one-way and non-clickable.** Debate verdicts become forum case-study posts (`phase18-forum.ts:48-64`), but the post body is free text ("Итог дебатов <sessionId>…") with no link back to the debate session. There is **no UI control** to start a debate from a forum thread (the `contested` verdict's own text says "requires a debate" but nothing acts on it). `useNavBadgeSubscriptions.ts:7` maps `DEBATE_VERDICT_GENERATED → ['debate']` only — the forum gets **no sidebar notification** when a debate it sparked concludes.

**VERIFIED — Forum→Debate escalation is absent** (`forum-service.test.ts:307` asserts no `forum:topic:escalated-to-debate`). So a user cannot discover a debate _from_ the forum at all.

---

## 6. Discoverability gaps (OPINION, prioritized)

| #   | Gap                                                    | Evidence                                                          | Fix (reuse-based)                                                          |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| D1  | Forum not reachable by search; topics beyond 50 hidden | `TopicList.tsx`, `forum-types.ts:90-98`                           | Expose `TopicFilter` (category/tag/page) in `TopicList`                    |
| D2  | No clickable links forum↔Crystal/Debate                | `phase18-forum.ts:48-79`, `renderBody` `forum-service.ts:328-331` | Embed `[text](/crystal?id)` / `[text](/debate?sessionId=)` in bridge posts |
| D3  | No consensus indicator in topic list                   | `TopicList.tsx:100-107`                                           | Add `getConsensus` status dot per row (cheap batch call)                   |
| D4  | No agent filter / "posts by agent"                     | `forum-repository.ts:43,75-79` unused in UI                       | Add author filter to `TopicList`                                           |
| D5  | Forum gets no nav badge on debate verdict              | `useNavBadgeSubscriptions.ts:7`                                   | Add `FORUM_POST_ADDED`/`DEBATE_VERDICT_GENERATED` → `['forum']` mapping    |
| D6  | `experimental` tag may hide it                         | `route-registry-content.ts:103`                                   | Promote once P0 (`13 §7`) fixed                                            |
| D7  | Dead `SYNTHESIS_EXPORTED_TO_FORUM` consumer            | `synthesis-engine-service.ts:230`, file `11 §3`                   | Revive consumer → announcement post                                        |
| D8  | Builder `forum:topic:create`/`post:created` emitters   | `builder-agent-service.ts:42,52`                                  | Verify a subscriber persists them (likely dead — INFERRED)                 |

**INFERRED — D8 is likely a dead wire:** `builder-agent-service.ts` declares `forum: 'forum:topic:create'` / `forum: 'forum:post:created'` as output events, but no subscriber in `phase18-forum.ts` or elsewhere listens for them (grep for `forum:topic:create`/`forum:post:created` → only the builder declaration). So a Builder workflow that "creates a forum topic" emits an event no handler turns into an actual `forumService.createTopic`/`postMessage`. This mirrors the dead `SYNTHESIS_EXPORTED_TO_FORUM` pattern.

---

## 7. What already works for discoverability (positives)

- Forum is a **first-class KNOWLEDGE nav item** (not buried) — `route-registry-content.ts:97`.
- **KnowledgeGenPanel** exposes a `forum-question` trigger (`TriggerConfig.tsx:14,30-47`) so a user can intentionally drive research from a forum topic id.
- **SynthesisPanel** has an "export to forum" button (`SynthesisPanel.tsx:57,205`) — intent to publish synthesis into the forum exists (consumer dead, D7).
- **RoomPanel** lets a user invoke an agent _into_ a forum topic (`RoomPanel.tsx:22`) — discoverable cross-entry.

---

## 8. N/A items

- **Global fuzzy search across forum + knowledge:** N/A (no search subsystem indexes forum).
- **Notification center / inbox for forum activity:** N/A (no store, no badge beyond D5 gap).
- **Topic-level shareable URLs:** the route is `/forum` only (no `/forum/:topicId` deep link) — N/A; a user cannot link a specific thread.

---

_Citations: route-registry-content.ts:97-104; route-imports.ts:349; service-phases.ts:333,513,634; ForumPanel.tsx:29-44; TopicList.tsx:53-110; TopicView.tsx:43-46,104-116; AuthorBadge.tsx:16-52; forum-repository.ts:43,75-79; forum-service.ts:48-79,121-129,328-331; phase18-forum.ts:24,48-79; forum-service.test.ts:307; forum-types.ts:90-98; useNavBadgeSubscriptions.ts:7; TriggerConfig.tsx:14,30-47; SynthesisPanel.tsx:57,205; RoomPanel.tsx:22; builder-agent-service.ts:29,42,52; synthesis-engine-service.ts:230._
