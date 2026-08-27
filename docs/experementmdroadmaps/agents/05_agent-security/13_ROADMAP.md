# 13_ROADMAP — Phased plan for `agent-security`

> Each phase: task, existing code/service, proposed UI, deps, effort, risk, expected result. Builds on 11 (QW/MD/BI).

## Phase 0 — Foundations (Quick Wins)

**Goal:** Make the agent actually specialized & observable.

- **Tasks:**
  - QW-1 Inject `specializations` into prompts (`agent-service.ts:385`, `cognitive-service.ts:421`, `DebatePanel.tsx:241-250`).
  - QW-2 Attach `lens:security` (`topology-defaults.ts:106`).
  - QW-4 Close debate cognitive blind-spot (`agent-journal-service.ts:129-191`).
  - QW-5 Domain chip on card/detail (`AgentCard.tsx`, `AgentDetailPanel.tsx`).
- **Existing code:** `AGENT_PROFILES`, `resolveAgent`, `lens-engine`, `AgentJournalService`, UI tabs.
- **Proposed UI:** AgentCard security chip; no new panels.
- **Deps:** none.
- **Effort:** S (≈3–5 dev-days).
- **Risk:** Low.
- **Result:** `agent-security` speaks as a specialist; accurate stats; visibly distinct.

## Phase 1 — Invocation & Debate UX

**Goal:** Easy, intention-revealing invocation + real security debate voice.

- **Tasks:** QW-3 specialization quick-tasks in RoomPanel; MD-1 security personas (`persona-selector.ts`); MD-4 `security_scan` invocation mode.
- **Existing code:** RoomPanel, Invocation Engine (`phase21-invocation.ts`), `persona-selector.ts`.
- **Proposed UI:** RoomPanel template buttons; Debate participant persona picker (security_reviewer/red_team).
- **Deps:** Phase 0 (QW-1).
- **Effort:** M (≈1–2 sprints).
- **Risk:** Med (persona quality, scan input handling).
- **Result:** Users invoke precise security tasks; agent debates as red/blue.

## Phase 2 — Memory & Knowledge

**Goal:** Durable, queryable security knowledge.

- **Tasks:** MD-2 structured findings in journal; MD-3 "Security console" tab; MD-5 crystallize to Crystal Vault (`crystal-types.ts:17`).
- **Existing code:** `AgentJournalService`, `AgentDetailPanel` tabs, `crystalVault`, `crystal-debate-bridge`.
- **Proposed UI:** New AgentDetailPanel "Security" tab (findings, severity, trends).
- **Deps:** Phase 0 (QW-4).
- **Effort:** M (≈1–2 sprints).
- **Risk:** Med (parsing, dedup).
- **Result:** Findings persist & accumulate; one-click crystallization.

## Phase 3 — Teams & Continuous Review

**Goal:** Operationalize across the agent workforce.

- **Tasks:** Seed "Security & Risk" group (`agent-service.ts:667`); BI-1 autonomous review pipeline; BI-2 red/blue arena.
- **Existing code:** `AgentService.createGroup`, ConversationDirector scenarios, debate verdict bridge, Forum bridge; **scheduler: NONE — must add or reuse cron** (POTENTIAL in 02/03).
- **Proposed UI:** Group management in AgentsPanel; pipeline status in Dashboard; arena in DebatePanel.
- **Deps:** Phase 1, Phase 2.
- **Effort:** L (≈2–3 sprints).
- **Risk:** High (orchestration, cost, fairness).
- **Result:** Continuous, multi-agent security posture.

## Phase 4 — Learning Loop

**Goal:** Persistent competency.

- **Tasks:** BI-3 memory + feedback loop (prepend prior findings; store user corrections; auto-crystallize recurring threats).
- **Existing code:** AgentJournalService storage, `lens:security`, Crystal Vault, `updateAgent` persistence.
- **Proposed UI:** "Training/corrections" sub-tab in Security console.
- **Deps:** Phase 2.
- **Effort:** L.
- **Risk:** High (memory correctness, privacy).
- **Result:** `agent-security` improves across sessions — a true Senior Security Engineer.

## Milestone summary

- Phase 0 → visible specialist (cheapest, highest ROI).
- Phase 1 → usable & debate-capable.
- Phase 2 → knowledgeable & durable.
- Phase 3 → operational & continuous.
- Phase 4 → learning & autonomous.
