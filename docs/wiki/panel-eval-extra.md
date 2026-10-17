<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Метрики-анализаторы

> Раздел: **Панели** · Статус: documented · Теги: панель, анализ, оценка, метрики, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/BlindEvalPanel/`, `src/components/CalibrationPanel/`

## Назначение

Набор измерителей качества рассуждений и ответов. Метки — `nav.*`.

## Инструменты

- **Blind Eval** — слепая оценка ответов.
- **Calibration** — калибровка уверенности.
- **Consistency** — устойчивость/непротиворечивость.
- **Similarity** — сходство ответов.
- **BoP Tracker** — отслеживание баланса доказательств.
- **Drift Detector** — обнаружение дрейфа.
- **Entanglement** — связность/запутанность аргументов.
- **Outcome Forecaster** — прогноз исхода.

## Где менять

Компоненты: `BlindEvalPanel`, `CalibrationPanel`, `ConsistencyPanel`, `SimilarityPanel`, `BoPTrackerPanel`, `DriftDetectorPanel`, `EntanglementPanel`, `OutcomeForecasterPanel`. Качество — [Панель: Качество дебатов](./panel-debate-quality.md).

---

## Связанные материалы

- [Панель: Качество дебатов](./panel-debate-quality.md)
- [Инструменты анализа дебатов](./panel-debate-toolkit.md)
- [Панели: Аналитика, затраты и ключи](./panel-analytics.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `outcome-forecaster` → маршрут `/outcome-forecaster`
  - Компонент: `src/components/OutcomeForecasterPanel/OutcomeForecasterPanel`
  - Тесты: `src/components/OutcomeForecasterPanel/OutcomeForecasterPanel.test.tsx`
- Панель `similarity` → маршрут `/similarity`
  - Компонент: `src/components/SimilarityPanel/SimilarityPanel`
  - Тесты: `src/components/SimilarityPanel/SimilarityPanel.test.tsx`
- Панель `drift-detector` → маршрут `/drift-detector`
  - Компонент: `src/components/DriftDetectorPanel/DriftDetectorPanel`
  - Тесты: `src/components/DriftDetectorPanel/DriftDetectorPanel.test.tsx`
- Панель `blind-eval` → маршрут `/blind-eval`
  - Компонент: `src/components/BlindEvalPanel/BlindEvalPanel`
  - Тесты: `src/components/BlindEvalPanel/BlindEvalPanel.test.tsx`
- Панель `calibration` → маршрут `/calibration`
  - Компонент: `src/components/CalibrationPanel/CalibrationPanel`
  - Тесты: `src/components/CalibrationPanel/CalibrationPanel.test.tsx`
- Панель `consistency` → маршрут `/consistency`
  - Компонент: `src/components/ConsistencyPanel/ConsistencyPanel`
  - Тесты: `src/components/ConsistencyPanel/ConsistencyPanel.test.tsx`
- Панель `entanglement` → маршрут `/entanglement`
  - Компонент: `src/components/EntanglementPanel/EntanglementPanel`
  - Тесты: `src/components/EntanglementPanel/EntanglementPanel.test.tsx`
- Панель `bop-tracker` → маршрут `/bop-tracker`
  - Компонент: `src/components/BoPTrackerPanel/BoPTrackerPanel`
  - Тесты: `src/components/BoPTrackerPanel/BoPTrackerPanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)
