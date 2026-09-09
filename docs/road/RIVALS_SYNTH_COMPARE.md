# Сравнение 1-к-1, синтез-десятка + что дописываем

Дата: 2026-09-06. Фаза V. Без проверок. Всё на kv (v34 max).

## 1. SciAgentsDiscovery (MIT)
- **У них:** онтологические KG + междисциплинарные гипотезы (материалы).
- **Было:** Junction уже ищет Bridges между кристаллами, но без онтологии.
- **Дописываем (V.1):** `SciAgentsService` (онтология в kv `sci-onto/*`, гипотезы как Junctions с типом `sci-hypothesis`, provenance).

## 2. Sparks (MIT)
- **У них:** гипотеза → эксперимент → принцип (замкнутый цикл, нашёл новые явления в белках).
- **Было:** Knowledge Generator: trigger→hypothesis→evidence→review→crystal — близко, но не как Sparks-принципы.
- **Дописываем (V.1):** `SparksService` (цикл hypothesis→experiment→principle, принципы как Crystal с `origin=Sparks`).

## 3. AI-Scientist v2 (Sakana)
- **У них:** идея → эксперименты (код) → статья (LaTeX) end-to-end (Автоматический учёный).
- **Было:** research-run + report уже есть, но не как paper pipeline.
- **Дописываем (V.1):** `AiScientistService` (idea queue в kv, experiment via CodeExec tickets, paper draft via Writer/LLM, события `ai-sci:*`).

## 4. Latent-Consensus-Manifold (LAteNT)
- **У них:** 9 агентов + blackboard + Socratic debate + синтез через MDL + Popper falsification + контрфактика.
- **Было:** Blackboard via SharedContext, Socratic lens есть, MDL/Popper частично.
- **Дописываем (V.2):** `LatentService` (blackboard в kv `latent/*`, 9 ролей seed, Socratic rounds, MDL score, falsification check).

## 5. ai-assistant-framework
- **У них:** 8-stage pipeline + 5-tier memory + literature-backed candidates.
- **Было:** pipeline 5 stages (crystal), memory 3-tier (core/recall/archival).
- **Дописываем (V.2):** `EightStageService` (8 стадий: ingest→normalize→link→candidate→score→synthesize→verify→publish, 5-tier memory map).

## 6. Cognitae (22 агента YAML)
- **У них:** жёсткие YAML-архитектуры, роли Scholar (синтез), Syn (pattern weaver), Axis (coherence).
- **Было:** 22 не было, Specialist roles generic.
- **Дописываем (V.2):** `CognitaeService` (22 YAML-заглушки в `cognitae/*`, спец-роли Scholar/Syn/Axis как council линзы, orchestrator).

## 7. cognitive-team-architecture
- **У них:** 4 роли Maestro/Memory/Critic/Engine, память как активный интеллект.
- **Было:** MaestroService (AIRI) одноимённый, но не как когнитивная команда.
- **Дописываем (V.3):** `CogTeamService` (команда из 4: Maestro планирует, Memory recalls, Critic checks, Engine executes — loop).

## 8. Syn Cognitive Architecture
- **У них:** always-on typed memory, «сон» (консолидация), default-mode loop.
- **Было:** sleep нет, typed memory есть (persona).
- **Дописываем (V.3):** `SynService` (typed memory в kv `syn-mem/*`, sleep consolidation: compress old + link, default loop idle→reflect).

## 9. Helix Research
- **У них:** онтология + GraphRAG + Neo4j + gaps/trends синтез.
- **Было:** ontologyService (Palantir) generic, GraphRAG via knowledge/search.
- **Дописываем (V.3):** `HelixService` (ontology в kv `helix-onto/*`, GraphRAG: retrieve→graph walk→gap detection).

## 10. MultiAgent-Research-Ideator
- **У них:** исследование дизайна диалогов для генерации идей.
- **Было:** dialogueService (Rasa) generic, ideation не как research.
- **Дописываем (V.3):** `IdeatorService` (диалоги A/B: debate vs brainstorm vs critique, metric: novelty score, best design).

## Карта реализации (Фаза V, phase48)
- События: `sci:*`, `sparks:*`, `ai-sci:*`, `latent:*`, `eight:*`, `cognitae:*`, `cogteam:*`, `syn:*`, `helix:*`, `ideator:*` (~10).
- Сервисы: sci/sparks/aiScientist, latent/eight/cognitae, cogTeam/syn/helix/ideator → phase48.
- Склады: 3 новых crystal-шаблона (sci-hypothesis, sparks-principle, ai-paper), 3 линзы (Socratic-MDL, Popper-falsify, Syn-weaver).
