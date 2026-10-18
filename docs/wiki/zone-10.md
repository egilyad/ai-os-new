<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 10: логи и инспекции

> Раздел: **История разработки** · Статус: documented · Теги: аудит, зона 10

## Что проверено и исправлено

- LogsPanel: formatTime больше не бросает RangeError на битых timestamp (toISOString строже toLocale); getBuffer в try/catch; поиск терпит legacy-записи.
- LogsPanel: autoScroll чинится по-настоящему — был вызов scrollToOffset(count) вместо scrollToIndex (пиксели вместо индекса, низ списка недостижим).
- LogsPanel: пустой экспорт теперь говорит тостом (было молчаливое ничто); Export/заголовок/подпись счётчика — ключи en+ru (logs.subtitle вообще отсутствовал).
- DecisionCard: guards на promptPreview/estimatedCost/policyApplied/scoring/rejectedKeys/timestamp/latency («—» вместо краша).
- ScoreRow: тип value расширен до undefined, не-финитное — пустой бар + «—» вместо NaN%.
- Тесты: LogsPanel 4/4 (новый; виртуализатор замокирован — в jsdom без layout он рендерит 0 строк), DecisionCard 2/2 (новый, legacy-запись).
- StateInspectorPanel проверен чтением — честный (снапшот с try/catch, ошибки баннером), правок не потребовал.

## Отложено, требует проверки

- DecisionLogPanel.tsx (контейнер: загрузка/сохранение стореджа, фильтры) — только чтение, рендер-тестов контейнера нет (есть smoke P2.17).
- StateInspector TreeNode/StatBox на глубоких/циклических состояниях — JSON.stringify циклику бросит в ошибку (поймается баннером, но стоит проверить).
- logs.*-ключи в массе — автостабы Title Case («Title», «Col Level»): не ложь, но позор; полный рерайт en+ru — отдельная задача.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
