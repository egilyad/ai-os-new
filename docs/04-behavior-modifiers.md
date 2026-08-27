# 04 — Behavior Modifiers

## Concept Layer

Behavior modifiers are parameters that change **how agents argue**, not what they argue about. They are the "physics" of the debate system — they affect reasoning style, emotional tone, and logical constraints without changing the topic or the agent's underlying knowledge.

Three modifier systems exist: **archetypes** (thinking style), **constraints** (reasoning boundaries), and **temperature** (emotional tone).

## System Mapping Layer

### Archetypes

```
DebateArchetypeId = 'scientist' | 'skeptic' | 'devils-advocate'
                   | 'pragmatist' | 'optimist' | 'cynic';
```

Defined in `debate-archetypes.ts`. Each maps to a character block injected into the agent's system prompt:

| Archetype        | Prompt Injection                                         |
| ---------------- | -------------------------------------------------------- |
| Scientist        | "You think like a scientist. Demand evidence. Use data." |
| Skeptic          | "You are deeply skeptical. Question every assumption."   |
| Devil's Advocate | "Argue against the prevailing view. Find the weak spot." |
| Pragmatist       | "Focus on practical outcomes. What actually works?"      |
| Optimist         | "Find the positive potential. Look for opportunities."   |
| Cynic            | "Assume the worst. Point out likely failures."           |

Applied in UI via toggle buttons. "Auto" assigns no archetype (uses default system prompt).

### Constraints

```
DebateConstraint = 'none' | 'facts_only' | 'emotional_only' | 'data_driven'
                 | 'ethical_framework' | 'first_principles' | 'pragmatic';
```

Constraints restrict **how** an agent can reason. Each maps to a `CONSTRAINT_PROMPTS` entry:

| Constraint          | Rule                                     | Used In                 |
| ------------------- | ---------------------------------------- | ----------------------- |
| `none`              | No restriction                           | Default                 |
| `facts_only`        | Only verifiable facts, no speculation    | Technical debates       |
| `emotional_only`    | Appeal to emotions, values, experiences  | Human-centric topics    |
| `data_driven`       | Every claim must cite data or statistics | Research analysis       |
| `ethical_framework` | Reason through ethical principles        | Policy debates          |
| `first_principles`  | Break down to fundamental truths         | Philosophical arguments |
| `pragmatic`         | Focus on practical consequences          | Decision-making         |

Assigned per-agent in the UI when `constrained` strategy is selected. In automatic mode, constraints cycle through agents.

### Temperature (Tone)

```
debateTemperature: 0.0 – 1.0  (mapped to 5 tiers)
```

**Not** the same as LLM temperature — this controls **tone instructions** in the prompt:

| Range   | Tier         | Prompt Injection                                        |
| ------- | ------------ | ------------------------------------------------------- |
| 0.0–0.1 | Pure Logic   | "Use pure logic. No emotion, no rhetoric."              |
| 0.2–0.3 | Analytical   | "Be analytical and measured. Prefer data over emotion." |
| 0.4–0.6 | Balanced     | "Balance logical reasoning with appropriate emphasis."  |
| 0.7–0.8 | Passionate   | "Argue with conviction and energy."                     |
| 0.9–1.0 | Pure Emotion | "Use emotional appeals. Passion over cold logic."       |

Mapping function: `buildTemperaturePrompt(temperature)` in `debate-runtime/debate-sync-manager.ts`.

## Behavior Layer

- Archetypes, constraints, and temperature are all injected into the **system prompt** — they modify the LLM's behavior via instruction, not via sampling parameters
- They stack: an agent can be a `Scientist` archetype + `facts_only` constraint + `0.7` temperature
- Constraints are enforced post-hoc by `scoreConstraintCompliance()` — heuristic checks that penalize violations (e.g., speculation for `facts_only`, data absence for `data_driven`)
- Constraint compliance scoring uses regex/pattern matching, not LLM judgement — fast but approximate
- Temperature tone is distinct from model temperature (`DebateConfig.temperature`) which controls LLM sampling randomness
- In Socratic strategy, the questioner (Socrates) ignores archetype/constraint — only respondents use them
