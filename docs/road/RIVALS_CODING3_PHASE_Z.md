# Phase Z — Кодинг + инфра: Codex/GeminiCLI/Kilo + Interpreter/MiniSWE/Roo + Helicone/Portkey/LiteLLM/Langfuse (DONE, без проверок)

Дата: 2026-09-11. Сравнения: `RIVALS_CODING3_COMPARE.md`. Проверки — на финал.

## Что сделано

### Z.1 Codex / Gemini CLI / Kilo (patch-flow + CLI + fan-out)
- `CodexService` — prompt → unified diff → apply → kv (`codex/*`); при живом `llmClientService` дифф генерирует LLM (system-промпт "Generate unified diff, 3 lines"), иначе детерминированный фолбэк.
- `GeminiCliService` — session chat: prompt → Gemini (через `llmClientService.chat`) → render; без LLM — echo-заглушка.
- `KiloService` — fan-out на N моделей (≤5, дефолт `gemini/openai/deepseek`), marketplace catalog в kv (`kilo/*`, `catalog()` топ-20).

### Z.2 Interpreter / Mini-SWE / Roo (честные заглушки + готовый ModesService)
- `InterpreterService` — local exec **stub** (`exec(code, lang)` → `ok (stub)`); настоящий local exec требует allowlist + песочницу — на финалку.
- `MiniSweService` — issue → reproduce → patch → tests → submit **stub** (`solve()` возвращает патч + `passed: true`); прогон реальных тестов — на финалку.
- Roo presets + mode switch live **уже закрыты в G.2, без изменений в Z**: `ModesService` (`rivals2/modes-service.ts`) — 4 built-in Roo-мода (architect/code/debug/ask) + custom CRUD (`defineMode`, kv `modes/*`) + живой `switchMode` с событием `modes:switched` + `modeAllows()` через toolkit-гейты `RunQueueService`.

### Z.3 Helicone / Portkey / LiteLLM / Langfuse (observability + gateway)
- `HeliconeService` — proxy log в kv (`helicone/*`) + `hits()` (cache hit/miss счётчик).
- `PortkeyService` — gateway config: `route(model)` читает kv `portkey/${model}` (фолбэк `openai`); fallbacks/load balance/guards — на финалку.
- `LiteLlmService` — unified proxy passthrough (`[LiteLLM ${model}]`, без состояния).
- `LangfuseService` — trace spans в kv (`langfuse/${name}/*`) + `eval(dataset)` stub (`0.85`); dataset evals + prompt versions — на финалку.

### Склады (пополнение — НЕ засижено, честно)
- По карте Z планировались 1 tool `openai.codex` + 1 skill `Codex Patch` — **засижены** (`seedPhase52` в `phase52-coding3.ts`, идемпотентно, best-effort; тест `phase51-52-seeds.test.ts`).

### Wiring
- **Без смены Dexie** (kv, v34 max) — как условились для Phase H+.
- `phase52-coding3` (9 сервисов: codex/geminiCli/kilo, interpreter/miniSwe, helicone/portkey/liteLlm/langfuse), регистрация в `service-registration/index.ts:53,129`, lazy-сервисы в `instances/services-extras.ts:520-528`.
- Контракты: `contracts/rivals20.ts` (9 интерфейсов `ICodexService … ILangfuseService`, все `extends ILifecycle`).
- Dedicated-события `codex:*` / `gemini-cli:*` / `kilo:*` / `interpreter:*` / `mini-swe:*` / `helicone:*` / `portkey:*` / `litelm:*` / `langfuse:*` **не заводились** (прецедент фазы Y: `pi:`/`zed:`/`pilot:`/`whale:` тоже не заводились; живёт `modes:switched`). Сервисы общаются через kv + `llmClientService`, не через шину.

## Отложено на финальную проверку
- typecheck/build по coding3-срезу (своих ошибок — 0; остаются доисторические логгер-паттерны, общие для ядра).
- e2e `codex→geminicli→kilo→interpreter→miniswe→helicone→portkey→litelm→langfuse` — DONE (`phase52-chain.test.ts`, через живой `runtime`: все 9 сервисов, включая interpreter→настоящий CodeExec-тикет и miniswe→настоящий Codex).
- Живые бэкенды (DONE 2026-09-12, тест `live-backends.test.ts` 10/10): Interpreter → CodeExec tickets handoff (allowlist/ban/size — там; без `codeExecService` — явный stub); MiniSWE → реальный патч из Codex + `passed` по наличию добавлений; Langfuse `eval` → средний скор JSON-трейсов (fallback 0.85; ключи трейсов уникализированы — была коллизия `Date.now()`); Portkey → string|object-конфиги + `setRoute`/`fallbacks`. Осталось: Portkey guards, Langfuse prompt versions.
- Сиды складов Y+Z (`cargo.check`, `Pi Toolkit`, `openai.codex`, `Codex Patch`) — DONE (см. выше).
