# 00_PROFILE — `agent-doc-historian`

> Research-only deep-dive. No source changes.
> Classification tags used: **VERIFIED** (read in source), **INFERRED** (derived from code/design), **OPINION** (analyst recommendation).

## Summary

`agent-doc-historian` is one of 25 seeded system agents in SuperAgents OS. It is a **topology NODE** (`type: 'agent'`), not a standalone service. All "behavior" is provided by shared infrastructure (`AgentService`, `OrchestrationService`, Debate/ConversationCore/Invocation layers) that merely resolves and executes the node. The agent's persona is defined by two parallel sources that must agree: `AGENT_PROFILES` (human-friendly identity) and `topology-defaults.ts` (the runtime node config consumed by `AgentService.getAgents()`/`resolveAgent()`).

## VERIFIED facts

| Field                      | Value                                           | Source                                      |
| -------------------------- | ----------------------------------------------- | ------------------------------------------- |
| Node id                    | `agent-doc-historian`                           | `src/kernel/state/agent-profiles.ts:252`    |
| Profile firstName/lastName | Oscar / Vilhelm                                 | `agent-profiles.ts:253-254`                 |
| displayName                | `Oscar Vilhelm`                                 | `agent-profiles.ts:255`                     |
| baseRole                   | `Documentation Historian`                       | `agent-profiles.ts:256`                     |
| Avatar emoji/color         | 📚 / `#6366f1`                                  | `agent-profiles.ts:257`                     |
| Provider                   | `openrouter`                                    | `agent-profiles.ts:258`                     |
| Model                      | `openrouter/meta-llama/llama-3.3-70b-instruct`  | `agent-profiles.ts:259`                     |
| Specializations            | `['Changelog', 'Context', 'Lineage']`           | `agent-profiles.ts:260`                     |
| Topology node id           | `agent-doc-historian`                           | `src/kernel/state/topology-defaults.ts:433` |
| Topology label             | `Historian Agent`                               | `topology-defaults.ts:435`                  |
| Topology roleName          | `Documentation Historian`                       | `topology-defaults.ts:437`                  |
| Topology prompt            | narrative-context historian prompt              | `topology-defaults.ts:438`                  |
| Topology temperature       | `0.4`                                           | `topology-defaults.ts:439`                  |
| Topology tools             | `[]`                                            | `topology-defaults.ts:440`                  |
| Topology model             | `'auto'` (overridden by profile provider/model) | `topology-defaults.ts:441`                  |

**IMPORTANT note on model resolution.** The topology node config sets `model: 'auto'` (`topology-defaults.ts:441`), but `AgentService.resolveAgent()` (`:352-353`) treats `'auto'` as "no explicit model" and returns `undefined` for `model`. The _pinned_ model only survives if it is read from `AGENT_PROFILES`, not from the node config. The node config `prompt` (`topology-defaults.ts:438`) is what `resolveAgent()` surfaces as `systemPrompt` (`:346-350`). **VERIFIED**: the runtime persona uses the topology prompt; the model `openrouter/meta-llama/llama-3.3-70b-instruct` comes from `AGENT_PROFILES`, not the node.

## INFERRED

- The agent belongs to the **Documentation cluster** of 5 doc agents: `agent-doc-architect`, `agent-doc-auditor`, `agent-doc-simplifier`, `agent-doc-historian`, `agent-doc-checker` (`topology-defaults.ts:222-271`). They share identical provider/model families (openrouter/nvidia/groq) but are independent nodes with no cross-wiring in code.
- There is no dedicated "historian" runtime path. The `specializations: ['Changelog','Context','Lineage']` are **metadata only** — no subsystem reads them to route work to this agent (see 09_LENSES, 14_EVENT_LOG_LINEAGE).

## OPINION

- Because identity is split across `AGENT_PROFILES` (provider/model/avatar/specs) and `topology-defaults.ts` (prompt/label/roleName), the two can drift. The historian's pinned model lives ONLY in `AGENT_PROFILES`; if a future refactor reads model from the node config, it will silently become `'auto'`.
