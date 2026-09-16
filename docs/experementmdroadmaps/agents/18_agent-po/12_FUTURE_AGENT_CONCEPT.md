# 12 — FUTURE AGENT CONCEPT (realized from EXISTING capabilities)

> A realized concept — what `agent-po` _could_ become using only infrastructure that already exists today. No new kernels.

## Concept: "Scope Governor" PO

Today `agent-po` is a chat persona. Its specializations (`Backlog`, `Vision`, `Prioritization`) plus the **existing** `ConversationOrchestrator` + `TurnProposal` + `memory-engine` + `lens-library` are enough to realize a **Scope Governor** without writing a new module.

### How it's assembled from existing parts (VERIFIED reuse)

| Capability        | Existing infra                                       | Source                                             |
| ----------------- | ---------------------------------------------------- | -------------------------------------------------- |
| Speak as PO       | system prompt + `resolveAgent`                       | `topology-defaults.ts:362`, `agent-service.ts:337` |
| Structured output | `TurnProposal.objective.type` extension              | `contracts/conversation/turn`                      |
| Remember backlog  | `memory-engine` KV namespace                         | `memory-engine.ts:181`                             |
| Amplify PO view   | `lens:multi-stakeholder` / new `lens:product-vision` | `lens-library.ts:126`                              |
| Run as a pod      | `AgentGroup` "Product Trio"                          | `agent-service.ts:27`                              |
| Trigger by human  | `RoomPanel` + Invocation                             | `phase21-invocation.ts`                            |
| Observe           | `LiveActivityStream` nodeId filter                   | `event-registry.ts:763`                            |

### Minimal realized prototype (OPINION, no code)

1. Add `TurnProposal.objective.type = 'PRIORITIZE' | 'DEFINE_REQUIREMENTS'` (contract already extensible — `05` M2).
2. Add `lens:product-vision` (M4) and auto-attach via `lensIds` in `AGENT_PROFILES` entry (currently empty).
3. Seed "Product Trio" group (Q5).
4. RoomPanel template "Groom backlog" (Q4) → `reason` prefilled.
5. PO outputs persisted to a `memory-engine` backlog namespace (M3).

→ Result: a PO that _grooms, prioritizes, and remembers_ — built entirely from current contracts/services. The only "new" code is the `objective.type` enum value and one lens; everything else is configuration + UI glue.

This stays within D5/D6 (human-invoked, engine as dispatch, no self-invocation) and uses the existing Invocation→ConversationCore handoff (`phase21-invocation.ts:89-108`).
