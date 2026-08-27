# 08 — Data Flow

## Concept Layer

Data flows through a **pipeline** that transforms unstructured input into structured, interpreted output. Each stage is a distinct processing layer with its own responsibility. The pipeline is sequential and deterministic — no stage proceeds until the previous stage completes.

## System Mapping Layer

### End-to-End Pipeline

```
User Input (topic + participants + config)
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  STAGE 1: Session Creation                                   │
│  startDebate(topic, participants, strategy, rounds, config)  │
│  → Validate (≥2 participants)                                │
│  → Reset governor, circuit breakers, provider maps           │
│  → Create DebateSession (ID, status, config)                 │
│  → emit('debate:started')                                    │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  STAGE 2: Opening Statements                                 │
│  executeOpeningStatements()                                  │
│  → for each participant (sequential):                        │
│     → buildOpeningPrompt(role + archetype + constraint       │
│       + temperature + strategy)                              │
│     → callLLM() → {content, provider, model}                 │
│       → provider resolution (4 tiers)                        │
│     → calculateConfidence(content)                           │
│     → Push DebateArgument(round=0)                           │
│  → emit('debate:updated')                                    │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  STAGE 3: Round Loop (iterative)                             │
│  startDebateLoop() → scheduleNextRound() →                   │
│  → getNextParticipant()  [strategy dispatch]                 │
│  → executeArgumentRound(participant):                        │
│     → buildArgumentPrompt(role + constraint + tree context   │
│       + debate state + temperature)                          │
│     → callLLM()                                              │
│     → Extract [parent:id] (argument tree)                    │
│     → Resolve parent (4-tier fallback)                       │
│     → calculateConfidence()                                  │
│     → Push DebateArgument                                   │
│  → POST-ARG:                                                 │
│     → updateConvergenceScore() (Jaccard, smoothed)           │
│     → feedGovernor():                                        │
│        → ingestArgument → extractClaims → addToGraph         │
│        → updateContradictions → detectContradictions         │
│        → computeConvergence → computeNovelty                 │
│        → updateDiversity                                     │
│  → CHECK STOP CONDITIONS:                                    │
│     → governor.shouldStop()?                                 │
│       → generateSynthesis() → emit(consensus) → STOP         │
│     → legacy: hasNovelClaims? plateau? convergence>85?       │
│       → generateConsensus() → emit(consensus) → STOP         │
│     → maxRounds reached? → generateConsensus() → STOP        │
│  → Advance round if all participants spoke                   │
│  → emit('debate:argument') + emit('debate:updated')          │
│  → scheduleNextRound()                                       │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  STAGE 4: Stop & Compute                                     │
│  stopDebate()                                                │
│  → status = 'completed'                                      │
│  → computeGraphMetrics() → session.graphMetrics              │
│  → computeActivityMetrics() → session.activityMetrics        │
│  → computeQualityMetrics() → session.qualityMetrics         │
│  → interpreter.interpret(session) → session.interpretation   │
│  → saveToHistory()                                           │
│  → emit('debate:updated')                                    │
└──────────────────────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────────────────────┐
│  STAGE 5: UI Render                                          │
│  DebatePanel receives 'debate:updated'                       │
│  → Refresh analytics sidebar (8 conditional panels)          │
│  → Show metrics, interpretation, activity, timeline          │
└──────────────────────────────────────────────────────────────┘
```

### Event Flow

```
DEBATE SERVICE                    EVENT BUS                    UI
─────────────                    ─────────                    ──
startDebate() ──→ debate:started ──→ setSession()
               ──→ debate:updated ──→ refreshAll()
executeArgumentRound()
               ──→ debate:argument ──→ appendArg()
               ──→ debate:updated ──→ refreshAll()
stopDebate()   ──→ debate:consensus ──→ showConsensus()
               ──→ debate:updated ──→ refreshAll()

GOVERNOR                         EVENT BUS                    UI
───────                          ─────────                    ──
generateSynthesis()
               ──→ debate:consensus ──→ showConsensus + stop
```

### Provider Resolution (callLLM)

```
Attempt 1: participant.provider + participant.modelId
  → getAdapter(provider) → sendMessage()
  → success? → return
  → fail? → mark provider failed → Attempt 2

Attempt 2: same provider, different key
  → getActiveKeys().filter(k => k.provider === participant.provider)
  → success? → return
  → fail? → Attempt 3+

Attempt 3+: cross-provider fallback
  → routerService.getDebateProviders(participantCount)
  → filter out failedProviders
  → try each until one succeeds

If all fail → emit fallback DebateArgument(source='fallback')
```

## Behavior Layer

- The pipeline is **sequential per argument** — each argument is processed completely (LLM call, confidence, governor feed, stop check) before the next begins
- Provider resolution is **lazy and cached** — the first successful provider for a participant is cached in `participantProviderMap`
- Governor and legacy stop conditions are **checked redundantly** — if governor is available, its conditions run first; legacy conditions are a fallback path
- Metrics and interpretation are **computed only once** — at debate stop — not incrementally
- The UI reacts to events, not to direct calls — the service never references UI code
