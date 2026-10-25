# Roadmap улучшений «Агенты/Совет»

> **Источник:** аудит `docs/audits/agents-council-audit.md` (A1–A9).
> **Ветка:** `ai-os-new-fix-debate-text-truncation`.

---

## Sprint 1 (P0) — быстрые фиксы

| Задача | ID | Статус |
|---|---|---|
| Детерминированный выбор техники в `MetaControllerService` | A4 | ✅ реализовано |
| Единый хелпер сборки systemPrompt (роль+навыки+линзы) | A9 | план |

## Sprint 2 (P1) — средние

| Задача | ID |
|---|---|
| Явный guard/warning при `EchoExecutor` (не маскировать «без ИИ») | A2 |
| Убрать retry-гонку lazy-прокси в `CouncilPanel` | A8 |
| Заменить mock-сиды рынка на реальный каталог/поиск | A7 |

## Sprint 3 (P2) — архитектура

| Задача | ID |
|---|---|
| Свести таллировку совета к одному canonical-пути (фасад → `WeightedJudgeEvaluator`) | A1 |
| Двусторонний мост council↔debate | A3 |
| Унифицировать/документировать каталоги `rivals*` | A5 |

---

## Ссылки

- Реестр дефектов — `docs/audits/agents-council-audit.md`.
- Вики: `comp-agents-roles-skills`, `comp-crews-councils`, `comp-rivals-lab`, `comp-frontier-diversity`.
