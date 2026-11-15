<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# OpenCode Sidekick: шпаргалка по командам и центр управления

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, opencode, sidekick, инструменты, шпаргалка

Источники: `AGENTS.md`, `.opencode/command/`, `src/kernel/services/assistant/assistant-ops-actions.ts`

## Что это

**OpenCode Sidekick** — лёгкое внешнее приложение рядом с OpenCode Desktop: карточки команд
(название, описание, «когда использовать», уровень риска, точная команда), поиск по всем полям,
категории, избранное, история и копирование одной кнопкой. Не является частью SuperAgents OS —
это независимый локальный инструмент (папка вне репозитория).

## Зачем

Пользователю не нужно помнить команды: Sidekick показывает их в виде понятных карточек и позволяет
копировать готовую строку или отправлять её в выбранную сессию OpenCode.

## Функции

- Реестр команд — отдельный файл `commands.json` (id, title, category, description, usage, command,
  parameters, riskLevel, executionType, enabled, favorite). Новые команды добавляются без правки UI.
- Поиск по названию/описанию/категории/команде; фильтры-чипсы по категориям.
- Кнопка «Копировать команду» с подстановкой параметров, если они заполнены.
- Подключение к OpenCode: обнаружение локального сервера (netstat + tasklist), выбор сессии,
  отправка slash-команд (`POST /session/:id/command`) и prompt (`prompt_async`).
- Шпаргалка работает без сервера: при отсутствии API реестр грузится из локального
  `public/commands.json`.

## Запуск

```powershell
cd C:\Users\evgeny\Desktop\New folder\opencode-sidekick
npm start          # или node server.mjs
```

Открой `http://127.0.0.1:4517`.

## Ограничения

- Для фактической отправки в OpenCode нужен токен/пароль (Basic auth): Desktop не публикует свой
  токен наружу. Без него доступен режим шпаргалки (просмотр и копирование).
- Активная вкладка Desktop публичным API надёжно не определяется — Sidekick требует явного выбора
  сессии (проект/название/id).

## Связанное

- Команды проекта (AGENTS.md, `.opencode/command/`) — [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md).
- GitHub-настройки (MCP, команды, агент) — [GitHub workflow: MCP, команды и автономия](./dev-github-workflow.md).

---

## Связанные материалы

- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [GitHub workflow: MCP, команды и автономия](./dev-github-workflow.md)
- [Computer Use: управление рабочим столом Windows (desk-mcp)](./dev-computer-use.md)
- [MCP-инструменты OpenCode: сводный каталог](./dev-mcp-tools.md)

[← Все материалы](./README.md)
