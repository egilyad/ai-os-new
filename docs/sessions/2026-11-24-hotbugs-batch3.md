# 2026-11-24 — hotbugs-batch3

Статус: done

## Цель сессии

Третий пакет hot-фиксов: authz по умолчанию, admin-гейт AUTOPILOT, безопасный pairing-код.

## Что сделано (файлы + коммиты)

- `permission-middleware.ts` — вызовы без `agentId` больше не получают автоматический allow: только read-инструменты, остальные требуют approval; `authorizationService: allow` считается явным системным принципалом.
- `agems-approval-service.ts` — `setPreset`/`updatePolicy` требуют `callerRole: 'admin'` для `AUTOPILOT`; обход через patch `updatePolicy` закрыт.
- `mobile-access-service.ts` + `ops-types.ts` — pairing-код 8 digits через `crypto.getRandomValues`, TTL 5 минут, лимит 5 попыток, constant-time сравнение, новые поля `expiresAt`/`failedAttempts`.
- Тесты: обновлён `permission-middleware.test.ts`, добавлены `agems-approval-service.test.ts` (2 новых) и `mobile-access-service.test.ts`; пути в `test:stable`.

## Принятые решения (+ почему; кандидат в ADR?)

- Default-deny для elevated-инструментов без агента: системные пути должны проходить через явный authz, а не через «разрешить всё».
- `AUTOPILOT` требует роли admin на уровне сервиса — без подключённой authz-модели это fail-closed.
- Pairing-код длиной 8 цифр и TTL — комбинация снижает перебор; constant-time сравнение убирает timing-утечку.

## Обнаруженные проблемы / гипотезы

- Факт: в репозитории нет ни одного внутреннего вызова `setPreset(..., 'AUTOPILOT')`, поэтому ужесточение ничего не ломает.
- Гипотеза: callers, которые всё же включают AUTOPILOT из UI, должны передавать роль через новый `opts` — это потребует отдельного обновления UI-слоя.
- Полный список аудита всё ещё содержит authz-мутации Governance/Agent/Crew — более крупный контур с изменением API.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run` трёх файлов — 10 + 8 + 3 = 21 тест зелёный.
- ESLint на семи файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Governance/Agent/Crew mutations с обязательным callerId; затем WAL EventRecorder и мост EventBus→DLQ.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 1db567a
- Изменённых файлов: 8
  - M package.json
  - M src/kernel/services/agems-approval-service.test.ts
  - M src/kernel/services/agems-approval-service.ts
  - M src/kernel/services/ops/mobile-access-service.ts
  - M src/kernel/services/tool-pipeline/permission-middleware.test.ts
  - M src/kernel/services/tool-pipeline/permission-middleware.ts
  - M src/kernel/types/ops-types.ts
  - ?? src/kernel/services/ops/mobile-access-service.test.ts
- Diff stat:
  - package.json | 4 +--
  - src/kernel/services/agems-approval-service.test.ts | 14 +++++++++
  - src/kernel/services/agems-approval-service.ts | 22 +++++++++++++--
  - src/kernel/services/ops/mobile-access-service.ts | 33 ++++++++++++++++++++--
  - .../tool-pipeline/permission-middleware.test.ts | 12 ++++++--
  - .../tool-pipeline/permission-middleware.ts | 12 +++++++-
  - src/kernel/types/ops-types.ts | 3 ++
  - 7 files changed, 90 insertions(+), 10 deletions(-)
- Последние коммиты:
  - 1db567a fix(races): release locks, await dirty writes, sanitize logs
  - 5ace75b fix(boot): restore failure UI and clear stale factory errors
  - 426b19a docs: add backup and restore guide
  - e089be9 feat(onboarding): enable local mock demo provider
  - ed7fa93 ci: gate mirrored agent skills with SkillEvaluator
