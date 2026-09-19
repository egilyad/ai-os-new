# Council ↔ Debate Engine CONSOLIDATION AUDIT — с поправками (без кода)

## Поправки

1. Только исследование + карта целевой архитектуры, без объединения кода, без второго runtime, без новых моделей.
2. Kernel/EventBus/DI/Dexie — только GAP если доказана необходимость, Dexie SSOT.
3. RUNTIME-PENDING честно (без сильного ПК/provider).
4. Wiring по коду, не по названию: CouncilService vs DebateEngine фактические state machines, persistence, stores, ArgTech/Provenance точки.
5. После `docs/COUNCIL_DEBATE_CONSOLIDATION_AUDIT.md` — STOP, выбор unification path вместе.

## Исходный GO

Выяснить: что из CouncilService уникально/ценно vs дублирует DebateEngine; lifecycle фазы Council 5 vs Debate 11; где 6 форматов / roles-lenses жить; CouncilSession vs DebateSession; persistence 3 tables vs debate tables + BucketStorage; 4 stores; ArgTech+Provenance в общий pipeline; legacy index.ts; можно ли Council = режим/адаптер Canonical Debate Runtime без переписывания зрелого A.

Целевая схема: Canonical Debate Runtime → Standard Debate / Council Mode → Common Consensus → ArgTech → Provenance → Result (если не подходит — зафиксировать почему).
