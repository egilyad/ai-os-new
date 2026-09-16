# 11 — Forum as Knowledge Source (RESEARCH-ONLY)

> Status: read-only deep-dive. No source modified. Tags: **VERIFIED** / **INFERRED** / **OPINION**.
> Knowledge subsystem counterparts: Knowledge Generator (`src/kernel/services/knowledge-generator/knowledge-generator-service.ts`, phase17), Crystal Vault (`src/kernel/services/crystal-vault/*`, phase14), Synthesis (`src/kernel/services/synthesis/*`, phase16), Junction (`phase15`).

---

## 1. Does the Forum have search / indexing?

**VERIFIED — No search, no indexing, no full-text capability.** `ForumRepository` (`src/kernel/dal/forum-repository.ts`) exposes only `putTopic/getTopic/listTopics/putPost/getPost/listPosts/listPostsByAuthor/putVote/getVote/deleteVote/putSub/getSub/listSubs/clear`. `listTopics` (lines 34-49) filters by exact `category | authorId | status | tag` and sorts by `lastActivityAt`. There is **no** `search()` method, no `LIKE`/`contains` query, no FTS index. Dexie indexes (`src/kernel/services/dexie-schema.ts:532-535`): `forumTopics:'id, category, authorId, lastActivityAt, pinned, *tags'` — the `*tags` multi-entry index supports tag equality only, not substring.

**VERIFIED — `IForumService` contract has no search method.** `src/kernel/contracts/forum.ts:24-51` lists 9 methods, none is `search`/`query`/`find`. The UI therefore cannot offer search even if desired: `TopicList.tsx` only filters client-side by the already-loaded array (no server query), and `ForumPanel.refreshTopics` (`ForumPanel.tsx:29-37`) loads a flat `pageSize:50` slice with no query param.

**INFERRED — Forum is invisible to the rest of the knowledge graph.** Because there is no search and no `knowledge:*`/cognitive event emitted by forum posts, the Crystal Vault, Junction detector, Synthesis, and Lenses have **zero** read access to forum content. The Forum is a knowledge _sink_ (it receives announcements) but not a traversable _source_.

---

## 2. Topic references, knowledge links, citations, historical discussion

**VERIFIED — No topic→knowledge cross-references are stored.** `Topic` (`forum-types.ts:64-77`) and `ForumPostRecord` (`:137-152`) carry no `crystalId`/`synthesisId`/`debateSessionId`/`sourceRef` field. A forum post can mention a crystal via free text (the `CRYSTAL_FORMED` bridge writes `"Сформирован кристалл {id}: {statement}"` — `phase18-forum.ts:70-74`), but that id is **plain text inside `body`**, not a structured link. There is no "this post cites crystal X" relation.

**VERIFIED — History is persisted but linear only.** `getThread(topicId)` (`forum-service.ts:223-235`) returns `{ topic, posts }` ordered by `createdAt`. `parentId` exists on `Post` (`forum-types.ts:51`) and on the Dexie record (`:143`), and `postMessage` accepts a `parentId` parameter in the contract (`contracts/forum.ts:27-33`) — but **no caller ever sets `parentId`**. `ForumPanel` / `PostComposer` / `TopicView` never pass it; every post is flat. So threading/nesting is schema-supported but unused → "historical discussion" is a flat chronological list, not a reply tree.

**INFERRED — Citations are impossible to render.** `renderBody` (`forum-service.ts:325-336`) supports `[text](url)` markdown links and `**bold**`/`*em*`/`` `code` `` but no `[[crystal:id]]` or `@agent` token resolution. A post referencing a crystal cannot deep-link into Crystal Vault.

---

## 3. Export

**VERIFIED — No export facility.** `IForumService` has no `export`/`serialize`/`toMarkdown`. The only outbound motion is _event emission_ (`FORUM_POST_ADDED`, `FORUM_TOPIC_CREATED`, `FORUM_POST_VOTED` — `event-registry.ts:1392-1417`), consumed by the generator bridge and (for `post:added`) nothing else. There is no "export thread to markdown / to crystal / to synthesis" action in the UI.

**VERIFIED — Synthesis→Forum emit is a DEAD wire.** `synthesis-engine-service.ts:230` emits `SYNTHESIS_EXPORTED_TO_FORUM` (`event-registry.ts:1344-1351`), but a repo-wide grep for subscribers finds **none** (only the emit + registry + one test). No handler posts the synthesis statement into a forum topic. So the "export to forum" path promised by Synthesis exists as an emitted event with no consumer — equivalent to `cognitive:decision:made` (dead-at-consumer, confirmed in AGENTS context).

---

## 4. Analytics

**VERIFIED — Minimal, category-level only.** `ForumHeatmap` (`ForumHeatmap.tsx`) aggregates `postCount` per category on the client (`ForumPanel.tsx:32-36`) and renders bars. There is no per-agent analytics, no consensus-distribution analytics, no time-series, no "most-cited post" metric. `getConsensus` (`forum-service.ts:262-308`) is the only analytical computation and it is heuristic (vote balance + post count + author diversity, thresholds hardcoded).

---

## 5. Forum → Knowledge (existing, reuse-based)

**VERIFIED — Working but shallow.** `phase18-forum.ts:82-113` (`wireForumToGeneratorBridge`): on `FORUM_POST_ADDED`, skip `authorId==='system'`, load the thread, test `QUESTION_PATTERN` (`/(?$|вопрос|как |почему |что |…)/i` — line 26-27) against `post.body`; if matched, call `knowledgeGen.generateFromTrigger({ kind:'forum-question', topicId })`.

**VERIFIED — The trigger ingests only the topic id, not the post content.** `knowledge-generator-service.ts:442-456` `topicOf()` for `forum-question` returns the literal string `` `Исследование вопроса форума ${trigger.topicId}` `` (line 450-451). It never calls `forumService.getThread(topicId)` to read the actual question or the surrounding discussion. The generated job's `topic` is the forum id, not the human's question text. **This is the hidden capability gap**: the bridge fires, but the Knowledge Generator researches a topic string that is just the forum topic id — it cannot see what was actually asked.

**OPINION — Hidden capability = the forum is a question-intake funnel that discards the question.** The regex gating means only posts containing Russian question words trigger research, and even then the research topic is wrong (id not text). A 2-line fix in `knowledge-generator-service.ts:450` to fetch `forumService.getThread(topicId)` and use the matched post body as `topic` would turn a decorative bridge into a real "ask the forum → agents research it" loop.

**VERIFIED — Crystal→Forum is the only rich inbound knowledge flow.** `CRYSTAL_FORMED` → announcement post (`phase18-forum.ts:66-79`). This is one-directional (knowledge→forum) and works.

---

## 6. Knowledge → Forum (proposed, reuse-based — OPINION, no new systems)

1. **Consume the dead synthesis wire.** In `phase18-forum.ts` add `eventBus.onSafe(EVENTS.SYNTHESIS_EXPORTED_TO_FORUM, …)` that calls `forumService.postMessage(targetTopic, SYSTEM_AUTHOR, statement)` — reuse the same `ensureTopic(forum,'announcements',…)` pattern already used for crystals (lines 116-119). This revives `synthesis:exported-to-forum` with ~6 lines.
2. **Make crystal announcements linkable.** Extend `ForumPostRecord` (or just the `body` template) to embed `crystalId` and render it; reuse `renderBody`'s link syntax so a crystal announcement deep-links to Crystal Vault. Schema change is additive (Dexie v17→v18 safe, mirroring prior additive version bumps).
3. **Deep forum→crystal ingestion.** Add a `forum-question`-derived job that actually reads the thread (fix §5) and passes top posts as `evidence` to the generator; the generator already crystallizes at `confidence ≥ threshold` (`knowledge-generator-service.ts` crystallization step). No new runtime.
4. **Junction/Synthesis read forum as a corpus.** Expose a read-only `forumService.getThread` to `JunctionEngine`/`SynthesisEngine` so a contested forum thread can be auto-fed as a `synthesis` input. Reuses `IForumService.getThread` — no new contract.

---

## 7. N/A items

- **Forum full-text search:** N/A (no implementation; could be added via Dexie `.filter`/`*tags` but not present).
- **Structured citations / knowledge links:** N/A (free-text only).
- **Consumption of `SYNTHESIS_EXPORTED_TO_FORUM`:** N/A (dead event, no subscriber).
- **Threaded replies:** N/A in practice (`parentId` supported in schema but never set by any writer).

---

_Citations: forum-repository.ts:34-49,75; forum-service.ts:223-235,262-308,325-336; forum-types.ts:51,64-77,112-152; contracts/forum.ts:24-51; dexie-schema.ts:532-535; phase18-forum.ts:24-119; knowledge-generator-service.ts:442-456; synthesis-engine-service.ts:230; event-registry.ts:1344-1351,1392-1417; ForumPanel.tsx:29-37; ForumHeatmap.tsx; TopicList.tsx._
