# 04_DEBATE_ROLE — `agent-writer` in Debate

## CURRENT state

- The writer is a topology **node** (`topology-defaults.ts:382-393`) and therefore a _potential_ debate participant whenever a debate session uses the default topology (or any topology containing it).
- When it speaks, `PersonaSelector.selectForTopic` assigns a **persona variant by topic keywords** (`persona-selector.ts:243-308`). Variants are generic: `cautious_scientist`, `passionate_advocate`, `pragmatic_economist`, `legal_expert`, `historian`, `technologist`, `philosopher`, `diplomat`, `critic`, `strategist`.
- **The writer's `specializations: ['Documentation','Tutorials','API Docs']` are never read** by `PersonaSelector` or by debate participant selection (`persona-selector.ts` has no `specializations`/`AGENT_PROFILES` reference). `[VERIFIED]`
- `debate-llm-caller.ts` uses `participant.agentId` to build names/keys and to call the LLM; the node's model/provider (groq/llama-3.1-8b-instant) is what actually runs. `[VERIFIED]`
- Debate emits NO `cognitive:*` events (`AGENTS.md` "Debate emits NO cognitive events"). Writer's debate activity is captured only by `agent-journal-service.ts:174` on `debate:runtime:agent:error` and by `COGNITIVE_STEP_COMPLETED` if debate steps go through the orchestrator.

**Result:** In a debate, Clara is a _generic arguer wearing a "Technical Writer" name tag_. Her documentation expertise is inert.

## POTENTIAL (justified)

1. **Documentation-quality judge / critic in debates about specs, APIs, or docs.** A debate on "should we adopt OpenAPI 3.1?" or "is our README accurate?" could use the writer as a _domain expert_ rather than a generic persona.
2. **"Translate the debate into docs" post-debate step.** After a debate reaches `DEBATE_CONSENSUS`, the writer could generate a summary doc / decision record (`DEBATE_CONSENSUS` payload at `event-registry.ts:793` already carries `consensus`, `synthesis`, `resolvedPoints`).
3. **Spec-compliance auditor in debate.** Pair the writer with `agent-doc-auditor` to check whether debate claims match existing documentation.

## RECOMMENDED

Make the writer's **specialization a first-class debate signal**: extend `PersonaSelector` (or add a documentation-aware selector) so that when the topic matches documentation/API/tutorial keywords, the writer is either (a) selected as a participant with a `documentation_expert` persona, or (b) auto-assigned the post-debate "write the decision record" task. This reuses `PersonaSelector`'s existing `triggerKeywords` mechanism — add a `documentation` variant and let `agentService.resolveAgent` expose `specializations` so selection can prefer the writer for doc topics. `[INFERRED]` Low-risk because it only adds a branch; the generic fallback remains.

## Scenarios

- **S1 — API design debate → doc.** Topic "Design the public REST API for X". Writer participates as `documentation_expert`, then on `DEBATE_CONSENSUS` produces an API reference skeleton. _Value: debates produce artifacts, not just text._
- **S2 — Doc accuracy audit.** A debate whose claims should match the docs; writer + doc-auditor cross-check. _Value: reduces doc/code drift._
- **S3 — Tutorial generation from consensus.** After a "how should a beginner use feature Y" debate, writer emits a tutorial. _Value: turns deliberation into onboarding material._
