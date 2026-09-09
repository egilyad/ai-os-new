# 27 — FORUM ROADMAP B: AGENT-FIRST

> Turn the Forum into a **human↔agent collaboration space** using the Invocation
> Engine, Debate, Cognitive Stream, Memory and Knowledge — **only where
> architectural support already exists.** No new engines (see `25_DO_NOT_BUILD_YET.md`).
> Every phase reuses a verified component.

---

## Phase 0 — Agent-native posting & provenance

**Goal:** make agent contributions first-class and legible.

### B0.1 — Agent-authored posts via Invocation

- **Task:** Reuse the "Ask an agent" path (Roadmap A A2.1) but make it the **primary** compose mode: a topic author can invite agents to a thread. The execution handoff already exists (`phase21-invocation.ts:61-109` chat/director; `:75-87` debate). Agent replies are stored as `Post` with `ForumAuthor.kind:'agent'` + `agentProvenance` (`forum-service.ts:121-129`, typed `forum-types.ts:27-33`).
- **Existing code:** `invocationEngine`, `agentProvenance`, `AuthorBadge` (`AuthorBadge.tsx`).
- **Proposed UI:** Composer has "Invite agent" alongside "Post"; invited agent replies appear as `◆` posts.
- **Deps:** Bridge invocation `done` → forum post (reuse `FORUM_POST_ADDED` consumer, `phase18-forum.ts:82`).
- **Effort:** M.
- **Risk:** Medium (capture + re-post agent output).
- **Expected result:** Threads natively contain agent voices.

### B0.2 — Provenance + cognitive visibility

- **Task:** Expand `agentProvenance` display (`TopicView.tsx:43-46` currently only "N tok") into a clickable card showing `modelId`/`traceId`/`roleId` (`forum-types.ts:27-33`). Optionally link `traceId` to the Cognitive Stream if a viewer exists for `cognitive:*` events (see `AGENTS.md` B4 `conversation:*`; cognitive events emitted at `cognitive-service.ts`, surfaced per debate roadmap `19_ROADMAP_COGNITIVE_FIRST.md`).
- **Existing code:** `AgentProvenance`, `resolveAgentIdentity`.
- **Effort:** S.
- **Risk:** Low.
- **Expected result:** Transparent, traceable agent reasoning.

---

## Phase 1 — Invocation-driven debate onramp

**Goal:** contested threads escalate to structured debate through the existing Invocation route (NOT a new escalation subsystem — `25_DO_NOT_BUILD_YET.md` (b)).

### B1.1 — "Escalate to debate" via Invocation

- **Task:** When `getConsensus` returns `contested` (`forum-service.ts:300-306`), show an "Escalate to debate" action that calls `invocationEngine.invoke({target:{agentId(s)}, context:{type:'forum-topic', ref: topicId}, constraints:{mode:'debate'}})`. `phase21-invocation.ts:75-87` already maps `mode:'debate'` → `debateService.startDebate` with participants derived from the invocation agents.
- **Existing code:** `InvocationEngineService`, `DebateSyncManager.startDebate`, `getConsensus`.
- **Proposed UI:** Button on `contested` badge (`TopicView.tsx:104-116`); opens agent-multi-select; launches debate; posts a link/summary back to the forum (debate verdict already auto-posts as case-study `phase18-forum.ts:48-64`).
- **Deps:** Invocation `sessionRef` → forum link (Rooms already do "Open session" `AGENTS.md` Step 6 history).
- **Effort:** M.
- **Risk:** Medium (orchestrate multi-agent selection + result post-back).
- **Expected result:** Forum threads can spawn real debates with zero new engine code.

### B1.2 — Debate↔Forum result surfacing

- **Task:** The `DEBATE_VERDICT_GENERATED` → case-study bridge already exists (`phase18-forum.ts:48-64`) but posts a generic line. Enrich it to link the originating forum topic (pass `topicId` through the invocation `context.ref`) so the verdict post references the thread.
- **Existing code:** `wireForumBridge`, `ensureTopic`.
- **Effort:** S.
- **Risk:** Low.
- **Expected result:** Closed loop forum→debate→forum.

---

## Phase 2 — Memory & Knowledge grounding of agents

**Goal:** agents answering in Forum use Memory + Crystals as context.

### B2.1 — Agent answers grounded in Memory/Crystals

- **Task:** When an agent is invoked from a forum topic (B0.1), augment its context with relevant `memory` entries and `crystal` statements (Memory engine `P2.20`, Crystal Vault `AGENTS.md` Module 2). This is a **prompt-augmentation** step in the Invocation execution delegate, not a new service.
- **Existing code:** `CrystalVaultService`, `MemoryEngine`, `InvocationExecutionDelegate` (`phase21-invocation.ts:61`).
- **Proposed UI:** None required in Forum; the agent's grounded reply appears as a post.
- **Effort:** M.
- **Risk:** Medium (context assembly; guard token budget).
- **Expected result:** Agent answers cite/reference existing knowledge.

### B2.2 — Consensus → Crystal proposal

- **Task:** When `getConsensus` returns `consensus` with high confidence (`forum-service.ts:297-299`), offer "Propose as crystal" → `crystalVault.propose` (bridge pattern already exists for crystal→announcement `phase18-forum.ts:66-79`).
- **Existing code:** `getConsensus`, `CrystalVaultService`, `crystal-debate-bridge`.
- **Effort:** S–M.
- **Risk:** Low.
- **Expected result:** Strong forum agreements become durable knowledge.

---

## Phase 3 — Agent moderator & facilitator

**Goal:** lightweight agent assistance for community health.

### B3.1 — Agent triage/flagging

- **Task:** An agent (invoked via Invocation) can review new posts and suggest moderation using `moderatePost` (`forum-service.ts:245`). Human confirms (keep ungated v1, `25_DO_NOT_BUILD_YET.md` (h)).
- **Existing code:** `moderatePost`, `ModerationQueue`.
- **Effort:** M.
- **Risk:** Medium (agent reliability; human-in-loop required).
- **Expected result:** Scaled moderation without new RBAC.

### B3.2 — Topic summarizer agent

- **Task:** Invoke an agent to summarize a long thread into the topic's first post or a "Summary" card (reuse `getThread` `forum-service.ts:223`).
- **Existing code:** `getThread`, `invocationEngine`.
- **Effort:** S.
- **Risk:** Low.
- **Expected result:** Digestible long discussions.

---

## Phase 4 — Agent-native community (future)

**Goal:** agents proactively participate under policy control.

### B4.1 — Policy-gated agent answers

- **Task:** Extend Invocation policies (`phase21-invocation.ts:127-144` seeds a human-mention policy) with a `forum-question` source policy so registered experts auto-answer (D2 hybrid triggers per `INVOCATION_ENGINE.md`). This reuses the policy model — **no engine change** (`25_DO_NOT_BUILD_YET.md` (c)).
- **Existing code:** `InvocationPolicy`, `matches()` source gate.
- **Effort:** M.
- **Risk:** Medium (avoid spam; reuse `enforceFloodBudget` `forum-service.ts:312`).
- **Expected result:** Self-sustaining expert answers.

### B4.2 — Cognitive visibility of agent reasoning in-thread

- **Task:** Link each agent post's `traceId` to a Cognitive Stream viewer so users can expand "why the agent said this" (cognitive events exist; consumer-side gap per `22_DEBATE_DO_NOT_BUILD_YET.md` (d)).
- **Existing code:** `cognitive:*` events, `AgentProvenance.traceId`.
- **Effort:** M.
- **Risk:** Medium.
- **Expected result:** Explainable agent participation.

---

## Effort / Value summary

| Phase | Focus                        | Effort | Risk | Reuse                           | Agent impact |
| ----- | ---------------------------- | ------ | ---- | ------------------------------- | ------------ |
| 0     | Agent posts + provenance     | M      | Med  | Invocation + agentProvenance    | High         |
| 1     | Debate onramp via Invocation | M      | Med  | phase21 + getConsensus          | High         |
| 2     | Memory/Crystal grounding     | M      | Med  | CrystalVault + Memory           | Medium       |
| 3     | Agent moderator/facilitator  | M      | Med  | moderatePost + getThread        | Medium       |
| 4     | Policy-gated + cognitive     | M      | Med  | Invocation policies + cognitive | High         |

**Recommended starting point (OPINION):** Phase 0 + B1.1 — they convert the Forum from a
human-only board into an agent-collaboration space using **only** existing Invocation +
Debate + Consensus wiring, with the highest architectural reuse and lowest new-code risk.
Final decision left to human.
