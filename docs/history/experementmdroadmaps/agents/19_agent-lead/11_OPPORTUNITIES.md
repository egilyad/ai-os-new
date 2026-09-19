# 11_OPPORTUNITIES — Quick wins, medium, big ideas for `agent-lead`

> Each: ID, Description, User value, Technical reuse, Effort, Risk, Dependencies, Existing infra, Why now.
> Tags VERIFIED/INFERRED/OPINION inline.

## 5 QUICK WINS (Effort: S)

**Q1 — "Coordinator" badge from specializations**

- Desc: Render a badge when `specializations` include Coordination/Mentoring/Architecture, in AgentCard, RoomPanel picker, DirectorPanel chip.
- User value: Users instantly see agent-lead is the coordination agent.
- Reuse: `resolveAgentIdentity` already returns specializations (`agent-identity.ts:135`); `AgentCard.tsx:68`.
- Effort: S (UI only). Risk: Low. Deps: none. Infra: existing identity. Why now: zero-risk, high-clarity.

**Q2 — Seed "Team Sync" Director template featuring agent-lead**

- Desc: A reusable Scenario in ScenarioEditor (B5.3) with agent-pm/devops/lead turns; lead = synthesis/coordination turn.
- User value: One-click standup simulation.
- Reuse: `ScenarioRepository.create` (`AGENTS.md` B5.3), `TurnProposal`.
- Effort: S. Risk: Low. Deps: B5.3. Infra: Dexie scenarios. Why now: Director UI exists.

**Q3 — Room policy that prefers lead for coordination intents**

- Desc: Policy `match.expertise:['Coordination']` → suggest agent-lead (06_INVOCATION_ROLE).
- User value: "Coordinate X" auto-routes to Victor Soto.
- Reuse: `phase21-invocation.ts:125-144` seed pattern; `InvocationEngineService.matches` (expertise).
- Effort: S (one Dexie row). Risk: Low. Deps: engine honors expertise match. Infra: `invocationPolicies`. Why now: Room ships.

**Q4 — Lead step metadata tag in observability**

- Desc: When agent-lead acts as synthesizer/coordinator, emit `metadata.role:'coordinator'` on `COGNITIVE_STEP_COMPLETED` (`orchestration-service.ts:414`).
- User value: Filter "lead actions" in AgentObservabilityTab.
- Reuse: event payload already has `metadata?` (`event-registry.ts:760`).
- Effort: S (1 field). Risk: Low. Deps: 04/05 coordinator path. Infra: existing event. Why now: observability tab exists.

**Q5 — Coordination memory tag**

- Desc: Tag lead memories/handoffs with `metadata.coordinatorSession` (08_MEMORY_AND_CONTEXT).
- User value: lead can later answer "what did I unblock".
- Reuse: memory-engine metadata; `taskHandoffService`.
- Effort: S. Risk: Low. Deps: none. Infra: ~16 memory stores. Why now: memory already per-agent.

## 5 MEDIUM (Effort: M)

**M1 — Add `coordinator` tactical role to debate meta-agent**

- Desc: Extend `TacticalRole` (`debate-meta-agent.ts:6`) + `MetaAgentController._buildDirective` (`debate-meta-agent-controller.ts:104`) to assign `coordinator` to Coordination agents from round 2.
- User value: agent-lead actually moderates debates.
- Reuse: existing meta-agent seam. Effort: M. Risk: Med (must not break generic path). Deps: 04. Infra: argument-graph stats. Why now: debates are core.

**M2 — HybridPolicy inserts lead synthesis turns**

- Desc: In Director scenarios with ≥3 agents, auto-insert an agent-lead `CHALLENGE`/synthesis turn (05_CONVERSATION_ROLE).
- User value: auto-coordinated multi-agent conversations.
- Reuse: `HybridPolicy` (B3), `TurnProposal`, `override()`.
- Effort: M. Risk: Med (policy correctness). Deps: B3/B5.4b. Infra: ConversationCore. Why now: Director ships.

**M3 — "Coordination" tab in AgentDetailPanel**

- Desc: Aggregate groups-led, debates-moderated, handoffs-issued, coordinator journal (09_UI_UX).
- User value: single lead console.
- Reuse: `agentService.getGroups`, `taskHandoffService.getHandoffs`, `agentJournalService.listByAgent`.
- Effort: M (UI compose). Risk: Low. Deps: 09. Infra: existing read APIs. Why now: detail panel tabs exist.

**M4 — Group "leader" execution pattern**

- Desc: Add `GroupExecutionPattern:'lead'` where agent-lead sequences/moderates (`agent-service.ts:25,688-762`).
- User value: run a team with a real lead.
- Reuse: `executeGroup` machinery. Effort: M. Risk: Med. Deps: 05. Infra: groups KV. Why now: groups ship.

**M5 — Revive `COGNITIVE_DECISION_MADE` for lead decisions**

- Desc: Emit coordination decisions (owner assigned, consensus reached) from lead path (07_COGNITIVE_ROLE).
- User value: auditable lead decisions.
- Reuse: dead event `event-registry.ts:776`. Effort: M (writer + 1 consumer). Risk: Low. Deps: 04/05. Infra: cognitive event. Why now: event exists but unused.

## 3 BIG IDEAS (Effort: L)

**B1 — "Team Lead" as a first-class Coordination Agent**

- Desc: Promote agent-lead from persona to a _coordination agent_ that owns group/debate/scenario moderation via a small `CoordinatorService` reusing `AgentResolverDirectory` + `MetaAgentController` + `HybridPolicy`.
- User value: A genuinely useful manager agent, not a costume.
- Reuse: all seams above. Effort: L. Risk: High (new service). Deps: M1-M4. Infra: events/buses exist. Why now: all primitives present.

**B2 — Invocation "coordinate" mode**

- Desc: `InvocationExecutionDelegate.start` gains mode `coordinate` → spins a multi-agent Director scenario with agent-lead as coordinator (06/P6).
- User value: "lead my team on this" from Room.
- Reuse: `ScenarioRepository.create`+`ConversationDirectorService.run` (phase21:99-108). Effort: L. Risk: Med. Deps: M2. Infra: ConversationCore. Why now: Room ships.

**B3 — Cross-agent mentoring memory graph**

- Desc: Lead accumulates a mentoring/coordination knowledge graph from handoffs + memories (08), queryable as "what blocks my team".
- User value: institutional memory of coordination.
- Reuse: memory stores + `taskHandoffService` + CrystalVault (AGENTS.md module 2). Effort: L. Risk: Med. Deps: 08/M3. Infra: memory + crystals. Why now: memory + crystals exist.

## OPINION

Q1–Q3 are near-free and should ship first; they convert decorative metadata into visible/routeable signal with no kernel risk. M1/B1 are the real payoff.
