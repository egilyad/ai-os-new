# 07_COGNITIVE_ROLE — cognitive event stream for `agent-devops`

> VERIFIED from `event-registry.ts:736-776`, `agent-service.ts:184`, `agent-journal-service.ts:130-190`.

## Cognitive events (VERIFIED)

| Event                                                | Emitted about devops? | Consumer (devops path)                                                        |
| ---------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| `COGNITIVE_TRACE_UPDATED` (`event-registry.ts:736`)  | Yes (producer)        | Trace UI                                                                      |
| `COGNITIVE_STEP_ACTIVE` (`event-registry.ts:755`)    | Yes                   | `AgentJournalService` (`agent-journal-service.ts:130`)                        |
| `COGNITIVE_STEP_COMPLETED` (`event-registry.ts:763`) | Yes                   | `AgentService` stats (`agent-service.ts:184`); `AgentJournalService` (`:150`) |
| `COGNITIVE_DECISION_MADE` (`event-registry.ts:776`)  | Producer only         | **DEAD at consumer** (per AGENTS.md)                                          |

## What is actually surfaced (VERIFIED)

- **Stats only:** `AgentService` accumulates `calls/tokens/latency/errors/estimatedCost` per `nodeId` from `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184-210`). Shown in `AgentLiveBoard` / AgentsPanel.
- **Journal:** `AgentJournalService` records `cognitive_step` entries per devops run (`agent-journal-service.ts:130-171`) but **tags are always empty** (`tags: []`), so you cannot filter "all Kubernetes-related devops steps".
- **Decisions:** `COGNITIVE_DECISION_MADE` is emitted by `CognitiveService` but never consumed/displayed → devops _reasoning decisions_ are invisible.

## Debate emits NO cognitive events (VERIFIED by AGENTS.md + `event-registry.ts`)

Debate uses `debate:*` events only. So a devops debate turn contributes **nothing** to its cognitive trace. Only ConversationCore/Director/Orchestrator steps feed `COGNITIVE_STEP_*`.

## Recommended display/integration (OPINION) — display only, no new infra

1. **AgentLiveBoard cognitive tab:** show `COGNITIVE_STEP_ACTIVE/COMPLETED` for `agent-devops` as a live "thinking" indicator + last-step latency.
2. **Tag propagation:** have `AgentJournalService` derive tags from the agent's `specializations` (`agent-profiles.ts:80`) so devops steps are searchable by `CI/CD`/`Kubernetes`/`Observability`. (Small change in `agent-journal-service.ts:133-146`.)
3. **Resurrect decision display:** surface `COGNITIVE_DECISION_MADE` for devops in the cognitive timeline (consumer-side only; the event already exists).

## Reuse

- All events already exist; no new event needed. Display-only work on existing stores (`useDirectorStore`, `AgentJournalService.listByAgent('agent-devops')`, `AgentService.getStats('agent-devops')`).
