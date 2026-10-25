# Roadmap улучшений «Адаптеры провайдеров LLM»

> **Источник:** аудит `docs/audits/adapters-audit.md` (AD1–AD8).
> **Ветка:** `ai-os-new-fix-debate-text-truncation`.

---

## Sprint 1 (P0) — быстрые фиксы

| Задача | ID | Статус |
|---|---|---|
| Исправить устаревшую статью OpenRouter (тесты есть) | AD1 | ✅ исправлено |

## Sprint 2 (P1) — средние

| Задача | ID | Сложность |
|---|---|---|
| Unit-тесты на Groq/Nvidia/Cloudflare/Mock | AD2 | средняя |
| Возвращать usage/toolCalls в терминальном chunk Nvidia | AD5 | средняя |
| Нормализация finishReason + toolCalls в Cloudflare | AD4 | средняя |

## Sprint 3 (P2) — архитектура

| Задача | ID | Сложность |
|---|---|---|
| Добавить пропущенные поля в body-билдер Groq | AD3 | средняя |
| Убрать `dangerouslyAllowBrowser` / вынести за прокси | AD6 | высокая |
| Дефолтная модель в конструкторе каждого адаптера | AD7 | низкая |
| Перевести MockAdapter на `BaseLLMAdapter` | AD8 | низкая |

---

## Ссылки

- Реестр дефектов — `docs/audits/adapters-audit.md`.
- Вики: `comp-adapter-openrouter`, `comp-adapter-groq`, `comp-adapter-nvidia-nim`, `comp-adapter-cloudflare`, `comp-adapter-mock`, `comp-llm-adapters`.
