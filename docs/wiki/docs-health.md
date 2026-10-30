<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Здоровье документации

> Раздел: **Диагностика** · Статус: verified · Теги: диагностика, документация, качество, метрики

Источники: `scripts/lib/docs-health.mjs`, `scripts/gen-wiki-docs-health.mjs`, `src/generated/wiki-docs-health.ts`

# Здоровье документации

> Автосгенерировано `scripts/gen-wiki-docs-health.mjs` из реального прогона проверки.
> Не редактировать вручную — обновляется вместе с викой.

Документация — такой же артефакт системы, как код: её можно проверять объективно.
Эта страница собирается из тех же проверок, что гоняет CI (`npm run docs:health`),
и показывает, *откуда* берётся каждое число.

## Показатели

| Показатель | Значение | Как считается |
| --- | --- | --- |
| Статей проверено | 284 | файлы `docs/wiki/*.md`, кроме индекса и этой страницы |
| Битые ссылки на исходники | 15 | пути из строки «Источники:» резолвятся как модули (расширение / index / glob) |
| Битые внутренние ссылки | 0 | markdown-ссылки внутри статей ведут на существующие файлы |
| Неполные статьи | 9 | текст короче 250 символов или пометка «пока не написана» |
| Статьи без источников | 36 | отсутствует строка «Источники:» (из них помечены verified: 0) |
| Панели с документацией | 178/184 | обычные панели из реестра маршрутов сопоставлены со статьёй |
| &nbsp;&nbsp;авто-панели техник | 84 | покрыты статьёй [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md), пробелом не считаются |
| Проблемы манифеста | 0 | ссылки в `docs/manifest.json` резолвятся |
| Проблемы модели сущности | 0 | `docs/entity-model.json` разбирается и соответствует [Стандарт документации](./docs-standard.md) |
| README → вики | 138 (RU) / 138 (EN) | ссылки README.md и README_EN.md в `docs/wiki/*.md` резолвятся |
| README RU/EN расхождение | 0 | разница наборов статей между README.md и README_EN.md |
| Статьи вне README | 147 | не залинкованные напрямую из README.md |
| Статьи недостижимые по ссылкам | 3 | нет пути от README через внутренние ссылки (каталоги, индексы) |

Итог: **есть проблемы** — hard-ошибок: 15.

## Что требует внимания

Битые источники (15):
- agents → `docs/audits/agent-team-audit-memory-history-management.md`
- architecture → `docs/SYSTEM_MANIFEST_RU.md`
- audit-index → `docs/audits/`
- audit-methodology → `docs/audits/`
- audit-overview → `docs/audits/`
- audit-textbook → `docs/audits-tips/auditstips.md`
- comp-overview → `docs/SERVICES_RU.md`
- diagnostics → `docs/audits/agent-team-audit-memory-history-management.md`
- execution-trail → `docs/audits/agent-team-audit-memory-history-management.md`
- fetched-sites → `docs/fetched-sites/README.md`
- memory → `docs/audits/agent-team-audit-memory-history-management.md`
- research-multiagent-patterns → `docs/research/multiagent-os-patterns.md`
- research-os-index → `docs/research/`
- roadmap-notes → `docs/roadmap/README.md`
- what-is → `docs/SYSTEM_MANIFEST_RU.md`

Панели без статьи (6):
- exceptions (dashboard)
- memory-center (dashboard)
- nav-graph (dashboard)
- defect-map (dashboard)
- wiki-brain (wiki)
- architecture-map (wiki)

Недостижимы от README по ссылкам (3):
- audit-textbook
- fetched-sites
- record-a-skill

## Как это проверяется

- Логика: `scripts/lib/docs-health.mjs` — одна на CLI и на эту страницу.
- CLI: `npm run docs:health` — печатает отчёт и падает при hard-ошибках.
- Эта страница: `npm run gen:wiki-docs-health` → `src/generated/wiki-docs-health.ts`.
- CI (job quality): шаг «Documentation health» гоняет CLI; «Wiki docs in sync» проверяет,
  что страница и зеркало не устарели. Больше о генераторах — в [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md).

---

## Связанные материалы

- [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md)
- [Разработчикам: ворота качества и CI](./dev-ci.md)
- [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md)
- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)
