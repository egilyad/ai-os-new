<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 24: знания-2

> Раздел: **История разработки** · Статус: documented · Теги: аудит, зона 24

## Что проверено и исправлено

- SimilarityMonitor.recordArgument: не-строковый content ронял tokenize/.length, а undefined round давал битый ключ записи — нормализация к пустой строке и round→1.
- SimilarityPanel: loadDebate на undefined content падал на .slice(0,80), undefined round давал NaN в инпуте раунда — guards.
- InsightBus.ingestRound: не-строковый content ронял toLowerCase/.length, отсутствующий массив аргументов не терпелся — нормализация аргументов и round.
- InsightBusPanel: loadDebate группировал по undefined round (битый ключ Map) и передавал undefined content — guards (round→1, content→пусто).
- ProvenancePanel: результат trace без nodes/edges ронял .map — guards (пустые массивы, отброс пар без концов).
- DocsHealth: legacy-отчёт из хранилища без items ронял filter, legacy-план без tasks ронял map, отчёт без byCategory ронял Object.entries, задача без failedItems/suggestedFixes роняла .length — guards во всех секциях (Broken/HealingPlan/ByCategory) и в самой панели; executeAll приведён к массиву.
- Проверены без правок: PatternsPanel/InsightFeed и DocumentationPanel работают на статических данных (INITIAL_NOTES/doc-content) — legacy-пути нет.
- Тесты: SimilarityPanel +1 (legacy live-аргументы), InsightBusPanel +1 (legacy), ProvenancePanel 2/2 (новый, битый trace), DocsHealthPanel 1/1 (новый, legacy отчёт/план без коллекций).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Отложено, требует проверки

- SimilarityMonitor/InsightBus живьём против реального движка дебатов не гонялись — только моки/транспиляция.
- ProvenancePanel: graphVizService.svg и DOMPurify-санитайзинг в живом рендере не проверялись.
- DocsHealth: consistencyChecker.fetchDocs/checkDocs и healingPipeline.analyze/executeAll живьём (сеть/файлы) не проверялись.
- PatternsPanel: CRUD заметок не реализован (кнопки Create/Edit/Save только показывают уведомление coming soon).
- DocumentationPanel: doc-content-data и doc-section-components не сверялись с фактическим состоянием кода.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
