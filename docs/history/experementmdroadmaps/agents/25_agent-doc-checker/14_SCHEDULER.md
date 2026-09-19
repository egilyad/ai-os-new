# 14_SCHEDULER — Scheduler Participation

**Status:** N/A (no scheduler-specific participation). doc-checker and scheduling.

## Scheduler context

AGENTS.md mentions a **Scheduler** as a cognitive module to verify participation, but the verified source tree shows no `agent-doc-checker` reference in any scheduler code (Grep: only `agent-profiles.ts` + `topology-defaults.ts` contain the id).

## Invocation schedule triggers (D2)

The Invocation Engine design (AGENTS.md, D2) lists `schedule` as a _hybrid trigger_ type, but Step 6 only delivered the minimal Room proof surface. No scheduled-invocation UI or policy for doc-checker exists yet. Even when schedule triggers land, they would route through the same `AgentResolverDirectory` (phase21-invocation.ts:44) — doc-checker would be selectable like any node, not specially scheduled.

## Auto-spawn vs schedule

`AgentService.autoSpawnConfig` (agent-service.ts:81-86) is health/load-driven, not time-driven. It does not single out doc-checker.

## Conclusion

doc-checker has **no scheduler-specific behavior**. Any future scheduled invocation would treat it as a generic resolvable agent.

## Confidence

- No scheduler reference: VERIFIED via Grep.
- Future schedule handling: INFERRED from AGENTS.md D2 + phase21 architecture.
