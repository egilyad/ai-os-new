# 04_DEBATE_ROLE — `agent-data` in Debate

## CURRENT (VERIFIED)

- `agent-data` is a seeded debate participant. Router edge `e-router-data` (topology-defaults.ts:474, trigger `data_flow`) feeds it; `e-data-agg` (`:526`) sends its output to the aggregator.
- When a debate is started, `debate-api.ts:308-320` builds the participant from the **node config**: `provider: node.config.provider` (`groq`), `modelId: node.config.model` (`llama-3.3-70b-versatile` unless `'auto'`). So Sam literally runs on groq/llama-3.3-70b-versatile during debates.
- Persona is assigned by `PersonaSelector.selectForTopic` (`persona-selector.ts:292-308`), scored by **topic keywords + role**, NOT specializations. For a data/statistics-laden topic, `cautious_scientist` (trigger keywords include `data`, `statistics`, `evidence`, `hypothesis`, `empirical` — `:10-22`) is a strong match. So specializations indirectly help _only_ insofar as the topic text contains those words.
- `prompt-audit-service.ts:26` groups `agent-data` under **'Analytical'** for prompt-collision audits.

## POTENTIAL (justified, INFERRED/OPINION)

1. **Specialization-aware persona bias.** `resolveAgent('agent-data').specializations` = [ML, Statistics, Forecasting]. The selector _could_ boost `cautious_scientist` / add a "quantitative skeptic" variant when the agent has a Statistics specialization. Justified: today two different data agents (agent-data, agent-database, agent-risk) get personas purely from topic luck, not from their identity.
2. **Statistical-counterargument role.** Add a debate `role` (e.g., `quant-skeptic`) where the agent's turn is constrained to demand p-values/CI/sample size — leveraging the existing `ARGUMENT_STRATEGY_INSTRUCTIONS`/`CONSTRAINT_PROMPTS` machinery (`debate-prompt-builder.ts`, imported by prompt-audit-service:7).
3. **Forecasting participant.** For futures/prediction debates, auto-assign `agent-data` as the quant forecaster using its `Forecasting` specialization.

## RECOMMENDED (OPINION)

Make debate persona selection a **two-signal** function: (a) topic keywords (existing) + (b) a lightweight specialization→variant affinity map. Keep it declarative in `persona-selector.ts` (no new service). `agent-data` would then reliably surface as the evidence/statistics voice instead of competing on keyword roulette.

## Scenarios (VERIFIED mechanics, OPINION framing)

1. **"Is this correlation causal?" debate** — `agent-data` (pro/con) forced into `cautious_scientist`; aggregator collects CI-qualified claims. Mechanics: existing `round_robin` + variant injection.
2. **Market-forecast dispute** — `agent-data` as `quant-skeptic` demanding uncertainty bands; `agent-risk` as adversary. Uses existing role assignment in `debate-api.ts:307`.
3. **Policy debate with evidence gate** — `agent-data` participates only on rounds where claims lack empirical support (could hook `minRound`/triggerKeywords already present in variants, `:24,:145`).
