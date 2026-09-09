# DESIGN D — AI OS / DESKTOP

> Treat the application like an operating system. Mental model: a desktop environment for AI — apps, windows, dock, command palette, persistent sessions.
> Every change maps to an identified usability problem from `../usability/`.

## 1. Design philosophy

Familiar OS metaphor. Everything is an **app** (Chat, Debate, Agents, Research, Room, Forum…) running in **windows** on a persistent **desktop**, with a **dock** and a **command palette** (already excellent — 11/UX-008). Sessions persist as open windows. Solves: 177-item flat nav (02/08), no persistent context, stubs disguised as features.

## 2. Target user mental model

"I have a desktop of AI apps. I open what I need, arrange windows, and my work stays where I left it."

## 3. Navigation structure

**CURRENT:** 9 sections / 177 items, stubs identical.
**→ PROPOSED:** Top **menu bar** (⌘K search, system status, avatar) + bottom **dock** of core apps + **Launchpad** (all apps, grouped; stubs marked "Planned" badge) (UX-001). `builder` deduped. Persisted window layout per user.
**→ WHY:** OS metaphor is the most universally learned mental model; scales to 177 items via Launchpad folders.

## 4. Dashboard concept — "Desktop"

**CURRENT:** Generic Dashboard.
**→ PROPOSED:** The desktop itself: wallpaper-free, clean surface with **open app windows** + a "Get started" widget (first-run tour, UX-003) + a "Recent" stack. Live activity is a small always-on "System" window.
**→ WHY:** Context persists; no dead landing page.

## 5. Agent UX

**→ PROPOSED:** "Agents" app shows a roster; double-click opens an agent window with "Ask agent to…" plain outcomes (UX-005). Empty → "Create agent" in Launchpad (UX-011). Identity configurable (UX-016).
**→ WHY:** Agents become first-class apps.

## 6. Debate UX

**→ PROPOSED:** Debate app = window with arena; launching opens a new window. Multiple debates = multiple windows (tiled/swapped). Empty arena guidance (UX-013).
**→ WHY:** Parallel debates become natural.

## 7. Conversation UX

**→ PROPOSED:** Chat app; multiple chat windows; reuse ChatPanel.

## 8. Research UX

**→ PROPOSED:** Research app window with **phase sidebar** (7 phases, planned states) + results pane (UX-010).

## 9. Room / Invocation UX

**→ PROPOSED:** "Invoke" is a system command (⌘K "Invoke agent") or a Room app; pick agent → plain outcome (UX-005); rejection = modal with deep link (UX-004); feed scoped to the Room window (UX-012).

## 10. Knowledge UX

**→ PROPOSED:** Knowledge apps (Lenses/Crystals/Synthesis/Forum/Builder) as separate app windows; Forum gains vote/pin/moderate (UX-009).

## 11. Live execution UX

**→ PROPOSED:** A persistent "System Monitor" window (realtime events, health, fleet) — docked by default. Replaces scattered feeds (06-LIVE-2).
**→ WHY:** Realtime is a permanently-open app, not buried.

## 12. History

**→ PROPOSED:** "Files/History" app: unified timeline of sessions/invocations/debates (reuses Dexie).

## 13. Settings

**→ PROPOSED:** "Settings" app with grouped sections; Policy editor embedded (UX-004 recovery).

## 14. Notifications

**→ PROPOSED:** OS-style notification toasts (top-right) + dock badge counts.

## 15. Search / Command Palette

**→ PROPOSED:** ⌘K is the OS launcher (apps + commands); promoted with a persistent hint in the menu bar (UX-008). This is the product's existing strength — lean into it.

## 16. Mobile/responsive

**→ PROPOSED:** Single-window tabbed mode; dock → bottom bar; Launchpad → grid.

## 17. Empty states

**→ PROPOSED:** App windows show their own empty states (shared component, UX-007).

## 18. Loading states

**→ PROPOSED:** Window content skeletons; dock icon bounce while loading.

## 19. Error states

**→ PROPOSED:** Error sheet within the app window + system notification; structured "What/Why/Do" (UX-004). Scheduler app labeled "Preview" (UX-002).

## 20. Information hierarchy

Menu bar (system) ▸ Dock (core apps) ▸ Desktop (windows) ▸ Launchpad (all). Window content carries the detail.

---

## DESIGN SYSTEM D (visual language)

- **Typography:** SF Pro / Inter. Sizes 13/12/11; system-feel. Monospace for IDs.
- **Color:** Light-neutral desktop option + dark `#10131a`. Surface `#1a1f29`, border `#2b3340`. Accent **blue `#3b82f6`** (primary), green `#22c55e`, amber `#f59e0b`, red `#ef4444`, violet `#8b5cf6`. Text `#e8edf4` / muted `#8a94a6`.
- **Spacing:** 8px grid; window padding 16.
- **Cards:** window panes with title bars (traffic-light style optional), 10px radius, subtle shadow.
- **Buttons:** Blue primary, grey secondary, window-control icons.
- **Inputs:** 8px radius, focus ring blue.
- **Tabs:** Window tab strip.
- **Nav:** bottom Dock (64px) + top Menu bar (40px) + Launchpad grid.
- **Status indicators:** dot + label; window badge counts.
- **Agent avatars:** Round 32px, gradient, role color ring.
- **Badges:** rounded, uppercase 9px; PLANNED=amber.
- **Dialogs:** Centered sheets / window-modal.
- **Tables:** standard rows.
- **Timeline:** History app list + window event log.
- **Live stream:** System Monitor window, monospace.
- **Empty state:** centered icon + action inside window.
- **Error state:** red-tinted sheet + notification.

_Mockups: `mockups/design-d/` (desktop, launchpad, agents-app, debate-window, research-window, room-invoke, system-monitor)._
