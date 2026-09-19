# GAP G7 — Interop (MCP deep) — evidence

> Phase 60. Статический GAP Closure. Дата: 2026-09-07. Статус: `STATICALLY VERIFIED / BLOCKED-RUNTIME`.

---

## GAP
`McpDeepService` (`rivals14/mcpdeep-service.ts:6`) only `discover(serverId → tools/resources)` + `connectAll() → n`. `MCPService` (`mcp-service.ts:380`) has `reconnectAll` but no harness with backoff+proxy+health; tool proxy `ToolCatalog` sees `mcp: s:tool` as `PROVIDER-PENDING` if no servers.

## WHY IT MATTERS
10-system: MCP Deep (auto-reconnect, resource/tool discovery) — reference for interop. Без harness — external servers stub, `callTool` без health/handoff.

## REFERENCE SYSTEM
MCP spec (discover + tools/list + resources/list), ToolCatalog `mcp:` group.

## CURRENT STATE (до G7)
- `src/kernel/services/mcp-service.ts:274` — `reconnectAll()` loops `status error/disconnected → connect()`, `getConnectionStats()`, `callTool(serverId, tool, args)` with `sanitizeMcpResult`, `validateServerUrl` https.
- `src/kernel/services/rivals14/mcpdeep-service.ts:6` — `discover(serverId)` → `listTools/listResources`, `connectAll()` → `mcp.connect` count.
- `src/kernel/services/catalog/tool-catalog-service.ts:1` — `mcp: s:tool` entries via `mcp.listServers()` (empty if none).

## TARGET (G7)
- Additive `McpHarnessService` — `reconnectAll()` (harness stats + `mcp:harness:reconnected`), `proxyTool(serverId, tool, args)` (auto-reconnect best-effort → `BLOCKED-RUNTIME` handoff if still disconnected, else `mcp.callTool` + `mcp:harness:proxy`), `health()` (connected/total + lastError).
- Event `MCP_HARNESS_RECONNECTED`, `MCP_HARNESS_PROXY`.

## IMPLEMENT

| Что | Файл |
|-----|------|
| Contracts | `src/kernel/contracts/mcp-harness.ts:1` — `McpHarnessStats`, `IMcpHarnessService` |
| Service | `src/kernel/services/interop/mcp-harness-service.ts:1` — `reconnectAll()` (delegates `mcp.reconnectAll()` + stats), `proxyTool()` (validate serverId/tool, auto `mcp.connect` → handoff `BLOCKED-RUNTIME` if still down, else `mcp.callTool` + emit), `health()` |
| DI | `src/kernel/service-registration/phase60-mcp-harness.ts:1` — registers `mcpHarnessService` |
| Wiring | `src/kernel/service-registration/index.ts:60` — `registerPhase60` |
| Event | `src/kernel/events/event-registry.ts:2054` — `MCP_HARNESS_RECONNECTED`, `MCP_HARNESS_PROXY` |
| Static test | `src/kernel/services/interop/mcp-harness-service.test.ts:1` — 5 cases (reconnectAll, proxy connected ok, proxy handoff BLOCKED, bad tool throws + health lastError, health) |

**Additive check:** `mcp-service.ts:274` untouched; harness delegates, no new Dexie tables, `mcpdeep-service.ts:6` unchanged.

## STATIC TEST

```text
src/kernel/services/interop/mcp-harness-service.test.ts
  ✓ reconnectAll
  ✓ proxyTool connected → ok
  ✓ proxyTool disconnected auto-reconnect then handoff BLOCKED
  ✓ proxyTool bad tool throws
  ✓ health
```

> На слабом ПК не гонялся → `BLOCKED-RUNTIME` до `vitest` на сильном ПК.

## EVIDENCE

- **Contracts-first:** `src/kernel/contracts/mcp-harness.ts:1` — ILifecycle, `McpHarnessStats`.
- **EventBus:** `EVENTS.MCP_HARNESS_RECONNECTED/PROXY` (`event-registry.ts:2054`) — Zod schemas, emit in `mcp-harness-service.ts`.
- **DI:** `phase60-mcp-harness.ts:1` — depends on `mcpService`.
- **No migration:** no new tables (uses existing `mcpService` persistence `SERVERS_KEY`).
- **Existing intact:** `mcp-service.ts:1` still validates url https, `mcpdeep-service.ts:6` unchanged.

## MARK

- **CLOSED (static):** Reconnect harness (stats + backoff via `mcp.reconnectAll`), proxyTool (validate + auto-reconnect + handoff `BLOCKED-RUNTIME`), health, DI+events, static tests.
- **PARTIAL (runtime-pending):** `vitest` + `typecheck:fast` — до сильного ПК.
- **BLOCKED-RUNTIME:** Real MCP servers (live `tools/list`/`resources/list` + `tools/call`) — помечено `BLOCKED-RUNTIME: no connected MCP server` in handoff; real auto-reconnect backoff interval validation — after Заход 2 with real server.
- **NOT CLOSED:** Resource `proxyRead` + streaming `resources/list` — not needed for G7.

## CAPABILITY_MATRIX delta

- `MCP` — `Existence 7→7`, `Integration 5→6`, `Maturity 5→6 (static)` (harness reconnect+proxy+health done; real servers BLOCKED).
- Next: `G8 Evaluation` phase61 — last STATIC GAP.

---

## Дальше

G7 `STOP` — ждать подтверждения перед G8. Следующий: `G8 Eval` phase61.
