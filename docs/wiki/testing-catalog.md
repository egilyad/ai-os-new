<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Каталог тестов

> Раздел: **Разработчикам** · Статус: verified · Теги: тесты, каталог, покрытие

Источники: `src/kernel/services`, `src/components`, `e2e`

## О «каталоге»

Это обзор ключевых групп и файлов, а не исчерпывающий перечень (файлов ~671).
Полный актуальный список формируется командой:

```powershell
Get-ChildItem -Recurse src -Include *.test.ts,*.test.tsx -File |
  Where-Object { $_.FullName -notmatch 'node_modules' } |
  ForEach-Object { $_.FullName }
```

## Ключевые группы unit-тестов

### Ядро (src/kernel/services)
- **Сервисы дебатов/ривалов** — `debate-runtime/**`, `rivals*/**`: оркестрация,
  фазы, губернатор, интерпретатор, таймлайны, граф аргументов.
- **Сервисы агентов** — `agent-service.test.ts`, `agent-runtime/**`,
  `agent-identity.test.ts`: резолвинг агентов, рантайм, секьюрити-гейты.
- **Бюджет и алерты** — `budget-service.test.ts`, `budget-alert-service.test.ts`.
- **Конфигурация и история** — `config-history.test.ts`, `config-service.test.ts`,
  `config-registry.test.ts`.
- **Директор/сценарии** — `conversation-director-service.runtime.test.ts`,
  `director-demo-seed.test.ts`.
- **Очереди/исполнение** — `execution-queue.test.ts`, `race-executor.test.ts`,
  `chat-executor.test.ts`, `ChatService.autoRouting.test.ts`.
- **Хранилища (DAL)** — `dal/**` на Dexie (`_test-harness`).
- **Утилиты** — `utils/**`: percentile, hash, regex-safe, pii-redact, safe-json и др.
- **Бут-тесты** — `src/tests/boot-smoke.test.ts`, `src/kernel/kernel.test.ts`.

### UI (src/components)
- **Панели** — `*Panel.test.tsx`: рендер, взаимодействие, пустые/ошибочные состояния.
- **Модальные и формы** — `AddKeyModal/**`, `DirectorPanel/**`, `PlannerPanel/**`.
- **Графы/визуализация** — `ArgumentGraphPanel/**`, `DebateRuntimePanel/**`,
  `TracesPanel/**` (VisGraph мокается в setup).
- **Вики** — `WikiPanel/wiki-*.test.ts(x)`: целостность корпуса, поиск, рендер статей.

### E2E (e2e/)
Всего 23 спек-файла; CI запускает их матрицей из 12 шардов
(см. «CI/CD Architecture»), которая покрывает 17 файлов:

- Навигация/роуты: `basic-flow.spec.ts`, `routes-a-flow.spec.ts`,
  `routes-b-flow.spec.ts`;
- Доменные данные (`data-*.spec.ts`, 15): chat, debate, dialogs, fleet, forum,
  health, keys, knowledge, organizer, projects, research, room, runtime, sync,
  sre-health-diagnostics. Из них в CI-матрице участвуют 14 (без
  `data-sre-health-diagnostics.spec.ts`);
- Не входят в стандартную матрицу: `a11y-basic.spec.ts` (доступность),
  `assistant-panel.spec.ts`, `wiki-brain.spec.ts` (вики-поиск),
  `screenshots.spec.ts` и `visual-regression.spec.ts` (демо-скриншоты;
  screenshots гоняется отдельной джобой demos на main).


---

## Связанные материалы

- [Архитектура тестирования](./testing-architecture.md)
- [Статистика тестов](./testing-stats.md)

[← Все материалы](./README.md)
