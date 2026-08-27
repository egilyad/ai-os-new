# Usability Research Progress

> Continuous UX audit of SuperAgents OS. Source is READ-ONLY. No modifications.
> Evidence tags: VERIFIED (read code/UI), INFERRED (reasonable from structure), OPINION.

## Cycle 1 — Navigation / Information Architecture

### Areas reviewed

- `src/route-imports.ts` (PANEL_COMPONENTS: ~160 nav ids, 30+ ComingSoonPanel stubs)
- `src/route-registry-core.ts` (sections: dashboard, chat, debates)
- `src/route-registry-system.ts` (sections: agents, connections, diagnostics)
- `src/route-registry-content.ts` (sections: knowledge, integrations, settings)
- `src/components/Sidebar.tsx` (render logic: ignores `experimental`, no stub badge)

### Sections (9 total) + item counts (approx)

1. Dashboard ~11 · 2. Chat ~6 · 3. Debates ~45 (incl 30 Coming-Soon) · 4. Knowledge ~29 ·
2. Integrations ~27 · 6. Settings ~7 · 7. Agents ~12 · 8. Connections ~14 · 9. Diagnostics ~26.
   Total ~177 nav entries.

### Systemic issues found (NAV)

- S1 (VERIFIED): 30+ "Coming Soon" debate sub-panels render as ordinary nav items; Sidebar ignores
  `experimental` flag entirely → user cannot distinguish real vs stub features.
- S2 (VERIFIED): duplicate nav id `builder` appears in both Debates and Knowledge sections (same panel).
- S3 (VERIFIED): `experimental:true` flag on lenses/crystals/forum/director/room/etc. is not rendered.
- S4 (OPINION): navigation is 9 sections / ~177 items with no obvious "start here".
- S5 (VERIFIED by structure): section semantics overlap (Knowledge = grab-bag; Diagnostics = memory+health+scheduler+aquarium).

### Remaining

Read actual panels for UX: Chat, Debate(live/arena), Room, Forum, Research, Director, Agents,
Workflow, Scheduler, Memory, Analytics, Settings, Cognitive modules.

### Deliverables written this cycle

- `00_USABILITY_MASTER.md` · `01_FIRST_TIME_USER.md` · `02_NAVIGATION.md` (prior)
- `03_PANEL_BY_PANEL.md` · `04_USER_JOURNEYS.md` · `05_AGENT_UX.md` · `06_LIVE_REALTIME_UX.md`
  · `07_FORMS_AND_CONTROLS.md` · `08_INFORMATION_ARCHITECTURE.md` · `09_CONSISTENCY.md`
  · `10_ERROR_UX.md` · `11_DISCOVERABILITY.md` · `12_USABILITY_SCORECARD.md`
  · `13_UX_RECOMMENDATIONS.md` · `14_TOP_50_IMPROVEMENTS.md`

### Scorecard summary (overall 4.5/10)

Discoverability 4 · Clarity 4 · Navigation 5 · Consistency 4 · Learnability 4 · Task completion 5
· Feedback 6 · Error recovery 4 · Realtime 6 · Agent comprehension 5 · Info hierarchy 4.

---

## Cycle 2 — Panels read (VERIFIED evidence)

### Panels read this cycle

- `CommandPalette.tsx` — excellent (⌘K, fuzzy, recent, grouped) but invisible.
- `ComingSoonPanel.tsx` + `ModuleInfo.tsx` — stubs show "coming soon" but ModuleInfo map lacks
  stub keys → empty module-info block for stubs. Sidebar never flags stubs.
- `DebateArena.tsx` — clean classic/runtime toggle.
- `DashboardPanel/*` (DashboardPanel, GetStartedPanel) — strongest panel; GetStarted only at zero keys.
- `AgentsPanel/AgentsPanelView.tsx` — rich (tabs, Elo, live stream, wizard, groups) but dense.
- `LensesPanel/LensesPanel.tsx` — real, functional cognitive module.
- `MemoryPanel/` (structure) — has MemoryEmptyState / MemoryErrorAlert (good pattern to copy).

### Carry-over VERIFIED (prior cycle)

RoomPanel (ambiguous Where/Mode, raw rejection, global feed), ForumPanel (thin vs rich backend),
ResearchEnginePanel (6–7 dark phases), SchedulerPanel (static mock/no-op), WorkflowPanel (good run
history), DirectorPanel RunTab (rich), ChatPanel (most mature).

### Systemic issues confirmed (S-*)

- S-NAV-1..4, S-DEMO-1, S-DARK-1/2, S-ONB-1, S-FEED-1, S-ERR-1 (see 00).
- NEW: S-AGENT-1/2/3 (no first-agent guide; invocation vocab hidden; identity inconsistency).
- NEW: S-LIVE-1 (scoped vs global feeds), S-IA-1 (fake debate depth), S-CONS-1 (real/stub parity).

### Remaining panels to read (future cycles, not blocking deliverables)

SettingsPanel, AnalyticsPanel, Cognitive modules (Crystals/Junction/Synthesis/KnowledgeGen),
AgentComparisonPanel, DebatePanel/DebateRuntimePanel internals, BookmarksPanel, TemplateSharingPanel,
TutorialPanel/OnboardingWizard (to verify they can back UX-003), ProviderManager, Health/SLA panels.

---

## Next cycle recommendation

1. Read remaining high-value panels (Settings, Analytics, a cognitive module or two, TutorialPanel).
2. Revisit 00_USABILITY_MASTER.md scorecard if new evidence changes scores.
3. Optionally split 14_TOP_50 into a phased roadmap (P0 sprint / P1 quarter).
