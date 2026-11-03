# Спецификация: Единый IAgentRuntime (агентный runtime-фасад)

> Статус: готово к реализации. Приоритет: P1. Обоснование: `ROADMAP_03`, `ROADMAP_11`, `NEW_COMPONENTS №4`.
> Цель: объединить Council/Crew/Forum/Graph/Director поверх общего цикла выLLM → tool calls → execute → LLM» (уже есть `tool-loop.ts`).

---

## 1. Проблема (факты из кода)

- Отдельные циклы управления: Council (proposal→debate→consensus), Crew (sequential/hierarchical), Forum (ветки), Graph (состояния), Director (сессии), Autonomous.
- Единый `tool-loop.ts` уже существует, но не используется всеми.
- LlmCrewExecutor/CouncilPort/GraphPort (llm-bridge) — наивный JSON-парсинг, echo-fallback при сбое (молчаливый успех), без тестов.

## 2. Цель

- `IAgentRuntime` — единый контракт цикла агента; Council/Crew/Forum/Graph/Director становятся тонкими конфигурациями/стратегиями поверх него.
- Устранить дублирование и «echo-fallback».

## 3. Контракт (в `src/kernel/contracts/agent-runtime.ts`)

```ts
interface AgentTurnInput {
  text: string;
  context?: Record<string, unknown>;
  tools?: string[];
}
interface AgentTurnResult {
  output: string;
  toolCalls: ToolCall[];
  usage: TokenUsage;
  trace: TraceStep[];
}
interface AgentRuntimeConfig {
  role: string;
  persona?: string;
  providers?: { primary?: string; fallback?: string };
  tools?: string[];
  memory?: { types?: MemoryType[]; rag?: boolean };
  maxTurns?: number;
}
interface IAgentRuntime {
  run(
    input: AgentTurnInput,
    cfg: AgentRuntimeConfig,
    opts?: { signal?: AbortSignal },
  ): Promise<AgentTurnResult>;
  spawn(cfg: AgentRuntimeConfig): Promise<AgentHandle>;
  // надстройки
  asCrew(crewCfg): ICrewRuntime;
  asCouncil(councilCfg): ICouncilRuntime;
  asGraph(graphCfg): IGraphRuntime;
  asForum(forumCfg): IForumRuntime;
}
```

- `AgentHandle = { send(text): Promise<string>; getState(); stop(): Promise<void> }`.

## 4. Реализация

- Сервис: `src/kernel/services/agent-runtime/agent-runtime.ts` (+ `tool-loop.ts` как ядро исполнения).
- Фасады:
  - `CrewRuntime` — sequential/hierarchical поверх `IAgentRuntime.run` (переиспользовать `crew/`),
  - `CouncilRuntime` — proposal→debate→consensus (переиспользовать `council/`),
  - `ForumRuntime` — персистентные ветки (переиспользовать `forum/`),
  - `GraphRuntime` — граф состояний (переиспользовать `graph/`; это шаг к полноценному LangGraph-подобному runtime).
- Заменить `LlmCrewExecutor` и др. на фасады (или оставить как тонкие обёртки для обратной совместимости).
- Убрать echo-fallback: при сбое LLM — возвращать `Result.ok=false`/бросать «бизнес-ошибку» (по `Result<T,E>`), а не молчаливый текст.
- Инструменты: через `tool-loop` + `tool-exposure-service` (что видит модель).

## 5. События

- `agent-runtime:turn:start/done/error`, `agent-runtime:tool:call/result` (для наблюдаемости и eval).

## 6. Тесты

- `IAgentRuntime.run`: с мок-адаптером; tool-calls; память; abort.
- Фасады: Crew/Council/Forum/Graph — поведение и (сравнить с прежними).
- Отрицательные: сбой LLM → не echo.

## 7. Definition of Done

- Единый `IAgentRuntime` в DI; фасады работают; нет echo-fallback; тесты на ядро и фасады (включая замену llm-bridge).
