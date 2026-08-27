# 12_FUTURE_AGENT_CONCEPT — `agent-doc-architect` evolution

> A forward-looking concept for what this agent _could_ become. **OPINION/INFERRED** unless anchored to verified infra.

## Concept: "Living Documentation Architect"

Today doc-architect is a stateless persona node. The target concept upgrades it from **reactive ghost** to **proactive documentation steward** that maintains a living map of the system's information architecture.

### Anchors in existing infra (VERIFIED)

- `knowledge:crystal:formed` event exists (`event-registry.ts`, Crystal module) → trigger source.
- `forum:topic:*` events exist → cross-post doc decisions.
- `ConversationDirectorService` + scenarios → orchestrate multi-turn doc workflows.
- `documents` store (proposed O6) → persistence layer.
- `agent-doc-auditor`/`simplifier`/`historian`/`checker` → the coordinated doc cluster (O5).

### Proposed behavior

1. **Listen** to `knowledge:crystal:formed` and code-change events.
2. **Propose** an update to the documentation map / taxonomy (its "Taxonomy" specialization made concrete as a persisted entity keyed by `agent-doc-architect`).
3. **Coordinate** the doc cluster: architect drafts structure → auditor validates against code → simplifier clarifies → historian adds rationale → checker verifies.
4. **Persist** to the `documents` store with versioning; emit `document:updated`.
5. **Surface** in Forum as an announcement (reuse `forum:topic:escalated-to-debate`-style bridge) and in RoomPanel as a suggested invocation.

### Sample user flow (INFERRED)

> A user opens RoomPanel, types "Map the Invocation Engine's information architecture", picks Bianca (auto-suggested via O3), clicks Invoke. Bianca (with O1 tools) reads the source, produces a taxonomy + doc map persisted to the `documents` store, the live `conversation:*` feed shows her structuring work, and `agent-doc-auditor` is auto-queued to validate. "Open Session" jumps to the Director view; the doc map is versioned and linkable from Crystal/Forum.

### What would NOT change

- Node id `agent-doc-architect`, avatar 🏛️, base role, provider/model remain. Evolution is additive (tools, lenses, store, events, policies) — consistent with the project's "contracts at boundaries / additive schema versions" rule (`AGENTS.md`).

### Risks (OPINION)

- **Human authority (D6):** doc rewrites must remain human-approved; the agent proposes, never auto-publishes to shipped docs.
- **Cost:** 70B model on every code change is expensive; gate via the expertise-match policy + cost controls (mirror `knowledge-generator` `maxTokensPerJob`/`maxConcurrentJobs`).
- **Grounding quality:** without O1 tools the "living" map is fiction; O1 is a prerequisite, not optional.
