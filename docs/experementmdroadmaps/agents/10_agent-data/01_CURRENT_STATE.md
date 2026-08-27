# 01_CURRENT_STATE — What `agent-data` Actually Does Now

> Verdict: **`agent-data` is a passive topology node.** It has no agent-specific code path. All behavior is shared infrastructure (AgentService, debate runtime, director, memory, journal) acting on its node config. The curated identity (Sam Okafor, groq/llama-3.3-70b-versatile, ML/Statistics/Forecasting) is injected once at topology build and then consumed generically.

## Honest behavior map (VERIFIED)

| Behavior                              | Is it agent-specific?                                                                                   | Evidence                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Appears in AgentsPanel list           | No — `getAgents()` enumerates all `agent`/`router` nodes                                                | agent-service.ts:306-329                           |
| Has a pinned model/provider in debate | **Yes, but only as config pass-through** — `debate-api.ts:315-319` reads `node.config.provider`/`model` | debate-api.ts:308-320                              |
| Gets a debate persona                 | No — topic-keyword selection, ignores specializations                                                   | persona-selector.ts:243-290                        |
| Earns usage stats                     | No — `COGNITIVE_STEP_COMPLETED` listener keys by `nodeId` generically                                   | agent-service.ts:184-210                           |
| Writes to memory                      | No agent-specific logic — `memory-engine.ts:181` listens to `COGNITIVE_STEP_COMPLETED` by nodeId        | memory-engine.ts:181                               |
| Gets a journal entry                  | Yes as `nodeId` (name stored = raw id, not "Sam Okafor")                                                | agent-journal-service.ts:150-171                   |
| Can be invoked by a human             | Yes — RoomPanel picks from `getAgents()`                                                                | phase21-invocation.ts (AgentResolverDirectory)     |
| Can be auto-invoked                   | Only via generic router `data_flow` edge or generic auto-spawn clone                                    | topology-defaults.ts:474; agent-service.ts:614-665 |
| Has a lens                            | **No** — `lensIds: []`                                                                                  | topology-defaults.ts:106                           |

## What "specializations" currently DO (VERIFIED)

1. **Stored** in node config (`topology-defaults.ts:102`) and exposed via `resolveAgent.specializations` (`agent-service.ts:385`).
2. **Used by Invocation Engine** for expertise matching: `invocation-engine-service.ts:167-173` matches `target.expertise`/`role` against `agent.specializations`. So if a human/engine requests "Statistics" expertise, `agent-data` is a candidate.
3. **Displayed** in AgentDetailPanel / AgentIdentityEditor (identity resolver returns them).
4. **NOT used** by debate persona selection, not used by routing beyond the static topology edge, not used by Knowledge Generator (which uses lenses).

## What "specializations" currently DON'T do (VERIFIED gaps)

- Debate persona is never derived from ML/Statistics/Forecasting.
- No skill-graph / capability index queryable at runtime beyond the raw array.
- `agent-data` is never auto-selected by _content_ (e.g., a dataset/forecast request) — only by the hardcoded router `data_flow` edge.
- No forecasting or ML-specific tooling beyond generic `ANALYTICS_TOOLS`.

## Lifecycle / health (VERIFIED)

- Lifecycle states (`ready/initializing/busy/idle/paused/terminated`) tracked in `AgentService.lifecycleStates` (`agent-service.ts:77`), transitioned via `transitionLifecycle` (`:596`).
- `agent-health-monitor.ts:66` subscribes to `COGNITIVE_STEP_COMPLETED` to compute health.
- `autoSpawnConfig` can clone any busy agent (`:642-651`) — `agent-data` can be auto-cloned, but clones are generic copies of node config.

## Bottom line

`agent-data` today = **a labeled, model-pinned topology node with rich displayed metadata and zero bespoke logic.** Every "intelligence" it shows is inherited from shared services that treat all 25 agents uniformly.
