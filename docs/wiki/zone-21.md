<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 21: качество аргументов

> Раздел: **История разработки** · Статус: documented · Теги: аудит, зона 21

## Что проверено и исправлено

- SynthesisPanel: handleSynthesize/export/refine/refresh были голыми — теперь runGuarded с баннером; confidenceDistribution/input/zones/perspectives/totalTokens — guards («—» вместо краша/NaN).
- PerspectiveGrid: confidence — «—» вместо NaN%.
- OutcomeForecasterPanel: handleForecast в try/catch с баннером; expectedScoreGain — «—» вместо NaN.
- WhatIfPanel: runSim глотал ошибки в finally — теперь баннер; null-результаты терпятся.
- Тесты: SynthesisPanel +2 (баннер, legacy), OutcomeForecaster +1 (мусорный ввод), WhatIfPanel 3/3 (новый, error-banner через UI).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Отложено, требует проверки

- Steelman/Rhetoric/Justification/LogicalForm/ArgumentGraph/FrameTracker/StanceDrift/Entanglement/ConceptBlender/Minimax — только grep-разведка; у части есть свои тесты, прямого аудита не было.
- Counterfactual-панель (CausalAttribution/ScoreComparison/TraceSidebar) — не тронута вообще.
- ResearchEngine AdvancedTab и остальные табы ResearchPanel — по-прежнему не covered.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
