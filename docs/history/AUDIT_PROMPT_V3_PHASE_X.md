# Phase X — Unified Agent Composition (v3 с поправками)

## Поправки к исходному второму промту

**Исходная идея верна:** главный GAP — нет `AgentFactory` (склады есть, сборки нет). `Skill` сейчас — метаданные, не runtime (`catalog → manifest → ???`).

**Что уточнено:**
1. **Не Phase X как большой проект** — делаем **минимальный E2E** (один агент, один проход), а не сразу полный Capability lifecycle на все склады.
2. **Capability Model — лёгкий:** единый интерфейс `Capability { kind, id, validate, authorize, bind }` + 5 биндингов: `skill→tool`, `persona→prompt`, `role→policy`, `model→LLM`, `memory→retrieval`. Остальное — по необходимости.
3. **Порядок:** `AgentFactory` → `typecheck:fast` → `build:skip-typecheck` → `vitest` → `Dexie` → `LLM smoke` → `E2E` — как в аудите.
4. **Критерий готовности Phase X:** один сценарий `create agent → choose role/persona/skills → resolve tools/model/policy/memory → persist → execute task → invoke tool → save result → retrieve` проходит без `???`.

## Цель Phase X

Превратить склады из `массив + seed + UI` в `DISCOVER → SELECT → VALIDATE → AUTHORIZE → BIND → EXECUTE → PERSIST → OBSERVE`.

## Scope (минимальный)

- `AgentDefinition` (persist в Dexie `agents`)
- `CapabilityResolver` (валидация + авторизация)
- 5 bindings: skill→tool, persona→prompt, role→policy, model→LLM bridge, memory→retrieval
- `AgentFactory` (сборка + persist)
- 1 E2E тест-путь (без UI, через сервисы)

Не делаем: +50 capabilities, +20 панелей, полный warehouse lifecycle. Это после Phase X.
