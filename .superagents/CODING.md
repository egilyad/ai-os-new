# SuperAgents OS — Coding Style

## TypeScript

- Strict mode enabled
- `verbatimModuleSyntax` — use `import type` for type-only imports
- NO `any` — use `as any` + comment if unavoidable
- Prefer `Result<T, E>` from `contracts/results.ts` for fallible ops

## Naming

- `I*` for interfaces: `IProviderAdapter`, `IKeyVault`
- PascalCase for classes, camelCase for instances
- kebab-case for files: `key-vault.ts`, `event-bus.ts`

## Architecture Constraints

- NO React/DOM imports in `src/kernel/`
- NO global singletons in kernel — only DI constructor injection
- NO circular dependencies — services import contracts, not other services
- `src/kernel/workers/` contains only Web Workers (`memory.worker.ts`, `sandbox.worker.ts`). All business logic lives in `src/kernel/services/`.
- Async init() NEVER in constructor — always in separate async method

## Patterns

- New service: `contract → state → service → bootstrap → legacy wrapper`
- Kernel services: put `setupListeners()` in `init()`, NOT constructor
- Legacy wrapper constructors: call `this.init().catch(() => {})` for backward compat

## Testing

- Tests next to source: `*.test.ts`
- Kernel services: full unit tests with mocked deps
- Component tests: Vitest + React Testing Library + HiveContext
