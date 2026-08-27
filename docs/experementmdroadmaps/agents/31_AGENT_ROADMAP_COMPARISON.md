# 31 — AGENT ROADMAP COMPARISON

> Comparison of the three platform variants from doc 30 (A — Quality First, B — Collaboration First, C — Product/UI First). Read-only synthesis. Criteria scored **relative to each other** (H/M/L or 1–5). Final decision is the human's; the recommendation is marked OPINION.

---

## 1. Scorecard (INFERRED relative ranking)

| Criterion                           | A — Quality First | B — Collaboration First | C — Product/UI First |
| ----------------------------------- | :---------------: | :---------------------: | :------------------: |
| **User-visible impact (near-term)** |       M (3)       |          M (3)          |      **H (5)**       |
| **User-visible impact (long-term)** |     **H (5)**     |        **H (5)**        |        M (3)         |
| **Architectural risk**              |     **L (5)**     |          M (3)          |      **L (5)**       |
| **Implementation effort**           |       M (3)       |        **H (2)**        |       M–L (4)        |
| **Reuse of existing infra**         |     **H (5)**     |        **H (5)**        |      **H (5)**       |
| **Time-to-first-value**             |       M (3)       |          L (2)          |      **H (5)**       |
| **Architectural cleanliness**       |     **H (5)**     |          M (3)          |      **H (5)**       |
| **Dependency on other variants**    |      lowest       |         needs A         |    pairs w/ A & B    |

_All three score H on reuse (VERIFIED — each builds only on `persona-selector`, `AgentService`/`AgentResolverDirectory`, Invocation Engine, `event-registry`, `AgentsPanel`, `EventRecorder` filters; no new framework)._

## 2. Per-criterion notes

- **User impact.** C wins immediately (users _see_ agent cards, live streams, reputation). A and B pay off only after the underlying quality/collaboration is wired. Long-term, A + B compound because the agents actually _are_ specialists and _do_ compose.
- **Risk.** A and C are low-risk (tuning + UI on existing seams; `persona-selector` change is the only behaviorally sensitive one and is fixture-testable). B's orchestration state-machine (`phase21-invocation.ts` delegate sequencing) is the only place real new architectural surface appears, and it must carefully preserve D3/D6 (no agent→agent spontaneity).
- **Effort.** B is heaviest (~11–17 wks) due to orchestration + teams + debate templates. A ~8–13, C ~9–14.
- **Time-to-value.** C first (UI ships fast, reuses `AgentsPanel` family already present — `agent-risk/00_PROFILE.md:38`). A second (model-pin fix + persona map are small). B last (needs A's personas to be meaningful).
- **Cleanliness.** A and C keep the kernel clean (A is a selector/prompt change; C is UI). B adds an orchestration branch but reuses the aggregate ownership model (`phase21-invocation.ts:7`), so it stays within the established boundary.

## 3. Key trade-offs (INFERRED)

1. **Doing C alone** makes agents _look_ great but they remain generic at runtime (persona-selector still specialization-blind, `persona-selector.ts:251-290`) — a "paint job on a generic engine."
2. **Doing A alone** makes agents genuinely specialized but invisible — users can't tell, because the UI doesn't surface it.
3. **Doing B alone** builds collaboration on a foundation of still-generic agents, so teams compose generic voices — the doc-28 combos won't actually manifest their specializations.
4. **A is a prerequisite enabler** for both B (real personas in debates) and C's cognitive timeline (real events from real specialist behavior).

## 4. Recommended option (OPINION)

> **Adopt a balanced hybrid: start with A (Phases 0–2) as the foundation, run C (Phases 0–2) in parallel for visible payoff, then schedule B once A's personas exist.**
>
> Rationale (OPINION): A's model-pin fix + specialization-aware persona is the _cheapest high-leverage_ change and unblocks everything else; C's agent cards/live-streams ship user-visible value within weeks and reuse panels that already exist; B is deferred because its payoff depends on A and it carries the only meaningful new architectural surface. This sequence respects the "no new framework / reuse shared infra" constraint verified across all cited sources, and keeps human authority (D6) and the engine's sole-writer boundary (D7) intact.

**Caveats (OPINION):** If the priority is _demonstrating the platform to stakeholders now_, lead with C Phase 0–2 and backfill A. If the priority is _correctness/long-term quality_, lead with A. The hybrid is recommended only if both near-term showmanship and long-term quality matter.

_This recommendation is OPINION. The final sequencing decision rests with the human. No source was modified; no commit made._
