
3:15 ‎(לפני 10 שעות)‎
אני‫, evgeniygiladov

OpenCode Desktop 1.19.4 можно превратить в ядро расширяемой AI-экосистемы: его V1-ядро поддерживает Skills, кастомные Tools, MCP-серверы, кастомных primary/subagents, permissions и плагины. На слабом AMD E-350 главный принцип — выносить тяжёлую работу в фоновые Node.js-сервисы, индексы и внешние CLI, а OpenCode использовать как оркестратор с минимальным числом одновременно подключённых инструментов. [dev.opencode](http://dev.opencode.ai/v1/docs/tools.md)

## Базовая архитектура

Рекомендуемая экосистема:

```text
OpenCode Desktop 1.19.4
        |
        +-- AGENTS.md / project rules
        +-- Skills (.opencode/skills)
        +-- Agents (.opencode/agents)
        +-- Custom tools (opencode.jsonc)
        +-- MCP servers (local / remote)
        +-- Plugins (.opencode/plugins)
        |
        +-- Sidekick: локальный Node.js-сервис и UI
              |-- реестр Skills / Tools / MCP
              |-- индекс проекта
              |-- память решений
              |-- очередь фоновых задач
              |-- журналы и телеметрия
```

OpenCode V1 поддерживает локальные и удалённые MCP-серверы, а их инструменты появляются у модели наравне со встроенными; при этом каждый сервер увеличивает контекст, поэтому их нужно включать выборочно и по мере необходимости. [dev.opencode](https://dev.opencode.ai/v1/docs/mcp-servers.md)

## Что подтверждено в 1.19.4

| Механизм | Что можно делать | Где размещать | Совместимость |
|---|---|---|---|
| Skills | Загружаемые по требованию инструкции и процедуры в `SKILL.md` | `.opencode/skills/<id>/SKILL.md`, глобально `~/.config/opencode/skills` | Подтверждено для V1.  [dev.opencode](http://dev.opencode.ai/v1/docs/skills.md) |
| Custom tools | Собственные функции, вызываемые моделью; описываются в конфигурации и могут выполнять произвольный код | `opencode.jsonc` | Подтверждено для V1.  [dev.opencode](http://dev.opencode.ai/v1/docs/tools.md) |
| MCP | Подключение внешних инструментов, БД, API и сервисов | `mcp.servers` в `opencode.jsonc` | Подтверждено: local и remote.  [dev.opencode](https://dev.opencode.ai/v1/docs/mcp-servers.md) |
| Agents | Primary- и subagents со своими prompt, моделью, правами и набором инструментов | `.opencode/agents/*.md` или `agent` в конфиге | Подтверждено для V1.  [dev.opencode](https://dev.opencode.ai/v1/docs/agents/) |
| Permissions | Тонкое управление `read`, `edit`, `bash`, MCP, `webfetch`, `skill`, `task` и др. | `permission` глобально и per-agent | Подтверждено для V1.  [dev.opencode](https://dev.opencode.ai/v1/docs/agents/) |
| Plugins | JS/TS-модули с хуками, инструментами, командами и интеграциями | `.opencode/plugins/`, `~/.config/opencode/plugins/`, npm | Подтверждено для V1; в Desktop возможны UI-панели через `./gui-experimental`.  [opencode](https://opencode.school/lessons/plugins/) |
| Subagents | Параллельные и специализированные задачи через `@agent` либо Task tool | Markdown/JSON-конфигурация | Подтверждено.  [dev.opencode](https://dev.opencode.ai/v1/docs/agents/) |

Важно: в V1 `tools` в конфигурации агента помечен как deprecated; для новых конфигураций следует использовать `permission`, который работает и для встроенных, и для MCP/custom tools через wildcard-шаблоны. [dev.opencode](https://dev.opencode.ai/v1/docs/agents/)

## Skills: практическая библиотека

Skills — наиболее дешёвый по ресурсам способ расширения: это Markdown-инструкции, загружаемые только когда модель вызывает native `skill` tool. [dev.opencode](http://dev.opencode.ai/v1/docs/skills.md)

### Рекомендуемый набор

Создайте библиотеку в репозитории SuperAgents OS:

```text
.opencode/skills/
  superagents-os/
    SKILL.md
  windows-powershell/
    SKILL.md
  node-service-patterns/
    SKILL.md
  low-resource-optimization/
    SKILL.md
  code-review/
    SKILL.md
  security-audit/
    SKILL.md
  release-checklist/
    SKILL.md
  debugging-workflow/
    SKILL.md
  docs-writing/
    SKILL.md
```

Пример `SKILL.md`:

```md
---
name: windows-powershell
description: Использовать при работе с PowerShell 5.1, путями Windows, процессами и сервисами SuperAgents OS.
---

# Правила PowerShell 5.1

- Не использовать синтаксис PowerShell 7, если он несовместим с 5.1.
- Для длинных команд использовать здесь-строки и отдельные `.ps1`-скрипты.
- Перед destructive-операциями выводить `WhatIf` или dry-run.
- Проверять свободное место и память перед запуском тяжёлых процессов.
- Не предполагать наличие Bun; использовать Node.js и npm.
```

### Организация Skills

Разделите Skills на четыре типа:

- **Доменные**: архитектура SuperAgents OS, Windows-ограничения, Node-сервисы, MCP.
- **Операционные**: отладка, релизы, тестирование, ревью, миграции.
- **Инструментальные**: как правильно вызывать конкретный custom tool или MCP.
- **Координационные**: как декомпозировать задачу, когда звать исследователя, ревьюера, тестировщика или генератора документации.

Не делайте один «мега-Skill»: модель должна подгружать только нужную процедуру, иначе растёт контекст и падает скорость. [dev.opencode](https://dev.opencode.ai/v1/docs/mcp-servers.md)

## Tools: собственные команды

Custom tools позволяют добавить не просто текстовую инструкцию, а вызываемую моделью функцию с произвольным кодом. Для вашей системы это основной способ создать «системные» операции без изменения самого OpenCode. [dev.opencode](http://dev.opencode.ai/v1/docs/tools.md)

### Приоритетные Tools

| Tool | Назначение | Реализация | Нагрузка |
|---|---|---|---|
| `sa_project_scan` | Быстрый снимок структуры репозитория, зависимостей, точек входа | Node.js + `fast-glob`/`ignore` | Низкая |
| `sa_search_code` | Локальный поиск по индексу вместо повторного чтения файлов | SQLite FTS5 или ripgrep | Низкая/средняя |
| `sa_run_tests` | Запуск только затронутых тестов | Node.js wrapper над npm/test runner | Средняя |
| `sa_git_snapshot` | Создание безопасного commit/patch перед изменениями | `simple-git` или PowerShell/git | Низкая |
| `sa_task_queue` | Постановка фоновой задачи в Sidekick | HTTP API локального Node-сервиса | Низкая |
| `sa_memory_save` | Сохранение решения, ADR, ошибки и исправления | SQLite/JSONL | Низкая |
| `sa_memory_search` | Поиск по прошлым решениям и контексту | SQLite FTS5 | Низкая |
| `sa_docs_query` | Поиск по локальной документации | Индекс Markdown + SQLite | Низкая |
| `sa_windows_diag` | CPU/RAM/диск/процессы/порты | PowerShell или Node `os`, `child_process` | Низкая |
| `sa_mcp_toggle` | Включение/выключение тяжёлых MCP-серверов | Sidekick + конфигурационный реестр | Низкая |

### Пример конфигурации

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "tools": {
    "sa_project_scan": {
      "description": "Собирает безопасный обзор проекта: структура, стек, скрипты, точки входа.",
      "execute": {
        "command": ["node", "./sidekick/tools/project-scan.mjs"]
      }
    },
    "sa_memory_search": {
      "description": "Ищет прошлые архитектурные решения, ошибки и исправления.",
      "execute": {
        "command": ["node", "./sidekick/tools/memory-search.mjs"]
      }
    }
  }
}
```

Точная схема custom tool зависит от установленной V1-схемы; перед реализацией проверьте её через локальную документацию или `$schema` в вашем `opencode.jsonc`. Сам принцип подтверждён: custom tools объявляются в конфигурации и могут выполнять произвольный код. [dev.opencode](http://dev.opencode.ai/v1/docs/tools.md)

## MCP: минимальный набор

MCP — правильный слой для внешних систем, но на E-350 не стоит держать много серверов постоянно включёнными: документация прямо предупреждает, что MCP добавляет контекст, а крупные серверы вроде GitHub могут быстро исчерпать лимит. [dev.opencode](https://dev.opencode.ai/v1/docs/mcp-servers.md)

### Рекомендуемый стартовый профиль

| MCP | Роль | Тип | Режим |
|---|---|---|---|
| Context7 | Актуальная документация библиотек | Remote | Включать по запросу |
| Grep by Vercel | Поиск примеров и паттернов в открытом коде | Remote | Включать по запросу |
| FileSystem / project tools | Контролируемая работа с файлами и командами | Local | Только при необходимости |
| SQLite MCP | Чтение проектной базы знаний и индексов | Local | Включать для задач анализа |
| Playwright MCP | UI-тестирование и автоматизация браузера | Local | Только для e2e-задач |
| Собственный SuperAgents MCP | Единый доступ к Sidekick: память, задачи, индекс, диагностика | Local | Основной |

Пример remote MCP:

```jsonc
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true
    },
    "gh_grep": {
      "type": "remote",
      "url": "https://mcp.grep.app",
      "enabled": false
    }
  }
}
```

Пример локального MCP через Node.js, без Bun:

```jsonc
{
  "mcp": {
    "superagents": {
      "type": "local",
      "command": ["node", "D:/SuperAgents/sidekick/mcp/server.mjs"],
      "cwd": "D:/SuperAgents/sidekick",
      "enabled": true,
      "timeout": 60000
    }
  }
}
```

V1 поддерживает `command`, `cwd`, environment variables, `enabled` и `timeout` для локальных серверов; для remote доступны URL, headers, OAuth и таймауты. [dev.opencode](https://dev.opencode.ai/v1/docs/mcp-servers.md)

## Агенты и мультиагентность

В V1 уже есть primary-агенты `Build` и `Plan`, а также subagents `General` и `Explore`; их можно дополнять собственными агентами в `.opencode/agents/`. Subagents вызываются через `@имя` или автоматически основным агентом, а навигация между parent/child-сессиями поддерживается hotkeys. [dev.opencode](https://dev.opencode.ai/v1/docs/agents/)

### Рекомендуемая команда агентов

| Агент | Режим | Права | Задача |
|---|---|---|---|
| `architect` | subagent | `edit: deny`, `bash: ask` | Проектирование, выбор подхода, ADR |
| `researcher` | subagent | `edit: deny`, `webfetch: ask`, MCP docs | Поиск решений и документации |
| `implementer` | primary/subagent | `edit: ask`, `bash: ask` | Реализация ограниченных изменений |
| `reviewer` | subagent | `edit: deny`, `bash: deny` | Ревью качества, безопасности, архитектуры |
| `tester` | subagent | `edit: deny`, `bash: ask` | Тест-планы и запуск тестов |
| `windows-ops` | subagent | `bash: ask`, `edit: deny` | Диагностика Windows, процессов, сервисов |
| `docs-writer` | subagent | `edit: ask`, `bash: deny` | Документация и README |
| `orchestrator` | primary | `task` только для разрешённых subagents | Декомпозиция и координация |

### Пример агента

```md
---
description: Проводит безопасный code review без изменения файлов.
mode: subagent
temperature: 0.1
permission:
  edit: deny
  bash:
    "*": ask
    "git diff*": allow
    "git log*": allow
  webfetch: deny
---

Ты — reviewer SuperAgents OS.

Проверяй:
- корректность логики и граничные случаи;
- безопасность ввода, путей, команд и секретов;
- потребление памяти и CPU на Windows 10 / AMD E-350;
- совместимость с Node.js и PowerShell 5.1;
- полноту тестов и документации.

Не изменяй файлы. Возвращай конкретные findings с file:line и приоритетом.
```

Для оркестратора можно ограничить `permission.task`, разрешив вызов только доверенных subagents — это снижает риск случайного запуска тяжёлых или небезопасных операций. [dev.opencode](https://dev.opencode.ai/v1/docs/agents/)

## Plugins и Sidekick

Plugins — более мощный слой, чем Skills: они могут подписываться на события, добавлять tools, менять поведение, регистрировать команды и интеграции. OpenCode загружает их из project- или global-каталогов, а Desktop может подхватывать plugin с `./gui-experimental` для панелей, команд и настроек. [opencode](https://opencode.school/lessons/plugins/)

### OpenCode Sidekick: что строить

**Sidekick** стоит сделать не «вторым агентом», а локальной операционной системой вокруг OpenCode:

1. **Node.js daemon** на `localhost`, с HTTP API и WebSocket для событий.
2. **Реестр расширений**: Skills, tools, MCP-профили, команды, переменные окружения.
3. **Индексатор проекта**: инкрементальный индекс файлов, символов, Markdown и решений.
4. **Память разработчика**: SQLite с FTS5: решения, инциденты, ADR, тесты, фрагменты кода.
5. **Очередь задач**: фоновые build, тесты, линтеры, генерация документации.
6. **Диагностика машины**: RAM, CPU, диск, процессы, порты, время запуска.
7. **UI-панель**: Electron или лёгкий локальный web-интерфейс; не обязательно встраивать её в OpenCode.

### Модули Sidekick

| Модуль | Функция | Технология | Приоритет |
|---|---|---|---|
| `registry` | Каталог Skills/tools/MCP с профилями | JSON + SQLite | Высокий |
| `indexer` | Инкрементальный поиск по репозиторию | chokidar + SQLite FTS5 | Высокий |
| `memory` | Долговременная память решений | SQLite + Markdown ADR | Высокий |
| `runner` | Безопасный запуск команд и задач | Node `child_process` | Высокий |
| `mcp-bridge` | Собственный MCP-сервер для Sidekick | `@modelcontextprotocol/sdk` | Высокий |
| `watcher` | События файлов, git, тестов | chokidar + git | Средний |
| `dashboard` | Панель задач, статусов, логов | Local web UI | Средний |
| `desktop-panel` | Панель внутри OpenCode Desktop | Plugin `gui-experimental` | Экспериментально |
| `sandbox` | Изоляция опасных команд и временных окружений | PowerShell jobs / контейнеры при наличии | Средний |

### Собственный MCP-сервер Sidekick

Это ключевая нестандартная идея: сделать **SuperAgents MCP**, который OpenCode видит как обычный набор инструментов, но за которым стоит вся инфраструктура Sidekick.

Возможные tools:

- `sidekick.status` — состояние проекта, памяти, диска, фоновых задач.
- `sidekick.search` — гибридный поиск по коду, документации и памяти.
- `sidekick.remember` — сохранить решение/инцидент/ADR.
- `sidekick.recall` — найти похожие прошлые случаи.
- `sidekick.plan_task` — создать структурированную задачу.
- `sidekick.run_background` — запустить тесты, линтер, индексацию.
- `sidekick.get_artifact` — получить отчёт, лог, diff или результат задачи.
- `sidekick.profile_set` — переключить профиль MCP/tools под задачу.

Это лучше, чем подключать много отдельных MCP: OpenCode получает небольшое число понятных tools, а тяжёлая логика остаётся в Sidekick.

## Контекст, поиск и память

На 11.6 GB RAM и двухъядерном CPU не стоит строить тяжёлый локальный embedding-индекс «на всё». Начните с точного, дешёвого поиска и постепенно добавляйте семантический слой.

### Этап 1: точный контекст

- `ripgrep` для быстрого поиска по коду.
- `ctags` или `tree-sitter`-based индекс символов — только по мере необходимости.
- SQLite FTS5 для Markdown, ADR, логов и заметок.
- `.opencode/rules/` или `AGENTS.md` для стабильных project rules.
- Кэш результатов сканирования, чтобы не пересканировать весь репозиторий на каждый запрос.

### Этап 2: структурная память

Храните не сырые чаты, а атомарные записи:

```json
{
  "type": "decision",
  "title": "Выбор SQLite вместо Postgres для Sidekick",
  "context": "Ограниченная RAM и локальный характер данных",
  "decision": "SQLite + WAL + FTS5",
  "consequences": "Нет сетевого сервиса БД; ограничение на одновременную запись",
  "files": ["sidekick/db/schema.sql"],
  "tags": ["architecture", "database", "low-resource"]
}
```

### Этап 3: семантический слой

Только после стабильной работы точного поиска:

- локальные embeddings малой размерности;
- индексация не всех файлов, а только ADR, README, архитектурных документов, ключевых модулей и summaries;
- пакетная обработка в ночном режиме или вручную;
- отдельный процесс с лимитом памяти.

Это **экспериментальное** направление: на E-350 вероятнее полезнее гибрид «FTS + структурные связи», чем полный векторный поиск по всему коду.

## Автоматизация и workflow

### Workflow «Исследование → план → реализация → ревью»

```text
1. @researcher: собрать ограничения, варианты, риски
2. @architect: подготовить ADR и план изменений
3. Пользователь: утвердить план
4. @implementer: выполнить одну ограниченную задачу
5. @tester: сформировать и запустить проверки
6. @reviewer: проверить diff, безопасность и ресурсы
7. sidekick.remember: сохранить решение и результат
```

### Полезные цепочки

- **Bug triage**: воспроизведение → логи → гипотезы → минимальный patch → regression test.
- **Feature pipeline**: requirements → ADR → task decomposition → implementation → tests → docs → release notes.
- **Performance audit**: измерение → профиль → узкие места → безопасная оптимизация → повторное измерение.
- **Dependency audit**: список пакетов → лицензии/уязвимости → план обновления → тесты.
- **Documentation sync**: изменение кода → обновление README/ADR/API docs → проверка примеров.
- **Incident memory**: ошибка → причина → fix → guardrail → тест → запись в память.

## Интерфейс и UX

### Внешняя панель Sidekick

Сделайте отдельное приложение или локальную web-панель, а не модификацию OpenCode:

- список активных Skills, Tools и MCP-профилей;
- переключение профилей: «код», «исследование», «тестирование», «отладка», «документация»;
- очередь фоновых задач и их логи;
- поиск по памяти и индексу;
- просмотр ADR и решений;
- индикаторы RAM/CPU/диска;
- кнопки «создать task», «запустить workflow», «сделать snapshot».

### Встроенная панель через plugin

OpenCode Desktop поддерживает plugins с `./gui-experimental`, добавляющие panels, commands и settings; это подтверждённая точка расширения Desktop, но её следует считать экспериментальной и проверять непосредственно в 1.19.4. [dev.opencode](https://dev.opencode.ai/docs/plugins)

Практичный первый UI-plugin:

- панель «SuperAgents»;
- команды: `/sa:scan`, `/sa:remember`, `/sa:recall`, `/sa:profile`;
- настройки профилей MCP;
- просмотр очереди Sidekick.

## Профили ресурсов

Создайте несколько конфигурационных профилей, чтобы не держать всё включённым одновременно.

| Профиль | Включено | Отключено | Когда использовать |
|---|---|---|---|
| `minimal` | Встроенные tools, 1–2 Skills | Все MCP, websearch, тяжёлые agents | Правки, чтение, небольшие задачи |
| `coding` | Custom project tools, SQLite memory, 2–3 Skills | Browser MCP, тяжёлые remote MCP | Обычная разработка |
| `research` | Context7, Grep, webfetch/websearch | Local browser, heavy indexers | Выбор технологии, документация |
| `testing` | Test runner, Playwright при необходимости | Remote docs MCP | Прогон и отладка тестов |
| `audit` | Reviewer/security agents, git tools | Edit permissions | Ревью и аудит |
| `background` | Indexer, memory consolidation, docs generation | Интерактивные MCP | Ночью или вручную |

Это особенно важно, поскольку MCP-серверы добавляют контекст, а их инструменты доступны модели автоматически после подключения. [dev.opencode](https://dev.opencode.ai/v1/docs/mcp-servers.md)

## Поэтапный план

### Этап 1 — фундамент, 1–2 дня

1. Создать `opencode.jsonc`, `.opencode/skills`, `.opencode/agents`, `.opencode/plugins`.
2. Добавить 5–7 базовых Skills.
3. Настроить `Plan`, `reviewer`, `researcher`, `implementer`.
4. Включить только Context7 и собственный минимальный MCP.
5. Проверить, что всё запускается через Node.js, а не Bun.

### Этап 2 — Sidekick MVP, 3–7 дней

1. Node.js daemon с HTTP API.
2. SQLite-база: tasks, decisions, errors, snippets.
3. Tools `sa_project_scan`, `sa_memory_save`, `sa_memory_search`, `sa_task_queue`.
4. PowerShell-диагностика RAM/CPU/disk.
5. Простой web-дашборд.

### Этап 3 — индекс и автоматизация, 1–2 недели

1. Инкрементальный индекс кода и Markdown.
2. `sa_search_code` и `sa_docs_query`.
3. Очередь фоновых задач.
4. Workflow-скрипты для bugfix, feature, review и release.
5. Профили ресурсов и переключение MCP.

### Этап 4 — глубокая интеграция, 2–4 недели

1. Собственный MCP `superagents`.
2. Plugin с командами и, при подтверждённой совместимости, Desktop panel.
3. Гибридный поиск: FTS + связи файлов/модулей + ограниченные embeddings.
4. Мультиагентный orchestrator с безопасными task permissions.
5. Журналирование решений и автоматическая генерация ADR.

## Нестандартные идеи

- **Project Time Machine**: Sidekick сохраняет перед каждым существенным изменением snapshot намерения, diff, тестов и результата; позже агент может спросить «почему мы выбрали этот путь».
- **Context Budget Manager**: перед запуском задачи Sidekick оценивает размер контекста и предлагает отключить часть MCP или использовать subagent.
- **Tool Cost Ledger**: журнал вызовов tools, длительности, памяти и полезности; на его основе OpenCode предлагает более дешёвый путь.
- **Failure Pattern Library**: каждая ошибка превращается в структурированную запись «симптом → причина → fix → prevention».
- **Agent Contracts**: перед передачей задачи subagent получает machine-readable contract: вход, ожидаемый artifact, ограничения, критерии приёмки.
- **Resource Guardrail**: custom tool блокирует запуск, если свободной RAM или диска недостаточно для операции.
- **Skill Compiler**: Sidekick превращает длинные чаты в компактные Skills: «как мы делаем X в этом проекте».
- **MCP Circuit Breaker**: если MCP-сервер зависает или потребляет слишком много времени, Sidekick временно отключает профиль и переключает агента на локальный fallback.
- **Decision Graph**: связи между ADR, файлами, тестами и инцидентами; агент видит не просто текст, а причинно-следственную карту проекта.
- **Offline Research Cache**: кэш документации и web-исследований в SQLite, чтобы повторно не тратить сеть и токены.

## Главный ответ

OpenCode 1.19.4 можно развивать очень далеко, если воспринимать его не как конечную IDE, а как **агентное ядро с расширяемой периферией**. Реалистичный потолок — не «новая версия OpenCode», а собственная система: Sidekick хранит знание и управляет ресурсами, MCP даёт доступ к внешним системам, custom tools выполняют доменную логику, Skills передают процедуры, а agents распределяют работу. [dev.opencode](http://dev.opencode.ai/v1/docs/tools.md)

Для вашего железа оптимальна стратегия **«маленькое ядро OpenCode + умный локальный Sidekick + включаемые по требованию MCP»**: она даёт современную функциональность — память, поиск, автоматизацию, мультиагентность и UI — без апгрейда OpenCode и без перегрузки AMD E-350.
