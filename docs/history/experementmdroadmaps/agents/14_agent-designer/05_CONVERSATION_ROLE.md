# 05_CONVERSATION_ROLE — `agent-designer` in ConversationCore / Director

> VERIFIED: `ConversationOrchestrator` / `ChatExecutor` resolve the agent via `agentService.resolveAgent`
> (`agent-service.ts:337`), which returns `model='llama-3.3-70b-versatile'`, `provider='groq'`,
> `systemPrompt` = node prompt. The Director's `HybridPolicy` → `ConversationOrchestrator` →
> `ChatExecutionEngine` spoke path uses the designer's pinned model.

## CURRENT (VERIFIED)

- Designer is a valid `participantId` in a `ConversationScenario` turn
  (`contracts/conversation/turn.ts` `TurnProposal`).
- When a scenario turn targets `agent-designer`, `ChatExecutor` speaks the node prompt on groq/70b.
- No design-aware orchestration: the `HybridPolicy` treats it like any participant.

## POTENTIAL roles (from existing capabilities)

1. **Design requirements interviewer** — a Director scenario where `agent-designer` runs an
   `INTERVIEW`-style turn to extract UX requirements before engineering scopes work. Reuses
   `TurnProposal.objective.type` (already supports INTRODUCE/CHALLENGE/etc.).
2. **Prototype critic-in-the-loop** — a scenario step where designer reviews a generated artifact
   (text/HTML) and emits a `CHALLENGE` turn; pairs with the Knowledge Generator or Builder.
3. **Design-journal synthesis** — fold designer outputs into `knowledge-generator-service`
   (Module 5) as a "design evidence" source for crystallization (no design binding today — N/A).

## Scenarios

- **S1 — UX discovery:** Director scenario = [researcher interviews user] → [designer synthesizes
  persona + wireframe brief] → [architect scopes]. Designer turn type `INTRODUCE`/`CHALLENGE`.
- **S2 — Critique pass:** Builder deploys a flow, then a 1-turn Director scenario invokes designer
  to critique the UX and write findings back via `invocation` → `conversation`.
- **S3 — Design-system governance:** designer participates in a multi-agent conversation that
  ratifies a design-token change, persisting the decision to Crystal Vault (currently N/A; would
  need a design→crystal bridge, see 11_OPPORTUNITIES).

## Recommendation

Designer's ConversationCore value is currently **untapped**: it can be a turn participant but its
design lens is never applied. Cheapest win: ensure Director scenarios that include it inject the
`design_critic` framing (see 04) so the turn is actually design-flavored, not generic.
