# OpenCode Research — подключение к SuperAgents OS

> Дата: 2026-09-09. Этап T4. Только исследование, кода нет. Источник: opencode.ai/docs (09.09.2026).

## 1. Что такое локальный opencode (факты)
- Open source AI coding agent: TUI, desktop, IDE-расширение, CLI. Установка: `npm i -g opencode-ai`, brew, choco/scoop, docker, бинарь.
- **Windows: официально рекомендуют WSL** — нативный Windows поддерживается частично (scoop/choco есть, Bun-поддержка «in progress»).
- Провайдеры: 75+ через AI SDK + Models.dev, ключи в `~/.local/share/opencode/auth.json` (`/connect`), плюс OpenCode Zen/Go (подписка), плюс **локальные модели** через OpenAI-совместимые рантаймы: Ollama (`localhost:11434/v1`), LM Studio (`1234/v1`), llama.cpp (`8080/v1`), Atomic Chat (`1337/v1`) — кастомный провайдер в `opencode.json` (`npm: @ai-sdk/openai-compatible`, `baseURL`, `models`).
- **HTTP server**: `opencode serve [--port 4096] [--hostname 127.0.0.1] [--cors ...]`, auth `OPENCODE_SERVER_PASSWORD` (basic, user `opencode`), OpenAPI 3.1 на `/doc`, есть JS/Python SDK. TUI — тоже клиент к этому серверу.
- **Ключевые API**: `GET /global/health`, `GET /provider`, `POST /session` (create), `POST /session/:id/message` (send+wait, body `{model?, agent?, parts}`), `POST /session/:id/prompt_async` (204, без ожидания), `GET /session/:id/diff`, `POST /session/:id/abort`, `GET /event` (SSE), `GET /agent`, `POST /mcp` (добавить MCP динамически), `PUT /auth/:id`.
- Агенты/скиллы/команды/MCP/ACP/LSP — конфигурируются, есть Plan/Build режимы, permissions/policies.

## 2. Что это значит для нас
opencode — это **готовый исполнитель кодовых задач с HTTP API**, а не LLM-провайдер в нашем смысле (у него НЕТ OpenAI-совместимого `/v1/chat/completions` — только sessions/messages API). Отсюда два честных варианта.

## 3. Вариант A — «opencode как провайдер моделей»
**Идея:** ходить за инференсом в локальный opencode вместо groq/gemini.
**Как технически:** нового `OpencodeAdapter` в `provider-adapter-registry` (`src/llm/registry/adapter-factory.ts`), маппинг `sendMessage(msgs, model, key)` → `POST /session` + `POST /session/:id/message` + парсинг `{info, parts}`; ключ = пароль сервера (`OPENCODE_SERVER_PASSWORD`).
**Проблемы (честно):**
1. opencode отдаёт **агентский ответ** (текст + диффы + tool-calls), а не чистый chat-completion — для дебатов/фактчека это чужой формат, придётся вырезать текст из parts.
2. Каждая реплика = сессия или переиспользование сессии — latency выше, чем прямой adapter.
3. Локальный процесс `opencode serve` должен быть поднят (lifecycle, Windows→WSL).
4. Двойная оплата/ключи: opencode сам ходит в свои провайдеры (Zen/ключи) — экономии ноль, только +хоп.
**Вердикт варианта:** слабый. Локальные модели дешевле брать напрямую через Ollama/LM Studio OpenAI-совместимым адаптером (у нас `OpenAiCompatibleAdapter` уже есть) — без opencode посередине.

## 4. Вариант B — «opencode как агент-исполнитель»
**Идея:** Fleet/дебаты/teams делегируют кодовые подзадачи живому opencode: «реализуй X в репо Y» → вернуть дифф + саммари.
**Как технически:**
1. Новый `opencodeClientService` (phase, по образцу `nvidiaEnterpriseService`): `ensureServer()` (health-check `:4096/global/health`, иначе подсказка поднять), `runTask({cwd, prompt, model?, agent?})` → `POST /session` + `prompt_async` + poll `/session/:id/message` или SSE `/event`, `abort`, `diff`.
2. Точка входа: `coordinationService` (phase28, уже оркестрирует внешнее) или `teamCollaborationService` / новый таб в Fleet.
3. Контракты: вход `{task, repoPath, model, timeoutMs}` → выход `{diff: FileDiff[], summary, status}`; секреты — только пароль сервера в keyService, никогда код/ключи в промптах сверх нужного.
4. Permissions: запускать opencode с ограниченными permissions/policies (docs: `/docs/permissions`, `/docs/policies`), рабочая директория = клон/копия, не боевой репо.
**Плюсы:** настоящий coding-исполнитель, диффы из коробки, MCP/LSP/тесты внутри opencode, SSE-стриминг прогресса.
**Риски:** локальный процесс (WSL на Windows!), версия API дрейфует (experimental endpoints), долгие задачи (таймауты/await), изоляция (opencode правит файлы — только в песочнице/копии).

## 5. Рекомендация
- **Вариант A — отклонить.** Не даёт ничего сверх прямого Ollama-адаптера, добавляет хоп и форматную возню.
- **Вариант B — пилотировать**, но ПОСЛЕ T0–T3: сначала панель ротации + привязки + карточка (там появятся естественные кнопки «поручить opencode»), потом тонкий `opencodeClientService` + одна кнопка в Teams/Fleet + песочница.
- Предусловия пилота: `opencode serve` поднят (на Windows — в WSL), `OPENCODE_SERVER_PASSWORD` в keyService, тестовая копия репо.

## 6. Вопросы на решение (твои)
1. Есть ли машина/WSL где крутить `opencode serve` постоянно, или только по требованию?
2. Какие задачи первыми отдадим (рефакторы, тесты, доки)?
3. Песочница: копия репо + ручной merge, или доверяем прямую запись с `/undo`?

**STOP — T4 done (документ). Кода нет, GO на реализацию не даю сам.**
