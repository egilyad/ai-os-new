# R-GAP-03 POST Audit — Separate FactCheck Set

> Дата: 2026-09-08. Scope: минимальный targeted fix, только `debate-post-processor.ts:118-140,224`.

## Проблема
`processedArgIds: Set<string>` шарился между `processGovernorFeeding` и `processFactCheck`.
`mergeAndProcessSession` `debate-session-bridge.ts:160-162`:
```ts
processGovernorFeeding(newArgs, governor); // adds all ids to Set
await processFactCheck(newArgs);           // if(has) continue → skips all → dead bridge
```
Resumption/human-arg path никогда не факт-чекался → `factuality` всегда fallback.

## Фикс
- Добавлен `private processedFactCheckIds: Set<string>` `debate-post-processor.ts:122`
- `constructor` init, `clearProcessedIds`/`destroy` clear оба Set `132-141`
- `processFactCheck` использует `processedFactCheckIds` `230-232`, не `processedArgIds`
- `processGovernorFeeding` без изменений (по-прежнему `processedArgIds`)

**Diff (2 логические строки + init/clear):**
```diff
- private processedArgIds: Set<string>;
+ private processedArgIds: Set<string>;
+ private processedFactCheckIds: Set<string>;

- this.processedArgIds = new Set();
+ this.processedArgIds = new Set();
+ this.processedFactCheckIds = new Set();

- if (this.processedArgIds.has(arg.id)) continue; // in processFactCheck
- this.processedArgIds.add(arg.id);
+ if (this.processedFactCheckIds.has(arg.id)) continue;
+ this.processedFactCheckIds.add(arg.id);
```

Никаких новых абстракций, runtime, контрактов, миграций. Sampling `0.2` не тронут. Остальные GAP не тронуты.

## Static verification
| Check | Evidence | Result |
|-------|----------|--------|
| Separate Sets | `processedArgIds` vs `processedFactCheckIds` distinct fields | ✅ |
| Governor not affected | `processGovernorFeeding:184` still uses `processedArgIds` | ✅ |
| FactCheck dedup per Set | `processFactCheck:230` uses `processedFactCheckIds` only | ✅ |
| Clear/destroy both | `132,139` clear both Sets | ✅ |
| No contract drift | `IDebateSession`, `PipelineEngine`, `DebateEngineDeps` unchanged | ✅ |
| No Council/Bayesian/provenance | Untouched | ✅ |
| Bridge order now works | `governorFeeding` → `FactCheck` both execute on same `newArgs` | ✅ |

## Runtime/BLOCKED
- `typecheck:fast` / `build` / `vitest` — **BLOCKED-RUNTIME** (weak PC, no `node`/`npm` on PATH, `C:\Users\evgeny\Downloads\ai-os-new-main` toolchain unavailable). Static-only, как и все N4/N4d батчи.
- Regression test добавлен: `debate-post-processor.rgap03.test.ts` — governor feeding + FactCheck на same args оба вызываются; второй `processFactCheck` deduped. **STATICALLY VERIFIED / NEEDS vitest on strong PC**.

## Verdict
🟢 **PASS static** — dead bridge восстановлен, R-GAP-03 CLOSED. 2 строки > архитектуры.

**STOP — жду вердикта. R-GAP-02 не трогать.**
