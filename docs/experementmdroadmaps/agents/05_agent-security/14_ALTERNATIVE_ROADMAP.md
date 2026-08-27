# 14_ALTERNATIVE_ROADMAP — "Thin Specialist, Platform-First" philosophy

> A second philosophy contrasting with the agent-centric Roadmap (13). Trade-offs vs A.

## Philosophy B — Make the PLATFORM express security, not the agent

Instead of enriching `agent-security` as a bespoke competency, invest in **generic, tag-driven specialization** so that _any_ agent (and the user) gets security behavior from shared infrastructure: lenses, prompts, policies, and routing — with `agent-security` merely being the default `domain:security` instance.

### Contrast with Roadmap A (agent-centric)

| Dimension               | A (13)                                     | B (this)                                                    |
| ----------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| Specialization lives in | agent prompt/config                        | shared `domain:security` lens + prompt-injector             |
| Memory                  | agent-scoped findings store                | shared `domain` memory usable by all security-tagged agents |
| Debate persona          | added to `persona-selector` for this agent | role/persona resolved from `domain` + topic (generic)       |
| UI                      | agent-specific "Security console" tab      | generic "Domain console" filtered by tag                    |
| Effort concentration    | deep on one agent                          | broad, reusable                                             |

### Phase B0 — Tag-driven specialization engine

- Add a `domain`/`tags` field to topology nodes; build a generic prompt-injector that appends `specializations` for ANY `domain:security` agent (so future security agents inherit it). Reuses `lens-engine` + `resolveAgent`.
- **Trade-off vs A:** solves P1 for all agents at once; but `agent-security` itself gets no agent-specific love and may feel generic.

### Phase B1 — Shared security memory + lens pipeline

- One `security` memory store + `lens:security` auto-applied to any `domain:security` participant (generic, not agent-bound). Reuses Crystal Vault `security` domain (`crystal-types.ts:17`).
- **Trade-off:** scalable; but blurs agent identity/ownership of findings.

### Phase B2 — Policy & routing security gates

- Route any security-relevant task to the `domain:security` pool (round-robin/least-busy) rather than a fixed `agent-security`. Reuses router + auto-spawn (`agent-service.ts:614`).
- **Trade-off:** resilient/fault-tolerant; but loses the "Yara Haddad" character continuity users may want.

### Phase B3 — Domain console (generic)

- One "Domains" panel showing security findings across all agents/tools. Reuses AgentDetailPanel tab pattern generalized.
- **Trade-off:** consistent; but no agent-specific narrative.

## When to choose B over A (OPINION)

- Choose **B** if the roadmap will spawn many domain specialists (more "agent-X" nodes) and you want zero per-agent code.
- Choose **A** (13) if `agent-security` is a flagship, user-facing persona where character continuity and a dedicated console matter.

## Recommended hybrid (OPINION)

Do **A Phase 0–1** (cheap, agent-specific, high ROI) and **B Phase B0** (generic injector) so future security agents inherit the behavior for free. Avoid duplicating memory: let B's shared store back A's console. This captures both the flagship agent and platform leverage without 25 mini-frameworks (see 15).
