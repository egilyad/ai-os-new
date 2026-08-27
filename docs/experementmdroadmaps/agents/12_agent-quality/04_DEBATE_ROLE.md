# 04_DEBATE_ROLE — `agent-quality` in debates

## CURRENT (VERIFIED)

- Selectable as a `DebateParticipant` like any agent node.
- `PersonaSelector.selectForTopic('agent-quality','Quality Engineer',topic,round,usedVariants,lang)` → `selectVariant` filters variants by `suitableRoles.includes('quality engineer') || 'quality engineer'==='neutral'` → **none match** → `eligible=[]` → returns `undefined` (`persona-selector.ts:260-290`).
- Result: the agent receives **no persona injection** and speaks only with its node `prompt` inside the generic debate prompt. It is effectively a "neutral" voice with a QA-flavoured system prompt but no structured QA behaviour (no claim-checking, no test-design framing enforced by the runtime).
- For invocation-triggered debates it is forced to `role:'neutral'` (`phase21-invocation.ts:81`).

## POTENTIAL (justified, INFERRED)

1. **Claim verifier / tester.** A QA engineer is the natural "show me the test / counterexample" voice. Debate arguments are unverified assertions; `agent-quality` could be the participant that demands falsifiable claims and proposes test/check designs.
2. **Coverage auditor of the debate.** Track which facets of the topic have been argued (`coverage gaps`) and flag unexamined angles — a fit with its `Coverage` specialization.
3. **Quality gate before consensus.** Before `DEBATE_CONSENSUS`, a QA pass could rate argument evidential support. (Note: a separate `QualityImpactCollector` already exists for debate _techniques_ — `quality-impact-collector.ts` — but it is orthogonal to this agent.)

## RECOMMENDED

- Add a **`quality_assurance` persona variant** to `persona-selector.ts` (trigger keywords: `test`, `coverage`, `verify`, `bug`, `edge case`, `regression`, `falsif`, `evidence`, `claim`, `assert`, `spec`), `suitableRoles:['neutral','con','pro']`, `minRound:1`, prompt that steers the agent to demand falsifiable claims, propose test/check designs, and flag coverage gaps.
- Make `selectVariant` treat unmatched roles gracefully: if `eligible` is empty, fall back to a **role-appropriate default** (e.g. map "Quality Engineer" → neutral-eligible `quality_assurance` variant) instead of returning `undefined`. This fixes ALL non-pro/con/neutral agents silently getting no persona.
- Optional: a `debate:quality:claim:checked` event produced by `agent-quality` turns (display-only, no new bus).

## Scenarios (INFERRED)

- **S1 — Feature design debate:** participants argue for/against an architecture; `agent-quality` (neutral) demands a test plan and flags untested failure modes. Outcome: more grounded conclusions.
- **S2 — Policy debate:** `agent-quality` (con) challenges each claim with "what measurement would disprove this?" raising rigour.
- **S3 — Post-debate QA gate:** after `DEBATE_CONSENSUS`, `agent-quality` emits a coverage report of which topic facets were actually evidenced.
