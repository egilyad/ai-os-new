# SuperAgents OS — Architecture Rules

## Layering

```
┌─────────────────────────────────────────┐
│              UI Layer                    │
│  React components, Zustand stores       │
│  (imports services + contracts only)    │
└────────────────┬────────────────────────┘
                 │ EventBus
┌────────────────▼────────────────────────┐
│           Service Layer                 │
│  Business logic, orchestration          │
│  (imports kernel services + llm layer)  │
└────────────────┬────────────────────────┘
                 │ DI injection
┌────────────────▼────────────────────────┐
│           Kernel Layer                  │
│  SystemKernel, contracts, services      │
│  (no UI imports, no React/DOM)         │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│        Infrastructure Layer             │
│  LLM adapters, Web Workers, Dexie      │
└─────────────────────────────────────────┘
```

## Contract Boundaries
- Every cross-layer interaction goes through a contract interface (`I*`)
- Contracts define: methods, event payloads, state shapes
- Services depend on contracts, not concrete implementations
- New contract → new interface in `src/kernel/contracts/`

## Dependency Graph
See `src/kernel/DEPENDENCY_MAP.md` for full DI injection graph.

## Service Lifecycle
1. Constructor: DI injection only (no async, no event subscriptions)
2. `init()`: async setup, event subscriptions, DB loading
3. Runtime: event-driven message processing
4. `destroy()`: cleanup subscriptions, save state, clear timers
