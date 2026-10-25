# Аудит подсистемы «Флот / Governance» — реестр дефектов и рисков

> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Метод:** чтение кода/grep (без запуска тестов), 2026-10. Статусы: `[V]` — подтверждено кодом; `[SA]` — статический анализ; `[H]` — гипотеза; `[NV]` — не проверено.

---

## 0. Карта подтверждённых фактов

- **FleetMonitorService** — read-only проекция миссий; без супервизии/restart/health.
- **DeployBundleService** — статическая заглушка (`BLOCKED-RUNTIME`); `DeployService` (старый) — in-memory.
- **GovernanceService** — capability-гранты, trust-EMA, роли; `evaluate()` по умолчанию **fail-open** (`allow`).
- **PolicyService** — PII-редиакция, agent-policies; дефолтные политики (content/custom/rate_limit) заданы, но не подключены.
- **AgentPermissionService** — каскад правил, circuit-breaker эскалация (3 denials → deny).
- **ToolGovernanceService** — MCP default-deny.
- **AuditService** — hash-chained (fnv1a), `verify()`.

---

## 1. Дефекты и риски

| ID | Суть | Статус | Доказательство |
|---|---|---|---|
| F1 | `GovernanceService.evaluate()` по умолчанию fail-open (`allow`) — против принципа минимальных привилегий; при этом capability-проверка fail-closed | [V] | `governance-service.ts:81,171` |
| F2 | Неаутентифицированные мутации `PolicyService` (add/remove/update/setAgentPolicy/addSecurityPattern) без проверки прав | [V] | `policy-service.ts:111` |
| F3 | `GovernanceService` не гейтит свои методы ролями (`can()`/`ROLE_CANDO` определены, но не вызываются внутри) | [V] | `governance-service.ts` |
| F4 | Дефолтные политики (content/custom/rate_limit) заданы, но не подключены к исполнению (работают только latency+privacy) | [V] | `policy-service.ts:272-293` |
| F5 | Флот — только проекция; нет супервизии/restart/health; нет тестов у `FleetMonitorService` | [V] | `fleet-monitor-service.ts` |
| F6 | Деплой статичен (`BLOCKED-RUNTIME`); `DeployService` in-memory | [V] | `deploy-bundle-service.ts:5,98` |
| F7 | `AuditService.verify()` ограничен `listAudit(100000)` — при >100k записей целостность не проверится | [SA] | `audit-service.ts:76-87` |
| F8 | Два параллельных аудит-лога: hash-chained `AuditService` и Dexie `AgemsAuditService` (без целостности) | [V] | `audit-service.ts`, `agems-audit-service.ts` |
| F9 | Нет тестов на `AuditService`, `GovernanceService`, `FleetMonitorService`, `ToolGovernanceService` | [NV] | отсутствие `*.test.ts` |
| F10 | Роль-матрица `RolesPanel` (UI) не связана с enforcement (в коде связи с `AgentPermissionService`/`GovernanceService` не найдено) | [H] | `RolesPanel/*` |
| F11 | Нет сервиса секретов — только контракт/доки; деплой-редиакция не через безопасное хранилище | [SA] | контракт `secret-store.ts` |

---

## 2. Рекомендуемые приоритеты

- **P0 (быстрые/безопасные):**
  - F4 — подключить дефолтные политики (content/custom/rate_limit) к исполнению в `PolicyService`.
  - F2 — добавить хотя бы локальную проверку прав/роли перед мутациями политик.
- **P1 (средние):**
  - F3 — вызывать `can()` внутри `GovernanceService` для гейтинга собственных методов.
  - F9 — добавить unit-тесты на `AuditService`/`GovernanceService`/`FleetMonitorService`.
  - F7 — убрать мягкий лимит `verify()` (или сделать его явным).
- **P2 (крупные):**
  - F1 — решить модель fail-open vs fail-closed единообразно (рекомендация — default-deny с явными allow-правилами).
  - F5/F6 — реальная супервизия флота и деплой.
  - F8 — свести два аудит-лога к одному.

Подробный план — `docs/roadmap/fleet-governance-improvements-roadmap.md`.
