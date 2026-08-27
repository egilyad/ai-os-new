# 04 — DEBATE ROLE: `agent-ethics`

## CURRENT (VERIFIED)

- A **generic debate participant**. Side (`pro`/`con`/`neutral`) is assigned by the debate creator; it is **not** derived from her ethics specialization. (`persona-selector.ts` keys only on role + topic keywords; no specialization→side map.)
- Her only ethics flavor is the one-line system prompt: _"Evaluate decisions for fairness, transparency, accountability, and bias. Flag ethical risks and propose responsible alternatives."_ (`topology-defaults.ts:174`)
- `PersonaSelector` may layer a generic variant on top when topic keywords match: `passionate_advocate` (ethical/moral/fair/justice…, `persona-selector.ts:27-48`), `legal_expert` (policy/regulation…, `:74-96`), `philosopher` (ethics…, `:148-170`). These are **topic-driven and agent-agnostic** — a network engineer would get the same injection on an "ethical" topic.
- Shared debate tooling she _incidentally_ benefits from (but is not bound to her): `bias-profiler.ts`, `ethical_framework`/`ethical_evaluation` constraints (`debate-prompt-constants.ts:37,55`), `expert-ethics` witness (`expert-witness-service.ts:35`).

## POTENTIAL (INFERRED, justified by specialization)

- **Mandatory ethics auditor** in any debate touching fairness/rights/policy: auto-assigned a `neutral` / "red-team-ethics" seat and required to emit a structured ethical-risk verdict.
- **Bias auditor**: because her specialization literally is "Bias Audit", she is the natural consumer/owner of `bias-profiler` output — currently generic.
- **Policy compliance gate**: she should be the one to apply the `ethical_framework` constraint deliberately, not have it injected blindly.

## RECOMMENDED (OPINION)

Make Elena the **default ethical-advisory participant** for debates whose topic matches an ethics/policy/fairness keyword set, with a **structured output contract** (flag risks + propose responsible alternative + name the framework used). This reuses `ethical_framework` constraint + `bias-profiler` + `expert-ethics` witness — all already built — and binds them to _her_ rather than leaving them generic.

## Scenarios (INFERRED)

1. **AI deployment debate** ("Is it ethical to deploy autonomous X?"): Elena as `neutral` ethics auditor; uses `ethical_framework` constraint; produces a fairness/accountability risk memo cited by the finalizer.
2. **Policy dispute** (regulation of technology): Elena + `legal_expert` persona + `expert-ethics` witness; she owns the "responsible alternative" turn.
3. **Bias audit of another agent's argument**: she consumes `bias-profiler` output (`bias-profiler.ts:242-288`) to deliver a bias-exploitation/mitigation review — turning the generic profiler into a role-owned deliverable.
