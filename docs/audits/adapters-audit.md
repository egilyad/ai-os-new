# Аудит подсистемы «Адаптеры провайдеров LLM» — реестр дефектов и рисков

> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Метод:** чтение кода/grep (без запуска тестов), 2026-10. Статусы: `[V]` — подтверждено кодом; `[SA]` — статический анализ; `[NV]` — не проверено.

---

## 0. Карта подтверждённых фактов

- Все реальные адаптеры (openrouter/groq/nvidia/cloudflare) наследуют `BaseLLMAdapter`; **MockAdapter** — реализует `LLMProviderAdapter` напрямую.
- Только OpenRouter имеет `rotateKey` и TTL-кэш моделей.
- Единственный с отдельным тест-файлом — OpenRouter.

---

## 1. Дефекты и риски

| ID | Суть | Статус | Доказательство |
|---|---|---|---|
| AD1 | Wiki-статья `comp-adapter-openrouter` устарела: заявляла отсутствие тестов, но `openrouter-adapter.test.ts` существует (3 теста) | [SA] | `docs/wiki/comp-adapter-openrouter.md` vs `src/llm/openrouter/openrouter-adapter.test.ts` — исправлено |
| AD2 | Groq/Nvidia/Cloudflare/Mock — ноль прямых адаптерных тестов (только косвенное покрытие) | [NV] | отсутствие `*.test.ts` |
| AD3 | Groq пропускает `response_format`/`safety_settings`/`cachedContent` в body-билдере | [NV] | `groq-adapter.ts:56-69,109-123` |
| AD4 | Cloudflare не нормализует finishReason и не возвращает toolCalls | [NV] | `cloudflare-adapter.ts:81-85,117-126` |
| AD5 | Nvidia streaming теряет usage/toolCalls (терминальный chunk по finishReason) | [V] | `nvidia-nim-adapter.ts:144-146` |
| AD6 | Groq `dangerouslyAllowBrowser:true` — ключ отправляется из браузера | [V] | `groq-adapter.ts:44` |
| AD7 | Модели по умолчанию отсутствуют в самих адаптерах (всё в `free-tiers.ts`) — поведение не определено, если модель не передана | [H] | конструкторы адаптеров |
| AD8 | MockAdapter не наследует `BaseLLMAdapter` — нет общей обёртки ошибок | [H] | `mock-adapter.ts:26` |

---

## 2. Рекомендуемые приоритеты

- **P0 (быстрые/безопасные):** AD1 — уже исправлено в wiki.
- **P1 (средние):**
  - AD2 — добавить unit-тесты на Groq/Nvidia/Cloudflare/Mock (streaming-сборка, checkHealth, getAvailableModels).
  - AD5 — возвращать usage/toolCalls в терминальном chunk Nvidia.
  - AD4 — нормализовать finishReason и добавить toolCalls в Cloudflare.
- **P2 (крупные):**
  - AD3 — добавить пропущенные поля в body-билдер Groq.
  - AD6 — убрать `dangerouslyAllowBrowser` или перенести вызовы за прокси.
  - AD7 — ввести дефолтную модель в конструктор каждого адаптера.
  - AD8 — перевести MockAdapter на `BaseLLMAdapter` (или явно задокументировать отличие).

Подробный план — `docs/roadmap/adapters-improvements-roadmap.md`.
