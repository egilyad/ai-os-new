# Phase X+ — Hardening (v4 с поправками к промту 3)

## Поправки

1. **Не «добить статически» вообще, а проверить по факту:** каждый binding — найти существующий механизм → подключить → только если нет — минимальная реализация, без дублей. Skill→Tool — приоритет, но не отдельный проект.
2. **AgentFactory API — тонкий сахар:** `create()` уже возвращает `AgentDefinition`, добавим `createResolved()` → `ResolvedAgent` (не ломая старый). Не переписывать всех потребителей сразу.
3. **Golden E2E — один, но настоящий:** тест пишет сейчас, гоняется в Заходе 2. Ловит реальные `LLM.chat`/`ToolRunner.callTool`/`CogMemory.write`/`kv.get`, а не `toBeDefined()`.
4. **Legacy audit — карта, не миграция:** составить `OLD PATH → AgentFactory? → migrate/leave`, мигрировать постепенно, не всё сразу.
5. **Timeline 260 — декларативная карта, не ручной switch:** `event → {category, title, severity, entity}` таблица, 11 → 260 incrementally, пока без сильного ПК — статика.
6. **Fleet — структура, не фича:** разнести `FleetPanel.tsx` (1107 строк) на 6 файлов уже начато (`FleetPanels/*` — обёртки), дальше — вынести табы как отдельные файлы, canvas — после рантайма.

## Порядок (как в промте, с фиксацией)

```
Phase X ✅
 ↓
1. 5 bindings (Skill→Tool — first)
 ↓
2. AgentFactory convenient API
 ↓
3. Golden E2E test (written, not run)
 ↓
4. Legacy paths audit (map only)
 ↓
5. Timeline 260 declarative
 ↓
6. Fleet decomposition (структурно)
 ↓
── Заход 2 ──
typecheck:fast → build:skip → vitest → Dexie → LLM smoke → E2E
```
