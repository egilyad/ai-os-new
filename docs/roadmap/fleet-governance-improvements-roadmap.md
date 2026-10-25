# Roadmap улучшений «Флот / Governance»

> **Источник:** аудит `docs/audits/fleet-governance-audit.md` (F1–F11).
> **Ветка:** `ai-os-new-fix-debate-text-truncation`.

---

## Sprint 1 (P0) — быстрые фиксы

| Задача | ID | Сложность |
|---|---|---|
| Подключить дефолтные политики (content/custom/rate_limit) к исполнению | F4 | средняя |
| Проверка прав/роли перед мутациями политик | F2 | средняя |

## Sprint 2 (P1) — средние

| Задача | ID | Сложность |
|---|---|---|
| Вызывать `can()` внутри `GovernanceService` | F3 | низкая |
| Unit-тесты на `AuditService`/`GovernanceService`/`FleetMonitorService` | F9 | средняя |
| Убрать/сделать явным лимит `verify()` | F7 | низкая |

## Sprint 3 (P2) — архитектура

| Задача | ID | Сложность |
|---|---|---|
| Единая модель fail-open/fail-closed (против. — default-deny) | F1 | высокая |
| Реальная супервизия флота и деплой | F5/F6 | высокая |
| Свести два аудит-лога к одному | F8 | средняя |

---

## Ссылки

- Реестр дефектов — `docs/audits/fleet-governance-audit.md`.
- Вики: `comp-fleet-governance`, `comp-policy-security`, `comp-secrets-locks`.
