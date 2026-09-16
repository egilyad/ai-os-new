# 05_CONVERSATION_ROLE — `agent-ux` in ConversationCore / Director

## CURRENT state

`agent-ux` participates in a ConversationCore scenario as a `TurnProposal.participantId`. The chain (`conversation-director-service.ts` B3 → `conversation-orchestrator.ts:55-60` → `ChatExecutionEngine` → `ChatExecutor` → `CognitiveService.executeAgentNode`) resolves the agent's identity (prompt/model/avatar) from the node and runs it. It can also be auto-wired into the default topology via `e-router-ux` / `e-ux-agg` edges (`topology-defaults.ts:481,533`). **[VERIFIED]**

Unlike debate, the ConversationCore path **does** emit `COGNITIVE_STEP_COMPLETED`, so `agent-ux` turns feed AgentService stats and the cognitive trace view. **[VERIFIED]** (`cognitive-service.ts:229-259`).

## Director scenarios (recommended shapes)

1. **Usability review flow** — a saved `ConversationScenario` whose turns are: `agent-ux` (INTRODUCE: "Audit this screen description for usability problems") → `agent-designer` (respond to findings) → `agent-ux` (synthesize prioritized fixes). The Director's `RecordingExecutionEngine` records each `TurnResult` (`conversation-director-service.ts` B3), giving a reusable, replayable UX review.
2. **Interview synthesis** — `agent-ux` takes raw interview notes as context and produces a structured insight map (pain points / quotes / opportunities). Reuses the existing scenario editor (`ScenarioEditor.tsx`) — no new UI.
3. **Comparative UX critique** — `agent-ux` + `agent-content` + `agent-critic` evaluate two product concepts; `agent-ux` owns the user-centered dimension.

## How to invoke today (no code change)

- DirectorPanel → Configure → create a scenario naming `agent-ux` as a participant (`ScenarioEditor.tsx` participants field) → Run.
- Invocation Engine RoomPanel → pick `agent-ux` → mode `chat`/`scenario`. **[VERIFIED]** (`phase21-invocation.ts:89-108`).

## Recommendation

Promote a **curated "UX Review" scenario template** (reusing `ScenarioEditor` + `scenario-repository.create`) so non-experts can one-click run `agent-ux` against any product description. This is UI-only work on existing primitives. **[OPINION]**
