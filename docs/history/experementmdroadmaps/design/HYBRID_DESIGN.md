# HYBRID DESIGN — "SuperAgents OS, reimagined"

> One coherent interface that combines the strongest ideas from Designs A–F. This is the **recommended direction**. It fixes every major usability problem from `../usability/` without a risky rewrite.

## Where each idea comes from

| Hybrid element                                          | Borrowed from    | Problem solved                                                                  |
| ------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| Command palette as **primary nav** + slim grouped rail  | F + B            | UX-001 (177-item overwhelm), UX-008 (palette invisible), UX-006 (`builder` dup) |
| **Question-centric home** ("What do you want to know?") | E                | UX-003 (no onboarding), intent-first entry                                      |
| Persistent **System Monitor** in header                 | B                | 06-LIVE-2 (always-visible fleet health)                                         |
| **Launchpad** grid (stubs labeled "Planned")            | D                | UX-001 (honest discoverability of stubs)                                        |
| **Node-based invocation** + inspector                   | C                | UX-005 (RoomPanel Where/Mode confusion)                                         |
| **Provenance chains** + Conclusions view                | E                | UX-010 (research phases dark), knowledge credibility                            |
| ⌘J **scoped live strip** (default off)                  | F                | UX-012 (global/unscoped feed)                                                   |
| Inline **policy recovery** in palette                   | F                | UX-004 ("no matching enabled policy")                                           |
| Calm **empty-state + onboarding** component             | A                | UX-007, UX-011 (first agent)                                                    |
| Forum vote/pin/moderate + Research 7-phase visibility   | (usability recs) | UX-009, UX-010                                                                  |

## Proposed mental model

**"Ask a question or give a command. The system resolves who/what runs, shows you provenance, and keeps live activity one keystroke away."**

Three layers, always present:

1. **Command layer (⌘K):** navigate, invoke, configure — the hero.
2. **Context layer (home / question / launchpad):** what you're working on, intent-first.
3. **Awareness layer (header monitor + ⌘J strip):** what's running, scoped.

## Design system (hybrid)

- **Typography:** Inter (UI), JetBrains Mono (command/IDs), Source Serif (question & conclusion headlines — the E editorial flavor).
- **Color:** bg `#0f1117`, surface `#161922`, border `#232733`. Primary accent **indigo `#6366f1`** (calm, A). Semantic accents: emerald `#34d399` (live/run, F), gold `#e0a82e` (knowledge/conclusions, E), violet `#a78bfa` (agents, C). Text `#e6e9ef` / muted `#7c828c`.
- **Spacing:** 8px grid.
- **Cards:** 1px border, 10px radius, flat (no heavy shadow).
- **Buttons:** indigo primary, ghost secondary; emerald for "Run/Live".
- **Nav:** slim left rail (grouped, deduped) **+** ⌘K command palette.
- **Status:** green/amber/red dot system (B).
- **Agent avatars:** round, violet ring (C).
- **Badges:** pill, uppercase 9px; PLANNED=amber, LIVE=emerald.
- **Live stream:** ⌘J collapsible, scoped to current session.
- **Empty state:** guided action card (A).
- **Error state:** inline in palette with a recovery action (F).

## What changes vs CURRENT (summary)

- **KEEP:** the 177 panels' individual value; the existing excellent CommandPalette engine; Dexie-persisted history; event-bus live updates.
- **IMPROVE:** side-rail grouping/dedup; empty/error states; Forum & Research UIs (surface existing backend data); first-run onboarding.
- **REPLACE:** RoomPanel's abstract Where/Mode → node-based invocation + inspector; global Room feed → scoped ⌘J strip; raw "no matching policy" → inline recovery.
- **INTRODUCE:** question-centric home; Launchpad; System Monitor header; provenance chains + Conclusions; ⌘J scoped live strip; honest "Planned" stub labeling.

Mockups: `mockups/hybrid/` (home, command-palette, invocation-node, knowledge-provenance, debate-live).
