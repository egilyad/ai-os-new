# 13_ROADMAP — Phased plan for `agent-data` (Roadmap A: "Agent-aware glue, no new services")

Each phase: task, existing code/service, proposed UI, deps, effort, risk, expected result.

## Phase 0 — Correctness & visibility (1 week)

- **T0.1** Fix journal `agentName` → displayName. Code: `agent-journal-service.ts:135,161` + `resolveAgentIdentity`. UI: AgentJournalPanel auto-fixes. Deps: none. Effort: S. Risk: Low. Result: human-readable history.
- **T0.2** Tag memory writes with `agentId`. Code: `memory-engine.ts:181`. Deps: none. Effort: S. Risk: Low. Result: per-agent recall enabled.
- **T0.3** Agent activity timeline tab. Code: subscribe `COGNITIVE_STEP_COMPLETED`. UI: `AgentDetailPanel`. Deps: none. Effort: S-M. Risk: Low. Result: live "Sam is thinking" view.
- **T0.4** Repair `cognitive:decision:made` (consume or drop). Code: `cognitive-service.ts:414`. Deps: none. Effort: S. Risk: Low. Result: no dead event.

## Phase 1 — Reachability (1-2 weeks)

- **T1.1** "Ask by expertise" in RoomPanel. Code: build `target.expertise`. UI: RoomPanel. Deps: none (engine path exists). Effort: S. Risk: Low. Result: Statistics/Forecasting → Sam.
- **T1.2** Quick-ask buttons in AgentDetailPanel (ML/Stats/Forecast). UI only. Deps: T1.1. Effort: S. Risk: Low. Result: profile → action.
- **T1.3** Seed `expertise:statistics→agent-data` invocation policy. Data only. Deps: phase21. Effort: S. Risk: Low. Result: auto-routable quant reviewer.

## Phase 2 — Voice & framing (2 weeks)

- **T2.1** Specialization-aware debate persona (`specializationAffinity` in `persona-selector.ts`). Deps: none. Effort: M. Risk: Med. Result: Sam reliably the evidence voice.
- **T2.2** Add `lens:statistical` + assign to Sam (`normalizeAgentIdentity`/`lensIds`). Deps: none. Effort: M. Risk: Low. Result: lens badge + transform.
- **T2.3** Inject recent memories into Sam's prompt on resolve. Code: `resolveAgent` + `debate-api.ts`/`ConversationOrchestrator`. Deps: T0.2. Effort: M. Risk: Med. Result: persistent context.

## Phase 3 — Continuity & memory UX (2 weeks)

- **T3.1** Agent memory tab. UI: `AgentDetailPanel`. Deps: T0.2. Effort: M. Risk: Low. Result: "What Sam knows".
- **T3.2** Memory→crystal pipeline for Sam's uncertainty outputs. Code: reuse crystal-vault (phase14) + knowledge-generator (phase17). Deps: T2.2. Effort: M. Risk: Med. Result: durable artifacts.

## Phase 4 — Autonomy (3-4 weeks)

- **T4.1** Resident Quant: subscribe Sam (via expertise policy) to debate/forum streams; auto-inject statistical-critique turn. Code: Invocation + EventBus + debate-api. Deps: T1.3,T2.1. Effort: L. Risk: Med (governance D6). Result: auto quant reviewer.
- **T4.2** Skill-graph routing: specializations become router+invocation consultable index. Deps: T1.3. Effort: L. Risk: Med. Result: content-aware agent selection.

**Expected cumulative result:** `agent-data` evolves from a labeled node into a recognizable, memory-bearing, expertise-routable Data Scientist — built entirely on shipped infrastructure.
