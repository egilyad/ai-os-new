# Роадмап: Инфраструктура — сервер, CLI, Docker, CI, скрипты-генераторы

> Область кода: `server/`, `cli/`, `scripts/`, `docker/`, `.github/`, `.husky/`,
> `e2e/`, `vite.config.ts`, `tsconfig*`, `.dependency-cruiser.cjs`.

## Что есть сегодня

### Сервер (`server/`)

- `sync-server.mjs` — WebSocket-сервер синхронизации (XFF trust opt-in, WS maxPayload, SIGTERM drain).
- `browser-sidecar.mjs` — sidecar-исполнитель для browser/computer-use (loopback-биндинг, Bearer, SSRF-allowlist).
- `run-dev.mjs` — dev-сборка (Vite + прокси + typecheck вместе).
- Тесты: `server/tests/` (write-queue, decide-approval, run-integrity, wakeup-issue, autocycle, ws-auth, browser-use-adapter, computer-act-adapter).

### Прокси (`scripts/cors-proxy.mjs`)

- CORS-прокси для инструментов и LLM-провайдеров (`/proxy/*` роуты).

### CLI (`cli/superagents.mjs`)

- Запуск «суперагентов» из терминала.

### Скрипты-генераторы (`scripts/`, ~40 .mjs)

- Wiki: gen-wiki-docs/manifest/connections/docs-health/system-map/history/capabilities/checks/coverage/libraries/panel-catalog/site/readme-maps/fetched-catalog/audit-prompts-site.
- Инфраструктура: fix-unused, upload-sourcemaps.

### CI / качество

- ESLint (eslint.config.js), Prettier, commitlint, husky + lint-staged.
- `check:circular-kernel` (madge), `check:deps` (dependency-cruiser).
- Vitest (v4), Playwright e2e (v1.59).
- Типы: TS 6.0 strict, 4 tsconfig (app/node/test).

---

## Пробелы и риски

1. **CI deploy-гейт без тестов**; `test:stable` неполный; `--ignore-scripts` (W4-001/002/036).
2. Документация-генераторы генерируют огромный wiki, но часть ссылок битая (см. `ROADMAP_00`).
3. Нет публикации артефактов/релизного процесса (semver вручную).
4. Нет полноценного «observability-сервера» (логи/метрики в одном месте).

---

## Роадмап

### P0 — CI/качество

- [ ] CI-гейты: прогон `typecheck` + `lint` + `test:stable` + `check:circular-kernel` на каждый PR.
- [ ] Включить тесты в deploy-гейт (убрать `--ignore-scripts`).
- [ ] Починить битые ссылки в docs/audits (см. `ROADMAP_00` Фаза 0).

### P1 — Серверное

- [ ] **Опциональный командный режим**: sync-server + авторизация + изоляция tenant (см. `ROADMAP_07`).
- [ ] Сквозное логирование сервера (единый JSON-логи, retention).

### P2 — Релизы

- [ ] **Авторелизы** (semantic-release), ченджлог из коммитов (commitlint-конвенции уже есть).
- [ ] **Сборка приложений** (Electron/Tauri) для офлайн-десктопа — расширяет аудиторию.

### P3 — Инфраструктура знаний

- [ ] Свести генераторы wiki в единый «docs-pipeline» с валидацией и проверкой ссылок до публикации.

---

## Критерии «готово»

- CI прогоняет весь стабильный набор и блокирует merge при падении.
- Ссылки документации валидны.
- Релизный процесс автоматизирован.
