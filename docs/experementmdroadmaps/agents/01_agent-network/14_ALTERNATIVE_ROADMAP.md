# 14_ALTERNATIVE_ROADMAP — second philosophy

> Contrast to 13_ROADMAP (Specialist-first, reuse-everything). This is a **Collaboration/Orchestration-first** alternative.

## Philosophy B — "Network Engineer as Orchestrator/Coordinator"

Instead of deepening Nadia's individual expertise, make her the **entry point** that _coordinates_ network-related work across multiple agents and services. She becomes a thin dispatcher + synthesizer rather than a deeper single agent.

### How it differs from Roadmap A

| Axis          | Roadmap A (Specialist-first)                      | Roadmap B (Orchestration-first)                           |
| ------------- | ------------------------------------------------- | --------------------------------------------------------- |
| Core bet      | Make Nadia herself smarter (persona/tools/memory) | Make Nadia route + synthesize network work                |
| Primary reuse | persona-selector, memory, tools, journal          | Invocation Engine, AgentService groups, Director, Crystal |
| Biggest win   | grounded expert answers                           | scalable multi-agent network reviews                      |
| Risk          | tool sandboxing, memory noise                     | over-orchestration, latency, redundant agents             |
| Effort curve  | steady, low-risk early                            | needs Invocation + groups mature first                    |

### Roadmap B shape

- **Phase 0:** same expose steps (specialization chips, journal tab) — visibility first.
- **Phase 1:** wire Nadia as an **invocation coordinator** — when a networking task arrives, she calls `invocationEngine.invoke` to pull architect/security/devops (reuses `handleAgentRequest`/`module-event`, `invocation-engine-service.ts:124`). Note: today she cannot self-invoke (policy `allowAgentInitiatedInvocation:false`, `phase21-invocation.ts:137`); Roadmap B requires enabling that for her.
- **Phase 2:** use `AgentService.executeGroup('net-team')` (`agent-service.ts:688`) to run pipeline/debate across the infra squad and synthesize via the aggregator/aggregator node she already feeds (`topology-defaults.ts:523`).
- **Phase 3:** promote synthesized network reviews to Crystal Vault; expose a "Network Review" panel that orchestrates the team on demand.

### Trade-offs vs Roadmap A

- **Pro:** leverages existing multi-agent machinery; less per-agent risk (no tools/memory seeding); scales to complex infra questions.
- **Con:** Nadia stays a "commentator/coordinator," not a doer — gap #2 (no tools) unresolved; depends on maturing Invocation/agent-initiated policies; risks turning her into a second orchestrator (architecturally discouraged by AGENTS.md D3: "agent may request another agent only via the engine").
- **Con:** if the human wanted _Nadia's_ opinion, orchestration adds hops/latency and dilutes her voice.

### Recommendation (OPINION)

**Adopt Roadmap A as primary**, cherry-pick Roadmap B's _coordination_ idea as an optional Phase 3-4 enhancement (pre-built `net-team` group + a "run network review" button) — but keep Nadia herself expert-capable first. The two are not exclusive: A makes her a strong individual contributor; B lets her lead a team. Do A's Phase 0-2 before any B work, so coordination has a competent core to dispatch.

### Guardrail

Whichever path, **never** give Nadia a private agent-to-agent call path (D3). All coordination must go through the Invocation Engine / Director / Debate — reuse, don't fork.
