# 10 — Error & Failure UX

> How the product communicates failures, blocks, and recovery. Evidence: VERIFIED (RoomPanel rejection reasons, SchedulerPanel silent no-op, Dashboard errorBanner, MemoryPanel MemoryErrorAlert, AGENTS.md runtime-fix notes).

## Good patterns (VERIFIED)

- **DashboardPanel** wraps risky reads in `try/catch` and shows `errorBanner` with dismiss. Good.
- **MemoryPanel** has a dedicated `MemoryErrorAlert` component — structured error surfacing.
- **Director RunTab** shows per-turn `error` entries in the live log — failures are visible, not silent.

## Problems

### ERR-1 (P0) — Silent dead control: SchedulerPanel (VERIFIED)

- Toggling schedules updates a settings flag only; no schedule is created/toggled in `SchedulerService`. The user gets **no error and no success** — they believe scheduling works. Worst failure mode: silent no-op that _looks_ successful.

### ERR-2 (P1) — Raw engine errors shown to users (VERIFIED)

- RoomPanel surfaces invocation rejection as `no matching enabled policy` — a backend/policy term, not a user-actionable message. No hint about _what to do_ (create a policy? pick another agent?).

### ERR-3 (P1) — "Coming soon" for stubs is itself a soft error (VERIFIED)

- A user clicks a promising debate sub-panel, lands on `ComingSoonPanel`, and gets "This panel is coming soon. It will display data from `<service>`." With `ModuleInfo` empty for stub keys, there's no explanation of what the feature _would_ do or when. Dead end with no recovery path.

### ERR-4 (P2) — Research/Scheduler "partial" failures invisible (INFERRED)

- Research backend computes 7 phases but UI exposes only citations; if a phase fails or is skipped, the user sees nothing (no error, no "phase unavailable" note). Scheduler's no-op is the same class of silent failure.

### ERR-5 (P2) — Localization in errors

- Forum "Вы" leakage suggests some error/user strings may be locale-frozen (RU). English-locale users see Russian.

## Recommendations

- UX-E1: SchedulerPanel — either connect to `SchedulerService` or render controls as disabled with a "Preview — not connected" note. Never no-op silently.
- UX-E2: Map engine rejection reasons to user language: "No policy allows invoking `<agent>` in `<mode>`. Add one in Settings → Policies, or choose a different agent." Provide a deep link.
- UX-E3: For stubs, show a real description + "Planned" + (if known) a link to the related working panel. Don't dump a service name.
- UX-E4: Surface skipped/failed research phases explicitly ("Systematic review: unavailable in this build").
- UX-E5: Ensure all user-visible strings (incl. errors) respect the selected locale.
