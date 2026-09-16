# 14 — Top 50 UX Improvements

> Ranked by impact × low effort for first-time usability. IDs map to 13. Evidence: VERIFIED/INFERRED/OPINION per 00.

## Trust & first-run (P0) — highest leverage

1. **UX-001** Label/collapse stub panels in Sidebar (status flag + "Planned" badge).
2. **UX-002** Fix or disable SchedulerPanel (no silent no-op).
3. **UX-003** First-run tour modal + persistent Tutorials entry.
4. **UX-004** Human-readable invocation rejection (deep link to Policies).
5. Remove/clearly mark the ~30 `ComingSoonPanel` debate items from primary nav.
6. De-duplicate `builder` nav id (Debates vs Knowledge).
7. Show real feature count instead of fake debate depth.
8. Stop rendering `ModuleInfo` empty for stubs — give a real description or hide it.

## Comprehension (P1)

9. **UX-005** RoomPanel "Where/Mode" → plain outcomes + hints.
10. **UX-009** Forum: add vote/pin/moderate UI (backend ready).
11. **UX-010** Research: expose dark phases or mark unavailable.
12. **UX-011** Promote AgentWizard from Dashboard when no agents.
13. **UX-008** Show "⌘K to search" hint in chrome.
14. **UX-007** Shared `EmptyState` component (model on MemoryPanel).
15. Explain "invocation" concept in RoomPanel (currently hidden word).
16. Add one-line "what is a debate" guidance to DebateLive empty state.
17. Add "what is a scenario" guidance to DirectorPanel empty state.
18. Glossary: Scenario / Workflow / Session / Invocation / Room.
19. Cross-link Builder→Workflow→Director→Room ("how it fits").
20. Scope RoomPanel feed to active invocation.

## Consistency (P1–P2)

21. **UX-016** Locale-aware all strings (kill "Вы" leak).
22. Use configurable identity everywhere (no hardcoded author).
23. Standardize primary/secondary button components.
24. Unified severity model for live events (structured level, not name-match).
25. Consistent in-panel search affordance where lists exist.
26. Consistent status-badge component across panels.
27. Consistent modal/editor patterns (ModalShell already exists—use it).
28. Consistent loading skeletons instead of "common.loading" text only.

## Error & feedback (P1–P2)

29. **UX-004** actionable policy rejection.
30. Surface skipped/failed research phases explicitly.
31. Scheduler: explicit "not connected" if disabled.
32. RoomPanel: pre-validate policy before submit (warn).
33. Forum: show moderation state visibly.
34. Director: keep per-turn error log (already good—extend to all run panels).
35. Global error toast system reused (Dashboard errorBanner pattern).
36. Empty-search states ("no results") standardized.

## Discoverability (P1–P2)

37. **UX-008** ⌘K hint.
38. **UX-003** onboarding entry.
39. **UX-001** stubs de-emphasized.
40. "Quick start" cards on Dashboard for key jobs (chat, debate, agent, room).
41. Related-modules links (ModuleInfo already supports—use on more panels).
42. Search within Agent/Forum/Research panels (Chat already has).
43. Bookmark/favorite panels (BookmarksPanel exists—surface it).
44. "What's new / Planned" page so stubs are explained, not hidden.
45. Keyboard shortcuts cheat-sheet (CommandPalette could list them).

## Live & realtime (P2)

46. **UX-012** scoped Room feed.
47. **UX-013** DebateLive empty guidance.
48. Unified "Live now" sidebar indicator.
49. Live activity default-visible on Dashboard (already—promote).
50. Realtime event legend (what severity colors mean).

## Cross-reference to prior roadmap

- R-01 (research expose) → #10/11. R-02/R-22 (forum vote/pin/moderate) → #10. R-03/R-23 (forum→debate escalation) → add UI. R-06/R-21 (scoped feed + scheduler bridge) → #2/20. R-17 (stub hygiene) → #1/5. R-26 (agent groups) → promote. All remain valid; this audit reframes them as first-time-usability blockers.
