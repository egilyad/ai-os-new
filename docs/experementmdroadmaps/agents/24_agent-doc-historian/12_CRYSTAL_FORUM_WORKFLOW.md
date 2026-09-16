# 12_CRYSTAL_FORUM_WORKFLOW — `agent-doc-historian`

Participation in Crystal Vault / Forum / Builder Workflow modules.

## VERIFIED

- Crystal Vault (Module 2): `crystal-vault-service` proposes/validates/crystallizes/refutes crystals; `crystal-debate-bridge` auto-proposes from debate verdicts. No `historian` reference in `src` (grep). The historian is not a crystal author by default.
- Forum (Module 6): `forum-service` topics/posts/votes/moderation; event bridge `debate:verdict:generated → case study`, `knowledge:crystal:formed → announcement`, `forum:topic:escalated-to-debate`. No historian binding.
- Builder (Module 7): `builder-agent-service` generates topology from prompt, validates DAG, deploys. No historian binding.
- Invocation can reach these: `phase21-invocation.ts:75-108` only handles `debate` and `chat/director-scenario`. There is **no** `crystal`/`forum`/`workflow` execution mode in the Invocation delegate — so the historian cannot be invoked _into_ a crystal/forum/workflow via Room today.

## INFERRED

- The historian's changelog output, if produced in a chat, would have to be manually posted to Forum or manually crystallized; nothing auto-bridges it.
- A "lineage" crystal (recording how a decision evolved) would be a natural historian product, but no template/bridge exists.

## OPINION

- Adding a `crystallizeLineage` path (historian → Crystal Vault) would convert its narrative output into durable, queryable knowledge — a high-value, low-risk addition (see 15_DO_NOT_BUILD_YET).
