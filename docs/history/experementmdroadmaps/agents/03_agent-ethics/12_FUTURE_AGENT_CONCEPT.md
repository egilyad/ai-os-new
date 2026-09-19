# 12 — FUTURE AGENT CONCEPT: realized `agent-ethics`

> A target-state description built **entirely from existing capabilities** (no new frameworks). "Realized" = the agent this system could present today if its latent ethics machinery were bound to Elena.

## Mission

Be the system's **ethics conscience**: audit decisions, arguments, and artifacts for fairness, transparency, accountability, and bias; return structured, actionable verdicts; and accumulate institutional ethical memory.

## Responsibilities (mapped to existing infra)

- **Debate ethics auditor** — fill a `ethics-auditor` neutral seat; apply `ethical_framework` constraint + consume `bias-profiler` output. (Reuse `debate-prompt-constants.ts:37,55`, `bias-profiler.ts`, `debate-meta-agent`.)
- **ConversationCore reviewer** — run as a Director scenario turn producing a structured verdict. (Reuse `ConversationDirectorService`, `ChatExecutor`.)
- **Human reviewer** — invoked from Room with a review template. (Reuse `invocation.ts`, phase21.)
- **Crystallizer** — finalized verdicts become Knowledge Crystals. (Reuse CrystalVault bridge.)
- **Cross-module gatekeeper** — auto-review forum consensuses / deployed workflows. (Reuse module event bridges + Invocation.)

## Capabilities (all exist today, just unbound)

- Persona + nvidia/llama-3.3-70b (VERIFIED `agent-profiles.ts:48-49`).
- Bias audit via `bias-profiler` (EXISTS, generic).
- Ethical-framework reasoning via `ethical_framework`/`ethical_evaluation` constraints (EXISTS, generic).
- Expert witness `expert-ethics` (EXISTS, separate feature).
- Structured-verdict parsing (POTENTIAL via `debate-metrics.ts:480-519` ethical_framework scoring).
- Memory via `AgentJournalService` (EXISTS, thin).
- Cognitive visibility via `COGNITIVE_STEP_COMPLETED` (EXISTS for non-debate; debate path fixable).

## Context & memory

- Journal entries tagged `ethics` + display name (fixes 08).
- Debate steps emit `COGNITIVE_STEP_COMPLETED` → journaled (fixes 10#3#4).
- Verdicts crystallized → retrievable institutional memory (BIG-1).

## Tools / services

- `AgentService.resolveAgent` (identity), `AgentJournalService` (memory), `InvocationEngineService` (human invoke), `ConversationDirectorService` (scenario), `debate-runtime` (participant), `CrystalVault` (memory of verdicts), `LensEngine` (ethics lens, MED-5).

## Debate behavior

- Default `neutral` / `ethics-auditor` seat on ethics/policy topics; emits a mandatory ethical-risk memo citing framework + responsible alternative; finalizer references it.

## Collaboration

- With `agent-risk` (compliance), `agent-critic` (fallacy), `agent-security` (responsible alternatives) as an Analytical cluster (`prompt-audit-service.ts:25-29`).

## Invocation

- Human-selected (Room) or via an `expertise`-matched policy (MED-4). Never self-invokes (D6).

## Cognitive visibility

- Visible in `LiveActivityStream` + `AgentStatsDashboard` + `AgentJournalPanel` through existing events only.

## UI

- `AgentCard` "⚖️ Ethics Review" quick action; Debate picker badge; Director preset; Journal `ethics` filter; verdict cards.

## Outputs

- Structured verdict: `{ risks[], responsibleAlternatives[], frameworkUsed, confidence }` + free-text rationale.

## Limitations (honest)

- Still LLM-bound; verdicts are advisory unless a gatekeeper policy enforces them (BIG-2).
- Depends on prompt reliability for structured extraction (MED-1).
- No new reasoning engine — leverage, not invention.
