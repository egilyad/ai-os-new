# 2026-11-25 — assistant-veto

Статус: done

## Цель сессии

Распространить veto-проверку на ответы ассистента с поверхностью `assistant`.

## Что сделано (файлы + коммиты)

- `AssistantServiceDeps.vetoGate?` — та же необязательная зависимость, что и в чате.
- Перед `ASSISTANT_DONE` проверяется итоговый текст; при совпадении эмитится `chat:veto` с `surface: 'assistant'`, `NOTIFICATION`, и возвращается blocked-content без записи experience.
- Зависимость подключена в `phase78-assistant.ts`; тест добавлен в `assistant-service.test.ts` и в `test:stable`/`test:coverage`.

## Принятые решения (+ почему; кандидат в ADR?)

- Проверка идёт после `redactPii`, чтобы запрет сравнивался с тем, что реально увидит пользователь.
- При блокировке не пишется experience/diary: запрещённый ответ не должен попадать в память ассистента.
- Единый контракт `vetoGate` для чата и ассистента — duplication интерфейса минимальна, но сервис один.

## Обнаруженные проблемы / гипотезы

- Факт: UIExceptionsPanel показывает только активные шаблоны; счётчик срабатываний всё ещё не отображается.
- Гипотеза: общий интерфейс `vetoGate` стоит вынести в `kernel/contracts`, чтобы не дублировать его в двух deps.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run assistant-service.test.ts` — зелёный; ESLint — 0 замечаний.
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

Вынести общий контракт `IVetoGate` в `kernel/contracts` и показать счётчик срабатываний в ExceptionsPanel.

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ b4f5b6c
- Изменённых файлов: 4
  - M package.json
  - M src/kernel/service-registration/phase78-assistant.ts
  - M src/kernel/services/assistant/assistant-service.test.ts
  - M src/kernel/services/assistant/assistant-service.ts
- Diff stat:
  - package.json | 4 +--
  - .../service-registration/phase78-assistant.ts | 2 ++
  - .../services/assistant/assistant-service.test.ts | 32 ++++++++++++++++++++++
  - src/kernel/services/assistant/assistant-service.ts | 30 ++++++++++++++++++++
  - 4 files changed, 66 insertions(+), 2 deletions(-)
- Последние коммиты:
  - b4f5b6c feat(metrics): count veto triggers per surface and template
  - 3049f70 feat(veto): emit chat:veto event for blocked responses
  - 5894184 feat(veto): post-check assistant output against exception templates
  - ee56306 feat(lenses): unify stack compilation between UI and runtime
  - af99c96 fix(skills): remove scanner-triggering command literals
