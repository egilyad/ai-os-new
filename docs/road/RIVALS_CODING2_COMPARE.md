# Сравнение 1-к-1, топ кодинг-агентов 10 + что дописываем

Дата: 2026-09-06. Фаза Y. Без проверок. Всё на kv (v34 max). Топ по stars из списка пользователя.

## 1. earendil-works/pi (99k, toolkit + CLI)
- **У них:** ultra-fast toolkit, agent CLI с плагинами.
- **Было:** ToolRunner базовый, но не как pi-toolkit speed.
- **Дописываем (Y.1):** `PiService` (toolkit registry с latency bucket, fast dispatch).

## 2. zed-industries/zed (89k, редактор)
- **У них:** GPU-редактор с AI: inline edit, agent panel, collaboration.
- **Было:** Editor как концепт нет (только workspace read).
- **Дописываем (Y.1):** `ZedService` (buffer + inline edit via LLM diff, collab cursors в kv).

## 3. warpdotdev/warp (65k, терминал)
- **У них:** agentic terminal: blocks, workflows, AI command.
- **Было:** terminal via IdeService → sandbox tickets, но не как Warp blocks.
- **Дописываем (Y.1):** `WarpService` (blocks: input→output→status, workflows, AI gen command).

## 4. AntonOsika/gpt-engineer (55k, классика)
- **У них:** spec → clarify → codegen → execute loop (предок Lovable).
- **Было:** AppBuilder scaffold, но не как gpt-engineer loop.
- **Дописываем (Y.1):** `GptEngineerService` (clarify → codegen → execute → fix, как оригинал).

## 5. block/goose (54k, MCP-first)
- **У них:** extensible CLI+desktop, MCP-first, recipes.
- **Было:** MCPService базовый, recipes нет.
- **Дописываем (Y.2):** `GooseService` (recipe: trigger+steps+tools, MCP-first dispatch).

## 6. continuedev/continue (36k, VS Code + JetBrains)
- **У них:** open-source coding agent для IDE, autocomplete + chat + edits.
- **Было:** continue как паттерн нет.
- **Дописываем (Y.2):** `ContinueService` (autocomplete via LLM, chat, edit apply).

## 7. TabbyML/tabby (34k, self-hosted)
- **У них:** self-hosted assistant, code completion, chat.
- **Было:** self-hosted как Ollama есть, но не как Tabby.
- **Дописываем (Y.2):** `TabbyService` (local completion endpoint stub, model registry).

## 8. Pythagora-io/gpt-pilot (34k, AI-разработчик)
- **У них:** spec → architecture → tasks → code → review (полный разработчик).
- **Было:** AppBuilder 3 шага, но не как gpt-pilot 5+ фаз.
- **Дописываем (Y.3):** `GptPilotService` (5 phases: spec→arch→tasks→code→review, status).

## 9. voideditor/void (29k) + charmbracelet/crush (28k)
- **У них:** Void — AI-редактор, Crush — красивый terminal agent (Charm).
- **Было:** редактор/терминал generic.
- **Дописываем (Y.3):** `VoidService` (editor sessions с AI assist), `CrushService` (pretty terminal: markdown + spinner + success frames).

## 10. Hmbown/CodeWhale (~41k, Rust)
- **У них:** Rust терминал coding agent, fast.
- **Было:** Rust-специфики нет.
- **Дописываем (Y.3):** `CodeWhaleService` (Rust toolchain: cargo check/build + fast apply).

## Карта реализации (Фаза Y, phase51)
- События: `pi:*`, `zed:*`, `warp:*`, `gpe:*`, `goose:*`, `continue:*`, `tabby:*`, `pilot:*`, `void:*`, `crush:*`, `whale:*` (~11).
- Сервисы: pi/zed/warp/gptEngineer, goose/continue/tabby, pilot/void/crush/whale → phase51.
- Склады: 1 tool `cargo.check` (Rust), 1 skill `Pi Toolkit`.
