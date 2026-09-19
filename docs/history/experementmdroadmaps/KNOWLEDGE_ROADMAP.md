# KNOWLEDGE ROADMAP (Phase 13 — Knowledge / Research / Cognitive)

> Research-only. ResearchEngine + 7 cognitive modules (Lenses→Crystals→Junction→Synthesis→Generator→Forum→Builder).
>
> **Cycle 2 — panel roadmap: Knowledge.**

## Current state

- ResearchEngine: deep backend, thin UI (R-01).
- Cognitive modules: all built with UI + persistence, mostly standalone (R-09).
- CrystalDebateBridge exists; `knowledge:crystal:formed` + `debate:verdict:generated` events registered but Forum subscribers likely absent.
- MemoryService (`memory-engine.ts:52`) + rich `services/memory/*` — thin UI.

## Top gaps

- **Research 7 phases dark** (R-01) — biggest single expose.
- **Cognitive bridges thin** (R-09) — Lens→Synthesis→Crystal→Forum manual.
- **Memory specialization dark** — emotional/spatial/procedural/sleep not surfaced.
- **Research→Debate hand-off missing** (R-14) — contested claim → debate.

## Roadmap (phased)

1. **Expose Research phases (M).** Tabs for systematic review / fact-check / anomalies / peer-review / citations / graphs. (R-01) — **P0**
2. **Auto cognitive bridges (M).** Event-driven suggestions + Crystal→Forum auto-topic + Debate verdict→Forum case study. (R-09)
3. **Research→Debate (S–M).** "Debate this claim" from a report. (R-14)
4. **Memory surface (M).** Show specialized memory stores + sleep/pruning status. (BIG_BET-adjacent)

## Value / Effort

Step 1 is the highest-value single expose in the product. Steps 2–3 create the "knowledge flywheel." **Priority: P0 (step 1) / P1 (rest).**
