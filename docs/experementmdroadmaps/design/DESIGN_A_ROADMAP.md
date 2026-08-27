# DESIGN A — AI WORKSPACE

> A clean professional AI workstation. Mental model: a serious work tool (Linear / VS Code / Notion for multi-agent teams).
> Every change below maps to an identified usability problem from `../usability/`.

## 1. Design philosophy

Calm, document-like, task-anchored. The product is a **workspace**, not a control room. Users organize work into **Projects**, each containing agents, conversations, debates, research, and results that persist as context. Reduce chrome; increase readable content. Solve: overwhelming 177-item nav (usability 02/08), no "where do I start" (08-IA-3).

## 2. Target user mental model

"I open my workspace, see my projects, pick up where I left off, and the agents I need are right there." Replaces "I must memorize 9 sections of features."

## 3. Navigation structure

**CURRENT:** 9 sections, ~177 items, 30 stub panels rendered identically, duplicate `builder` id.
**→ PROPOSED:** Two-tier: (1) a slim left rail with 5 workspaces — _Home, Projects, Agents, Knowledge, System_; (2) a project-scoped sub-nav. Stubs are grouped under a collapsible "Planned" with a "Planned" badge (fixes usability UX-001/08-IA-1). `builder` deduplicated (UX-006).
**→ WHY:** Cuts first-run cognitive load from 177 to 5; keeps power features one click deeper.

## 4. Dashboard concept — "Home / Today"

**CURRENT:** Rich but generic Dashboard with live terminal + 10 sections.
**→ PROPOSED:** "Today" home: resume cards for recent projects/sessions, a "Pick up where you left off" strip, and a single prominent **Quick Start** card (Chat / New Debate / Invoke Agent / New Project). On first run, this becomes the onboarding tour entry (UX-003).
**→ WHY:** Gives newcomers a starting point; preserves live data as a collapsible "System live" strip.

## 5. Agent UX

**CURRENT:** Dense workforce table, many tabs, hidden "invoke" concept, no first-agent guide.
**→ PROPOSED:** Agents live under _Projects ▸ Agents_ and a global _Agents_ workspace. "Invoke" renamed **"Ask agent to…"** with plain outcome labels (Chat / Debate / Run a plan) instead of Where/Mode (UX-005). "Spawn your first agent" promoted when empty (UX-011). Agent cards show role + last activity + a one-click "Ask".
**→ WHY:** Removes the abstract Where/Mode vocabulary (usability 05-B, 07-FORM-2).

## 6. Debate UX

**CURRENT:** DebateArena classic/runtime toggle; 30 stub sub-panels; empty arena no guidance.
**→ PROPOSED:** Debates live inside a Project as "Debates". Launch is a primary button "Start debate" with a 2-field form (topic + participants). Stub analysis tools are moved to "Planned". Empty arena shows "Start a debate to see agents reason here" (UX-013).
**→ WHY:** Reduces stub pollution and empty-state confusion.

## 7. Conversation UX

**CURRENT:** ChatPanel mature but unguided.
**→ PROPOSED:** Conversations are threads inside Projects. Keep ChatPanel strengths (fork/edit/export); add a first-message placeholder that suggests a model/key if none configured.
**→ WHY:** Preserves what works; fixes zero-key onboarding gap.

## 8. Research UX

**CURRENT:** 7 backend phases dark; UI only citations.
**→ PROPOSED:** Research becomes a Project activity "Research" with a phase rail showing all 7 phases; unavailable phases are explicitly marked "Not in this build" (UX-010/10-ERR-4). Results compile into a citations + knowledge-graph view.
**→ WHY:** Surfaces existing capability instead of hiding it.

## 9. Room / Invocation UX

**CURRENT:** "Where/Mode" abstract; raw `no matching enabled policy`; global feed.
**→ PROPOSED:** "Invoke" panel: pick agent → pick **plain outcome** (Chat / Debate / Guided plan) → task. Policy rejection becomes actionable: "No policy allows this — add one in Settings ▸ Policies" with deep link (UX-004). Feed scoped to the invocation (UX-012).
**→ WHY:** Directly fixes the worst Room friction.

## 10. Knowledge UX

**CURRENT:** Knowledge section is a grab-bag (lenses/crystals/junction/synthesis/generator/forum/builder/room/director).
**→ PROPOSED:** "Knowledge" workspace with sub-views: _Lenses, Crystals, Synthesis, Forum, Builder_. Each is a Project-linked artifact. Forum gains vote/pin/moderate UI (UX-009).
**→ WHY:** Gives the grab-bag a hierarchy.

## 11. Live execution UX

**CURRENT:** Multiple scattered live surfaces; Room feed global.
**→ PROPOSED:** A single dockable "Live" panel scoped to the active Project/invocation; collapsible to a status dot in the rail. Reuses Dashboard live terminal pattern.
**→ WHY:** Unifies realtime comprehension (usability 06-LIVE-2).

## 12. History

**CURRENT:** Invocations/Debates/Chats persisted but not unified.
**→ PROPOSED:** Per-Project "History" timeline (invocations, debates, research) with filters. Reuses existing Dexie persistence (InvocationRepository.list already exists).
**→ WHY:** Turns the existing persistence into a usable artifact (usability Room history already partly done).

## 13. Settings

**CURRENT:** 7-item Settings section, policies/roles hidden.
**→ PROPOSED:** Settings grouped: _General, Keys & Providers, Policies, Roles, Appearance_. Policy editor surfaces the "add policy" deep link referenced by invocation errors.
**→ WHY:** Supports UX-004 recovery path.

## 14. Notifications

**→ PROPOSED:** A right-side Inbox for invocation completions, policy rejections, debate verdicts. Non-modal; badge in rail.
**→ WHY:** Surfaces async agent results the user would otherwise miss.

## 15. Search / Command Palette

**CURRENT:** Excellent ⌘K palette but invisible.
**→ PROPOSED:** Keep palette; add persistent "⌘K" hint in the rail footer and a search field in Home.
**→ WHY:** Discoverability (UX-008).

## 16. Mobile/responsive

**→ PROPOSED:** Rail collapses to bottom tab bar (Home/Projects/Agents/Knowledge/System). Project sub-nav becomes a drawer. Live panel hidden behind a dot.
**→ WHY:** Serious tool but must not break on small screens.

## 17. Empty states

**→ PROPOSED:** Shared `EmptyState` component (modeled on MemoryPanel's) with icon + one-line action. Applied everywhere (UX-007).

## 18. Loading states

**→ PROPOSED:** Skeleton shimmer per panel region; no full-screen spinners. Reuses existing PanelLoader.

## 19. Error states

**→ PROPOSED:** Structured error card with "What happened / What to do / Open settings" (UX-004/10-ERR-2). Scheduler dead control either wired or labeled "Preview — not connected" (UX-002).

## 20. Information hierarchy

Project ▸ Activity ▸ Artifact. Primary actions right-aligned; live/status left; metadata muted. Three typographic sizes only.

---

## DESIGN SYSTEM A (visual language)

- **Typography:** Inter / system-ui. 3 sizes (14 / 13 / 11), weights 600/500/400. Monospace (JetBrains Mono) only for IDs/sessions.
- **Color:** Neutral slate background `#0f1117`, surface `#171a21`, border `#262b36`. Accent indigo `#6366f1` (primary), green `#22c55e` (success/active), amber `#f59e0b` (planned/stub), red `#ef4444` (error). Text `#e2e8f0` / muted `#8b95a7`.
- **Spacing:** 4px base grid; 8/12/16/24 padding scale.
- **Cards:** 1px border, 8px radius, no shadow (flat, serious). Subtle hover bg shift.
- **Buttons:** Solid accent (primary), outline (secondary), ghost (tertiary). 32px height.
- **Inputs:** 1px border, 8px radius, 32px, focus ring 2px accent.
- **Tabs:** Underline style, 2px accent under active.
- **Nav (rail):** 64px icon rail + 220px label rail; "Planned" group collapsed with amber badge.
- **Status indicators:** 8px dot + label (active/planned/error).
- **Agent avatars:** Round 32px, initials on accent gradient, role ring color.
- **Badges:** 12px rounded, uppercase 10px; Planned=amber, Beta=blue, Live=green.
- **Dialogs:** Centered, 8px radius, scrim, max 560px.
- **Tables:** Row hover, 12px padding, muted header.
- **Timeline:** Vertical rail, dot per event, severity color.
- **Live stream:** Monospace, severity left-border, newest top.
- **Empty state:** 48px icon, 14px title, 12px muted action.
- **Error state:** Left red border, title + action button.

_Mockups: see `mockups/design-a/` (dashboard, nav, agents, agent-detail, debate, research, room, live, history, settings)._
