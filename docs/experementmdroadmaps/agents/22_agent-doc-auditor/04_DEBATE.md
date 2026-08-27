# 04_DEBATE — `agent-doc-auditor` in Debate

**VERIFIED — doc-auditor has NO debate-specific code.** It participates in debates only as a generic participant selected at runtime.

## How a debate participant is chosen

- Debates are started with an explicit participant list (e.g. `DebateSyncManager.startDebate(participants,...)`, used by the Invocation delegate — `phase21-invocation.ts:75-86`). The router can also propose doc-auditor via edge `e-router-doc-auditor` (`topology-defaults.ts:494`).
- There is no `persona-selector` or `debate-*` file that names `agent-doc-auditor`. The 10 `PersonaVariant`s in `persona-selector.ts:3-241` are topic/role-keyword driven, not agent-id driven.

## Persona injection (shared path)

- `debate-llm-prompt-context.ts:871-889` calls `selector.selectForTopic(participant.agentId, participant.role || 'neutral', session.topic, session.round, usedVariants, session.language)`.
- `persona-selector.ts:251-290` (`selectVariant`) scores the 10 variants by `topic` keywords and `participant.role` (pro/con/neutral). **The agent's `roleName` ("Documentation Auditor") is NOT used here — only the debate `role` (pro/con/neutral) + topic keywords matter.** So doc-auditor, when assigned `pro`/`con`/`neutral`, gets exactly the same persona-matching treatment as any other agent; there is no "auditor persona".

## Debating (shared infra)

- `debate-agent-executor.ts` and `debate-meta-agent-controller.ts` + `contracts/debate-meta-agent.ts` execute turns generically; no branch for doc-auditor.
- `debate-runtime/persona-selector.ts` is the only persona logic; see above.
- Debate emits NO cognitive events (`08_COGNITIVE.md`); doc-auditor's debate activity is recorded via `debate-memory.ts` (`recordStep`, `debate-pipeline-builder.ts:204`) generically by `agentId`.
- ELO / leaderboard (`components/AgentsPanel/EloLeaderboard.tsx`, `DebatePanel/DebateAnalytics.tsx`) treat doc-auditor as any participant.

## INFERRED

If a user starts a debate and includes `agent-doc-auditor` as a `neutral` reviewer, its _system prompt_ (strict "reject non-matching statements") still applies as the base persona, layered with whatever `PersonaVariant` the keyword scorer picks. Its "critical and precise" nature is thus partially self-enforced by its prompt, not by debate code.

## OPINION

Doc-auditor is well-suited to a `neutral`/judge debate role, but the system does not enforce that — it is purely the operator's selection. No guard prevents doc-auditor from being assigned `pro`/`con`, where its auditor prompt may conflict with advocacy. This is a design gap, not a bug.
