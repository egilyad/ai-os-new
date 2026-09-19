# 16_CONSENSUS.md — Forum Consensus Deep-Dive

> RESEARCH-ONLY. No source modified. Labels: **VERIFIED** / **INFERRED** / **OPINION**.

## 1. Is consensus real? YES — and it is surfaced.

Contrary to the "ConsensusVerdict may be dormant" hypothesis: **consensus is a working, computed, and UI-shown feature.**

- **Computation:** `ForumService.getConsensus(topicId)` — `src/kernel/services/forum/forum-service.ts:262-308`.
  - Requires >=3 posts, else returns `{status:'open', confidence:0.2, summary:...}` (`forum-service.ts:267-273`).
  - Gathers authors set, up/down vote counts, diversity (`authors.size`), activity (`posts.length`).
  - `balance = (up-down)/(up+down)` normalized to [-1,1] (`forum-service.ts:281`).
  - `confidence` = clamp `0.2..0.9` of `0.35*|balance| + 0.25*min(1,activity/12) + 0.2*min(1,diversity/4)` (`forum-service.ts:283-293`).
  - Status rules (`forum-service.ts:295-306`):
    - `consensus`: `diversity>=2 && balance>0.35`
    - `contested`: `diversity>=2 && |balance|<0.25 && activity>=5`
    - else `open`.
  - Returns `{status, confidence, summary}` — a `ConsensusVerdict` (`forum-types.ts:113-117`).
- **UI surface:** `ForumPanel.openThread` calls `forumService.getConsensus(id)` and stores it (`ForumPanel.tsx:43-44`); `TopicView` renders a colored badge `consensus`/`contested`/`open` (`TopicView.tsx:14-18,104-116`, i18n `forum.consensus_*` `analytics.ts:341-343`). **VERIFIED:** the badge is live in the thread header.
- **Tests:** `forum-service.test.ts:259-293` asserts all three statuses. **VERIFIED.**

## 2. Where is it stored? NOWHERE.

- `getConsensus` is **purely derived** — it reads posts/votes on every call and returns a fresh verdict. **VERIFIED:** no write to any table, no `ConsensusVerdict` column in `ForumTopicRecord`/`ForumPostRecord` (`forum-types.ts:121-152`).
- **Consequence:** no history, no time-series, no "consensus changed over time". Each open recomputes from scratch. If votes shift, the badge flips with no record of prior state.

## 3. Who calls it? Only the UI open path.

- **VERIFIED callers (grep):** `ForumPanel.tsx:43` (UI open thread) and tests. That is it.
- The contract comment claims consensus "drives debate escalation" (`contracts/forum.ts:22`, `forum-types.ts:112`), and `status:'contested'` literally says "requires debate" in its summary (`forum-service.ts:302`). **VERIFIED: no escalation path exists.** No subscriber reads `getConsensus` and emits/creates a debate. The `phase18-forum.ts` bridge wires `DEBATE_VERDICT_GENERATED -> forum` (debate->forum) but **not** forum->debate. The forum->debate escalation documented in AGENTS.md (`forum:topic:escalated-to-debate`) is **DEAD** — there is no `forum:topic:escalated-to-debate` event defined (grep: not in `event-registry.ts`), and no code emits one.

## 4. Is the backend doing more than the UI shows? PARTIALLY.

- The backend **computes** a richer verdict than the UI reveals:
  - `confidence` (0.2–0.9) — **VERIFIED NOT SHOWN** in UI. `TopicView` only reads `consensus` (the status string) and ignores `cv.confidence` (`ForumPanel.tsx:44` stores only `cv?.status`; `TopicView` uses `consensus` as a status key). So the numeric confidence is **thrown away client-side**.
  - `summary` (human-readable RU string) — **VERIFIED NOT SHOWN**. The badge shows only the localized status word, never the computed summary.
- **Hidden backend capability:** a fully-formed, explainable verdict (status + confidence + rationale) exists on every thread but the UI exposes only a 1-word status. This is the single biggest "backend > UI" gap in consensus.

## 5. Data available for richer consensus

- Votes per post (`post.votes`, `forum-types.ts:55`), author diversity, post count, timestamps (`createdAt`) — all present. **INFERRED:** a much better temporal consensus (e.g. "consensus formed at T after N posts") is feasible since `createdAt` exists, but `getConsensus` ignores time ordering (only counts).
- `agentProvenance` per post (`forum-types.ts:56`) — **not used** by consensus. **OPINION:** human-vs-agent vote weighting could be added but currently ignored.

## 6. Link to Debate

- **VERIFIED:** no link. `getConsensus` returns no `sessionId`/reference; there is no `escalateToDebate` method on `IForumService` (`contracts/forum.ts`). The "contested -> debate" narrative is aspirational only.
- **OPINION:** the cheapest way to honor the design is to add a single `forum:topic:escalated-to-debate` event emitted from a new `ForumPanel` "Escalate to debate" button (only when `consensus==='contested'`), and let an existing bridge (mirroring `wireForumBridge`) open a debate. No new service needed; reuse `debateService`.

## 7. Summary table

| Aspect                  | Status          | Evidence                                     |
| ----------------------- | --------------- | -------------------------------------------- |
| Computed                | YES VERIFIED    | `forum-service.ts:262-308`                   |
| Surfaced (status badge) | YES VERIFIED    | `ForumPanel.tsx:43`, `TopicView.tsx:104-116` |
| confidence shown        | NO hidden       | `ForumPanel.tsx:44` drops it                 |
| summary shown           | NO hidden       | not read anywhere in UI                      |
| persisted / history     | NO never        | no field, pure derive                        |
| debate escalation       | NO DEAD         | no event, no caller, no method               |
| auto-recompute/live     | NO on-open only | only `openThread` calls it                   |
| tests                   | YES 3 cases     | `forum-service.test.ts:259-293`              |
