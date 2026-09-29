# Аудит 8: Хранение данных и кэширование (Data Storage & Caching)

## Оценка зрелости: 6/10
Зрелый Dexie-слой (43 версии схемы, zod-хуки записи, валидация импорта) и качественный CacheService (TTL/LRU/stampede-защита) обесценены тремя серьёзными дефектами: plaintext-хранение API-ключей «by design», сломанная схема индексов `memories` (`etadata...]`) и самоочистка кэша через собственное событие инвалидации.

## Резюме
Данные хранятся в трёх слоях: IndexedDB (Dexie, БД `super_agents_os_v4`, версии 5→43, 39 объявлений `version()`), localStorage (116 использований в 45 файлах через адаптеры/напрямую) и in-memory Map-кэши (CacheService, gemini modelCache). Миграционная база большая, но 37 из 39 версий — только `stores()` без upgrade-хуков; спецификация индексов таблицы `memories` содержит опечатку `etadata.source]` (124 вхождения), из-за чего код ходит по несуществующим ключ-путям и вынужден пост-фильтровать коллекции в JS. Кэш-сервис корректно реализует TTL+LRU+анти-stampede, но подписан на событие `CACHE_INVALIDATED`, которое сам же эмитит при вытеснении/перезаписи — после заполнения кэша каждая запись стирает его целиком. Главная проблема безопасности: AES-GCM KeyVault реализован (PBKDF2 100k, случайный salt), но намеренно не подключён — API-ключи лежат в IndexedDB plaintext. Кросс-табовая консистентность решена точечно (BroadcastChannel для circuit-breaker/rate-limit), QuotaExceededError обрабатывается только в трёх местах.

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| ST8-01 | Высокий | API-ключи хранятся в IndexedDB в plaintext «by design» — AES-GCM KeyVault написан, но не подключён | src/kernel/services/key-management/key-vault.ts:25 |
| ST8-02 | Высокий | Сломанная схема индексов `memories`: `'id, content, etadata.source], etadata.type], etadata.timestamp]'` — несуществующие ключ-пути, 124 вхождения `etadata` | src/kernel/services/dexie-schema.ts:349 |
| ST8-03 | Высокий | CacheService подписан на CACHE_INVALIDATED, который сам эмитит при eviction/replace — после заполнения кэш самоочищается при каждой записи | src/kernel/services/cache-service.ts:64 |
| ST8-04 | Средний | Токены gateway (SYNC_SECRET) и webhook-secret в localStorage plaintext — читаются любым XSS | src/components/CompaniesPanel.tsx:91 |
| ST8-05 | Средний | Legacy «шифрование» XOR+base64 с захардкоженным salt — security theater, дублировано в двух адаптерах | src/kernel/services/storage/local-storage-adapter.ts:5 |
| ST8-06 | Средний | Snapshot дебатов сериализуется в localStorage без ограничения размера — риск QuotaExceeded при 5 МБ | src/kernel/services/debate-runtime/debate-engine.ts:184 |
| ST8-07 | Средний | 37 из 39 версий Dexie — только stores(), 4 upgrade-хука; история версий 1–4 утрачена, откат/апгрейд со старых сборок невозможен | src/kernel/services/dexie-schema.ts:348 |
| ST8-08 | Средний | QuotaExceededError обрабатывается лишь в 3 точках; `BucketStorageAdapter.setItem` только логает потерю данных | src/kernel/services/storage-adapter.ts:129 |
| ST8-09 | Низкий | Запросы по битым индексам (`where('etadata.timestamp]')`, `orderBy('etadata.timestamp]')`) с обязательной пост-фильтрацией в JS — деградация O(n) | src/kernel/dal/memory-repository.ts:189 |
| ST8-10 | Низкий | 116 обращений к localStorage в 45 файлах, часть напрямую мимо LocalStorageAdapter — нет единой точки квоты/санитизации | src/components/CompaniesPanel.tsx:32 |
| ST8-11 | Низкий | flush() кэша пишет весь массив (до 500 записей с полными ответами LLM) в kv-таблицу каждые 2 с активности | src/kernel/services/cache-service.ts:101 |
| ST8-12 | Инфо | sessionStorage не используется вовсе (0 вхождений) — черновики и временные данные идут в localStorage | src/components/ForumPanel/PostComposer.tsx:35 |

Проверено: `rg -i 'encrypt|crypto|subtle'` — crypto.subtle используется только в KeyVault (не подключён), hmacSha256 для webhook-подписи и SHA-256 для cache-ключей; шифрования at-rest для остальных чувствительных данных нет. BroadcastChannel реализован в `src/kernel/services/cross-tab-state.ts:183` (+ fallback на localStorage) и team-collaboration-service; storage-events не используются. Обработка IndexedDB-квот (Dexie) — глобальных хуков `QuotaExceededError` на уровне БД не обнаружено.

## Детали находок

### ST8-01 — plaintext API-ключи в IndexedDB (Высокий)
Файл:строка: `src/kernel/services/key-management/key-vault.ts:25`
```ts
/**
 * KeyVault — AES-GCM + PBKDF2 key encryption.
 *
 * NOTE: Vault is intentionally NOT wired into the app's bootstrap.
 * See key-registry.ts:619: "Vault system removed — keys stored as plaintext".
 * API keys are stored in IndexedDB in plaintext by design.
```
Влияние: ключи провайдеров лежат в `apiKeys` без шифрования (запись: `src/kernel/services/storage/dexie-storage.ts:67` `await getDexieDb().apiKeys.put(key);`). Любой XSS, вредоносное расширение с доступом к IndexedDB или синхронизация профиля браузера компрометируют все ключи; экспорт `exportKeys` требует ручного encryptFn (key-registry.ts:855), но основной путь — plaintext. Реализация vault (PBKDF2 100k итераций, AES-GCM 256) готова и не используется.
Рекомендация: включить password-gated vault или как минимум WebCrypto-шифрование с несинхронизируемым ключом + пометить риск в UI.

### ST8-02 — битая схема индексов memories (Высокий)
Файл:строка: `src/kernel/services/dexie-schema.ts:349` (то же в v6…v43, напр. строки 3492, 3595)
```ts
this.version(5).stores({
    ...
    memories: 'id, content, etadata.source], etadata.type], etadata.timestamp]',
```
Влияние: опечатка `etadata` вместо `metadata` и висячие `]` без открывающих `[` — это не compound-индексы, а мусорные ключ-пути. Весь код ходит по этим именам: `db.memories.where('etadata.timestamp]')` (dexie-storage.ts:132–138, memory-repository.ts:189), `orderBy('etadata.timestamp]')` (memory-repository.ts:41). Индексируемый ключ-путь не совпадает с полем данных (`metadata.*`), поэтому индексы пусты; валидатор ключ-путей браузера может отклонить создание индекса (SyntaxError при апгрейде). Разработчики подтверждают проблему fallback-ом: после запроса идёт ручная фильтрация `arr.filter((e) => e.metadata?.type === options.type)` (dexie-storage.ts:149–158). При этом данные в записях — `metadata` (memory-repository.ts:78), т.е. опечатка гарантированно не совпадает.
Рекомендация: добавить новую версию схемы с корректными `[metadata.source+metadata.type]`-индексами и обновить все точки запроса; проверить открытие БД в реальном браузере.

### ST8-03 — кэш стирает сам себя (Высокий)
Файл:строка: `src/kernel/services/cache-service.ts:64`
```ts
this.unsub = this.deps.eventBus.on(EVENTS.CACHE_INVALIDATED, () => {
    this.clear();                       // подписка на своё же событие
});
...
// set(), строки 220-245:
if (this.cache.size >= this.maxEntries && !isReplace) {
    const oldest = this.cache.entries().next().value;
    ...
    this.deps.eventBus?.emit(EVENTS.CACHE_INVALIDATED, { reason: 'eviction', section: oldest[0] });
}
...
if (isReplace) {
    this.deps.eventBus?.emit(EVENTS.CACHE_INVALIDATED, { reason: 'update', section: key });
}
```
Влияние: после заполнения до `maxEntries` (500) каждый `set()` вытесняет элемент → эмитит `CACHE_INVALIDATED` → собственный обработчик вызывает `clear()` → вся карта (включая только что записанный ключ) и счётчики hits/misses сбрасываются. Стационарный режим кэша — «всегда пуст», LRU и метрики hit-rate теряют смысл; каждое заполнение заново греет промпты провайдеров. Событие задумано для внешних инвалидаций (snapshot-service.ts:310), но self-emit делает подписку самоубийственной.
Рекомендация: не эмитить глобальный `CACHE_INVALIDATED` из `set()` (только точечное событие eviction) либо фильтровать в подписке по payload.section.

### ST8-04 — токены gateway в localStorage (Средний)
Файл:строка: `src/components/CompaniesPanel.tsx:91` (аналогично ApprovalsPanel.tsx:108–109, CostsPanel.tsx:118–119, AdaptersPanel.tsx:92–93, RunsPanel.tsx:34, IssuesPanel.tsx:49, PortabilityPanel.tsx:17)
```ts
localStorage.setItem(URL_KEY, url);
localStorage.setItem(SECRET_KEY, secret);   // Bearer-токен SYNC_SECRET
```
Влияние: синхронный секрет sync-server хранится в localStorage бессрочно и передается Bearer-заголовком в каждой панели; кража через XSS даёт полный доступ к Gateway API (компании, бюджеты, approvals). В webhook-сервисе аналогично хранится `webhookSecret`.
Рекомендация: sessionStorage для сессий + запрос секрета при необходимости, либо хранение в IndexedDB вместе с миграцией на KeyVault (ST8-01).

### ST8-05 — XOR-«шифрование» с фиксированным salt (Средний)
Файл:строка: `src/kernel/services/storage/local-storage-adapter.ts:5`
```ts
function legacyDeobfuscate(encoded: string): string | null {
    const salt = 'a1b2c3d4e5f6g7h8';
    const text = atob(encoded);
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
```
Влияние: XOR с публичным константным ключом не является шифрованием; маркировка `legacy` есть, но деобфускация поддерживается в двух копиях (storage-adapter.ts:28–58) — новые записи могут продолжать создаваться в этом формате, создавая ложное чувство защищённости.
Рекомендация: одноразовая миграция в plaintext/KeyVault и удаление legacy-ветки.

### ST8-06 — неограниченный snapshot в localStorage (Средний)
Файл:строка: `src/kernel/services/debate-runtime/debate-engine.ts:184`
```ts
if (Object.keys(snapshot).length > 0) {
    localStorage.setItem('debate-engine:sync-backup', JSON.stringify(snapshot));
}
```
Влияние: сериализованный снапшот активных дебатов (сообщения, история) пишется на `beforeunload` без лимита; при нескольких длинных сессиях легко превысить квоту ~5 МБ — исключение глотается пустым catch (строки 186–188), бэкап теряется молча, а квота может выбить и другие ключи приложения.
Рекомендация: ограничить размер/количество сессий, писать в IndexedDB (kv), обрабатывать QuotaExceededError явно.

### ST8-07 — миграции без upgrade-хуков и потерянные v1–v4 (Средний)
Файл:строка: `src/kernel/services/dexie-schema.ts:348`
```ts
this.version(5).stores({   // первая объявленная версия — v1..v4 отсутствуют
```
Влияние: 39 версий (5→43), из них только 4 с `.upgrade()` (374, 422, 468, 596) — трансформации данных при изменении схем не выполняются, что допустимо для additive-индексов, но не для переименований полей. История версий 1–4 утеряна: установка со сборки ≤v4 (если была в дикой природе) не сможет открыться. Размер файла 3750 строк — копипаста полного stores-набора в каждой версии затрудняет ревью.
Рекомендация: вынести декларации сторов в константы-композиции, добавить smoke-тест миграции с реального старого формата (в `_test-harness.ts` — только чистое создание).

### ST8-08 — точечная обработка квот (Средний)
Файл:строка: `src/kernel/services/storage-adapter.ts:129`
```ts
message: `localStorage quota exceeded for bucket "${this.bucket}" - data may be lost`,
```
Влияние: из 116 обращений к localStorage обработка `QuotaExceededError` есть только в local-storage-adapter.ts:46 (rethrow), storage-adapter.ts:129 (warn) и research-engine-service.ts:150; остальные вызовы молча теряют данные при переполнении (частный случай — ST8-06). Для Dexie нет глобального обработчика квот IndexedDB (navigator.storage.estimate не используется).
Рекомендация: централизованный адаптер + телеметрия квоты (navigator.storage.estimate) в diagnostics.

### ST8-09 — запросы по битым индексам с пост-фильтрацией (Низкий)
Файл:строка: `src/kernel/dal/memory-repository.ts:189`
```ts
.where('etadata.timestamp]')
```
Влияние: даже если индекс создаётся, его ключ-путь не совпадает с данными → коллекции пустые/полные, отсюда обязательные `filter` в JS (dexie-storage.ts:149–158, memory-repository.ts:223) — потеря производительности и рассинхронизация между «запросом» и «правдой».
Рекомендация: единая точка (репозиторий) для запросов к memories с корректными индексами (см. ST8-02).

### ST8-10 — рассредоточенный доступ к localStorage (Низкий)
Файл:строка: `src/components/CompaniesPanel.tsx:32`
```ts
url: localStorage.getItem(URL_KEY) || DEFAULT_URL,
```
Влияние: 116 обращений в 45 файлах, при этом части минуют LocalStorageAdapter (у которого SSR-safe memory-fallback и обработка квот) — поведение в приватном режиме/SSR-тестах неоднородное.
Рекомендация: линт-правило на прямой `localStorage` (no-restricted-globals) + обязательный адаптер.

### ST8-11 — тяжёлый flush LLM-кэша (Низкий)
Файл:строка: `src/kernel/services/cache-service.ts:101`
```ts
const entries = Array.from(this.cache.values()).slice(-500);
await this.deps.database.setKv('super_agents_llm_cache', entries);
```
Влияние: полный перезапись 500 записей (с полными текстами ответов LLM) каждые 2 с активного кэширования — лишний IO и рост kv-записи до десятков МБ; единственная запись IndexedDB на 500 объектов также тормозит транзакцию.
Рекомендация: дельта-запись или ограничение на размер записи (например, только мета + обрезанный ответ).

### ST8-12 — sessionStorage не используется (Инфо)
Файл:строка: `src/components/ForumPanel/PostComposer.tsx:35`
```ts
localStorage.setItem(DRAFT_PREFIX + draftKey, body);
```
Влияние: черновики и прочие временные данные живут бессрочно в localStorage; объём не ограничен, «забытые» черновики копятся.
Рекомендация: для ephemeral-данных — sessionStorage с автоочисткой.

## Положительные практики
- `src/kernel/services/dexie-schema.ts:1878-1898` — zod-хуки `creating`/`updating` на таблицах (`rejectHook`) отклоняют невалидные записи до записи в БД — редкая для браузерных приложений практика.
- `src/kernel/services/storage/dexie-storage.ts:35-45` — `validateJsonArray` с zod-валидацией каждой записи при импорте, ошибки с путём поля.
- `src/kernel/services/cache-service.ts:70-103` — getOrFetch с дедупликацией in-flight (anti-stampede), `pendingSet` против перезаписи явных set, EMA hit-rate, деградирующая персистенция.
- `src/kernel/contracts/cross-tab-state.ts:14-19` + `src/kernel/services/cross-tab-state.ts:183-196` — кросс-табовая синхронизация circuit-breaker/rate-limit через BroadcastChannel с fallback на localStorage.
- `src/kernel/dal/key-migration.ts:11-13` — односторонняя миграция ключей из legacy localStorage/sqlite-blob с флагом `keys:migrated:v12` и повторным чтением через safeJsonParse.
- `src/kernel/services/key-management/key-vault.ts:30-88` — готовая криптография (PBKDF2 100k + AES-GCM 256, случайный salt, persist salt) — инфраструктура для будущей vault-интеграции.
- `server/sync-server.mjs:176,277-281` — атомарная запись файла БД (tmp+rename) с сериализацией через writeQueue; `server/company-store.mjs:40` — тот же паттерн.
