# Сравнение 1-к-1, экзотика/исследования + что дописываем

Дата: 2026-09-06. Фаза R. Без проверок до финала. Всё на kv + `agentLoops` (смены Dexie нет — v34 max остаётся, как условились для Phase H+).

## 1. Constitutional AI (Anthropic)
- **У них:** конституция (принципы) → генерация → критика по конституции → ревизия → RL от AI feedback.
- **Было у нас:** guardrails как blocked/flag, но не как конституционная критика+переписывание.
- **Дописываем (R.1):** `ConstitutionalService` (конституция в kv, critique(prompt, constitution) → violations, revise → pass, событие `constit:*`).

## 2. Voyager (MineDojo)
- **У них:** library скиллов (код), curriculum (цели от простого к сложному), verifier (достигнута ли цель), open-ended.
- **Было у нас:** SkillMarket статичен, curriculum как Bonsai lessons, но не как Voyager-цикл.
- **Дописываем (R.1):** `VoyagerService` (skill library в kv + embeddings-ключи, curriculum queue, verifier через ToolRunner/LLM, automatic skill creation).

## 3. Generative Agents / Smallville (Park)
- **У них:** memory stream (observations + importance + recency), reflection (периодическая дистилляция в insights), planning (декомпозиция дня).
- **Было у нас:** cogMemories + reflection в Graph, но не как Smallville stream.
- **Дописываем (R.1):** `SmallvilleService` (stream в kv, importance scoring, reflection every N memories → insights, daily plan).

## 4. AlphaCode / CodeContests
- **У них:** N samples → фильтрация тестами → кластеризация по поведению → выбор.
- **Было у нас:** SelfConsistency N путей, но не как AlphaCode sampling+test filter.
- **Дописываем (R.2):** `AlphaCodeService` (sample N через LLM bridge, filter by CodeExec tickets/pseudo-tests, cluster by output hash, pick best).

## 5. World Models / Dreamer
- **У них:** латентная динамика (predict next obs/reward), imagination rollouts, policy в воображении.
- **Было у нас:** WorldModel отсутствует.
- **Дописываем (R.2):** `WorldModelService` (transition table в kv `world/*`, predict, imagine rollout, train from GymService logs).

## 6. Neurosymbolic / LTN
- **У них:** нейро + логика (grounded predicates, fuzzy truth, axioms).
- **Было у нас:** AtomService — узлы/линки с TV, но не как LTN grounding.
- **Дописываем (R.2):** `NeuroSymbolicService` (predicates `P(x)` с нейро-score, axioms `∀x P(x)→Q(x)` с fuzzy-оценкой, query).

## 7. Swarm Intelligence (ACO/PSO)
- **У них:** муравьи (феромоны) / рой частиц (velocity).
- **Было у нас:** swarm как оркестрация, не как оптимизация.
- **Дописываем (R.3):** `SwarmService` (ACO graph + pheromones, PSO particles, minimize cost fn).

## 8. Artificial Life (Tierra/Avida)
- **У них:** self-replicating programs, мутации, selection.
- **Было у нас:** нет.
- **Дописываем (R.3):** `ALifeService` (genomes в kv, tick: copy with mutation, fitness via tool-evaluated, selection).

## 9. Curiosity / ICM (intrinsic motivation)
- **У них:** prediction error как награда, exploration.
- **Было у нас:** novelty в HealthSignal, но не как intrinsic reward.
- **Дописываем (R.3):** `CuriosityService` (predictor error via WorldModel, bonus = error, policy picks max-bonus action).

## 10. Quantum-inspired (QAOA / annealing)
- **У них:** квантовая оптимизация (уже есть `QuantumInspirationPanel`, но shallow).
- **Было у нас:** `QuantumInspirationService` — декоративный.
- **Дописываем (R.3):** углубляем: `QuantumService` (QUBO в kv, annealing schedule, sample solutions, best pick).

## Карта реализации (Фаза R, phase44)
- События: `constit:*`, `voyager:*`, `smallville:*`, `alphacode:*`, `world:*`, `neuro:*`, `swarm:*`, `alife:*`, `curio:*`, `quantum:*` (~10).
- Сервисы: constit/voyager/smallville, alpha/world/neuro, swarm/alife/curio/quantum → phase44.
- UI: 3 кнопки в табе `rivals` (constitution check, voyage step, smallville reflect).
