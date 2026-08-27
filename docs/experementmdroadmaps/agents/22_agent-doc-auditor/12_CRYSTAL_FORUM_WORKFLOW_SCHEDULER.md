# 12_CRYSTAL_FORUM_WORKFLOW_SCHEDULER — Cross-subsystem Participation

**VERIFIED — N/A for each (no special participation).** Doc-auditor is not referenced by the Crystal, Forum, Workflow (Builder), or Scheduler subsystems.

## Crystal Vault (`crystal-vault-service`)

- Auto-proposes crystals from debate verdicts via `crystal-debate-bridge`. Doc-auditor contributes only as a _debate participant_ if selected (`04_DEBATE.md`); the bridge keys on verdict events, not on agent ids. No `agent-doc-auditor` reference exists in crystal contracts/services.

## Forum (`forum-service`)

- Forum topics/posts carry `agentProvenance`. Doc-auditor can post as an agent (its `agentId` in `author`/`provenance`) only if a flow publishes on its behalf. No forum code names doc-auditor. `AuthorBadge` (`ForumPanel/AuthorBadge.tsx`) renders any agent avatar generically via `AgentsPanel/AgentAvatar`.

## Workflow / Builder (`builder-agent-service`)

- Builder generates topologies from prompts and compiles `CompiledFlow`s. A built workflow _could_ include `agent-doc-auditor` as a node, but there is no Builder code that special-cases it. It would be just another agent node resolved via `agentService`.

## Scheduler

- **VERIFIED — N/A.** AGENTS.md lists "Scheduler" among subsystems to verify, but a grep for `schedul` + `doc-auditor`/doc agents finds no binding. The Invocation Engine supports a `schedule` trigger type in its design (D2), but no scheduled invocation of doc-auditor is seeded. Doc-auditor has no cron/periodic task.

## Summary table

| Subsystem        | Special participation?      | Evidence                                |
| ---------------- | --------------------------- | --------------------------------------- |
| Crystal Vault    | No                          | no `agent-doc-auditor` ref in crystal/* |
| Forum            | No (only as generic author) | `AuthorBadge` generic                   |
| Builder/Workflow | No                          | no ref; generic node if built           |
| Scheduler        | No                          | no schedul↔doc-auditor binding          |

## OPINION

Doc-auditor's value is highest where _verification_ is needed (Forum moderation audits, Builder output review, scheduled doc re-audits). None of these are wired today. The cleanest addition would be a Scheduler→Invocation policy that periodically invokes Felix against the doc corpus — but that is future work, not current behavior.
