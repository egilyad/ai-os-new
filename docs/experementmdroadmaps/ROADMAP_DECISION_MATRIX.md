# ROADMAP DECISION MATRIX

> Compare Roadmap A (Product/User-value first), B (Platform/Architecture first), C (Hybrid).
> Scores are qualitative: ●●● strong · ●● medium · ● weak. "Dependency count" = new concepts/infra
> introduced. All three reuse the existing EventBus + services; none require new engines/buses.

## Comparison

| Criterion                        | A — Product first     | B — Platform first            | C — Hybrid                    |
| -------------------------------- | --------------------- | ----------------------------- | ----------------------------- |
| User value (short term)          | ●●●                   | ●                             | ●●●                           |
| User value (long term)           | ●●●                   | ●●●                           | ●●●                           |
| Development effort (total)       | ●● (low-med)          | ●●● (med-high)                | ●● (med)                      |
| Architectural risk               | ● (low)               | ●● (med)                      | ● (low-med)                   |
| Code reuse                       | ●●●                   | ●●●                           | ●●●                           |
| Time to visible result           | ●●● (weeks 1-3)       | ● (quarters)                  | ●●● (weeks 1-6)               |
| Ability to validate product      | ●●●                   | ●                             | ●●●                           |
| Long-term scalability            | ●●                    | ●●●                           | ●●●                           |
| Dependency count (new concepts)  | ● (few)               | ●●● (substrate+contract)      | ●● (substrate + 1 contract)   |
| New concepts introduced          | ● (subscribers only)  | ●●● (audit svc, hub contract) | ●● (audit svc + hub contract) |
| Likelihood of architectural debt | ●● (some dup logging) | ● (lowest)                    | ● (low)                       |
| **Net**                          | Fast wow, some dup    | Clean base, slow wow          | Wow + clean base              |

## Reading the matrix

- **A** wins on speed-to-value and validation but repeats logging/alerting per feature (debt) because it
  skips the shared substrate.
- **B** wins on cleanliness/scalability but ships little joy for 1-2 quarters — risky for "is this a real
  product?" validation.
- **C** captures B's cheap substrate (audit + notification + event-registry hygiene) FIRST, then runs A's
  quick wins on top, then the single necessary contract extension. Best value-per-quarter, least debt.

## TOP 10 DECISIONS REQUIRING HUMAN JUDGMENT

_Not decided here. These need a product/architecture owner's call._

1. **Keystone identity:** Is the Invocation Engine the single universal dispatch hub, or do Debate /
   ConversationCore / Research remain first-class entry points? (Drives A6, N2, N6.)
2. **Agent-Group invocation:** Approve the `InvocationTarget` contract change now (adds `{groupId}` +
   resolver + policy-semantics decision)? Or keep single-agent invocation? (X10, N2-group.)
3. **Invocation → Workflow target:** Should deployed Builder flows become invocable tasks (more power,
   higher complexity), or stay generator-only? (N2.)
4. **Autonomy level for knowledge:** Auto-crystallize from research/generator/synthesis, or keep manual
   "propose" (human in the loop)? (A4.) — affects trust + noise.
5. **Memory → Invocation injection:** Default ON (continuity, context bloat risk) or opt-in toggle? (A7.)
6. **Notification placement:** New inbox panel, or fold into existing AlertLayer/toasts? (Reuse vs new UX —
   X11.)
7. **Forum → Debate escalation:** Build the register-event + UI now, or keep manual invocation? (C1, N8.)
8. **Scheduler realism:** Wire the real `schedulerService` (changes SchedulerPanel from mock to live,
   altering UX expectations) — acceptable? (N1, X13.)
9. **Mission-Control scope:** Unify the existing ops panels into ONE surface (navigation change, possible
   confusion) or keep them separate but linked? (A5.)
10. **Sequencing / budget:** Fund Roadmap A (quick wins) or C (foundation-then-wins)? C is recommended
    but needs the human to confirm the 4-week substrate-first bet over pure A.

## Recommendation (analyst, not a decision)

**C (Hybrid)** — but the human must confirm decision #10 and the contract question (#2/#3). Everything
else is additive subscriber/work low-risk work that can start immediately regardless of the macro choice.
