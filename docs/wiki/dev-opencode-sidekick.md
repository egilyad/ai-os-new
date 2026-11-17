<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# OpenCode Sidekick: шпаргалка по командам и центр управления

> Раздел: **Разработчикам** · Статус: documented · Теги: dev, opencode, sidekick, инструменты, шпаргалка

Источники: `AGENTS.md`, `.opencode/command/`, `src/kernel/services/assistant/assistant-ops-actions.ts`

## Что это

**OpenCode Sidekick** — лёгкое внешнее приложение рядом с OpenCode Desktop: карточки команд
(название, описание, «когда использовать», уровень риска, точная команда), поиск по всем полям,
категории, избранное, история и копирование одной кнопкой. Не является частью SuperAgents OS —
это независимый локальный инструмент (папка вне репозитория), который из «шпаргалки» превратился
в центр управления экосистемой OpenCode: память решений (SQLite), авто-ADR, профили ресурсов,
MCP-сервер для OpenCode и диагностика машины.

## Зачем

Пользователю не нужно помнить команды: Sidekick показывает их в виде понятных карточек и позволяет
копировать готовую строку или отправлять её в выбранную сессию OpenCode. Плюс — единая точка
входа к долговременной памяти и переключению режимов работы OpenCode.

## Функции

- Реестр команд — отдельный файл `commands.json` (id, title, category, description, usage, command,
  parameters, riskLevel, executionType, enabled, favorite). Новые команды добавляются без правки UI.
- Поиск по названию/описанию/категории/команде; фильтры-чипсы по категориям.
- Кнопка «Копировать команду» с подстановкой параметров, если они заполнены.
- Подключение к OpenCode: обнаружение локального сервера (netstat + tasklist), выбор сессии,
  отправка slash-команд (`POST /session/:id/command`) и prompt (`prompt_async`).
- Шпаргалка работает без сервера: при отсутствии API реестр грузится из локального
  `public/commands.json`.
- Память (SQLite, `node:sqlite`): записи типов decision/error/snippet/task/note с тегами,
  поиск, фильтр, удаление — вкладка «Память» (API: `GET/POST /api/memory`, `DELETE /api/memory/:id`).
- Авто-ADR: при сохранении записи типа `decision` Sidekick создаёт файл `docs/NNN-slug.md`
  в репозитории (шаблон ADR: Context/Decision/Consequences) и возвращает путь в ответе.
- Система: диагностика машины — RAM, CPU, диск, топ-8 процессов (вкладка «Система»; `GET /api/system`).
- Профили ресурсов: наборы включения/выключения MCP-серверов (`minimal`/`coding`/`research`/
  `testing`/`full`) через `profiles.mjs` или выпадающий список в шапке UI; перед изменением
  конфига создаётся резервная копия `opencode.jsonc.bak`.
- MCP-сервер `mcp.mjs` (stdio, JSON-RPC 2.0, без внешних зависимостей): инструменты
  `sidekick.recall` (поиск по памяти), `sidekick.remember` (сохранение), `sidekick.status`
  (диагностика) — подключается к OpenCode как MCP-сервер `superagents`.
- Живые события: `GET /api/events` (SSE) транслирует события сессий OpenCode при наличии токена;
  в UI — блок «Живые события» (до 30 записей).
- Команда `/remember` (глобальная, `~/.config/opencode/commands/remember.md`): сохранение
  решения прямо из чата OpenCode; плагин `remember-direct.js` перехватывает её и пишет в БД
  напрямую, без вызова модели.

## Запуск

```powershell
cd C:\Users\evgeny\Desktop\New folder\opencode-sidekick
npm start          # или node server.mjs
```

Открой `http://127.0.0.1:4517`. Автозапуск — `autostart-sidekick.bat` (папка `shell:startup`).

## Ограничения

- Для фактической отправки в OpenCode нужен токен/пароль (Basic auth): Desktop не публикует свой
  токен наружу. Без него доступен режим шпаргалки (просмотр и копирование); SSE-события тоже
  требуют токена.
- Активная вкладка Desktop публичным API надёжно не определяется — Sidekick требует явного выбора
  сессии (проект/название/id).
- Плагины OpenCode (в т.ч. `remember-direct.js`, `context-compressor.js`, `resource-guardrail.js`)
  загружаются только при полном старте процесса OpenCode — после их изменения нужен рестарт.

## Связанное

- Команды проекта (AGENTS.md, `.opencode/command/`) — [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md).
- GitHub-настройки (MCP, команды, агент) — [GitHub workflow: MCP, команды и автономия](./dev-github-workflow.md).
- Реестр ADR и правила их ведения — [Реестр архитектурных решений (ADR)](./dev-adr.md).

---

## Связанные материалы

- [Память OpenCode: команды и скрипты непрерывности сессий](./dev-opencode-memory.md)
- [GitHub workflow: MCP, команды и автономия](./dev-github-workflow.md)
- [Computer Use: управление рабочим столом Windows (desk-mcp)](./dev-computer-use.md)
- [MCP-инструменты OpenCode: сводный каталог](./dev-mcp-tools.md)

[← Все материалы](./README.md)
