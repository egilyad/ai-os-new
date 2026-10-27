<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# SuperAgents OS — полное описание (промт для дебатов/ИИ)

> Раздел: **Руководство** · Статус: verified · Теги: система, обзор, аудит, промт, дебаты, рекомендации

Источники: `src/route-registry.tsx`, `src/kernel/services/dexie-schema.ts`, `src/components/`

# SuperAgents OS — полное описание системы (промт для аудита/улучшений)

> Назначение: эта статья описывает архитектуру, возможности и уже реализованные механизмы
> SuperAgents OS **целиком и без ссылок на код**, чтобы любой ИИ (GPT, Claude и др.) мог
> проанализировать систему и дать **рекомендации по улучшению, не дублируя существующее**.
>
> Использование: скопируй эту статью в любой ИИ или проведи её через дебаты SuperAgents OS
> (указав тему «рекомендации по улучшению системы»). Внизу — чёткое задание.

## 1. Что такое SuperAgents OS

SuperAgents OS — браузерная когнитивная операционная система. Всё работает локально в браузере:
Web Workers + IndexedDB, без сервера. Это мультиагентная среда оркестрации интеллекта:
несколько LLM-провайдеров, агенты, память, дебаты, исследования, графи.

### Принципы
- **Local-first**: ключи шифруются at-rest в IndexedDB (AES-GCM + PBKDF2), не покидают браузер.
- **Event-driven**: всё общение через типизированный EventBus; панели и сервисы развязаны.
- **Мультистратегичный роутинг**: UCB1 bandit, broadcast, race, cost-optimized и др.
- **Плагируемые провайдеры**: Gemini, OpenRouter, Groq, NVIDIA, OpenAI-совместимые, кастомные, Mercury (Inception Labs).

### Слои
1. **UI Layer** — React-компоненты, Zustand-сторы.
2. **Legacy Service Layer** — тонкие proxy-обёртки.
3. **Kernel Layer** — SystemKernel (reducer), EventBus, Container (DI), Bootstrap, сервисы по доменам, контракты (66+), события (115+).
4. **Infrastructure Layer** — LLM-адаптеры, Web Workers (memory, sandbox), Dexie/IndexedDB.

## 2. Основные подсистемы

### 2.1 Провайдеры и ключи
- Registry ключей: lifecycle, статусы, probation, ротация, квоты, health-проверки, аналитика, group manager, hydrator, reconciler.
- Адаптеры: Gemini, OpenRouter, Groq, NVIDIA NIM, Cerebras, Cloudflare, Azure, Anthropic, OpenAI-совместимые (DeepSeek, Kimi, MiniMax, Qwen), Mercury.
- Декораторы LLM: RateLimiter, CircuitBreaker, Retry, Cache, CostManager, PriorityQueue, Fallback, Logging.
- Смарт-роутинг: UCB1, broadcast, race, cost, SLA-режимы (Performance/Cost/Balanced/Reliability/FreeFirst).

### 2.2 Чат и исполнение
- Стриминг от любого провайдера.
- Режимы: single, broadcast (all), race (fastest wins), split-view.
- Память-усиленные промпты: автовыдача релевантных прошлых диалогов.
- Мультисессийность, книжные закладки, поиск сообщений.

### 2.3 Агенты
- CRUD ролей, спавн из шаблонов, bulk pause/resume, скиллы, топология.
- Память агентов (agentMemory), журнал выполнений, метрики, конфиг-ревизии.
- Персоны: профили, голоса, глубина, контексты, цели.

### 2.4 Память и знания (Memory Center)
- Единая БД IndexedDB `super_agents_os_v4` (Dexie) — ~120 таблиц.
- MemoryEngine: гибридный поиск BM25 (Orama) + семантические эмбеддинги (Transformers.js).
- Долговременная память (LTM), память сессий, когнитивные трассы.
- Wiki-Brain: отдельное хранилище LLM-компилированных статей (поиск, граф, lint, ингест).
- Memory Center: единая карта памяти (граф, поиск по источникам, карта хранилищ, health/gaps).

### 2.5 Знаниевый конвейер
- **Knowledge** (база знаний/RAG) → **Crystal Vault** (проверенные утверждения с доказательствами и жизненным циклом) → **Junction** (пересечения между источниками) → **Synthesis** (мультиперспективный консенсус) → **Knowledge Generator** (автономный цикл гипотеза→доказательства→кристалл).
- Линзы (перспективы анализа) и исключения (вето) модулируют ответы.

### 2.6 Дебаты
- 33+ встроенных стратегии: Round Robin, Socratic, Argument Tree, Moderated, Free-for-All, Jury, Brainstorming, Delphi, Debate-athon, Meta-Debate, Autopsy, Simulated Negotiation, Premortem, Red Teaming, Rhetorical Triangle, Evidence-Based Policy, Principle-Based Negotiation, Uncertainty Quantification, Multi-Criteria, Stakeholder Mapping, Cross-Examination, Trial by Argument, Parliamentary, Oxford Union, Lincoln-Douglas, Spontaneous, Asynchronous Marathon, Flash, Collaborative Consensus, Scenario Testing, Hypothesis Testing, Contest Mode.
- Живая арена дебата (интерактивные графы), вердикты, метрики качества, человеческий вклад.
- Граф аргументов (supports/challenges/refines/contradiction).

### 2.7 Исследования
- Research Engine / Advanced, Hypothesis Generator, Research Reports.
- Debate System Research (эксперименты над самими дебатами), Rival Labs (A/B parity-сервисов).

### 2.8 Флот / Governance / Интеграции
- Экипажи, советы (Council), графы, инвокации, директор, комнаты.
- MCP-серверы, инструменты, вебхуки, коннекторы, проекты, задачи, планировщик.
- Политики, права, trust-скор, provenance, снимки, аудит-журналы.

### 2.9 Аудит и качество
- 8 типов аудитов (bootstrap, build, keys, architecture, domain, data/streaming, security, methodology).
- 12 классов дефектов (memory leaks, security, data integrity, race/lifecycle, types/contracts, performance, UX, build/deploy, observability, logic, state consistency, contract violations).
- CI-ворота: typecheck, ESLint (max-warnings), wiki docs sync, docs health, тесты.

## 3. Уже реализованные графы и визуализации (НЕ предлагать заново)

- Memory Center graph (память) — интерактивный, vis-network.
- Knowledge graph (знания) — vis-network.
- Architecture map (сервисы DI) — vis-network.
- Dependency map (зависимости + impact) — vis-network.
- Argument graph (дебаты) — vis-network.
- Junction graph (пересечения) — vis-network.
- Topology diagram (дебаты) — vis-network.
- Decision graph (трассы) — vis-network.
- Intelligence graph (топология, live-status) — vis-network.
- Navigation graph (все разделы/панели) — vis-network.

## 4. Задание для ИИ/дебатов

Ты — архитектурный консультант SuperAgents OS. Прочитай описание выше.

Требования к ответу:
1. **НЕ** предлагай создавать то, что уже есть (см. список механизмов и графов выше).
2. Предложи **конкретные улучшения** по категориям:
   - архитектура и модульность;
   - память и знания (новые механизмы, а не дубликаты);
   - дебаты и стратегии;
   - UX/панели/графы;
   - безопасность;
   - производительность;
   - инструменты для разработчика.
3. Для каждой рекомендации укажи: **что**, **зачем**, **как** (кратко), **риск/стоимость**.
4. Отметь, какие улучшения — «низко-висящие фрукты» (быстрые), а какие требуют серьёзной работы.
5. Дай **5 главных приоритетов** на ближайший спринт.

Формат ответа: структурированный список рекомендаций, самое важное — вверху.

---

## Связанные материалы

- [Что такое SuperAgents OS](./what-is.md)
- [Путь идеи: от мысли до результата](./idea-path.md)
- [Memory Center: аудит памяти системы](./memory-center-audit.md)
- [Дебаты: стратегии — обзор](./debate-strategies.md)
- [Аудит: методология и процесс](./audit-methodology.md)

[← Все материалы](./README.md)
