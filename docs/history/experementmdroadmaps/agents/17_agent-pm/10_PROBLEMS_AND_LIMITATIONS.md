# 10 — PROBLEMS & LIMITATIONS

> Concrete, VERIFIED problems with file:line evidence. No fabrication. Where a prior doc in this folder was wrong, it is called out.

## P1 — Specializations are decorative (VERIFIED)

`['Planning','Agile','Risk']` (`agent-profiles.ts:190`) are stored and shown as UI tags only. **No consumer** reads them for behavior:

- `persona-selector.ts:3-241` — no `specializations` reference; variants chosen by topic keywords + debate role.
- `debate-agent-executor.ts` — grep for `specializ` → only `participant.agentId` usage (`debate-agent-executor.ts:78`).
- `conversation-execution-engine.ts` — no specialization-based branching for `agent-pm`.
  **Impact:** the agent's defining trait does nothing. A PM and a generic node behave identically in debate/conversation except for the system prompt.

## P2 — Model-pin claim was mis-documented (CORRECTION, VERIFIED)

Prior docs in this folder marked the `llama-3.3-70b` pin as DEAD ("overridden by `model:'auto'`"). **Source contradicts this:** `normalizeAgentIdentity` overwrites `config.model` with the profile value (`topology-defaults.ts:104-105`), and `resolveAgent` returns it because it is not `auto`/`default` (`agent-service.ts:351-353`). **The 70B pin IS live.** The _real_ limitation is different: because the model is **explicit** (not `auto`), `agent-pm` **cannot benefit from provider/key failover or model routing** — if `openrouter/llama-3.3-70b-instruct` is down/credits-404/402, the turn fails instead of rerouting (contrast nodes left `'auto'`, which route). _Evidence:_ `agent-profiles.ts:189`; `topology-defaults.ts:104-105`; `debate-llm-caller` failover applies to `'auto'`/routed models.

## P3 — No structured planning output (VERIFIED/INFERRED)

`agent-pm` cannot emit a roadmap/Gantt/risk-register as data. Its "plan" is free-text from the LLM. No planner tool, no `FACILITATE`/`SUMMARIZE` objective type (`TurnProposal.objective.type` is a fixed enum, AGENTS.md B5.3). **Impact:** plans are not queryable, not comparable, not recallable.

## P4 — Debate turns are not journaled (VERIFIED)

Debate emits **no** `cognitive:*` events (AGENTS.md). `AgentJournalService` subscribes to `COGNITIVE_STEP_ACTIVE/COMPLETED` and `debate:runtime:agent:error` only (`agent-journal-service.ts:129-190`). So `agent-pm`'s debate contributions are **not** recorded in its journal, unlike its ConversationCore turns. **Impact:** weaker recall/continuity for the agent's most "PM-like" surface.

## P5 — "Management" group is UI-invisible (VERIFIED)

`agent-pm` is hard-coded into the `Management` prompt-audit group (`prompt-audit-service.ts:18`) and exempted from the tool-requirement (`prompt-audit-service.ts:192`). This is a real behavioral fact but **no panel surfaces it** — users cannot tell why a tool-less PM is audited.

## P6 — No meta/coordinator elevation (VERIFIED)

`debate-meta-agent-controller.ts` has no `agent-pm` branch (grep: no `specialization`/`lensIds`/`agent-pm`/`roleName`). `agent-pm` is never auto-promoted to facilitator even in consensus debates. **Impact:** a natural PM role is unused.

## P7 — No PM lens (VERIFIED)

`agent-pm` has `lensIds:[]` (`topology-defaults.ts:106`). The lens library has no planning/agile/risk lens (grep `lens-library.ts` → no match). **Impact:** its turns are not framed through any analytical lens.

## P8 — Auto-spawn can clone PM indiscriminately (INFERRED, low risk)

`evaluateAutoSpawn` (`agent-service.ts:614-665`) clones any busy agent under `maxAgents`. A cloned `agent-pm (Auto-clone)` inherits the 70B model — a cost surprise if many PM tasks queue. **Risk:** cost, not correctness.

## P9 — Identity is static seed (VERIFIED)

The canonical identity lives in `agent-profiles.ts:182-191`; editing requires a code change. `AgentIdentityEditor` can override per-node at runtime, but the seed is hardcoded. Acceptable, but note it for "edit via UI" expectations.

## Summary

The agent is **well-described but functionally generic**. The single most important real bug is **P1 (dead specializations)**; the most important _correctness correction_ is **P2 (model pin actually works, but loses failover)**.
