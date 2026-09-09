# 01 — System Architecture

## Concept Layer

The system is architected around a **kernel with services, not plugins**. Every component is registered in a DI container, wired through the event bus, and managed by a lifecycle manager. The architecture enforces:

- **No globals** — all dependencies injected through constructors
- **No circular imports** — services depend on contracts, not other services
- **Contracts at boundaries** — every cross-service interaction goes through an interface in `contracts/`
- **Events as the primary communication channel** — services emit events; UI and other services react

## System Mapping Layer

### Core Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  EventBus ─── on() / emit() / onSafe() — typed, validated   │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                              │
│                                                              │
│  DebateSyncManager  ─── orchestrates debates                     │
│    ├─ DebateGovernor ─── claim graph, contradictions         │
│    ├─ DebateInterpreter ─── post-hoc analysis                │
│    ├─ DebateStateBuilder ─── prompt context builder          │
│    └─ AutoDebateService ─── batch testing                    │
│                                                              │
│  DebateEngine  ─── DAG-based alternative (contract-driven)   │
│    ├─ DebateSession ─── phase lifecycle                     │
│    ├─ DebateBudget ─── token/cost tracking                  │
│    ├─ DebateMemory ─── reasoning chains                     │
│    ├─ DebateConsensusEngine ─── claim matching              │
│    ├─ DebateEvaluator ─── agent scoring                     │
│    ├─ DebateTimeline ─── event recording                    │
│    └─ DebateOrchestrator ─── round execution                │
│                                                              │
│  Governor Subsystem (debate-governor/)                       │
│    ├─ claim-extractor.ts ─── parse claims from text         │
│    ├─ claim-graph.ts ─── build/kquery claim DAG             │
│    ├─ contradiction-detector.ts ─── find contradictions     │
│    └─ diversity-scorer.ts ─── speaker diversity metrics     │
│                                                              │
│  Provider Layer                                              │
│    ├─ ProviderAdapterRegistry ─── adapter lookup by name    │
│    ├─ ProviderRouter ─── scoring + fallback chains          │
│    ├─ KeyService ─── key CRUD and pool selection            │
│    └─ ProbeService ─── quick key probing                    │
│                                                              │
│  Infrastructure                                              │
│    ├─ LifecycleManager ─── init/start/destroy               │
│    ├─ TransactionContext ─── atomic multi-mutation          │
│    ├─ LoggerService ─── structured logging                  │
│    ├─ config-mutations.ts ─── runtime feature control       │
│    ├─ ConfigService ─── configuration overlays              │
│    ├─ ConsistencyChecker ─── docs↔code validation           │
│    └─ ConsistencyChecker (implements IConsistencyHealingPipeline) ─── auto-healing flow │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

| Component            | Location                                                                |
| -------------------- | ----------------------------------------------------------------------- |
| DebateSyncManager    | `src/kernel/services/debate-runtime/debate-sync-manager.ts`             |
| DebateGovernor       | `src/kernel/services/debate-runtime/debate-governor/`                   |
| DebateInterpreter    | `src/kernel/services/debate-runtime/debate-interpreter.ts`              |
| DebateStateBuilder   | `src/kernel/services/debate-runtime/debate-state-builder.ts`            |
| AutoDebateService    | `src/kernel/services/debate-runtime/auto-debate/auto-debate-service.ts` |
| DebateEngine         | `src/kernel/services/debate-runtime/debate-engine.ts`                   |
| TopologyDefaults     | `src/kernel/state/topology-defaults.ts`                                 |
| DI Container         | `src/kernel/container.ts`                                               |
| Service Registration | `src/kernel/service-registration/` (12 phases)                          |
| Bootstrap            | `src/kernel/bootstrap.ts`                                               |
| Event Names          | `src/kernel/events/`                                                    |

### Dependency Graph (DebateSyncManager)

```
DebateSyncManager
  → IDatabaseService     (persistence: Dexie KV)
  → IProviderAdapterRegistry  (getAdapter, resetCircuitBreaker)
  → IKeyService          (getKeys, recordUsage)
  → IRouterService       (getDebateProviders, getRankedProviders)
  → IEventBus            (emit debate:* events)
  → IWorkspaceService    (file context for prompts)

ConsistencyChecker
  → (standalone, no DI deps — operates on code manifest)

ConsistencyChecker (implements IConsistencyHealingPipeline)
  → IConsistencyChecker  (checkDocs for validation/verification)
```

## Behavior Layer

At startup, bootstrap registers ~50 services, inits them in parallel (with critical/optional classification), mounts the default agent topology, and starts observability subsystems. At runtime:

- `DebateSyncManager.startDebate()` is the main entry point — it validates inputs, creates a session, runs opening statements, then enters a round loop
- Each argument feeds the `DebateGovernor` which maintains a claim graph internally
- After each round, governor stop conditions are checked (no novel claims, convergence plateau, all contradictions resolved)
- On stop, metrics and interpretation are computed, results are persisted, and the UI is updated via events
- `DebateEngine` is a separate, more formal engine that can be used programmatically — it has its own session lifecycle, budget tracking, and consensus engine
- `ConsistencyChecker.checkDocs()` validates doc references against the code manifest at any point; `ConsistencyChecker (implements IConsistencyHealingPipeline).analyze()` wraps detection + planning + debate dispatch for auto-healing
