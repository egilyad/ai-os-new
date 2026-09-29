# Аудит 1: Безопасность (Security Core)

## Оценка зрелости: 6/10
Сильная периметровая работа (CSP без unsafe-eval, sandbox-интерпретатор без eval, SSRF-защита прокси, timing-safe auth sync-server), но провайдерские API-ключи лежат в IndexedDB в открытом виде «by design», legacy-копии ключей остаются в localStorage, CSP-конфиги разъехались между dev/prod, а админ-команды не имеют авторизации.

## Резюме
Приложение — браузерный «кошелёк» клиентских LLM-ключей, поэтому главная зона риска — хранение секретов. Архитектурное решение «vault удалён, ключи в IndexedDB в plaintext» (комментарий в key-vault.ts) снижает цену компрометации XSS/расширением до полной кражи всех ключей. Разовая миграция ключей (key-migration.ts) копирует ключи в KeyStore, но не удаляет старые plaintext-копии из localStorage и sqlite-блоба. Санитизация HTML-рендера в основном грамотная (DOMPurify, экранирование), однако markdown-рендер форума не экранирует двойные кавычки → возможна инъекция атрибутов через href. CSP-политики в index.html, docker/nginx.conf и docker/nginx-ssl.conf не синхронизированы по connect-src — в SSL-проде прямые вызовы 15 провайдеров будут заблокированы. CORS-прокси и sandbox-worker, напротив, сделаны аккуратно: allowlist доменов, SSRF/TOCTOU-защита, AST-валидация кода без eval, gate VITE_SANDBOX_ENABLED.

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| S1-01 | Высокий | Провайдерские API-ключи хранятся в IndexedDB в plaintext «by design» — vault отключён от bootstrap | src/kernel/services/key-management/key-vault.ts:32 |
| S1-02 | Высокий | Миграция ключей не удаляет legacy-plaintext-копии из localStorage и sqlite-блоба | src/kernel/dal/key-migration.ts:92 |
| S1-03 | Средний | Секреты интеграций (company gateway и др.) в localStorage в открытом виде, 7+ панелей | src/components/CompaniesPanel.tsx:92 |
| S1-04 | Средний | CSP-дрейф: connect-src в index.html и nginx-ssl.conf не содержит 15 провайдеров из nginx.conf — блокировка вызовов в SSL-проде | docker/nginx-ssl.conf:47 |
| S1-05 | Средний | Markdown-рендер форума не экранирует `"`, возможен выход из атрибута href (XSS-атрибутов, смягчается CSP) | src/kernel/services/forum/forum-service.ts:328 |
| S1-06 | Средний | AdminService: команды (reset/restart/settings) без авторизации — admin-токен удалён (C-7) | src/kernel/services/admin-service.ts:475 |
| S1-07 | Низкий | KeyVault.unlock()/SecurityService.initialize() принимают любой пароль без верификации (нет контрольного значения) | src/kernel/services/key-management/key-vault.ts:44 |
| S1-08 | Низкий | .env.example документирует паттерн VITE_KEY_* — Vite инлайнит VITE_* в клиентский бандл | .env.example:52 |
| S1-09 | Низкий | cors-proxy: запросы без Origin-заголовка проходят origin-проверку | scripts/cors-proxy.mjs:102 |
| S1-10 | Инфо | X-XSS-Protection deprecated; Trusted Types не включены (упомянуты в комментарии, но отсутствуют в CSP) | docker/nginx.conf:27 |
| S1-11 | Инфо | PromptSecurityService — regex-эвристика инъекций; легко обходится, но реально подключена в chat-пайплайне | src/kernel/services/chat-executor.ts:154 |

## Детали находок

### S1-01. Ключи в IndexedDB в plaintext (Высокий)
Файл: `src/kernel/services/key-management/key-vault.ts:32-36`
```ts
/**
 * KeyVault — AES-GCM + PBKDF2 key encryption.
 *
 * NOTE: Vault is intentionally NOT wired into the app's bootstrap.
 * See key-registry.ts:619: "Vault system removed — keys stored as plaintext".
 * API keys are stored in IndexedDB in plaintext by design.
```
Подтверждение в рантайме: `src/kernel/services/key-management/key-service.ts:411`
```ts
// Vault unlock failure is non-fatal — keys will be stored as plaintext
```
Ключи пишутся через `keyStore.bulkPut(...)` (`key-registry.ts:611-613`) без шифрования.

Влияние: любой XSS, вредоносное браузерное расширение или физический доступ к машине (IndexedDB не шифруется на диске в ряде ФС-конфигураций) получают все ключи всех провайдеров. Для SPA, чья суть — хранение LLM-ключей, это центральный риск.
Рекомендация: вернуть vault в bootstrap (код готов: AES-GCM + PBKDF2, KeyVault реализован), шифровать ключ на записи в KeyStore, хранить master key хотя бы в session-only WebCrypto (non-extractable) или через passphrase-разблокировку.

### S1-02. Миграция оставляет plaintext-дубликаты (Высокий)
Файл: `src/kernel/dal/key-migration.ts:99-105, 116-140`
```ts
const [localKeys, blobKeys, dexieKeys] = await Promise.all([
    readLocalStorageKeys(),          // 'super_agents_api_keys' из localStorage
    readSqliteBlobKeys(deps.db),     // 'sqlite_db_blob' из KV
    readDexieKeys(deps.keyStore),
]);
...
await deps.keyStore.bulkPut(persistable);
```
В файле нет ни одного `removeItem`/удаления KV-записи: после миграции plaintext-ключи продолжают лежать в `localStorage['super_agents_api_keys']` и в `sqlite_db_blob`. Флаг `keys:migrated:v12` гарантирует, что повторной попытки не будет.
Влияние: даже после внедрения шифрования в KeyStore старые plaintext-копии остаются в двух легкодоступных местах.
Рекомендация: после успешного `bulkPut` удалять legacy-источники (`ssrSafeStorage.removeItem(STORAGE_KEY)`, `db.deleteKv(DB_BLOB_KEY)`), делать это идемпотентно.

### S1-03. Секреты интеграций в localStorage (Средний)
Файл: `src/components/CompaniesPanel.tsx:91-92` (аналогично `CostsPanel.tsx:118-119`, `AdaptersPanel.tsx:92-93`, `IssuesPanel.tsx:150-151`, `PortabilityPanel.tsx:69-70`, `RunsPanel.tsx:107-108`, `ApprovalsPanel.tsx:108-109`, `config-registry.ts:319`)
```ts
localStorage.setItem(URL_KEY, url);
localStorage.setItem(SECRET_KEY, secret);
```
Влияние: токены company-gateway/синк-сервера читаются любым скриптом страницы и не зачищаются при logout/сбросе.
Рекомендация: унифицировать хранение через один SecretStore (Dexie + шифрование), не раскидывать `SECRET_KEY` по панелям.

### S1-04. CSP-дрейф между конфигами (Средний)
Файл: `docker/nginx-ssl.conf:47` и `index.html:19` — короткий список:
```
connect-src 'self' https://*.openrouter.ai https://*.openai.com https://*.anthropic.com https://generativelanguage.googleapis.com https://*.cloudflare.com https://*.cerebras.ai https://*.groq.com https://*.nvidia.com; ...
```
а `docker/nginx.conf:37` (dev-контейнер) содержит ещё 15 хостов: `api.together.xyz`, `api.fireworks.ai`, `api.deepseek.com`, `api.moonshot.ai`, `api.minimax.io`, `dashscope-intl.aliyuncs.com`, `api.blackbox.ai`, `api.scaleway.ai`, `api.cometapi.com`, `models.inference.ai.azure.com`, `api.mistral.ai`, `api.cohere.com`, `api-inference.huggingface.co`, `api.perplexity.ai`. Полный список есть и в `vite.config.ts:115` (dev).
Влияние: в production-SSL сборке прямые вызовы адаптеров DeepSeek/Qwen/Kimi/MiniMax/Cerebras-совместимых и др. будут блокироваться CSP (в репозитории есть `src/llm/deepseek/deepseek-adapter.ts` и наследники OpenAiCompatibleAdapter). Комментарий в index.html требует «Keep this CSP in sync» — но синхронизации нет.
Рекомендация: генерировать CSP из единого списка провайдеров (build-time include) или тестировать CSP e2e-тестом на каждый адаптер.

### S1-05. Атрибутивная XSS в рендере форума (Средний)
Файл: `src/kernel/services/forum/forum-service.ts:327-338`
```ts
private renderBody(text: string): string {
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped
        .replace(
            /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
            '<a href="$2" target="_blank" rel="noopener">$1</a>',
        )
```
и рендер: `src/components/ForumPanel/TopicView.tsx:137`
```tsx
dangerouslySetInnerHTML={{ __html: post.renderedHtml }}
```
`"` не экранируется, а класс символов URL `[^)\s]+` допускает `"`: пост `[x](http://a.com/"onmouseover="alert(1))` даёт `href="http://a.com/"onmouseover="alert(1)"` — выход из атрибута. Пост пишут и агенты (author.kind === 'agent'), т.е. контент LLM попадает в innerHTML.
Влияние: инъекция атрибутов/разметки в посты форума. Inline-обработчики событий режутся CSP (`script-src 'self' 'wasm-unsafe-eval'` без unsafe-inline), но политика сломается, если её ослабят (см. S1-04), и остаётся возможность фишинговой подмены ссылок/верстки.
Рекомендация: добавить `.replace(/"/g, '&quot;')` в escape и/или пропускать итоговый HTML через DOMPurify (как уже сделано в `src/components/ChatPanel/highlight-utils.tsx:232`).

### S1-06. Admin-команды без авторизации (Средний)
Файл: `src/kernel/services/admin-service.ts:473-538`
```ts
// C-7 removed: admin token was only obfuscation, not real auth (single-user local-first app)
...
async executeCommand(command: string, args: Record<string, unknown>) {
    ...
    case 'update_settings':
        this.deps.settingsService.updateSettings(args);
```
Влияние: любой код в контексте страницы (XSS, расширение с доступом к DOM) может дергать `executeCommand`/`updateAgentConfig`/`reloadRuntime` (сброс состояния, рестарт агентов). Осознанный трейдофф local-first-приложения, но в связке с S1-01/S1-05 снижает стоимость атаки.
Рекомендация: минимум — чувствительные команды (reset runtime, update settings) за二次 подтверждением и журналированием origin вызова; в идеале — capability-токен, выдаваемый после явного действия пользователя.

### S1-07. Разблокировка vault без проверки пароля (Низкий)
Файл: `src/kernel/services/key-management/key-vault.ts:44-77`
```ts
async unlock(password: string): Promise<boolean> {
    ...
    this.masterKey = await crypto.subtle.deriveKey(...);
    this._locked = false;
    return true;
}
```
`unlock()` никогда не ошибается: неверный пароль создаёт «валидный» ключ, `_locked=false`, а `decryptKey()` вернёт null только при расшифровке. Аналогично `SecurityService.initialize()` (src/kernel/security.ts:21-40) — `initialize(любаяСтрока)` возвращает true.
Влияние: пользователь не узнает о неверном пароле; данные молча «расшифруются» в null/мусор; невозможна безопасность от оффлайн-подбора.
Рекомендация: хранить верификатор (например, AES-GCM шифрование известной константы при первом setPassword) и проверять пароль при unlock.

### S1-08. Паттерн VITE_KEY_* в .env.example (Низкий)
Файл: `.env.example:52-67`
```
# ── API Keys (for bulk import script scripts/insert-all-keys.ts) ──────────────
# VITE_KEY_OPENROUTER_01=
# VITE_KEY_GEMINI_01=
```
Влияние: все переменные `VITE_*` Vite встраивает в клиентский бандл. Скрипта `insert-all-keys.ts` в scripts/ уже нет (есть `seed.ts.disabled`), но шаблон провоцирует заполнить `.env` ключами, которые попадут в публичную сборку.
Рекомендация: удалить секцию или переименовать без префикса VITE_, добавить eslint/CI-проверку на секретные VITE_-переменные.

### S1-09. Origin-проверка cors-proxy пропускает запросы без Origin (Низкий)
Файл: `scripts/cors-proxy.mjs:101-106`
```ts
const origin = req.headers['origin'];
if (origin && origin !== CORS_ORIGIN) {
    res.writeHead(403, ...); return;
}
writeCorsHeaders(res);
```
Влияние: не-браузерные клиенты (curl, node) и запросы расширений без Origin проходят и получают доступ к проксированию allowlist-доменов. SSRF-защита и allowlist при этом работают, риск ограничен.
Рекомендация: для POST-запросов требовать Origin строго; добавить rate-limit (в sync-server он есть, здесь нет).

### S1-10. Устаревшие/отсутствующие заголовки (Инфо)
Файл: `docker/nginx.conf:27`
```nginx
add_header X-XSS-Protection "1; mode=block" always;
```
`X-XSS-Protection` игнорируется современными браузерами; Trusted Types (упомянуты в комментарии SEC-06 на строке 34) в CSP не включены — при активном использовании `dangerouslySetInnerHTML` это дешёвая дополнительная страховка.
Рекомендация: заменить на `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` по необходимости, рассмотреть `require-trusted-types-for 'script'` в report-only.

### S1-11. Prompt-injection фильтр — эвристика (Инфо)
Файл: `src/kernel/services/chat-executor.ts:154`
```ts
const scanResult = this.deps.promptSecurityService.scan(promptText);
```
Сканер (`prompt-security-service.ts:18-161`) — словарные regex-правила («ignore», «you are now», DAN и т.п.), тривиально обходится перефразированием/не-латиницей; score-блок (blockOnScore=7) работает. Дополнительный sanitize в `src/stores/chat/chat-send-message.ts:146-152` тоже line-start-эвристика.
Рекомендация: рассматривать только как telemetry/defense-in-depth; не полагаться на блокировку.

## Проверено, проблем не обнаружено
- **innerHTML/eval/Function**: по `src/` (без тестов) — `dangerouslySetInnerHTML` только в 3 местах: highlight-utils (DOMPurify), TopicView (S1-05), ProvenancePanel (SVG из `GraphVizService`, где идентификаторы экранируются `esc()` с кавычками — `src/kernel/services/rivals11/graphviz-service.ts:23-24`). Сырой `eval()`/`new Function()`/`document.write` в prod-коде не найдены.
- **JSON.parse прототип-инъекции**: `src/shared/utils/safe-json.ts:1-2` фильтрует `__proto__/constructor/prototype`.
- **SQL/NoSQL-инъекции**: SQL отсутствует (Dexie/IndexedDB, серверный store — JSON-файл); prompt-сканер ищет SQL-паттерны.
- **Sync-server auth**: `server/sync-server.mjs:51-110` — обязательный SYNC_SECRET (fail-fast), `crypto.timingSafeEqual`, rate-limit, allowlist origin, WS verifyClient.
- **SSRF**: `scripts/cors-proxy.mjs:24-63` (isPrivateIP + DNS-resolve + resolved-IP connection против TOCTOU, строки 162-165) и `src/kernel/services/sandbox-service.ts:48-59` (только https, приватные IP запрещены).
- **Sandbox-воркер**: `src/kernel/workers/sandbox-interpreter.ts:15-73` — запрещённые идентификаторы (fetch/eval/Function/importScripts/self...), запрет `constructor/__proto__/prototype` и computed-доступа; включение только в DEV или при `VITE_SANDBOX_ENABLED=true` (`sandbox-service.ts:17-18,119-125`), allowlist инструментов + лимит 10 вызовов.

## Положительные практики
- **CSP без unsafe-eval** в проде с обоснованием каждого элемента прямо в конфиге (`docker/nginx.conf:29-36`), wasm-unsafe-eval только под ONNX Runtime; deny-all для неизвестных `/proxy/*` (`docker/nginx.conf:158-161`).
- **DOMPurify** для подсветки кода чата: `src/components/ChatPanel/highlight-utils.tsx:232,295`.
- **Sandbox как AST-интерпретатор** (meriyah) вместо `new Function`, + производственный gate `VITE_SANDBOX_ENABLED`, + terminate воркера по таймауту (`sandbox-service.ts:133-141`).
- **Санитизация секретов в логах и событиях**: `src/shared/utils/sanitize.ts:1-62` (редакция sk-/AIza-/nvapi-... ключей), переиспользуется в EventBus (`event-bus.ts:289`) и LLMHttpClient (`llm-http-client.ts:3`).
- **Sync-server**: обязательный SYNC_SECRET с fail-fast, timing-safe сравнение, rate-limit, explicit origin allowlist (`server/sync-server.mjs:51-110`).
- **Export-защита**: `key-registry-utils.ts:144-150` бросает ошибку при попытке экспорта plaintext-ключей при залоченном vault (P0-#2).
- **Пользовательский код авторства**: bootstrap-снапшот ключей живёт в module scope, а не на `globalThis` — комментарий и реализация в `src/kernel/bootstrap-state.ts:1-27`.
