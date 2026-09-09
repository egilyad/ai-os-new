# GAP G2 — Tool Catalog (unified) — evidence

> Phase 55. Статический GAP Closure. Дата: 2026-09-07. Статус: `STATICALLY VERIFIED / BLOCKED-RUNTIME`.

---

## GAP
Tool catalog размазан: `ToolRunnerService` (11 tools, `listTools()`, executor) + `SkillMarketService` (platform skills `yadisk.read`/`wb.price` etc) + MCP tools — нет единого `list/search/install`. CrewAI 100+ tools vs 11 — maturity gap.

## WHY IT MATTERS
10-system comparison: CrewAI/Mastra имеют unified tool catalog; пользователь SuperAgents видит сотни сервисов, но не видит единого места `что есть → установить → использовать`.

## REFERENCE SYSTEM
CrewAI Tools (100+), Mastra Tools catalog, LangChain `@tool`.

## CURRENT STATE (до G2)
- `src/kernel/services/parity/tool-runner-service.ts:121` — executor + `listTools()` + `addTool()`
- `src/kernel/services/ops/skill-market-service.ts:1` — `publish/list/install/uninstall` (Dexie `skillManifests`)
- `src/kernel/services/mcp-service.ts` — MCP bridge (listServers, `PROVIDER-PENDING` if no servers)
- Нет единого `search` / `groups` / `install` по имени.

## TARGET (G2)
- Additive `ToolCatalogService` — `ToolRunner ∪ SkillMarket ∪ MCP` → `list/search/get/groups/install/uninstall`
- Контракты: `CatalogGroup` (`core/workspace/knowledge/mcp/platform/external`), `ToolCatalogEntry` (source, installed, manifestId)
- Группировка: `workspace.*`→workspace, `knowledge.*`→knowledge, `mcp.*`→mcp, `http.fetch/math.calc/time.now`→core, `skill:`→platform
- DI: `phase55-tool-catalog` → `toolCatalogService`
- События: `catalog:updated`

## IMPLEMENT

| Что | Файл |
|-----|------|
| Contracts | `src/kernel/contracts/tool-catalog.ts:1` — `CatalogGroup`, `ToolCatalogEntry`, `IToolCatalogService` |
| Service | `src/kernel/services/catalog/tool-catalog-service.ts:1` — `list()` (runner ∪ skill ∪ mcp dedupe/sort), `search()` case-insensitive, `get/install/uninstall/groups`, `groupFor()`/`displayName()`, best-effort `catalog:updated` emit |
| DI | `src/kernel/service-registration/phase55-tool-catalog.ts:1` — registers `toolCatalogService` (graceful if skillMarket/mcp absent) |
| Wiring | `src/kernel/service-registration/index.ts:54` — `registerPhase55` |
| Event | `src/kernel/events/event-registry.ts:1892` — `CATALOG_UPDATED` |
| Static test | `src/kernel/services/catalog/tool-catalog-service.test.ts:1` — 4 cases (unified list+groups, search/get, install/uninstall, fallback) |

**Additive check:** `ToolRunnerService` untouched — catalog только discovery; `SkillMarket.install/uninstall` делегированы, core tools `install` — noop.

## STATIC TEST

```text
src/kernel/services/catalog/tool-catalog-service.test.ts
  ✓ list = runner ∪ platform ∪ mcp, groups
  ✓ search by name/description, get
  ✓ install/uninstall platform skill delegates to SkillMarket
  ✓ fallback: no skillMarket/mcp → runner only
```

> На слабом ПК не гонялся → `BLOCKED-RUNTIME` до `vitest` на сильном ПК, статически импорты резолвятся.

## EVIDENCE

- **Contracts-first:** `src/kernel/contracts/tool-catalog.ts:1` — ILifecycle, `groups()` для UI.
- **EventBus:** `EVENTS.CATALOG_UPDATED` (`event-registry.ts:1892`) — Zod schema, emit в `tool-catalog-service.ts`.
- **DI:** `phase55-tool-catalog.ts:1` — lazy, optional `skillMarket`/`mcp` (degrades gracefully).
- **No migration:** Dexie unchanged (uses existing `skillManifests`).
- **No exec change:** `tool-runner-service.ts:121` unchanged.

## MARK

- **CLOSED (static):** Unified catalog `list/search/get/groups/install/uninstall`, group mapping, SkillMarket bridge, MCP `PROVIDER-PENDING` placeholder, DI+event, static tests.
- **PARTIAL (runtime-pending):** `vitest run tool-catalog-service.test.ts` + `typecheck:fast` — до сильного ПК.
- **BLOCKED-RUNTIME:** MCP real servers (listServers with live connection) — помечено `PROVIDER-PENDING` (no live servers in test); SkillMarket real Dexie persistence eval — после Захода 2.
- **NOT CLOSED:** `ToolRunner.addTool` external packs auto-registration into catalog — уже covered (catalog reads `listTools()` live).

## CAPABILITY_MATRIX delta

- `Tools` — `Existence 9` stays, `Maturity 7 → 8 (static)` (unified discovery), `Integration 8 → 8` (catalog over runner).
- Next: `G3 Studio traces`.

---

## Дальше

G2 `STOP` — ждать подтверждения перед G3. Следующий: `G3 ExecutionViz / Timeline traces`.
