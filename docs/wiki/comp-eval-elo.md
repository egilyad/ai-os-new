<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: оценка и рейтинг (eval, elo)

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, оценка, рейтинг, LLM-judge

Источники: `src/kernel/services/eval/llm-judge-service.ts`, `src/kernel/services/eval/scorer-registry-service.ts`, `src/kernel/services/elo/elo-service.ts`

## Назначение

Объективно сравнивать ответы и агентов: судить (LLM-judge и оценки), вести рейтинг Эло, показывать влияние качества.

## Возможности

- LLM-судья (`LlmJudgeService`) и реестр скореров (`ScorerRegistryService`).
- Рейтинг Эло (`EloRatingService`) для соревновательных пар.

## Реализация

- `eval/`: `llm-judge-service.ts`, `scorer-registry-service.ts`.
- `elo/`: `elo-service.ts` (`EloRatingService`).
- Связанные: `council/weighted-judge-evaluator.ts` (взвешенные судьи), `frontier/eval-service.ts`.

## Связи

- Фронтир/разнообразие — [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md); A/B — [Панель: A/B-тест промптов](./panel-ab-testing.md).
- Панели: [Панель: Датасеты оценки](./panel-eval.md), [Панели: Метрики-анализаторы](./panel-eval-extra.md), [Панель: Влияние техник](./panel-quality-impact.md), [Панели: Аналитика, затраты и ключи](./panel-analytics.md).

## Проверка работоспособности

- Ручная: прогнать оценивание и посмотреть таблицу рейтинга.
- В каталогах `eval/` и `elo/` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Панель: Датасеты оценки](./panel-eval.md)
- [Панели: Метрики-анализаторы](./panel-eval-extra.md)
- [Панель: Влияние техник](./panel-quality-impact.md)
- [Панель: A/B-тест промптов](./panel-ab-testing.md)
- [Панели: Аналитика, затраты и ключи](./panel-analytics.md)

[← Все материалы](./README.md)
