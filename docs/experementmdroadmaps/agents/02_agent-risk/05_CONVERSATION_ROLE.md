# 05_CONVERSATION_ROLE — `agent-risk` in ConversationCore / Director

## CURRENT mechanics (VERIFIED)

- ConversationCore resolves participants through `AgentService.resolveAgent(id)` (agent-service.ts:337-390), returning the node's prompt (`auto` model, role "Risk Analyst").
- `ChatExecutor` runs each turn; `HybridPolicy`/`ConversationOrchestrator` schedule turns for whatever participants a `ConversationScenario` lists (B3/B4 implementation in AGENTS.md).
- `agent-risk` is a participant **only if explicitly included** in a scenario's `participants` list. There is no auto-inclusion.
- `DirectorStore` observes `conversation:*` events (B4) — so a run involving agent-risk shows in RunTab's live feed and turn log.

## Participant behavior (INFERRED)

- When agent-risk speaks a turn, it uses the static risk-analyst prompt + `auto` model, exactly as in debate. No risk-specific turn logic, no Monte-Carlo tool invocation, no compliance checklist. The "objective" field of the turn (from `TurnProposal`) is the only steering input.
- temperature 0.15 (topology-defaults.ts:163) keeps it deterministic — good for a risk assessor.

## Recommended Director scenarios (OPINION)

1. **Risk Review scenario** — participants: [agent-risk (lead), agent-architect, agent-security]; turns: agent-risk proposes risk taxonomy → architect rebuts feasibility → security adds threat model → agent-risk synthesizes mitigation plan. Maps to the `HybridPolicy` ordered-turn model already built.
2. **Compliance Audit scenario** — participants: [agent-risk, agent-ethics, agent-legal?]. agent-risk quantifies compliance exposure per control.
3. **Pre-mortem** — agent-risk runs a Monte-Carlo "what fails" simulation as the opening turn.

## Integration opportunities (INFERRED)

- A pre-built "Risk Review" scenario template in the ConfigureTab (B5.3 editor) would let users one-click launch agent-risk in its natural role — reuses `ScenarioRepository.create` + Director run, no new engine.
- Director's `overrideTurn` (B5.4c) already lets a human inject a risk-question turn mid-run — a natural fit for "ask the Risk Analyst to re-score".

## Caveats (VERIFIED)

- The declared model pin (`llama-3.3-70b-instruct`) is NOT honored (model=`auto` in topology) — ConversationCore runs whatever routing selects. See 00/01.
- No memory of prior risk conversations is auto-loaded (see 08).
