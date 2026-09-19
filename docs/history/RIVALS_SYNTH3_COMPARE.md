# Сравнение 1-к-1, синтез 5 + дебаты 5 (третья десятка) + что дописываем

Дата: 2026-09-06. Фаза X (третья 5/5 в темах синтеза и дебатов). Без проверок. Всё на kv (v34 max).

## Синтез 5 (продолжение топ-25)

### 11. meta-kb
- **У них:** self-improving KB о самой agent-инфре (мета-уровень, рефлексия о себе).
- **Было:** meta-kb как концепт нет; есть Meta-Agent proposals, но не KB о себе.
- **Дописываем (X.1):** `MetaKbService` (KB записей `meta-kb/*` о сервисах/фазах, self-query, auto-update по событиям).

### 12. AI-Human-Research-OS
- **У них:** folder-based OS для длинных human+agent исследований (папки как проекты).
- **Было:** папок-проектов нет (SharedContext есть, но не как folder-OS).
- **Дописываем (X.1):** `ResearchOsService` (folders в kv `research-os/*`, участники, файлы, статус).

### 13. multi-agent-deep-research
- **У них:** Retriever→Enricher→Analyzer→Insight→Report, ищет contradictions и гипотезы.
- **Было:** DeepResearchService (plan+brief) — близко, но не как 5-ролевая цепочка.
- **Дописываем (X.1):** `DeepResearch2Service` (5 ролей последовательно, contradictions → hypotheses).

### 14. Darwin Gödel Machine (Sakana/Clune)
- **У них:** open-ended evolution само-улучшающихся агентов, код как геном.
- **Было:** ALifeService — genomes, но не как эволюция агентов.
- **Дописываем (X.2):** `DarwinService` (агенты как код-геномы в kv, мутация, отбор по bench score).

### 15. Qyvaria Kernel / Apeireth (hardlogic / topological memory)
- **У них:** hardlogic kernel + каузальная world model + топологическая память (Rust OS).
- **Было:** Qyvaria/Apeireth нет; WorldModel generic есть, но не как топологическая.
- **Дописываем (X.2):** `QyvariaService` (kernel nodes в kv `qyvaria/*`, топо-соседи, causal edges).

## Дебаты 5 (новые форматы, 5/5)

### 16. Parliamentary (British Parliamentary, 4 команды)
- **У них:** OG/OO/CG/CO, points of information, ranking 1–4.
- **Было:** Oxford/Munk 2 стороны, 4-командного нет.
- **Дописываем (X.3):** `ParliamentaryService` (4 команды, POI counters, rank 1–4).

### 17. Policy Debate (cross-ex + theory)
- **У них:** plan + advantages/disadvantages + cross-ex + theory (T).
- **Было:** LD value/criterion, но не policy plan.
- **Дописываем (X.3):** `PolicyDebateService` (plan text, advantages, disadvantages, cross-ex Q&A).

### 18. Socratic Seminar (fishbowl variant, deep)
- **У них:** внутренний/внешний круг, Socratic questions, facilitator.
- **Было:** Socratic lens есть, fishbowl как формат нет.
- **Дописываем (X.3):** `SocraticService` (inner/outer circles, question queue, facilitator).

### 19. Fishbowl Debate (classic)
- **У них:** 4–5 в центре, остальные слушают и ротируются.
- **Было:** нет.
- **Дописываем (X.3):** `FishbowlService` (bowl members, rotation, tap-in/out).

### 20. Delphi (structured expert consensus)
- **У них:** анонимные раунды, медиана + IQR, convergence.
- **Было:** Delphi как концепт нет (Deliberative Poll близко, но не Delphi).
- **Дописываем (X.3):** `DelphiService` (раунды `estimate: number`, медиана/IQR, consensus when IQR < threshold).

## Карта реализации (Фаза X, phase50)
- События: `metakb:*`, `researchos:*`, `deep2:*`, `darwin:*`, `qyvaria:*`, `parliament:*`, `policy:*`, `socratic:*`, `fishbowl:*`, `delphi:*` (~10).
- Сервисы: metakb/researchOs/deep2, darwin/qyvaria, parliamentary/policy/socratic/fishbowl/delphi → phase50.
- Склады: 2 новых линзы (Socratic-deep, Delphi-median), 1 crystal-шаблон (delphi-consensus).
