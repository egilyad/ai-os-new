# 05 — CONVERSATION ROLE (ConversationCore / Director)

## How it works today

- In ConversationCore, a turn is bound to a `participantId`. The `ConversationOrchestrator` resolves that id through `AgentService.resolveAgent` (`agent-service.ts:337-390`), which returns the agent's `systemPrompt`, pinned `model` (`openrouter/meta-llama/llama-3.3-70b-instruct`), `provider`, `displayName`, `specializations`, and (empty) `lensIds`. `ChatExecutor` then speaks the turn.
- The **Conversation Director** (`conversation-director-service.ts`, B3/B4/B5 per AGENTS.md) drives scenarios via `HybridPolicy → ConversationOrchestrator → ChatExecutionEngine`. A scenario author can include `agent-research` as a participant (`phase21-invocation.ts:73` builds participants from invocation targets; `RunTab` lets a human pick it).
- When it runs, it emits `COGNITIVE_STEP_ACTIVE` / `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184,219`), which feed `AgentService` stats and `AgentJournalService`.

## What is missing for a _research_ conversation

- The `TurnProposal.objective` only carries `{ type, description, constraints[] }` (per AGENTS.md B3/B5.3). There is no "produce a cited literature review" objective type. The research specialization is therefore unused structurally.
- No lens is attached (`topology-defaults.ts:106`), so ConversationCore turns are not lens-augmented even though `resolveAgent` returns `lensIds` (`agent-service.ts:386`).

## RECOMMENDED posture

Treat agent-research as the **default analyst voice** for `INTRODUCE`/`CHALLENGE` objectives that contain research keywords, and auto-attach `lens:critical` + `lens:meta-uncertainty` at resolution time (the resolver already returns `lensIds` — only the seed data is empty).

## 3 scenarios

1. **Cited briefing conversation** — A Director scenario whose objective is "summarize the evidence on X with citations"; agent-research is the sole/lead participant. _(Today: possible but citations are not enforced/structured.)_
2. **Research lead in a multi-agent panel** — Director scenario mixing agent-research (synthesis) + agent-critic (fallacy) + agent-data (stats); agent-research produces the integrated narrative. _(Today: fully runnable via existing scenario editor — B5.3.)_
3. **Evidence-gap finder** — Agent consumes a Crystal/Vault export as context and flags uncertainty. _(Today: NOT wired — Crystal Vault and agent-research are disconnected; see 03/08.)_
