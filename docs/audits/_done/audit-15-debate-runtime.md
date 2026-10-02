# Debate Runtime Audit — ai-os-new @ n4-chain-backup

Дата: 2026-09-11 · Аудитор: Mavis · Модуль: `src/kernel/services/debate-runtime/`

Это **углублённый аудит debate-runtime** — самой большой и сложной части проекта (~270 сервис-файлов, ~110 контрактов). Я просмотрел ключевые файлы: state-machine, engine, orchestrator, llm-caller, llm-error-handler, llm-backoff, llm-errors, llm-utils, phase-handler, pipeline-builder, session-bridge, engine-cancel, stop-conditions, finalizer. **Другие сервисы (entanglement, critic, steelman, RAG, etc.) НЕ покрыты** — это отдельный заход.

Легенда: 🔴 critical · 🟠 high · 🟡 medium · 🟢 low

---

## TL;DR — главные находки (debate-specific)

| # | Severity | Что | Файл |
|---|----------|-----|------|
| 1 | 🔴 | `debate-llm-caller.ts`: утечка `cleanupGov` listener'ов на каждом успешном/упавшем LLM-вызове | `debate-llm-caller.ts:325-361, 433-443` |
| 2 | 🔴 | `debate-llm-caller.ts`: AbortController регистрируется в общем Map **на каждой retry-итерации** — нет cleanup до success | `debate-llm-caller.ts:208-211` |
| 3 | 🔴 | `debate-orchestrator.ts`: bidding использует `lastArgRole = node.id` вместо `role` — bidding сломан by design | `debate-orchestrator.ts:225` |
| 4 | 🔴 | `debate-orchestrator.ts`: participation/lastInteraction Maps — глобальные, не per-session — cross-session contamination | `debate-orchestrator.ts:32-36` |
| 5 | 🟠 | `debate-orchestrator.ts`: re-entrant sort во время for-итерации — хрупкая логика, нет объяснения | `debate-orchestrator.ts:241-249` |
| 6 | 🟠 | `debate-phase-handler.ts`: новый `consensusEngine` instance на каждый phase change — N3 correlation сломана | `debate-phase-handler.ts:266-267` |
| 7 | 🟠 | `debate-phase-handler.ts`: correlation score всегда `delta: 0`, reduce возвращает 0 — мёртвый код | `debate-phase-handler.ts:270-277` |
| 8 | 🟠 | `debate-llm-error-handler.ts`: приоритет проверок `error.includes('All LLM providers unavailable')` идёт ДО timeout — порядок неверный | `debate-llm-error-handler.ts:79-82` |
| 9 | 🟠 | `debate-llm-error-handler.ts`: `triedKeys.clear()` после exhausted wildcards — может зациклить на той же упавшей key | `debate-llm-error-handler.ts:375` |
| 10 | 🟠 | `debate-llm-backoff.ts`: race condition в `backoffWait` — между проверкой `signal.aborted` и `addEventListener` | `debate-llm-backoff.ts:62-74` |
| 11 | 🟠 | `debate-engine.ts`: Best-of-N scoring — длина текста + ключевые слова = наивная метрика, можно «спамить» длинным текстом с маркерами | `debate-engine.ts:566-574` |
| 12 | 🟠 | `debate-engine.ts`: 3 последовательных `session.transition(...)` без await — Promise отбрасываются | `debate-engine.ts:386-388` |
| 13 | 🟠 | `debate-engine-cancel.ts`: lock acquire — fire-and-forget без await | `debate-engine-cancel.ts:105-125` |
| 14 | 🟠 | `debate-engine-cancel.ts`: `cleanupStaleSessions` нигде не вызывается из этого файла — нужен engine tick | `debate-engine-cancel.ts:195-237` |
| 15 | 🟠 | `debate-llm-validation.ts`: `length < 10` отклоняет легитимные короткие ответы ("Yes", "Согласен") | `debate-llm-validation.ts:33` |
| 16 | 🟠 | `debate-llm-validation.ts`: regex только на русском/английском — китайский/французский мусор пройдёт | `debate-llm-validation.ts:6-29` |
| 17 | 🟡 | `debate-state-machine.ts`: self-loop блокировка может сломать `deliberating → BEGIN_ROUND → deliberating` (новый раунд) | `debate-state-machine.ts:111-116` |
| 18 | 🟡 | `debate-state-machine.ts`: если afterHook бросает — `_current` уже изменён, caller не знает | `debate-state-machine.ts:171-181` |
| 19 | 🟡 | `debate-stop-conditions.ts`: две разные `calculateConfidence` / `estimateConfidence` имплементации, drift | `debate-stop-conditions.ts:5-49` vs `debate-llm-utils.ts:70-79` |
| 20 | 🟡 | `debate-session-bridge.ts`: восстановление даёт confidence=0.7 для всех аргументов — реальные данные теряются | `debate-session-bridge.ts:81` |
| 21 | 🟡 | `debate-llm-errors.ts`: классификация всё ещё использует string-match, несмотря на комментарий про 3 prod incidents | `debate-llm-errors.ts:79-104` |
| 22 | 🟡 | `debate-engine.ts`: `_restoreOrphanedSessions` — auto-pause active сессий на reload без user intent | `debate-engine.ts:222-228` |
| 23 | 🟢 | `debate-engine.ts`: пустой `async init() {}` — нет валидации deps | `debate-engine.ts:119` |

---

## 1. Архитектурные риски

### 1.1. Масштаб

`src/kernel/services/debate-runtime/` содержит **~270 .ts файлов** (по `git tree`). Из них ~120 .test.ts. Сервисов — ~150. Контрактов — ~110. Это либо самый большой модуль проекта, либо один из самых больших.

**Что это значит:** даже беглый code review каждого файла — нереалистичен. Авторы явно рассчитывают что архитектурные границы (DI, контракты, state machine) защитят от хаоса. Это **работает** судя по тому что я видел, но при большом числе сервисов появляются copy-paste паттерны.

### 1.2. Двойные классификации ошибок

Существуют **два** места где классифицируются LLM ошибки:

1. `debate-llm-errors.ts:71-144` — `classifyLlmError()` — возвращает `LlmError` с `code` enum.
2. `debate-llm-error-handler.ts:79-395` — повторная классификация через `error.includes(...)`.

**Проблема:** error-handler не использует `classified.code` последовательно. Часть логики на `code` (PAYMENT_REQUIRED, AUTH, RATE_LIMIT), часть на string match (NO_KEYS, PROVIDER_UNAVAILABLE, content-level failures). Дрейф inevitable.

### 1.3. Глобальный state в orchestrator

`DebateOrchestrator.participationCount`, `lastInteraction`, `bidScores` — **глобальные** Maps, не per-session. Если пользователь запускает 2 debate параллельно (через разные tabs или session IDs), они **шадят state**. Наблюдаемое поведение: bidding сортирует по участию **по всем сессиям сразу**.

---

## 2. Критические баги

### 🔴 2.1. cleanupGov listener leak (llm-caller)

**Файл:** `src/kernel/services/debate-runtime/debate-llm-caller.ts:325-361, 433-443`

```ts
const govOp = gov.start({ ... });
const onGovAbort = () => { ... };
govOp.signal.addEventListener('abort', onGovAbort, { once: true });
cleanupGov = () => govOp!.signal.removeEventListener('abort', onGovAbort);
// ...
govOp?.fail(e);             // catch (строка 439) — НЕ вызывает cleanupGov
throw e;
// ...
govOp?.complete();           // success (строка 442)
cleanupGov?.();              // success — OK
```

**Проблема:** в catch (строка 433-441) `cleanupGov?.()` **не вызывается**. Listener на `govOp.signal` остаётся. На следующей итерации retry (или следующем debate) — ещё один listener. За 10 минут debate с 20 retries → 20 висящих listener'ов на governor signal. GC не освободит — signal живёт пока governor жив.

**Исправление:** вызвать `cleanupGov?.()` в catch перед throw.

### 🔴 2.2. AbortController накапливается в Map

**Файл:** `debate-llm-caller.ts:208-211`

```ts
const controller = new AbortController();
if (!deps.sessionAbortControllers.has(sessionId))
    deps.sessionAbortControllers.set(sessionId, new Map());
deps.sessionAbortControllers.get(sessionId)!.set(participant.agentId, controller);
```

На **каждой итерации while loop** создаётся новый controller и перезаписывает старый. Старый controller становится orphan (не хранится, не aborted). Его cleanup — `sessionAbortControllers.get(sessionId)?.delete(participant.agentId)` (строка 597) — происходит **только на success** или **в некоторых error-handler ветках**. Если retry бросает исключение, не проходящее через ветки с delete — **старый controller утекает** + новый перезаписывается.

Конкретные утечки:
- Строка 488: `throw new Error('Response validation failed: cross-agent duplicate')` — **НЕ** делает delete перед throw.
- Строка 510: `throw new Error('Response validation failed: ...')` — **НЕ** делает delete.
- Строка 538: `throw new Error('Entanglement validation failed: ...')` — **НЕ** делает delete.

**Эти throw'ы попадают в catch на строке 602**, который **тоже не делает delete** (только `cleanupGov?.()` и abortSignal.removeEventListener). Внешний catch (строка 651-665) **делает** delete (строка 655) — но это только в **outermost** catch. Между throw и outer catch — controller уже заменён новым в Map, и старый GC'ается (если повезёт).

**Исправление:** делать `delete(participant.agentId)` в finally, а не только в success.

### 🔴 2.3. bidding использует node.id вместо role

**Файл:** `debate-orchestrator.ts:225`

```ts
if (result.success) {
    this.participationCount.set(node.id, ...);
    // P2.13: Update last argument context for bidding relevance
    lastArgRole = node.id;  // ← BUG: должен быть role агента
    lastArgContent = result.content || '';
    // ...
    const bid = this.computeBid(
        rem.id,
        rem.label,  // ← это label, не role
        lastArgRole,  // ← передаётся id
        lastArgContent,
        ...
    );
```

**Проблема:** `computeBid` (строка 41-71) сравнивает `role === lastArgRole` (строки 51-55). `role` приходит из `rem.label` (это display label, не role). `lastArgRole` — это id. **Сравнение role vs id всегда false** → бонус за «different role» (`+= 0.3`) **никогда не срабатывает**.

**Исправление:** передавать `participant.role` или хранить role агента в отдельной Map.

### 🔴 2.4. participationCount cross-session contamination

**Файл:** `debate-orchestrator.ts:32-36`

```ts
private participationCount = new Map<string, number>();
private lastInteraction = new Map<string, string>();
private bidScores = new Map<string, number>();
```

Все три — instance-level Maps, не per-session. Если orchestrator обслуживает несколько sessions (а `abort/getSessionSignal` принимают `sessionId` — значит обслуживает), то:

- debate A на агенте `agent-1` — participationCount['agent-1'] = 3.
- debate B запускается, агенты те же (или другой набор с пересечением).
- bidding для debate B видит `participationCount['agent-1'] = 3` от A и сортирует соответственно. **B искажается данными A.**

**Исправление:** сделать Maps nested `Map<sessionId, Map<agentId, ...>>`.

---

## 3. Архитектурные косяки (high severity)

### 🟠 3.1. re-entrant sort во время iteration

**Файл:** `debate-orchestrator.ts:241-249`

```ts
const nextNodes = remainingNodes.slice(ni + 1);
nextNodes.sort((a, b) => {
    const scoreA = this.bidScores.get(a.id) ?? 0;
    const scoreB = this.bidScores.get(b.id) ?? 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.id.localeCompare(b.id);
});
remainingNodes.splice(ni + 1);
remainingNodes.push(...nextNodes);
```

Мы внутри `for (let ni = 0; ni < remainingNodes.length; ni++)`. Модифицируем `remainingNodes` через `splice+push`. На следующей итерации `ni++` → читаем элемент на позиции `ni+1` (который теперь другой). **Неочевидно, что это задумано.** Может работать по счастливой случайности.

**Исправление:** переписать через `while` с явным индексом или собирать результат в отдельный массив.

### 🟠 3.2. consensusEngine создаётся заново каждый раз

**Файл:** `debate-phase-handler.ts:266-267`

```ts
const consensusEngine = deps.consensusEngine ?? new (require('./debate-consensus').DebateConsensusEngine)();
const consensusForCorrelation = consensusEngine.evaluate(claims);
```

`?? new (require(...).DebateConsensusEngine)()` — **новый instance** на каждый phase change. Если у engine есть internal state (history, cached contradictions), он теряется. N3 correlation записывает `consensusForCorrelation.confidence` без истории. **Correlation metric бессмысленна.**

Плюс: `require(...)` в ESM — антипаттерн, замедляет tree-shaking, не работает в некоторых bundler'ах.

### 🟠 3.3. correlation delta=0 (мёртвый код)

**Файл:** `debate-phase-handler.ts:270-277`

```ts
const avgOverall = session.participants.length > 0
    ? session.participants.reduce((sum, p) => {
        // ... return sum; ← всегда 0
    }, 0)
    : 0;
```

`reduce` возвращает `sum` (без изменений). На каждой итерации. `avgOverall = 0` всегда. Используется в `qualityCollector.record({ delta: 0, ... })` — то есть **delta всегда 0, корреляция не считается**.

### 🟠 3.4. Приоритет проверок в error-handler

**Файл:** `debate-llm-error-handler.ts:79-82`

```ts
if (error.includes('All LLM providers unavailable')) {
    // throw
}
// ... timeout handling ниже
```

Если error содержит оба ('All LLM providers unavailable' И 'TimedOut' substring), мы сначала бросаем — даже если это был таймаут. **Неправильный приоритет.** Должно быть: TIMEOUT → CANCEL → fast-fail.

### 🟠 3.5. triedKeys.clear() зацикливает

**Файл:** `debate-llm-error-handler.ts:375`

```ts
state.triedKeys.clear();
await backoffWait(state.noProviderSpinCount, state.externalSignal);
return { kind: 'continue' };
```

После clear — следующая итерация может зарезолвить **тот же ключ**, который только что упал (если ошибка была в ключе, а не в модели). `noProviderSpinCount >= 5` (строка 346) — guard, но 5 итераций × retry backoff = до 150s wasted.

### 🟠 3.6. backoffWait race condition

**Файл:** `debate-llm-backoff.ts:62-74`

```ts
if (externalSignal?.aborted) throw ...;  // проверка
const jitter = ...;
const delay = ...;
let _onAbort;
await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, delay);
    _onAbort = () => { clearTimeout(timer); reject(...); };
    if (externalSignal) externalSignal.addEventListener('abort', _onAbort, { once: true });
    // ← race window: если abort происходит между `if` и addEventListener,
    //   listener не зарегистрируется, таймер не очистится, Promise не reject'нётся
});
```

Между проверкой `aborted` (строка 62) и `addEventListener` (строка 74) — окно в микросекунды, но **существует**. Если abort приходит туда — listener не будет вызван, `timer` не очистится, Promise зависнет на `delay` ms.

**Исправление:** использовать `setTimeout(0)` чтобы синхронно дождаться следующего тика перед addEventListener, или использовать `AbortSignal.any()` (но он GC-bug-prone).

### 🟠 3.7. Best-of-N — наивная метрика

**Файл:** `debate-engine.ts:548-587`

```ts
const score =
    content.length +                                          // длина
    (content.split(' ').length > 15 ? 50 : 0) +               // >15 слов
    (content.includes('because') ||
     content.includes('therefore') ||
     content.includes('however') ? 30 : 0);                   // keyword маркеры
candidates.push({ content, score });
```

**Проблема:** LLM может нагенерировать длинный текст с surface reasoning markers без реальной глубины. Метрика выберет самый длинный, не самый качественный. **3x стоимость за сомнительный прирост.**

**Исправление:** использовать blind evaluation из `IBlindEvaluationService` (deps.blindEval), который уже подключён в phase-handler.

### 🟠 3.8. transitions без await

**Файл:** `debate-engine.ts:386-388`

```ts
session.transition('queued');
session.transition('initializing');
session.transition('active');
```

`StateMachine.send()` — **async** (state-machine.ts:120). Возвращает Promise. **Promise не await'ится.** Если переход упадёт (guard reject) — мы узнаем только когда `buildPipeline` запустится и упадёт на неконсистентном state.

### 🟠 3.9. cancel lock — fire-and-forget

**Файл:** `debate-engine-cancel.ts:105-125`

```ts
lockSvc
    .acquire(`debate:${sessionId}`, { ttl: 10_000 })
    .then((result) => { ... })
    .catch((err) => ...);
```

**Не await'ится.** Cancel может выполниться до получения lock. Две вкладки могут cancel'ить одновременно → двойной emit, двойной budget charge.

### 🟠 3.10. cleanupStaleSessions нигде не вызывается

**Файл:** `debate-engine-cancel.ts:195-237`

Функция определена, но в файле нет `export` + нет вызова. В `debate-engine.ts:236-252` — приватный `_cleanupStaleSessions` который **вызывает** `cleanupStaleSessions({...})`. ОК, вызывается через tick. Но **не экспортируется для тестов**. Если тесты хотят вызвать напрямую — не смогут.

### 🟠 3.11. validation < 10 символов — false positive

**Файл:** `debate-llm-validation.ts:33`

```ts
if (!trimmed || trimmed.length < 10) {
    return { valid: false, reason: 'Empty or too short' };
}
```

Легитимные ответы: "Yes", "No", "Согласен", "Нет" — все < 10 символов. Будут отклонены как «too short». **Ложный позитив.**

### 🟠 3.12. validation regex только русский + английский

**Файл:** `debate-llm-validation.ts:6-29`

Если LLM отвечает на китайском / французском / хинди — instruction leakage паттерны не сработают, мусор пройдёт.

---

## 4. Менее критичные баги

### 🟡 4.1. state-machine self-loop блокировка

**Файл:** `debate-state-machine.ts:111-116`

```ts
if (this._current === target) {
    return new Error(reason ?? `Self-loop blocked: ...`);
}
```

TRANSITION_TABLE.deliberating → BEGIN_ROUND → deliberating (строка 32). **Легитимный self-loop** (новый раунд) заблокирован. Если только caller не обходит через counter.

### 🟡 4.2. state-machine afterHook бросает

**Файл:** `debate-state-machine.ts:171-181`

```ts
this._current = target;
for (const h of this._afterHooks) {
    try { await h(from, target, event); } catch (e) {
        return { success: false, from, to: target, ... };
    }
}
```

`_current` уже изменён на `target`. Но возвращаем `success: false`. **Caller не знает, в какой фазе реально state.** Если caller проверяет `if (result.success) state = result.to;` — он не обновит. Если проверяет `machine.current` — получит target.

### 🟡 4.3. Дублирование calculateConfidence / estimateConfidence

**Файлы:** `debate-stop-conditions.ts:5-49` vs `debate-llm-utils.ts:70-79`

Две реализации одной идеи, разные regex. **Drift inevitable.** Кто-то использует одно, кто-то другое.

### 🟡 4.4. bridge восстанавливает confidence=0.7

**Файл:** `debate-session-bridge.ts:81`

`confidence: defaultConfidence` (default 0.7). Все аргументы после snapshot restore имеют одинаковую confidence. Реальная confidence, вычисленная через `calculateConfidence`, **теряется**.

### 🟡 4.5. llm-errors всё ещё string match

**Файл:** `debate-llm-errors.ts:79-104`

Несмотря на комментарий про «magic strings live ONLY here» (строка 13), `classifyLlmError` использует `abortReason.includes('TimedOut')`, `errStr.includes('API key not valid')`. **Это та же string-matching классификация**, просто в одном файле. Если кто-то в адаптере поменяет текст ошибки — классификация сломается, как и раньше (3 prod incidents).

### 🟡 4.6. _restoreOrphanedSessions auto-pause

**Файл:** `debate-engine.ts:222-228`

```ts
if (Date.now() - record.updatedAt > ZOMBIE_THRESHOLD) {
    record.phase = 'failed';
} else {
    record.phase = 'paused';
}
```

Активная сессия (< 5 минут stale) → автоматически становится paused **без user intent**. Пользователь не знает, что его сессия paused (если только не смотрит store).

### 🟢 4.7. Engine init пустой

**Файл:** `debate-engine.ts:119`

```ts
async init(): Promise<void> {}
```

Нет валидации deps. Если `getKeyService()` упадёт — узнаем только при первом `startSession`.

---

## 5. Замечания по структуре

### 5.1. Массивный debate-runtime

~270 файлов. Покрыто ~5% (15 файлов). **Остальные сервисы не проверены** — но судя по тому что я видел:

- `debate-consensus.ts`, `debate-evaluator.ts`, `debate-rag-retriever.ts` — критичные, могут содержать race conditions и неправильную агрегацию.
- `debate-prompt-builder.ts`, `debate-prompt-context.ts` (53KB!) — большие файлы, prompt engineering сложно audit'ить без LLM-as-judge.
- `services/debate-governor/` — state machine для claim graph, может содержать логические баги в contradiction detection.
- `services/debate-memory.ts`, `debate-memory-extractor.ts` — extraction и хранение, обычно баги с concurrency.

### 5.2. Множественные setBus singletons

`bootstrap.ts` вызывает `setConfigEventBus`, `setBucketStorageEventBus`, `setDexieStorageEventBus`, `setMessageIndexEventBus`, `setAgentIdentityResolver`. Это **5 глобальных singleton-сеттеров**. Тесты могут импортировать эти модули и случайно загрязнить state.

### 5.3. debateplus — только 3 файла

`src/kernel/services/debateplus/`: `argtech-consensus-bridge.ts`, `argtech-service.ts`, `format-service.ts`. Содержит «ArgTech» integration (аргумент-mining framework). Маленький, но мост между runtime и формальным анализом — потенциально интересные баги.

---

## 6. Что делать в первую очередь

1. **🔴 Исправить listener leak в `debate-llm-caller.ts`** — вызвать `cleanupGov?.()` в catch (строка 439). Тривиальный fix, серьёзная утечка.
2. **🔴 Исправить AbortController cleanup** — обернуть весь try-catch в блок, который **всегда** делает `delete(participant.agentId)` в finally.
3. **🔴 Исправить bidding — передавать `role` вместо `node.id`** — однострочный fix, но bidding сейчас де-факто сломан.
4. **🔴 Per-session Maps в orchestrator** — обернуть `participationCount`, `lastInteraction`, `bidScores` в `Map<sessionId, Map<agentId, ...>>`.
5. **🟠 Не await'ить transition'ы — добавить await + try/catch**.
6. **🟠 Заменить наивный Best-of-N scoring на blind evaluation**.
7. **🟠 Удалить string-match классификацию в error-handler** — использовать `classified.code`.
8. **🟠 Исправить validation** — уменьшить minimum length до 3 или убрать совсем.
9. **🟡 Переписать correlation на реальный расчёт** (сейчас delta=0 всегда).
10. **🟡 Расширить regex на китайский/французский** или сделать lang-agnostic через embedding similarity.

---

**Итог:** debate-runtime — **самый большой и самый продуманный** модуль проекта. Видно работу многих людей, есть DI, контракты, state machine, обработка ошибок. **Но есть несколько critical багов** (listener leak, bidding, abort cleanup) которые нужно фиксить в первую очередь, и архитектурный долг (глобальный state, двойная классификация, мёртвый correlation code) — который делает код хрупким при росте.

Если хочешь — могу нырнуть в конкретный сервис из нераскрытого: `debate-consensus`, `debate-memory`, `debate-governor`, `debate-rag-retriever`, или один из «rivals» подмодулей. Скажи куда.
