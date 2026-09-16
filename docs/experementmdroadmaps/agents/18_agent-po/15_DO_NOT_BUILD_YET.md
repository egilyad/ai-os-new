# 15 — DO NOT BUILD YET (avoid)

> Ideas to AVOID, especially the trap of 25 mini-frameworks. OPINION-backed, with reasons.

## Hard avoid

1. **A bespoke "ProductOwnerService" kernel module.** Tempting ("give PO its own service"), but it would duplicate `AgentService`/`ConversationDirectorService` and violate the Dependency Rule + "no globals in kernel" + the shared-infra model. PO is a _node_, not a subsystem. (VERIFIED: all 25 agents share `AgentService`; no per-agent service exists.)

2. **A 26th agent-specific framework (backlog-engine, vision-engine, prioritization-engine).** The repo already has 7 cognitive modules (Lenses/Crystals/Junction/Synthesis/Generator/Forum/Builder) + Debate + ConversationCore + Invocation. Spinning a PO-specific engine fragments the architecture and contradicts AGENTS.md's "no 25 mini-frameworks" warning. Reuse `memory-engine` + `TurnProposal` + `lens-library` instead (`12`).

3. **Autonomous scope-policing subscriber (Plan B).** Violates D5/D6 (AGENTS.md). See `14`.

4. **Encoding specializations into a new routing layer.** Do NOT build a "specialization router" that picks agents by `['Backlog','Vision','Prioritization']`. `resolveAgents` already reads specializations for `expertise` targets (`invocation-engine-service.ts:167-173`); extending that is fine, but a standalone router duplicates `AgentResolverDirectory`.

5. **PO-specific DebatesPersona hardcoded by id.** Never special-case `agent-po` inside `persona-selector.ts` (e.g. `if (agentId==='agent-po')`). That breaks the generic model and the 25-agent parity. Key on _specialization_, not id (`04` M1).

6. **New cognitive events for PO.** `COGNITIVE_DECISION_MADE` already exists (dead-at-consumer). Do NOT invent `po:decision` / `po:backlog` events — reuse the existing four (`07`). More events = more WAL/heap surface (already filtered at `event-recorder.ts:229-261`).

7. **A separate PO UI panel.** `AgentsPanel` + `RoomPanel` + `DirectorPanel` already cover invoke/observe/edit. A dedicated `ProductOwnerPanel` would be a 639th→ redundant panel. Extend existing tabs (`AgentCapabilitiesTab`, RoomPanel templates).

8. **Train/fine-tune a PO model.** The groq pin is a config value; do NOT pursue model training for "product sense." Out of scope, high cost, low ROI vs a better system prompt + lens.

## Guiding principle

Every PO enhancement should be **configuration + contract extension + UI glue** on existing services. If a proposal needs a new kernel service named after `agent-po`, reject it.
