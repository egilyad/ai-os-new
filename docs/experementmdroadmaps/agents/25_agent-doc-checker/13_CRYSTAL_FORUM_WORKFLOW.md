# 13_CRYSTAL_FORUM_WORKFLOW — Crystal / Forum / Workflow / Builder Participation

**Status:** N/A (no special participation). doc-checker across remaining cognitive modules.

## Crystal Vault (Module 2)

`crystal-vault-service` + `crystal-debate-bridge` auto-propose crystals from debate verdicts. doc-checker is **not** a bridge source; it could only contribute crystals if it participated in a debate that produced a verdict (see 04_DEBATE). No direct coupling.

## Forum (Module 6)

`forum-service` handles topics/posts/votes. Agents appear via `provenance`. doc-checker can post if invoked in a forum context (AGENTS.md Invocation D4: `Forum → Invocation → Room → ConversationCore`), but there is **no doc-checker-specific forum behavior**. The forum event bridge listens to `debate:verdict:generated` / `knowledge:crystal:formed` / `forum:topic:escalated-to-debate` — none doc-checker-specific.

## Workflow / Builder (Module 7)

`builder-agent-service` generates topologies from prompts and deploys `workflows`. doc-checker is a static seed node; the Builder could _include_ it in a generated topology, but doc-checker has no Builder-specific logic. `WorkflowRepository` (Dexie v18) stores workflows, not agent definitions.

## Summary

Across Crystal/Forum/Workflow/Builder, doc-checker is a **generic, addressable node** — reachable when a scenario/invocation/workflow names it, but with no module-specific code path of its own.

## Confidence

- Module descriptions: VERIFIED via AGENTS.md.
- No coupling: INFERRED from Grep absence of `agent-doc-checker` outside profile/topology, plus AGENTS.md module scopes.
