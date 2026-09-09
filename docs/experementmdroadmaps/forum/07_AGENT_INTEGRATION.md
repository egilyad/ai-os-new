# 07 — Agent Integration (Forum ↔ Agents)

> Research-only. Tags: **[VERIFIED]** (file:line), **[INFERRED]**, **[OPINION]**.

## 1. How agents participate NOW

### Agent → Forum (agent posting into the forum)

- The **only** automated agent-authored posts are by `SYSTEM_AUTHOR`
  (`{kind:'agent', id:'system', displayName:'Система'}`, `phase18-forum.ts:24`), produced by the
  two phase18 bridges: debate verdict → `case-study` topic, crystal formed → `announcements`
  topic (`phase18-forum.ts:53-58, 70-74`).
- **These are NOT the real debate/crystal agents.** `id:'system'` is a synthetic author; the
  actual participating agents are not credited. `[VERIFIED]`
- `agentProvenance` for these system posts is fabricated: `modelId = 'model-'+(roleId ?? 'generic')`
  and `tokensCost = 40 + ceil(text.length/4)` (`forum-service.ts:121-129`). This is a **placeholder
  cost/model**, not a real measurement. `[VERIFIED]`

### Forum → Agent (forum triggering an agent)

- **NONE.** No code path invokes an agent from a forum topic/post. `getConsensus` can return
  `'contested'` (`forum-service.ts:300-302`) but **nothing acts on it** — no agent, no debate, no
  notification. `[VERIFIED]`

### Agent → Topic / Post / Reply / Vote / Consensus / Debate

| Action                       | Possible today?                                                | Evidence                                                            |
| ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| Create topic as agent        | Only `SYSTEM_AUTHOR` via bridges                               | `phase18-forum.ts:53,70`                                            |
| Post as agent (human-driven) | **No** — UI always posts as human `local-user`                 | `ForumPanel.tsx:11-15,60`                                           |
| Post as agent (service)      | Yes, if caller passes `author.kind==='agent'` to `postMessage` | `forum-service.ts:121-129` (provenance branch)                      |
| Reply (`parentId`)           | Schema yes, service **no** — `parentId` never set              | `forum-service.ts:112-131`; `05` §6                                 |
| Vote (agent or human)        | Service yes; **UI has no vote buttons**                        | `votePost` `forum-service.ts:149`; `TopicView.tsx` shows score only |
| Consensus                    | Computed from posts/votes; not agent-driven beyond counting    | `forum-service.ts:262-308`                                          |
| Debate                       | Only via separate Invocation/Debate; no forum trigger          | `08_DEBATE_INTEGRATION.md`                                          |

### Agent identity rendering

- `AuthorBadge.tsx` resolves agent authors via `resolveAgentIdentity(author.id)`
  (`agent-identity.ts:62`). For `id:'system'` this will **not** map to a topology agent, so it
  falls back to the supplied `displayName:'Система'` + a generic `◆` badge (`AuthorBadge.tsx:19,45`).
  Real agents (if ever posted with their true ids) would get an `AgentAvatar` + name. `[VERIFIED]`

## 2. Can agents be auto-invoked to answer a forum topic?

- **No hook exists.** `forum-service.ts` and `phase18-forum.ts` contain **zero** references to the
  Invocation Engine. There is no "ask agent" button/event in `ForumPanel/*`. `[VERIFIED]`
- However, the **Invocation contract already anticipates forum**: `InvocationContext` includes
  `{ type: 'forum-topic'; ref: string }` (`contracts/invocation.ts:16-17`), and the repository
  persists it (`invocation-repository.ts:39-42`). So the _data type_ for "agent answers forum
  topic" exists; the _trigger_ does not.

## 3. What can be built on EXISTING infrastructure (no new Agent/Forum engine)

All of the following reuse current contracts/services — no new engine code required:

1. **Human "Ask agent" from a topic (Forum → Invocation → Forum).**
   Add a button in `ForumPanel` that calls
   `invocationEngine.invoke({ target:{agentId}, context:{type:'forum-topic', ref: topicId},
reason, constraints:{mode:'chat'} })`. The Invocation Engine already resolves the agent via
   `AgentResolverDirectory` (`phase21-invocation.ts:44-58`) and runs it through
   `ConversationDirector` (`:89-108`). What's **missing** is only a **post-back bridge**: after
   execution, read the session result and `forumService.postMessage(topicId, agentAuthor, result)`.
   `[INFERRED]` Feasible with one new bridge handler + one UI button.

2. **Event-driven expert answer (Forum event → policy → Invocation).**
   The phase18 `FORUM_POST_ADDED` consumer (`phase18-forum.ts:82-114`) already filters
   question-shaped posts. It currently calls `knowledgeGen`; it could **additionally** call
   `invocationEngine.invoke(...)` for an agent answer. The Invocation policy model already gates
   on `match.source` (`phase21-invocation.ts:135`); an `event`-sourced forum policy is within the
   existing `matches()` semantics (gates on `source`/`event`/`expertise` only —
   `AGENTS.md` Step 4). `[INFERRED]`

3. **Expertise-matched auto-answer.**
   `AgentResolverDirectory.getAgents()` exposes `specializations`
   (`phase21-invocation.ts:47-56`). A forum→invocation bridge could match topic `tags` to agent
   `specializations` and pick the responder — no new resolution service. `[INFERRED]`

4. **Agent-authored replies with real provenance.**
   Today agent posts get synthetic `modelId`/`tokensCost`. If the answer comes from a real
   Invocation/ConversationCore run, the true `traceId`/`modelId`/`tokensCost` could be plumbed into
   `agentProvenance` at post time (the field already exists, `forum-types.ts:27-33`). `[OPINION]`
   This would make `AuthorBadge` + `agentProvenance` meaningful instead of placeholder.

## 4. What is NOT possible without change (and what would need to change)

- **Agent self-initiation / spontaneous posting:** forbidden by design (D6 "agents never
  self-invoke", `AGENTS.md` Invocation Engine). Forum cannot make agents post on their own
  without an explicit human or policy invocation. `[VERIFIED by design]`
- **Automatic contested→debate:** requires the missing `forum:topic:escalated-to-debate` event
  (see `06` §2, `08` §3). `[VERIFIED]`
- **Real agent identity on system bridge posts:** the debate/crystal bridges post as `system`, not
  the actual agents — changing that needs the bridge to know/carry the agent ids. `[VERIFIED]`

## 5. Gaps summary

| Gap                                                                       | Evidence                                          |
| ------------------------------------------------------------------------- | ------------------------------------------------- |
| No agent ever auto-answers a forum topic                                  | grep: no invocation ref in forum files            |
| UI posts only as human `local-user`                                       | `ForumPanel.tsx:11-15,60`                         |
| No vote UI (so `FORUM_POST_VOTED` is dead in practice)                    | `TopicView.tsx` (score display only)              |
| System bridge posts are synthetic `system` author, placeholder provenance | `forum-service.ts:121-129`, `phase18-forum.ts:24` |
| Agent identity only resolves for real agent ids; `system` falls back      | `AuthorBadge.tsx:19,45`                           |
| `forum-topic` invocation context type exists but unused by forum          | `contracts/invocation.ts:16-17`                   |

## 6. Bottom line

Agents currently appear in the Forum **only as a synthetic `system` author** for debate/crystal
announcements. There is **no mechanism** for a real agent to read a topic and answer it, despite
the Invocation contract already shipping a `forum-topic` context type. Everything needed to wire
"human/event → invoke agent → post answer back" exists except **two thin bridges + one UI
button** — no new engine.
