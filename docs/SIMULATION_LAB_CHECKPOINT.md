# SIMULATION LAB — CHECKPOINT (STATICALLY VERIFIED)

> Дата: 2026-09-07. Scope: `New World → Step → 5 ticks → Reset`. Статус: `STATICALLY VERIFIED / BLOCKED-RUNTIME` (real LLM → after Заход 2). Copy-safe checkpoint после G8 + TinyTroupe audit.

---

## 1) Цепочка (скелет)

```
WorldState (rooms 1000×1000 + relations + clock)
  ↓ keyValue sim:world:<id>
SimulationEngine (parallel Promise.all per tick)
  ↓ StubActPort (hash(aid:tick) → move/talk/idle, PROVIDER-PENDING)
WorldState.moveAgent + tick
  ↓ EventBus sim:tick / sim:completed
ExecutionViz / Timeline (TIMELINE_MAP 60 → overlay)
  ↓
SimulationPanel (SVG 1000×1000 + кружки-агенты + связи + log)
```

---

## 2) Файлы (62→63 + panel)

| Слой | Файл | Строки |
|------|------|--------|
| Contracts | `src/kernel/contracts/simulation-world.ts:1` | `WorldRoom (0..1000)`, `WorldRelation`, `SimulationWorld`, `IWorldStateService` |
| WorldState | `src/kernel/services/simulation/world-state-service.ts:1` | `PREFIX sim:world:`, `INDEX sim:world:index`, `create` validate 0..1000 round-robin, `moveAgent`, `tick` + `SIM_TICK` emit, no Dexie migration |
| Engine Contracts | `src/kernel/contracts/simulation-engine.ts:1` | `AgentAct (idle/move/talk/custom)`, `IAgentActPort`, `ISimulationEngineService (run/step/status)` |
| Engine | `src/kernel/services/simulation/simulation-engine-service.ts:1` | `StubActPort` deterministic, `step: Promise.all(agentIds→act)` → sequential `moveAgent` → `tick`, `run(ticks) → sim:completed`, `running Set` guard |
| Events | `src/kernel/events/event-registry.ts:2269` | `SIM_WORLD_CREATED`, `SIM_TICK`, `SIM_COMPLETED` |
| DI | `src/kernel/service-registration/phase62-world-state.ts:1`, `phase63-simulation-engine.ts:1`, `index.ts:62` | 63 фазы |
| Panel | `src/components/SimulationPanel/SimulationPanel.tsx:1` | `SVG 0 0 1000 1000`, rooms `rect`, relations `line`, agents `circle hsl(hash)`, `+ New World (6 agents)` 3 комнаты, `▶ SIMULATE N / STEP 1 / RESET` |
| Tests | `src/kernel/services/simulation/world-state-service.test.ts:1`, `simulation-engine-service.test.ts:1` | 2+2 cases — не гонялись (`BLOCKED-RUNTIME` до vitest) |

---

## 3) Цикл `New World → Step → 5 ticks → Reset` (статически)

```text
1. New World: WorldState.create({name, rooms:[Main Hall 50,50,450,400 + Lab + Garden], agentIds:6})
   → setKv sim:world:<id> + index → emit sim:world:created
2. Step: SimulationEngine.step(worldId)
   → worldState.get → Promise.all(agents→StubActPort.act) parallel
   → moveAgent for action=move → tick → sim:tick
   → return {world, acts:6}
3. 5 ticks: SimulationEngine.run(worldId,5) → loop step×5 → sim:completed
   → globalClock 0→1 (step) → +5 → 6 (если run после step) ; иначе 0→5
4. Reset: WorldState.remove(worldId) → delete sim:world:<id> + index
5. Viz: SimulationPanel SVG + log `step N: a1:move, a2:talk …` (ExecutionViz sim:tick)
```

---

## 4) Static evidence

- **Contracts-first:** `simulation-world.ts:1`, `simulation-engine.ts:1` — ILifecycle, coords 0..1000 like `ComputerService`.
- **EventBus:** `SIM_TICK`/`SIM_COMPLETED` Zod schemas, emit in `world-state-service.ts` + `simulation-engine-service.ts`.
- **DI:** `phase62/63` lazy, additive, no Dexie migration (keyValue — как G4/G5).
- **Tests (не гонялись, честно BLOCKED):**

```text
world-state-service.test.ts
  ✓ create → get → tick → moveAgent → list → remove
  ✓ validate coords 0..1000

simulation-engine-service.test.ts
  ✓ step parallel + run 3 ticks → clock 4 + sim:completed + status
  ✓ custom actPort injected (talk)
```

---

## 5) Что CLOSED / BLOCKED

- **CLOSED (static):** World State (rooms/relations/clock, validate, move, tick), Simulation Engine (parallel stubs, run/step/status, sim:completed), Panel minimal (SVG 1000×1000, controls, log), DI+events+tests.
- **BLOCKED-RUNTIME:** `vitest` + `typecheck:fast` — до сильного ПК; real tick proof on Dexie keyValue.
- **PROVIDER-PENDING:** `StubActPort → AgentFactory.execute → LLM Bridge → CogMemory` adapter — next micro-step (phase64 adapter, no LLM), затем real LLM.
- **NOT CLOSED:** `SimulationPanel` real agents (Persona/Goals/Memory) → adapter; `Profiler` demographics.

---

## 6) Дальше (по очереди, без спешки)

```
CHECKPOINT ✅ (этот файл)
  ↓
StubActPort → AgentFactory adapter (1 file, DI swap, no LLM) — phase64
  ↓
Real LLM agents (LLM Bridge, CogMemory episodic, cost stats)
```

С богом — 6 кружочков готовы бегать, скелет честно оставлен на stub до Захода 2.
