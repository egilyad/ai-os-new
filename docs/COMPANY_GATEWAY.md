# Company Gateway — сервер SuperAgents OS

> M1–M9 из `docs/audits/SuperAgents_OS_vs_Paperclip_Gap_Plan_2026-09-18.md`, серверный срез.
> Файлы: `server/sync-server.mjs`, `server/company-store.mjs`, `server/heartbeat-loop.mjs`,
> `server/adapters.mjs`, `cli/superagents.mjs`, `docker-compose.quickstart.yml`.
> UI/панели не тронуты. Старые ручки `/api/health`, `/api/db`, `/api/debates` без изменений.

## Запуск

```sh
SYNC_SECRET=<hex> SYNC_PORT=3001 node server/sync-server.mjs
# или quickstart: SYNC_SECRET=<hex> docker compose -f docker-compose.quickstart.yml up --build
# проверка:      node cli/superagents.mjs doctor --url http://localhost:3001
```

## Env

| Переменная | Дефолт | Смысл |
|---|---|---|
| `SYNC_SECRET` | — (обязателен) | Bearer-токен API и WS |
| `SYNC_PORT` | `3001` | Порт |
| `SYNC_ORIGINS` | `http://localhost:5173` | CORS allowlist; мутации без `Origin` → 403 |
| `HEARTBEAT_LOOP` | `1` | `0` — выключить обработку wakeups |
| `HEARTBEAT_POLL_MS` | `15000` | Тик loop (мин. 1000) |
| `HEARTBEAT_BATCH` | `10` | Wakeups за тик |
| `ADAPTERS_ALLOW_PROCESS` | `0` | `1` — разрешить `process`-адаптер (произвольные бинарники) |

## API (все, кроме `/api/health` и `/api/debates`, требуют `Authorization: Bearer`)

| Метод | Путь | Модуль |
|---|---|---|
| GET | `/api/health` | M1 |
| GET/PUT | `/api/db` | legacy blob-синк |
| GET | `/api/debates` | stub |
| GET | `/api/live-events` (SSE) | M1 |
| GET/POST | `/api/companies` | M1 |
| GET | `/api/companies/:id`, `/export`, `/activity?limit` | M1/M6/M8 |
| POST | `/api/companies/:id/heartbeat` `{note, agentId?}` — 402 при исчерпанном бюджете | M1/M7 |
| POST | `/api/companies/import` `{manifest, collision}` | M8 |
| GET/POST | `/api/companies/:id/agents` | M3 |
| GET | `/api/companies/:id/agents/:aid/chain` | M3 |
| GET/POST | `/api/companies/:id/issues` `?status&assignee` | M4 |
| GET | `/api/companies/:id/issues/:iid`, `/tree` | M4 |
| POST | `/api/companies/:id/issues/:iid/checkout` `{agentId}` — 409 у второго | M4 |
| POST/PUT | `/api/companies/:id/issues/:iid/status` `{status, agentId?, gate?}` — 400/409/422 | M4/M9 |
| GET/POST | `/api/wakeups` `?pending=1` | M1 |
| GET/POST | `/api/companies/:id/runs` `?status&limit` | M5/M2 |
| GET | `/api/runs/:rid` | M5 |
| POST | `/api/runs/:rid/execute` `{adapter, config, input}` | M2 |
| GET | `/api/adapters` · POST `/api/adapters/:t/test` | M2 |
| GET/POST | `/api/companies/:id/costs` `?agentId&limit` | M7 |
| GET/PUT | `/api/companies/:id/budget` `?agentId` | M7 |
| GET/POST | `/api/companies/:id/approvals` `?status` | M6 |
| GET | `/api/approvals/:id` · POST `/comments`, `/decide` `{decision, by?, comment?}` | M6 |

Коды: `401` без токена · `404` нет сущности · `400` валидация · `402` бюджет исчерпан ·
`409` checkout/decide конфликт · `422` escalate гейта (с `chain` менеджеров) ·
`403` выключенный адаптер · `502` падение адаптера.

## Контракты

- **Статусы задач:** `backlog→todo→in_progress→in_review→done`, `blocked/cancelled` (переходы валидируются).
- **Гейт (M9.1):** `in_review/done` требуют `gate: {confidence 0..1, citations[]}`:
  `≥0.75+цитата → proceed`; `0.40–0.75/без цитат → verify` (+`needsVerification`);
  `<0.40 → escalate` (422, статус не меняется).
- **Триггеры wakeup:** `schedule|assignment|comment|manual|approval`.
- **Шаги run:** `identity→assignments→pick→checkout→work→report`.
- **Коллизии импорта:** `rename` (суффикс `(2)`), `skip` (`{skipped:true}`), `overwrite`.
- **Экспорт** чистит секреты (`sk-…`, `xox…`, `gh…`, Bearer, api_key/secret/token/password).

## Данные (`data/`, gitignored)

`shared-db.bin` (legacy) · `companies.json` · `wakeups.json` · `costs.json` · `issues.json` ·
`heartbeat-runs.json` · `approvals.json` · `activity.json`. Бэкап: `cli … db-backup --out DIR`.

## CLI

`node cli/superagents.mjs onboard|doctor|db-backup|run --watch|configure budget` (см. `… --help`-вывод `usage()`).

## Проверки

Смоки лежат в `%TEMP%/opencode/m*.smoke.mjs` (не в репозитории): m11 (companies/wakeups),
m12 (loop), m31 (дерево), m71 (бюджет), m41 (issues), m51 (runs), m21 (адаптеры),
m61 (governance), m81 (portability), m91 (гейт), m92 (CLI), m93 (quickstart YAML).
Каждый: `node --check` затронутых файлов + HTTP-прогон + регресс соседних модулей.
