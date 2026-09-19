# 12 — Cognitive Integration: "Cognitive Timeline inside Forum" (RESEARCH-ONLY)

> Status: read-only deep-dive. No source modified. Tags: **VERIFIED** / **INFERRED** / **OPINION**.
> Goal: what a user _could_ see in a Forum topic if agents actually reasoned _inside_ it, and how to build that UX over the **existing** event architecture — no new event system.

---

## 1. The envisioned journey (user story)

> Topic → an Agent joins → researches the claim → challenges a post → produces evidence → a Debate is spun up → Consensus forms → Synthesis is exported.

Every step of that journey is already emitted _somewhere_ in the OS as an event. The Forum simply never subscribes to any of them.

---

## 2. Cognitive events that exist today (VERIFIED)

Four cognitive events, `event-registry.ts:736-776`:

- `COGNITIVE_TRACE_UPDATED` (`cognitive:trace:updated`) — array of trace objects (id/startTime/endTime/input/output/status/steps/provider/model/tokens/latency). **Writers:** `CognitiveService.emit` (`cognitive-service.ts:338`), `TraceService.emit` (`trace-service.ts:344`).
- `COGNITIVE_STEP_ACTIVE` (`cognitive:step:active`) — `{ nodeId, traceId, metadata? }`. **Writers:** `TraceService` (`trace-service.ts:200`), `OrchestrationService` (`orchestration-service.ts:355`).
- `COGNITIVE_STEP_COMPLETED` (`cognitive:step:completed`) — `{ nodeId, traceId, status, duration, output, provider?, model? }`. **Writers:** `CognitiveService` (`cognitive-service.ts:229`), `TraceService` (`trace-service.ts:223`), `OrchestrationService` (`orchestration-service.ts:414`).
- `COGNITIVE_DECISION_MADE` (`cognitive:decision:made`) — `CognitiveDecisionSchema`. **Writer:** `CognitiveService.emit` (`cognitive-service.ts:414`). **VERIFIED dead-at-consumer** (no UI subscribes; confirmed in shared context + grep shows only the emit).

**VERIFIED — Forum emits NONE of these, and no forum bridge emits any cognitive event.** Repo-wide grep for the four `COGNITIVE_*` names returns 30 hits, _none_ in `forum-service.ts`, `phase18-forum.ts`, or `ForumPanel/**`. The Forum is entirely outside the cognitive event stream.

**VERIFIED — Debate emits NO cognitive events either** (confirmed in shared context; `debate-runtime` writers emit `debate:*` only). So even when a forum thread escalates to a debate (today dead — see `10_CONVERSATION_INTEGRATION.md §4`), the debate produces no cognitive trace the forum could show.

---

## 3. What a user could see — correlation keys (INFERRED)

Cognitive events carry `traceId` / `nodeId` / `agentId`-resolvable `model` but **not** a `forumTopicId`. To render a "Cognitive Timeline" inside a forum topic we need a join key. Two exist today:

1. **Agent identity.** `AuthorBadge` resolves any `author.id` via `resolveAgentIdentity` (`AuthorBadge.tsx:19`, `src/kernel/services/agent-identity`). Cognitive steps carry `model`/`provider`; the agent directory maps agent→model. So a topic post authored by agent `X` (via `agentProvenance.roleId`, `forum-service.ts:121-129`) can be correlated to cognitive traces of agent `X`.
2. **Invocation context.** When an agent is invoked with `context.type:'forum-topic', ref:topicId` (`contracts/invocation.ts:17`, `event-registry.ts:1431`), the `InvocationRecord` stores both the forum topic ref and the resolved agent ids (`invocation-repository.ts:40`). The `useInvocationStore` already observes `invocation:*` + `conversation:*` live output (`src/stores/invocationStore.ts`). So an invoked agent's reasoning _is_ observable — just not inside the Forum panel.

**INFERRED — The timeline is buildable as a pure consumer join, no new events.** Subscribe (in a new `ForumCognitiveTimeline` component) to `coreEventBus` `COGNITIVE_STEP_ACTIVE/COMPLETED/DECISION_MADE` + `conversation:*` + `debate:*` + `forum:post:added`, and filter by: (a) posts whose `author.id` matches the agent currently producing cognitive steps, and (b) invocations whose `context.ref === currentTopicId`. Render a vertical timeline. This reuses `EventBus.onSafe` (the same pattern `directorStore.ts`/`invocationStore.ts` already use).

---

## 4. UX concept — "Cognitive Timeline inside Forum" (OPINION)

A collapsible rail inside `TopicView` (`TopicView.tsx:78-142`) showing, per participating agent:

- **joined** — when the agent's first post appears (or an `invocation:accepted` with `context.ref===topicId`).
- **researching** — `COGNITIVE_STEP_ACTIVE` (pulsing node, `nodeId`).
- **found evidence / made claim** — `COGNITIVE_STEP_COMPLETED` (expandable `output`, `provider`/`model`/`latency` from `agentProvenance`).
- **challenged** — a post with `body` referencing another post (today free-text; could be the `parentId` once threading is enabled).
- **debate** — `debate:started`/`debate:argument`/`debate:consensus` correlated via the invocation's `sessionRef`.
- **consensus** — `forum.getConsensus(topicId)` badge already rendered (`TopicView.tsx:104-116`); promote it to a timeline terminus.
- **synthesis** — once `SYNTHESIS_EXPORTED_TO_FORUM` gets a consumer (`11_KNOWLEDGE_INTEGRATION.md §3`), show the exported statement as the capstone.

Mockup (SVG) in `./designs/cognitive-timeline.svg`.

---

## 5. Why this is low-risk and reuse-only (OPINION)

- **No new event.** All events already exist (`event-registry.ts:736-776`, `1392-1417`, `1478+` conversation lifecycle, `debate:*`).
- **No kernel change.** The component is app-layer (like `directorStore.ts` / `invocationStore.ts`), subscribing via `onSafe`.
- **No schema change.** `agentProvenance` (`forum-types.ts:27-33`) already carries `traceId` — it is _generated but never read back_. The timeline can key off `agentProvenance.traceId` to join directly to `COGNITIVE_TRACE_UPDATED` without any agent-directory lookup. **This is the cleanest join key and is already populated** (`forum-service.ts:124` `traceId: genId('trace')`).

**OPINION — Hidden capability:** `agentProvenance.traceId` is written on every agent post (`forum-service.ts:121-129`) but no reader exists. Wiring `ForumCognitiveTimeline` to read `post.agentProvenance.traceId` and match it against `COGNITIVE_TRACE_UPDATED` gives a per-post "show reasoning" expander for _zero_ new infrastructure — the data is already there, just orphaned.

---

## 6. Preconditions / gaps to close first

- Agents must actually post to the forum (today only `SYSTEM_AUTHOR` does — `10_CONVERSATION_INTEGRATION.md §2`). Until then, the timeline has no agent-authored `traceId` to join on, except via the Invocation path.
- `forum-topic` invocation must write back (§2 of file 10) so the topic ref is populated on the invocation and the session's `conversation:*`/`debate:*` output is attributable to the thread.
- Dead `SYNTHESIS_EXPORTED_TO_FORUM` consumer should be revived (`11 §3`) for the synthesis capstone.

---

## 7. N/A items

- **Forum-native cognitive emission:** N/A (forum is not a cognitive runtime; it should _consume_, not _produce_, cognitive events — by design).
- **Real-time agent reasoning inside forum today:** N/A (no agent posters, no subscriber). The concept is forward-looking.
- **New "cognitive forum" event type:** N/A — explicitly out of scope per instructions ("no new event system").

---

_Citations: event-registry.ts:736-776,1392-1417,1431,1478+; cognitive-service.ts:338,414; trace-service.ts:200,223,344; orchestration-service.ts:355,414; forum-service.ts:121-129; forum-types.ts:27-33; AuthorBadge.tsx:19; contracts/invocation.ts:17; invocation-repository.ts:40; directorStore.ts / invocationStore.ts (subscriber pattern); TopicView.tsx:78-142,104-116._
