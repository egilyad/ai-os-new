# 05 — CONVERSATION ROLE: `agent-architect` (ConversationCore / Director)

## CURRENT (VERIFIED)

- ConversationCore resolves participants **by id** through `agentService.resolveAgent` (`agent-service.ts:337`). The Director's execution engine speaks _as_ the named agent — so when a scenario turn lists `participantId: 'agent-architect'`, the architect's system prompt + model (`groq`/`llama-3.3-70b-versatile`) are used (verified by `conversation-execution-engine.test.ts:43-148` and `conversation-hybrid-policy.test.ts:38-125` which use an `architect` participant).
- Scenarios are authored in `ScenarioEditor` (`DirectorPanel`) with free-form participant selection; a human can include `agent-architect` as a turn participant.
- No architecture-specific policy/objective type exists — objectives are generic `TurnProposal`s (`INTRODUCE`/`CHALLENGE`/`QUESTION`…).

## POTENTIAL ROLE

- **Lead architecture reviewer** in a multi-turn Director scenario: e.g. "propose a target architecture → critic challenges → architect refines → synthesizer summarizes".
- **Topology-aware advisor**: because it lives in the same `AuditorTopology`, it could be given a scenario objective to "review the current topology for scalability" — leveraging `topology-defaults.ts` directly.
- **Bridge to `architectureReviewService`**: a Director scenario could pair the agent with the static analyzer's findings (see 10/12).

## Scenarios

1. **Architecture proposal scenario** — participants `[architect, critic, synthesizer]`; architect proposes, critic attacks, synthesizer consolidates. Fully supported today via `HybridPolicy`.
2. **On-demand design review** — human invokes architect via RoomPanel in `chat` mode with task "review our service boundaries" (already works via Invocation → ConversationDirector).
3. **Incident post-mortem** — architect + `agent-perf` + `agent-devops` as a Director scenario to produce a scalability/observability remediation plan.
