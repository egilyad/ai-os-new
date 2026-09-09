# DESIGN F — KEYBOARD-FIRST / COMMAND NATIVE

> A command-native interface where almost everything is reachable via the keyboard. Mental model: Raycast / Superhuman / Vim — minimal chrome, a powerful command palette, inline previews, zero mouse required. (Emergent direction: the existing `CommandPalette` is already excellent, so this direction _doubles down_ on it.)
> Every change maps to an identified usability problem from `../usability/`.

## 1. Design philosophy

The **command bar is the product**. Minimal persistent chrome; navigation, actions, and content previews all happen through ⌘K. Solves: 177-item nav overwhelm (02/08) by hiding it behind a fast, searchable command surface; fixes command-palette discoverability (UX-008) by making it the default; reduces stub pollution impact (stubs simply don't rank unless searched).

## 2. Target user mental model

"I press ⌘K, type what I want — 'debate on X', 'ask Architect', 'research Y' — and it happens with a preview. I rarely touch the mouse."

## 3. Navigation structure

**CURRENT:** 9 sections / 177 items, stubs identical.
**→ PROPOSED:** Near-empty chrome: a thin top bar with ⌘K + status dot. All navigation is the command palette (commands + navigation). Stubs appear only when explicitly searched, labeled "Planned" (UX-001). `builder` deduped.
**→ WHY:** Collapses 177 items into a single searchable surface; scales infinitely.

## 4. Dashboard concept — "Command surface"

**CURRENT:** Generic Dashboard.
**→ PROPOSED:** A calm landing with a large ⌘K prompt ("What do you want to do?"), recent commands, and a subtle live status strip. First run: onboarding explains ⌘K (UX-003).
**→ WHY:** The product's primary action is front-and-center.

## 5. Agent UX

**→ PROPOSED:** `⌘K "ask System Architect"` → inline agent picker + outcome choice (Chat/Debate/Plan) (UX-005). Empty → `⌘K "create agent"` (UX-011). Identity configurable (UX-016).
**→ WHY:** Invocation becomes a typed sentence.

## 6. Debate UX

**→ PROPOSED:** `⌘K "debate <topic> with <agents>"` → preview of arena + Enter to launch. Empty guidance inside preview (UX-013).

## 7. Conversation UX

**→ PROPOSED:** `⌘K "chat"` → new thread; reuse ChatPanel in a minimal frame.

## 8. Research UX

**→ PROPOSED:** `⌘K "research <question>"` → phase checklist preview (7 phases, planned states) (UX-010).

## 9. Room / Invocation UX

**→ PROPOSED:** Invocation is a command; rejection shows inline in the palette with a "Open Policies" action (UX-004); live feed scoped in the resulting view (UX-012).

## 10. Knowledge UX

**→ PROPOSED:** Commands like "open Forum", "new Crystal", "synthesize". Forum gains vote/pin/moderate once open (UX-009).

## 11. Live execution UX

**→ PROPOSED:** A collapsible live strip (⌘J) shows scoped events; default off to keep focus (06-LIVE-2).
**→ WHY:** Realtime on demand, not forced.

## 12. History

**→ PROPOSED:** `⌘K "history"` or `⌘K "open <past session>"` → fuzzy search over Dexie-persisted sessions.

## 13. Settings

**→ PROPOSED:** `⌘K "settings policies"` jumps directly to the policy editor (UX-004 recovery).

## 14. Notifications

**→ PROPOSED:** Toast bottom-right; dismiss with Esc; `⌘K "notifications"` to review.

## 15. Search / Command Palette

**→ PROPOSED:** The hero. Commands + navigation + inline previews + argument capture ("debate <topic>"). Always shown hint. This is the product's existing strength maximized.

## 16. Mobile/responsive

**→ PROPOSED:** Tap-to-open palette (bottom sheet); same command model.

## 17. Empty states

**→ PROPOSED:** The command prompt itself is the empty state ("Type to begin").

## 18. Loading states

**→ PROPOSED:** Inline spinner in preview; command resolves fast.

## 19. Error states

**→ PROPOSED:** Inline error in palette with action (UX-004); Scheduler command labeled "preview" (UX-002).

## 20. Information hierarchy

Command bar ▸ Inline preview ▸ Result view. Hierarchy is created on demand by the user's intent.

---

## DESIGN SYSTEM F (visual language)

- **Typography:** Geist / Inter. Sizes 14/13/11; monospace for commands/IDs.
- **Color:** Near-black `#08090c`, surface `#0e1014`, border `#1c2026`. Accent **emerald `#34d399`** (primary), violet `#a78bfa` (agents), blue `#60a5fa` (evidence), amber `#fbbf24` (planned), red `#f87171`. Text `#e6e9ef` / muted `#7c828c`.
- **Spacing:** 4px grid; generous 16–24 padding for calm.
- **Cards:** 1px border, 12px radius (palette is a floating sheet), heavy shadow for focus.
- **Buttons:** Emerald primary, ghost secondary.
- **Inputs:** borderless in palette; focus = emerald caret.
- **Tabs:** None persistent; contextual in preview.
- **Nav:** minimal top bar only.
- **Status indicators:** small dot.
- **Agent avatars:** Round 28px emerald ring.
- **Badges:** pill, uppercase 9px; PLANNED=amber.
- **Dialogs:** floating command sheet (center-top).
- **Tables:** in preview only.
- **Timeline:** command history.
- **Live stream:** ⌘J collapsible strip.
- **Empty state:** command prompt.
- **Error state:** red text in sheet + action.

_Mockups: `mockups/design-f/` (command-palette-hero, landing, invoke-command, research-command, agent-command, settings-command, live-strip)._
