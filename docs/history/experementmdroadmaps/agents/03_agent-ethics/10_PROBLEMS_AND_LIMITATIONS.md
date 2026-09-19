# 10 — PROBLEMS & LIMITATIONS: `agent-ethics` (VERIFIED)

Concrete, code-grounded issues. Each cites evidence.

1. **No ethics-specific behavior beyond a one-line prompt.** (`topology-defaults.ts:174`) Her entire "Ethics Officer" capability is one sentence. Nothing enforces that she applies frameworks, audits bias, or returns responsible alternatives. She is a generic LLM node wearing an ethics costume.

2. **Ethics machinery exists but is NOT bound to her.** `bias-profiler.ts`, `ethical_framework`/`ethical_evaluation` constraints (`debate-prompt-constants.ts:37,55`), and `expert-ethics` witness (`expert-witness-service.ts:35`) are all topic-keyword triggered and agent-agnostic. Elena gets no preferential use.

3. **Invisible in the cognitive stream during debate.** Debate runtime emits `debate:runtime:agent:*` but **no `COGNITIVE_*` events** (verified by grep across `debate-runtime`). So her debate reasoning never reaches `AgentService` stats, `AgentJournalService`, or `LiveActivityStream`. (Contradicts the "visibility only via COGNITIVE_STEP_COMPLETED" rule in AGENTS.md.)

4. **Debate successes are not journaled.** `AgentJournalService` only logs `debate:runtime:agent:error` (`:174-189`), not successful debate steps. Her most prolific ethics output (debates) leaves no memory trail.

5. **Journal identity is raw nodeId, not name.** Entries set `agentName: e.nodeId` (`:135,161,179`) → "agent-ethics", not "Elena Marchetti". Harder to read; inconsistent with the human-facing identity.

6. **No ethics taxonomy in memory.** Journal `tags: []` always (`:141,167,185`). Cannot filter/retrieve her ethics work.

7. **No Lens attached.** `lensIds: []` after normalization (`topology-defaults.ts:106`); `lens-library.ts` has **no ethics lens** (only a `policy` applicability tag at `:138,151,265`). Synthesis/Lens machinery never applies an ethics perspective for her.

8. **Prompt-audit flags "no tools assigned".** (`prompt-audit-service.ts:192-198`) — arguably correct, but creates noise for a deliberately tool-less role.

9. **Side assignment ignores specialization.** Debate `pro`/`con`/`neutral` comes from the creator, not from "this is the Ethics Officer → neutral auditor" logic (`persona-selector.ts` keys on role+keywords only).

10. **No auto-ethics hooks into Crystal/Forum/Workflow/Scheduler.** She never automatically reviews a crystallized insight, a forum consensus, a deployed workflow, or a scheduled job. All participation is manual/opt-in.

11. **Dead cognitive event.** `COGNITIVE_DECISION_MADE` (`event-registry.ts:776`) is dead-at-consumer; any "ethical decision" signal would vanish.

12. **Model pinned but undifferentiated.** She runs on nvidia/llama-3.3-70b like several peers; nothing leverages her specifically. (`agent-profiles.ts:48-49`, `topology-defaults.ts:104-105`)
