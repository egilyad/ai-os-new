# Kernel Dependency Map

## v4.5.0 Dependency Map

## DI Injection Graph

Every kernel service receives its dependencies via `constructor(deps)`.
Below is the full dependency graph (A → B means "A depends on B").

### Core Infrastructure

```
Container         → (no deps, standalone)
EventBus          → (no deps, standalone)
DatabaseService   → (no deps, standalone — wraps Dexie)
SecurityService   → (no deps, standalone — wraps WebCrypto)
```

### Kernel State Machine

```
SystemKernel → IEventBus, IDatabaseService
```

### Runtime Lifecycle

```
RuntimeManager → SystemBootstrap
SystemBootstrap → IContainer, IEventBus
```

### Services

```
KeyService (key-vault.ts)
  → IEventBus          (eventBus)
  → ISecurityService   (securityService)
  → IPricingService    (pricingService)
  → IDatabaseService   (database)

RouterService (provider-router.ts)
  → IKernel            (kernel.getState, setBaseWeights)
  → IKeyService        (keyService.getKeys, getPoolKeys, selectFromPool, canUseKey)
  → IPricingService    (pricingService.getBudgetInfo, getPricingForModel)
  → IEventBus          (eventBus)
  → IBudgetService     (budgetService.canUseProvider)
  → IPolicyService     (policyService.checkAgentPolicy)
  → IDatabaseService   (database.getKv, setKv)

MCPService (mcp-service.ts)
  → IEventBus          (eventBus.emit)
  → IDatabaseService   (database.getKv, setKv)

ToolService (tool-executor.ts)
  → IEventBus          (eventBus.emit)
  → IDatabaseService   (database.getKv, setKv)
  → IMemoryService     (memoryService)        [optional]
  → ISandboxService    (sandboxService)       [optional]
  → IPluginRegistry    (pluginRegistry)       [optional]
  → IMCPService        (mcpService)           [optional]

MemoryService (memory-engine.ts)
  → IEventBus          (eventBus.on, emit)
  → IDatabaseService   (database.db.memories.*)

PricingService (pricing-service.ts)
  → IEventBus          (eventBus.emit)
  → IDatabaseService   (database.getKv, setKv)

BudgetService (budget-service.ts)
  → IEventBus          (eventBus.on, emit)
  → IDatabaseService   (database.getKv, setKv)
  → ICostCalculator    (costCalculator)

UsageTracker (usage-tracker.ts)
  → IDatabaseService   (database.getKv, setKv)

ProviderTracker (provider-tracker.ts)
  → ICostCalculator    (costCalculator)         [optional]

RotationService (rotation-service.ts)
  → IEventBus          (eventBus)
  → IKeyRotationManager (keyRotationManager)
  → IDatabaseService   (database)

SystemKernel (kernel.ts)
  → IEventBus          (eventBus)
  → IDatabaseService   (database)
  → IProviderTracker   (providerTracker)        [optional]
  → ICostCalculator    (costCalculator)         [optional]

DebateSyncManager (debate-runtime/debate-sync-manager.ts)
  → IDatabaseService   (database.getKv, setKv)
  → IProviderAdapterRegistry (adapterRegistry.getAdapter, resetCircuitBreaker)
  → IKeyService        (keyService.getKeys, getActiveKeys, recordUsage)
  → IRouterService     (routerService.getDebateProviders, getRankedProviders)
  → IEventBus          (eventBus.emit)
  → IWorkspaceService  (workspaceService.isAttached, getFileTreeSnapshot)

KeyStateStore (key-state-store.ts)
  → IEventBus          (eventBus.on, emit)
  → IDatabaseService   (database.getKv, setKv)
  → IKeyService        (keyService)             [optional]

config-mutations.ts
  → IEventBus          (eventBus)
  → IDatabaseService   (database.getKv, setKv)
  → ILogger            (logger)                 [optional]

LoggerService (logger-service.ts)
  → IEventBus          (eventBus)
  → IDatabaseService   (database.getKv, setKv)

ConfigService (config-service.ts)
  → IEventBus          (eventBus)
  → IDatabaseService   (database.getKv, setKv)

ConfigRegistry (config-registry.ts)
  → (no deps, standalone — reads CONST from config)

CacheService (cache-service.ts)
  → IEventBus          (eventBus)
  → IDatabaseService   (database.getKv, setKv)

HealthSlaService (health-sla-service.ts)
  → IEventBus          (eventBus)
  → IKeyService        (keyService.getKeys)
  → IDatabaseService   (database.getKv, setKv)
  → IKeyStateStore     (keyStateStore.ingestProbe)

ExternalSecretsService (external-secrets-service.ts)
  → IEventBus          (eventBus)
  → IDatabaseService   (database)

CompromiseWebhookService (compromise-webhook-service.ts)
  → IEventBus          (eventBus)
  → IDatabaseService   (database)

NotificationWebhookService (notification-webhook-service.ts)
  → IEventBus          (eventBus)
  → IDatabaseService   (database)

ConsistencyChecker (consistency-checker.ts)
  → (standalone — reads code manifest)

ConsistencyChecker (consistency-checker.ts)
  → IConsistencyChecker (checker.checkDocs)

### Full Dependency Graph (textual)

```

                    ┌──────────────┐
                    │   Container  │
                    └──────────────┘

                    ┌──────────────┐
                    │   EventBus   │◄──────────────────────────────┐
                    └──────────────┘                               │
                         ▲                                         │
                         │                                         │
                     ┌────┴─────┐                          ┌────────┴────────┐
                     │  Kernel  │                          │  SystemBootstrap│
                     └──────────┘                          └─────────────────┘
                          ▲                                      │
                          │                               DI wires services
                ┌─────────┼──────────┐                           │
                │         │          │                     ┌──────┴──────┐
           ┌────┴───┐ ┌───┴────┐ ┌───┴───────┐             │ RuntimeMgr  │
           │Router  │ │Memory  │ │Tool       │             └─────────────┘
           └───┬────┘ └───┬────┘ └───┬───────┘
               │          │          │
               │    ┌─────┴─────┐    │
               │    │KeyService │    │
               │    └─────┬─────┘    │
               │          │          │
          ┌────┴──────────┴──────────┴────┐
          │   RotationService            │
          │   (key-rotation.ts)          │
          └───────────┬──────────────────┘
                      │
          ┌───────────┴──────────────────┐
          │        MCP Service           │
          └──────────────────────────────┘

Legend:
→ = constructor injection (required deps)
─ ─ = optional injection

```

### Migration Status

> Миграция из `src/core/` и `src/services/` завершена. Все сервисы зарегистрированы в DI через phased bootstrap. Старые пути (src/core/*, src/services/*) не существуют — сохранены ниже только для истории. Актуальные пути везде в `src/kernel/`.

| Service | Old Location (historical) | Kernel Location | DI Converted |
|---------|--------------------------|-----------------|-------------|
| EventBus | `src/core/events.ts` | `src/kernel/events/event-bus.ts` | ✅ |
| Container | `src/core/Container.ts` | `src/kernel/container.ts` | ✅ |
| Database | `src/core/DatabaseService.ts` | `src/kernel/services/database-service.ts` | ✅ |
| Security | `src/core/SecurityService.ts` | `src/kernel/security.ts` | ✅ |
| Kernel | `src/core/Kernel.ts` | `src/kernel/kernel.ts` | ✅ |
| Runtime | `src/core/runtime.ts` | `src/kernel/runtime.ts` | ✅ |
| Bootstrap | `src/core/Bootstrap.ts` | `src/kernel/bootstrap.ts` | ✅ |
| KeyService | `src/services/KeyService.ts` | `src/kernel/services/key-management/key-service.ts` | ✅ |
| RouterService | `src/services/RouterService.ts` | `src/kernel/services/provider-router.ts` | ✅ |
| MCPService | `src/services/MCPService.ts` | `src/kernel/services/mcp-service.ts` | ✅ |
| ToolService | `src/services/ToolService.ts` | `src/kernel/services/tool-executor.ts` | ✅ |
| MemoryService | `src/services/MemoryService.ts` | `src/kernel/services/memory-engine.ts` | ✅ |
| CacheService | `src/services/CacheService.ts` | `src/kernel/services/cache-service.ts` | ✅ |
| SnapshotService | `src/services/SnapshotService.ts` | `src/kernel/services/snapshot-service.ts` | ✅ |
| AdminService | `src/services/AdminService.ts` | `src/kernel/services/admin-service.ts` | ✅ |
| AdvisorService | `src/services/AdvisorService.ts` | `src/kernel/services/advisor-service.ts` | ✅ |
| ProviderTracker | `src/core/ProviderTracker.ts` | `src/kernel/services/provider-tracker.ts` | ✅ |
| PricingService | `src/services/PricingService.ts` | `src/kernel/services/pricing-service.ts` | ✅ |
| BudgetService | `src/services/BudgetService.ts` | `src/kernel/services/budget-service.ts` | ✅ |
| UsageTracker | — (new) | `src/kernel/services/usage-tracker.ts` | ✅ |
| RotationService | `src/services/rotation/RotationService.ts` | `src/kernel/services/rotation-service.ts` | ✅ |
| VirtualKeyService | — (new) | `src/kernel/services/virtual-key-service.ts` | ✅ |
| LLMClientService | — (new) | `src/kernel/services/llm-client-service.ts` | ✅ |
| ExternalSecretsService | — (new) | `src/kernel/services/external-secrets-service.ts` | ✅ |
| CompromiseWebhookService | — (new) | `src/kernel/services/compromise-webhook-service.ts` | ✅ |
| NotificationWebhookService | — (new) | `src/kernel/services/notification-webhook-service.ts` | ✅ |
```
