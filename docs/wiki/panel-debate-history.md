<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: История дебатов и повтор

> Раздел: **Панели** · Статус: verified · Теги: панель, дебаты, история, replay, инструкция

Источники: `src/i18n/translations/en/debate.ts`, `src/components/DebatePanel/DebateHistoryPage`, `src/components/DebateReplayPanel`

## Назначение

История дебатов и воспроизведение хода. Ключи `debate.*`.

## История

Список прошлых сессий с вердиктами; отдельная страница истории (`DebateHistoryPage`).

## Повтор

Панель повтора (`DebateReplayPanel`) воспроизводит ход дебата по шагам (`verdict.replay`).

## Менеджер

`DebatesManagerPanel` — общий список и управление сессиями.

## Где менять

Компоненты: `DebateHistoryPage`, `DebateReplayPanel`, `DebatesManagerPanel`. Обзор — [Дебаты: режимы и механика](./debates.md).

---

## Связанные материалы

- [Дебаты: режимы и механика](./debates.md)
- [Панель: Живые дебаты](./panel-debate-live.md)
- [Панель: Анализ дебатов](./panel-debate-analysis.md)

[← Все материалы](./README.md)
