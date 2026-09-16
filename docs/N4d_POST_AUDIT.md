# N4d POST Audit — Early-Exit Threshold Wiring

> Дата: 2026-09-07. Scope: замена хардкода `0.85` на lookup из strategy definition. Без контрактов, без миграций, без Council/Bayesian/coherence.

---

## Что было

```typescript
// debate-pipeline-builder.ts:298
if (interim.confidence >= 0.85) // hardcoded
```

Builtin strategies задавали `convergenceThreshold` (0.8, 0.85, 0.9) в DSL, UI редактировала, registry валидировал — но pipeline builder **не читал**.

---

## Что стало

```typescript
// debate-pipeline-builder.ts:301-302
const strategyKey = session.topology?.type ?? 'roundtable';
const earlyExitThreshold = engine.deps.getEarlyExitConfidence?.(strategyKey) ?? 0.85;
if (interim.confidence >= earlyExitThreshold)
```

### Цепочка

1. **Pipeline builder** (`debate-pipeline-builder.ts:301-302`): читает `session.topology.type` (e.g. `'roundtable'`), вызывает `engine.deps.getEarlyExitConfidence('roundtable')`, fallback `0.85`
2. **Interface** (`debate-engine-types.ts:143`): `getEarlyExitConfidence?: (topologyType: string) => number`
3. **Implementation** (`phase3-debate-runtime.ts:654-667`):
   - Reverse-maps `topologyType → strategyName` (`roundtable → round_robin`, `linear → sequential`, etc.)
   - Looks up `builtin.${strategyName}` in `StrategyManager`
   - Reads `earlyExitConfidence` from root primitive (if set)
   - Falls back to `convergenceThreshold` (if set)
   - Falls back to `0.85` (if nothing found)

### Mapping

| topologyType | strategyName | builtin ID | convergenceThreshold |
|---|---|---|---|
| `roundtable` | `round_robin` | `builtin.round_robin` | 0.85 |
| `linear` | `sequential` | `builtin.sequential` | — |
| `judge` | `judge` | `builtin.judge` | — |
| `tree-of-thought` | `argument_tree` | `builtin.argument_tree` | — |
| `red-blue` | `red-blue` | `builtin.red-blue` | — |
| `moderated` | `moderated` | `builtin.moderated` | 0.8 |
| `cross_examination` | `cross_examination` | `builtin.cross_examination` | 0.9 |
| `open_forum` | `open_forum` | `builtin.open_forum` | 0.9 |

---

## Backward compatibility

| Scenario | Behavior |
|----------|----------|
| `getEarlyExitConfidence` not provided (engine deps) | `?? 0.85` — same as before |
| Strategy not found in registry | Returns `0.85` |
| Strategy found but no `earlyExitConfidence` or `convergenceThreshold` | Returns `0.85` |
| `session.topology` undefined | `'roundtable'` fallback → `0.85` |
| **All paths produce `0.85` when no strategy definition exists** | ✅ identical to hardcoded |

---

## Статические проверки

| Check | Evidence | Result |
|-------|----------|--------|
| No hardcoded `0.85` in pipeline builder | `debate-pipeline-builder.ts:302` uses `earlyExitThreshold` | ✅ |
| Fallback chain: `getEarlyExitConfidence ?? 0.85` | Double null-safe (`?.` + `??`) | ✅ |
| Strategy lookup: `builtin.${name}` then raw | `phase3-debate-runtime.ts:658` | ✅ |
| Topology→strategy reverse map | Matches `debate-session-persistence.ts:10-16` | ✅ |
| `earlyExitConfidence` checked before `convergenceThreshold` | `phase3-debate-runtime.ts:660-664` | ✅ |
| No contract changes | `IDebateSession`, `DebateTopology`, `PipelineEngine` unchanged | ✅ |
| No Council/Bayesian/coherence changes | Untouched | ✅ |
| No new runtime/store/evaluator | Only DI wiring + pipeline builder lookup | ✅ |

**Verdict:** 🟢 PASS — early-exit threshold now reads from strategy definition with `0.85` backward-compatible fallback. Zero risk, zero breaking changes.

**STOP — жду вердикта.**
