# SuperAgents OS — Core Rules

## Golden Rules

1. **No `any`** — unless absolutely unavoidable (add `as any` + comment why)
2. **No globals in kernel** — DI injection only (`src/kernel/container.ts`)
3. **Events first** — all cross-service communication via EventBus
4. **Contracts at boundaries** — interfaces in `contracts/`, implementations in `services/`
5. **No legacy wrappers** — `src/kernel/workers/` contains only Web Workers. All business logic in `src/kernel/services/`

## File structure rules

- kebab-case for files (`key-vault.ts`)
- PascalCase for classes and interfaces (`IProviderAdapter`)
- camelCase for instances and functions
- Tests next to source: `Component.test.ts`

## Dependency rules

- Kernel never imports UI (React/DOM)
- Services never import other services directly — use events
- No circular dependencies
