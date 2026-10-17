<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 17: debate research

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 17

## Что проверено и исправлено

- ExperimentComparison: getAllRuns терпит не-массив и throw; formatDuration — «—» вместо NaN s при битых метках.
- GovStressTest: getScenarios на уровне модуля больше не роняет импорт; runAllScenarios терпит не-массив и throw (панель не виснет в Running...); поиск и счётчики терпят записи без scenario.
- Math.random в ExperimentComparison — честный рандом-пик для кнопки Random, не фабрикация данных.
- Тесты: ExperimentComparison 3/3, GovStressTest 3/3 (новые файлы).
- ВАЖНО: локальная верификация невозможна — vitest-пул мёртв системно (проверено многократно, включая тривиальные файлы), гейт — только CI. Синтаксис проверен транспиляцией.

## Отложено, требует проверки

- Остальные ~45 файлов DebateResearch (аудиты, гипотезы, покрытия, покрытия) — только точечная проверка.
- ResearchRunHistory/StatsPanel и прочие потребители researchRunService — не покрыты.
- Живой прогон GovStressTest.runAllScenarios против реального движка — не гонялся.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
