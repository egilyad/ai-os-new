# Аудит 7: Сеть и API-контракты (Network & API Contract)

## Оценка зрелости: 7/10
Сильный централизованный LLM-стек (таймауты, ретраи, circuit breaker, rate-limiter, robust SSE-парсер, deny-by-default nginx-прокси), но ~10 необработанных `fetch` без таймаутов в панелях, сломанное TLS-соединение по IP в cors-proxy, мёртвый контракт `/proxy/azure` и WS-сервер без ping/pong.

## Резюме
LLM-трафик аккуратно инкапсулирован: единый `LLMHttpClient` (таймаут 120 c, merge AbortSignal, классификация 401/402/429/5xx, разбор `Retry-After`, семафор на 50 одновременных запросов, реестр in-flight), поверх — декораторы Retry (экспоненциальный backoff с jitter, отказ от ретрая 429/401/403 и после начала стрима), CircuitBreaker (5xx открывает контур за 2 ошибки, 429 — нет) и token-bucket RateLimit с кросс-табовой синхронизацией. SSE-парсер имеет idle-timeout, лимит буфера 10 МБ и корректную обработку abort. Прокси-слой (vite dev / nginx prod) консистентен и закрывает неизвестные `/proxy/*` с 403; cors-proxy.mjs защищён от SSRF (allowlist, private-IP, DNS-rebinding, зачистка Authorization/Cookie). Проблемы сосредоточены на периферии: 7 UI-панелей ходят в sync-gateway `fetch`'ем без таймаута, cors-proxy соединяется с https-целями по «голому» IP (ломая SNI/проверку сертификата), провайдер `azure` указывает на несуществующий прокси-роут, zod-валидация ответов провайдеров — «мягкая» (warn + trust as-is), а WS-сервер не делает ping/pong и доверяет spoofable `X-Forwarded-For`.

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| NT7-01 | Высокий | 7 fetch-вызовов в UI-панелях без таймаута/AbortSignal — запрос к gateway может висеть вечно | src/components/CompaniesPanel.tsx:43 |
| NT7-02 | Высокий | cors-proxy соединяется по «голому» IP (DNS-rebinding fix) без servername — TLS SNI/проверка сертификата для https-целей падает (ERR_TLS_CERT_ALTNAME_INVALID), т.е. https через прокси не работает | scripts/cors-proxy.mjs:165 |
| NT7-03 | Средний | cors-proxy: нет таймаута на исходящий запрос и буферизация всего ответа — стриминг/SSE через прокси невозможен, память до 100 МБ на запрос | scripts/cors-proxy.mjs:178 |
| NT7-04 | Средний | Провайдер `azure` направлен на `/proxy/azure`, которого нет ни в vite.config, ни в nginx (catch-all `deny all`) — контракт всегда 403 | src/llm/registry/adapter-factory.ts:197 |
| NT7-05 | Средний | zod-валидация ответа провайдера не блокирующая: safeParse-fail → warn и «trust as-is» сырых данных | src/llm/openai-compatible/openai-compatible-adapter.ts:79 |
| NT7-06 | Средний | sync-server: доверие левому `X-Forwarded-For` (spoofable) для rate-limit; WS без серверного ping/pong — полуоткрытые соединения не выявляются | server/sync-server.mjs:71 |
| NT7-07 | Средний | tool-executor: AbortError/timeout попадает в прокси-фолбэк вместо немедленной выброски отмены (повторная попытка по уже истёкшему сигналу) | src/kernel/services/tool-executor.ts:558 |
| NT7-08 | Средний | Gateway-панели дефолтят на `http://localhost:3001` (HTTP + plain host), прод-CSP не разрешает такой connect-src — в Docker-проде панели неработоспособны без правки | src/components/CompaniesPanel.tsx:27 |
| NT7-09 | Низкий | sync-server: `rateLimits`/`wsRateLimits` Map никогда не чистятся — медленная утечка на спуфнутых IP | server/sync-server.mjs:64 |
| NT7-10 | Низкий | gemini `with429Retry` — второй параллельный механизм ретрая поверх RetryDecorator, sleep без учёта AbortSignal | src/llm/gemini/gemini-adapter.ts:20 |
| NT7-11 | Низкий | Хардкод `Origin: 'http://localhost:5173'` для groq — костыль, сломается при смене dev-порта | src/llm/openai-compatible/openai-compatible-adapter.ts:61 |
| NT7-12 | Инфо | fetchJson-обёртка скопирована в 7 панелей вместо общего API-клиента — дублирование и рассинхронизация обработки ошибок | src/components/CostsPanel.tsx:38 |

Проверено дополнительно: `rg 'EventSource|text/event-stream' src/` — клиентских EventSource нет (SSE только серверно-локальный в debate-api.ts:270 и sync-server); `new WebSocket(` в src/ не найдено — SPA не держит WS-сессий; res.ok обрабатывается во всех проверенных kernel-сервисах (tool-executor, key-diagnostics, webhook, sandbox — 14+ вхождений). Версионирование API LLM-провайдеров корректно (`/v1`, `/v1beta`), HTTP-методы соответствуют контрактам (POST completions, GET models, PUT /api/db).

## Детали находок

### NT7-01 — fetch без таймаута в UI-панелях (Высокий)
Файл:строка: `src/components/CompaniesPanel.tsx:43` (аналогично CostsPanel.tsx:38, AdaptersPanel.tsx:21, IssuesPanel.tsx:49, PortabilityPanel.tsx:17, RunsPanel.tsx:34, ApprovalsPanel.tsx:33)
```ts
async function fetchJson(url: string, secret: string): Promise<unknown> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['Authorization'] = `Bearer ${secret}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
```
Влияние: при зависании sync-gateway (или вводе пользователем недоступного URL) промис висит бессрочно; кнопки UI остаются в `loading`, нет ни таймаута, ни возможности отменить. Контраст: kernel-сервисы используют `AbortSignal.timeout` (20 вхождений по src).
Рекомендация: единый gateway-клиент с `AbortSignal.any([userSignal, AbortSignal.timeout(10_000)])`, вынесенный из панелей.

### NT7-02 — TLS по «голому» IP в cors-proxy (Высокий)
Файл:строка: `scripts/cors-proxy.mjs:165`
```js
// DNS-rebinding fix: use resolved IP instead of hostname for connection,
// preserving original hostname in Host header to avoid TOCTOU attacks
proxyHeaders.host = parsed.host;
const targetForConnection = `${parsed.protocol}//${ip}${parsed.pathname}${parsed.search}`;
...
const proxyReq = client.request(targetForConnection, {...});
```
Влияние: подмена хоста на резолвнутый IP (анти-DNS-rebinding) при `https:` оставляет TLS servername = IP: Node https.request не получает servername из Host-заголовка → проверка сертификата против IP-адреса падает (`ERR_TLS_CERT_ALTNAME_INVALID` — у публичных API-сертификатов нет IP-SAN). Итог: любой https-таргет из allowlist (единственный рабочий сценарий прокси, т.к. домены ограничены allowlist, строка 65) возвращает 502; фолбэк `/proxy/fetch` в tool-executor.ts:613 системно неработоспособен для https. Дополнительно: `isPrivateIP` (строки 24–41) не распознаёт IPv4-mapped IPv6 в форме `::ffff:127.0.0.1` (защитный слой, ослаблен allowlist'ом).
Рекомендация: передавать `servername: parsed.hostname` в опции https.request; добавить нормализацию `::ffff:` перед isPrivateIP.

### NT7-03 — нет таймаута и стриминга в cors-proxy (Средний)
Файл:строка: `scripts/cors-proxy.mjs:178`
```js
const proxyReq = client.request(
    targetForConnection,
    { method: req.method || 'GET', headers: {...} },
    (proxyRes) => { ... body.push(chunk); ... proxyRes.on('end', ...) }
);
```
Влияние: медленный/зависший апстрим удерживает сокет бесконечно (нет `timeout`/`destroy`); ответ полностью буферизуется в память (до 100 МБ, строка 22) — SSE/чанкирование невозможны, memory-давление при параллельных запросах.
Рекомендация: `proxyReq.setTimeout(...)`, проксирование `proxyRes.pipe(res)` с ограничением размера.

### NT7-04 — мёртвый прокси-контракт azure (Средний)
Файл:строка: `src/llm/registry/adapter-factory.ts:197`
```ts
case 'azure':
    // Azure OpenAI requires {resource}.openai.azure.com — user must configure via proxy/env
    adapter = new OpenAiCompatibleAdapter('azure', '/proxy/azure', false);
```
Влияние: `/proxy/azure` отсутствует в vite.config.ts (строки 119–178) и запрещён nginx catch-all (`location /proxy/ { deny all; }`, docker/nginx.conf:158–161) → любой вызов azure получает 403/404. Комментарий «user must configure» не подкреплён ни документацией, ни env-подстановкой.
Рекомендация: строить baseUrl из env (`VITE_AZURE_BASE_URL`) либо убрать провайдер из меню.

### NT7-05 — «мягкая» валидация ответов LLM (Средний)
Файл:строка: `src/llm/openai-compatible/openai-compatible-adapter.ts:79`
```ts
const parsed = OpenAiCompatibleResponseSchema.safeParse(data);
if (!parsed.success) {
    LOGGER.warn('OpenAICompatibleAdapter', `[${this.id}] Response validation failed`, {...});
}
const safe = parsed.success ? parsed.data : data;   // fallback на невалидные данные
```
Влияние: контракт ответа провайдера фактически не соблюдается: при расхождении со схемой данные используются как есть → `undefined` каскадом превращается в `content: ''`, `tokens: 0` без явной ошибки; диагностика деградации API молча теряется.
Рекомендация: разделять критичные и некритичные поля: отсутствие `choices[0]` → LLMError; варинты полей — опциональными в схеме.

### NT7-06 — XFF-trust и WS без ping/pong (Средний)
Файл:строка: `server/sync-server.mjs:71`
```js
function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const leftmost = forwarded.split(',')[0].trim();   // спуфится клиентом напрямую
        ...
```
Влияние: при прямом доступе к :3001 (docker-compose экспортирует порт) клиент подменяет XFF на каждый запрос → rate-limit (30 req/min, строки 63–84) обходится полностью. WS-соединения (строки 1119–1131) не имеют серверного ping/pong: полуоткрытые TCP-сокеты остаются `readyState === 1` вечно, 30-секундный cleanup (строки 1134–1142) их не видит.
Рекомендация: принимать XFF только от доверенного прокси (`trust proxy` по списку подсетей); добавить `setInterval` ping + `isAlive`-флаг по ws.on('pong').

### NT7-07 — отмена попадает в прокси-фолбэк (Средний)
Файл:строка: `src/kernel/services/tool-executor.ts:558`
```ts
try {
    const response = await fetch(url, { signal: combinedSignal });
    ...
} catch {
    ...
    const proxyRes = await fetch(proxyUrl, { signal: combinedSignal }); // тот же сигнал
```
Влияние: голый `catch` без фильтра `error.name === 'AbortError'`: пользовательская отмена и истёкший `AbortSignal.timeout` инициируют прокси-повтор по уже прерванному сигналу (мгновенный reject) — ошибка отмены маскируется под `FETCH_FAILED`.
Рекомендация: до фолбэка `if (combinedSignal.aborted) throw`/пробрасывать AbortError как есть.

### NT7-08 — http://localhost:3001 в проде (Средний)
Файл:строка: `src/components/CompaniesPanel.tsx:27`
```ts
const URL_KEY = 'companyGateway.url';
const SECRET_KEY = 'companyGateway.secret';
const DEFAULT_URL = 'http://localhost:3001';
```
Влияние: prod-сборка отдаётся по HTTPS/другому хосту: запрос к http://localhost:3001 блокируется mixed-content, а CSP connect-src (`docker/nginx.conf:37`) не содержит localhost — Gateway-панели (6 шт.) в проде неработоспособны «из коробки», секрет Bearer при этом сохраняется в localStorage (см. ST8-04).
Рекомендация: относительный `/api/gateway/*` через nginx или обязательная конфигурация URL.

### NT7-09 — утечка карт rate-limit (Низкий)
Файл:строка: `server/sync-server.mjs:64`
```js
const rateLimits = new Map();
```
Влияние: записи `{ windowStart, count }` перезаписываются, но IP-ключи никогда не удаляются; со спуфнутым XFF карта растёт неограниченно (memory leak на долгоживущем сервере). Аналогично `wsRateLimits` (строка 181).
Рекомендация: периодическая очистка окон старше WINDOW_MS (как сделано с SSE-клиентами).

### NT7-10 — дублирующий ретрай в gemini (Низкий)
Файл:строка: `src/llm/gemini/gemini-adapter.ts:20`
```ts
async function with429Retry<T>(fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 2; attempt++) {
        try { return await fn(); }
        catch (e) {
            if (attempt === 0 && isRetryable429(e)) {
                await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000)); // без AbortSignal
```
Влияние: второй слой ретраев поверх стека декораторов — задержка не прерывается отменой пользователя, поведение 429 расходится с остальными адаптерами (где 429 обрабатывает CircuitBreaker/каллер дебатов).
Рекомендация: перенести в общий декоратор/каллер с AbortSignal-aware sleep.

### NT7-11 — хардкод Origin для groq (Низкий)
Файл:строка: `src/llm/openai-compatible/openai-compatible-adapter.ts:61`
```ts
...(this.id === 'groq' ? { Origin: 'http://localhost:5173' } : {}),
```
Влияние: фейковый Origin привязан к dev-порту 5173; при смене порта/VITE_BASE_PATH заголовок врёт, поведение провайдера непредсказуемо; в prod это антипаттерн.
Рекомендация: вынести в конфиг провайдера или убрать, если ограничение groq снято.

### NT7-12 — копипаста fetchJson в панелях (Инфо)
Файл:строка: `src/components/CostsPanel.tsx:38` (идентично ещё в 6 файлах)
```ts
const r = await fetch(base + p, { ...init, headers: { ...headers, ...(init?.headers || {}) } });
```
Влияние: 7 одинаковых обёрток с разной обработкой ошибок — правки (например NT7-01) придётся вносить 7 раз.
Рекомендация: один `gatewayClient` в kernel/services.

## Положительные практики
- `src/llm/http/llm-http-client.ts` — образцовый HTTP-клиент: таймаут 120 с (`PROVIDER_HTTP_TIMEOUT_MS:19`), ручной merge сигналов с комментарием о GC-баге `AbortSignal.any` (строки 130–136), `Retry-After`-парсер (463–474), глобальный семафор 50 (29–52), реестр in-flight для отмены под memory pressure (54–96).
- `src/llm/decorators/retry-decorator.ts:22-55` — backoff с jitter и cap 30 с, уважение Retry-After, отказ ретраить 429 (делегирован CircuitBreaker) и стрим после первых чанков (122–128).
- `src/llm/decorators/circuit-breaker.ts:32-38` — осознанная политика статусов: 400/401/402/403/405/422/429 не открывают контур, 5xx — порог 2.
- `src/llm/http/sse-parser.ts` — idle-timeout на данные (63–88), лимит буфера 10 МБ (25, 117–122), синхронный `controller.error()` при abort против «4-минутного зависания» (188–201).
- `docker/nginx.conf:158-161` — deny-by-default для неизвестных `/proxy/*`; `proxy_buffering off` + `proxy_read_timeout 120s` для стриминга (65–70); `proxy_ssl_verify on` во всех прокси-локейшенах.
- `scripts/cors-proxy.mjs:43-63,65-73,151-161` — resolve-проверка против DNS-rebinding с соединением по IP, allowlist доменов, обязательный CORS_ORIGIN без `*` (9–21), зачистка Authorization/Cookie (156–161).
- `server/sync-server.mjs:53-59,1068-1117` — обязательный SYNC_SECRET (fail-fast), timingSafeEqual, WS-auth через Sec-WebSocket-Protocol, origin-check до проверки токена, rate-limit на WS-коннекты; SSE `/api/live-events` требует Bearer (303–307).
- `vite.config.ts:7-29` — единый обработчик ошибок прокси с корректным 502 JSON.
