# SuperAgents OS — План внедрения когнитивных модулей

> Основан на `docs/road/roadmap2.md` + реальная архитектура кода (v4.5.0).
> Все модули независимы и встраиваются поэтапно, каждый — отдельный PR.

## Сводная карта

```
ЛИНЗЫ (Lenses)                      — ортогональный слой над ролями
   ↓
КРИСТАЛЛЫ (Crystal Vault)           — lifecycle: жидкое → полукристалл → кристалл
   ↓
JUNCTION ENGINE                     — кросс-доменный синтез (на кристаллах + поиске)
   ↓
СИНТЕЗ (Synthesis Engine)           — мульти-перспективный консенсус
   ↓
ГЕНЕРАТОР (Knowledge Generator)     — исследовательский цикл с триггерами
   ↓
ФОРУМ (Agent Forum)                 — персистентные треды агентов и людей
   ↓
BUILDER AGENT                       — компилятор когнитивных топологий
```

---

## Что уже есть (фундамент в коде)

| Кап                 | Код                                                                                                                                                                                                                                | Статус        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Роли                | `contracts/unified-role.ts` (`UnifiedRoleEntry`, 30 категорий), `unified-role-service.ts`, `data/role-definitions.ts` (333 пресета), consilia (39), group-templates (51)                                                           | ✅            |
| Дебаты              | `contracts/debate-types.ts` (13 стратегий, `DebateVerdict`, `DebateInterpretation`), `debate-runtime.ts` (`Claim`, `Conflict`, `ConsensusResult`, `IDebateEngine`, `DebateTopology`), `debate-engine.ts`, `debate-sync-manager.ts` | ✅            |
| Интерпретация       | `debate-runtime/debate-interpreter.ts` → `DebateInterpretation` (disagreementPeak, trajectoryChangers, insights)                                                                                                                   | ✅            |
| Память              | `contracts/memory.ts` (`IMemoryEngine`, `MemoryQuery`), `memory-engine.ts`, `memory-orchestrator.ts` (7 хранилищ), `memory.worker.ts` (Orama), федеративная память                                                                 | ✅            |
| Гибридный поиск     | `memory.worker.ts` (Orama, 384-dim), `utils/embedding.ts` (FNV), `matchedOn: semantic                                                                                                                                              | keyword       | hybrid` | ✅  |
| Research            | `contracts/research-engine.ts`, `research-engine-service.ts` (эпистемические петли, 34 типа источников, `ResearchClaim`, CitationGraph)                                                                                            | ✅            |
| Гипотезы            | `contracts/hypothesis.ts`, `hypothesis-service.ts` (CRUD, linkDebate)                                                                                                                                                              | ✅            |
| A/B тесты           | `quality-impact-collector.ts` (Welch t-test), `experiment-engine.ts` (A/B техник качества)                                                                                                                                         | ✅            |
| Межагентное общение | `contracts/agent-protocol.ts` (`IAgentProtocolService`, `AgentProtocolMessage`, capabilities)                                                                                                                                      | ✅            |
| Инструменты         | `contracts/tool-types.ts` (`ToolDefinition`), `mcp-service.ts`, skills-store                                                                                                                                                       | ✅            |
| EventBus            | `events/event-registry.ts` (~150 событий, Zod-схемы), `EVENTS` шорткат                                                                                                                                                             | ✅            |
| Регистрация         | `service-registration/` (phase0→phase11), helpers `register`/`asDeps`                                                                                                                                                              | ✅            |
| Canvas/Builder      | `components/BuilderPanel/CognitiveBuilder.tsx` (ReactFlow, ноды agent/router/guardrail/tool/aggregator)                                                                                                                            | ✅ (частично) |
| Persistence         | `services/dexie-schema.ts` (v12, 18 таблиц), `dal/` (14 репозиториев)                                                                                                                                                              | ✅            |

**Чего НЕТ (нужно построить):** линзы, кристаллы, junction, синтез, генератор, форум, builder-compiler.

---

## Модуль 1 — ЛИНЗЫ (Lenses)

> Цель: ортогональный слой «через какую призму смотреть» поверх ролей («кто говорит»).
> Не трогает существующую систему ролей.

### 1.1 Контракт `src/kernel/types/lens-types.ts`

```typescript
export type LensCategory =
  'analytical' | 'ethical' | 'temporal' | 'domain' | 'risk' | 'stakeholder';

export type LensTransform =
  | { kind: 'prompt-prefix'; text: string }
  | { kind: 'context-filter'; predicate: (ctx: Context) => Context }
  | { kind: 'output-transform'; fn: (output: string, ctx: Context) => string }
  | { kind: 'perspective-inject'; questions: string[] }
  | { kind: 'scoring-rubric'; rubric: ScoringRubric }
  | { kind: 'composite'; transforms: LensTransform[] };

export interface Lens {
  id: string;
  name: string;
  description: string;
  category: LensCategory;
  transform: LensTransform;
  applicability: LensApplicability;
  compositionRules: LensComposition;
  conflictWith: string[];
  priority: number;
  isBuiltin?: boolean;
  metadata: LensMetadata;
}

export interface LensStackEntry {
  lensId: string;
  appliedAt: number;
  appliedBy: 'human' | 'agent-self' | 'orchestrator';
  scope: 'session' | 'single-turn' | 'single-tool-call';
  reason?: string;
}
```

### 1.2 Контракт `src/kernel/contracts/lens-engine.ts`

```typescript
export interface ILensEngineService extends ILifecycle {
  applyStack(input: ApplyLensInput): Promise<TransformedContext>;
  validateStack(lensIds: string[]): ValidationResult; // конфликты, размер
  suggestLenses(context: Context, role: UnifiedRoleEntry): LensSuggestion[];
  listLenses(): Lens[];
}
```

### 1.3 Реализация `src/kernel/services/lens-engine/lens-engine-service.ts`

- Библиотека линз: `lens-library.ts` (Critical, Second-Order, Security, Economic, Multi-Stakeholder, Meta-Consensus, Meta-Dissent-Preservation, Meta-Uncertainty).
- Применение стека: `role.systemPrompt` → для каждой линзы `prompt-prefix`/`context-filter`/`perspective-inject` → LLM → обратный проход `output-transform`/`scoring-rubric`.
- Интеграция: расширить `UnifiedRoleEntry` полем `defaultLensIds?: string[]`; агент получает `activeLensStack`.

### 1.4 Регистрация

- Новая фаза `phase13-lenses.ts` ИЛИ расширить `phase8-roles-consortia.ts`:
  ```typescript
  register(
    'lensEngine',
    (c) => new LensEngineService(c.get('unifiedRoleRegistry')),
  );
  ```

### 1.5 UI `src/components/LensesPanel/`

- `LensesPanel.tsx` (маршрут `lenses`)
- `LensEditorModal.tsx` (редактор линзы)
- `LensStackVisualizer.tsx` (стек как слои)
- `LensSelector.tsx` (переиспользуемый — в ChatPanel и DebatePanel)

### 1.6 Тесты

- `lens-engine-service.test.ts`: применение стекa, конфликты, приоритеты, композиция.

### 1.7 Оценка: 1–2 недели.

---

## Модуль 2 — КРИСТАЛЛЫ (Crystal Vault)

> Цель: версионируемая, иммутабельная единица знания с lifecycle
> жидкое (liquid) → полукристалл (semi) → кристалл (crystal) → superseded/refuted.

### 2.1 Контракт `src/kernel/contracts/knowledge-crystal.ts`

```typescript
export interface ICrystalVaultService extends ILifecycle {
  propose(input: ProposeCrystalInput): Promise<CrystalId>; // liquid → semi
  validate(crystalId: CrystalId, debateId: string): Promise<ValidationResult>;
  crystallize(crystalId: CrystalId): Promise<CrystalVersion>; // semi → crystal
  supersede(
    crystalId: CrystalId,
    newContent: CrystalContent,
    reason: string,
  ): Promise<CrystalVersion>;
  get(crystalId: CrystalId, version?: number): Promise<Crystal | null>;
  query(q: CrystalQuery): Promise<Crystal[]>; // семантический поиск
  getContradicting(crystalId: CrystalId): Promise<Crystal[]>;
  linkToLens(crystalId: CrystalId, lensId: string): Promise<void>;
}

export interface Crystal {
  crystalId: string;
  version: number;
  content: CrystalContent; // statement, elaboration, evidence, assumptions, negationForm, applicabilityBounds
  provenance: CrystalProvenance; // originKind (debate|observation|synthesis|human|imported), originId, contributingAgents, modelIds, totalTokensSpent
  validation: CrystalValidation; // debateId, proArguments, conArguments, reviewers, humanApproved
  confidence: number; // 0..1
  status: 'semi' | 'crystal' | 'superseded' | 'refuted';
  supersededBy?: string;
  contradictingCrystalIds: string[];
  supportingCrystalIds: string[];
  linkedLensIds: string[];
  linkedRoleIds: string[];
  applicableDomain: CrystalDomain;
  createdAt: number;
  crystallizedAt?: number;
  contentHash: string; // sha256(content) для целостности
}
```

### 2.2 Реализация `src/kernel/services/crystal-vault/crystal-vault-service.ts`

- Использует `memory.worker.ts` (эмбеддинги 384-dim) для семантического поиска кристаллов.
- `propose()`: создаёт `status:'semi'`, `confidence:0.3` — дешёвый шаг.
- `getContradicting()`: при добавлении ищет семантически близкие кристаллы, формирует `contradictingCrystalIds` → запускает «контр-дебат» через Debate Arena.
- `crystallize()`: эмиттит `knowledge:crystal:formed` (подписчики: форум, синтез, генератор).
- **Источник кристаллов из дебатов**: слушаем `debate:verdict:generated` + `debate:runtime:consensus:reached` → предлагаем кристалл из ключевых аргументов вердикта.

### 2.3 Persistence (Dexie, v13)

```typescript
db.version(13).stores({
  crystals:
    'crystalId, version, status, confidence, *linkedLensIds, *linkedRoleIds, originId, crystallizedAt',
  crystalVersions: '[crystalId+version], crystalId',
});
```

- DAL: `dal/crystal-repository.ts` + регистрация в `data-access-layer.ts`.

### 2.4 События (event-registry.ts)

- `knowledge:crystal:proposed` (semi создан)
- `knowledge:crystal:formed` (crystallize)
- `knowledge:crystal:superseded`
- `knowledge:crystal:contradiction:detected` (для контр-дебата)

### 2.5 UI

- `src/components/CrystalVaultPanel/` (маршрут `crystals`):
  - `CrystalVaultPanel.tsx` — список кристаллов, фильтр по статусу/доверию
  - `CrystalDetail.tsx` — версии, provenance, contradicting/supporting
  - `CrystalLifecycleBadge.tsx` — визуализация lifecycle
- Интеграция: ссылки из KnowledgePanel на кристаллы.

### 2.6 Оценка: 2–3 недели.

---

## Модуль 3 — JUNCTION ENGINE

> Цель: кросс-доменный синтез — найти структурную связь между claim'ами из разных доменов
> и породить новое знание S' = f(A, B, C).

### 3.1 Контракт `src/kernel/contracts/junction-engine.ts`

```typescript
export interface IJunctionEngineService extends ILifecycle {
  detect(): Promise<JunctionCandidate[]>;
  validate(candidateId: JunctionId): Promise<Junction>; // → форум/дебат
  get(id: JunctionId): Promise<Junction | null>;
  list(opts?: { status?: JunctionStatus }): Promise<Junction[]>;
}

export interface Junction {
  id: string;
  inputs: JunctionSource[]; // debate://id/claim, forum://thread/post, crystal://id
  synthesisType:
    | 'structural_analogy'
    | 'contradiction'
    | 'abstraction'
    | 'pattern_completion';
  confidence: number;
  content: string;
  status: 'pending' | 'validated' | 'rejected' | 'superseded';
  cognitiveDebt: string; // конкретная проверка/эксперимент
  createdAt: number;
}
```

### 3.2 Реализация `src/kernel/services/junction-engine/junction-engine-service.ts`

- **Триггеры**: dormant thread revival, debate deadlock, cross-reference detection, periodic sweep.
- **Источники пар**: гибридный поиск (`memory-engine.searchAdvanced`) по кристаллам + дебатам + форуму.
- **MVP (200 строк)**: `JunctionDetector` — каждые N циклов берёт 2 «зрелых» источника из разных доменов, спрашивает LLM «есть ли нетривиальная структурная связь?» → `NONE|WEAK|STRONG`.
- **JunctionValidator**: STRONG → публикует как `[JUNCTION-PENDING]` → ждёт 1 контраргумент от любого агента → `[JUNCTION-VALIDATED]`.
- **Триплет агентов**: `BridgeBuilder` (ищет аналогии) → `ContradictionMiner` (атакует) → `AbstractionElevator` (проверяет robustness).
- **Эскалация**: junction с confidence < 0.6 → эскалируется в Debate Arena.

### 3.3 Persistence

- Таблица Dexie `junctions: 'id, status, synthesisType, createdAt'` + DAL `dal/junction-repository.ts`.

### 3.4 События

- `knowledge:junction:detected`
- `knowledge:junction:validated` / `:rejected`

### 3.5 UI

- `src/components/JunctionPanel/` (маршрут `junctions`):
  - `JunctionList.tsx` — кандидаты + статусы
  - `JunctionCard.tsx` — inputs, synthesisType, confidence, cognitiveDebt
  - `JunctionGraph.tsx` — визуализация моста между доменами

### 3.6 Оценка: 1–2 недели.

---

## Модуль 4 — СИНТЕЗ (Synthesis Engine)

> Цель: мульти-перспективный консенсус (роли × линзы), с явным сохранением несогласия.

### 4.1 Контракт `src/kernel/contracts/synthesis-engine.ts`

```typescript
export interface ISynthesisEngineService extends ILifecycle {
  synthesize(input: SynthesisInput): Promise<SynthesisId>;
  getSynthesis(id: SynthesisId): Promise<Synthesis>;
  refine(id: SynthesisId, feedback: SynthesisFeedback): Promise<Synthesis>;
  exportToCrystal(id: SynthesisId): Promise<CrystalId>;
  exportToForum(id: SynthesisId): Promise<TopicId>;
}

export interface Synthesis {
  id: string;
  input: SynthesisInput; // question, context, roleIds, lensIds, debateStrategy, depth, preserveDissent, costBudget
  perspectives: Perspective[]; // по одному на role×lens (argument, confidence, keyClaims, concessions)
  consensusZones: ConsensusZone[];
  dissentZones: DissentZone[]; // НЕ подавлять
  uncertaintyZones: UncertaintyZone[];
  synthesizedStatement: string;
  confidenceDistribution: ConfidenceDist;
  supportingCrystals: string[];
  contradictingCrystals: string[];
  generatedCrystalId?: string;
  debateIds: string[];
  totalTokensSpent: number;
}
```

### 4.2 Реализация `src/kernel/services/synthesis/synthesis-engine-service.ts`

Оркестратор (НЕ отдельный агент):

1. **Decomposition**: вопрос → подвопросы (LLM + `lens:analytical`).
2. **Parallel Perspectives**: пары (role, lens) → мини-агенты (распараллелить через `synthesis.worker.ts`).
3. **Cross-Perspective Debate**: столкновение перспектив в Debate Arena (стратегия из 13).
4. **Zone Identification**: роль `meta:navigator` выделяет consensus/dissent/uncertainty. Dissent с `irreducible:true` сохраняется.
5. **Synthesis Statement**: явно квалифицированное итоговое утверждение.
6. **Optional Crystallization**: strong consensus → кристалл; dissent → multi-perspective crystal.

- **Мета-линзы**: `lens:meta-consensus`, `lens:meta-dissent-preservation`, `lens:meta-uncertainty-detection`, `lens:meta-meta`.
- Использует `DebateInterpreter` для пост-анализа траекторий.

### 4.3 Persistence

- `synthSessions: 'id, status, createdAt'` + `synthPerspectives: 'id, synthesisId, roleId, lensId'`.

### 4.4 События

- `synthesis:started` / `:completed` / `:refined` / `:exported-to-crystal` / `:exported-to-forum`.

### 4.5 UI

- `src/components/SynthesisPanel/` (маршрут `synthesis`):
  - `SynthesisComposer.tsx` — вопрос, роли, линзы, стратегия, depth, preserveDissent
  - `SynthesisZonesView.tsx` — consensus/dissent/uncertainty зоны
  - `PerspectiveGrid.tsx` — N×M перспектив

### 4.6 Оценка: 2–3 недели (поверх линз + кристаллов + junction).

---

## Модуль 5 — ГЕНЕРАТОР (Knowledge Generator)

> Цель: исследовательский цикл (trigger → hypothesis → evidence → peer review → crystal),
> выход — новые semi-кристаллы.

### 5.1 Контракт `src/kernel/contracts/knowledge-generator.ts`

```typescript
export type GenerationTrigger =
  | { kind: 'scheduled'; cron: string; topic: string }
  | { kind: 'anomaly'; detectedAnomalyId: string }
  | { kind: 'gap'; gapDescription: string }
  | { kind: 'forum-question'; topicId: string }
  | { kind: 'crystal-conflict'; crystalIds: string[] }
  | { kind: 'cross-domain'; sourceDomains: string[] };

export interface IKnowledgeGeneratorService extends ILifecycle {
  generateFromTrigger(trigger: GenerationTrigger): Promise<GenerationJobId>;
  getStatus(jobId: GenerationJobId): Promise<GenerationJob>;
  cancel(jobId: GenerationJobId): Promise<void>;
  listActiveJobs(): Promise<GenerationJob[]>;
}
```

### 5.2 Реализация `src/kernel/services/knowledge-generator/knowledge-generator-service.ts`

Стадии (поверх существующих сервисов):

1. **Hypothesis Generator**: контрастный промптинг, разные роли/линзы; диверсификация провайдеров через `routerService`.
2. **Evidence Collector**: `web-search` skill + Memory Mesh (контр-примеры) + Crystal Vault (противоречия).
3. **Peer Review Debate**: гипотеза + evidence → Debate Arena (адвокат/скептик/синтезатор/метанавигатор).
4. **Crystallization**: результат → `ICrystalVaultService.propose()` → `crystallize()` при confidence > порога.

Триггеры:

- **Scheduled**: cron-задачи (перепроверка кристаллов с confidence < 0.7 раз в неделю) — через `schedulerService`.
- **Anomaly**: подписка на `observability:anomaly:detected`.
- **Gap detection**: воркер раз в сутки ищет «дыры» в кристаллах.
- **Forum question**: тред > N постов без консенсуса.
- **Crystal conflict**: 2+ противоречащих кристалла.

Контроль стоимости: `config-registry.ts` → `knowledgeGen.maxTokensPerJob`, `maxUsdPerDay`, `maxConcurrentJobs`.

### 5.3 Persistence

- `genJobs: 'id, status, trigger.kind, createdAt'` + DAL.

### 5.4 UI

- `src/components/KnowledgeGenPanel/` (маршрут `knowledge-generator`):
  - `GeneratorDashboard.tsx` — активные job'ы, статусы, costTracker
  - `TriggerConfig.tsx` — настройка триггеров и лимитов

### 5.5 Оценка: 3–4 недели.

---

## Модуль 6 — ФОРУМ (Agent Forum)

> Цель: асинхронные, персистентные треды как «лаборатория + библиотека + кафе»,
> где агенты и люди накапливают знание (в отличие от синхронных дебатов).

### 6.1 Контракт `src/kernel/contracts/forum.ts`

```typescript
export interface IForumService extends ILifecycle {
  createTopic(input: CreateTopicInput): Promise<TopicId>;
  postMessage(
    topicId: TopicId,
    author: ForumAuthor,
    body: string,
    tx?: ITransaction,
  ): Promise<PostId>;
  votePost(
    postId: PostId,
    voter: ForumAuthor,
    vote: 'up' | 'down',
  ): Promise<void>;
  subscribe(topicId: TopicId, subscriber: ForumAuthor): Promise<void>;
  listTopics(filter: TopicFilter): Promise<Paginated<Topic>>;
  getThread(
    topicId: TopicId,
    opts?: { sincePostId?: PostId },
  ): Promise<ForumThread>;
  pinTopic(topicId: TopicId, pinned: boolean): Promise<void>;
  moderatePost(postId: PostId, action: ModerationAction): Promise<void>;
}

export interface ForumAuthor {
  kind: 'human' | 'agent';
  id: string;
  roleId?: string;
  displayName: string;
}

export interface Post {
  id: string;
  topicId: string;
  author: ForumAuthor;
  body: string;
  renderedHtml: string;
  parentId?: string;
  createdAt: number;
  editedAt?: number;
  score: number;
  votes: VoteRecord[];
  agentProvenance?: AgentProvenance; // traceId, modelId, tokens
  moderation: ModerationState;
}
```

### 6.2 Реализация `src/kernel/services/forum/forum-service.ts`

- **Двойное гражданство**: агент = участник с `agentProvenance` (traceId, modelId, roleId, tokensCost).
- **Когнитивные механики**: Cognitive Forking (side-thread «что если принять постулат?»), Aging & Revival (credibility decay), Silent Observers (read receipts как implicit votes), Cross-Forum References.
- **Governor-модерация**: если тред деградирует в circular reasoning → Governor вызывает дебат.
- **Бюджет публикаций**: cost/energy budget на посты (анти-флуд).
- Интеграция: слушает `debate:verdict:generated` → автопостинг «case study»; слушает `knowledge:crystal:formed` → анонс.

### 6.3 Persistence

```typescript
db.version(N).stores({
  forumTopics: 'id, category, authorId, lastActivityAt, pinned, *tags',
  forumPosts: 'id, topicId, authorId, createdAt, score, parentId',
  forumVotes: 'id, postId, voterId, [postId+voterId]',
  forumSubs: 'id, topicId, subscriberId, [topicId+subscriberId]',
});
```

### 6.4 События

- `forum:topic:created`, `forum:post:added`, `forum:post:voted`, `forum:topic:escalated-to-debate`.

### 6.5 UI

- `src/components/ForumPanel/` (маршрут `forum`):
  - `ForumPanel.tsx`, `TopicList.tsx`, `TopicView.tsx`, `PostComposer.tsx`, `AuthorBadge.tsx` (human/agent), `ModerationQueue.tsx`, `ForumHeatmap.tsx`

### 6.6 Оценка: 2–3 недели.

---

## Модуль 7 — BUILDER AGENT

> Цель: AI-билдер, который по описанию генерирует когнитивную топологию
> (workflow_manifest), компилирует её в event-пайплайн.

### 7.1 Контракт `src/kernel/contracts/builder.ts`

```typescript
export interface IBuilderAgentService extends ILifecycle {
  generate(input: { prompt: string }): Promise<WorkflowManifest>;
  validate(manifest: WorkflowManifest): Promise<ValidationResult>; // против SYSTEM_MANIFEST
  compile(manifest: WorkflowManifest): Promise<CompiledFlow>; // → event bindings
  deploy(flowId: FlowId): Promise<void>;
  listFlows(): Promise<WorkflowManifest[]>;
}
```

### 7.2 Реализация `src/kernel/services/builder/builder-agent-service.ts`

- **Builder Agent**: спец-роль, читает SYSTEM_MANIFEST + DESIGN_PRINCIPLES + реестр сервисов (88+).
- **Workflow manifest** (YAML): `workflow_id`, `trigger`, `topology` (nodes: debate/junction/forum/interpretation/gate с условиями).
- **Flow Compiler**: manifest → подписки на event bus (каждая нода = потенциальный checkpoint, pause/resume).
- **WorkflowValidator**: проверка manifest на соответствие контрактам перед деплоем.
- Реиспользует `CognitiveBuilder.tsx` (ReactFlow) как canvas: ноды из manifest, AI-чат в сайдбаре («добавь скептика» → patch топологии).

### 7.3 Persistence

- `workflows: 'id, status, version, createdAt'` + версионирование (можно откат).

### 7.4 UI

- Расширить `CognitiveBuilder` → маршрут `builder`:
  - ноды: Agent/Debate/Junction/Forum/Interpretation/Gate
  - AI-ассистент в сайдбаре
  - чекпоинты: pause/resume на каждой ноде

### 7.5 Оценка: 2 недели (поверх готовых модулей).

---

## Порядок внедрения и зависимости

| Шаг | Модуль    | Зависит от                     | Оценка  | Независимый PR                       |
| --- | --------- | ------------------------------ | ------- | ------------------------------------ |
| 1   | Линзы     | роли (есть)                    | 1–2 нед | ✅                                   |
| 2   | Кристаллы | дебаты (есть) + память (есть)  | 2–3 нед | ✅                                   |
| 3   | Junction  | кристаллы + поиск (есть)       | 1–2 нед | ✅ (можно до кристаллов, на дебатах) |
| 4   | Синтез    | линзы + кристаллы + junction   | 2–3 нед | ✅                                   |
| 5   | Генератор | кристаллы + дебаты + scheduler | 3–4 нед | ✅                                   |
| 6   | Форум     | дебаты + кристаллы             | 2–3 нед | ✅ (можно раньше)                    |
| 7   | Builder   | всё выше                       | 2 нед   | ✅                                   |

**Итого:** ~12–18 недель. Каждый модуль — отдельный PR, останавливаться можно на любом шаге.

**Быстрый MVP (2 недели):** Линзы (3–4 предустановленные) + Junction (200 строк `JunctionDetector`). Даёт data: реально ли система находит кросс-доменные связи.

---

## Скретч-структура каждого модуля (контракт → сервис → фаза → UI → тесты)

```
Новый модуль /src/
├── kernel/
│   ├── contracts/           <модуль>.ts        — интерфейсы
│   ├── types/               <модуль>-types.ts   — доменные типы
│   ├── services/<модуль>/   <модуль>-service.ts — реализация
│   ├── events/event-registry.ts                — новые события (Zod)
│   ├── dal/                 <модуль>-repository.ts
│   └── service-registration/phase<NN>-<модуль>.ts
├── components/<Модуль>Panel/                    — React UI
└── *.<модуль>-service.test.ts                   — тесты рядом
```
