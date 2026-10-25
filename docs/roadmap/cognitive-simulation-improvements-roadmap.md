# Roadmap улучшений «Когнитивная оркестрация / Симуляция / Тайм-тревел»

> **Источник:** аудит `docs/audits/cognitive-simulation-audit.md` (C1–C8).
> **Ветка:** `ai-os-new-fix-debate-text-truncation`.

---

## Sprint 1 (P0) — быстрые фиксы

| Задача | ID | Сложность |
|---|---|---|
| Заполнять `timeline` в `CausalTimelineService.getTrace` | C2 | средняя |
| Реализовать/задокументировать селекцию в `makeDecision` | C1 | низкая |

## Sprint 2 (P1) — средние

| Задача | ID | Сложность |
|---|---|---|
| Авто-подключение `agentActAdapterService` в `SimulationEngineService` | C3 | средняя |
| Фильтрация/лимит при `recorder.getAll()` в replay | C6 | средняя |
| Unit-тесты на ядро (cognitive/orchestration/causal/temporal) | C8 | средняя |

## Sprint 3 (P2) — архитектура

| Задача | ID | Сложность |
|---|---|---|
| Расширить когнитивные метрики на память/прочие источники | C4 | высокая |
| Честная оценка токенов по полному тексту | C5 | средняя |

---

## Ссылки

- Реестр дефектов — `docs/audits/cognitive-simulation-audit.md`.
- Вики: `comp-cognitive-orchestration`, `comp-simulation-world`, `comp-time-travel`.
