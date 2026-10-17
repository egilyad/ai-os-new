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

[← Все материалы](./README.md)
