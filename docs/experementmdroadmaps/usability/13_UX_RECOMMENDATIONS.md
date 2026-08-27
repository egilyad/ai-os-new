# 13 — UX Recommendations (Prioritized P0–P3)

> Format per item: ID · Panel/Area · Current · Problem · Why it matters · Proposed UX · Benefit · Complexity · Dependencies · Confidence.
> Evidence tags per 00. Cross-ref: prior roadmap R-ids where applicable.

## P0 — Trust & first-run (do first)

**UX-001 · Sidebar / ~30 stub panels · CURRENT:** stubs render identically to real panels. **PROBLEM:** users can't tell real from planned; erodes trust. **WHY:** discoverability of lies worse than missing features. **PROPOSED:** add `status: 'planned'|'beta'|'live'` to route registry; Sidebar shows a "Planned" badge + groups stubs under a collapsible "Experimental". **BENEFIT:** trust restored, real features surface first. **COMPLEXITY:** Low (registry flag + Sidebar render). **DEPS:** route-registry types. **CONF:** High. _(R-17)_

**UX-002 · SchedulerPanel · CURRENT:** toggles only a settings flag, no `SchedulerService` call. **PROBLEM:** silent dead control that looks functional. **WHY:** worst failure mode—user believes scheduling works. **PROPOSED:** either wire to `SchedulerService` or disable controls with "Preview — not connected" note. **BENEFIT:** no false confidence. **COMPLEXITY:** Low–Med. **DEPS:** SchedulerService API. **CONF:** High. _(R-06/R-21)_

**UX-003 · First-run · CURRENT:** only `GetStartedPanel` (zero keys) + buried experimental Tutorials. **PROBLEM:** no guided entry. **WHY:** newcomers are lost among 177 items. **PROPOSED:** first-run modal → 2-min tour (OnboardingWizard); persistent non-experimental "Tutorials" sidebar entry. **BENEFIT:** faster time-to-value. **COMPLEXITY:** Low–Med. **DEPS:** OnboardingWizard/TutorialPanel. **CONF:** High.

**UX-004 · RoomPanel · CURRENT:** rejection shows `no matching enabled policy`. **PROBLEM:** raw engine term, no action. **WHY:** user stuck, blames product. **PROPOSED:** map to "No policy allows invoking `<agent>` in `<mode>`. Add one in Settings → Policies or pick another agent." + deep link. **BENEFIT:** self-service recovery. **COMPLEXITY:** Low. **DEPS:** i18n. **CONF:** High.

## P1 — Comprehension & consistency

**UX-005 · RoomPanel "Where/Mode" · CURRENT:** bare selects. **PROPOSED:** plain outcomes + one-line hints ("Chat: one agent replies…"). **COMPLEXITY:** Low. **CONF:** High. _(05-B)_

**UX-006 · Info architecture · CURRENT:** duplicate `builder` nav id. **PROPOSED:** single canonical entry. **COMPLEXITY:** Low. **CONF:** High. _(08-IA-2)_

**UX-007 · Empty states · CURRENT:** inconsistent (Memory has one; Forum/Research/DebateLive don't). **PROPOSED:** shared `EmptyState` component adopted everywhere. **COMPLEXITY:** Med. **CONF:** High. _(09-C2)_

**UX-008 · CommandPalette · CURRENT:** invisible (no ⌘K hint). **PROPOSED:** show "⌘K to search" in top bar/sidebar footer. **COMPLEXITY:** Low. **CONF:** High. _(11-DISC-3)_

**UX-009 · ForumPanel · CURRENT:** no vote/pin/moderate UI; author "Вы". **PROPOSED:** add vote/pin/moderate controls + use configurable identity. **COMPLEXITY:** Med. **DEPS:** forum-service already implements these. **CONF:** High. _(R-02/R-22)_

**UX-010 · ResearchEnginePanel · CURRENT:** 6–7 backend phases dark. **PROPOSED:** expose phase UIs (or mark unavailable). **COMPLEXITY:** Med–High. **CONF:** Med. _(R-01)_

**UX-011 · AgentsPanel · CURRENT:** no guided "first agent" flow. **PROPOSED:** promote `AgentWizard` from Dashboard when no agents. **COMPLEXITY:** Low. **CONF:** High. _(05-S-AGENT-1)_

## P2 — Polish

**UX-012 · RoomPanel feed · CURRENT:** global/unscoped. **PROPOSED:** scope to active invocation/session. **COMPLEXITY:** Low–Med. **CONF:** High. _(06-LIVE-1)_

**UX-013 · DebateLive empty arena · CURRENT:** no guidance. **PROPOSED:** add "Start a debate…" copy. **COMPLEXITY:** Low. **CONF:** High. _(06-LIVE-3)_

**UX-014 · Terminology · CURRENT:** Scenario/Workflow/Session/Invocation/Room drift. **PROPOSED:** glossary + tooltips + cross-links on Builder/Workflow/Director/Room. **COMPLEXITY:** Med. **CONF:** High. _(09-C4, 08-IA-4)_

**UX-015 · Import/export · CURRENT:** format undocumented, errors unclear. **PROPOSED:** inline format docs + clear error toasts. **COMPLEXITY:** Low. **CONF:** Med. _(07-FORM-4)_

**UX-016 · Localization · CURRENT:** "Вы" leaks in EN. **PROPOSED:** all strings locale-aware. **COMPLEXITY:** Low. **CONF:** High. _(09-C3, 10-ERR-5)_

## P3 — Nice-to-have

**UX-017 · Unified "Live" indicator** in sidebar. **UX-018 · In-panel search** standard. **UX-019 · Forum→Debate escalation UI** (backend exists). _(R-03/R-23)_ **UX-020 · Agent groups promotion** as onboarding pattern. _(R-26)_

See [14_TOP_50_IMPROVEMENTS.md](./14_TOP_50_IMPROVEMENTS.md) for the expanded list.
