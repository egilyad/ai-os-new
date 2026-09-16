# 10 — Experiments Framework

## Concept Layer

The experiments framework enables systematic comparison of debate configurations. It is built on the `AutoDebateService` which wraps `DebateSyncManager.startDebate()` and records results. The framework is designed for A/B testing of strategies, archetypes, constraints, and temperature settings.

## System Mapping Layer

### AutoDebateService

**Location**: `src/kernel/services/auto-debate/auto-debate-service.ts`

**Dependencies**: `keyService`, `DebateSyncManager` (via `startDebate`)

**Methods**:

| Method                    | Purpose                                                                         |
| ------------------------- | ------------------------------------------------------------------------------- |
| `runAutoDebate(options?)` | Single debate with auto-selected participants and random topic                  |
| `runQuickTest()`          | Quick single debate with default settings                                       |
| `stressTest(count)`       | Run N debates sequentially, measure throughput and failure rate                 |
| `batchTest(topic, runs)`  | Run N debates on the same topic, compare outcomes                               |
| `getResults()`            | Return `AutoDebateResult[]` with timings per debate                             |
| `getWinRates()`           | Compute `ProviderWinRate[]` — how often each provider appears in consensus text |
| `clearResults()`          | Reset accumulated results                                                       |

**Topics**: 25 topics across 5 categories (Technology, Science, Philosophy, Business, Society).

**Participant generation**: Cyclic assignment of pro/con/neutral roles across active API keys.

### Manual Experiment Setup (DebatePanel)

The UI supports experiment configuration:

| Control              | Range                       | Purpose                          |
| -------------------- | --------------------------- | -------------------------------- |
| Strategy selector    | 13 strategies (33 built-in) | Compare turn-taking strategies   |
| Max rounds           | 2–50                        | Vary debate length               |
| Temperature slider   | 0–10                        | Compare tone effects             |
| Archetype toggles    | 6 archetypes + Auto         | Compare thinking styles          |
| Constraint per-agent | 7 options                   | Compare reasoning restrictions   |
| Agent selection      | 20 agents                   | Test different team compositions |

## Behavior Layer

### How to Run a Comparison

1. **Choose independent variable**: strategy, archetype, constraint, temperature, or agent set
2. **Keep everything else constant**: same topic, same number of rounds, same provider
3. **Run multiple debates**: use `batchTest(topic, N)` for statistical significance
4. **Read the metrics**: compare `convergenceScore`, `qualityMetrics.depth.depthScore`, `qualityMetrics.originality.noveltyScore`, `qualityMetrics.usefulness.usefulnessScore`
5. **Read the interpretation**: compare `disagreementPeak.intensity`, `trajectoryChangers.length`, `insights[]`

### What to Measure

| Question                                         | Metric to Check                                            |
| ------------------------------------------------ | ---------------------------------------------------------- |
| Which strategy produces deepest reasoning?       | `graphMetrics.maxDepth`, `qualityMetrics.depth.depthScore` |
| Which archetype creates most original arguments? | `qualityMetrics.originality.noveltyScore`                  |
| Do constraints reduce relevance?                 | `qualityMetrics.usefulness.relevanceScore`                 |
| Does temperature affect convergence?             | `convergenceScore` at round 5 vs. round 10                 |
| Which provider is most reliable?                 | `getWinRates()` from AutoDebateService                     |
| Does team size affect quality?                   | Compare 5 vs. 10 vs. 20 agents on same topic               |

### Known Limitations

- Quality metrics are heuristic — they measure surface features (lexical diversity, evidence patterns) not actual reasoning quality
- Constraint compliance degrades after 3–4 rounds (pattern-matching approaches drift)
- The Socratic quality gate is not yet implemented — syntactic questions ("Can you elaborate?") are not filtered
- Convergence scoring uses Jaccard similarity, not semantic similarity (word overlap, not meaning overlap)
- A fallback to HuggingFace `Xenova/all-MiniLM-L6-v2` exists for semantic similarity but falls back to Jaccard on error
