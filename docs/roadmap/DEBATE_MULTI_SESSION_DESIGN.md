# Debate Multi-Session Rearchitecture (B-15/B-16 Phase 2)

**Goal:** Remove `DebateSyncManager`'s single-active-debate assumption (B-16) and give
each debate a single owner per type (B-15), so invocation-spawned debates coexist with
manual ones instead of colliding.

**Key finding (verified):** `IDebateEngine` already supports N concurrent sessions
(`createSession` → `genId('debate')` used as both `runtimeId` and `session.id`; the engine
keeps `Map<id, session>`). The constraint lives ONLY in:

- `DebateSyncManager` singleton fields: `activeSession`, `runtimeSessionId`, `governor`,
  `bridgeCtx`, `_activeOwner`, `_runPromises`, `_unsubs`, `_durationTimer`, `_verdictCache`,
  `_syncing`, `_syncDebounceTimer`, `_finalized`.
- `activeDebateStore` (`src/stores/activeDebateStore.ts`): single `session` + `governorState`.
- `debateLiveStore` is **already session-keyed** (`${sessionId}:${agentId}` maps + `clearSession(id)`) —
  minimal/no change needed.

## Scope options

### (B) Bounded — concurrent runs, single-view UI [RECOMMENDED]

Sync manager keeps `Map<id, SyncEntry>`; multiple debates run at once. `activeDebateStore`
becomes a _projection_ keyed by session id with an `activeSessionId` selector; the UI still
shows ONE debate at a time (the selected one), switchable via existing SessionHub /
DebatesManager. No rewrite of `DebatePanel`/`DebateRuntimePanel` beyond reading the selected
session. Fully fixes the B-16 collision; low–medium risk.

### (A) Full L-4 — multi-tab multi-view

Additionally make every debate panel render N simultaneous debates in tabs. Much larger UI
blast radius (DebatePanel, DebateRuntimePanel, AgentControlPanel, VotePanelSection,
DebateMemoryPanel, DebateAnalysisPanel, ArgumentGraphPanel all assume one active debate).
Highest risk; needs its own UI design pass.

## Internal model (both options)

```ts
interface SyncEntry {
  sessionId: string;
  activeSession: DebateSession | null;
  governor: DebateGovernor | null;
  bridgeCtx: SnapshotBridgeContext | null;
  owner: string | null;
  runPromise: Promise<void>;
  unsubs: Array<() => void>;
  durationTimer: ... | null;
  syncing: boolean;
  syncDebounceTimer: ... | null;
  verdictCache: Map<string, DebateVerdict>;
  finalized: boolean;
}
```

- `DebateSyncManager` keeps `private readonly _entries = new Map<string, SyncEntry>()`;
  global fields (`engine`, `postProcessor`, `interpreter`, `_initialized`, `_initUnsubs`)
  stay.
- `startDebate` / `startTopologyDebate` create a NEW entry (no longer cancel the previous
  session). Set `activeSessionId` to the new entry id (UI shows latest).
- Owner guard (Phase 1) reinterpreted for concurrency: an invocation start is rejected only
  if a non-terminal entry with the SAME owner already exists (idempotency); different owners
  coexist. This preserves the Phase-1 win (invocation never silently kills a manual debate)
  and enables coexistence.
- `getActiveDebateSession()` → `_entries.get(activeSessionId)?.activeSession ?? null`.
- `getRunCompletion(sessionId)` → `_entries.get(sessionId)?.runPromise`.
- `_syncSessionImpl(entry)`, `startEngineWithFinalize(entry)`, `stopDebateInternal(entry)`,
  `finalizeInternal(entry)` take the entry (per-entry listeners/timers/state).
- New `setActiveSessionId(id)` on manager + store.
- `stopDebate(id?)` resolves entry (`id ?? activeSessionId`) and finalizes ONLY that entry.
- `destroy()` finalizes all entries.
- `resetDebateState` becomes per-entry: clears that entry's governor; does NOT `clearAll`
  global stores (would wipe other running debates). New session's live-store slot is empty
  anyway.

## Store changes (`activeDebateStore`)

Shape:

```ts
{
  sessions: Record<id, { session: DebateSession | null; governorState: GovernorState | null }>;
  activeSessionId: string | null;
  setSession(session): void;        // writes sessions[session.id], sets activeSessionId
  setGovernorState(state): void;    // writes sessions[activeSessionId].governorState
  setActiveSessionId(id): void;
  getSession(id): { session, governorState } | undefined;
  clearAll(): void;
  clearSession(id): void;
}
```

- `get session()` → `activeSessionId ? sessions[activeSessionId]?.session ?? null : null`.
- `IDebateSessionStore` (contract) gains `getSession(id)`, `setActiveSessionId(id)`,
  `clearSession(id)`; adapter in `debate-store-adapters.ts` updated.
- Consumers reading `useActiveDebateStore((s) => s.session)` keep working for the viewed
  session (ArgumentGraphPanel governorState, auto-debate `activeDebateStore.session`).
- `auto-debate-service.ts` and `DebatePanel` start paths call `setActiveSessionId(session.id)`
  so the viewed session is correct.

## Files touched

- `src/kernel/services/debate-runtime/debate-sync-manager.ts` (core refactor)
- `src/stores/activeDebateStore.ts`
- `src/kernel/contracts/debate-store.ts` (add `IDebateSessionStore` methods)
- `src/kernel/service-registration/debate-store-adapters.ts` (adapter)
- `src/kernel/services/debate-runtime/debate-sync-manager-multisession.test.ts` (NEW)
- `src/kernel/services/debate-runtime/auto-debate/auto-debate-service.ts` (set activeSessionId)
- `src/components/DebatePanel/DebatePanel.tsx` (set activeSessionId on start)

## Verification

- `npx tsc -p tsconfig.json --noEmit` clean.
- NEW `debate-sync-manager-multisession.test.ts` (--pool=threads): two debates run
  concurrently (both in `_entries`); starting a second does NOT cancel the first;
  `getActiveDebateSession` returns the viewed one; `setActiveSessionId` switches view;
  `stopDebate(id)` finalizes only that entry; `getRunCompletion` per-id; owner idempotency
  guard.
- `debate-sync-manager-b16.test.ts` still passes (owner guard semantics preserved).
- `activeDebateStore.test.ts` extended for keyed shape.
- Regression: `kernel/integration.test.ts`, `director-e2e.integration.test.tsx` (invocation
  debate path via `phase21-invocation.getRunCompletion`).

## Risks / notes

- This is a refactor of a 1086-line critical file; `finalizeInternal`/`_syncSessionImpl`/
  `startEngineWithFinalize`/`stopDebateInternal` must be parameterised by entry. High care
  required around the terminal-phase guards and memory-tracker calls (currently read
  `this.activeSession` / `this.runtimeSessionId` — must read the entry's).
- No new events, no schema change, no new dependencies. Manager remains the sole writer of
  debate lifecycle (D5 of invocation design preserved).
