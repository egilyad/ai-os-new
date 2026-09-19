# 13 — ROADMAP for `agent-content` (Philosophy A: compose existing infra)

Each phase: task, existing code/service, proposed UI, deps, effort, risk, expected result.

## Phase 0 — Hygiene & visibility (1 week)

- **Tasks:** (a) Fix avatar consistency (QW-2); (b) show specialization chips (QW-3); (c) RoomPanel content presets (QW-4).
- **Existing code:** AgentAvatar.tsx:47, agent-identity.ts:135, RoomPanel, phase21-invocation.ts:61-109.
- **Proposed UI:** AgentAvatar fallback to `node.config.avatar`; chips on AgentCard/Detail; preset buttons in RoomPanel.
- **Deps:** none.
- **Effort:** LOW.
- **Risk:** LOW.
- **Result:** Lena looks consistent, communicates her domain, and is one-click invocable for content tasks.

## Phase 1 — Quality signal + decision surfacing (1-2 weeks)

- **Tasks:** (a) Readability/SEO heuristic scorer listener (QW-1); (b) attach to step + emit `cognitive:decision:made`; (c) DecisionLog sub-tab in AgentDetailPanel (07).
- **Existing code:** memory-engine.ts:181 listener pattern; event-registry.ts:776; cognitive-service.ts:414.
- **Proposed UI:** "Content Decisions" + quality badge on LiveActivityStream / AgentDetailPanel.
- **Deps:** Phase 0 (optional).
- **Effort:** LOW-MEDIUM.
- **Risk:** LOW (display-only).
- **Result:** Dead event fixed; content quality becomes visible.

## Phase 2 — Continuity + portfolio (2-3 weeks)

- **Tasks:** (a) Agent-scoped memory recall (MED-1); (b) Content portfolio tab (MED-4) using journal + memory-by-source.
- **Existing code:** memory-engine.ts:188 (`source`); agent-journal-service.ts:253.
- **Proposed UI:** "Editorial Desk" tab in AgentDetailPanel.
- **Deps:** Phase 1.
- **Effort:** MEDIUM.
- **Risk:** MEDIUM (prompt injection size; leakage).
- **Result:** Lena remembers past work; users see a portfolio.

## Phase 3 — Multi-pass content production (3-4 weeks)

- **Tasks:** (a) New `TurnProposal.objective.type` (DRAFT/EDIT/SEO_REVIEW); (b) reusable Director template (MED-2); (c) structured output card (MED-3).
- **Existing code:** contracts/conversation/turn.ts; conversation-orchestrator.ts; conversation-director-service.ts; DirectorPanel RunTab.
- **Proposed UI:** "Content Brief" builder + rendered draft card with export.
- **Deps:** Phase 1.
- **Effort:** MEDIUM.
- **Risk:** MEDIUM (contract extension—keep optional/backward-compatible).
- **Result:** One-click draft→review→edit pipeline.

## Phase 4 — Skill pack + autonomy (4-8 weeks)

- **Tasks:** (a) `lens:editorial-seo` lens (BIG-1); (b) content tools (SEO analyzer, draft diff) on tool registry; (c) expertise-match invocation policy (MED-5); (d) Builder workflow + Forum publish (BIG-2).
- **Existing code:** lens-library.ts; topology-defaults.ts:326 (SEARCH_TOOLS); phase21-invocation.ts:125-144; builder-agent-service; forum-service.
- **Proposed UI:** Lens toggle in AgentIdentityEditor; "Publish to Forum" action; auto-route policy.
- **Deps:** Phases 1-3.
- **Effort:** HIGH.
- **Risk:** MEDIUM-HIGH (multi-subsystem).
- **Result:** "Lena's Editorial Desk" (12_FUTURE_AGENT_CONCEPT) fully realized — a persistent, scoring, multi-pass, publishable content operator.

## Phase-gate principle

Each phase ships value alone (per 11_OPPORTUNITIES granularity). No phase blocks the next except via explicit deps above. Architecture rule preserved: **no agent-specific service** — all additions are generic infra (lens, tool, objective type, policy, UI tab) that the `agent-content` node merely _uses_.
