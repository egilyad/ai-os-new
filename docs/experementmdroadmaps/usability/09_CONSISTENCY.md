# 09 — Consistency

> Visual, interaction, and terminology consistency across panels. Evidence: VERIFIED (comparison of Dashboard, Agents, Room, Forum, Research, Scheduler, Memory, Lenses, ModuleInfo, ComingSoonPanel).

## Consistent (positive)

- Command palette styling, modal shells (`ModalShell`), tab patterns (`DebateArena` classic/runtime), status badges (`director.run.status.*`) are coherent within their areas.
- `ModuleInfo` component reused across panels for descriptions.

## Inconsistencies

### C-1 (P0) — Real vs stub panels rendered identically (VERIFIED)

- Sidebar shows stub `ComingSoonPanel` routes with the same icon/label treatment as real panels. No "planned"/"beta" tag. Users cannot distinguish. (See 03/08.)

### C-2 (P1) — Empty states vary wildly (VERIFIED)

- `MemoryPanel` has a dedicated `MemoryEmptyState`. `ForumPanel`, `ResearchEnginePanel`, `DebateLivePanel` have ad-hoc or no empty states. No shared `EmptyState` component → inconsistent first-impression quality.

### C-3 (P1) — Author/identity representation (VERIFIED)

- Forum hardcodes "Вы" (RU "You"); agent identity is configurable elsewhere (`AgentIdentityEditor`). Inconsistent sense of "who is speaking."

### C-4 (P2) — Terminology drift

- "Invocation" (engine) → hidden in UI as "Invoke Agent" with "Where/Mode".
- "Scenario" (Director) vs "Workflow" (Builder) vs "Session" (Debate/Chat/Room) used interchangeably in places.
- "Room" means both the panel and a `context.type`.

### C-5 (P2) — Button/control styles

- Some panels use `btn-secondary`/`btn-primary` class conventions (AgentsPanel); others inline-style buttons (ComingSoonPanel, GetStartedPanel, RoomPanel). Mixed design languages.

### C-6 (P3) — Localization

- Mixed RU/EN strings in code (Forum "Вы"; AGENTS.md notes RU/EN i18n). Some UI strings may leak RU regardless of locale.

## Recommendations

- UX-C1: Add a shared `isStub`/`status` flag in route registry; Sidebar renders a "Planned" badge + distinct treatment for stubs.
- UX-C2: Extract a shared `EmptyState` component (model on MemoryPanel's) and adopt across Forum/Research/DebateLive.
- UX-C3: Use the configurable agent/user identity everywhere; never hardcode "Вы".
- UX-C4: Publish a terminology glossary (Scenario/Workflow/Session/Invocation/Room) and use it in UI copy + tooltips.
- UX-C5: Standardize button component usage; avoid one-off inline button styles for primary actions.
