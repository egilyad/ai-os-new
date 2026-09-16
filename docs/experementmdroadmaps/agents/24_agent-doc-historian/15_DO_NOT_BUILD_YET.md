# 15_DO_NOT_BUILD_YET — `agent-doc-historian`

What should NOT be built/changed now, and the justified backlog. Research-only; no changes made.

## DO NOT BUILD YET (avoid premature/incorrect work)

- **Do NOT add a second agent registry or identity source.** The single-source rule (`agent-identity.ts:1-12`, `AgentService` as `IAgentResolver`) must hold. Any historian-specific registry would violate the Dependency Rule and duplicate identity.
- **Do NOT hardcode `agent-doc-historian` into debate/conversation routing by specialization.** Selection is caller/explicit-participant driven; hardcoding breaks the generic design and the D6 (human authority) principle.
- **Do NOT change `AGENT_PROFILES` model or topology prompt without reconciling both.** They split identity (profile = provider/model/avatar/specs; topology = prompt/label/roleName/model:'auto'). Editing one without the other causes silent drift (see 00_PROFILE, 01_IDENTITY).
- **Do NOT add a `changelog`/crystal auto-bridge inside the historian node itself.** Agents are topology nodes, not services; persistence belongs in shared infra (Crystal Vault / event-recorder / a new repository), invoked via ConversationCore/Invocation, not baked into the node.
- **Do NOT implement scheduled historian jobs yet.** The Invocation Engine schedule trigger (D2) is not built (see 13_SCHEDULER). Building a cron now would bypass the intended dispatch layer.

## JUSTIFIED BACKLOG (future, not now)

1. **Give the historian a read tool** for versioned sources (Dexie schema version history, `AGENTS.md`/git diff). Today `tools: []` (`topology-defaults.ts:440`).
2. **Persist lineage as crystals** — add an Invocation/`crystallizeLineage` path historian→Crystal Vault (12_CRYSTAL_FORUM_WORKFLOW).
3. **Reconcile model resolution** so the pinned `openrouter/meta-llama/llama-3.3-70b-instruct` is honored by ConversationCore chat (05_CONVERSATION_CORE, 01_IDENTITY).
4. **Optional `lens:lineage`** extension (09_LENSES).
5. **Doc-cluster pipeline** (architect→writer→historian→checker) as an `AgentGroup` with `pipeline` pattern (10_DOC_CLUSTER, 03_AGENT_SERVICE `executeGroup`).
6. **Surface `specializations` in `resolveAgent`** by merging `AGENT_PROFILES` so routing/UI can use them (01_IDENTITY OPINION).

## Confidence

- All "VERIFIED" claims cite `file:line`. "INFERRED" are derived from code/design. "OPINION"/backlog are analyst recommendations, explicitly separated from facts.
- No source files were modified. No git/commit performed. Output is this folder of 16 Markdown files (00_PROFILE … 15_DO_NOT_BUILD_YET).
