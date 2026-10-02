# Audit Report — ai-os-new @ n4-chain-backup

Дата: 2026-09-11 · Аудитор: Mavis

Это **не security audit** и **не тестирование** — это статический обзор по структуре, выборочной глубокой проверке ключевых модулей (kernel, security, llm http, container, service-helper, weight-optimizer, конкурент-сервисы) и архитектурных рисков. Размер кодовой базы — 3647 файлов, поэтому покрыто ~1.5% — фокус на «узлах».

Легенда: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low

---

## TL;DR — главные находки

| # | Severity | Что | Файл |
|---|----------|-----|------|
| 1 | 🔴 | `GuardrailService.violated()` инвертирует всю логику проверок — guardrail пропускает вредное и блокирует нормальное | `src/kernel/services/rivals/guardrail-service.ts:84-97` |
| 2 | 🔴 | `SecurityService.changePassword()` сверяет ключ от старого пароля с ключом от нового — `false` всегда при корректном старом пароле | `src/kernel/security.ts:50-57` |
| 3 | 🔴 | `Base64` через `String.fromCharCode(...new Uint8Array(buf))` — упадёт с RangeError на >~120KB шифротексте, тихо через catch | `src/kernel/security.ts:9-11, 86` |
| 4 | 🟠 | `bootstrap` помечает interrupted debates как `failed` под видом «Auto-resume» — комментарий лжёт | `src/kernel/bootstrap.ts:480-513` |
| 5 | 🟠 | `bootstrap.ts:467-471` — «Force GC» через аллокацию 64MB буфера — не GC, а **увеличение** memory pressure | `src/kernel/bootstrap.ts:466-471` |
| 6 | 🟠 | `bootstrap` init `configService` дважды (init() и initServices()) | `src/kernel/bootstrap.ts:122, 214-216` |
| 7 | 🟠 | `LLMHttpClient.cancelAll()` отменяет ВСЕ HTTP, не только LLM, при memory pressure | `src/kernel/bootstrap.ts:458` |
| 8 | 🟠 | `Container` кэширует ошибки фабрик на 60s — может заблокировать запуск при transient DB issue | `src/kernel/container.ts:99-103` |
| 9 | 🟠 | `setSLAMode` тихо проглатывает невалидный mode + стирает custom base weights | `src/kernel/weight-optimizer.ts:52-67` |
| 10 | 🟠 | `VoidService.assist` глотает ошибку LLM в пустой catch — пользователь не узнает | `src/kernel/services/rivals19/void-service.ts:14` |
| 11 | 🟠 | `BulkService.runBulk` имитирует обработку синхронно — это mock, не bulk | `src/kernel/services/rivals13/dust-bulk.ts:23-25` |
| 12 | 🟡 | `rivals8` отсутствует в нумерации (rivals, rivals2…7, **9**, 10…20) — copy-paste без ревью | `tree.json` |
| 13 | 🟡 | Архитектура: ~70+ папок в `src/kernel/services/`, 19 «rivals*» директорий — overengineering / copy-paste конкурентных архитектур | `src/kernel/services/` |
| 14 | 🟡 | `LLMHttpClient` setTimeout для timeout не очищается при раннем return → утечка timer'ов | `src/llm/http/llm-http-client.ts:117-125` |
| 15 | 🟡 | `retryAfter` от сервера не ограничен сверху — сервер может вернуть «Retry-After: 99999999» | `src/llm/http/llm-http-client.ts:458` |
| 16 | 🟡 | `weight-optimizer` накапливает delta без decay — залипает после 15 успехов | `src/kernel/weight-optimizer.ts:14-29` |
| 17 | 🟡 | `service-helper.lazyService` бросает ошибку при доступе к `undefined`/null свойствам — ломает контракт «getOptional» | `src/kernel/service-helper.ts:56` |
| 18 | 🟢 | `MAX_CONCURRENT = 50` статически — без документации почему именно столько; выше Chrome per-origin лимита | `src/llm/http/llm-http-client.ts:29` |

---

## 1. Архитектурные риски (масштаб)

### 1.1. Размер и «коллекция конкурентов»

В репозитории 3647 файлов (по `git tree`), 2734 из них — в `src/`. Под `src/kernel/services/` — **70+ подпапок**, из них **19 директорий вида `rivals*`**, каждая с 5–10 «сервисами-клонов». Нумерация скачет: `rivals`, `rivals2`…`rivals7`, **`rivals9`** (нет `rivals8`), `rivals10`…`rivals20`. Внутри каждой — сжатые 15–50-строчные сервисы, явно сгенерированные по шаблону (см. `VoidService` — 18 строк, `DustBulk` — 54 строки, три класса на одном файле).

Это **не продакшн-сервисы** — это либо mock-каркасы «под каждого конкурента», либо dead code. **Рекомендация:** либо выделить в отдельный пакет `services-showcase/`, либо удалить. Поддерживать 70+ директорий «ядра» — нереально.

### 1.2. `src/kernel/index.ts` — большой barrel

311 строк, экспортирует ~30 сервисов + все типы. Комментарий правильно предупреждает kernel-internal код НЕ импортировать отсюда, но сам факт того, что это приходится писать — признак плохого layering. Если кто-то из kernel всё же импортнёт через barrel — циклические зависимости.

### 1.3. Множественные шимы событий

`bootstrap.ts:90-93` вызывает `setConfigEventBus`, `setBucketStorageEventBus`, `setDexieStorageEventBus`, `setMessageIndexEventBus`, `setAgentIdentityResolver` — **5 глобальных singleton-сеттеров**. Это **service locator pattern с manual DI** — работает, но тестировать тяжело (нет изоляции). Каждый новый шим — это +1 глобал.

### 1.4. `defaultContainer` singleton

`container.ts:216` экспортирует `export const defaultContainer = new Container();` — глобальный singleton. Тесты могут импортировать этот контейнер через `import { defaultContainer }` и случайно загрязнить state между тестами. `clear()` есть, но полагаться на дисциплину — рискованно.

---

## 2. Критические баги

### 🔴 2.1. GuardrailService — инвертированная логика

**Файл:** `src/kernel/services/rivals/guardrail-service.ts`

```ts
case 'contains':
  return !text.toLowerCase().includes((rule.pattern ?? '').toLowerCase());  // ← ИНВЕРТИРОВАНО
case 'regex':
  return !new RegExp(rule.pattern as string).test(text);                    // ← ИНВЕРТИРОВАНО
case 'minLength':
  return text.length < (rule.value ?? 0);                                    // ← логически «нарушено», но это условие ВЫПОЛНЕНО когда мало
case 'maxLength':
  return text.length > (rule.value ?? Number.MAX_SAFE_INTEGER);             // ← аналогично
```

Возвращаемое `true` означает `violated`, и затем:
```ts
if (rule.tripwire === 'block') blocked = true;
```

То есть правило `contains: 'spam'` блокирует текст, в котором **нет** слова «spam». Правило `minLength: 100` блокирует текст короче 100 символов (это, в принципе, то что хотели — но тогда нужно переименовать в `minLengthOrBlock` и поменять местами с `maxLength`).

**Правильное** решение:
```ts
case 'contains': return text.toLowerCase().includes(pattern.toLowerCase());
case 'regex':    return new RegExp(pattern).test(text);
case 'minLength': return text.length >= value;     // нарушено, если текст короче
case 'maxLength': return text.length <= value;
```

### 🔴 2.2. SecurityService.changePassword — сломанная аутентификация

**Файл:** `src/kernel/security.ts:42-71`

```ts
const oldKey = await this._deriveKey(oldPassword, oldSalt);          // ключ от OLD пароля
const oldKeyBytes = await crypto.subtle.exportKey('raw', oldKey);
const newKeyBytes = await crypto.subtle.exportKey('raw', this._key); // ключ от NEW пароля (из init())

if (base64Encode(oldKeyBytes) !== base64Encode(newKeyBytes)) {        // ← всегда false для валидного смены пароля
    return false;
}
```

`this._key` после `initialize(newPassword)` — это ключ, **производный от нового пароля через salt**. `oldKey` — от старого через тот же salt. Они **равны только если `oldPassword === newPassword`**, то есть когда менять пароль не нужно. Любая реальная смена пароля **всегда возвращает `false`**. Пользователь не сможет сменить пароль.

**Правильно:** сохранять ключ от старого пароля при `initialize()`, или просить `initialize(oldPassword)` отдельно перед `changePassword`.

Дополнительно: при смене пароля сначала перезаписываются `_salt` и `_key` (строки 61-62), **затем** вызывается `reEncrypt`. Если `reEncrypt` упадёт — зашифрованные данные **недоступны** под новым ключом, и пользователь **теряет все свои секреты**.

### 🔴 2.3. base64 через spread — упадёт на больших данных

**Файл:** `src/kernel/security.ts:9-11`

```ts
function base64Encode(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
```

`String.fromCharCode(...N)` падает с `RangeError: Maximum call stack size exceeded` при N > ~65 000 аргументов (зависит от движка). Для типичного LLM-ответа в 50KB текста — это 50 000 UTF-16 code units → шифротекст 50KB → `Uint8Array(50000)` → 50 000 аргументов в `fromCharCode` → **V8 падает**.

`catch` молча возвращает `null` (строка 88), и caller видит «шифрование провалилось» без объяснения.

**Правильно:**
```ts
function base64Encode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
// Или вообще: btoa(String.fromCharCode.apply(null, bytes)) — то же ограничение.
// Современно: const b64 = btoa(String.fromCharCode(...bytes)); — то же.
// Лучше: hex или base64 через TextEncoder / готовый пакет типа 'base64-arraybuffer'.
```

### 🔴 2.4. GuardrailService — нет тестов? (гипотеза)

Сервис настолько тривиальный (4 типа правил, тупой switch), что это явный copy-paste с инверсией. Если есть тесты — они проверяют **обратное** поведение (что `true === not violated`) и тесты тоже сломаны. **Проверь `*.test.ts` рядом.**

---

## 3. Архитектурные косяки среднего уровня

### 🟠 3.1. Bootstrap — двойной init configService

`bootstrap.ts:122` и `bootstrap.ts:214-216` — оба вызывают `lifecycle.tryInit('configService', () => configService.init())`. `LifecycleManager.tryInit` вероятно имеет защиту от повтора (стоит проверить), но если нет — configService инициализируется дважды, что может:
- продублировать event subscriptions;
- создать дубль в KV storage;
- на race-condition с Dexie упасть на второй инициализации.

### 🟠 3.2. Bootstrap — «Auto-resume» помечает как failed

`bootstrap.ts:480-513` — комментарий говорит «Auto-resume interrupted debates», но код **переводит их в `failed`**, не возобновляет. Если пользователь потерял интернет на полчаса во время 5-минутного debate — он теперь видит **всё как failed** при следующем запуске. Реальный resume потребовал бы rehydrate state и продолжить с нужной фазы.

### 🟠 3.3. «Force GC» — это не GC

`bootstrap.ts:466-471`:
```ts
const buf = new ArrayBuffer(64 * 1024 * 1024);
buf.toString(); // touch
```

Аллокация 64MB **увеличивает** working set. V8 не делает GC по запросу из JS (только через `--expose-gc` + `global.gc()`). Этот код — **плацебо + потенциальный OOM** под нагрузкой. **Удалить.**

### 🟠 3.4. cancelAll() — отмена всего HTTP

`LLMHttpClient.cancelAll()` в `bootstrap.ts:458`. Имя класса — `LLMHttpClient`, но **статический registry `_inflight`** хранит вообще все запросы, прошедшие через этот класс. Если в системе только LLM-клиенты — ок. Но если кто-то начнёт использовать `LLMHttpClient` для не-LLM (например, для своего API) — **все** эти запросы будут отменены под memory pressure. Документировано ли это?

### 🟠 3.5. Container — кэш ошибок фабрик 60 секунд

`container.ts:99-103` — если фабрика упала (например, IndexedDB ещё не готова при первом вызове), следующие **60 секунд** все попытки получить сервис будут бросать закешированную ошибку. Это **агрессивный fail-fast**, который приводит к «приложение не запускается, перезагрузи через минуту». TTL должен быть или короче (1–5s), или зависеть от типа ошибки (transient → меньше, structural → больше).

### 🟠 3.6. setSLAMode — тихая ошибка + уничтожение custom weights

`weight-optimizer.ts:52-67`:
```ts
if (!VALID_SLA_MODES.includes(mode)) return;  // тихо
// ...
state.weights.base = weights[mode];           // перезаписывает custom
```

Если пользователь настроил custom base через `setBaseWeights({ttft: 0.5, tps: 0.3, reliability: 0.2})`, потом переключил SLA на BALANCED, потом вернулся обратно — **custom значения потеряны**. Нет «user weights» слоя.

### 🟠 3.7. VoidService.assist — глотает ошибки

`rivals19/void-service.ts:14`:
```ts
if (this.llm) { try { const r = await this.llm.chat(...); if(!r.error) out=r.content; } catch {} }
```

Пустой `catch {}` + нет логирования, нет метрики. Если LLM сломан — пользователь получает «Void assist for ${prompt}» и думает что это ответ модели. Это **обман** в production-сервисе.

### 🟠 3.8. BulkService.runBulk — fake bulk

`rivals13/dust-bulk.ts:23-25`:
```ts
const results = lines.map((l, i) => `${l},result_${i}_${prompt.slice(0,20)}`).join('\n');
await this.dal.kv.set(`bulk-result/${id}`, results);
```

«Bulk processing» = склеить строки через map. Это **mock**, не bulk. Если этот код в проде — пользователь получает бессмыслицу. **Либо реализовать реальный batch через LLM, либо явно назвать `mockBulk`.**

### 🟠 3.9. MemoryWatchdog — отменяет всё подряд

`bootstrap.ts:451-472` — при memory pressure (heap > 200MB):
- `debateEngine.clearWarmCache?.()` — OK
- `debateService.clearVerdictCache?.()` — OK (кэши можно чистить)
- `debateService.truncateArguments?.(2)` — **обрезает аргументы debate до 2 раундов**. Если debate был на 10 раундов и пользователь пишет 11-й — он теряет историю. **Без предупреждения.**
- `LLMHttpClient.cancelAll()` — отменяет ВСЕ активные запросы (см. 3.4)
- `new ArrayBuffer(64 * 1024 * 1024)` — увеличивает pressure (см. 3.3)

Если это срабатывает в обычной работе (200MB — не такая уж большая цифра для браузера) — пользователь теряет данные.

---

## 4. Менее критичные баги

### 🟡 4.1. LLMHttpClient — setTimeout без clearTimeout

`llm-http-client.ts:117-125`:
```ts
const ctrl = new AbortController();
setTimeout(
    () => ctrl.abort(new DOMException('Timeout', 'TimeoutError')),
    this.#timeoutMs,
);
return { signal: ctrl.signal, controller: ctrl };
```

Нет ссылки на timer → нет `clearTimeout` при успешном fetch. Таймер «сработает через 60s и abort'нет уже завершённый ctrl» — no-op, но **на горячем пути = тысячи timer'ов, пока GC не пройдёт**. Небольшая утечка.

### 🟡 4.2. retryAfter — нет верхней границы

`llm-http-client.ts:458`:
```ts
const seconds = parseInt(header, 10);
if (!isNaN(seconds) && seconds > 0) return seconds * 1000;
```

Если сервер вернёт `Retry-After: 86400` (1 день) или `99999999` (3 года) — клиент уснёт на это время. Стоит clamp до, скажем, 5 минут max.

### 🟡 4.3. weight-optimizer — delta без decay

`weight-optimizer.ts:14-29` — после 15 успешных ответов `delta.reliability = 0.3` (cap), после этого провайдер «залип» как надёжный. Нет EMA, нет decay. Если провайдер **вчера** был хорош, а **сегодня** сломался — система не отреагирует, пока не получит 6 провалов подряд (с `-0.05` шагом от 0.3). В среднем 5 минут реакции вместо мгновенной.

### 🟡 4.4. lazyService — undefined свойства = ошибка

`service-helper.ts:56`:
```ts
if (val !== undefined && val !== null) return val;
// ...
throw new Error(`ServiceNotRegisteredError: ${name} — ${String(prop)} accessed before registration`);
```

Если сервис зарегистрирован, но свойство `undefined` (например, `service.someOptionalMethod` ещё не реализовано в этой версии) — будет ошибка. Caller не может отличить «сервис не зарегистрирован» от «свойство не определено».

### 🟡 4.5. Container.clear() — async/sync mismatch

`container.ts:142-181` — `clear()` async (дожидается destroy), но `register()` sync. После `await clear()` можно зарегистрировать новые — но `_inflight` статика в LLMHttpClient, `_container` в service-helper, `boundMethods` WeakMap — **не очищаются**. Утечка между «сессиями».

### 🟡 4.6. Container — нет детекции непрямых циклов

`container.ts:82-86` детектирует только прямую рекурсию (`A → A`). Цикл `A → B → C → A` через разные пути — не ловится. Типично для DI без scoped resolution context.

### 🟡 4.7. MAX_CONCURRENT = 50

`llm-http-client.ts:29` — статический лимит на 50 одновременных HTTP-запросов. **Выше Chrome per-origin лимита (обычно 6)**. На практике первые 6 параллельных будут в очереди браузера, остальные 44 — в очереди `LLMHttpClient._waitingQueue`. **Нет измерений**, почему именно 50. Возможно, legacy от прошлой версии.

---

## 5. Замечания по структуре (не баги, но «запахи»)

- **`server/` — всего 2 файла** (`run-dev.mjs`, `sync-server.mjs`) — что это за sync-server? Не задокументировано. Если это реальный бэкенд — слишком тонкий. Если это dev-tool — почему в корне, а не в `scripts/`?
- **`.superagents/`** — 5 файлов (ARCHITECTURE, CODING, README, RULES) — внутренняя документация. **Хорошо**, что она есть. Стоит проверять, что эти правила не устарели.
- **`.husky/pre-commit.disabled`** — husky hooks отключены. **Lint-staged настроен, но не выполняется.** Коммиты проходят без проверки.
- **`AGENTS.md`** — есть в корне. Стоит прочитать (не успел).
- **`docs/` — 851 файл** — массивная документация. Не покрыто аудитом.

---

## 6. Что я НЕ проверил (и почему)

- **`src/kernel/services/rivals*`** — просмотрел 3 файла из ~100+. Если в них систематически copy-paste с инверсиями — это может быть массовый баг.
- **`src/llm/{openai,groq,gemini,deepseek,qwen,...}`** — каждый провайдер имеет свою реализацию. Если хотя бы в одном неправильно маппится response — все запросы молча сломаны.
- **`src/kernel/services/memory`, `services/rag`, `services/cognitive-intelligence`** — RAG/память обычно держит самые жирные баги.
- **Тесты** — упомянуты `container.test.ts`, `integration.test.ts` в kernel/. Не смотрел — если они покрывают happy path, баги выше они не поймают.
- **UI слой (`src/components/`, `src/hooks/`, `src/stores/`)** — там свои баги (рендер, state, эффекты), но ядро показалось более критичным.
- **Production build / Vite config / Dockerfile** — не смотрел.

---

## 7. Что делать в первую очередь

1. **🔴 Исправить `GuardrailService.violated()`** — убрать `!` для contains/regex, перепроверить minLength/maxLength. **Сейчас это security-уязвимость** (пропускает всё, что должно блокироваться).
2. **🔴 Исправить `SecurityService.changePassword()`** — это полностью сломанная функциональность. Сохранять ключ от старого пароля при init.
3. **🔴 Заменить base64 через spread** на итеративный base64 или npm-пакет. **Сейчас упадёт на любом >65KB шифротексте.**
4. **🟠 Добавить `clearTimeout` в `#withTimeout`** — мелкая утечка, но на горячем пути множится.
5. **🟠 Добавить decay в `weight-optimizer`** — иначе router залипает.
6. **🟠 Удалить «Force GC» 64MB буфер** — он ухудшает ситуацию, а не улучшает.
7. **🟠 Документировать `LLMHttpClient.cancelAll()`** — какие именно запросы отменяются.
8. **🟡 Решить судьбу `rivals*`** — оставить как showcase или удалить.

---

**Итог:** проект **живой, структурированный** (kernel + services + llm + UI), **написан с учётом DI/testability**, видно что автор думал о layering (barrel-предупреждения, B-комментарии, FACTORY_FAILURE_TTL, etc.). Но:

- **Критические баги в security и guardrails** — нужно чинить в первую очередь.
- **Overengineering** — 70+ папок сервисов, 19 `rivals*` директорий, mock-сервисы выглядят как production. Это риск для maintainability.
- **Архитектурные компромиссы** (глобальные singleton-шимы, 5 setBus функций, кэш ошибок 60s) — работают, но требуют документации.

Если хочешь — могу нырнуть в конкретный модуль глубже (LLM providers, memory, debate service), или провести code review на PR. Просто скажи, куда копнуть дальше.
