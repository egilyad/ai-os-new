# Аудит SuperAgents OS 5,8/10 (из DOCX)

> Конвертировано из `SuperAgents_OS_Audit_Report_2026-09-18.docx`. Оглавление и номера страниц вычищены, остальное — как в исходнике.

| P R O J E C T A U D I T R E P O R T / Аудит проекта / SuperAgents OS / Готовность панелей 0–10, навигация, сверка документации с кодом и дорожная карта до 10/10 / Репозиторий: egilyad/ai-os-new / Ветка: fix-debate-text-truncation (d632cf7, 17.09.2026) / Версия платформы: v4.5.0 / Общий вердикт: 5,8 / 10 — сильное ядро в перегруженной оболочке |
| --- |

# 1. Резюме для руководителя

SuperAgents OS (репозиторий egilyad/ai-os-new, ветка fix-debate-text-truncation, коммит d632cf7 от 17.09.2026) — амбициозный браузерный «AI-компьютер»: 2 663 файла TypeScript/TSX, ядро на 212 сервисов с событийной шиной, 24 LLM-провайдера и интерфейс из 257 панелей. Инфраструктурная основа продумана и во многом образцова: DI-контейнер, типизированные события, декораторный пайплайн вызовов моделей, симметричная локализация en/ru. Однако поверхность продукта разрослась быстрее, чем система навигации и документация, а защитные механизмы (CI, typecheck, depcruise) либо мертвы, либо нарушены.

Общий вердикт аудита: 5,8 из 10. Это проект с сильным ядром и перегруженной оболочкой. В коде нет привычного хаоса (0 console.log в проде, всего 2 TODO, нет v2/legacy-дубликатов файлов), но накопились системные проблемы: CI не запускается вообще из-за повреждённого триггера, 1 085 ошибок компиляции TypeScript не блокируются, в MemoryPanel физически повреждён исходник, 43 циклических импорта противоречат собственному ADR-001, а документация из 817 файлов расходится с кодом практически по каждой ключевой цифре.

Хорошая новость: половину проблем лечит один день точечной работы. Починка триггера CI, восстановление двух строк в MemoryPanel, удаление шести мусорных файлов и включение pre-commit возвращают проекту защитный контур. Вторая половина — наведение порядка в меню (27 секций, из которых 13 содержат по одному пункту), архивация ~700 устаревших документов и поэтапное снижение долга типобезопасности — расписана по этапам в разделе 9 с критериями готовности каждого шага.

Таблица 1 — Сводная оценка по слоям системы

| Слой | Оценка | Вердикт одной фразой |
| --- | --- | --- |
| Реестр маршрутов и карта панелей | 9 | 0 битых пунктов меню на 257 панелей — эталон синхронизации |
| Ядро (kernel): DI, события, DAL | 6 | Архитектура зрелая, но 212 сервисов, 68 фаз регистрации и 43 цикла — перебор |
| Оболочка: Sidebar, AppLayout, поиск | 7 | Механика хорошая, объём в 258 пунктов — продуктовая перегрузка |
| Панели (257 шт., 21 кластер) | 6 | Флагман «Дебаты» — 8/10; свалка Randoms и Интеграции — 4-5/10 |
| LLM-слой (24 провайдера) | 7 | Чистый декораторный пайплайн; 2 мёртвых декоратора |
| Сторы состояния (22 шт.) | 6 | Три стора на домен дебатов, несистемное именование |
| Тесты и e2e | 6 | 365 файлов, 247/247 в выборке; покрытие скоуплено до ~15%, e2e — 4 сценария |
| Локализация en/ru | 8 | Полная симметрия ключей; сломан только легаси-скрипт rebuild-ru.mjs |
| CI/CD (9 джоб) | 2 | Триггер повреждён — workflow не запускался никогда |
| Документация (817 файлов) | 4 | Объём огромный, актуальность низкая: цифры разошлись по всем метрикам |
| Конфиги, Docker, зависимости | 5.5 | Guard-правила образцовые, но bleeding-edge стек требует --legacy-peer-deps |
| Гигиена кода | 6 | 0 console.log, 2 TODO — против 214 as any и 14 143 inline-стилей |

Ключевой управленческий вывод: проекту нужен не рефакторинг, а «перезагрузка контуров управления». Код и маршрутизация в порядке; сломаны контроль (CI/typecheck), интерфейс входа (меню) и знаниевый слой (docs). Все три контура восстанавливаются независимо друг от друга и не требуют остановки продуктовой разработки.

# 2. Объём и методология аудита

Аудит выполнен по срезу ветки fix-debate-text-truncation (последний коммит d632cf7 «feat: AGEMS 4.x platform budget UI + addSpend/resetSpend + incidents», 17 сентября 2026). Проверялись: полный реестр маршрутов (route-registry-core.ts, route-registry-content.ts, route-registry-system.ts, route-imports.ts, routes.tsx), структура компонентов (984 файла в src/components), ядро (1 479 файлов, 12 МБ), сторы, LLM-адаптеры, локализация, тесты, инфраструктура CI/Docker и вся папка docs/.

Инструменты проверки: статический анализ madge на циклические зависимости (1 524 файла, чистый прогон), компилятор tsc --noEmit по проекту, подсчёт метрик гигиены (console.log, TODO, as any, eslint-disable, inline-стили), выборочный запуск тестов vitest (stores, events, container — 247 тестов), кросс-сверка 16 ключевых документов с фактическим кодом. Каждая числовая находка в этом отчёте воспроизводима: указан файл и, где возможно, строка.

Ограничения: аудировалась статика и выборочный запуск тестов, а не полный прогон всего сьюта и не ручное клик-тестирование 257 панелей. Оценки панелей поэтому опираются на четыре измеримых критерия: работоспособность (компилируется, маршрутизируется), типобезопасность (ошибки tsc), модульность (декомпозиция файлов) и продуктовая ценность кластера. Панели сгруппированы в 21 кластер — поштучные оценки 257 панелей дали бы таблицу длиной в сам отчёт без роста информативности; все кластеры покрыты, выбросы внутри кластеров названы поимённо.

# 3. Оценки панелей: готовность 0–10

## 3.1. Как читать оценки

Каждый кластер оценён по четырём измеримым критериям. Первый — работоспособность: панель маршрутизируется, компонент существует, рантайм не падает на очевидных ошибках. Второй — типобезопасность: отсутствие ошибок tsc, попадающих в сборку. Третий — модульность: декомпозиция на подкомпоненты, отсутствие монолитных файлов, доля inline-стилей и any. Четвёртый — продуктовая ценность: отвечает ли панель на реальную задачу пользователя и не дублирует ли соседей. Оценка кластера не равна среднему по панелям: выбросы названы в комментарии, чтобы их было видно.

Поштучный разбор всех 257 панелей в документ не вынесен намеренно: 58 техник дебатов, например, сгенерированы из одного бандла и разделяют общий профиль качества, а 13 секций меню-«одиночек» оцениваются одинаковой структурной проблемой. Кластеризация сохраняет всю управленческую значимость: видно, что чинить первым, что сливать, а что прятать за флагом.

Рисунок 1 — Готовность слоёв и кластеров панелей (0–10); красным — зоны ниже порога «приемлемо»

## 3.2. Сводная таблица по кластерам

Таблица 2 — Готовность кластеров панелей (0–10) с комментариями

| Кластер / панели | Панелей | Оценка | Комментарий |
| --- | --- | --- | --- |
| Реестр маршрутов и меню (код) | — | 9 | 257 компонентов в PANEL_COMPONENTS, 0 битых ссылок, 0 несуществующих импортов. Держит 9/10, пока переименования идут через реестр, а не руками. |
| Оболочка: Sidebar, AppLayout, 404 | 3 | 7 | Поиск по ⌘K, закрепления, сворачиваемые секции уже есть. Проблема не в коде, а в объёме: 258 пунктов читаемы только для автора. |
| Dashboard | 1 | 7 | Модульная (15 файлов), аккуратная точка входа. try/catch на каждый вызов и 3 any — следы защитного стиля после рефакторингов. |
| Чаты: chat, chat-sessions, session-hub | 3 | 6 | ChatPanel декомпозирована (21 файл), но 3 реальные tsc-ошибки (L436, L460, L487) и 11 eslint-disable по зависимостям хуков. |
| Дебаты: ядро (arena, live, workspace, replay, tournament, manager) | 6 | 8 | Флагман: 91 тестовый файл debate-runtime, вложенные URL /debates/*, текущая ветка продолжает полировку. Лучшая часть продукта. |
| Дебаты: аналитика (audience, argument-graph, strategy-builder, analysis, history, topics, templates, quality, quality-impact) | 9 | 7 | Широкий набор, но quality-impact vs debate-quality vs calibration сливаются для пользователя; часть функций дублируют «техники». |
| Техники дебатов (58 панелей) | 58 | 6 | Аккуратная кодогенерация из бандла, но 7+ файлов с tsc-ошибками (StrategistPanel, StatusDynamicsPanel, StyleMatchingPanel, WhisperChannelsPanel и др.). 58 пунктов меню — перегруз. |
| Знания (knowledge, knowledge-generator, synthesis, junctions, crystals, lenses, project-os, forum) | 8 | 5 | Почти всё experimental, каждая панель — в собственной секции-одиночке. Вход для пользователя неочевиден. |
| Проекты и Builder (projects, builder, director, room, tasks, files, workflows, run-queue, sop) | 9 | 5 | ProjectsPanel — антирекорд типобезопасности (42 ошибки tsc). В BuilderPanel мёртвые файлы и битый импорт builderAgent. |
| Fleet и Governance (fleet + 6 субпанелей, simulation, provenance, gov-stress-test, obs-gaps) | 11 | 6 | Живой функционал (серия AGEMS), но FleetPanel — монолит на 1 120 строк; CouncilsPanel из FleetPanels — orphan-импорт без маршрута. |
| Google-стек (studio, cache, gemini-live, research-gemini) | 4 | 6 | Рабочие интеграции, но четыре панели на одного вендора — кандидаты на слияние до двух. |
| Документы (docs, decision-log, arch-review, prompt-audit, template-sharing) | 5 | 7 | Утилитарные, стабильные, без драм. |
| Research (engine, debate-system-research, reports, advanced, hypothesis-gen, eval-datasets, routing-experiments) | 7 | 6 | Богатый функционал; пересекается с debate-analysis и eval-инструментами техник. |
| Интеграции (19 панелей: playground, prompts, batch, security, ab-testing, fine-tuning, deploy, voice-input, plugin-sdk…) | 19 | 5 | Секция «всё для галочки»: deploy, fine-tuning, voice-input, plugin-sdk выглядят заглушками. Playground vs AB-testing vs Agent-comparison — тройня близнецов. |
| Настройки (settings, policies, policy-editor, audit, history, export-import, time-machine) | 7 | 7 | Работают; SettingsPanel — 720 строк, 43 inline-стиля, AiModulesTab объявлен внутри головного файла. policies vs policy-editor дублируют. |
| Randoms (28 панелей: aquarium, ecosystem, rival-labs, quantum-inspiration, leaderboard, time-machine, dyad…) | 28 | 4 | Название секции («Рандомс») честно отражает суть: свалка из разнородных панелей. Панели не плохие — им нужны домены. |
| Каналы (channels) | 1 | 5 | ChannelPanel — 13 ошибок tsc с вызовами не-функций у IChannelService; вероятен сломанный рантайм. |
| Агенты (agents, roles, sre, mission, live, journal, marketplace, comparison, protocol, persona-marketplace, persona-picker, skills, tools, connectors, mcp, roles-consortia) | 16 | 7 | Самая модульная папка (28 файлов, Container/View/Context), но 4 мёртвых файла на 1 351 строку; два маркетплейса пересекаются. |
| Подключения (keys, pools, groups, key-notes, provider-dashboard, groq-speed, smart-routing, provider-marketplace, session-bindings, guardians, nvidia-enterprise, openrouter) | 12 | 7 | Практическое ядро ценности OS. ProviderManager: 27 файлов, 0 any — образцовый модуль. nvidia-enterprise и openrouter — узкие ниши под вопросом. |
| Диагностика (logs, debugger, router-trace, memory, memory-palace, health, system-health, docs-health, pressure, runtime-pressure, what-if, dependency-map, diagnostics, state-inspector, performance-profiler, shadow, causal-debugger, counterfactual) | 18 | 6 | LogsPanel монолитна (503 строки), но работает с виртуализацией. pressure vs runtime-pressure — дубли. Пункт «traces» открывает компонент Debugger — путаница имён. В MemoryPanel повреждён исходник. |
| Скрытые legacy (chat-admin, timeline, /events) | 3 | 5 | Вне меню — правильно. Но цепочка /events → /timeline и EventsTimeline живёт параллельно с разделом логов; либо вернуть в меню, либо вычистить. |

## 3.3. Ключевые панели подробно

Dashboard (7/10). Головной файл 407 строк при 15 файлах в папке — здоровая декомпозиция. Панель отдаёт навигацию через onNavigate и фактически повторяет меню: это осмысленно как «центр запуска», но только если меню само станет компактным (раздел 4). Точечные правки: убрать statement между импортами (const LOGGER на строке 5), свести 3 any к типам ядра.

ChatPanel (6/10). Самая нагруженная поверхность взаимодействия (21 файл, 46 хуков в головном файле — признак того, что головной файл перегружен). Найдены три реальные ошибки компиляции: на строках 436 и 460 вызов .then у выражения void, на строке 487 — string | undefined без проверки. Для панели, через которую проходит основное общение с моделью, это приоритет номер один среди функциональных панелей.

DebateArena и дебатный стек (8/10). Головной DebateArena.tsx — тонкий переключатель режимов (?mode=runtime) на 108 строк; логика разнесена по DebatePanel/DebateRuntimePanel, рядом 91 тестовый файл debate-runtime в ядре. Вложенные алиасы /debates/* работают. Это эталон, по которому стоит выравнивать остальные кластеры.

ProviderManager / keys (7/10). Крупнейшая по декомпозиции панель: 27 файлов, 6 554 строки, ноль any в контейнере. ProviderTableRow.tsx (786 строк) — следующий кандидат на разбиение. Вместе с pools, groups и smart-routing этот кластер даёт пользователю основной практический выигрыш — его и стоит показывать первым в разделе «Провайдеры».

SettingsPanel (7/10). Работает, но головной файл 720 строк с 43 inline-стилями; вкладка AiModulesTab объявлена прямо внутри головного файла вместо отдельного модуля. Рефакторинг механический: вынести вкладку, перенести стили в классы, а пары policies/policy-editor — слить (см. 3.4).

MemoryPanel (снижение до 5/10). Формально модульная (13 файлов), но в исходнике обнаружено физическое повреждение текста: пропущенные символы «[mem» в объявлении useState (строка 27) и в массиве зависимостей (строка 95). TypeScript 6.0.3 и esbuild молча восстанавливают структуру, поэтому панель работает — до первой смены тулчейна. Детали и готовый фикс — в разделе 7.2.

## 3.4. Дубли и «близнецы»

Классических версий-дубликатов (XxxPanelV2, -fixed, -old) в проекте нет — эпоха таких файлов вычищена. Однако остались структурные близнецы: разные маршруты с почти одинаковым назначением. Они незаметны в коде, но именно их пользователь встречает как «у вас две одинаковые кнопки».

Таблица 3 — Близнецы и рекомендация по слиянию

| Пара / группа | Маршруты | Рекомендация |
| --- | --- | --- |
| PressureMap vs PressureMapPanel | pressure, runtime-pressure | Слить в одну панель с переключателем режимов; оставить id pressure |
| MemoryPanel + MemoryPalacePanel + MemoryTransferPanel + FederatedMemoryPanel | memory, memory-palace, memory-export-import, federated-memory | Собрать в раздел «Память» с одной точкой входа и вкладками |
| ModelComparePanel vs ABTestPanel vs AgentComparisonPanel | playground, ab-testing, agent-comparison | Оставить playground как витрину, сравнения слить в него вкладками |
| PoliciesPanel vs PolicyEditorPanel | policies, policy-editor | Слить: редактор — режим внутри списка политик |
| AquariumPanel vs AquariumTradingPanel | aquarium, aquarium-trading | Один продукт: trading — вкладка внутри aquarium |
| EventsTimeline vs LogsPanel | /timeline (redirect /events), logs | Timeline оставить как redirect на /logs и удалить панель из сборки |

# 4. Меню и навигация: главная продуктовая проблема

## 4.1. Текущее состояние в цифрах

Сайдбар сегодня — это 258 пунктов в 27 секциях. Из них 57 панелей в четырёх «core»-секциях, 97 в двадцати content-секциях и 46 в трёх system-секциях, плюс 58 техник дебатов отдельным разделом. Критическая деталь: 13 из 27 секций содержат ровно один пункт (knowledge, project-os, lenses, crystals, junctions, synthesis, knowledge-generator, forum, builder, director, room, projects, channels). Это результат недавней «чистки меню»: вместо сворачивания дублирующих панелей их разместили по персональным секциям-заголовкам, и список стал только длиннее. След этой истории читается прямо в комментариях кода: «KNOWLEDGE split into one section per item (menu cleanup)».

Вторая особенность — 40 панелей помечены флагом experimental (34 в content, 5 в system, 1 в core) и при этом видны в меню наравне с боевыми. Третья — секция section_randoms, «Рандомс», в которую свалено 28 панелей от aquarium-trading до quantum-inspiration. Название секции честно признаёт, что это место для «всего остального», но пользователь воспринимает его как признак незавершённости всего продукта.

## 4.2. Что именно мешает

- Отсутствие иерархии задач. Меню организовано по архитектуре кода (core/content/system/techniques), а не по задачам пользователя: «поговорить», «запустить дебаты», «подключить ключ», «посмотреть логи». Кластер экономики раздроблен на 6 панелей (analytics, pricing, budget, cost-analytics, cost-optimization, budget-alerts), агенты — на 16 пунктов.
- Секции-одиночки. 13 заголовков, каждый из которых открывает одну панель, — это 13 строк пустого скролла и визуальный шум в каждом проходе по меню.
- Смешаны боевые и экспериментальные поверхности. 40 experimental-панелей смешаны с рабочими; значок ExperimentalBadge есть, но не спасает от ощущения «половина кнопок не работает».
- Незаполненные ниши выглядят как ошибки. Панель entanglement стоит в меню со статусом planned — пользователь кликает и получает пустоту. Затычки должны быть скрыты до готовности.
- Названия не говорят пользователю ничего. «Рандомс», «traces» → открывается компонент Debugger, «live» (LiveWorkspace) рядом с «debate-live» — термины из кода протекли в интерфейс.
## 4.3. Целевая структура: 8 разделов + Лаборатория

Предлагаемая информационная архитектура складывает 258 пунктов в 9 видимых разделов, каждый из которых отвечает на задачу пользователя. Экспериментальные и развлекательные панели переезжают в «Лабораторию», скрытую по умолчанию за переключателем в сайдбаре. Ни один id маршрута не меняется — реорганизуется только группировка секций, поэтому внешние ссылки и алиасы /debates/*, /diagnostics/*, /services/* продолжают работать.

Таблица 4 — Целевая структура меню

| Раздел | Что входит | Что меняется |
| --- | --- | --- |
| 1. Обзор | dashboard | Без изменений; после сжатия меню дашборд снова становится «центром запуска» |
| 2. Чаты | chat, chat-sessions, session-hub | Перенос из core-секции без изменений |
| 3. Дебаты | debate (arena), live, workspace, replay, tournament, history, analysis, argument-graph, topics, debates-manager; «Техники» — одна панель-каталог с поиском и группами | 15 + 58 пунктов → 11; техники получает собственную навигацию внутри панели |
| 4. Агенты | agents, roles, skills, tools, fleet, mission, agent-journal, marketplaces (агентов и персон — вкладками) | 16 пунктов → 8; connectors и mcp уходят в «Провайдеры» |
| 5. Знания | knowledge, knowledge-generator, synthesis, memory + palace + transfer + federated (вкладки «Память»), research-группа, docs | 13 секций-одиночек частично умирают; lenses, crystals, junctions, forum, project-os → Лаборатория |
| 6. Провайдеры | keys, pools, groups, key-notes, smart-routing, connectors, mcp, provider-dashboard, google-группа (studio + cache слить, gemini-live) | 12 + 4 пункта → 8; groq-speed, nvidia-enterprise, openrouter — вкладки провайдера |
| 7. Проекты | projects, builder, workflows, tasks, files, channels, scheduler, run-queue, sop | 9 пунктов; director и room — в Лабораторию до готовности |
| 8. Система | settings (+ policies слить), security, audit, history, export-import, budget/cost-группа (6 → 2: «Бюджет», «Стоимость»), диагностика: logs, health, system-health, debugger/traces, what-if, dependency-map, performance-profiler | 31 пункт → 13; memory-palace и pressure-дубли решаются слиянием |
| 9. Лаборатория (скрыта по умолчанию) | aquarium + trading, ecosystem, rival-labs, rivals-catalog, quantum-inspiration, leaderboard, time-machine, dyad, meta-learning, patterns, experimental, lenses, crystals, junctions, forum, project-os, director, room, community-hub, model-distillation, voice-input, plugin-sdk, fine-tuning, deploy, tutorials | 28 пунктов Randoms + хвосты Integrations/Знаний; флаг «Показать расширенные» |

Ключевой приём для 58 техник: не выкидывать их, а убрать из сайдбара. Единая панель-каталог «Техники» (роут techniques уже складывает их в бандл) даёт поиск, фильтры по типу (риторика, логика, оценка, персона, стратегия) и карточку каждой техники с кнопкой «Запустить». Это же лечит дубли между техниками и аналитикой дебатов.

## 4.4. Технический переход

Реорганизация сводится к правке трёх файлов реестра — маршруты и компоненты не трогаются. Пример консолидации секций-одиночек:

| Сниппет 4-1. Консолидация секций реестра / // src/route-registry-content.ts / // Было: 13 секций по одному пункту. Стало: 3 зонтичные секции. / export const CONTENT_SECTIONS: NavSection[] = [ / { / id: 'section-knowledge', / labelKey: 'nav.section_knowledge', / items: [ / { id: 'knowledge', labelKey: 'nav.knowledge', icon: Icons.brain, color: '#a855f7' }, / { id: 'knowledge-generator', ... }, / { id: 'synthesis', ... }, / { id: 'memory', path: '/memory', ... }, // вложенные /memory/* — вкладки / ], / }, / { id: 'section-projects', ..., items: [ /* projects, builder, workflows, tasks, files, channels, scheduler */ ] }, / { id: 'section-lab', ..., items: [ /* experimental-панели */ ] }, / // ... / ]; |
| --- |

Скрытие экспериментальных панелей — фильтр в Sidebar.tsx (строки 176–180 уже фильтруют по поиску — точка входа готова):

| Сниппет 4-2. Фильтр experimental/planned в сайдбаре / // src/components/Sidebar.tsx — добавить рядом с существующим фильтром поиска / const [showAdvanced, setShowAdvanced] = useState(false); / const visibleItems = section.items.filter((item) => { / const matchesSearch = /* существующий фильтр */; / const allowed = showAdvanced \|\| (!item.experimental && item.status !== 'planned'); / return matchesSearch && allowed; / }); / // toggle в подвале сайдбара: «Показать расширенные панели (40)» |
| --- |

Порядок внедрения: сначала фильтр experimental (один файл, мгновенный эффект — меню худеет на 40 пунктов), затем слияния секций реестра (один PR, нулевой риск для маршрутов), затем панель-каталог техник и вкладочные слияния близнецов из таблицы 3.

# 5. Документация: сверка с кодом

## 5.1. Объём и состав

Папка docs/ содержит 817 файлов: 112 markdown-документов в корне и шесть подпапок с говорящими сами за себя именами — au/, new/, plan/, road/, research/ и experementmdroadmaps/. Последняя — самая большая: 543 документа и 53 SVG-макета, research-досье августа 2026 года (по 15 файлов на каждого из 11 агентов, 33 файла форума, 23 — дебатов). По сути docs/ — это три эпохи сразу: база знаний мая (v4.5.0), research-волны августа и аудит-марафон сентября, наложенные друг на друга без вычитания устаревшего.

Классификация по назначению даёт картину на рисунке 2: около 40 файлов — живая база (серия 00–10 на en/ru, ADR 001–005, справочники сервисов и событий, DEV_QUICKSTART), примерно 75 — одноразовые аудиты с закрытыми сериями (N1–N4d, T1–T3, D4.x, au/, audit2/), около 615 — планы и роадмапы, волны которых уже выполнены в коде (в репозитории есть фазы регистрации phase0…phase67, волны CREW/OPS/RIVALS помечены DONE), и минимум 7 файлов — прямой мусор.

Рисунок 2 — Состав папки docs/: 817 файлов, из которых живая база знаний — около 40

## 5.2. Несоответствия документов и кода

Сверка 16 опорных документов с фактическим состоянием репозитория показала системный разрыв: почти каждая числовая метрика устарела. Это не «опечатки», а следствие отсутствия единого источника инвентаризации — цифры переписывались вручную и в разные моменты времени.

Таблица 5 — Документ утверждает против факта в коде (18.09.2026)

| Документ и утверждение | Факт в коде |
| --- | --- |
| README.md: «120+ панелей» | ~200 пунктов меню, 257 панелей в карте PANEL_COMPONENTS |
| 07-ui-layer.md: «145+ панелей в 9 секциях» | 27 секций навигации |
| STRUCTURE.md: «638 панелей» | 257 панелей; 226 папок компонентов |
| DEV_QUICKSTART: «75+ панелей, 162 контракта, 346 сервисов, 12 фаз регистрации» | 257 панелей; ~290 файлов контрактов; 696 файлов сервисов в ~63 подпапках; 68 фаз (phase0…phase67) |
| SUMMARY.md: «205 компонентов» | 984 файла в src/components |
| events.md + README: «198+ типизированных событий» | 543 события в event-registry.ts (в самом events.md описано лишь 166) |
| STRUCTURE.md: «177 contract interfaces» | ~290 файлов в src/kernel/contracts |
| STRUCTURE.md: «22 store files» | 42 файла в src/stores |
| STRUCTURE.md: i18n — «en.ts / ru.ts» | src/i18n/translations/{en,ru}/ — по 19 namespace-файлов на язык |
| INVENTORY_REPORT, CAPABILITY_MATRIX, SUMMARY: «Dexie v34, 98 таблиц» | Версия схемы v43, ~125 таблиц |
| CAPABILITY_MATRIX: «AdapterFactory — 23 провайдера» | 24 имени в SUPPORTED_PROVIDERS (adapter-factory.ts), 12 папок-адаптеров |
| COGNITIVE_AUX_STATUS: «27 панелей experimental» | 40 панелей с experimental: true |
| PANELS_MAP §3: «SimulationPanel — dead/unrouted» | Маршрутизируется: simulation → SimulationPanelLazy (route-imports.ts:420) |
| PANEL_MAP.md (авто-генерация): 57 панелей | Устарел против сплита реестров: нет section-techniques, routing/bookmarks/tasks/files показаны в старых секциях |
| SERVICES_INVENTORY §4: «src/data/ отсутствует» | Существует: rivals-catalog.ts, role-library.ts |
| STRUCTURE.md: упоминает корневой TASKS.md | Файла не существует |

## 5.3. PANELS_MAP и PANEL_MAP — ловушка имён

Файлы PANELS_MAP.md (6,2 КБ, 09.09.2026) и PANEL_MAP.md (6,7 КБ, авто-генерация) — не дубликаты, а два разных документа, которые невозможно различить по имени. Первый — ручная карта «роут → источник данных → действия» с привязкой к роадмапу, рабочая и полезная. Второй — авто-сгенерированная mermaid-диаграмма только core-секций, устаревшая против реального реестра. Рекомендация: PANEL_MAP.md либо перегенерировать из route-registry-*.ts скриптом, либо удалить; выживший документ переименовать в PANELS.md, чтобы имя перестало зеркалить соседа.

## 5.4. План разбора документации

Консервативный подход (по выбору владельца — без агрессивной чистки): ничего не удалять безвозвратно, кроме прямого мусора; всё остальное — в docs/archive/ с сохранением истории git. Целевая структура верхнего уровня — README-навигатор и семь папок:

| Сниппет 5-1. Целевая структура docs/ / docs/ / README.md # карта документации (обновить все цифры!) / architecture/ # 00–10 en+ru, ADR 001–005, events.md, / # SYSTEM_MANIFEST(+_RU), SYSTEM_PASSPORT / guides/ # DEV_QUICKSTART, COGNITIVE_MODULES_GUIDE, ROTATION, / # USER_ACTION_MAP, USER_CONTROL_MAP, OPENCODE_RESEARCH / reference/ # SERVICES_RU, SERVICES_INVENTORY, CAPABILITY_MATRIX, / # PANELS.md (бывш. PANELS_MAP), STRUCTURE / reports/ # DEBT_REPORT, SUMMARY, TEN_SYSTEM_COMPARISON, / # COGNITIVE_AUX_STATUS, FEDERATED_MEMORY_STATUS / plans/ # живые планы: CHAT_DESIGN, CONSOLIDATED_PLAN, D2/D3 / research/ # nightly/, FRONTEND/BACKEND_IMPROVEMENT_REVIEW / archive/ # всё остальное: серии аудитов, road/, experementmdroadmaps/, / # au/, new/, plan/, SESSION_LOG, CONVERSATION |
| --- |

Мусор к безусловному удалению (не архивировать): new/errrrrorr.md (723 КБ — дамп консоли браузера), new/errrrro3r.md (74 КБ, второй дамп), new/agentsplan.md (вставка текста из UI), new/au1.md (разовый внешний отзыв, ценность поглощена audit2/). SESSION_LOG.md (382 КБ) и CONVERSATION.md (35 КБ) — в архив, не в удаление. Готовые команды переноса — в приложении В.

Чтобы цифры не разошлись снова, единственный путь — генерация: небольшой node-скрипт, который читает route-registry-*.ts, route-imports.ts, event-registry.ts, dexie-schema.ts и пишет docs/reference/INVENTORY.md (число панелей по секциям, событий, таблиц, фаз). Он же в CI проверяет, что README и STRUCTURE содержат те же числа. Так PANEL_MAP.md перестанет устаревать в момент коммита.

# 6. Инфраструктура и код

## 6.1. Ядро: сильная архитектура на пределе масштаба

Ядро — 1 479 файлов и около 207 тысяч строк: DI-контейнер с 68 файлами поэтапной регистрации (phase0…phase67), 212 сервисов, ~290 контрактов с Zod-схемами, DAL из 25+ репозиториев поверх Dexie и событийная шина с 543 зарегистрированными событиями. Монолитной логики почти нет: из файлов больше 2 000 строк — только dexie-schema.ts (3 751 строка, 42 версии схемы) и event-registry.ts (2 640 строк, «таблица данных», а не логика). Это архитектура-комбайн: она работает и хорошо задокументирована (DEPENDENCY_MAP.md честно рисует граф), но стоимость понимания запредельна — собственный роадмап владельца признаёт: «половина вопросов — что за сервисы мы написали».

Главное противоречие: ADR-001 заявляет «services never import each other» и «Zero circular dependencies», а madge находит 43 циклических зависимости. Практически все они — вариации одного системного цикла: database-service → dexie-schema → agems-catalog-service → instances.ts (композиционный баррел) → сервисы → dal. Скрипт check:circular-kernel существует, но с такими цифрами всегда красный — guard есть, а соблюдения нет. Первым шагом достаточно разорвать один узел (вынести типы схемы Dexie из сервиса в отдельный модуль или заменить статический импорт в instances.ts ленивым), после чего правило no-circular в .dependency-cruiser.cjs можно вернуть в режим error и запретить импортировать баррел instances.ts из сервисов:

| Сниппет 6-1. Guard против главного цикла зависимостей / // .dependency-cruiser.cjs — запрет новых циклов через композиционный баррел / { / name: 'no-services-import-instances-barrel', / severity: 'error', / comment: 'Сервисы не должны тянуть весь composition root — источник 43 циклов', / from: { path: '^src/kernel/services' }, / to: { path: 'src/kernel/instances\.ts$' }, / }, |
| --- |

## 6.2. Сторы, LLM-слой, локализация

Состояние собрано в 22 zustand-стора. Топ по размеру — chat/store.ts (675 строк) и debateLiveStore.ts (634). Домен дебатов обслуживают три стора (activeDebateStore — метаданные, debateLiveStore — стриминг, debate-session-store — персистентность); в шапках каждого написано, что разделение осознанное, и есть адаптеры к контрактам ядра, но стоимость поддержки такого трио высока — при следующем рефакторинге стоит свести к одному фасаду. Мелкие сторы (metaStore, opsStore, rivalStore, crewStore и другие по 60–90 строк с двумя потребителями) — кандидаты на объединение.

LLM-слой — одна из самых чистых частей проекта: 12 папок-адаптеров (gemini, openrouter, groq, nvidia-nim, deepseek, kimi, minimax, qwen, cerebras, cloudflare, mock, openai-compatible), фабрика на 24 имени провайдера и декораторный пайплайн rate-limit → retry → circuit-breaker → cost → cache → logging. Мёртвое найдено точно: декораторы semantic-router и canary-router не имеют ни одного потребителя вне баррела llm/index.ts — удалить или задействовать. Локализация en/ru полностью симметрична по ключам (по 19 namespace-файлов) — редкая дисциплина; сломан только легаси-скрипт scripts/rebuild-ru.mjs (851 строка), читающий несуществующий src/i18n/translations/en.ts.

## 6.3. Тесты: живой сьют с узким охватом

365 тестовых файлов: 91 — вокруг debate-runtime, 72 — kernel/services, 23 — service-registration. Выборочный запуск (stores, kernel/events, container) дал 247 из 247 зелёных в 16 из 17 файлов; единственный падающий — debate-session-store/index.test.ts из-за устаревшего vi.mock без rootLogger, то есть баг тестовой инфраструктуры, а не продукта. При этом coverage в vitest.config осознанно скоуплен на stores/hooks/events/workers/container с порогами 30/20% — честный комментарий в конфиге признаёт, что на весь проект набралось бы около 4%. E2E — один файл basic-flow.spec.ts с четырьмя сценариями (dashboard, keys, agents, chat). После починки CI (раздел 7.1) приоритет — довести e2e до 15 сценариев по критическим путям и починить устаревший мок.

## 6.4. CI/CD: девять джоб, которые никогда не запускались

Самая дорогая находка аудита. В .github/workflows/ci.yml повреждён триггер: branches: ain, master] — потеряны символы «[m» от [main, master]. GitHub считает «ain, master]» именем несуществующей ветки, поэтому ни один из девяти джоб (quality, build, test, coverage, security-audit, circular-check, dep-graph, e2e, deploy) не запускался ни разу. Вся дорогая CI-инфраструктура — витрина. Готовый фикс — в разделе 7.1; сразу после него circular-check и dep-graph покажут красный экран по известным причинам, поэтому их первый запуск сопровождается фиксацией базлайнов (раздел 7.3 и сниппет 6-1).

## 6.5. Конфиги и зависимости

vite.config.ts зрелый: восемь dev-прокси с единым обработчиком 502, manualChunks на 10 vendor-чанков, sourcemap hidden с выгрузкой в Sentry. Нюанс: CSP connect-src в dev покрывает только 7 провайдеров — deepseek, kimi, minimax, qwen и другие отсутствуют, прямые вызовы к ним в dev-режиме могут резаться. Dockerfile грамотный (multi-stage, nginx-unprivileged, non-root, healthcheck), но требует --legacy-peer-deps из-за конфликта madge@8 ↔ typescript 6; docker-compose содержит харденинг (read_only, cap_drop ALL, лимиты памяти), а комментарий про live-reload не соответствует конфигу — volume для исходников не подключён.

Стек сознательно bleeding-edge: React 19.2.5, TypeScript ~6.0.2, Vite 8, ESLint 10, Vitest 4, zod 4 — плюс node --max-old-space-size=4096 для dev/build, что говорит о тяжёлой кодовой базе. Это смелое и в целом оправданное решение, но именно оно порождает трение (--legacy-peer-deps, отключённый pre-commit). Рекомендация — заморозить мажорные версии до приведения типобезопасности в порядок; zustand 4.5.7 (отстающий мажор) обновлять в последнюю очередь, вместе с рефакторингом трёх дебатных сторов.

# 7. Критические дефекты P0 с готовыми фиксами

## 7.1. Мёртвый триггер CI

Файл .github/workflows/ci.yml, строки 8–11. Однострочная правка возвращает проекту весь контур контроля:

| Сниппет 7-1. Починка триггера ci.yml / # Было: / on: / push: / branches: ain, master] / pull_request: / branches: ain, master] / # Стало: / on: / push: / branches: [main, master, fix-debate-text-truncation] / pull_request: / branches: [main, master] |
| --- |

## 7.2. Повреждённый исходник MemoryPanel

В src/components/MemoryPanel/MemoryPanel.tsx физически пропущены символы. Компилятор молча восстанавливает структуру, поэтому панель работает, но любой другой инструмент (строгий парсер, линтер-парсер, минификатор с иными правилами восстановления) может упасть или выдать тихо иное дерево. Правка двух строк:

| Сниппет 7-2. Восстановление MemoryPanel.tsx / // Было (MemoryPanel.tsx:27): / const emories, setMemories] = useState<MemoryEntry[]>(() => memoryService.getMemories()); / // Стало: / const [memories, setMemories] = useState<MemoryEntry[]>(() => memoryService.getMemories()); / // Было (строка 95): / }, emories, currentTime]); / // Стало: / }, [memories, currentTime]); |
| --- |

Заодно проверьте родственный след авто-рефакторинга — const LOGGER, вставленный между импортами (MemoryPanel.tsx:4, DashboardPanel.tsx:5, AgentsPanelContainer.tsx:9, PressureMap.tsx:8). Это не ошибка компиляции, но нарушение конвенций и маркер того, что автогенератор когда-то работал по файлам без валидации результата.

## 7.3. Typecheck не enforced: 1 085 ошибок

tsc --noEmit по проекту выдаёт 1 085 ошибок. Сборка это переживает (vite не запускает полный typecheck), а в package.json существует эскейп-хэтч build:skip-typecheck с громким предупреждением. Ловить все ошибки разом — значит остановить разработку на недели. Рабочая стратегия — «базлайн, который можно только уменьшать»: фиксируем текущее число в CI, любое увеличение роняет пайплайн, уменьшение приветствуется. Через 3–4 недели такой политики ошибки уйдут естественным путём, начиная с худших файлов (ProjectsPanel — 42, ChannelPanel — 13).

| Сниппет 7-3. CI-базлайн типобезопасности / # .github/workflows/ci.yml — новая job после починки триггера / typecheck-baseline: / runs-on: ubuntu-latest / steps: / - uses: actions/checkout@v4 / - uses: actions/setup-node@v4 / with: / node-version: '22' / - run: npm install --legacy-peer-deps / - name: TypeScript baseline check / run: \| / npx tsc --noEmit -p tsconfig.app.json > tsc.log \|\| true / ERR=$(grep -c 'error TS' tsc.log \|\| true) / echo "TS errors: $ERR / baseline 1085" / if [ "$ERR" -gt 1085 ]; then / echo '::error::Type errors grew beyond baseline 1085' / exit 1 / fi |
| --- |

## 7.4. Точечные дефекты боевых панелей

- ChannelPanel (13 ошибок tsc). Вызовы методов IChannelService там, где интерфейс не объявляет функций — классическое расхождение контракта и реализации. Файлы: ChannelPanel/ChannelPanel.tsx; сверить контракт src/kernel/contracts с фактическим сервисом и привести вызовы к сигнатурам. Вероятен сломанный рантайм — проверить панель руками сразу после правки.
- ProjectsPanel (42 ошибки tsc). Худший файл проекта по типам. Большинство — выводы any-цепочек и несуществующие поля; лечится типизацией по контрактам ядра. Панель стоит чинить первой в стратегии базлайна — она же даёт максимум снижения счётчика.
- ChatPanel (3 ошибки). Строки 436 и 460: вызов .then у выражения void (типовой патч — убрать void перед промисом или убрать .then, если результат не нужен); строка 487: string | undefined без проверки (добавить guard if (!value) return; или значение по умолчанию).
- BuilderPanel/WorkflowListPanel.tsx. Импортирует несуществующий экспорт builderAgent — файл мёртвый (никто не импортирует компонент), поэтому просто удалить вместе со вторым мёртвым соседом BuilderAISidebar.tsx.
- Падающий тест debate-session-store. vi.mock('../../kernel/instances') устарел и не подменяет rootLogger — обновить мок по образцу соседних тестов сторов.
# 8. Чистка: что удалить и что архивировать

## 8.1. Мёртвый код в компонентах

Проверка каждого кандидата велась по вхождению имени файла и экспортов во все исходники src/ (тесты как источник ссылок учитывались отдельно). Итог: 16 мёртвых файлов на ~3 400 строк, сконцентрированных в четырёх папках, плюс два test-only файла. Классических версий-дубликатов нет — это остатки старого визарда DebatePanel, неиспользованные секции AgentsPanel и незакреплённый RivalsHub. Полный список — в приложении А; удаление сводится к одному PR без правок живых файлов.

Таблица 6 — Верdict по мёртвым зонам

| Зона | Файлов / строк | Что делать |
| --- | --- | --- |
| DebatePanel (остатки старого визарда) | 7 / ~995 | Удалить: DebateSetupFormSections, ProbeResultsList, ProbeResults, AgentsStep, TopicStep, WizardNav, WizardStepIndicator |
| AgentsPanel | 4 / ~1 351 | Удалить: LiveActivityStream, AgentStatsDashboard, AgentGroupsSection, agent-templates |
| BuilderPanel | 2 / ~368 | Удалить: BuilderAISidebar, WorkflowListPanel (втором к тому же битый импорт) |
| RivalsHub | 2 / ~379 | Test-only: импортируется только собственным тестом — удалить панель и тест (или подключить, если продукт нужен) |
| DebateLive/DebateArenaView | 1 / ~103 | Test-only — удалить вместе с comprehensive-тестом |
| ProjectsPanel/WebsitePreview | 1 / ~180 | React-обёртка не используется (сервис ядра WebsitePreviewService жив) — удалить обёртку |
| route-imports.ts: ComingSoonPanel | 1 const | Объявлен и не используется (бывшие ~33 заглушки схлопнуты во флаг experimental) — удалить |
| llm: semantic-router, canary-router | 2 декоратора | 0 потребителей вне баррела — удалить или задействовать |

## 8.2. Корень репозитория и scripts/

Корень содержит следы личного рабочего процесса, которые стоит либо переместить, либо оформить:

Таблица 7 — Разбор корня и скриптов

| Объект | Вердикт | Куда |
| --- | --- | --- |
| evgenyroadmap.md (12,7 КБ) | Перенести | docs/road/evgeny-roadmap.md — это документ планирования, а не корневой артефакт |
| AGENTS.md (119 КБ!) | Разрезать | Вынести доменные разделы в docs/reference/, в корне оставить шпаргалку < 500 строк |
| .husky/pre-commit.disabled | Включить обратно | Переименовать в pre-commit после снижения числа предупреждений lint ниже 250 |
| scripts/seed.ts.disabled, debug-regex.cjs | Удалить | Одноразовые артефакты отладки |
| scripts/rebuild-ru.mjs (851 строка) | Удалить | Читает несуществующий src/i18n/translations/en.ts — сломан безнадёжно |
| scripts/gen-technique-panels.mjs (422 строки) | В docs/archive/tools | Кодогенерация техник уже выполнена; сохранить на случай повторной волны |
| src/test_map.ts | Удалить | Мусорная локация тестового файла в корне src |
| server/ (sync-server, run-dev) | Оставить | Рабочий инструмент с нормальной безопасностью (SYNC_SECRET, rate-limit, origin-check) |
| scripts/cors-proxy.mjs, upload-sourcemaps.mjs | Оставить | Используются vite-прокси и CI/deploy |

## 8.3. Правила на будущее

Чтобы чистка не стала регулярным ритуалом, закрепите «definition of done» для новой панели: (1) маршрут добавляется только в существующую секцию целевой структуры раздела 4; (2) у панели есть хотя бы smoke-тест в panel-smoke-tests; (3) PANELS.md обновляется тем же коммитом (или автогенератором); (4) experimental-панель по умолчанию скрыта фильтром сайдбара; (5) удаление панели = удаление route + компонента + пункта реестра одним PR. Эти пять правил стоят ноль усилий и предотвращают повторное накопление всех четырёх найденных видов хлама: секций-одиночек, затычек, мёртвых файлов и устаревших карт.

# 9. Дорожная карта до 10/10

План построен по принципу «каждый этап — независимый релиз с проверяемым критерием готовности», как в собственном роадмапе владельца (T0 → T4). Этапы 0–1 возвращают контур управления, 2–3 наводят порядок в интерфейсе и знаниях, 4–5 доводят качество и продукт. Оценки трудозатрат даны для одного разработчика, знакомого с кодовой базой; порядок этапов 2 и 3 можно поменять местами.

## Этап 0. Спасение (сегодня, 2–3 часа)

Цель — вернуть проекту работающий защитный контур и убрать прямые дефекты. Шаги: починить триггер ci.yml (сниппет 7-1) и добавить ветку fix-debate-text-truncation в триггер; восстановить MemoryPanel.tsx (сниппет 7-2); удалить четыре мусорных файла из docs/new/; перенести evgenyroadmap.md в docs/road/; удалить src/test_map.ts.

Критерий готовности: push в ветку запускает CI (даже если часть джоб красная — теперь это честная информация), в репозитории нет файлов с именами errrrrorr.md и подобными, MemoryPanel компилируется из корректного текста. Оценка проекта после этапа: 6,2.

## Этап 1. Гигиена (3–5 дней)

Цель — остановить накопление долга. Шаги: ввести CI-базлайн типобезопасности (сниппет 7-3) со стартом 1 085; удалить 16 мёртвых файлов и два test-only (приложение А); убрать ComingSoonPanel, декораторы semantic-router/canary-router, rebuild-ru.mjs, debug-regex.cjs, gen-technique-panels.mjs (в архив); починить мок debate-session-store; включить pre-commit; разорвать главный цикл зависимостей ядра и вернуть no-circular в error (сниппет 6-1); слить пары-близнецы pressure/runtime-pressure и policies/policy-editor.

Критерий готовности: CI зелёный целиком (базлайн tsc, unit, lint, depcruise), grep по мёртвым файлам пуст, madge в kernel показывает 0 циклов. Оценка после этапа: 7,0.

## Этап 2. Навигация (1–2 недели)

Цель — меню, которое читается незнакомым человеком. Шаги: фильтр experimental/planned в Sidebar (сниппет 4-2) — минус 41 пункт сразу; консолидация 13 секций-одиночек в зонтичные секции (сниппет 4-1); переименование section_randoms в «Лабораторию» с переносом туда 28 панелей; панель-каталог «Техники» с поиском и группами вместо 58 пунктов меню; вкладочные слияния близнецов (таблица 3); выравнивание названий (traces → Debugger, live → Live Workspace); обновление i18n-ключей секций в обоих языках.

Критерий готовности: меню содержит не более 9 видимых разделов и не более 60 пунктов при выключенных расширенных панелях; новый пользователь в 5-минутном тесте находит чат, дебаты, ключи и логи без подсказок. Оценка после этапа: 7,8.

## Этап 3. Документация (2–3 дня, параллельно с этапом 2)

Цель — docs/ снова главный источник правды. Шаги: создать структуру по сниппету 5-1 и перенести файлы командами приложения В; удалить четыре мусорных файла (уже сделано на этапе 0, здесь — контроль); перегенерировать PANEL_MAP.md скриптом или удалить с переименованием PANELS_MAP → PANELS.md; обновить цифры в README, STRUCTURE, DEV_QUICKSTART по таблице 5; завести автогенератор docs/reference/INVENTORY.md из реестров и подключить его к CI.

Критерий готовности: в корне docs/ не больше 15 файлов; каждая цифра из README подтверждается автогенератором; поиск по «120+ панелей» не находит ничего. Оценка после этапа: 8,2.

## Этап 4. Качество (2–4 недели, фон)

Цель — уменьшить долг, не останавливая продукт. Шаги по стратегии базлайна: tsc 1 085 → 0, начиная с ProjectsPanel (42), ChannelPanel (13), TechniquePanels (пачки по 7); as any 214 → меньше 50 (в первую очередь в проде, 40 вхождений); inline-стили 14 143 → постепенный перенос в src/styles/common, начиная с SettingsPanel (43 в головном файле); разбиение монолитов PolicyPanel (1 169), FleetPanel (1 120), AquariumPanel (886); e2e 4 → 15 сценариев (регистрация ключа, чат с моделью, запуск дебата, экспорт, восстановление сессии); обновление ADR-001 с честным описанием правил взаимодействия сервисов.

Критерий готовности: tsc-базлайн снят полностью, typecheck входит в обязательную сборку (build:skip-typecheck удалён), e2e проходит в CI на каждый PR. Оценка после этапа: 9,0.

## Этап 5. Продукт (постоянно)

Цель — «понятно и удобно» как устойчивое свойство, а не разовая акция. Шаги: онбординг-тур из 5 шагов по 9 разделам; «центр запуска» на Dashboard в связке с компактным меню; поиск панелей ⌘K вывести на первый экран; правило definition of done из раздела 8.3 — в CONTRIBUTING.md; квартальный аудит по этому же отчёту (таблицы 1 и 2 как регрессионный чек-лист). После этапа проект удерживает 9,5–10: дальнейший рост идёт не от чистки, а от打磨 продуктовых сценариев.

Таблица 8 — Контрольные точки дорожной карты

| Этап | Срок | Критерий готовности | Оценка после |
| --- | --- | --- | --- |
| 0. Спасение | сегодня | CI запускается; мусорные файлы удалены; MemoryPanel починена | 6,2 |
| 1. Гигиена | 3–5 дней | CI зелёный: tsc-базлайн, unit, lint, depcruise; 0 мёртвых файлов; 0 циклов | 7,0 |
| 2. Навигация | 1–2 недели | ≤ 9 разделов, ≤ 60 видимых пунктов; техники — каталогом; experimental скрыты | 7,8 |
| 3. Документация | 2–3 дня | docs/ = README + 7 папок; цифры генерируются из кода | 8,2 |
| 4. Качество | 2–4 недели | tsc = 0 enforced; e2e 15 сценариев; монолиты разбиты | 9,0 |
| 5. Продукт | постоянно | онбординг, центр запуска, definition of done, квартальный аудит | 9,5+ |

# 10. Заключение

SuperAgents OS — редкий случай, когда проекту с 257 панелями и ядром на 212 сервисов нужен не рефакторинг, а дисциплина контуров. Кодовая база удивительно чиста от привычного хлама: ноль console.log в проде, два TODO, никаких v2-дубликатов файлов, симметричная локализация, живые тесты. Сильные места — дебатный стек с его 91 тестовым файлом, LLM-слой с декораторным пайплайном и реестр маршрутов с нулём битых ссылок — показывают, что команда умеет строить системы, а не только фичи.

Разрыв между «умеет» и «сделано» лежит в трёх контурах: контроль (CI, повреждённый одной потерянной парой символов, никогда не запускался; 1 085 ошибок типов не блокируются), вход (258 пунктов меню в 27 секциях, из которых 13 — по одному пункту) и знание (817 файлов документации, расходящихся с кодом по каждой второй цифре). Каждый из трёх контуров чинится независимо и по готовому рецепту из разделов 4, 5 и 7 этого отчёта.

Практический старт — этап 0 на два-три часа: одна строка в ci.yml, две строки в MemoryPanel, пять git mv/rm. Это единственный этап, где результат виден в день аудита; всё остальное расписано в дорожной карте с критериями готовности и ожидаемым приростом оценки от 5,8 до 9,5+. Проект заслуживает того, чтобы его спасти, — и для спасения достаточно порядка, а не героизма.

# Приложение А. Полный список мёртвых файлов

Проверено grep-поиском по всем исходникам src/ (тестовые ссылки учитывались отдельно как test-only). Удаление — один PR; перед удалением RivalsHub убедитесь, что продукт не нужен будущим волнам RIVALS.

Таблица А.1 — Файлы к удалению

| Файл | Строк | Статус |
| --- | --- | --- |
| src/components/AgentsPanel/LiveActivityStream.tsx | 550 | мёртвый |
| src/components/AgentsPanel/AgentStatsDashboard.tsx | 429 | мёртвый |
| src/components/AgentsPanel/AgentGroupsSection.tsx | 228 | мёртвый |
| src/components/AgentsPanel/agent-templates.tsx | 144 | мёртвый |
| src/components/DebatePanel/DebateSetupFormSections.tsx | 338 | мёртвый |
| src/components/DebatePanel/ProbeResultsList.tsx | 196 | мёртвый |
| src/components/DebatePanel/ProbeResults.tsx | 136 | мёртвый |
| src/components/DebatePanel/AgentsStep.tsx | 128 | мёртвый |
| src/components/DebatePanel/TopicStep.tsx | 78 | мёртвый |
| src/components/DebatePanel/WizardNav.tsx | 63 | мёртвый |
| src/components/DebatePanel/WizardStepIndicator.tsx | 56 | мёртвый |
| src/components/BuilderPanel/BuilderAISidebar.tsx | 185 | мёртвый |
| src/components/BuilderPanel/WorkflowListPanel.tsx | 183 | мёртвый + битый импорт builderAgent |
| src/components/ProjectsPanel/WebsitePreview.tsx | 180 | мёртвый (сервис ядра жив) |
| src/components/RivalsHub/RivalsHub.tsx (+ .test.tsx) | 379 | test-only |
| src/components/DebateLive/DebateArenaView.tsx | 103 | test-only |
| src/route-imports.ts — const ComingSoonPanel | 1 const | не используется |
| src/test_map.ts | — | мусорная локация |
| src/llm — semantic-router, canary-router | 2 декоратора | 0 потребителей |
| scripts/rebuild-ru.mjs, debug-regex.cjs, seed.ts.disabled | — | сломанные/одноразовые |

# Приложение Б. Судьба файлов docs/

Консервативный режим: безвозвратно удаляются только четыре файла прямого мусора; всё остальное сохраняется в docs/archive/ с полной git-историей. Списки ниже покрывают 800+ файлов — детальный пофайловый разбор категорий приведён в разделе 5.

Таблица Б.1 — Категории и назначение

| Категория | Объём | Назначение |
| --- | --- | --- |
| docs/archive/road/ (вся папка road/) | 68 файлов | Волны 1–5, фазы A–Z, GAP_G1–G8 — выполнены (phase0…phase67 в коде); архивировать папкой |
| docs/archive/experementmdroadmaps/ | 543 md + 53 svg | Research-досье августа 2026 (агенты, форум, дебаты, usability) — архивировать папкой |
| docs/archive/audits/ (серии N, T, D4, debate) | 33 файла | Закрытые серии аудитов N1–N4d, T1.2–T3.2, D4.3–D4.6, DEBATE_* |
| docs/archive/audits/ (разовые) | 13 файлов | ACTUAL_SYSTEM_AUDIT, FULL_FUNCTIONALITY_AUDIT, MOBILE_*, SIMULATION_*, TINYTROUPE_AUDIT, LEGACY_AGENT_PATHS и др. |
| docs/archive/audits/ (промты) | 5 файлов | AUDIT_PROMPT_V2/V3/V4, CAPABILITY_PROMPT_V6, CONSOLIDATION_PROMPT |
| docs/archive/au/, new/audit2/, plan/, research/nightly/ | 29 файлов | Папками целиком |
| docs/archive/SESSION_LOG.md, CONVERSATION.md | 2 файла (417 КБ) | Логи сессий — архив, не удаление |
| Удалить безусловно | 4 файла | new/errrrrorr.md (723 КБ), new/errrrro3r.md (74 КБ), new/agentsplan.md, new/au1.md |
| Остаются в верхнем уровне (после переложения) | ~25 файлов | База знаний 00–10 en/ru, ADR, справочники, README — см. сниппет 5-1 |

# Приложение В. Команды чистки (копировать и выполнить)

Команды выполняются из корня репозитория на ветке fix-debate-text-truncation. Порядок: сначала архив документации, затем мусор, затем мёртвый код. Перед выполнением убедитесь, что рабочее дерево чистое.

| Сниппет В-1. Полный сценарий чистки / # 1. Целевая структура docs/ / mkdir -p docs/architecture docs/guides docs/reference docs/reports docs/plans docs/research docs/archive / git mv docs/road docs/archive/road / git mv docs/experementmdroadmaps docs/archive/experementmdroadmaps / git mv docs/au docs/archive/au / git mv docs/plan docs/archive/plan / git mv docs/research/nightly docs/archive/nightly / # 2. Мусор — безвозвратно / git rm docs/new/errrrrorr.md docs/new/errrrro3r.md docs/new/agentsplan.md docs/new/au1.md / git mv docs/new docs/archive/new / git mv docs/SESSION_LOG.md docs/archive/SESSION_LOG.md / git mv docs/CONVERSATION.md docs/archive/CONVERSATION.md / git mv docs/evgenyroadmap.md docs/archive/road/evgeny-roadmap.md 2>/dev/null \|\| git mv evgenyroadmap.md docs/archive/road/evgeny-roadmap.md / # 3. Мёртвый код (список — приложение А) / git rm src/components/AgentsPanel/LiveActivityStream.tsx \ / src/components/AgentsPanel/AgentStatsDashboard.tsx \ / src/components/AgentsPanel/AgentGroupsSection.tsx \ / src/components/AgentsPanel/agent-templates.tsx \ / src/components/DebatePanel/DebateSetupFormSections.tsx \ / src/components/DebatePanel/ProbeResultsList.tsx \ / src/components/DebatePanel/ProbeResults.tsx \ / src/components/DebatePanel/AgentsStep.tsx \ / src/components/DebatePanel/TopicStep.tsx \ / src/components/DebatePanel/WizardNav.tsx \ / src/components/DebatePanel/WizardStepIndicator.tsx \ / src/components/BuilderPanel/BuilderAISidebar.tsx \ / src/components/BuilderPanel/WorkflowListPanel.tsx \ / src/components/ProjectsPanel/WebsitePreview.tsx \ / src/components/RivalsHub/RivalsHub.tsx src/components/RivalsHub/RivalsHub.test.tsx \ / src/components/DebateLive/DebateArenaView.tsx src/test_map.ts / # 4. Сломанные и одноразовые скрипты / git rm scripts/rebuild-ru.mjs scripts/debug-regex.cjs scripts/seed.ts.disabled / # 5. Проверка, что ничего живого не задето / npm run build && npm test |
| --- |

После выполнения: обновить .gitignore при необходимости, сделать коммит «chore: archive docs, remove dead code (audit 2026-09)» и запушить — CI, починенный по сниппету 7-1, подтвердит, что живой код не задет. Дальше — по дорожной карте раздела 9.
