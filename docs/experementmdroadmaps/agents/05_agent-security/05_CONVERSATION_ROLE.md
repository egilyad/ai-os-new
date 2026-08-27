# 05_CONVERSATION_ROLE — `agent-security` in ConversationCore / Director

> VERIFIED current behavior + scenarios.

## CURRENT (VERIFIED)

- `agent-security` can be referenced as a scenario participant by id (`ParticipantsField.tsx`, `RunTab.tsx` via `AgentIdentityChip`).
- Execution chain: `ConversationDirectorService` → `ConversationOrchestrator` → `ChatExecutionEngine` → `ChatExecutor` (`chat-executor.ts`).
- Persona resolution: `agentService.resolveAgent(id)` returns `systemPrompt` (the generic topology `prompt`), `model` (`meta/llama-3.3-70b-instruct`), `provider` (`nvidia`), `specializations`, `avatar` (`agent-service.ts:337-390`).
- `cognitive-service.ts:421` uses `node.config.systemPrompt` for the cognitive trace — so `agent-security` DOES emit `COGNITIVE_STEP_COMPLETED` here (unlike the debate path). Stats + journal are complete for ConversationCore runs.
- Events: `conversation:turn:start/complete/error`, `conversation:completed` (`event-registry.ts`). `DirectorStore` observes them (`directorStore.ts`).

## Issues (VERIFIED/INFERRED)

- The system prompt used is the **generic** topology `prompt`, not enriched by `specializations`. So a ConversationCore turn for "threat model our auth flow" uses the same generic security-engineer wording as "audit our CSS".
- `specializations` (Threat Modeling/AppSec/Zero Trust) are available on the resolved agent but **not injected** into the ChatExecutor request (grep: `specializations` never concatenated into messages/prompt).

## Scenarios

**C1 — Guided threat-modeling conversation.** User runs a Director scenario where `agent-security` is the sole participant with objective "Produce a STRIDE analysis of our new API gateway." Today: generic security-engineer prompt; works but undifferentiated. After QW-1: prompt includes "specializations: Threat Modeling, AppSec, Zero Trust" → sharper output.

**C2 — Multi-agent design review.** `agent-architect` + `agent-security` + `agent-devops` in a Director scenario reviewing a deployment plan. `agent-security` contributes the security review turn. Today functional; observability complete (cognitive events fire).

**C3 — Invocation-driven chat.** RoomPanel → pick `agent-security` → "Review this Terraform for privilege escalation." `InvocationExecutionDelegate.start` (chat mode) creates a one-turn scenario and runs it (`phase21-invocation.ts:89-108`). Uses nvidia/llama-3.3 via resolveAgent. Works today.

## Recommendation (OPINION)

Treat `specializations` as a **first-class prompt modifier** in the ChatExecutor/Director path (same fix as debate). ConversationCore is the better default surface for security deep-dives because it preserves cognitive observability.
