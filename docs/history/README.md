# 🟠 HISTORY — историческая ценность

Старое, но полезное для понимания эволюции: закрытые аудиты, завершённые волны,
исследования. Сохраняем для контекста, не используем как источник текущего состояния.

## Правила

- Каждый перенос фиксируется строкой в журнале ниже.
- N-серия (`N1_AUDIT…N4d_POST_AUDIT`), `D4.x`, `T1.x–T3.x`, `AUDIT_PROMPT_*` — кандидаты сюда.
- `docs/experementmdroadmaps/` (596 файлов) — research-корпус, переносить целиком отдельным коммитом.

## Журнал

| Дата | Что | Откуда |
|---|---|---|
| 2026-09-18 | N-серия (N1…N4d + POST, 12 файлов) — закрытые PASS-static батчи | `docs/` |
| 2026-09-18 | T-серия (T1.2…T3.2 POST, 6 файлов) — закрытые done-батчи | `docs/` |
| 2026-09-18 | D-планы и префлайты (D2×3, D3, D4.3×6, D4.4, D4.5×3, D4.6, 12 файлов) | `docs/` |
| 2026-09-18 | `R-GAP-03_POST_AUDIT.md` (R-GAP-03 CLOSED-static) | `docs/` |
| 2026-09-18 | Промпты аудитов (`AUDIT_PROMPT_V2/V3/V4`, `CAPABILITY_PROMPT_V6`, `CONSOLIDATION_PROMPT`) | `docs/` |
| 2026-09-18 | `DEBATE_SYSTEM_AUDIT_D1.md` (GAP-01…11), `DEBATE_RUNTIME_REAUDIT_POST_N4.md` (R-GAP-01…18), `COUNCIL_DEBATE_CONSOLIDATION_AUDIT.md` — источники открытых гэпов, см. `../audits/OPEN_GAPS.md` | `docs/` |
| 2026-09-19 | `road/` расформирован (62 файла): волны DONE (WAVE1–5), фазы DONE (A–E, G–Z, P–U), RIVALS-сравнения, GAP_G1–G8 closure, `GAPS_VS_CREWAI.md`, `roadm.md` (вытеснен `roadmap2`/`IMPLEMENTATION_PLAN`), `INVOCATION_ENGINE.md` (DESIGN ONLY, без ссылок из кода), `MIGRATION_MAP_CONVERSATION_CORE.md` (Step A CLOSED) | `docs/road/` |
| 2026-09-19 | `new/`: `CONSOLIDATED_PLAN.md` (2026-07-31), `AUDIT_GAP_PLAN.md` (2026-08-05), `agentsplan.md` (заметки), `missing-panels-42.md` (сам помечен historical); `research/nightly/` (16 файлов, research-лог). `chatsro.md` не тронут (untracked, рабочая заметка) | `docs/new/`, `docs/plan/`, `docs/research/` |
