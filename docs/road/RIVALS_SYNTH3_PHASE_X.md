# Phase X — Синтез/дебаты 5/5: meta-kb/Research-OS/deep-research-2 + Darwin/Qyvaria + Parliamentary/Policy/Socratic/Fishbowl/Delphi (DONE, без проверок)

Дата: 2026-09-11. Сравнения: `RIVALS_SYNTH3_COMPARE.md`. Проверки — на финал.

## Что сделано

### X.1 meta-kb / Research-OS / deep-research-2 (базы знаний)
- `MetaKbService` — `put(entry,text)` (kv `metakb/*`), `query(q)` (self-query, auto-update).
- `ResearchOsService` — `createFolder(name)` → id, `addFile(folderId,name,content)`, `list(folderId)` (folders `research-os/*`).
- `DeepResearch2Service` — `run(topic)` → `{report, contradictions}` (5 ролей, contradictions→hypotheses; dal+llm опц.).

### X.2 Darwin / Qyvaria (эволюция + каузальные графы)
- `DarwinService` — `evolve(seed,gens=5)` → `{best, score}` (код-геномы, мутация, отбор по bench).
- `QyvariaService` — `addNode(name,neighbors)`, `causal(from,to)`, `query(start)` (nodes `qyvaria/*`, топо-соседи, causal edges).

### X.3 Parliamentary / Policy / Socratic / Fishbowl / Delphi (форматы дебатов)
- `ParliamentaryService` — `run(topic)` → `{ranking, pois}` (OG/OO/CG/CO, POI, rank 1–4).
- `PolicyDebateService` — `run(topic,plan)` → `{advantages, disadvantages}` (plan, adv/disadv, cross-ex; без dal — чистый расчёт).
- `SocraticService` — `ask(q)` (kv `socratic/queue`), `discuss(topic)` (inner/outer, question queue).
- `FishbowlService` — `setBowl(members[0..4])`, `rotate(newMember)` (bowl, rotation).
- `DelphiService` — `round(estimates)` → `{median, iqr, consensus}` (медиана/IQR, consensus при IQR<threshold; без dal).

### Wiring
- **Без смены Dexie** (kv, v34 max).
- `phase50-synth3` (10 сервисов), регистрация `phase50-synth3.ts:20-30` (токен `socraticService2` — от коллизии со старым Socratic), `service-registration/index.ts:51,127`, lazy-сервисы `instances/services-extras.ts:549-558`.
- Контракты: `contracts/rivals18.ts:2-11` (10 интерфейсов).
- Сервисы **не эмитят событий** (grep `emit(`/EVENTS в rivals18 — пуст); семейств `metakb:/researchos:/deep2:/darwin:/qyvaria:/parliament:/policy:/socratic:/fishbowl:/delphi:*` в event-registry нет.
- Сиды tools/skills: нет (импорты `eventsOf/IToolRunnerService` в phase50 висят неиспользованными).
- Склады: 2 линзы (Socratic-deep, Delphi-median) + crystal-шаблон (delphi-consensus) **не добавлены** (grep — 0).

## Отложено на финальную проверку
- typecheck/build/tests по synth3-срезу (своих ошибок в тайпчеке — 0).
- e2e `metakb→researchos→deep2→darwin→qyvaria→parliament→policy→socratic→fishbowl→delphi` — DONE (`phase50-chain.test.ts`, через живой `runtime`).
- Все 10 семейств событий, 2 линзы + crystal-шаблон.
