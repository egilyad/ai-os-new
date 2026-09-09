# 02_CAPABILITIES — `agent-doc-architect`

> What the agent is _capable_ of, derived from its config + the infra that resolves it. **VERIFIED** = directly in source; **INFERRED** = follows from config but not explicitly exercised.

## Intrinsic capabilities (from profile + node config)

| Capability                                      | Evidence                                                                 | Note                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Persona: "Documentation Architect"              | `topology-defaults.ts:402` system prompt                                 | "describe system structure precisely, map code→architecture, never invent, traceable to source" |
| High-quality model                              | `agent-profiles.ts:229` → `openrouter/meta-llama/llama-3.3-70b-instruct` | 70B instruct; merged into node by `topology-defaults.ts:105`                                    |
| Low temperature                                 | `topology-defaults.ts:403` `temperature: 0.1`                            | Deterministic, structured output                                                                |
| Information Architecture / Taxonomy / Standards | `agent-profiles.ts:230` specializations                                  | Stored as data; **not** consumed by any router/persona logic (see 10)                           |
| Visual identity                                 | `agent-profiles.ts:227` emoji `🏛️` color `#a855f7`                       | Rendered via `agentAvatarService` / `AgentAvatar.tsx`                                           |
| OpenRouter provider                             | `agent-profiles.ts:228`                                                  | Subject to OpenRouter key/balance (402 handling — see AGENTS.md runtime fixes)                  |

## Capability gaps (INFERRED from `tools: []`)

- **No retrieval/grounding.** `tools: []` (`topology-defaults.ts:404`). It cannot read source files, search the codebase, query crystals, or open existing docs. The "traceable to specific source files" promise in its prompt is **unenforceable** by the agent itself.
- **No tool-augmented reasoning.** Unlike `agent-architect` (`CODER_TOOLS`) or `agent-risk` (`ANALYTICS_TOOLS`), it is a pure-LLM persona.

## Capabilities granted by shared infrastructure (VERIFIED)

- **Resolvable identity** — `AgentService.resolveAgent` (`agent-service.ts:337`) returns the merged config (model, prompt, specializations, avatar, provider).
- **Executable participant** — when named in a debate/conversation/director turn, `ChatExecutor` (ConversationCore) and the debate executor resolve it through `agentService` and run it on its pinned model.
- **Observable** — every execution emits `COGNITIVE_STEP_COMPLETED` with `nodeId:'agent-doc-architect'`, feeding stats (`agent-service.ts:184`), journal (`agent-journal-service.ts:150`), memory (`memory-engine.ts:181`), health (`agent-health-monitor.ts:66`).
- **Invocable by human** — RoomPanel human-pick → Invocation Engine → ConversationCore/Debate (`phase21-invocation.ts`).
- **Auditable** — grouped as "Documentation" in prompt-audit (`prompt-audit-service.ts:46`).

## Capabilities it does NOT have (VERIFIED absent)

- No `lensIds` (defaults `[]`, `topology-defaults.ts:106`) → no cognitive-lens augmentation.
- No group membership → no group-execution patterns (`agent-service.ts:27-35` group types).
- No event subscription / no scheduler trigger naming it.
- No `document:*` event emission (none exist in `event-registry.ts`).

## Opinion

The agent is **over-specified in identity, under-specified in capability**. Its specializations and low-temperature architect prompt read like a senior technical writer, but without tools or a routing rule it will only ever fire when a human or a hardcoded list explicitly selects it — and when it does, it produces ungrounded prose.
