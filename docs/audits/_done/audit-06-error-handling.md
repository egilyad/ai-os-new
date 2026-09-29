# Аудит 6: Обработка Ошибок и Логирование (Error Handling & Logging)

## Оценка зрелости: 7/10 — сильная LLM-специфика (typed errors, backoff с jitter и Retry-After, circuit breaker, изоляция подписчиков EventBus, глобальный unhandledrejection), но центральный логгер не санитизирует meta перед записью в консоль и IndexedDB, в kernel нет таксономии ошибок (710 голых throw new Error), и 8+ содержательных сбоев гасятся молча.

## Резюме
Центральное логирование реализовано в src/kernel/services/logger-service.ts (LoggerService: 4 уровня, буфер 500, персистенция в kv-store каждые 30с, traceId/correlationId, child(), exportLogs JSON/text/csv, runtime setLogLevel) плюс fallback-реализация для тестов. Статистика: прямые `console.*` — 80 ссылок в 44 файлах против 40 `logger.*`-вызовов в 4 файлах ядра (ядро использует rootLogger; прямые console концентрируются в llm/http и компонентах); всего catch-блоков — 2143, из них «пустых без комментария» — 0: 229 блока в 121 файле оформлены как `catch { /* комментарий */ }` — след lint-дисциплины Stage 4 (коммиты f66c1e3, cb2ac73 и др.). Глобальный обработчик `unhandledrejection` есть (main.tsx:17-29) и уведомляет пользователя; `window.onerror` отсутствует. Ретраи сосредоточены в src/llm/decorators (retry + circuit-breaker + fallback) и корректно классифицируют ошибки. Ключевые дефекты: санитайзер API-ключей (src/shared/utils/sanitize.ts) не встроен в LoggerService — meta пишется в персистентный буфер как есть; 60 `.catch(() => {})`, из них минимум 8 гасят ошибки видимых пользователю действий; throw-ы в kernel без кодов ошибок.

Метрики: `console.(log|error|warn|info|debug)` — 80 refs / 44 файла (в т.ч. console.log — 8 / 6 файлов); `logger.(debug|info|warn|error|trace)` — 40 refs / 4 файла; `catch` — 2143 refs; `catch { /* comment */ }` — 229 / 121 файлов; `catch {}` полностью пустых — 0; `.catch(() => {})` — 60 (≈50 — `body.cancel()`-подавление unhandled rejection, легитимно); `throw new Error(` в kernel — 710; кастомных классов ошибок — 7 классов в 4 файлах; в src/llm — 46 типизированных throw (LLMError/RetryableError/AuthError) против 21 generic.

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| EH6-01 | Средний | LoggerService не применяет sanitizeObject: meta и error пишутся в консоль и персистентный буфер IndexedDB ('logger:buffer') как есть | src/kernel/services/logger-service.ts:206 |
| EH6-02 | Средний | 710 `throw new Error` в kernel без кодов/контекста при всего 7 кастомных классах — нет таксономии ошибок для UI/ретраев | src/kernel/errors.ts:1 |
| EH6-03 | Средний | Содержательные `.catch(() => {})`: загрузка задач, switchKey/switchModel, сохранение снапшотов совета — сбои не видны ни пользователю, ни логам | src/components/ChatPanel/ChatPanel.tsx:491 |
| EH6-04 | Низкий | Нет `window.onerror`: глобально ловятся только promise-реджекты; синхронные исключения вне React-дерева и EventBus не репортятся | src/main.tsx:17 |
| EH6-05 | Низкий | FALLBACK_LOGGER.child() возвращает `this` — имя сервиса теряется, все логи до init идут с исходным service | src/shared/utils/logger.ts:39 |
| EH6-06 | Низкий | Прямые console.* — 80 refs в 44 файлах (2:1 к logger-вызовам); console.log — 8, в обход уровней/буфера/редакции | src/llm/http/sse-parser.ts:37 (пример зоны) |
| EH6-07 | Инфо | Паттерн `catch { /* ignore */ }` гасит сбой персистенции настройки техники | src/components/TechniquePanels/CriticPanel.tsx:162 |
| EH6-08 | Инфо | Debug-хелперы window.__getState/__probeAll не обёрнуты в import.meta.env.DEV и попадают в prod-бандл | src/main.tsx:154 |

## Детали находок

### EH6-01: Центральный логгер без санитизации meta
Файл:строка: src/kernel/services/logger-service.ts:206-229 (formatMeta), буфер — 128-130, персистенция — 71
```ts
function formatMeta(meta?: Record<string, unknown>): string {
    ...
    } else if (typeof v === 'string') {
        val = v.length > 200 ? v.slice(0, 200) + '…' : v;
    } else {
        try { val = JSON.stringify(v); ... }
```
Влияние: в src/shared/utils/sanitize.ts есть редактор 9 паттернов API-ключей (`sk-or-v1-…`, `AIza…`, `nvapi-…` и др.) плюс SENSITIVE_KEY_RE — но он подключён только в 7 файлах LLM-слоя (llm-http-client.ts, base-adapter.ts, logging-decorator.ts и др.). LoggerService в formatMeta/formatLog санитизацию не выполняет: любая meta-строка, содержащая ключ, попадает в console.error и в буфер `logger:buffer`, который каждые 30с пишется в IndexedDB (logger-service.ts:36,71) и выгружается через exportLogs (строка 162-189). Один неосторожный `LOGGER.error('X', 'cfg', { cfg: config })` — и секреты оседают на диске пользователя.
Рекомендация: прогонять `entry.meta`/`entry.error` через `sanitizeObject` в `log()` перед push в буфер; покрыть тестом «ключ в meta не попадает в getBuffer()».

### EH6-02: Отсутствие таксономии ошибок в kernel
Файл:строка: src/kernel/errors.ts:1-22 (всего 2 класса: LLMError, AuthError)
```ts
export class LLMError extends Error {
    readonly provider: string;
    readonly statusCode?: number;
```
Влияние: в src/llm таксономия есть (RetryableError с statusCode/retryAfter, 46 типизированных throw в llm-http-client.ts:179-427), а в остальном kernel — 710 `throw new Error('...')` без machine-readable кодов (пример: ToolService `Tool code blocked: '${f}' is not allowed`, tool-executor.ts:104). UI не может программно различать «нет ключа» / «битые данные» / «баг» и строить ретраи/фолбэки; сообщения не локализуются.
Рекомендация: добавить KernelError с полем `code` (или реэкспорт ошибок домена), внедрять постепенно на границах сервисов, начиная с DAL и KeyService.

### EH6-03: Молчаливое гашение ошибок видимых действий
Файл:строка: src/components/ChatPanel/ChatPanel.tsx:491 (также 498, 506; TasksPanel.tsx:179; council-service-facade.ts:134,167)
```tsx
void switchKey(first).catch(() => {});
```
Влияние: при неудаче переключения ключа/модели (сеть, права) пользователь не получает сигнала — UI показывает выбранное значение, фактический чат уходит со старым ключом. В TasksPanel.tsx:179 `agemsTaskService.list().then(setAgemsTasks).catch(() => {})` — панель молча покажет пустой список при сбое БД. Остальные ~50 `.catch(() => {})` — это `res.body.cancel()` в llm-http-client.ts:221-261 и sse-parser.ts — легитимное подавление unhandled rejection при отмене стрима.
Рекомендация: для действий пользователя — `.catch(e => showStatus(...))` или emit NOTIFICATION; для fire-and-forget в kernel — хотя бы `rootLogger.warn` вместо пустого гашения.

### EH6-04: Нет глобального window.onerror
Файл:строка: src/main.tsx:17-29
```ts
const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
    if (event.defaultPrevented) return;
    console.error('[UnhandledRejection]', event.reason);
    eventBus.emit(EVENTS.NOTIFICATION, { message: `Unhandled async error: ...`, type: 'error' });
    event.preventDefault();
};
window.addEventListener('unhandledrejection', unhandledRejectionHandler);
```
Влияние: обработчик качественный (defaultPrevented-уважение, уведомление в EventBus, HMR-dispose на main.tsx:184-186), но охватывает только promise-реджекты. Синхронные исключения в колбэках вне React-дерева (таймеры, raw addEventListener, воркеры) не репортятся глобально — ErrorBoundary (main.tsx:152-158) ловит только ошибки рендера. Наряду с EH6-01 стоит отметить: здесь же console.error с `event.reason` без санитизации.
Рекомендация: добавить `window.addEventListener('error', ...)` с тем же протоколом (лог + оповещение, дедуп по message).

### EH6-05: FALLBACK_LOGGER.child() теряет имя сервиса
Файл:строка: src/shared/utils/logger.ts:39-41
```ts
child(): ILogger {
    return this;
},
```
Влияние: fallback-логгер (используется до init контейнера и в тестах — например, src/llm/decorators/retry-decorator.ts:7 `FALLBACK_LOGGER.child('RetryDecorator')`) не создаёт child с новым service: все сообщения идут с service='system'-уровнем родителя, что путает при разборе буфера и в тестовых артефактах.
Рекомендация: `child(service)` возвращать замыкание-обёртку с фиксированным service (5 строк), интерфейс ILogger это позволяет.

### EH6-06: Доля прямых console.* выше logger-вызовов
Файл:строка: 80 refs console.* в 44 файлах (пример зоны — src/llm/http/, src/components/); logger.* — 40 refs в 4 файлах
```ts
// пример остаточного прямого вывода: main.tsx:57 `console.error('[BOOT] Runtime failed to start:', e);`
```
Влияние: сообщения в обход LoggerService не получают traceId, не попадают в буфер LogsPanel и exportLogs, не подчиняются setLogLevel; для prod-сборки это «невидимые» ошибки ( LogsPanel их не покажет). Основная масса — llm/http-слой и инициализация.
Рекомендация: codemod-перевод console.error/warn в kernel-слое на rootLogger; в llm-слое — через ILogger-контракт (он уже прокидывается в конструкторы адаптеров).

### EH6-07: Игнорирование сбоя сохранения настройки
Файл:строка: src/components/TechniquePanels/CriticPanel.tsx:162
```ts
try { setSetting(TECHNIQUE_ID, v); } catch { /* ignore */ }
```
Влияние: пользователь включает технику, переключает панель — настройка не сохранилась, состояние «сбросилось» без объяснения. Паттерн повторён в ~30 техник-панелях (тот же код по строке 156-162). Смягчение: включение техники само по себе сохраняется в другом месте (qualityImpactCollector), поэтому severity — Инфо.
Рекомендация: обернуть в best-effort c `rootLogger.warn('Settings', ...)` — единый хук `usePersistedSetting`.

### EH6-08: Debug-хелперы окна в продакшене
Файл:строка: src/main.tsx:148-192
```ts
const w = window as unknown as WindowDebug;
w.__getState = async () => { ... keyServiceCount ... dbsample: keys.slice(0, 3).map((k) => `${k.provider}/${k.label}`) ... };
w.__probeAll = async () => { ... probeService.probeAll() ... };
```
Влияние: `__getState`/`__checkConsistency`/`__probeAll` назначаются безусловно (без `import.meta.env.DEV` — в отличие от memory-монитора на строке 31) и доступны в prod: probeAll инициирует реальные сетевые пробы провайдеров, __getState раскрывает provider/label сэмпл ключей. Не секреты, но лишняя поверхность.
Рекомендация: обернуть блок в `if (import.meta.env.DEV)`.

## Положительные практики
- **Центральный логгер с уровнями и персистенцией**: LoggerService — 4 уровня с фильтрацией (logger-service.ts:97-99), кольцевой буфер 500, traceId/correlationId/latency в записях (119-124), квота 200 символов на meta-значение и однострочный формат (215-225), exportLogs в 3 форматах (162-189), runtime `setLogLevel` (240-242); rootLogger.child('Main') в main.tsx:15.
- **Глобальный unhandledrejection с UX-уведомлением и HMR-диспозом**: main.tsx:17-29, 184-186; понятный boot-fail экран с сообщением ошибки (main.tsx:88-112).
- **Изоляция подписчиков EventBus**: каждый callback обёрнут в try/catch — один упавший подписчик не рвёт цепочку (event-bus.ts:401-409 для hot-событий и аналогично в общем emit); плюс dead-letter-очередь, backpressure-событие и лимиты рекурсии (hotEmitDepth > 1000, event-bus.ts:381-394), idempotency-кэш.
- **Стратегия ретраев в src/llm**: RetryDecorator — экспоненциальный backoff ×2 с full-jitter и потолком 30с (retry-decorator.ts:27-36), уважение Retry-After (30-32), отказ от ретрая 429/401/403 и aborted-сигналов (37-54); CircuitBreaker с быстрым отказом на 402 и порогом 5xx=2 (circuit-breaker.ts:31-36); fallback-decorator для мультпровайдерного фолбэка; parseRetryAfter в llm-http-client.ts:239-256.
- **Типизированные LLM-ошибки с cause**: LLMError/AuthError (kernel/errors.ts:1-22), RetryableError с statusCode/retryAfter; в llm-http-client все HTTP-сбои выбрасываются типизированно (строки 179, 240, 251, 269, 282, 336, 354, 367, 427).
- **Санитизация секретов в LLM-слое**: sanitize.ts с 9 regex-паттернами ключей и редакцией чувствительных полей; используется в llm-http-client, base-adapter, logging-decorator, chat-send-message и др. (7 файлов).
- **Линт-дисциплина catch-блоков**: 0 полностью пустых `catch {}`; 229 блока сопровождаются поясняющим комментарием («collector not ready», «private mode», «best-effort») — результат целой серии Stage-4 коммитов (cb2ac73, f66c1e3, 62f47e0, 714c178).
- **Подавление unhandled rejection при отмене стримов**: `.catch(() => {})` на body.cancel()/timeoutPromise снабжены комментарием о назначении (sse-parser.ts:37, 80, 200, 234).
