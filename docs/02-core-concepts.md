# 02 — Core Concepts

## 2.1 Agents

### Concept Layer

An **agent** in SuperAgents OS is not a persistent entity with memory and identity. It is a **participant slot** in a debate — a role (pro/con/neutral/Socrates) with a system prompt, optional provider binding, optional constraint, and optional archetype. Agents are stateless between debates; their "personality" comes from the prompt, not from persistent state.

### System Mapping Layer

```
DebateParticipant {
  id: string;
  name: string;
  role: 'pro' | 'con' | 'neutral';
  systemPrompt?: string;     // Override default
  provider?: string;          // Preferred provider (e.g. "groq")
  modelId?: string;           // Preferred model
  constraint?: DebateConstraint;
}
```

The 25 default agents come from `topology-defaults.ts`:

| Category              | Agents                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Technical (6)**     | System Architect, Security Engineer, DevOps Engineer, Database Engineer, Network Engineer, Performance Engineer |
| **Analytical (5)**    | Critical Auditor, Data Scientist, Risk Analyst, Research Analyst, Quality Engineer                              |
| **Creative (4)**      | Creative Visionary, Product Designer, Content Strategist, UX Researcher                                         |
| **Management (3)**    | Project Manager, Product Owner, Team Lead                                                                       |
| **Specialized (2)**   | Technical Writer, Ethics Officer                                                                                |
| **Documentation (5)** | Architect Agent, Auditor Agent, Simplifier Agent, Historian Agent, Consistency Checker                          |

### Behavior Layer

- Agents fire in strategy-defined order, not all at once
- Each agent gets a prompt built from: role context + archetype block + constraint block + temperature tone + debate state context
- An agent that fails (provider error, timeout) is retried up to 3 times across different providers
- After speaking, the agent's argument is scored for confidence, fed to the governor for claim extraction, and checked for parent references (argument tree)

## 2.2 Debate

### Concept Layer

A **debate** is a structured multi-turn conversation between agents on a given topic. The system enforces turn order, tracks arguments, measures convergence, and produces a consensus when stopped. Debates have a lifecycle: setup → opening statements → rounds → completion.

### System Mapping Layer

```
DebateSession {
  id: string;
  topic: string;
  status: 'active' | 'paused' | 'completed';
  strategy: DebateStrategy;
  maxRounds: number;
  currentRound: number;
  participants: DebateParticipant[];
  arguments: DebateArgument[];
  convergenceScore: number;      // 0-100
  config: DebateConfig;
  consensus?: string;
  graphMetrics?: DebateGraphMetrics;
  interpretation?: DebateInterpretation;
  activityMetrics?: ActivityMetrics;
  qualityMetrics?: QualityMetrics;
}
```

**13 strategies (33 built-in presets)** (`DebateStrategy`):

| Strategy        | Behavior                               | Use Case                             |
| --------------- | -------------------------------------- | ------------------------------------ |
| `round_robin`   | Fixed modulo order                     | Balanced, predictable debates        |
| `moderated`     | LLM picks next speaker                 | Dynamic, adaptive turn-taking        |
| `free_for_all`  | Random ≠ last speaker                  | Unpredictable, chaotic exploration   |
| `socratic`      | Socrates ↔ respondent Q&A              | Logical drilling, hidden assumptions |
| `argument_tree` | Hierarchical `[parent:id]` references  | Structured argument mapping          |
| `constrained`   | Round-robin with per-agent constraints | Controlled reasoning experiments     |

### Behavior Layer

1. **Opening statements**: All participants speak once (round 0) in sequence
2. **Round loop**: `getNextParticipant()` dispatches by strategy → `executeArgumentRound()` builds prompt, calls LLM, extracts structure, feeds governor
3. **Round advancement**: After all participants have spoken in the current round, `currentRound` increments
4. **Stop conditions** (checked after each argument): governor says stop, no novel claims, convergence plateau (3 rounds >80 Jaccard, range <10), convergence >85, max rounds reached
5. **Completion**: Metrics computed, interpreter runs, consensus generated, session persisted

## 2.3 Claims Graph

### Concept Layer

The **claims graph** is the structured representation of all factual assertions made during a debate. It is not the same as the argument feed — it is a DAG of extracted claims with edges representing support, challenge, or refinement relationships. The claims graph is maintained by `DebateGovernor` and used to detect contradictions, measure convergence, and determine when to stop.

### System Mapping Layer

```
Claim {
  id: string;
  text: string;
  sourceArgumentId: string;
  speaker: string;
  role: string;          // pro/con/neutral
  round: number;
  status: 'active' | 'challenged' | 'resolved' | 'disputed';
  supportCount: number;
  challengeCount: number;
  createdAt: number;
}

ClaimEdge {
  from: ClaimId;
  to: ClaimId;
  type: 'supports' | 'challenges' | 'refines';
  weight: number;
}

ClaimGraph {
  claims: Record<string, Claim>;
  edges: ClaimEdge[];
}
```

Managed by `src/kernel/services/debate-governor/`:

- `claim-extractor.ts` — parses an argument text into claim objects
- `claim-graph.ts` — insert claims, query by speaker/status, detect cross-edges
- `contradiction-detector.ts` — pairwise semantic overlap detection with configurable threshold

### Behavior Layer

- Every time an argument is added, `DebateGovernor.ingestArgument()` is called
- Claims are extracted, added to the graph, and existing claims are checked for contradictions
- Convergence score is computed as cross-speaker Jaccard overlap of claims (30% new, 70% smoothed)
- Novelty score tracks whether new claims are genuinely new vs. rephrased old ones
- Stop decision uses: `hasNoNovelClaims() || isConvergencePlateau() || allCriticalContradictionsResolved()`
