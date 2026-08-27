# 10 — Forum ↔ ConversationCore Integration (RESEARCH-ONLY)

> Status: read-only deep-dive. No source modified. All claims tagged **VERIFIED** (read from source, file:line cited), **INFERRED** (reasoned from code, not explicitly stated), or **OPINION** (recommendation/design view).
> Subsystem under study: Forum (`src/kernel/services/forum/forum-service.ts`, `src/kernel/dal/forum-repository.ts`, `src/kernel/types/forum-types.ts`, `src/kernel/contracts/forum.ts`) and its bridges (`src/kernel/service-registration/phase18-forum.ts`).
> Counterpart: ConversationCore = `ConversationDirectorService` + `ConversationOrchestrator` + `HybridPolicy` + `ChatExecutionEngine` (B3/B4), driven through `scenarioRepository` (`src/kernel/dal/scenario-repository.ts`).

---

## 1. Can forum topics/posts feed ConversationCore sessions?

**VERIFIED — No first-class feed path exists.** There is no code anywhere in `src/kernel/services/conversation/**` that imports, requires, or reads from Forum (`grep -r "forum" src/kernel/services/conversation/**` → 0 matches). ConversationCore is driven exclusively by `ConversationScenario` (`src/kernel/contracts/conversation/scenario.ts`) + `TurnProposal` objects. A forum topic is never converted into a `ConversationScenario` automatically.

**VERIFIED — The ONLY indirect path is the Invocation Engine, and it is shallow.** When a human invokes an agent with `context.type: 'forum-topic'` (contract: `src/kernel/contracts/invocation.ts:17`; event payload `event-registry.ts:1431`), the `InvocationExecutionDelegate.start()` handler (`src/kernel/service-registration/phase21-invocation.ts:68-109`) does the following:

- `mode === 'debate'` → `debateService.startDebate(context.ref, …)` — the forum topic id is passed only as the **debate title** (line 77 `context.ref || 'Invocation-triggered debate'`), and a _new Debate session_ is created. Nothing is posted back to the forum, and the forum post **bodies are never read**.
- `mode === 'chat' | 'director-scenario'` → a `ScenarioRepository.create({ topic: context.ref, … })` is built (lines 89-105) and `director.loadScenario`+`run()` (106-107). Again, `context.ref` (the forum topic id) is used only as the scenario **name/description label**; the forum thread content (posts) is not ingested.

So a "forum-topic" invocation spins up a _separate_ ConversationCore/Debate session labelled with the forum topic id — it does **NOT** stream the existing forum discussion into the conversation, nor write the agent's answer back as a forum post.

**INFERRED — Forum→ConversationCore data coupling = label-only.** `topicId` flows as a string title/label through `context.ref`; no `forumService.getThread(topicId)` call exists in the invocation delegate, so none of the actual claims/evidence/disagreements in the forum thread are available to the agent. The agent effectively "reasons from scratch" about a topic it only knows by id.

**OPINION — This is a missed opportunity, not a bug.** The label-only bridge means the richest asset of the Forum (accumulated threaded argument + votes + `agentProvenance`) is invisible to the runtime that could act on it. A reuse-based fix needs no new event system.

---

## 2. Can ConversationCore agents post to the forum?

**VERIFIED — No.** Automated forum posting is gated to a single hardcoded `SYSTEM_AUTHOR` (`src/kernel/service-registration/phase18-forum.ts:24`: `{ kind:'agent', id:'system', displayName:'Система' }`). The two automated posters are:

- `DEBATE_VERDICT_GENERATED` → `forum.postMessage(topicId, SYSTEM_AUTHOR, …)` (lines 48-64),
- `CRYSTAL_FORMED` → `forum.postMessage(topicId, SYSTEM_AUTHOR, …)` (lines 66-79).

No `ConversationDirectorService` / `ConversationOrchestrator` / `ChatExecutionEngine` code path ever calls `forumService.postMessage` with an agent identity resolved from a runtime participant. `forum-service.ts` accepts an arbitrary `ForumAuthor` (`postMessage(topicId, author, body)` — `forum-service.ts:93`), so the _capability_ exists at the service boundary, but **no runtime wires it up**.

**VERIFIED — `agentProvenance` is fabricated for agent authors, but humans are the only real authors in practice.** `forum-service.ts:121-129` populates `agentProvenance` (traceId/modelId/roleId/tokensCost) for any post whose `author.kind === 'agent'`. Because only `SYSTEM_AUTHOR` posts as an agent today, every "agent" post in the forum is a system summary, not an attributable agent contribution. Real topology agents (e.g. `System Architect`) never author forum posts.

**INFERRED — There is no "agent→forum" write contract anywhere.** The `IForumService` interface (`src/kernel/contracts/forum.ts:24-51`) exposes `postMessage` to any caller, but the only callers are `ForumPanel`, `phase18-forum` bridge, and tests. No Cognitive/Conversation/Debate service holds a `forumService` reference for writing.

---

## 3. Bridges that exist today (verified inventory)

| Direction                | Mechanism                                                                                                                              | Writes to forum? | Reads forum?        | Status                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------- | ---------------------------- |
| Debate → Forum           | `phase18-forum.ts:48-64` (`DEBATE_VERDICT_GENERATED` → case-study post by SYSTEM)                                                      | ✅ SYSTEM post   | ❌                  | VERIFIED working             |
| Crystal → Forum          | `phase18-forum.ts:66-79` (`CRYSTAL_FORMED` → announcement post by SYSTEM)                                                              | ✅ SYSTEM post   | ❌                  | VERIFIED working             |
| Forum → Knowledge        | `phase18-forum.ts:82-113` (`FORUM_POST_ADDED` + question regex → `knowledgeGen.generateFromTrigger({kind:'forum-question', topicId})`) | ❌               | ✅ (only `topicId`) | VERIFIED working but shallow |
| Forum → Debate           | —                                                                                                                                      | —                | —                   | **DEAD** (see §4)            |
| Forum → ConversationCore | only via Invocation `forum-topic` context (label-only)                                                                                 | ❌               | ❌ (no body ingest) | VERIFIED shallow             |
| ConversationCore → Forum | —                                                                                                                                      | —                | —                   | **NONE**                     |

---

## 4. Forum → Debate escalation is DEAD (confirmed)

**VERIFIED — The contract comment promises escalation, but no code delivers it.** `src/kernel/contracts/forum.ts:22` ("a lightweight consensus check can escalate contested threads to a debate") and `forum-types.ts:112` ("Lightweight consensus verdict for a thread (drives debate escalation)") describe escalation. `ForumService.getConsensus()` (`forum-service.ts:262-308`) returns `status: 'contested'` with summary text "требуется дебат" — but **no subscriber translates that into a debate**. The test `forum-service.test.ts:297-307` explicitly asserts `events` does NOT contain `'forum:topic:escalated-to-debate'`, confirming the absence. `event-registry.ts` has no `FORUM_TOPIC_ESCALATED_TO_DEBATE` event at all (the only `forum:*` events are `topic:created`/`post:added`/`post:voted` at lines 1392-1417).

**OPINION — The dead escalation is the single biggest narrative gap.** A "contested" forum thread that literally says "requires a debate" but can never start one is a broken promise. The Invocation Engine already knows how to start a debate from a context ref (`phase21-invocation.ts:75-87`); the fix is a one-direction bridge: subscribe to a (currently absent) `FORUM_CONSENSUS_CONTESTED` event or poll `getConsensus`, then call `invocationEngineService.invoke({ target:{…}, context:{type:'forum-topic', ref: topicId}, constraints:{mode:'debate'} })`. This reuses existing machinery — no new runtime.

---

## 5. Reuse-based options (OPINION, no new systems)

1. **Ingest forum thread into a Scenario (read path).** Add a bridge `FORUM_CONSENSUS_*` (or a manual "Debate this thread" button in `TopicView`) that calls `forumService.getThread(topicId)`, maps each post → a `TurnProposal` with `participantId = post.author.id` and `objective.description = post.body`, then `scenarioRepository.create(...)` + `director.run()`. Reuses `ConversationScenario`/`TurnProposal` verbatim (`src/kernel/contracts/conversation/scenario.ts`, `turn.ts`). No new event system needed — `TopicView.tsx` already has a compose slot and a consensus badge to host the button.
2. **Write agent answers back to forum (write path).** After a ConversationCore/Debate session that was invoked with `context.type:'forum-topic'`, have `InvocationExecutionDelegate` subscribe to the session's completion and `forumService.postMessage(topicId, <resolved agent author>, summary)`. `agentProvenance` is already auto-populated (`forum-service.ts:121-129`). This closes the loop that today is label-only.
3. **Make `forum-topic` context real.** In `phase21-invocation.ts:89-105`, replace `topic: context.ref` with `topic: <first post body or topic.title>` and prepend the thread's top-voted posts as `TurnProposal` seed context. This upgrades the label-only bridge to an informed one with a 10-line change.
4. **Revive dead escalation (§4).** Add `FORUM_TOPIC_ESCALATED_TO_DEBATE` to `event-registry.ts`, emit it from `getConsensus` when `status==='contested'`, and subscribe in `phase18`/`phase21` to `invocationEngineService.invoke({context:{type:'forum-topic',ref}, constraints:{mode:'debate'}})`.

---

## 6. What is explicitly N/A here

- **Forum→ConversationCore automatic sync:** N/A as a feature (no code, no event). Only the manual Invocation path exists.
- **Agent-authored forum posts outside SYSTEM_AUTHOR:** N/A today (no writer). Capability exists at `IForumService.postMessage`.
- **Realtime cross-posting:** N/A — there is no forum store (Zustand); `ForumPanel.tsx` calls `forumService` directly and only re-renders on explicit user actions (refresh button `ForumPanel.tsx:91-104`, `openThread`). See `13_USER_EXPERIENCE.md` / `14_DISCOVERABILITY.md`.

---

_Citations: forum-service.ts:93,121-129,262-308; forum-types.ts:112; contracts/forum.ts:22; phase18-forum.ts:24,48-113; phase21-invocation.ts:68-109,17; event-registry.ts:1392-1417,1431; route may be cross-checked in 14_DISCOVERABILITY.md._
