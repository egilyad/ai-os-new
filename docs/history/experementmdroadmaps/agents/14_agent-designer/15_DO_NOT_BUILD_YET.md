# 15_DO_NOT_BUILD_YET — Ideas to AVOID for `agent-designer`

> Guardrails consistent with AGENTS.md: "NO 25 mini-frameworks", reuse shared infra, contracts at
> boundaries, events-first. These are **explicitly deferred / rejected** to prevent architecture
> sprawl.

## 1. A 26th "Design Agent" or separate DesignService

- **Why avoid:** `agent-designer` already exists as a node; a parallel `DesignAgentService` would
  duplicate `AgentService` behavior and break the "agents are topology nodes" invariant
  (`agent-profiles.ts:1-8`). VERIFIED: behavior is shared infra; adding a twin service violates
  the single-source-of-agent-identity rule (`agent-identity.ts:1-12`).

## 2. A dedicated "Design Event Bus" or `design:*` event family

- **Why avoid:** the 4 cognitive events (`event-registry.ts:736-776`) + 5 `invocation:*` + 6
  `conversation:*` already cover the needs. A `design:*` bus is exactly the "25 mini-frameworks"
  anti-pattern. Reuse existing events; do NOT add design-specific ones (revive `cognitive:decision:made`
  instead).

## 3. A separate "Design Memory" store / DesignGraph DB table

- **Why avoid:** `AgentJournalService` (KV) + Crystal Vault already provide memory + knowledge.
  Adding a `designPatterns` Dexie table duplicates the journal and the crystal lifecycle. Tag journal
  entries (`ux`) and bridge to crystals — do NOT create a third memory subsystem.

## 4. Hard-coded design heuristics as a new module

- **Why avoid:** heuristic checks (contrast, hierarchy) belong as a **lens** (`lens:design`, M1) or
  a persona variant, not a standalone `design-heuristics-service.ts`. Keep perspective logic in the
  lens/persona seams that already exist.

## 5. Auto-design generation that bypasses human authority

- **Why avoid:** AGENTS.md D6 — "authority = human; agents never self-invoke." A design agent that
  auto-spawns UI without a human trigger violates `allowAgentInitiatedInvocation:false`
  (`phase21-invocation.ts:137`). Design output must remain human-invoked/reviewed.

## 6. Design-specific UI framework / canvas engine

- **Why avoid:** prototype preview (M3) should **reuse** `KnowledgeGenPanel` preview + an iframe,
  not introduce a new canvas/design-tool dependency. New heavy deps contradict the runtime-hardening
  goals (heap/OOM discipline in AGENTS.md).

## 7. Per-agent design model routing that forks the LLM layer

- **Why avoid:** `resolveAgent` already pins `groq/llama-3.3-70b-versatile` (`agent-profiles.ts:159`).
  Do NOT build a design-specific model selector; if multimodal design is needed later, extend the
  existing provider/model config, not a parallel path.

## Summary

Every "don't" above is the same principle: **activate, don't architect.** The designer's value comes
from connecting its existing identity to existing seams (persona, lens, journal, crystal, invocation)
— not from new agents, buses, stores, or frameworks.
