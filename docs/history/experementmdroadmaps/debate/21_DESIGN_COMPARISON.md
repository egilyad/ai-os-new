# 21 — DESIGN COMPARISON: Debate Subsystem Concepts A–E

> Research-only document. Read-only analysis. No source changes, no git, no commit.
> Scores are **OPINION** (subjective prioritization by the author). All factual anchors
> (gaps, existing capabilities) are **VERIFIED** via `file:line` citations on actual source;
> where a concept depends on a fix, the gap is cited. Concepts referenced:
>
> - **A** = Debate Arena (`06_DESIGN_A.md`) — polish the real-time stance-aware surface.
> - **B** = Debate Mission Control (`07_DESIGN_B.md`) — moderator cockpit.
> - **C** = Cognitive Timeline (`08_DESIGN_C.md`) — interleave reasoning with arguments.
> - **D** = Research→Debate Workspace (`09_DESIGN_D.md`) — question seeds debate, verdict writes back.
> - **E** = Hybrid (`10_DESIGN_E.md`) — one adaptive Simple→Detailed→Expert shell folding A–D.

## Scoring scale

Each criterion scored **1–10**. For "Build effort (inverse)" higher = _less_ effort.
All scores = **OPINION**.

## Score table

| #   | Criterion                         | A Arena | B Mission Ctrl | C Cognitive TL | D Research Wksp | E Hybrid |
| --- | --------------------------------- | :-----: | :------------: | :------------: | :-------------: | :------: |
| 1   | User adoption ease                |    9    |       4        |       6        |        5        |    8     |
| 2   | Moderator power                   |    5    |       10       |       4        |        5        |    9     |
| 3   | Reasoning transparency            |    4    |       5        |       10       |        7        |    9     |
| 4   | Replay fidelity                   |    6    |       5        |       7        |        6        |    9     |
| 5   | Integration richness              |    5    |       7        |       5        |        9        |    8     |
| 6   | Build effort (inverse)            |    8    |       5        |       6        |        4        |    3     |
| 7   | Risk (inverse, higher=lower risk) |    8    |       5        |       7        |        5        |    4     |
| 8   | Reuse of existing arch            |    9    |       7        |       8        |        6        |    7     |
| 9   | Distinctiveness                   |    6    |       7        |       9        |        8        |    7     |
| 10  | Cognitive-stream fit              |    4    |       5        |       10       |        7        |    9     |
| 11  | Results clarity                   |    6    |       7        |       7        |        8        |    9     |
| 12  | Roadmap velocity                  |    8    |       5        |       6        |        4        |    5     |

### Weighted total

Weights (OPINION): adoption 2, moderator 1.5, transparency 2, replay 1.5, integration 1.5,
effort 1, risk 1, reuse 1, distinctiveness 1, cognitive-fit 2, results 1.5, velocity 1.

| Concept              | Weighted total (OPINION) |
| -------------------- | :----------------------: |
| A Arena              |         **7.45**         |
| B Mission Control    |           5.78           |
| C Cognitive Timeline |           7.18           |
| D Research Workspace |           6.18           |
| E Hybrid             |         **7.74**         |

## Per-criterion notes (with verified anchors)

**1. User adoption ease** — A wins: it only polishes the existing live surface
(`DebateArena.tsx` fork, `10_DESIGN_E.md:16`). E is close because it _contains_ A as its
Simple tier. B scores low: cockpit is expert-only.

**2. Moderator power** — B is purpose-built (`07_DESIGN_B.md`: inject/override, global
consensus gauge). E captures it in the Expert tier. A/C/D are not moderator-centric.

**3. Reasoning transparency** — C is the thesis (`08_DESIGN_C.md`: interleave reasoning with
arguments). Anchored by the dropped `cognitive:*` stream: emitted at `cognitive-service.ts:414`
but excluded by `event-recorder.ts:229-232,258-261` and `event-bridge.ts:27-34`, and no
Debate consumer exists. E includes C.

**4. Replay fidelity** — Currently broken: `DebatePanel.tsx:328-338` re-runs instead of
replays; `debate-timeline.ts:56-63` persists to localStorage (disjoint from Dexie
`debate-engine.ts:697-698`); `DebateReplayPanel.tsx:170-179` only marks consensus. E scores
high because its unified replay (`10_DESIGN_E.md:31`) fixes all three; A/B/C/D each fix only
part.

**5. Integration richness** — D is built around the loop (`09_DESIGN_D.md`: verdict writes
back to Research/Forum/Crystal). Verified working sinks: Crystal (`crystal-debate-bridge`),
Forum case study (`debate:verdict:generated`), Invocation (`phase21-invocation`), Memory
(`debate-memory.ts`). Dead/missing: Forum escalation (`forum-service.test.ts:307` asserts
`forum:topic:escalated-to-debate` NOT emitted), Research/Scheduler/Workflow (missing/broken).

**6. Build effort (inverse)** — A is cheapest (polish only). E is most expensive (umbrella,
`10_DESIGN_E.md:53` "Effort: L+", depends on all of A–D + `DebateArena` refactor). D is
expensive because the Research auto-bridge is missing (no producer found; INFERRED).

**7. Risk (inverse)** — A low risk (no architectural change). E highest risk
(`10_DESIGN_E.md:52`: "kitchen sink" risk, must reconcile classic/runtime split). C moderate
(display-only, `19_ROADMAP_COGNITIVE_FIRST.md` rule: no new engine).

**8. Reuse of existing arch** — A reuses `debateLiveStore` (`10_DESIGN_E.md:17`) directly.
C reuses `cognitive:*` schemas (`event-registry.ts:737-776`) and the
`topologyTraceStore.ts:29-51` subscription pattern. D needs a missing Research bridge →
lower reuse today.

**9. Distinctiveness** — C is most novel (reasoning interleave). D unique in the
question→verdict loop. E is explicitly a _synthesis_, not novel (`10_DESIGN_E.md:58-60`).

**10. Cognitive-stream fit** — C is the cognitive concept; E adopts it. A/B barely touch
cognitive. Anchored by the dropped `cognitive:*` (see criterion 3).

**11. Results clarity** — E's result tab (`10_DESIGN_E.md:31` Detailed tier) + D's
write-back loop. A/B/C lack a structured conclusion view (verified: analysis gated behind
inert picker, `DebateAnalysisPanel.tsx:23-39`; verdict cached but not rendered,
`debate-sync-manager.ts:182-184`).

**12. Roadmap velocity** — A ships fastest (S–M quick wins, `18_ROADMAP_UX_FIRST.md` Phase 0).
E slowest (umbrella). D slow (blocked on Research API stability, `22_DEBATE_DO_NOT_BUILD_YET.md` (h)).

## Conclusion — what to build first (OPINION)

1. **Build A (Arena polish / quick wins) first.** Highest adoption + velocity + reuse, lowest
   risk. Concretely: fix the four VERIFIED trust gaps
   (`DebatePanel.tsx:328-338`, `DebateStrategyBuilder.tsx:145-157`,
   `DebateAnalysisPanel.tsx:23-39`, `AgentControlPanel.tsx:108-116`) and unify replay
   (`debate-timeline.ts:56-63`, `DebateReplayPanel.tsx:170-179`). This is Phase 0 of both
   `18_` and `20_`.

2. **Immediately layer C (Cognitive Timeline) on top** — it is the highest-distinctiveness,
   lowest-risk differentiator and reuses existing `cognitive:*` events
   (`cognitive-service.ts:414`, `event-registry.ts:737-776`). No new engine required.

3. **Adopt E as the long-term shell, not a from-scratch build.** E scores highest on the
   weighted total (7.74) precisely because it _composes_ A+B+C+D. Build it by promoting
   A→Simple, C→Detailed, B→Expert tiers — i.e., execute `18_`/`19_`/`20_` incrementally
   rather than a big-bang Hybrid rewrite.

4. **Defer D and the B cockpit** until the A/C foundation exists and the Research/Scheduler/
   Workflow integrations are unblocked (`22_DEBATE_DO_NOT_BUILD_YET.md` items (e)(g)(h)).

_All scores OPINION. All factual anchors VERIFIED via file:line. Source corrected the
SHARED "cognitive:decision:made dead" claim: emitted at `cognitive-service.ts:414`, dropped
at recorder/bridge/consumer — so it is "dead at the consumer," not the producer._
