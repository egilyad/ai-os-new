# 🟣 ROADMAP — планы и архитектурные направления

Активные планы: у каждого владелец, статус и следующий шаг.
Завершённые волны и сравнения — в `../history/`, competing-черновики без владельца — туда же.

## Правила

- Один план — один владелец. Без владельца → `../history/` с пометкой `historical`.
- Несколько конкурирующих роадмапов (`AGEMS_ROADMAP.md`, `roadmap2.md`, `roadm.md`, `roadmapp.md`, `IMPLEMENTATION_PLAN.md`) — выбрать один активный, остальные в историю.
- `docs/road/` (68 файлов) — разобрать: active сюда, завершённое в `../history/`.

## Состав

- `AGEMS_ROADMAP.md` — портирование AGEMS в SuperAgents OS (активен, на него ссылается код, по нему идёт текущая работа).
- `IMPLEMENTATION_PLAN.md` — план внедрения когнитивных модулей (основан на `roadmap2.md` + архитектура v4.5.0).
- `roadmap2.md` — роадмап следующего уровня («после Волны 5»).
- `DEBATE_MULTI_SESSION_DESIGN.md` — дизайн multi-session дебатов (на него ссылается код: `activeDebateStore`, `debate-sync-manager`).
- `CHAT_DESIGN.md` (Этап 2, 2026-09-17) — минимальный план исправлений чата по `CHAT_ARCHAEOLOGY.md` + `CURRENT_CHAT_FAILURES.md` (оба в `../audits/`).
- `roadmapp.md` живёт в `../reference/` — нормативный док для project-контрактов (на него ссылается `IProjectManagerService`).
