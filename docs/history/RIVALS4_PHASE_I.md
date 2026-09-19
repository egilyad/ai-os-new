# Phase I — Паритет с четвёртой десяткой (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS4_COMPARE.md`. Проверки — на финал.

## Что сделано

### I.1 Copilot Studio / Bedrock / Dialogflow CX / Agentforce
- `CopilotService` — топики (trigger overlap-match), entities list/pattern,
  variables per conversation с `{var}`-подстановкой, generative fallback
  через RagService.
- `BedrockService` — action groups → ToolRunner tools, KB-профили чанкинга
  (fixed/semantic/hierarchical через LoaderService), guardrail (denied topics
  + PII-redact email/phone/card), in-memory trace (cap 200).
- `CxfService` — flows/pages/routes (intent-overlap), parameters со скоупами,
  fulfillment `fulfill:tool` через ToolRunner. Всё в kv.
- `AgentforceService` — топик label/instructions/actions; run: reasoning →
  trust-check каждого action через Governance (deny/HITL-skip) → ToolRunner;
  полный транскрипт возвращается.

### I.2 Kore.ai / Yellow.ai / Lindy
- `EntityService` — list/pattern/datetime (EN+RU месяцы, relative, ISO).
- `KoreService` — диалоги поверх DialogueService с interruption (park +
  resume через kv-состояние).
- `CampaignService` — аудитории в kv, broadcast через gateway ingress,
  delivered/opened тики.
- `EmployeeService` — hire/fire (persona+toolkit+triggers в kv), runOnTrigger
  через Planner, инбокс через mobile notifications.

### I.3 SmolAgents / Stack AI / Gumloop
- `CodeAgentService` — LLM пишет mini-DSL `tool(args)` построчно → парсинг →
  ToolRunner → observations; финал без tool-вызова = ответ. Честная
  браузерная адаптация code-as-action (сырой код не исполняется).
- `AssistantService` — define (persona+dataset+toolkit в kv), chat с
  persona-блоком + dataset-подмесом + tool-loop.
- `GumService` — формы (схема + значения в kv), forEach по crew/graph с
  агрегацией, vaultRef только-именами.

### Wiring
- **Без смены Dexie** (kv + существующие таблицы) — v34 остаётся max.
- `phase36-rivals4` (11 сервисов), 9 событий, lazy-сервисы,
  code-agent/assistant-кнопки в табе `rivals` (+i18n en/ru).

## Отложено на финальную проверку
- typecheck/build/tests/lint по rivals4-срезу, e2e
  topic→guard→flow→force→entity→dialog→campaign→employee→code→assistant→form.

## Дальше — финальная проверка всего вместе, когда скажешь.
