# 11_RESEARCH_KNOWLEDGE — `agent-doc-historian`

Participation in Research / Knowledge modules.

## VERIFIED

- Research agent: `agent-research` is a separate seeded node (`topology-defaults.ts`, distinct from the doc cluster). The historian is NOT the research agent.
- Knowledge Generator (Module 5, AGENTS.md): `knowledge-generator-service` runs a deterministic orchestrator (trigger → contrastive hypothesis → evidence → peer review → crystallization). It pulls evidence from `crystalVault` + counter-examples. Grep for `historian`/`doc-historian` in `src` → no Knowledge-Generator references. So the historian is not wired into the generator's peer-review roster by id.
- Synthesis Engine (Module 4): `synthesis-engine-service` decomposes → perspectives → zones. No historian-specific binding.
- The historian CAN still be pulled in transitively: any of these modules that execute an `AgentGroup` or a ConversationCore turn naming `agent-doc-historian` as a participant would include it. But there is no default binding.

## INFERRED

- "Context" and "Lineage" specializations would be valuable to Synthesis/Generator (e.g. "how does this new knowledge relate to past crystals?"), but this is not implemented — the modules do not read `specializations` to choose participants.

## OPINION

- A cheap win: let Knowledge Generator / Synthesis optionally add `agent-doc-historian` as a perspective agent when the task references prior versions or changelogs. Today that requires manual participant selection.
