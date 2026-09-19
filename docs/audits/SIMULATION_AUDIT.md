# SIMULATION LAB — STATIC AUDIT (8 пунктов)

> Дата: 2026-09-07. Scope: WorldState(62) + Engine(63) + Adapter(64) + Panel. Статус: `STATICALLY VERIFIED / PROVIDER-PENDING`.

---

## 1) Нет второго параллельного Agent runtime

- **Check:** `SimulationEngine` не создаёт свой `AgentFactory`/`CapabilityResolver`; использует единственный `worldStateService` + `IAgentActPort` (stub или adapter). Нет дубликата `AgentService`/`CrewService` внутри simulation.
- **Evidence:** `src/kernel/services/simulation/simulation-engine-service.ts:38` — только `worldState + events + actPort`; `phase62/63/64` — 3 фазы, без новых agent runtime.
- **Verdict:** ✅ PASS — Simulation ≠ отдельная система агентов.

## 2) Все агенты проходят через AgentFactory

- **Check:** `AgentActAdapterService` (`phase64`) — `agentFactory.get(agentId) → execute(prompt world tick) → parseAct`; stub только fallback если `get==null` или `execute throws`.
- **Evidence:** `src/kernel/services/simulation/agent-act-adapter-service.ts:14` — `get` check, `execute` try/catch → `stubAct`; `SimulationPanel.createWorld` → `agentFactory.create ×6` before `worldState.create`.
- **Verdict:** ✅ PASS — единственный вход через `AgentFactory` (5 bindings), simulation не плодит `TinyPerson`.

## 3) WorldState остаётся SSOT

- **Check:** Только `WorldStateService` пишет `sim:world:<id>` (keyValue) и `sim:world:index`; Engine только `get/tick/moveAgent` через него, не хранит копию state.
- **Evidence:** `src/kernel/services/simulation/world-state-service.ts:1` — `PREFIX/INDEX`, `moveAgent` единственное место мутации agents→rooms; Engine `step` вызывает `worldState.moveAgent` sequential после parallel `act`.
- **Verdict:** ✅ PASS — SSOT `WorldStateService`, no fork.

## 4) SimulationEngine не знает деталей LLM

- **Check:** Engine знает только `IAgentActPort.act → AgentAct`; не импортирует `ILLMClientService`, `IEmbeddingPort`, `AgentFactory` напрямую.
- **Evidence:** `src/kernel/contracts/simulation-engine.ts:10` — `IAgentActPort`; `simulation-engine-service.ts:1` — no `llm` import, only `IWorldStateService + IEventBus + IAgentActPort`.
- **Verdict:** ✅ PASS — LLM детали за Adapter.

## 5) Adapter является единственной границей

- **Check:** Единственное место где `IAgentFactory` → `AgentAct` — `AgentActAdapterService`; Engine `setActPort(adapter)` — одна точка swap `Stub ↔ Adapter`.
- **Evidence:** `src/kernel/services/simulation/agent-act-adapter-service.ts:1` — single `parseAct` + `stubAct` fallback; `phase64-agent-adapter.ts:1` — registers `agentActAdapterService`; `simulation-engine-service.ts:35` — `setActPort` + lazy `resolveActPort`.
- **Verdict:** ✅ PASS — одна граница, легко `PROVIDER-PENDING` → real LLM.

## 6) Timeline получает события

- **Check:** `WorldState.tick` emits `sim:tick`, `SimulationEngine.run` emits `sim:completed`; Timeline/ExecutionViz подписаны via `TIMELINE_MAP` 60.
- **Evidence:** `src/kernel/services/simulation/world-state-service.ts:tick` + `simulation-engine-service.ts:run` → `EVENTS.SIM_TICK/SIM_COMPLETED`; `src/kernel/services/timeline/timeline-map.ts:1` includes `sim:world:created` etc (60 entries).
- **Verdict:** ✅ PASS — `New World → Step → 5 ticks → Reset` → Timeline log в Panel.

## 7) Stub fallback не маскируется под real LLM

- **Check:** Stub помечен `meta.via='stub-fallback'` + `logs: BLOCKED-RUNTIME`, adapter fallback также `via: stub-fallback` когда `agent missing` or `execute throws`; Panel log показывает `via` не скрыт.
- **Evidence:** `agent-act-adapter-service.ts:stubAct` + `catch → stubAct`; `simulation-engine-service.test.ts` — stub hash visible; `SIMULATION_WIRING.md` — `PROVIDER-PENDING` честно.
- **Verdict:** ✅ PASS — не маскируется.

## 8) Всё документировано как PROVIDER-PENDING

- **Check:** Real LLM (`LLM Bridge 23`, `CogMemory episodic` per tick) помечены `PROVIDER-PENDING` до Захода 2; docs не утверждают runtime.
- **Evidence:** `docs/SIMULATION_WIRING.md` — `PROVIDER-PENDING` (real LLM → Заход 2); `docs/SIMULATION_LAB_CHECKPOINT.md:5` — `BLOCKED-RUNTIME` section; `docs/TINYTROUPE_AUDIT.md` — `add 3` only.
- **Verdict:** ✅ PASS — честно `STATICALLY VERIFIED`.

---

## Итог

**STATIC AUDIT: 8/8 PASS.** Simulation Lab — экспериментальный фундамент `6 кружочков` с параллельным loop, замкнут `World→Engine→Adapter→World→Timeline→Panel`, без второго runtime, SSOT, одна граница, stub честный.

**Не расширять** на 20 возможностей — ждать Заход 2 (`typecheck → vitest 62→64 → LLM smoke`) для real `Agent A perceives → LLM → act → World → Agent B perceives`.

С богом — audit closed, wiring docs `SIMULATION_WIRING.md` + checkpoint `SIMULATION_LAB_CHECKPOINT.md`.
