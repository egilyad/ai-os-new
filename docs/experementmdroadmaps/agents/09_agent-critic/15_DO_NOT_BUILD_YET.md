# 15_DO_NOT_BUILD_YET — Ideas to AVOID (and warnings)

> Guardrails. The repo already has 25 agents + 7 cognitive modules; the AGENTS.md warns against "25 mini-frameworks." These are explicitly out of scope.

## 1. Do NOT build a standalone "CriticAgent framework"

- **Why avoid:** A new `CriticAgent` base class / decorator / registry would be yet another framework. `agent-critic` is already a topology node; a parallel critic framework duplicates identity, lifecycle, and stats.
- **Instead:** Reuse `AgentService` + lens engine + Invocation (Roadmap A).

## 2. Do NOT create a new event bus or critique channel

- **Why avoid:** `COGNITIVE_STEP_COMPLETED` / `COGNITIVE_DECISION_MADE` / `conversation:*` / `debate:*` already exist. A `critique:*` bus fragments the event model.
- **Instead:** Emit existing events (Q3/Q4 in `11_OPPORTUNITIES`).

## 3. Do NOT add a dedicated "Critique DB" table set

- **Why avoid:** There are already ~16 memory stores + Dexie KV + journal. A separate `critiques` table duplicates persistence patterns and complicates migrations.
- **Instead:** Use a typed memory store + `agent_journal_v1` (M3 in `11_OPPORTUNITIES`).

## 4. Do NOT auto-invoke the critic on every output by default

- **Why avoid:** Always-on critique doubles token cost and latency for every agent turn; risks infinite critique-of-critique loops (the B1 ReviewGate must be opt-in/gated, not default-on).
- **Instead:** Gate critique behind explicit `CRITIQUE` turns, Room invocations, or a `red-team` debate role.

## 5. Do NOT hard-wire "agent-critic" by name across services

- **Why avoid:** Spreading `'agent-critic'` string literals into debate/conversation/forum creates fragile coupling; if the agent is renamed or cloned, logic breaks silently.
- **Instead:** Route by **specialization** (`Critical Analysis` in `specializations`, `agent-service.ts:385`), not by id (M5 in `11_OPPORTUNITIES`).

## 6. Do NOT implement NLP fallacy classification from scratch

- **Why avoid:** Building a bespoke formal-logic parser is high-risk, low-ROI, and likely less reliable than a prompt-constrained LLM returning a `CritiqueResult` schema.
- **Instead:** Start with structured-LLM output (M2); add a light verifier only later (B2 in `14_ALTERNATIVE_ROADMAP`).

## 7. Do NOT build a separate Critic UI app/route

- **Why avoid:** A new `CriticPanel` route fragments UX; the agent already appears in AgentsPanel, Director, Room, Debate, Forum.
- **Instead:** Enhance existing surfaces (badge on AgentCard, lane in Debate, ledger in AgentDetailPanel — `09_UI_UX`).

## 8. Do NOT give the critic autonomous invocation authority

- **Why avoid:** AGENTS.md Invocation Engine D6 — "authority = human; agents never self-invoke." A self-invoking critic violates the designed authority model and could spam debates.
- **Instead:** Human-initiated via Room, or system-gated `red-team` role within a debate the human started.

## 9. Do NOT clone the critic per debate automatically

- **Why avoid:** `autoSpawnConfig` already clones busy agents (`agent-service.ts:614-665`); auto-cloning the critic into every busy debate multiplies cost without value.
- **Instead:** Human/role selection only.

## 10. Do NOT treat "Fallacy Detection" as solved

- **Why avoid:** It is currently a profile string only (`agent-profiles.ts:110`). Shipping UI that claims "fallacy detected" without the structured path (M2/B2) would misrepresent capability.
- **Instead:** Label honestly as "skeptical review" until M2 lands.

---

**Meta-warning:** The single biggest risk is _framework creep_. Every rejected item above is rejected because a working, cheaper reuse path already exists in the repo. Build the critic by **wiring**, not by **inventing**.
