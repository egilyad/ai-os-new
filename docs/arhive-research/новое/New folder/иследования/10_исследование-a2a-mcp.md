# Исследование: A2A, MCP и протоколы взаимодействия агентов

## (а) Что такое A2A

Agent2Agent (A2A) — открытый протокол коммуникации между «непрозрачными» агентными приложениями. Разработан Google (апрель 2025), передан в Linux Foundation (TSC: AWS, Cisco, Google, IBM, Microsoft, Salesforce, SAP, ServiceNow). Apache-2.0, ~26k звёзд. a2a-protocol.org, github.com/a2aproject/A2A.

Базовые понятия v1.0:

- **Agent Card** — JSON-визитка (identity, endpoint, capabilities, skills, securitySchemes; supportedInterfaces[] url+protocolBinding+protocolVersion). Доступна по `/.well-known/agent-card.json` (RFC 8615). Подпись JWS + канонизация RFC 8785.
- **Task** — stateful единица: taskId, contextId; жизненный цикл SUBMITTED→WORKING→COMPLETED/FAILED/CANCELED/REJECTED + INPUT_REQUIRED/AUTH_REQUIRED. Неизменяемы; уточнение = новая задача в том же contextId.
- **Message** (role user/agent) + **Part** (text/raw/url/data).
- **Artifact** — результат.
- **Interaction**: polling, streaming (SSE), push (webhook).

Версии: v0.3.0 → v1.0 (stable; переименования SendMessage/SendStreamingMessage/GetTask/ListTasks/CancelTask/GetExtendedAgentCard/SubscribeToTask; мультитенантность; OAuth2 PKCE/device code; подпись карт; google.rpc.Status). SDK: Python/JS (@a2a-js/sdk)/Go/Java/.NET/Rust + A2A CLI.

## (б) A2A vs MCP — комплементарны

- **MCP — вертикальный** (agent→tool/resource): глубина.
- **A2A — горизонтальный** (agent→agent): охват, многошаговые диалоги, долгие задачи.
- «MCP даёт глубину, A2A — охват».

## (в) Минимальный A2A-клиент

1. Discovery: GET /.well-known/agent-card.json; парсинг supportedInterfaces; ETag-кэширование.
2. Модель данных: Message/Part/Task (contextId/taskId)/Artifact.
3. Task-методы (JSON-RPC 2.0 / HTTP+JSON): SendMessage, GetTask, CancelTask, опц. ListTasks, SendStreamingMessage (SSE); push — если нужно.
4. Аутентификация по securitySchemes (Bearer/OAuth2/API-key).
   Реализация: официальный `@a2a-js/sdk` (ClientFactory → createFromUrl/createFromAgentCard; JSON-RPC/REST в браузере, gRPC только Node).

## (г) AGNTCY (NVIDIA → LF) — окружение вокруг A2A

- DIR (Distributed Announce and Discovery) — федеративный реестр агентов, capability-based discovery, верифицируемые claims, DHT.
- OASF — стандартизированная схема возможностей/навыков/доменов (аннотация Agent Card).
- SLIM — транспорт (MLS-шифрование, маршрутизация).
- Identity / observe (наблюдаемость) / Shadi (безопасный рантайм).

## (д) Рекомендации для нашего приложения

- Интегрировать A2A как горизонтальный стандарт; внутренний Interop-слой привести к модели A2A (Message/Part/Task/Artifact).
- Фаза 1: клиент (JS SDK), Agent Card (well-known + реестр), task-lifecycle; запросы через прокси (auth-токены вне клиента).
- Фаза 2: экспонировать своих агентов как A2A-серверы (JS SDK AgentExecutor + DefaultRequestHandler).
- Фаза 3: discovery/trust (capability-based поиск, подписанные карты JWS, identity, OTel).
- Версия: целиться в v1.0.

Источники: github.com/a2aproject/A2A, a2a-protocol.org, modelcontextprotocol.io, github.com/agntcy (dir/slim/oasf).
