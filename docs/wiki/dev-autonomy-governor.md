<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Autonomy Governor: автономная работа по плану

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, autonomy, roadmap, агенты, прогресс

Источники: `scripts/opencode/autonomy-state.mjs`, `scripts/opencode/autonomy-next.mjs`, `.opencode/command/autonomy-status.md`, `.opencode/command/autonomy-next.md`, `.opencode/command/autonomy-complete.md`, `docs/UNIFIED_PLAN.md`

## Что это

**Autonomy Governor** — слой автономной работы поверх существующих devtools: OpenCode-памяти, контрольных точек (`docs/sessions/`), задач AGEMS и плана `docs/UNIFIED_PLAN.md`. Позволяет агенту работать по плану без постоянных вопросов «Продолжаем?».

## Уровни автономности

- **L1** — исполнитель одной задачи.
- **L2** — несколько задач подряд.
- **L3** — автономный разработчик: читает план, планирует, пишет код, проверяет, чинит ошибки.
- **L4** — автономная команда агентов.
- **L5** — автономный процесс с восстановлением состояния.

## Режимы

| Режим | Поведение |
| --- | --- |
| `step-by-step` | одна задача → проверка → отчёт → ожидание |
| `batch` | пакет связанных задач → проверки → коммит |
| `full-autonomous` | весь план, самостоятельный переход между задачами |

## Файл прогресса

`AUTONOMOUS_PROGRESS.md` (корень репо): режим, текущая фаза, `Completed`, `In progress`, `Pending`, `Blockers`, `Last checkpoint`.

## Команды

| Команда | Назначение |
| --- | --- |
| `/autonomy-status` | Показать состояние прогресса |
| `/autonomy-next` | Предложить следующую задачу из UNIFIED_PLAN.md |
| `/autonomy-complete <задача>` | Отметить задачу выполненной |

## Скрипты

- `autonomy-state.mjs` — чтение/обновление `AUTONOMOUS_PROGRESS.md` (`--mode`, `--complete`, `--start`, `--blocker`, `--checkpoint`, `--phase`).
- `autonomy-next.mjs` — парсит план и находит первый незавершённый пункт.

## Цикл работы

1. `/autonomy-next` — получить следующую задачу.
2. Выполнить задачу (код, проверки через `/check`).
3. `/checkpoint` — зафиксировать состояние.
4. `/autonomy-complete "<задача>"` — отметить выполненной.
5. Повторить (в режиме batch/full-autonomous — без остановки).

---

## Связанные материалы

- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [Obsidian Vault: рабочий буфер пользователя (интеграция)](./dev-obsidian-vault.md)
- [AGEMS Tasks: статус реализации (M0–M5)](./dev-tasks-agems-progress.md)
- [Разработчикам: обзор и слои](./dev-overview.md)

[← Все материалы](./README.md)
