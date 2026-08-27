# 08 — Information Architecture

> How content is organized, labeled, and grouped. Evidence: VERIFIED (route-registry-core/system/content, Sidebar.tsx, ModuleInfo, AGENTS.md nav counts).

## Current structure (9 sections, ~177 items)

1. **Dashboard** — overview
2. **Chat** — conversations
3. **Debates** (~45 items, incl. ~30 stubs) — arenas, analysis, replay, research, templates, plus 30 `ComingSoon` sub-panels
4. **Knowledge** (29) — lenses, crystals, junctions, synthesis, generator, builder, forum, room, director
5. **Integrations** (27) — connectors, MCP, providers, marketplace
6. **Settings** (7) — config, policies, roles, keys
7. **Agents** (12) — workforce, groups, comparison, marketplace
8. **Connections** (14) — webhooks, sessions, topics
9. **Diagnostics** (26) — logs, traces, health, profilers, pressure maps

## Problems

### IA-1 (P0) — Fake depth in Debates (VERIFIED)

- ~30 `ComingSoonPanel` items live under Debates, inflating the section to ~45 items. They are stubs (03). This makes the product look far more capable than it is and buries real debate features in a long list.

### IA-2 (P0) — Duplicate `builder` nav id (VERIFIED)

- `builder` appears in both Debates (`route-registry-core.ts:146`) and Knowledge (`route-registry-content.ts:106`) → `CognitiveBuilder`. Two nav entries, same destination. Confusing and a maintenance smell.

### IA-3 (P1) — No onboarding/IA entry point (VERIFIED)

- Sidebar has no "Start here" / "Get started" / Tour. `TutorialPanel` + `OnboardingWizard` + `GetStartedPanel` exist but are not surfaced as first-run experiences; Tutorials are `experimental` (buried).

### IA-4 (P1) — Conceptual overlap, no hierarchy (VERIFIED/INFERRED)

- "Workflow" (WorkflowPanel), "Builder" (CognitiveBuilder), "Director scenario" (DirectorPanel), and Room "Mode: director-scenario" all describe multi-step agent orchestration. A newcomer cannot distinguish them. No IA relationship ("Builder creates Workflows; Director runs Scenarios; Room invokes agents") is shown.

### IA-5 (P2) — Section boundaries leaky

- "Connections" (webhooks/sessions/topics) vs "Integrations" (connectors/MCP) vs "Knowledge→Forum/Room" overlap conceptually. Labeling is engineering-centric, not task-centric.

### IA-6 (P3) — Localization leakage

- Forum author hardcoded "Вы" (RU) even in EN locale (VERIFIED in ForumPanel). IAanguage should follow UI locale.

## Recommendations

- UX-IA1: Move the ~30 stubs out of the primary nav (or group them under a clearly labeled "Experimental / Planned" collapsible, or remove until real). Show real count.
- UX-IA2: De-duplicate `builder`; keep one canonical entry (Knowledge).
- UX-IA3: Add a persistent "Tutorials / Start here" entry in Sidebar (non-experimental) + first-run modal.
- UX-IA4: Add a short "How it fits together" note on Builder/Workflow/Director/Room panels (cross-links).
- UX-IA5: Relabel sections around user jobs ("Build", "Run", "Monitor", "Connect") rather than internal module names.
