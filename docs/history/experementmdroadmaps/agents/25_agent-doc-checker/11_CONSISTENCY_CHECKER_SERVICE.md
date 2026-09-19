# 11_CONSISTENCY_CHECKER_SERVICE — Relationship to `ConsistencyChecker`

**Status:** VERIFIED (service exists) + IMPORTANT NUANCE (not programmatically wired to the agent).

## The service

`src/kernel/services/consistency-checker.ts:334` `class ConsistencyChecker implements IConsistencyChecker, IConsistencyHealingPipeline`.

- Contract: `src/kernel/contracts/consistency-checker.ts` (`checkDocs`, `getManifest`, `getLastReport`, `fetchDocs`).
- Registered as token `consistencyChecker` in `phase6-high-level.ts:207` (`new ConsistencyChecker()`), exposed as lazyService (`services-extras.ts:84`), phase `phase6` / group `docs-health` (service-phases.ts:143,722).
- It checks documentation references (file paths, type/interface names, events, services, methods) against a `CodeManifest` (code-manifest.ts) and produces a `ConsistencyReport` (consistency-checker.ts:531-638). The healing pipeline (`analyze`/`executeTask`) runs a "Documentation Debate" among doc-agent role names (consistency-checker.ts:367-529).

## How doc-checker relates — BY NAME ONLY

- The doc-checker **node prompt** tells the agent to "run the ConsistencyChecker service" (topology-defaults.ts:450). This is a _prompt instruction_, not a code binding.
- `ConsistencyChecker` constructor default `docAgents` list is **role-name strings**, not node ids (consistency-checker.ts:346-352):
  ```ts
  [
    'Architect Agent',
    'Auditor Agent',
    'Simplifier Agent',
    'Historian Agent',
    'Consistency Checker',
  ];
  ```
  The string `'Consistency Checker'` matches doc-checker's `baseRole`/`roleName` but is **not** the node id `agent-doc-checker`. The service never calls `agentService.resolveAgent` or invokes the agent at runtime.
- The healing debate (`runDocumentationDebate`, consistency-checker.ts:491-529) emits a textual consensus describing the 5 doc agents' pipeline; it does NOT dispatch real agent turns.

## Conclusion

The `ConsistencyChecker` service and the `agent-doc-checker` agent are **conceptually paired but decoupled in code**:

- The agent is a topology node whose persona _claims_ to use the service.
- The service is standalone infra that _mentions_ the agent's role name in its prompt template.
- There is **no runtime call** from one to the other. doc-checker does not automatically run `consistencyChecker.checkDocs`; the service does not spawn doc-checker.

## Implication for research

If asked "does doc-checker execute the consistency checker?", the accurate answer is: **only if a human/scenario invokes doc-checker in a ConversationCore/Debate turn and the LLM chooses to call the service tool** — but doc-checker's topology node has `tools:[]` (topology-defaults.ts:452), so it has no tool binding to the service either. Today the pairing is persona-only.

## Confidence

- Service + registration: VERIFIED (read).
- docAgents string list + no resolveAgent call: VERIFIED (read consistency-checker.ts).
- tools:[] on node: VERIFIED (topology-defaults.ts:452).
