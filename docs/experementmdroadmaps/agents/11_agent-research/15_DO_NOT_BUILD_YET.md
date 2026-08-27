# 15 — DO NOT BUILD YET (ideas to AVOID)

**Guiding principle (per AGENTS.md): avoid 25 mini-frameworks.** `agent-research` is one of 25 agents; anything built for it must be generalizable or it should wait.

## Ideas to defer / reject

1. **❌ A dedicated `ResearchAgentService` class.**
   - Why avoid: duplicates `AgentService` behavior; violates "agents are topology nodes, behavior is shared infra." Plan A covers everything via config. Revisit only if a private citations store is proven necessary (14).

2. **❌ A new `researchArtifacts` Dexie table (for now).**
   - Why avoid: Crystal Vault + `AgentJournalService` already persist knowledge/history. Adding a 21st-era table for one agent's citations premature. Use Crystal export first.

3. **❌ Auto-invocation / agent-initiated invocation for agent-research.**
   - Why avoid: D6 (human authority) + D3 (engine-mediated) are deliberate design constraints. `allowAgentInitiatedInvocation:false` (`phase21-invocation.ts:137`) is correct. Do not let it self-spawn research loops.

4. **❌ A bespoke Research UI panel separate from AgentsPanel.**
   - Why avoid: the generic AgentsPanel already renders it; a special panel fragments UX and maintenance. Extend, don't fork (09).

5. **❌ Fine-tuning / custom model hosting for "research."**
   - Why avoid: profile model `openrouter/meta-llama/llama-3.3-70b-instruct` is fine; no evidence a specialized model is needed. Premature optimization + cost.

6. **❌ Citation-verification microservice (link checker).**
   - Why avoid: real value, but should be a **shared** capability (any agent could cite), not agent-research-specific. Build shared, then attach. Not now.

7. **❌ Scheduled autonomous research crawls.**
   - Why avoid: no schedule-trigger policy exists system-wide; building it for one agent invites 25 cron agents. Wait for the generic scheduler (D2) then opt-in.

8. **❌ Merging agent-research INTO the phase9 Research Engine by deletion.**
   - Why avoid: they serve different layers (agent = participant/persona; engine = source/query pipeline). Merge by _reference_ (B2 in 11), not by collapsing one into the other.

9. **❌ Specialized debate persona hardcoded to agent-research.**
   - Why avoid: `PersonaSelector` is topic-driven and shared; hardcoding a `research` persona for one node breaks the generic model. Let keyword matching handle it (04).

10. **❌ Per-agent memory namespace / vector store just for this agent.**
    - Why avoid: ~16 memory stores already exist generically; a 17th private one for one node is the mini-framework trap. Use journal tags + Crystal (08).

**Bottom line:** Every genuinely useful capability for `agent-research` is achievable by _wiring existing services_ (Plan A). New services/tables/panels/autonomy should wait until a shared, generalizable need is demonstrated.
