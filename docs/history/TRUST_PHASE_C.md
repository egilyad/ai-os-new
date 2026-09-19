# Phase C — Trust & Ecosystem (DONE, без проверок)

Дата: 2026-09-05. Проверки отложены на финал.

Аддитивный **Trust-слой** — политики, MCP, песочницы, скиллы и time-machine
не тронуты (переиспользуются как исполнение).

## Что сделано

### C.1 Capabilities + Trust + Policy + Human Governance (Волна 10.22–10.24, 10.27)
- `services/trust/governance-service.ts` — единый пайплайн решения:
  capability-гранты (least privilege, deny wins) → policy-правила
  (priority, deny > require_hitl > allow, лимиты для budget:spend) → trust-пол.
- Trust/reputation: EMA (alpha 0.2) по feedback 0..1, событие `trust:updated`.
- Human Governance: observer/approver/director/auditor + `can(userId, action)`,
  всё с аудитом через AuditService.

### C.2 Provenance + Sandbox Continuum (Волна 10.25–10.26)
- `services/trust/provenance-service.ts` — граф
  decision/data/prompt/vote/toolcall/agent с рёбрами
  derived_from/voted_by/executed_by/prompted_by/informed_by;
  `trace(decisionId, depth)` — BFS вверх, любое решение объяснимо.
- `sandboxLevelFor(task)` — isolated/restricted/standard/trusted
  по риск-маркерам задачи (потребляется SandboxBroker-тикетами).

### C.3 Экосистема (Волна 11)
- Extensions 2.0: манифесты (permissions + isolation), enable/disable с аудитом.
- Bundles одной кнопкой: `publishBundle/installBundle` — Agent Cards +
  Crews + Skills + Memory Packs через реальные делегаты
  (Crew/SkillMarket/LtMemory), отчёт `installed: ...`, событие `eco:installed`.
- Surfaces: browser/terminal/mobile/api/native — реестр одного Kernel.
- `exportConfig/importConfig` — декларативный док
  (`superagents-os-config`, policies+roles+extensions).
- `snapshot(label)` — инвентарь таблиц (count+digest) + конфиг-док;
  restore governance/ecosystem-подмножества — ручной review-шаг by design
  (системные таблицы не перезаписываются вслепую).

### Wiring
- Dexie **v30** additive (10 таблиц), `TrustRepository` (DAL `trust`),
  `phase30-trust` (3 сервиса), 4 события (`trust:*/eco:*`),
  lazy-сервисы, `stores/trustStore.ts`.

## Отложено на финальную проверку
- typecheck/build/tests/lint по trust-срезу, e2e
  grant→policy→trust→role→provenance→bundle→surface→config→snapshot→store.

## Следующая — Фаза D
Волна 12 (evals) + выборочно Волна 13.
