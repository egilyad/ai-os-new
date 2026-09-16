# DESIGN C — AI STUDIO

> A creative visual studio. Mental model: Figma / Blender for multi-agent work — canvases, node graphs, agent teams, experiments, visual results.
> Every change maps to an identified usability problem from `../usability/`.

## 1. Design philosophy

Visual-first, spatial, explorative. The product is a **studio**: you compose agent workflows on a canvas, run experiments, and see results as visual artifacts (graphs, arenas, citations). For users who think in diagrams, not lists. Solves: overwhelming list-nav (02/08), abstract orchestration vocabulary (Where/Mode), dark research phases hidden as text.

## 2. Target user mental model

"I build agent workflows on a canvas, run them as experiments, and watch the results render visually."

## 3. Navigation structure

**CURRENT:** 9 sections / 177 items.
**→ PROPOSED:** Left **tool dock** (Canvas, Agents, Library, Experiments, Knowledge) + center **canvas/tab** + right **inspector**. Stubs appear in Library as greyed "Planned" cards (UX-001). `builder` deduped.
**→ WHY:** Spatial model scales better than a flat list for complex orchestration.

## 4. Dashboard concept — "Studio Home"

**CURRENT:** Generic Dashboard.
**→ PROPOSED:** A canvas-like home with pinned **canvases** (projects), a "New canvas" tile, and a side strip of recent experiments + live mini-preview. First-run: onboarding overlay "Build your first workflow" (UX-003).
**→ WHY:** Makes the canvas the centerpiece; fixes no-start-point.

## 5. Agent UX

**→ PROPOSED:** Agents are **nodes** you drag onto a canvas; an Agent Library (left dock) lists them with role+avatar. "Invoke" = drag agent → connect to a Trigger node → choose plain **output** (Chat/Debate/Plan) (UX-005). Empty library → "Create agent" node (UX-011). Identity configurable (UX-016).
**→ WHY:** Turns abstract invocation into a visual, understandable act.

## 6. Debate UX

**→ PROPOSED:** A Debate is a canvas template: participant nodes around a central Topic node; running animates message edges. Empty template shows ghost nodes "Drop agents here" (UX-013).
**→ WHY:** Visual debate is self-explanatory.

## 7. Conversation UX

**→ PROPOSED:** Chat as a canvas "thread" node; reuse ChatPanel in inspector.

## 8. Research UX

**→ PROPOSED:** Research = canvas with a **phase graph** (7 nodes, completed/planned states colored) → renders citations graph + knowledge graph visually (UX-010). No more hidden phases.

## 9. Room / Invocation UX

**→ PROPOSED:** "Invoke" is connecting an Agent node to an Output node; policy rejection shows as a red edge with a tooltip "No policy — open Policies" (UX-004). Live feed scoped to canvas selection (UX-012).

## 10. Knowledge UX

**→ PROPOSED:** Knowledge Library (Lenses/Crystals/Synthesis/Forum/Builder) as draggable modules. Forum gains vote/pin/moderate on cards (UX-009).

## 11. Live execution UX

**→ PROPOSED:** Animated edges + a "Render" panel showing live output of the selected node. Replaces scattered feeds with canvas-scoped visualization (06-LIVE-1/2).

## 12. History

**→ PROPOSED:** "Experiments" panel: snapshots of canvas runs, diffable, replayable (reuses Dexie persistence).

## 13. Settings

**→ PROPOSED:** Inspector when a "Settings" node selected; Policies editor embedded (enables UX-004 recovery).

## 14. Notifications

**→ PROPOSED:** Toast in corner + a "Notifications" node you can drop on canvas.

## 15. Search / Command Palette

**→ PROPOSED:** ⌘K "Insert node…" palette (UX-008) — search agents/modules/commands.

## 16. Mobile/responsive

**→ PROPOSED:** Canvas becomes a scrollable single column; dock becomes bottom sheet; inspector a modal.

## 17. Empty states

**→ PROPOSED:** Ghost-node canvases ("Drop an agent to begin") — stronger than text empty states.

## 18. Loading states

**→ PROPOSED:** Node pulse / edge dash animation while running.

## 19. Error states

**→ PROPOSED:** Red node + edge tooltip with action; structured error card in inspector (UX-004). Scheduler: node shows "Preview — not connected" (UX-002).

## 20. Information hierarchy

Canvas (spatial) ▸ Inspector (detail) ▸ Dock (tools). Visual encoding (color/edge) carries status.

---

## DESIGN SYSTEM C (visual language)

- **Typography:** Space Grotesk / Inter. Sizes 14/12/11; monospace for IDs.
- **Color:** Deep aubergine `#15101c`, canvas `#1c1626`, surface `#241b30`, border `#3a2d4d`. Accent **magenta-violet `#d946ef`** (primary), green `#34d399` (done), amber `#fbbf24` (planned), red `#fb7185` (error), cyan `#22d3ee` (data/links). Text `#f4ecff` / muted `#a392b8`.
- **Spacing:** 6px grid; 10/14/20 padding.
- **Cards:** 1px border, 10px radius, soft shadow (studio depth).
- **Buttons:** Gradient magenta (primary), outline (secondary).
- **Inputs:** rounded 10px, focus glow magenta.
- **Tabs:** Canvas tab bar at top.
- **Nav (dock):** 72px vertical tool dock, icon + label.
- **Status indicators:** node border color + small badge.
- **Agent avatars:** Round 36px gradient ring with initials.
- **Badges:** pill, uppercase 10px; PLANNED=amber.
- **Dialogs:** Centered modal, 10px radius.
- **Tables:**很少 used; prefer node lists.
- **Timeline:** node-based on canvas + experiment list.
- **Live stream:** animated edges + render panel.
- **Empty state:** ghost nodes.
- **Error state:** red node + inspector card.

_Mockups: `mockups/design-c/` (studio-home, canvas-debate, canvas-research, agent-library, invoke-node, knowledge-lib, settings-inspector)._
