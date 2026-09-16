# Сравнение 1-к-1, девятая десятка: ХАЙП (OpenClaw/DSH/Китай/Manus/Genspark)

Дата: 2026-09-05. Фаза N. Без проверок до финала. Источники: GitHub
openclaw/openclaw, deepseek-ai/deepseek-harness (+ quirks-контракт
HenryZ838978), доки Moonshot/MiniMax/Qwen/DeepSeek, разборы Manus/Genspark.

## 1. OpenClaw (персональная AI-OS, gateway)
- **У них:** Gateway (WhatsApp/Telegram/Discord/Signal...), SOUL.md (ДНК
  агента), AGENTS.md (ростер + handoffs), HEARTBEAT.md (cron-задачи),
  ClawHub-скиллы, sandbox-режимы, nodes-устройства, memory-curator.
- **Было у нас:** gateway-ingress, SkillMarket, sandbox-тикеты, persona —
  но нет SOUL-импорта, HEARTBEAT-cron и реестра каналов.
- **Дописываем (N.2):** `OpenClawService` (SOUL.md → CharacterDoc-импорт,
  AGENTS.md → peers/handoffs, HEARTBEAT.md → cron-записи в kv + due,
  channels-реестр, clawhub-publish в SkillMarket).

## 2. DeepSeek-Harness, official ("everything is a plugin", Cordis)
- **У них:** микроядро + плагины на всё (модели/tools/skills/сессии/
  песочницы/loops/scheduling/UI), 4 пресета (Standard/Code/Minimal/Creative),
  trajectory-телеметрия (append-only, replay/fork), Docker-песочницы,
  prefix-cache инженерия, subagents/workflows.
- **Было у нас:** фазы ≈ плагины по духу, toolkits ≈ пресеты, decision log ≈
  trajectory — но нет реестра плагинов, trajectory-журнала и cache-дисциплины.
- **Дописываем (N.2):** `DshService` (plugin registry в kv с enable/disable,
  4 пресет-маппинга на toolkits, trajectory append-only в kv + replay-вывод,
  prefix-builder: стабильное первым, волатильное последним, spawn subagent
  через coordination).

## 3. DeepSeek protocol quirks (Harness-Agent контракт)
- **У них (контракт):** reasoning_content round-trip обязателен (400 без
  него), thinking-налог, interleaved streaming чанки, 1M контекст,
  prefix-cache 50× скидка с инвалидацией при мутации префикса.
- **Было у нас:** generic deepseek через OpenAI-совместимый адаптер,
  reasoning теряется, thinking не управляется.
- **Дописываем (N.1):** `DeepSeekAdapter` (reasoning_effort для reasoner,
  thinking-budget, context-guard warn, `reasoningContent` в ChatMessage
  сквозит в JSON), prefix-дисциплина в DshService.

## 4. Kimi / Moonshot (K2: 1T MoE, 256K, agent tool-use)
- **У них:** OpenAI-совместимый API, длинные контексты, K2 Thinking.
- **Было у нас:** только через generic openai-совместимый путь без дефолтов.
- **Дописываем (N.1):** `KimiAdapter` (api.moonshot.ai, kimi-k2 по
  умолчанию, K2-thinking суффикс-конвенция).

## 5. MiniMax (M1 hybrid, 200K)
- **У них:** OpenAI-совместимый API, длинные рассуждения.
- **Было:** generic only.
- **Дописываем (N.1):** `MiniMaxAdapter` (api.minimax.io, MiniMax-M1).

## 6. Qwen (Qwen3 hybrid thinking + Qwen-Agent)
- **У них:** enable_thinking переключатель, Qwen-Agent (ReAct + code +
  retrieval), DashScope-совместимость.
- **Было:** generic only, thinking-флага нет.
- **Дописываем (N.1):** `QwenAdapter` (dashscope-intl, qwen3-max,
  `:thinking`-суффикс → enable_thinking); ReAct/code/retrieval уже есть
  (react/codeagent/rag).

## 7. DeepSeek модели (V3/R1/V4 reasoning + кэш)
- **См. п.3** + дефолты deepseek-chat/deepseek-reasoner в реестре.

## 8. Manus AI
- **У них:** planner→executor→verifier с итерациями, песочница с файлами и
  браузером, scheduled задачи, shareable replay, мульти-агентность.
- **Было у нас:** executor без независимого verifier, шедулинга ранов нет,
  replay-экспорта ранов нет.
- **Дописываем (N.3):** `ManusService` (execute через crew/graph → verify
  независимым LLM-рубриком → fix-итерации; schedules в kv + dueRuns;
  exportRun → share-JSON через PrototypeService).

## 9. Genspark (Super Agent)
- **У них:** multi-model fan-out + синтез, MCP-инструменты, генерация
  данных (Docs/Slides/Sheets), AI Calls (долгие задачи), data tools.
- **Было у нас:** fan-out одной моделью, sheets-экспорта нет, долгих задач
  с нотификацией нет.
- **Дописываем (N.3):** `GensparkService` (fan-out по providers[] с
  provider-override + синтез; sheets-CSV экспорт; longtask: enqueue +
  drain + notify).

## 10. Harness-Agent паттерн (обобщённый)
- **У них (morlay/opencode-plugin и др.):** code/chat/doc-агенты одним
  конфигом, merge настроек.
- **Было у нас:** фазы разрозненно, merged-пресетов нет.
- **Дописываем:** покрыто Dsh-пресетами (N.2) + `dsh doctor`-аналог:
  `healthCheck()` в DshService (плагины/ключи/очереди — сводка).

## Карта реализации (Фаза N, phase41)
- Адаптеры: deepseek/kimi/minimax/qwen + `reasoningContent` в ChatMessage +
  дефолты/дисплей-имена + factory-кейсы.
- Сервисы: openclaw/dsh/manus/genspark → phase41. Всё на kv.
- События: `claw:*`, `dsh:*`, `manus:*`, `gen:*` (~10).
- UI: кнопки в табе `rivals` (soul-import, verify-run, fanout).
