# ÐšÐ°Ñ€Ñ‚Ð° Ð¼Ñ‘Ñ€Ñ‚Ð²Ð¾Ð³Ð¾ Ð¸ Ð·Ð°Ð±Ñ€Ð¾ÑˆÐµÐ½Ð½Ð¾Ð³Ð¾ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»Ð° â€” Dead & Abandoned Functionality Map
## SuperAgents OS (`egilyad/ai-os-new`)

> **Ð’ÐµÑ€ÑÐ¸Ñ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°:** commit `e08ab8e` (Oct 31, 2026, Ð²ÐµÑ‚ÐºÐ° `main`)
> **Ð”Ð°Ñ‚Ð° Ð°Ð½Ð°Ð»Ð¸Ð·Ð°:** 2026-10-31
> **ÐœÐµÑ‚Ð¾Ð´:** ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð·: Ð¿Ð¾Ð¸ÑÐº orphan-Ñ„Ð°Ð¹Ð»Ð¾Ð² (Ð±ÐµÐ· importers), grep `@deprecated MOCK`, Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ DemoGate/DemoBadge Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»ÐµÐ¹, Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ° route-registry vs components, audit sub-components Ð² DebatePanel/DashboardPanel/BuilderPanel/AgentsPanel
> **ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ñ‹:** 12 Ð¿Ñ€ÐµÐ´Ñ‹Ð´ÑƒÑ‰Ð¸Ñ… ÐºÐ°Ñ€Ñ‚
> **Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚:** Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾ **5 ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ð¼Ñ‘Ñ€Ñ‚Ð²Ð¾Ð³Ð¾/Ð·Ð°Ð±Ñ€Ð¾ÑˆÐµÐ½Ð½Ð¾Ð³Ð¾ ÐºÐ¾Ð´Ð°**, Ð²ÑÐµÐ³Ð¾ **~200+ Ñ„Ð°Ð¹Ð»Ð¾Ð²**. Ð’ÐºÐ»ÑŽÑ‡Ð°ÐµÑ‚ **5 `@deprecated MOCK` ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²**, **3 DemoGated Ð¿Ð°Ð½ÐµÐ»Ð¸ (782+441+516 ÑÑ‚Ñ€Ð¾Ðº)**, **~15 orphan ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð²**, **19 `rivals/` Ð¿Ð¾Ð´ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð² (~175 Ñ„Ð°Ð¹Ð»Ð¾Ð²)**, **5 Ð¿ÑƒÑÑ‚Ñ‹Ñ… dev-status-*.md**.
> **âš ï¸ Ð’ÐÐ–ÐÐž:** Ð½Ð¸Ñ‡ÐµÐ³Ð¾ Ð½Ðµ ÑƒÐ´Ð°Ð»ÑÑ‚ÑŒ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸. Ð¡Ð½Ð°Ñ‡Ð°Ð»Ð° â€” Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ Ð¸ Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸.

---

## 1. Ð˜ÑÐ¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾Ðµ Ñ€ÐµÐ·ÑŽÐ¼Ðµ

SuperAgents OS Ð½Ð°ÐºÐ¾Ð¿Ð¸Ð»Ð° **Ð¸Ð·Ð¼ÐµÑ€Ð¸Ð¼Ñ‹Ð¹ Ð¼Ñ‘Ñ€Ñ‚Ð²Ñ‹Ð¹ Ð¸ Ð·Ð°Ð±Ñ€Ð¾ÑˆÐµÐ½Ð½Ñ‹Ð¹ ÐºÐ¾Ð´** Ð·Ð° Ð¸Ñ‚ÐµÑ€Ð°Ñ†Ð¸Ð¸ Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐ¸. ÐÐ°Ð¹Ð´ÐµÐ½Ð¾:

- **5 `@deprecated MOCK` ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²** â€” ÑÐ²Ð½Ð¾ Ð¿Ð¾Ð¼ÐµÑ‡ÐµÐ½Ñ‹ ÐºÐ°Ðº simulated backends
- **3 DemoGated Ð¿Ð°Ð½ÐµÐ»Ð¸** (DeployPanel 782 ÑÑ‚Ñ€Ð¾ÐºÐ¸, HealthSlaPanel 441, DistillationPanel 516) â€” visible Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸, Ð½Ð¾ Ð·Ð° DemoBadge, Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÑŽÑ‚ mock data
- **~15 orphan ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð²** â€” Ð½Ð°Ð¿Ð¸ÑÐ°Ð½Ñ‹, Ð½Ð¾ Ð½Ðµ Ð¿Ð¾Ð´ÐºÐ»ÑŽÑ‡ÐµÐ½Ñ‹ Ð½Ð¸ Ðº route, Ð½Ð¸ Ðº Ð´Ñ€ÑƒÐ³Ð¸Ð¼ ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ð¼
- **19 `rivals/` Ð¿Ð¾Ð´ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð² (~175 Ñ„Ð°Ð¹Ð»Ð¾Ð²)** â€” research parallel implementations, Ð½Ðµ canonical
- **5 Ð¿ÑƒÑÑ‚Ñ‹Ñ… `dev-status-*.md`** â€” Ð·Ð°Ð³Ð»ÑƒÑˆÐºÐ¸ Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ»
- **Experimental panels Ð±ÐµÐ· UI badge** â€” Aquarium, FederatedMemory
- **2 TODOs** (Ð¼Ð¸Ð½Ð¸Ð¼ÑƒÐ¼ â€” Ð½Ð¾ Ð¾Ð±Ðµ Ð¿Ñ€Ð¾ unfinished framer-motion cleanup)

**Ð¡Ð²Ð¾Ð´Ð½Ñ‹Ðµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸:**

| ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ | ÐšÐ¾Ð»-Ð²Ð¾ | LOC (Ð¿Ñ€Ð¸Ð¼ÐµÑ€Ð½Ð¾) | Severity |
|---|---:|---:|---|
| `@deprecated MOCK` ÑÐµÑ€Ð²Ð¸ÑÑ‹ | 5 | ~2 000 | ðŸ”´ HIGH â€” Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð²Ð¸Ð´Ð¸Ñ‚ mock data |
| DemoGated Ð¿Ð°Ð½ÐµÐ»Ð¸ | 3 | ~1 739 | ðŸŸ¡ MED â€” Ð²Ð¸Ð´Ð½Ñ‹, Ð½Ð¾ Ð¿Ð¾Ð¼ÐµÑ‡ÐµÐ½Ñ‹ |
| Orphan components | ~15 | ~3 000 | ðŸŸ¡ MED â€” Ð½Ð°Ð¿Ð¸ÑÐ°Ð½Ñ‹, Ð½Ðµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÑŽÑ‚ÑÑ |
| `rivals/` subdirs | 19 ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð² | ~17 500 | ðŸŸ¡ MED â€” research parallel |
| ÐŸÑƒÑÑ‚Ñ‹Ðµ dev-status-*.md | 5 Ñ„Ð°Ð¹Ð»Ð¾Ð² | ~50 (Ð·Ð°Ð³Ð»ÑƒÑˆÐºÐ¸) | ðŸŸ¡ MED â€” impression of unfinished |
| Experimental Ð±ÐµÐ· badge | 2 | ~1 500 | ðŸŸ¡ LOW â€” Ð¿Ð¾Ð¼ÐµÑ‡ÐµÐ½Ñ‹ Ð² ÐºÐ¾Ð´Ðµ |
| TODOs (unfinished work) | 2 | â€” | ðŸŸ¢ LOW â€” Ð¼Ð°Ð»Ð¾ |
| **Total dead/abandoned** | **~210+ Ñ„Ð°Ð¹Ð»Ð¾Ð²** | **~25 000 LOC** | â€” |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ Ð½Ð°Ñ…Ð¾Ð´ÐºÐ¸:**

| # | ÐÐ°Ñ…Ð¾Ð´ÐºÐ° | Ð“Ð´Ðµ | Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ |
|---|---|---|---|
| 1 | `@deprecated MOCK` deploy-service | `kernel/services/deploy-service.ts` | DeployPanel Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ simulated deployment |
| 2 | `@deprecated MOCK` health-sla-service | `kernel/services/health-sla-service.ts` | HealthSlaPanel Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ simulated SLA |
| 3 | `@deprecated MOCK` model-distillation-service | `kernel/services/model-distillation-service.ts` | DistillationPanel Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ simulated distillation |
| 4 | `@deprecated MOCK` provider-migration-service | `kernel/services/provider-migration-service.ts` | Migration steps = no-ops |
| 5 | `@deprecated STATIC` obs-gaps-service | `kernel/services/obs-gaps-service.ts` | Static snapshot, Ð½Ðµ Ð¾Ð±Ð½Ð¾Ð²Ð»ÑÐµÑ‚ÑÑ |
| 6 | DemoGated DeployPanel (782 ÑÑ‚Ñ€Ð¾ÐºÐ¸!) | `components/DeployPanel.tsx` | Visible, mock backend |
| 7 | ~15 orphan ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð² | various | ÐÐ°Ð¿Ð¸ÑÐ°Ð½Ñ‹, Ð½Ðµ wired |
| 8 | 19 rivals/ subdirs | `kernel/services/rivals*/` | ~17 500 LOC research parallel |
| 9 | 5 Ð¿ÑƒÑÑ‚Ñ‹Ñ… dev-status docs | `docs/wiki/dev-status-*.md` | Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ» Ð·Ð°Ð³Ð»ÑƒÑˆÐºÐ¸ |
| 10 | Aquarium Ð±ÐµÐ· UI experimental badge | `components/AquariumPanel/` | ÐŸÐ¾Ð¼ÐµÑ‡ÐµÐ½Ð¾ Ð² ÐºÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¸, Ð½Ðµ Ð² UI |

**âš ï¸ Ð“Ð»Ð°Ð²Ð½Ð¾Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾ (Ð¸Ð· Ð·Ð°Ð´Ð°Ð½Ð¸Ñ):** Â«ÐÐµ ÑƒÐ´Ð°Ð»ÑÑ‚ÑŒ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸! Ð¡Ð½Ð°Ñ‡Ð°Ð»Ð° Ð²Ñ‹ÑÑÐ½Ð¸Ñ‚ÑŒ Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ Ð¸ Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸Â». ÐšÐ°Ð¶Ð´Ñ‹Ð¹ Ð¿ÑƒÐ½ÐºÑ‚ Ð½Ð¸Ð¶Ðµ Ð¸Ð¼ÐµÐµÑ‚ **investigation section** â€” Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ, Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸, Ñ€ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ.

**Dead Code Score: 5.5/10** â€” ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾Ðµ ÐºÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð¼Ñ‘Ñ€Ñ‚Ð²Ð¾Ð³Ð¾ ÐºÐ¾Ð´Ð° Ð´Ð»Ñ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð° Ñ‚Ð°ÐºÐ¾Ð³Ð¾ Ñ€Ð°Ð·Ð¼ÐµÑ€Ð° (509K LOC). ~25K LOC Ð¸Ð· 509K = 5% â€” Ð² Ð¿Ñ€ÐµÐ´ÐµÐ»Ð°Ñ… Ð½Ð¾Ñ€Ð¼Ñ‹, Ð½Ð¾ Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ cleanup.

---

## 2. ÐœÐµÑ‚Ð¾Ð´Ð¾Ð»Ð¾Ð³Ð¸Ñ: 6 Ñ‚Ð¸Ð¿Ð¾Ð² Ð¼Ñ‘Ñ€Ñ‚Ð²Ð¾Ð³Ð¾ ÐºÐ¾Ð´Ð°

| # | Ð¢Ð¸Ð¿ | Ð§Ñ‚Ð¾ Ð¸Ñ‰ÐµÐ¼ | ÐœÐµÑ‚Ð¾Ð´ |
|---|---|---|---|
| 1 | **Unused components** | .tsx files Ð±ÐµÐ· importers | `grep -rE "import.*BaseName"` per file |
| 2 | **Outdated implementations** | `@deprecated MOCK/STATIC` | `grep -rE "@deprecated"` |
| 3 | **Inaccessible panels** | DemoGated panels visible Ð² nav | `grep -rlE "DemoGate\|DemoBadge"` |
| 4 | **Unused services** | .ts files Ð±ÐµÐ· importers | grep per service file |
| 5 | **Unfinished experiments** | rivals/ subdirs, experimental panels | ls + grep featureFlag |
| 6 | **Disconnected functions** | Services exist, no UI exposure | Integration Map findings |

**ÐŸÑ€Ð¸Ð½Ñ†Ð¸Ð¿:** Â«Ð½Ðµ ÑƒÐ´Ð°Ð»ÑÑ‚ÑŒ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Â» â€” Ð´Ð»Ñ ÐºÐ°Ð¶Ð´Ð¾Ð³Ð¾ Ð¿ÑƒÐ½ÐºÑ‚Ð°:
- **ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ** â€” Ð·Ð°Ñ‡ÐµÐ¼ Ð½Ð°Ð¿Ð¸ÑÐ°Ð½Ð¾
- **Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸** â€” ÐºÑ‚Ð¾ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ (ÐµÑÐ»Ð¸ ÐºÑ‚Ð¾-Ñ‚Ð¾)
- **Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ** â€” KEEP / REMOVE / HIDE / DOCUMENT / REPLACE

---

## 3. ðŸ”´ `@deprecated MOCK` ÑÐµÑ€Ð²Ð¸ÑÑ‹ â€” 5 explicit mock backends

### 3.1. `deploy-service.ts` â€” @deprecated MOCK deployment

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** DeployPanel (782 ÑÑ‚Ñ€Ð¾ÐºÐ¸) Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ Â«deployÂ» cognitive pipeline â€” Ð½Ð¾ backend ÑÐ¸Ð¼ÑƒÐ»Ð¸Ñ€Ð¾Ð²Ð°Ð½.

**Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾:**
```typescript
// src/kernel/services/deploy-service.ts
/**
 * @deprecated MOCK â€” simulated deployment. No real build, upload, or server interaction.
 */
```
Ð˜: `'deploy uses @deprecated MOCK backend â€” no real build, upload, or server interaction'`

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:**
- `DeployPanel.tsx` (782 ÑÑ‚Ñ€Ð¾ÐºÐ¸) â€” explicit consumer, Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ DemoGate
- DemoBadge Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ÑÑ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŽ

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¡ **HIDE + DOCUMENT**
- Ð¡ÐºÑ€Ñ‹Ñ‚ÑŒ DeployPanel Ð¸Ð· main nav Ð·Ð° `featureFlags.mockServices.enabled = false` Ð¿Ð¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ
- Ð”Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð² wiki: Â«DeployPanel â€” preview/mock, Ð½Ðµ productionÂ»
- Long-term: Ð»Ð¸Ð±Ð¾ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð¾Ð²Ð°Ñ‚ÑŒ real deploy, Ð»Ð¸Ð±Ð¾ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ

### 3.2. `health-sla-service.ts` â€” @deprecated MOCK SLA

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** HealthSlaPanel (441 ÑÑ‚Ñ€Ð¾ÐºÐ°) Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ SLA-Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ â€” Ð½Ð¾ simulated.

**Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾:**
```typescript
// src/kernel/services/health-sla-service.ts
/**
 * @deprecated MOCK â€” simulated backend. Replace with real implementation before production use.
 */
```

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:**
- `HealthSlaPanel.tsx` â€” explicit consumer, DemoGated
- `wiki-components.ts` (2 refs): Â«HealthSlaService Ð¿Ð¾Ð¼ÐµÑ‡ÐµÐ½ Ð² ÐºÐ¾Ð´Ðµ ÐºÐ°Ðº `@deprecated MOCK` â€” ÑÐ¸Ð¼ÑƒÐ»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹ Ð±ÑÐºÐµÐ½Ð´Â»

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸ”´ **REMOVE**
- HealthSlaPanel = 441 ÑÑ‚Ñ€Ð¾ÐºÐ° mock UI
- Ð ÐµÐ°Ð»ÑŒÐ½Ð¾Ð¹ SLA Ð½ÐµÑ‚ (ÑÐ¼. Tech Health Map â€” HealthSlaPanel Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð±Ñ‹Ñ‚ÑŒ merged Ð² HealthPanel Ð¸Ð»Ð¸ ÑƒÐ´Ð°Ð»Ñ‘Ð½)
- Ð•ÑÐ»Ð¸ SLA Ð½ÑƒÐ¶ÐµÐ½ â€” Ñ€ÐµÐ°Ð»Ð¸Ð·Ð¾Ð²Ð°Ñ‚ÑŒ Ð·Ð°Ð½Ð¾Ð²Ð¾, Ð½Ðµ ÐºÐ°Ðº mock

### 3.3. `model-distillation-service.ts` â€” @deprecated MOCK distillation

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** DistillationPanel (516 ÑÑ‚Ñ€Ð¾Ðº) Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ model distillation â€” Ð½Ð¾ simulated progress, no real distillation API call.

**Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾:**
```typescript
// src/kernel/services/model-distillation-service.ts
/**
 * @deprecated MOCK â€” simulated backend. Replace with real implementation before production use.
 */
'startJob uses @deprecated MOCK backend â€” simulated progress, no real distillation API call'
```

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:**
- `DistillationPanel.tsx` (516 ÑÑ‚Ñ€Ð¾Ðº) â€” explicit consumer, DemoGated
- DemoBadge Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ÑÑ

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¡ **HIDE + DOCUMENT**
- Distillation â€” Ñ€ÐµÐ°Ð»ÑŒÐ½Ð°Ñ ML-ÐºÐ¾Ð½Ñ†ÐµÐ¿Ñ†Ð¸Ñ, Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ future feature
- Ð¡ÐºÑ€Ñ‹Ñ‚ÑŒ Ð·Ð° featureFlag, Ð½Ðµ ÑƒÐ´Ð°Ð»ÑÑ‚ÑŒ ÐºÐ¾Ð´ (Ð¼Ð¾Ð¶ÐµÑ‚ ÑÑ‚Ð°Ñ‚ÑŒ Ð¾ÑÐ½Ð¾Ð²Ð¾Ð¹ Ð´Ð»Ñ real impl)
- Ð”Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ: Â«DistillationPanel â€” mock previewÂ»

### 3.4. `provider-migration-service.ts` â€” @deprecated MOCK migration

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** Migration steps Ð´Ð»Ñ provider data â€” Ð½Ð¾ no-ops.

**Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾:**
```typescript
// src/kernel/services/provider-migration-service.ts
/**
 * @deprecated MOCK â€” simulated backend. Migration steps are no-ops. Replace with real
 */
```

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:**
- Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ð² bootstrap (Ð½Ð¾ ÐºÐ°Ðº no-op)
- ÐÐµ visible Ð² UI Ð½Ð°Ð¿Ñ€ÑÐ¼ÑƒÑŽ

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¢ **DOCUMENT + KEEP (no-op safe)**
- No-op migration Ð±ÐµÐ·Ð¾Ð¿Ð°ÑÐ½Ð° (Ð½Ð¸Ñ‡ÐµÐ³Ð¾ Ð½Ðµ Ð´ÐµÐ»Ð°ÐµÑ‚)
- Ð”Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð² ÐºÐ¾Ð´Ðµ: Â«migration Ð·Ð°Ð¿ÑƒÑÐºÐ°ÐµÑ‚ÑÑ, Ð½Ð¾ steps = no-opsÂ»
- Ð•ÑÐ»Ð¸ real migration Ð¿Ð¾Ð½Ð°Ð´Ð¾Ð±Ð¸Ñ‚ÑÑ â€” Ð·Ð°Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ

### 3.5. `obs-gaps-service.ts` â€” @deprecated STATIC snapshot

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** Service inventory snapshot â€” static, Ð½Ðµ Ð¾Ð±Ð½Ð¾Ð²Ð»ÑÐµÑ‚ÑÑ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸.

**Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾:**
```typescript
// src/kernel/services/obs-gaps-service.ts
/**
 * @deprecated STATIC â€” service inventory snapshot. Update `STATIC_SERVICES` and `SERVICE_FILE_MAP`
 */
```

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:**
- Ð’Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ð² Observability panels (Ð½ÑƒÐ¶Ð½Ð¾ Ñ€ÐµÐ²ÑŒÑŽ)

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¡ **REPLACE Ñ dynamic**
- Static snapshot ÑƒÑÑ‚Ð°Ñ€ÐµÐ²Ð°ÐµÑ‚
- Ð—Ð°Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ Ð½Ð° dynamic generation Ñ‡ÐµÑ€ÐµÐ· `gen:wiki-system-map` (ÑƒÐ¶Ðµ ÐµÑÑ‚ÑŒ script)

---

## 4. ðŸŸ¡ DemoGated Ð¿Ð°Ð½ÐµÐ»Ð¸ â€” 3 visible mock panels

### 4.1. DeployPanel (782 ÑÑ‚Ñ€Ð¾ÐºÐ¸)

| ÐÑÐ¿ÐµÐºÑ‚ | Ð”ÐµÑ‚Ð°Ð»ÑŒ |
|---|---|
| Ð¡Ñ‚Ñ€Ð¾Ðº | **782** (largest panel) |
| Backend | `@deprecated MOCK` deploy-service |
| UI gating | DemoGate + DemoBadge |
| Visible Ð² nav | âœ… Ð”Ð (Ð±ÐµÐ· ÑÐ²Ð½Ð¾Ð³Ð¾ Â«mockÂ» Ð±ÐµÐ¹Ð´Ð¶Ð° Ð² sidebar) |
| ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Preview deploy cognitive pipeline |
| Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸ | DemoGate, DemoBadge, deploy-service |
| Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ | ðŸŸ¡ HIDE Ð·Ð° `featureFlags.mockServices.enabled = false` Ð¿Ð¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ |

### 4.2. HealthSlaPanel (441 ÑÑ‚Ñ€Ð¾ÐºÐ°)

| ÐÑÐ¿ÐµÐºÑ‚ | Ð”ÐµÑ‚Ð°Ð»ÑŒ |
|---|---|
| Ð¡Ñ‚Ñ€Ð¾Ðº | 441 |
| Backend | `@deprecated MOCK` health-sla-service |
| UI gating | DemoBadge |
| Visible Ð² nav | âœ… Ð”Ð |
| ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | SLA metrics preview |
| Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸ | DemoBadge, health-sla-service |
| Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ | ðŸ”´ REMOVE (Ð¸Ð»Ð¸ merge Ð² HealthPanel + ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ mock) |

### 4.3. DistillationPanel (516 ÑÑ‚Ñ€Ð¾Ðº)

| ÐÑÐ¿ÐµÐºÑ‚ | Ð”ÐµÑ‚Ð°Ð»ÑŒ |
|---|---|
| Ð¡Ñ‚Ñ€Ð¾Ðº | 516 |
| Backend | `@deprecated MOCK` model-distillation-service |
| UI gating | DemoBadge |
| Visible Ð² nav | âœ… Ð”Ð |
| ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Model distillation preview |
| Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸ | DemoBadge, model-distillation-service |
| Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ | ðŸŸ¡ HIDE + DOCUMENT (future feature) |

**Ð¡Ð²Ð¾Ð´Ð½Ð¾:** 3 Ð¿Ð°Ð½ÐµÐ»Ð¸, **1 739 ÑÑ‚Ñ€Ð¾Ðº** mock UI, Ð²ÑÐµ visible Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸. ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð¾Ñ‚ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ â€” Ð²Ð¸Ð´Ð¸Ñ‚ DemoBadge Â«Demo modeÂ», Ð½Ð¾ Ð² sidebar Ð½ÐµÑ‚ Ð¿Ñ€ÐµÐ´ÑƒÐ¿Ñ€ÐµÐ¶Ð´ÐµÐ½Ð¸Ñ.

---

## 5. ðŸŸ¡ Orphan ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ñ‹ â€” ~15 Ð½Ð°Ð¿Ð¸ÑÐ°Ð½Ñ‹, Ð½Ðµ wired

### 5.1. ÐŸÐ¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´Ñ‘Ð½Ð½Ñ‹Ðµ orphans (1â€“2 refs, Ñ‚Ð¾Ð»ÑŒÐºÐ¾ test files)

| Ð¤Ð°Ð¹Ð» | Refs | ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ (Ð¿Ð¾ Ð¸Ð¼ÐµÐ½Ð¸) | Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ |
|---|---:|---|---|
| `AgentsPanel/AgentStatsDashboard.tsx` | 1 (test) | Stats dashboard Ð´Ð»Ñ agents | ðŸŸ¡ probably unused â€” investigate |
| `AgentsPanel/LiveActivityStream.tsx` | 2 | Live activity feed | ðŸŸ¡ maybe in tests only |
| `AgentsPanel/AgentGroupsSection.tsx` | (orphan) | Groups section | ðŸŸ¡ investigate |
| `AgentsPanel/agent-templates.tsx` | (orphan) | Agent templates | ðŸŸ¡ investigate |
| `FleetPanels/CouncilsPanel.tsx` | 1 | Councils panel | ðŸŸ¡ duplicate of `CouncilPanel`? |
| `RolesPanel/PermissionMatrix.tsx` | 1 | Permission matrix | ðŸŸ¡ investigate |
| `RolesPanel/RoleAnalytics.tsx` | 7 refs | Role analytics | ðŸŸ¢ NOT orphan (used) |
| `ChatPanel/PersonaSelector.tsx` | 9 refs | Persona selector | ðŸŸ¢ NOT orphan (used) |
| `ProjectsPanel/WebsitePreview.tsx` | (orphan) | Website preview | ðŸŸ¡ investigate |

### 5.2. DebatePanel sub-components â€” wizard step orphans

| Ð¤Ð°Ð¹Ð» | ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ |
|---|---|---|
| `DebatePanel/WizardStepIndicator.tsx` | Step indicator Ð´Ð»Ñ wizard | ðŸŸ¡ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ unused (DebateSetupWizard Ð½Ðµ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÐµÑ‚) |
| `DebatePanel/WizardNav.tsx` | Wizard navigation | ðŸŸ¡ Ñ‚Ð¾ Ð¶Ðµ |
| `DebatePanel/ProbeResults.tsx` | Probe results | ðŸŸ¡ investigate |
| `DebatePanel/ProbeResultsList.tsx` | Probe results list | ðŸŸ¡ investigate |
| `DebatePanel/DebateMemoryPanel.tsx` | Debate memory panel | ðŸŸ¡ investigate (ÑÐ¼. Capability Gap Map â€” debateâ†”memory missing!) |
| `DebatePanel/DebateSetupFormSections.tsx` | Setup form sections | ðŸŸ¡ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ unused |
| `DebatePanel/AgentsStep.tsx` | Wizard step: agents | ðŸŸ¡ wizard step orphan |
| `DebatePanel/TopicStep.tsx` | Wizard step: topic | ðŸŸ¡ wizard step orphan |
| `DebatePanel/AutoDebateSection.tsx` | Auto-debate section | ðŸŸ¡ investigate |
| `DebatePanel/TournamentBracketView.tsx` | Tournament bracket | ðŸŸ¡ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ unused |

**âš ï¸ Ð’Ð°Ð¶Ð½Ð¾:** `DebateMemoryPanel` ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚ ÐºÐ°Ðº ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚, Ð½Ð¾ **Ð½Ðµ Ð¿Ð¾Ð´ÐºÐ»ÑŽÑ‡Ñ‘Ð½** â€” ÑÑ‚Ð¾ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ **half-implemented debateâ†”memory integration** (ÑÐ¼. Integration Map Â§3.8: chat-executor â†’ memory = 0 calls). Investigate first!

### 5.3. DashboardPanel sub-components â€” section orphans

| Ð¤Ð°Ð¹Ð» | ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ |
|---|---|---|
| `DashboardPanel/InferenceMeshSection.tsx` | Inference mesh section | ðŸŸ¡ investigate |
| `DashboardPanel/LiveTerminalSection.tsx` | Live terminal section | ðŸŸ¡ investigate |
| `DashboardPanel/ProviderPressureMap.tsx` | Provider pressure map | ðŸŸ¡ investigate |
| `DashboardPanel/RoutingActivitySection.tsx` | Routing activity section | ðŸŸ¡ investigate |

**Ð­Ñ‚Ð¸ ÑÐµÐºÑ†Ð¸Ð¸ Ð¼Ð¾Ð³ÑƒÑ‚ Ð±Ñ‹Ñ‚ÑŒ part of Desktop.tsx (465 ÑÑ‚Ñ€Ð¾Ðº) â€” Ð½ÑƒÐ¶Ð½Ð¾ Ñ€ÐµÐ²ÑŒÑŽ.**

### 5.4. BuilderPanel sub-components

| Ð¤Ð°Ð¹Ð» | ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ |
|---|---|---|
| `BuilderPanel/BuilderAISidebar.tsx` | AI sidebar Ð´Ð»Ñ builder | ðŸŸ¡ investigate |
| `BuilderPanel/WorkflowListPanel.tsx` (183 ÑÑ‚Ñ€Ð¾ÐºÐ¸) | Workflow list | ðŸŸ¡ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ unused |

### 5.5. RivalsHub

| Ð¤Ð°Ð¹Ð» | Refs | Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ |
|---|---:|---|
| `RivalsHub/RivalsHub.tsx` | (orphan) | ðŸŸ¡ investigate â€” Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ separate route |

### 5.6. Orphan summary

**~15 confirmed orphan components**, ~3 000 LOC. Ð‘Ð¾Ð»ÑŒÑˆÐ¸Ð½ÑÑ‚Ð²Ð¾ â€” sub-components Ð±Ð¾Ð»ÑŒÑˆÐ¸Ñ… Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ (DebatePanel wizard steps, DashboardPanel sections). **ÐÐµ ÑƒÐ´Ð°Ð»ÑÑ‚ÑŒ** â€” ÑÐ½Ð°Ñ‡Ð°Ð»Ð° Ñ€ÐµÐ²ÑŒÑŽ, ÑÐ²Ð»ÑÑŽÑ‚ÑÑ Ð»Ð¸ Ð¾Ð½Ð¸:
- Part of larger component (Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ñ‡ÐµÑ€ÐµÐ· props, Ð½Ðµ import)
- Half-implemented features (ÑÐ¼. DebateMemoryPanel)
- Genuinely abandoned

---

## 6. ðŸ”´ `rivals/` subdirs â€” 19 parallel research implementations

(ÐŸÐ¾Ð´Ñ€Ð¾Ð±Ð½Ð¾ Ð² Duplication Map Â§4)

**19 ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð²** `rivals/`, `rivals2/` â€¦ `rivals20/` â€” ~175 Ñ„Ð°Ð¹Ð»Ð¾Ð², ~17 500 LOC.

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** research/experimental parallel implementations of similar concepts (cache-service, project-service, policy-service, etc.).

**Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾:** 7 Ð¿Ð°Ñ€ duplicate files (cache-serviceÃ—3, project-serviceÃ—2, policy-serviceÃ—2, persona-serviceÃ—2, n8n-serviceÃ—2, blackboard-serviceÃ—2, assistant-serviceÃ—2).

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:** Ð½ÑƒÐ¶Ð½Ð¾ Ñ€ÐµÐ²ÑŒÑŽ â€” ÐºÐ°ÐºÐ¸Ðµ rivals/ Ñ„Ð°Ð¹Ð»Ñ‹ Ñ€ÐµÐ°Ð»ÑŒÐ½Ð¾ registered Ð² service-registration, ÐºÐ°ÐºÐ¸Ðµ abandoned.

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¡ **MOVE Ð² `src/experimental/rivals/`** Ð¸Ð»Ð¸ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ Ð½ÐµÐ¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÐ¼Ñ‹Ðµ. ÐÐµ ÑƒÐ´Ð°Ð»ÑÑ‚ÑŒ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸ â€” ÑÐ½Ð°Ñ‡Ð°Ð»Ð° audit imports.

---

## 7. ðŸŸ¡ Experimental panels Ð±ÐµÐ· UI badge

### 7.1. AquariumPanel

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** Cognitive-aux / research panel (Experimental). Decorative aquarium visualization of provider health.

**Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾:**
```typescript
// src/components/AquariumPanel/AquariumPanel.tsx
/**
 * Cognitive-aux / research panel (Experimental).
 * Same provider health data as HealthPanel, rendered as an aquarium showcase.
 * Sidebar: feature flag ui.experimentalVisuals. Research-grade â€” not production surface (P1.21).
 */
```

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:**
- Feature flag `ui.experimentalVisuals` (Ð² SettingsPanel/GeneralTab)
- Visible Ð² sidebar Ð‘Ð•Ð— ÑÐ²Ð½Ð¾Ð³Ð¾ Â«experimentalÂ» badge

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¡ **ADD badge** â€” Ð² sidebar Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Â«ExperimentalÂ» Ñ‚ÐµÐ³. ÐÐµ ÑƒÐ´Ð°Ð»ÑÑ‚ÑŒ â€” decorative, Ð½Ð¾ functional.

### 7.2. FederatedMemoryPanel

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** Federated memory â€” research-grade, not production surface (P1.21).

**Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾:**
```typescript
// src/components/FederatedMemoryPanel.tsx
/**
 * Cognitive-aux / research panel (Experimental).
 * Federated memory â€” research-grade, not production surface (P1.21).
 */
```

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:** `federatedMemoryService` (ÑÐºÑÐ¿ÐµÑ€Ð¸Ð¼ÐµÐ½Ñ‚Ð°Ð»ÑŒÐ½Ñ‹Ð¹)

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¡ **ADD badge** + hide Ð·Ð° featureFlag Ð¿Ð¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ.

---

## 8. ðŸŸ¡ ÐŸÑƒÑÑ‚Ñ‹Ðµ dev-status-*.md â€” 5 Ð·Ð°Ð³Ð»ÑƒÑˆÐµÐº

(ÐŸÐ¾Ð´Ñ€Ð¾Ð±Ð½Ð¾ Ð² Tech Health Map Â§4.3)

**5 Ñ„Ð°Ð¹Ð»Ð¾Ð²** Ð² `docs/wiki/`:
- `dev-status-done.md` â€” Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ»
- `dev-status-active.md` â€” Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ»
- `dev-status-critical.md` â€” Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ»
- `dev-status-debt.md` â€” Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ»
- `dev-status-bugs.md` â€” Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ»
- `dev-status-blocked.md` â€” Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ»

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** Ð´Ð¾Ð»Ð¶Ð½Ð¾ Ð±Ñ‹Ñ‚ÑŒ formal issue tracking â€” ÑÐµÐ¹Ñ‡Ð°Ñ placeholders.

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:** referenced Ð² wiki navigation, Ð½Ð¾ content Ð¿ÑƒÑÑ‚Ð¾Ð¹.

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¡ **FILL Ð¸Ð»Ð¸ REMOVE** Ð¸Ð· wiki-Ð¼ÐµÐ½ÑŽ. Ð¡ÐµÐ¹Ñ‡Ð°Ñ ÑÐ¾Ð·Ð´Ð°ÑŽÑ‚ impression of unfinished documentation.

---

## 9. ðŸŸ¡ Disconnected functions â€” services exist, no UI

(ÐŸÐ¾Ð´Ñ€Ð¾Ð±Ð½Ð¾ Ð² Integration Map Ð¸ Capability Gap Map)

| Ð¡ÐµÑ€Ð²Ð¸Ñ | Exists in code | UI exposure |
|---|---|---|
| `crystalVault` | âœ… kernel/services/crystal-vault/ | âœ… CrystalVaultPanel |
| `synthesisEngine` | âœ… kernel/services/synthesis/ | âœ… SynthesisPanel |
| `lensEngine` | âœ… kernel/services/lens-engine/ | âœ… LensesPanel |
| `timeMachineService` | âœ… kernel/services/time-machine/ | âœ… TimeMachinePanel |
| `forumService` | âœ… kernel/services/forum/ | âœ… ForumPanel |
| `directorService` | âœ… kernel/services/director/ | âœ… DirectorPanel |
| `memoryOrchestrator` | âœ… kernel/services/memory-orchestrator.ts | âœ… Ñ‡ÐµÑ€ÐµÐ· MemoryPanel |
| `wikiBrain` (23 files) | âœ… kernel/services/wiki-brain/ | ðŸŸ¡ WikiBrainPanel separate, WikiPanel Ð½Ðµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ |
| `wikiIngestService` | âœ… kernel/services/wiki-brain/wiki-ingest.service.ts | ðŸ”´ **NO UI** (Journey 1 Ñ‚ÑƒÐ¿Ð¸Ðº) |
| `wikiGraphService` | âœ… kernel/services/wiki-brain/wiki-graph.service.ts | ðŸŸ¡ WikiBrainPanel only |
| `agentMemory` table | âœ… Dexie schema | ðŸ”´ **NO UI** (Capability Gap Â§5.1) |
| `eventBus.getSubscriptionStats()` | âœ… event-bus.ts method | ðŸ”´ **NO UI** (ÑÐ¼. Lifecycle Map) |
| `MemoryWatchdog` | âœ… kernel/utils/memory-watchdog.ts | ðŸ”´ **Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ…** |

**4 ÐºÐ»ÑŽÑ‡ÐµÐ²Ñ‹Ñ… services Ð±ÐµÐ· UI exposure:**
1. `wikiIngestService` â€” WikiPanel read-only, Ð½ÐµÑ‚ create article UI
2. `agentMemory` table â€” schema ÐµÑÑ‚ÑŒ, UI Ð½ÐµÑ‚
3. `eventBus.getSubscriptionStats()` â€” Ð¼ÐµÑ‚Ð¾Ð´ ÐµÑÑ‚ÑŒ, Ð½Ðµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ð² UI
4. `MemoryWatchdog` â€” heap data Ð² Ð»Ð¾Ð³Ð°Ñ…, Ð½Ðµ Ð² UI

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¡ **WIRE to UI** (ÑÐ¼. Capability Gap Map Â§11, Opportunity Map 3.4, 3.22)

---

## 10. ðŸŸ¢ TODOs â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 2 (Ð¼Ð¸Ð½Ð¸Ð¼ÑƒÐ¼)

(Ð˜Ð· Tech Health Map Â§3.3)

**2 TODOs Ð²Ð¾ Ð²ÑÑ‘Ð¼ src/:**

1. `src/components/AppLayout.tsx:4`:
   ```typescript
   // TODO: CommandPalette and OnboardingWizard still synchronously import framer-motion (via their own imports).
   // To fully remove framer-motion from the critical path, split useCommandPalette into a separate file,
   // then wrap CommandPalette and OnboardingWizard with React.lazy + Suspense.
   ```

2. `src/kernel/services/config-registry.ts:145`:
   ```typescript
   // TODO: Per-model limits â€” FreeTierLimit type needs refactoring
   ```

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** Unfinished refactoring work.

**Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸:**
- TODO #1: CommandPalette, OnboardingWizard, framer-motion cleanup
- TODO #2: FreeTierLimit type

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¢ **DOCUMENT + schedule** â€” Ð¾Ð±Ð° manageable, Ð½Ðµ critical.

---

## 11. ðŸŸ¡ Commented-out code â€” autodiscovery off

(Ð˜Ð· Zone-1 audit)

Ð’ Zone 1 audit ÑƒÐ¿Ð¾Ð¼ÑÐ½ÑƒÑ‚Ð¾: Â«ÐÐ²Ñ‚Ð¾Ð´Ð¸ÑÐºÐ°Ð²ÐµÑ€Ð¸ Ð¼Ð¾Ð´ÐµÐ»ÐµÐ¹ Ð²Ñ‹ÐºÐ»ÑŽÑ‡ÐµÐ½Ð¾ ÐºÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸ÐµÐ¼Â».

**ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ:** Feature ÑÑƒÑ‰ÐµÑÑ‚Ð²Ð¾Ð²Ð°Ð»Ð°, Ð±Ñ‹Ð»Ð° Ð¾Ñ‚ÐºÐ»ÑŽÑ‡ÐµÐ½Ð°.

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ:** ðŸŸ¡ **INVESTIGATE** â€” Ð¿Ð¾Ñ‡ÐµÐ¼Ñƒ Ð²Ñ‹ÐºÐ»ÑŽÑ‡ÐµÐ½Ð¾? Bug Ð¸Ð»Ð¸ intentional?

---

## 12. Ð¡Ð²Ð¾Ð´Ð½Ð°Ñ Ð¼Ð°Ñ‚Ñ€Ð¸Ñ†Ð° Ð¼Ñ‘Ñ€Ñ‚Ð²Ð¾Ð³Ð¾ ÐºÐ¾Ð´Ð°

| # | ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ | ÐšÐ¾Ð»-Ð²Ð¾ | LOC | Severity | Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ |
|---|---|---:|---:|---|---|
| 1 | `@deprecated MOCK` ÑÐµÑ€Ð²Ð¸ÑÑ‹ | 5 | ~2 000 | ðŸ”´ HIGH | HIDE/REMOVE/REPLACE |
| 2 | DemoGated Ð¿Ð°Ð½ÐµÐ»Ð¸ | 3 | 1 739 | ðŸŸ¡ MED | HIDE Ð·Ð° featureFlag |
| 3 | Orphan ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ñ‹ | ~15 | ~3 000 | ðŸŸ¡ MED | INVESTIGATE |
| 4 | `rivals/` subdirs | 19 dirs | ~17 500 | ðŸŸ¡ MED | MOVE Ð² experimental |
| 5 | ÐŸÑƒÑÑ‚Ñ‹Ðµ dev-status-*.md | 5 | ~50 | ðŸŸ¡ MED | FILL Ð¸Ð»Ð¸ REMOVE |
| 6 | Experimental Ð±ÐµÐ· badge | 2 | ~1 500 | ðŸŸ¡ LOW | ADD badge |
| 7 | Disconnected services | 4 | â€” | ðŸŸ¡ MED | WIRE to UI |
| 8 | TODOs | 2 | â€” | ðŸŸ¢ LOW | SCHEDULE |
| 9 | Commented-out code | (Zone 1) | â€” | ðŸŸ¡ LOW | INVESTIGATE |
| **Total** | **~210+ Ñ„Ð°Ð¹Ð»Ð¾Ð²** | **~25 000 LOC** | â€” | â€” |

**5% Ð¾Ñ‚ 509K LOC â€” Ð² Ð¿Ñ€ÐµÐ´ÐµÐ»Ð°Ñ… Ð½Ð¾Ñ€Ð¼Ñ‹ Ð´Ð»Ñ Ð·Ñ€ÐµÐ»Ð¾Ð³Ð¾ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°, Ð½Ð¾ Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ cleanup.**

---

## 13. Investigation framework â€” Ð´Ð»Ñ ÐºÐ°Ð¶Ð´Ð¾Ð³Ð¾ Ð¿ÑƒÐ½ÐºÑ‚Ð°

**ÐŸÐµÑ€ÐµÐ´ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¸ÐµÐ¼/Ð¸Ð·Ð¼ÐµÐ½ÐµÐ½Ð¸ÐµÐ¼ â€” Ð¾Ñ‚Ð²ÐµÑ‚Ð¸Ñ‚ÑŒ Ð½Ð° 5 Ð²Ð¾Ð¿Ñ€Ð¾ÑÐ¾Ð²:**

1. **ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ** â€” Ð·Ð°Ñ‡ÐµÐ¼ ÑÑ‚Ð¾Ñ‚ ÐºÐ¾Ð´ Ð±Ñ‹Ð» Ð½Ð°Ð¿Ð¸ÑÐ°Ð½?
2. **Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸** â€” ÐºÑ‚Ð¾ ÐµÐ³Ð¾ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚? (grep imports)
3. **Tests** â€” ÐµÑÑ‚ÑŒ Ð»Ð¸ test file? Ð§Ñ‚Ð¾ Ð¾Ð½ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÑÐµÑ‚?
4. **Wiki** â€” ÑƒÐ¿Ð¾Ð¼ÑÐ½ÑƒÑ‚ Ð² Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð°Ñ†Ð¸Ð¸?
5. **Recent activity** â€” Ð±Ñ‹Ð» Ð¸Ð·Ð¼ÐµÐ½Ñ‘Ð½ Ð½ÐµÐ´Ð°Ð²Ð½Ð¾? (git log)

**Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ð¿Ð¾ÑÐ»Ðµ Ð¾Ñ‚Ð²ÐµÑ‚Ð¾Ð² â€” Ñ€ÐµÑˆÐµÐ½Ð¸Ðµ:**

| Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚ | Ð£ÑÐ»Ð¾Ð²Ð¸Ðµ | Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ |
|---|---|---|
| ðŸŸ¢ KEEP | Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ, Ð¿Ð¾Ð»ÐµÐ·Ð½Ð¾ | ÐÐ¸Ñ‡ÐµÐ³Ð¾ Ð½Ðµ Ð´ÐµÐ»Ð°Ñ‚ÑŒ |
| ðŸŸ¡ HIDE | Mock/experimental, visible | Feature flag, badge |
| ðŸŸ¡ DOCUMENT | ÐÐ°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ Ð½Ðµ Ð¾Ñ‡ÐµÐ²Ð¸Ð´Ð½Ð¾ | Wiki article, code comments |
| ðŸŸ¡ REPLACE | Mock Ñ real implementation needed | Ð ÐµÐ°Ð»Ð¸Ð·Ð¾Ð²Ð°Ñ‚ÑŒ Ð·Ð°Ð½Ð¾Ð²Ð¾ |
| ðŸ”´ REMOVE | ÐŸÐ¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´Ñ‘Ð½Ð½Ñ‹Ð¹ dead, Ð½ÐµÑ‚ dependents | Delete + remove route |

---

## 14. Ð¢Ð¾Ð¿-10 priority investigations

| # | Ð§Ñ‚Ð¾ | ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ investigate first |
|---|---|---|
| 1 | `DebatePanel/DebateMemoryPanel.tsx` | ÐœÐ¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ half-implemented debateâ†”memory (Integration Map Â§3.8) |
| 2 | `DeployPanel` (782 ÑÑ‚Ñ€Ð¾ÐºÐ¸, MOCK) | Largest mock panel, visible Ð² nav |
| 3 | `rivals/` 19 subdirs | ~17 500 LOC, Ð½ÑƒÐ¶Ð½Ð¾ audit imports |
| 4 | `HealthSlaPanel` (441, MOCK) | Mock + overlap Ñ HealthPanel |
| 5 | `DistillationPanel` (516, MOCK) | Mock, Ð½Ð¾ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ future feature |
| 6 | `agentMemory` Dexie table | Schema ÐµÑÑ‚ÑŒ, 0 UI â€” unfinished |
| 7 | `wikiIngestService` Ð±ÐµÐ· UI | Service ÐµÑÑ‚ÑŒ, WikiPanel read-only |
| 8 | `obs-gaps-service` STATIC | Static snapshot, Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ ÑƒÑÑ‚Ð°Ñ€ÐµÐ²ÑˆÐ¸Ð¼ |
| 9 | 5 Ð¿ÑƒÑÑ‚Ñ‹Ñ… `dev-status-*.md` | Impression of unfinished docs |
| 10 | `WizardStepIndicator`, `WizardNav`, wizard steps | DebatePanel wizard orphans |

---

## 15. Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ð¸ â€” Ð±ÐµÐ· auto-delete

### ðŸ”´ P0 â€” investigate + decide (high priority)

1. **Audit `rivals/` 19 subdirs** â€” Ð´Ð»Ñ ÐºÐ°Ð¶Ð´Ð¾Ð³Ð¾ Ñ„Ð°Ð¹Ð»Ð° Ð¾Ð¿Ñ€ÐµÐ´ÐµÐ»Ð¸Ñ‚ÑŒ: registered Ð² service-registration? Ð˜Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÐµÑ‚ÑÑ canonical ÐºÐ¾Ð´Ð¾Ð¼? Ð•ÑÐ»Ð¸ Ð½ÐµÑ‚ â€” move Ð² `src/experimental/rivals/` Ð¸Ð»Ð¸ delete.

2. **Investigate `DebatePanel/DebateMemoryPanel.tsx`** â€” Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ half-implemented debateâ†”memory integration. Ð•ÑÐ»Ð¸ Ð´Ð° â€” Ð»Ð¸Ð±Ð¾ Ð·Ð°Ð²ÐµÑ€ÑˆÐ¸Ñ‚ÑŒ, Ð»Ð¸Ð±Ð¾ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ + Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ ÐºÐ°Ðº cancelled feature.

3. **Hide 3 DemoGated panels** Ð·Ð° `featureFlags.mockServices.enabled = false` Ð¿Ð¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ. DeployPanel, HealthSlaPanel, DistillationPanel â€” visible Ð² nav, Ð½Ð¾ mock.

4. **Remove `HealthSlaPanel`** (441 ÑÑ‚Ñ€Ð¾ÐºÐ° MOCK) â€” Ð»Ð¸Ð±Ð¾ merge Ð² HealthPanel Ñ Ñ‚Ð°Ð±Ð¾Ð¼, Ð»Ð¸Ð±Ð¾ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ. Ð ÐµÐ°Ð»ÑŒÐ½Ð¾Ð¹ SLA Ð½ÐµÑ‚.

### ðŸŸ¡ P1 â€” wire disconnected services

5. **Wire `wikiIngestService` to WikiPanel UI** â€” Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Â«Create articleÂ» button (ÑÐ¼. Opportunity Map 3.4).

6. **Wire `agentMemory` table to UI** â€” Ñ‚Ð°Ð± Ð² AgentsPanel Â«Memory written by this agentÂ» (ÑÐ¼. Opportunity Map 3.22).

7. **Wire `eventBus.getSubscriptionStats()` to UI** â€” Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Ð² HealthPanel Ð¸Ð»Ð¸ Ð½Ð¾Ð²Ð¾Ð¹ BackgroundServicesPanel.

8. **Wire `MemoryWatchdog` to UI** â€” Ð²Ñ‹Ð²ÐµÑÑ‚Ð¸ heap data Ð² HealthPanel, Ð½Ðµ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ….

### ðŸŸ¡ P1 â€” orphan components audit

9. **Audit 15 orphan components** â€” Ð´Ð»Ñ ÐºÐ°Ð¶Ð´Ð¾Ð³Ð¾: Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ñ‡ÐµÑ€ÐµÐ· props? Half-implemented? Genuinely abandoned? Ð ÐµÑˆÐµÐ½Ð¸Ðµ per-file.

10. **Audit DashboardPanel sections** (InferenceMesh, LiveTerminal, ProviderPressureMap, RoutingActivity) â€” part of Desktop.tsx? Ð•ÑÐ»Ð¸ Ð½ÐµÑ‚ â€” investigate.

11. **Audit DebatePanel wizard steps** (AgentsStep, TopicStep, AutoDebateSection, WizardStepIndicator, WizardNav) â€” Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ DebateSetupWizard? Ð•ÑÐ»Ð¸ Ð½ÐµÑ‚ â€” investigate.

### ðŸŸ¢ P2 â€” documentation + badges

12. **Add experimental badges** Ð² UI Ð´Ð»Ñ Aquarium, FederatedMemory.

13. **Fill 5 Ð¿ÑƒÑÑ‚Ñ‹Ñ… `dev-status-*.md`** Ð¸Ð»Ð¸ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¸Ð· wiki-Ð¼ÐµÐ½ÑŽ.

14. **Document `@deprecated MOCK` services** Ð² wiki â€” Ñ‡Ñ‚Ð¾ mock, Ñ‡Ñ‚Ð¾ real.

15. **Schedule 2 TODOs** â€” framer-motion cleanup (AppLayout) Ð¸ FreeTierLimit refactor (config-registry).

---

## 16. Ð˜Ñ‚Ð¾Ð³Ð¾Ð²Ñ‹Ð¹ Ð²ÐµÑ€Ð´Ð¸ÐºÑ‚ Ð¿Ð¾ Ð¼Ñ‘Ñ€Ñ‚Ð²Ð¾Ð¼Ñƒ ÐºÐ¾Ð´Ñƒ

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | ÐžÑ†ÐµÐ½ÐºÐ° | ÐšÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¹ |
|---|:---:|---|
| `@deprecated MOCK` services | ðŸ”´ 3/10 | 5 explicit mock backends, 3 visible Ð² UI |
| DemoGated panels | ðŸŸ¡ 5/10 | 3 panels, 1 739 ÑÑ‚Ñ€Ð¾Ðº, visible |
| Orphan components | ðŸŸ¡ 6/10 | ~15 orphans, ~3 000 LOC |
| `rivals/` subdirs | ðŸŸ¡ 5/10 | 19 dirs, ~17 500 LOC research parallel |
| ÐŸÑƒÑÑ‚Ñ‹Ðµ dev-status docs | ðŸŸ¡ 5/10 | 5 Ð·Ð°Ð³Ð»ÑƒÑˆÐµÐº |
| Experimental Ð±ÐµÐ· badge | ðŸŸ¡ 6/10 | 2 panels, Ð¿Ð¾Ð¼ÐµÑ‡ÐµÐ½Ñ‹ Ð² ÐºÐ¾Ð´Ðµ |
| Disconnected services | ðŸŸ¡ 5/10 | 4 key services Ð±ÐµÐ· UI |
| TODOs | ðŸŸ¢ 9/10 | 2 TODOs Ð½Ð° 509K LOC â€” Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ð¾ |
| Commented-out code | ðŸŸ¡ 6/10 | autodiscovery off (Zone 1) |
| **Overall Dead Code Score** | **5.5/10** | ~25K LOC Ð¸Ð· 509K = 5%, Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ cleanup |

**Ð¡Ð¸Ð»ÑŒÐ½Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **Ð¢Ð¾Ð»ÑŒÐºÐ¾ 2 TODOs** Ð½Ð° 509K LOC â€” exceptionally Ñ‡Ð¸ÑÑ‚Ð¾
- **0 circular deps** (ÑÐ¼. Dependencies Map)
- **DemoGate/DemoBadge infrastructure** â€” mock panels ÑÐ²Ð½Ð¾ Ð¿Ð¾Ð¼ÐµÑ‡ÐµÐ½Ñ‹ Ð² ÐºÐ¾Ð´Ðµ
- **Feature flags** Ð´Ð»Ñ experimental (`ui.experimentalVisuals`, `mockServices.enabled`)
- **`@deprecated MOCK` markers** â€” explicit, Ð½Ðµ ÑÐºÑ€Ñ‹Ñ‚Ñ‹Ðµ
- **Wiki Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€ÑƒÐµÑ‚** HealthSlaService ÐºÐ°Ðº MOCK

**Ð¡Ð»Ð°Ð±Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **3 DemoGated panels visible Ð² nav** â€” Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð²Ð¸Ð´Ð¸Ñ‚ mock Ð±ÐµÐ· Ð¿Ñ€ÐµÐ´ÑƒÐ¿Ñ€ÐµÐ¶Ð´ÐµÐ½Ð¸Ñ Ð² sidebar
- **5 `@deprecated MOCK` services** â€” 2 000 LOC mock code Ð² production codebase
- **~15 orphan components** â€” Ð½Ð°Ð¿Ð¸ÑÐ°Ð½Ñ‹, Ð½Ðµ wired
- **19 `rivals/` subdirs** â€” ~17 500 LOC research parallel, Ð½Ðµ canonical
- **5 Ð¿ÑƒÑÑ‚Ñ‹Ñ… dev-status-*.md** â€” impression of unfinished docs
- **4 disconnected services** â€” exist Ð² ÐºÐ¾Ð´Ðµ, Ð½Ðµ wired to UI
- **2 experimental panels Ð±ÐµÐ· UI badge**

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ð²Ñ‹Ð²Ð¾Ð´:** Ð¿Ñ€Ð¾ÐµÐºÑ‚ Ð½Ð°ÐºÐ¾Ð¿Ð¸Ð» **~25K LOC Ð¼Ñ‘Ñ€Ñ‚Ð²Ð¾Ð³Ð¾/Ð·Ð°Ð±Ñ€Ð¾ÑˆÐµÐ½Ð½Ð¾Ð³Ð¾ ÐºÐ¾Ð´Ð°** (5% Ð¾Ñ‚ 509K) â€” Ð² Ð¿Ñ€ÐµÐ´ÐµÐ»Ð°Ñ… Ð½Ð¾Ñ€Ð¼Ñ‹ Ð´Ð»Ñ Ð·Ñ€ÐµÐ»Ð¾Ð³Ð¾ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°, Ð½Ð¾ Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ systematic cleanup. **Ð“Ð»Ð°Ð²Ð½Ð¾Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð¾ (Ð¸Ð· Ð·Ð°Ð´Ð°Ð½Ð¸Ñ): Ð½Ðµ ÑƒÐ´Ð°Ð»ÑÑ‚ÑŒ Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸** â€” ÐºÐ°Ð¶Ð´Ñ‹Ð¹ Ð¿ÑƒÐ½ÐºÑ‚ Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ investigation: Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ, Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸, Ñ‚ÐµÑÑ‚Ñ‹, wiki, recent activity.

**Dead Code Score: 5.5/10** â€” ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾. ÐŸÐ¾ÑÐ»Ðµ cleanup (opportunities Ð¸Ð· Opportunity Map 3.7, 3.12, 3.15, 3.17) â€” Ð¿Ð¾Ð´Ð½Ð¸Ð¼ÐµÑ‚ÑÑ Ð´Ð¾ ~7.5/10.

**Ð¡Ñ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ñ‡ÐµÑÐºÐ¾Ðµ Ð½Ð°Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ðµ:**
1. **Investigate first** â€” Ð´Ð»Ñ ÐºÐ°Ð¶Ð´Ð¾Ð³Ð¾ Ð¿ÑƒÐ½ÐºÑ‚Ð° Ð²Ñ‹ÑÑÐ½Ð¸Ñ‚ÑŒ Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ Ð¸ Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸
2. **Hide mock panels** Ð·Ð° featureFlag
3. **Move rivals/ Ð² experimental**
4. **Wire disconnected services** to UI
5. **Document or remove** Ð¿ÑƒÑÑ‚Ñ‹Ðµ docs Ð¸ orphans

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ A. Ð’ÑÐµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ Ð¼Ñ‘Ñ€Ñ‚Ð²Ð¾Ð³Ð¾ ÐºÐ¾Ð´Ð° Ð² Ñ†Ð¸Ñ„Ñ€Ð°Ñ…

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº |
|---|---:|---|
| `@deprecated MOCK` services | 5 | `grep -rE "@deprecated MOCK"` |
| `@deprecated STATIC` services | 1 (obs-gaps) | grep |
| `@deprecated` (other) | 2 (key-fingerprints method, styles) | grep |
| DemoGated panels | 3 | `grep -rlE "DemoGate\|DemoBadge"` |
| DemoGated panels LOC | 1 739 | DeployPanel 782 + HealthSlaPanel 441 + DistillationPanel 516 |
| Orphan components (confirmed) | ~15 | grep per file |
| Orphan components LOC | ~3 000 | estimate |
| `rivals/` subdirs | 19 | `ls src/kernel/services/ \| grep rivals` |
| `rivals/` files | ~175 | find per subdir |
| `rivals/` LOC | ~17 500 | estimate (175 Ã— ~100) |
| ÐŸÑƒÑÑ‚Ñ‹Ðµ dev-status-*.md | 5 | WebFetch |
| Experimental panels Ð±ÐµÐ· UI badge | 2 | Aquarium, FederatedMemory |
| Disconnected services Ð±ÐµÐ· UI | 4 | wikiIngest, agentMemory, getSubscriptionStats, MemoryWatchdog |
| TODOs | 2 | grep (ÑÐ¼. Tech Health Map) |
| Commented-out features | 1+ (autodiscovery) | Zone-1 audit |
| **Total dead/abandoned files** | **~210+** | sum |
| **Total dead/abandoned LOC** | **~25 000** | sum |
| % Ð¾Ñ‚ total LOC | **~5%** | 25K / 509K |

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ B. Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð¸ Ð¼ÐµÑ‚Ð¾Ð´

| Ð§Ñ‚Ð¾ | Ð“Ð´Ðµ | ÐšÐ°Ðº Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ |
|---|---|---|
| `@deprecated MOCK` | `src/kernel/services/*.ts` | `grep -rE "@deprecated MOCK"` |
| DemoGated panels | `src/components/**/*.tsx` | `grep -rlE "DemoGate\|DemoBadge"` |
| Orphan components | `src/components/**/*.tsx` | `grep -rE "import.*BaseName"` per file |
| `rivals/` subdirs | `src/kernel/services/` | `ls \| grep rivals` |
| ÐŸÑƒÑÑ‚Ñ‹Ðµ dev-status | `docs/wiki/dev-status-*.md` | WebFetch (5 Ñ„Ð°Ð¹Ð»Ð¾Ð² â€” Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ») |
| Experimental panels | `src/components/{Aquarium,FederatedMemory}*/` | Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ head comments |
| Disconnected services | cross-reference Integration Map + Capability Gap Map | synthesis |
| TODOs | `src/**` | `grep -rE "TODO"` (ÑÐ¼. Tech Health Map) |
| Commented-out | Zone-1 audit | Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ zone-1.md |
| `agentMemory` table | `src/kernel/services/dexie-schema.ts` | grep |
| `eventBus.getSubscriptionStats` | `src/kernel/events/event-bus.ts` | grep (1 ref Ð² ÐºÐ¾Ð´Ðµ) |
| `MemoryWatchdog` | `src/kernel/utils/memory-watchdog.ts` | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |

---

*ÐžÑ‚Ñ‡Ñ‘Ñ‚ ÑÐ³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð¾Ð²Ð°Ð½ 2026-10-31 Ð½Ð° Ð¾ÑÐ½Ð¾Ð²Ðµ ÐºÐ¾Ð¼Ð¼Ð¸Ñ‚Ð° `e08ab8e*. ÐÐ½Ð°Ð»Ð¸Ð· ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹; **Ð½Ð¸Ñ‡ÐµÐ³Ð¾ Ð½Ðµ ÑƒÐ´Ð°Ð»ÐµÐ½Ð¾** â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ investigation framework. ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð¾Ñ‚Ñ‡Ñ‘Ñ‚Ñ‹: 12 Ð¿Ñ€ÐµÐ´Ñ‹Ð´ÑƒÑ‰Ð¸Ñ… ÐºÐ°Ñ€Ñ‚ (Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚ÑŒ, Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚ÑŒ, Ñ‚ÐµÑ…ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ, Ñ€ÐµÑÑƒÑ€ÑÑ‹, Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ, Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸, lifecycle, Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾ÑÑ‚ÑŒ, Ð¿Ñ€Ð¾Ð±ÐµÐ»Ñ‹, Ð¸Ð½Ñ‚ÐµÐ³Ñ€Ð°Ñ†Ð¸Ñ, user journeys, Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»).*
