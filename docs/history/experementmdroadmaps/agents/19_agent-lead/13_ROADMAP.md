# 13_ROADMAP — Recommended path (Philosophy A: activate semantics in-place)

> Each phase: task, existing code/service, proposed UI, deps, effort, risk, expected result. VERIFIED primitives; OPINION on sequencing.

## Phase 0 — Visibility (no kernel change)

- Task: "Coordinator" badge from `specializations`; seed "Team Sync" Director template; Room policy preferring lead for coordination intents.
- Existing: `resolveAgentIdentity` (`agent-identity.ts:135`), `ScenarioRepository.create` (B5.3), `phase21-invocation.ts:125` seed.
- UI: AgentCard/RoomPanel/DirectorPanel badge; ScenarioEditor preset; policy row.
- Deps: none. Effort: S. Risk: Low.
- Result: lead is visibly & routeably the coordination agent (closes P1/P2 partially).

## Phase 1 — Debate moderation

- Task: add `coordinator` `TacticalRole`; bias `MetaAgentController` to assign it to Coordination agents from round 2 (M1).
- Existing: `debate-meta-agent.ts:6`, `debate-meta-agent-controller.ts:104`.
- UI: none required (debate runtime); optional badge in DebateRuntimePanel.
- Deps: Phase 0. Effort: M. Risk: Med (guard generic path).
- Result: agent-lead moderates debates (closes P7).

## Phase 2 — ConversationCore coordination

- Task: `HybridPolicy` inserts lead synthesis turns for ≥3-agent scenarios; `coordinate` memory tag (M2/M5/Q4/Q5).
- Existing: `HybridPolicy` (B3), `TurnProposal`, `override()` (B5.4b), `memory-engine.ts:181`.
- UI: DirectorPanel shows lead turns; AgentObservabilityTab filter.
- Deps: Phase 0. Effort: M. Risk: Med.
- Result: multi-agent Director runs auto-coordinated (closes P5 partially).

## Phase 3 — Group & Invocation coordination

- Task: `lead` `GroupExecutionPattern` (M4); `coordinate` Invocation mode (B2).
- Existing: `agent-service.ts:25,688-762`, `phase21-invocation.ts:61-109`.
- UI: AgentGroupsSection pattern picker; RoomPanel mode.
- Deps: Phase 1/2. Effort: M–L. Risk: Med.
- Result: "lead my team" expressible everywhere (closes P6).

## Phase 4 — Coordination console & memory graph

- Task: AgentDetailPanel "Coordination" tab (M3); cross-agent mentoring memory graph (B3); revive `COGNITIVE_DECISION_MADE` (M5).
- Existing: `agentService.getGroups`, `taskHandoffService`, `agentJournalService.listByAgent`, `event-registry.ts:776`, memory stores, CrystalVault (module 2).
- UI: new Coordination tab composing read APIs; decision ledger.
- Deps: Phase 1-3. Effort: L. Risk: Med.
- Result: a genuinely useful Coordination Agent (12_FUTURE_AGENT_CONCEPT realized).

## OPINION

Phases are ordered by risk/reuse: make it _visible_ (0) before making it _active_ (1-3) before making it _memorable/auditable_ (4). Each phase is independently shippable and additive.
