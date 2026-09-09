# Сравнение 1-к-1, четвёртая десятка + что дописываем

Дата: 2026-09-05. Фаза I. Без проверок до финала. Всё на kv +
существующие таблицы (смены Dexie нет — v34 остаётся max).

## 1. Microsoft Copilot Studio
- **У них:** Topics (trigger-фразы), Entities (closed/open списки),
  Variables (сквозные между топиками), Generative answers (RAG-узел), Actions.
- **Было у нас:** Rasa-интенты Фазы H без entities/variables/trigger-топиков.
- **Дописываем (I.1):** `CopilotService` (топики с trigger-фразами →
  overlap-match, entities closed-list/pattern, variables per conversation,
  generative answer через RagService).

## 2. Amazon Bedrock Agents
- **У них:** Action Groups (OpenAPI-схема + Lambda-исполнитель), Knowledge
  Bases (стратегии чанкинга), Guardrails (denied topics, PII-фильтры), Trace.
- **Было у нас:** tool-пул без групп, фиксированный чанкинг, PII-маска только
  в planner-фильтре, трейсов вызовов нет.
- **Дописываем (I.1):** `BedrockService` (action groups → маппинг на
  ToolRunner tools, KB-профили чанкинга поверх LoaderService, guardrail:
  denied topics + PII-redact, trace-лог в kv).

## 3. Google Dialogflow CX
- **У них:** Flows/Pages/Routes, intents+entities+parameters, fulfillment
  webhooks, скоупы параметров (flow/session).
- **Было у нас:** плоские боты без страниц и роутов.
- **Дописываем (I.1):** `CxfService` (flows: pages с entry-ответами, routes
  intent→page, parameters со скоупами, fulfillment: tool-вызов или webhook
  best-effort, всё в kv).

## 4. Salesforce Agentforce
- **У них:** Topics + Instructions + Actions, Atlas reasoning-транскрипт,
  Trust Layer (политики на данных).
- **Было у нас:** reasoning отдельно, governance отдельно — связки нет.
- **Дописываем (I.1):** `AgentforceService` (топик: label/instructions/actions;
  run: reasoning → trust-check через Governance → act через ToolRunner,
  транскрипт в лог).

## 5. Kore.ai
- **У них:** dialog tasks (узлы message/entity/script/api), типы entities
  (list/pattern/remote/datetime), прерывания диалога.
- **Было у нас:** entity-типов нет, прерываний нет.
- **Дописываем (I.2):** `EntityService` (list/pattern/datetime-экстракторы) +
  dialog-task раннер поверх DialogueService с interruption (новый intent
  ставит текущий узел на паузу).

## 6. Yellow.ai
- **У них:** мультиканальность, DynamicNLP, outbound-кампании, маркет шаблонов.
- **Было у нас:** gateway-каналы есть, кампаний нет.
- **Дописываем (I.2):** `CampaignService` (аудитория в kv, broadcast через
  gateway ingress, тики delivered/opened, событие).

## 7. Lindy
- **У них:** AI-сотрудники (роль + скиллы + триггеры), computer use, инбокс.
- **Было у нас:** персоны/тулкиты/триггеры порознь, сущности «сотрудник» нет.
- **Дописываем (I.2):** `EmployeeService` (сотрудник = personaId + toolkitId +
  triggers в kv; run по триггеру через Planner; инбокс = notifications).

## 8. Hugging Face SmolAgents
- **У них:** CodeAgent (LLM пишет Python-код как действие, песочница
  исполняет), ToolCallingAgent, memory steps, безопасные импорты.
- **Было у нас:** код как действие отсутствует (песочницы браузера не
  исполняют Python).
- **Дописываем (I.3):** `CodeAgentService` (LLM пишет mini-DSL `tool(args)`
  построчно → парсинг → ToolRunner-вызовы → observations; финал — ответ.
  Честная адаптация паттерна под браузер.)

## 9. Stack AI
- **У них:** ассистенты (персона + знания + tools как продукт), шедулинг
  флоу, export API.
- **Было у нас:** связки persona+knowledge+tools в одну сущность нет.
- **Дописываем (I.3):** `AssistantService` (define: personaId + datasetId +
  toolkitId в kv; run через ToolRunner с knowledge-подмесом; шедулинг —
  через существующий scheduler-мост).

## 10. Gumloop
- **У них:** интерфейсы (input-формы), loop mode (for-each по списку),
  subflows, vault секретов.
- **Было у нас:** subflows есть (граф), for-each и форм нет.
- **Дописываем (I.3):** `GumService` (формы: JSON-схема + собранные значения
  в kv; forEach: прогон crew/graph по списку с агрегацией; vault — только
  референсы, как везде).

## Карта реализации (Фаза I, phase36)
- События: `copilot:*`, `bedrock:*`, `cx:*`, `force:*`, `kore:*`,
  `yellow:*`, `lindy:*`, `smol:*`, `stack:*`, `gum:*` (~10).
- Сервисы: copilot/bedrock/cxf/agentforce, entity+kore/campaign/employee,
  codeagent/assistant/gumloop → phase36.
- UI: кнопки в табе `rivals` (topics test, code-agent run, assistant run).
