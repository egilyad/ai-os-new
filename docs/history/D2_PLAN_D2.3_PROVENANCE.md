# D2.3 — Provenance Chain — Minimal Implementation Plan (PRE-RUNTIME, без кода)

> Источник: `D1` GAP-04 (Claim→Evidence→Source→FactCheck→Verdict разорван, `provenanceNodes/Edges` unwired, `pickId slice 280` truncation), §6 Evidence, `trust.ts:64 IProvenanceService`. Ограничение: **не трогать DebateEngine, только wire facts→provenance, fix truncation.**

## Цель

Замкнуть `Claim → Evidence → Source → Fact-check → Verdict` для Council (и позже Debate) — `ProvenanceService.trace(runId)` → `FactPacket sources` → `Verdict` цепочка.

## Точные файлы

| Слой | Файл | Что |
|------|------|-----|
| **Council evidence** | `src/kernel/types/council-types.ts:61` | `FactPacket{claim,verdict:verified|disputed|unverifiable,sources:[]}` |
| **Repository (truncate)** | `src/kernel/dal/council-repository.ts:36` | `pickId=claim.slice(0,280)` — lossy, fix → `hash(claim)` full |
| **Provenance service** | `src/kernel/services/trust/provenance-service.ts:1` | `IProvenanceService addNode/link/trace/sandboxLevelFor` — `provenanceNodes/Edges` tables `dexie-schema.ts` (wave10) unwired |
| **Provenance contracts** | `src/kernel/contracts/trust.ts:64` | `IProvenanceService`, `ProvenanceNode/Edge` |
| **Council service** | `src/kernel/services/council/council-service.ts:179` | `submitFact → vote kind=fact payload{verdict,sources}` — здесь же `provenanceService.addNode(claim) + addLink(claim→source) + link(source→factCheck)` |
| **Dexie** | `src/kernel/services/dexie-schema.ts` | `provenanceNodes/Edges` already wave10 — wire, no new tables |
| **Timeline** | `src/kernel/services/timeline/timeline-map.ts` | Already 60, add `provenance:trace` if needed |

## Границы изменений

- **ВНЕ:** Не создавать `EvidenceService v2`, не дублировать `FactPacket` model, не трогать `Debate FactCheckService` (`phase3:248` — C not on critical path).
- **Только wiring + fix truncation:** `council-repository.ts:36` `pickId` → `hash(claim)` (keep claim full in `payload.claim`), `council-service.ts submitFact` → 2–3 `provenanceService` calls (addNode claim + link sources, no web fetch), `conclude` → `provenance.trace(sessionId)` для `summary` provenance.
- **Kernel untouched:** `EventBus 10 council events` уже — добавить `provenance:trace` если нужно, как `DUNG_ATTACK:106` etc.
- **UI:** `CouncilPanel` (D2.1) покажет `Claim` → `Sources` → `Fact-check verdict` → `Judge verdict` chain via `provenance.trace`.

## Шаги (без кода сейчас)

1. **Pre-runtime static:** Fix `pickId` 280 → `hash`, `submitFact` wires `provenanceService.addNode/link` (static, no LLM), `conclude` adds `provenance.trace(sessionId)` to `summary`.
2. **Runtime-pending:** Real source verification (web grounding) + `FactCheckService` LLM judge on sources → `provenance` link `FactCheck→Verdict` — strong PC + provider.
3. **DOC:** `provenanceNodes/Edges` wired for Council only initially, Debate later.

## MARK

- **CLOSED static:** Truncation fixed, `Claim→Source` provenance wired, Dexie `provenance*` used, no second service, docs `PROVIDER-PENDING` for web grounding.
- **RUNTIME-PENDING:** Real web grounding + `FactCheckService` live `FactPacket.verdict` → `provenance` confidence.
