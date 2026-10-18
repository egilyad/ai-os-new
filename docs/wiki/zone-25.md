<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 25: конструкторы

> Раздел: **История разработки** · Статус: documented · Теги: аудит, зона 25

## Что проверено и исправлено

- PlannerPanel: список фильтров терпит не-массив (listFilters мог вернуть null) — fallback на пустой массив.
- RunQueuePanel: очередь и тулкиты терпят не-массив (list/listToolkits); legacy-записи без refId/kind не роняют поиск (toLowerCase) и рендер (slice); тулкит без массива prefixes не роняет join.
- SimulationPanel: список миров терпит не-массив (list); мир без rooms/relations/agentIds и комната без массива agents не роняют SVG-карту и легенду (пустые массивы).
- LensesPanel: библиотека линз и подсказки терпят не-массив (listLenses/suggestLenses); LensSelector ищет по name/description без краша на отсутствующих; LensStackVisualizer терпит validation без errors.
- JunctionPanel: список джанкшенов и источники терпят не-массив; detect/handleSeedDemo/handleChallenge больше не дают unhandled rejection — ошибка уходит в message; счётчик кандидатов терпит не-массив.
- JunctionCard/JunctionGraph: legacy-джанкшен без synthesisType/inputs/confidence/status/content/cognitiveDebt рендерится с fallback (unknown, пустая пара, 0%, пустые строки); JunctionList терпит отсутствующий rationale.
- TasksPanel: legacy-трасса без массива steps больше не роняет маппинг всех задач (steps→пустой массив); список AGEMS-задач терпит не-массив.
- Тесты: PlannerPanel +1 (не-массив фильтров), RunQueuePanel +1 (не-массив очереди/тулкитов), LensesPanel +1 (не-массив библиотеки и подсказок), JunctionPanel +1 (legacy-джанкшен + не-массив источников), TasksPanel +1 (legacy-трасса без steps), SimulationPanel 2/2 (новый файл: рендер + не-массив миров).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Отложено, требует проверки

- CognitiveBuilder: прочитан целиком — уже guarded (getTools в try/catch, deploy в try/catch с баннером); InspectorPanel/builder-nodes/ComponentPalette/WorkflowListPanel/BuilderAISidebar живьём не гонялись.
- TaskDetailModal (16KB) — не тронут, отдельного аудита не было.
- PlannerPanel/RunQueuePanel/SimulationPanel/LensesPanel/JunctionPanel: реальные payload сервисов (planner/runQueue/worldState/lensEngine/junctionEngine) против guards не гонялись — только моки/транспиляция.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
