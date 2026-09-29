# Аудит 4: UX, Производительность и Утечки в UI (UX, Performance & Leaks)

## Оценка зрелости: 7/10 — образцовый route-level code-splitting (256 lazy-чанков) и виртуализация самых горячих списков, но точечные whole-store подписки, отсутствие reduced-motion при сотнях бесконечных анимаций и немемоизированные панели-монолиты (до 1169 строк) тянут оценку вниз.

## Резюме
Проверены 786 не-тестовых .tsx-компонентов (194K LOC), 15 хуков и 34 стора. Маршрутная ленивая загрузка выполнена на высоком уровне: 198 `React.lazy` в `src/route-imports.ts` + 58 в техник-панелях; в entry-чанк eagerly попадают только ErrorBoundary/Skeleton/реестр lazy-компонентов. Виртуализация (`@tanstack/react-virtual`) применена в двух самых горячих списках (чат, логи), остальные длинные списки ограничены капами (200–500) и рендерятся целиком. Zustand-дисциплина хорошая: 148 вызовов с селектором против 3 подписок на весь стор. Утечек обработчиков не выявлено: 31 `addEventListener` в components/hooks почти все парны с `removeEventListener`, интервальные хуки имеют cleanup. Основные риски: бесконечные framer-motion-анимации без viewport-гейтинга и почти без поддержки `prefers-reduced-motion`, полнорендер TracesPanel с motion-компонентами на каждый элемент и низкая доля `React.memo` (23 файла из 786).

Метрики: src/components — 786 tsx (193 761 строка), крупнейший PolicyPanel.tsx — 1169 строк; useMemo — 275, useCallback — 419, React.memo — 23 файла; framer-motion — 166 файлов, 527 `motion.*`, 277 `AnimatePresence`; `prefers-reduced-motion`/`useReducedMotion` — 2 вхождения; JSON.parse в компонентах — 16 (мелкие); localStorage-доступ — 64 ссылки, все через ленивые `useState(() => ...)` инициализаторы или обработчики, в рендер-цикле доступа не найдены.

## Сводка находок

| ID | Severity | Находка | Файл:строка |
|----|----------|---------|-------------|
| UX4-01 | Средний | Подписка на весь zustand-стор: панель перерисовывается на каждое сообщение/любое поле | src/components/ChannelPanel/ChannelPanel.tsx:42 |
| UX4-02 | Средний | `repeat: Infinity`-анимации без viewport-гейтинга; `prefers-reduced-motion` почти не поддержан (2 refs на 527 motion-использований) | src/components/DashboardPanel/AgentLiveBoard.tsx:151 |
| UX4-03 | Средний | TracesPanel рендерит до 200 трейсов полным `.map` внутри `AnimatePresence`, каждый элемент — motion.div | src/components/TracesPanel/TracesPanel.tsx:394 |
| UX4-04 | Низкий | EventsTimeline держит до 500 событий и рендерит их целиком; на каждое событие — JSON.stringify для записи в storage | src/components/EventsTimeline/EventsTimeline.tsx:74 |
| UX4-05 | Низкий | Мемоизация точечная: React.memo в 23 из 786 компонентов; крупнейшие панели (PolicyPanel 1169, FleetPanel 1119 строк) не мемоизированы | src/components/PolicyPanel/PolicyPanel.tsx:1 |
| UX4-06 | Низкий | Искусственная 100ms-задержка `setTimeout` перед монтированием Monaco — воспринимаемый лаг вместо `loading`-пропа | src/components/Editors/CodeEditor.tsx:36 |
| UX4-07 | Низкий | `.catch(() => {})` на пользовательских действиях — сбой не показывается в UI (дубль EH6-03, UX-аспект) | src/components/ChatPanel/ChatPanel.tsx:491 |
| UX4-08 | Инфо | Секрет company-gateway хранится в localStorage в 4+ панелях (полный разбор — в security-аудите) | src/components/ApprovalsPanel.tsx:109 |

## Детали находок

### UX4-01: Подписка на весь стор в ChannelPanel
Файл:строка: src/components/ChannelPanel/ChannelPanel.tsx:42
```tsx
const { channels, order, selectedId, messages, loading, loadChannels, selectChannel, refresh } = useChannelStore();
```
Влияние: без селектора компонент подписан на весь стор — любое изменение любого поля (в т.ч. дописывание сообщения в `messages`) перерисовывает всю панель. Аналогично src/components/ProjectsPanel/ProjectsPanel.tsx:30 и src/components/AddKeyModal/useBulkImport.ts. Для чата с потоковым выводом это заметная нагрузка.
Рекомендация: разбить на атомарные селекторы (`useChannelStore(s => s.messages)`) либо `useShallow`; для потоковых сообщений — селектор по id активного канала.

### UX4-02: Бесконечные анимации без reduced-motion/viewport-гейтинга
Файл:строка: src/components/DashboardPanel/AgentLiveBoard.tsx:151 (также IntelligenceGraph.tsx:235, AquariumPanel.tsx:363, DashboardHeader.tsx:29)
```tsx
<motion.div
    animate={{ opacity: [0.1, 0.3, 0.1] }}
    transition={{ repeat: Infinity, duration: 2 }}
```
Влияние: 527 `motion.*`-использований в 166 файлах; анимации с `repeat: Infinity` продолжают исполняться на каждый кадр, даже когда блок вне вьюпорта (viewport-гейтинг `whileInView`/`viewport=` не найден — 0 вхождений), и не отключаются при системном `prefers-reduced-motion` (2 refs на весь код). Аквариумные декоративные анимации (AquariumPanel, duration 5, Infinity) гоняют композитор постоянно.
Рекомендация: обернуть декоративные анимации в `useReducedMotion()`-гейт; для офскрин-блоков — `whileInView` с `viewport={{ once: false, amount: 0 }}` или CSS-анимации с `animation-play-state`.

### UX4-03: TracesPanel без виртуализации, каждый трейс — motion-компонент
Файл:строка: src/components/TracesPanel/TracesPanel.tsx:394
```tsx
<AnimatePresence>
    {filteredTraces.map((trace) => (
        <motion.div
            key={trace.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
```
Влияние: трейсы каппируются на уровне ядра (config-registry.ts:123 `maxEntries: 200`), но 200 элементов с `AnimatePresence` + `motion.div` каждый — это 200 exit/enter-подписок framer-motion; при фильтрации происходит массовый exit-анимационный проход. На слабых машинах — джанк при переключении фильтров.
Рекомендация: перейти на `useVirtualizer` (как LogsPanel) и убрать per-row AnimatePresence (анимировать только первый/последний добавленный).

### UX4-04: EventsTimeline — 500 событий полным рендером + stringify на каждое событие
Файл:строка: src/components/EventsTimeline/EventsTimeline.tsx:74 (рендер — 380, 419)
```ts
storageAdapter.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
...
{groupEvents.map((evt, i) => {
```
Влияние: MAX_EVENTS = 500 (строка 54); при каждом новом событии сериализуется весь массив и рендерятся все группы целиком — на пике событий (debate-стримы) это главные/main-thread всплески.
Рекомендация: дебаунсить персистенцию, группу рендерить с усечением («показать первые N»), при росте лимита — виртуализация.

### UX4-05: Низкое покрытие мемоизацией в крупных панелях
Файл:строка: src/components/PolicyPanel/PolicyPanel.tsx:1 (1169 строк; FleetPanel.tsx — 1119, TasksPanel — 865)
```tsx
// PolicyPanel.tsx: нет ни React.memo, ни разделения на memo-подкомпоненты
```
Влияние: `useMemo` — 275 и `useCallback` — 419 в целом по кодовой базе, но `React.memo` — только в 23 файлах. Крупнейшие панели-монолиты перерисовываются целиком при каждом локальном изменении состояния (форма/фильтры). Смягчается тем, что почти все панели ленивые и живут по одной на маршрут.
Рекомендация: вынести строки таблиц/карточек в `memo`-компоненты (пример-образец уже есть: ChatHistoryEntry.tsx:24).

### UX4-06: Искусственная задержка перед Monaco
Файл:строка: src/components/Editors/CodeEditor.tsx:36
```tsx
React.useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(t);
}, []);
```
Влияние: фиксированные 100ms на каждый маунт редактора вместо передачи `loading`-пропа в `@monaco-editor/react` (готовность определяется самим лоадером). Плюс: Monaco не сконфигурирован через `loader.config` — см. AR5-01 (CDN vs CSP), из-за чего после задержки редактор в prod может не загрузиться вовсе.
Рекомендация: убрать таймер, использовать `loading={<Skeleton/>}` проп; сделать `loader.config({ monaco })` с локальным бандлом.

### UX4-07: Тихие сбои пользовательских действий
Файл:строка: src/components/ChatPanel/ChatPanel.tsx:491 (также TasksPanel.tsx:179)
```tsx
void switchKey(first).catch(() => {});
```
Влияние: пользователь переключил ключ/модель — при ошибке сети UI молча показывает старое состояние; рядом есть `onError={(msg) => showStatus(msg, 'error')}`, но эти вызовы его не задействуют.
Рекомендация: пробрасывать в `showStatus(...)`/нотификацию, логировать через rootLogger.

### UX4-08: Секрет в localStorage (UX-гигиена хранения)
Файл:строка: src/components/ApprovalsPanel.tsx:109 (также CostsPanel.tsx:119, CompaniesPanel.tsx:92, AdaptersPanel.tsx)
```tsx
localStorage.setItem(URL_KEY, url);
localStorage.setItem(SECRET_KEY, secret);
```
Влияние: companyGateway.secret доступен любому XSS-вектору и выживает очистку сессии; паттерн чтения при этом безопасный (ленивый `useState`-инициализатор с try/catch — ApprovalsPanel.tsx:44-56).
Рекомендация: sessionStorage или крипто-хранилище IndexedDB; детальный разбор отнесён к security-аудиту.

## Положительные практики
- **Route-level code splitting**: 198 `React.lazy` в src/route-imports.ts:7+ и 58 lazy-панелей в src/components/TechniquePanels/technique-panels-bundle.tsx; eagerly импортируются только ErrorBoundary/Skeleton (route-imports.ts:2-3); Suspense с PanelSkeleton-фолбэком.
- **Виртуализация горячих списков**: useVirtualizer с overscan: 5 — src/components/ChatPanel/ChatMessagesSection.tsx:54, src/components/LogsPanel/LogsPanel.tsx:65; ChatHistoryEntry обёрнут в `memo` (ChatHistoryEntry.tsx:24), селектор `useActiveSessionHistory` возвращает стабильную ссылку (stores/chat/hooks.ts:5-10).
- **Дисциплина zustand-селекторов**: 148 вызовов с селектором в 33 файлах против 3 whole-store подписок.
- **Cleanup-гигиена**: 31 addEventListener vs 31 removeEventListener в components/hooks; ModalShell восстанавливает `document.body.style.overflow` (ModalShell.tsx:22-26); хук `useVisibilityInterval` ставит интервальные опросы на паузу при скрытом табе (src/hooks/useVisibilityInterval.ts:24-49) и используется в 6 местах.
- **Тяжёлый JS-парсинг вне main thread**: meriyah используется в воркерах (src/kernel/workers/sandbox.worker.ts, sandbox-interpreter.ts), а в tool-executor подключается динамическим `await import('meriyah')` (src/kernel/services/tool-executor.ts:96) — не блокирует первый рендер.
- **localStorage-доступ только в ленивых инициализаторах/обработчиках** с try/catch на private-mode (ApprovalsPanel.tsx:44-56, CommandPalette.tsx:134) — синхронных чтений в теле рендера не найдено.
- **Dev-only memory-монитор** кучи с HMR-dispose (src/main.tsx:31-49).
