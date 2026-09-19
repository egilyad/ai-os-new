# Legacy Agent Paths Audit (Phase X+ — map only, no migration yet)

> Цель: найти все старые `createAgent` пути и решить `→ AgentFactory ?`

| OLD PATH | Файл | Что делает | AgentFactory? | Решение |
|----------|------|------------|---------------|---------|
| `ComposeService.composeAgent(name, skillIds)` | `src/kernel/services/rivals13/paperclip-agents.ts:ComposeService` | skillIds → agent card | **YES → migrate** | Обернуть в `AgentFactory.create({ skillIds })` постепенно |
| `AgentService` (lifecycle) | `src/kernel/services/agent-service.ts:80` | runtime agent, не definition | **NO → leave** | Это runtime, не composition |
| `CrewService.createCrew` + `roles[]` | `src/kernel/services/crew/crew-service.ts:59` | crew = набор ролей, не агент | **PARTIAL → leave** | Crew — команда, не агент |
| `Council participants` | `src/kernel/services/council/council-service.ts:1` | участники дебатов (proponent/opponent) | **NO → leave** | Council остаётся отдельным runtime |
| `Persona-based agents` (`CharacterService`, `StudioPack`) | `src/kernel/services/rivals2/character-service.ts:1`, `phase42` | character → persona distill | **YES → migrate** | Добавить `personaId` в `AgentFactory` (уже есть) |
| `AgentFactory` (новый) | `src/kernel/services/capability/agent-factory.ts:1` | **каноническая** сборка | — | — |
| `Agent Avatar` | `src/kernel/services/agent-avatar-service.ts:1` | аватар, не агент | **NO** | — |

**Правило миграции (не всё сразу):**
```
OLD PATH
  ↓
нужен ли AgentFactory?
  ↓ YES → добавить адаптер: oldCall → agentFactory.createResolved → вернуть ResolvedAgent
  ↓ NO  → оставить legacy, пометить @deprecated
```

**Статус:** карта составлена (static). Миграция — постепенно, после Захода 2 typecheck.

**Следующий шаг:** один адаптер `ComposeService` → `AgentFactory` как пример (не сейчас, после Golden E2E зелёного).
