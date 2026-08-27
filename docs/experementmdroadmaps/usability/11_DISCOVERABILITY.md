# 11 — Discoverability

> Can a first-time user find what they need? Evidence: VERIFIED (CommandPalette, Sidebar, route registries, GetStartedPanel, TutorialPanel/OnboardingWizard existence, AGENTS.md).

## Strong discoverability assets (VERIFIED)

- **CommandPalette** (Cmd/Ctrl+K): fuzzy search over all nav items, recent items, grouped. Excellent — but **undiscoverable** (no in-UI hint that it exists).
- **Sidebar**: comprehensive (9 sections, ~177 items). Good for power users; overwhelming for newcomers.
- **Dashboard `QuickActionBar`** + **`GetStartedPanel`**: useful shortcuts, but GetStarted only shows with zero keys.

## Problems

### DISC-1 (P0) — Phantom features hurt trust/discoverability (VERIFIED)

- ~30 stub panels appear fully navigable. Users "discover" them, click, and hit "coming soon." This wastes exploration effort and erodes trust ("the menu lies").

### DISC-2 (P1) — No promoted onboarding (VERIFIED)

- `TutorialPanel`, `OnboardingWizard`, `GetStartedPanel` exist but are not surfaced as a first-run flow. Tutorials are `experimental` → buried. A new user opens the app to the Dashboard with no "where do I start" prompt (unless zero keys).

### DISC-3 (P1) — CommandPalette invisible (VERIFIED)

- No kbd hint (⌘K) shown in the UI chrome. Users who don't read docs never find the best navigation aid.

### DISC-4 (P2) — Feature relationships undiscoverable (VERIFIED/INFERRED)

- Builder → Workflow → Director scenario → Room invocation form a chain, but no panel explains the relationship. Users discover capabilities in isolation.

### DISC-5 (P2) — Search within panels inconsistent

- ChatPanel has search; AgentsPanel has search; many panels (Forum, Research, Memory has SearchBar) vary. No consistent "find within panel" pattern.

## Recommendations

- UX-D1: De-emphasize stubs (badge "Planned", collapsible group) so real features are what users discover first.
- UX-D2: First-run modal → "Take a 2-minute tour" (OnboardingWizard) + persistent "Tutorials" entry in Sidebar (non-experimental).
- UX-D3: Show "⌘K to search" hint in the top bar / sidebar footer.
- UX-D4: On Builder/Workflow/Director/Room, add a one-line "How this connects" cross-link.
- UX-D5: Standardize an in-panel search affordance (icon + shortcut) where lists exist.
