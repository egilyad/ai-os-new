<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панель: Анализ дебатов

> Раздел: **Панели** · Статус: verified · Теги: панель, дебаты, анализ, инструкция

Источники: `src/i18n/translations/en/debate.ts`, `src/components/DebateAnalysisPanel/`

## Назначение

Анализ хода дебатов: логические ошибки, сдвиг позиции, волатильность и тон. Ключи `debate_analysis.*`.

## Метрики

Общее число ошибок рассуждения (fallacies) и их разбивка, сдвиг позиции (overall_shift), волатильность, тренд (rising / falling / stable / oscillating), убедительность (persuasion) и таймлайн тона.

## Состояния

Если сессий нет — `no_sessions`.

## Где менять

Компонент: `DebateAnalysisPanel`. Инструменты анализа — [Инструменты анализа дебатов](./panel-debate-toolkit.md), качество — [Панель: Качество дебатов](./panel-debate-quality.md).

---

## Связанные материалы

- [Дебаты: режимы и механика](./debates.md)
- [Инструменты анализа дебатов](./panel-debate-toolkit.md)
- [Панель: Качество дебатов](./panel-debate-quality.md)
- [Зона 21: качество аргументов](./zone-21.md)

[← Все материалы](./README.md)
