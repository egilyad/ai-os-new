# 05 — CONVERSATION ROLE: `agent-ethics` (ConversationCore / Director)

## How it works today (VERIFIED)

- ConversationCore resolves participants through `agentService.resolveAgent` (`conversation-execution-engine.ts:40`). A scenario turn assigned to `agent-ethics` is spoken by Elena's persona (system prompt + nvidia/llama-3.3-70b) via `ChatExecutor`.
- The Director (`ConversationDirectorService`, AGENTS.md B3) drives a `HybridPolicy` → `ConversationOrchestrator` → `ChatExecutionEngine` → `ChatExecutor`. Elena is just one resolvable participant.
- This path **does** emit `COGNITIVE_STEP_ACTIVE`/`COGNITIVE_STEP_COMPLETED` (consumed by `AgentService` stats + `AgentJournalService`) and `conversation:*` lifecycle events (B4). So she is **fully visible** here, unlike in debate.

## CURRENT gaps (VERIFIED/INFERRED)

- No scenario type is pre-tuned for "ethics review". A user must manually build a scenario with her as a participant and write the turn instructions.
- `lensIds: []` — she carries no lens, so Synthesis/Lens machinery does not auto-apply an ethics perspective to her turns.

## POTENTIAL scenarios (INFERRED)

1. **Ethics review scenario**: a 1–2 turn Director scenario where Elena audits a proposed decision/design and returns a structured verdict (risks + responsible alternative + framework). Reuses `ScenarioRepository` + `ConversationDirectorService` exactly as built in B3/B5.
2. **Pre-deployment gate**: a scenario that runs _after_ a Builder workflow or a Debate, where Elena is the final "responsible alternative" check before crystallization to a Crystal.
3. **Multi-agent deliberation**: Elena as a permanent `neutral` participant in a Director-run panel (e.g., alongside `agent-risk`, `agent-critic`) producing a consolidated ethical risk line.

## Recommendation (OPINION)

Ship a **preset "Ethics Review" scenario template** in the Director Library that pre-populates Elena as the reviewer with a turn instruction requiring a structured ethical verdict. This is pure configuration on top of existing B3/B5 infra — zero new runtime code.
