# 11 — OPPORTUNITIES

> Each: ID | Description | User value | Technical reuse | Effort | Risk | Dependencies | Existing infra | Why now

## 5 QUICK WINS (S/M effort)

- **Q1 | Fix groq model pin propagation**
  Desc: make `resolveAgent` honor `AGENT_PROFILES.model` when topology `model:'auto'`.
  User value: PO actually runs on configured groq model (predictable quality/cost).
  Reuse: `agent-service.ts:351-353`, `agent-profiles.ts:199`. Effort: S. Risk: Low (may conflict with router override—gate behind profile priority). Deps: none. Infra: existing resolver. Why now: it's a silent correctness bug (#2 in `10`).

- **Q2 | Surface specializations as actionable chips in AgentCard**
  Desc: render `Backlog/Vision/Prioritization` as clickable chips → RoomPanel prefilled invoke.
  User value: one-click PO tasks. Reuse: `AgentCard.tsx:68`, `RoomPanel` invoke. Effort: S. Risk: Low. Deps: none. Infra: invocation path. Why now: specializations are currently inert (#1).

- **Q3 | PO activity filter in LiveActivityStream**
  Desc: filter `COGNITIVE_STEP_COMPLETED` by `nodeId:'agent-po'`.
  User value: see PO's work at a glance. Reuse: `LiveActivityStream`, `event-registry.ts:763`. Effort: S. Risk: Low. Deps: none. Infra: cognitive events. Why now: trivial display win (`07`).

- **Q4 | PO quick-invoke templates in RoomPanel**
  Desc: add "Groom backlog / Define vision / Prioritize" task templates prefilling `reason`.
  User value: guided PO usage. Reuse: `phase21-invocation.ts:89-108`, RoomPanel pickers. Effort: S. Risk: Low. Deps: none. Infra: invocation. Why now: human-facing rework already done (`AGENTS.md` Step 6).

- **Q5 | Pre-group PO+PM+Lead as "Product Trio"**
  Desc: seed an `AgentGroup` (`agent-service.ts:27`) "Product Trio" with the 3 management agents.
  User value: one-click multi-agent product workflow. Reuse: `AgentGroupsSection`, groups KV. Effort: S. Risk: Low. Deps: none. Infra: groups. Why now: trivial, supports `05` C1.

## 5 MEDIUM

- **M1 | Dedicated `persona:product-owner` variant**
  Desc: add PO persona to `persona-selector.ts` keyed on agent specialization, not just debate role.
  User value: PO defends user-value/scope in debates. Reuse: `persona-selector.ts`, `AgentResolverDirectory` already exposes specializations (`phase21-invocation.ts:47`). Effort: M. Risk: Med (must not override explicit debate role semantics). Deps: `persona-selector` caller passes specializations. Infra: debate runtime. Why now: #4 in `10`.

- **M2 | Structured PO turn types in Director**
  Desc: `TurnProposal` objective types `PRIORITIZE`/`DEFINE_REQUIREMENTS` so PO output is schema-backed.
  User value: machine-usable backlog. Reuse: `conversation-director-service.ts`, `TurnProposal` contract. Effort: M. Risk: Med (contract extension). Deps: Director. Infra: ConversationCore. Why now: #6 in `10`.

- **M3 | PO backlog memory store**
  Desc: dedicated `memory-engine` namespace seeded by PO structured outputs.
  User value: continuity across PO sessions. Reuse: `memory-engine.ts:181`, KV pattern. Effort: M. Risk: Low. Deps: M2. Infra: memory. Why now: #8 in `08`.

- **M4 | `lens:product-vision`**
  Desc: add a product/vision lens to `lens-library.ts`; auto-attach to PO.
  User value: PO viewpoint amplified in synthesis/debate. Reuse: `lens-library.ts` (11 existing), `resolveAgentIdentity.lensIds`. Effort: M. Risk: Low. Deps: none. Infra: Lens engine. Why now: #9 in `10`.

- **M5 | Resurrect `COGNITIVE_DECISION_MADE` consumer for PO**
  Desc: label PO prioritization as first-class decisions; add a consumer.
  User value: auditable PO decisions. Reuse: `event-registry.ts:776`, dead-at-consumer note. Effort: M. Risk: Med (event currently dead). Deps: none. Infra: cognitive stream. Why now: #8 in `10`.

## 3 BIG IDEAS

- **B1 | PO as Scope-Governor agent (autonomous gate)**
  Desc: a pre-turn hook in ConversationCore where PO rejects/re-anchors out-of-scope turns.
  User value: autonomous scope discipline. Reuse: ConversationOrchestrator, `agentService.resolveAgent`. Effort: L. Risk: High (new execution hook, D5/D6 authority concerns). Deps: ConversationCore hook + M2. Infra: ConversationCore. Why now: raises PO from persona to guardian.

- **B2 | PO ↔ Workflow/Crystal bridge**
  Desc: PO debate/conversation outputs flow into Builder (workflows) + Crystal Vault (validated requirements).
  User value: closed loop idea→requirement→workflow. Reuse: `crystal-vault-service`, `builder-agent-service`, invocation delegate (`phase21-invocation.ts:61`). Effort: L. Risk: High (cross-module). Deps: M2, Crystal, Builder. Infra: cognitive modules. Why now: completes the 7-module chain for PO.

- **B3 | Product Trio orchestration scenario**
  Desc: a reusable Director scenario (PO+PM+Lead) for backlog grooming → planning → architecture.
  User value: turnkey product management pod. Reuse: `ScenarioRepository.create`, Director, groups (Q5). Effort: L. Risk: Med. Deps: Q5, M2. Infra: Conversation Director. Why now: leverages existing Management cluster + Director.
