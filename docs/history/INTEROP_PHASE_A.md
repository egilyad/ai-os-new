# Phase A — A2A + Gateway + Federation + паттерны (DONE, без проверок)

Дата: 2026-09-05. Проверки отложены на финал.

Аддитивный **Interop-слой** — MCPService, WorkforceFederation и роутер
не тронуты (исполнение остаётся у них, у нас — управление и политика).

## Что сделано

### A.1 A2A + Manifest 2.0 + Translation (Волна 6.1/6.3/6.5)
- `services/interop/a2a-service.ts` — advertise/discover/negotiate/handoff/
  reportError. Детерминированная политика: untrusted не auto-accept,
  остальные — по overlap capabilities↔task; транспорт loopback
  (`IInteropTransport` — точка для реального HTTP позже).
- `contracts/interop.ts` — `CapabilityManifest 2.0`: capabilities, costPerTask,
  latencyMsP50, trust, protocols, streaming, memoryPolicies (расширение
  Wave 1 Agent Card; `publishManifest/getManifest` в coordination).
- `services/interop/translation.ts` — чистые функции: `toEnvelope()`,
  `translateEnvelope()` (A2A↔MCP↔ACP↔webhook↔websocket↔internal, MCP→JSON-RPC,
  webhook→flatten), `a2aError()` (code/message/retryable).

### A.2 Gateway + Federation + Handoff (Волна 6.2/6.4/6.6)
- `gateway-service.ts` — единый вход/выход: `ingress()` нормализует любое
  сообщение в `GatewayEnvelope` + проекция в EventBus (`gateway:ingress`),
  `translate()` перекладывает под целевой протокол, `recent()` — ring-buffer 300.
- `federation-service.ts` — пиры (`addPeer/removePeer/heartbeat`),
  trust-gated dispatch (untrusted — отказ), `fleetView()` (пиры + union
  capabilities), loopback без транспорта.
- Handoff со сквозным traceId: `handoffExternal → completeHandoff(returned)`,
  события `handoff:dispatched/returned` (аудит-трейл из коробки).

### A.3 Паттерны Wave 7 (ключевые, first-class)
- Market/auction + contract-net: `openListing/bid/award`
  (auction — min price; contract-net — min price среди уложившихся в ask).
- Capability routing: score = capability-overlap − load − cost + trust
  (`route()` возвращает agentId+score+reason).
- Collaboration contracts: propose→accept→complete (parties/work/acceptance/
  budget/timeout), статус-машина с guard'ами.
- Dynamic topology: `adaptTeam()` (add/remove ролей живого crew через
  реальный CrewService) — Волна 7.8.
- Recursive teams: `spawnSubCrew()` (Forge propose→materialize) — self-similar.
- P2P mesh / supervisor pools / blackboard — выражаются готовыми
  graph-режимами Wave 3 (swarm/hierarchical) + Shared Context Wave 4;
  multi-protocol conversation — через gateway `translate()`.

### Wiring
- Dexie **v28** additive (6 таблиц), `InteropRepository` (DAL `interop`),
  `phase28-interop` (4 сервиса, делегаты к Crew/Forge — реальные),
  10 событий (`interop/gateway/fed/handoff/market/contract`),
  lazy-сервисы, `stores/interopStore.ts`.

## Отложено на финальную проверку
- typecheck/build/tests/lint по interop-срезу, e2e
  advertise→negotiate→handoff→gateway→fed→market→route→contract→store.

## Следующая — Фаза B
Волна 8 (мета-когнитивность) + Волна 9 (продвинутая память).
