# 12 — FUTURE AGENT CONCEPT: `agent-architect` realized

> A realized concept built **entirely from existing capabilities** — no new runtime, no new bus. The architect becomes the **Architecture Decision Agent**.

## Concept

Today `agent-architect` is a generic participant. Realized, it becomes the system's **design authority**: it ingests a code scan, produces a structured **Architecture Decision Record (ADR)**, and persists it as a Crystal that future debates/invocations can cite.

## How it's assembled from EXISTING pieces (VERIFIED)

1. **Trigger** — human clicks "Ask System Architect" in `ArchitectureReview.tsx` (static scan already runs via `architectureReviewService.runFullAnalysis`, `architecture-review-service.ts:299`). → reuses Invocation Engine (`phase21-invocation.ts`).
2. **Reasoning** — the agent runs as a ConversationCore/Director participant (`agent-service.ts:337` resolves it 1:1). Its system prompt (`topology-defaults.ts:188`) already covers trade-offs.
3. **Structure** — a `lens:architecture` (or reused `lens:security` `lens-library.ts:82`) shapes output into options/decision/consequences. (Bind via `lensIds` on the node — Q3/M2.)
4. **Persistence** — the conclusion is crystallized via `crystalVault.propose`+`crystallize` (`crystal-vault-service`, phase14) — exactly the path `crystal-debate-bridge` already uses for verdicts.
5. **Recall** — future invocations inject the architect's journal (`agent-journal-service.ts:130`) and linked crystals, giving continuity (M3/B3).
6. **Surfacing** — the ADR renders in a Trade-off card (reuse `SynthesisZonesView`) and in `AgentJournalPanel` (filtered, Q2).

## Why this is "realized, not invented"

- Every component exists and is production-wired (Invocation, ConversationCore, Lens, Crystal, Journal, Synthesis UI).
- The ONLY new code is **glue + a policy + UI buttons** — no new agent service, no new event bus, no new storage table.
- It directly resolves problem #4 (duplicate "architecture" concepts) by linking the static scan to the real agent.

## Minimal realization path (see 13)

Phase 0–1 delivers Q1+Q3+Q5 (bridge button + lens bind + quick-invoke) — already gives the user "scan → ask architect". Phase 2–3 adds ADR-as-Crystal + journal recall. Phase 4 adds topology-aware context + cognitive-decision surfacing.
