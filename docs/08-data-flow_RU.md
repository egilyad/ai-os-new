# 08 — Поток данных

## Концептуальный уровень

Данные проходят через **конвейер**, который преобразует неструктурированный ввод в структурированный интерпретируемый вывод. Каждый этап — это отдельный слой обработки с собственной ответственностью. Конвейер последовательный и детерминированный — ни один этап не начинается до завершения предыдущего.

## Системный уровень

### Сквозной конвейер

```
Пользовательский ввод (тема + участники + конфигурация)
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  ЭТАП 1: Создание сессии                                     │
│  startDebate(topic, participants, strategy, rounds, config)  │
│  → Валидация (≥2 участников)                                 │
│  → Сброс governor, circuit breaker'ов, карт провайдеров      │
│  → Создание DebateSession (ID, status, config)               │
│  → emit('debate:started')                                    │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  ЭТАП 2: Вступительные заявления                             │
│  executeOpeningStatements()                                  │
│  → для каждого участника (последовательно):                  │
│     → buildOpeningPrompt(роль + архетип + ограничение        │
│       + температура + стратегия)                             │
│     → callLLM() → {content, provider, model}                 │
│       → разрешение провайдера (4 уровня)                     │
│     → calculateConfidence(content)                           │
│     → Добавление DebateArgument(round=0)                     │
│  → emit('debate:updated')                                    │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  ЭТАП 3: Цикл раундов (итеративный)                         │
│  startDebateLoop() → scheduleNextRound() →                   │
│  → getNextParticipant()  [диспетчеризация стратегии]         │
│  → executeArgumentRound(участник):                            │
│     → buildArgumentPrompt(роль + ограничение + контекст      │
│       дерева + состояние дебатов + температура)              │
│     → callLLM()                                              │
│     → Извлечение [parent:id] (дерево аргументов)             │
│     → Разрешение родителя (4-уровневый fallback)             │
│     → calculateConfidence()                                  │
│     → Добавление DebateArgument                              │
│  → ПОСЛЕ АРГУМЕНТА:                                          │
│     → updateConvergenceScore() (Жаккар, сглаженный)          │
│     → feedGovernor():                                        │
│        → ingestArgument → extractClaims → addToGraph         │
│        → updateContradictions → detectContradictions         │
│        → computeConvergence → computeNovelty                 │
│        → updateDiversity                                     │
│  → ПРОВЕРКА УСЛОВИЙ ОСТАНОВКИ:                               │
│     → governor.shouldStop()?                                 │
│       → generateSynthesis() → emit(consensus) → СТОП        │
│     → legacy: hasNovelClaims? plateau? convergence>85?       │
│       → generateConsensus() → emit(consensus) → СТОП        │
│     → maxRounds достигнут? → generateConsensus() → СТОП      │
│  → Переход к следующему раунду, если все участники высказались│
│  → emit('debate:argument') + emit('debate:updated')          │
│  → scheduleNextRound()                                       │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  ЭТАП 4: Остановка и вычисление                              │
│  stopDebate()                                                │
│  → status = 'completed'                                      │
│  → computeGraphMetrics() → session.graphMetrics              │
│  → computeActivityMetrics() → session.activityMetrics        │
│  → computeQualityMetrics() → session.qualityMetrics          │
│  → interpreter.interpret(session) → session.interpretation   │
│  → saveToHistory()                                           │
│  → emit('debate:updated')                                    │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  ЭТАП 5: Отрисовка интерфейса                                │
│  DebatePanel получает 'debate:updated'                       │
│  → Обновление боковой панели аналитики (8 условных панелей)  │
│  → Отображение метрик, интерпретации, активности, шкалы      │
└──────────────────────────────────────────────────────────────┘
```

### Поток событий

```
СЕРВИС ДЕБАТОВ                  ШИНА СОБЫТИЙ                  ИНТЕРФЕЙС
─────────────                    ─────────                    ──
startDebate() ──→ debate:started ──→ setSession()
               ──→ debate:updated ──→ refreshAll()
executeArgumentRound()
               ──→ debate:argument ──→ appendArg()
               ──→ debate:updated ──→ refreshAll()
stopDebate()   ──→ debate:consensus ──→ showConsensus()
               ──→ debate:updated ──→ refreshAll()

GOVERNOR                         ШИНА СОБЫТИЙ                  ИНТЕРФЕЙС
───────                          ─────────                    ──
generateSynthesis()
               ──→ debate:consensus ──→ showConsensus + stop
```

### Разрешение провайдера (callLLM)

```
Попытка 1: participant.provider + participant.modelId
  → getAdapter(provider) → sendMessage()
  → успех? → возврат
  → ошибка? → пометить провайдера как ошибочный → Попытка 2

Попытка 2: тот же провайдер, другой ключ
  → getActiveKeys().filter(k => k.provider === participant.provider)
  → успех? → возврат
  → ошибка? → Попытка 3+

Попытка 3+: кросс-провайдерный fallback
  → routerService.getDebateProviders(participantCount)
  → фильтрация failedProviders
  → попробовать каждый, пока один не сработает

Если всё не удалось → emit fallback DebateArgument(source='fallback')
```

## Поведенческий уровень

- Конвейер **последователен на каждый аргумент** — каждый аргумент обрабатывается полностью (вызов LLM, уверенность, передача governor'у, проверка остановки) перед началом следующего
- Разрешение провайдера **ленивое и кэшируется** — первый успешный провайдер для участника кэшируется в `participantProviderMap`
- Governor и устаревшие условия остановки **проверяются избыточно** — если governor доступен, его условия выполняются первыми; устаревшие условия — путь fallback
- Метрики и интерпретация **вычисляются только один раз** — при остановке дебатов, не инкрементально
- Интерфейс реагирует на события, а не на прямые вызовы — сервис никогда не ссылается на код интерфейса
