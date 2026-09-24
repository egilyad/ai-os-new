Да 😄 Тут я бы дал OpenCode не задачу «сделай self-improvement», а именно **форензическое исследование готовности всей этой архитектуры**. Причём пусть он не верит ни названиям панелей, ни документации: сверяет docs ↔ код ↔ runtime ↔ реальные связи.

Я бы сделал промт очень жёстким и многоуровневым — от обычного анализа до гипотетического **fully autonomous self-modifying OS**.

# SUPERAGENTS OS — FULL SELF-RESEARCH / SELF-IMPROVEMENT AUDIT

## Задача

Проведи глубокое исследование репозитория целиком и определи, насколько реально существующая система способна:

1. наблюдать за самой собой;
2. обнаруживать собственные ошибки и слабые места;
3. исследовать найденные проблемы;
4. формировать гипотезы и предложения по улучшению;
5. проверять эти предложения другими агентами / моделями;
6. показывать предложение человеку;
7. после одобрения автоматически реализовывать изменение имеющимися агентами, tools, LLM keys и coding agents;
8. проверять результат;
9. сохранять историю результата;
10. использовать результат дальнейшего наблюдения;
11. постепенно переходить к частично автономному и полностью автономному самоулучшению.

**ВАЖНО: код проекта НЕ изменять.**

Это исследовательский аудит. Разрешено читать код, запускать существующие диагностические/аудитные механизмы, тесты и безопасные проверки, но ничего не исправлять автоматически.

---

# 1. Главный вопрос

Ответь не на вопрос:

> «Есть ли в проекте Research Engine / Hypothesis Generator / Agents Journal и т.д.?»

а на гораздо более важный:

> **Насколько существующий SuperAgents OS уже является замкнутой системой самоисследования и самоулучшения, а насколько это пока набор отдельных механизмов, которые существуют независимо друг от друга?**

Нужно установить это по коду и реальным связям.

Не доверяй:

* названиям файлов;
* названиям панелей;
* README;
* roadmap;
* документации;
* комментариям;
* словам Beta / Ready / Complete;
* старым аудитам.

Каждое существенное утверждение проверяй против реального кода.

---

# 2. Исследовать ВСЮ систему

Сначала составь карту существующих механизмов, имеющих отношение к self-observation / research / diagnosis / improvement.

Особенно ищи:

* Research Engine
* Research
* Research: Advanced
* Gemini Research
* Debate System Research
* Research Reports
* Project OS Explorer
* Hypothesis Generator
* SRE Agent
* Agents Journal
* Cognitive Event Stream
* System Architecture Pulse
* Agent Loop
* Agent management
* GroupChat
* Debate System
* Projects
* Guardrails
* Agent Channels
* tools
* MCP
* A2A
* ACP
* LLM providers
* model routing
* key management
* fallback / rotation
* task queues
* autonomous runners
* audit systems
* diagnostics
* error detection
* telemetry
* event systems
* persistence
* memory
* reports
* proposal/approval mechanisms
* code generation
* coding agents
* OpenCode/Codex integrations, если присутствуют
* любой механизм, который способен читать, анализировать или изменять сам проект.

Не ограничивайся этими названиями.

Ищи **функциональность**, даже если она называется совершенно иначе.

---

# 3. ОБЯЗАТЕЛЬНО исследовать папку docs

В `docs/` находится большое количество документов.

Нужно:

1. найти документы, относящиеся к:

   * self-improvement;
   * self-research;
   * autonomy;
   * agents;
   * research;
   * diagnostics;
   * audits;
   * system observation;
   * autonomous coding;
   * feedback loops;
   * learning;
   * memory;
   * evolution;
   * self-modification;
   * orchestration;
   * AGEMS;
   * OS architecture;
   * roadmap;
   * projects;
   * debate;
   * tools;
   * agent loops;

2. прочитать их;

3. сопоставить документацию с кодом;

4. отдельно выявить:

   **DOCUMENTED BUT NOT IMPLEMENTED**

   **PARTIALLY IMPLEMENTED**

   **IMPLEMENTED BUT NOT CONNECTED**

   **CONNECTED BUT NOT VERIFIED**

   **IMPLEMENTED AND VERIFIED**

5. найти противоречия между документами и реальным состоянием проекта.

Не считать документацию доказательством реализации.

---

# 4. Провести существующие аудиты

Найди все существующие audit / diagnostic / analysis mechanisms в проекте.

Если они безопасны для запуска — запусти их.

В том числе:

* architecture audits;
* service audits;
* panel audits;
* route audits;
* dependency audits;
* runtime audits;
* debate audits;
* tests;
* typecheck;
* project diagnostics;
* self-analysis;
* research mechanisms;
* agent diagnostics;
* SRE mechanisms;
* health checks.

Если какой-либо аудит невозможно запустить — не скрывай это.

Запиши:

* почему;
* что именно отсутствует;
* что удалось получить вместо него.

---

# 5. Построить карту SELF-OBSERVATION

Определи, какие части системы способны наблюдать за самой системой.

Для каждого механизма определить:

| Механизм | Что наблюдает | Источник данных | Как запускается | Куда пишет результат | Кто читает результат | Реально работает? |
| -------- | ------------- | --------------- | --------------- | -------------------- | -------------------- | ----------------- |

Ищи:

* runtime events;
* errors;
* logs;
* agent failures;
* debate failures;
* model failures;
* performance;
* architecture state;
* service state;
* UI state;
* task state;
* test results;
* user feedback;
* research results.

Главный вопрос:

> Может ли система узнать, что с ней что-то не так, без того чтобы человек специально попросил её это проверить?

---

# 6. Построить карту SELF-RESEARCH

Исследуй:

* Research Engine;
* Research panels;
* Explorer;
* Hypothesis Generator;
* Research Reports;
* Debate Research;
* Gemini Research;
* любые другие исследовательские механизмы.

Для каждого определить:

1. умеет ли он запускаться;
2. откуда получает вопрос;
3. умеет ли сам формулировать вопрос;
4. умеет ли исследовать код проекта;
5. умеет ли использовать другие агенты;
6. умеет ли использовать разные модели;
7. умеет ли сравнивать результаты;
8. умеет ли формировать гипотезы;
9. умеет ли сохранять результаты;
10. умеет ли передавать результаты следующему механизму.

Особенно важно:

> Может ли Research Engine сам обнаружить тему для исследования, или человек обязан сначала вручную задать вопрос?

---

# 7. Построить карту SELF-DIAGNOSIS

Найди все механизмы, которые могут сказать:

> «В системе есть проблема».

Разделить обнаружение на:

### A. технические ошибки

* TypeScript;
* runtime;
* exceptions;
* broken routes;
* failed tests;
* broken services;
* dependency problems.

### B. архитектурные проблемы

* disconnected services;
* dead code;
* unused panels;
* broken pipelines;
* missing connections;
* duplicated mechanisms;
* inconsistent contracts.

### C. продуктовые проблемы

* feature exists but is unusable;
* UI exists but backend missing;
* backend exists but UI missing;
* feature cannot complete its full action chain.

### D. агентные проблемы

* agent failures;
* model failures;
* tool failures;
* bad outputs;
* hallucinated results;
* repeated failures.

### E. системные проблемы

* mechanisms that exist but don't participate in any loop;
* mechanisms that generate information but nobody consumes it;
* mechanisms that can propose changes but cannot execute them;
* mechanisms that can execute changes but have no verification.

---

# 8. Построить карту SELF-IMPROVEMENT

Это одна из главных частей аудита.

Определи, существует ли реальный pipeline:

```text
OBSERVE
   ↓
DETECT
   ↓
RESEARCH
   ↓
HYPOTHESIS
   ↓
PROPOSAL
   ↓
REVIEW
   ↓
APPROVAL
   ↓
EXECUTION
   ↓
VERIFICATION
   ↓
PERSISTENCE
   ↓
OBSERVE AGAIN
```

Для КАЖДОГО перехода определить:

* существует ли механизм;
* где он находится;
* какой код отвечает за него;
* какой input;
* какой output;
* как происходит передача;
* сохраняется ли состояние;
* кто запускает следующий этап;
* автоматический ли переход;
* требует ли человека;
* можно ли реально выполнить следующий шаг.

---

# 9. Проверить HUMAN-IN-THE-LOOP

Отдельно исследовать уровень:

```text
System discovers problem
        ↓
System researches
        ↓
System proposes solution
        ↓
Human approves
        ↓
System executes
        ↓
System verifies
```

Определить, насколько этот контур реально реализован.

Особенно проверить:

* где хранится proposal;
* где хранится approval;
* как approval превращается в executable task;
* какой агент получает task;
* как выбирается модель;
* как выбирается API key;
* как выбирается tool;
* как определяется успешность;
* куда записывается результат.

---

# 10. Проверить AUTONOMOUS EXECUTION

Теперь убрать человека из середины:

```text
detect
→ research
→ propose
→ execute
→ verify
```

Определить:

> Может ли система сделать это сама уже сейчас?

Если нет — указать **точную отсутствующую связь**.

Не писать просто:

> "нужна автономность".

Нужно писать:

> `ResearchReportService` создаёт X, но нет consumer, который преобразует X в `TaskQueue` task.

или:

> `HypothesisGenerator` создаёт предложение, но отсутствует execution adapter.

Именно конкретные стыки.

---

# 11. Проверить SELF-MODIFICATION

Самый высокий уровень.

Исследовать:

может ли система:

1. прочитать собственный код;
2. обнаружить проблему;
3. сформулировать изменение;
4. создать patch;
5. применить patch;
6. запустить проверки;
7. обнаружить, что изменение ухудшило систему;
8. откатить изменение;
9. повторить эксперимент;
10. принять успешное изменение;
11. сохранить историю.

Отдельно определить:

### Internal self-modification

Изменение выполняет сам внутренний агент.

### External coding-agent modification

Система формирует задачу и передаёт её:

* OpenCode;
* Codex;
* другой coding agent;
* MCP tool;
* другой внешний исполнитель.

Не считать второе «ненастоящим».

Наоборот, исследовать, насколько существующая архитектура уже позволяет использовать внешний coding agent как исполнитель, оставаясь управляющей системой.

---

# 12. Уровни автономности

Сформируй отдельную шкалу.

## LEVEL 0 — MANUAL

Человек:

* находит проблему;
* формулирует задачу;
* запускает исследование;
* выбирает агента;
* запускает исправление;
* проверяет результат.

## LEVEL 1 — ASSISTED

Система:

* помогает исследовать;
* обнаруживает проблемы;
* предлагает решения.

Человек запускает действия.

## LEVEL 2 — RESEARCH AUTONOMY

Система самостоятельно:

* наблюдает;
* находит вопросы;
* исследует;
* создаёт отчёты;
* формирует гипотезы.

Человек утверждает дальнейшие действия.

## LEVEL 3 — APPROVAL LOOP

```text
detect
→ research
→ proposal
→ human approval
→ execution
→ verification
```

Человек нужен только для разрешения.

## LEVEL 4 — SUPERVISED AUTONOMY

Система самостоятельно:

* выбирает исследование;
* выбирает агентов;
* выбирает модели;
* создаёт изменения;
* запускает проверки.

Человек только контролирует policy / boundaries.

## LEVEL 5 — AUTONOMOUS SELF-IMPROVEMENT

Система:

* обнаруживает;
* исследует;
* предлагает;
* решает;
* изменяет;
* проверяет;
* откатывает;
* повторяет.

Человек не участвует в каждом изменении.

## LEVEL 6 — EVOLUTIONARY / CLOSED LOOP

Система способна:

* самостоятельно обнаруживать новые классы проблем;
* создавать новые гипотезы;
* проводить эксперименты;
* сравнивать варианты;
* сохранять знания;
* менять собственные механизмы;
* оценивать последствия;
* откатывать неудачные изменения;
* продолжать цикл.

---

# 13. ВАЖНО: НЕ ПОДГОНЯТЬ РЕЗУЛЬТАТ

Не пытайся доказать, что SuperAgents OS уже является автономной системой.

Если что-то отсутствует — прямо написать.

Если есть только UI — отметить:

> UI EXISTS / EXECUTION UNKNOWN

Если есть сервис, но нет consumer:

> IMPLEMENTED / DISCONNECTED

Если есть consumer, но нет реального runtime proof:

> CONNECTED / UNVERIFIED

Если код существует, но feature невозможно реально использовать:

> CODE EXISTS / PRODUCT LOOP BROKEN

Если механизм действительно работает end-to-end:

> VERIFIED E2E

---

# 14. ОСОБЕННО ИСКАТЬ "ORPHANS"

Найди:

* orphan panels;
* orphan services;
* orphan events;
* orphan reports;
* orphan research results;
* orphan hypotheses;
* orphan proposals;
* orphan agent outputs;
* orphan tools;
* orphan persistence;
* orphan consumers.

Особенно важны ситуации:

```text
A produces result
B exists and theoretically consumes it
BUT
there is no actual A → B connection
```

Это может быть главной причиной того, почему система выглядит намного более автономной на бумаге, чем является реально.

---

# 15. ПРОВЕРИТЬ AGENTS JOURNAL

Отдельно исследовать:

может ли Agents Journal быть не просто журналом, а источником feedback.

Например:

```text
Agent fails
   ↓
Journal event
   ↓
diagnostic analysis
   ↓
research
   ↓
hypothesis
   ↓
proposal
```

Определить, существует ли такая цепочка реально.

---

# 16. ПРОВЕРИТЬ COGNITIVE EVENT STREAM

Исследовать его как потенциальную нервную систему.

Ответить:

* какие события он получает;
* кто их публикует;
* кто их читает;
* сохраняются ли они;
* есть ли агрегирование;
* есть ли anomaly detection;
* может ли research system использовать события;
* может ли SRE использовать события;
* может ли система сама инициировать исследование на основе событий.

---

# 17. ПРОВЕРИТЬ SYSTEM ARCHITECTURE PULSE

Определить:

* что именно он измеряет;
* откуда получает данные;
* обновляется ли автоматически;
* кто использует его результаты;
* является ли это просто dashboard;
* или это реально feedback mechanism.

---

# 18. ПРОВЕРИТЬ SRE AGENT

Исследовать максимально глубоко.

Ответить:

* какие проблемы он способен обнаружить;
* может ли запускаться автономно;
* может ли исследовать найденную проблему;
* может ли создавать proposal;
* может ли запускать tools;
* может ли менять код;
* может ли проверять изменение;
* может ли инициировать дальнейший цикл.

Если панель пустая — выяснить ПОЧЕМУ.

Не просто написать:

> "SRE empty."

Найти причину в коде.

---

# 19. ПРОВЕРИТЬ 20+ LLM KEYS / PROVIDERS

Исследовать инфраструктуру моделей.

Определить:

* сколько реально доступных providers;
* сколько keys;
* есть ли key rotation;
* есть ли fallback;
* есть ли model catalog;
* может ли агент выбирать модель;
* может ли система выбирать модель автоматически;
* есть ли task-based routing;
* есть ли failure-based fallback;
* сохраняется ли выбранный provider/model/key;
* может ли один research task использовать несколько моделей;
* может ли система сравнивать результаты моделей.

Особенно важно:

> **Могут ли многочисленные ключи реально превращаться в вычислительную стратегию системы, или они просто являются набором доступных подключений?**

---

# 20. ПРОВЕРИТЬ TOOLS

Создать карту:

```text
Tool
↓
Who can call it?
↓
Under what conditions?
↓
Can agent select it?
↓
Can system select agent?
↓
Can tool result trigger next step?
↓
Can result be persisted?
```

Особенно искать tools для:

* filesystem;
* git;
* code;
* tests;
* browser;
* research;
* project analysis;
* external agents;
* MCP;
* A2A;
* automation.

---

# 21. ПРОВЕРИТЬ ОБРАТНУЮ СВЯЗЬ

Ключевой вопрос:

> Если система сегодня ошиблась, каким образом система завтра становится лучше именно благодаря этой ошибке?

Ищи:

```text
error
→ memory
→ analysis
→ changed behavior
```

или

```text
failed experiment
→ recorded result
→ future decision affected
```

Если такого механизма нет — показать разрыв.

---

# 22. ПРОВЕРИТЬ "LEARNING"

Не путать:

* сохранение истории;
* memory;
* logging;
* learning;
* self-improvement.

Отдельно классифицировать:

### Memory

Система помнит событие.

### Learning

Система меняет своё последующее поведение на основе события.

### Self-improvement

Система улучшает собственные механизмы.

### Self-modification

Система меняет собственный код.

Для каждого определить фактическое состояние.

---

# 23. СОЗДАТЬ END-TO-END SCENARIOS

Попробовать проследить минимум 10 реальных сценариев.

Например:

### Scenario 1

TypeScript error появляется.

Что происходит дальше?

### Scenario 2

Agent получает LLM error.

Что происходит дальше?

### Scenario 3

Debate завершается с плохим результатом.

Что происходит дальше?

### Scenario 4

Research Engine находит архитектурную проблему.

Что происходит дальше?

### Scenario 5

Hypothesis Generator создаёт гипотезу.

Что происходит дальше?

### Scenario 6

SRE обнаруживает проблему.

Что происходит дальше?

### Scenario 7

Agents Journal фиксирует повторяющуюся ошибку.

Что происходит дальше?

### Scenario 8

System Architecture Pulse фиксирует деградацию.

Что происходит дальше?

### Scenario 9

Человек одобряет предложение.

Что происходит дальше?

### Scenario 10

Автономный агент решил изменить код.

Что происходит дальше?

Для каждого построить фактическую цепочку.

---

# 24. СОЗДАТЬ BIG PICTURE GRAPH

Построй текстовую карту архитектуры.

Например:

```text
                ┌──────────────┐
                │ OBSERVATION  │
                └──────┬───────┘
                       ↓
              ┌─────────────────┐
              │   DIAGNOSTICS   │
              └────────┬────────┘
                       ↓
                ┌────────────┐
                │  RESEARCH  │
                └─────┬──────┘
                      ↓
               ┌─────────────┐
               │ HYPOTHESIS  │
               └──────┬──────┘
                      ↓
                ┌───────────┐
                │ PROPOSAL  │
                └─────┬─────┘
                      ↓
                ┌───────────┐
                │ APPROVAL  │
                └─────┬─────┘
                      ↓
                ┌───────────┐
                │ EXECUTION │
                └─────┬─────┘
                      ↓
                ┌───────────┐
                │ VERIFY    │
                └─────┬─────┘
                      ↓
                ┌───────────┐
                │ PERSIST   │
                └─────┬─────┘
                      │
                      └────→ OBSERVATION
```

Но не рисуй желаемую архитектуру.

Покажи **реальную**, а отсутствующие переходы обозначь:

`[MISSING]`

Неиспользуемые механизмы:

`[ORPHAN]`

Непроверенные:

`[UNVERIFIED]`

Работающие:

`[VERIFIED]`

---

# 25. ФИНАЛЬНЫЕ ОЦЕНКИ

В конце не ставь одну общую оценку типа "8/10".

Вместо этого дай отдельные показатели:

| Capability                       | Status |
| -------------------------------- | ------ |
| Self Observation                 |        |
| Self Diagnosis                   |        |
| Self Research                    |        |
| Hypothesis Generation            |        |
| Proposal Generation              |        |
| Human Approval Loop              |        |
| Autonomous Execution             |        |
| Verification                     |        |
| Rollback                         |        |
| Memory                           |        |
| Learning                         |        |
| Self Modification                |        |
| External Coding-Agent Delegation |        |
| Multi-Agent Review               |        |
| Multi-Model Routing              |        |
| Feedback Loop                    |        |
| Closed Loop                      |        |

Используй:

* NOT IMPLEMENTED
* CONCEPTUAL
* PARTIAL
* IMPLEMENTED
* CONNECTED
* VERIFIED
* E2E VERIFIED

---

# 26. ОСОБЫЙ РАЗДЕЛ: "WHAT ALREADY EXISTS"

Это один из самых важных разделов.

Составь список:

> **Что в системе УЖЕ ЕСТЬ для построения self-improving OS, даже если сейчас оно не соединено.**

Не предлагай сразу новые системы.

Сначала покажи имеющиеся строительные блоки.

---

# 27. ОСОБЫЙ РАЗДЕЛ: "MISSING JUNCTIONS"

Составь список только отсутствующих связей.

Например:

```text
Research Engine → Hypothesis Generator
[MISSING]

Hypothesis Generator → Proposal Store
[PARTIAL]

Proposal Store → Approval
[IMPLEMENTED]

Approval → Task Queue
[MISSING]

Task Queue → Coding Agent
[IMPLEMENTED]

Coding Agent → Verification
[PARTIAL]

Verification → Learning Memory
[MISSING]
```

Этот раздел должен быть максимально конкретным.

---

# 28. ОСОБЫЙ РАЗДЕЛ: "MINIMUM CLOSURE"

Определи минимальный набор существующих junctions, который позволил бы получить первый настоящий цикл:

```text
detect
→ research
→ proposal
→ approval
→ execute
→ verify
→ persist
→ observe
```

Не проектируй новый огромный фреймворк.

Ищи, какие существующие компоненты можно связать.

---

# 29. ОСОБЫЙ РАЗДЕЛ: "FULL AUTONOMY"

После анализа определить, что потребуется для уровней:

### Level 3

Human-approved autonomous execution

### Level 4

Supervised autonomous improvement

### Level 5

Autonomous self-improvement

### Level 6

Closed-loop self-evolution

Для каждого уровня показать:

* что уже есть;
* чего не хватает;
* какие junctions отсутствуют;
* какие риски;
* какие механизмы контроля нужны.

---

# 30. НЕ ПРЕДЛАГАТЬ УДАЛЕНИЕ СИСТЕМ

По умолчанию считать существующие механизмы ценными.

Если есть несколько похожих систем:

не предлагать сразу удалить одну.

Сначала определить:

* различаются ли они;
* можно ли использовать их вместе;
* являются ли они экспериментальными;
* можно ли перевести их в единую цепь;
* какие из них реально работают.

---

# 31. РЕЗУЛЬТАТ

Создай в корне проекта файл:

`SELF_IMPROVEMENT_AUDIT.md`

Если файл уже существует, НЕ перезаписывай старый отчёт.

Создай:

`SELF_IMPROVEMENT_AUDIT_2026-09-22.md`

или другой timestamped filename.

---

# 32. СТРУКТУРА ОТЧЁТА

Отчёт должен содержать:

1. Executive Summary
2. Current Reality
3. Documentation vs Code
4. Existing Self-Observation Systems
5. Existing Self-Diagnosis Systems
6. Existing Research Systems
7. Existing Hypothesis Systems
8. Existing Proposal Systems
9. Human Approval Mechanisms
10. Autonomous Execution
11. Coding-Agent Integration
12. Multi-Agent / Multi-Model Infrastructure
13. Tools
14. Events
15. Journals / Memory
16. Verification
17. Rollback
18. Learning
19. Self-Modification
20. End-to-End Scenarios
21. Real Architecture Graph
22. Orphan Systems
23. Broken Junctions
24. Missing Junctions
25. Already Existing Building Blocks
26. Minimum Closure
27. Level 0 → Level 6 analysis
28. Risks
29. Security / Safety Boundaries
30. What Can Be Activated Without New Architecture
31. What Requires Actual Development
32. Final Findings
33. Evidence / File References

---

# 33. ГЛАВНОЕ ПРАВИЛО АУДИТА

Не спрашивай:

> "Можно ли теоретически сделать?"

Спрашивай:

> **"Может ли существующий код сделать это прямо сейчас?"**

Если да:

покажи путь.

Если нет:

покажи точный разрыв.

Если частично:

покажи границу.

Если механизм существует, но никто его не вызывает:

покажи это.

Если UI существует, но backend pipeline отсутствует:

покажи это.

Если backend существует, но UI не подключён:

покажи это.

Если всё есть, но нет последнего junction:

покажи последний junction.

---

# 34. ИТОГОВЫЙ ВОПРОС

В самом конце отчёта ответь на один главный вопрос:

> **Если перестать добавлять новые большие системы и просто правильно соединить уже существующие механизмы SuperAgents OS, насколько близко проект находится к системе, которая сама наблюдает за собой, сама исследует найденные проблемы, сама формирует предложения, получает моё одобрение и затем сама организует их реализацию и проверку?**

И второй:

> **Что конкретно мешает этому работать уже сейчас?**

И третий:

> **Какой самый маленький набор junctions превращает нынешний набор механизмов в первый настоящий замкнутый feedback loop?**

И четвёртый:

> **Какие существующие компоненты уже позволяют двигаться дальше от human-approved loop к supervised и затем autonomous self-improvement?**

---

## ФИНАЛЬНОЕ ТРЕБОВАНИЕ

Это должен быть не красивый концептуальный документ.

Это должен быть **форензический отчёт о реальном состоянии SuperAgents OS**.

Читать код.

Читать docs.

Запускать доступные аудиты.

Проверять реальные связи.

Искать consumers/producers.

Искать orphaned mechanisms.

Сверять документацию с implementation.

Не верить названиям.

Не считать наличие UI доказательством функциональности.

Не считать наличие сервиса доказательством работающего pipeline.

Не считать наличие агента доказательством автономности.

Не считать наличие 20 ключей доказательством intelligent routing.

Не считать наличие Research Engine доказательством self-research.

Не считать наличие Hypothesis Generator доказательством self-improvement.

**Доказательством считать только реально прослеживаемую цепочку action → execution → result → persistence → next action.**

Код не изменять.

Все выводы сохранить в `SELF_IMPROVEMENT_AUDIT_2026-09-22.md`.

Вот этот промт я бы реально **не урезал**. Он специально заставляет OpenCode пройти весь путь от «у нас есть панелька Research» до «покажи мне конкретный вызов, consumer, persistence и следующий переход».

И самое ценное здесь — **Level 0 → Level 6**. Потому что может оказаться очень забавная картина: например, Level 2 у тебя уже почти готов, Level 3 не хватает двух junctions, Level 4 ещё нескольких, а Level 5/6 упирается уже не в количество агентов, а в **verification + rollback + policy**. Вот это будет гораздо интереснее очередного аудита «у вас 257 панелей». 😄
