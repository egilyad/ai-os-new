# D2.1 — CouncilPanel + Store wiring — Minimal Implementation Plan (PRE-RUNTIME, без кода)

> Источник: `docs/DEBATE_SYSTEM_AUDIT_D1.md` GAP-02 (CouncilPanel missing, route `fleet-councils` lazy без файла) + GAP-07 (store). Ограничение: **не создавать второй Council runtime, не менять Kernel/EventBus/DI/Dexie без доказанной необходимости, использовать 5 canons `USER_CONTROL_MAP`**.

## Цель

Замкнуть `Fleet → Councils → CouncilService → Dexie → result` статически (без LLM runtime).

## Точные файлы

| Действие | Файл | Что |
|----------|------|-----|
| **Create** | `src/components/CouncilPanel/CouncilPanel.tsx` | Canonical `Fleet — Councils` list→detail→act (createSession / submitProposal / postMessage forum+whisper double-blind / submitFact / submitJudgeScore / advancePhase / conclude / abort) — как `FleetPanel` 10 tabs, но для Council |
| **Reuse** | `src/stores/councilStore.ts:18` | `useCouncilStore {sessions, activeSessionId, refresh:listSessions, select}` + 6 `eventBus.onSafe council:*` → освежить |
| **Reuse** | `src/kernel/services/council/council-service.ts:47` | `ICouncilService` 8 методов (72 createSession … 384 abort) — runtime остаётся canonical |
| **Reuse** | `src/kernel/dal/council-repository.ts:25` | Dexie `councilSessions/Messages/Votes` v24 — SSOT |
| **Wire** | `src/route-registry-content.ts:135` | `fleet-councils` уже `icon: gitCompare lazy` → прописать `component: () => import('./components/CouncilPanel/CouncilPanel')` |
| **Wire** | `src/route-imports.ts` | lazy `CouncilPanel` |
| **Wire** | `src/kernel/instances/services-extras.ts` | `export const councilService = lazyService<ICouncilService>('councilService')` уже есть — панель через него |
| **Event** | `src/kernel/events/event-registry.ts:1577` | 10 `COUNCIL_*` уже — панель подписывается через store |

## Границы изменений

- **ВНЕ:** `DebateEngine` (`debate-runtime/*`), `ArgTech`, `Provenance`, `Graph`, `Kernel` — не трогать.
- **Только presentation + wiring:** Panel ↔ `councilStore` ↔ `CouncilService` ↔ `Dexie`. No new runtime, no second engine.
- **Domain untouched:** `council-types.ts:13` 5 states, `council-lenses.ts:23` 14 lenses — не менять.
- **Responsive:** Использовать `ResponsiveShell` (`useResponsive`) — `isMobile ? stacked : 1fr 360px` inspector как в `MemoryPanel` (Phase 4).

## Шаги (без кода сейчас)

1. Создать `CouncilPanel.tsx` с секциями: `Create` (topic→createSession), `Sessions list` (phase/status, messages count), `Detail` (proposal/forum/whisper/facts/judge → calls `councilService.postMessage etc`), `Advance/Conclude` buttons.
2. Подключить `councilStore.refresh` на mount + `eventBus council:*` авто-refresh (уже есть).
3. Прописать route `fleet-councils` → `CouncilPanel` (content registry + imports).
4. Статический тест `CouncilPanel wiring (store→service→Dexie)` — не гонять, `RUNTIME-PENDING` until strong PC (Dexie + list).

## MARK

- **CLOSED static:** Route→Panel→Store→Service→Dexie wired, `USER_CONTROL_MAP` 5 canons `Fleet — Councils` canonical.
- **RUNTIME-PENDING:** Real LLM `draftStance/judgeRound` (via `LlmCouncilPort`), `advancePhase` live — strong PC.
