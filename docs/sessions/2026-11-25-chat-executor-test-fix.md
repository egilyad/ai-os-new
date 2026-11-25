# 2026-11-25 — chat-executor-test-fix

Статус: done

## Цель сессии

Починить падение `chat-executor.test.ts` (unexpected worker exit / heap OOM), воспроизводившееся на чистом HEAD.

## Что сделано (файлы + коммиты)

- **Продакшн-баг**: в 429-ветке `ChatExecutor` добавлял fallback-провайдера в `excludedProviders` и тут же делал его текущим; на следующей итерации `resolveWithFallback()` возвращал того же провайдера → бесконечный цикл и OOM. Удалено исключение из `excludedProviders` перед переходом.
- **Тест stale cleanup**: заменены spin-ожидания на `setImmediate` под fake timers (никогда не завершались) на промис-флаш; добавлен `finally` с `vi.useRealTimers()`.
- **Тест 429**: убран `Object.assign` на `DOMException.name` — в Node 24 это getter-only и давало uncaught exception.
- `chat-executor.test.ts` добавлен в `test:stable` и `test:coverage`.

## Принятые решения (+ почему; кандидат в ADR?)

- Исключать нужно только уже attempt-нутого провайдера; fallback становится текущим, но не помечается как исключённый до своей попытки.
- Оползневые таймеры в fake-time тесте теперь гарантированно снимаются через `finally`.

## Обнаруженные проблемы / гипотезы

- Факт: OOM исходил не от stale-теста, а от теста retry 429; подтверждено изоляцией `-t`.
- Гипотеза: тот же паттерн (fallback immediately excluded) может существовать в других сервисах — проверить отдельно.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run chat-executor.test.ts` (threads и forks) — 25/25, exit 0; `+ ChatService.autoRouting.test.ts` — 2 файла зелёные.
- ESLint — 0 замечаний. Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Разобрать P0 из UX-аудита `~/Downloads/ai-os-new-ux-audit.md`: Details→delete в TeamsTab и HITL-bypass в AgentTasksPanel.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ d34a48c
- Изменённых файлов: 3
  - M package.json
  - M src/kernel/services/chat-executor.test.ts
  - M src/kernel/services/chat-executor.ts
- Diff stat:
  - package.json | 4 ++--
  - src/kernel/services/chat-executor.test.ts | 36 +++++++++++++++----------------
  - src/kernel/services/chat-executor.ts | 1 -
  - 3 files changed, 19 insertions(+), 22 deletions(-)
- Последние коммиты:
  - d34a48c feat(veto): shared contract and trigger counter in panel
  - c78f16f feat(veto): check assistant output before publishing
  - b4f5b6c feat(metrics): count veto triggers per surface and template
  - 3049f70 feat(veto): emit chat:veto event for blocked responses
  - 5894184 feat(veto): post-check assistant output against exception templates
