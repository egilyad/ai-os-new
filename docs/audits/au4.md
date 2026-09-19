Аудит проекта ai-os-new (ветка fix-debate-text-truncation)

Разобрал репозиторий напрямую — склонировал ветку, прошёлся по коду, роутеру/меню и docs. Ниже всё с цифрами из реальных прогонов.

Источник: клон https://github.com/egilyad/ai-os-new ветка fix-debate-text-truncation, последний коммит 2026-09-17, версия 4.5.0. Код читал напрямую (не с веб-страниц GitHub).

1. Общая картина

| Параметр | Значение (проверено в коде) |
|---|---|
| Всего файлов в src/ | 2 669 |
| src/components/ | ~194 077 строк, 127 папок + 94 «свободных» файла-панели в корне |
| src/kernel/ | ~206 716 строк, 882 файла сервисов, 296 контрактов |
| src/llm/ | ~7 595 строк |
| src/stores/ | 52 файла |
| Панели в меню (nav items) | 200, в 27 секциях |
| Уникальных route-id | 285 |
| Тест-файлов | 365 (kernel 235, components 106, stores/hooks 17) |
| TODO/FIXME в коде | всего 17 (4 components, 13 kernel) |
| Упоминаний mock/stub/demo/placeholder | 877 |
| Dexie-версия в коде | v43 (dexie-schema.ts, version(43)) |

Главный вывод по зрелости: это не «сырой» проект, а очень глубокий, но сильно перераздутый и не проверенный в рантайме монолит. Документация сама это признаёт («пишем без проверок… typecheck/build — на сильном компе», «runtime не гонялся»). Долг копится, а метрики в доках расходятся с кодом (см. §4).

2. Оценки готовности панелей (0–10)

Критерии: код/глубина, интеграция (сервисы/DI/EventBus), рантайм-проверка, UX (i18n, адаптив), тесты. Рантайм не подтверждён нигде → это потолок для почти всех.

Панели дебатов и когнитивного ядра

| Панель | LOC | Тесты | Стубы | Оценка | Комментарий |
|---|---|---|---|---|---|
| DebatePanel | 12 026 | 2 | 89 | 6/10 | Ядро глубокое, но именно эта ветка правит обрезку текста; 89 stub-маркеров, рантайм не гонялся — риск регрессий. |
| TechniquePanels | 13 770 | 3 | 12 | 7/10 | 32 техники вынесены в одну секцию; много мелких панелей, большинство подключено, но тестов почти нет. |
| DebateRuntimePanel | 3 368 | 2 | 84 | 5/10 | Топология строится локально, расходится с bridge-cycle (см. PANELS_MAP.md); 84 стуба. |
| DebateLive | 2 044 | 1 | 60 | 5/10 | Много заглушек, слабая тестовая база. |
| DebateResearch | 8 415 | 0 | 13 | 5/10 | Крупная, но 0 тестов — вслепую. |
| DirectorPanel | 2 255 | 6 | 71 | 5/10 | Тестов больше всех в группе, но 71 стуб — половина логики заглушена. |
| ArgumentGraphPanel | 651 | 0 | — | 6/10 | React Flow 3-pane, desktop-only. |
| CouncilPanel | 157 | 0 | — | 6/10 | Тонкая обёртка над councilService — ок. |

Агенты, чат, провайдеры

| Панель | LOC | Тесты | Стубы | Оценка | Комментарий |
|---|---|---|---|---|---|
| AgentsPanel | 6 282 | 2 | 62 | 6/10 | Полный CRUD (agentService), но 62 стуба и дублирование мастера (локальный AgentGenerator vs agentWizardService). |
| RolesPanel | 10 193 | 1 | 28 | 7/10 | Богатый CRUD + Teams, но всего 1 тест на 10k строк. |
| ChatPanel | 4 534 | 1 | 21 | 6/10 | Рабочий, но 21 стуб. |
| ProviderManager | 7 296 | 2 | 42 | 6/10 | Ключи/health/import-export работают, но много заглушек. |
| KeyTable | 3 662 | 0 | — | 5/10 | Инфраструктура ключей без тестов. |
| SettingsPanel | 3 486 | 1 | 20 | 7/10 | settingsService, i18n, тема — одна из самых «доведённых». |
| KeyTable / PoolStatusPanel | 3 662 / 927 | 0–1 | — | 5–6/10 | — |

Дашборд, аналитика, наблюдаемость

| Панель | LOC | Тесты | Оценка | Комментарий |
|---|---|---|---|---|
| DashboardPanel | 3 100 | 1 | 7/10 | Входная точка, i18n, адаптив — ок. |
| AnalyticsPanel | 2 351 | 1 | 7/10 | — |
| TracesPanel | 2 300 | 1 | 7/10 | Таймлайн-виз, mobile-friendly. |
| HealthPanel | 2 022 | 1 | 7/10 | + SystemHealthPanel, DocsHealthPanel. |
| MemoryPanel | 1 944 | 1 | 6/10 | Hash-384 вместо vector DB — глубина средняя. |
| RoutingIntelligence | 2 276 | 1 | 6/10 | — |
| PerformanceProfilerPanel | 267 | 0 | 5/10 | Маленькая. |

Служебные / инфраструктурные

| Панель | LOC | Оценка | Комментарий |
|---|---|---|---|
| ServiceRegistryPanel | 2 212 | 6/10 | 882 сервиса без нормальной карты. |
| BuilderPanel | 1 865 | 6/10 | — |
| FleetPanel | 1 270 | 5/10 | Мега-табы + 6 обёрток, все experimental:true, 37 стубов. |
| PolicyPanel / PolicyEditorPanel | 1 227 / 1 367 | 5/10 | 16 стубов. |
| DocsHealthPanel | 368 | 7/10 | Реально подключён к consistencyChecker + consistencyHealingPipeline. |
| ComingSoonPanel / ExperimentalPanel | — | 2/10 | Явные заглушки-заполнители. |

Секция «Randoms» (30 пунктов) и прочие одиночки
Панели вроде VulnTargetingPanel, ShadowOpponentPanel, WhatIfPanel, DyadPanel, EntanglementPanel, GoTDeliberationPanel, InsightBusPanel — 110–530 LOC, по 1 тесту, без интеграции в рантайм. Оценка 3–5/10 каждая. Это кандидаты №1 на скрытие из меню.

Средний балл по проекту: ≈ 5,7/10. Потолок для «10» упирается в три вещи: (1) нигде не подтверждён рантайм, (2) 877 стубов, (3) тестами покрыто ~48% модулей компонентов.

3. Что не так с меню и навигацией (главная проблема удобства)

Я посчитал пункты по секциям из route-registry-core/content/system.ts:

| Секция | Пунктов | Проблема |
|---|---|---|
| section-techniques | 32 | Свалка техник |
| section-randoms | 30 | «Рандомс» — прямо в названии свалка |
| section-integrations | 20 | — |
| section-diagnostics | 18 | — |
| section-agents | 16 | — |
| section-debates | 15 | Пересекается с techniques |
| section-connections | 12 | — |
| section-fleet | 11 | +6 под-роутов |
| по 1 пункту | 12 секций! | project-os, lenses, crystals, junctions, synthesis, knowledge-generator, forum, builder, director, room, projects, channels |

Ключевое открытие: 12 из 27 секций содержат ровно 1 пункт. Это и есть корень «непонятно и неудобно» — сайдбар из 27 групп, половина из которых открывает одну панель.

Плюс:
- section-randoms («Рандомс») — 30 пунктов, официально названная свалка.
- 94 панели лежат «свободно» в src/components/*.tsx, а 127 — в папках. Нет единого принципа.
- Роутер разнесён на 5 файлов (route-registry-core/content/system/icons.tsx + route-imports.ts 488 строк) — тяжело поддерживать.
- Нет дедупликации близких панелей: PanelsMap/PanelMap, DebateHistoryPage vs DebatesManagerPanel vs DebateReplayPanel.

4. Аудит папки docs/ — сверка с кодом

Всего 817 файлов в docs/ (112 корневых .md). Раскладка: experementmdroadmaps/ 596, road/ 68, new/ 18, research/ 18, au/ 4, plan/ 1.

4.1 Документация, где цифры РАСХОДЯТСЯ с кодом (устарело)

| Документ | Что заявляет | Реальность в коде | Вердикт |
|---|---|---|---|
| docs/STRUCTURE.md | «638 UI-панелей», «352 DI-сервиса», «177 контрактов», «Dexie v34» | 127 папок + 94 файла ≈ 221 модуль; 882 файла сервисов; 296 контрактов; Dexie v43 | ❌ Устарело (завышено + схема сдвинулась на 9 версий) |
| docs/README.md, 07-ui-layer*.md | «120+ панелей» | фактические route-id 285, модулей ~221 | ⚠️ Частично устарело |
| docs/SYSTEM_PASSPORT.md | Date: 2026-05-27 | код от 2026-09-17 | ❌ Архив |
| docs/ПОЛНЫЙ_РЕЕСТР.md | «246 entries» | соответствует частично | ⚠️ Требует пересчёта |
| docs/SUMMARY.md | «70 доков», «Dexie v34», «205 компонентов», «23 провайдера» | доков 817, Dexie v43, модулей 221 | ❌ Устарело |

4.2 Что АКТУАЛЬНО и совпадает с кодом

| Документ | Проверка | Вердикт |
|---|---|---|
| docs/README.md (ссылки на 00–10*.md) | все 11 файлов существуют | ✅ Актуально |
| docs/CAPABILITY_MATRIX.md | честно помечает «STATICALLY VERIFIED, NOT RUNTIME VERIFIED», статусы A–G | ✅ Актуально как матрица честности |
| docs/events.md + kernel/events/event-registry.ts | реестр событий есть (2640 строк) | ✅ Актуально |
| docs/PANEL_MAP.md | автоген из route-registry-core.ts — совпадает | ✅ Актуально |
| docs/ACTUAL_SYSTEM_AUDIT.md, DEBT_REPORT.md | ссылаются на реальные codeexec-service.ts и т.п. | ✅ Актуально |

4.3 Мусор и явные дубли (удалить/в архив)

| Путь | Почему |
|---|---|
| docs/new/errrrro3r.md, docs/new/errrrorr.md | мусорные имена типа «errrro3r» — явный черновик ошибок |
| docs/new/au1.md | «аудит 1» без содержательного имени |
| docs/new/audit2/ (8 файлов + AUDIT_REPORT_ai-os-new.md) | дублирующий набор аудита рядом с основным |
| docs/PANELS_MAP.md vs docs/PANEL_MAP.md | два почти одинаковых файла, разные даты; оставить только автогенный PANEL_MAP.md |
| docs/SERVICES_INVENTORY.md (55 строк) vs docs/SERVICES_RU.md (690) | дубль по смыслу; оставить SERVICES_RU.md |
| SYSTEM_MANIFEST.md + SYSTEM_MANIFEST_RU.md + SYSTEM_PASSPORT.md + ПОЛНЫЙ_РЕЕСТР.md | 4 «паспорта системы» — свести в один |
| TASKS.md | упомянут в STRUCTURE.md, но файла НЕТ — битая ссылка |

4.4 Дубли аудита
44 файла с AUDIT + 14 файлов серии N_AUDIT / N_POST_AUDIT (N1…N4d). Это исторические вехи одного процесса — идеальный кандидат в docs/archive/.

4.5 Огромный неструктурированный пласт
docs/experementmdroadmaps/ — 596 файлов, включая папку agents/ с 32 подпапками по 16 файлов каждая (01–18 агенты × 16 тем). Это ценный, но не индексированный research-архив.

5. Что удалить / убрать в архив (точные пути)

Удалить (мусор):
docs/new/errrrro3r.md
docs/new/errrrorr.md
docs/new/au1.md
docs/new/audit2/ (дублирующий аудит)
docs/PANELS_MAP.md (дубль PANEL_MAP.md)
docs/SERVICES_INVENTORY.md (дубль SERVICES_RU.md)
src/components/RivalsHub/ (0 внешних импортов — сирота)

В архив (docs/archive/):
docs/N_AUDIT.md, docs/N_POST_AUDIT.md (14 вех-аудитов)
docs/D4.3.md, docs/D4.4, docs/D4.5, docs/D4.6
docs/T1.2/T1.3/T1.4/T2/T3.1/T3.2_POST_AUDIT.md
docs/AUDIT_PROMPT_V2/V3/V4.md, CAPABILITY_PROMPT_V6.md, CONSOLIDATION_PROMPT.md
docs/SYSTEM_PASSPORT.md (дата 2026-05-27)
docs/road/ (68 файлов) → docs/archive/road/
docs/au/ (4), docs/plan/ (1)

Проверить на удаление из package.json (0 импортов в src/):
@tiptap/pm (0)
monaco-editor (0) ← хотя @monaco-editor/react используется 1 раз; проверить транзитивность
react-is (0)

Кандидаты на консолидацию (не удалять, а слить):
src/kernel/services/rivals10 … rivals20 (19 папок «паритета» с внешними проектами)
Папки rivals…rivals20 (заметьте: rivals8 отсутствует) — это ~19 подпапок сервисов. Каждая тянет вес в ядре из 882 файлов. Стоит оценить, какие из них реально подключены к меню (section-randoms).

6. Как навести порядок в навигации (конкретное предложение)

6.1 Схлопнуть 27 секций → 8–9

| Новая секция | Из чего собрать | Пунктов |
|---|---|---|
| Дашборд | section-dashboard | 7 |
| Чат | section-chat | 3 |
| Дебаты | section-debates + ключевые из techniques | 15 |
| Агенты и Роли | section-agents + roles + fleet | ~27 |
| Знания | knowledge-one + lenses + crystals + junctions + synthesis + knowledge-generator + forum | ~7 |
| Студия/Конструктор | builder + director + room + projects + project-os | ~5 |
| Провайдеры и Интеграции | connections + integrations | 32 |
| Диагностика | section-diagnostics | 18 |
| Настройки | settings + docs | 12 |
| Экспериментальное (свёрнуто по умолчанию) | все randoms + experimental:true | 30+ |

Итог: 9 секций вместо 27. Исчезают 12 секций-одиночек.

6.2 Правила
1. Ни одной секции с 1 пунктом — либо вливать в соседнюю, либо делать подпунктом.
2. section-randoms расформировать: разложить по смыслу, либо в «Экспериментальное», скрытое флагом.
3. Ввести в route-registry поле tier: 'core' | 'pro' | 'experimental' и управлять видимостью одним флагом — сейчас 40 пунктов уже помечены experimental:true (34 в content + 1 core + 5 system), используй это.
4. Единый принцип файлов: все панели — в папки (убрать 94 «свободных» .tsx из корня src/components/).
5. Поиск (⌘K) как основная навигация: у тебя уже есть CommandPalette — вывести его на первый план, тогда размер меню перестаёт быть проблемой.

7. Путь до 10/10 (по фазам)

Фаза 0 — Гигиена (1–2 дня)
- Удалить мусорные доки и сироту (RivalsHub).
- Свести 4 «паспорта» и 2 «panel-map» в один; снести неиспользуемые зависимости.
- Починить битую ссылку TASKS.md.

Фаза 1 — Правда в доках (2–3 дня)
- Прогнать npm run typecheck + npm run build (доки прямо просят «сильный ПК») и зафиксировать факт сборки.
- Пересчитать реальные цифры (модули/сервисы/события/Dexie v43) и переписать STRUCTURE.md, SUMMARY.md, README.md, 07-ui-layer*.md. Ввести в шапку каждого доки поля updated: и verified-runtime:.

Фаза 2 — Навигация (3–5 дней)
- Схлопнуть секции (§6.1), ввести tier, расправиться с randoms.
- Дедуп близких панелей (DebateHistory/DebatesManager/Replay → одна).

Фаза 3 — Де-стаб (неделя+)
- За 877 стубов взяться по приоритету: DebatePanel(89), DebateRuntimePanel(84), DirectorPanel(71), AgentsPanel(62), DebateLive(60). Каждый стуб → либо реализация, либо честный handoff/queued в UI.
- Навести порядок в rivals* (19 папок) — оставить подключённые, остальное в legacy/.

Фаза 4 — Тесты и рантайм (постоянно)
- Закрыть «дырки»: DebateResearch (0 тестов на 8 415 строк), KeyTable, ResearchPanel, ServiceRegistryPanel, GoogleStudio, PolicyEditorPanel.
- Прогнать реальный e2e (npm run test:e2e) — сейчас всё «STATICALLY VERIFIED».

Фаза 5 — Архитектура (стратегически)
- Разбить dexie-schema.ts (3 751 строка) и event-registry.ts (2 640) на модули.
- PolicyPanel.tsx (1 169) и FleetPanel.tsx (1 120) — разнести.
- Ввести жёсткий CI-гейт: typecheck + build + check:deps (dependency-cruiser уже настроен с правилами no-react-in-kernel, no-circular).

Критерий 10/10: зелёный build + зелёный typecheck + рантайм-подтверждённые ключевые сценарии (чат → дебаты → метрики → интерпретация) + 0 муcорных доков + меню ≤ 9 секций + покрытие тестами ≥ 70% компонентов.

8. Топ-советы (кратко)

1. Главный рычаг удобства — не панели, а меню. 12 секций по одному пункту — это и есть «непонятно». Схлопни в 9.
2. Документация врёт цифрами. «638 панелей / Dexie v34» против реальных ~221 модуля и v43. Обнови или пометь «as of date».
3. Рантайм нигде не проверен — это главный барьер к 10/10. Один прогон build+e2e даст больше, чем ещё 10 новых панелей.
4. 877 стубов — это не «долг на потом», это то, что видит пользователь. Приоритет: дебат-ядро.
5. 94 панели вне папок + 19 rivals* папок в ядре — разложи по структуре, иначе навигация по коду тоже станет неуправляемой.
6. PANEL_MAP.md уже автогенерится из route-registry — используй его как единый источник и не плоди руками PANELS_MAP.md.

Хочешь — подготовлю готовый патч: (а) новый route-registry с 9 секциями и полем tier, (б) скрипт scripts/archive-docs.mjs, который разложит 40+ доков в docs/archive/, (в) удаление мусорных файлов и неиспользуемых зависимостей. Скажи, с чего начать.