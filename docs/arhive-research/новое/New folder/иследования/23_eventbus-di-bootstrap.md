# Отчёт сабагента: EventBus, DI, bootstrap — точная механика

## 1. event-bus.ts (537 строк)

- **emit** (241–300): validator.safeParse (если есть). Ошибка → logger.warn + rawEmit(NOTIFICATION); **strictMode** → logger.error + pushDeadLetter('strict-validation') + return (блокируется); иначе дальше. Успех и result.data !== undefined → payload подменяется. cognitive:trace:updated → замер heap (delta>2MB warn). DEV-лог payload через sanitizeObject + TraceContext.current.
- **on** (185–210): push в listenerMap; _unsubByCb WeakMap; возвращает unsub. **onSafe** (343–361): парсит raw, callback(result.data) при успехе, иначе drop.
- **strict mode**: default true (:98); setStrictMode (:119).
- **DLQ**: deadLetterQueue (76–77), MAX_DEAD_LETTER=1000 (:78); pushDeadLetter (:326) shift при превышении; причины 'strict-validation'/'max-pending'/'max-defer-chain'/'hot-recursion-limit'; getDeadLetterQueue/drainDeadLetterQueue; чистится в clearAllSubscriptions.
- **HOT_EVENTS** (86–94, 7 шт): chat:stream:chunk|end|provider-switch, cognitive:trace:updated, cognitive:step:active|completed, cognitive:decision:made. В rawEmit (393–438) обходят defer — синхронно, hotEmitDepth (>1000 → drop + DLQ + backpressure); всё равно Zod-валидация.
- **Defer-цепочка**: emitDepth > 32 (:455) → FIFO _deferQueue (_pendingCount++, queueMicrotask). MAX_DEFER_CHAIN=1000 (:368) — при count>1000 drop + DLQ + backpressure; при count===100 backpressure; warn при count===1||count%10===0.
- **Backpressure**: MAX_PENDING=5000 (:370) — если >MAX_PENDING → drop + DLQ + EVENTBUS_BACKPRESSURE. Конструктор подписан на backpressure и логирует warn.
- **Идемпотентность**: emitOnce (:131) — idempotencyCache; IDEMPOTENCY_MAX=1000, TTL=30000; свежая → false; при size>=MAX вытесняется старая.
- **Подписки**: warn при unsubCallbacks.size >= 5000; getSubscriptionStats; при 0 подписчиков у не-system/health-события — debug.

## 2. event-registry.ts (2772 строк)

- `event(name, schema)` (:18) → {name, schema} as const.
- EVENT_REGISTRY (:30–2737) — единый объект-литерал. Комментарий: не добавлять напрямую в event-names/event-map/EventValidators.
- EVENTS (derived): buildEvents() (:2744) — iterate Object.keys, result[key]=entry.name, freeze. Тип EventsType.
- EventMap (type-level): (:2756) — {[K in keyof Registry as Registry[K]['name']]: z.infer<...>} & {'*': ...}.
- EventValidators: buildValidators() (:2763) — result[entry.name]=entry.schema.
- Дубликаты-алиасы допустимы (last-writer-wins по имени); структурная идентичность — drift-тест.

## 3. container.ts (226 строк)

- register (:48): services.set; registrationOrder.push только если нет. registerFactory (:57): factories.set; services.delete (сброс кэша). registerTransient (:66): transientFactories.set. override (:70): throw если не фабрика/transient; удаляет кэш+failure.
- Детект циклов (:89): Set resolving; если id уже резолвится → throw Circular dependency detected; граф через activeFactoryId (:95).
- Кэш провалов: failedFactories, FACTORY_FAILURE_TTL=5000мс (:44); get() (:107) перебрасывает кэшированную ошибку; очищается при успехе/override/clear.
- getOptional (:140) → undefined; has (:145) проверяет все 3 map.
- clear() (:149): LIFO по registrationOrder; destroy() с Promise.race + DESTROY_TIMEOUT_MS=5000 (:151); ошибки логируются. Transient-инстанции не destroy-ятся (не хранятся в services).
- recordDependency/recordDependencyFromActive (:210) — для lazyService-локатора.

## 4. bootstrap.ts / bootstrap-phases.ts

- Фазы (InitPhase): pending → kernel → services → topology → ready | failed | degraded (+ error/shutdown).
- init() (:71): идемпотентен (_initPromise). doInit: phase=kernel → memoryWatchdog.start → инъекция eventBus в модульные синглтоны → registerMigratedServices → agentService + registerSystemAgents([ASSISTANT_AGENT_NODE]) → schedulerService в lifecycle → configService.init → runKeyMigration → loadBootstrapSnapshot → hydrateKeyStorage → initServices(). Ошибка → failed.
- initServices() (:234): phase=services. Tier0 configService.init; checkDependencies(eventSourcing/budget/providerRuntime); providerRuntimeService.createInstance на ключ; rotationService.init; проверка критических; цикл по INIT_TIERS (container.get); повторная проверка; phase=topology → orchestrator.mount(AuditorTopology) + init(); второй init-pass lazy; lifecycle.startAll(); ошибка → degraded.
- CRITICAL_SERVICES (15–20): kernel, configService, keyService, pricingService → abort (failed + RUNTIME_FAILED).
- INIT_TIERS (35–65):
  - Tier0: configService, logger
  - Tier1: routerConfigManager, eventSourcingService, keyService, pricingService
  - Tier2: budgetService, keyStateStore, rotationService, keyVault
  - Tier3: providerRuntimeService, healthScoreService, probeService
  - Tier4: groupManagerService, cacheService, policyService
  - Tier5: debateService, orchestrator, agentService, chatService, memoryOrchestrator, memoryService, advisorService, debateKnowledgeSync, contributionService, cognitiveIntelligenceService, pressureMapService
  - Tier6: memoryMcpServer, sessionMemoryService, workflowDistiller, embeddingService
  - Tier7: ['*'] (все оставшиеся)
- Внутри тира параллельно, между — последовательно; startAll() в том же порядке.
- checkDependencies (:71): только warn.
- Пост-start хуки (non-critical): GroupManager syncExistingKeys + attachGroupManager; KeyStateStore.seedFromKeys; DebateService.init(); MemoryWatchdog onPressure (очистка кэшей + LLMHttpClient.cancelAll); прерванные дебаты → failed. Финал: NOTIFICATION success + RUNTIME_READY + ready.

## 5. runtime.ts (252 строк)

- registerCoreServices() (:231): runtime, database (coreDatabase+init), dal, eventBus (coreEventBus+setLogger), securityService, BucketStorageAdapter, schedulerService. Идемпотентен.
- Фазы: loading/initializing/ready/degraded/shutdown/error.
- start() (:59): loading→initializing; registerCoreServices; createDexieStorage → storageLayer; bootstrapper.init(); crossTabStateSync.start(); phase = ready|degraded; подписка на backpressure → деградация; startHealthChecks.
- startHealthChecks() (:108, интервал 30s): heap>500MB → degraded; scheduler liveness (>120s → degraded); emit KERNEL_HEARTBEAT.
- shutdown() (:141): ждёт in-flight; shutdownInitiated=true; clearInterval; удаление rejection-обработчика; bootstrapper.shutdown(); coreDatabase.destroy(); crossTabStateSync.destroy(); container.clear(); clearResolvedServices(); coreEventBus.clearAllSubscriptions(); повторный registerCoreServices(); initialized=false; phase=loading. shutdownInitiated не сбрасывается (только restart).
- restart() (:173): shutdown → shutdownInitiated=false → start.

## 6. service-helper.ts (92 строк)

- lazyService(name, fallbacks) (:15): Proxy({}, {get}). Кэш resolved Map; notFoundCache c NOT_FOUND_TTL=1000мс (:8); ensureContainer().getOptional(name) — успех → recordDependencyFromActive + кэш; пусто/исключение → notFoundCache.set. Proxy get: функция → биндится один раз (boundMethods WeakMap); не-функция возвращается; fallbacks; иначе throw ServiceNotRegisteredError (кроме symbol/then/toJSON). tryGetServiceProp (:70); invalidateLazyServiceNotFound (:79) после container.register(); clearResolvedServices (:84) — вызывается из runtime.shutdown.

## Ключевые константы

DLQ=1000; HOT=7 событий; MAX_DEFER_CHAIN=1000; MAX_PENDING=5000; IDEMPOTENCY_MAX=1000/TTL=30s; FACTORY_FAILURE_TTL=5s; DESTROY_TIMEOUT=5s; NOT_FOUND_TTL=1s; warn-порог подписок=5000.
