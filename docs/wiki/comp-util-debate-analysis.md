<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: утилиты анализа дебатов и оценки токенов

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, утилиты, дебаты, анализ

Источники: `src/kernel/utils/debate-analysis.ts`, `src/kernel/utils/topic-suggestions.ts`, `src/kernel/utils/tokenEstimate.ts`

## Назначение

Давать локальный анализ аргументации и подсказки тем, а также оценку токенов.

## Возможности

- `debate-analysis.ts`: `detectFallacies`/`fallacyScore` (софизмы), `computePersuasion`, `analyzeTone`, `analyzeDebate`, `FALLACY_LABELS` — **орфан** (файл есть, но в src не импортируется).
- `topic-suggestions.ts`: `suggestTopics`, `suggestByDifficulty`, `suggestByCategory`, `TOPIC_CATEGORIES`, `TOPIC_DIFFICULTIES` (используется в useTopicSuggester).
- `tokenEstimate.ts`: `estimateTokens(text, divisor = 4)` (используется в kernel/agent-service/cognitive-service/provider-tracker).

## Реализация

- `src/kernel/utils/debate-analysis.ts`, `topic-suggestions.ts`, `tokenEstimate.ts`.

## Связи

- Дебаты — [Компонент: рантайм дебатов](./comp-debate-runtime.md), [Компонент: аргументация (debateplus)](./comp-debateplus.md); оценка — [Компонент: оценка и рейтинг (eval, elo)](./comp-eval-elo.md); сценарии — [Компонент: сквозные сценарии](./comp-scenarios.md).

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; `tokenEstimate`/topic-suggestions используются, `debate-analysis.ts` — орфан; автотестами не покрыто.

---

## Связанные материалы

- [Компонент: рантайм дебатов](./comp-debate-runtime.md)
- [Компонент: оценка и рейтинг (eval, elo)](./comp-eval-elo.md)
- [Компонент: аргументация (debateplus)](./comp-debateplus.md)
- [Компонент: сквозные сценарии](./comp-scenarios.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)
