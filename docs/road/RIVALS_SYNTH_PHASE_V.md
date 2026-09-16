# Phase V — Синтез-1: SciAgents/Sparks/AI-Scientist + LAteNT/8-stage/Cognitae + CogTeam/Syn/Helix/Ideator (DONE, без проверок)

Дата: 2026-09-11. Сравнения: `RIVALS_SYNTH_COMPARE.md`. Проверки — на финал.

## Что сделано

### V.1 SciAgents / Sparks / AI-Scientist (научный цикл)
- `SciAgentsService` — `addOntology/hypothesize` (kv `sci-onto/`).
- `SparksService` — `cycle()` → `{experiment, principle}`.
- `AiScientistService` — `queueIdea/runNext` (kv `ai-sci/`).

### V.2 LAteNT / 8-stage / Cognitae (роли + стадии + учёные)
- `LatentService` — `post/synthesize` (kv `latent/board`, **эмитит `latent:synth`** — единственное событие фазы).
- `EightStageService` — `run()` → 8 стадий строкой (+5-tier mem).
- `CognitaeService` — `roles/run` (22 роли в kv `cognitae-role/*` seed на init; Scholar/Syn/Axis — строкой).

### V.3 CogTeam / Syn / Helix / Ideator (команды + память + графы + идеи)
- `CogTeamService` — `run()` (Maestro→Memory→Critic→Engine).
- `SynService` — `remember/sleep/loop` (kv `syn-mem/`, typed-mem).
- `HelixService` — `addOnto/gaps` (kv `helix-onto/`, GraphRAG+gaps).
- `IdeatorService` — `testDialogues()` → `{best, scores}` (A/B диалоги + novelty).

### Wiring
- **Без смены Dexie** (kv, v34 max).
- `phase48-synth` (10 сервисов), регистрация `phase48-synth.ts:21-30` (Ideator под токеном `ideatorService2`, не `ideatorService`), `service-registration/index.ts:49,125`, lazy-сервисы `instances/services-extras.ts:539-548` (+типы `:210-219`), баррел `contracts/index.ts:1178-1187`.
- Контракты: `contracts/rivals16.ts:2-11` (10 интерфейсов).
- События: из 10 семейств есть только `latent:synth` (`event-registry.ts:2278`); нет `sci:/sparks:/ai-sci:/eight:/cognitae:/cogteam:/syn:/helix:/ideator:*`.
- Склады: 3 crystal-шаблона (sci-hypothesis, sparks-principle, ai-paper) + 3 линзы (Socratic-MDL, Popper-falsify, Syn-weaver) **не добавлены** (grep по src — 0). 9 ролей Latent / MDL-score / falsification — строковые заглушки.

## Отложено на финальную проверку
- typecheck/build/tests по synth-срезу (своих ошибок в тайпчеке — 0).
- e2e `sci→sparks→ai-sci→latent→eight→cognitae→cogteam→syn→helix→ideator` — DONE (`phase48-chain.test.ts`, через живой `runtime`).
- Недостающие 9 семейств событий, 3 crystal-шаблона + 3 линзы, живые MDL-score/falsification.
