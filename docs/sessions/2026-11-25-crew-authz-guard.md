# 2026-11-25 — crew-authz-guard

Статус: done

## Цель сессии

Ре-аудит P0-7 (часть): mutate-операции CrewService без авторизации.

## Что сделано (файлы + коммиты)

- `CrewServiceDeps.authorization?: IAuthorizationService`; `assertMutationAllowed()` вызывается до мутаций `createCrew`, `deleteCrew`, `addRole`, `removeRole`, `addTask`, `startCrew`, `abortCrew`.
- Все эти методы получили опциональный `callerId` (по умолчанию системный принципал).
- `phase23-crew.ts` подключает `authorizationService`, если он зарегистрирован.
- Тест `crew-service.authz.test.ts`: deny блокирует запись; без authz локальный режим работает как раньше.

## Принятые решения (+ почему; кандидат в ADR?)

- Guard опциональный: в local-first режиме без DI authorizationService поведение не меняется.
- Проверка идёт до любой записи/старта, чтобы denied-запрос не оставлял сайд-эффект.
- `actorType: 'service'` для системных вызовов без callerId; роль admin проверяется authz-правилами.

## Обнаруженные проблемы / гипотезы

- Факт: `AgentService` мутации синхронные — добавить async authz без смены публичного API нельзя; остаётся открытым.
- Гипотеза: для AgentService нужен отдельный эпик с переводом мутаций на async-guard или синхронный guard через кэш решений.
- ESLint: 0 ошибок; 3 теста зелёные.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run crew-service.authz.test.ts boot-smoke.test.ts` — 3/3; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

P0-9: токены в localStorage (sessionStorage уже применён к browser-use/gateway secrets) — проверить остальные места.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 94efaab
- Изменённых файлов: 3
  - M src/kernel/service-registration/phase23-crew.ts
  - M src/kernel/services/crew/crew-service.ts
  - ?? src/kernel/services/crew/crew-service.authz.test.ts
- Diff stat:
  - src/kernel/service-registration/phase23-crew.ts | 3 ++
  - src/kernel/services/crew/crew-service.ts | 39 ++++++++++++++++++++-----
  - 2 files changed, 35 insertions(+), 7 deletions(-)
- Последние коммиты:
  - 94efaab fix(sidecar): block internal networks and DNS rebinding
  - 9f4125b fix(memory-worker): keep message chain alive after errors
  - 03e8648 fix(data): clear every Dexie table in clearAllData
  - f89235d feat(sse): support Last-Event-ID replay and tenant filtering
  - 02545ff refactor(groq): route requests through shared HTTP stack
