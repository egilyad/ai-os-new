# Роадмап: UI — панели, сторы, хуки, маршруты, i18n, визуализация

> Область кода: `src/components/` (~200 панелей), `src/stores/` (~22), `src/hooks/`,
> `src/routes.tsx`, `src/i18n/`, `src/data/`. Тесты: 166 в components, 14 в stores.

## Что есть сегодня

### Панели

~200 панелей, сгруппированы по секциям навигации (Dashboard, Budget, Chat, Debates,
Debate Strategy, Techniques, Agents, Diagnostics, Wiki, Fleet, Google, Research,
Integrations, Randoms, AI Providers, System, Security, Memory, Lab, Other).

Ключевые: ChatPanel, DebateArena, AgentsPanel, MemoryPanel, ProviderManager, WikiPanel,
DashboardPanel, AnalyticsPanel, TasksPanel, BuilderPanel (когнитивный конструктор), …
Плюс 58 «Техник»-панелей (`TechniquePanels/`).

### Структура панели

Каждая панель: `XxxPanel.tsx` + локальные смоук-тесты `XxxPanel.test.tsx`.
«Ленивая» загрузка через `React.lazy` (`route-imports.ts`), обёртки PanelLoader/ErrorBoundary.

### Маршруты

- `routes.tsx` + `route-registry-{core|system|content}.ts` → `NAV_SECTIONS`.
- id в реестре == ключ в PANEL_COMPONENTS == путь маршрута (single source of truth).
- Алиасы: `/debates/*`, `/diagnostics/*`, `/services/*`; скрытые `/chat-admin`, `/timeline`.

### Сторы (Zustand)

Наблюдатели событий eventBus. `useChatStore`, `useActiveDebateStore`, `useDebateLiveStore`,
`useDebateSessionStore`, `useKeyStore`, `useNotificationStore`, `useProjectStore`,
`useCouncilStore`, `useCrewStore`, `directorStore`, `invocationStore`, `uiPreferencesStore`, …
Паттерн hydration: `chat/hydration.ts`, `key-store-*`.

### Хуки (12): useMediaQuery, useNow, useFocusTrap, useConfirm, usePoolStatus,

useRealAgents, useRoutingIntelligence, useDebateArguments, useTopicSuggester, …

### i18n: en/ru, модульные файлы, `loadLocale`, фолбэк, `useTranslation`.

### Визуализация: `viz/`, `shared/charts`, Mermaid, vis-network, React Flow (BuilderPanel).

---

## Пробелы и риски

1. **Часть панелей показывает in-memory данные** (не гидрируются из Dexie) — риск потери при перезагрузке.
2. **E2E-покрытие слабое** (17 спек); visual regression нет (для 62 техник-панелей).
3. **19 из 62 техник-панелей без индивидуальных статей** вики.
4. Некоторые «скрытые»/экспериментальные панели без тестов.
5. В `route-registry-content` есть остаточные ключи секций, отсутствующие в реальности.

---

## Роадмап

### P0 — Правильность

- [ ] Ревизия панелей: пометить, какие показывают in-memory, и перевести на Dexie-гидрацию.
- [ ] Закрыть пробелы смоук-тестов у «скрытых» панелей.

### P1 — Качество и покрытие

- [ ] **Visual regression** для 62 техник-панелей (Playwright screenshots).
- [ ] **E2E** для ключевых сценариев (чат → дебаты → агенты → память → настройки).
- [ ] Дописать вики-статьи для недостающих 19 техник-панелей.

### P2 — UX

- [ ] Единый «Onboarding-wizard» (уже есть) — довести до полноты.
- [ ] Улучшить доступность (a11y): focusTrap уже есть, добавить ARIA-паттерны/клавиатурную навигацию.
- [ ] Тёмная/светлая тема и настройки плотности — через uiPreferencesStore.

### P3 — Платформа

- [ ] **Сборка «плагинной» панели**: панели извне через манифест (см. `NEW_COMPONENTS.md`).

---

## Критерии «готово»

- Нет панелей полностью на in-memory данных.
- Visual regression и E2E покрывают ядро.
- Полное покрытие вики-статей для техник.
