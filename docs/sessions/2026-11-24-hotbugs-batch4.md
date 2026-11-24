# 2026-11-24 — hotbugs-batch4

Статус: done

## Цель сессии

Четвёртый пакет hot-фиксов: мост EventBus→DLQ, WAL как диагностика и callerId в мутациях Governance.

## Что сделано (файлы + коммиты)

- `event-bus.ts` — `setDeadLetterSink()` и отправка дропнутых событий в `IDeadLetterQueue`; `phase1-foundation.ts` подключает `DeadLetterQueueService` как sink.
- `event-recorder.ts` — события из WAL больше не вливаются в авторитетный лог и не пишутся в Dexie; они доступны через `getRecoveredFromWal()` как диагностика (в WAL лежат санитизированные/урезанные копии).
- `governance-service.ts` — `grantCapability`, `addPolicy`, `setPolicyEnabled`, `assignRole` требуют `callerId`; при наличии `IAuthorizationService` вызывается `assertAllowed`.
- Тесты: новый в `event-bus.test.ts`, обновлён `governance-service.test.ts`; путь governance добавлен в `test:stable`.

## Принятые решения (+ почему; кандидат в ADR?)

- WAL-копии не являются полными данными — восстановление в авторитетный лог портило бы аудит, поэтому они изолированы.
- DLQ-bridge fire-and-forget: шина синхронная, персистентность асинхронная; ошибка записи не должна ломать выброс события.
- `callerId` обязателен даже без подключённой authz — fail-closed по умолчанию; authz усиливает проверку.

## Обнаруженные проблемы / гипотезы

- Факт: у `AgentService`/`CrewService` по-прежнему нет callerId в мутациях — больший контур, чем Governance.
- Гипотеза: tenant-скоупинг HTTP API и CSAM-модерация требуют продуктовых решений и отдельного цикла.
- `getRecoveredFromWal()` пока без UI — только диагностический API.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run event-bus.test.ts governance-service.test.ts` — 37 + 5 тестов зелёные.
- ESLint на шести файлах — без замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Agent/Crew mutations с callerId; затем tenant-скоупинг HTTP API.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 027f8ed
- Изменённых файлов: 7
  - M package.json
  - M src/kernel/events/event-bus.test.ts
  - M src/kernel/events/event-bus.ts
  - M src/kernel/service-registration/phase1-foundation.ts
  - M src/kernel/services/event-sourcing/event-recorder.ts
  - M src/kernel/services/trust/governance-service.test.ts
  - M src/kernel/services/trust/governance-service.ts
- Diff stat:
  - package.json | 4 +-
  - src/kernel/events/event-bus.test.ts | 19 ++++++++
  - src/kernel/events/event-bus.ts | 11 +++++
  - .../service-registration/phase1-foundation.ts | 2 +
  - .../services/event-sourcing/event-recorder.ts | 23 ++++------
  - .../services/trust/governance-service.test.ts | 15 ++++--
  - src/kernel/services/trust/governance-service.ts | 53 +++++++++++++++++-----
  - 7 files changed, 97 insertions(+), 30 deletions(-)
- Последние коммиты:
  - 027f8ed fix(authz): deny implicit system calls, gate AUTOPILOT, secure pairing
  - 1db567a fix(races): release locks, await dirty writes, sanitize logs
  - 5ace75b fix(boot): restore failure UI and clear stale factory errors
  - 426b19a docs: add backup and restore guide
  - e089be9 feat(onboarding): enable local mock demo provider
