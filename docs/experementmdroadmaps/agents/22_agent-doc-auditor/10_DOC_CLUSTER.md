# 10_DOC_CLUSTER — Documentation Agent Cluster Relations

**VERIFIED.** The workforce contains exactly **5 documentation agents** (the "Documentation (5)" group, `topology-defaults.ts:395`):

| Node id                | Label               | baseRole                 | Provider   | Model                                          |
| ---------------------- | ------------------- | ------------------------ | ---------- | ---------------------------------------------- |
| `agent-doc-architect`  | Architect Agent     | Documentation Architect  | openrouter | `openrouter/meta-llama/llama-3.3-70b-instruct` |
| `agent-doc-auditor`    | Auditor Agent       | Documentation Auditor    | nvidia     | `meta/llama-3.3-70b-instruct`                  |
| `agent-doc-simplifier` | Simplifier Agent    | Documentation Simplifier | groq       | `llama-3.1-8b-instant`                         |
| `agent-doc-historian`  | Historian Agent     | Documentation Historian  | openrouter | `openrouter/meta-llama/llama-3.3-70b-instruct` |
| `agent-doc-checker`    | Consistency Checker | Consistency Checker      | (profile)  | (profile)                                      |

(Profiles at `agent-profiles.ts:222-272`; nodes at `topology-defaults.ts:396-455`.)

## Topology relations — NONE between doc agents

**VERIFIED.** Each doc agent is independently wired:

- Inbound: `e-router-doc-architect/auditor/simplifier/historian/checker` (router → agent, `:487-516`).
- Outbound: `e-doc-*-agg` (agent → aggregator, `:539-568`).
- **There are zero edges between any two doc agents.** Doc-auditor is not downstream of doc-architect, nor upstream of doc-checker, in the graph.

## Functional affinity (not topological)

- **doc-architect** ("describe system structure precisely, mapping code to architectural concepts… never invent features") produces structure.
- **doc-auditor** ("find errors, inconsistencies, contradictions… cross-check every claim against actual code… authority to reject") judges it.
- **doc-checker** ("run the ConsistencyChecker service… compare every documented file path, type, interface, event, method against the actual code manifest… flag each unresolved reference") is the _tool-backed_ counterpart — it calls `ConsistencyChecker` (`consistency-checker.ts:334`, registered `phase6-high-level.ts:207`).
- **doc-simplifier** ("make complex descriptions accessible without changing meaning") and **doc-historian** ("narrative context for architectural decisions") are complementary transforms.
- **INFERRED:** architect→auditor→checker is a natural _pipeline_ (write → review → mechanically verify), but it is **not declared anywhere in code** — it can only exist if a Debate/Conversation/Director/Invocation orchestration builds those turns in that order. No such hardcoded pipeline references these ids together.

## Distinction: auditor vs checker

**VERIFIED.** `doc-checker` is explicitly bound to the `ConsistencyChecker` service (`topology-defaults.ts:450` prompt + `consistencyChecker` lazyService `instances/services-extras.ts:84`). `doc-auditor` has **no tool/service binding** (`tools: []`, `00_PROFILE.md`) — its checking is prompt-driven LLM judgment, not the code-manifest diff that `doc-checker` runs.

## OPINION

The 5 doc agents are a _family by convention_, not by wiring. This is a missed opportunity: a real documentation QA flow (architect→auditor→checker→simplifier) would benefit from an explicit Director scenario or topology pipeline, which currently does not exist.
