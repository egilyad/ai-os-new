# Cognitive-Aux Panels — Status

> Last updated: 2026-08-04
> 27 panels marked as `experimental: true` in route registries

## Summary

| Status  | Count | %     |
| ------- | ----- | ----- |
| Working | 26    | 96.3% |
| Stub    | 1     | 3.7%  |

**All panels have the `ExperimentalBadge` UI indicator via `item.experimental` flag.**

---

## Panel Status

### Content Registry (17 panels)

| #   | ID                       | Component                         | Status     | Notes                                                                                      |
| --- | ------------------------ | --------------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| 1   | `project-os`             | `ProjectOsExplorer.tsx`           | ✅ Working | Workspace browser — attach/detach dirs, list tree, read files, search                      |
| 2   | `hypothesis-gen`         | `HypothesisGenerator.tsx`         | ✅ Working | Real CRUD via `hypothesisService` — propose, update, delete, addEvidence                   |
| 3   | `research-engine`        | `ResearchEnginePanel.tsx`         | ✅ Working | Real sessions via `researchEngine` — create, runLoop, delete, source config                |
| 4   | `arch-review`            | `ArchitectureReview.tsx`          | ✅ Working | Real analysis via `architectureReviewService` — scan tree, runFullAnalysis                 |
| 5   | `prompt-audit`           | `PromptAudit.tsx`                 | ✅ Working | Real audit via `promptAuditService` — buildAuditReport, 15s polling                        |
| 6   | `routing-experiments`    | `RoutingExperiments.tsx`          | ✅ Working | Real experiments via `routingExperimentsService` — run, history, cost estimation           |
| 7   | `gov-stress-test`        | `GovStressTest.tsx`               | ✅ Working | Real stress test via `govStressTestService` — runAllScenarios, buildReport                 |
| 8   | `obs-gaps`               | `ObsGaps.tsx`                     | ✅ Working | Real scanning via `obsGapsService` — scanServices, crossReferenceEvents                    |
| 9   | `debate-system-research` | `DebateSystemResearch.tsx`        | ✅ Working | Hub panel via `hypothesisService` + `researchRunService`                                   |
| 10  | `research-reports`       | `ResearchReportPanel.tsx`         | ✅ Working | Real reports via `researchReportService` — create, generate, delete                        |
| 11  | `research-advanced`      | `ResearchEngineAdvancedPanel.tsx` | ✅ Working | 10 tabs via `researchEngine` — citation graph, knowledge graph, etc.                       |
| 12  | `research-gemini`        | `GeminiResearchPanel.tsx`         | ✅ Working | Real Gemini LLM via `geminiResearchService` — search, fact-check, summary                  |
| 13  | `playground`             | `ModelComparePanel.tsx`           | ✅ Working | Multi-provider comparison via `keyService` + `adapterRegistry`                             |
| 14  | `ab-testing`             | `ABTestPanel.tsx`                 | ✅ Working | Real A/B harness via `runABTest` — actual LLM calls, latency/cost comparison               |
| 15  | `gemini-live`            | `GeminiLivePanel.tsx`             | ✅ Working | Real voice interface via `geminiLiveService` — speech recognition, Gemini Live API         |
| 16  | `meta-learning`          | `MetaLearningPanel.tsx`           | ✅ Working | Real learning engine via `metaLearningService` — observations, patterns                    |
| 17  | `quantum-inspiration`    | `QuantumInspirationPanel.tsx`     | ✅ Working | Real optimization via `quantumInspirationService` — simulated annealing, quantum tunneling |

### System Registry (10 panels)

| #   | ID                 | Component                  | Status     | Notes                                                                                      |
| --- | ------------------ | -------------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| 18  | `memory-palace`    | `MemoryPalacePanel.tsx`    | ✅ Working | Real memory viz via `memoryOrchestrator` — palace state, rooms, entries                    |
| 19  | `what-if`          | `WhatIfPanel.tsx`          | ✅ Working | Real simulations via `whatIfService` + `debateEngine` — topology, budget, strategy sims    |
| 20  | `shadow`           | `ShadowPanel.tsx`          | ✅ Working | Real drift detection via `routerProjection` + `routerService`                              |
| 21  | `causal-debugger`  | `CausalDebugger.tsx`       | ✅ Working | Full debug suite via 6 kernel services — trace listing, replay, scope management           |
| 22  | `counterfactual`   | `CounterfactualPanel.tsx`  | ✅ Working | Real simulation via 4 kernel services — counterfactualEngine, explanationService           |
| 23  | `aquarium`         | `AquariumPanel.tsx`        | ✅ Working | Real health viz via `useKeyStore` + custom engine hooks — fish = provider health           |
| 24  | `ecosystem`        | `EcosystemDashboard.tsx`   | ✅ Working | Real gamification via `ecosystemEngine` — creatures, achievements, themes                  |
| 25  | `federated-memory` | `FederatedMemoryPanel.tsx` | ✅ Working | Real federation via `federatedMemoryService` — nodes, sync, history                        |
| 26  | `aquarium-trading` | `AquariumTradingPanel.tsx` | ✅ Working | Real trading via `aquariumTradingService` — createOffer, accept, decline                   |
| 27  | `scheduler`        | `SchedulerPanel.tsx`       | ⚠️ Stub    | Toggle saves setting, but schedule list is **hardcoded const** — no real scheduling engine |

---

## Known Issues

### SchedulerPanel (Stub)

The `SchedulerPanel` has:

- A settings toggle that persists via `setSetting`
- A hardcoded `SCHEDULES` array with 4 mock entries and fake dates
- No real scheduling backend (no cron execution, no job creation, no persistence)

**Recommendation:** Either implement a real scheduling service or remove the panel.

---

## Experimental Badge

All 27 panels render `<ExperimentalBadge />` via the route registry `experimental: true` flag. The badge is a compact "Experimental" pill rendered above the panel content in `routes.tsx:225`.
