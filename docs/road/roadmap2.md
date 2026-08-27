Я кратко посмотрю на структуру репозитория, чтобы дать конкретные советы, привязанные к вашей архитектуре, а не общие.
Изучил ваш проект — это **SuperAgents OS v4.5.0** (TS/React/Vite, local-first, EventBus + DI-контейнер, 12 фаз регистрации сервисов, уже есть Knowledge Graph, Memory Mesh, Debate Arena, IAgentProtocolService, CommunityHub). Ниже — конкретные архитектурные рекомендации, привязанные к вашей кодовой базе, по всем шести вопросам.

---

## 1. Форум для агентов и людей (архитектурный подход)

У вас уже есть `CommunityHub`, `GroupsPanel`, `ContributionGraph`, контракт `group-manager.ts` и `IAgentProtocolService` (agent-to-agent сообщения с `capability`, `ttl`, `traceId`). Классический phpBB-форум здесь — это не замена, а **новая модальностьповерх существующих абстракций**: персистентные треды вместо эфемерных сообщений, голосования вместо handoffs, репутация вместо Elo-лидерборда агентов.

### Рекомендуемая архитектура

Не встраивайте phpBB (PHP/MySQL) внутрь браузерного приложения — у вас local-first IndexedDB-стек. Сделайте **нативный модуль SuperAgents Forum**, повторяющий phpBB-модель, но на вашем стеке. Структура:

**Новый контракт** `src/kernel/contracts/forum.ts`:
```typescript
export interface IForumService extends ILifecycle {
  createTopic(input: CreateTopicInput): Promise<TopicId>;
  postMessage(topicId: TopicId, author: ForumAuthor, body: string, tx?: ITransaction): Promise<PostId>;
  votePost(postId: PostId, voter: ForumAuthor, vote: 'up'|'down'): Promise<void>;
  subscribe(topicId: TopicId, subscriber: ForumAuthor): Promise<void>;
  listTopics(filter: TopicFilter): Promise<Paginated<Topic>>;
  getThread(topicId: TopicId, opts?: { sincePostId?: PostId }): Promise<ForumThread>;
  pinTopic(topicId: TopicId, pinned: boolean): Promise<void>;
  moderatePost(postId: PostId, action: ModerationAction): Promise<void>;
}

// Унифицированный автор — человек ИЛИ агент
export interface ForumAuthor {
  kind: 'human' | 'agent';
  id: string; // userId или agentId
  roleId?: string; // если агент — какая роль
  displayName: string;
}

export interface Topic {
  id: string; title: string; category: ForumCategory;
  author: ForumAuthor; createdAt: number; lastActivityAt: number;
  postsCount: number; pinned: boolean; locked: boolean;
  tags: string[]; participants: ForumAuthor[];
  linkedCrystalId?: string; // ← связь с Knowledge Crystal (см. §2)
  linkedLensId?: string; // ← связь с Lens (см. §3)
  linkedDebateId?: string; // ← связь с Debate Arena
}

export interface Post {
  id: string; topicId: string; author: ForumAuthor;
  body: string; renderedHtml: string; // markdown → html
  parentId?: string; // тредирование
  createdAt: number; editedAt?: number;
  score: number; votes: VoteRecord[];
  attachments: PostAttachment[]; // crystals, lenses, traces
  agentProvenance?: AgentProvenance; // traceId, modelId, tokens
  moderation: ModerationState;
}
```

**Регистрация** — новая фаза `src/kernel/service-registration/phase12-forum.ts`:
```typescript
// phase12-forum.ts
import { container } from '../container';
import { ForumService } from '../services/forum/forum-service';
import { IForumService, FORUM_EVENTS } from '../contracts/forum';

export function registerForumPhase(deps: PhaseDeps) {
  container.register<IForumService>('IForumService', {
    factory: () => new ForumService(deps.eventBus, deps.dal, deps.debateRuntime),
    lifecycle: 'singleton',
  });

  // Подписки на события других подсистем
  deps.eventBus.onSafe('debate:finished', (e) => {
    // Автоматически создавать форум-топик из завершённого дебата
    deps.container.resolve<IForumService>('IForumService')
      .createTopicFromDebate(e.payload.debateId);
  });

  // Когда кристаллизуется знание — анонс в форуме
  deps.eventBus.onSafe('knowledge:crystal:formed', (e) => {
    deps.container.resolve<IForumService>('IForumService')
      .announceCrystal(e.payload.crystalId);
  });
}
```

**Персистентность** — новая таблица в Dexie (см. `kernel/dal/`):
```typescript
// dal/forum-schema.ts
db.version(N).stores({
  forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
  forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
  forumVotes: 'id, postId, voterId, [postId+voterId]',
  forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
});
```

**UI** — `src/components/ForumPanel/`:
- `ForumPanel.tsx` (главный, в `routes.tsx` добавить `/forum`)
- `TopicList.tsx`, `TopicView.tsx`, `PostComposer.tsx`, `AuthorBadge.tsx` (разный стиль для human/agent), `ModerationQueue.tsx`, `ForumCategoryTree.tsx`

### Ключевая фишка — двойное гражданство агентов

Агент в форуме = не отдельный пользователь, а **полноправный участник с provenance-трейлом**. Каждое сообщение агента содержит `agentProvenance: { traceId, modelId, roleId, lensId?, tokensCost, parentPostIds[] }` — это позволяет:
- в UI рендерить «прозрачную карточку» с развёрткой того, через какие роли/линзы/промпты прошёл агент, чтобы написать пост;
- модератору-человеку видеть цепочку рассуждений и откатывать/блокировать конкретные следствия;
- сравнивать качество постов агентов в одном треде через вашу существующую Elo-систему (`AgentComparisonPanel`).

### Мост к внешнему phpBB (если всё-таки нужен)

Если бизнес-требование — именно phpBB (для интеграции с существующим сообществом), делайте **двухсторонний bridge-сервис** на стороне `server/` (расширение `sync-server.mjs`):
- в `server/forum-bridge.mjs` — Node-воркер, читающий phpBB MySQL через `mysql2` и публикующий события в WebSocket-канал;
- на клиенте — `phpBBMirrorService` подписывается на WebSocket и материализует посты в IndexedDB (offline-first);
- запись — в обе стороны: post в SuperAgents Forum → bridge → phpBB MySQL, и наоборот (webhook phpBB → bridge → WS → клиенты).

Но это резко усложняет деплой (нужен MySQL + PHP-FPM + cron). Для агентов более естественен нативный форум, чем мост в legacy-систему. Подробно альтернативы см. в §6.

---

## 2. Кристал знаний (Knowledge Crystal)

«Кристалл знаний» — это сильная концепция, и она у вас уже почти есть в виде Knowledge Graph (`src/components/KnowledgePanel/KnowledgeGraph.tsx`), но сейчас граф — это **UI-first** сущность без ядерного контракта. Кристалл = **иммутабельная, версионированная, провенированная единица знания с lifecycle**.

### Концептуальная модель

Знание проходит три фазы, и только третья — кристалл:

| Фаза | Имя | Свойства | Где живёт |
|---|---|---|---|
| 1 | **Liquid** (жидкое) | Эфемерные инсайты из чата/дебатов, без верификации | Memory Mesh |
| 2 | **Semi-crystal** (полукристалл) | Гипотеза, прошедшая первичную проверку, awaiting peer review | Knowledge Graph + очередь валидации |
| 3 | **Crystal** (кристалл) | Версионированный, иммутабельный, с confidence + provenance + counter-evidence | Crystal Vault (отдельная Dexie-таблица) |

Кристалл **никогда не мутирует** — вместо этого создаётся новая версия (`crystalId` стабильный, `version` растёт), старая помечается superseded. Это даёт полную историю эволюции знания — критично для аудита агентских решений.

### Контракт `src/kernel/contracts/knowledge-crystal.ts`

```typescript
export interface ICrystalVaultService extends ILifecycle {
  propose(input: ProposeCrystalInput): Promise<CrystalId>; // создаёт semi-crystal
  validate(crystalId: CrystalId, debateId: string): Promise<ValidationResult>;
  crystallize(crystalId: CrystalId): Promise<CrystalVersion>; // semi → crystal
  supersede(crystalId: CrystalId, newContent: CrystalContent, reason: string): Promise<CrystalVersion>;
  get(crystalId: CrystalId, version?: number): Promise<Crystal | null>;
  query(q: CrystalQuery): Promise<Crystal[]>; // семантический поиск
  linkToLens(crystalId: CrystalId, lensId: string): Promise<void>;
  getContradicting(crystalId: CrystalId): Promise<Crystal[]>; // контр-доказательства
}

export interface Crystal {
  crystalId: string; // стабильный
  version: number; // растёт
  content: CrystalContent; // утверждение + контекст + границы применимости
  provenance: CrystalProvenance; // кто/что/как создал
  validation: CrystalValidation; // debateId, scores, reviewers
  confidence: number; // 0..1, вычисляется из validation
  status: 'semi' | 'crystal' | 'superseded' | 'refuted';
  supersededBy?: string;
  contradictingCrystalIds: string[];
  supportingCrystalIds: string[];
  linkedLensIds: string[]; // через какие линзы валидно
  linkedRoleIds: string[]; // какие роли применяли
  applicableDomain: CrystalDomain; // где применимо (границы)
  createdAt: number; crystallizedAt?: number;
  contentHash: string; // sha256(content) для целостности
}

export interface CrystalContent {
  statement: string; // одно-предложенческое утверждение
  elaboration: string; // развёрнутое объяснение
  evidence: Evidence[]; // источники, эксперименты, ссылки
  assumptions: string[]; // явные допущения
  negationForm: string; // формулировка отрицания — для дебатов
  applicabilityBounds: string; // когда НЕ работает
}

export interface CrystalProvenance {
  originKind: 'debate' | 'observation' | 'synthesis' | 'human' | 'imported';
  originId: string; // debateId / sessionId / userId / external URL
  contributingAgents: ForumAuthor[]; // все агенты, давшие вклад
  contributingRoles: string[]; // роли
  contributingLenses: string[]; // линзы
  modelIds: string[];
  totalTokensSpent: number;
  debateRounds: number;
}

export interface CrystalValidation {
  debateId: string; // ID дебата, валидировавшего кристалл
  proArguments: Argument[]; // за (из Debate Arena)
  conArguments: Argument[]; // против
  proScore: number; // взвешенный
  conScore: number;
  reviewers: ForumAuthor[]; // агенты-рецензенты (роль 'reviewer')
  humanApproved: boolean;
  humanApproverId?: string;
}
```

### Сервис и персистентность

`src/kernel/services/crystal-vault/crystal-vault-service.ts`:
- использует `kernel/workers/memory.worker.ts` для эмбеддингов (поиск по кристаллам);
- при `crystallize()` эмиттит событие `knowledge:crystal:formed` (которое подписчики в §1 форуме и §5 синтезаторе ловят);
- `getContradicting()` — критично: при добавлении нового кристалла сервис ищет семантически близкие существующие кристаллы и автоматически формирует `contradictingCrystalIds` (это запускает «контр-дебат» в Debate Arena для разрешения конфликта).

Dexie:
```typescript
db.version(N).stores({
  crystals: 'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
  crystalVersions: '[crystalId+version], crystalId',
  crystalEmbeddings: 'crystalId, vector[*]', // 384-dim, Orama
});
```

### Жизненный цикл кристаллизации

1. **Liquid → Semi**: агент или человек в чате формулирует инсайт → `ICrystalVaultService.propose()` создаёт semi-crystal с `status: 'semi'`, `confidence: 0.3`. Этот шаг дёшев, его может делать любой.
2. **Semi → Crystal**: semi-crystal попадает в очередь валидации → Debate Arena проводит структурированный дебат (роль-«адвокат» защищает, роль-«скептик» атакует, роль-«синтезатор» подводит итог — см. §5) → по результату `crystallize()` или отклонение.
3. **Crystal → Superseded**: найден контр-кристалл или новые данные → `supersede()` создаёт новую версию, старая → `superseded`.
4. **Crystal → Refuted**: накопилось достаточно контр-доказательств → `status: 'refuted'`, но **не удаляется** (аудит).

### Связи с другими подсистемами

- **Knowledge Graph**: каждый кристалл = узел в графе; ребро «contradicts/supports/refines» между кристаллами.
- **Memory Mesh**: liquid-знания живут в памяти, кристаллы ссылаются на свои liquid-источники.
- **Debate Arena**: каждый кристалл имеет «защитный» debateId; попытка опровергнуть → новый дебат, результат → supersede.
- **Форум (§1)**: при кристаллизации автопостится анонс в категорию `Knowledge Announcements`, люди и агенты могут комментировать.

---

## 3. Линзы (Lenses) — ортогональная ось к ролям

У вас уже хорошо развита подсистема ролей (`role-types.ts` с `RolePermission`, `RoleMetadata`, `parentRoleId` для иерархии; `role-library.ts` с пресетами; consortia). Роль отвечает на вопрос **«кто»** (персона с набором прав). Линза отвечает на вопрос **«через какую призму смотреть»** — это **точка зрения**, не личность.

### Концептуальное различие

| | Роль (Role) | Линза (Lens) |
|---|---|---|
| Отвечает на | Кто говорит? | Через что смотрит? |
| Изменяет | system prompt, права, температуру | применяет transform к контексту/выводу |
| Иерархия | parentRoleId (консорциумы) | compose с другими линзами |
| Примеры | senior-dev, security-auditor, debugger | critical-lens, optimistic-lens, economic-lens, security-lens, long-term-lens, second-order-effects-lens |
| Длительность | Сессия / весь агент | Один промпт / один проход |
| Композиция | Роль → одна | Линзы → стек (несколько одновременно) |

### Контракт `src/kernel/types/lens-types.ts`

```typescript
export interface Lens {
  id: string;
  name: string;
  description: string;
  category: LensCategory; // 'analytical' | 'ethical' | 'temporal' | 'domain' | 'risk' | 'stakeholder'
  transform: LensTransform; // как именно меняет контент
  applicability: LensApplicability; // к каким задачам применима
  compositionRules: LensComposition; // с какими другими линзами сочетается
  conflictWith: string[]; // какие линзы взаимоисключают
  priority: number; // при конфликте — кто побеждает
  isBuiltin?: boolean;
  metadata: LensMetadata;
}

export type LensTransform =
  | { kind: 'prompt-prefix'; text: string } // добавляет префикс в system prompt
  | { kind: 'context-filter'; predicate: (ctx: Context) => Context } // фильтрует контекст
  | { kind: 'output-transform'; fn: (output: string, ctx: Context) => string } // пост-обработка вывода
  | { kind: 'perspective-inject'; questions: string[] } // добавляет вопросы для самопроверки
  | { kind: 'scoring-rubric'; rubric: ScoringRubric } // оценивает вывод по рубрике
  | { kind: 'composite'; transforms: LensTransform[] }; // комби

export interface LensComposition {
  stackable: boolean; // можно ли применять несколько
  maxStackSize: number;
  orderMatters: boolean;
  allowedWith: string[] | '*';
}

// Библиотека предустановленных линз — аналог role-library.ts
export const LENS_LIBRARY: Lens[] = [
  {
    id: 'lens:critical',
    name: 'Critical Lens',
    description: 'Активно ищет слабые места, неявные допущения, контрпримеры',
    category: 'analytical',
    transform: {
      kind: 'perspective-inject',
      questions: [
        'Какое неявное допущение лежит в основе этого вывода?',
        'Какой контрпример опровергнет это утверждение?',
        'Какие данные могли бы изменить заключение?',
        'Где граница применимости этого утверждения?'
      ]
    },
    // ...
  },
  {
    id: 'lens:second-order',
    name: 'Second-Order Effects',
    description: 'Рассматривает последствия второго и третьего порядка',
    category: 'temporal',
    transform: { kind: 'prompt-prefix', text: 'Перед ответом проанализируй последствия 2-го и 3-го порядка. Что изменится через 1 месяц, 1 год, 5 лет?' },
    // ...
  },
  {
    id: 'lens:security',
    name: 'Security Lens',
    description: 'Adversarial perspective: ищет векторы атак, утечки, привилегии',
    category: 'risk',
    // ...
  },
  {
    id: 'lens:economic',
    name: 'Economic Lens',
    description: 'Анализирует через incentive structures и trade-offs',
    category: 'domain',
    // ...
  },
  {
    id: 'lens:stakeholder-multi',
    name: 'Multi-Stakeholder',
    description: 'Рассматривает с позиции каждого стейкхолдера по очереди',
    category: 'stakeholder',
    // ...
  },
];
```

### Применение: композиция роль × линзы

В существующий `Role` добавить опциональное поле `defaultLensIds?: string[]`, а в **агента** (не роль!) — активный стек линз:

```typescript
// Расширение агента (contracts/agent.ts)
export interface Agent {
  // ... существующие поля
  activeLensStack: LensStackEntry[]; // активные линзы в порядке применения
}

export interface LensStackEntry {
  lensId: string;
  appliedAt: number;
  appliedBy: 'human' | 'agent-self' | 'orchestrator';
  scope: 'session' | 'single-turn' | 'single-tool-call';
  reason?: string;
}
```

**Сервис применения линз** — `src/kernel/services/lens-engine/lens-engine-service.ts`:
```typescript
export interface ILensEngineService {
  applyStack(input: ApplyLensInput): Promise<TransformedContext>;
  validateStack(lensIds: string[]): ValidationResult; // конфликты, размер
  suggestLenses(context: Context, role: Role): LensSuggestion[]; // по контексту
}

// Цепочка трансформации:
// 1. role.systemPrompt
// 2. for each lens in stack: apply transform (prompt-prefix → context-filter → perspective-inject)
// 3. → LLM call
// 4. for each lens in stack (reverse): apply output-transform (например, scoring-rubric)
// 5. → final output
```

### Регистрация и UI

- **Регистрация**: расширить `phase8-roles-consortia.ts` (или создать `phase13-lenses.ts`) — регистрирует `ILensEngineService`, загружает `LENS_LIBRARY` в DI, подписывается на события.
- **UI**: `src/components/LensesPanel/` — `LensesPanel.tsx`, `LensEditorModal.tsx`, `LensStackVisualizer.tsx` (визуализация стека как слоёв), `LensCompositionMatrix.tsx` (какие линзы совместимы).
- **Интеграция с Team Pipeline**: в визуальном DAG-builder (`TeamPipeline`) добавить ноду `LensNode` — теперь пайплайн может применять линзу к потоку между агентами.

### Связь с кристаллами (§2)

`linkedLensIds` в кристалле означает: кристалл **валиден** только при рассмотрении через эти линзы. Например, кристалл «Go лучше Python для CLI-инструментов» может иметь `linkedLensIds: ['lens:performance', 'lens:maintainability']` и `contradictingCrystalIds` с кристаллом, у которого `linkedLensIds: ['lens:ecosystem', 'lens:time-to-market']`. Это даёт **многомерное** знание, а не плоское.

---

## 4. Модуль генерации новых знаний

Да, это возможно и естественно ложится в вашу архитектуру — у вас уже есть `phase9-research-engine` и Debate Arena (25 агентов, 13 стратегий). Генерация новых знаний = **исследовательский цикл**, выходом которого являются новые semi-кристаллы (§2).

### Архитектура Knowledge Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│ KNOWLEDGE GENERATION ENGINE │
│ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│ │ Trigger │ → │ Hypothesis│ → │ Evidence │ → │ Peer │ → │Crystal ││
│ │ Sources │ │ Generator │ │ Collector │ │ Review │ │Vault ││
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘│
│ │ │ │ │ │ │
│ ▼ ▼ ▼ ▼ ▼ │
│ - schedule - LLM call - tools - Debate - §2 │
│ - anomaly - lens stack - web-search - Arena vault │
│ - human ask - role rotation - memory - 25 agents │
│ - gap-detect - contrastive - forum - consensus │
│ - forum Q - analogical - crystals - conflict │
└─────────────────────────────────────────────────────────────────────────┘
```

### Контракт `src/kernel/contracts/knowledge-generator.ts`

```typescript
export interface IKnowledgeGeneratorService extends ILifecycle {
  generateFromTrigger(trigger: GenerationTrigger): Promise<GenerationJobId>;
  getStatus(jobId: GenerationJobId): Promise<GenerationJob>;
  cancel(jobId: GenerationJobId): Promise<void>;
  listActiveJobs(): Promise<GenerationJob[]>;
}

export type GenerationTrigger =
  | { kind: 'scheduled'; cron: string; topic: string }
  | { kind: 'anomaly'; detectedAnomalyId: string } // из observability
  | { kind: 'gap'; gapDescription: string } // человек нашёл пробел
  | { kind: 'forum-question'; topicId: string } // из форума (§1)
  | { kind: 'crystal-conflict'; crystalIds: string[] } // 2+ противоречащих кристалла
  | { kind: 'cross-domain'; sourceDomains: string[] }; // синтез из разных областей

export interface GenerationJob {
  id: string; trigger: GenerationTrigger;
  status: 'hypothesizing' | 'evidence-gathering' | 'reviewing' | 'crystallizing' | 'done' | 'failed';
  hypothesis?: CrystalContent; // сгенерированная гипотеза
  evidenceCollected?: Evidence[];
  debateId?: string; // ID peer review debate
  resultingCrystalId?: string; // финальный semi-crystal
  costTracker: { tokens: number; usd: number; durationMs: number };
  traceId: string;
}
```

### Реализация стадий

**Stage 1 — Hypothesis Generator**: берёт триггер, формирует N гипотез через **контрастный промптинг** с разными ролями и линзами. Использует существующий `IRouterService` для диверсификации провайдеров (одна гипотеза через Gemini, другая через OpenAI — для эпистемического разнообразия).

**Stage 2 — Evidence Collector**: каждая гипотеза проверяется через:
- `web-search` skill (если включён) — реальные источники;
- Memory Mesh — поиск контр-примеров в истории;
- Crystal Vault — поиск противоречащих и подтверждающих кристаллов;
- инструменты (если применимо — калькулятор, код-раннер, БД-запрос).

**Stage 3 — Peer Review Debate**: гипотеза + собранные evidence поступают в Debate Arena. 25 агентов в разных ролях (адвокат, скептик, синтезатор, метанавигатор, дьявольский адвокат, эксперт-обозреватель) проводят структурированный дебат. Роль-метанавигатор выбирает стратегию из 13 существующих (`Socratic`, `Adversarial`, `Devil's Advocate`, `Consensus`, …).

**Stage 4 — Crystallization**: результат дебата → `ICrystalVaultService.propose()` создаёт semi-crystal. Если confidence > порога — `crystallize()` делает его кристаллом. Если нет — остаётся semi до накопления новых данных.

### Триггеры и расписание

Расширить `phase9-research-engine.ts`:
- **Scheduled**: cron-задачи на пересмотр старых кристаллов (например, раз в неделю перепроверять кристаллы с confidence < 0.7).
- **Anomaly**: подписка на `observability:anomaly:detected` — если агент начал вести себя аномально, генератор инициирует исследование «почему».
- **Gap detection**: отдельный воркер раз в сутки扫描 существующих кристаллов, ищет семантические «дыры» (области, где мало кристаллов с высокой уверенностью), предлагает темы для исследования человеку.
- **Forum question**: из форума (§1), если тред имеет >N постов и нет консенсуса, генератор запускается автоматически и публикует результат в тот же тред.

### Контроль стоимости

В каждой `GenerationJob` — `costTracker`. В `config-registry.ts` добавить лимиты: `knowledgeGen.maxTokensPerJob`, `knowledgeGen.maxUsdPerDay`, `knowledgeGen.maxConcurrentJobs`. При превышении — пауза и запрос к человеку на продолжение.

---

## 5. Модуль синтеза всего (roles + lenses + arguments + crystals)

Это **вершина** вашей системы — Synthesis Engine, который собирает мульти-перспективный консенсус из всех остальных модулей. У вас уже есть «Debate Insight Bus» (`contracts/debate-insight-bus.ts`, `InsightBusPanel`) — это хорошая основа.

### Концепция

Синтезатор — это **не** ещё один агент. Это **оркестратор Debate Arena**, который:
1. собирает N ролей × M линз = N×M перспектив;
2. для каждой перспективы запускает отдельный mini-дебат;
3. собирает аргументы и контр-аргументы;
4. применяет мета-линзы (`lens:meta-consensus`, `lens:meta-dissent-preservation`) — важно **не** усреднять, а **сохранять** несогласие;
5. формирует **multi-perspective synthesis** с явными зонами согласия, несогласия и неопределённости.

### Контракт `src/kernel/contracts/synthesis-engine.ts`

```typescript
export interface ISynthesisEngineService extends ILifecycle {
  synthesize(input: SynthesisInput): Promise<SynthesisId>;
  getSynthesis(id: SynthesisId): Promise<Synthesis>;
  refine(id: SynthesisId, feedback: SynthesisFeedback): Promise<Synthesis>;
  exportToCrystal(id: SynthesisId): Promise<CrystalId>; // синтез → кристалл
  exportToForum(id: SynthesisId): Promise<TopicId>; // синтез → форум-тред
}

export interface SynthesisInput {
  question: string; // что синтезируем
  context: SynthesisContext; // кристаллы, документы, данные
  roleIds: string[]; // какие роли привлекаем (можно все из consortia)
  lensIds: string[]; // какие линзы применяем
  debateStrategy: DebateStrategy; // из 13 существующих
  depth: 'shallow' | 'standard' | 'deep' | 'exhaustive';
  preserveDissent: boolean; // критично — сохранять ли несогласие
  costBudget?: CostBudget;
}

export interface Synthesis {
  id: string;
  input: SynthesisInput;
  perspectives: Perspective[]; // по одному на role×lens
  consensusZones: ConsensusZone[]; // где согласие
  dissentZones: DissentZone[]; // где несогласие (НЕ suppressed!)
  uncertaintyZones: UncertaintyZone[]; // где не хватило данных
  synthesizedStatement: string; // итоговое утверждение
  confidenceDistribution: ConfidenceDist; // не одно число, а распределение
  supportingCrystals: string[]; // кристаллы, поддерживающие
  contradictingCrystals: string[]; // кристаллы, противоречащие
  generatedCrystalId?: string; // если синтез стал кристаллом
  debateIds: string[]; // все дебаты, проведённые
  totalTokensSpent: number;
}

export interface Perspective {
  roleId: string;
  lensId: string;
  argument: string;
  confidence: number;
  keyClaims: string[];
  references: { crystalId?: string; postUrl?: string; source?: string }[];
  concessions: string[]; // где этот перспектив признал правоту оппонента
}

export interface ConsensusZone {
  statement: string;
  supportingPerspectives: Perspective[]; // какие перспективы согласны
  strength: number; // 0..1
}

export interface DissentZone {
  topic: string;
  positions: { perspective: Perspective; position: string }[];
  irreducible: boolean; // принципиально неразрешимо сейчас
}

export interface UncertaintyZone {
  topic: string;
  missingData: string[];
  suggestedExperiments: string[]; // что нужно проверить
}
```

### Архитектура выполнения

**Шаг 1 — Decomposition**: Synthesis Engine декомпозирует `question` на подвопросы (использует LLM с `lens:analytical`), для каждого подвопроса определяет, какие роли и линзы релевантны.

**Шаг 2 — Parallel Perspectives**: для каждой пары (role, lens) запускается mini-агент, который формирует аргумент. Это можно распараллелить через Web Workers (у вас уже есть `memory.worker.ts`, `sandbox.worker.ts` — добавьте `synthesis.worker.ts`).

**Шаг 3 — Cross-Perspective Debate**: перспективы сталкиваются в Debate Arena по выбранной стратегии. Каждая перспективa может пересмотреть свою позицию, сделать concession.

**Шаг 4 — Zone Identification**: метанавигатор (специальная роль `meta:navigator`) анализирует все позиции, выделяет consensus/dissent/uncertainty zones. Критично: dissent zones с `irreducible: true` НЕ пытаются быть разрешены — они **сохраняются как часть синтеза**, чтобы будущие поколения агентов и людей знали о принципиальном разногласии.

**Шаг 5 — Synthesis Statement**: формируется итоговое утверждение, явно квалифицированное: «При рассмотрении через [role×lens] большинство перспектив сходятся, что X, однако при [другая role×lens] остаётся несогласие по Y, и для разрешения необходимы данные Z».

**Шаг 6 — Optional Crystallization**: если `preserveDissent: false` и consensus strong — может стать кристаллом. Если `preserveDissent: true` — становится **multi-perspective crystal** (особый тип, где `content` содержит несколько квалифицированных утверждений вместо одного).

### Мета-линзы

Добавить в `LENS_LIBRARY`:
- `lens:meta-consensus` — ищет точки согласия;
- `lens:meta-dissent-preservation` — защищает меньшинство от подавления (против groupthink);
- `lens:meta-uncertainty-detection` — помечает зоны, где данных мало;
- `lens:meta-meta` — критикует сам процесс синтеза (рекурсивная проверка).

### Связь с другими модулями

- **Из форума (§1)**: тред с активным обсуждением может быть подан на synthesis → результат публикуется обратно в тред.
- **В кристалл (§2)**: synthesis с strong consensus → кристалл; с irreducible dissent → multi-perspective crystal.
- **В Knowledge Generator (§4)**: synthesis с high uncertainty → триггер для генерации новых знаний.

---

## 6. Конкретно phpBB — стоит ли и как

Если стоит задача именно **phpBB** (а не любой форум), есть три варианта, от худшего к лучшему:

### Вариант A — Запустить phpBB рядом, без интеграции (НЕ рекомендую)

Просто ставите phpBB на отдельном поддомене `forum.yourproject.com`, никак не связан с SuperAgents OS. Минусы: агенты не участвуют, knowledge не утекает в форум, люди не видят агентские инсайты. Это «две системы» вместо одной. Делайте так только если форум — временное решение до построения нативного.

### Вариант B — phpBB + Bridge (средний вариант)

Запускаете phpBB как есть, пишете мост `server/forum-bridge.mjs`:
- **PHP → SuperAgents**: webhook phpBB на post/create → bridge → WebSocket → клиенты SuperAgents зеркалируют посты в IndexedDB. Агенты видят форум в UI `ForumPanel` (нативный компонент из §1 читает из IndexedDB-зеркала).
- **SuperAgents → PHP**: когда агент пишет пост через нативный `ForumPanel`, bridge вызывает phpBB API (`/posting.php` через authenticated session) и создаёт реальный пост. Агент = специальный phpBB-пользователь (по одному на роль или на консорциум).

**Проблемы этого подхода**:
- phpBB-аутентификация — старая (cookie-based), не подходит для агентских токенов; придётся делать «service user» с админ-правами, что небезопасно.
- phpBB не знает о `agentProvenance` (traceId, lensId) — эти данные будут жить только в SuperAgents-зеркале, рассинхронизация неизбежна.
- Модерация в phpBB и в SuperAgents — две разные сущности, придётся синхронизировать.
- Деплой: вам добавится PHP-FPM + MySQL + cron + бэкапы — серьёзный рост ops-нагрузки на local-first проект.

### Вариант C — Нативный SuperAgents Forum (рекомендую)

Как описано в §1 — повторить **модель** phpBB (категории, треды, посты, голосования, модерация, репутация, подписки), но на вашем стеке (TypeScript/Dexie/EventBus). Это даст:
- нативную интеграцию с ролями, линзами, кристаллами, дебатами;
- agent provenance в каждом посте;
- оффлайн-first (посты можно писать без сети, синхронизируются через `sync-server.mjs`);
- один стек деплоя (Docker + nginx уже есть).

### Если всё-таки phpBB — альтернативы, которые лучше

Если внешнее сообщество обязательно, рассмотрите вместо phpBB:
- **Discourse** (Ruby/Rails + PostgreSQL) — современный, имеет полноценный REST API, поддерживает API-ключи для программной работы (агенты как «API users»), markdown из коробки, плагинная система. Интегрируется с SuperAgents в ~5 раз проще, чем phpBB.
- **Flarum** (PHP + MySQL, но современный) — легковеснее, JSON-API из коробки.
- **NodeBB** (Node.js + Redis/MongoDB) — нативный WebSocket, идеально для realtime-форума с агентами; стыкуется с вашим `sync-server.mjs` без языкового барьера.

Из всех для агентского форума NodeBB — лучший выбор по интегрируемости; Discourse — лучший по зрелости. phpBB — худший по обоим критериям.

---

## Сводная карта модулей и их связей

```
                              ┌──────────────────────┐
                              │ Форум (§1) │
                              │ ForumPanel │
                              │ IForumService │
                              └──────────┬───────────┘
                                         │ posts/announce
              ┌──────────────────────────┼──────────────────────────┐
              ▼ ▼ ▼
   ┌──────────────────┐ ┌──────────────────────┐ ┌─────────────────────┐
   │ Knowledge │ │ Crystal Vault (§2) │ │ Synthesis Engine(§5)│
   │ Generator (§4) │─────▶│ ICrystalVaultService │◀───│ ISynthesisEngine │
   │ IKnowledgeGen │ │ Crystal {version, │ │ Perspectives, │
   └────────┬─────────┘ │ provenance, │ │ Consensus/Dissent/ │
            │ propose │ confidence, │ │ Uncertainty zones │
            ▼ │ linkedLensIds} │ └──────────┬──────────┘
   ┌──────────────────┐ └──────────┬───────────┘ │
   │ Debate Arena │◀─────────────────┼───────────────────────────┤
   │ 25 agents, │ │ │
   │ 13 strategies │ │ linkedLensIds │
   └────────┬─────────┘ │ │
            │ ▼ │
            │ ┌──────────────────────────┐ │
            │ │ Lenses (§3) │◀─────────────┘
            │ │ ILensEngineService │ applyStack
            │ │ LensStack [lens:critical,│
            │ │ lens:second-order, ...] │
            │ └──────────┬───────────────┘
            │ │
            ▼ ▼
   ┌──────────────────────────────────────────┐
   │ Roles (existing) │
   │ role-types.ts, role-library.ts │
   │ RolePermission, Consortia, Teams │
   └──────────────────────────────────────────┘
```

---

## Что делать дальше — рекомендации по порядку внедрения

1. **Сначала линзы (§3)** — это самая лёгкая и ортогональная добавка; не сломает ничего существующего, откроет путь ко всему остальному. ~1-2 недели.
2. **Потом Crystal Vault (§2)** — ядро знаний; даже без генератора можно вручную кристаллизовать инсайты из существующих дебатов. ~2-3 недели.
3. **Synthesis Engine (§5)** — естественно следует из дебат-арены + линз + кристаллов. ~2 недели поверх готовых блоков.
4. **Knowledge Generator (§4)** — самый дорогой по токенам модуль, делать после того, как кристаллы и синтез стабилизируются. ~3-4 недели.
5. **Форум (§1)** — последним, потому что он интегрирует всё: посты ссылаются на кристаллы, синтезы публикуются в треды, линзы видны в author-карточках. ~2-3 недели.

Если хотите, могу оформить эту архитектуру как **PDF-дизайн-документ** или **Markdown ADR (Architecture Decision Record)** в репозиторий — скажите, в каком формате, и я подготовлю. Также могу сразу набросать скелеты контрактов (TypeScript-файлы) для первых двух модулей, чтобы вы могли начать внедрение.