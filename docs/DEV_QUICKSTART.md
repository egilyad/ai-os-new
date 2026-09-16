# SuperAgents OS — Developer Quickstart

## Prerequisites

- Node.js >= 22
- npm

## Setup

```bash
npm install
npm run dev          # start dev server (Vite)
```

## Commands

| Command                         | Description                          |
| ------------------------------- | ------------------------------------ |
| `npm run dev`                   | Dev server with HMR                  |
| `npm run typecheck:fast`        | Quick typecheck (`src/` only, ~2min) |
| `npm run typecheck`             | Full typecheck (project references)  |
| `npm run build`                 | Production build                     |
| `npm run test`                  | Run all unit tests (Vitest)          |
| `npm run test -- --ui`          | Test UI dashboard                    |
| `npm run test:e2e`              | E2E tests (Playwright)               |
| `npm run lint`                  | ESLint check                         |
| `npm run check:circular-kernel` | Circular dependency check            |

## Project Structure

```
src/
  kernel/
    contracts/       # 162 interfaces + types (I* naming)
    services/        # 346 implementations
    events/          # Event names + payloads
    state/           # State shapes (19 files)
    service-registration/  # DI wiring (12 phases)
    instances.ts     # Runtime singleton exports
  llm/               # 12 provider adapters
  components/        # React UI (75+ panels)
  stores/            # Zustand stores
docs/                # Architecture docs (RU/EN)
```

## Architecture Layers

```
UI (React components/stores)
  ↓ depends on
Application (services/instances)
  ↓ depends on
Kernel (DI container, contracts, events, state)
  ↓ depends on
Infrastructure (LLM adapters, storage, workers)
```

**Rule:** Kernel never imports UI. Services depend on contracts, not other services.

## Adding a New Service

1. **Contract** — define interface in `src/kernel/contracts/`, re-export from `index.ts`
2. **State** — if needed, add types to `src/kernel/state/`
3. **Service** — implement in `src/kernel/services/<category>/`
4. **DI** — register in appropriate `phase*.ts` file in `service-registration/`
5. **Test** — collocate `*.test.ts` next to source

## Adding a New LLM Provider

1. Create adapter in `src/llm/<provider>/`
2. Implement `IProviderAdapter` contract
3. Register in `src/llm/registry/`

## Testing Patterns

- **Co-located tests**: `service.ts` → `service.test.ts`
- **DI pattern**: `makeDeps()` factory with `vi.fn()` mocks
- **Integration**: use `container.override()` to swap implementations
- **Async**: `await` async methods, use `vi.useFakeTimers()` for time-dependent tests
- **Run single file**: `npx vitest run path/to/file.test.ts`

## Key DI Concepts

```typescript
// Register instance
container.register('serviceName', instance);

// Register lazy singleton
container.registerFactory('serviceName', (c) => new Service(c.get('dep')));

// Register transient (new instance per get)
container.registerTransient('serviceName', () => new Service());

// Override for testing
container.override('serviceName', () => new MockService());
```
