# 14_ALTERNATIVE_ROADMAP — Philosophy B: agent-ux as a cross-cutting "UX governance" layer

> A second philosophy for comparison. Trade-offs vs Roadmap A (13).

## Philosophy B thesis

Instead of making `agent-ux` _one more participant_, treat it as a **cross-cutting UX-governance filter** that reviews _other_ agents' outputs for usability/accessibility before they reach the user — a "UX gate" rather than a "UX contributor."

## Shape

- A **post-processing decorator** wraps `ChatExecutor`/`debate-agent-executor` results: any output destined for a human UI is passed through `agent-ux` (or the `lens:ux` + `ux_researcher` persona) for a usability/accessibility check, attaching a `uxScore` + flagged issues.
- Reuses: `ChatExecutor` interceptor hooks (`chat-executor.ts` emits `STREAM_END`/`CHAT_RESPONSE`), `lens-engine`, `persona-selector`, `memory-engine` for persisted UX gates.

## Phase mapping (B)

- **B0**: `uxScore` annotation on outputs (decorator over executor result).
- **B1**: Gate threshold → block/flag low-usability responses (configurable).
- **B2**: Aggregate UX gates into a dashboard; feed back into `prompt-audit-service` grouping (fixes P7 meaningfully).
- **B3**: Auto-route flagged outputs to a `agent-ux` re-write turn (Director scenario).

## Trade-offs vs A

| Dimension            | A (differentiate agent)          | B (UX governance gate)                |
| -------------------- | -------------------------------- | ------------------------------------- |
| User-visible agent   | Strong, explicit "User Advocate" | Implicit, behind-the-scenes           |
| Effort               | Phased, mostly UI/extension      | Needs executor interception (riskier) |
| Reuse                | Lens/persona/scenario/memory     | Executor hooks + decorator            |
| Risk                 | Low                              | Med-High (intercepts hot path)        |
| Value                | Direct UX deliverables           | Systemic quality, less "agent-y"      |
| Fits repo discipline | Yes (additive)                   | Yes but touches execution hot path    |

## Recommendation

**[OPINION]** Adopt **A as primary** (low risk, clear agent identity) and treat **B as a later, optional Layer-4 enhancement** once `lens:ux` + `ux_researcher` exist — B reuses exactly those primitives. Do NOT build B first; it couples UX value to the execution hot path and hides the agent's identity from users. The two are complementary, not exclusive.
