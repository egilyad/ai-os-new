# 12_FUTURE_AGENT_CONCEPT — Realized concept from EXISTING capabilities

> A concrete "Coordination Agent" concept assembled ONLY from capabilities already present in the repo. OPINION/INFERRED on synthesis; VERIFIED on primitives.

## The concept: "Victor Soto, Coordination Agent"

Not a new agent type — `agent-lead` _rebadged_ as a functioning coordinator by wiring its already-present (but unused) signals into already-present machinery.

### Ingredients already in the repo (VERIFIED)

| Primitive                                                   | Source                                          | Role in concept                                          |
| ----------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `specializations: Mentoring, Coordination, Architecture`    | `agent-profiles.ts:210`                         | the trigger that identifies lead                         |
| `PersonaSelector` topic→persona                             | `persona-selector.ts:251`                       | gives lead a `diplomat`/`strategist` voice in debates    |
| `MetaAgentController` graph→tactical role                   | `debate-meta-agent-controller.ts:21`            | promotes lead to `synthesizer` (extend to `coordinator`) |
| `HybridPolicy` + `TurnProposal` + `override()`              | `AGENTS.md` B3/B5.4b                            | inserts lead synthesis turns in Director                 |
| `executeGroup` patterns                                     | `agent-service.ts:25,688`                       | run a team; add `lead` pattern                           |
| `AgentResolverDirectory` + Room                             | `phase21-invocation.ts:43`                      | human invokes lead to coordinate                         |
| `taskHandoffService`                                        | `AgentHandoffsTab.tsx:7`                        | lead issues/observes handoffs                            |
| memory stores (~16) + `metadata`                            | `memory-engine.ts:181`, `event-registry.ts:760` | coordination memory                                      |
| `COGNITIVE_STEP_COMPLETED` + dead `COGNITIVE_DECISION_MADE` | `event-registry.ts:763,776`                     | auditable lead decisions                                 |

### How it behaves (INFERRED)

1. **Identified as lead** because `specializations` include `Coordination` (Q1 badge; M1 meta-role bias).
2. **In a debate it moderates**: from round 2 it gets `coordinator` tactical directives (M1); it frames scope, then converges (its prompt: "mentor, unblock, ensure quality").
3. **In a Director scenario** it auto-inserts synthesis turns when ≥3 agents present (M2); it can be overridden in/out (B5.4b).
4. **In a group** it runs as `lead` pattern, sequencing/moderating peers (M4).
5. **From Room** a human says "coordinate the plan" → `coordinate` mode spins a multi-agent Director scenario led by Victor Soto (B2).
6. **It remembers**: handoffs + coordinator-tagged memories let it answer "what blocks my team" (B3).
7. **It is auditable**: each coordination decision emits `COGNITIVE_DECISION_MADE` (M5).

### Why this is "realized from existing" (OPINION)

Every behavior above is a _composition_ of seams that already exist and are tested. No new bus, no new table, no new adapter. The only net-new code is: (a) one `TacticalRole` variant, (b) a policy rule, (c) a group pattern, (d) a metadata field, (e) a Room mode branch. Everything else is configuration/templates/UI.

### What it is NOT

- Not an autonomous manager. D6 (AGENTS.md) forbids agent self-invocation; lead coordinates only when a human or a policy delegates (Room / Director / Group). Authority stays human.
- Not a 26th agent. It is the existing `agent-lead` node, semantics-activated.
