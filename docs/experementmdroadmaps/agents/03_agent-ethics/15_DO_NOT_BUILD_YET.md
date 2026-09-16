# 15 — DO NOT BUILD YET: ideas to AVOID for `agent-ethics`

> Guardrails. The repo already risks "25 mini-frameworks" (per task brief). Do NOT add new agent-specific subsystems.

## Avoid

1. **A dedicated "Ethics Engine" service.** There is no need for a new `ethics-engine.ts`. The behavior is achievable by binding existing `bias-profiler`, `ethical_framework` constraint, and `expert-ethics` witness to Elena. A new engine duplicates and fragments. (VERIFIED these already exist.)

2. **A new `ethics:*` event family.** Reuse `COGNITIVE_STEP_COMPLETED` / `conversation:*` / `invocation:*` (all exist, all consumed). Adding `ethics:verdict`, `ethics:audit` etc. creates a 26th event bus and breaks the "events first, no new buses" rule (AGENTS.md Key Principles). (VERIFIED event-registry already has cognitive + conversation + invocation sets.)

3. **A standalone Ethics memory/vector DB.** `AgentJournalService` + CrystalVault already cover memory. Do not spin up a bespoke "ethics memory store" — extend journal tags / crystallize instead. (VERIFIED journal KV exists; Crystal bridge pattern exists.)

4. **Auto-self-invocation by Elena.** D6 (human authority; agents never self-invoke) is a fixed decision (AGENTS.md Invocation Engine). Do NOT let her spontaneously inject herself into debates/forums. (VERIFIED design decision.)

5. **An "ethics cop" that blocks other agents.** Turning her into a hard gatekeeper that _rejects_ deployments/consensus adds latency and governance risk (BIG-2 is medium-term, gated). Do not build blocking authority yet — start advisory. (OPINION/risk)

6. **A new AgentRole type "EthicsOfficer".** The topology already expresses her via `roleName` + `baseRole` + prompt. Adding a special-cased role type invites per-role branching across the codebase (the exact "mini-framework" trap). (INFERRED from agent-service generic handling.)

7. **Prompt-enforcing "must use a framework" hard constraint.** Forcing every turn to name a framework risks robotic output and higher token cost; prefer the existing soft `ethical_framework` constraint + optional verdict contract (MED-1). (OPINION)

8. **Separate ethics UI panel.** Do not create `EthicsPanel` with its own store/events. Surface ethics through existing AgentsPanel tabs, Director Library, Room, and LiveActivityStream. (VERIFIED those surfaces exist; new panel = framework sprawl.)

9. **Retraining / fine-tuning a dedicated ethics model.** She already runs on nvidia/llama-3.3-70b like peers; no evidence a custom model is warranted. (VERIFIED `agent-profiles.ts:48-49`)

10. **Reviving `COGNITIVE_DECISION_MADE`.** It is dead-at-consumer (`event-registry.ts:776`); building ethics signaling on it requires a new consumer and is the wrong foundation. (VERIFIED/AGENTS.md)

## Principle

Extend and **bind existing** shared infra (lenses, constraints, profiler, journal, crystals, invocation policy, cognitive events). Do not create agent-specific frameworks.
