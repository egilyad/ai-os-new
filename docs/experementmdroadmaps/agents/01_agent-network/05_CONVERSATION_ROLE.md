# 05_CONVERSATION_ROLE — `agent-network` in ConversationCore / Director

> ConversationCore = generic turn engine; `agent-network` participates with persona+model injected.

## How it acts as a participant (VERIFIED)

- A scenario participant is just `{ id: 'agent-network', role }` (`conversation-director-service.ts` + `phase21-invocation.ts:73,91-98`).
- `ChatExecutionEngine.execute()` (`conversation-execution-engine.ts:30-137`):
  - resolves the agent via `agentResolver.resolveAgent('agent-network')` (`:40`),
  - injects `agent.systemPrompt` (the network-engineer prompt, `topology-defaults.ts:150`) as a **system message** (`:41-43`),
  - sets `model: agent.model` = `llama-3.3-70b-versatile` (`:73`),
  - builds the user turn from `context.topic` + prior `history` + `objective` (`:48-68`),
  - dispatches to `ChatExecutor` with `metadata.agentId = 'agent-network'` (`:79-80`).
- So Nadia speaks **as a network engineer**, with her pinned groq model, and with full conversation history. This is the _cleanest_ expression of her identity.

## Lifecycle / events (VERIFIED)

- Each turn emits `conversation:turn:start/complete/error` (`event-registry.ts` per AGENTS.md B4) and, via the orchestrator, `COGNITIVE_STEP_COMPLETED` -> `AgentService` stats + `AgentJournal` (`agent-service.ts:184`, `agent-journal-service.ts:150`).
- `conversation:completed` transitions the Director store to `completed` (`directorStore.ts` per AGENTS.md B6.2).

## Scenarios where it is the right participant (INFERRED)

1. **"Design a low-latency topology for our new region"** — multi-turn: propose, critique, refine.
2. **"Diagnose intermittent timeouts between services"** — Nadia reasons about TCP/IP retransmits, SDN path changes.
3. **"Capacity-plan our ingest pipeline for Black Friday"** — throughput + fault-tolerance trade-offs.
4. **Cross-agent panel** ("architect + security + network" scenario) evaluating a redesign — natural fit with `agent-architect` & `agent-security`.

## How ConversationCore could use her specialization better (OPINION/INFERRED)

- The `HybridPolicy` / `TurnProposal` system (`conversation-director-service.ts`, `conversation-hybrid-policy`) does not consult `specializations` when ordering/selecting turns. A small improvement: when a `TurnProposal.objective` mentions networking terms, prefer `agent-network`. This reuses the existing objective/constraint model — no new engine.
- The system prompt is static; injecting a one-line specialization reminder ("You specialize in TCP/IP, SDN, Latency Optimization") into the resolved persona would strengthen stance without new infra. This can be done in `normalizeAgentIdentity` or `resolveAgent` (agent-identity.ts / agent-service.ts:337) — additive.

## Limits (VERIFIED)

- No tools -> she can only discuss networking, not measure it. A "run iperf / read telemetry" turn is impossible today (`tools: []`, `topology-defaults.ts:152`).
- Conversation mode from Invocation auto-creates an `INTRODUCE` turn only (`phase21-invocation.ts:91-98`); richer objectives require a hand-built scenario in the Director UI.
