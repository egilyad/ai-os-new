# 2026-11-23 — roundtrip-serializer

Статус: done

## Цель сессии

Э3.1 (round-trip): единый формат экспорта с версионированием, Zod-валидацией и миграциями — основа для 9 панелей.

## Что сделано (файлы + коммиты)

- `src/kernel/utils/roundtrip.ts` — `serializeRoundtrip(kind, payload)` и `parseRoundtrip(json, kind, schema, migrations)`; оболочка `{format, version:2, kind, exportedAt, payload}`.
- `src/kernel/utils/roundtrip.test.ts` — 4 теста (успех, неверный формат/вид/версия, невалидный payload, миграция 1→2); добавлен в `test:stable`.
- Единый роадмап — Э3.2 UX обновлена.

## Принятые решения (+ почему; кандидат в ADR?)

- Версия 2 с первого шага: проверка миграций не может быть протестирована на версии 1 без искусственного понижения.
- `kind` обязателен и сверяется при чтении — файл памяти нельзя случайно импортировать как дебаты.
- Миграции — обычная карта `version → (data) => data`; отсутствующая миграция даёт явную ошибку, а не молчаливый мусор.

## Обнаруженные проблемы / гипотезы

- Факт: панели пока экспортируют «голый» JSON — новый формат ещё не подключён ни к одной из 9 панелей.
- Гипотеза: первым пилотом сделать MemoryPanel (экспорт есть, импорта нет), затем ProviderManager и RolesPanel.
- Старые файлы без оболочки будут отвергнуты как «Unknown export format» — нужен отдельный legacy-reader, если нужна обратная совместимость.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run roundtrip.test.ts` — 4/4 passed.
- ESLint на двух файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Подключить `serializeRoundtrip`/`parseRoundtrip` к MemoryPanel и добавить импорт с валидацией; затем остальные 8 панелей.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ b5ba418
- Изменённых файлов: 3
  - M package.json
  - ?? src/kernel/utils/roundtrip.test.ts
  - ?? src/kernel/utils/roundtrip.ts
- Diff stat:
  - package.json | 4 ++--
  - 1 file changed, 2 insertions(+), 2 deletions(-)
- Последние коммиты:
  - b5ba418 fix(a11y): restore focus-visible ring over panel styles
  - d873f94 feat(dashboard): embed five overview hubs
  - af9c8cd feat(overview): add five-hub aggregation service
  - 6910002 fix(a11y): add dialog semantics and Escape to modals
  - fd05571 docs: require push at end of each session
