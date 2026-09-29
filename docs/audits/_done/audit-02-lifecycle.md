# Аудит 2: Жизненный цикл и состояние (Lifecycle & State)

## Оценка зрелости: 7/10
Зрелый каркас: RuntimeManager с guard'ами start/shutdown, LifecycleManager с tiered-init и таймаутами destroy, idempotent-регистрации, системный unsubs-паттерн в сервисах, HMR-dispose, crash-recovery дебейтов; минусы — сломанный retry после частично упавшего bootstrap, мелкие дыры в учёте подписок EventBus и дубли destroy при перерегистрации.

## Резюме
Инициализация построена поэтапно: `RuntimeManager.start()` защищён от параллельного запуска (`startPromise`), `shutdown()` ждёт завершения старта и разворачивает систему в обратном порядке (LifecycleManager → Container.clear() → clearEventBus → перерегистрация ядра). Сервисы регистрируются через `registerWithLifecycle` и получают симметричный `init()/destroy()`; в 50+ сервисах kernel применён единый паттерн `unsubs: Array<() => void>` с очисткой в destroy — утечек подписок при штатном shutdown не выявлено. EventBus имеет backpressure (лимиты рекурсии/очереди), dead-letter sink, идемпотентность и `clearAllSubscriptions()` для рестартов. Основные проблемы — граничные: (1) при неудаче `initServices()` флаг `isStarted` у SystemBootstrap ставится в true, из-за чего retry-старт возвращает устаревший отчёт без реальной реинициализации; (2) `_unsubByCb` в EventBus перезаписывается при подписке одного callback на несколько событий; (3) `Container.register()` молчаливо перезаписывает инстансы и дублирует registrationOrder → двойной destroy. HMR-пути обработаны (main.tsx dispose → runtime.shutdown; zustand-stores с liveQuery отписываются через import.meta.hot).

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| LC2-01 | Средний | После неудачного initServices() флаг isStarted=true — повторный start() возвращает stale-отчёт, реинициализации нет | src/kernel/bootstrap.ts:145 |
| LC2-02 | Средний | EventBus.on(): `_unsubByCb` keyed по callback — один обработчик на два события затирает unsub другого | src/kernel/events/event-bus.ts:188 |
| LC2-03 | Низкий | Container.register() перезаписывает инстанс молча и дублирует id в registrationOrder → двойной destroy при clear() | src/kernel/container.ts:45 |
| LC2-04 | Низкий | MemoryWatchdog-pressure callback выделяет 64MB ArrayBuffer как «GC hint» — увеличивает пик под давлением памяти | src/kernel/bootstrap.ts:467 |
| LC2-05 | Низкий | tryInit ретраит (4 попытки, до 1+2+4s задержки) в критическом пути bootstrap — упавший сервис замедляет старт всех tier'ов | src/kernel/services/lifecycle-manager.ts:121 |
| LC2-06 | Низкий | Внутренний слушатель EVENTBUS_BACKPRESSURE из конструктора EventBus удаляется при clearAllSubscriptions() и не восстанавливается | src/kernel/events/event-bus.ts:99 |
| LC2-07 | Инфо | deploy-service / model-distillation-service симулируют прогресс через setInterval с фейковыми URL example.com — mock-логика в prod-коде | src/kernel/services/deploy-service.ts:292 |
| LC2-08 | Инфо | Console-хелперы `window.__getState/__checkConsistency/__probeAll` регистрируются безусловно, в т.ч. в проде | src/main.tsx:154 |

## Детали находок

### LC2-01. Сломанный retry после частичного сбоя bootstrap (Средний)
Файл: `src/kernel/bootstrap.ts:68-69, 143-147`
```ts
async init(): Promise<BootstrapReport> {
    if (this.isStarted) return this.getReport();
    ...
    const servicesOk = await this.initServices();
    if (!servicesOk) {
        this.isStarted = true;          // ← флаг ставится и при неудаче
        return this.getReport();
    }
```
При этом retry-механизм на уровне RuntimeManager явно рассчитан на повторный запуск (`src/kernel/runtime.ts:98-101`):
```ts
// BR-03: Do NOT call shutdown() here ... Instead, just clean state so restart() can retry.
this.initialized = false;
this.startPromise = null;
```
Влияние: после провала критического сервиса `runtime.start()` возвращает false, `startPromise` обнулён, но повторный `start()` вызывает `bootstrapper.init()`, который мгновенно возвращает старый отчёт с phase='failed' — система остаётся в деградации без шанса восстановиться, UI получает «ready/degraded» без реальной инициализации.
Рекомендация: при `!servicesOk` не ставить `isStarted=true` (или добавить `this.lifecycle.clearStatuses()` + reset флага в начале init), чтобы retry повторно прошёл tier-инициализацию.

### LC2-02. Перезапись unsub-маппинга в EventBus (Средний)
Файл: `src/kernel/events/event-bus.ts:182-204`
```ts
on<K extends keyof EventMap>(event: K, callback: Callback<EventMap[K]>) {
    ...
    const unsub = () => this.off(event, callback);
    this._unsubByCb.set(callback as Callback<unknown>, unsub);  // ← по callback, не по (event,callback)
    ...
    return () => {
        this.unsubCallbacks.delete(unsub);
        this._unsubByCb.delete(callback as Callback<unknown>);
        unsub();
    };
}
```
Влияние: если одна и та же функция-обработчик подписывается на два события (распространённый паттерн `const h = d => ...; bus.on(A,h); bus.on(B,h)`), вторая подписка затирает `_unsubByCb` первой. Прямой вызов `off(A, h)`/повторный возврат unsubscribe далее чистит записи «не своего» события — гарантированной симметрии on/off нет; при рестартах возможен «вечный» подписчик, держащий ссылку на уничтоженный сервис.
Рекомендация: ключ — составной (`event → Set<callback>` или `Map<callback, Map<event, unsub>>`).

### LC2-03. Container.register(): молчаливая перезапись и двойной destroy (Низкий)
Файл: `src/kernel/container.ts:45-48, 146-172`
```ts
register<T>(id: ServiceIdentifier, instance: T): void {
    this.services.set(id, instance);
    this.registrationOrder.push(id);   // ← дубликат id при перерегистрации
}
...
for (const id of this.registrationOrder.slice().reverse()) {
    const service = this.services.get(id);
    if (service && typeof service.destroy === 'function') { await ...destroy(); }
}
```
Влияние: перерегистрация (например, registerCoreServices после shutdown, `runtime.ts:231-244`) оставляет два вхождения id в registrationOrder → `clear()` вызывает `destroy()` того же инстанса дважды (второй вызов после уже освобождённых ресурсов), плюс нет варнинга о потере старого инстанса с незакрытыми подписками.
Рекомендация: в `register()` при существующем id — лог-предупреждение (или destroy старого) и не пушить дубликат в registrationOrder.

### LC2-04. «GC hint» 64MB под memory pressure (Низкий)
Файл: `src/kernel/bootstrap.ts:465-471`
```ts
// Force GC: allocate+free 64MB buffer to encourage V8 mark-sweep
try {
    const buf = new ArrayBuffer(64 * 1024 * 1024);
    buf.toString(); // touch
} catch {
    // best-effort GC hint
}
```
Влияние: callback срабатывает при heap > 1.5GB — выделение ещё 64MB увеличивает пик и может ускорить OOM-таб на вкладке; гарантий запуска GC нет.
Рекомендация: убрать аллокацию; `window.gc()` недоступен, но достаточно уже реализованных сбросов кэшей и `LLMHttpClient.cancelAll()` (строки 451-464).

### LC2-05. Экспоненциальные ретраи init в критическом пути старта (Низкий)
Файл: `src/kernel/services/lifecycle-manager.ts:112-140`
```ts
async tryInit(name: string, fn: () => Promise<void> | void, retries = 3): Promise<boolean> {
    const maxAttempts = 1 + retries;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try { await fn(); ... }
        ...
        await new Promise((resolve) => setTimeout(resolve, delayMs));  // до 1s+2s+4s
```
Влияние: каждый упавший необязательный сервис (их десятки в Tier 4-6) добавляет до 7 секунд в старт приложения; суммарно деградировавший старт может занять минуты без отображения прогресса пользователю.
Рекомендация: ретраи — только для критических сервисов или вынести в фоновую повторную инициализацию после показа UI.

### LC2-06. Удаление внутреннего backpressure-слушателя (Низкий)
Файл: `src/kernel/events/event-bus.ts:99-105` и `145-168`
```ts
constructor(strictMode = true, logger?: ILogger) {
    ...
    this.on(EVENTS.EVENTBUS_BACKPRESSURE, (data) => { getLogger().warn(...) });
}
...
clearAllSubscriptions(): void {
    for (const unsub of this.unsubCallbacks) { try { unsub(); } ... }
    this.unsubCallbacks.clear();
    this.listenerMap.clear();
```
`eventBus` — синглтон; `runtime.shutdown()` вызывает `clearAllSubscriptions()` (`runtime.ts:164`), после чего конструкторный слушатель backpressure не возвращается (EventBus заново не создаётся — `registerCoreServices` только регистрирует его в контейнере).
Влияние: после restart/HMR сигналы перегрузки шины перестают логироваться/помечать runtime degraded (подписка в `runtime.ts:88-90` тоже удаляется и восстанавливается только новым `start()`).
Рекомендация: переподписывать backpressure-обработчик в `registerCoreServices()` или исключить системные подписи из clearAllSubscriptions.

### LC2-07. Симуляция в production-сервисах (Инфо)
Файл: `src/kernel/services/deploy-service.ts:292-299` и `src/kernel/services/model-distillation-service.ts:158-168`
```ts
const timer = setInterval(() => {
    if (stageIndex >= stages.length) { ... dep.url = `https://${...}.example.com`; ...
```
Влияние: панельные функции «деплой»/«дистилляция» генерируют фейковый прогресс и URL — не lifecycle-дефект (таймеры корректно снимаются через `this.timers` в destroy, `deploy-service.ts:61-62`), но пользовательская дезинформация.
Рекомендация: пометить как demo/скрыть за флагом.

### LC2-08. Debug-хелперы в проде (Инфо)
Файл: `src/main.tsx:154-192`
```ts
const w = window as unknown as WindowDebug;
w.__getState = async () => { ... const keys = keyService?.getKeys(); ... };
```
Влияние: `__getState` возвращает count/label ключей (не значения) — утечка минимальна, но глобальные точки входа в ядро доступны любому скрипту страницы.
Рекомендация: обернуть в `import.meta.env.DEV`.

## Проверено, проблем не обнаружено
- **Симметрия start/stop у kernel-сервисов**: spot-check `probe-service.ts:116-132` (start/destroy с флагом), `scheduler-service.ts:114-129` (start/stop + re-entrancy guard H-30), `chat-executor.ts:44-61,81` (stale-timer + destroy), `admin-service.ts:156-172` (init/destroy, `_initialized`) — пары симметричны; кастомный ESLint-правило `eslint/rule-mandatory-lifecycle.mjs` принуждает lifecycle-методы.
- **Очистка подписок**: во всех проверенных сервисах (`key-state-store.ts:480-487`, `session-affinity-store.ts:71-73`, `timeline-service.ts:268-271`, `cross-tab-state.ts:618-621`, `trace-service.ts:382-384`, `cognitive-intelligence-service.ts:164-174`, `pressure-map-service.ts:216-218`, `notification-webhook-service.ts:143-147`) unsubs снимаются в destroy.
- **Кто вызывает shutdown**: `main.tsx:138-145` — HMR dispose вызывает `runtime.shutdown()`; браузерное закрытие вкладки не требует teardown (SPA), IndexedDB персистентен — приемлемо.
- **Гонки при повторной инициализации**: zustand-хранилища с Dexie liveQuery (`key-store-init.ts:150-168`, `debate-session-store/index.ts:186-192`) имеют `__cleanupKeyStore` + `import.meta.hot.dispose` и флаги `initialized` — двойной `ensureInitialized` безопасен.
- **Гонки старта**: `runtime.ts:59-62` — `startPromise` guard; `shutdown()` ждёт старт (BR-02, строки 144-147); restart корректно сбрасывает `shutdownInitiated` (строки 173-177).
- **Crash-recovery**: прерванные дебейты помечаются failed на старте (`bootstrap.ts:480-513`) — гонки «зависших» сессий устранены.

## Положительные практики
- **Tiered bootstrap с зависимостями**: `src/kernel/bootstrap-phases.ts:35-62` (INIT_TIERS) + `checkDependencies()` warning'и о пропавших зависимостях.
- **Контейнер**: детект circular-dependency при разрешении, кэш упавших фабрик с TTL, LIFO-destroy с таймаутом 5s (`src/kernel/container.ts:82-121, 142-181`).
- **EventBus-контракт**: fire-and-forget семантика задокументирована, backpressure (MAX_PENDING 5000, рекурсия 32/1000 для hot-events), dead-letter sink, идемпотентный emitOnce (`src/kernel/events/event-bus.ts:70-93, 128-168, 378-479`).
- **RuntimeManager**: BR-02/BR-03/BR-17 (ожидание старта при shutdown, retry после сбоя, idempotent registerCoreServices) — `src/kernel/runtime.ts:59-106, 141-177, 231-244`.
- **Системный unsubs-паттерн** в 50+ сервисах kernel и деструкторы у всех долгоживущих менеджеров таймеров (см. выше).
- **Память**: MemoryWatchdog с порогами и pressure-callbacks (`src/kernel/utils/memory-watchdog.ts:50-121`), отзывчивые меры — сброс кэшей дебейтов и cancelAll у LLMHttpClient (`bootstrap.ts:451-464`).
- **HMR-гигиена**: `main.tsx:138-145` снимает глобальные обработчики, чистит keyStore и глушит runtime; сервисные сторы дублируют cleanup в `import.meta.hot.dispose`.
