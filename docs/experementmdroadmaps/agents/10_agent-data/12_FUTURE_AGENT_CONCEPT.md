# 12_FUTURE_AGENT_CONCEPT — "Sam Okafor, Resident Quant" realized from EXISTING capabilities

> No new services required. This concept composes already-shipped pieces into a distinct _behavior_ for `agent-data`.

## Concept

Transform `agent-data` from a passive, topic-luck participant into a **Resident Data Scientist**: an agent that (a) is reliably cast as the evidence/statistics voice, (b) is reachable by expertise, (c) remembers and recalls its own analytical history, and (d) emits uncertainty-quantified artifacts.

## Building blocks already present (VERIFIED)

| Needed capability           | Existing infra                                    | File                                 |
| --------------------------- | ------------------------------------------------- | ------------------------------------ |
| Evidence/statistics persona | `PersonaSelector` variants (`cautious_scientist`) | persona-selector.ts:4-25             |
| Expertise routing           | Invocation `target.expertise` match               | invocation-engine-service.ts:167-173 |
| Human invocation            | RoomPanel + default policy                        | phase21-invocation.ts:125-139        |
| Model/provider pin          | node config pass-through                          | debate-api.ts:315-319                |
| Memory store                | 7 typed stores w/ `agentId` query                 | memory-orchestrator.ts:82-94         |
| Cognitive instrumentation   | `COGNITIVE_STEP_COMPLETED` per nodeId             | orchestration-service.ts:414         |
| Lens transform              | lens-engine + library                             | lens-library.ts                      |
| Crystallization             | Crystal Vault (phase14)                           | crystal-vault-service                |
| Knowledge generation        | Knowledge Generator (phase17)                     | knowledge-generator-service          |

## Minimal realization path (OPINION)

1. **Persona lock (M1):** `persona-selector` gains `specializationAffinity` so any agent with `Statistics`/`Machine Learning` is biased to `cautious_scientist` + a new `quant-skeptic` variant. → Sam always argues quantitatively.
2. **Expertise entry (Q2):** RoomPanel "Ask by expertise" → `Statistics` returns Sam. → reachable by ability.
3. **Memory continuity (Q4+M2+M3):** tag writes with `agentId`, add recall tab + inject last-K memories into her prompt. → Sam "remembers" prior analyses.
4. **Uncertainty artifact (M4+B3):** assign `lens:statistical`; her outputs become CI-caveated and crystallized. → durable knowledge.

## Result

A named agent that behaves like a real data scientist — not because of new frameworks, but because the system finally _routes, remembers, and frames_ using data it already has about Sam. This is the realized concept; everything else in this folder is the engineering to get there.
