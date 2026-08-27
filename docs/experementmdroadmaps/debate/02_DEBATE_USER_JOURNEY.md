# Debate Subsystem — End-to-End User Journeys

> Research-only. No source modified. Citations use `file:line` + **VERIFIED / INFERRED / OPINION**.

---

## 0. Personas

| Persona        | Goal                                                               | Primary UI                                                                 |
| -------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Researcher** | Run a structured debate on a claim, get a verdict + evidence trail | `DebatePanel` wizard → `DebateArena` runtime → `DebateAnalysisPanel`       |
| **Moderator**  | Watch live, inject messages, adjust agents                         | `DebateRuntimePanel/AgentControlPanel` (`AgentControlPanel.tsx`)           |
| **Analyst**    | Post-hoc analysis, quality metrics, graphs                         | `DebateAnalysisPanel.tsx`, `ArgumentGraphPanel/`, `DebateQualityPanel.tsx` |
| **Builder**    | Compose strategies, tournaments                                    | `DebateStrategyBuilder.tsx`, `TournamentPanel.tsx`                         |

> OPINION: Personas are inferred from the component inventory; there is no explicit persona model in code. The "Builder" persona currently has a **non-functional** deploy path (see Journey 1 / §Mismatch #2 in `01_DEBATE_SYSTEM_MAP.md`).

---

## 1. Journey 1 — Create a Debate via the Wizard

**Entry:** `DebateArena.tsx` defaults to classic mode (`mode='classic'`, `DebateArena.tsx:14-15`) → renders `<DebatePanel />` (`:100`).

**Steps (all VERIFIED by component glob + Grep):**

1. **Topic** — `TopicStep.tsx` collects the debate subject. Wizard shell: `DebateSetupWizard.tsx`.
2. **Agents** — `AgentsStep.tsx` selects participants; `HistoricalFiguresPicker.tsx` optional; `AgentEditor.tsx` edits roles.
3. **Strategy** — `StrategySelector.tsx` offers the `DebateStrategy` string-union (runtime enum; see `01_DEBATE_SYSTEM_MAP.md §2`). Note: this is the **bare string-union**, not the DSL.
4. **Review** — `ReviewStep.tsx` summarizes.
5. **Launch** — `DebatePanel.handleStart` (`DebatePanel.tsx:221`) gathers topic + selected agents and calls `debateService` start (facade `startDebate`, `debate-sync-manager.ts:199`).
6. **Runtime hand-off** — facade emits `DEBATE_STARTED` (`debate-sync-manager.ts:393`) and the pipeline builder emits `DEBATE_SESSION_STARTED` (`debate-pipeline-builder.ts:90`). The active session is pushed into the Zustand `activeDebateStore` (`debate-sync-manager.ts:173,738,873`).

**Friction points on this journey (VERIFIED):**

- The strategy chosen here is a plain string; any sophisticated DSL strategy built in `DebateStrategyBuilder` is **not** selectable here (mismatch #2: deploy is a no-op; §Mismatch table in `01_DEBATE_SYSTEM_MAP.md`).
- Sliders in the runtime AgentControlPanel mutate the global agent registry, so pre-wizard agent tuning leaks across debates (mismatch #4).

**ASCII — happy path (create → live → verdict):**

```
[TopicStep] → [AgentsStep] → [StrategySelector] → [ReviewStep]
      │                                                        │
      └──────────────────┐                       ┌─────────────┘
                         ▼                       ▼
                   DebatePanel.handleStart (:221)
                         │
                         ▼
              debateService.startDebate (sync-manager :199)
                         │
            ┌────────────┴─────────────┐
            ▼                          ▼
   DEBATE_STARTED (:393)      DEBATE_SESSION_STARTED (:90)
            │                          │
            ▼                          ▼
   activeDebateStore set         DebatePipelineBuilder runs rounds
   (:173/:738/:873)              → thinking/responded events
                                     │
                                     ▼
                          DEBATE_VERDICT_GENERATED (:637)
                          DEBATE_CONSENSUS (:1012) [if converged]
                                     │
                                     ▼
                          DebateVerdictPanel / DebateAnalysisPanel
```

---

## 2. Journey 2 — Watch Live

**Entry:** `?mode=runtime` → `DebateArena.tsx:21` selects `'runtime'` → renders `<DebateRuntimePanel />` (`:100`).

**Live state source:** `useDebateLiveStore` (`src/stores/debateLiveStore.ts:153`), a Zustand store that subscribes to EventBus via `onSafe` (full map in `03_DEBATE_LIVE_AUDIT.md`).

**Steps (VERIFIED):**

1. Pipeline builder emits `DEBATE_AGENT_THINKING` (`debate-pipeline-builder.ts:192`) → live store marks agent "thinking".
2. `DEBATE_AGENT_RESPONDED` (`:221`) → appended to `agentEvents` (capped `MAX_AGENT_EVENTS`, `debateLiveStore.ts:201,237`).
3. `DEBATE_ROUND_STARTED`/`ENDED` (`:181`,`:246`) → `roundEvents`.
4. Moderator can **inject** a message or adjust agents via `AgentControlPanel.tsx` (temperature/maxTokens at `:110`,`:115` → `agentService.updateAgent`).
5. Consensus: `DEBATE_CONSENSUS_REACHED` (`debate-pipeline-builder.ts:383`) → store `consensus` flag (`debateLiveStore.ts:395-404`).

**Friction (VERIFIED):** Temperature/MaxTokens changes in `AgentControlPanel` write to the global agent registry (`agentService.updateAgent`, `:110/:115`), **not** the running session. The moderator believes they are tuning the live agent but they are editing the persistent agent definition (mismatch #4).

---

## 3. Journey 3 — Replay (BROKEN PATH)

**Intended:** User clicks "Replay" on a finished debate to scrub through its timeline via `DebateReplayPanel.tsx` (real replay UI: `TimelinePlayer`, `DebateReplaySidebar`, `DebateReplayControls`, `DebateReplayTimeline`, `DebateReplayLiveControls` — `DebateReplayPanel.tsx:7-12,209-319`).

**Actual (VERIFIED broken):** In the classic `DebatePanel`, the "Replay" button is bound to `handleReplay` (`DebatePanel.tsx:328-338`):

```ts
const handleReplay = () => {
    const s = lastSessionRef.current || session;
    if (!s) return;
    setTopic(s.topic);
    const agentIds = (s.participants ?? [])...;   // rebuild participant list
    setSelectedAgents(agentIds);
    queueMicrotask(() => handleStart());           // ← starts a NEW debate
};
```

`handleReplay` resets topic/agents and calls `handleStart()` — i.e., it **launches a brand-new debate**, not a replay. The genuine replay UI (`DebateReplayPanel.tsx`) is a separate, disconnected panel that the Replay button never navigates to.

**ASCII — broken replay path:**

```
DebatePanel "Replay" button (:328)
        │
        ▼
handleReplay (:328) ──setTopic/ setSelectedAgents──┐
        │                                            │
        │  queueMicrotask(() => handleStart())  (:337)
        ▼                                            ▼
   handleStart (:221)  ───────────────►  NEW debate starts (fresh LLM calls)
        ✗  DebateReplayPanel.tsx NEVER reached

Correct path (not wired):
   DebateReplayPanel.tsx  →  select finished session  →  TimelinePlayer scrub
```

> OPINION: The fix is a one-line navigation — the Replay button should route to `/replay?session=<id>` (or mount `DebateReplayPanel` with the selected session id) instead of calling `handleStart`.

---

## 4. Journey 4 — Analyze Results

**Components (VERIFIED to exist):** `DebateAnalysisPanel.tsx`, `ArgumentGraphPanel/`, `DebateQualityPanel.tsx`, `DebateAnalytics.tsx`, `DebateVerdictPanel.tsx`, `CausalAnalysisSection.tsx`, `GraphMetricsSection.tsx`, `QualityMetricsSection.tsx`.

**Session picker (CORRECTION of provided evidence):** `DebateAnalysisPanel.tsx:144-163` — the `<select value={sessionId} onChange={(e)=>setSessionId(e.target.value)}>` (`:144-146`) **is wired**. A `useEffect` keyed on `sessionId` (`:29-62`) resolves the session from `sessionManager.getDebateHistory()` (`:48`) and builds an analysis object. So the picker is functional, contrary to the supplied "inert" claim.

**Flow:**

1. User picks a session → `setSessionId` (`:146`).
2. `useEffect` loads session + arguments → `setAnalysis` (`:18`,`:39-62`).
3. `DebateVerdictPanel` renders the `DEBATE_VERDICT_GENERATED` payload; `ArgumentGraphPanel` renders the claim graph; `DebateQualityPanel` shows quality-technique impact (`DEBATE_QUALITY_IMPACT_COMPUTED`, `event-registry.ts:1219`).

**Friction (INFERRED):** Because `saveSnapshot`/`restoreSession` have no UI (see `01_DEBATE_SYSTEM_MAP.md §9`), a user cannot explicitly "open a past session state" — analysis depends on `sessionManager.getDebateHistory()`, which may not contain rich snapshot data for every debate.

---

## 5. Journey 5 — Integrate to Forum / Crystal

**Outbound bridges (per AGENTS.md roadmap, INFERRED from cited integration points):**

- **Forum:** `forum-service` event bridge maps `debate:verdict:generated` → forum case study, and `forum:topic:escalated-to-debate` reverses it. The user journey: from `DebateVerdictPanel` a "Publish to Forum" action (INFERRED; UI wiring not verified in this pass) emits `DEBATE_VERDICT_GENERATED` which the forum bridge consumes.
- **Crystal Vault:** `crystal-debate-bridge` auto-proposes a crystal from a debate verdict. Journey: verdict → `crystalVault.propose` (roadmap B2/B3-era). UI entry not verified; **INFERRED** to be a verdict-panel action.
- **Invocation Engine:** `phase21-invocation.ts` hands `mode:'debate'` invocations to `debateService` (AGENTS.md Step 5). A user in the Room panel can invoke a debate agent; that resolves to a debate session.

**Friction (OPINION):** These integration hand-offs are event-driven and largely invisible to the end user. There is no consolidated "export debate to Forum/Crystal" button surfaced in `DebatePanel` that the research confirmed — integration is implicit via event bridges rather than explicit UI affordances.

---

## 6. Cross-Journey Friction Summary (VERIFIED)

| Journey       | Pain point                                      | Evidence                            |
| ------------- | ----------------------------------------------- | ----------------------------------- |
| 1 (create)    | DSL strategy cannot reach runtime; deploy no-op | `DebateStrategyBuilder.tsx:145-157` |
| 2 (live)      | Agent sliders edit global registry, not session | `AgentControlPanel.tsx:110,115`     |
| 3 (replay)    | "Replay" restarts a new debate                  | `DebatePanel.tsx:328-338`           |
| 4 (analyze)   | Picker works (corrected) — no defect            | `DebateAnalysisPanel.tsx:144-163`   |
| 5 (integrate) | No explicit export UI; event-only               | INFERRED from AGENTS.md bridges     |

---

_Confidence legend: VERIFIED = confirmed by Read/Grep this session; INFERRED = deduced; OPINION = recommendation._
