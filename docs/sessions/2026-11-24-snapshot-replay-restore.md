# 2026-11-24 — snapshot-replay-restore

Статус: done

## Цель сессии

Ре-аудит P1-10: `SnapshotService.startReplay()` портил живое состояние без возможности вернуться.

## Что сделано (файлы + коммиты)

- `snapshot-service.ts` — перед первым replay сохраняется `preReplayState` (kernel state + topology + disabled nodes); `stopReplay()` восстанавливает его.
- Тест: `stopReplay возвращает состояние, бывшее до replay`; 52/52 в файле.

## Принятые решения (+ почему; кандидат в ADR?)

- Состояние «до» сохраняется один раз за сессию replay — повторные `startReplay` не перезаписывают исходную точку.
- Снимок строится синхронно, `memoryCount: 0` — поле информационное и не влияет на restore.
- `restore()` переиспользуется для возврата, поэтому сохраняются все его проверки и события.

## Обнаруженные проблемы / гипотезы

- Факт: `capture()` остаётся асинхронным из-за `memoryStore.count()`; выделять общий `buildSnapshot` ради точного memoryCount — отдельная правка.
- Гипотеза: `stopReplay()` теперь эмитит `SNAPSHOT_RESTORED`, что может быть лишним для UI — проверить по event-логу.
- ESLint: 0 ошибок; в логе теста есть ожидаемая ошибка валидации некорректного снимка из другого теста.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run snapshot-service.test.ts` — 52/52; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

P1-9/P1-11: per-tab rate-limit buckets и persisting budget hard-stop.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 94da4db
- Изменённых файлов: 2
  - M src/kernel/services/snapshot-service.test.ts
  - M src/kernel/services/snapshot-service.ts
- Diff stat:
  - src/kernel/services/snapshot-service.test.ts | 10 ++++++++++
  - src/kernel/services/snapshot-service.ts | 25 +++++++++++++++++++++++++
  - 2 files changed, 35 insertions(+)
- Последние коммиты:
  - 94da4db feat(validation): extend Zod hooks to ops tables
  - cad7454 fix(lock): add fencing tokens and fail-closed chat sends
  - feb984d fix(reaudit): secure secrets, init flags, batch aborts
  - 8687325 refactor(keystate): merge writes with CAS across tabs
  - 2aef03f refactor(settings): unify theme preference storage
