# 09 — Design Principles

## Concept Layer

The system is governed by a set of architectural principles that constrain how features are built and how components interact. These principles exist because the domain (multi-agent LLM reasoning) is inherently unreliable — LLMs produce unstructured, non-reproducible output, and the architecture must compensate for that.

## Principles

### 1. No Single Source of Truth in LLM Output

LLM output is never trusted as the sole source of truth for any structural decision. All LLM-produced text is parsed, validated, and augmented with fallback logic:

- `[parent:xxx]` tags in arguments have a 4-tier resolution fallback (explicit → fallback_latest → orphan → invalid_reference)
- Confidence is computed heuristically from text features, not from the LLM
- Constraint compliance is scored via regex/pattern matching, not LLM judgement
- The interpreter does not use LLM at all — all findings are structural

### 2. Everything Is Measurable

Every debate produces quantitative metrics. There is no feature that produces unstructured output without corresponding measurements:

- Arguments → graph metrics (depth, branching, orphan rate)
- Agents → activity metrics (count, confidence, responses)
- Content → quality metrics (depth, originality, usefulness)
- Claims → convergence score, contradiction density

### 3. Fallback Always Exists

Every operation that can fail has a fallback:

- LLM calls: 4-tier provider fallback (same key → same provider → cross-provider → fallback argument)
- Parent resolution: 4-tier (explicit → recent → orphan → invalid)
- Provider routing: round-robin across active keys per provider
- Model resolution: provider-specific defaults when `modelId` is undefined
- Consensus: fallback to text synthesis if governor path fails

### 4. Structure > Text Reliability

Structured data is preferred over raw text for all decision-making:

- `DebateArgument` is a typed object, not a string
- Claims graph is a DAG with typed edges (supports/challenges/refines)
- `ParentResolution` is an enum, not a free-text field
- Metrics are numeric, not descriptive
- Events have typed payloads validated by Zod schemas

### 5. Interpretation Is Separate from Generation

The generation layer produces text. The interpretation layer reads structured data. They never mix:

- `DebateService` generates arguments via `callLLM()`
- `DebateInterpreter` reads the argument array and claim graph — no LLM calls
- The interpreter cannot introduce new claims or hallucinate reasoning
- This separation ensures interpretation is deterministic and reproducible

### 6. Mutations Are Atomic with Eventual Consistency

The system uses the Transaction Boundary pattern:

- All mutation methods accept optional `tx?: ITransaction`
- With tx: persistence and event emission are deferred to commit time
- Without tx: immediate emit and persist
- Rollback drops all pending operations
- This enables atomic multi-mutation (e.g., `setSLAMode` + `setBaseWeights` in one transaction)

### 7. Kernel Never Depends on UI

The dependency direction is strictly one-way: UI → Application → Kernel → Infrastructure. Kernel code imports nothing from React, the DOM, or any UI library. All communication from kernel to UI goes through the EventBus.

### 8. State Is Immutable from Consumer Perspective

`getState()` returns `deepFreeze(structuredClone(state))` — consumers cannot mutate kernel state. All mutations go through explicit methods (`setSLAMode`, `setBaseWeights`, etc.).
