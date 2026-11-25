# 2026-11-25 — veto-metric

Статус: done

## Цель сессии

Сделать срабатывания veto измеримыми: отдельное событие в реестре событий ядра.

## Что сделано (файлы + коммиты)

- `chat:veto` добавлен в `EVENT_REGISTRY_GROUP_1` как `VETO_TRIGGERED` со схемой `{requestId, surface, templateIds, names}`.
- `ChatExecutor` при срабатывании veto теперь эмитит `VETO_TRIGGERED` рядом с `NOTIFICATION` и блокирующим `MESSAGE_RESPONSE`.

## Принятые решения (+ почему; кандидат в ADR?)

- Отдельное событие вместо перегрузки `NOTIFICATION`: его можно считать в EventSourcing и dashboards без парсинга текста.
- surface в схеме — `assistant | chat`; сейчас путь чата передаёт `chat`, но схема готова к пост-проверке ассистента.

## Обнаруженные проблемы / гипотезы

- Факт: EventSourcing-подписчик для `chat:veto` пока не добавлен — событие пишется в шину, но не агрегируется в метрику.
- Гипотеза: проще всего подключить подписку там, где уже считаются `chat:response`/`chat:send`; отдельный сервис не нужен.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run event-registry.test.ts event-registry.decomp.test.ts veto-gate-service.test.ts` — 3/3; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Подписать EventSourcing/метрики на `chat:veto` и добавить счётчик срабатываний по шаблону.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 5894184
- Изменённых файлов: 2
  - M src/kernel/events/registry-groups/event-registry-group-1-session-binding.ts
  - M src/kernel/services/chat-executor.ts
- Diff stat:
  - .../registry-groups/event-registry-group-1-session-binding.ts | 9 +++++++++
  - src/kernel/services/chat-executor.ts | 6 ++++++
  - 2 files changed, 15 insertions(+)
- Последние коммиты:
  - 5894184 feat(veto): post-check assistant output against exception templates
  - ee56306 feat(lenses): unify stack compilation between UI and runtime
  - af99c96 fix(skills): remove scanner-triggering command literals
  - eba3138 fix(secrets): move webhook secret to session storage
  - 0a83481 feat(crew): gate mutations with authorization service
