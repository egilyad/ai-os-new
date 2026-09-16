# 14 — ALTERNATIVE ROADMAP: `agent-ethics`

> Philosophy B: **"Embed ethics as a cross-cutting capability, not as a single agent."** Trade-offs vs Roadmap A (which makes one node the Ethics Officer).

## Philosophy

Instead of strengthening `agent-ethics` as a hero agent, treat **ethics as a lens/constraint/skill** that is injected into _every_ relevant agent and artifact. The `agent-ethics` node becomes a thin **orchestrator/facilitator** of distributed ethics checks rather than the sole doer.

## Contrast with A

| Dimension           | A (agent-centric)             | B (capability-centric)                                |
| ------------------- | ----------------------------- | ----------------------------------------------------- |
| Ownership of ethics | Elena owns it                 | Every agent carries an ethics lens; Elena facilitates |
| New code            | Minimal (binds existing)      | Minimal, but spread across agents/lenses              |
| Failure mode        | Single point of bias/omission | Diffusion of responsibility                           |
| User mental model   | "ask Elena"                   | "everything is ethically reviewed"                    |
| Best when           | clear accountability needed   | broad, low-friction coverage                          |

## B tasks

- **B1 — Ethics as a global Lens** (`lens:ethics`, MED-5) auto-applied to Synthesis + Debate prompts for policy/moral topics, not just Elena. Reuse `lens-library.ts`.
- **B2 — Ethical-framework constraint as default-on** for debate topics matching ethics keywords (reuse `debate-prompt-constants.ts:37,55`), so _all_ participants reason ethically, not just Elena.
- **B3 — Elena as "Ethics Coordinator"**: she does not write every verdict; she **aggregates** per-agent ethical notes + `bias-profiler` output into one consolidated memo (reuse `debate-finalizer.ts`, `narrative-builder.ts`).
- **B4 — Ethics scoreboard**: a cross-agent ethical-compliance metric (reuse `debate-metrics.ts:480-519` ethical_framework scoring) shown in Dashboard, not tied to one agent.
- **B5 — Distributed gate**: each module (Crystal/Forum/Workflow) runs its own lightweight ethics check via the lens; Elena only escalates conflicts.

## Trade-offs

- **Pros**: no single bottleneck; ethics becomes cultural, not personality-dependent; leverages existing lens/constraint infra fully.
- **Cons**: accountability is diffused — "who approved this ethically?" has no single answer; risk of shallow, checklist-style ethics from every agent; Elena's distinct persona/identity (🛡️, Elena Marchetti) becomes decorative.
- **Risk**: lowest when paired with A's structured-verdict work — i.e., **B is best as a complement, not a replacement.** Recommendation: do A (accountability + visibility) first, then layer B (broad coverage) on top.
