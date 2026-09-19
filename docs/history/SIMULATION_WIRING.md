# SIMULATION WIRING — Stub→AgentFactory (без LLM)

> Дата: 2026-09-07. Phase64 adapter, wiring `World → Engine → Adapter → World → Timeline → Panel`. Статус: `STATICALLY VERIFIED / PROVIDER-PENDING` (real LLM → Заход 2).

---

## Цепочка (замкнута)

```
WorldState (keyValue sim:world:<id>, 1000×1000, phase62)
  ↓
SimulationEngine (Promise.all parallel per tick, phase63)
  ↓ setActPort(adapter) / resolveActPort lazy
AgentActAdapter (IAgentActPort via IAgentFactory, phase64)
  ↓ AgentFactory.get → execute(task world tick) → parseAct(move/talk/custom) → stub fallback
WorldState.moveAgent + tick
  ↓ sim:tick / sim:completed (event-registry)
ExecutionViz / Timeline (60 map → overlay)
  ↓
SimulationPanel (SVG 1000×1000 + кружки + связи + log)
```

## Wiring (без второго runtime)

- **Engine DI:** `simulation-engine-service.ts:35` — `setActPort(port)` + `resolveActPort()` lazy `agentActAdapterService` → `StubActPort` fallback. `deps.actPort` optional, `init` не требует LLM.
- **Panel create:** `SimulationPanel.tsx:createWorld` — `try AgentFactory.create ×6` (Lisa Carter analyst / Oscar Weber architect / Mara Singh founder / Ken Tanaka engineer / Sofia Alvarez designer / David Kim judge; `roleId` + `personaId` optional) → `createdIds` if `≥2` else `agent-1..6` stub → `lazyService('agentActAdapterService') → engine.setActPort(adapter)` → `worldState.create({rooms 3, agentIds})`.
- **Phase order:** `phase62-world-state` → `phase63-simulation-engine` → `phase64-agent-adapter` (64 фазы, `index.ts:64`). Adapter additive — engine не знает LLM.

## Demo seed

- 6 SuperAgents: `AgentDefinition` (`name`, `roleId`, `personaId?`, `skillIds:[]`, `toolIds:[]`) — через `AgentFactory` (5 bindings `Role→Persona→Skill→Tool→Model`), fallback stub ids если роль/persona отсутствует.
- Rooms: `Main Hall 50,50,450,400 + Lab 550,50,400,400 + Garden 50,500,900,400` (0..1000 like `ComputerService`).

## PROVIDER-PENDING честно

- `AgentActAdapter` → `agentFactory.execute` без LLM вернёт `handoff/echo` → `parseAct` → `via: stub-fallback` (в `meta` и `logs`), не маскируется под real LLM. Real `LLM Bridge 23 providers + cacheScope` → after Заход 2.
