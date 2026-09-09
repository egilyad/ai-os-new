# 10_PROBLEMS_AND_LIMITATIONS — Concrete VERIFIED problems

> Only VERIFIED / strongly INFERRED issues with file:line evidence. No fabrication.

## P1 — Curated specializations are dead metadata (VERIFIED)

`agent-security.specializations = ['Threat Modeling','AppSec','Zero Trust']` (`agent-profiles.ts:70`) is stored into node config (`topology-defaults.ts:102`) and exposed via `resolveAgent` (`agent-service.ts:385`), but **never injected into any system prompt**. Grep across `src` shows `specializations` is only read for: UI display, Invocation agent-matching (`invocation-engine-service.ts:167-173`), and tests. The LLM prompt remains the generic topology text (`topology-defaults.ts:200`). → The agent is behaviorally identical for "threat model" vs "AppSec audit" vs "Zero Trust review".

## P2 — Name "Yara Haddad" is UI-only (VERIFIED)

`displayName`/`firstName`/`lastName` are merged into node config (`topology-defaults.ts:98-101`) and shown by `resolveAgentIdentity` (`agent-identity.ts:129-143`), but the LLM prompt says "You are a security engineer" and never uses the persona name. The agent has no consistent character voice across runs.

## P3 — Debate persona ignores security identity (VERIFIED)

`persona-selector.ts` (10 variants, `:3-241`) has **no security/red-team variant**. When `agent-security` is a debate participant, its persona is chosen by topic keywords (legal/economic/critic/…) or a deterministic fallback. So the "Security Engineer" can be made to speak as a `pragmatic_economist` or `cultural_critic` — semantically wrong. (`DebatePanel.tsx:241-250` builds systemPrompt from `archetypesForRole`, not from node identity.)

## P4 — Cognitive blind-spot during debates (VERIFIED)

Debate runtime emits `debate:*` events and **not** `cognitive:*` (`debate-llm-caller.ts`). `AgentService` stats and `AgentJournalService` rely on `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184`, `agent-journal-service.ts:150`). → `agent-security`'s stats/journal are **under-counted for debate activity**. Only `debate:runtime:agent:error` is captured by the journal (`agent-journal-service.ts:174`).

## P5 — Security tools declared but unbound (VERIFIED/INFERRED)

`SECURITY_TOOLS = ['vulnerability_scan','code_audit','threat_model']` (`topology-defaults.ts:9`) is assigned to `agent-security` (`:202`), but no tool-executor maps these tool names to real implementations for this agent (INFERRED — grep finds tool-name literals only in topology defaults and AgentCapabilitiesTab display). The agent cannot actually "run a vulnerability scan."

## P6 — No agent-specific observability/console (VERIFIED)

All `agent-security` data is generic (stats, journal, cards). There is no security-domain view aggregating findings, severities, or trends. (`specializations`/`domain` tags exist but are unused for aggregation.)

## P7 — No automatic participation in Knowledge/Crystal/Forum/Workflow (VERIFIED)

No bridge invokes `agent-security` for security knowledge crystallization (`crystal-types.ts:17` has `security` domain, unused for this agent), forum moderation, or workflow steps. It is purely on-demand.

## P8 — Router path has no UI/inspection (VERIFIED)

`router → agent-security` exists (`topology-defaults.ts:468`) but there is no UI to force-route a task to `agent-security` or to see why the router did/didn't pick it. The mission-routing decision is opaque.

## P9 — `lens:security` orphaned from the agent (VERIFIED)

`lens:security` exists (`lens-library.ts:69`) but `normalizeAgentIdentity` sets `lensIds:[]` for `agent-security` (`topology-defaults.ts:106`). The lens is never applied to the agent's reasoning.

## P10 — Duplicate "security" naming confusion (VERIFIED)

The route `nav.security_scan` → `PromptSecurityPanel` (`route-registry-content.ts:320`, `route-imports.ts:268`) is a **system prompt-safety scanner**, unrelated to `agent-security`. Users may conflate the two. No cross-link.

## Severity summary

- High business impact: P1, P3, P5 (agent under-delivers on its core promise).
- Medium: P2, P4, P6, P9 (consistency/observability).
- Low: P7, P8, P10 (discoverability/integration).
