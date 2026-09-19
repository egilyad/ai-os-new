# DEBATE SYSTEM AUDIT PROMPT D1 — с поправками (DEBATE SYSTEM EVOLUTION)

## Поправки к исходному промту

1. **Цикл назван верно: DEBATE SYSTEM EVOLUTION, не STATIC GAP.** D1 — только forensic-audit, без реализации.
2. **Ничего не реализовывать, не переписывать, не дублировать.** Один canonical runtime `CouncilService + DebateEngine` остаётся единственным — второй engine/new runtime запрещён.
3. **Kernel/EventBus/DI/Dexie — только GAP если доказана необходимость.** Dexie остаётся SSOT, EventBus-first, contracts-first.
4. **RUNTIME-PENDING честно:** без сильного ПК (LLM/provider/device) — маркируем `B/RUNTIME-PENDING`, не считаем stub/echo за реальный LLM.
5. **Wiring по коду, не по названию:** проверять `→UI→runtime entry→service→engine→participants→LLM/tool→judging→consensus→persistence→events` по импортам/вызовам, не по файлам.
6. **Legacy/duplicate — только KEEP/MIGRATE/ADAPTER/DEPRECATE/REMOVE LATER,** ничего не удалять в D1.
7. **D1 STOP:** после `docs/DEBATE_SYSTEM_AUDIT_D1.md` — стоп, D2 выбираем 3–5 ценных улучшений (PRE-RUNTIME) вместе.

> Исходный промт принят без изменения структуры 18 разделов + 22 главы отчёта — поправки только про границы и честность.

## Исходный промт (сохранён, см. сообщение пользователя)

Full forensic-audit 18 фаз: 1 Architecture Map, 2 Lifecycle, 3 Participant/Role, 4 ArgTech (Dung/Toulmin/Brier/Kialo), 5 Judging/Consensus, 6 Evidence/Provenance, 7 LLM/Tool boundary, 8 Persistence/Resume, 9 EventBus/Timeline, 10 UI→Runtime, 11 Duplicate/Legacy, 12 Capability Matrix (A–G), 13 Strengths, 14 Weaknesses, 15 GAP Register, 16 External References (10 систем), 17 Priority (PRE-RUNTIME vs RUNTIME-PENDING), 18 Final report 22 главы → `docs/DEBATE_SYSTEM_AUDIT_D1.md`.

Constraints: ❌ no kernel beautify, no second engine, no new capabilities from fantasy, no mass refactor, no static=runtime; ✅ reuse, EventBus-first, Dexie SSOT, every conclusion with code evidence.
