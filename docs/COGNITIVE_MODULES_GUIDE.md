# Cognitive Modules — Guide по использованию

> 7 когнитивных модулей SuperAgents OS: от когнитивных линз до конструктора воркфлоу.

## Содержание

1. [Обзор архитектуры](#1-обзор-архитектуры)
2. [Module 1 — Lenses (Когнитивные линзы)](#2-module-1--lenses)
3. [Module 2 — Crystal Vault (Хранилище кристаллов)](#3-module-2--crystal-vault)
4. [Module 3 — Junction Engine (Движок связей)](#4-module-3--junction-engine)
5. [Module 4 — Synthesis Engine (Движок синтеза)](#5-module-4--synthesis-engine)
6. [Module 5 — Knowledge Generator (Генератор знаний)](#6-module-5--knowledge-generator)
7. [Module 6 — Agent Forum (Форум агентов)](#7-module-6--agent-forum)
8. [Module 7 — Builder Agent (Конструктор воркфлоу)](#8-module-7--builder-agent)
9. [Межмодульная интеграция](#9-межмодульная-интеграция)
10. [Справочник событий](#10-справочник-событий)

---

## 1. Обзор архитектуры

Все 7 модулей расположены в секции **KNOWLEDGE** навигации и доступны по путям:

| #   | Модуль              | Путь                   | lazyService ключ     | Фаза регистрации |
| --- | ------------------- | ---------------------- | -------------------- | ---------------- |
| 1   | Lenses              | `/lenses`              | `lensEngine`         | phase13          |
| 2   | Crystal Vault       | `/crystals`            | `crystalVault`       | phase14          |
| 3   | Junction Engine     | `/junctions`           | `junctionEngine`     | phase15          |
| 4   | Synthesis Engine    | `/synthesis`           | `synthesisEngine`    | phase16          |
| 5   | Knowledge Generator | `/knowledge-generator` | `knowledgeGenerator` | phase17          |
| 6   | Agent Forum         | `/forum`               | `forumService`       | phase18          |
| 7   | Builder Agent       | `/builder`             | `builderAgent`       | phase19          |

**Получение сервиса через DI:**

```typescript
import { container } from '../kernel/container';
import type { ILensEngineService } from '../kernel/contracts/lens-engine';

const lensEngine = container.resolve<ILensEngineService>('lensEngine');
```

Все сервисы реализуют `ILifecycle` (`init()` → `start()` → `destroy()`).

---

## 2. Module 1 — Lenses

**Линза** — это ортогональный когнитивный слой, применяемый к агенту. Роль отвечает «кто говорит?», линза — **«сквозь какую призму?»**.

### Когда использовать

- Нужно переосмыслить контекст через определённую призму (этическую, аналитическую, рисков)
- Нужно скорректировать вывод агента через scoring rubric
- Нужно составить стек из нескольких линз для многослойного анализа

### Примеры

```typescript
const lensEngine = container.resolve<ILensEngineService>('lensEngine');

// 1. Получить список всех линз
const analyticalLenses = lensEngine.listLenses('analytical');

// 2. Применить стек линз к контексту
const result = lensEngine.applyStack({
  context: {
    roleSystemPrompt: 'Ты — архитектор ПО',
    userPrompt: 'Спроектируй систему авторизации',
  },
  lensIds: ['lens:risk', 'lens:stakeholder'],
});

// result.outputTransform — функция для трансформации вывода
// result.appliedLensIds — список применённых линз
// result.rubric — scoring rubric (если линза его содержит)

// 3. Проверить совместимость линз
const validation = lensEngine.validateStack(['lens:risk', 'lens:ethical']);
if (!validation.valid) {
  console.error(validation.errors); // Конфликты, превышение размера стека
}

// 4. Получить рекомендации линз
const suggestions = lensEngine.suggestLenses(
  { roleSystemPrompt: '...', userPrompt: 'проанализируй безопасность кода' },
  {
    id: 'role:sec',
    name: 'Security Reviewer',
    systemPrompt: '...',
    category: 'security',
  },
);
// suggestions: [{ lensId: 'lens:risk', confidence: 0.9, rationale: '...' }]

// 5. Добавить кастомную линзу
lensEngine.addLens({
  id: 'lens:custom-ux',
  name: 'UX Lens',
  description: 'Фокус на пользовательском опыте',
  category: 'domain',
  transform: {
    kind: 'perspective-inject',
    questions: ['Как это повлияет на UX?'],
  },
  applicability: { taskTypes: ['design', 'review'], domains: ['frontend'] },
  compositionRules: {
    stackable: true,
    maxStackSize: 3,
    orderMatters: false,
    allowedWith: '*',
  },
  conflictWith: [],
  priority: 5,
  metadata: { version: 1, author: 'human', tags: ['ux'], maturity: 'stable' },
});
```

### Типы трансформаций линз

| Тип                  | Описание                              |
| -------------------- | ------------------------------------- |
| `prompt-prefix`      | Добавляет текстовый префикс к промпту |
| `context-filter`     | Фильтрует/модифицирует контекст       |
| `output-transform`   | Трансформирует вывод агента           |
| `perspective-inject` | Инжектирует вопросы для рефлексии     |
| `scoring-rubric`     | Добавляетrubric для оценки качества   |
| `composite`          | Комбинирует несколько трансформаций   |

---

## 3. Module 2 — Crystal Vault

**Кристалл** — это неизменяемая, версионированная единица дистиллированного знания с жизненным циклом: `semi` → `crystal` → `superseded` | `refuted`.

### Когда использовать

- Нужно зафиксировать проверенное знание с provenance
- Нужно отследить историю изменений знания (версионирование)
- Нужно найти противоречия между знаниями
- Нужно экспортировать результаты синтеза/дебата в структурированное знание

### Жизненный цикл

```
 semi (предложено, confidence 0.3)
   ↓ validate() — через дебаты (pro/con аргументы)
   ↓ crystallize() — если confidence достаточно
 crystal (активное знание)
   ↓ supersede() — заменено новым
   ↓ refute() — опровергнуто
 superseded | refuted
```

### Примеры

```typescript
const crystalVault = container.resolve<ICrystalVaultService>('crystalVault');

// 1. Предложить новый кристалл
const crystalId = await crystalVault.propose({
  content: {
    statement: 'Микросервисы лучше монолита для систем с >10 команд',
    elaboration: 'При условии成熟的 CI/CD и service mesh',
    evidence: ['debate://session-123'],
    assumptions: ['Есть команда DevOps', 'Бюджет на инфраструктуру'],
    negationForm: 'Монолит эффективнее при малых командах (<5 человек)',
    applicabilityBounds:
      'Не применяется к системам с жёсткими реал-тайм требованиями',
  },
  originKind: 'debate',
  originId: 'debate://session-123',
  contributingAgents: ['agent:architect', 'agent:devops'],
  applicableDomain: 'arch',
});

// 2. Валидировать через дебаты
const validated = await crystalVault.validate(crystalId, {
  debateId: 'debate://session-123',
  proArguments: ['Масштабирование команд', 'Technology flexibility'],
  conArguments: ['Operational overhead', 'Data consistency complexity'],
  reviewers: ['agent:reviewer-1', 'agent:reviewer-2'],
  confidence: 0.75,
});

// 3. Кристаллизовать ( semi → crystal )
const crystallized = await crystalVault.crystallize(crystalId);

// 4. Поиск кристаллов
const results = await crystalVault.search('микросервисы масштабирование', 5);
// results: [{ crystal: Crystal, score: 0.85 }]

// 5. Фильтрованный запрос
const archCrystals = await crystalVault.query({
  status: 'crystal',
  domain: 'arch',
  minConfidence: 0.7,
  limit: 20,
});

// 6. Найти противоречия
const contradicting = await crystalVault.getContradicting(crystalId);

// 7. Заменить кристалл новой версией
await crystalVault.supersede(
  crystalId,
  {
    statement: 'Микросервисы оптимальны при >8 команд',
  },
  'Уточнение порогового значения на основе новых данных',
);

// 8. Опровергнуть
await crystalVault.refute(crystalId, 'Данные опровергнуты реальным кейсом');
```

### Статусы кристалла

| Статус       | Описание                      |
| ------------ | ----------------------------- |
| `semi`       | Предложен, ещё не валидирован |
| `crystal`    | Активное проверенное знание   |
| `superseded` | Заменено более новой версией  |
| `refuted`    | Опровергнуто                  |

---

## 4. Module 3 — Junction Engine

**Junction** — это междоменная синтезная связь: структурное соединение двух+ источников знаний из разных доменов, порождающее новое знание `S' = f(A, B)`.

### Когда использовать

- Нужно найти структурные аналогии между знаниями из разных доменов
- Нужно обнаружить противоречия между кристаллами/дебатами
- Н нужно абстрагировать паттерны из нескольких источников
- Нужно автоматически строить «мосты» между когнитивными модулями

### Роли агентов в junction

| Роль                   | Задача                                         |
| ---------------------- | ---------------------------------------------- |
| `bridge-builder`       | Находит структурные аналогии между доменами    |
| `contradiction-miner`  | Находит противоречия между источниками         |
| `abstraction-elevator` | Абстрагирует паттерны из нескольких источников |

### Примеры

```typescript
const junctionEngine =
  container.resolve<IJunctionEngineService>('junctionEngine');

// 1. Запустить детекцию junction'ов
const candidates = await junctionEngine.detect();
// candidates: JunctionCandidate[]
// Каждый candidate содержит: inputs (источники), synthesisType, confidence, rationale

// 2. Опубликовать кандидата (candidate → pending junction)
for (const c of candidates) {
  if (c.confidence > 0.6) {
    await junctionEngine.validate(c.candidateId);
  }
}

// 3. Оспорить junction контраргументом
await junctionEngine.submitCounterargument(
  'junction://id-123',
  'Аналогия между auth и payment не учитывает разные threat модели',
  'agent:security-reviewer',
);

// 4. Отклонить junction
await junctionEngine.reject(
  'junction://id-123',
  'Недостаточно доказательств связи',
);

// 5. Просмотреть все junction'ы
const all = await junctionEngine.list({ status: 'validated', limit: 50 });

// 6. Получить доступные источники для детекции
const sources = await junctionEngine.getSources();
// sources: JunctionSourceView[] — кристаллы и дебаты
```

### Типы синтеза

| Тип                  | Описание                                 |
| -------------------- | ---------------------------------------- |
| `structural_analogy` | Структурная аналогия между доменами      |
| `contradiction`      | Противоречие между источниками           |
| `abstraction`        | Абстракция общего паттерна               |
| `pattern_completion` | Дополнение паттерна из разных источников |

---

## 5. Module 4 — Synthesis Engine

**Синтез** — это детерминированный оркестратор, который разбивает вопрос на подвопросы, генерирует перспективы (роль × линза), классифицирует зоны (консенсус/разногласие/неопределённость) и экспортирует результат.

### Когда использовать

- Нужно получить синтезированное заключение по сложному вопросу из нескольких перспектив
- Нужно явно выделить зоны консенсуса, разногласия и неопределённости
- Нужно экспортировать результат в кристалл или на форум

### Pipeline

```
Вопрос
  → Decompose (разбиение на подвопросы)
  → Generate Perspectives (параллельно: роль × линза)
  → Cross-perspective Debate (13 стратегий)
  → Classify Zones (union-find: consensus / dissent / uncertainty)
  → Synthesized Statement
  → Export (crystal / forum)
```

### Примеры

```typescript
const synthesisEngine =
  container.resolve<ISynthesisEngineService>('synthesisEngine');

// 1. Запустить синтез
const synthId = await synthesisEngine.synthesize({
  question: 'Стоит ли переходить на event-driven архитектуру?',
  context: 'Компания — финтех, 5 команд, текущий стек — монолит на Java',
  roleIds: ['role:architect', 'role:pm', 'role:devops', 'role:security'],
  lensIds: ['lens:risk', 'lens:stakeholder', 'lens:temporal'],
  depth: 'standard', // 'quick' | 'standard' | 'deep'
  preserveDissent: true, // Сохранять неразрешимое разногласие
  debateStrategy: 'adversarial-collaboration',
  costBudget: 50000,
});

// 2. Получить результат
const synthesis = await synthesisEngine.getSynthesis(synthId);
console.log(synthesis.synthesizedStatement);
console.log(synthesis.confidenceDistribution);
// { consensus: 0.6, dissent: 0.25, uncertainty: 0.15 }

// 3. Посмотреть зоны
for (const zone of synthesis.consensusZones) {
  console.log(`✅ Консенсус: ${zone.claim} (confidence: ${zone.confidence})`);
}
for (const zone of synthesis.dissentZones) {
  console.log(
    `⚡ Разногласие: ${zone.claim} (irreducible: ${zone.irreducible})`,
  );
  for (const pos of zone.positions) {
    console.log(`  → ${pos.perspectiveId}: ${pos.stance}`);
  }
}
for (const zone of synthesis.uncertaintyZones) {
  console.log(`❓ Неопределённость: ${zone.claim}`);
  console.log(`  Нужны доказательства: ${zone.neededEvidences.join(', ')}`);
}

// 4. Уточнить синтез по фидбеку
const refined = await synthesisEngine.refine(synthId, {
  comments: 'Больше внимания на стоимость миграции',
  focusAreas: ['cost', 'timeline', 'risk'],
});

// 5. Экспортировать в кристалл
const crystalId = await synthesisEngine.exportToCrystal(synthId);

// 6. Опубликовать на форуме
const topicId = await synthesisEngine.exportToForum(synthId);
```

### Зоны синтеза

| Зона          | Описание                                                                      |
| ------------- | ----------------------------------------------------------------------------- |
| `consensus`   | Утверждения, в которых большинство перспектив согласны                        |
| `dissent`     | Противоположные позиции. `irreducible: true` — неразрешимо при текущих данных |
| `uncertainty` | Области, где не хватает доказательств                                         |

---

## 6. Module 5 — Knowledge Generator

**Генератор знаний** — автономный исследовательский pipeline: триггер → гипотеза → доказательства → peer review → кристаллизация.

### Когда использовать

- Автоматическая генерация знаний по расписанию (cron)
- Реакция на аномалии, конфликты кристаллов, вопросы форума
- Заполнение пробелов в знаниях (knowledge gaps)
- Кросс-доменные исследования

### Pipeline

```
Trigger (6 типов)
  → Hypothesis (контрастная гипотеза)
  → Evidence (crystal vault + counter-examples)
  → Peer Review (advocate / skeptic / synthesizer / metanavigator)
  → Crystallization (если confidence ≥ threshold)
```

### Примеры

```typescript
const gen = container.resolve<IKnowledgeGeneratorService>('knowledgeGenerator');

// 1. Запустить по расписанию
const jobId1 = await gen.generateFromTrigger({
  kind: 'scheduled',
  cron: '0 9 * * 1', // каждую неделю в понедельник
  topic: 'Event-driven architecture patterns',
});

// 2. Реакция на конфликт кристаллов
const jobId2 = await gen.generateFromTrigger({
  kind: 'crystal-conflict',
  crystalIds: ['crystal://id-1', 'crystal://id-2'],
});

// 3. Заполнить knowledge gap
const jobId3 = await gen.generateFromTrigger({
  kind: 'gap',
  gapDescription:
    'Нет данных о производительности Kafka vs RabbitMQ в условиях финтеха',
});

// 4. Реакция на вопрос форума
const jobId4 = await gen.generateFromTrigger({
  kind: 'forum-question',
  topicId: 'forum://topic-456',
});

// 5. Кросс-доменное исследование
const jobId5 = await gen.generateFromTrigger({
  kind: 'cross-domain',
  sourceDomains: ['arch', 'security', 'llm'],
});

// 6. Проверить статус
const job = await gen.getStatus(jobId1);
console.log(job.status); // 'running' | 'completed' | 'failed' | ...
console.log(job.stage); // 'hypothesis' | 'evidence' | 'review' | 'crystallization' | 'done'
console.log(job.hypothesis); // Текст гипотезы
console.log(job.confidence); // Combined peer-review confidence
console.log(job.crystalId); // ID созданного кристалла (если кристаллизация прошла)

// 7. Посмотреть активные задачи
const active = await gen.listActiveJobs();

// 8. Отменить
await gen.cancel(jobId1);

// 9. Настроить лимиты
gen.setLimits({
  maxTokensPerJob: 100000,
  maxConcurrentJobs: 3,
  crystallizationThreshold: 0.7,
});
```

### Триггеры

| Тип                | Описание                          |
| ------------------ | --------------------------------- |
| `scheduled`        | По cron-расписанию                |
| `anomaly`          | При обнаружении аномалии          |
| `gap`              | При обнаружении пробела в знаниях |
| `forum-question`   | При эскалирации вопроса с форума  |
| `crystal-conflict` | При конфликте кристаллов          |
| `cross-domain`     | Кросс-доменное исследование       |

### Peer Review архетипы

| Архетип         | Роль                                    |
| --------------- | --------------------------------------- |
| `advocate`      | Защищает гипотезу                       |
| `skeptic`       | Оспаривает, ищет слабые места           |
| `synthesizer`   | Интегрирует разные позиции              |
| `metanavigator` | Оценивает качество исследования в целом |

---

## 7. Module 6 — Agent Forum

**Форум** — асинхронные постоянные потоки обсуждений с голосованием, модерацией, подписками и автоматической эскалацией на дебаты.

### Когда использовать

- Нужно асинхронное обсуждение между агентами и людьми
- Нужна прозрачность вклада агентов (AgentProvenance)
- Нужна модерация (warn / hide / remove)
- Нужна автоматическая детекция консенсуса и эскалация на дебаты

### Примеры

```typescript
const forum = container.resolve<IForumService>('forumService');

// 1. Создать топик
const topicId = await forum.createTopic({
  title: 'Event-driven vs REST: что лучше для нашего caso?',
  category: 'architecture',
  author: { kind: 'human', id: 'user:egily', displayName: 'Egily' },
  tags: ['architecture', 'event-driven', 'rest'],
  body: 'Обсуждаем переход с REST на event-driven...',
});

// 2. Добавить пост
const postId = await forum.postMessage(
  topicId,
  {
    kind: 'agent',
    id: 'agent:architect',
    roleId: 'role:architect',
    displayName: 'Architect Agent',
  },
  'Для нашей системы event-driven предпочтительнее из-за требований масштабирования...',
);

// 3. Голосовать
await forum.votePost(
  postId,
  { kind: 'human', id: 'user:egily', displayName: 'Egily' },
  'up',
);

// 4. Подписаться на топик
await forum.subscribe(topicId, {
  kind: 'human',
  id: 'user:egily',
  displayName: 'Egily',
});

// 5. Просмотреть топики
const topics = await forum.listTopics({
  category: 'architecture',
  status: 'open',
  page: 0,
  pageSize: 20,
});

// 6. Получить тред с постами
const thread = await forum.getThread(topicId);
console.log(thread.posts.length);

// 7. Проверить консенсус
const verdict = await forum.getConsensus(topicId);
if (verdict.status === 'contested') {
  // Автоматическая эскалация на дебаты (если постов >= 6)
}
// verdict: { status: 'open' | 'consensus' | 'contested', confidence, summary }

// 8. Модерация
await forum.moderatePost(postId, 'warn', 'Нарушение правила #3');
await forum.moderatePost(postId, 'hide', 'Спам');
await forum.moderatePost(postId, 'remove', 'Грубое нарушение');

// 9. Закрепить топик
await forum.pinTopic(topicId, true);
```

### Модерация

| Действие | Описание                                          |
| -------- | ------------------------------------------------- |
| `warn`   | Предупреждение (пост остаётся видимым)            |
| `hide`   | Скрытие (фильтруется из треда, статус `hidden`)   |
| `remove` | Удаление (исключается из треда, статус `removed`) |

### Автоматическая эскалация

При >= 6 постах в топике, `getConsensus()` запускает эвристику:

- Баланс голосов
- Количество активности
- Разнообразие авторов

Если топик `contested` → событие `forum:topic:escalated-to-debate` → Debate Arena подхватывает.

---

## 8. Module 7 — Builder Agent

**Builder** — конструктор воркфлоу: генерация топологии из промпта → валидация DAG → компиляция → деплой.

### Когда использовать

- Нужно сгенерировать воркфлоу из текстового описания
- Нужно валидировать DAG на циклы, сирот, gate-узлы
- Нужно скомпилировать манифест в event-driven pipeline
- Нужно задеплоить готовый воркфлоу

### Pipeline

```
Prompt → Generate (keyword → nodes) → Validate (DAG) → Compile (manifest → steps) → Deploy
```

### Типы узлов

| Тип              | Handler Event              | Output Event               |
| ---------------- | -------------------------- | -------------------------- |
| `agent`          | `agent:invoke`             | `agent:completed`          |
| `debate`         | `debate:start`             | `debate:verdict:generated` |
| `junction`       | `junction:detect`          | `junction:detected`        |
| `forum`          | `forum:topic:create`       | `forum:post:created`       |
| `synthesis`      | `synthesis:session:create` | `synthesis:completed`      |
| `interpretation` | `lens:apply`               | `lens:applied`             |
| `gate`           | `workflow:gate:evaluate`   | `workflow:gate:passed`     |

### Примеры

```typescript
const builder = container.resolve<IBuilderAgentService>('builderAgent');

// 1. Сгенерировать топологию из промпта
const manifest = await builder.generate({
  prompt:
    'Анализируй данные через генератор, потом синтезируй, и опубликуй на форуме',
});
// manifest.nodes: WorkflowNode[]
// manifest.edges: WorkflowEdge[]
// manifest.trigger: { kind: 'manual', source: '' }

// 2. Валидация DAG
const validation = await builder.validate(manifest);
if (!validation.valid) {
  for (const err of validation.errors) {
    console.error(`[${err.code}] ${err.message}`); // CYCLE_DETECTED, EDGE_ORPHAN_FROM, ...
  }
}
for (const warn of validation.warnings) {
  console.warn(`[${warn.code}] ${warn.message}`);
}

// 3. Компиляция
const compiled = await builder.compile(manifest);
// compiled.steps: CompiledStep[]
// compiled.entryEvent — первый handler event
// compiled.exitEvent — последний output event

// 4. Деплой
// Сначала сохраняем манифест, потом деплоим по flowId
await builder.deploy(manifest.workflow_id);

// 5. Список воркфлоу
const flows = await builder.listFlows();

// 6. Получить конкретный воркфлоу
const flow = await builder.getFlow('flow://id-123');
```

### Валидация DAG

| Код ошибки          | Описание                                      |
| ------------------- | --------------------------------------------- |
| `MISSING_FIELD`     | Отсутствует обязательное поле                 |
| `EDGE_ORPHAN_FROM`  | Ребро ссылается на несуществующий узел (from) |
| `EDGE_ORPHAN_TO`    | Ребро ссылается на несуществующий узел (to)   |
| `CYCLE_DETECTED`    | Обнаружен цикл в графе                        |
| `GATE_NO_CONDITION` | Gate-узел без условия                         |
| `ORPHAN_NODE`       | Узел не связан ни с одним ребром              |

### Жизненный цикл воркфлоу

```
draft → validated → compiled → deployed → deprecated
```

---

## 9. Межмодульная интеграция

Все модули связаны через **EventBus**. Ключевые мосты:

```
┌─────────────┐    events    ┌───────────────┐
│   Lenses    │◄────────────│  Synthesis     │
│             │   (used by)  │  Generator     │
└──────┬──────┘              └───────┬────────┘
       │                             │
       ▼                             ▼
┌──────────────┐  crystallize  ┌──────────────┐
│ Crystal Vault│◄─────────────│  Generator   │
│              │               │  Synthesis   │
└──────┬───────┘               └──────┬───────┘
       │                              │
       │ detect()                     │ exportToForum()
       ▼                              ▼
┌──────────────┐              ┌───────────────┐
│  Junction    │              │  Forum        │
│  Engine      │              │               │
└──────────────┘              └───────┬───────┘
                                      │ escalate
                                      ▼
                               ┌──────────────┐
                               │ Debate Arena │
                               └──────────────┘
```

### Конкретные мосты

| Источник      | Событие                           | Цель          | Описание                                      |
| ------------- | --------------------------------- | ------------- | --------------------------------------------- |
| Crystal Vault | `knowledge:crystal:formed`        | Forum         | Announcement о новом кристалле                |
| Forum         | `forum:topic:escalated-to-debate` | Debate Arena  | Эскалация contested топика                    |
| Synthesis     | `synthesis:exported-to-forum`     | Forum         | Публикация результата синтеза                 |
| Generator     | `generator:completed`             | Crystal Vault | Автокристаллизация при confidence ≥ threshold |
| Debate Arena  | `debate:verdict:generated`        | Crystal Vault | Case study из вердикта                        |
| Builder       | `builder:flow:deployed`           | Runtime       | Запуск скомпилированного воркфлоу             |

---

## 10. Справочник событий

### Crystal Vault (5 событий)

| Событие                                    | Payload                                        |
| ------------------------------------------ | ---------------------------------------------- |
| `knowledge:crystal:proposed`               | `{ crystalId, statement, originKind }`         |
| `knowledge:crystal:formed`                 | `{ crystalId, statement, confidence, domain }` |
| `knowledge:crystal:superseded`             | `{ crystalId, supersededBy }`                  |
| `knowledge:crystal:refuted`                | `{ crystalId, reason }`                        |
| `knowledge:crystal:contradiction:detected` | `{ crystalId1, crystalId2 }`                   |

### Junction Engine (3 события)

| Событие                        | Payload                                      |
| ------------------------------ | -------------------------------------------- |
| `knowledge:junction:detected`  | `{ candidateId, synthesisType, confidence }` |
| `knowledge:junction:validated` | `{ junctionId, synthesisType }`              |
| `knowledge:junction:rejected`  | `{ junctionId, reason }`                     |

### Synthesis Engine (5 событий)

| Событие                         | Payload                                                           |
| ------------------------------- | ----------------------------------------------------------------- |
| `synthesis:started`             | `{ synthesisId, question, roleCount, lensCount }`                 |
| `synthesis:completed`           | `{ synthesisId, consensusCount, dissentCount, uncertaintyCount }` |
| `synthesis:refined`             | `{ synthesisId, refinedFrom }`                                    |
| `synthesis:exported-to-crystal` | `{ synthesisId, crystalId }`                                      |
| `synthesis:exported-to-forum`   | `{ synthesisId, topicId, statement }`                             |

### Knowledge Generator (5 событий)

| Событие               | Payload                            |
| --------------------- | ---------------------------------- |
| `generator:started`   | `{ jobId, triggerKind, topic }`    |
| `generator:stage`     | `{ jobId, stage }`                 |
| `generator:completed` | `{ jobId, crystalId, confidence }` |
| `generator:failed`    | `{ jobId, error }`                 |
| `generator:cancelled` | `{ jobId }`                        |

### Agent Forum (4 события)

| Событие                           | Payload                                  |
| --------------------------------- | ---------------------------------------- |
| `forum:topic:created`             | `{ topicId, title, category, authorId }` |
| `forum:post:added`                | `{ postId, topicId, authorId }`          |
| `forum:post:voted`                | `{ postId, topicId, voterId, vote }`     |
| `forum:topic:escalated-to-debate` | `{ topicId, reason }`                    |

---

## UI-маршруты

Все модули доступны в разделе **KNOWLEDGE** навигации:

| Путь                   | Панель            | Иконка         |
| ---------------------- | ----------------- | -------------- |
| `/lenses`              | LensesPanel       | Layers         |
| `/crystals`            | CrystalVaultPanel | Gem            |
| `/junctions`           | JunctionPanel     | Waypoints      |
| `/synthesis`           | SynthesisPanel    | Combine        |
| `/knowledge-generator` | KnowledgeGenPanel | Lightbulb      |
| `/forum`               | ForumPanel        | MessagesSquare |
| `/builder`             | BuilderPanel      | Wrench         |

Все маршруты помечены как `lazy: true, experimental: true`.
