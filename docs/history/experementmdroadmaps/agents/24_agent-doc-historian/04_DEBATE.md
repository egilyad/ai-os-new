# 04_DEBATE — `agent-doc-historian`

Participation of the historian in debates.

## VERIFIED

- The debate runtime does **NOT** reference `agent-doc-historian`, `doc-architect`, or any doc-cluster id anywhere. Grep across `src/kernel/services/debate-runtime` for `agentService|resolveAgent|agent-doc-historian` → **no matches**.
- Debate participants are supplied by the debate **config/store** (the human/UI selects participants), not auto-selected by specialization. `phase21-invocation.ts:75-87` shows the Invocation execution delegate can start a debate with `agents.map(... role:'neutral')` — i.e. any agent, including the historian, can be a debate participant if named.
- `persona-selector.ts` (`src/kernel/services/debate-runtime/persona-selector.ts`) defines a **persona variant** `id: 'historian'` (`:98-121`) with trigger keywords `history, past, tradition, era, decade, century, ...` and `minRound: 2`. This is a _debate persona_, NOT the `agent-doc-historian` node. It can be attached to ANY participant. The selector scores by topic keywords (`:243-249`, `:270-289`).
- Same `historian` persona variant id also appears in `persona-mixer.ts:33` and `audience-archetypes.ts:258` (debate audience archetype). Unrelated to the node.
- `debate-agent-executor.ts` and `debate-meta-agent-controller.ts` (+ `contracts/debate-meta-agent.ts`) exist (listed in directory) but contain no historian-specific logic (no grep hits).
- `achievement-definitions.ts:380` defines `id: 'debate_historian'` — a gamification achievement, not the agent.

## INFERRED

- The historian CAN participate in a debate only if (a) it is added as a participant in the debate config, or (b) it is invoked via the Room/Invocation engine in `mode: 'debate'` (`phase21-invocation.ts:75`). When present, the `persona-selector` _might_ assign the `historian` persona variant to it based on topic keywords — but that is keyword-driven, not identity-driven.
- Debate emits **NO** cognitive events (per AGENTS.md and confirmed: grep for `COGNITIVE` in debate-runtime → none). So the historian, if debated, produces no `COGNITIVE_STEP_COMPLETED` from the debate path itself — its stats during debate come from the underlying LLM `STREAM_END` handler (`agent-service.ts:219-244`).

## OPINION

- There is no "historian-first" debate routing. A topic about "system lineage" would not preferentially pick `agent-doc-historian`; it would pick whatever participants were configured, then optionally dress them in the `historian` persona.
