# 02 — Navigation Audit

> VERIFIED from `route-registry-core.ts`, `route-registry-system.ts`, `route-registry-content.ts`,
> `route-imports.ts`, `Sidebar.tsx`. OPINION for severity.

## Structure (9 sections, ~177 items)

1. **Dashboard** (11): overview, analytics, pricing, budget, cost-analytics, cost-optimization,
   custom-metrics, budget-alerts, key-usage-analytics, routing, contribution-graph.
2. **Chat** (6): chat, chat-sessions, session-hub, bookmarks, tasks, files.
3. **Debates** (~45): debate, builder, debate-live, debate-workspace, debate-replay, debate-tournament,
   audience, argument-graph, strategy-builder, debate-analysis, debate-history, debates-manager,
   topics, debate-templates, debate-quality, quality-impact, **+ 30 Coming-Soon stubs**
   (steelman, bayesian-judge, blind-eval, credibility, calibration, consistency, frame-tracker,
   stance-drift, insight-bus, entanglement, anchoring, meta-agent, outcome-forecaster,
   concept-blender, belief-mining, minimax-planner, expert-witness, rhetoric, bias-profiler,
   incentive-detector, stakeholder, scratchpad, persona-mixer, bop-tracker, got-deliberation,
   similarity, drift-detector, shadow-opponent, adversarial-source, vuln-targeting, justification,
   logical-form).
4. **Knowledge** (29): patterns, knowledge, docs, decision-log, eval-datasets, project-os,
   hypothesis-gen, lenses, crystals, junctions, synthesis, knowledge-generator, **forum**, builder
   (dup), director, room, research-engine, tutorials, arch-review, prompt-audit, routing-experiments,
   gov-stress-test, obs-gaps, debate-system-research, research-reports, research-advanced,
   research-gemini, template-sharing.
5. **Integrations** (27): skills, tools, editors, cache, webhooks, rotations, service-registry,
   topology-templates, playground, prompts, prompt-versions, batch, workflows, security, ab-testing,
   fine-tuning, team-collaboration, community-hub, google-studio, google-cache, gemini-live,
   meta-learning, quantum-inspiration, model-distillation, deploy, voice-input, plugin-sdk.
6. **Settings** (7): settings, policies, policy-editor, audit, history, export-import, time-machine.
7. **Agents** (12): agents, roles, roles-consortia, sre, agent-journal, mission, live,
   agent-marketplace, agent-comparison, agent-protocol, persona-marketplace, persona-picker.
8. **Connections** (14): keys, pools, groups, key-notes, provider-dashboard, groq-speed,
   smart-routing, provider-marketplace, connectors, mcp, session-bindings, guardians,
   nvidia-enterprise, openrouter.
9. **Diagnostics** (26): logs, debugger, router-trace, memory, memory-palace, health, system-health,
   docs-health, pressure, runtime-pressure, what-if, dependency-map, diagnostics, state-inspector,
   performance-profiler, shadow, causal-debugger, counterfactual, aquarium, ecosystem, health-sla,
   leaderboard, federated-memory, memory-export-import, aquarium-trading, scheduler.

## Problems found

### NAV-1 (P0) — 30+ phantom "Coming Soon" items look real

VERIFIED: all debate sub-stubs map to `ComingSoonPanel` (`route-imports.ts:362-393`). The Sidebar
renders them with the same icon/label/color as real panels (`Sidebar.tsx:230-273`). There is **no
"Coming Soon" badge, no disabled state, no visual cue**. A new user cannot distinguish the 30 stubs
from the ~15 real debate features. **Impact:** severe over-promise; erodes trust ("I clicked
Bayesian Judge and got a placeholder").

### NAV-2 (P1) — `experimental` flag is ignored

VERIFIED: `Sidebar.tsx` checks only `item.featureFlag` for disabling; `item.experimental` is never
read. So lenses/crystals/junctions/synthesis/forum/director/room/research-advanced etc. are presented
as production-ready. **Impact:** users build workflows expecting stable features.

### NAV-3 (P1) — Duplicate nav entry `builder`

VERIFIED: `builder` appears in **both** Debates (`route-registry-core.ts:146`) and Knowledge
(`route-registry-content.ts:106`), both → `CognitiveBuilder`. Two sidebar buttons, same destination.
(Other overlaps possible — `research-*` variants, `strategy-builder` vs `strategy_builder`.)

### NAV-4 (P1) — No obvious entry point / no "Start here"

VERIFIED: 9 sections, no pinned "Get started", no onboarding link in the sidebar (Tutorials is
buried, experimental). **Impact:** first-run paralysis.

### NAV-5 (P1) — Section semantics overlap / misplacement

VERIFIED by structure:

- **Knowledge** is a grab-bag: patterns, docs, forum, builder, director, room, research, AND
  debate-system-research. A communication tool (Forum) sits under "Knowledge".
- **Diagnostics** mixes Memory + Health + Scheduler + Aquarium trading + Leaderboard — unrelated.
- **Connections** mixes keys/pools with nvidia-enterprise + openrouter + connectors + mcp.
  **Impact:** users can't form a mental model of "where things live".

### NAV-6 (P2) — Long, unscoped lists; no grouping beyond flat section

VERIFIED: Debates section alone is ~45 items in one scroll. No sub-grouping (e.g., "Run a debate" vs
"Analyze a debate" vs "Manage debates"). **Impact:** scanning cost high.

### NAV-7 (P2) — Search exists but is keyword-only

VERIFIED: `Sidebar.tsx:175-184` filters items by translated label substring. No synonyms ("invoke"→
Room, "chat"→Chat), no result preview. **Impact:** if a user doesn't know the exact term, search
fails.

## Recommendations (IDs map to 13_UX_RECOMMENDATIONS)

- **UX-001 (P0):** Render Coming-Soon stubs with a distinct badge + disabled/"preview" style; ideally
  collapse them into a single "Experimental / Coming soon" collapsible group. (Fixes NAV-1)
- **UX-002 (P1):** Honour `experimental` flag with a small "beta" tag. (NAV-2)
- **UX-003 (P1):** De-duplicate nav ids; add a registry test asserting unique ids. (NAV-3)
- **UX-004 (P1):** Add a persistent "Start / Help" entry + first-run modal. (NAV-4)
- **UX-005 (P1):** Re-organize sections by user intent (e.g., "Create" vs "Analyze" vs "Operate" vs
  "Admin"); move Forum to a "Collaborate" section; move Scheduler under "Automate". (NAV-5)
- **UX-006 (P2):** Sub-group long sections; improve sidebar search with synonyms. (NAV-6/7)
