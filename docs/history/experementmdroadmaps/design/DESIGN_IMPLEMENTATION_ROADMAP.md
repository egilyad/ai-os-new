# DESIGN IMPLEMENTATION ROADMAP

> 7 phases to move SuperAgents OS from CURRENT UI to the **Hybrid** design. Each phase lists KEEP / IMPROVE / REPLACE / INTRODUCE and the concrete panels/files to touch. This is a **plan only** — no source was modified during the design research.

## Phase 0 — Foundation (design system + tokens)

- **KEEP:** existing component library primitives.
- **INTRODUCE:** a shared design-token module (`src/styles/tokens.ts` or CSS vars): colors (`#0f1117` bg, `#6366f1` primary, `#34d399` live, `#e0a82e` knowledge, `#a78bfa` agents), 8px spacing, status-dot system, pill badges, empty/error component skeletons.
- **IMPROVE:** unify button/card/tab styles across panels (UX-009 consistency).
- **Risk:** low. No behavior change, just tokens.

## Phase 1 — Navigation (rail + palette + launchpad)

- **IMPROVE:** `Sidebar.tsx` → grouped, deduped sections; fix `builder` duplicate id (UX-006).
- **INTRODUCE:** Launchpad route (grid of all capabilities; stubs labeled "Planned") — fixes UX-001 discoverability.
- **IMPROVE:** `CommandPalette.tsx` → promote to primary nav (it already works, UX-008); argument capture ("debate <topic>").
- **Risk:** low–medium. Palette already exists; rail regroup is mechanical.

## Phase 2 — Home + onboarding

- **REPLACE:** generic Dashboard → question-centric home ("What do you want to know?") with quick tiles + recent conclusions (E home, hybrid 01).
- **INTRODUCE:** 60-second first-run tour / onboarding (UX-003); `GetStartedPanel` generalized beyond zero-keys.
- **Risk:** medium. New home component; reuses existing panels behind tiles.

## Phase 3 — Core panels (Agents / Debate / Conversation)

- **IMPROVE:** `AgentsPanel` → agent cards w/ role-ring avatars; `⌘K "create agent"` template picker (UX-011).
- **IMPROVE:** `DebateArena` → empty-arena guidance (UX-013); header System Monitor.
- **IMPROVE:** `DirectorPanel` / Chat → reuse calm empty-state component.
- **Risk:** medium.

## Phase 4 — Invocation / Room rework

- **REPLACE:** `RoomPanel` abstract Where/Mode → node-graph invocation + inspector (hybrid 03; UX-005).
- **IMPROVE:** rejection → inline "Open Policies" recovery (UX-004); `SchedulerPanel` marked "preview" (UX-002).
- **Risk:** medium–high. RoomPanel is the trickiest; node UI is new but isolated.

## Phase 5 — Knowledge + Research + Forum

- **INTRODUCE:** Conclusions view (aggregates crystals/research/debates + provenance chain) (E; UX-010).
- **IMPROVE:** `ResearchPanel` → 7-phase visibility (UX-010); `ForumPanel` → vote/pin/moderate UI (UX-009).
- **Risk:** medium.

## Phase 6 — Realtime + awareness layer

- **INTRODUCE:** ⌘J scoped live strip (default off); header System Monitor widget (B; 06-LIVE-2; UX-012).
- **IMPROVE:** event-bus subscription scoping per session.
- **Risk:** low–medium. Reuses existing live events.

## Phase 7 — Polish + consistency sweep

- **IMPROVE:** empty/error/loading states via shared component (UX-007); localized "Вы" leak fix (UX-016); `ComingSoonPanel`/`ModuleInfo` stub text (UX-001).
- **INTRODUCE:** `RESEARCH_PROGRESS`-style in-app changelog of UI improvements.
- **Risk:** low.

---

## Effort / risk summary

| Phase                      | Effort | Risk     | Depends on |
| -------------------------- | ------ | -------- | ---------- |
| 0 Foundation               | S      | Low      | —          |
| 1 Navigation               | M      | Low–Med  | 0          |
| 2 Home+onboarding          | M      | Med      | 0          |
| 3 Core panels              | M      | Med      | 1          |
| 4 Invocation/Room          | L      | Med–High | 1,3        |
| 5 Knowledge/Research/Forum | M      | Med      | 2          |
| 6 Realtime                 | S–M    | Low–Med  | 1          |
| 7 Polish                   | M      | Low      | all        |

**Recommended sequence:** 0 → 1 → 2 → (3 ∥ 6) → 4 → 5 → 7. Ship navigation + home first (biggest UX wins, lowest risk), then core panels in parallel with realtime, then the Room rework (highest risk) once the token system is proven.
