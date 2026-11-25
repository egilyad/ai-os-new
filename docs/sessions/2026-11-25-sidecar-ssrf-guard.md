# 2026-11-25 — sidecar-ssrf-guard

Статус: done

## Цель сессии

Ре-аудит P0-3: Python browser-use sidecar разрешал loopback и RFC1918.

## Что сделано (файлы + коммиты)

- `docker/browser-use-sidecar/ssrf_guard.py` — отдельный stdlib-модуль: блокировка loopback/RFC1918/link-local/CGNAT/metadata/IPv6 ULA, DNS-резолвинг всех A/AAAA и проверка каждого адреса.
- `server.py` — использует guard; добавлен route-level redirect guard в Playwright fallback и явная проверка `page.url`; allowlist доменов передаётся агенту в текст задачи.
- Тесты `tests/test_ssrf_guard.py` — 4/4.

## Принятые решения (+ почему; кандидат в ADR?)

- Dev-исключение для localhost — только через `BROWSER_USE_ALLOW_LOCALHOST=1`, по умолчанию запрещено.
- Guard вынесен в отдельный модуль без сторонних зависимостей — тестируется обычным `python -m unittest` без fastapi.
- Redirect проверяется на уровне `page.route('**/*')`, а не только после навигации.

## Обнаруженные проблемы / гипотезы

- Факт: browser-use agent получает ограничение domains текстом в prompt — это смягчение, не жёсткий сетевой гейт внутри библиотеки.
- Гипотеза: для полной изоляции нужна сетевая политика контейнера (egress allowlist) — отдельный контур.
- Python-зависимости fastapi/playwright локально не установлены; проверен только stdlib-модуль и синтаксис server.py.

## Результаты проверок (typecheck/lint/test — что запускалось)

- `python -m unittest discover -s docker/browser-use-sidecar/tests` — 4/4.
- `ast.parse(server.py)` — синтаксис OK.

## Следующий логический шаг

P0-7: authz в Agent/Crew mutations; затем P0-9 (токены в localStorage).

---

## Факты (авто, из checkpoint.mjs)

- Ветка: main @ 9f4125b
- Изменённых файлов: 3
  - M docker/browser-use-sidecar/server.py
  - ?? docker/browser-use-sidecar/ssrf_guard.py
  - ?? docker/browser-use-sidecar/tests/
- Diff stat:
  - docker/browser-use-sidecar/server.py | 43 ++++++++++++++++--------------------
  - 1 file changed, 19 insertions(+), 24 deletions(-)
- Последние коммиты:
  - 9f4125b fix(memory-worker): keep message chain alive after errors
  - 03e8648 fix(data): clear every Dexie table in clearAllData
  - f89235d feat(sse): support Last-Event-ID replay and tenant filtering
  - 02545ff refactor(groq): route requests through shared HTTP stack
  - f270e38 feat(budget): wire persistent hard-stop into LLM decorators
