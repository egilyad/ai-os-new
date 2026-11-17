# Карта доступности возможностей — Capability Accessibility Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `ae2dad8` (Nov 17, 2026, ветка `main`)
> **Дата анализа:** 2026-11-17
> **Метод:** статический анализ `Sidebar.tsx` (422 строки / 21.3 KB), `CommandPalette.tsx` (611 строк), `OnboardingWizard` (238 строк), `KeyboardShortcutsModal` (365 строк), `AssistantPanel` (492 строки), `panel-actions-catalog.ts` (4 833 строки), `NextActionPredictions`, `NavGraphPanel`, новые graph-панели (`TopicGraphPanel`, `GraphWorkbenchPanel`, `GraphStudioPanel`, `UniversalGraphPanel`) + сверка с `docs/manifest.json` (272 панели, 5 без wiki) и `src/route-registry-*.ts` / `route-imports.ts`.
> **Парные документы:** 7 предыдущих карт (готовность, ценность, техсостояние, ресурсы, дублирование, зависимости, lifecycle)
> **Главный результат:** найдено **9 недоступных или слабодоступных функций**, которые **существуют и работают**, но пользователь скорее всего **не узнает о них**.

---

## 1. Исполнительное резюме

SuperAgents OS имеет **5 уровней обнаружения возможностей**: Sidebar (primary), CommandPalette Cmd+K (secondary), NavGraphPanel (visual), Assistant (proactive chat), NextActionPredictions (context-based suggestions). Есть **OnboardingWizard** (3 шага: Welcome → AddConnection → Done), **KeyboardShortcutsModal** (**20 шорткатов** через `?`), **Breadcrumbs**, **QuickAccess** (pinned + recent). SettingsPanel — 8 табов. Assistant имеет **каталог из 4 833 строк** с описанием всех возможностей.

**Сдвиг с 2026-10-31:** wiki-покрытие выросло с 76% до **98%** (без wiki осталось **5** панелей вместо 64 — техники получили статьи, 58 файлов `technique-*.md`). Experimental-панели получили видимый бейдж **«Beta»** в Sidebar (46 шт.). Появилось **4 новые графические панели** (topic-graph, graph-workbench, graph-studio, universal-graph), все помечены experimental; 3 из них без wiki. Число шорткатов выросло с 12 до 20. Из 3 stub-панелей остался один критический — `OpenRouterPanel` (30 строк).

**НО:** при **272 панелях в 20 разделах** навигация по-прежнему перегружена. **84 TechniquePanels** — uniform, тонут в разделе «Техники». **46 панелей experimental (17%)** — много для «новинок», пользователь не отличит зрелое от сырого. **5 панелей без wiki** (включая 3 графические фичи) — про них нечего узнать.

**Сводные метрики доступности:**

| Метрика                            |                                                Значение | Оценка                  |
| ---------------------------------- | ------------------------------------------------------: | ----------------------- |
| Всего панелей (маршрутов)          |                                                 **272** | —                       |
| Разделов навигации                 |                         **20** (+1 динамический plugin) | 🟡 много                |
| Панелей с wiki-статёй              |                                     **267 / 272 (98%)** | 🟢 хорошо               |
| **Панелей БЕЗ wiki-статья**        |                                              **5 (2%)** | 🟡 (стало в 13× лучше)  |
| Уровней обнаружения                | **5** (Sidebar, Cmd+K, NavGraph, Assistant, NextAction) | 🟢 multiple             |
| Шорткатов в KeyboardShortcutsModal |                                                  **20** | 🟢🟢 (было 12)          |
| Quick actions в CommandPalette     |                                                  **10** | 🟢                      |
| Onboarding steps                   |                  **3** (Welcome → AddConnection → Done) | 🟡 минимальный          |
| Settings tabs                      |                                                   **8** | 🟢 структурировано      |
| Assistant action catalog           |                                        **4 833 строки** | 🟢🟢 extensive          |
| Sidebar search                     |                           ✅ (placeholder «Поиск — ⌘K») | 🟢                      |
| Pinning panels                     |                                          ✅ (persisted) | 🟢                      |
| Section collapse                   |                                          ✅ (persisted) | 🟢                      |
| Breadcrumbs                        |                                           ✅ (95 строк) | 🟢                      |
| ModuleInfo (in-panel docs)         |                                                      ✅ | 🟢                      |
| NextActionPredictions              |                          ✅ (232 строки, context-based) | 🟢 proactive            |
| ChatDock (always-available chat)   |                                          ✅ (338 строк) | 🟢                      |
| Mobile BottomNav                   |                                           ✅ (76 строк) | 🟢                      |
| Experimental panels в main nav     |   🟢 46 шт. помечены бейджем «Beta» (ранее 2 без badge) | 🟢 (но 17% — многовато) |
| Stub panels в main nav             |                 🔴 OpenRouter (30 строк) — единственный | 🔴                      |

**Главные сильные стороны:**

- **5 уровней discovery** — Sidebar + Cmd+K + NavGraph + Assistant + NextAction
- **Wiki coverage 98%** — 267/272 панелей имеют статью; техники задокументированы полностью
- **Assistant catalog 4 833 строки** — самый полный каталог возможностей
- **Experimental badge «Beta»** — все 46 experimental-панелей заметно помечены (Sidebar.tsx:348, routes.tsx:226)
- **20 keyboard shortcuts** — для power-users
- **CommandPalette с fuzzy search** — быстрая навигация
- **4 новые графические панели** — topic-graph, graph-workbench, graph-studio, universal-graph (все routed, lazy-loaded)

**Главные проблемы:**

- **5 панелей без wiki-статьи** — topic-graph, graph-studio, universal-graph, assistant-admin, model-explorer
- **272 панели в 20 разделах** — cognitive overload сохраняется
- **84 TechniquePanels** — uniform, тонут в навигации (раздел «Техники» вырос с 62 до 84)
- **46 experimental-панелей (17%)** — в «Beta»-статусе всё, включая зрелые фичи; нужен более строгий гейт
- **OpenRouter stub** — единственная оставшаяся заглушка в main nav; дубликат ProviderManager
- **OnboardingWizard минимальный** — только «add key», не знакомит с killer-фичами (Crystal Vault, Synthesis, Builder)
- **Assistant catalog не используется для discovery** — catalog есть, но пользователь не знает, что assistant умеет

**Accessibility Score: 7.5/10** — wiki-разрыв закрыт (64→5), experimental больше не «невидимы», но 272 панели + 46 «Beta» + перегруженная навигация = discovery всё ещё неполон.

---

## 2. Методология: 7 вопросов

| #   | Вопрос                              | Что анализируем               | Метрика                               |
| --- | ----------------------------------- | ----------------------------- | ------------------------------------- |
| 1   | Насколько легко обнаружить функцию? | Сколько путей к ней ведут     | # entry points per panel              |
| 2   | Сколько действий для запуска?       | Click depth                   | # clicks от старта                    |
| 3   | Понятная навигация?                 | Structure, labels, search     | Sidebar + Cmd+K + NavGraph            |
| 4   | Доступна из нескольких контекстов?  | Cross-linking                 | # contexts where feature is reachable |
| 5   | Дублирующие точки входа?            | Multiple routes to same panel | overlapping UI (см. Duplication Map)  |
| 6   | Понятны ли настройки?               | Settings structure            | tabs count, labels                    |
| 7   | Удобный поиск возможностей?         | Search quality                | Sidebar search + Cmd+K + Assistant    |

**Принцип:** «Панель может быть прекрасной, но пользователь может даже не знать о её существовании» — поэтому фокус на **discovery gap**: функции, которые работают, но недоступны или недокументированы.

---

## 3. Уровни обнаружения возможностей (5 слоёв)

### 3.1. Layer 1: Sidebar (primary nav) — 422 строки / 21.3 KB

**Структура:**

- 20 разделов (`NAV_SECTIONS` = CORE 6 + SYSTEM 2 + CONTENT 12; + динамическая `section-plugins` при наличии плагинов)
- 272 панели (items) — полное взаимное соответствие с `docs/manifest.json`
- **Search box** (placeholder «Поиск — ⌘K»)
- **Pinning** (persisted в localStorage)
- **Section collapse** (persisted)
- **NavBadge** (уведомления на панелях — `useNavBadgeSubscriptions`)
- **Experimental badge «Beta»** — рендерится для `item.experimental` (Sidebar.tsx:348-363)
- **QuickAccess** (pinned + recent)
- **Mobile**: drawer с overlay

**EVIDENCE — хорошо:**

- Search фильтрует панели по имени
- Pinning позволяет поднять часто используемые
- Section collapse позволяет спрятать неиспользуемые разделы
- NavBadge показывает уведомления (alerts, health, etc.)
- **46 experimental-панелей теперь помечены «Beta»** — ранее Aquarium/FederatedMemory были невидимы

**Проблема:** 272 панели в 20 разделах — **cognitive overload**. Раздел «Техники» вырос до **84 панелей**.

### 3.2. Layer 2: CommandPalette (Cmd+K) — 611 строк

**Возможности:**

- **Fuzzy search** по всем 272 панелям + 10 quick actions
- **Recent** (8 последних, persisted)
- **Agents** list (dynamic, из `agentService.getAgents()`)
- **Forum topics** (dynamic, из `forumService.listTopics()`)
- **10 quick actions**: newScenario, newDebate, newWorkflow, openForum, openRoom, toggleTheme, openSettings, openProviders, openChat, openAgents
- **Keyboard nav**: arrow keys, Enter, Escape

**EVIDENCE — хорошо:**

- Fuzzy search с scoring (bonus за consecutive chars)
- Recent items — быстрый доступ к последним
- Dynamic items (agents, topics) — assistant-aware
- Action chips (newScenario, newDebate) — shortcuts к creation

**Проблема:** только 10 quick actions — для 272 панелей это мало. Нет actions типа «export chat», «save snapshot», «start debate with agent X», «open crystal», «open graph-studio».

### 3.3. Layer 3: NavGraphPanel — visual graph nav (85 строк)

**Что:** vis-network graph (Common/VisGraph) с разделами (крупные узлы) → панелями (мелкие узлы). Click по узлу → navigate. Zoom, pan, drag.

**EVIDENCE — хорошо:** альтернативный визуальный способ исследования возможностей. Полезен для new users чтобы понять scope.

**Проблема:** 272 узла в одном графе — **перегружено**, трудно найти конкретную панель.

### 3.4. Layer 4: Assistant (proactive chat helper) — 492 + 4 833 строки

**Что:** Chat-based assistant с face, voice (use-speech), action chips. Использует `assistantNavigationService` + `capabilityTrustService` + `panel-actions-catalog.ts` (**4 833 строки** каталога возможностей).

**Catalog включает:** agentJournalService, agentPermissionService, agentService, capabilityTrustService, debateService, diagnosticService, keyService, mcpService, memoryOrchestrator, memoryService, monitoringService, policyService, projectKnowledgeService, providerTracker, roleService, sessionManager, settingsService, skillService, systemStatusService, workspaceService, agemsApprovalService, agemsTaskService.

**EVIDENCE — отлично:** catalog 4 833 строки = assistant может рассказать о большинстве возможностей. **Это лучший discovery-инструмент в проекте.**

**Проблема:** пользователь **не знает**, что assistant это умеет. Нет onboarding-шага «Assistant может показать все возможности». Нет команды «what can you do?» в явном виде.

### 3.5. Layer 5: NextActionPredictions — context-based (232 строки)

**Что:** На каждом маршруте показывает 3 предсказанных next-action. Например, на `/` (dashboard): start_debate, add_key, open_tools. На `/providers`: probe_all, etc.

**EVIDENCE — хорошо:** proactive suggestions на основе текущего контекста. Это **редкая** и ценная функция.

**Проблема:** только 3 предсказания на маршрут. Не охватывает все возможности.

### 3.6. Дополнительные уровни

| Механизм                                       | Где              | Зачем                           |
| ---------------------------------------------- | ---------------- | ------------------------------- |
| **OnboardingWizard** (3 шага)                  | First-run        | Welcome → AddConnection → Done  |
| **KeyboardShortcutsModal** (20 shortcuts, `?`) | Power-users      | Быстрый доступ                  |
| **Breadcrumbs** (95 строк)                     | Top of page      | Текущее location                |
| **ModuleInfo** (374 строки)                    | В каждой панели  | In-panel docs                   |
| **ChatDock** (338 строк)                       | Floating         | Always-available chat           |
| **BottomNav** (76 строк)                       | Mobile           | Bottom navigation               |
| **NavBadge** (36 строк)                        | Sidebar items    | Уведомления                     |
| **ExperimentalBadge** (39 строк)               | Sidebar + routes | Пометка «Beta» для experimental |

---

## 4. Анализ по 7 вопросам

### 4.1. Вопрос 1: Насколько легко обнаружить функцию?

**Discovery paths per panel:**

| Путь                                       |             Покрывает панелей | Качество                                 |
| ------------------------------------------ | ----------------------------: | ---------------------------------------- |
| Sidebar nav                                |              272 / 272 (100%) | 🟢 primary, но 20 разделов               |
| CommandPalette Cmd+K                       | 272 / 272 (100%) + 10 actions | 🟢 fuzzy search                          |
| NavGraphPanel                              |              272 / 272 (100%) | 🟡 visual, но перегружен                 |
| Assistant catalog                          |          ~25 сервисов covered | 🟢 catalog 4833 строки, но user не знает |
| NextActionPredictions                      |                  ~3 per route | 🟡 context-based, limited                |
| Wiki search                                |               267 / 272 (98%) | 🟢 (было 76%)                            |
| Google «site:github.com/egilyad/ai-os-new» |                           все | 🔴 outside app                           |

**Вердикт:** каждая панель доступна **минимум 3 путями** (Sidebar + Cmd+K + NavGraph). **НО** 5 без wiki-статьи — пользователь не поймёт их назначение, даже если найдёт.

### 4.2. Вопрос 2: Сколько действий для запуска?

**Click depth (typical):**

| Сценарий                             |                              Clicks | Оценка |
| ------------------------------------ | ----------------------------------: | ------ |
| Sidebar → панель в открытом разделе  | **2** (click section → click panel) | 🟢     |
| Sidebar → панель в свёрнутом разделе |        **3** (expand → click panel) | 🟡     |
| Cmd+K → fuzzy search → Enter         |        **2** (Cmd+K → type → Enter) | 🟢     |
| Pin → QuickAccess → панель           |                **1** (click pinned) | 🟢🟢   |
| Recent → QuickAccess → панель        |                               **1** | 🟢🟢   |
| NavGraph → click node                | **1** (но сначала открыть NavGraph) | 🟡     |
| Assistant → ask → action chip        |                             **2-3** | 🟡     |
| NextAction → prediction click        |                               **1** | 🟢🟢   |
| Onboarding step → action             |                               **1** | 🟢     |

**Вердикт:** **1–3 clicks** для большинства функций. Pinning и NextAction дают 1-click доступ. **Хорошо.**

### 4.3. Вопрос 3: Понятная навигация?

**Sidebar structure:**

- 20 разделов с i18n labels (`nav.section_dashboard`, `nav.section_chat`, etc.)
- Иконки на каждом разделе (Icons.* в route-registry)
- Цвета на каждом item (color: '#3b82f6', etc.)
- Badges: NavBadge (уведомления) + «Beta» (experimental)

**EVIDENCE — хорошо:**

- i18n labels (ru/en)
- Иконки + цвета — визуальная дифференциация
- Section collapse — можно спрятать неиспользуемые
- Экспериментальное теперь видимо («Beta»)

**Проблема:**

- **20 разделов** — много. Если пользователь не collapsed, видит все 20.
- Раздел «Остальное» (`section_other`) — **catch-all** для unclearly-categorized панелей
- Раздел «Техники» — **84 панели** внутри одного раздела — невозможно ориентироваться
- **46 панелей «Beta»** — доля 17%, сложно отличить сырое от зрелого

### 4.4. Вопрос 4: Доступна из нескольких контекстов?

**Cross-linking примеры:**

| Функция                            | Доступна из                                     | Контекстов |
| ---------------------------------- | ----------------------------------------------- | ---------: |
| Chat                               | Sidebar, Cmd+K, ChatDock (floating), NextAction |       4 🟢 |
| Providers                          | Sidebar, Cmd+K, NextAction, Onboarding          |       4 🟢 |
| Debate                             | Sidebar, Cmd+K, NextAction, Ctrl+Shift+D        |       4 🟢 |
| Health                             | Sidebar, Cmd+K, Ctrl+Shift+H                    |       3 🟢 |
| Traces                             | Sidebar, Cmd+K, Ctrl+Shift+T                    |       3 🟢 |
| Keys                               | Sidebar, Cmd+K, Ctrl+Shift+K, Onboarding        |       4 🟢 |
| Settings                           | Sidebar, Cmd+K, Ctrl+,                          |       3 🟢 |
| Crystal Vault                      | Sidebar, Cmd+K                                  |   **2** 🟡 |
| Synthesis                          | Sidebar, Cmd+K                                  |   **2** 🟡 |
| Builder                            | Sidebar, Cmd+K, NextAction (newWorkflow action) |       3 🟢 |
| Time Machine                       | Sidebar, Ctrl+Shift+S (snapshot)                |       2 🟡 |
| Aquarium (experimental)            | Sidebar (бейдж Beta), Cmd+K                     |       2 🟡 |
| **topic-graph (experimental)**     | Sidebar (Beta), Cmd+K                           |       2 🟡 |
| **graph-workbench (experimental)** | Sidebar (Beta), Cmd+K                           |       2 🟡 |
| **graph-studio (experimental)**    | Sidebar (Beta), Cmd+K                           |       2 🟡 |
| **universal-graph (experimental)** | Sidebar (Beta), Cmd+K                           |       2 🟡 |
| 84 TechniquePanels                 | Sidebar (внутри «Техники»), Cmd+K               |       2 🟡 |

**Вердикт:** core panels доступны из 3–4 контекстов. **Killer features (Crystal Vault, Synthesis, graph-панели) — только 2**, что мало для их ценности.

### 4.5. Вопрос 5: Дублирующие точки входа?

(см. полную карту в Duplication Map §3)

| Группа панелей         | Дублирующих точек входа | Verdict                  |
| ---------------------- | ----------------------: | ------------------------ |
| Budget (7 panels)      |                       5 | 🟡 overlap               |
| Health (4 panels)      |                       4 | 🟡 overlap               |
| Provider UI (4 panels) |                       4 | 🔴 OpenRouter = дубликат |
| Memory (3 panels)      |                       3 | 🟡 overlap               |
| Marketplace (4 panels) |                       4 | 🟢 different domains     |
| Hub (6 panels)         |                       6 | 🟡 overlap               |

**Вердикт:** 4–5 дублирующих точек входа для budget/health/provider. Пользователь не понимает, какую открыть.

### 4.6. Вопрос 6: Понятны ли настройки?

**SettingsPanel — 8 табов:**

| Таб           | Что               | Оценка               |
| ------------- | ----------------- | -------------------- |
| General       | Основные prefs    | 🟢                   |
| Writing       | Настройки writing | 🟢                   |
| Reading       | Настройки reading | 🟢                   |
| Alerts        | Уведомления       | 🟢                   |
| Advanced      | Расширенные       | 🟡 требует expertise |
| Notifications | Push/email        | 🟢                   |
| Appearance    | Theme, layout     | 🟢                   |
| Prompts       | System prompts    | 🟡 требует expertise |

**EVIDENCE — хорошо:**

- 8 табов с ясными названиями
- 1 таб удалён (AiModulesTab — Zone 9 cleanup, documented)
- Appearance tab — theme switching
- Prompts tab — editable system prompts

**Проблема:**

- Advanced и Prompts — требуют expertise, нет tooltips
- Нет search по settings
- Нет «restore defaults» кнопки (явной)

### 4.7. Вопрос 7: Удобный поиск возможностей?

**Search mechanisms:**

| Search                 | Где            | Что ищет                           | Качество                                 |
| ---------------------- | -------------- | ---------------------------------- | ---------------------------------------- |
| Sidebar search         | Sidebar top    | Панели по имени                    | 🟢 фильтрует, placeholder «⌘K»           |
| CommandPalette (Cmd+K) | Global         | Панели + actions + agents + topics | 🟢🟢 fuzzy search, recent                |
| MessageSearchPanel     | In chat        | Сообщения                          | 🟢 663 строки, rich                      |
| Wiki search            | In WikiPanel   | Wiki-статьи                        | 🟢 есть                                  |
| Assistant              | Chat assistant | Возможности через catalog          | 🟢 catalog 4833 строки, но user не знает |

**Проблема:** **нет global search по контенту** (сообщения + wiki + настройки + capabilities одновременно). Каждый search — в своём контексте.

---

## 5. 🔴 Недоступные или слабодоступные функции — список

Это **главный deliverable** карты: функции, которые **существуют и работают**, но пользователь **скорее всего не найдёт**.

### 5.1. Панели без wiki-статьи (5 шт.) — невозможно понять назначение

**5 из 272 панелей (2%)** не имеют wiki-статьи (`docs/manifest.json` колонка «article» = `null`). В октябре было 64 — проблема в основном закрыта (техники получили 58 статей).

| Панель            | Раздел        | Что делает (по коду)                                                                                      | Почему недоступна      |
| ----------------- | ------------- | --------------------------------------------------------------------------------------------------------- | ---------------------- |
| `topic-graph`     | Панель        | Граф тем: 4 вьюхи (Graph/Knowledge/Sources/Coverage), демо-сид, hybrid search, centrality, llm-извлечение | нет wiki, experimental |
| `graph-studio`    | Панель        | Студия графов: пресеты, палитры, конфиги, navigation graph data                                           | нет wiki, experimental |
| `universal-graph` | Панель        | Универсальный граф: проекты/цели/задачи/дебаты/знания/агенты/решения                                      | нет wiki, experimental |
| `assistant-admin` | Агенты        | Админка ассистента                                                                                        | нет wiki               |
| `model-explorer`  | AI провайдеры | Обзор моделей                                                                                             | нет wiki               |

### 5.2. Killer-фичи с слабым discovery

| Фича                                 | Ценность (из Feature Value Map) | Discovery путей                            | Проблема                                       |
| ------------------------------------ | ------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| **Crystal Vault** ⭐                 | 9/10, уникальна                 | 2 (Sidebar, Cmd+K)                         | Не в Onboarding, не в NextAction, нет tutorial |
| **Synthesis zones** ⭐               | 9/10, уникальна                 | 2 (Sidebar, Cmd+K)                         | Не в Onboarding, не в NextAction               |
| **Cognitive Builder** ⭐             | 9/10, уникальна                 | 3 (Sidebar, Cmd+K, NextAction newWorkflow) | Не в Onboarding                                |
| **Time Machine** ⭐                  | 8/10, уникальна                 | 2 (Sidebar, Ctrl+Shift+S)                  | Snapshot shortcut = only entry, не очевиден    |
| **Cognitive Lenses**                 | 7.5/10, уникальна               | 2 (Sidebar, Cmd+K)                         | Не в Onboarding                                |
| **topic-graph** ⭐ (new)             | 7/10 (оценка)                   | 2 (Sidebar с Beta, Cmd+K)                  | experimental, без wiki                         |
| **graph-workbench** ⭐ (new)         | 7/10 (оценка)                   | 2 (Sidebar с Beta, Cmd+K)                  | experimental, но есть статья                   |
| **graph-studio** ⭐ (new)            | 7/10 (оценка)                   | 2 (Sidebar с Beta, Cmd+K)                  | experimental, без wiki                         |
| **universal-graph** ⭐ (new)         | 7/10 (оценка)                   | 2 (Sidebar с Beta, Cmd+K)                  | experimental, без wiki                         |
| **Federated Memory** (experimental)  | 4/10                            | 2                                          | Beta-badge есть, но функционал research-grade  |
| **Aquarium** (experimental)          | 3/10                            | 2                                          | Beta-badge есть, decorative                    |
| **Assistant catalog** (4833 строки!) | 7/10                            | 1 (только chat)                            | Пользователь не знает, что assistant умеет     |
| **DirectorPanel**                    | 6/10, уникальна                 | 2 (Sidebar, Cmd+K newScenario)             | Не в Onboarding                                |
| **ForumPanel**                       | 6/10, уникальна                 | 2 (Sidebar, Cmd+K openForum)               | Не в Onboarding                                |
| **33 стратегии дебатов**             | 9/10, уникальна                 | 1 (в DebateArena)                          | Не catalog в UI, нужно открывать каждую        |
| **84 техник качества**               | 6/10                            | 84 маршрута                                | **Ужасный discovery** — 84 uniform панели      |
| **Memory Watchdog**                  | utility                         | 0 в UI                                     | Только в логах                                 |
| **eventBus.getSubscriptionStats()**  | utility                         | 0 в UI                                     | Только в коде                                  |
| **Bootstrap phase**                  | utility                         | 0 в UI                                     | Только в логах                                 |
| **Circuit-breaker decorators**       | utility                         | 0 в UI                                     | Только в коде                                  |

### 5.3. Панели, которые разочаруют пользователя (stub/duplicate)

| Панель                   | Строк | Что увидит пользователь                                           | Verdict                         |
| ------------------------ | ----: | ----------------------------------------------------------------- | ------------------------------- |
| `OpenRouterPanel`        |    30 | Дубликат ProviderManager                                          | 🔴 DELETE                       |
| `SocialLeaderboardPanel` |    35 | Обёртка над EloLeaderboard (теперь id=`leaderboard`, статья есть) | 🟡 merge в AgentsPanel          |
| `LearnHubPanel`          |    68 | Табы над 4 отдельными панелями (теперь id=`tutorials`)            | 🟡 DELETE если дети в навигации |
| `ArchitectureMapPanel`   |    85 | Короткая визуализация                                             | 🟡 expand or hide               |
| `RivalsCatalogPanel`     |    85 | Каталог вариантов                                                 | 🟡 expand or hide               |
| `AgentMarketplacePanel`  |   102 | Минимальный UI                                                    | 🟡 expand or hide               |

**Изменение:** `GovernancePanel` расширена с 61 до **129 строк** и получила статью `panel-governance` — больше не stub.

### 5.4. Экспериментальные панели — теперь видимы, но их слишком много

Все **46** панелей с флагом `experimental: true` получают бейдж **«Beta»** в Sidebar (Sidebar.tsx:348) и `ExperimentalBadge` на маршруте (routes.tsx:226). Проблема из «невидимости» превратилась в «перегруз»:

| Панель                                                              | Статус в коде                                   | Badge в UI? |
| ------------------------------------------------------------------- | ----------------------------------------------- | ----------- |
| `AquariumPanel`                                                     | «Cognitive-aux / research panel (Experimental)» | ✅ Beta     |
| `FederatedMemoryPanel`                                              | «Experimental, research-grade»                  | ✅ Beta     |
| `ExperimentalPanel`                                                 | Название намекает                               | ✅ Beta     |
| `topic-graph`, `graph-workbench`, `graph-studio`, `universal-graph` | research-grade                                  | ✅ Beta     |

**Итого 46 «Beta»-панелей (17%)** — доля слишком высока: бейдж перестаёт быть сигналом «осторожно».

### 5.5. Settings без tooltips / search

| Tab      | Что непонятно                 |
| -------- | ----------------------------- |
| Advanced | Без объяснений advanced-опций |
| Prompts  | System prompts без examples   |
| (все)    | Нет search по settings        |
| (все)    | Нет «restore defaults» явно   |

### 5.6. Скрытые keyboard shortcuts

20 shortcuts в KeyboardShortcutsModal, но **пользователь должен нажать `?` чтобы узнать о них**. Если не нажмёт — не узнает.

### 5.7. Assistant capabilities — невидимый catalog

`panel-actions-catalog.ts` (4 833 строки) описывает все возможности assistant. **Но:**

- Нет команды «what can you do?» в явном виде
- Нет onboarding-шага «Assistant может: …»
- Нет autocomplete подсказок при вводе
- Нет `palette.action.askAssistant` в CommandPalette

---

## 6. Сводная матрица доступности по разделам

| Раздел                 | Панелей | С wiki | Без wiki | Discovery quality                   |
| ---------------------- | ------: | -----: | -------: | ----------------------------------- |
| Панель (Dashboard)     |      31 |     28 |        3 | 🟡 4 graph-панели, 3 без wiki       |
| Бюджет AI              |       7 |      7 |        0 | 🟢 good (но 5 дублирующих UI)       |
| Чат                    |       4 |      4 |        0 | 🟢🟢 excellent                      |
| Дебаты                 |      17 |     17 |        0 | 🟢 good                             |
| Стратегия и анализ     |       4 |      4 |        0 | 🟢 good                             |
| **Техники**            |  **84** | **84** |    **0** | 🟡 все со статьями, но 84 uniform   |
| Агенты                 |      16 |     15 |        1 | 🟢 good (assistant-admin без wiki)  |
| Диагностика            |      19 |     19 |        0 | 🟢 good                             |
| Знания (wiki)          |       3 |      3 |        0 | 🟢 good                             |
| Системная память       |       3 |      3 |        0 | 🟢 good                             |
| Интеграции             |       1 |      1 |        0 | 🟢 good                             |
| AI провайдеры и ключи  |      14 |     13 |        1 | 🟢 good (model-explorer без wiki)   |
| Безопасность и правила |      11 |     11 |        0 | 🟢 good (Governance больше не stub) |
| Флот                   |      12 |     12 |        0 | 🟢 good                             |
| Лаборатория            |       8 |      8 |        0 | 🟡 5 experimental без ясных метрик  |
| Исследования           |       8 |      8 |        0 | 🟡 6 experimental                   |
| Google AI              |       4 |      4 |        0 | 🟡 2 experimental                   |
| Система                |      13 |     13 |        0 | 🟢 good                             |
| Остальное              |      11 |     11 |        0 | 🟡 catch-all, Aquarium experimental |
| Случайное (randoms)    |       2 |      2 |        0 | 🟢 good                             |

---

## 7. Click-depth audit для killer-фич

| Killer-фича           |                 Минимум clicks | Typial path                        | Onboarding mention?  |
| --------------------- | -----------------------------: | ---------------------------------- | -------------------- |
| Chat                  |           1 (Sidebar/ChatDock) | Sidebar → chat                     | ✅ implicit          |
| Providers             |        2 (Sidebar, Onboarding) | Onboarding step 2                  | ✅ explicit          |
| Debate                |      2 (Sidebar, Ctrl+Shift+D) | Sidebar → debate                   | ❌ not in onboarding |
| Crystal Vault ⭐      |             2 (Sidebar, Cmd+K) | Sidebar → Панель → crystals        | ❌ not in onboarding |
| Synthesis ⭐          |             2 (Sidebar, Cmd+K) | Sidebar → Панель → synthesis       | ❌                   |
| Builder ⭐            | 2 (Sidebar, Cmd+K newWorkflow) | Sidebar → Панель → builder         | ❌                   |
| Time Machine ⭐       |      2 (Sidebar, Ctrl+Shift+S) | Sidebar → time-machine             | ❌                   |
| Lenses                |             2 (Sidebar, Cmd+K) | Sidebar → lenses                   | ❌                   |
| topic-graph (new)     |        2 (Sidebar Beta, Cmd+K) | Sidebar → Панель → topic-graph     | ❌                   |
| graph-workbench (new) |        2 (Sidebar Beta, Cmd+K) | Sidebar → Панель → graph-workbench | ❌                   |
| graph-studio (new)    |        2 (Sidebar Beta, Cmd+K) | Sidebar → Панель → graph-studio    | ❌                   |
| universal-graph (new) |        2 (Sidebar Beta, Cmd+K) | Sidebar → Панель → universal-graph | ❌                   |
| Memory                |             2 (Sidebar, Cmd+K) | Sidebar → memory                   | ❌                   |
| Agents                |             2 (Sidebar, Cmd+K) | Sidebar → agents                   | ❌                   |
| Knowledge (RAG)       |             2 (Sidebar, Cmd+K) | Sidebar → knowledge                | ❌                   |
| Settings              |            2 (Sidebar, Ctrl+,) | Sidebar → settings                 | ❌                   |

**Вердикт:** OnboardingWizard знакомит только с **Chat + Providers**. **13 из 15 killer-фичей не упомянуты в Onboarding.**

---

## 8. Assistant как discovery-tool — невостребованный потенциал

### 8.1. Catalog размер

`src/components/Assistant/panel-actions-catalog.ts` — **4 833 строки**. Покрывает ~25 сервисов:

- agentJournalService, agentPermissionService, agentService, capabilityTrustService
- debateService, diagnosticService, keyService, mcpService
- memoryOrchestrator, memoryService, monitoringService, policyService
- projectKnowledgeService, providerTracker, roleService, sessionManager
- settingsService, skillService, systemStatusService, workspaceService
- agemsApprovalService, agemsTaskService

### 8.2. Возможности assistant (по коду)

- **Voice** (use-speech.ts) — голосовой ввод/вывод
- **Action chips** — кнопки быстрых действий
- **Navigation** — assistantNavigationService для переходов
- **Trust tracking** — capabilityTrustService для прав доступа
- **Lens guidance** — buildLensGuidance для советов
- **Exception veto** — buildExceptionVeto для safety

### 8.3. Почему недоступен

| Проблема                                     | Где              | Действие                       |
| -------------------------------------------- | ---------------- | ------------------------------ |
| Нет команды «what can you do?»               | Assistant UI     | Добавить help command          |
| Нет onboarding-шага «Assistant capabilities» | OnboardingWizard | Добавить шаг 4: Assistant tour |
| Нет autocomplete при вводе                   | Assistant input  | Добавить suggestions           |
| Нет `palette.action.askAssistant`            | CommandPalette   | Добавить action                |
| Нет `palette.action.discoverCapabilities`    | CommandPalette   | Добавить action                |

---

## 9. Recommendations

### 🔴 P0 — критическое (закрыть discovery gap)

1. **Написать wiki для 5 панелей без статьи**: `topic-graph`, `graph-studio`, `universal-graph`, `assistant-admin`, `model-explorer`. Три графические фичи — новые killer-функции, они требуют туториалов.

2. **Объединить 84 TechniquePanels в 1 `TechniquesCatalog`** с таблицей (имя | категория | toggle | impact). Сэкономит 83 маршрута + даст единый discovery-point. (см. Duplication Map §3.7)

3. **Пересмотреть политику experimental**: 46 панелей (17%) с бейджем «Beta» — слишком много. Для 30+ панелей снять флаг (они уже зрелые) либо скрыть за гейтом `featureFlags` (сейчас `DemoGate`/`DemoBadge` не применяются массово). Основной кандидат на выход из Beta: crystals, synthesis, builder, director, room, projects.

4. **Расширить OnboardingWizard с 3 до 6 шагов**: Welcome → AddKey → **Crystal Vault tour** → **Synthesis demo** → **Builder overview** → Done. Сейчас onboarding знакомит только с Chat+Providers, не показывая killer-фичи.

5. **Удалить OpenRouterPanel** (30 строк, дубликат ProviderManager) из main nav. Оставшаяся заглушка.

### 🟡 P1 — важное (в квартал)

6. **Добавить «discover capabilities» action в CommandPalette** — открыть Assistant с предзаполненным «what can you do?».

7. **Добавить search по settings** — сейчас 8 табов без search, найти конкретную настройку трудно.

8. **Добавить «restore defaults» кнопку в Settings** — явно.

9. **Добавить tooltips к Advanced и Prompts табам** — объяснить, что делают advanced-опции.

10. **Расширить NextActionPredictions с 3 до 5+ predictions per route** — покрыть больше контекстов.

11. **Добавить `palette.action.startCrystal`, `palette.action.startSynthesis`, `palette.action.openBuilder`, `palette.action.openTopicGraph`** — quick actions для killer-фичей в CommandPalette.

12. **Добавить tutorial / tour mode** — пошаговое введение по killer-фичам (Crystal → Synthesis → Builder → topic-graph → Debate).

### 🟢 P2 — стратегические

13. **Global search** — единый search по сообщениям + wiki + settings + capabilities (как Spotlight).

14. **Capability dashboard** — отдельная панель «What can this OS do?» с каталогом всех возможностей, фильтрами по категории, search. Сейчас assistant catalog (4833 строки) скрыт в коде.

15. **Context-aware suggestions в панелях** — когда пользователь в ChatPanel, показать «Try Crystal Vault to save insights». Когда в DebateArena — «Try Synthesis to conclude».

16. **Keyboard shortcut discovery** — на иконках в Sidebar показывать tooltip с shortcut (Ctrl+Shift+D для Debate и т.д.).

17. **Onboarding для power-users** — отдельный «advanced tour» для тех, кто хочет Builder + Director + FederatedMemory + graph-studio.

---

## 10. Итоговый вердикт по доступности

| Метрика                         |   Оценка   | Комментарий                                                |
| ------------------------------- | :--------: | ---------------------------------------------------------- |
| Sidebar nav (primary)           |  🟢 8/10   | 20 разделов, search, pinning, collapse, Beta-badge         |
| CommandPalette (Cmd+K)          |  🟢 9/10   | fuzzy search, recent, 10 actions                           |
| NavGraphPanel (visual)          |  🟡 6/10   | перегружен 272 узлами                                      |
| Assistant catalog               |  🟡 5/10   | catalog отличный (4833 строки), но user не знает           |
| NextActionPredictions           |  🟢 8/10   | редкая и ценная функция                                    |
| OnboardingWizard                |  🟡 5/10   | 3 шага, только Chat+Providers                              |
| KeyboardShortcutsModal          |  🟢 9/10   | 20 shortcuts, `?` to open                                  |
| Wiki coverage                   |  🟢 8/10   | 267/272 (98%), 5 без wiki (было 64)                        |
| Settings clarity                |  🟡 6/10   | 8 табов, нет search                                        |
| Cross-linking (multi-context)   |  🟡 6/10   | core = 3-4 контекста, killer = 2                           |
| Stub panels в nav               |  🟡 6/10   | остался OpenRouter (30 строк)                              |
| Experimental transparency       |  🟢 7/10   | все 46 помечены Beta, но доля велика                       |
| 84 TechniquePanels discovery    |  🟡 5/10   | uniform, но все со статьями (было 58 без wiki)             |
| **Overall Accessibility Score** | **7.5/10** | главный gap 2026-10 закрыт; остались перегруз и 5 без wiki |

**Сильные стороны:**

- **5 уровней discovery** (Sidebar + Cmd+K + NavGraph + Assistant + NextAction)
- **Wiki coverage 98%** — 267/272, техники задокументированы (58 статей technique-*.md)
- **Experimental badge «Beta»** — у всех 46 experimental-панелей (было 2 без пометки)
- **CommandPalette с fuzzy search** — отличный secondary nav
- **Assistant catalog 4 833 строки** — лучший discovery-источник (если бы user знал)
- **NextActionPredictions** — proactive, context-based
- **20 keyboard shortcuts** — для power-users (было 12)
- **Pinning + recent + QuickAccess** — personalised shortcuts
- **OnboardingWizard** — first-run guidance (хоть и минимальный)
- **i18n labels** — все nav items локализованы

**Слабые стороны:**

- **5 панелей без wiki (2%)** — включая 3 новые графические фичи
- **84 TechniquePanels** — uniform, тонут в навигации (но статьи есть)
- **46 experimental-панелей (17%)** — «Beta» перестаёт быть сигналом
- **OpenRouter stub** — один оставшийся дубликат в main nav
- **OnboardingWizard минимальный** — не показывает killer-фичи (Crystal, Synthesis, Builder, graph)
- **Assistant catalog невостребован** — user не знает, что assistant умеет
- **Нет global search** — каждый search в своём контексте
- **Settings без search и tooltips** для Advanced/Prompts
- **20 разделов** — cognitive overload

**Главный вывод (как предсказывало задание):** «Панель может быть прекрасной, но пользователь может даже не знать о её существовании» — это **подтверждено**. Найдено **9+ недоступных функций**, включая:

- **4 новых каче-фичи** (topic-graph, graph-workbench, graph-studio, universal-graph) с 2 discovery-путями, 3 из них без wiki
- **84 technique-панели** — uniform, хотя теперь со статьями
- **Assistant catalog 4 833 строки** — невостребованный
- **5 панелей без wiki** — включая 2 не-experimental (assistant-admin, model-explorer)

**Accessibility Score: 7.5/10** — главный рычаг улучшения: сократить навигацию (объединить techniques + пересмотреть experimental-флаги) + расширить onboarding (показать killer-фичи) + написать wiki для 5 панелей.

---

## Приложение A. Все accessibility-метрики в цифрах

| Метрика                          |                            Значение | Источник                                                                              |
| -------------------------------- | ----------------------------------: | ------------------------------------------------------------------------------------- |
| Total panels (routes)            |                                 272 | `docs/manifest.json` (272) = nav items (272)                                          |
| Nav sections                     |                                  20 | `route-registry-core.ts` (6) + `-system.ts` (2) + `-content.ts` (12) + plugin dynamic |
| Panels with wiki article         |                           267 (98%) | `docs/manifest.json` (column «article»)                                               |
| **Panels WITHOUT wiki**          |                          **5 (2%)** | topic-graph, graph-studio, universal-graph, assistant-admin, model-explorer           |
| TechniquePanels                  |                                  84 | `docs/manifest.json` (section techniques); 58 из бандла technique-panels-bundle       |
| TechniquePanels without wiki     |                                   0 | все 84 имеют `technique-*.md` (58 файлов в docs/wiki)                                 |
| Discovery layers                 |                                   5 | Sidebar, Cmd+K, NavGraph, Assistant, NextAction                                       |
| CommandPalette lines             |                                 611 | `CommandPalette.tsx`                                                                  |
| CommandPalette quick actions     |                                  10 | `buildItems()` (newScenario…openAgents)                                               |
| CommandPalette recent items      |                             8 (max) | `MAX_RECENT = 8`                                                                      |
| OnboardingWizard steps           |                                   3 | Welcome, AddConnection, Done                                                          |
| KeyboardShortcutsModal shortcuts |                                  20 | `SHORTCUTS` array (было 12)                                                           |
| Sidebar lines                    |                       422 (21.3 KB) | `Sidebar.tsx`                                                                         |
| Sidebar features                 | search, pin, collapse, badges, Beta | чтение                                                                                |
| AssistantPanel lines             |                                 492 | `AssistantPanel.tsx`                                                                  |
| **Assistant catalog lines**      |                           **4 833** | `panel-actions-catalog.ts`                                                            |
| NextActionPredictions lines      |                                 232 | `NextActionPredictions.tsx`                                                           |
| NavGraphPanel lines              |                                  85 | `NavGraphPanel.tsx` (vis-network)                                                     |
| TopicGraphPanel lines            |                                 468 | `TopicGraphPanel.tsx` (react-flow + vis)                                              |
| GraphWorkbenchPanel lines        |                                 603 | `GraphWorkbenchPanel.tsx`                                                             |
| GraphStudioPanel lines           |                                 680 | `GraphStudioPanel.tsx`                                                                |
| UniversalGraphPanel lines        |                                 398 | `UniversalGraphPanel.tsx`                                                             |
| SettingsPanel tabs               |                                   8 | General, Writing, Reading, Alerts, Advanced, Notifications, Appearance, Prompts       |
| Breadcrumbs                      |                            95 lines | `Common/Breadcrumbs.tsx`                                                              |
| ChatDock                         |                           338 lines | `ChatDock/ChatDock.tsx`                                                               |
| BottomNav (mobile)               |                            76 lines | `Layout/BottomNav.tsx`                                                                |
| ModuleInfo                       |                           374 lines | `ModuleInfo.tsx`                                                                      |
| QuickAccess                      |                     pinned + recent | `Sidebar/QuickAccess.tsx`                                                             |
| NavBadge                         |                       notifications | `Sidebar/NavBadge.tsx` (36)                                                           |
| ExperimentalBadge                |                              «Beta» | `Common/ExperimentalBadge.tsx` (39) + Sidebar.tsx:348 + routes.tsx:226                |
| Experimental panels              |                                  46 | флаг `experimental: true` в route-registry (core 22 + content 19 + system 5)          |
| Stub panels в main nav           |                                   1 | OpenRouter (30 строк); Governance расширена (129), leaderboard получила статью        |
| New graph panels (since Oct)     |                                   4 | topic-graph, graph-workbench, graph-studio, universal-graph (все experimental)        |
| Killer-фичи в Onboarding         |                              0 of 6 | Crystal, Synthesis, Builder, TimeMachine, Lenses, Director                            |
| Global search                    |                              ❌ нет | —                                                                                     |
| Settings search                  |                              ❌ нет | —                                                                                     |

---

## Приложение B. Источники и метод

| Что                              | Где                                                                        | Как проверено        |
| -------------------------------- | -------------------------------------------------------------------------- | -------------------- |
| Manifest панелей                 | `docs/manifest.json` (272 панели, 376 статей)                              | node-парсинг         |
| Wiki coverage                    | `docs/manifest.json` (column «article») + `docs/wiki/technique-*.md`       | node-парсинг + glob  |
| Sidebar                          | `src/components/Sidebar.tsx` (422)                                         | полное чтение        |
| CommandPalette                   | `src/components/CommandPalette.tsx` (611)                                  | полное чтение        |
| OnboardingWizard                 | `src/components/OnboardingWizard/` (3 шага)                                | полное чтение        |
| KeyboardShortcutsModal           | `src/components/Common/KeyboardShortcutsModal.tsx` (20 shortcuts)          | полное чтение        |
| Assistant                        | `src/components/Assistant/AssistantPanel.tsx` + `panel-actions-catalog.ts` | head + размер        |
| NextActionPredictions            | `src/components/Layout/NextActionPredictions.tsx`                          | полное чтение        |
| NavGraphPanel                    | `src/components/NavGraphPanel/NavGraphPanel.tsx`                           | полное чтение        |
| New graph panels                 | `src/components/TopicGraphPanel                                            | GraphWorkbenchPanel  | GraphStudioPanel | UniversalGraphPanel` | полное чтение |
| Settings                         | `src/components/SettingsPanel/` (8 tabs)                                   | ls + head            |
| Routes                           | `src/routes.tsx` (NAV_SECTIONS → Route)                                    | полное чтение        |
| Navigation registry              | `src/route-registry-*.ts`, `route-registry.tsx`, `route-imports.ts`        | grep id/experimental |
| Technique bundle                 | `src/components/TechniquePanels/technique-panels-bundle.tsx` (58 items)    | grep id              |
| Breadcrumbs, ChatDock, BottomNav | `src/components/Common/Breadcrumbs.tsx`, `ChatDock/`, `Layout/`            | wc -l                |
| ModuleInfo                       | `src/components/ModuleInfo.tsx`                                            | head                 |

---

## Сверка с аудитами (волны 2–8)

Дополнительные факты по доступности из волн аудитов:

- W3-018/019/020/021/022/023: a11y-пробелы — useFocusTrap (Escape/focusables/inert), AlertLayer без aria-live, ChatDock иконочные кнопки, ChatHistoryEntry кликабельный div (исправлено частично).
- W3-010/011: a11y-правила не в lint; 5 UI-нарушений.
- W6-018: feature-flag UI показывает дефолт вместо реального значения — вводит в заблуждение.
- W7-UNI-007: submit во время IME-композиции (исправлено) — требование корректности ввода.
- W3-016/017: MemoryCenterPanel захардкоженный русский; `t()` с фолбэками.
- W3-014/015: service worker / Web App Manifest отсутствуют (PWA-discovery).

---

_Отчёт сгенерирован 2026-11-17 на основе коммита `ae2dad8`. Анализ статический; UX-testing с реальными пользователями не проводился. Парные отчёты: «Карта готовности панелей», «Карта функциональной ценности», «Карта технического состояния», «Карта использования ресурсов», «Карта функционального дублирования», «Карта зависимостей», «Карта жизненного цикла»._
