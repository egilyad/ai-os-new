# SUPERAGENTS OS — ПОЛНЫЙ АУДИТ С НУЛЯ (v2 — с поправками)

## Поправки к исходному промту (внесены перед стартом)

1. **Два захода из-за слабого ПК:**
   - Заход 1 — **STATIC ONLY** (imports/exports/регистрации/роуты/таблицы/ивенты, без `typecheck`/`build`/`tests`). Результаты — в `docs/ACTUAL_SYSTEM_AUDIT.md` с пометкой `STATICALLY VERIFIED / NOT RUNTIME VERIFIED`.
   - Заход 2 — **RUNTIME** на сильном ПК (typecheck/build/tests + выборочные прогоны).

2. **Timebox и частичность:**
   - Отчёт пишем **частями**: сначала `Actual Architecture` (карта), затем `Warehouses → Agents → Debate → Memory → Events → DB → UI` — не одним монолитом на 33 раздела.

3. **Якорные цифры для проверки (не как доказанные, а как исходные):**
   - Dexie: `src/kernel/services/dexie-schema.ts:157` — заявлено 98 таблиц, v1→v34
   - События: `src/kernel/events/event-registry.ts:28` — заявлено ~240
   - Фазы: `src/kernel/service-registration/index.ts:44` — заявлено 43 фазы
   - Контракты/сервисы/компоненты — проверить фактические количества, а не повторять из старых доков

4. **Терминология:** запрет на `покрыто` без A-G статуса сохранён.

---

# SUPERAGENTS OS — ПОЛНЫЙ АУДИТ С НУЛЯ

## Контекст

Мы останавливаем текущую волну разработки.

До этого проект развивался через большое количество фаз и исследований GitHub-проектов. Было исследовано 100+ проектов и перенесено множество идей, механизмов, сервисов, UI и архитектурных паттернов.

Но теперь **не нужно считать прошлые отчёты доказательством того, что функциональность существует или работает**.

Начинаем объективную инвентаризацию проекта с нуля.

Мне подходит **любой формат результата**. Не пытайся сохранить старую структуру фаз, старые оценки или старые формулировки.

Главная задача:

> Установить, ЧТО ФАКТИЧЕСКИ ЕСТЬ В КОДЕ СЕЙЧАС, ЧТО РЕАЛЬНО СВЯЗАНО, ЧТО РЕАЛЬНО РАБОТАЕТ, ЧТО ЯВЛЯЕТСЯ STUB/MOCK/SEED, И ЧЕГО НА САМОМ ДЕЛЕ НЕ ХВАТАЕТ.

---

# 1. НЕ ДОВЕРЯЙ ПРЕДЫДУЩИМ ОТЧЁТАМ

Используй старые:

* SUMMARY
* INVENTORY_REPORT
* FULL_FUNCTIONALITY_AUDIT
* CONVERSATION
* roadmap / roadmap2
* phase reports / RIVALS_*_COMPARE

только как исторический контекст. Не принимай их утверждения за факт.

# 2. СТАТУСЫ (строгие)

### A — REAL / WORKING — есть регистрация + wiring + runtime path
### B — IMPLEMENTED / NOT VERIFIED — код есть, рантайм не подтверждён
### C — PARTIAL — часть механизма, существенное отсутствует
### D — STUB / HANDOFF — интерфейс есть, бэкенда нет
### E — MOCK / SEED / DEMO — демо-данные
### F — DOCUMENTED ONLY — только в доке
### G — MISSING — отсутствует

Не используй `covered` без объяснения.

# 3. СНАЧАЛА КАРТА РЕАЛЬНОГО ПРОЕКТА

Исследуй сверху вниз: kernel / contracts / services / stores / repositories / event system / DI / Dexie / workers / LLM / agents / capabilities / tools / skills / personas / roles / crews / councils / debates / graph / memory / research / browser+MCP / governance / observability / UI / mobile / persistence / import-export / config / adapters

# 4. ACTUAL SYSTEM MAP — построй по коду, не по докам

# 5. ОСОБО — WAREHOUSES (13 вопросов: где хранится → как попадает агенту → как исполняется → lifecycle/permissions/validation/runtime)

# 6. AGENT SYSTEM — можно ли собрать агента из warehouses и запустить? Или это независимые системы?

# 7. ORCHESTRATION — проследи User Intent → ... → Next Action с файлами/сервисами, где обрыв — GAP

# 8. DEBATE / COUNCIL — единый runtime или набор механизмов?

# 9. MEMORY — есть ли путь событие → сохранение → retrieval? (short/long/semantic/episodic/shared/embeddings)

# 10. EVENTS — реальная карта EventBus: Producer → Bus → Consumer → State, dead/duplicate?

# 11. DATABASE — для каждой таблицы: кто пишет/читает, orphaned ли?

# 12. UI — Route → Panel → Store → Service → Runtime, где FALLBACK/mock/TODO?

# 13. 100+ ПРОЕКТОВ — для каждого: What was researched → Where implemented → Current status → What remains → What was NOT transferred (не `covered`, а `extracted: Agent/Crew/Task`)

# 14. DIFFERENTIAL MATRIX | Project | Capability | Exists | Status | Impl | Runtime | Gap |

# 15. НЕ ЧИНИТЬ — только DISCOVER → MAP → VERIFY → GAP

# 16. ПРОВЕРКИ — на слабом ПК только статика (imports/exports/регистрации/роуты/DI/таблицы/TODO/mocks). Пометь `STATICALLY VERIFIED / NOT RUNTIME VERIFIED`

# 17. ОТЧЁТ — `docs/ACTUAL_SYSTEM_AUDIT.md` (главный, не править старые)

Структура: Executive Summary / Actual Architecture / Kernel / Runtime / Agents / Warehouses / Tools / Skills / Roles / Personas / Protocols / MCP / Orchestration / Debate / Memory / Research / State Graph / Governance / Interop / LLM / DB / Events / UI / Mobile / Stubs / Dead Code / External Matrix / GAP Matrix / Critical Problems / What Is Strong / What Is Skeleton / What Is Missing / Recommended Next Architecture

# 18. КЛАССИФИКАЦИЯ — REAL / IMPLEMENTED / PARTIAL / SKELETON / STUB / MOCK / MISSING

# 19. НЕ БОЙСЯ ПЛОХИХ РЕЗУЛЬТАТОВ

# 20. ПОСЛЕ АУДИТА — сначала `ACTUAL_SYSTEM_AUDIT.md` + GAP + противоречия + сильные места + склады + 100+ матрица + roadmap, потом решаем что строить

# ГЛАВНОЕ ПРАВИЛО

Не защищай прошлую работу. Смотри на runtime paths. Начни с discovery repository.

```
CODE → STRUCTURE → WIRING → RUNTIME PATH → STATUS → GAP → ROADMAP
```

**Начинаем заново. Заход 1 — статика.**
