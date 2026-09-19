# Сравнение 1-к-1, кодинг + инфра 10 + что дописываем

Дата: 2026-09-06. Фаза Z. Без проверок. Всё на kv (v34 max).

## 1. openai/codex (120k, Rust, lightweight)
- **У них:** tiny binary, prompt → patch, review, shell.
- **Было:** CodeAgent mini-DSL, но не как codex patch-flow.
- **Дописываем (Z.1):** `CodexService` (prompt → unified diff → apply → shell test).

## 2. google-gemini/gemini-cli (107k)
- **У них:** Gemini CLI: chat, tools, extensions, theme.
- **Было:** Gemini adapter есть, CLI-обёртки нет.
- **Дописываем (Z.1):** `GeminiCliService` (session: prompt → Gemini → tool calls → render).

## 3. Kilo Code (500+ моделей)
- **У них:** 500 моделей, параллельные агенты, marketplace.
- **Было:** adapter-factory 23 провайдера, но не как Kilo parallel.
- **Дописываем (Z.1):** `KiloService` (fan-out на N моделей, marketplace catalog в kv).

## 4. Open Interpreter (~50k)
- **У них:** `interpreter --local` исполняет код на машине (Python/JS/shell).
- **Было:** CodeExec tickets (handoff), но не как local exec.
- **Дописываем (Z.2):** `InterpreterService` (local exec stub + safe allowlist, кодинг-задачи).

## 5. SWE-agent / mini-SWE-agent
- **У них:** solve GitHub issues, trajectory, submit patch.
- **Было:** SWE-service базовый (find/open/edit), mini нет.
- **Дописываем (Z.2):** `MiniSweService` (issue → reproduce → patch → tests → submit).

## 6. Roo Code (custom modes)
- **У них:** Architect/Code/Debug/Ask + custom modes (yaml).
- **Было:** ModesService 4 built-in + custom, но не как Roo modes.
- **Дописываем (Z.2):** углубить ModesService (Roo presets + mode switch live).

## 7. Helicone (LLM observability)
- **У них:** proxy, caching, retries, analytics.
- **Было:** AdapterFactory decorators (cache/retry) разрозненно, proxy нет.
- **Дописываем (Z.3):** `HeliconeService` (proxy log, cache hit/miss, retry trace).

## 8. Portkey (AI gateway)
- **У них:** gateway, fallbacks, load balancing, guards.
- **Было:** provider-router + fallback decorator, но не как gateway.
- **Дописываем (Z.3):** `PortkeyService` (gateway config: fallbacks, load balance, guard).

## 9. LiteLLM (proxy)
- **У них:** OpenAI-compatible proxy для 100+ моделей.
- **Было:** OpenAiCompatibleAdapter per provider, но не как единый proxy.
- **Дописываем (Z.3):** `LiteLlmService` (unified proxy: model → provider map, passthrough).

## 10. Langfuse (tracing)
- **У них:** tracing, evals, datasets, prompt management.
- **Было:** PromptHub + trace-service basic, но не как Langfuse.
- **Дописываем (Z.3):** `LangfuseService` (trace spans, dataset evals, prompt versions).

## Карта реализации (Фаза Z, phase52)
- События: `codex:*`, `gemini-cli:*`, `kilo:*`, `interpreter:*`, `mini-swe:*`, `helicone:*`, `portkey:*`, `litelm:*`, `langfuse:*` (~9).
- Сервисы: codex/geminiCli/kilo, interpreter/miniSwe/roo-deep, helicone/portkey/litelm/langfuse → phase52.
- Склады: 1 tool `openai.codex`, 1 skill `Codex Patch`.
