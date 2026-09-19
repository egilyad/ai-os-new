# 13 — ROADMAP (Plan A: capability-first, low-risk)

> Phase0→Phase4. Each: task | existing code/service | proposed UI | deps | effort | risk | expected result

## Phase 0 — Correctness (1–2 days)

- **P0.1 Fix model/provider pin** | `agent-service.ts:351-353`, `agent-profiles.ts:199` | none (behavior) | none | S | Low | PO runs on groq as configured (`10`#2/#3)
- **P0.2 Fix `invocation-types` resolution** (repo blocker) | `invocation-repository.ts:4`, `dexie-schema.ts:20`, `interfaces.ts:8` | none | none | S | Low | Invocation path typechecks (`10`#7)

## Phase 1 — Make specializations alive (3–5 days)

- **P1.1 Specialization chips → quick-invoke** | `AgentCard.tsx:68`, `RoomPanel` | AgentCard chips + RoomPanel prefill | P0.2 | S | Low | one-click PO tasks (`11` Q2/Q4)
- **P1.2 PO activity filter** | `LiveActivityStream`, `event-registry.ts:763` | filter toggle | none | S | Low | PO observability (`11` Q3)
- **P1.3 "Product Trio" group** | `agent-service.ts:27`, `AgentGroupsSection` | group in UI | none | S | Low | multi-agent pod (`11` Q5)

## Phase 2 — Debate & lens identity (1 week)

- **P2.1 `persona:product-owner` variant** | `persona-selector.ts`, `debate-llm-prompt-context.ts:873` | none | pass specializations to selector | M | Med | PO defends scope in debate (`11` M1/`04`)
- **P2.2 `lens:product-vision`** | `lens-library.ts` | auto-attach via `lensIds` | none | M | Low | PO viewpoint amplified (`11` M4)

## Phase 3 — Structured product output (1–2 weeks)

- **P3.1 PO turn types** | `TurnProposal`, `conversation-director-service.ts` | Director scenario builder | P2 | M | Med | machine-usable backlog (`11` M2/`05`)
- **P3.2 PO backlog memory** | `memory-engine.ts:181` | history tab extension | P3.1 | M | Low | continuity (`11` M3/`08`)

## Phase 4 — Closed-loop (2–4 weeks)

- **P4.1 PO→Crystal/Workflow bridge** | `crystal-vault-service`, `builder-agent-service`, `phase21-invocation.ts:61` | Director "export" button | P3 | L | High | idea→requirement→workflow (`11` B2)
- **P4.2 `COGNITIVE_DECISION_MADE` consumer** | `event-registry.ts:776` | PO decision log | none | M | Med | auditable decisions (`11` M5/`07`)

**Expected cumulative result:** `agent-po` evolves from inert profile → active Scope Governor with structured, remembered, bridgeable product output — all on existing infra.
