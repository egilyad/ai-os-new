# 12_FUTURE_AGENT_CONCEPT — "if fully realized, what should `agent-network` become?"

> Built from EXISTING capabilities, not a new framework. OPINION.

## Mission

Nadia Volkov is the system's **Network Engineer agent**: she designs, evaluates, and defends network/topology/connectivity decisions, and she _acts_ on them (measure + propose + crystallize), not merely narrates.

## Responsibilities (evolution of current)

- **Advisory:** evaluate protocols, SDN designs, latency/throughput/fault-tolerance trade-offs (today: system prompt, `topology-defaults.ts:150`).
- **Active:** run latency/connectivity probes via tools (today: `tools:[]`, `topology-defaults.ts:152` — gap #2).
- **Evidence-based:** ground claims in seeded semantic memory + recalled past conclusions (today: empty, #4).
- **Collaborative:** lead the pre-built `net-team` group with architect/security/devops (today: no group, #8).
- **Durable:** promote proven conclusions to Crystal Vault as network knowledge (today: no crystal contribution).

## Capabilities (target)

- Persona + pinned model injected (exists: `conversation-execution-engine.ts:40-73`).
- Specialization-aware stance in debate (target: Q2/M4).
- Tools: latency probe, topology reader, packet/RTT estimator (target: B1) — via existing `tools` config + tool runtime.
- Memory: seeded semantic + episodic recall (target: M1/M2).
- Invocation: expertise-routed, including scheduled/agent-initiated (target: B2, `invocation-engine-service.ts:124-144`).
- Cognitive: visible in debate + conversation via `COGNITIVE_STEP_COMPLETED` (target: M3).
- Knowledge: contributes to Crystal Vault (target: B3).

## Context & memory

- Carries `specializations` into every prompt (persona + memory summary).
- Read-before-speak: `semantic-memory.query({agentId:'agent-network', topic})` prepended to system message.
- Journal-backed continuity: `AgentJournalService.listByAgent` feeds a "what I did" summary.

## Tools / services reused (no new engine)

AgentService, AgentIdentityResolver, ChatExecutor, ConversationCore (ChatExecutionEngine), Debate runtime (PersonaSelector + debate-agent-executor), Invocation Engine, Memory subsystem (semantic/episodic), Crystal Vault, Lens engine (`lens:security`), Agent Journal, Dashboard/AgentsPanel UI.

## Debate behavior

- Default **Evidence Analyst / Technical Architect**; **Red-team** for resilience critiques (see 04). Side suggested from topic keywords + `specializations`.

## Collaboration

- `net-team` group (network + architect + security + devops) for infra reviews.
- Invocation can pull her into a debate/conversation about any connectivity topic.

## Invocation

- Human: RoomPanel dropdown / expertise preset (Q4).
- System: expertise-routed auto-invocation (B2) and scheduled network health checks (engine supports `module-event`).

## Cognitive visibility

- `COGNITIVE_STEP_COMPLETED` in both debate + conversation; journal + stats unified; `cognitive:decision:made` consumed by journal (revive dead event, no new type).

## UI

- AgentCard with specialization chips; AgentDetailPanel with Journal tab + memory preview + suggested debate side; RoomPanel expertise preset; Debate participant picker side hint.

## Outputs

- Text recommendations, measured metrics (via tools), crystallized network knowledge, debate verdicts, group synthesis.

## Limitations (honest)

- Still bounded by LLM reasoning; tools must be sandboxed; memory quality-gated to avoid noise; she is one node among 25 — no special privilege.
- She should NOT become a separate "network subsystem" — all behavior reuses shared infra (see 15).
