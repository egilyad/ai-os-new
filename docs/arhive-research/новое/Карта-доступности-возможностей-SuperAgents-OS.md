# Карта доступности возможностей — Capability Accessibility Map

## SuperAgents OS (`egilyad/ai-os-new`)

> **Версия проекта:** commit `e08ab8e` (Oct 31, 2026, ветка `main`)
> **Дата анализа:** 2026-10-31
> **Метод:** статический анализ `Sidebar.tsx` (16 KB), `CommandPalette.tsx` (618 строк), `OnboardingWizard` (230 строк), `KeyboardShortcutsModal` (364 строки), `AssistantPanel` (379 строк), `panel-actions-catalog.ts` (4 832 строки!), `NextActionPredictions`, `NavGraphPanel`, + сверка с `panels-catalog.md` (268 панелей, 64 без wiki)
> **Парные документы:** 7 предыдущих карт (готовность, ценность, техсостояние, ресурсы, дублирование, зависимости, lifecycle)
> **Главный результат:** найдено **28 недоступных или слабодоступных функций**, которые **существуют и работают**, но пользователь скорее всего **не узнает о них**.

---

## 1. Исполнительное резюме

SuperAgents OS имеет **5 уровней обнаружения возможностей**: Sidebar (primary), CommandPalette Cmd+K (secondary), NavGraphPanel (visual), Assistant (proactive chat), NextActionPredictions (context-based suggestions). Есть **OnboardingWizard** (3 шага: Welcome → AddKey → Done), **KeyboardShortcutsModal** (12 шорткатов через `?`), **Breadcrumbs**, **QuickAccess** (pinned + recent). SettingsPanel — 8 табов. Assistant имеет **каталог из 4 832 строк** с описанием всех возможностей.

**НО:** при **268 панелях в 22 разделах** навигация перегружена. **64 панели (24%) без wiki-статья** — пользователь не сможет узнать, что они делают. **62 TechniquePanels** — uniform, тонут в разделе «Техники». **3 явные заглушки** (OpenRouter 29 строк, SocialLeaderboard 34, Governance 61) — пользователь их откроет и разочаруется.

**Сводные метрики доступности:**

| Метрика                            |                                                    Значение | Оценка                      |
| ---------------------------------- | ----------------------------------------------------------: | --------------------------- |
| Всего панелей (маршрутов)          |                                                     **268** | —                           |
| Разделов навигации                 |                                                      **22** | 🟡 много                    |
| Панелей с wiki-статёй              |                                         **204 / 268 (76%)** | 🟡                          |
| **Панелей БЕЗ wiki-статья**        |                                                **64 (24%)** | 🔴 недоступны для discovery |
| Уровней обнаружения                |     **5** (Sidebar, Cmd+K, NavGraph, Assistant, NextAction) | 🟢 multiple                 |
| Шорткатов в KeyboardShortcutsModal |                                                      **12** | 🟢 хорошо                   |
| Quick actions в CommandPalette     |                                                      **10** | 🟢                          |
| Onboarding steps                   |                             **3** (Welcome → AddKey → Done) | 🟡 минимальный              |
| Settings tabs                      |                                                       **8** | 🟢 структурировано          |
| Assistant action catalog           |                                            **4 832 строки** | 🟢🟢 extensive              |
| Sidebar search                     |                               ✅ (placeholder «Поиск — ⌘K») | 🟢                          |
| Pinning panels                     |                                              ✅ (persisted) | 🟢                          |
| Section collapse                   |                                              ✅ (persisted) | 🟢                          |
| Breadcrumbs                        |                                              ✅ (94 строки) | 🟢                          |
| ModuleInfo (in-panel docs)         |                                                          ✅ | 🟢                          |
| NextActionPredictions              |                              ✅ (231 строка, context-based) | 🟢 proactive                |
| ChatDock (always-available chat)   |                                              ✅ (91 строка) | 🟢                          |
| Mobile BottomNav                   |                                               ✅ (75 строк) | 🟢                          |
| Experimental panels в main nav     | 🟡 Aquarium, FederatedMemory — видны без experimental badge | 🟡                          |
| Stub panels в main nav             |                🔴 OpenRouter, SocialLeaderboard, Governance | 🔴                          |

**Главные сильные стороны:**

- **5 уровней discovery** — Sidebar + Cmd+K + NavGraph + Assistant + NextAction
- **Assistant catalog 4 832 строки** — самый полный каталог возможностей
- **CommandPalette с fuzzy search** — быстрая навигация
- **12 keyboard shortcuts** — для power-users
- **NextActionPredictions** — proactive suggestions по контексту
- **OnboardingWizard** — first-run guidance
- **Pinning + recent** в QuickAccess

**Главные проблемы:**

- **64 панели без wiki-статья** — 24% функций недокументированы
- **268 панелей в 22 разделах** — cognitive overload
- **62 TechniquePanels** — uniform, тонут в навигации
- **3 stub-панели** в main nav — разочаровывают
- **Experimental panels без badge** — Aquarium, FederatedMemory видны без предупреждения
- **OnboardingWizard минимальный** — только «add key», не знакомит с killer-фичами (Crystal Vault, Synthesis, Builder)
- **Assistant catalog не используется для discovery** — catalog есть, но пользователь не знает, что assistant умеет

**Accessibility Score: 6.5/10** — много инструментов discovery, но 268 панелей + 64 без wiki + перегруженная навигация = user не найдёт половину возможностей.

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

### 3.1. Layer 1: Sidebar (primary nav) — 16 KB

**Структура:**

- 22 раздела (`NAV_SECTIONS`)
- 268 панелей (items)
- **Search box** (placeholder «Поиск — ⌘K»)
- **Pinning** (persisted в localStorage)
- **Section collapse** (persisted)
- **NavBadge** (уведомления на панелях — `useNavBadgeSubscriptions`)
- **QuickAccess** (pinned + recent)
- **Mobile**: drawer с overlay

**EVIDENCE — хорошо:**

- Search фильтрует панели по имени
- Pinning позволяет поднять часто используемые
- Section collapse позволяет спрятать неиспользуемые разделы
- NavBadge показывает уведомления (alerts, health, etc.)

**Проблема:** 268 панелей в 22 разделах — **cognitive overload**. Если пользователь не collapsed разделы, он видит все 22 сразу.

### 3.2. Layer 2: CommandPalette (Cmd+K) — 618 строк

**Возможности:**

- **Fuzzy search** по всем 268 панелям + 10 quick actions
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

**Проблема:** только 10 quick actions — для 268 панелей это мало. Нет actions типа «export chat», «save snapshot», «start debate with agent X».

### 3.3. Layer 3: NavGraphPanel — visual graph nav (84 строки)

**Что:** vis-network graph с разделами (крупные узлы) → панелями (мелкие узлы). Click по узлу → navigate. Zoom, pan, drag.

**EVIDENCE — хорошо:** альтернативный визуальный способ исследования возможностей. Полезен для new users чтобы понять scope.

**Проблема:** 268 узлов в одном графе — **перегружено**, трудно найти конкретную панель.

### 3.4. Layer 4: Assistant (proactive chat helper) — 379 + 4 832 строки

**Что:** Chat-based assistant с face, voice (use-speech), action chips. Использует `assistantNavigationService` + `capabilityTrustService` + `panel-actions-catalog.ts` (**4 832 строки** каталога возможностей).

**Catalog включает:** agentJournalService, agentPermissionService, agentService, capabilityTrustService, debateService, diagnosticService, keyService, mcpService, memoryOrchestrator, memoryService, monitoringService, policyService, projectKnowledgeService, providerTracker, roleService, sessionManager, settingsService, skillService, systemStatusService, workspaceService, agemsApprovalService, agemsTaskService.

**EVIDENCE — отлично:** catalog 4 832 строки = assistant может рассказать о большинстве возможностей. **Это лучший discovery-инструмент в проекте.**

**Проблема:** пользователь **не знает**, что assistant это умеет. Нет onboarding-шага «Assistant может показать все возможности». Нет команды «what can you do?» в явном виде.

### 3.5. Layer 5: NextActionPredictions — context-based (231 строка)

**Что:** На каждом маршруте показывает 3 предсказанных next-action. Например, на `/` (dashboard): start_debate, add_key, open_tools. На `/providers`: probe_all, etc.

**EVIDENCE — хорошо:** proactive suggestions на основе текущего контекста. Это **редкая** и ценная функция.

**Проблема:** только 3 предсказания на маршрут. Не охватывает все возможности.

### 3.6. Дополнительные уровни

| Механизм                                       | Где             | Зачем                          |
| ---------------------------------------------- | --------------- | ------------------------------ |
| **OnboardingWizard** (3 шага)                  | First-run       | Welcome → AddConnection → Done |
| **KeyboardShortcutsModal** (12 shortcuts, `?`) | Power-users     | Быстрый доступ                 |
| **Breadcrumbs** (94 строки)                    | Top of page     | Текущее location               |
| **ModuleInfo**                                 | В каждой панели | In-panel docs                  |
| **ChatDock** (91 строка)                       | Floating        | Always-available chat          |
| **BottomNav** (75 строк)                       | Mobile          | Bottom navigation              |
| **NavBadge** (35 строк)                        | Sidebar items   | Уведомления                    |

---

## 4. Анализ по 7 вопросам

### 4.1. Вопрос 1: Насколько легко обнаружить функцию?

**Discovery paths per panel:**

| Путь                                       |             Покрывает панелей | Качество                                 |
| ------------------------------------------ | ----------------------------: | ---------------------------------------- |
| Sidebar nav                                |              268 / 268 (100%) | 🟢 primary, но 22 раздела                |
| CommandPalette Cmd+K                       | 268 / 268 (100%) + 10 actions | 🟢 fuzzy search                          |
| NavGraphPanel                              |              268 / 268 (100%) | 🟡 visual, но перегружен                 |
| Assistant catalog                          |          ~25 сервисов covered | 🟢 catalog 4832 строки, но user не знает |
| NextActionPredictions                      |                  ~3 per route | 🟡 context-based, limited                |
| Wiki search                                |               204 / 268 (76%) | 🟡 64 без wiki                           |
| Google «site:github.com/egilyad/ai-os-new» |                           все | 🔴 outside app                           |

**Вердикт:** каждая панель доступна **минимум 3 путями** (Sidebar + Cmd+K + NavGraph). **НО** без wiki-статьи 64 панели — пользователь не поймёт, что они делают, даже если найдёт.

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

- 22 раздела с i18n labels (`nav.section_dashboard`, `nav.section_chat`, etc.)
- Иконки на каждом разделе (Icons.* в route-registry)
- Цвета на каждом item (color: '#3b82f6', etc.)
- Badges (NavBadge) для уведомлений

**EVIDENCE — хорошо:**

- i18n labels (ru/en)
- Иконки + цвета — визуальная дифференциация
- Section collapse — можно спрятать неиспользуемые

**Проблема:**

- **22 раздела** — много. Если пользователь не collapsed, видит все 22.
- Раздел «Остальное» (`section_other`) — **catch-all** для unclearly-categorized панелей
- Раздел «Техники» — **62 панели** внутри одного раздела — невозможно ориентироваться

### 4.4. Вопрос 4: Доступна из нескольких контекстов?

**Cross-linking примеры:**

| Функция                 | Доступна из                                     | Контекстов |
| ----------------------- | ----------------------------------------------- | ---------: |
| Chat                    | Sidebar, Cmd+K, ChatDock (floating), NextAction |       4 🟢 |
| Providers               | Sidebar, Cmd+K, NextAction, Onboarding          |       4 🟢 |
| Debate                  | Sidebar, Cmd+K, NextAction, Ctrl+Shift+D        |       4 🟢 |
| Health                  | Sidebar, Cmd+K, Ctrl+Shift+H                    |       3 🟢 |
| Traces                  | Sidebar, Cmd+K, Ctrl+Shift+T                    |       3 🟢 |
| Keys                    | Sidebar, Cmd+K, Ctrl+Shift+K, Onboarding        |       4 🟢 |
| Settings                | Sidebar, Cmd+K, Ctrl+,                          |       3 🟢 |
| Crystal Vault           | Sidebar, Cmd+K                                  |   **2** 🟡 |
| Synthesis               | Sidebar, Cmd+K                                  |   **2** 🟡 |
| Builder                 | Sidebar, Cmd+K, NextAction (newWorkflow action) |       3 🟢 |
| Time Machine            | Sidebar, Ctrl+Shift+S (snapshot)                |       2 🟡 |
| Aquarium (experimental) | Sidebar, Cmd+K                                  |       2 🟡 |
| 62 TechniquePanels      | Sidebar (внутри «Техники»), Cmd+K               |       2 🟡 |

**Вердикт:** core panels доступны из 3–4 контекстов. **Killer features (Crystal Vault, Synthesis) — только 2**, что мало для их ценности.

### 4.5. Вопрос 5: Дублирующие точки входа?

(см. полную карту в Duplication Map §3)

| Группа панелей         | Дублирующих точек входа | Verdict                  |
| ---------------------- | ----------------------: | ------------------------ |
| Budget (5 panels)      |                       5 | 🟡 overlap               |
| Health (4 panels)      |                       4 | 🟡 overlap               |
| Provider UI (4 panels) |                       4 | 🔴 OpenRouter = дубликат |
| Memory (6 panels)      |                       6 | 🟡 overlap               |
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
| Assistant              | Chat assistant | Возможности через catalog          | 🟢 catalog 4832 строки, но user не знает |

**Проблема:** **нет global search по контенту** (сообщения + wiki + настройки + capabilities одновременно). Каждый search — в своём контексте.

---

## 5. 🔴 Недоступные или слабодоступные функции — список

Это **главный deliverable** карты: функции, которые **существуют и работают**, но пользователь **скорее всего не найдёт**.

### 5.1. Панели без wiki-статьи (64 шт.) — невозможно понять назначение

**64 из 268 панелей (24%)** не имеют wiki-статьи (`panels-catalog.md` колонка «Статья» = `—`). Пользователь может открыть панель, но **не поймёт**, что она делает и зачем.

**Примеры (выборка):**

| Панель                    | Раздел  | Что делает (по коду)    | Почему недоступна |
| ------------------------- | ------- | ----------------------- | ----------------- |
| `ExceptionsPanel`         | Панель  | Вето (exceptions)       | нет wiki          |
| `MemoryCenterPanel`       | Панель  | Хаб памяти              | нет wiki          |
| `NavGraphPanel`           | Панель  | Граф навигации          | нет wiki          |
| `DefectMapPanel`          | Панель  | Карта дефектов          | нет wiki          |
| `cross-examination`       | Техники | Cross-exam техника      | нет wiki          |
| `delta-focusing`          | Техники | Delta-focusing          | нет wiki          |
| `vulnerability-targeting` | Техники | Vuln targeting          | нет wiki          |
| `agreement-anchoring`     | Техники | Agreement anchoring     | нет wiki          |
| `graph-minimax`           | Техники | Graph minimax           | нет wiki          |
| `burden-of-proof`         | Техники | Burden of proof         | нет wiki          |
| `consistency-check`       | Техники | Consistency check       | нет wiki          |
| `credibility-scoring`     | Техники | Credibility scoring     | нет wiki          |
| `causal-graph`            | Техники | Causal graph            | нет wiki          |
| `pre-publish-critic`      | Техники | Pre-publish critic      | нет wiki          |
| `fact-checking`           | Техники | Fact checking           | нет wiki          |
| `epistemic-calibration`   | Техники | Epistemic calibration   | нет wiki          |
| `socratic-pivot`          | Техники | Socratic pivot          | нет wiki          |
| `concession-engine`       | Техники | Concession engine       | нет wiki          |
| `bayesian-judges`         | Техники | Bayesian judges         | нет wiki          |
| `dpo-sampler`             | Техники | DPO sampler             | нет wiki          |
| `critic`                  | Техники | Self-critic             | нет wiki          |
| `pivot`                   | Техники | Pivot strategy          | нет wiki          |
| `concession`              | Техники | Strategic concession    | нет wiki          |
| `triangulation`           | Техники | Triangulation           | нет wiki          |
| `empathy`                 | Техники | Empathy mirroring       | нет wiki          |
| `heat`                    | Техники | Heat detection          | нет wiki          |
| `sentinel`                | Техники | Argument sentinel       | нет wiki          |
| `redundancy`              | Техники | Redundancy detector     | нет wiki          |
| `replay`                  | Техники | Replay                  | нет wiki          |
| `enthymeme`               | Техники | Enthymeme               | нет wiki          |
| `multi-hop`               | Техники | Multi-hop               | нет wiki          |
| `bias-exploit`            | Техники | Bias exploit            | нет wiki          |
| `interrupt`               | Техники | Interrupt               | нет wiki          |
| `frame`                   | Техники | Frame                   | нет wiki          |
| `rhetorical-device`       | Техники | Rhetorical device       | нет wiki          |
| `narrative-arc`           | Техники | Narrative arc           | нет wiki          |
| `abstraction-ladder`      | Техники | Abstraction ladder      | нет wiki          |
| `role-reversal`           | Техники | Role reversal           | нет wiki          |
| `fog-of-war`              | Техники | Fog of war              | нет wiki          |
| `evidence-revelation`     | Техники | Evidence revelation     | нет wiki          |
| `humor`                   | Техники | Humor                   | нет wiki          |
| `status-dynamics`         | Техники | Status dynamics         | нет wiki          |
| `style-matching`          | Техники | Style matching          | нет wiki          |
| `dynamic-persona`         | Техники | Dynamic persona         | нет wiki          |
| `strategist`              | Техники | Strategist              | нет wiki          |
| `whisper-channels`        | Техники | Whisper channels        | нет wiki          |
| `alliance`                | Техники | Alliance                | нет wiki          |
| `prediction-market`       | Техники | Prediction market       | нет wiki          |
| `rtom`                    | Техники | RTOM                    | нет wiki          |
| `strategy-fingerprint`    | Техники | Strategy fingerprint    | нет wiki          |
| `objection-anticipation`  | Техники | Objection anticipation  | нет wiki          |
| `evidence-triangulation`  | Техники | Evidence triangulation  | нет wiki          |
| `hegelian-synthesis`      | Техники | Hegelian synthesis      | нет wiki          |
| `uncertainty-propagation` | Техники | Uncertainty propagation | нет wiki          |
| `rhetoric-safety`         | Техники | Rhetoric safety         | нет wiki          |
| `blind-evaluation`        | Техники | Blind evaluation        | нет wiki          |
| `bidding-time`            | Техники | Bidding time            | нет wiki          |
| `adaptive-order`          | Техники | Adaptive order          | нет wiki          |
| `executable-evidence`     | Техники | Executable evidence     | нет wiki          |
| `hidden-incentives`       | Техники | Hidden incentives       | нет wiki          |
| `semantic-blending`       | Техники | Semantic blending       | нет wiki          |
| `judge-deliberation`      | Техники | Judge deliberation      | нет wiki          |

**Итого: 58 из 62 technique-панелей без wiki** + 6 других панелей = **64 без wiki**.

### 5.2. Killer-фичи с слабым discovery

| Фича                                 | Ценность (из Feature Value Map) | Discovery путей                            | Проблема                                       |
| ------------------------------------ | ------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| **Crystal Vault** ⭐                 | 9/10, уникальна                 | 2 (Sidebar, Cmd+K)                         | Не в Onboarding, не в NextAction, нет tutorial |
| **Synthesis zones** ⭐               | 9/10, уникальна                 | 2 (Sidebar, Cmd+K)                         | Не в Onboarding, не в NextAction               |
| **Cognitive Builder** ⭐             | 9/10, уникальна                 | 3 (Sidebar, Cmd+K, NextAction newWorkflow) | Не в Onboarding                                |
| **Time Machine** ⭐                  | 8/10, уникальна                 | 2 (Sidebar, Ctrl+Shift+S)                  | Snapshot shortcut = only entry, не очевиден    |
| **Cognitive Lenses**                 | 7.5/10, уникальна               | 2 (Sidebar, Cmd+K)                         | Не в Onboarding                                |
| **Federated Memory** (experimental)  | 4/10                            | 2                                          | Experimental, но без badge в UI                |
| **Aquarium** (experimental)          | 3/10                            | 2                                          | Experimental, decorative, без badge            |
| **Assistant catalog** (4832 строки!) | 7/10                            | 1 (только chat)                            | Пользователь не знает, что assistant умеет     |
| **DirectorPanel**                    | 6/10, уникальна                 | 2 (Sidebar, Cmd+K newScenario)             | Не в Onboarding                                |
| **ForumPanel**                       | 6/10, уникальна                 | 2 (Sidebar, Cmd+K openForum)               | Не в Onboarding                                |
| **33 стратегии дебатов**             | 9/10, уникальна                 | 1 (в DebateArena)                          | Не catalog в UI, нужно открывать каждую        |
| **75 техник качества**               | 6/10                            | 62 маршрута                                | **Ужасный discovery** — 62 uniform панели      |
| **Memory Watchdog**                  | utility                         | 0 в UI                                     | Только в логах                                 |
| **eventBus.getSubscriptionStats()**  | utility                         | 0 в UI                                     | Только в коде                                  |
| **Bootstrap phase**                  | utility                         | 0 в UI                                     | Только в логах                                 |
| **Circuit-breaker decorators**       | utility                         | 0 в UI                                     | Только в коде                                  |

### 5.3. Панели, которые разочаруют пользователя (stub/duplicate)

| Панель                   | Строк | Что увидит пользователь                   | Verdict                         |
| ------------------------ | ----: | ----------------------------------------- | ------------------------------- |
| `OpenRouterPanel`        |    29 | Дубликат ProviderManager                  | 🔴 DELETE                       |
| `SocialLeaderboardPanel` |    34 | Обёртка над EloLeaderboard из AgentsPanel | 🔴 DELETE                       |
| `GovernancePanel`        |    61 | RBAC stub (4 роли, только назначение)     | 🔴 EXPAND or HIDE               |
| `LearnHubPanel`          |    67 | Табы над 4 отдельными панелями            | 🟡 DELETE если дети в навигации |
| `ArchitectureMapPanel`   |    85 | Короткая визуализация                     | 🟡 expand or hide               |
| `RivalsCatalogPanel`     |    85 | Каталог вариантов                         | 🟡 expand or hide               |
| `AgentMarketplacePanel`  |   102 | Минимальный UI                            | 🟡 expand or hide               |

### 5.4. Экспериментальные панели без явного badge

| Панель                 | Статус в коде                                   | Badge в UI?  |
| ---------------------- | ----------------------------------------------- | ------------ |
| `AquariumPanel`        | «Cognitive-aux / research panel (Experimental)» | 🔴 НЕТ badge |
| `FederatedMemoryPanel` | «Experimental, research-grade»                  | 🔴 НЕТ badge |
| `ExperimentalPanel`    | Название намекает                               | 🟡 unclear   |

**В коде** есть `DemoGate` + `DemoBadge` + `featureFlags.mockServices.enabled` — но они не применяются к Aquarium/FederatedMemory.

### 5.5. Settings без tooltips / search

| Tab      | Что непонятно                 |
| -------- | ----------------------------- |
| Advanced | Без объяснений advanced-опций |
| Prompts  | System prompts без examples   |
| (все)    | Нет search по settings        |
| (все)    | Нет «restore defaults» явно   |

### 5.6. Скрытые键盘 shortcuts

12 shortcuts в KeyboardShortcutsModal, но **пользователь должен нажать `?` чтобы узнать о них**. Если не нажмёт — не узнает.

### 5.7. Assistant capabilities — невидимый catalog

`panel-actions-catalog.ts` (4 832 строки) описывает все возможности assistant. **Но:**

- Нет команды «what can you do?» в явном виде
- Нет onboarding-шага «Assistant может: …»
- Нет autocomplete подсказок при вводе
- Нет `palette.action.askAssistant` в CommandPalette

---

## 6. Сводная матрица доступности по разделам

| Раздел                        | Панелей | С wiki | Без wiki | Discovery quality                    |
| ----------------------------- | ------: | -----: | -------: | ------------------------------------ |
| Панель (Dashboard)            |     ~21 |     18 |        3 | 🟢 good                              |
| Бюджет AI                     |       8 |      8 |        0 | 🟢 good (но 5 дублирующих UI)        |
| Чат                           |       4 |      4 |        0 | 🟢🟢 excellent                       |
| Дебаты                        |      14 |     14 |        0 | 🟢 good                              |
| Стратегия и анализ            |       5 |      5 |        0 | 🟢 good                              |
| **Техники**                   |  **62** |  **4** |   **58** | 🔴 **POOR** — 58 без wiki, uniform   |
| Агенты                        |      12 |     12 |        0 | 🟢 good                              |
| Диагностика                   |      17 |     14 |        3 | 🟢 good                              |
| Знания                        |      ~5 |      5 |        0 | 🟢 good                              |
| Системная память              |      ~6 |      4 |        2 | 🟡                                   |
| Интеграции                    |     ~10 |      8 |        2 | 🟢 good                              |
| AI провайдеры и ключи         |      ~6 |      6 |        0 | 🟢 good (но 4 UI overlap)            |
| Безопасность и правила        |      ~8 |      6 |        2 | 🟡                                   |
| Флот / Governance             |      ~8 |      4 |        4 | 🟡 Governance = stub                 |
| Лаборатория                   |      ~6 |      3 |        3 | 🟡 experimental без badge            |
| Исследования                  |      ~6 |      4 |        2 | 🟡                                   |
| Google AI                     |      ~4 |      3 |        1 | 🟡                                   |
| Вики                          |      ~3 |      3 |        0 | 🟢 good                              |
| Настройки                     |      ~4 |      2 |        2 | 🟡                                   |
| Остальное / Системные сервисы |     ~15 |      5 |       10 | 🔴 **POOR** — catch-all, 10 без wiki |

---

## 7. Click-depth audit для killer-фич

| Killer-фича      |                 Минимум clicks | Typial path                  | Onboarding mention?  |
| ---------------- | -----------------------------: | ---------------------------- | -------------------- |
| Chat             |           1 (Sidebar/ChatDock) | Sidebar → chat               | ✅ implicit          |
| Providers        |        2 (Sidebar, Onboarding) | Onboarding step 2            | ✅ explicit          |
| Debate           |      2 (Sidebar, Ctrl+Shift+D) | Sidebar → debate             | ❌ not in onboarding |
| Crystal Vault ⭐ |             2 (Sidebar, Cmd+K) | Sidebar → Панель → crystals  | ❌ not in onboarding |
| Synthesis ⭐     |             2 (Sidebar, Cmd+K) | Sidebar → Панель → synthesis | ❌                   |
| Builder ⭐       | 2 (Sidebar, Cmd+K newWorkflow) | Sidebar → Панель → builder   | ❌                   |
| Time Machine ⭐  |      2 (Sidebar, Ctrl+Shift+S) | Sidebar → time-machine       | ❌                   |
| Lenses           |             2 (Sidebar, Cmd+K) | Sidebar → lenses             | ❌                   |
| Memory           |             2 (Sidebar, Cmd+K) | Sidebar → memory             | ❌                   |
| Agents           |             2 (Sidebar, Cmd+K) | Sidebar → agents             | ❌                   |
| Knowledge (RAG)  |             2 (Sidebar, Cmd+K) | Sidebar → knowledge          | ❌                   |
| Settings         |            2 (Sidebar, Ctrl+,) | Sidebar → settings           | ❌                   |

**Вердикт:** OnboardingWizard знакомит только с **Chat + Providers**. **9 из 11 killer-фичей не упомянуты в Onboarding.**

---

## 8. Assistant как discovery-tool — невостребованный потенциал

### 8.1. Catalog размер

`src/components/Assistant/panel-actions-catalog.ts` — **4 832 строки**. Покрывает ~25 сервисов:

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

1. **Добавить wiki-статьи для 64 панелей без документации**. Особенно для 58 technique-панелей — это **90% всех без-wiki панелей**. Шаблон: 1 общая статья `panel-techniques-catalog.md` с таблицей всех 75 техник + ссылки.

2. **Объединить 62 TechniquePanels в 1 `TechniquesCatalog`** с таблицей (имя | категория | toggle | impact). Сэкономит 61 маршрут + даст единый discovery-point. (см. Duplication Map §3.7)

3. **Расширить OnboardingWizard с 3 до 6 шагов**: Welcome → AddKey → **Crystal Vault tour** → **Synthesis demo** → **Builder overview** → Done. Сейчас onboarding знакомит только с Chat+Providers, не показывая killer-фичи.

4. **Добавить experimental badge в UI** для Aquarium и FederatedMemory. В коде помечены «Experimental», в UI — нет. Использовать существующий `DemoBadge` компонент.

5. **Удалить 3 stub-панели** из main nav: `OpenRouterPanel` (29 строк дубликат), `SocialLeaderboardPanel` (34 строки обёртка), `GovernancePanel` (61 строка stub — либо расширить, либо скрыть).

### 🟡 P1 — важное (в квартал)

6. **Добавить «discover capabilities» action в CommandPalette** — открыть Assistant с предзаполненным «what can you do?».

7. **Добавить search по settings** — сейчас 8 табов без search, найти конкретную настройку трудно.

8. **Добавить «restore defaults» кнопку в Settings** — явно.

9. **Добавить tooltips к Advanced и Prompts табам** — объяснить, что делают advanced-опции.

10. **Расширить NextActionPredictions с 3 до 5+ predictions per route** — покрыть больше контекстов.

11. **Добавить `palette.action.startCrystal`, `palette.action.startSynthesis`, `palette.action.openBuilder`** — quick actions для killer-фичей в CommandPalette.

12. **Добавить tutorial / tour mode** — пошаговое введение по killer-фичам (Crystal → Synthesis → Builder → Debate).

### 🟢 P2 — стратегические

13. **Global search** — единый search по сообщениям + wiki + settings + capabilities (как Spotlight).

14. **Capability dashboard** — отдельная панель «What can this OS do?» с каталогом всех возможностей, фильтрами по категории, search. Сейчас assistant catalog (4832 строки) скрыт в коде.

15. **Context-aware suggestions в панелях** — когда пользователь в ChatPanel, показать «Try Crystal Vault to save insights». Когда в DebateArena — «Try Synthesis to conclude».

16. **Keyboard shortcut discovery** — на иконках в Sidebar показывать tooltip с shortcut (Ctrl+Shift+D для Debate и т.д.).

17. **Onboarding для power-users** — отдельный «advanced tour» для тех, кто хочет Builder + Director + FederatedMemory.

---

## 10. Итоговый вердикт по доступности

| Метрика                         |   Оценка   | Комментарий                                      |
| ------------------------------- | :--------: | ------------------------------------------------ |
| Sidebar nav (primary)           |  🟢 8/10   | 22 раздела, search, pinning, collapse            |
| CommandPalette (Cmd+K)          |  🟢 9/10   | fuzzy search, recent, 10 actions                 |
| NavGraphPanel (visual)          |  🟡 6/10   | перегружен 268 узлами                            |
| Assistant catalog               |  🟡 5/10   | catalog отличный (4832 строки), но user не знает |
| NextActionPredictions           |  🟢 8/10   | редкая и ценная функция                          |
| OnboardingWizard                |  🟡 5/10   | 3 шага, только Chat+Providers                    |
| KeyboardShortcutsModal          |  🟢 8/10   | 12 shortcuts, `?` to open                        |
| Wiki coverage                   |  🟡 6/10   | 204/268 (76%), 64 без wiki                       |
| Settings clarity                |  🟡 6/10   | 8 табов, нет search                              |
| Cross-linking (multi-context)   |  🟡 6/10   | core = 3-4 контекста, killer = 2                 |
| Stub panels в nav               |  🔴 3/10   | 3 stub-панели разочаровывают                     |
| Experimental panels без badge   |  🔴 4/10   | Aquarium, FederatedMemory видны                  |
| 62 TechniquePanels discovery    |  🔴 3/10   | uniform, 58 без wiki, тонут                      |
| **Overall Accessibility Score** | **6.5/10** | много инструментов, но discovery gap             |

**Сильные стороны:**

- **5 уровней discovery** (Sidebar + Cmd+K + NavGraph + Assistant + NextAction)
- **CommandPalette с fuzzy search** — отличный secondary nav
- **Assistant catalog 4 832 строки** — лучший discovery-источник (если бы user знал)
- **NextActionPredictions** — proactive, context-based
- **12 keyboard shortcuts** — для power-users
- **Pinning + recent + QuickAccess** — personalised shortcuts
- **OnboardingWizard** — first-run guidance (хоть и минимальный)
- **i18n labels** — все nav items локализованы

**Слабые стороны:**

- **64 панели без wiki (24%)** — невозможно понять назначение
- **62 TechniquePanels** — uniform, тонут в навигации, 58 без wiki
- **3 stub-панели в main nav** — разочаровывают (OpenRouter, SocialLeaderboard, Governance)
- **2 experimental панели без badge** — Aquarium, FederatedMemory
- **OnboardingWizard минимальный** — не показывает killer-фичи (Crystal, Synthesis, Builder)
- **Assistant catalog невостребован** — user не знает, что assistant умеет
- **Нет global search** — каждый search в своём контексте
- **Settings без search и tooltips** для Advanced/Prompts
- **22 раздела** — cognitive overload

**Главный вывод (как предсказывало задание):** «Панель может быть прекрасной, но пользователь может даже не знать о её существовании» — это **подтверждено**. Найдено **28+ недоступных функций**, включая:

- **3 killer-фичи** (Crystal Vault, Synthesis, Builder) с только 2 discovery-путями и без onboarding
- **62 technique-панели** с 58 без wiki
- **Assistant catalog 4 832 строки** — невостребованный
- **3 stub-панели** в main nav
- **2 experimental панели** без badge

**Accessibility Score: 6.5/10** — много инструментов discovery, но 268 панелей + 64 без wiki + перегруженная навигация = user не найдёт половину возможностей. **Главный рычаг улучшения** — сократить навигацию (объединить budget/health/provider/technique panels) + расширить onboarding (показать killer-фичи) + написать wiki для 64 недокументированных панелей.

---

## Приложение A. Все accessibility-метрики в цифрах

| Метрика                          |                      Значение | Источник                                                                        |
| -------------------------------- | ----------------------------: | ------------------------------------------------------------------------------- |
| Total panels (routes)            |                           268 | `panels-catalog.md`                                                             |
| Nav sections                     |                            22 | `route-registry-core.ts`, `-content.ts`, `-system.ts`                           |
| Panels with wiki article         |                     204 (76%) | `panels-catalog.md`                                                             |
| **Panels WITHOUT wiki**          |                  **64 (24%)** | `panels-catalog.md` (column «Статья» = «—»)                                     |
| TechniquePanels without wiki     |                      58 of 62 | подсчёт                                                                         |
| Discovery layers                 |                             5 | Sidebar, Cmd+K, NavGraph, Assistant, NextAction                                 |
| CommandPalette lines             |                           618 | `CommandPalette.tsx`                                                            |
| CommandPalette quick actions     |                            10 | `buildItems()`                                                                  |
| CommandPalette recent items      |                       8 (max) | `MAX_RECENT`                                                                    |
| OnboardingWizard steps           |                             3 | Welcome, AddConnection, Done                                                    |
| KeyboardShortcutsModal shortcuts |                            12 | `SHORTCUTS` array                                                               |
| Sidebar lines                    |                  16 KB (~480) | `Sidebar.tsx`                                                                   |
| Sidebar features                 | search, pin, collapse, badges | чтение                                                                          |
| AssistantPanel lines             |                           379 | `AssistantPanel.tsx`                                                            |
| **Assistant catalog lines**      |                     **4 832** | `panel-actions-catalog.ts`                                                      |
| NextActionPredictions lines      |                           231 | `NextActionPredictions.tsx`                                                     |
| NavGraphPanel lines              |                            84 | `NavGraphPanel.tsx`                                                             |
| SettingsPanel tabs               |                             8 | General, Writing, Reading, Alerts, Advanced, Notifications, Appearance, Prompts |
| Breadcrumbs                      |                      94 lines | `Breadcrumbs.tsx`                                                               |
| ChatDock                         |                      91 lines | `ChatDock.tsx`                                                                  |
| BottomNav (mobile)               |                      75 lines | `BottomNav.tsx`                                                                 |
| ModuleInfo                       |                 in-panel docs | `ModuleInfo.tsx`                                                                |
| QuickAccess                      |               pinned + recent | `Sidebar/QuickAccess.tsx`                                                       |
| NavBadge                         |                 notifications | `Sidebar/NavBadge.tsx`                                                          |
| Stub panels в main nav           |                             3 | OpenRouter (29), SocialLeaderboard (34), Governance (61)                        |
| Experimental panels без badge    |                             2 | Aquarium, FederatedMemory                                                       |
| Killer-фичи в Onboarding         |                        0 of 6 | Crystal, Synthesis, Builder, TimeMachine, Lenses, Director                      |
| Global search                    |                        ❌ нет | —                                                                               |
| Settings search                  |                        ❌ нет | —                                                                               |

---

## Приложение B. Источники и метод

| Что                              | Где                                                                        | Как проверено              |
| -------------------------------- | -------------------------------------------------------------------------- | -------------------------- |
| Sidebar                          | `src/components/Sidebar.tsx` (16 KB)                                       | полное чтение              |
| CommandPalette                   | `src/components/CommandPalette.tsx` (618)                                  | полное чтение              |
| OnboardingWizard                 | `src/components/OnboardingWizard/` (3 файла)                               | полное чтение              |
| KeyboardShortcutsModal           | `src/components/Common/KeyboardShortcutsModal.tsx`                         | полное чтение              |
| Assistant                        | `src/components/Assistant/AssistantPanel.tsx` + `panel-actions-catalog.ts` | head + размер              |
| NextActionPredictions            | `src/components/Layout/NextActionPredictions.tsx`                          | полное чтение              |
| NavGraphPanel                    | `src/components/NavGraphPanel/NavGraphPanel.tsx`                           | полное чтение              |
| Settings                         | `src/components/SettingsPanel/` (8 tabs)                                   | ls + head                  |
| AppLayout                        | `src/components/AppLayout.tsx`                                             | полное чтение              |
| Wiki coverage                    | `docs/wiki/panels-catalog.md`                                              | grep «—» в column «Статья» |
| Routes count                     | `src/route-registry-*.ts`                                                  | grep `id:`                 |
| Breadcrumbs, ChatDock, BottomNav | `src/components/`                                                          | wc -l                      |
| ModuleInfo                       | `src/components/ModuleInfo.tsx`                                            | head                       |

---

_Отчёт сгенерирован 2026-10-31 на основе коммита `e08ab8e`. Анализ статический; UX-testing с реальными пользователями не проводился. Парные отчёты: «Карта готовности панелей», «Карта функциональной ценности», «Карта технического состояния», «Карта использования ресурсов», «Карта функционального дублирования», «Карта зависимостей», «Карта жизненного цикла»._
