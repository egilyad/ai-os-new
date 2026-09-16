# DESIGN COMPARISON — SuperAgents OS UI Directions

> Scorecard comparing Design A–F across 12 criteria (1–10). Each design is scored on how well it **solves the identified usability problems** (`../usability/`) while staying implementable on the existing architecture. After the matrix: what to **steal** from each.

## Scoring matrix

| #   | Criterion                                  | A Workspace | B Control Center | C Studio | D AI OS | E Knowledge Hub | F Keyboard-First |
| --- | ------------------------------------------ | :---------: | :--------------: | :------: | :-----: | :-------------: | :--------------: |
| 1   | Usability (fixes real problems)            |      8      |        8         |    7     |    7    |        8        |        8         |
| 2   | Learnability (first-run)                   |      8      |        6         |    6     |    5    |        7        |        7         |
| 3   | Visual clarity                             |      8      |        9         |    7     |    7    |        8        |        7         |
| 4   | Information density                        |      6      |        10        |    6     |    7    |        7        |        9         |
| 5   | AI / agent comprehension                   |      8      |        7         |    9     |    7    |        8        |        7         |
| 6   | Scalability (177+ panels)                  |      7      |        8         |    7     |    6    |        8        |        9         |
| 7   | Implementation complexity (lower = easier) |      7      |        6         |    4     |    3    |        6        |        8         |
| 8   | Architecture compatibility                 |      9      |        8         |    7     |    7    |        8        |        9         |
| 9   | Reusable UI primitives                     |      8      |        8         |    7     |    7    |        8        |        9         |
| 10  | Risk (lower = safer)                       |      9      |        7         |    5     |    4    |        7        |        7         |
| 11  | Uniqueness / identity                      |      7      |        8         |    9     |    9    |        9        |        8         |
| 12  | Wow factor                                 |      7      |        8         |    9     |    9    |        8        |        8         |
|     | **Avg**                                    |   **7.7**   |     **7.4**      | **6.8**  | **6.5** |     **7.6**     |     **7.9**      |

### Notes on the spread

- **F (7.9)** wins on scalability/risk/reuse: it hides the 177-item problem behind the command palette (which already exists and is excellent) and adds the least new chrome.
- **A (7.7)** is the safest "serious product" baseline — calm, professional, fixes onboarding + empty states cleanly.
- **E (7.6)** uniquely reframes the product around _questions → conclusions_, which is the strongest conceptual differentiation and best matches the AI-OS's actual value (accumulated knowledge).
- **B (7.4)** is the best _operational_ view (NOC metaphor) but hardest to learn for non-ops users.
- **C (6.8)** and **D (6.5)** are the most visually striking (canvas / desktop) but carry the highest implementation risk and the weakest fit for a dense multi-panel tool.

## What to steal from each

### A — AI Workspace

- **Steal:** the calm first-run onboarding pattern (UX-003), the consistent "empty state → guided action" component (UX-007), and the clear side-rail with _grouped, deduplicated_ sections (UX-001/006/008).
- **Keep as default tone:** professional, low-noise, indigo accent.

### B — Control Center

- **Steal:** the persistent **System Monitor** widget (fleet health, live ops strip) — reusable in any design's header (06-LIVE-2). The "command bar + workspace" split (B-02 command-nav mockup) is the best nav compromise: keep a slim rail _and_ a ⌘K.
- **Steal:** status-as-color (green/amber/red dot system) for agent/debate health (UX-013 guidance).

### C — AI Studio

- **Steal:** the **node/canvas mental model for invocation** (05-invoke-node) — far clearer than RoomPanel's abstract "Where/Mode" (UX-005). And the inspector pattern (07-settings-inspector) for contextual settings instead of a separate Settings page.
- **Steal:** agent avatars with role rings (visual identity without IDs).

### D — AI OS / Desktop

- **Steal:** the **Launchpad** (grid of all capabilities, stubs labeled "Planned") as the _discoverability_ answer to UX-001 — a single place that surfaces everything honestly. The dock for pinned active sessions (live debates/rooms) is a great "what's running" surface.
- **Do NOT steal:** full window-management (too heavy for this app).

### E — Knowledge Hub

- **Steal:** the **question-centric home** ("what do you want to know?") as the primary entry — matches user intent better than a tool list. The **provenance chain** (question → debate/agent → conclusion) for every result (UX-010 evidence, knowledge credibility). The **Conclusions** view as the product's accumulated value.
- **Steal:** editorial typography + gold accent for a distinctive, non-SaaS identity.

### F — Keyboard-First

- **Steal:** make the **command palette the hero** (it already exists and is excellent — UX-008). Inline previews + argument capture ("debate <topic> with <agents>") turn actions into typed sentences. ⌘J scoped live strip (default off).
- **Steal:** _stubs only appear when searched_, labeled "Planned" — the cleanest fix for UX-001.

## Cross-cutting steal list (→ Hybrid)

1. **F's command palette as primary nav** + **B's slim rail** (grouped/deduped) → navigation that scales and is discoverable.
2. **A's onboarding + empty-state component** → first-run + consistent blanks (UX-003/007).
3. **E's question-centric home + provenance chains** → the product's identity and credibility layer.
4. **D's Launchpad grid** (honest stub labeling) → the "see everything" surface.
5. **C's node-based invocation + inspector** → fix RoomPanel Where/Mode confusion (UX-005).
6. **B's persistent System Monitor** (header) → always-visible fleet/live health.
7. **F's ⌘J scoped live strip** (default off) → realtime on demand (UX-012 / 06-LIVE-2).
8. **Unified status color system** (green/amber/red) across all surfaces.
9. **Forum vote/pin/moderate UI** + **Research 7-phase visibility** surfaced in whichever design ships (UX-009/010).
10. **`builder` nav id dedup** + **Scheduler "preview" label** applied everywhere (UX-002/006).

See `HYBRID_DESIGN.md` for the combined proposal.
