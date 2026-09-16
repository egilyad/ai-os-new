# Phase Y — Топ кодинг-агентов: pi/Zed/Warp/gpt-engineer + goose/continue/Tabby + gpt-pilot/Void/Crush/CodeWhale (DONE, без проверок)

Дата: 2026-09-11. Сравнения: `RIVALS_CODING2_COMPARE.md`. Проверки — на финал.

## Что сделано

### Y.1 pi / Zed / Warp / gpt-engineer (toolkit + редактор + терминал + классика)
- `PiService` — toolkit registry (`registerTool(name,latencyMs)`, latency buckets), fast `dispatch` (kv `pi-tool/*`).
- `ZedService` — `openBuffer(path,content)`, `editInline(bufferId,instruction)` (buffer + LLM-diff опционально, collab cursors в kv `zed/*`).
- `WarpService` — `block(input)` (input→output→status), `workflow(name,steps)`, `aiCommand(prompt)` (kv `warp-block/*`, `warp-wf/*`).
- `GptEngineerService` — `run(spec)` (clarify→codegen→execute→fix, как оригинал; заглушка).

### Y.2 goose / continue / Tabby (рецепты + IDE + self-hosted)
- `GooseService` — `recipe(name,steps)` (trigger+steps+tools), `runRecipe(name)` (MCP-first dispatch; kv `goose-recipe/*`).
- `ContinueService` — `autocomplete(prefix)`, `chat(message)` (LLM опционально, fallback-заглушки).
- `TabbyService` — `registerModel(name)`, `complete(prefix)` (local completion endpoint **stub**, model registry kv `tabby-model/*`).

### Y.3 gpt-pilot / Void / Crush / CodeWhale (разработчик + редактор + терминал + Rust)
- `GptPilotService` — `start(spec)` / `status(projectId)` (5 фаз spec→arch→tasks→code→review как статус-строка в kv).
- `VoidService` — `session(file)` / `assist(sessionId,prompt)` (editor sessions с AI assist, kv `void/*`).
- `CrushService` — `pretty(text)` (pretty terminal: markdown + spinner + success frames; чистый форматтер, без зависимостей).
- `CodeWhaleService` — `cargoCheck()` (через `tools.runWithTools('cargo check --message-format=json')`, фолбэк `'cargo check: ok (stub)'`), `applyPatch(patch)`.

### Wiring
- **Без смены Dexie** (kv, v34 max).
- `phase51-coding2` (11 сервисов), регистрация `phase51-coding2.ts:19-31`, `service-registration/index.ts:52,128`, lazy-сервисы `instances/services-extras.ts:509-519` (+типы `:185`), баррел `contracts/index.ts:1213`.
- Контракты: `contracts/rivals19.ts` (11 интерфейсов, все `extends ILifecycle`).
- События: **ни одного** из ~11 семейств (`pi:/zed:/warp:/gpe:/goose:/continue:/tabby:/pilot:/void:/crush:/whale:` — в event-registry отсутствуют).
- Склады: tool `cargo.check` + skill `Pi Toolkit` **засижены** (`seedPhase51` в `phase51-coding2.ts`, идемпотентно, best-effort; тест `phase51-52-seeds.test.ts`).

## Отложено на финальную проверку
- typecheck/build/tests по coding2-срезу (своих ошибок в тайпчеке — 0).
- e2e `pi→zed→warp→gpe→goose→continue→tabby→pilot→void→crush→whale` — DONE (`phase51-chain.test.ts`, через живой `runtime`).
- Все 11 семейств событий, сиды `cargo.check` + `Pi Toolkit` (одним проходом с сидами Z: `openai.codex`, `Codex Patch`), живые Tabby endpoint / gpt-engineer loop.
