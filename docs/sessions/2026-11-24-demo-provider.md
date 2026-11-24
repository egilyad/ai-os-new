# 2026-11-24 — demo-provider

Статус: done

## Цель сессии

Э2.4 единого роадмапа: первый результат без настройки API-ключей (демо-провайдер).

## Что сделано (файлы + коммиты)

- `src/kernel/utils/demo-mode.ts` — `buildDemoKey()` (provider `mock`, модель `mock-model-v1`, без секрета) и `isDemoKey()`; 2 теста.
- `GetStartedPanel` — кнопка «Try demo» (RU/EN-ключи); вызывает `onEnableDemo` и переводит в чат; 1 тест.
- `DashboardPanel` — обработчик создаёт демо-ключ через `useKeyStore.addKey` и эмитит NOTIFICATION; повторное нажатие не дублирует ключ.
- Единый роадмап — Э2.4 обновлена.

## Принятые решения (+ почему; кандидат в ADR?)

- Использован уже существующий `MockAdapter` в фабрике адаптеров (`case 'mock'`) — новый провайдер не создавался.
- Демо-ключ добавляется через обычный `addKey`, поэтому проходит все обычные проверки стора и попадает в экспорт/импорт.
- Кнопка показывается только на чистом профиле (панель «Get started»), чтобы не засорять интерфейс после настройки ключей.

## Обнаруженные проблемы / гипотезы

- Факт: `MockAdapter` намеренно отсутствует в публичном каталоге провайдеров — для демо это нормально, но пользователь не увидит его в списке провайдеров.
- Гипотеза: нужно явно помечать демо-ключ в UI как «local mock» и предлагать удалить его после добавления реального ключа.
- E2E-сценарий с таймаутом/отменой ещё не написан.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `vitest run demo-mode.test.ts i18n-keys.test.ts DashboardPanel.test.tsx` — 18/18; `GetStartedPanel.test.tsx` — 1/1.
- ESLint — 0 ошибок (15 предсуществующих предупреждений).
- Полный typecheck/E2E не запускались локально — оставить CI.

## Следующий логический шаг

E2E: первый запуск → таймаут провайдера → отмена → чтение истории после перезагрузки; затем Э3.3 (SSoT) и Э3.4 (релиз/бэкап).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ ed7fa93
- Изменённых файлов: 8
  - M package.json
  - M src/components/DashboardPanel/DashboardPanel.tsx
  - M src/components/DashboardPanel/GetStartedPanel.tsx
  - M src/i18n/translations/en/common.ts
  - M src/i18n/translations/ru/common.ts
  - ?? src/components/DashboardPanel/GetStartedPanel.test.tsx
  - ?? src/kernel/utils/demo-mode.test.ts
  - ?? src/kernel/utils/demo-mode.ts
- Diff stat:
  - package.json | 4 ++--
  - src/components/DashboardPanel/DashboardPanel.tsx | 11 +++++++++++
  - src/components/DashboardPanel/GetStartedPanel.tsx | 21 ++++++++++++++++++++-
  - src/i18n/translations/en/common.ts | 1 +
  - src/i18n/translations/ru/common.ts | 1 +
  - 5 files changed, 35 insertions(+), 3 deletions(-)
- Последние коммиты:
  - ed7fa93 ci: gate mirrored agent skills with SkillEvaluator
  - 2cb21f6 docs: record skill quality uplift to grade A
  - b2b31cc docs: record SkillEvaluator pilot results
  - cb2594a docs: add NVIDIA SkillEvaluator wiki article
  - c554ea7 fix(a11y): keyboard access to permission matrix cells
