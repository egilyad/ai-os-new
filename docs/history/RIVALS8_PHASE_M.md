# Phase M — Форум + диагностика + когнитивка (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS8_COMPARE.md`. Проверки — на финал.

## Что сделано

### M.1 Discourse / Loomio / Polis
- `ForumPlusService` — polls (варианты, дедлайн, один голос),
  solved-метки, trust levels 0–4 по активности, badges за пороги.
- `DecisionService` — proposal (agree/abstain/disagree/block + исход с
  кворумом 3), dot-vote (бюджет 10), ranked-choice подсчёт Borda.
- `PolisService` — agree/disagree/pass матрица, k-means-lite
  (hash-seed, 10 итераций), консенсус-утверждения (mean ≥0.4 + согласие
  знаков между кластерами).

### M.2 Reflexion / ToT / Self-Consistency / SOAR / OpenCog
- `ReflexionService` — attempt (tools→LLM→echo) → critique PASS/FAIL →
  вербальная рефлексия в память по kind → retry (до 6), серии в kv.
- `TotService` — BFS generate→score→top-k с backtrack-путём (LLM + offline
  эвристика overlap).
- `SelfConsistencyService` — N сэмплов (≤11) с ANSWER-парсингом,
  нормализация, majority + confidence.
- `SoarService` — WM-факты, productions when/then, decide-act цикл,
  impasse → substate-запись, chunking компилирует правило.
- `AtomService` — Concept/Predicate + Inheritance/Implication/Similarity с
  TV, дедукция BFS с propagation (глубина ≤4, cycle-safe).

### M.3 Grafana / Sentry
- `MeterService` — counters/gauges/histogram (ring 500), alert rules
  above/below с окном 5 мин, уведомления в inbox.
- `ErrorInboxService` — fingerprint-нормализация (id/числа/строки),
  группы со счётчиками, resolve/ignore.

### Wiring
- **Без смены Dexie** (всё на kv) — v34 остаётся max.
- `phase40-rivals7` (10 сервисов), 12 событий, lazy-сервисы,
  poll/ToT/reflexion/alerts в табе `rivals` (+i18n en/ru).

## Отложено на финальную проверку
- typecheck/build/tests/lint по rivals7-срезу, e2e
  poll→decision→polis→reflexion→tot→selfcon→soar→atom→meter→errinbox.

## Дальше — финальная проверка всего вместе, когда скажешь.
