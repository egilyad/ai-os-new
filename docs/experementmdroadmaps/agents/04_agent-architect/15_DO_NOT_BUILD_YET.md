# 15 — DO NOT BUILD YET: ideas to AVOID for `agent-architect`

> Guardrail against over-engineering. The repo explicitly warns against "25 mini-frameworks". These are NOT recommended now.

1. **❌ A dedicated `ArchitectureAgentService` class.** The agent is a topology node; behavior must stay in shared infra (`AgentService`, Invocation, ConversationCore). A new service duplicates `resolveAgent`/stats/lifecycle for one agent. (See 14 Plan B — avoid until proven.)
2. **❌ New event bus / `arch:*` event family for the agent.** `conversation:*` / `invocation:*` / `debate:*` already cover its paths. Emitting agent-private events fragments the architecture (AGENTS.md D5: "narrow responsibility").
3. **❌ New Dexie table for "architect decisions".** `agent_journal_v1` + `crystals` already store this. A separate table is schema-bloat (repo is already at v20).
4. **❌ Autonomous self-invocation.** AGENTS.md D6: "Authority = human; agents never self-invoke." An architect that spontaneously reviews code without a human trigger breaks the Invocation Engine's authority model.
5. **❌ Separate "Architecture" panel that duplicates `ArchitectureReview`.** There are already TWO architecture concepts confusing users (problem #4). A third surface makes it worse — instead _merge_ (Plan A Phase 0/B2).
6. **❌ Agent-specific LLM fine-tune / custom model routing.** The profile already pins `groq/llama-3.3-70b-versatile` via shared provider routing; a bespoke path bypasses failover/key-state machinery (recently hardened in P2.22/Governor fixes).
7. **❌ Persona variants per-agent in `persona-selector.ts`.** Injecting 25 agent-specific variants explodes the variant table. Instead bind a lens (`lensIds`) — that's the intended extension point (M2/Q3).
8. **❌ Workflow/Builder "architect node" until the debate hook is fixed.** `builder-agent-service.ts:40` emits the unregistered `debate:start`; `workflow-service.ts` dispatch is unwired. Building architect-workflow UX on this is building on a broken foundation — fix the hook first (or don't, it's dead).
9. **❌ Memory store scoped only to the architect.** The shared `memory-engine` + journal already serve all agents; a private store fractures recall and contradicts the "shared infra" rule.
10. **❌ "Architect marketplace persona" / cloning logic.** `agent-marketplace.ts` + `autoSpawn` already exist generically; a bespoke architect clone path is redundant.

**Bottom line:** every valuable capability for this agent is reachable through **glue + policies + lenses + existing panels**. Do not introduce new agent-private machinery.
