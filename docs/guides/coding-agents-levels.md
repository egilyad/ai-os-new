# Coding agents: уровни автономности (L1–L5)

> Гайд из «Настройки coding agents» адаптирован к стеку SuperAgents OS
> (OpenCode + AGEMS Tasks + Assistant planner + Government approvals).

## Уровни

| Уровень | Поведение                                                   | Как в нашем стеке                                                         |
| ------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| L1      | Интерактивная разработка под руководством человека          | Обычные сессии OpenCode, команды `/`, ручные правки                       |
| L2      | Автономная работа с заданиями и запросами к задачам         | AGEMS Tasks MCP/REST + `tasks.create/claim/next`, ручные переходы         |
| L3      | Долгоживущие цели: Roadmap, ревью, поиск, итерации          | Assistant `plan.create/run/step`, «wiki.research», `graph.potential`      |
| L4      | Полная автономия с контролем через approvals                | `agent.restart`/`task.retry`/`profile.switch` через approvals (tool:exec) |
| L5      | Долгосрочная автономия по приоритетам, блокерам, чекпойнтам | Autonomy Governor: `AUTONOMOUS_PROGRESS.md` + Plan-loop + watchdogs       |

## Процесс по Roadmap

- Ведение `AUTONOMOUS_PROGRESS.md`: Current phase / Completed / In progress / Pending / Blockers / Last checkpoint.
- Ревью статей и прогресса в `/checkpoint` и `/status`.
- Ограничения: лимит задач на сессию, частота коммитов, чекпойнты, approval-политика.
- Формат отчёта: кратко, ссылками на `файл:строка`.
