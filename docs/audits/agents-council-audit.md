# Аудит подсистемы «Агенты/Совет» — реестр дефектов и рисков

> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Метод:** чтение кода/grep (без запуска тестов), 2026-10. Статусы: `[V]` — подтверждено кодом; `[SA]` — статический анализ; `[H]` — риск/гипотеза на основе кода.

---

## 0. Карта подтверждённых фактов

- Три аддитивных слоя поверх Debate Runtime: **Совет** (`CouncilService` + фасад), **Экипажи** (`CrewService`, CrewAI-парадигма), **Rivals/паритет** (`rivals/`, `rivals17/`).
- Модель агента: `agents/registry.ts` (`AGENT_REGISTRY`, 15 встроенных); systemPrompt собирается в `resolveAgent` (`agent-service.ts:571-629`).
- Совет: 14 линз + 4 пары полярностей (`council-lenses.ts`); `council-to-debate-mapper.ts` — чистый маппер, вызывается в фасаде при createSession.
- Экипажи: дефолтный исполнитель — `EchoExecutor` (без LLM); `LlmCrewExecutor` подключается при наличии `llmClientService`.

---

## 1. Дефекты и риски

| ID | Суть | Статус | Доказательство |
|---|---|---|---|
| A1 | Двойная таллировка совета: старая `CouncilService` vs canonical `WeightedJudgeEvaluator` (фасад вручную отражает статистику) — риск расхождения | [H] | `council-service.ts:354-402` vs `council-service-facade.ts:179-260` |
| A2 | Crew без LLM по умолчанию: `EchoExecutor` — команды «исполняются» детерминированным текстом без провайдера | [H] | `crew-service.ts:37-50`, `phase23-crew.ts:32` |
| A3 | Council-фасад неполная интеграция: снапшот дебата только при createSession; обновления обратно не проталкиваются; `eventBus` через тайпкасты | [H] | `council-service-facade.ts:45,123,157` |
| A4 | `MetaControllerService.pick` выбирал технику случайно (fallback) | [V]→**исправлено** | `rivals17/metacontroller-service.ts` (заменено на детерминированный hash) |
| A5 | Множество каталогов `rivals2..20` — частично сиды/пробы без единой интеграции | [V] | `services/rivals*` (19 папок) |
| A6 | `RivalLabs` — демо/проба, а не второй оркестратор | [V] | `RivalLabs/rivalLabsConfig.ts:8` |
| A7 | Рынок агентов (`AgentMarketplace`) — mock-сиды, без реального каталога/поиска | [SA] | `agent-marketplace.ts:67` |
| A8 | Lazy-прокси в `CouncilPanel` обрабатывает гонку инициализации контейнера (HMR-хрупкость) | [SA] | `CouncilPanel.tsx:40-49,68-87` |
| A9 | systemPrompt собирается по-разному в `agent-service.resolveAgent`, `council-lenses.buildParticipantPrompt`, crew/role-слоях — нет единого источника | [SA] | `agent-service.ts:571-629`, `council-lenses.ts:160-175` |

---

## 2. Рекомендуемые приоритеты

- **P0 (быстрые/безопасные):**
  - A4 — ✅ уже реализовано (детерминированный выбор).
  - A9 — единый хелпер сборки systemPrompt (роль+навыки+линзы), переиспользуемый слоями.
- **P1 (средние):**
  - A2 — явный guard/warning при `EchoExecutor` (чтобы «тихий» режим не маскировался под ИИ).
  - A8 — убрать retry-гонку через прямой доступ к контейнеру после init.
  - A7 — заменить mock-сиды на реальный каталог/поиск.
- **P2 (крупные):**
  - A1 — свести таллировку совета к одному canonical-пути (фасад → `WeightedJudgeEvaluator`).
  - A3 — двусторонний мост council↔debate.
  - A5 — унифицировать/документировать каталоги `rivals*`.

Подробный план — `docs/roadmap/agents-council-improvements-roadmap.md`.
