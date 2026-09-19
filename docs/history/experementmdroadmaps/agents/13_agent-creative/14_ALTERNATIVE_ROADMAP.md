# 14_ALTERNATIVE_ROADMAP — Second philosophy & trade-offs vs A

> Philosophy B: a **dedicated creative subsystem** (own services/store), contrasted with
> Philosophy A (composition + config over existing infra, `13_ROADMAP.md`).

## Philosophy B — "Creative Agent as a first-class vertical"

Instead of reusing generic services, build a focused creative stack:

- `CreativeAgentService` (ideation loop, divergent→convergent sampling).
- `BrandMemoryStore` (per-brand structured memory, separate Dexie table).
- `IdeationEngine` (brainstorm topologies, SCAMPER, metamorphic prompts).
- `CreativePersonaService` (replaces generic `PersonaSelector` for creative agents).

## Trade-off analysis

| Dimension                   | A (reuse/compose)                                              | B (dedicated vertical)                         |
| --------------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| Time to value               | Fast (Ph0–1 in ~3 wks)                                         | Slow (new services + tests + schema)           |
| Risk                        | Low (additive, no new buses)                                   | Higher (new kernel service, circular-dep risk) |
| Architectural fit           | ✅ matches AGENTS.md (no globals, contracts@boundaries, reuse) | ❌ adds 26th+ service; sprawl                  |
| Consistency w/ other agents | High (same identity/stats/journal)                             | Lower (creative agent diverges from the 25)    |
| Creative quality ceiling    | Bounded by prompt+lens+Director                                | Potentially higher (purpose-built loops)       |
| Maintenance                 | Shared (AgentService, Lens, Crystal)                           | Split ownership, dual memory stores            |
| Discoverability             | Via existing AgentCard/RoomPanel                               | Needs new Creative console                     |

## When B would be justified (OPINION)

Only if metrics show generic composition (A) cannot reach needed creative quality AND the
cost of a vertical is accepted. Given the system already has Lens (perspective), Crystal
(knowledge), Director (orchestration), and Invocation (dispatch), **B is hard to justify
now** — it would duplicate all four.

## Hybrid compromise (RECOMMENDED)

Adopt A as the backbone, but allow ONE small, well-bounded addition if needed:
a **`CreativeTechnique` library** (SCAMPER / six-thinking-hats prompt templates) stored as
**data**, not a service, fed into the existing `agent-creative` node prompt at invocation
time. This gives B's technique variety without B's architectural cost — data, not a service.

## Decision

**Recommend A (`13_ROADMAP.md`).** B violates the stated kernel principles and the explicit
warning against 25 mini-frameworks. If a vertical is later mandated, scope it to the
Hybrid compromise (prompt-template data only).
