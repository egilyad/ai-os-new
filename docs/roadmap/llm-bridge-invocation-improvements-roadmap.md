# Roadmap улучшений «LLM-мост / Invocation-Мета-агент»

> **Источник:** аудит `docs/audits/llm-bridge-invocation-audit.md` (L1–L6, I1–I4).
> **Ветка:** `ai-os-new-fix-debate-text-truncation`.

---

## Sprint 1 (P0)

| Задача | ID | Сложность |
|---|---|---|
| Убрать echo-fallback / явно флагать ошибку в `CrewExecutor` | L2 | низкая |

## Sprint 2 (P1)

| Задача | ID | Сложность |
|---|---|---|
| Валидация JSON-парсинга в мосте | L3 | средняя |
| Скоуплить кэш `GraphPort` (B-20) | L4 | средняя |
| Юнит-тесты на ядро invocation/meta | I1 | средняя |

## Sprint 3 (P2)

| Задача | ID | Сложность |
|---|---|---|
| Единая DI-фабрика `llmBridge` | L1 | средняя |
| Умные обрезки (вместо жёстких) | L5 | средняя |
| Реальный мост invocation→проекты | I2 | высокая |

---

## Ссылки

- Реестр дефектов — `docs/audits/llm-bridge-invocation-audit.md`.
- Вики: `comp-llm-bridge`, `comp-invocation-meta`.
