# Debate Reset Audit — почему дебаты "слетают" в форму запуска

Дата: 2026-09-12 · Тип: статический аудит, БЕЗ изменений кода.
Симптом: идущий дебат в середине сбрасывается к виду "как будто только зашёл" — форма запуска вместо живого процесса.

Легенда: 🔴 вероятная причина · 🟠 средняя · 🟡 редкая/вторичная

---

## 1. Где живёт состояние дебата (4 слоя)

| Слой | Файл | Персист? | Что теряется при reload |
|------|------|----------|------------------------|
| `activeDebateStore` (сессии + activeSessionId) | `src/stores/activeDebateStore.ts:41-57` | НЕТ | всё: `sessions`, `activeSessionId` |
| `debateLiveStore` (арена: стримы, эмоции, раунды) | `src/stores/debateLiveStore.ts:523-526` — явно `transient, no persist` | НЕТ | всё до следующего чанка |
| Engine + SyncManager (`sessions:Map`, `_entries:Map`) | `debate-engine.ts:755`, `debate-sync-manager.ts:62` | НЕТ (in-memory) | идущий прогон останавливается |
| Dexie (снапшоты, история, eventLog) | `debate-session-persistence.ts`, `debate-persistence-manager.ts` | ДА | — (но автовыбора сессии нет) |

Вывод: reload страницы = гарантированный "сброс формы". Живым остаётся только прошлое (снапшоты/история), настоящее умирает полностью.

## 2. Переключатель "форма vs дебат"

- Classic: `DebatePanel/DebateTabContent.tsx:223` — `!session → <DebateSetupWizard>`; `DebatePanel.tsx:58-64` — session берётся один раз из `getActiveDebateSession()`.
- Runtime: `DebateRuntimePanel.tsx:56-57,316` — локальный `selectedId: useState(null)`; `selected == null` → только `CreateSessionForm + SessionListPanel`, визуально "чистая форма".
- `DebateArena.tsx:89-101` — табы classic|runtime через `React.lazy + Suspense + ErrorBoundary` РАЗМОНТИРУЮТ панель → локальные `session/selectedId` сгорают.

## 3. Гипотезы сброса (по вероятности)

### 🔴 1. Терминал своей сессии (FAILED / CANCELLED / governor-stop)
`useDebatePanelSubscriptions.ts:157-181` — терминальные события переводят стор в `setSession(null)`.
Проверить: в консоли перед сбросом `DEBATE_SESSION_FAILED` / `CANCELLED`, governor-варнинги, 402/таймауты.

### 🔴 2. Ремаунт Runtime-панели с потерей selectedId
Переключение таба в `DebateArena:100`, срабатывание `ErrorBoundary:57-77` + Reset, Suspense, навигация — `selectedId` сбрасывается в `null`, engine при этом жив (`getActiveSessions` не пуст).
Проверить: клик таб туда-обратно во время дебата; сравнить `selectedId` vs живые сессии engine.

### 🟠 3. Чужой clearAll (второй старт / tournament / auto-debate)
`auto-debate-service.ts:414-415,482-483` и `debate-sync-manager.ts:683` (`destroy()` → `clearAll` + `_entries.clear`).
Проверить: был ли параллельный запуск; `activeDebateStore.sessions === {}` при живом engine.

### 🟠 4. Reload / HMR
`debateLiveStore.ts:631-637` (HMR dispose + destroy), пустой zustand. Проверить: `localStorage debate-engine:sync-backup`, Dexie `debateSessions`, метки HMR/beforeunload в консоли.

### 🟡 5. Ошибка рендера → ErrorBoundary + Reset выглядит как "сброс"
Проверить: `ERROR_BOUNDARY_CAUGHT`, `rootLogger ErrorBoundary`.

### 🟡 6. Потеря Dexie / saveSnapshot fail
После ремаунта восстанавливать нечем. Проверить: `QuotaExceeded`, WARN `saveSnapshot failed` (`persistence-manager`, `sync:761-768`).

### 🟡 7. Дроп EventBus
Сам по себе даёт фриз, не форму; форму — только если дропнут терминальный + позже рефреш. Проверить: `getDeadLetterQueue()` / `drainDeadLetterQueue()`, `system:eventbus:backpressure`.

## 4. Как логирует DebateLive сегодня

Карта подписка → состояние → рендер (`debateLiveStore.ts` + `DebateLive/*`):
- `CHUNK` → `streamingContent` (100 ключей, хвост 32768) → живой текст спикера (`SpeakerNode:40`, `Panel:86`)
- `THINKING` → thinking + countdown 30с + эмоция curiosity
- `RESPONDED` → событие (контент ≤2000), чистка thinking/stream/countdown
- `ERROR/TIMEOUT/FALLBACK` → anger/fear/surprise
- `ROUND_STARTED/ENDED` → лента раундов (200), `MEMORY_CLAIM`, `CONSENSUS` → веса судьи, `QUALITY_*` → недавние события

Важно:
- В самом тракте live (стор + компоненты) — **0 console/rootLogger**: чистый zustand + `eventBus.onSafe`. Логи живут слоем ниже (engine/caller warn/debug) + метрики стора раз в 30с.
- Чанки и thinking **отфильтрованы** из WAL/Dexie (`event-recorder.ts:42-49`, анти-OOM) — пословного следа обрыва нет.
- Стор **не слушает** `VERDICT_GENERATED` и `SESSION_COMPLETED` — вердикт/финал в арену не попадают.
- При reload/unmount всё умирает: персиста нет, HMR делает dispose+destroy.

## 5. Что уже есть для диагностики (готовое)

- **EventRecorder (WAL)**: Dexie-персист, debounce 1с, хвост 300, `getAll/getSince/getByEvent/exportLog` (`event-sourcing/event-recorder.ts`). Но: чанки отфильтрованы, `content>100` санитизируется, debounce теряет последнюю секунду при крэше.
- **LogsPanel**: пуллинг `rootLogger.getBuffer()` 1с, виртуализация, экспорт json/text/csv.
- **EventsTimeline**: живой `subscribeAll`, кап 500, персист `events-timeline`.
- **rootLogger**: уровни debug/info/warn/error, буфер 500, персист `logger:buffer` 30с, экспорт.
- **Dead-letter**: `eventBus.getDeadLetterQueue()/drain` (кап 1000, in-memory) + `DeadLetterQueueService` (KV, кап 500; дебаты пушат `all_providers_dead/llm_timeout/llm_failure`).
- Дыры: DLQ шины сносится reload'ом, UI для него нет, `onSafe`-дропы туда не попадают; капы (1000/500/500) затирают длинные дебаты; нет единого трейла по `sessionId` (Recorder+Logs+DLQ+Timeline не связаны) и просмотра Dexie-`eventLog` из UI.

## 6. Предложение по лонгированию (спека, без кода)

Цель: в момент "слёта" отвечать на 3 вопроса — КАКАЯ сессия, НА ЧЁМ остановилась, ПОЧЕМУ (терминал / ремаунт / reload / чужой clear).

1. **Сессионный трейл**: каждое событие дебатного тракта помечать `{sessionId, phase, round, agentId}` (traceId в логгере уже есть — пробросить его в Recorder + DLQ + Timeline), смотреть связку по `sessionId`.
2. **Точки в live-сторе**: лог старт/стоп подписок (`debateLiveStore.ts:230`), длительность хода (think→responded), причины (timeout/error ветки), скоп раундов; подписаться на `VERDICT_GENERATED`/`SESSION_COMPLETED` (сейчас игнор).
3. **Свидетель сброса**: писать в WAL/стор пометки переходов — `setSession(null)` с причиной (какой терминальный ивент), `clearAll/clearSession` с инициатором (unmount/start/tournament/destroy), ремаунт панели (mount/unmount + selectedId). Тогда "форма вместо дебата" всегда объяснена строкой в логе.
4. **Не трогать**: фильтр чанков из WAL (анти-OOM), debounce персиста, капы — только добавить счётчики дропов, чтобы их было видно.
5. **UI-минимум**: в живую панель — бейдж состояния сессии (running/paused/failed + round/turn) и кнопка "выгрузить трейл сессии" (WAL-срез + DLQ + буфер логгера по sessionId).

## 7. Следующий шаг (по команде)

Вшивание DebateLive в процесс дебата (старт → лента → вердикт рядом с текущим видом) + свидетели сброса из §6. Без второго оркестратора: только подписки на те же события + навигация.
