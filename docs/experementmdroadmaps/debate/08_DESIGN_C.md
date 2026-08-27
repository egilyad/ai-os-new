# 08 — DESIGN C: "Cognitive Timeline"

**Thesis:** Make the debate _explainable_ by interleaving each argument with the reasoning steps that produced it — closing the cognitive-stream gap.

---

## Target user & primary job-to-be-done

- **User:** A researcher or analyst who needs to audit _why_ agents took positions, not just what they said.
- **JTBD:** "Show me the chain of thought behind every argument so I can trust (or challenge) the verdict."

---

## VERIFIED baseline (what exists today)

- The runtime emits a rich set of low-level debate events (event-registry.ts 585–633): `debate:runtime:agent:thinking`, `debate:runtime:agent:chunk`, `debate:runtime:agent:responded`, `debate:runtime:agent:error`, `debate:runtime:round:started/ended`, `debate:runtime:consensus:reached`.
- **Cognitive events ALREADY EXIST in the registry** but are NOT emitted by debate: `cognitive:trace:updated` (737), `cognitive:step:active` (756), `cognitive:step:completed` (764), `cognitive:decision:made` (776, payload `CognitiveDecisionSchema`). This is the VERIFIED root of the "cognitive stream gap" cited in the AGENTS.md roadmap: debate produces arguments without the reasoning trace that other modules (Lenses/Synthesis) can emit.
- `debateLiveStore.ts` currently treats `thinking` as a status flag only (line 132) — it does not capture _what_ the agent was thinking. There is no place today where a reasoning step is attached to an argument.

---

## Concept description

**OPINION / INFERRED (novel parts):**

1. **Bridged cognitive stream.** Propose that the Debate runtime (or a thin adapter) emit `cognitive:step:active` / `cognitive:step:completed` keyed to the same `sessionId` + `agentId` already present in `debate:runtime:agent:thinking/responded`. This is the literal bridge described in the 04 concept doc. INFERRED that the runtime can be instrumented at the LLM-call boundary.
2. **Timeline interleave.** A vertical (or horizontal) timeline renders alternating nodes: `[cognitive:step]` (why) → `[debate:argument / responded]` (what). Each argument card expands to reveal its reasoning subtree.
3. **Decision markers.** `cognitive:decision:made` events render as gold decision diamonds — the moment an agent committed to a stance.
4. **Verdict linkage.** The final `debate:verdict:generated` (825) and `debate:consensus` (793) nodes anchor the timeline end, letting the analyst trace each verdict clause back to the steps that produced it.

---

## Key screens

See `designs/08_cognitive_timeline.svg`. A horizontal timeline with lanes: top lane = cognitive reasoning steps (indigo), bottom lane = debate arguments (emerald), gold diamonds for decisions, and a verdict anchor at the right.

---

## How it uses / extends the existing architecture

- **Extends** the event model: debate runtime adds `cognitive:*` emissions (seam already present in registry — no new contract, just new producers). This is additive and preserves the existing `debate:*` stream consumed by `debateLiveStore.ts`.
- **New consumer store** (INFERRED): a `cognitiveTimelineStore` that joins `debate:*` and `cognitive:*` by `sessionId+agentId+timestamp`. It does not replace `debateLiveStore`; it composes on top.
- **Replay benefit:** because reasoning steps are event-sourced, they become available in replay — closing the VERIFIED replay gap (consensus/verdict not in replay today).

---

## Strengths / risks / effort

- **Strengths:** Turns the platform's existing cognitive-event vocabulary into a differentiator; makes debates auditable; directly solves the replay-gap for reasoning.
- **Risks:** Depends on the Debate runtime actually emitting `cognitive:*` — currently it does NOT (VERIFIED gap). Instrumenting LLM calls adds latency/noise. The join key across two event families must be reliable.
- **Effort:** **L** (runtime instrumentation + join store + timeline UI).
- **Dependencies:** Debate LLM-call boundary, `event-registry.ts` cognitive schemas, `debateLiveStore.ts`.

---

## Distinctiveness vs other concepts

- vs **A/B:** C is about _explanation_, not observation or control.
- vs **D:** D uses the debate inside a research loop; C explains the debate itself.
- vs **E:** C is E's "cognitive timeline toggle."
