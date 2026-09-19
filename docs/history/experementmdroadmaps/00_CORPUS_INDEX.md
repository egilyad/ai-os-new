# Corpus index — autonomous read-only research (2026-09)

> Перенесено сюда одним блоком из `docs/experementmdroadmaps/` 2026-09-19.
> 543 md-файла, read-only исследование («no source changed, no commits»).
> Внутренние перекрёстные ссылки сохранены — не рассыпать по папкам.
> Свежесть проверена 2026-09-19: 517/519 ссылок на код живы.

## Структура

| Путь | Что внутри |
|---|---|
| `agents/00_AGENTS_MASTER_MAP.md` + `01–25_agent-*` (×16 файлов) + `26–31` synthesis | 25 агентов: `00_PROFILE`, `01_CURRENT_STATE`…`10_PROBLEMS` (снапшоты), `11_OPPORTUNITIES` (бэклог), `12_FUTURE`, `13_ROADMAP`, `14_ALTERNATIVE`, `15_DO_NOT_BUILD_YET` (запреты) |
| `debate/`, `forum/`, `design/`, `usability/`, `observability/`, `audit_log/`, `cost_attribution/`, `workflow_scheduler/` | Тематические блоки: мастер-карты,ROADMAP A/B/C, `*_DO_NOT_BUILD_YET` |
| Корень: `QUICK_WINS.md`, `BIG_BETS.md`, `BIG_IDEAS.md`, `DO_NOT_BUILD_YET.md` | Синтез: быстрые победы / крупные ставки / запреты |
| Корень: `ROADMAP_*.md` (12 файлов) | A/B/C-альтернативы, сравнение, decision matrix, hybrid |
| Корень: `PANEL_REVIEWS.md`, `SERVICE_REVIEW.md`, `*_OPPORTUNITIES.md`, `RESEARCH_PROGRESS.md` | Ревью панелей/сервисов, прогресс исследования |

## Маркировка утверждений

- `[VERIFIED]` / `(VERIFIED)` — сверено с кодом на момент написания
- `[OPINION]` / `[INFERRED]` — предположение, требует проверки
- Без метки — описывает код (проверять давность по дате файла)

## Как пользоваться

1. Нужен запрет («не строить»)? → `15_DO_NOT_BUILD_YET.md` агента + корневой `DO_NOT_BUILD_YET.md`.
2. Нужна задача? → `11_OPPORTUNITIES.md` (Effort/Risk/шов в коде) + `QUICK_WINS.md`. Статус «сделано/нет» — в `docs/audits/OPPORTUNITIES_CHECKLIST.md`.
3. Нужен контекст, «как было»? → `01–10` файлы агентов, мастер-карты блоков.
