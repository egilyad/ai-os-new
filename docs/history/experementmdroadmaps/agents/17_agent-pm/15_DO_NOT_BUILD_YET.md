# 15 — DO NOT BUILD YET

> Ideas to AVOID for `agent-pm`, and why. Tags: **VERIFIED** / **OPINION**.

## 1 — Do NOT build a `ProjectManagerPanel` (bespoke UI)

- Why: the repo explicitly warns against 25 mini-frameworks (AGENTS.md "no 25 mini-frameworks"). `AgentsPanel` + `RoomPanel` + `DirectorPanel` already cover identity, invocation, and facilitation. A bespoke panel fragments the UI and duplicates `ScenarioEditor`/`DirectorPanel`.
- Evidence: shared agent UI already renders `agent-pm` via generic components (`AgentsPanelView`, `AgentCard`, etc.); `DirectorPanel` already runs scenarios.

## 2 — Do NOT add a `pmPlans` / `pmMemory` / `pmRisks` Dexie table as a new source of truth

- Why: the ~16 memory stores + `crystals` + `forum` + `scenario` + `journal` already cover persistence. A PM-owned table duplicates and fragments the data model (AGENTS.md: "contracts at boundaries", Dexie tables are precious/additive).
- Safer: reuse `crystals`/`journal`/`scenario` (Plan A). If a queryable plan model is truly needed, make it a _view_ over crystals (see `14` hybrid).

## 3 — Do NOT make `agent-pm` autonomously self-invoke or auto-promote to meta-agent

- Why: Invocation Engine design (D6 human authority; D3 managed chains; `debate-meta-agent-controller` has no PM branch). An autonomous PM violates the explicit "agents never self-invoke" rule and could hijack debates.
- Evidence: `phase21-invocation.ts:137` `allowAgentInitiatedInvocation:false`; `debate-meta-agent-controller.ts` grep → no `agent-pm`.

## 4 — Do NOT special-case `AgentAvatar.tsx` to read `AGENT_PROFILES`

- Why: the shared-context claim was **false** — `AgentAvatar.tsx:47` is a deterministic hash (VERIFIED). Identity already reaches the UI correctly via `agent-identity.ts` ← node `config.avatar` ← `normalizeAgentIdentity` (`topology-defaults.ts:103`). Patching the avatar component would break the intentional fallback for unknown ids.
- Fix the _understanding_, not the component.

## 5 — Do NOT switch `agent-pm` to `model:'auto'` to "fix failover" without thought

- Why: P2 correction shows the 70B pin IS live and intentional. Moving to `auto` loses the deliberate capability choice (a strong PM model). If failover matters, the right fix is to let explicit-model nodes _fall back_ to routing on 402/timeout — a generic LLM-layer improvement, not a PM-specific hack.

## 6 — Do NOT create a PM-specific persona that steals variants from other agents

- Why: `PersonaSelector` variants are global. Hard-locking `agent-pm` to a variant by id would deny it to others. Keep any PM bias **soft** (keyword + `baseRole` preference, late-round `neutral`).

## 7 — Do NOT emit a brand-new `pm:*` event family

- Why: `invocation:*` + `conversation:*` + `cognitive:*` already exist and cover the lifecycle. A new family duplicates and risks the "event sprawl" the architecture guards against. Reuse existing events (Plan A).

## 8 — Do NOT give `agent-pm` tools it doesn't need (e.g. CODER_TOOLS)

- Why: PM value is coordination, not execution. `tools:[]` is correct (`topology-defaults.ts:352`). Adding execution tools conflates PM with `agent-lead`/`agent-architect` and increases attack surface/cost.

## Guiding principle (OPINION)

Every "do not build" above stems from one rule: **`agent-pm`'s power is composition, not a new subsystem.** Realize it through the verified 7 modules + Director + Invocation, not by spawning the 26th framework.
