# Спецификация: Интерпретатор DSL-стратегий дебатов

> Статус: готово к реализации. Приоритет: P1 (самая ценная работа). Связано: `ROADMAP_02` §P1, `PREP_01 (R-A5)`.

---

## 1. Что выяснено о текущей механике (факты из кода)

- Движок исполняет **только `DebateTopology`** (граф узлов→раунды): `linear`, `roundtable`, `judge`, `tree-of-thought`, `red-blue` (`debate-topology.ts` → `buildRounds`).
- «Стратегия» — это 3 слоя поверх топологии: (а) топология, (б) форсированные quality-техники (`isQ`-гейты в промптах и сервисах), (в) промпт-блоки по `session.strategy`.
- `startDebate` (`debate-sync-manager.ts:260`) транслирует стратегию через `resolveStrategyConfig` (`debate-session-bridge.ts:276`): builtin-корень → `ROOT_TO_EXECUTION` (sequence→linear, debate_graph→roundtable, critic_loop→roundtable, voting→roundtable, peer_review→judge); enum-стратегии → `buildTopologyForStrategy` (почти всё → roundtable).
- `StrategyRegistry` (`debate-strategy-registry.ts`) — статичный реестр валидированных `StrategyDefinition` (DSL-описания в `debate-strategy-definitions.ts`, 1157 стр).
- ДSL-контракты уже есть в `contracts/debate-strategy-dsl.ts`: `StrategyPrimitiveType = 'sequence'|'debate_graph'|'critic_loop'|'voting'|'peer_review'` + примитивы (Sequence/DebateGraph/CriticLoop/Voting/PeerReview).
- **Интерпретатора примитивов не существует** — есть лишь транслятор `resolveStrategyConfig`.

## 2. Цель

- Реализовать интерпретатор `StrategyPrimitive`, который компилирует DSL в:
  (а) топологию (граф узлов→раунды),
  (б) маску qualitySettings (какие техники форсируются),
  (в) управление порядком ходов (поверх `DebatePolicy.proposeNextTurn`).
- Переиспользовать как есть: LLM-цикл (`debate-llm-caller.ts`), бюджет (`DebateBudget`), консенсус (`DebateConsensusEngine`), валидатор (`DebateEvaluator`), факт-чек, post-processor.

## 3. Архитектура интерпретатора

```
 StrategyDefinition (DSL) ──► DSLInterpreter.compile() ──► StrategyProgram
                                                              ├─ topology: DebateTopology
                                                              ├─ qualityMask: Record<techniqueId, boolean>
                                                              └─ turnPolicy: OrdPolicy (поверх DebatePolicy)
```

- `DSLInterpreter` (`src/kernel/services/debate-runtime/strategy-interpreter.ts`):
  - `parse(definition: StrategyDefinition): StrategyProgram` — валидация примитивов (reuse `StrategyRegistry.validate`),
  - `compile(program) → { topology, qualityMask, turnPolicy }`.

### Примитивы → маппинг

| Примитив      | Топология                             | Quality-маска                         | Порядок ходов                                                |
| ------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `Sequence`    | linear (узлы в порядке steps)         | по `quality[]`                        | строго по порядку                                            |
| `DebateGraph` | roundtable (или tree, если edge-типы) | по `quality[]`                        | по edges (sequential/broadcast/conditional/challenge/refine) |
| `CriticLoop`  | roundtable (proponent+critic)         | critic / socratic-pivot               | proponent→critic→… до `stopWhen`                             |
| `Voting`      | roundtable + judge                    | blind-evaluation / bayesian-judges    | дебаты, затем голосование                                    |
| `PeerReview`  | judge (authors→reviewers)             | blind-evaluation / judge-deliberation | раунды авторов→рецензентов до `passThreshold`                |

- `stopWhen`/`convergenceThreshold`/`earlyExitConfidence` → уже поддерживаются движком (`earlyExitConfidence` в roundLoop); пробрасывать.

### Интеграция с `startDebate`

- Заменить в `resolveStrategyConfig`: если `strategy` — DSL-определение, компилировать через интерпретатор; иначе legacy-трансляция.
- `DebateEngine.createSession` получает уже готовый `StrategyProgram` (а не только topology).

## 4. Порядок внедрения (поэтапно)

1. `strateg`` + `parse` (валидация) — покрыть тестами на всех 33 builtin-определениях.
2. `compile` → topology/qualityMask для всех 5 примитивов.
3. `turnPolicy` поверх `DebatePolicy` (для Sequence/DebateGraph/CriticLoop).
4. Подключить к `startDebate`; пометить в UI, какие стратегии теперь «исполняемые».
5. Перенести 5 builtin-стратегий на DSL-исполнение в качестве proof; дальше расширять.

## 5. Тесты

- `parse`: все 33 builtin валидны; невалидные отклоняются.
- `compile`: для каждого примитива ожидаемая топология+qualityMask.
- Интеграция: `startDebate('builtin.socratic')` реально исполняет socratic (не roundtable) — тест через mock-LLM.
- Не-регрессии: существующие roundtable/judge/red-blue не сломаны.

## 6. UI

- В панели выбора стратегии: бейдж «исполняется интерпретатором» vs «топология» vs «декларативно».

## 7. Definition of Done

- Интерпретатор исполняет ≥5 стратегий из разных примитивов; `startDebate` учитывает DSL; тесты зелёные; UI честно помечает статус.
