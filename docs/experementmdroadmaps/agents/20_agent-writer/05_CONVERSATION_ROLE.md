# 05_CONVERSATION_ROLE — `agent-writer` in ConversationCore / Director

## How it works today

- `ConversationOrchestrator` and `ChatExecutor` resolve speakers via `agentService.resolveAgent(participantId)` (`agent-service.ts:337`). Any turn whose `participantId === 'agent-writer'` speaks as Clara with her pinned model/provider/prompt. `[VERIFIED]`
- `ConversationDirectorService` (B3) drives scenarios; a `TurnProposal.participantId` of `agent-writer` makes her the speaker (`conversation-director-service.ts`). The Director's `RunTab` lets a human pick participants (`DirectorPanel`/`RunTab`).
- The `HybridPolicy` + `ConversationOrchestrator` emit `conversation:*` events (`event-registry.ts`, B4): `turn:start/complete/error`, `paused`, `resumed`, `aborted`, `completed`. The writer is the `nodeId`/participant in `COGNITIVE_STEP_COMPLETED` for stats.

## CURRENT gap

There is **no scenario or default flow that names `agent-writer`** as a participant. `[INFERRED]` The Director is generic; nothing routes documentation tasks to Clara automatically. She only "appears" if a human authors a scenario with her as a turn participant, or if the runtime router picks her node.

## Scenarios (POTENTIAL, all reuse existing infra)

- **C1 — "Document this decision" conversation.** A 1–2 turn ConversationCore flow: `agent-writer` takes a topic/consensus and emits a doc. Wired via `ChatExecutor` + a `chat` mode invocation (RoomPanel already supports `💬 Chat`). No new code — just a scenario or a RoomPanel task.
- **C2 — Director scenario "Tutorial from spec".** A multi-turn scenario: `agent-architect` proposes design → `agent-writer` drafts the tutorial → `agent-doc-simplifier` simplifies. All participants already exist; only a scenario definition is needed.
- **C3 — Post-debate documentation flow.** On `DEBATE_CONSENSUS`, trigger a ConversationCore session with `agent-writer` to write the decision record (reuses the `conversation:*` + `debate:*` event bridge pattern already present in Forum/phase18).
- **C4 — API-doc generator.** Human invokes Clara (RoomPanel, mode Chat) with "write API docs for module X" — but today she has **no tool to read module X** (only `SEARCH_TOOLS`), so output may be generic. `[INFERRED]` This is the core limitation: without a doc-source tool she cannot write _accurate_ docs.

## Recommendation

Expose Clara as a **first-class "Document" action** in RoomPanel (a `mode: 'document'` or a dedicated button) gated by a `human-mention` policy, exactly like the existing chat/debate/scenario modes (`phase21-invocation.ts`, RoomPanel). Keep her as a ConversationCore `chat` participant so the live `conversation:*` feed + `DirectorStore` already visualize her output. `[OPINION]`
