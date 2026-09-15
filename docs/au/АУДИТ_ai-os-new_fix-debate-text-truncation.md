# 🛡️ Глубокий аудит проекта SuperAgents OS (ai-os-new)

| Параметр | Значение |
|---|---|
| **Репозиторий** | `github.com/egilyad/ai-os-new` |
| **Ветка** | `fix-debate-text-truncation` (HEAD `310b535`) |
| **Дата аудита** | 15.09.2026 |
| **Версия** | 4.5.0 |
| **Стек** | React 19 · TypeScript 6 · Vite 8 · Dexie/IndexedDB · Zustand · Web Workers · Node 22 |
| **Объём** | ~428 000 LOC TS/TSX · 2 637 файлов в `src/` · 3 502 файла всего · 364 тест-файла |

> **Контекст ветки.** Ветка названа в честь коммита `82d59c1` «fix: remove 500-char truncation in debate timeline» — удаление усечения записей таймлайна дебатов до 500 символов. Аудит показал: это исправление закрыло **лишь одну из девяти** точек потери текста в дебатном конвейере (см. §11 и §14).

---

## 1. Резюме (Executive Summary)

**Общий вердикт: «сильное ядро в оболочке симуляций».**

Проект ведёт двойную жизнь. Ядро — чат и мультиагентные дебаты через реальные LLM (роутинг UCB1, гонки провайдеров, SSE-стриминг, ключи, Dexie-персистентность, таймауты/ретраи/circuit breaker) — спроектировано на уровне **7–8/10**: видна итеративная инженерная культура с датированными фиксами реальных инцидентов (маркеры `G-01`, `H-26`, `P0-3`, `MED-7` прямо в комментариях). Инфраструктура — типизированный EventBus с backpressure и dead-letter, DI-контейнер с ленивостью и LIFO-уничтожением, фазовый bootstrap, DAL с Zod-хуками — редкого качества для browser-only проекта.

Но вокруг ядра — **обширный слой симулякров**: 167 сгенерированных rivals-сервисов с echo-заглушками, «выполнение Python» через regex, «голосовой ввод» с захардкоженной транскрипцией, SLA-статистика из `Math.random()`, «сон памяти»-мок, запущенный в прод. По пользовательской поверхности **~30–40% панелей UI ведут к полностью или частично симулируемым функциям**. Флаг `mockServices.enabled: true` включён по умолчанию.

Добавляются системные дефекты: **амнезия долговременной памяти за 5 минут** (TTL-конфиг-баг), **потеря текстов дебатов в 8 точках конвейера** (та самая тема ветки), **мёртвый sync-сервер без единого клиента**, **мёртвый OCC/версионирование** при многовкладочности, **бэкап покрывает 16 из 104 таблиц** и не вызывается из UI. Часть quality-gates отключена (`pre-commit.disabled`, красный circular-check, coverage без `kernel/services`).

### Сводная таблица оценок

| # | Раздел аудита | Оценка | Ключевая проблема |
|---|---|---:|---|
| 1 | Mock & Stub (заглушки и демо) | **4/10** | 4 CRITICAL-фейка, доступных пользователю без пометок; `mockServices: true` по умолчанию |
| 2 | Архитектура | **6/10** | Каркас зрелый, но централизованные реестры распухли; 1 цикл в kernel; рост «в ширину» протезами |
| 3 | Данные | **4/10** | 104 таблицы, схема ведётся дважды (1 580 строк дубля), 5 источников истины, бэкап мёртв |
| 4 | Код | **6.5/10** | Strict-TS образцовый, any почти нет; но 2 243 `slice(0,N)`, god-файлы, дубли утилит |
| 5 | Синхронизация | **4/10** | Sync-сервер — фантом (0 клиентов); OCC мёртв; оффлайн-режима нет |
| 6 | Распределённые системы | **6/10** | LLM-путь отличный; межвкладочная консистентность систематически некорректна |
| 7 | Производительность | **5/10** | ~3–4 МБ стартового JS (ядро статически в entry); god-компоненты; liveQuery-усиление |
| 8 | Интеграции | **5.5/10** | 12+ из 24 провайдеров сломаны (нет прокси-маршрутов); research заблокирован собственным CSP |
| 9 | Конфигурация | **6.5/10** | Строгий TS-профиль; но 5 «тихо мёртвых» механизмов, CSP в 3 копиях |
| 10 | Память и состояние | **5/10** | State-менеджмент 7/10; когнитивная память — фасад (TTL 5 мин, 7 слоёв всегда пусты) |
| 11 | Бизнес-логика | **5/10** | Конвейер дебатов добротный; алгоритмы исходов — на 3/10 (консенсус на пустых клеймах, Elo мёртв) |
| | **Итоговая оценка** | **5.5/10** | Ядро 8/10 · периферия 3/10 · процессы 4/10 |

### Топ-10 критических находок (все верифицированы по коду)

| # | Находка | Локация |
|---|---|---|
| 1 | **Амнезия памяти**: TTL долговременной памяти = `services.cache.defaultTTLMs` = **300 000 мс (5 минут)** вместо 30 дней; прунинг каждые 2.5 мин стирает память из Dexie, кэша и воркера. RAG-контекст и «Memory Mesh» забывают всё за 5 минут | `memory-engine.ts:27-32` + `config-registry.ts:257` |
| 2 | **7 «когнитивных слоёв» памяти всегда пусты**: `ServiceBackedMemoryStore` читает несуществующее поле `svc.memories` через каст → все 7 обёрток возвращают `[]`; MemoryPalace всегда 0 записей | `service-backed-memory.ts:35,60,73,84,96` |
| 3 | **`trimContent(8)` опустошает дебаты**: после каждого раунда `content` всех шагов старше последних 8 становится `''` → консенсус, early-exit и финальный вердикт строятся на пустых клеймах для дебатов >8 шагов | `debate-memory.ts:166-183` + `debate-pipeline-builder.ts:259` |
| 4 | **TypeError в 6-м раунде**: цикл resolved-claims индексирует `rounds[]` (только последние 5) по `roundNumbers.length` (все раунды) → `rounds[i]!` падает при ≥6 раундах → сессия failed | `debate-state-builder.ts:102-105` |
| 5 | **API-ключи в plaintext** в IndexedDB by design; AES-GCM vault не подключён, а «мастер-ключ» при unlock кладётся в localStorage рядом с данными | `key-vault.ts:29-37`, `key-service.ts:399-413` |
| 6 | **Бэкап мёртв**: `exportToJson` покрывает 16/104 таблиц, не экспортирует localStorage-бакеты и **не вызывается ни из одного UI** | `database-service.ts:720-839` |
| 7 | **12+ провайдеров LLM сломаны из коробки**: deepseek/kimi/minimax/qwen/together/mistral/cohere и др. шлют запросы в `/proxy/<id>`, которого нет ни в Vite, ни в nginx → HTML/403 вместо ответов | `adapter-factory.ts:126-204` |
| 8 | **Sync-сервер — фантом**: ни одного клиента в `src/`, CSP запрещает `wss:`, Docker его не запускает; протокол — whole-file last-write-wins | `server/sync-server.mjs:171-206` |
| 9 | **Python-раннер — regex-симуляция**: «stdout» = аргументы `print()` из исходника; UI показывает результат как реальный вывод | `python-runner-service.ts:142-161` |
| 10 | **OCC-версионирование мёртво**: `sessionToRecord` не проставляет `version` → guard конфликтов двух вкладок никогда не срабатывает; `destroy()` замков не удаляет записи из IndexedDB | `debate-session-persistence.ts:46-81`, `cross-tab-lock-service.ts:250-266` |

> ⚠️ **Важное опровержение.** В ходе перекрёстной проверки агент-аудитор зафиксировал «сломанный YAML `branches: ain, master]` → CI не запускается». Байтовая верификация (подсчёт байтов строки + парсинг YAML) **опровергла** это: файл реально содержит `branches: [main, master]`, YAML валиден. Искажение `ain, master]` — артефакт обработки вывода в shell-окружении (обрезка `[m` как ANSI-кода). CI работает, но: срабатывает только на `main`/`master` (feature-ветки без CI), job `circular-check` стабильно красный, `dep-cruiser` падает на Node ≥23, deploy не ждёт тесты.

---

## 2. Методология

- **Статический анализ** полного дерева репозитория (клон глубины 50, все 3 502 файла).
- **11 параллельных аудиторских трассов** (по одному на раздел) с обязательными ссылками `файл:строка` и сниппетами-доказательствами; всего зафиксировано **~170 подтверждённых находок**.
- **Перекрёстная верификация** критических claims основного аудита байтовым анализом (CI YAML, TTL памяти, `trimContent`, `mockServices`) — спорные утверждения либо подтверждены, либо опровергнуты с доказательством.
- **Позитивный контур**: каждый раздел фиксирует и сильные стороны (для баланса и приоритизации рефакторинга).

---

## 3. Аудит тестовых заглушек и демо-кода (Mock & Stub Audit) — 4/10

**Объём:** ~35 подтверждённых находок: 4 CRITICAL, 7 HIGH, ~15 MEDIUM, ~10 LOW.

**Общий вывод.** Проект честно *помечает* часть своих заглушек (`@deprecated MOCK`, `PROVIDER-PENDING`, `BLOCKED-RUNTIME`, `DemoGate`/`DemoBadge`, флаг `featureFlags.mockServices`) — но флаг по умолчанию **включён**, а самые опасные фейки под него вообще не попадают.

### CRITICAL

| Находка | Локация | Доказательство |
|---|---|---|
| «Выполнение Python» = regex-парсинг `print()`. Циклы/вычисления/ошибки не исполняются; `ProjectsPanel` показывает результат как реальный stdout | `python-runner-service.ts:142-161` | `const printRegex = /print\s*\(([^)]*)\)/g; stdout += match[1].replace(/['"]/g,'')` |
| Голосовой ввод: искусственная задержка 1 с и захардкоженная строка «This is a simulated voice transcription...» + 2 фейковых attachment'а | `voice-input-service.ts:66-77, 23-42` | `await new Promise(r => setTimeout(r, 1000)); session.transcript = 'This is a simulated...'` |
| SLA-история «NVIDIA Enterprise» = 7 дней `Math.random()` (uptime, латентность, запросы) + статичные `STATIC_COMPLIANCE`/`STATIC_REGIONS` | `nvidia-enterprise-service.ts:303-315, 17, 40` | `uptime: 99.95 + Math.random() * 0.04` |
| Routing-эксперименты: `realMode ?? false` — по умолчанию вся статистика (latency/cost/errorRate) генерируется RNG; в UI нет пометки «данные симулированы» | `routing-experiments-service.ts:49-75, 122` | `const latency = Math.round(200 + rng() * 3000)` |

### HIGH

- **rivals2–rivals20** (167 файлов, ~25% сервисного слоя kernel): сгенерированные «клоны» чужих продуктов (AI-Scientist, SecondBrain, LangSmith...). rivals2–12 — правдоподобные мини-реализации (~100–150 строк/сервис); **rivals13–19 — протезы** по 15–25 строк: echo-фолбэки вместо LLM (`rivals15/analitik-service.ts: '[echo] ${prompt}'`), случайные оценки (`aiscientist-service.ts:18-20`), 177 «агентов» вида `RU Agent #N`. Витрина RivalLabs (156 карточек) подаёт их как работающие функции.
- **fine-tuning / deploy / distillation** — setInterval-театр: `evalScore = 0.75 + Math.random()*0.2`, стадии «Building... Uploading...», URL `https://app.example.com` (`fine-tuning-service.ts:162-195`, `deploy-service.ts:253-306`, `model-distillation-service.ts:149-168`).
- **Русские интеграции = мок-инструменты**: «Я.Диск/VK/Wildberries» возвращают эхо аргументов `(RU mock)` (`phase47-russian.ts:59-67`).
- **`@deprecated MOCK` SleepEngine запущен в прод** (ночной таймер каждые 60 с) (`sleep-engine.ts:8, 48`).
- **«Миграция провайдеров» — no-op**: шаги помечаются `done` без действий (`provider-migration-service.ts:11, 48-98`).

### MEDIUM (выборка)

- Полный **mock-LLM провайдер** зарегистрирован в продакшн-фабрике адаптеров (`src/llm/mock/mock-adapter.ts:26-130` + `adapter-factory.ts:117-119`).
- **11 «источников» research** (Scopus/IEEE/Springer...) = `RestrictedAdapter`, возвращающий один псевдо-результат «Institutional Access Required» (`source-adapters.ts:1232-1263`).
- **ConnectorsPanel: «Simulated OAuth»** — кнопка Connect без endpoint ставит `status: 'connected'` (`ConnectorsPanel.tsx:123-125`).
- **SchedulerPanel — превью с демо-данными**, честно задокументировано, но панель в навигации (`SchedulerPanel.tsx:80-82`).
- `mockServices.enabled: true` **по умолчанию** (`config-registry.ts:288-290`, верифицировано) — DemoGate-панели видны из коробки.
- LLM-judge без LLM ставит константу 0.7 (`eval/llm-judge-service.ts:21-37`); «Quantum Deep» = simulated annealing на `Math.random()` (`rivals12/quantum-service.ts:14-33`); в контейнер регистрируется `undefined` как сервис (`phase7-memory-eval-metrics.ts:34-35`).

### Тесты-пустышки

Из 364 тест-файлов большинство содержит реальные ассерты, **но**:
- `panel-smoke-tests.test.tsx:123-176` — при полностью замоканном ядре ассерт `expect(document.body).toBeTruthy()` — таутология (пройдётся даже если панель упадёт в ErrorBoundary);
- `technique-panels-smoke.test.tsx:72-91` — та же схема для ~60 панелей;
- 24 файла `phase*-chain.test.ts` — ассерты вида `expect((await syn.loop()).length).toBeGreaterThan(0)`, где `loop()` возвращает конкатенацию констант — **тесты закрепляют моки как «пройдённые»**.

### Итоговая оценка доли «ненастоящего» кода

| Срез | Оценка |
|---|---|
| По LOC | ~8–12% (rivals-кластер 167/664 сервисных файлов, но файлы маленькие) |
| По пользовательской поверхности UI | **~30–40% панелей** ведут к полностью/частично симулируемым функциям |
| По критическим функциям | Ядро (чат/дебаты/роутинг/ключи/FactCheck) — **настоящее** |

**Рекомендация №1 (быстрая):** `mockServices.enabled: false` по умолчанию + явные дисклеймеры в Python-раннере, Voice Input, NVIDIA SLA и Routing Experiments.

---

## 4. Аудит архитектуры (Architecture Audit) — 6/10

### Реальная карта

```
UI: main.tsx → App.tsx → routes.tsx ← route-registry* (3 реестра, ~200 nav)
    components/ (981 файл, ~180K LOC) · stores/ (42 файла zustand)
    доступ к ядру: 79 файлов → kernel/instances (service-locator)
KERNEL: runtime.ts (RuntimeManager, фазы, healthchecks)
    bootstrap.ts → service-registration/index.ts → 90 phase-файлов → 429 register()
    container.ts (DI: ленивые фабрики, override, LIFO-destroy)
    kernel.ts (SystemKernel) · events/ (registry 2539 стр., ~475 событий → EventBus)
    instances/ (387 lazyService) · contracts/ (296 файлов) · dal/ (50 репозиториев)
    services/ (860 файлов, ~133K LOC)
INFRA: llm/ (50 файлов + 11 декораторов) · workers/ (memory, sandbox) ·
    dexie-schema.ts (104 таблицы, версии v5–v35)
```

### Соответствие заявленному (README) vs реальность

| Заявление | Реальность |
|---|---|
| 3 слоя, UI импортирует только services+contracts | ✅ в целом да: kernel→stores/components = 0 импортов; React в kernel = 0. Но 8 компонентов импортируют `kernel/services/*` напрямую (warn-правило) |
| «Pure reduce() как Redux» | ❌ `SystemKernel.reduce()` мутирует `this.state` на месте + эмитит события + планирует сохранение — command-handler, не чистый редьюсер (`kernel.ts:186-202`) |
| «Event sourcing: state derived from history» | ⚠️ частично: состояние — снапшот в kv-таблице, реплея нет (eventLog к тому же триммится до 1000) |
| Цифры README (123 контракта, 198 событий, 299 сервисов) | ❌ устарели в 2–3 раза: 296 / ~475 / 860 |

### Сильные стороны

1. **EventBus** — типизирован через `EventMap` из единого реестра, Zod-валидация на emit и `onSafe()`, документированный fire-and-forget контракт с dead-letter и backpressure, `emitOnce`-идемпотентность.
2. **DI-контейнер** — ленивые фабрики, `override()` для тестов, детект циклов на резолве, LIFO-destroy с таймаутом.
3. **Фазовый bootstrap** — INIT_TIERS с параллельными тирами, CRITICAL_SERVICES, деградация вместо смерти.
4. **Композиционный корень**: kernel не знает про сторы — zustand-адаптеры регистрируются из `main.tsx:95` через контракты (чистая инверсия).
5. **DAL-дисциплина**: ESLint запрещает `dexieDb` вне DAL; 50 репозиториев; аддитивное версионирование схемы.

### Проблемы

- **[HIGH] Цикл в kernel**: `debate-runtime/index.ts:33` → `debate-engine.ts:5` → `debate-engine-cancel.ts:8` → `debate-session-context.ts:4` → `index.ts`. `npm run check:circular-kernel` стабильно красный (exit 1) — но в CI это видно только на main/master.
- **[HIGH] dependency-cruiser не работает на Node ≥23** (`R_OK` удалён из `node:fs`), при `engines.node >= 22` — оба архитектурных гейта фактически не исполняются локально на актуальных Node.
- **[MEDIUM] 17 дублирующихся строковых имён событий** в EVENT_REGISTRY (`COMPROMISE_SIGNAL` и `KEY_COMPROMISE_SIGNAL` = `'key:compromise:signal'`; `SEND_MESSAGE`/`CHAT_SEND_MESSAGE` = `'chat:send'`; +14) — при расхождении Zod-схем поведение зависит от порядка ключей.
- **[MEDIUM] Kernel не самодостаточен как пакет**: 41 файл тянёт `src/utils`, 233 файла — баррель `../types`, реэкспортирующий типы kernel обратно (инвертированный цикл типов); kernel ↔ llm — двунаправленная связка.
- **[MEDIUM] Ручная карта фаз** `service-phases.ts` (769 строк) покрывает 103 из 429 сервисов.
- **[MEDIUM] Ленивая инстанциация ≠ ленивая загрузка**: все 90 phase-файлов статически импортируют все классы → ~178K LOC ядра в стартовом графе (см. §8 Производительность).

### Оценка паттерна rivals1–20 и debate-runtime

- **rivals2–20** — не копипаст (попарная литеральная похожесть 12–31%), а **поколения сгенерированного по шаблону кода** (доки `RIVALS*_COMPARE.md` → сервис). Общий скелет (`rootLogger.child`, пустые `init/destroy`, `dal.kv`) + разная доменная логика. Градиент качества: ранние фазы — правдоподобные, поздние (13–19) — протезы. Каждый файл статически в entry-bundle, +1 запись в реестрах.
- **debate-runtime** (259 файлов, ~33K LOC, 89 регистраций) — самый настоящий домен: модульная декомпозиция engine/cancel/timeline/strategies. Единственный цикл репозитория живёт здесь (barrel-антипаттерн).

**Оценка: 6/10** — каркас 8/10, периферия и процессы 3/10; архитектура механически пережила рост, но семантически деградировала (width-over-depth фичи-протезы при мёртвых guard-rails).

---

## 5. Аудит данных (Data Audit) — 4/10

### Карта хранилищ

| Хранилище | Объём | Назначение |
|---|---|---|
| IndexedDB `super_agents_os_v4` | **104 таблицы**, 31 версия схемы (v5–v35) | чаты, дебаты (5 таблиц), ключи, память (6 таблиц), трассы + ~70 «фичевых» таблиц |
| localStorage-бакеты `superagents:{agents\|research\|roles\|providers\|ui}:*` | ~15 сервисов-писателей | research engine, таймлайны дебатов, schedules, quality-метрики, nvidia_enterprise |
| Прямые localStorage-ключи | ~10 шт. в обход бакетов | theme, webhook_secret, sync-backup, WAL, key-vault salt/device-key, legacy-ключи |
| Zustand persist | 1 стор (`uiPreferences`) | тема/layout |
| In-memory kernel + eventLog | снапшоты + чекпоинты | состояние ядра |

**Итого ≥5 независимых механизмов персистентности** — источников истины слишком много.

### Ключевые находки

**Схема и миграции:**
- **[HIGH] Схема ведётся дважды**: полная декларация в `stores()` (строки 298–1773) и **ручная копия** в `validateMigrations()` (строки 2012–3592, ~1580 строк) — рассинхрон детектится только `LOGGER.warn`. Исторически уже привело к «P2.19 Dexie schema fix» (v34/v35 объявлены не по возрастанию, валидатор обрывался на v33).
- **[HIGH] Индекс на полный текст памяти**: `memories: 'id, content, ...'` — килобайты текста как ключ индекса → почти двойное хранение каждой записи, раздувание стора.
- **[MEDIUM]** Миграций фактически 3 из 31 (v6, v9, v12); v35 объявляет только 6 таблиц, опуская 98 из v34 (в Dexie 4 безопасно, при откате/миграции на Dexie 3.x — деструктивно); Zod-валидация и integrity-scan покрывают **16 из 104 таблиц**.

**Целостность:**
- **[CRITICAL] Таймлайн дебатов в двух несверяемых сторах**: одна запись пишется и в Dexie `debateTimeline` (`session-manager-service.ts:475-489`), и в localStorage `debate_timeline_<id>` (`debate-timeline.ts:41-67`); после перезагрузки из localStorage возвращается 500 записей при in-memory буфере в 5000 — 90% истории «исчезает» из UI.
- **[HIGH] Orphaned-рост**: удаление сессии чистит 6 Dexie-хранилищ, но НЕ localStorage-ключ таймлайна и НЕ sync-backup → мусор до исчерпания квоты (`debate-timeline.ts:153-155`, `session-manager-service.ts:301-307`).
- **[HIGH] Каскадное удаление без транзакции**: 6 операций последовательно, «abort on first failure» оставляет частично удалённую сессию (`session-manager-service.ts:287-322`).
- **[HIGH] «Закон DAL» нарушен самим ядром**: параллельный слой `storage/dexie-storage.ts` (96 прямых вызовов БД) дублирует репозитории; `memory-engine.ts:84` и `trace-service.ts:51` создают собственные репозитории в обход синглтонов → два независимых кэша на один домен.
- **[MEDIUM] Write amplification**: `ChatSession.history` инлайн в одной строке, полный `put()` на каждое сообщение (`dexie-storage.ts:267-308`); `DebateSessionRecord` — 5 JSON-блобов в одной строке с перезаписью на каждый sync.
- **[MEDIUM] EventLog триммится до 1000 записей** → event sourcing/replay/чекпоинты нефункциональны для длинных сессий (`event-log-repository.ts:45, 90-95`).

**Безопасность данных:**
- **[CRITICAL] API-ключи в plaintext** в IndexedDB by design («Vault is intentionally NOT wired», `key-vault.ts:29-37`); AES-GCM+PBKDF2 инфраструктура — мёртвая.
- **[HIGH] Даже включённый vault бесполезен**: «device-key» хранится в localStorage рядом с данными (`key-service.ts:399-413`).
- **[HIGH] webhookSecret в plaintext** в localStorage (`config-registry.ts:308-323`).
- ✅ Позитив: утечек ключей в логи не найдено (REDACTED_MARKER, только счётчики).

**Жизненный цикл:**
- **[CRITICAL] Бэкапов фактически нет**: `exportToJson`/`importFromJson` покрывают 16/104 таблиц, localStorage-бакеты не экспортируются, и API **не вызывается из UI** (`database-service.ts:720-839`, `interfaces.ts:126`). Пользователь не может выгрузить свои данные.
- **[HIGH] `clearAllData` очищает 16 из 104 таблиц** — «стёртые» проекты/форумы/rival-данные остаются (`key-service.ts:1014-1032`).
- **[HIGH] Нет IndexedDB-quota стратегий**: `navigator.storage.persist()`/`estimate()` не вызываются ни разу → браузер может молча эвиктить хранилище целиком.
- ✅ Позитив: TTL-прунинг памяти, research-квота-fallback, stale-lock cleanup, crash-детект по флагу shutdown, zombie-восстановление дебатов.
- ⚠️ Branch-фикс усилил давление на квоту: полный контент агентов теперь пишется в оба стора.

**Оценка: 4/10.** Ядро DAL (16 «настоящих» доменов) грамотное, но поверх — 88 таблиц без валидации, двойная схема, 5 источников истины, мёртвый бэкап. Для «local-first OS» отсутствие бэкапа и quota-стратегии — системный провал.

---

## 6. Аудит кода (Code Audit) — 6.5/10

### Метрики

| Метрика | Значение | Оценка |
|---|---|---|
| TS strict | `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals`... | ✅ отлично |
| `any`-токены (`: any`/`as any`/`<any>`) | 639 / 236 файлов ≈ 1.5 на 1000 LOC (86% в тестах) | ✅ хорошо |
| `@ts-ignore` / `@ts-expect-error` | **0 / 1** | ✅ образцово |
| `eslint-disable` | 126 / 84 файла (no-explicit-any 59, exhaustive-deps 43) | 🟡 приемлемо |
| Пустые `catch {}` | ~48 из ~1932 нетестовых catch (+243 «catch с одним комментарием») | 🟡 приемлемо |
| `console.log` в прод-коде | 7 (2 — забытые debug в `conversation-orchestrator.ts:146,155`) | ✅ хорошо |
| Закомментированный код | 5 строк на весь src | ✅ образцово |
| TODO/FIXME/HACK | 2 / 0 / 0 (долги живут в docs/роадмапах — 596 файлов) | ⚠️ «подозрительно чисто» |
| Магические `slice(0,N)` | **2 243** | 🔴 плохо (сам branch-fix — симптом практики) |
| `as never` байпас типизации | 40 вхождений | 🟡 |
| JSDoc в kernel/services | ~65% экспортов | 🟡 |

### Топ проблемных файлов

| Файл | Строк | Проблема |
|---|---:|---|
| `dexie-schema.ts` | 3 616 | схема + миграции + Zod + **1 580 строк ручного дубля versionDefs** |
| `event-registry.ts` | 2 539 | единый реестр на ~475 событий; 6 пар ключей с одинаковыми строковыми именами → коллизии в EventMap/валидаторах |
| `debate-llm-prompt-context.ts` | 1 285 | **одна функция ~1 247 строк** (10+ фаз) — неконтролируемая сложность |
| `styles/common.ts` | 1 968 | deprecated-дизайн-система: 178 импортёров, 65/302 мёртвых экспортов — незавершённая миграция |
| `PolicyPanel.tsx` / `FleetPanel.tsx` | 1 169 / 1 120 | god-компоненты: 1 FC на весь файл, 11–20 useState, 0 мемоизации |
| `sandbox-interpreter.ts` | 1 895 | монолит, но когерентный AST-интерпретатор с тестами — оправдан |

### Дублирование

- **rivals-каталоги**: литеральная похожесть 12–31% → НЕ копипаст, а генерация по шаблону; ~2.5–3K LOC бойлерплейта (~25% rivals-кода); стилевой разрыв поколений (prettier vs сжатый однострочный с русскими комментариями).
- **Утилиты-клоны**: `genId` — **10 определений** (1 канонический + 9 локальных), `formatDate` — 6 (2 посимвольно идентичные копипасты), `useVisibilityInterval` — 2 параллельные реализации (1 мёртвая), `escapeHtml` — 2, `sleep` — 2 + инлайны.

### Мёртвый код

`src/test_map.ts` (остров), `src/shared/utils/index.ts` (бочка-остров), `hooks/useVisibilityInterval.ts` (мёртвый дубль), 65 мёртвых экспортов common.ts, `phase47-russian.ts:41-47` (чтение `globalThis.__c`, которое никто не пишет), 3 из 11 LLM-декораторов (canary/semantic/compress-route — реэкспорт без подключения).

### Прочее

- **[MEDIUM] Mojibake** в user-facing строках NOTIFICATION (`kernel.ts:129, 412, 433` — байты `D0 B2 D0 82` вместо «—»); UTF-8 BOM в `debateLiveStore.ts` и `panels.css`.
- **[MEDIUM] Pre-commit gate отключён** (`.husky/pre-commit.disabled`) — lint/typecheck не гарантированы на коммитах.
- **[MEDIUM] Coverage не включает `kernel/services`** (860 файлов ядра вне метрик покрытия).
- **[LOW] EN/RU смесь**: 142 нетестовых файла с кириллицей вне i18n (5 275 вхождений) — от легитимных `nameRu` до русских комментариев в debate-runtime и `ЗАКОН 1:` в DAL.
- **[LOW] AGENTS.md** врёт в счётчиках (352/638/177/63 против фактических 674/780/296/813).

**Оценка: 6.5/10.** Дисциплина типов — редкой чистоты для 428K LOC (strict + почти нулевой any + кастомные ESLint-правила). Слабость — ИИ-конвейер «продолжать» (предписан самим AGENTS.md): мега-монолиты, дубли, коллизии событий, mojibake, отключённый gate.

---

## 7. Аудит синхронизации (Synchronization Audit) — 4/10

### Карта механизмов

| Механизм | Транспорт | Состояние |
|---|---|---|
| sync-server (`server/sync-server.mjs`) | HTTP GET/PUT `/api/db` + WS `db_changed` | **Мёртв**: 0 клиентов в src |
| CrossTabStateSync | BroadcastChannel + storage-события | Живой, best-effort |
| DistributedLockService | IndexedDB keyValue + TTL | Живой, без fencing |
| Dexie liveQuery | реактивность Dexie | Живой (чаты, ключи, дебаты) |
| DebateSyncManager (вкладка) | EventBus + debounce 16 мс | Зрелый, с провалами |
| TeamCollaborationService | localStorage + BroadcastChannel | Whole-blob LWW |
| ReconnectionService | backoff + jitter, max 300 с | Только для LLM-стримов |

### Ключевые находки

1. **[CRITICAL] Sync-сервер — фантом**: ни одного `new WebSocket` в src; CSP nginx запрещает `wss:`; Vite не проксирует WS; Docker его не запускает. При этом протокол — PUT целого бинарного blob (до 50 МБ) **без версий/ETag/CAS** → lost-update по дизайну; `db_changed` рассылается всем без seq/ACK/echo-suppression (`sync-server.mjs:171-206, 191-196`).
2. **[HIGH] OCC мёртв для дебатов**: `DexieDebateStore.saveSnapshot` бросает ошибку при `version < current`, но `sessionToRecord` **никогда не проставляет version** → guard не срабатывает (`dexie-storage.ts:499-519` + `debate-session-persistence.ts:46-81`).
3. **[HIGH] OCC мёртв для чатов**: стор создаёт ChatSession без `version`, guard `incomingVersion > 0` всегда false (`dexie-storage.ts:267-341` + `stores/chat/store.ts:264-270`).
4. **[HIGH] Нет leader election**: `isPrimary()` определён, но не вызывается нигде — каждая вкладка = полный kernel (двойные дебаты, двойные таймеры, двойная memory-sync) (`cross-tab-state.ts:608-616`).
5. **[HIGH] Замки без fencing**: takeover после TTL не выдаёт токен поколения — медленная вкладка пишет и после потери лока; `destroy()` не удаляет записи из IndexedDB (утечка до TTL); heartbeat-таймер никогда не запускается (`cross-tab-lock-service.ts:132-141, 250-266, 60`).
6. **[HIGH] `emitOnce` глотает апдейты дебатов**: стабильный ключ `session.id` + TTL 30 с → все `DEBATE_UPDATED` кроме первого в 30-секундном окне молча дропаются (кросс-таб синк и подписчики получают ≤1 апдейт/30 с) (`debate-sync-manager.ts:778`).
7. **[HIGH] Per-tab seq несравним**: `debateSeqCounter` — счётчик вкладки, сравнивается между вкладками → ложные конфликты, `DEBATE_SESSION_CONFLICT` эмитится ложно, разрешение конфликта не существует (событие слушает только бейдж) (`cross-tab-state.ts:73, 117, 398-426`).
8. **[MEDIUM] Потеря хвостовых апдейтов**: debounced sync дропается при `syncing=true` вместо постановки в очередь (`debate-sync-manager.ts:688-705`).
9. **[MEDIUM] TTL-рассинхрон локов**: send-message 120 с vs edit 30 с → стрим >120 с открывает окно параллельной записи (`chat-send-message.ts:54` vs `store.ts:151,209`).
10. **[MEDIUM] Event ordering недетерминирован**: per-tab sequence + неуникальный индекс + общий KV → replay перемешивает события вкладок.
11. **[MEDIUM] Оффлайн-режима нет**: 0 использований `navigator.onLine`; retry-очереди мутаций нет — только SSE-reconnect и flush-on-hide.

✅ **Позитив**: `timingSafeEqual` с защитой от length-leak; SSRF-защита cors-proxy (private IP + DNS-rebinding); atomic-rename записи; backoff с jitter; owner-guard/cooldown/atomic-finalize в DebateSyncManager.

**Оценка: 4/10.** Зрелая синхронизация — только в одном домене и в пределах одной вкладки (DebateSyncManager 7/10 сам по себе). Серверная — фантом; кросс-вкладочная — best-effort с мёртвым OCC; оффлайна нет.

---

## 8. Аудит распределённых систем (Distributed Systems Audit) — 6/10

### Гарантии EventBus

Честно задокументированный контракт: **fire-and-forget, at-most-once, lossy**. Порядок — FIFO в пределах типа события; hot-события обходят defer-очередь (переупорядочение hot vs обычных — документировано). Четыре пути дропа (strict-validation, `MAX_PENDING=5000`, `MAX_DEFER_CHAIN=1000`, hot-recursion) пишутся в dead-letter sink — **у которого нет продакшн-консьюмера** (находка: дропнутые события теряются молча; `event-bus.ts:67-75, 308-318`).

### Sandbox (двойная изоляция)

Архитектура образцовая: Web Worker (нет DOM) + AST-интерпретатор meriyah (не eval, работает под CSP без unsafe-eval). Чёрные списки идентификаторов (`fetch`, `eval`, `Function`, `Proxy`, `globalThis`...) + runtime-контроль каждого member-доступа, включая computed (`obj['const'+'ructor']` закрыты). Step-limit 2M + depth 2000 + терминирование воркера главным потоком по таймауту.

**Главный дефект — не безопасность, а функциональность**: статический валидатор запрещает **весь** computed-доступ (`a[i]`, `obj[key]` — `sandbox-interpreter.ts:94-96, 112-117`) → реалистичный скрипт с массивами невозможен → **песочница нефункциональна** для настоящих задач. Плюс: таймаут tool-call захардкожен 5000 мс в воркере независимо от конфига (`sandbox.worker.ts:44-47`); таймаут во время tool-call = сайд-эффект уже произошёл, результат потерян (нет идемпотентности).

### Таймауты и частичные отказы (сильная сторона)

- `AbortController` — **79 использований в 56 файлах**; все LLM-вызовы покрыты signal.
- `race-executor.ts` — эталонный hedged-request: per-candidate контроллеры, победитель абортит лузеров, глобальный таймаут 15 с, cleanup listeners.
- `debate-llm-caller.ts` — retry-loop с **guard от infinite loop (50 итераций)**, per-model таймауты 30/90 с, governor-backstop, экспоненциальный backoff с jitter.
- SSE-парсер: cap буфера 10 МБ, idle-timeout, аккумулиция multi-line событий.
- ✅ Но: `best-of-n.ts` — «гонка» на деле последовательный await; `worker.onerror` только логирует (pending висят до 30 с).

### Оркестрация и консистентность

- **[HIGH] `emitOnce`-misuse** (см. §7-6) — самый болезненный класс: идемпотентность с ключами, подавляющими реальные апдейты.
- **[MEDIUM] Echo-петля** кросс-таб синка: обработка удалённого key-update эмитит KEY_UPDATED → ретрансляция обратно → пинг-понг, гасится 30-сек кэшем (`cross-tab-state.ts:140-181`).
- **[MEDIUM] «Декоративный» лок отмены дебата**: acquire → мгновенный release без критической секции — нулевая mutual exclusion (`debate-engine-cancel.ts:104-125`).
- **[MEDIUM] Truth Consistency Monitor**: repair эмитит `kernel:reconcile:requested`, на который **нет подписчиков** → авто-ремонт дрифта — no-op (`truth-consistency-monitor.ts:251-288`).
- **[MEDIUM] Воркер памяти**: async `onmessage` интерливится через await → search видит частично применённые insert'ы (`memory.worker.ts:98-110`).
- **[LOW] ID-коллизии**: шаблон `` `${Date.now()}-${counter}` `` в 40+ местах — коллизии между вкладками; Transferable нигде не используется.

✅ **Позитив**: EventRecorder — WAL + сериализация через promise-мьютекс + SHA-256 чексуммы; UCB1-бонус корректен; backpressure вместо зависаний.

**Оценка: 6/10.** LLM-путь (race/retry/timeout/backoff/abort-cascade) — 7-8/10. Слой межузловой консистентности систематически некорректен: emitOnce-ключи, несравнимые seq, замки без fencing, неподключённые dead-letter/reconcile, орфан-сервер.

---

## 9. Аудит производительности (Performance Audit) — 5/10

### Профиль загрузки

- `main.tsx:98` — `await runtime.start()` **блокирует первый полезный рендер**; `service-registration/index.ts:2-68` статически импортирует все phase-файлы → **ленивая инстанциация, но не ленивая загрузка**: ~145 600 LOC прочего kernel + 31 081 LOC debate-runtime + 7 057 LOC llm попадают в стартовый граф.
- Итоговая оценка стартового JS: **~3–4 МБ minified** (~1.2–1.5 МБ gzip). `--max-old-space-size=4096` и для build, и для **dev** — маркер масштаба.
- **[HIGH]** `@google/generative-ai` и `groq-sdk` не покрыты manualChunks → в entry (`google-genai-service.ts:1`, `groq-adapter.ts:1`, `vite.config.ts:94`).
- **[HIGH]** `framer-motion` на критическом пути: статический импорт в `CommandPalette.tsx:3` (признание проблемы в комментарии `AppLayout.tsx:3-6`).
- ✅ **268 React.lazy панелей** (201 + 58 + 9) — реально работают; lazy per-locale i18n; Orama/meriyah/xyflow/tiptap вне критического пути (meriyah — dynamic import).
- Bootstrap: последовательный init 429 сервисов с O(N²)-проверками `getStatuses().some()` (`bootstrap.ts:303-328`) + полный `debateSessions.toArray()` на старте (`bootstrap.ts:482`).

### Рендеринг

- **[HIGH] God-компоненты**: `PolicyPanel.tsx` (1 169 строк, 10 useState, **0 useMemo/useCallback/memo**), `FleetPanel.tsx` (1 120, 19 useState, 12 useEffect, 0 мемо) — каскадные перерисовки всего дерева.
- Всего: 1 895 useState / 409 useEffect / 672 useMemo+useCallback / ~22 React.memo — покрытие бимодальное (новые панели аккуратны, старые — нет).
- **[HIGH] Стриминг дебатов**: `DEBATE_AGENT_CHUNK` — клон `new Map(streamingContent)` + конкатенация на каждый токен; `DebateLivePanel.tsx:35`/`DebateArenaView.tsx:28` подписаны на весь Map → ререндер на каждый токен любого агента (`debateLiveStore.ts:231-248`).
- **[MEDIUM] Виртуализация только в 2 местах** (чат, логи): `ServiceTable.tsx:92` (429 строк), `EventsTimeline.tsx:419` (500), `DebateChat.tsx:93` (все аргументы дебата) — `.map()` без окна.

### Данные

- **[HIGH] Чат-путь**: `put()` всей сессии на каждое сообщение × liveQuery перечитывает **100 сессий с полными историями** на каждую запись (`dexie-storage.ts:267-277` + `hydration.ts:59, 116-118`); cleanupOrphanLoading мапит все сессии×истории×ответы → квадратичная стоимость каждого сообщения.
- **[HIGH] liveQuery дебатов без лимита**: `debateSessions.toArray()` + JSON.parse всех строк; при 16-мс синке запрос перезапускается десятки раз/с (`debate-session-store/index.ts:169-180`).
- `.toArray()` — **161 вхождение / 46 файлов**; 7 экспортных дампов полных таблиц через `JSON.stringify`.
- **[MEDIUM]** `structuredClone` полной сессии до стриппинга контента (`session-manager-service.ts:429-431`); 7× `structuredClone(cache.entries)` в memory-engine; BM25-индекс перестраивается на каждый retrieveHybrid на главном потоке (`rag/bm25-service.ts:43-60`).

### Фоновая нагрузка

- **~30 вечных setInterval** в kernel (сетевые пробы всех ключей каждые 5 минут в `probe-service.ts:120`; мониторинги 30 с; watchdog 5 с) — постоянные пробуждения CPU/батареи в простое.
- Zod safeParse на каждый emit + sanitizeObject в DEV (`event-bus.ts:246-268`).

### Память (лучшая часть)

Bounded-буферы почти везде: CacheService LRU 500/TTL/eviction; logger 500; eventLog 1000; timeline 5000/500; liveStore 100×10КБ/50/200/500; dead-letter 1000. MemoryWatchdog 5 с (пороги 100/1500 МБ) с pressure-коллбэками. Следы реальных инцидентов: heap ~1.2 ГБ → фильтр NOISY_EVENTS; удалённый replay-буфер = утечка 100 МБ.
- ⚠️ «Force GC» аллокацией 64 МБ при heap ≥1500 МБ — рискованная практика (`bootstrap.ts:465-471`); мониторинг `performance.memory` — Chromium-only.

**Оценка: 5/10.** Выиграны отдельные битвы (lazy, воркеры, капы, watchdog'и), но структурные решения (статическое ядро в entry, инлайн-истории + liveQuery-усиление, пер-токенные апдейты, god-компоненты) держат систему на уровне тяжёлого enterprise-SPA.

**Top-5 узких мест для пользователя:** 1) холодный старт (3–4 МБ + блокирующий bootstrap); 2) чат-путь с квадратичной стоимостью сообщения; 3) живой дебат (ререндер на токен + полный скан Dexie каждые 16 мс); 4) god-панели; 5) фоновый шум таймеров и платных проб.

---

## 10. Аудит интеграций (Integration Audit) — 5.5/10

### Карта интеграций

| Интеграция | Статус | Качество |
|---|---|---|
| LLM-ядро (HTTP-клиент, SSE, ошибки) | ✅ работает | 8/10 |
| Gemini / OpenRouter / NVIDIA / Groq / OpenAI / Cerebras / Cloudflare | ✅ работает | 7–8/10 |
| **DeepSeek, Kimi, MiniMax, Qwen, Together, Fireworks, Mistral, Cohere, HF, Perplexity, Blackbox, Scaleway, CometAPI, GitHub, Azure** | ❌ **сломаны** — `/proxy/<id>` не существует ни в Vite, ни в nginx | 2/10 |
| Anthropic | ❌ мёртвый конфиг: в defaults и CSP, но адаптера нет | 0/10 |
| Research-источники (23 адаптера) | ❌ заблокированы собственным CSP (fetch напрямую, не через /proxy/fetch) → молча 0 результатов | 2/10 |
| MCP | ⚠️ HTTP JSON-RPC сабсет; дефолты коллизируют с портами sync-server/cors-proxy | 4/10 |
| Google GenAI SDK 0.24.1 (deprecated) | ⚠️ параллельный путь в обход архитектуры адаптеров (без retry/CB) | 4/10 |
| «Gemini Live» | ⚠️ это Web Speech API, не Live API (нет WebSocket/аудио-канала) | 3/10 |
| Webhooks (Slack/Telegram/Discord) | ✅ HMAC, SSRF-guard, DLQ, ретраи | 8/10 |
| Probe/health | ✅ умный, но платный | 7/10 |
| Ротация ключей | ⚠️ авто-ротация через несуществующий OpenRouter API → ключи деактивируются | 3/10 |
| health-sla | ❌ @deprecated MOCK | 1/10 |
| e2e-покрытие | ❌ 4 навигационных smoke-теста | 1/10 |

### Ключевые находки

1. **[HIGH] 12+ провайдеров сломаны из коробки** (`adapter-factory.ts:126-204`): `useProxy=true` → `/proxy/<id>` отсутствует в трёх несинхронных реестрах (vite / nginx / cors-proxy) → dev: HTML вместо JSON («Invalid JSON response»), prod: 403. **Фабрика провайдеров не сверена с конфигурацией прокси** — системный дефект.
2. **[HIGH] Research заблокирован собственным CSP** (`vite.config.ts:109-116` + `nginx.conf:37`): 23 источника фетчат напрямую; `safeFetch` глушит ошибку → research молча возвращает 0 источников без ошибки в UI.
3. **[HIGH] Таймер таймаута не очищается** после заголовков (`llm-http-client.ts:117-152, 384`): любой стрим дольше 60 с (Gemini) / 120 с (остальные) обрывается посреди генерации; при max_tokens=16384 — гарантированный обрыв. Gemini-адаптер вообще создан с 60-с таймаутом вместо 120-с стандарта (`gemini-adapter.ts:44-51`).
4. **[HIGH] STREAM_CHUNK без батчинга**: на каждый токен — полный immutable-копирос массива sessions + history + конкатенация растущей строки (`chat-event-handlers.ts:77-91`); `STREAM_ERROR` стирает частично стримленный контент (`content: ''`, `:141-148`).
5. **[MEDIUM]** streamPost/get: 5xx не помечается Retryable (в отличие от post) → стриминговые запросы не ретраиваются; таймауты (408) не ретраиваются, хотя это самый транзиентный класс.
6. **[MEDIUM] FallbackDecorator не имеет ни одного продакшн-вызова** — заявленный кросс-провайдерный фоллбэк мёртв; реальный failover переизобретён в debate-слое.
7. **[MEDIUM] Платые пробы**: реальные LLM-вызовы по каждому ключу каждые 5 минут + preflight по каждой паре провайдер:модель перед каждым дебатом (`probe-service.ts:120-124, 423-480`); probe эмитит фантомные `STREAM_END` с синтетическими requestId → засорение метрик.
8. **[MEDIUM] RotationService**: авто-ротация только через `adapter.rotateKey` (POST `/keys` — публичного API OpenRouter нет) → всегда fail → ключ деактивируется; `Number.MAX_SAFE_INTEGER` в setTimeout → TTL > 24.8 дней срабатывает мгновенно (`rotation-service.ts:160-243, 266`).
9. **[MEDIUM] Ключи в URL query** у StackExchange/Wolfram (`source-adapters.ts:1077, 1201`) — утечка в историю/логи.

✅ **Позитив**: LLMHttpClient (классификация 401/402/429/5xx, семафор 50, реестр in-flight, отмена при memory pressure); SSE-парсер industrial-grade; ключи не логируются и не утекают в LLM-пути; retry-guard «после первых чанков не ретраить»; CircuitBreaker per-key с cross-tab синком; safeJsonParse с защитой от prototype pollution.

**Оценка: 5.5/10.** Ядро LLM-пути 8/10, но интеграционная поверхность систематически расходится с заявленным: половина провайдеров физически не работает, research молча пуст, ротация нефункциональна, e2e — навигация.

---

## 11. Аудит конфигурации (Configuration Audit) — 6.5/10

### Инвентаризация (ключевое)

| Файл | Оценка | Комментарий |
|---|---|---|
| `tsconfig.json` (solution) + app/node/test | ✅ | strict + `noUncheckedIndexedAccess`; solution-style с защитой от false-green (BLD-C3) |
| `vite.config.ts` | 🟡 | manualChunks-баг: `id.includes('react')` матчит lucide-react/@react-aria/react-virtual → ветки недостижимы; CSP dev ≠ prod |
| `vitest.config.ts` | 🟡 | coverage без kernel/services; глобальный WorkerMock `{result: 'Mocked Worker Result'}` |
| `eslint.config.js` + 2 кастомных правила | ✅ | mandatory-lifecycle (error), no-raw-style-color; но layering — warn |
| `.dependency-cruiser.cjs` | 🟡 | solution-root → покрывает ~1 418 из ~3 500 модулей |
| `Dockerfile` (multi-stage, non-root, healthcheck) | ✅ | но мёртвые ARG (8 build-args не читаются кодом) |
| `docker-compose.yml` (hardening, read_only, cap_drop) | ✅ | но deploy.limits вне Swarm не работает; PROXY_FETCH не пробрасывается |
| `docker/nginx.conf` (gzip, кэш 30d, строгая CSP, deny-all) | ✅ | но см. критические находки ниже |
| `.github/workflows/ci.yml` (8 jobs + Pages) | 🟡 | см. ниже |
| `config-registry.ts` (runtime) | 🟡 | deep-frozen + read-only Proxy, но оверлеи без Zod и без миграции версий |

### Критические находки

1. **[HIGH] `mockServices.enabled: true` по умолчанию** (`config-registry.ts:288-290`, верифицировано) — мок-панели и mock-LLM легально активны в проде.
2. **[HIGH] Docker: nginx не стартует с дефолтами** — `PROXY_FETCH=""` → envsubst → `proxy_pass /;` — невалидная директива (`entrypoint.sh:18`, `nginx.conf:137`); compose не пробрасывает переменную → дефолтный профиль поднимает мёртвый контейнер.
3. **[HIGH] Gemini сломан в Docker-образе**: ARG `VITE_PROXY_GEMINI=""` запекается как пустая строка; `baseURL ?? env ?? '/proxy/gemini'` — `??` **не ловит пустую строку** → запросы в относительный `/v1beta/...` → index.html. Поведенческий разрыв dev/Docker.
4. **[HIGH] Загрузка sourcemaps мертва**: `if: env.SENTRY_AUTH_TOKEN != ''` — step-level env невидим в `if` собственного step → условие всегда false (`ci.yml:325`).
5. **[HIGH] Pre-commit gate отключён** (`.husky/pre-commit.disabled`) — единственный активный хук commit-msg.
6. **[MEDIUM] CSP в трёх несинхронизированных копиях**: index.html (meta) + vite dev header + nginx prod — расхождения (unsafe-inline vs strict, точные хосты vs wildcards, `*.anthropic.com` только в prod). Мульти-CSP в dev применяется пересечением.
7. **[MEDIUM] Двойной commitlint**: корневые @19.8.1 (мёртвые) + мета-пакет @21.2.1 со своими вложенными cli — смешение мажоров.
8. **[MEDIUM] `VITE_BUILD_ID`** заявлен «injected at CI», но CI его не передаёт → `buildId` навсегда `'dev'`.

### CI/CD — реальное состояние (после верификации)

- ✅ **YAML валиден**: `branches: [main, master]` (подтверждено байтовым анализом + парсингом). Первоначальный тезис «CI мёртв из-за опечатки» — **опровергнут**, это артефакт отображения в shell.
- Job'ы: quality (tsc -b + eslint --max-warnings 250) · build (30 МБ warning) · test/coverage · security-audit (critical-only, задокументированное исключение) · **circular-check (стабильно красный — 1 цикл в debate-runtime)** · dep-graph (только Node 22) · e2e (Playwright) · deploy (Pages).
- ⚠️ **Deploy не ждёт test/coverage** (`needs: [build, e2e]`) — регрессия тестов не блокирует деплой.
- ⚠️ Push в feature-ветки (как эта) CI не запускают — только main/master.
- ⚠️ Docker-образ в CI не собирается и не пушится.

**Оценка: 6.5/10.** Конфиги «учатся на инцидентах» (датированные решения в комментариях), но пять механизмов тихо мертвы (sourcemap-upload, PROXY_FETCH-nginx, Gemini-in-Docker, pre-commit, e2e-vs-dev-server) и три копии CSP — ручная синхронизация, которая уже разъехалась.

---

## 12. Аудит памяти и состояния (Memory & State Audit) — 5/10

### Карта состояния

**Zustand** (22 боевых стора в 52 файлах): декомпозиция образцовая (chat/{store,send-message,event-handlers,hydration}), селекторы повсюду, persist ровно один (uiPreferences). Крупнейшие: chat (624 строки), debateLiveStore (9 Map + 2 массива, капы 100/50/200/500).

**Копии одной сущности (главная боль):**

| Сущность | Копий | Где |
|---|---|---|
| Чат-сессия | **5** | zustand + Dexie (history инлайн) + localStorage-бэкап на каждый beforeunload (до 4.5 МБ) + eventLog + legacy-миграция |
| API-ключ | **4** | useKeyStore + keyService + keyStateStore + groupManager (TruthConsistencyMonitor их сверяет) |
| Дебат-сессия | **6+** | engine Map (authoritative) + activeDebateStore + debateLiveStore + Dexie-меты + timeline (Dexie + localStorage) + WAL sync-backup |

Debounce-цепочки: чат 1 с → kernel 2 с → eventRecorder 1 с (+ WAL) → debate sync 16 мс. STREAM_CHUNK не дебоунсится вообще.

### Когнитивная память: настоящая или имитация?

**Вердикт: BM25-полнотекстовый поиск в обёртке «векторной памяти». Семантический слой — имитация, причём неактивированная.**

Что реально: Orama BM25 в Web Worker; контейнер MemoryService с транзакциями и rollback, promise-mutex, quality-gate, deterministic ID, prune-scheduler; RAG-on-chat подключён (`[RECALLED CONTEXT]` в промпт + autoStore); DebateKnowledgeSync — реальные regex-экстракторы claims.

Что фальшиво:

1. **[CRITICAL] TTL-баг — амнезия за 5 минут** (верифицировано): `getMemoryTtlMs()` возвращает `services.cache.defaultTTLMs` = **300 000 мс**, fallback «30 дней» недостижим; prune каждые 2.5 мин удаляет записи из Dexie, кэша и воркера → долговременная память и RAG-контекст амнезируют; `getCapabilities().ttlSeconds` репортит 300 (`memory-engine.ts:27-32` + `config-registry.ts:257`).
2. **[CRITICAL] 7 «когнитивных слоёв» всегда пусты**: обёртки читают `(svc as {memories}).memories` — поля не существует → все query/recall/getStats возвращают `[]`; MemoryPalace всегда 0 записей; orchestrator.recall() всегда пуст (`service-backed-memory.ts:35,60,73,84,96`).
3. **[HIGH] «Эмбеддинги» = word-level хэш** в 384-мерный bag-of-words (`hash % 384`): cosine = лексическое совпадение с коллизиями; никакой семантики (`memory.worker.ts:31-51`).
4. **[HIGH] `ensureSemantic()` не вызывается ни в одном прод-пути** → semanticReady=false навсегда, ветка search_semantic недостижима; тумблер «Semantic» в MemoryPanel ничего не меняет.
5. **[HIGH] Встроенная документация врёт**: обещает «Transformers.js with all-MiniLM-L6-v2» — зависимости нет в package.json (`doc-content-data.tsx:16`).
6. **[MEDIUM] SleepEngine** (`@deprecated MOCK`) инстанцирован и запущен в прод через MemoryOrchestrator; консолидация — no-op; 7 классов с реальной retention-логикой (forgetting curve) никогда не инстанцируются — мёртвый код.

### Утечки и жизненный цикл (неожиданно сильная часть)

- **Все 40 `setInterval` в kernel имеют `clearInterval`** (проверено попарно) — кастомное ESLint-правило mandatory-lifecycle работает.
- Капы везде; debate-engine.destroy() — образцовый (cancel → ожидание pending 5 с → чистка 10 Map); WAL + crash-recovery; HMR-чистка сторов; CacheService — настоящий LRU+TTL+stampede-guard.
- Проблемы: metrics-таймер debateLiveStore живёт после завершённого дебата до clearSession; «Force GC» 64 МБ; `performance.memory` — Chromium-only (Firefox/Safari — ноль мониторинга в проде).

### Прочее

- **[HIGH] KERNEL_UPDATED эмитит живой мутируемый объект**, тогда как getState() отдаёт frozen-клон → подписчики получают мутируемую ссылку (`kernel.ts:190` vs `:543-561`).
- **[HIGH] Kernel-снапшот без CAS**: `setKv` при существующем `setKvCas` → две вкладки = LWW-пинг-понг метрик провайдеров (`kernel.ts:135-144`).
- **[MEDIUM] Zombie-риск beforeunload-бэкапа**: пустой стор пропускает запись → старый бэкап может воскресить удалённые сессии (`hydration.ts:91-108, 194-213`).

**Оценка: 5/10.** State-менеджмент — 7/10 (зрелый, самокритичный). Когнитивная память — **фасад 2/10**: система «помнит» лексически, забывает за 5 минут и красиво это маскирует. One-line fix `services.memory.ttlMs` дал бы максимальный эффект во всём аудите.

---

## 13. Аудит бизнес-логики (Business Logic Audit) — 5/10

### Главный поток дебатов

`DebateEngine.startSession` → конвейер из 4 стадий (`debate-pipeline-builder.ts:87-492`):
1. **preflight** — проверка ключей/провайдеров (нет рабочего ключа → failed);
2. **setupExecutor** — оркестратору ставится executor (бюджет → callLLM → usage);
3. **roundLoop** — раунды из topology, адаптивный порядок агентов; на каждый `agent:responded` — память+таймлайн; `round:end` → **`trimContent(8)`** → FactCheck (≤5 с) → интерим-консенсус → early-exit при confidence ≥ 0.85;
4. **consensusAndFinalize** — claims из памяти → консенсус-движок (эвристика + 3 LLM-судьи ≤30 с) → Zod-валидация вердикта → completed.

33 стратегии (`debate-strategy-definitions.ts`, 1 157 строк): round_robin, socratic, jury_trial, delphi, red_teaming, oxford_union... — декларативные графы. Каркас добротный: аборты, retry с 50-итерационным guard, дедупликация ответов, атомарная финализация.

### Корректность алгоритмов

| Алгоритм | Оценка | Проблема |
|---|---|---|
| UCB1 роутинг | 7/10 | формула корректна; exploration на уровне ключа, exploitation — провайдера; при N=0 всем 0.2 |
| Консенсус | **4/10** | agreements через FNV-hash (лексика, не семантика); **входные данные деградированы trimContent'ом** |
| Скоринг аргументов | 4/10 | factuality сломана id-мismatch; **победитель = функция длины текста** |
| Elo | **2/10** | математика безупречна, но `updateRatings()` **не вызывается нигде** — лидерборд вечно 1200 |
| Bayesian judge | 7/10 | корректный симметричный апдейт |
| Council | 5/10 | судьи мультиголосуют (нет дедупа), тай-брейк не работает |

### Ключевые находки

1. **[CRITICAL] `trimContent(8)` опустошает консенсус** (верифицировано): после каждого раунда content всех шагов старше 8 → `''`; консенсус (интерим, early-exit, финальный) строится на claims из памяти → для дебатов >8 шагов клеймы ранних раундов пусты; промпт-контекст и argument-graph получают пустые тексты (`debate-memory.ts:166-183` + `pipeline-builder:259`).
2. **[CRITICAL] TypeError в 6-м раунде**: resolved-claims индексируют `rounds[]` (последние 5) по `roundNumbers.length` (все) → `rounds[i]!` → runtime-падение → сессия failed для стратегий с maxRounds ≥ 6 (jury_trial=8, debate_athon=10) (`debate-state-builder.ts:102-105`).
3. **[CRITICAL] История дебатов с пустым контентом**: `stripArgumentContent` пишет аргументы с `content: ''`; восстановление сессии возвращает «пустые» прошлые дебаты; timeline в localStorage — последние 500 (`session-manager-service.ts:406-415, 26` + `debate-sync-manager.ts:878-888`).
4. **[HIGH] ~70 из ~85 ачивок недостижимы**: условия-строки не реализованы в `evaluateCondition` → вся дебатная геймификация мертва (`ecosystem-engine.ts:177-216`).
5. **[HIGH] Судьи Council голосуют многократно** — `submitJudgeScore` без дедупа по judgeId (`council-service.ts:308-341`).
6. **[HIGH] Биддинг вырожден в константу**: в `lastArgRole` кладётся ID агента вместо роли → rebuttal-бонус получают все (`debate-orchestrator.ts:225`).
7. **[HIGH] Амнезия агентов по design**: LLM видит последние 2 шага × 800 симв.; старшие — 100-символьные выдержки (`debate-llm-caller.ts:83`, `state-builder:184,231`).
8. **[MEDIUM]** Бюджет резервирует константу 250 токенов/вызов вместо фактического расхода; `sanityReset` обнуляет счётчики при превышении (вектор обхода); watchdog 30 мин vs бюджет 60 мин; `inferStance` — substring-матчинг ('за' ⊂ большинства русских слов, 'agree' ⊂ 'disagree'); вердикт-LLM обходит роутер с захардкоженным приоритетом провайдеров; `require()` в браузерном ESM (проглоченный ReferenceError → мёртвый код ArgTech-бриджа).

### Скрытые усечения в дебат-пути — тема ветки

Коммит `82d59c1` устранил **лишь одну из девяти** точек потери текста:

| # | Место | Что режется |
|---|---|---|
| 1 | `debate-memory.ts:166-183` | content всех шагов старше 8 → `''` (консенсус/промпты на пустых клеймах) |
| 2 | `debate-conclusion-engine.ts:104` | keyArguments вердикта → 500 симв. |
| 3 | `debate-conclusion-engine.ts:397` | те же → 300 симв. в промпте LLM-судьи (обрезки обрезков) |
| 4 | `debate-sync-manager.ts:594` | keyArguments эвристического вердикта → 500 |
| 5 | `debate-llm-caller.ts:83` | история к LLM: 2 шага × 800 симв. |
| 6 | `debate-sync-manager.ts:740, 190-215` | >256 КБ → `content=''` старых раундов **в живой UI-сессии** (реплики исчезают на глазах) |
| 7 | `session-manager-service.ts:406-415` | история в БД → `content:''` |
| 8 | `debate-timeline.ts:46` | persist только последних 500 записей |
| 9 | ~~`debate-timeline.ts` truncatePayload 500~~ | ✅ **исправлено коммитом ветки** |

**Оценка: 5/10.** Каркас конвейера 7/10; алгоритмы, определяющие исходы, — 3/10: консенсус на опустошённых данных, победитель по длине текста, Elo мёртв, ачивки недостижимы, судьи мультиголосуют.

---

## 14. Сквозные темы (Cross-Cutting Themes)

1. **«Фабрика фич» без сверки с реальностью.** Проект рос ИИ-конвейером «продолжать» (предписан AGENTS.md): 19 rivals-каталогов по докам «парити», 93 phase-файла, ~60 сгенерированных панелей. Каждая фича требует правки 5+ центральных реестров (events, registration, instances, service-phases, i18n×2) — конфликтность и распухание. Итог: **ширина вместо глубины**, ~30-40% UI-поверхности — симулякры.
2. **Три несинхронных реестра правды.** Список провайдеров (adapter-factory) не сверен с прокси (vite) и CSP (nginx): 12+ провайдеров сломаны; research заблокирован собственным CSP. CSP существует в 3 копиях. Схема Dexie ведётся дважды. Ротация ключей зависит от несуществующего API.
3. **Мёртвые механизмы с видом живых.** Sync-сервер (0 клиентов), FallbackDecorator (0 вызовов), `updateRatings` Elo (0 вызовов), `ensureSemantic` (0 вызовов), repair-события TCM (0 подписчиков), dead-letter sink (0 консьюмеров), OCC-version (никогда не проставляется), isPrimary (никогда не вызывается), бэкап-API (0 вызовов из UI), sourcemap-upload (условие всегда false), pre-commit (переименован в .disabled). **Паттерн: код написан, тестами «проводка» подтверждена, потребителя нет.**
4. **Конвейер потери данных в дебатах** (тема ветки): 9 точек усечения, из которых ветка закрыла одну; худшие (trimContent → консенсус, stripContent → история) искажают бизнес-исходы и UX напрямую.
5. **Гейты дисциплины отключены**: pre-commit мёртв, circular-check красный, dep-cruiser падает на Node ≥23, coverage без ядра, layering-правила — warn, deploy не ждёт тесты. Дисциплина держится на культурных конвенциях, а не на gate'ах.
6. **Асимметрия качества**: ядро (debate-runtime, llm/, dal/, events/) — инженерно зрелое с датированными фиксами инцидентов; периферия (rivals13-20, мок-панели, генерированные тесты) — протезы. Средние оценки скрывают бимодальность: ~8/10 ядро / ~3/10 периферия.

---

## 15. Итоговая оценка

| Категория | Оценка |
|---|---:|
| Инженерия ядра (LLM-путь, EventBus, DI, DAL, воркеры) | 8/10 |
| Бизнес-логика дебатов (исходы, память, консенсус) | 3/10 |
| Данные и персистентность | 4/10 |
| Периферия и UI-поверхность (доля симулякров) | 3/10 |
| Синхронизация/многовкладочность | 3/10 |
| Конфигурация и процессы (гейты) | 5/10 |
| Качество кода (типы, чистота) | 7/10 |
| Производительность | 5/10 |
| **Интегральная оценка** | **5.5/10** |

**Резюме одним абзацем.** SuperAgents OS — впечатляющий по масштабу и качеству каркаса browser-only проект с настоящим LLM-ядром, который систематически девальвируется четырьмя вещами: (1) фабрикой симулякров, выдаваемых за функции, (2) конвейером потери текстовых данных прямо в бизнес-критичном дебат-пути (тема аудируемой ветки — закрыта на 1/9), (3) мёртвой синхронизацией/версионированием при позиционировании «OS», (4) отключёнными гейтами качества. Ключевой парадокс: почти все найденные дефекты имеют уже написанный, но неподключённый «правильный» механизм рядом (vault, CAS, fencing-заготовки, FallbackDecorator, updateRatings, ensureSemantic) — проект знает, как надо, но не доводит до подключения.

---

## 16. План исправлений (приоритизированный)

### P0 — критично, эффект за часы/дни (баги-однострочники и critical UX)

1. **TTL памяти**: завести `services.memory.ttlMs` (30 дней) отдельно от cache TTL — one-line fix, максимальный эффект (`memory-engine.ts:27-32`).
2. **`debate-state-builder.ts:102-105`**: исправить индексацию resolved-claims (TypeError в 6-м раунде).
3. **`mockServices.enabled: false`** по умолчанию + дисклеймеры в Python-раннер, Voice Input, NVIDIA SLA, Routing Experiments (`config-registry.ts:288`).
4. **Усечения вердиктов**: убрать/осмыслить `slice(0,500)`/`slice(0,300)` в conclusion-engine:104,397 и sync-manager:594 — тот же класс бага, что чинила ветка.
5. **`trimContent(8)`**: исключить claims из усечения или собирать консенсус из timeline, а не memory.
6. **Таймер таймаута LLM**: очищать после заголовков; отделить time-to-headers от лимита стрима (`llm-http-client.ts:117-152`).
7. **Каст `svc.memories`** → `svc.getMemories()` (7 слоёв памяти оживут).
8. **STREAM_ERROR**: не стирать частично стримленный контент (`chat-event-handlers.ts:141-148`).

### P1 — системно, эффект за недели

9. Сверить реестры: добавить `/proxy`-маршруты для 12+ провайдеров (или убрать их из SUPPORTED_PROVIDERS); перевести research на `/proxy/fetch`; CSP в один источник генерации.
10. Проставлять `version` в `sessionToRecord`/ChatSession — оживить существующий OCC; fencing-токены + heartbeat для DistributedLock; leader election через готовый `isPrimary()`.
11. Убрать `emitOnce` для DEBATE_UPDATED и кросс-таб апдейтов (ключ глотает реальные изменения); глобальный seq `${tabId}:${counter}`.
12. Бэкап: расширить exportToJson до всех 104 таблиц + localStorage-бакетов, повесить на UI; `navigator.storage.persist()`; чистка localStorage при удалении сессий.
13. Подключить мёртвые механизмы: `updateRatings` (Elo), dead-letter consumer, `kernel:reconcile:requested` подписчик, FallbackDecorator в LLMClientService.
14. Включить pre-commit; починить sourcemap-upload (`secrets.*` в if); deploy waits test; разорвать цикл debate-runtime (импорт orchestrator минуя barrel).
15. Схема Dexie: генерировать `versionDefs` из `.stores()`; убрать `content` из индексов memories.

### P2 — стратегически

16. Динамические `import()` для phase-групп и SDK (Google/Groq) — сократить entry с ~3-4 МБ; вынести history чатов в отдельную таблицу сообщений; rAF-батчинг стриминга; мемоизация god-панелей.
17. Решить судьбу rivals13-20 и мок-панелей: честные DemoBadge или удаление; chain-тесты заменить на функциональные.
18. Расшить центральную точку роста: event-registry и registration разбить по доменам.
19. Документация: актуализировать README/AGENTS.md (цифры устарели в 2-3 раза); убрать обещания MiniLM/Transformers.js из встроенной документации.
20. Sandbox: разрешить computed-доступ по whitelist (иначе пометить как экспериментальную).

---

*Отчёт составлен по результатам 11 параллельных аудиторских трассов с перекрёстной байтовoй верификацией критических находок. Все утверждения снабжены ссылками `файл:строка` на ветку `fix-debate-text-truncation` (HEAD `310b535`). Суммарно зафиксировано ~170 подтверждённых находок, из них 14 CRITICAL и ~40 HIGH.*
