# Спецификация: Командный / серверный режим (multi-user, tenant)

> Статус: готово к реализации. Приоритет: P3 (после P0/P1). Связано: `ROADMAP_10`, `SPEC_08` (authz).
> Источник: глубокое исследование `server/` (sync-server, company-store, CLI, docker) — см. ниже «факты».

---

## 1. Факты о текущем сервере (что уже есть)

- `sync-server.mjs` — REST + WebSocket; сущности (company-store): companies/agents/wakeups/issues/runs/approvals/activity/costs; write-queue; heartbeat-loop; export/import (redacted); адаптеры (echo/http/process/browser-use/computer-act).
- Безопасность: единый `SYNC_SECRET` (Bearer/WS-token), rate-limit, origin-проверка, loopback по умолчанию, Docker hardening.
- CLI (`superagents.mjs`): onboard/doctor/db-backup/run/configure-budget.
- **Gap'ы для командного режима** (выявлены):
  1. Нет auth по пользователям (один глобальный секрет, нет ролей/сессий).
  2. Нет tenant-изоляции (любой владелец секрета видит все компании).
  3. Нет мульти-команды/CI-dep-графа/exit-code-агрегации.
  4. Персистентность на JSON-файлах (без транзакций по нескольким файлам; узкое место при параллельных прогонах).
  5. CLI не покрывает: создание компаний/агентов, issue-работу, approvals-решения, просмотр runs/activity, eval.
  6. Нет серверной оркестрации самих агентов (цикл агент→LLM→инструменты живёт в браузере).
  7. Нет eval-харнесса на сервере (eval-стек только в браузере).

## 2. Цель

- Мультипользовательский серверный режим с **tenant-изоляцией**, ролями, авторизацией (через `IAuthorizationService`, SPEC_08) и headless-возможностями (CLI/REST).

## 3. Фазы внедрения

### Фаза 1 — Auth + Tenant (приоритет)

- Ввести пользователей/сессии: токен → `{ tenantId, userId, roles }` (JWT или подписанный opaque-token). Токены выпускаются при логине (passphrase/API-key пользователя).
- Привязка данных к tenant: добавить `tenantId` в сущности company-store; все REST-эндпоинты фильтруют по `tenantId` из токена (изоляция).
- `SYNC_SECRET` остаётся как «мастер-ключ инфраструктуры» (не для пользовательских данных).
- Интеграция с `IAuthorizationService`: каждый эндпоинт проверяет `(actor=user, action=method, resource=path+tenantId)`.

### Фаза 2 — Headless-оркестрация агентов

- Перенести/продублировать цикл агента (LLM→инструменты→память) в серверный рантайм (переиспользовать `tool-loop`, `ILLMClientService` — серверная версия), чтобы runs реально исполняли агентов (сейчас — только адаптеры).
- Расширить CLI: `agents create/list`, `issues create/checkout/status`, `approvals list/decide`, `runs list`, `eval run`, `company create/import/export`.

### Фаза 3 — Персистентность

- Опционально: перейти с JSON-файлов на embedded-БД (SQLite) с транзакциями/индексами — только если параллельные прогоны станут узким местом. (Сначала — write-queue + атомарный rename достаточно.)

### Фаза 4 — Eval + гейты

- Портить `eval-dataset-service`/`llm-judge-service`/`scorer-registry-service` на сервер (сущность `eval_runs`, `GET /api/eval/*`) или как CLI-команду `eval`. Прогон через `startRun`/`execute` (адаптер `process`/`http` как транспорт). См. `SPEC_04`.

## 4. Безопасность-чек-лист

- Tenant-изоляция на каждом запросе (иначе IDOR).
- Никакой «общий секрет» для пользовательских данных; минимальные роли.
- `SYNC_SECRET` — только для операций инфраструктуры.
- TLS при non-loopback (уже предупреждается); не хранить Bearer в plaintext-логах.
- Rate-limit + budget per-tenant (уже есть per-company).

## 5. Тесты

- Auth: невалидный/просроченный токен; роли; tenant-фильтрация (user A не видит компании B).
- CLI: новые подкоманды (create/decide/eval) end-to-end против тестового сервера.
- Headless-агент: run реально исполняет (LLM→инструменты) и пишет результат.

## 6. Definition of Done

- Auth+tenant работают (изоляция); CLI покрывает ключевые операции; headless-агент исполняется; eval-харнесс на сервере работает; тесты зелёные.
