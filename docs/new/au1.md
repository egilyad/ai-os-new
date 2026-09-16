Аудит проекта ai-os-new

Коротко: проект сильный по архитектурной задумке, но сейчас у него явный перекос в сторону масштабирования поверхности продукта быстрее, чем стабилизации runtime/UI/test harness. Я бы поставил проекту 7.4/10 как системе: идея и каркас хорошие, но по качеству исполнения и поддерживаемости есть несколько красных зон, которые уже начинают мешать развитию. Архитектурно это local-first, event-driven, browser OS c DI-контейнером, EventBus, Dexie, worker-слоем, большим catalog слоёв UI и сервисов — то есть фундамент не игрушечный, а реально системный. README Сервисы

По моему локальному прогону ситуация такая: build проходит, проверка циклических зависимостей ядра проходит, dependency rules тоже проходят; при этом lint красный, а test-suite нестабилен и имеет несколько системных падений. Это означает, что база проекта не развалена, но качество интеграции между слоями уже просело.

Что в проекте реально сильное

Сильнейшая сторона — архитектурное разделение ответственности. У тебя не “один жирный chat-app”, а полноценная платформа: kernel, typed contracts, services, event registry, memory/trace/monitoring, provider runtime, routing intelligence, debate runtime. Это очень хороший фундамент для долгой жизни проекта, и он заметно взрослее среднего pet/open-source AI UI. README System Manifest

Вторая сильная сторона — наблюдаемость. Dashboard, traces, router trace, diagnostics, system health, docs health, pressure map, timeline — у проекта уже есть собственная “операционная оболочка”, а не просто UI над запросом в LLM. Это серьёзное преимущество, особенно если ты хочешь развивать систему как AI platform, а не как single-use assistant. UI Layer

Третья сильная сторона — масштаб домена. Провайдеры, ключи, ротации, budgets, policies, tools, MCP, roles, memory, debates, research, connectors — продукт уже покрывает широкую операционную зону. Это плюс для vision, но именно отсюда и вырастают текущие проблемы со стабильностью и связанностью. README Сервисы

Главные проблемы, которые я бы назвал красными

1. Сломана изоляция тестов в chat/runtime слое

Самая неприятная находка — ChatExecutor жёстко тянет promptSecurityService как singleton-импорт, из-за чего тесты на ChatExecutor и ChatService auto-routing ломаются не от своей предметной логики, а из-за недорегистрированного сервиса. Это плохой сигнал: runtime стал зависеть от глобального состояния вместо явной инъекции зависимостей. Это не “мелкий тестовый шум”, а архитектурный регресс. chat-executor.ts

2. UI слой местами нарушает собственные архитектурные правила

В документации заявлена модель “components/stores не импортируют kernel/services напрямую”, но lint показывает массовые нарушения этого правила. Плюс видны React purity/lifecycle проблемы: synchronous setState в effect, component defined in render, mutation state object напрямую. Это не просто стиль — это реальные источники лишних ререндеров, flaky UI и трудного дебага. Примеры хорошо видны в ABTestPanel и AudiencePanel. Сервисы ABTestPanel AudiencePanel

3. Есть признаки регрессии в бюджетировании и policy engine

BudgetService выглядит продуманно, но в логике дедупликации есть опасное место: события дедуплицируются по requestId, а при prune набор ключей пересобирается уже из timestamp-model-provider. Это может приводить к несовместимому поведению после усечения истории и ломать ожидания тестов/аналитики. PolicyService тоже сейчас в зоне риска: падают тесты на admin-token enforcement, content safety и limit behavior — значит контракт безопасности уже не так надёжен, как должен быть. budget-service.ts policy-service.ts

4. Surface area проекта уже слишком большая для текущей дисциплины сопровождения

По UI-докам и README сам проект описывает 120+/145+ панелей и десятки маршрутов/подсистем; при этом часть документации уже начинает расходиться по цифрам и инвентарю. Это типичный симптом: продукт растёт быстрее, чем успевает нормализоваться “реестр истины”. Значит дальше нужно не добавлять ещё 20 панелей, а вводить жёсткий режим консолидации. UI Layer README Debt Report

5. Bundle/размеры уже требуют product-level оптимизации

Локально сборка прошла, но видно очень тяжёлые чанки: особенно debate/kernel/vendor-react. То есть “функционально работает” — да, но по мере роста фич это почти наверняка ударит по cold start, memory pressure и UX в браузере.

Оценка сервисных подсистем

| Подсистема                         | Оценка | Вердикт                                                  |
| ---------------------------------- | -----: | -------------------------------------------------------- |
| Kernel / EventBus / DI / Lifecycle |   9/10 | Лучший слой проекта, системный и зрелый                  |
| Key Management / Provider Runtime  |   8/10 | Хороший operational backbone                             |
| Router / SLA / Advisor             |   8/10 | Сильная differentiation проекта                          |
| Memory / Knowledge / Trace         | 7.5/10 | Хороший фундамент, но нужно сильнее унифицировать UX     |
| Debate Runtime                     |   8/10 | Очень амбициозно и ценно, но тяжёлый operational hotspot |
| Tooling / MCP / Sandbox            |   7/10 | Перспективно, но требует строже изолировать выполнение   |
| Agents / Roles / Skills            |   7/10 | Функционально богато, но сложность уже высокая           |
| Budget / Pricing / Usage           |   6/10 | Полезно, но сейчас уязвимо к регрессиям                  |
| Policy / Security                  | 5.5/10 | Идея хорошая, но надёжность контракта надо быстро чинить |
| Connectors / Workspace / Tasks     |   6/10 | Продуктово полезно, архитектурно пока сыровато           |

Моя сервисная рекомендация

Если говорить как архитектор, то ядро у тебя уже лучше, чем прикладной слой вокруг него. Значит следующие итерации должны быть не “добавить ещё фич”, а “подтянуть прикладные слои до уровня ядра”. Это прежде всего DI discipline, test harness, isolation, state purity и bundle governance. Сервисы

Оценка ключевых панелей верхнего уровня

Ниже я оцениваю именно product-панели верхнего уровня, а не все leaf-компоненты внутри src/components. Иначе это был бы уже отдельный каталог на десятки страниц.

MAIN / System

| Панель    | Оценка | Что хорошо                | Что улучшить для coding agent                                          |
| --------- | -----: | ------------------------- | ---------------------------------------------------------------------- |
| Dashboard |   8/10 | Хороший оперативный центр | Упростить карточки, выделить selectors/useDashboardData                |
| Settings  |   7/10 | Широкий охват настроек    | Разделить persisted settings / feature flags / secrets UI              |
| Chat      |   7/10 | Богатый основной UX       | Разрезать data-flow, input, stream, session sidebar на отдельные hooks |
| Tasks     |   6/10 | Нужная продуктовая идея   | Чётко отделить scheduler, execution log и task definitions             |
| SRE Agent |   7/10 | Сильная operational идея  | Добавить trust model: advisory vs auto-fix vs dry-run                  |

Provider / Infra

| Панель               | Оценка | Что хорошо                             | Что улучшить                                                                                     |
| -------------------- | -----: | -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| ProviderManager      |   8/10 | Один из самых полезных центров системы | Добить split по под-вкладкам и shared state layer                                                |
| AddKeyModal          |   5/10 | Важный onboarding path                 | Срочно стабилизировать тесты и отвязать от глобальных singleton side-effects                     |
| GroupsPanel          |   7/10 | Понятный operational UX                | Добавить batch-actions и clearer conflict states                                                 |
| SessionBindingsPanel |   7/10 | Практичная диагностика                 | Показать причины eviction и recovery actions                                                     |
| ShadowPanel          |   7/10 | Хорошая экспертная фича                | Сделать diff narrative проще и короче                                                            |
| ConnectorsPanel      |   5/10 | Сильная интеграционная зона            | Убрать зависимость от недорегистрированных глобальных сервисов, ввести mockable connector facade |

Observability / Analytics

| Панель              | Оценка | Что хорошо                           | Что улучшить                                                 |
| ------------------- | -----: | ------------------------------------ | ------------------------------------------------------------ |
| HealthPanel         |   8/10 | Живая и полезная health-визуализация | Добавить compact mode и failure drill-down                   |
| AquariumPanel       |   5/10 | Эффектно визуально                   | Держать как experimental view, не как основной surface       |
| DocsHealthPanel     |   7/10 | Редкая и ценная фича                 | Яснее разводить “check”, “fix proposal”, “applied fix”       |
| DiagnosticsPanel    |   7/10 | Хороший ops-инструмент               | Нужны deterministic remediation playbooks                    |
| AnalyticsPanel      |   8/10 | Реально полезная системная аналитика | Разбить cost / usage / performance на отдельные data modules |
| RouterTraceView     |   8/10 | Отличная explainability              | Сделать упор на decision diff summaries                      |
| TracesPanel         |   8/10 | Очень сильная диагностическая панель | Виртуализация длинных трейсов и preset filters               |
| RoutingIntelligence |   8/10 | Одна из самых ценных фич             | Выделить tuning engine отдельно от UI controls               |

Governance / Knowledge / Workspace

| Панель         | Оценка | Что хорошо                      | Что улучшить                                           |
| -------------- | -----: | ------------------------------- | ------------------------------------------------------ |
| ToolsPanel     |   7/10 | Полезный control plane          | Разделить registry / schema / execution / security     |
| RolesPanel     |   8/10 | Сильный workforce layer         | Вынести аналитику ролей отдельно от CRUD               |
| PolicyPanel    |   6/10 | Нужная safety-зона              | После фикса engine сделать guided policy presets       |
| MemoryPanel    |   7/10 | База для long-term intelligence | Упростить search modes и explain retrieval choice      |
| KnowledgePanel |   7/10 | Хорошая идея knowledge graph    | Сильнее связать с trace/debate/chat flows              |
| BuilderPanel   |   7/10 | Стратегически очень важная фича | Жёстче валидировать DAG и сценарии деплоя              |
| WorkspacePanel |   6/10 | Полезно как оболочка            | Нужны clearer file actions и unified attachments model |

Debate stack

| Панель              | Оценка | Что хорошо                               | Что улучшить                                                  |
| ------------------- | -----: | ---------------------------------------- | ------------------------------------------------------------- |
| DebatePanel         |   8/10 | Витрина продукта, сильная дифференциация | Продолжить декомпозицию и снизить связность analytics sidebar |
| DebateRuntimePanel  |   8/10 | Сильный live-monitor                     | Отделить engine telemetry от presentation state               |
| DebateReplayPanel   |   7/10 | Ценная post-mortem фича                  | Улучшить timeline annotations и snapshots                     |
| DebateAnalysisPanel |   8/10 | Хороший смысловой слой                   | Больше “so what?” рекомендаций                                |
| TournamentPanel     | 6.5/10 | Интересная product idea                  | Нужен более жёсткий bracket/domain model                      |
| ArgumentGraphPanel  |   8/10 | Отличная spatial explainability          | Добавить clustering и collapse large branches                 |

Самые важные ошибки и дефекты, которые я бы чинил первыми

P0. Убрать singleton-зависимость из chat runtime.  
ChatExecutor не должен импортировать promptSecurityService напрямую. Его надо передавать через deps/contract, а в тестах подсовывать mock/stub. Пока этого нет, весь chat runtime тестируется грязно и ломается каскадно. chat-executor.ts

P0. Починить React purity/lifecycle нарушения в UI.  
В ABTestPanel вынести ResultRow из тела компонента, убрать sync setState-pattern на mount; в AudiencePanel прекратить прямую мутацию poll, перейти на immutable update; отдельно пройтись по похожим паттернам в AgentProtocol/Agents/Audience. ABTestPanel AudiencePanel

P0. Вернуть UI к заявленному правилу доступа к сервисам.  
Компоненты должны ходить в сервисы через contracts/instances/hooks/facades, а не импортировать kernel/services/* напрямую. Это уже сейчас видно как источник архитектурной эрозии. Сервисы ABTestPanel

P1. Переписать budget dedup так, чтобы ключ дедупликации был единообразным.  
Если входная дедупликация строится на requestId, то и восстановление/усечение истории должно использовать совместимый идентификатор, иначе статистика расходов станет недетерминированной. budget-service.ts

P1. Зафиксировать PolicyService как security-critical модуль.  
Сейчас policy layer нельзя считать полностью надёжным, пока не зелёные сценарии admin token / content safety / rate-limit / blocking. Для такого слоя нужны не просто тесты, а contract tests и regression suite. policy-service.ts

P1. Стабилизировать тестовую инфраструктуру модалок и интеграционных панелей.  
AddKeyModal и ConnectorsPanel показывают, что часть UI-тестов всё ещё зависит от реального runtime boot side-effects. Нужен единый renderWithKernelMocks() и строгий запрет на неявный boot singleton-ов в panel tests. AddKeyModal ConnectorsPanel

Что я бы дал coding agent как конкретный план работ

Sprint P0 — стабилизация платформы

1. Refactor ChatExecutor
   - убрать прямой singleton import security layer;
   - ввести promptSecurity в ChatServiceDeps;
   - добавить fallback no-op implementation для unit tests.

2. Fix UI purity violations
   - вынести inline components из render;
   - убрать direct object mutation в state;
   - заменить sync setState in useEffect на derived state / async loaders / external store subscriptions.

3. Enforce service access discipline
   - запретить imports из kernel/services/* для UI через lint + autofix path policy;
   - создать thin facades/hooks для panel layer.

Sprint P1 — надёжность доменных сервисов 4. BudgetService reconciliation

- унифицировать dedup key lifecycle;
- добавить tests на prune/reload/replay;
- сделать deterministic monthly aggregation snapshots.

5. PolicyService hardening
   - contract tests на admin token;
   - matrix tests на privacy/toxic/blocklist/rate-limit;
   - явно отделить notification side-effects от enforcement decision.

6. Panel test harness
   - единый helper для регистрации mock services;
   - запрет runtime boot в unit tests;
   - фиксация flakes в AddKeyModal/Connectors/chat-related tests.

Sprint P2 — управляемость роста 7. Bundle governance

- пересобрать lazy boundaries вокруг debate/kernel heavy zones;
- отдельно вынести большие data-definition файлы;
- ввести budget на chunk size в CI.

8. Surface consolidation
   - Aquarium и похожие “витринные” панели оставить experimental;
   - дублирующие views переводить в read-only bridge или удалять;
   - документацию синхронизировать с фактическим inventory.

Итоговый вердикт

Если честно: проект очень интересный и уже выглядит как настоящий AI operating layer, а не демка. Но сейчас он в точке, где дальнейшее наращивание фич без консолидации начнёт ухудшать систему быстрее, чем улучшать. Мой главный вывод такой:  
ядро — сильное, продуктовая поверхность — богатая, инженерная дисциплина между ними — просела.

Моя итоговая шкала:

- Архитектура: 8.8/10
- Продуктовая амбиция: 9/10
- Качество UI-слоя: 6.7/10
- Надёжность сервисов: 6.9/10
- Тестовая зрелость: 4.8/10
- Поддерживаемость в будущем: 6/10
- Общая оценка проекта: 7.4/10

Если хочешь, следующим сообщением я могу сделать ещё 3 полезные вещи без воды:

1. собрать тебе жёсткий backlog P0/P1/P2 по файлам,
2. написать готовый prompt для coding agent под этот репозиторий,
3. оформить таблицу “файл → проблема → точечный фикс”.
