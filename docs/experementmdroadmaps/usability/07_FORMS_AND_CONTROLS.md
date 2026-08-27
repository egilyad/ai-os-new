# 07 — Forms & Controls

> Inputs, buttons, toggles, modals, validation. Evidence: VERIFIED (RoomPanel, SchedulerPanel, AgentsPanel wizard/editor, DirectorPanel RunTab override form, TemplateSharingPanel reviewed structurally).

## Good patterns (VERIFIED)

- **Director RunTab override form**: participant `<select>` + instruction `<input>`, gated submit, clear disabled states (Run enabled when idle; Pause/Resume/Skip/Override/Abort when busy). Good affordance logic.
- **CommandPalette**: keyboard-first, fuzzy, recent, grouped — exemplary control.
- **MemoryPanel / LensesPanel**: modal shells (`ModalShell`, `LensEditorModal`) with clear open/close.

## Problems

### FORM-1 (P0) — SchedulerPanel is a non-functional form (VERIFIED)

- `SchedulerPanel.tsx:24-65` hardcodes `SCHEDULES`; the toggle only calls `setSetting`/`getAllSettings`. The form _looks_ like it creates/edits schedules but **persists nothing to `SchedulerService`**. A user who toggles items believes scheduling is configured; it is not. This is a silent dead-control — the worst kind of form UX failure (looks alive, does nothing).

### FORM-2 (P1) — RoomPanel pickers lack affordances/hints (VERIFIED)

- Agent `<select>` (good, lists registered agents), but "Where" (room/forum-topic/conversation) and "Mode" (chat/debate/director-scenario) are bare `<select>`s with no helper text. No inline explanation of what each option produces.

### FORM-3 (P2) — Validation feedback inconsistent

- Director override: gated + (presumably) validated. RoomPanel: rejection surfaces only _after_ submit as a raw engine message (`no matching enabled policy`), not as proactive validation. No client-side hint that a policy must exist before invoking.

### FORM-4 (P2) — Template/agent import-export

- AgentsPanel import/export exists but the file format/expected shape is not explained in-panel; error states on bad import are unclear (INFERRED from `onImportAgents` wiring).

## Recommendations

- UX-F1: Either wire SchedulerPanel to `SchedulerService` or visibly mark it "Preview / not yet connected" with disabled controls. Never ship a form that silently no-ops.
- UX-F2: Add one-line helper text under RoomPanel "Where"/"Mode" (e.g., "Chat: one agent replies. Debate: agents argue a topic. Scenario: a scripted multi-turn plan.").
- UX-F3: Pre-validate RoomPanel invocation (warn if no enabled policy matches the selected agent) before submit.
- UX-F4: Document import formats inline; show a clear error toast on malformed import.
