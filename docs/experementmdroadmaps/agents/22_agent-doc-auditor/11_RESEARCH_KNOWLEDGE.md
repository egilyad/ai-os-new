# 11_RESEARCH_KNOWLEDGE — Research / Knowledge Participation

**VERIFIED — N/A (no special participation).** Doc-auditor has no dedicated integration with the Research or Knowledge subsystems. It participates only as a generic agent if explicitly selected.

## Research subsystem

- The Research module (research service / knowledge-generator) selects agents generically via `agentService` when composing a job. A grep for `doc-auditor` / `Documentation Auditor` across `src` returns **only** `agent-profiles.ts` and `topology-defaults.ts` (see root grep). No research/knowledge file references doc-auditor.
- **INFERRED:** If a `KnowledgeGenerator` job includes `agent-doc-auditor` as a participant (e.g. peer-review stage "skeptic"), it would run through the standard Conversation Core / ChatExecutor path (`05_CONVERSATIONCORE.md`) — its auditor prompt would make it a harsh reviewer, but nothing in the generator code treats it specially.

## Knowledge / Crystals / Lenses

- `lens-engine`, `crystal-vault`, `synthesis-engine`, `knowledge-generator` are separate modules (AGENTS.md Cognitive Modules 1–5). Doc-auditor is not referenced in any of their contracts/services.
- `09_LENSES.md` already establishes doc-auditor carries no lenses and is not auto-attached to `lens:critical` despite topical alignment.

## When would doc-auditor appear in Research/Knowledge?

Only through:

1. **Manual Invocation** (RoomPanel → Invocation Engine, `06_INVOCATION.md`) targeting Felix in `chat`/`debate` mode.
2. **A Director scenario** whose turns list `participantId:'agent-doc-auditor'` (`05_CONVERSATIONCORE.md`).
3. **Debate participant selection** including the id (`04_DEBATE.md`).

None of these are Research/Knowledge-specific.

## OPINION

A "documentation audit" is fundamentally a Knowledge-adjacent task (it validates the corpus). Yet doc-auditor is not wired into the Knowledge Generator's peer-review or the Crystal Vault's validation flow. This is a candidate integration point (see `15_DO_NOT_BUILD_YET.md`) but is currently absent by design — the agent is a generalist reviewer, not a knowledge-module component.
