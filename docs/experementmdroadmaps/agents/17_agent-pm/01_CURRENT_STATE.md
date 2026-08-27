# 01 — CURRENT STATE: what `agent-pm` actually does today

> Honest, shared-infrastructure view. **VERIFIED** where read in source; **INFERRED** otherwise.

## The headline (VERIFIED)

`agent-pm` is **not a program**. It is a **topology node** (`type:'agent'`, `topology-defaults.ts:345-355`) that carries a curated identity blob (`agent-profiles.ts:182-191`) and a system prompt. By itself it has **zero bespoke source code** — no file branches on the string `agent-pm` (grep `agent-pm` across `.ts/.tsx` returns only `topology-defaults.ts` and `agent-profiles.ts`; no behavioral reference). Every capability it exhibits is **shared infrastructure** that any agent node gets.

## What happens when `agent-pm` "runs"

1. **Identity injection (build time).** `normalizeAgentIdentity()` copies the curated profile into the node config (`topology-defaults.ts:91-119`), pinning `model = openrouter/meta-llama/llama-3.3-70b-instruct` and `provider = openrouter` (lines 104-105). **The 70B pin is active**, contrary to stale docs in this folder.
2. **Routing / selection (runtime).** Depending on surface:
   - **Debate:** the Mission Router may forward a task to `agent-pm` (`topology-defaults.ts:482`), which emits an argument and its output flows to the aggregator (`topology-defaults.ts:534`). `PersonaSelector` (`persona-selector.ts:3-241`) chooses a _generic_ persona variant (e.g. `pragmatic_economist`, `strategist`, `diplomat`) based on **topic keywords + assigned debate role (`pro`/`con`/`neutral`)** — it does **not** read `agent-pm`'s `Planning/Agile/Risk` specializations (grep confirms no `specializations` reference in `persona-selector.ts`).
   - **ConversationCore / Director:** if a scenario lists `agent-pm` as a participant, `ConversationOrchestrator` resolves it via `agentService.resolveAgent` and `ChatExecutor` speaks the turn with the pinned model + system prompt.
   - **Invocation (RoomPanel):** a human picks `agent-pm`; `InvocationEngineService.invoke` → `AgentResolverDirectory` confirms it is registered → `InvocationExecutionDelegate.start` runs it as chat/debate (`phase21-invocation.ts:60-110`).
3. **Execution.** The turn is produced by the shared LLM layer (`ChatExecutor` / `debate-agent-executor`) with the node's system prompt and pinned model. No PM-specific tool, planner, or state machine is engaged.
4. **Telemetry.** `AgentService` accrues `AgentStats` for `agent-pm` from `COGNITIVE_STEP_COMPLETED` and `STREAM_END` events (`agent-service.ts:175-256`). `AgentJournalService` records a `cognitive_step` entry keyed by `agentId` (not name) (`agent-journal-service.ts:129-191`).

## Concrete behavioral participation today (VERIFIED)

- **Prompt-audit grouping:** `agent-pm` is hard-coded into the `Management` audit group (`prompt-audit-service.ts:18`), alongside `agent-po` and `agent-lead`. This group is _exempted_ from the "must have tools to be audited" rule (`prompt-audit-service.ts:192`: `if (!a.hasTools && a.group !== 'Management')`). So `agent-pm` **is** subject to prompt auditing despite having `tools:[]`. This is the one place `agent-pm` is referenced by name for behavior.
- **Debate topology participation:** router→pm→aggregator edges exist (`topology-defaults.ts:482,534`), so it is a routable debate participant.
- **Stats / observability:** appears in `AgentStatsDashboard`, `EloLeaderboard`, `LiveActivityStream`, `AgentGroupsSection` like any node.

## What it does NOT do (VERIFIED / INFERRED)

- **No planning artifact:** it cannot create a roadmap, Gantt, milestone list, or risk register as structured data. Its "planning" exists only as free-text the LLM improvises from the system prompt.
- **No specialization-driven routing:** `Planning/Agile/Risk` (`agent-profiles.ts:190`) are surfaced as UI tags only; **no runtime path reads them** to select persona, route, or gate tasks (grep `specializations` in `persona-selector.ts`, `debate-agent-executor.ts`, `conversation-execution-engine.ts` → no consumer for `agent-pm`).
- **No meta-agent role:** `debate-meta-agent-controller.ts` does not branch on `agent-pm` (grep for `specialization|lensIds|agent-pm|roleName` → no match). `agent-pm` is never auto-elevated to coordinator.
- **No lens, no memory scope:** no `lensIds`; not a special memory owner (the ~16 memory stores are subsystem-scoped, not agent-pm-scoped).
- **No cognitive-event surfacing of its own:** `agent-pm` emits the generic `COGNITIVE_STEP_COMPLETED` (via the node-execution path); it does not author `cognitive:decision:made` (that event is dead-at-consumer per AGENTS.md). Debate runs emit **no** cognitive events.

## Bottom line

Today `agent-pm` = **a well-described generalist LLM node** wearing a PM costume (name, avatar, system prompt, pinned 70B model, three decorative specialization tags). Its PM-ness is _narrative_, not _functional_.
