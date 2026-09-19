# Сравнение 1-к-1, восьмая десятка: ФОРУМ + ДИАГНОСТИКА + КОГНИТИВКА

Дата: 2026-09-05. Фаза M. Цель владельцев: закрыть все основные механизмы
форумов, диагностики и когнитивных циклов — чтобы дальше вылазили только
необычные механизмы. Без проверок до финала. Всё на kv (смены Dexie нет).

## Форум и коллективные решения

### 1. Discourse / NodeBB
- **У них:** polls в постах, solved-метки, trust levels (0–4), badges,
  очередь модерации.
- **Было у нас:** топики/посты/голоса/флуд-контроль (Модуль 6) — без polls,
  solved, trust levels, badges.
- **Дописываем (M.1):** `ForumPlusService` (polls с вариантами+дедлайном,
  solved-mark, trust levels по активности, badges за пороги).

### 2. Loomio
- **У них:** proposal (agree/abstain/disagree/block + исход), dot-vote,
  ranked choice, проверка кворума.
- **Было у нас:** council-голоса без decision-инструментов.
- **Дописываем (M.1):** `DecisionService` (proposal с позициями и исходом,
  dot-vote пул, ranked-choice подсчёт Borda, кворум-чек).

### 3. Polis
- **У них:** матрица мнений, кластеризация участников, консенсусные
  утверждения (высокое согласие между кластерами).
- **Было у нас:** consensus-детект форума без кластеризации.
- **Дописываем (M.1):** `PolisService` (agree/disagree/pass голоса,
  k-means-lite по векторам голосов, консенсус-утверждения).

## Когнитивные циклы

### 4. Reflexion (Shinn)
- **У них:** actor → evaluator → self-reflection (текст) → retry с памятью
  рефлексий (episodic), рост успешности сериями.
- **Было у нас:** retry в guardrails без вербальной рефлексии и её памяти.
- **Дописываем (M.2):** `ReflexionService` (попытка через tools/LLM →
  рефлексия текстом → память рефлексий → повтор до N, сериями).

### 5. Tree of Thoughts
- **У них:** BFS/DFS поиск по мыслям: генерация N → оценка → prune top-k →
  вглубь, backtracking.
- **Было у нас:** graph-DAG без поискового перебора с оценкой.
- **Дописываем (M.2):** `TotService` (BFS: generate k мыслей → score через
  LLM/эвристику → top-k → следующий уровень, best-path + backtrack-лог).

### 6. Self-Consistency (Wang)
- **У них:** N reasoning-путей, majority vote ответа.
- **Было у нас:** consensual в crew (голос ролей), но не сэмплирование путей.
- **Дописываем (M.2):** `SelfConsistencyService` (N сэмплов с температурой,
  нормализация ответов, majority + confidence).

### 7. SOAR
- **У них:** working memory, production rules (if-then), impasse → substate,
  chunking (новые правила из решений сабстейтов).
- **Было у нас:** policy-правила декларативные, когнитивного цикла нет.
- **Дописываем (M.2):** `SoarService` (факты WM в kv, productions с
  условиями, impasse → substate-стек, chunking компилирует правило).

### 8. OpenCog (AtomSpace + PLN-lite)
- **У них:** гиперграф атомов с truth values, наследование и вывод.
- **Было у нас:** memoryLinks плоские, без типов и TV.
- **Дописываем (M.2):** `AtomService` (ноды Concept/Predicate + links
  Inheritance/Implication/Similarity с TV strength/confidence, дедукция
  наследования с propagation TV).

## Диагностика

### 9. Grafana / Prometheus
- **У них:** метрики (counter/gauge/histogram), алерт-правила, дашборды.
- **Было у нас:** Timeline-события без числовых рядов и алертов.
- **Дописываем (M.3):** `MetricsService2`? — нет, `MeterService` (counters/
  gauges/histogram в kv с окнами, alert rules threshold → notification,
  snapshot рядов).

### 10. Sentry
- **У них:** error inbox, группировка по fingerprint, релизы, resolve.
- **Было у нас:** ошибки разбросаны по логам, inbox нет.
- **Дописываем (M.3):** `ErrorInboxService` (capture с fingerprint
  нормализацией, группы со счётчиками, resolve/ignore, статистика).

## Карта реализации (Фаза M, phase40)
- События: `forumplus:*`, `decision:*`, `polis:*`, `reflexion:*`, `tot:*`,
  `selfcon:*`, `soar:*`, `atom:*`, `meter:*`, `errinbox:*` (~10).
- Сервисы: forumplus/decision/polis, reflexion/tot/selfcon/soar/atom,
  meter/errinbox → phase40.
- UI: кнопки в табе `rivals` (poll create, ToT run, metrics snapshot).
