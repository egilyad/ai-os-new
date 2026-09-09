# 21_ARCHITECTURAL_RISKS.md

## Architectural Risks

### 1. High (Systemic) - Duplicated State and Coupling

- **Issue**: The Forum system appears to have logic that overlaps with the Debate and Knowledge subsystems (`phase18-forum.ts`).
- **Risk**: Changes to Debate or Crystal structures may silently break Forum integrations due to tight coupling in bridge services.
- **Impact**: High - Broken features that are hard to trace.

### 2. High - Realtime Scalability Bottleneck

- **Issue**: The lack of a realtime subscription model forces high-frequency polling on a `Dexie` database.
- **Risk**: As forum usage scales, the `listPosts` and `listTopics` operations will become increasingly expensive, leading to UI hangs or OOM issues on the client side.
- **Impact**: High - Poor performance, stale UI, potential UI crashes.

### 3. Medium - Cognitive Invisibility

- **Issue**: Important metadata such as `agentProvenance` (`forum-service.ts:121`) is hidden from the user.
- **Risk**: Users cannot effectively audit agent behavior or cost within the forum context, undermining trust and system visibility.
- **Impact**: Medium - Degraded trust, difficulty in debugging agent behavior.

### 4. Low - Searchability/Indexability

- **Issue**: The current forum lacks structured search or indexing beyond basic category/tag filtering (`forum-service.ts:209`).
- **Risk**: Knowledge discovery within the forum will fail as the volume of topics grows.
- **Impact**: Medium - Knowledge fragmentation.

### 5. Medium - Escalation Dead-end

- **Issue**: Consensus detection suggests escalation to debate (`forum-service.ts:302`), but no actual mechanism for this escalation exists in the system wiring.
- **Risk**: User expectations of a workflow-based knowledge formation process are undermined.
- **Impact**: Medium - Feature gaps, workflow friction.
