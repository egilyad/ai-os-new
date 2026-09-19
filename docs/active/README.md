# 🟢 ACTIVE — актуальная документация

Документы, которыми реально пользуемся каждый день и которые описывают **текущую** ветку.
Индекс — `docs/README.md`.

## Правила

- Каждый документ имеет дату последней проверки (`verified:` в шапке).
- Описывает код текущей ветки; разошёлся с кодом → чинить или переносить в `../history/` / `../superseded/`.
- Сюда НЕ кладутся: аудиты (→ `../audits/`), планы (→ `../roadmap/`), справочники контрактов (→ `../reference/`).

## Состав

Активный канон живёт в **корне `docs/`** (не здесь) — так требуют потребители в коде:
`DocsHealthPanel` (`DOC_FILES`), `DebateResearch`-компоненты, `code-manifest`, `hypothesis-service`
фетчат пути вида `docs/00-overview.md` на рантайме. Перемещение канона = править все эти
места в том же коммите.

Канон корня: `00–10` (EN+RU, 22 файла), `events.md`, `STRUCTURE.md`, `SERVICES_RU.md`,
`SYSTEM_MANIFEST*.md`, `SYSTEM_PASSPORT.md`, `ПОЛНЫЙ_РЕЕСТР.md`, `DEBT_REPORT.md`,
`COGNITIVE_RUNTIME_SPEC.md`, `PANEL_MAP.md` (автоген), `DEV_QUICKSTART.md`, `README.md`,
ADR `001–005`. Эта папка (`active/`) — для новых активных документов вне канона.
