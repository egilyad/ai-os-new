# Wave 5 — Governance, Tools, Observability, Mobile (DONE, без проверок)

Дата: 2026-09-05. Проверки отложены на финал.

Аддитивный **Ops-слой** — Budget/Timeline/Skills/MCP/Sandbox рантаймы
не тронуты (переиспользуются как исполнение, Ops владеет управлением).

## Что сделано

### 5.1 Иерархия + бюджеты + Audit Log
- `services/ops/hierarchy-service.ts` — дерево CEO→subordinates
  (create/tree/subordinates с BFS), `setBudget` (cap ≥ spent),
  `recordSpend` (отказ при превышении + audit `spend.denied`),
  `removeNode` (запрет при наличии подчинённых).
- `services/ops/audit-service.ts` — append-only hash-chain (FNV-1a,
  genesis `00000000`), `verify()` находит первую битую запись.
  Каждое governance-действие пишет в аудит. Событие `ops:audit`.

### 5.2 MCP + песочницы + Builder-execute + Skills
- `tool-governance-service.ts` — реестр MCP-серверов (name/url/tools/enabled),
  гранты `agentId → pattern` (`server:tool`, `server:*`, `*`), `check()`
  (deny wins, default-deny, выключенный сервер = deny). Исполнение остаётся в MCPService.
- `sandbox-broker-service.ts` — тикеты browser/computer:
  requested→approved→running→done (+denied/expired по TTL), E2B-handoff точка.
- `services/ops/builder-bridge.ts` — `executeBuilderManifest(graphs, manifest)`:
  визуальный Builder-граф → исполняемый State Graph (KIND_MAP:
  debate→council, synthesis→reflection, gate→gate…) → run.
- `skill-market-service.ts` — `publish/list/install/uninstall/exportManifest`
  (JSON `{kind:'skill-manifest'}`), всё с аудитом.

### 5.3 Мониторинг + Mobile
- `fleet-monitor-service.ts` — read-only проекция: подписка на
  crew/council/graph события, `watch/unwatch/snapshot` (counts по статусам)
  для дашбордов и телефона. Timeline остаётся в TimelineService.
- `mobile-access-service.ts` — pairing по 6-значному коду
  (pending→paired→revoked), inbox уведомлений с `actionRef`,
  **quick HITL с телефона**: `quickApprove/quickReject` (паузовые graph-раны),
  `quickVote` (council). Всё с аудитом.
- Mobile-friendly: все Ops-операции — мелкие JSON-методы + stores,
  пригодные для узких экранов (UI-панели — отдельный шаг после проверок).

### Wiring
- Dexie **v27** additive (9 таблиц), `OpsRepository` (DAL `ops`),
  `phase27-ops` (8 сервисов, общий audit), 6 событий `ops:*`,
  lazy-сервисы, `stores/opsStore.ts` (missions + unread notifications).

## Отложено на финальную проверку
- typecheck/build/tests/lint по ops-срезу, e2e
  hierarchy→spend→audit-verify→mcp-check→sandbox→skill→watch→pair→notify→quickApprove.

## Весь роадмап написан
Волны 1–5 в коде. Дальше по договорённости: **финальная проверка всего
вместе** (typecheck, build, tests) когда скажешь.
