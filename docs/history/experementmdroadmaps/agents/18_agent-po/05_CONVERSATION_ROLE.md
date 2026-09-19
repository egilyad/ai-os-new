# 05 — CONVERSATION ROLE (ConversationCore / Director)

> VERIFIED unless marked.

## CURRENT (VERIFIED)

- `agent-po` is resolved as a conversation participant via `agentService.resolveAgent` (`agent-service.ts:337`). The `ConversationOrchestrator` / `ChatExecutor` speak **as** `agent-po` using its system prompt (`topology-defaults.ts:362`).
- `ConversationDirectorService` runs scenarios where `agent-po` is a `participantId` in `TurnProposal`s (`conversation-director-service.ts`, turns built in `phase21-invocation.ts:91-98`).
- `conversation-backed-debate-orchestrator.ts:42-43` maps `proposal.participantId` → `agentId`/`nodeId` (generic; no PO branch).

## What "PO" means here today

Only the one-liner system prompt: _"Define requirements, prioritize the backlog by business value, make scope trade-off decisions…"_ There is **no** structured product-owner behavior — e.g. it does not (a) maintain a backlog, (b) emit acceptance criteria, (c) prioritize other agents' outputs, (d) refuse out-of-scope requests. It is a chat persona.

## POTENTIAL scenarios (OPINION)

- **C1 — Backlog grooming session:** Director scenario where `agent-po` + `agent-pm` + `agent-lead` refine a backlog; PO produces prioritized items with acceptance criteria. Currently possible only as free-form chat (no structured output schema).
- **C2 — Vision articulation:** PO turns a vague `topic` into a product vision + prioritized themes. Today it would just chat; no `Vision` lens/scaffold exists (see `02` flag #21).
- **C3 — Scope gate:** PO intercepts ConversationCore turns that drift out of scope and re-anchors. Requires a pre-turn hook (POTENTIAL, not built).
- **C4 — Invocation-driven:** Human invokes `agent-po` from RoomPanel with `mode: chat` + a backlog task; `InvitationExecutionDelegate` already builds the scenario (`phase21-invocation.ts:89-108`). Works today, but output is unstructured chat.

## RECOMMENDED (OPINION)

Wire `agent-po`'s specializations into **structured turn objectives** in Director scenarios (e.g. turn type `PRIORITIZE` / `DEFINE_REQUIREMENTS`) so its output is machine-usable (backlog items → Workflow/Building). This is additive to the existing `TurnProposal` contract.
