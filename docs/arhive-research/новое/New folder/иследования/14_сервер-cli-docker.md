# Отчёт сабагента: Сервер, CLI, Docker

## 1. server/ — файлы

**Верхний уровень (8 .mjs):**

| Файл                         | Назначение                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| sync-server.mjs (1286 стр)   | HTTP+WebSocket; REST «Debate-as-a-Service»; auth; rate-limit; CORS/Origin; SSE; DB upload/download; heartbeat-loop; reaper                  |
| company-store.mjs (1050 стр) | JSON-файлы (atomic write tmp+rename): companies/agents/wakeups/issues/runs/approvals/activity/costs; бюджет, gate, export/import, redaction |
| adapters.mjs (559 стр)       | Реестр внешних рантаймов: echo/http/process/browser-use/computer-act; SSRF-guard; allowlist; kill-switch                                    |
| heartbeat-loop.mjs (177 стр) | Polling pending-wakeups → run + heartbeat; autocycle-guard; reaper                                                                          |
| autocycle-guard.mjs (88 стр) | Квота автоцикла (daily лимит на компанию)                                                                                                   |
| write-queue.mjs (27 стр)     | Сериализованная очередь записи + self-healing                                                                                               |
| ws-auth.mjs (47 стр)         | verifyWsUpgrade (subprotocol sync-token или Bearer), timingSafeEqual                                                                        |
| run-dev.mjs (28 стр)         | Dev: spawn sync-server + Vite                                                                                                               |

**tests/ (7, node:test):** autocycle, browser-use-adapter, computer-act-adapter, decide-approval, run-integrity, wakeup-issue, write-queue, ws-auth.

## 2. REST / WS / store

**REST (все под /api/\*):**

- Глобальные: GET /api/health; GET/PUT /api/db (blob, ≤50MB, no-store); GET /api/live-events (SSE); GET /api/debates (заглушка); GET /api/adapters; POST /api/adapters/:key/test.
- Companies: GET/POST /api/companies; GET /api/companies/:id; POST :id/heartbeat (hard-stop при budget → 402); GET/POST :id/agents; GET :id/agents/:agentId/chain; GET/POST :id/costs; GET/PUT :id/budget; GET/POST :id/issues; GET :id/issues/:issueId/tree; POST :id/issues/:issueId/checkout (atomic 409); POST/PUT :id/issues/:issueId/status (gate 422 ESCALATE); GET :id/issues/:issueId; GET/POST :id/runs (POST → startRun); GET/POST :id/approvals; GET :id/activity; GET :id/export; POST /api/companies/import.
- По id: GET /api/runs/:id; POST /api/runs/:id/execute; GET /api/approvals/:id; POST :id/comments; POST :id/decide (409 SETTLED).

**WebSocket (wss):** WS rate-limit 10/мин/IP → Origin → verifyWsUpgrade; maxPayload 1MB. События broadcastLive (WS+SSE): connected, db_changed, company_created, company_heartbeat, wakeup_enqueued, agent_hired, cost_recorded, budget_updated, issue_created, issue_checkout, issue_status, run_started, run_executed, approval_requested, approval_commented, approval_decided, company_exported, company_imported, wakeup_done, wakeup_error. Reaper 30с.

**company-store сущности:** companies.json (company + agents), wakeups.json (cap 5000, evict acked), issues.json (переходы + gate confidence/citations), heartbeat-runs.json (cap 5000; шаги identity→assignments→pick→checkout→work→report), approvals.json (side-effects hire/override/ceo_strategy + C-5 recovery), activity.json (cap 10000), costs.json (cap 20000; monthSpend/budgetStatus/isOverBudget hard-stop), autocycle.json.

**write-queue:** enqueueDbWrite(fn) через chain; падение юнита не ломает очередь. Используется для PUT /api/db.

**heartbeat-loop:** каждые HEARTBEAT_POLL_MS (15с): reapStaleRuns (30мин) → batch wakeups (10) → consumeAutocycleSlot → создать run → шаги → isOverBudget hard-stop → heartbeatCompany → finishRun/ackWakeup → события. HEARTBEAT_LOOP=0 отключает.

**export/import:** exportCompany → манифест {format:'superagents-company/1', company, agents, issues} + redactSecrets; importCompany — двухпроходный ремаппинг id, collision rename/skip/overwrite.

**Адаптеры:** echo (всегда), http (SSRF assertPublicUrl), process (ADAPTERS_ALLOW_PROCESS=1; без shell, SIGKILL по таймауту), browser-use (ADAPTERS_ALLOW_BROWSER_USE=1; sidecar POSTexecute; allowlist; maxSteps≤50), computer-act (ADAPTERS_ALLOW_COMPUTER_ACT=1; /act; 18 actions).

## 3. Авторизация / безопасность

- SYNC_SECRET обязателен (fail-fast), через env или SYNC_SECRET_FILE. REST Bearer + timingSafeEqual. WS subprotocol sync-token или Bearer; Origin-проверка до token; query-параметр ?token= удалён.
- Rate-limit: HTTP 30 req/мин/IP, WS 10 conn/мин/IP. SYNC_TRUST_PROXY от1 только за прокси (rightmost XFF). Origin: SYNC_ORIGINS (default http://localhost:5173), * разрешает все; mutating требует Origin.
- readJsonBody 256KB (413 на /db 50MB). Слушатель default 127.0.0.1; предупреждение plaintext Bearer без TLS. Shutdown SIGINT/SIGTERM + recoverApprovals() (C-5). Санитизация ошибок.

## 4. browser-sidecar (Node Playwright)

/health, /act (action-level: open_url/browser_navigate/click_at/click_selector/type_text/extract_text_selector/extract_table/extract_schema/scroll/screenshot/extract_text/get_url), /execute (task-эвристика). Auth BROWSER_SIDECAR_TOKEN. SSRF validateUrl (http(s) + allowlist). Loopback 3100. Есть вторая реализация — docker/browser-use-sidecar/server.py (FastAPI+browser-use), используется в Docker.

## 5. CLI (superagents.mjs)

Без зависимостей; `--key value --/flag`; --url default http://localhost:3001, secret из --secret/SYNC_SECRET.

| Команда          | Что                                                                  |
| ---------------- | -------------------------------------------------------------------- |
| onboard          | создаёт data-dir, sync-secret.txt (0600)                             |
| doctor           | проверяет node≥22, синтаксис сервера, writable data-dir, /api/health |
| db-backup        | копирует data/*.json                                                 | *.bin + backup.json |
| run              | POST /api/wakeups (enqueue); --watch поллинг до done/error (90с)     |
| configure budget | PUT /api/companies/:id/budget                                        |

## 6. Docker

- docker-compose.yml: dev (127.0.0.1:80:8080), prod (HTTPS 443:8443 + redirect, certs), browser (sidecar).
- quickstart: ui (nginx) + gateway (node:22-alpine, user node, монтирует .:/app:ro и ./data:/app/data:rw; env SYNC_SECRET, SYNC_PORT=3001, SYNC_ORIGINS, HEARTBEAT__, ADAPTERS_ALLOW__, BROWSER_USE_ACT_URL; healthcheck) + browser-use-sidecar (профиль browser; env BROWSER_USE_ALLOWED_DOMAINS, LLM_API_KEY/PROVIDER/MODEL/BASE_URL).
- Dockerfile: 2 стадии; runtime nginx-unprivileged; entrypoint envsubst (API_UPSTREAM, PROXY__; PROXY_FETCH пустой → 501 fail-closed); SSL требует certs; VITE__ build-args.
- Env: PROXY_GEMINI/OPENROUTER/NVIDIA/GROQ/CEREBRAS/CLOUDFLARE/FETCH/OPENAI; VITE_BASE_PATH/VITE_SANDBOX_ENABLED/VITE_PROXY__; SYNC__ / HEARTBEAT_* / ADAPTERS_ALLOW_* / COMPANY_DATA_DIR / AUTOCYCLE__; BROWSER__.

## 7. Gap'ы командного режима

1. Нет auth по пользователям (один глобальный SYNC_SECRET, без ролей/сессий).
2. Нет tenant-изоляции (любой владелец секрета видит все компании).
3. Нет мульти-команды/dep-графа/exit-code-агрегации (--watch ждёт один wakeup).
4. Персистентность на JSON-файлах (без транзакций по нескольким файлам).
5. CLI не покрывает: компании/агенты/issue/approvals/runs-просмотр/eval.
6. Нет серверной оркестрации самих агентов (цикл агент→LLM→инструменты живёт в браузере).
7. Нет eval-харнесса на сервере (eval-стек только в браузере: eval-dataset-service, llm-judge-service, scorer-registry-service).

## 8. Eval через сервер

Прямо нет. Есть экзекуционный конвейер: POST /api/companies/:id/runs → POST /api/runs/:id/execute (adapter echo/http/process/browser-use/computer-act) → finishRun. Адаптер process/HTTP — путь для headless-eval-транспорта, но сами SPEC_04-сущности/судьи/метрики нужно переносить из src/ на сервер/CLI.
