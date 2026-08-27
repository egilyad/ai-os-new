# CONVERSATION ROADMAP (Phase 13 — ConversationCore / Director)

> Research-only. ConversationCore + Director (recently built, Level 2). Real end-to-end run works.
>
> **Cycle 2 — panel roadmap: Conversation.**

## Current state

- `ConversationDirectorService` (B3) → `HybridPolicy` → `ConversationOrchestrator` (B4, emits `conversation:*` events) → `ChatExecutionEngine`.
- `DirectorPanel` (RunTab) — Configure / Library / Run; `directorStore` observer; `directorController` controls.
- E2E proven (B6.1/B6.2): create→load→run→events→store→RunTab; `CONVERSATION_COMPLETED` closes lifecycle.

## Top gaps

- **IN-04 checkpoints in-memory only** — Director checkpoints not persisted; no run history across reloads. → R-05.
- **FE-09 checkpoint-list staleness** — leaks stale state into Room session view.
- **Scenario library thin** — create/duplicate/archive exist; no "run history" of scenarios; no template from run. (R-08-adjacent)
- **No open-session from history** beyond Room's pattern — Director runs should deep-link like Room invocations. (R-15)
- **Not yet an Invocation target for groups** — single-agent chat only. (R-26)

## Roadmap (phased)

1. **Persist Director checkpoints + run history (M).** Dexie table; `directorStore.loadHistory()` like `invocationStore`. (R-05)
2. **Scenario templates (S).** "Save run as scenario" reuses `ScenarioRepository.create`. (R-08)
3. **Stable status (S).** Ensure `conversation:completed`/`paused`/`aborted` map cleanly to RunTab badge (close FE-09).
4. **Group target (M, cross).** `invocationEngine` group → multi-agent ConversationCore. (R-26)

## Value / Effort

Director is the "planned conversation" counterpart to Debate; persistence + history are the missing maturity step. **Priority: P1.**
