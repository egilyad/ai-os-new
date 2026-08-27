# 02_CAPABILITIES — Capability Matrix

> Legend: **Exists** (code present) · **Used** (actually invoked in a path) · **Exposed in UI** (user can see/trigger) · status flags:
> EXISTS-BUT-UNUSED · UI-HIDDEN · PARTIAL · DEAD · POTENTIAL. Evidence = file:line.

| #   | Capability                                                        | Exists                  | Used            | UI           | Status            | Evidence                                                                                   |
| --- | ----------------------------------------------------------------- | ----------------------- | --------------- | ------------ | ----------------- | ------------------------------------------------------------------------------------------ |
| 1   | Debate participant                                                | ✅                      | ✅              | ✅           | Used              | `DebatePanel.tsx:232-252`; `debate-agent-executor.ts`                                      |
| 2   | ConversationCore / Director participant                           | ✅                      | ✅              | ✅           | Used              | `agent-service.ts:337`; `conversation-orchestrator`                                        |
| 3   | Invocation (human Room)                                           | ✅                      | ✅              | ✅           | Used              | `phase21-invocation.ts:44-110`; RoomPanel                                                  |
| 4   | Default-router mission routing                                    | ✅                      | ✅ (if mounted) | ❌           | PARTIAL           | `topology-defaults.ts:468,520` — no UI to force/inspect                                    |
| 5   | Curated identity (name/avatar/model)                              | ✅                      | ✅              | ✅           | Used              | `agent-profiles.ts:62-71`; `normalizeAgentIdentity`                                        |
| 6   | Specializations (Threat Modeling/AppSec/Zero Trust)               | ✅                      | ⚠️              | ✅           | EXISTS-BUT-UNUSED | stored `topology-defaults.ts:102`; not in prompt (grep)                                    |
| 7   | Security tools (`vulnerability_scan`,`code_audit`,`threat_model`) | ✅                      | ⚠️              | ❌           | EXISTS-BUT-UNUSED | `topology-defaults.ts:9,202` — tools declared, no tool-exec wired to this agent (INFERRED) |
| 8   | Cognitive-event visibility (stats/journal)                        | ✅                      | ✅ (Core only)  | ✅           | PARTIAL           | `COGNITIVE_STEP_COMPLETED` only on Core path; debate emits none (shared context)           |
| 9   | Agent stats (calls/tokens/cost)                                   | ✅                      | ✅              | ✅           | Used              | `agent-service.ts:288-294,184-210`                                                         |
| 10  | Agent journal entries                                             | ✅                      | ✅              | ✅ (panel)   | Used              | `agent-journal-service.ts:129-191`                                                         |
| 11  | Agent card / detail / editor                                      | ✅                      | ✅              | ✅           | Used              | `AgentsPanel/*`                                                                            |
| 12  | Health monitor / auto-recovery                                    | ✅ (infra)              | ✅ (generic)    | ✅           | Used              | `agent-health-monitor` (ref shared context); `AGENT_HEALTH_CHANGE` `agent-service.ts:252`  |
| 13  | Auto-spawn cloning                                                | ✅                      | ✅ (generic)    | ❌           | PARTIAL           | `agent-service.ts:614-665`                                                                 |
| 14  | Groups / teams                                                    | ✅ (infra)              | ❌              | ✅ (generic) | EXISTS-BUT-UNUSED | `agent-service.ts:667-799`; no default group seeds `agent-security`                        |
| 15  | `lens:security` attached                                          | ✅ (lens exists)        | ❌              | ❌           | EXISTS-BUT-UNUSED | `lens-library.ts:69`; `lensIds:[]` after normalize (`topology-defaults.ts:106`)            |
| 16  | Knowledge Generator participation                                 | ✅ (domain tag)         | ❌              | ❌           | POTENTIAL         | `knowledge-generator-service.ts:32` has `'security'` domain tag, not agent invocation      |
| 17  | Crystal / Forum auto-participation                                | ❌                      | ❌              | ❌           | N/A               | no agent-scoped bridge for `agent-security`                                                |
| 18  | Workflow / Builder participation                                  | ❌                      | ❌              | ❌           | POTENTIAL         | `builder-agent-service` compiles flows; could embed `agent-security` node                  |
| 19  | Scheduler-triggered invocation                                    | ❌ (no scheduler found) | ❌              | ❌           | POTENTIAL         | no scheduler service referencing agents                                                    |
| 20  | Research module participation                                     | ❌                      | ❌              | ❌           | POTENTIAL         | research-adapters domain-agnostic                                                          |
| 21  | Red-team / adversarial persona                                    | ⚠️ (persona pool)       | ⚠️              | ❌           | POTENTIAL         | `persona-selector.ts` has no security/red-team variant                                     |
| 22  | AppSec code audit execution                                       | ✅ (tool name)          | ❌              | ❌           | EXISTS-BUT-UNUSED | `SECURITY_TOOLS` declared, no executor bound                                               |

## Status rollup

- **USED (real value today):** 1,2,3,5,9,10,11,12,13.
- **EXISTS-BUT-UNUSED (wasted signal):** 6 (specializations), 7/22 (security tools), 14 (groups), 15 (security lens).
- **PARTIAL (works but incomplete):** 4 (router, no UI), 8 (cognitive visibility gaps in debate), 13 (auto-spawn).
- **POTENTIAL (not built):** 16,18,19,20,21.
- **N/A:** 17.

## Key inference (INFERRED)

The single biggest capability gap: `agent-security` carries rich curated metadata (specializations, security tools, a dedicated `lens:security`) that **none of its execution paths consume**. The agent behaves like a generic "security engineer" prompt regardless of whether it is invoked for threat modeling, AppSec, or Zero Trust. This is the central lever for the opportunities in 11.
