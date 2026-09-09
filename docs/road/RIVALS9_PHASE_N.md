# Phase N — Хайп-паритет (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS9_COMPARE.md`. Проверки — на финал.

## Что сделано

### N.1 Китайские провайдеры + DeepSeek quirks
- 4 адаптера: `DeepSeekAdapter` (reasoning_effort для reasoner, context-guard
  warn, sanitize auto→deepseek-chat), `KimiAdapter` (moonshot, kimi-k2,
  `:thinking`-суффикс), `MiniMaxAdapter` (MiniMax-M1), `QwenAdapter`
  (dashscope-intl, qwen3-max, `:thinking` → enable_thinking).
- `reasoningContent` в kernel ChatMessage (сквозит в OpenAI-JSON автоматом —
  round-trip для DeepSeek tool loops).
- Factory-кейсы (kimi/moonshot/minimax/qwen/dashscope/alibaba) + дефолты,
  preferred-модели и display-имена.

### N.2 OpenClaw + DeepSeek-Harness
- `OpenClawService`: SOUL.md → CharacterDoc-импорт (identity/rules/skills/
  style), AGENTS.md → peers+handoffs счёт, HEARTBEAT.md → cron в kv
  (EN-паттерны + raw cron) + `dueCron()` с once-per-minute, channels-реестр,
  ClawHub-publish в SkillMarket.
- `DshService`: plugin registry (enable/disable), 4 пресет-тулкита
  (seed в RunQueue toolkits), trajectory append-only + replay-вывод,
  prefix-builder (stable→volatile), spawn через coordination,
  `healthCheck()` (dsh doctor-аналог).

### N.3 Manus + Genspark
- `ManusService`: runVerified (crew/graph → независимый LLM-рубрик →
  fix-итерации через reset), schedules (cron 5 полей + dueRuns),
  exportRun (crew/graph/council → share-JSON envelope).
- `GensparkService`: fanout по providers[] с per-call override + синтез,
  sheets RFC-4180 CSV, longTask (enqueue + drain + notify).

### Wiring
- **Без смены Dexie** (kv + существующие таблицы).
- `phase41-rivals9` (4 сервиса), 8 событий, lazy-сервисы,
  soul/fanout/health в табе `rivals` (+i18n en/ru).

## Отложено на финальную проверку
- typecheck/build/tests/lint (адаптеры + rivals9), e2e
  provider→soul→cron→plugin→trajectory→verify→schedule→fanout→sheets.

## Дальше — финальная проверка всего вместе, когда скажешь.
