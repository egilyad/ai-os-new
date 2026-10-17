# Инвентаризация `docs/` (2026-10-17)

> Отчёт, только чтение. Ничего не перемещалось и не удалялось.
> Метод: `git grep -F` по каждому пути (код/README вне `docs/`, wiki-зеркало, остальные md),
> плюс ручной просмотр заголовков. Wiki (`docs/wiki/`, 136 файлов) — генерируется
> (`gen-wiki-docs.mjs`), в инвентаризацию не входит.

## Сводка

- Всего `.md` под `docs/`: **943** — из них `history/` 683, `wiki/` 136 (генерация),
  `audits/` 65, остальное ~59.
- Файлов верхнего уровня `docs/*.md`: **41**.
- «Боевой» набор, который отслеживает приложение: **31** файл в
  `src/components/DocsHealthPanel/docs-health-constants.ts` (`DOC_FILES`).
- Канонический указатель и таксономия — `docs/README.md`.

## A. Полностью потерянные (0 ссылок где угодно)

| Файл | Что это |
| --- | --- |
| `001-event-driven-architecture.md` | ADR-001 |
| `003-dexie-as-primary-storage.md` | ADR-003 |
| `004-hybrid-search-strategy.md` | ADR-004 |
| `NAVIGATION_MAP.md` | Раскладка меню (решение, не код) |

## B. Ссылки только из старых аудитов (фактически потерянные)

| Файл | Что это | Единственные ссылки |
| --- | --- | --- |
| `002-worker-sandboxing.md` | ADR-002 | `audits/_done/audits-2026-07/...` |
| `005-mcp-integration.md` | ADR-005 | `audits/_done/audits-2026-07/02-security.md` |
| `COMPANY_GATEWAY.md` | Серверный срез (M1–M9) | `audits/New folder/CRITICAL_BUGS_AUDIT.md` |
| `DEV_QUICKSTART.md` | Developer Quickstart | `audits/_done/Аудит_документации_.md` |

## C. Уже помечены заменёнными

- `PANEL_MAP.md` — ссылается только `superseded/README.md`; есть дубль `superseded/PANELS_MAP.md`.

## D. Живые, но с неполным покрытием в приложении

- `COGNITIVE_RUNTIME_SPEC.md` — ссылается `README_EN.md` и `docs-health-constants.ts` (ОК).
- ADR 001–005 (см. A/B) — в `DOC_FILES` не входят, приложением не видны.

## E. Папки-таксономия (по `docs/README.md`)

| Папка | .md | Внешних ссылок из кода | Комментарий |
| --- | --- | --- | --- |
| `active/` | 1 | 0 | только `README.md` — пусто |
| `reference/` | 6 | 0 | справочники; `roadmapp.md` лежит в reference (таксономическая ошибка) |
| `roadmap/` | 7 | 0 | планы без ссылок из кода |
| `superseded/` | 3 | 0 | заменённое |
| `audits/` | 65 | — | история проверок |
| `history/` | 683 | — | архив |
| `junk/` | — | — | **объявлена в `docs/README.md`, но её нет** |

## F. Не в git (untracked)

- `docs/audits/sovetigpt.md` — советы ИИ (не коммитим по договорённости).
- `docs/new/ro1.md` (14 КБ), `docs/new/ro2.md` (46 КБ) — `ro2` упоминается в `.env.example`.
- `docs/new/chatsro.md`, `docs/new/ppppp.md` — в git, но удалены в рабочем дереве.

## Замечания / риски

1. `docs/README.md` описывает папку `junk/`, которой нет.
2. `DOC_FILES` в приложении отстаёт от фактического набора (нет ADR 001–005,
   `COMPANY_GATEWAY.md`, `DEV_QUICKSTART.md`, `PANEL_MAP.md`).
3. ADR-серия (5 «Accepted») не связана ни с чем — при этом это ценные решения.
4. `docs/reference/roadmapp.md` — roadmap внутри справочника.

## Рекомендации (на будущее, не выполнено)

1. ADR 001–005 → `docs/reference/adr/` (+ строка-индекс) **или** `docs/history/`.
2. `NAVIGATION_MAP.md`, `COMPANY_GATEWAY.md`, `DEV_QUICKSTART.md` — назначить владельца:
   `reference/` (если актуальны) или `history/`.
3. `PANEL_MAP.md` — удалить (уже `superseded/`, дубль `PANELS_MAP.md`).
4. Синхронизировать `DOC_FILES` со фактическим набором и добавить раздел про ADR в `docs/README.md`.
5. Решить судьбу `docs/new/ro1.md`, `docs/new/ro2.md` (добавить в git или `.gitignore`).
