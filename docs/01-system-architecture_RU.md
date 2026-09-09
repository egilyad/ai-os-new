# 01 — Архитектура системы

## Уровень концепции (Concept Layer)

Система построена вокруг **ядра с сервисами, а не плагинами**. Каждый компонент регистрируется в DI-контейнере, связывается через шину событий и управляется менеджером жизненного цикла. Архитектура обеспечивает:

- **Без глобальных переменных** — все зависимости внедряются через конструкторы
- **Без циклических импортов** — сервисы зависят от контрактов, а не от других сервисов
- **Контракты на границах** — каждое межсервисное взаимодействие проходит через интерфейс в `contracts/`
- **События как основной канал связи** — сервисы испускают события; UI и другие сервисы реагируют

## Уровень системного отображения (System Mapping Layer)

### Архитектура ядра сервисов (Core Service Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│  EventBus ─── on() / emit() / onSafe() — типизирован, валидирован │
├─────────────────────────────────────────────────────────────┤
│                    Уровень сервисов                           │
│                                                              │
│  DebateSyncManager  ─── оркестрирует дебаты                       │
│    ├─ DebateGovernor ─── граф утверждений, противоречия      │
│    ├─ DebateInterpreter ─── пост-хок анализ                  │
│    ├─ DebateStateBuilder ─── построитель контекста промпта   │
│    └─ AutoDebateService ─── пакетное тестирование            │
│                                                              │
│  DebateEngine  ─── альтернативный движок на DAG (контрактный)│
│    ├─ DebateSession ─── жизненный цикл фазы                  │
│    ├─ DebateBudget ─── отслеживание токенов/затрат            │
│    ├─ DebateMemory ─── цепочки рассуждений                   │
│    ├─ DebateConsensusEngine ─── сопоставление утверждений    │
│    ├─ DebateEvaluator ─── оценка агентов                     │
│    ├─ DebateTimeline ─── запись событий                      │
│    └─ DebateOrchestrator ─── выполнение раундов              │
│                                                              │
│  Подсистема управления (debate-governor/)                    │
│    ├─ claim-extractor.ts ─── извлечение утверждений из текста│
│    ├─ claim-graph.ts ─── построение/запрос DAG утверждений   │
│    ├─ contradiction-detector.ts ─── поиск противоречий        │
│    └─ diversity-scorer.ts ─── метрики разнообразия участников│
│                                                              │
│  Уровень провайдеров (Provider Layer)                         │
│    ├─ ProviderAdapterRegistry ─── поиск адаптера по имени    │
│    ├─ ProviderRouter ─── оценка + цепочки запасных вариантов │
│    ├─ KeyService ─── CRUD ключей и выбор пула               │
│    └─ ProbeService ─── быстрая проверка ключей               │
│                                                              │
│  Инфраструктура (Infrastructure)                              │
│    ├─ LifecycleManager ─── init/start/destroy                │
│    ├─ TransactionContext ─── атомарные множественные мутации │
│    ├─ LoggerService ─── структурированное логирование        │
│    ├─ config-mutations.ts ─── управление возможностями в рантайме│
│    ├─ ConfigService ─── наложение конфигураций               │
│    ├─ ConsistencyChecker ─── валидация документов ↔ кода     │
│    └─ ConsistencyChecker (implements IConsistencyHealingPipeline) ─── поток авто-исправления │
└─────────────────────────────────────────────────────────────┘
```

### Ключевые файлы (Key Files)

| Компонент            | Расположение                                                |
| -------------------- | ----------------------------------------------------------- |
| DebateSyncManager    | `src/kernel/services/debate-runtime/debate-sync-manager.ts` |
| DebateGovernor       | `src/kernel/services/debate-governor/`                      |
| DebateInterpreter    | `src/kernel/services/debate-interpreter.ts`                 |
| DebateStateBuilder   | `src/kernel/services/debate-state-builder.ts`               |
| AutoDebateService    | `src/kernel/services/auto-debate/`                          |
| DebateEngine         | `src/kernel/services/debate-runtime/debate-engine.ts`       |
| TopologyDefaults     | `src/kernel/state/topology-defaults.ts`                     |
| DI Container         | `src/kernel/container.ts`                                   |
| Service Registration | `src/kernel/service-registration.ts`                        |
| Bootstrap            | `src/kernel/bootstrap.ts`                                   |
| Event Names          | `src/kernel/events/`                                        |

### Граф зависимостей (Dependency Graph) — DebateSyncManager

```
DebateSyncManager
  → IDatabaseService     (персистентность: Dexie KV)
  → IProviderAdapterRegistry  (getAdapter, resetCircuitBreaker)
  → IKeyService          (getKeys, recordUsage)
  → IRouterService       (getDebateProviders, getRankedProviders)
  → IEventBus            (испускает события debate:*)
  → IWorkspaceService    (контекст файлов для промптов)

ConsistencyChecker
  → (автономный, без DI-зависимостей — работает с манифестом кода)

ConsistencyChecker (implements IConsistencyHealingPipeline)
  → IConsistencyChecker  (checkDocs для валидации/верификации)
```

## Уровень поведения (Behavior Layer)

При запуске bootstrap регистрирует ~50 сервисов, инициализирует их параллельно (с классификацией на критические и опциональные), монтирует топологию агентов по умолчанию и запускает подсистемы наблюдаемости. В рантайме:

- `DebateSyncManager.startDebate()` является основной точкой входа — валидирует входные данные, создаёт сессию, запускает вступительные заявления, затем переходит в цикл раундов
- Каждый аргумент передаётся в `DebateGovernor`, который внутренне поддерживает граф утверждений
- После каждого раунда проверяются условия остановки губернатора (нет новых утверждений, плато конвергенции, все противоречия разрешены)
- При остановке вычисляются метрики и интерпретация, результаты сохраняются, а UI обновляется через события
- `DebateEngine` — это отдельный, более формальный движок, который может использоваться программно — имеет собственный жизненный цикл сессии, отслеживание бюджета и механизм консенсуса
- `ConsistencyChecker.checkDocs()` валидирует ссылки в документации относительно манифеста кода в любой момент; `ConsistencyChecker (implements IConsistencyHealingPipeline).analyze()` объединяет обнаружение + планирование + запуск дебатов для авто-исправления
