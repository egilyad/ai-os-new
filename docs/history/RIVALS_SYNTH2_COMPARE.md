# Сравнение 1-к-1, синтез 5 + дебаты 5 + что дописываем

Дата: 2026-09-06. Фаза W (вторая синтез-дебатная десятка, 5/5). Без проверок. Всё на kv (v34 max).

## Синтез 5

### 1. RCK (hyperdimensional HRR/VSA, не LLM)
- **У них:** индуцирует новые факты из цепочек, provenance, belief revision — векторы, не токены.
- **Было:** AtomService — TV наследования, но не гиперразмерность.
- **Дописываем (W.1):** `RckService` (HRR bind/bundle, цепочки → новые факты с provenance-трейсом).

### 2. cognee (mature cognitive memory + KG)
- **У них:** memory-engine для агентов, KG как память (топовый open-source).
- **Было:** cognee-подобного нет; closest — cogMemories + ltMemories разрозненно.
- **Дописываем (W.1):** `CogneeService` (ingest → chunk → entity extract (LLM) → KG edges в kv `cognee/*`, recall top-k).

### 3. Metan (recursive self-improvement via emergent depth)
- **У них:** мета-операция строит иерархию агентов (depth), улучшение через глубину.
- **Было:** Meta-Agent есть, но не как рекурсивная иерархия.
- **Дописываем (W.1):** `MetanService` (buildHierarchy: 1→2→4 агентов по depth, emergent score).

### 4. Concepts (concept-centric neuro-symbolic)
- **У них:** агенты рассуждают через дискретные concepts с представлениями.
- **Было:** Concepts нет.
- **Дописываем (W.2):** `ConceptsService` (concept store `concepts/*`: name→vector+symbol, compose concepts → new).

### 5. COG-second-brain (self-evolving second brain, V-model)
- **У них:** 10 агентов, worker не проверяет сам себя (V-model verification).
- **Было:** second brain нет, verification как guardrails generic.
- **Дописываем (W.2):** `SecondBrainService` (10 ролей seed, V-model: worker→different verifier, evolution log).

## Дебаты 5

### 6. STORM (Stanford, multi-perspective research + debate)
- **У них:** perspectives → research → synthesis → debate (Stanford STORM).
- **Было:** STORM как архитектура в all-agentic-architectures — не как сервис.
- **Дописываем (W.3):** `StormService` (perspectives gen → parallel RAG → synthesis → debate, как STORM loop).

### 7. Blackboard (classic, из 35 архитектур)
- **У них:** central blackboard, эксперты пишут/читают, control loop.
- **Было:** blackboard как SharedContext/Latent board, но не как классический control.
- **Дописываем (W.3):** `BlackboardService` (board в kv `bb/*`, experts register, control loop tick).

### 8. Meta-Controller (из 35 архитектур)
- **У них:** meta-controller выбирает какую архитектуру запустить.
- **Было:** PlannerService strategies, но не meta-выбор.
- **Дописываем (W.3):** `MetaControllerService` (catalog 35 → pick by task features, delegate).

### 9. DOLORES / Deep Reasoning (structured meta-cognition)
- **У них:** формальный язык meta-reasoning, динамические scaffolds.
- **Было:** Meta-cognition generic, scaffolds нет.
- **Дописываем (W.3):** `DoloresService` (scaffold DSL: steps with pre/post conditions, meta-trace).

### 10. episteme / cognitive-os (bidirectional sync + governance «покажи работу»)
- **У них:** bidirectional cognitive sync + governance «покажи работу до действия».
- **Было:** governance есть, но не как episteme sync.
- **Дописываем (W.3):** `EpistemeService` (sync agent↔human state, governance check «show work»).

## Карта реализации (Фаза W, phase49)
- События: `rck:*`, `cognee:*`, `metan:*`, `concepts:*`, `secondbrain:*`, `storm:*`, `bb:*`, `metactrl:*`, `dolores:*`, `episteme:*` (~10).
- Сервисы: rck/cognee/metan, concepts/secondbrain, storm/blackboard/metaCtrl/dolores/episteme → phase49.
- Склады: 2 новых линзы (HRR-bind, concept-compose), 2 crystal-шаблона.
