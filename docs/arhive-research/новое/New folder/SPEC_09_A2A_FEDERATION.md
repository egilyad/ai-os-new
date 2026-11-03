# Спецификация: A2A-интеграция и Федерация (Interop)

> Статус: готово к реализации. Приоритет: P2. Связано: `ROADMAP_11`, `ROADMAP_03 §P3`, `NEW_COMPONENTS`.
> Источник исследования: A2A v1.0 (Linux Foundation/Agentic AI Foundation), MCP, AGNTCY (DIR/OASF/SLIM).

---

## 1. Цель

- Сделать внутренний Interop-слой совместимым со стандартом **A2A v1.0** (горизонтальный протокол «агент↔агент»).
- Позволить: (а) вызывать внешние A2A-агенты из нашего приложения (клиент), (б) экспонировать наших агентов наружу (сервер), (в) discovery + trust (Agent Card, подпись).

## 2. Контекст: A2A vs MCP (не конфликтуют)

- **MCP** — вертикальный: агент→инструмент/ресурс. У нас уже есть MCPService.
- **A2A** — горизонтальный: агент↔агент (равные). Дополняет MCP.

## 3. Ключевые понятия A2A v1.0

- **Agent Card** — JSON-«визитка» (identity, endpoint, supportedInterfaces[url+protocolBinding+protocolVersion], capabilities, skills, securitySchemes). Доступна по `/.well-known/agent-card.json`.
- **Task** — stateful единица работы: `SUBMITTED→WORKING→COMPLETED/FAILED/CANCELED/REJECTED`, + `INPUT_REQUIRED`, `AUTH_REQUIRED`. Неизменяемы: уточнение = новая задача в том же `contextId` c `referenceTaskIds`.
- **Message / Part** — Message (role user/agent) + Part (text/raw/url/data).
- **Artifact** — результат (файл/изображение/данные).
- **Interaction**: request/response (polling), streaming (SSE), push (webhook).
- Версии: v1.0 stable (переименования методов: SendMessage/SendStreamingMessage/GetTask/ListTasks/CancelTask/GetExtendedAgentCard/SubscribeToTask).

## 4. Архитектура

### 4.1 Клиент `A2AClient` (`src/kernel/services/interop/a2a-client.ts`)

```ts
interface A2AClient {
  discover(agentUrl: string): Promise<AgentCard>; // GET /.well-known/agent-card.json
  sendMessage(card: AgentCard, msg: Message, opts?): Promise<Task>;
  getTask(card: AgentCard, taskId: string): Promise<Task>;
  cancelTask(card: AgentCard, taskId: string): Promise<Task>;
  sendStreamingMessage(card, msg): AsyncIterable<TaskUpdate>; // SSE
}
```

- Транспорт: JSON-RPC 2.0 / HTTP+JSON (gRPC — только Node, пропускаем).
- Официальный `@a2a-js/sdk` (ClientFactory → createFromUrl/createFromAgentCard) — использовать, а не писать с нуля.
- CORS/секреты: в браузере запросы к сторонним A2A-серверам гнать через лёгкий прокси (auth-токены держать вне клиента).

### 4.2 Сервер `A2AServer` (экспонирование наших агентов)

```ts
interface A2AServer {
  registerAgent(agent: AgentHandle, card: Partial<AgentCard>): Promise<void>;
  handleTask(task: Task, ctx): Promise<TaskUpdate>; // делегирует в IAgentRuntime (SPEC_05)
}
```

- Внутренние агенты отображаются на Agent Card (capabilities/skills из реестра ролей/агентов).
- Хост: HTTP-эндпоинт (через sync-server или отдельный), маршрут `/.well-known/agent-card.json`.

### 4.3 FederatedDirectory (discovery/trust, из AGNTCY DIR)

- Реестр пиров: capability-based поиск (OASF-стиль таксономия навыков), верификация подписанных Agent Card (JWS), trust-скоринг (переиспользовать `TrustService`).

## 5. Интеграция с приложением

- `InteropService` (существующий) расширяется: A2A-пиры добавляются в реестр, внешние агенты становятся «агентами» в `IAgentRuntime` (как remote-handle).
- События (добавить в event-registry): `a2a:card:fetched`, `a2a:task:started/updated/completed/failed`, `a2a:handoff`.
- UI: панель `FederationPanel` (список пиров, пригласить/вызвать/trust) — доработать существующую.

## 6. Версия и безопасность

- Целиться в **v1.0** (с опциональной совместимостью v0.3 через SDK).
- Аутентификация: по `securitySchemes` карты (Bearer/OAuth2/API-key) через HTTP-заголовки; токены — вне клиента (прокси).
- Trust: проверять подпись Agent Card (JWS), не доверять неподписанным от неизвестных пиров.

## 7. Тесты

- Клиент: fetch Agent Card, sendMessage/GetTask/CancelTask, streaming.
- Сервер: handleTask через IAgentRuntime (mock-LLM), регистрация карты.
- Порядность: не подписанная карта → низкий trust; задача отклоняется.
- Интеграция: внешний пир выглядит как агент в приложении.

## 8. Definition of Done

- A2A-клиент и сервер работают (SDK); внешний A2A-агент вызывается; наши агенты экспонируются; discovery+trust работают; тесты зелёные.
