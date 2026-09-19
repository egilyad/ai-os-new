# CHAT_DESIGN.md — Этап 2 (DESIGN): минимальный план исправлений

> Основание: `CHAT_ARCHAEOLOGY.md` + `CURRENT_CHAT_FAILURES.md`. Код пока не менялся.
> Принцип: переиспользовать существующее, новых сущностей не вводить (кроме нуля — все фиксы укладываются в текущие контракты).

---

## Fix 1 — `/chat?session=` deep-link

```text
Current  → ChatPanel/* query вообще не читает; hydration ставит most-recent.
Problem  → «Open in Chat» (ChatSessionsManagerPanel:412, SessionHubPanel:209,470) открывает чужую сессию.
Reuse    → useChatStore.sessions/isLoaded/setActiveSessionId; useSearchParams (react-router-dom уже зависимость);
           образец — дебатный фикс 5ff060a (history → Dexie loadSession → setSession → clear param).
Change   → useEffect в ChatPanel: при ?session=<id> и isLoaded — если id есть в sessions, setActiveSessionId(id);
           параметр зачистить через history.replaceState (как в DebatePanel:208-210,237-239);
           неизвестный id — молча игнор.
Result   → дип-линк открывает нужную беседу; существующий restore-эффект (ChatPanel:106-120) подтянет key/model UI.
```

## Fix 2 — `STREAM_ERROR` / error-`MESSAGE_RESPONSE` сохраняют частичный контент

```text
Current  → STREAM_ERROR ставит content:'' (chat-event-handlers.ts:145);
           MESSAGE_RESPONSE мержит {...r, ...res} (там же :48-49), а emitError шлёт content:'' (chat-executor.ts:791).
Problem  → пришедший префикс стрима выбрасывается; продолжить/повторить не с чего.
Reuse    → существующие r.content + поле error (уже в типе, тест store.test.ts:390-399 его проверяет, content — нет).
Change   → STREAM_ERROR: content оставить r.content, добавить error + status:'error'.
           MESSAGE_RESPONSE: если входящий статус error/cancelled/timeout И входящий content пуст И текущий непуст —
           текущий сохранить; done — как было.
Result   → partial-ответы переживают ошибки; сценарий №4 (отказ модели → switch → continue) не теряет префикс.
```

## Fix 3 — persist ассистента на терминальном ответе (не только дебаунс)

```text
Current  → запись ассистента только 1s debounced flush (hydration.ts:178-187); окно потери ~1s + крэш.
Problem  → H.1: хвост ответа может не дожить до Dexie.
Reuse    → resolveSessionStore из store-helpers.ts (уже есть); _get в setupChatEventHandlers(set, _get) — задействовать;
           put идемпотентен (version CAS, dexie-storage.ts:267-277).
Change   → в STREAM_END и терминальном MESSAGE_RESPONSE (done/error/cancelled/timeout): после set() fire-and-forget
           sStore.put(сессия из get()); сессии нет — skip; catch → console.error (дебаунс остаётся safety-net).
           Петли нет: put пишет тот же updatedAt → liveQuery-мерж (:141-152) видит равенство → no-op.
Result   → сценарии №1/№2: ответ в Dexie сразу по завершении, крэш <1s ничего не теряет.
```

## Fix 4 — персистить `activeSessionId`, восстанавливать при гидрации

```text
Current  → hydration ставит cleaned[0].id (hydration.ts:131); выбор пользователя на reload теряется.
Problem  → F.2: после reload открывается чужая (самая свежая) беседа.
Reuse    → BucketStorageAdapter (уже импортирован в hydration.ts; sync localStorage-обёртка);
           ключ 'chat_active_session_id'.
Change   → store.setActiveSessionId: + persist id. hydration initial load: читать сохранённый id,
           валидировать против cleaned (иначе fallback cleaned[0] ?? DEFAULT).
Result   → сценарий №2: reload возвращает ту же Conversation A; продолжить можно сразу.
```

## Fix 5 — `🔄 Switched` не кормить моделям (UI/тесты не трогать)

```text
Current  → все role:'system' истории скармливаются как system messages (chat-send-message.ts:153-155),
           включая маркеры переключения (store.ts:520-526,565-571).
Problem  → D.3: служебный шум в контексте каждой следующей модели.
Reuse    → та же сериализация + префикс-маркер '\u{1F504}'.
Change   → в flatMap (:153-155): system-entry с текстом на 🔄 — skip (return []); остальные system — как было.
           Персист, UI-индикатор, store.test.ts:560 — без изменений.
Result   → чистый контекст при смене модели; переключение без побочных эффектов.
```

## Проверено, фиксировать нечего (в работу не берём)

- **Fix 6 (ChatExecutor.init вне lifecycle) — СНЯТ.** `register()` авто-зовёт `registerWithLifecycle`
  на первом `get()` (helpers.ts:64-66) → `LifecycleManager` (init+destroy, bootstrap.ts:524-536).
  init() вызывается в проде; опасение аудита не подтвердилось.
- **§23 CometAPI — уже поддерживается.** `cometapi` в `SUPPORTED_PROVIDERS` (adapter-factory.ts:73),
  `OpenAiCompatibleAdapter('cometapi','https://api.cometapi.com/v1',true)` (:167-173) — ровно тот endpoint
  из задачи. Отдельной системы не нужно; `gpt-oss-20b-free` пойдёт через стандартный key→discovery→chat путь.
- **Agent attach (§6-7, сценарий №3) — отдельный дизайн, не Этап 3.**
  Нужны: `agentId?` в ChatSession/targets/metadata, picker в ChatPanel, detach-контракт, вердикт по
  pinned-model vs switch (контракт уже намекает: пусто/auto = route runtime, agent-resolver.ts:32-36).
  Не влезает в «минимальные исправления» — вынести следующей задачей после стабилизации 1-5.

## Порядок внедрения (Этап 3) и проверка (Этап 4)

1. Fix 2 → 2. Fix 3 → 3. Fix 5 → 4. Fix 4 → 5. Fix 1.
   (Порядок: сначала неубиваемость данных, потом навигация.)
2. Верификация: `vitest stores/chat` (STREAM_ERROR/done/switchModel green), build transform 4616 модулей,
   ручные сценарии №1 (6 сообщений через 3 конфигурации), №2 (reload), №4 (error → switch → continue).
3. Критерий: Conversation A содержит все сообщения по порядку с корректным per-response
   provider/model/keyId; reload возвращает ту же беседу; префиксы ошибок на месте.
