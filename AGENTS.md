# SuperAgents OS — Agent Guide

## Project Overview

Autonomous, event-driven multi-agent runtime. v4.5.0 — 326 contracts, 810 services, 569 event-registry entries, 830 UI panels (актуальные счётчики: `node scripts/opencode/stats.mjs`).

## Workflow Convention

Когда пользователь пишет **«продолжать»** (continue):

0. **Сначала `/context`** — собрать контекст (git, последние сессии, контрольные точки) и начать осведомлённо
1. Найти следующую задачу (текущая задача / последняя контрольная точка в `docs/sessions/`)
2. Выполнить задачу
3. В конце сессии — `/checkpoint <название>` и закоммитить контрольную точку вместе с работой
4. Перейти к следующей задаче, пока пользователь не скажет стоп

## Memory Commands (OpenCode)

| Команда              | Назначение                                                                            |
| -------------------- | ------------------------------------------------------------------------------------- |
| `/context`           | Собрать контекст проекта: git + последние сессии + контрольные точки + wiki-подсказки |
| `/status`            | Свежий снимок состояния: ветка, грязные файлы, stash, незапушенное, последняя точка   |
| `/checkpoint <slug>` | Создать контрольную точку `docs/sessions/YYYY-MM-DD-<slug>.md` по шаблону             |
| `/sessions <запрос>` | Поиск по прошлым сессиям (`--dir`, `--open`, `--since`, `--limit`)                    |
| `/wiki <тема>`       | Поиск статей по `docs/manifest.json`                                                  |

Скрипты: `scripts/opencode/{session-index,context-build,project-state,checkpoint,session-search,wiki-find,stats}.mjs` (read-only, кроме checkpoint). Индекс `.superagents/memory/session-index.json` не попадает в промпт целиком — только короткая выжимка `context.md`.

## Wiki generation rule

При добавлении любого нового `.md`/`.json` файла в репозиторий (включая `.superagents/memory/`) — ОБЯЗАТЕЛЬНО перегенерировать вики-артефакты (иначе CI упадёт на «Wiki docs in sync»): `npm run gen:wiki-libraries && npm run gen:wiki-docs && npm run gen:wiki-manifest && npm run gen:wiki-connections && npm run gen:wiki-docs-health && npm run gen:docs-inventory && npm run gen:wiki-docs-standard && npm run gen:wiki-docs-index && npm run gen:wiki-system-map && npm run gen:wiki-history && npm run gen:wiki-capabilities && npm run gen:docs-graph && npm run gen:wiki-checks && npm run gen:wiki-coverage` и закоммитить изменения вместе с кодом.

## Key Principles

1. **Events First** — all communication through EventBus (`src/kernel/event-bus.ts`)
2. **No Globals in Kernel** — only DI constructor injection (`src/kernel/container.ts`)
3. **Dependency Rule** — UI → Application → Kernel → Infrastructure (kernel never imports UI)
4. **Contracts at Boundaries** — interfaces in `src/kernel/contracts/`, implementations in `src/kernel/services/`
5. **No circular deps** — services depend on contracts, not other services

## Architecture Layers

- `src/kernel/contracts/` — 326 interfaces + types
- `src/kernel/services/` — 810 implementations
- `src/kernel/events/` — event names + payloads (569 записей в registry)
- `src/kernel/state/` — state shapes (19 files)
- `src/llm/` — provider adapters + decorators
- `src/components/` — React UI (830 panels)
- `src/stores/` — Zustand stores (22 files)
- `docs/` — architecture docs (63 files, RU/EN)
- `docs/wiki/` — full system Wiki mirror (markdown, GitHub-readable; regenerate with `npm run gen:wiki-docs`); panel pages end with an auto «Связи с кодом» chain (panel → route → component → tests)
- `docs/manifest.json` — machine-readable wiki index (sections, articles with sources/tests/related, panels with route/component/article); regenerate with `npm run gen:wiki-manifest`; validate with `npm run docs:health`
- `src/generated/wiki-connections.ts` — panel → route → component → tests links per article (shown in the Wiki panel, mirrored in `docs/wiki`); regenerate with `npm run gen:wiki-connections`
- `docs/entity-model.json` — documentation standard (entity card fields, confidence statuses, sources of truth, language policy); source `scripts/lib/entity-model.mjs`, regenerate with `npm run gen:wiki-docs-standard`
- `docs/inventory.json` — machine-readable inventory of all `docs/**` markdown (path/category/language/title/size/hash); regenerate with `npm run gen:docs-inventory`
- `docs/wiki/docs-index.md` — documentation map: single entry point (wiki sections, top-level docs, reference/roadmap, archives); regenerate with `npm run gen:wiki-docs-index`
- `docs/wiki/dev-system-map.md` — system map: layers + agents/roles (role-library), debate strategies, provider pools (pools.ts); regenerate with `npm run gen:wiki-system-map`
- `docs/wiki/dev-history.md` — development history: zones, audits, decision/plan archive (from manifest + inventory); regenerate with `npm run gen:wiki-history`
- `docs/wiki/scenarios.md` — capabilities & scenarios: user areas from route registries, guides, diagram, limitations, diagnostics; regenerate with `npm run gen:wiki-capabilities`
- `docs/graph.json` — knowledge graph (nodes: articles/panels/code/tests; edges: related/source/test/documents) + `docs/wiki/dev-graph.md`; regenerate with `npm run gen:docs-graph`
- `docs/wiki/dev-checks.md` — checks & metrics: all objective checks + completeness report (coverage); regenerate with `npm run gen:wiki-checks`
- `scripts/gen-wiki-site.mjs` — builds the static wiki site (menu + search + mermaid) from `docs/wiki` into `wiki-site/`; CI publishes it at `/wiki/` on GitHub Pages (`npm run gen:wiki-site`, output is git-ignored)

## Code Rules

- **TypeScript** strict mode
- **No React/DOM** imports in kernel
- **No `any`** unless unavoidable (type with `as any` + comment)
- **Tests** next to source: `*.test.ts`
- Use `Result<T,E>` from `contracts/results.ts` for fallible operations
- All mutation methods accept optional `tx?: ITransaction`

## Commands

```bash
npm run dev                # dev server
npm run typecheck:fast     # fast typecheck (src/ only)
npm run typecheck          # full typecheck (project references, ~2min)
npm run build              # production build
npm run test               # vitest
npm run lint               # eslint
npm run check:circular-kernel  # circular deps check
```

## Browser & Computer Control (Playwright MCP)

- A Playwright MCP server is configured in `opencode.jsonc` (`mcp.playwright`).
- Use the `playwright_*` tools to control the browser: navigate, click, fill forms, take screenshots.
- Prefer `webfetch`/`websearch` for simple reads; use Playwright for interactive actions.
- Browser actions require approval (`permission.playwright_* = "ask"`) — confirm before destructive steps.
