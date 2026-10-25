# Roadmap улучшений «Утилиты / Инфраструктура»

> **Источник:** аудит `docs/audits/utils-audit.md`.
> **Ветка:** `ai-os-new-fix-debate-text-truncation`.

---

## Sprint 1 (P0) — орфаны

| Задача | Сложность |
|---|---|
| Подключить или пометить как неиспользуемые: `constant-time`, `persist-then-emit`, `provider-fleet-health`, `debate-analysis` | низкая |

## Sprint 2 (P1) — тесты

| Задача | Сложность |
|---|---|
| Тесты на `probe-service`, `seedable-rng`, `tokenEstimate`, `provider-default-models` | средняя |

## Sprint 3 (P2) — подключение

| Задача | Сложность |
|---|---|
| Подключить `Outbox`/`provider-fleet-health`/`debate-analysis` в реальные потоки (если нужны) | высокая |

---

## Ссылки

- Реестр дефектов — `docs/audits/utils-audit.md`.
- Вики: `comp-util-network-security`, `comp-util-embeddings-rng`, `comp-util-memory-observability`, `comp-util-persistence-helpers`, `comp-util-debate-analysis`.
