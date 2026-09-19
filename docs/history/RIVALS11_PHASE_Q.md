# Phase Q — Визуализации и лёгкие симуляции (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS11_COMPARE.md`. Проверки — на финал.
Последняя девятка до 100.

## Что сделано

### Q.1 NetLogo / Mesa / Bonsai
- `NetLogoService` — grid patches с диффузией, turtles пород (seed
  детерминированный), tick-правила move/eat/reproduce/die, BehaviorSpace
  sweeps, ASCII-снапшот карты.
- `MesaService` — шедулеры random/simultaneous/staged, DataCollector ряды
  population + meanEnergy, batch_run с агрегацией.
- `BonsaiService` — симуляторы (states+actions в kv), curriculum lessons
  from→goal, Q-таблица brain, assessment (score+steps, epsilon-greedy).

### Q.2 Chainlit / Gradio / Charts / GraphViz
- `ChainlitService` — run step-дерево (start/end), elements (text/file/image
  refs), thumbs feedback, ASCII-дерево для консоли.
- `GradioService` — interface defs (inputs → tool/crew), flagging-лог.
- `ChartService` — JSON-спеки line/bar/pie/scatter, SVG-рендер line/bar,
  `fromMeter()` поверх meter-рядов.
- `GraphVizService` — layered (BFS depth) + force-lite (hash-seeded circle
  + 20 repulsion passes), SVG с маркерами стрелок, детерминированно.

### Q.3 Malmo / Gymnasium
- `MalmoService` — ASCII-карта миссий, spawn по цифрам, цели G (+10 награда),
  turn-цикл N/S/E/W, scoreboard.
- `GymService` — built-ins bandit/gridworld/cartlite + custom табличные env
  (defineTable), seeded RNG (mulberry32), reset/step API.

### Wiring
- **Без смены Dexie** (kv) — v34 остаётся max.
- `phase43-rivals11` (9 сервисов), 5 событий, lazy-сервисы,
  4 кнопки симуляций в табе `rivals` (+i18n en/ru).

## 100 проектов
Волны 1–5 + фазы A–Q, Dexie v23→v34, фазы 23–43, ~240 событий, 55 доков.
Дальше — разбор + инвентаризация складов (проверок пока нет, по плану).
