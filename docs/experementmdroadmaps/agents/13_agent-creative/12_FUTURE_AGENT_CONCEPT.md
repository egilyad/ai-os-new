# 12_FUTURE_AGENT_CONCEPT — Realized concept from EXISTING capabilities

> OPINION/INFERRED. The thesis: **"Creative Visionary agent" is not a missing feature — it
> is a composition of capabilities the system already has.** This file describes the
> realized concept without inventing new frameworks.

## Concept: "Indira Sun, the Creative Director"

A user-facing creative partner realized entirely from current primitives:

1. **Identity** — already `agent-creative` (Indira Sun, 🎨, openrouter-70B, temp 0.8,
   Brand/Narrative/Ideation). `agent-profiles.ts:142-151`.
2. **Invocation** — human summons via RoomPanel → `invocationEngine.invoke`
   (`phase21-invocation.ts`). Already works end-to-end (B6.1/E2E closure).
3. **Persona** — once Q1/M1 land, debates assign `creative_visionary` by topic+specialization.
4. **Lens** — once M2 lands, `lens:brand-voice` gives consistent framing; `resolveAgentIdentity`
   already reads `lensIds` (`agent-identity.ts:136`).
5. **Memory** — Q3 auto-tags journal; M3 routes brand definitions to Crystal; M4 shows the
   lineage. All data already exists.
6. **Orchestration** — B1 "Creative Director" meta-agent = a `ConversationScenario`
   (authorable in `ScenarioEditor`, B5.3) with turns:
   `agent-creative` (ideate) → `agent-critic` (pressure) → `agent-content` (draft) →
   `agent-ux` (feel). The Director runtime (`conversation-director-service.ts`) already
   executes this; only the scenario content is new.
7. **Auditability** — invocation + conversation + cognitive events already stream to stores;
   the "Creative Trace" tab (M4) is presentation-only.

## What makes it feel like a "real" creative agent (and where each comes from)

| Desired trait                | Source today                    | Gap                             |
| ---------------------------- | ------------------------------- | ------------------------------- |
| Has a name/face/voice        | `AGENT_PROFILES` + node prompt  | ✅ done                         |
| Sounds creative in debates   | `PersonaSelector`               | ❌ P1 (Q1/M1 fix)               |
| Stays on-brand               | Lens + Crystal memory           | ❌ P2/P4 (M2/M3)                |
| Remembers past work          | Journal + Crystal + Forum       | ❌ P4 (Q3/M4)                   |
| Runs a full creative process | Director `ConversationScenario` | ⚠️ needs authored scenario (B1) |
| Is discoverable              | AgentCard + RoomPanel           | ⚠️ Q4 quick actions             |

## Realized-concept statement

> "Indira Sun" is **already a functioning creative node**. The work remaining is not to
> build a creative _engine_ (which would be the 26th mini-framework AGENTS.md warns
> against) but to (a) let the existing persona/lens/memory systems **recognize** her
> specializations, and (b) **compose** her with critic/content/ux via the existing
> Director. Every building block is present; the concept is realized by wiring, not by
> new architecture.

## Anti-pattern this avoids

Do NOT create `CreativeAgentService`, `IdeationEngine`, or `BrandMemoryStore` as new
kernel services. That fragments the shared-infra principle (AGENTS.md "No globals in
kernel", "Contracts at boundaries") and repeats the 25-agents/352-services sprawl. The
creative concept must live at the **composition + configuration** layer (lens, scenario,
policy, UI quick-actions), reusing `AgentService`, `LensEngine`, `CrystalVault`,
`ConversationDirector`, `InvocationEngine`.
