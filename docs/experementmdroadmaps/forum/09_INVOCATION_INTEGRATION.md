# 09 — Invocation Integration (Forum ↔ Invocation Engine)

> Research-only. Tags: **[VERIFIED]** (file:line), **[INFERRED]**, **[OPINION]**.
> Scope guard: **do NOT expand the Invocation Engine.** This file only identifies what is
> possible via the _existing_ contract (`contracts/invocation.ts`, `phase21-invocation.ts`,
> `AgentResolverDirectory`). Verifies whether any **forum→invocation** hook exists today.

## 1. Existing Invocation contract surface (verified, not changed)

- `InvocationContext` **already includes** `{ type: 'forum-topic'; ref: string }`
  (`contracts/invocation.ts:16-17`). The engine persists it
  (`invocation-repository.ts:39-42`). → A forum topic is a **first-class invocation context** today.
- `InvocationEngineService.invoke(req)` resolves `req.target` agents via `AgentDirectory`
  (`AgentResolverDirectory` over `agentService`, `phase21-invocation.ts:44-58`) and hands
  execution to `IExecutionDelegate.start(agents, context, mode)`
  (`phase21-invocation.ts:61-110`):
  - `mode==='debate'` → `debate.startDebate(...)` (`:75-87`).
  - `mode==='chat'|'director-scenario'` → `ScenarioRepository.create` + `ConversationDirector.run`
    (`:89-108`), returning `{kind:'conversation'|'debate', ref}`.
- Policy gating: `matches()` gates on `match.source`/`event`/`expertise` only; it does **not**
  compare `policy.actions.target` to the request (`AGENTS.md` Step 4; `phase21-invocation.ts:113-144`).
  The default `Manual Room Chat` policy matches `source:'human-mention'`. `[VERIFIED]`

## 2. Is there ANY forum→invocation hook today?

- **NO.** Grep for `forum` in `src/kernel/services/invocation/*` returns **only** the literal
  `'forum-topic'` context-type string in `invocation-repository.ts:40` (parsed for persistence).
  There is **no** invocation reference in `forum-service.ts` or `phase18-forum.ts`. `[VERIFIED]`
- `phase18-forum.ts` imports `IKnowledgeGeneratorService` and `IForumService` but **not** the
  Invocation Engine. The question-bridge calls `knowledgeGen`, never `invocationEngine`.
  `[VERIFIED]`
- The `forum-topic` context type is therefore **declared but never produced by the forum** and
  **never specially handled by the execution delegate** (which treats `context.ref` as plain topic
  text, `phase21-invocation.ts:77,90`). `[VERIFIED]`

## 3. How naturally Forum CAN use Invocation (no new engine)

### 3a. Human → Forum → Invoke Agent → agent answers in Forum

- A "Ask agent" button in `ForumPanel` calls
  `invocationEngine.invoke({ target:{agentId}, context:{type:'forum-topic', ref: topicId},
reason, constraints:{mode:'chat'} })`.
- The engine resolves the agent, runs a ConversationCore scenario, returns
  `sessionRef` (`conversation` id). `[INFERRED, feasible via existing API]`
- **Missing piece (a thin bridge, not a new engine):** post the agent's result back to the forum.
  After execution, read the conversation result and call
  `forumService.postMessage(topicId, agentAuthor, result)` with real `agentProvenance`. No new
  service — just one consumer + one `postMessage`. `[OPINION]`

### 3b. Forum event → policy → agent invocation

- Reuse the **existing** `FORUM_POST_ADDED` consumer pattern (`phase18-forum.ts:82-114`). Instead
  of (or in addition to) `knowledgeGen`, call `invocationEngine.invoke(...)` for question-shaped
  posts. A policy with `match.source:'event'` (or a forum-specific source) would gate it within
  the **current** policy model — no engine change. `[INFERRED]`
- `AgentResolverDirectory.getAgents()` already exposes `specializations`
  (`phase21-invocation.ts:47-56`), enabling expertise-matched responder selection from topic tags.
  `[VERIFIED]`

### 3c. Escalate contested topic to debate via Invocation

- As detailed in `08_DEBATE_INTEGRATION.md` §7 (Option B): a forum "Escalate" action →
  `invoke({target: participants, context:{type:'forum-topic', ref}, constraints:{mode:'debate'}})`
  → reuses `debate.startDebate` (`phase21-invocation.ts:75-87`) → existing
  `DEBATE_VERDICT_GENERATED → case-study` bridge closes the loop. `[INFERRED, feasible]`

## 4. Gaps / what does NOT yet exist

| Missing                                              | Why                                                                    | Evidence                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------- |
| No forum→invocation trigger                          | forum files never reference invocationEngine                           | grep (`09` §2)                  |
| No post-back bridge (invocation result → forum post) | execution delegate returns `sessionRef` but nothing writes it to forum | `phase21-invocation.ts:61-110`  |
| `forum-topic` context unused by delegate             | delegate ignores `context.type`, uses `ref` as text only               | `phase21-invocation.ts:77,90`   |
| Real agent provenance not carried to forum           | forum synthesizes `modelId`/`tokensCost` for agent posts               | `forum-service.ts:121-129`      |
| No forum invocation policy                           | only `Manual Room Chat` (source `human-mention`) seeded                | `phase21-invocation.ts:125-144` |

## 5. What would need to change (minimal, enumerated — not implemented)

1. **Trigger:** one new caller — a `ForumPanel` button or a `FORUM_POST_ADDED` consumer that
   invokes the engine. No engine change.
2. **Post-back bridge:** one new event/bridge handler that, given an invocation `sessionRef`,
   fetches the agent output and `forumService.postMessage(...)`. Reuses `forumService` +
   `agentProvenance`. No engine change.
3. **Policy (optional):** seed a `forum` policy (e.g. `match.source:'event'` + expertise) so
   event-driven forum invocations are permitted. Reuses `createPolicy` (`phase21-invocation.ts:131`).
4. **Provenance plumbing (optional):** pass real `traceId`/`modelId`/`tokensCost` from the
   invocation run into the forum post.

None of the above requires modifying `InvocationEngineService`, `AgentResolverDirectory`, or the
execution delegate. `[OPINION based on VERIFIED code]`

## 6. Bottom line

The Invocation Engine **already anticipates forum integration** via the `forum-topic` context type
and the proven `event-consumer → invoke → ConversationCore/Debate` pattern (used by RoomPanel).
What's absent is purely **two thin bridges + optional UI/policy**: (a) a forum trigger that calls
`invoke`, and (b) a post-back that writes the agent's answer into the forum topic. No new Agent,
Forum, or Invocation engine code is required.
