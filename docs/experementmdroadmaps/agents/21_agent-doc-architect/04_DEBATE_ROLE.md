# 04_DEBATE_ROLE — `agent-doc-architect`

> How the agent participates in debates. **VERIFIED** unless noted.

## Is it special-cased in debate? — NO

- `grep` for `agent-doc-architect` / `doc-architect` across `src/kernel/services/debate-runtime/` → **0 matches**.
- `debate-agent-executor.ts` and `debate-meta-agent-controller.ts` + `contracts/debate-meta-agent.ts` contain **no** reference to this agent.
- Conclusion: doc-architect is a debate participant **only if explicitly added** to a debate's participant list. It has no debate-native role, persona, or bias.

## Persona assignment — generic, specialization-blind (VERIFIED)

- `PersonaSelector.selectForTopic` (`persona-selector.ts:292-308`) and `selectVariant` (`persona-selector.ts:251-290`) choose a `PersonaVariant` from 10 fixed variants (cautious_scientist … strategist) by:
  1. `minRound <= round`
  2. `suitableRoles` includes the agent's _debate role_ (`pro`/`con`/`neutral`)
  3. topic keyword score (`scoreTopicKeywords`, `persona-selector.ts:243`)
  4. deterministic tiebreak hash on `agentId`
- **Specializations (`Information Architecture`, `Taxonomy`, `Standards`) are never read.** A "documentation architecture" topic has no trigger keywords in any variant (`persona-selector.ts` keyword lists cover science/economics/legal/history/tech/philosophy/diplomacy/etc. — none documentation-specific). So doc-architect in a debate gets a generic variant (e.g. `technologist`/`philosopher`) purely by topic+role+round, identical to any other agent.

## System prompt vs persona injection

- The node's architect prompt (`topology-defaults.ts:402`) is the agent's base system prompt.
- `PersonaSelector` **injects an additional persona block** on top (`persona-selector.ts:305-307`). So in a debate, doc-architect's effective instruction = architect prompt + injected variant prompt. The injected variant can contradict the "documentation architect" identity (e.g. it could be told to speak as "Passionate Advocate").
- INFERRED: this means debate participation does **not** guarantee documentation-architecture-flavored output.

## When does it actually debate?

- Only when: (a) a user/handler adds `agent-doc-architect` as a `DebateParticipant`, or (b) the Invocation Engine is asked for a `debate` mode with doc-architect as `target` (`phase21-invocation.ts:75-87`).
- No seeded debate scenario, no scheduler, and no event auto-adds it. (VERIFIED — no `agent-doc-architect` in debate configs/debate-caller seeding.)

## Cognitive events in debate — NONE

- Per shared context + source: **Debate emits NO cognitive events.** So doc-architect accrues **no** stats/journal/health from debate turns. (VERIFIED by `event-registry.ts` cognitive section + absence of cognitive emit in `debate-runtime`.) This is a notable gap: the agent "works" in debate but is invisible to the cognitive observability stack.

## Opportunities (see 11)

- Add a documentation-architecture persona variant + trigger keywords so doc-architect debates _as_ an architect.
- Emit/bridge cognitive events from debate so doc-architect debate activity is observable.
- A "doc accuracy audit" debate pairing doc-architect + doc-auditor (`agent-writer/04_DEBATE_ROLE.md:17` already proposes this).
