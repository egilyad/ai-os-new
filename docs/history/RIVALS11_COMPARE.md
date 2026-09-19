# Сравнение 1-к-1, последняя девятка до 100: ВИЗУАЛИЗАЦИИ + СИМУЛЯЦИИ

Дата: 2026-09-05. Фаза Q. Без проверок до финала. Всё на kv (смены Dexie
нет — v34 остаётся max). После этого — разбор и инвентаризация.

## 1. NetLogo
- **У них:** turtles/patches, tick-цикл, диффузия, BehaviorSpace эксперименты,
  HubNet.
- **Было у нас:** social-симы без пространства.
- **Дописываем (Q.1):** `NetLogoService` (grid patches + turtles пород,
  tick-правила move/eat/reproduce, диффузия поля, BehaviorSpace sweeps,
  ASCII-снапшот карты).

## 2. Mesa (Python ABM)
- **У них:** Model/Agent/Scheduler (random/simultaneous/staged),
  DataCollector, batch_run по сетке параметров, charts.
- **Было у нас:** симы без шедулеров и batch-прогонов.
- **Дописываем (Q.1):** `MesaService` (шедулеры, DataCollector ряды,
  batch_run с агрегацией mean/min/max).

## 3. Microsoft Project Bonsai
- **У них:** симуляторы + machine teaching (concepts/curriculum), brains
  (политики), assessments.
- **Было у нас:** обучения политик нет.
- **Дописываем (Q.1):** `BonsaiService` (sim-реестр, lessons curriculum,
  Q-таблица brain, assessment runs со score).

## 4. Chainlit
- **У них:** дерево шагов рана, message elements (текст/файлы/картинки),
  feedback, task list, auth.
- **Было у нас:** Fleet-панель без step-дерева и элементов.
- **Дописываем (Q.2):** `ChainlitService` (run → step-дерево start/end,
  attach elements, feedback, tasklist-статусы).

## 5. Gradio
- **У них:** Interface (input→fn→output), Blocks-композиция, flagging.
- **Было у нас:** форм нет (Gum-формы — про сбор значений, не про запуск).
- **Дописываем (Q.2):** `GradioService` (interface defs: inputs-схема →
  tool/crew запуск → outputs, flagging-лог).

## 6. Observable / D3 (чарты)
- **У них:** реактивные спеки графиков (line/bar/pie/scatter).
- **Было у нас:** meter-ряды без рендера.
- **Дописываем (Q.2):** `ChartService` (спеки из meter-series и таблиц,
  экспорт JSON-спеки + SVG для line/bar).

## 7. Gephi / Cytoscape (граф-виз)
- **У них:** layout-алгоритмы, SVG/интерактив для графов.
- **Было у нас:** графы (provenance, Dung, council) без координат и SVG.
- **Дописываем (Q.2):** `GraphVizService` (layered + force-lite deterministic
  layout, SVG-экспорт нод/рёбер).

## 8. Minecraft Malmo / MineDojo
- **У них:** mission XML (карта, цели, награды), multi-agent миссии.
- **Было у нас:** миссии только как watches.
- **Дописываем (Q.3):** `MalmoService` (миссии: ASCII-карта, цели, награды
  за ходы, turn-цикл агентов через LLM/tool, scoreboard).

## 9. OpenAI Gym / Gymnasium
- **У них:** стандарт env: reset/step/reward/done, реестры env.
- **Было у нас:** стандарта env-API нет.
- **Дописываем (Q.3):** `GymService` (built-ins: bandit, gridworld, cartlite;
  custom табличные env; reset/step с seeded RNG).

## Карта реализации (Фаза Q, phase43)
- События: `netlogo:*`, `mesa:*`, `bonsai:*`, `chainlit:*`, `gradio:*`,
  `chart:*`, `graphviz:*`, `malmo:*`, `gym:*` (~9).
- Сервисы: netlogo/mesa/bonsai, chainlit/gradio/charts/graphviz,
  malmo/gym → phase43.
- UI: кнопки в табе `rivals` (sim tick, chart render, gym run).
- ИТОГ: 100 проектов. Дальше — разбор + инвентаризация складов.
