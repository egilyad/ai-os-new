# Debate Deep Audit — 5 типов (ключи, время, контекст, вердикт, конфиги)

Дата: 2026-09-13 · Тип: статический аудит, БЕЗ изменений кода.
Контекст: 4 провайдера, 20 ключей, дебаты мрут с "All LLM providers unavailable"; ответы длинные, но со швами; вердикт иногда не доходит.

Легенда: 🔴 убивает дебаты · 🟠 деградация/ложные срабатывания · 🟡 мёртвый код/телеметрия

---

## Аудит 1. Ключи и роутинг — почему 20 ключей не спасают

Как идёт ход: `debate-llm-caller.ts:254` → `resolveProvider` (`debate-query-engine.ts:248`), 6 шагов: sticky-мапа → ветка modelId → `router.getDebateProviders(5)` → `getRankedProviders` → brute-force. `triedKeys/triedModels/rejectedCombos` живут **один ход**; `_failedProviders/_failedModels` — **всю сессию** (`debate-session.ts:37`, clear только в `destroy()`).

- 🔴 **20 ключей ужаты до 4**: `router-debate-selector.ts:137-142` схлопывает до 1 ключа на провайдер. Остальные 16 — только через altKey того же провайдера.
- 🔴 **Резолвер слеп к перегреву**: фильтр ключа — `status==active + !authFailed + !tried`, без `rateLimited/backoff/healthScore` (`query-engine.ts:294-357`). `getBackoffMs` существует (`key-health.ts:107`), в бою не читается.
- 🔴 **Липкая смерть ключа**: `authFailed = prev || isAuth` (`key-state-store.ts:360-361`), сброс только через `ingestProbe:665`. Один 402/401 = смерть до следующего удачного проба, а пробы — раз в 300с с игнором упавших 5 мин (`probe-service.ts:120-124`, `key-health.ts:259`).
- 🔴 **Флаг на весь провайдер**: `PROVIDER_*_SYNCED` вешается на ВСЕ ключи провайдера (`key-state-store.ts:426-476`). Один чих — все 6 ключей Google в бане. Общей квоты проекта код не видит вообще.
- 🔴 **HALF-OPEN = dead**: медленный 5xx → circuit half-open (1 слот) → `markProviderFailed` (`error-handler.ts:245-248`).
- 🔴 **Неизвестные ошибки убивают провайдера**: `markProviderFailed` на любой UNKNOWN — 500/сеть/парсинг (`error-handler.ts:410`). 4 единичных сбоя = `ALL providers dead` → throw.
- 🟠 **Таймауты circuit не видит** (`circuit-breaker.ts` early-return): тихий stall-провайдер жрёт полные 30/90с каждый ход.
- 🟠 **429 без retries++** крутится до `MAX_CALL_LLM_ITERATIONS=50` / `noProviderSpin=5`, затем `throw No available API keys` — ход-скип, следующий агент повторяет.
- 🟠 **Healthcheck = `GET /models`, не инференс** (`key-health.ts:158-174`): ключ с живой `/models` и мёртвым чатом идёт в бой и умирает за счёт ретраев.
- 🟠 **Префлайт травит заранее** (`preflight:87,146,175` + `pipeline:107`): сессия стартует с отравленным `_failedProviders`.

## Аудит 2. Время — математика не сходится

Перекрытия (первый срабатывает): SSE-idle (15s gemini / 30s остальные) → caller 30s → gov +15s → HTTP 120s.

- 🔴 **Все на 30s**: large-паттерн (`/70b|120b|.../`, `query-engine.ts:23-27`) не матчит текущие модели (flash-lite, llama-4) — ветка 90s мертва.
- 🔴 **4096 токенов за 30s не влезают**: 100–200 tok/s = 20–40s + TTFT + enrichment. Комментарий в коде про "fits" неверен. Нужен ~60s normal / idle 60s либо scale timeout ∝ maxTokens.
- 🟠 **SSE-idle == caller timeout (30s)** — гонка; у gemini idle 15s убивает здоровые паузы первым.
- 🟠 **Худший ход**: normal ~100s, large ~285s (3 попытки + бэкоффы). Раунд из 28 агентов последовательно — 45+ мин при сбоях.
- 🟠 **`maxConcurrency: 8` мёртв**: бюджет его не проверяет, оркестратор идёт строго последовательно (`orchestrator.ts:217-244`).
- 🟡 **Расинхрон длительностей**: менеджер 90 мин (после нашего фикса) vs бюджет 60 мин; roundDelay в трёх местах (3s/1s/2s).
- 🟡 **Телеметрия врёт**: `DEBATE_AGENT_TIMEOUT` всегда шлёт 30s даже для large.

## Аудит 3. Контекст — откуда швы и эхо

- 🔴 **Плато 25–35k токенов**: `getAllSteps().slice(-50)` полным текстом + `trimContent(8)` оставляет 8 полных (~24k) — больше контекста мелких моделей. Швы/эхо отсюда.
- 🔴 **Формат учит подделывать**: история с метками `[Имя (self/opponent)]`, роли `user/assistant` по `i%2` (оппонент иногда assistant), `###`-блоки без экранирования. Модель копирует: `[Секретарь (opponent)]`, `### Твой ответ`. Защиты нет.
- 🟠 **Semantic-cache без длины**: точный ключ включает `maxOutputTokens` (safe), а семантический смотрит только model/keyHash/temperature — похожий длинный запрос может получить короткий старый ответ (TTL 60s).
- 🟠 **Дубликат-детектор жжёт своих**: jaccard по 2 последним ходам, пороги 0.45/0.3 — легитимные похожие длинные ответы режутся; цена — wildcard-бан модели для всех ключей.
- 🟠 **Валидация бьёт цитирующих**: незаякоренные regex — длинный ответ с цитатой оппонента ("как языковая модель") = ложный reject + сжигание модели.
- 🟠 **413 лечится исключением моделей**, а не урезанием: `compress-route` (truncate-middle) в цепочке дебатов не используется — деградация в слабые модели и скипы.
- 🟡 `stripSpeakerPrefix` — только ведущий префикс; внутритекстовое эхо не трогает.

## Аудит 4. Вердикт — 13 дыр "вердикта нет"

Счастливый путь: governor-stop → synthesis → `consensusAndFinalize` (`pipeline:388`) → `generateVerdictWithLLM` (30s) → validate+save → `VERDICT_GENERATED` → `completed` → `SESSION_COMPLETED` + scoring.

- 🔴 **D2/D5**: любой throw в roundLoop/финале → `failed`, вердикта нет, saveSnapshot для failed скипается.
- 🔴 **D6/D7**: maxDuration/resume/engine-crash вне pipeline — вердикт не генерируется вообще; catch краха делает cancel без finalize и без heuristic.
- 🔴 **D8/D10**: finalize для cancelled/failed — только события, без history/вердикта; failed не персистится.
- 🟠 **D4**: throw в snapshot/validate — WARN, `completed` БЕЗ вердикта и события (UI врёт "завершено").
- 🟠 **D3**: `conclusionEngine==null` — молча пропуск, completed без вердикта.
- 🟠 **D7-heuristic**: только если `arguments.length>0`; пустые дебаты — ноль вердиктов.
- 🟠 **D11**: Zod-fail вердикта — warn без save, а событие уже ушло (рассинхрон UI/DB).
- 🟡 **Heuristic-цифры — псевдоуверенность**: confidence от длины/раундов, победитель — "кто больше наговорил" (`count*1M+words`), `totalTokens: 0`. Честной оценки аргументов нет.
- 🟡 **Recovery нет**: после failed — только ручной restart/resume; регенерации вердикта по готовым аргументам нет.
- 🟡 `emitOnce` давит повторный вердикт в окне ~30s; `debateLiveStore` оба финальных события игнорирует (арена не показывает вердикт).

## Аудит 5. Конфиги — живые vs мёртвые

**Мёртвые** (объявлены, дефолты, round-trip в персист — и ни одного читателя): `roundDelayMs`, `maxTokens`, `temperature`, `debateTemperature` (целиком, вместе с промпт-параметром без вызывающих), `useModerator`, `timeoutMs` (как поля `DebateConfig`; живые аналоги — в глобальном `CONFIG.services.debate`), `topology.nodes[].provider/modelId`, `config` с экрана создания (всегда `undefined`), `maxConcurrency`, `IDebateSession.maxRounds` (геттера нет у класса).
**Частично**: `useGovernor` (глобал жив/пер-сессия мертва), `topology.maxDepth` (только governor), `edges`, budget-лимиты (механика без настройки — engine передаёт только maxRounds), пин при недоступности (fallback, не смерть).
**Живые**: `language`, `qualitySettings`, `maxDurationMs`-таймер, `topology.type`, `nodes.role`, `participants`-пины (provider/model с fallback), governor (`setMaxRounds`/hard-cap/soft-floor/стоп-чек), `reserveAndRecord`/`incrementRound`.
Вдогонку: `executor.ts:83` хардкод `limit: 100_000` в `DEBATE_BUDGET_UPDATED` врёт UI при реальных 1.5M.

---

## Приоритет фиксов (по соотношению эффект/риск)

1. **Вердикт при failed** (D2/D5/D6/D7): отдельный `recoverVerdict` по сохранённым аргументам + heuristic всегда (убрать `arguments.length>0` гейт, D7). Закрывает "дошёл-не-дошёл" наполовину.
2. **429/перегрев в резолвере**: читать `rateLimited/backoff` при выборе ключа + не схлопывать до 1 ключа на провайдер (минимум 2-3). Закрывает смерть при 20 ключах.
3. **Липкие смерти**: TTL на `authFailed`/`markProviderFailed` (сброс через N минут или успешный проб), отдельный счёт перегрева от бана.
4. **Таймаут ∝ длине**: 60s normal при 4096 (или scale от maxOutputTokens) + idle 60s. Убирает ложные смерти длинных ответов.
5. **Формат истории**: квотирование/экранирование `[]`/`###`, правильные роли (оппонент всегда user), семантический кэш с длиной в ключе.
6. **Оживление конфигов**: `temperature` в вызов, `maxConcurrency` в оркестратор или удалить, `executor.ts:83` лимит из бюджета.
7. **Честный heuristic**: confidence от покрытия/противоречий, а не от длины; `totalTokens` реальный.
