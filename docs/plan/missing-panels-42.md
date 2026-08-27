<!--
  HISTORICAL REFERENCE — this plan is retained for context only.
  Of the 32 panels listed below (16 P0 + 16 P1), all were built as demo
  scaffolds during initial development, not as production-grade
  implementations. The remaining 10 services were correctly skipped.
-->

# Missing UI Panels — 42 Services

## Legend

| Tier     | Description                                                    |
| -------- | -------------------------------------------------------------- |
| **P0**   | Must have — clear user-facing value, shows unique data/config  |
| **P1**   | Should have — useful for power users, config or monitoring     |
| **P2**   | Nice to have — deep tech, debatable if standalone panel needed |
| **SKIP** | Truly internal — no panel needed, dismiss in registry          |

---

## Phase 3 — Debate Sub-services (34)

### P0 — Standalone Panel Worth Building

| #   | Service                 | Panel Name             | Data/Features                                                    |
| --- | ----------------------- | ---------------------- | ---------------------------------------------------------------- |
| 1   | `steelmanService`       | SteelmanPanel          | Steelman argument generation config + history + toggle per-agent |
| 2   | `bayesianJudge`         | BayesianJudgePanel     | Judge weights, scores per round, calibration curve               |
| 3   | `blindEval`             | BlindEvalPanel         | Blind evaluation results table, per-agent scores                 |
| 4   | `credibilityScorer`     | CredibilityPanel       | Credibility scores over time, per-agent breakdown                |
| 5   | `calibrationService`    | CalibrationPanel       | Calibration curves, overconfidence detection                     |
| 6   | `consistencyService`    | ConsistencyPanel       | Consistency violations, contradiction log                        |
| 7   | `frameTracker`          | FrameTrackerPanel      | Frame categories detected per argument, timeline                 |
| 8   | `stanceDriftTracker`    | StanceDriftPanel       | Stance drift over rounds, visualization per agent                |
| 9   | `insightBus`            | InsightBusPanel        | Real-time insight stream, filter by type/source                  |
| 10  | `entanglementEngine`    | EntanglementPanel      | Entanglement graph, causal links between arguments               |
| 11  | `anchoringService`      | AnchoringPanel         | Active anchors, bias detection, override config                  |
| 12  | `metaAgentController`   | MetaAgentPanel         | Meta-agent config, orchestration rules, sub-agent list           |
| 13  | `outcomeForecaster`     | OutcomeForecasterPanel | Predicted outcomes vs actual, confidence tracking                |
| 14  | `conceptBlender`        | ConceptBlenderPanel    | Blend config, source concepts, generated hybrids                 |
| 15  | `beliefMiningService`   | BeliefMiningPanel      | Mined beliefs per agent, belief graph                            |
| 16  | `minimaxPlannerService` | MinimaxPlannerPanel    | Strategy tree viewer, decision points                            |

### P1 — Useful Config/Monitoring

| #   | Service                         | Panel Name             | Data/Features                                        |
| --- | ------------------------------- | ---------------------- | ---------------------------------------------------- |
| 17  | `expertWitnessService`          | ExpertWitnessPanel     | Expert witness calls, credibility per source         |
| 18  | `rhetoricalDeviceSelector`      | RhetoricPanel          | Device selection stats, effectiveness per device     |
| 19  | `biasProfiler`                  | BiasProfilerPanel      | Detected biases per agent, severity breakdown        |
| 20  | `incentiveDetector`             | IncentiveDetectorPanel | Detected incentives, alignment analysis              |
| 21  | `stakeholderMapper`             | StakeholderPanel       | Stakeholder map, influence graph                     |
| 22  | `scratchpadService`             | ScratchpadPanel        | Agent scratchpad contents, thought process viewer    |
| 23  | `personaMixer`                  | PersonaMixerPanel      | Persona mixing config, active personas per debate    |
| 24  | `boPTrackerService`             | BoPTrackerPanel        | Best-of-N tracking, selection stats                  |
| 25  | `gotDeliberation`               | GotDeliberationPanel   | Chain-of-thought deliberation viewer                 |
| 26  | `similarityMonitor`             | SimilarityMonitorPanel | Argument similarity scores, duplicate detection      |
| 27  | `driftDetector`                 | DriftDetectorPanel     | Drift alerts, trend lines per agent/metric           |
| 28  | `shadowOpponentService`         | ShadowOpponentPanel    | Shadow opponent generation config, counter-arguments |
| 29  | `adversarialSourceService`      | AdversarialSourcePanel | Adversarial source config, attack type selection     |
| 30  | `vulnerabilityTargetingService` | VulnTargetingPanel     | Vulnerability targeting config, detected weaknesses  |
| 31  | `justificationEnforcer`         | JustificationPanel     | Justification rules, enforcement stats               |
| 32  | `logicalFormExtractor`          | LogicalFormPanel       | Extracted logical forms, inference chains            |

### SKIP — Deep Internal, No Panel

| #   | Service                   | Reason                                 |
| --- | ------------------------- | -------------------------------------- |
| 33  | `debateEmbeddingPipeline` | Purely internal — no user-facing state |
| 34  | `interruptQueue`          | Internal queue — no panel needed       |

---

## Core + Phase 0 (7) — Infrastructure

| #   | Service                | Phase  | Panel?                  | Reason                                     |
| --- | ---------------------- | ------ | ----------------------- | ------------------------------------------ |
| 35  | `schedulerService`     | core   | **P1 — SchedulerPanel** | Cron jobs, schedule viewer, manual trigger |
| 36  | `logger`               | core   | **SKIP**                | Logs covered by existing LogsPanel         |
| 37  | `dal`                  | core   | **SKIP**                | Pure data abstraction layer                |
| 38  | `BucketStorageAdapter` | core   | **SKIP**                | Internal storage adapter                   |
| 39  | `eventBridge`          | phase0 | **SKIP**                | Internal event bridge                      |
| 40  | `projectionRegistry`   | phase0 | **SKIP**                | Internal projection registry               |
| 41  | `routerProjection`     | phase0 | **SKIP**                | Internal router projection                 |

---

## Phase 1 (1) — Kernel

| #   | Service  | Phase  | Panel?   | Reason                                |
| --- | -------- | ------ | -------- | ------------------------------------- |
| 42  | `kernel` | phase1 | **SKIP** | DI container itself — no panel needed |

---

## Summary

| Tier     | Count | Action                                                                                                                                                      |
| -------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P0**   | 16    | Build standalone panels                                                                                                                                     |
| **P1**   | 16    | Build after P0 (1 scheduler + 15 debate sub)                                                                                                                |
| **SKIP** | 10    | Dismiss in registry (logger, dal, BucketStorageAdapter, eventBridge, projectionRegistry, routerProjection, kernel, debateEmbeddingPipeline, interruptQueue) |

**Total to build: 32 panels** (16 P0 + 16 P1)
**Total to dismiss: 10**

---

## Route Mapping (for SERVICE_ROUTE_MAP)

When a panel is created, add to `service-phases.ts`:

```typescript
// Phase 3 — Debate
steelmanService: 'steelman',
bayesianJudge: 'bayesian-judge',
blindEval: 'blind-eval',
credibilityScorer: 'credibility',
calibrationService: 'calibration',
consistencyService: 'consistency',
frameTracker: 'frame-tracker',
stanceDriftTracker: 'stance-drift',
insightBus: 'insight-bus',
entanglementEngine: 'entanglement',
anchoringService: 'anchoring',
metaAgentController: 'meta-agent',
outcomeForecaster: 'outcome-forecaster',
conceptBlender: 'concept-blender',
beliefMiningService: 'belief-mining',
minimaxPlannerService: 'minimax-planner',
expertWitnessService: 'expert-witness',
rhetoricalDeviceSelector: 'rhetoric',
biasProfiler: 'bias-profiler',
incentiveDetector: 'incentive-detector',
stakeholderMapper: 'stakeholder',
scratchpadService: 'scratchpad',
personaMixer: 'persona-mixer',
boPTrackerService: 'bop-tracker',
gotDeliberation: 'got-deliberation',
similarityMonitor: 'similarity',
driftDetector: 'drift-detector',
shadowOpponentService: 'shadow-opponent',
adversarialSourceService: 'adversarial-source',
vulnerabilityTargetingService: 'vuln-targeting',
justificationEnforcer: 'justification',
logicalFormExtractor: 'logical-form',
// Core
schedulerService: 'scheduler',
```

Each new route must also be added to `VALID_ROUTE_IDS` and `ROUTE_PATH` in `service-phases.ts`, and the panel component registered in `route-imports.ts`.
