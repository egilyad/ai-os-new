# 12 — Cognitive Stream UX Inside Debate

**Subsystem:** Debate (live UI + cognitive observability)
**Classification:** RESEARCH-ONLY / DESIGN (read-only analysis + opinionated UX proposal)
**Author:** opencode research pass
**Date:** 2026-08-15
**Methodology:** VERIFIED claims are cited to source. All UX proposals and component pseudocode are
explicitly marked `OPINION`. The foundational VERIFIED gap — _debate emits no `cognitive:*` events_ —
is established in docs `04` and `05` and restated here with citations.

---

## 1. Problem Statement (VERIFIED + INFERRED)

### 1.1 What the debate live UI shows today

The debate live store (`src/stores/debateLiveStore.ts`) subscribes to the debate runtime firehose and
maintains per-agent state. Confirmed `onSafe` subscriptions include:

- `DEBATE_AGENT_THINKING` → drives `currentThinking` map (block ~`debateLiveStore.ts:200-208`).
- `DEBATE_AGENT_RESPONDED` → appends a `DebateAgentEvent` (`status:'responded'`) and updates
  `streamingContent`/`emotions` (`debateLiveStore.ts:209-245`). `VERIFIED`.
- `DEBATE_AGENT_ERROR` → appends an error event (`debateLiveStore.ts:246-264+`). `VERIFIED`.
- Additional subscriptions for chunk/consensus/budget span through ~`:444`. `VERIFIED` (block extent).

So the live UI already renders **streaming text, thinking spinners, and error states** per agent.

### 1.2 What is missing (the gap)

- Debate emits **no `cognitive:*` event** (`debate-pipeline-builder.ts:192,383,430` emit only
  `debate:*`; confirmed in doc `04`). `VERIFIED`.
- Consequently the **reasoning trace** (step active → step completed → decision) that the topology
  trace UI (`topologyTraceStore.ts:29,51`) consumes is **absent for debate**. `VERIFIED` + `INFERRED`.
- The live UI shows _that_ an agent is thinking and _what_ it said, but **not _why_** it argued the
  way it did — no score rationale, no Bayesian belief movement, no "why this argument" (see doc `05`
  §4, §7). `INFERRED`.

**Therefore (OPINION framing grounded in VERIFIED gap):** to surface a "cognitive stream" inside
debate, we should **map existing debate events → a display-only cognitive model** in the UI layer.
No new backend engine, no new event contract, no change to the kernel event stream. The mapping is a
pure UI-side translation, exactly as doc `04` §7 recommends ("bridge for display only").

---

## 2. Proposed Unified Event Model (OPINION, display-only)

We introduce a **UI-side projection**, not a new bus. A small `useDebateCognitiveProjection` hook
(or a sub-slice of `debateLiveStore`) translates the already-subscribed debate events into a
`CognitiveStep` shape compatible with the topology trace renderer:

| Debate event (VERIFIED source)                                | → Projected CognitiveStep (OPINION shape)                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `DEBATE_AGENT_THINKING` (`debateLiveStore.ts:200`)            | `{ kind:'step:active', nodeId: agentId, traceId: sessionId }`                       |
| `DEBATE_AGENT_RESPONDED` (`debateLiveStore.ts:209`)           | `{ kind:'step:completed', nodeId: agentId, traceId: sessionId, output: content }`   |
| `DEBATE_AGENT_ERROR` (`debateLiveStore.ts:246`)               | `{ kind:'step:completed', nodeId: agentId, traceId: sessionId, error }`             |
| `DEBATE_VERDICT_GENERATED` (`debate-pipeline-builder.ts:430`) | `{ kind:'decision:made', nodeId:'verdict', traceId: sessionId, decision: verdict }` |

This deliberately reuses the **same field names** (`nodeId`, `traceId`) that
`topologyTraceStore.ts:29,51` already consumes, so the existing trace component can render debate
steps with **zero backend change**. `OPINION` (the projection itself); the field names are `VERIFIED`
from `topologyTraceStore.ts`.

> Note: we do **not** emit real `cognitive:*` events (that would require lifting the
> `event-recorder.ts:229-232` / `event-bridge.ts:27-34` exclusions — out of scope for a UX doc).
> The projection is internal to the React/store layer. `OPINION`.

---

## 3. Three UX Patterns

All three are `OPINION`. Each references the **existing `debateLiveStore` subscription block
(`debateLiveStore.ts:200-444`)** as the single integration point — we extend that block (or add a
collocated subscriber) to also build the projected `CognitiveStep` list.

### 3.1 Pattern A — Inline Reasoning Chips on each agent message

Attach a small chip row beneath each streamed agent message showing the projected step state and,
when available, the `overall` score from `debate:runtime:agent:scored` (`event-registry.ts:656`).

```
┌─────────────────────────────────────────────┐
│ 🤖 Agent-7  [thinking…]                      │
│ "The subsidy displaces private investment…"  │
│                                              │
│  [step:active]  [score 0.73]  [blind 0.81]   │  ← reasoning chips
└─────────────────────────────────────────────┘
```

Component sketch (OPINION / pseudocode):

```tsx
function ReasoningChips({ agentId, sessionId }: Props) {
  const step = useDebateCognitiveProjection(
    (s) => s.stepByAgent[`${sessionId}:${agentId}`],
  );
  const score = useDebateLiveStore((s) => s.scores[agentId]); // extended slice
  return (
    <div className="reasoning-chips">
      {step?.kind === 'step:active' && <Chip>step:active</Chip>}
      {score && <Chip>score {score.overall.toFixed(2)}</Chip>}
      {score?.blind != null && <Chip>blind {score.blind.toFixed(2)}</Chip>}
    </div>
  );
}
```

Integration: `debateLiveStore.ts:209` (responded) and `:200` (thinking) already fire; we add the
projection update in the same `set((s) => …)` reducer. `OPINION`.

### 3.2 Pattern B — Collapsible "Reasoning Trace" Sidebar

A right-hand sidebar that renders the full projected `CognitiveStep[]` timeline for the session,
reusing the topology trace renderer's data shape (`topologyTraceStore.ts:29,51` field names).

```
┌─────────────── Debate ──────────────┐ ┌─ Reasoning Trace ─┐
│  🤖 Agent-7  [thinking…]            │ │ ▸ step:active A7  │
│  "subsidy displaces…"               │ │ ▸ step:done   A7  │
│  🤖 Agent-3  [thinking…]            │ │ ▸ step:active A3  │
│  "only if marginal…"                │ │ ▸ step:done   A3  │
│                                     │ │ ▸ decision:verdict│
│  [Run] [Pause] [Verdict]            │ │   confidence 0.91 │
└─────────────────────────────────────┘ └───────────────────┘
        (toggle: [Reasoning ▸])             (collapsible)
```

Component sketch (OPINION / pseudocode):

```tsx
function ReasoningTraceSidebar({ sessionId, open, onClose }: Props) {
  const steps = useDebateCognitiveProjection(
    (s) => s.stepsBySession[sessionId],
  );
  if (!open) return null;
  return (
    <aside className="reasoning-trace">
      {steps.map((step) => (
        <TraceRow key={step.nodeId + step.id} step={step} />
      ))}
    </aside>
  );
}
```

Integration: subscribe to the projected steps, which the `debateLiveStore.ts:200-444` block already
feeds. `OPINION`.

### 3.3 Pattern C — Step-by-step "Why this argument" Expander

Per-agent expandable accordion that, on `DEBATE_VERDICT_GENERATED` (`debate-pipeline-builder.ts:430`)
and per-score events, reveals the `verdict.reasoning` blob (`reasoning` field set at
`debate-pipeline-builder.ts:423`) plus any score rationale we choose to surface (doc `05` §9
recommends emitting a `rationale` on `debate:runtime:agent:scored`).

```
┌─────────────────────────────────────────────┐
│ 🤖 Agent-7                                    │
│ "subsidy displaces private investment…"       │
│ [▸ Why this argument]                          │
│   ── expanded ──                               │
│   score: 0.73  (rebuttals: 2, confidence 0.6) │
│   verdict reasoning: "Both sides converged…"  │
└─────────────────────────────────────────────┘
```

Component sketch (OPINION / pseudocode):

```tsx
function WhyExpander({ agentId, sessionId }: Props) {
  const [open, setOpen] = useState(false);
  const score = useDebateLiveStore((s) => s.scores[agentId]);
  const verdict = useDebateLiveStore((s) => s.verdictBySession[sessionId]);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)}>Why this argument</button>
      {open && (
        <div className="why">
          {score && (
            <p>
              score {score.overall} — {score.rationale ?? 'n/a'}
            </p>
          )}
          {verdict && <p>{verdict.reasoning}</p>}
        </div>
      )}
    </div>
  );
}
```

> Caveat (VERIFIED from doc `05`): today `scoreArguments` returns only a number
> (`debate-evaluator.ts:67`), so `score.rationale` will be `undefined` until the doc `05` §9
> recommendation (emit a `rationale` on `debate:runtime:agent:scored`) is implemented. The expander
> degrades gracefully to the `verdict.reasoning` blob, which _is_ already available
> (`debate-pipeline-builder.ts:423`). `OPINION` + `VERIFIED`.

---

## 4. Integration Point Detail (VERIFIED anchor)

The single, safest integration point is the **existing `debateLiveStore` subscription block
(`debateLiveStore.ts:200-444`)**, where `onSafe` handlers for `DEBATE_AGENT_THINKING` / `RESPONDED` /
`ERROR` / `CHUNK` already mutate the store. We extend those reducers to also append to a
`cognitiveSteps` array (the projected model from §2). This:

- Reuses the one place debate events already flow into UI state. `VERIFIED`.
- Requires **no new `eventBus` subscription** and **no kernel change**. `OPINION`.
- Keeps the cognitive projection purely client-side, sidestepping the
  `event-recorder.ts:229-232` / `event-bridge.ts:27-34` exclusions entirely. `OPINION`.

---

## 5. Risks & Trade-offs (OPINION)

1. **Projection drift** — if debate event shapes change, the UI-side mapping must change too. Mitigated
   by centralizing the mapping in one hook (`useDebateCognitiveProjection`).
2. **No causal-debugger visibility** — because this is display-only, debate reasoning still will not
   appear in replay/causal debugger (see doc `04` §5.2). If that is required, the doc `04` §7 bridge
   (real `cognitive:*` emit + recorder exclusion lift) is the heavier alternative.
3. **Score rationale unavailable today** — Pattern C's per-score "why" needs the doc `05` §9 change.
   Until then, only the final `verdict.reasoning` is shown.

---

## 6. Recommendation Summary (OPINION)

Adopt **Pattern B (collapsible sidebar)** as the primary surface because it reuses the topology trace
data shape most directly and is opt-in (does not clutter the main debate view). Layer **Pattern A
(chips)** for at-a-glance state and **Pattern C (expander)** for deep-dive once score rationale is
emitted. All three are pure UI over the existing `debateLiveStore` subscription block — no backend
engine, no new event contract, consistent with the "bridge existing events, don't build new engines"
constraint from docs `04`/`05`.

---

## 7. Citations

| Claim                                                    | Citation                                                     | Label    |
| -------------------------------------------------------- | ------------------------------------------------------------ | -------- |
| Debate live store subscribes to thinking/responded/error | `debateLiveStore.ts:200-264` (block to ~`:444`)              | VERIFIED |
| Debate emits no cognitive events                         | `debate-pipeline-builder.ts:192,383,430`; doc `04`           | VERIFIED |
| Topology trace field names `nodeId`/`traceId`            | `topologyTraceStore.ts:29,51`                                | VERIFIED |
| Verdict carries `reasoning`                              | `debate-pipeline-builder.ts:423`                             | VERIFIED |
| Score is numeric only (no rationale)                     | `debate-evaluator.ts:67`                                     | VERIFIED |
| `debate:runtime:agent:scored` exists                     | `event-registry.ts:656`                                      | VERIFIED |
| Cognitive events excluded from recorder/bridge           | `event-recorder.ts:229-232,258-261`; `event-bridge.ts:27-34` | VERIFIED |
| Projection model / 3 patterns / component code           | this document §2-§3                                          | OPINION  |
