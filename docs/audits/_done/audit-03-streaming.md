# Аудит 3: Потоки, таймеры и отмена (Streaming, Timers & Abort)

## Оценка зрелости: 8/10
Образцовый слой стриминга: собственный SSE-парсер с idle-timeout/abort/лимитом буфера и cancel-race, HTTP-клиент с merged-AbortSignal, inflight-реестром и cancel- pressure, governor с таймаутами; провайдерские адаптеры повсеместно прокидывают signal и idle-таймауты. Слабые места точечные: Groq идёт через groq-sdk без слоёв таймаутов, autonomy-пайплайн не отменяем, worker-timeout не останавливает интерпретатор.

## Резюме
Стриминг LLM сконцентрирован в `src/llm/http/` и выполнен на высоком уровне: `parseSSEStream` держит abort-listener с немедленным `controller.error()` (фикс 4-минутного зависания G-03), idle-таймаут по данным (L9-02), лимит буфера 10MB (H-09) и cancel с 5-секундной страховкой; `LLMHttpClient.#withTimeout` объединяет caller-signal с таймаутом без AbortSignal.any (обход Chrome GC-бага задокументирован), трекает inflight и умеет cancelAll под memory pressure; после получения заголовков connection-таймаут разоружается (H-06), а защиту от «тихого» зависания тела берут на себя idle-таймауты адаптеров (30s у openrouter/openai-compatible/cloudflare, 90s у NVIDIA, 15s у Gemini). Все SSE-адаптеры пробрасывают `signal` вплоть до fetch. Таймерная гигиена в ядре хорошая: у всех `setInterval` в services найдены парные clearInterval/destroy (probe, scheduler, trace, cross-tab, watchdog, deploy, distillation, rotation и др.), в React-панелях — cleanup в useEffect. Проблемы: Groq-адаптер через groq-sdk не имеет ни HTTP-, ни idle-таймаута (только caller-signal); AutonomyRunner.runGoal не принимает AbortSignal и не отменяем; в sandbox-воркере таймаут через Promise.race не останавливает интерпретатор (смягчается terminate() с главной стороны). SSE/WebSocket в клиенте не используются напрямую (только fetch-стримы; sync-server — отдельный node-процесс с auth).

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| TM3-01 | Средний | Groq-адаптер (groq-sdk) без HTTP/idle-таймаута — «тихое» зависание стрима при stall провайдера, если caller не передал signal | src/llm/groq/groq-adapter.ts:143 |
| TM3-02 | Средний | AutonomyRunner.runGoal: последовательное выполнение задач без AbortSignal/таймаута на задачу — нельзя отменить | src/kernel/services/autonomy-runner.ts:70 |
| TM3-03 | Низкий | sandbox.worker.ts: Promise.race-таймаут не останавливает runSandboxCode; setTimeout не очищается после race | src/kernel/workers/sandbox.worker.ts:61 |
| TM3-04 | Низкий | streamPost разоружает connection-таймаут после заголовков (disarm) — общий потолок на тело стрима отсутствует; защита только через per-адаптерный idle-timeout | src/llm/http/llm-http-client.ts:452 |
| TM3-05 | Низкий | Stale-reaper ChatExecutor прерывает запросы через 10 мин «голым» abort() без reason — классифицируется как user-abort, маскируя реальные зависания | src/kernel/services/chat-executor.ts:49 |
| TM3-06 | Инфо | countdownInterval в debateLiveStore тикает каждую секунду после первого live-события; останавливается только при полной очистке данных | src/stores/debateLiveStore.ts:197 |
| TM3-07 | Инфо | lifecycle-manager: Promise.race-таймаут destroy() не очищает setTimeout при успешном завершении | src/kernel/services/lifecycle-manager.ts:87 |

## Детали находок

### TM3-01. Groq без таймаут-слоёв (Средний)
Файл: `src/llm/groq/groq-adapter.ts:143-146`
```ts
const stream = (await client.chat.completions.create(body as never, {
    signal,
})) as unknown as AsyncIterable<GroqStreamChunk>;
for await (const chunk of stream) {
```
Все остальные провайдеры идут через `LLMHttpClient` (`PROVIDER_HTTP_TIMEOUT_MS = 120000`, merged-AbortSignal) + `parseSSEStream` c `idleTimeoutMs` (у openrouter/openai-compatible/cloudflare — 30s: `openrouter-adapter.ts:223`, `openai-compatible-adapter.ts:156`, `cloudflare-adapter.ts:115`; NVIDIA — 90s: `nvidia-nim-adapter.ts:47`; Gemini — 15s: `gemini-stream-parser.ts:10`). Groq — единственный через SDK: ни connection-таймаута, ни idle-таймаута на чтение.
Влияние: при stall-соединении (провайдер принял запрос, не шлёт данные) `for await` висит неограниченно, пока живёт TCP; отменить может только внешний caller-signal. В пути чата caller-signal есть (chat-executor activeRequests + stale-reaper 10 мин + governor), но прямой вызов адаптера (health-проверки, тулзы) зависает.
Рекомендация: обернуть создание стрима в `Promise.race` с таймаутом и добавить idle-guard (обёртка над async-итератором) либо перевести Groq на общий SSE-путь.

### TM3-02. AutonomyRunner не отменяем (Средний)
Файл: `src/kernel/services/autonomy-runner.ts:70-82`
```ts
for (const task of tasks) {
    try {
        this.orchestrator.assignTask(task.id, 'autonomy-agent');
        this.orchestrator.startTask(task.id);
        const prompt = this.buildPrompt(task, goal);
        const result = await this.runtime.runPrompt(goal.projectId, 'autonomy-agent', prompt, {
            maxRounds: 3,
        });
```
Влияние: goal из N задач выполняется как монолитный async-цикл (до 3 LLM-раундов на задачу) без сигнала отмены, таймаута на задачу и чекпоинта прогресса между задачами — закрытие панели/смена цели не останавливает работу; при падении контейнера задача останется 'active' без итога (в Dexie через AgentExecutionService статусы ведутся отдельно).
Рекомендация: принимать `AbortSignal` в `runGoal`, проверять его в начале каждой итерации, передавать в `runPrompt`, помечать оставшиеся задачи 'cancelled'.

### TM3-03. Таймаут воркера не останавливает код (Низкий)
Файл: `src/kernel/workers/sandbox.worker.ts:61-68`
```ts
const execPromise = runSandboxCode(code, data, os);
const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
        () => reject(new Error(`Execution timed out after ${EXEC_TIMEOUT}ms`)),
        EXEC_TIMEOUT,
    );
});
const result = await Promise.race([execPromise, timeoutPromise]);
```
Влияние: после race интерпретатор продолжает крутиться в воркере (по bonnet — до лимита 2M шагов/интерпретатора, `sandbox-interpreter.ts:12`); пост-сообщение результата уже никто не слушает. На практике утечка смягчена: `SandboxService.execute` делает `worker.terminate()` по своему таймауту (`sandbox-service.ts:138-141`), а setTimeout внутри timeoutPromise просто сработает вхолостую. Риск остаётся для окна между внутренним и внешним таймаутами и для tool-callback'ов (`executeTool` — свой 5s таймаут, строки 44-48).
Рекомендация: добавить stop-флаг/бросок в цикл интерпретатора по истечении EXEC_TIMEOUT и `clearTimeout` после race.

### TM3-04. Нет общего потолка на тело стрима (Низкий)
Файл: `src/llm/http/llm-http-client.ts:452-455`
```ts
// H-06: headers received — disarm the connection timeout so long
// streams are not aborted mid-body. Cancellation still works via signal.
disarm();
return res;
```
Влияние: осознанный трейдофф (длинные стримы не должны резаться 120s-таймаутом). Полная защита достигается только потому, что все SSE-адаптеры передают idleTimeoutMs; будущий адаптер без idle-таймаута (как Groq — TM3-01) повиснет навсегда при stall. Лимита на суммарную длительность/объём ответа тоже нет (буфер 10MB есть лишь в парсере).
Рекомендация: сделать `idleTimeoutMs` параметром streamPost по умолчанию (fallback 30s) вместо ответственности каждого адаптера.

### TM3-05. Stale-reaper: abort без причины (Низкий)
Файл: `src/kernel/services/chat-executor.ts:44-53`
```ts
this._staleTimer = setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of this.activeRequests) {
        if (now - entry.timestamp > this.ACTIVE_REQUEST_TTL) {
            entry.controller.abort();   // ← без reason
            this.activeRequests.delete(id);
        }
    }
}, 60000);
```
Влияние: bare `AbortError` классифицируется как user-abort (см. комментарий G-01 в `llm-http-client.ts:13-19`: «bare AbortError that the caller classifies as a no-retry user-abort») — принудительный разрез 10-минутного ответа пользователь увидит как «cancelled», без ретрая и без диагностики, что это внутренний reaper.
Рекомендация: `abort(new DOMException('Stale request reaped', 'TimeoutError'))` и различать в обработчике.

### TM3-06. Секундный countdown-таймер живёт до полной очистки данных (Инфо)
Файл: `src/stores/debateLiveStore.ts:197-220`
```ts
countdownInterval = setInterval(() => {
    const s = get();
    if (s.agentCountdowns.size === 0 && s.agentEvents.length === 0 && s.roundEvents.length === 0) {
        return;   // ← холостой тик продолжается
    }
    ...
}, 1000);
```
Влияние: таймер стартует по первому live-событию и снимается `stopIntervals()` только когда все коллекции пусты (`debateLiveStore.ts:579,596,620`); между дебатами с остаточными данными тикает каждую секунду и вызывает `set()` → ререндеры подписчиков.
Рекомендация: останавливать countdown, когда `agentCountdowns.size === 0`, независимо от событий.

### TM3-07. Таймеры таймаута destroy не очищаются (Инфо)
Файл: `src/kernel/services/lifecycle-manager.ts:85-98` (аналогично `container.ts:150-163`)
```ts
await Promise.race([
    entry.service.destroy(),
    new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`destroy timed out after ${DESTROY_TIMEOUT_MS}ms`)), DESTROY_TIMEOUT_MS),
    ),
]);
```
Влияние: при успешном destroy таймер живёт до 5s и потом резолвится в уже оседнувший race — функционально безвредно, лишь держит handle; при массовом shutdown — до сотни отложенных таймеров.
Рекомендация: `clearTimeout` в finally.

## Проверено, проблем не обнаружено
- **Очистка setInterval в сервисах**: `probe-service.ts:120-131` (destroy), `scheduler-service.ts:114-129` (stop), `trace-service.ts:120-121` (sweepTimer/_persistTimer, destroy 382-384), `cross-tab-state.ts:211-222` (heartbeat/sync, destroy 618-621), `memory-watchdog.ts:50-61` (stop), `rotation-service.ts:60`, `cache-service.ts:48`, `blackboard-service.ts:31`, `session-affinity-store.ts:69`, `key-state-store.ts:236`, `database-service.ts:265` (`_integrityTimer`), `runtime.ts:110` (`healthCheckInterval` чистится в shutdown 150-153) — парные clearInterval найдены у всех.
- **React-таймеры**: 45+ TechniquePanels — единый паттерн `const interval = setInterval(...); return () => clearInterval(interval);` (`CriticPanel.tsx:156-157`); `WebsitePreview.tsx:124-125`, `DyadPanel.tsx:61-62` (done() снимает по завершении), `useNow.ts`, `usePolling.ts`, `useVisibilityInterval.ts` — cleanup есть.
- **Стриминг без cancel() ридера**: единственная работа с `getReader()` — `sse-parser.ts:19,218`; cancel и releaseLock покрыты (`sse-parser.ts:204-215, 233-239`).
- **Abort в fetch**: все адаптеры (openrouter, openai-compatible + наследники cerebras/minimax/kimi/qwen/deepseek, nvidia, cloudflare, gemini) прокидывают `signal` в `LLMHttpClient` → fetch; retry/priority-queue декораторы уважают signal (`decorators/priority-queue.ts:241-245, 317-318, 355`).
- **SSE/WebSocket в клиенте**: `new WebSocket`/`EventSource` в `src/` отсутствуют; realtime через EventBus + опциональный sync-server (WS только в node-процессе с auth-verifyClient).
- **Backpressure стриминга**: chunk-буферизация в chat-store с rAF-флешем (`chat-event-handlers.ts:83-94`), hot-events EventBus идут мимо defer-очереди (`event-bus.ts:81-91, 379-426`), лимиты буфера SSE 10MB.

## Положительные практики
- **SSE-парсер**: `src/llm/http/sse-parser.ts:28-44` — abort синхронно эррорит wrapper-stream (фикс G-03 «4-min hang»); `:25,117-122` — MAX_BUFFER_SIZE 10MB против OOM; `:63-85` — idle-таймаут race с clearTimeout; `:204-215` — cancel с 5s-страховкой и снятием abort-listener.
- **LLMHttpClient**: merged-signal без AbortSignal.any с задокументированным обходом Chrome GC-бага (`llm-http-client.ts:130-155`); семафор на 50 одновременных запросов (`:29-52`); реестр inflight + `cancelLongestRunning()/cancelAll()` для memory-pressure (`:54-96`); `res.body.cancel()` на всех error-путях (`:221,226,238,248`).
- **ExecutionGovernor**: timeout/abort/parent-signal с полной очисткой слушателей (`src/kernel/services/execution-governor.ts:26-119`).
- **Chat-пайплайн**: cancelRequest по CANCEL_MESSAGE (`chat-executor.ts:37-39`), stale-reaper от «висящих» запросов, частичный контент сохраняется при ошибке стрима (`chat-event-handlers.ts:246-248` FIX(chat-partial)).
- **Терминальные мета-чанки**: finish_reason/usage/tool_calls передаются финальным onChunk('' , meta) во всех адаптерах (H-07; `groq-adapter.ts:164-181`, `openrouter-adapter.ts:228-236`) — корректный учёт токенов и бюджета.
- **Память EventBus**: удалён replay-буфер STREAM_END (утечка до 100MB) с объяснением в коде (`event-bus.ts:77-79`).
