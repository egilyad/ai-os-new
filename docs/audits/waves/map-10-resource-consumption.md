# ÐšÐ°Ñ€Ñ‚Ð° Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ñ Ñ€ÐµÑÑƒÑ€ÑÐ¾Ð² â€” Resource Consumption Map
## SuperAgents OS (`egilyad/ai-os-new`)

> **Ð’ÐµÑ€ÑÐ¸Ñ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°:** commit `e08ab8e` (Oct 31, 2026, Ð²ÐµÑ‚ÐºÐ° `main`)
> **Ð”Ð°Ñ‚Ð° Ð°Ð½Ð°Ð»Ð¸Ð·Ð°:** 2026-10-31
> **ÐœÐµÑ‚Ð¾Ð´:** ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð· ÐºÐ¾Ð´Ð° + Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ `route-imports.ts`, `kernel/instances/`, `kernel/bootstrap*.ts`, `kernel/service-registration/phase*.ts`, `usePolling` hook, Ð¿Ð¾Ð¸ÑÐº `setInterval`/`eventBus.on`/cleanup-Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ð¾Ð²
> **ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ñ‹:** Â«ÐšÐ°Ñ€Ñ‚Ð° Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ð¸ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹Â» + Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð¹ Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸Â» + Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ‚ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¾Ð³Ð¾ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÑÂ»
> **Ð’ÐÐ–ÐÐž:** **Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð½Ð¾Ð¹ Ð½Ð°Ð³Ñ€ÑƒÐ·ÐºÐ¸ Ð½ÐµÑ‚** â€” Ð¿Ñ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ Ð½Ðµ Ð·Ð°Ð¿ÑƒÑÐºÐ°Ð»Ð¾ÑÑŒ. Ð’ÐµÐ·Ð´Ðµ Ð½Ð¸Ð¶Ðµ ÑÑ‚Ð¾ **Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»ÑŒÐ½Ð°Ñ** Ð½Ð°Ð³Ñ€ÑƒÐ·ÐºÐ° Ð¸ **Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ñ‹** (Ñ‡Ñ‚Ð¾ ÐºÐ¾Ð´ Ð¾Ð±ÑŠÑÐ²Ð»ÑÐµÑ‚), Ð° Ð½Ðµ Ñ€ÐµÐ°Ð»ÑŒÐ½Ñ‹Ðµ Ñ†Ð¸Ñ„Ñ€Ñ‹ heap/CPU/network. ÐšÐ°Ð¶Ð´Ñ‹Ð¹ Ñ€Ð°Ð·Ð´ÐµÐ» ÑÐ²Ð½Ð¾ Ñ€Ð°Ð·Ð´ÐµÐ»ÑÐµÑ‚ ÑÑ‚Ð¸ Ð¿Ð¾Ð½ÑÑ‚Ð¸Ñ.

---

## 1. Ð˜ÑÐ¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾Ðµ Ñ€ÐµÐ·ÑŽÐ¼Ðµ

SuperAgents OS â€” Ð±Ñ€Ð°ÑƒÐ·ÐµÑ€Ð½Ð¾Ðµ Ð¿Ñ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ Ñ **Ð»ÐµÐ½Ð¸Ð²Ð¾Ð¹ Ð·Ð°Ð³Ñ€ÑƒÐ·ÐºÐ¾Ð¹ 209 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹** (Ð¸Ð· 268) Ñ‡ÐµÑ€ÐµÐ· `React.lazy`, **407 lazyService-ÑÐ¸Ð½Ð³Ð»Ñ‚Ð¾Ð½Ð¾Ð²** ÑÐ´Ñ€Ð°, **549 Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸ÑÐ¼Ð¸ ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²** Ð² 81 phase-Ñ„Ð°Ð¹Ð»Ðµ, Ð¸ **8-tier** Ð¿Ð¾ÑÐ»ÐµÐ´Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾Ð¹ Ð¸Ð½Ð¸Ñ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸ÐµÐ¹ Ð¿Ñ€Ð¸ ÑÑ‚Ð°Ñ€Ñ‚Ðµ. Ð’ Ñ„Ð¾Ð½Ðµ Ð¿Ð¾ÑÑ‚Ð¾ÑÐ½Ð½Ð¾ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‚ **15+ ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ñ `setInterval`** (heartbeat, cleanup, snapshot, monitor). 79 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÑŽÑ‚ polling (Ð² Ð¾ÑÐ½Ð¾Ð²Ð½Ð¾Ð¼ 5â€“15 ÑÐµÐº), `usePolling` ÐºÐ¾Ñ€Ñ€ÐµÐºÑ‚Ð½Ð¾ Ð°Ð²Ñ‚Ð¾-Ð¿Ð°ÑƒÐ·Ð¸Ñ‚ÑÑ Ð¿Ñ€Ð¸ ÑÐºÑ€Ñ‹Ñ‚Ð¾Ð¹ Ð²ÐºÐ»Ð°Ð´ÐºÐµ.

**Ð¡Ð²Ð¾Ð´Ð½Ñ‹Ðµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ Ñ€ÐµÑÑƒÑ€ÑÐ¾Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð»ÐµÐ½Ð¸Ñ (Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»ÑŒÐ½Ñ‹Ðµ):**

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð¢Ð¸Ð¿ |
|---|---:|---|
| Lazy-Ð·Ð°Ð³Ñ€ÑƒÐ¶Ð°ÐµÐ¼Ñ‹Ñ… Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | **209 / 268** | POTENTIAL â€” Ð±Ð»Ð°Ð³Ð¾ |
| Eager-Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¾Ð² Ð² route-imports | **3** (ErrorBoundary, Skeleton, TECHNIQUE_PANEL_COMPONENTS) | POTENTIAL â€” Ð¼Ð¸Ð½Ð¸Ð¼ÑƒÐ¼ |
| lazyService-ÑÐ¸Ð½Ð³Ð»Ñ‚Ð¾Ð½Ð¾Ð² ÑÐ´Ñ€Ð° | **407** | POTENTIAL â€” Ð²ÑÐµ lazy |
| Service registrations (phases) | **549** Ð² 81 phase-Ñ„Ð°Ð¹Ð»Ðµ | POTENTIAL |
| Init tiers | **8** (Tier 0 â†’ Tier 7) | ARCHITECTURE |
| Background `setInterval` Ð² ÑÐµÑ€Ð²Ð¸ÑÐ°Ñ… | **39** (15+ Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ñ… Ñ‚Ð°Ð¹Ð¼ÐµÑ€Ð¾Ð²) | POTENTIAL â€” Ñ„Ð¾Ð½ |
| `usePolling` Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ… | **79** Ð²Ñ‹Ð·Ð¾Ð²Ð¾Ð² | POTENTIAL â€” polls |
| `eventBus.on` Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ… | **97** Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ¾Ðº Ð² 46 Ñ„Ð°Ð¹Ð»Ð°Ñ… | POTENTIAL â€” subs |
| Ð’ÑÐµÐ³Ð¾ `eventBus.*` Ð²Ñ‹Ð·Ð¾Ð²Ð¾Ð² | **997** | POTENTIAL |
| `useEffect` Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ… | **461** | POTENTIAL |
| `useEffect` Ñ cleanup | **77** (17%) | PATTERN â€” Ð²Ð½Ð¸Ð¼Ð°Ð½Ð¸Ðµ |
| Ð¢ÑÐ¶Ñ‘Ð»Ñ‹Ñ… Ð±Ð¸Ð±Ð»Ð¸Ð¾Ñ‚ÐµÐº Ð² use | framer-motion **165 Ñ„Ð°Ð¹Ð»Ð¾Ð²**, React Flow 6, vis-network 5, Monaco 2, TipTap 2, Mermaid 1 | POTENTIAL |
| Web Workers | **2** (`sandbox.worker`, `memory.worker`) | ARCHITECTURE |
| Zustand stores | **53** | POTENTIAL â€” in-memory state |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ð²Ñ‹Ð²Ð¾Ð´:** Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð° **Ð¿Ð¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ Ð»ÐµÐ½Ð¸Ð²Ð°Ñ** â€” 209/268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð½Ðµ Ð³Ñ€ÑƒÐ·ÑÑ‚ÑÑ, Ð¿Ð¾ÐºÐ° Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð¾Ñ‚ÐºÑ€Ð¾ÐµÑ‚ Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚. lazyService Ð³Ð°Ñ€Ð°Ð½Ñ‚Ð¸Ñ€ÑƒÐµÑ‚, Ñ‡Ñ‚Ð¾ 407 ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ð½Ðµ Ð¸Ð½ÑÑ‚Ð°Ð½Ñ†Ð¸Ñ€ÑƒÑŽÑ‚ÑÑ, Ð¿Ð¾ÐºÐ° Ð½Ðµ Ð·Ð°Ð¿Ñ€Ð¾ÑÑÑ‚. **Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ Ñ€ÐµÑÑƒÑ€ÑÐ½Ñ‹Ðµ Ñ€Ð¸ÑÐºÐ¸:**
1. **165 Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÑŽÑ‚ framer-motion** â€” Ð»Ð¸Ð±Ð° Ñ‚ÑÐ¶Ñ‘Ð»Ð°Ñ, Ñ‚Ð°Ñ‰Ð¸Ñ‚ÑÑ Ð² ÐºÐ°Ð¶Ð´Ñ‹Ð¹ chunk
2. **39 background `setInterval`** Ð² ÑÐµÑ€Ð²Ð¸ÑÐ°Ñ… â€” Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‚, Ð´Ð°Ð¶Ðµ ÐºÐ¾Ð³Ð´Ð° Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð·Ð°ÐºÑ€Ñ‹Ñ‚Ð°
3. **79 polling-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹** â€” Ð¿Ñ€Ð¸ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð¾Ð¹ Ð²ÐºÐ»Ð°Ð´ÐºÐµ ÐºÐ°Ð¶Ð´Ñ‹Ð¹ Ñ‚Ð¸Ðº = re-render + Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ DB query
4. **Ð¢Ð¾Ð»ÑŒÐºÐ¾ 17% useEffect Ð¸Ð¼ÐµÑŽÑ‚ cleanup** â€” Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»ÑŒÐ½Ñ‹Ðµ subscription leaks (Ð½Ð¾ Ð¼Ð½Ð¾Ð³Ð¸Ðµ useEffect one-shot, Ð½Ðµ Ð²ÑÐµ Ñ‚Ñ€ÐµÐ±ÑƒÑŽÑ‚ cleanup)
5. **549 service registrations** â€” ÐµÑÐ»Ð¸ Ð²ÑÐµ Tier 7 (Â«*Â») Ð¸Ð½ÑÑ‚Ð°Ð½Ñ†Ð¸Ñ€ÑƒÑŽÑ‚ÑÑ Ð¿Ñ€Ð¸ ÑÑ‚Ð°Ñ€Ñ‚Ðµ, ÑÑ‚Ð¾ Ð¼Ð½Ð¾Ð³Ð¾

**Resource Health: 6.5/10** â€” Ð»ÐµÐ½Ð¸Ð²Ð°Ñ Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð° Ñ…Ð¾Ñ€Ð¾ÑˆÐ°Ñ, Ð½Ð¾ Ñ„Ð¾Ð½Ð¾Ð²Ñ‹Ðµ Ñ‚Ð°Ð¹Ð¼ÐµÑ€Ñ‹ Ð¸ polling Ð¼Ð¾Ð³ÑƒÑ‚ Ð½Ð°ÐºÐ°Ð¿Ð»Ð¸Ð²Ð°Ñ‚ÑŒÑÑ. **Ð ÐµÐ°Ð»ÑŒÐ½Ð¾ Ð¸Ð·Ð¼ÐµÑ€Ð¸Ñ‚ÑŒ Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð±ÐµÐ· runtime.**

---

## 2. ÐœÐµÑ‚Ð¾Ð´Ð¾Ð»Ð¾Ð³Ð¸Ñ: 7 Ð²Ð¾Ð¿Ñ€Ð¾ÑÐ¾Ð² + Ñ€Ð°Ð·Ð´ÐµÐ»ÐµÐ½Ð¸Ðµ POTENTIAL vs MEASURED

### 2.1. Ð¡ÐµÐ¼ÑŒ Ð²Ð¾Ð¿Ñ€Ð¾ÑÐ¾Ð² (Ð¸Ð· Ð·Ð°Ð´Ð°Ð½Ð¸Ñ)

| # | Ð’Ð¾Ð¿Ñ€Ð¾Ñ | Ð§Ñ‚Ð¾ Ð°Ð½Ð°Ð»Ð¸Ð·Ð¸Ñ€ÑƒÐµÐ¼ |
|---|---|---|
| 1 | ÐšÐ°ÐºÐ¸Ðµ Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð·Ð°Ð³Ñ€ÑƒÐ¶Ð°ÑŽÑ‚ÑÑ Ð¾Ð´Ð½Ð¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾? | ÐÐºÑ‚Ð¸Ð²Ð½Ñ‹Ð¹ Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚ + layout + persistent panels |
| 2 | ÐšÐ°ÐºÐ¸Ðµ ÑÐµÑ€Ð²Ð¸ÑÑ‹ Ð¿Ð¾ÑÑ‚Ð¾ÑÐ½Ð½Ð¾ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‚? | `setInterval` Ð² ÑÐµÑ€Ð²Ð¸ÑÐ°Ñ…, ILifecycle.start(), background timers |
| 3 | Ð“Ð´Ðµ ÑÐ¾Ð·Ð´Ð°ÑŽÑ‚ÑÑ Ð»Ð¸ÑˆÐ½Ð¸Ðµ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸? | `eventBus.on` Ð±ÐµÐ· cleanup, Ð´ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ðµ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸ Ð½Ð° Ð¾Ð´Ð½Ð¾ ÑÐ¾Ð±Ñ‹Ñ‚Ð¸Ðµ |
| 4 | ÐšÐ°ÐºÐ¸Ðµ ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ñ‹ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÑŽÑ‚ Ð¼Ð½Ð¾Ð³Ð¾ Ð¿Ð°Ð¼ÑÑ‚Ð¸? | Ð¢ÑÐ¶Ñ‘Ð»Ñ‹Ðµ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ñ‹ (Monaco, Mermaid, React Flow), large state, in-memory caches |
| 5 | Ð“Ð´Ðµ Ð¿Ð¾Ð²Ñ‚Ð¾Ñ€ÑÑŽÑ‚ÑÑ Ð·Ð°Ð¿Ñ€Ð¾ÑÑ‹? | Polling Ð¾Ð´Ð½Ð¾Ð¹ Ð¸ Ñ‚Ð¾Ð¹ Ð¶Ðµ data Ð¸Ð· Ñ€Ð°Ð·Ð½Ñ‹Ñ… Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹, overlapping fetches |
| 6 | ÐšÐ°ÐºÐ¸Ðµ Ð¿Ñ€Ð¾Ñ†ÐµÑÑÑ‹ Ð¼Ð¾Ð¶Ð½Ð¾ Ð·Ð°Ð¿ÑƒÑÐºÐ°Ñ‚ÑŒ Ð»ÐµÐ½Ð¸Ð²Ð¾? | Eager imports, Tier 7 services, panels Ð±ÐµÐ· lazy |
| 7 | ÐšÐ°ÐºÐ¸Ðµ Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð¼Ð¾Ð¶Ð½Ð¾ Ð²Ñ‹Ð³Ñ€ÑƒÐ¶Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¸ Ð¾Ñ‚ÑÑƒÑ‚ÑÑ‚Ð²Ð¸Ð¸ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ñ? | Cleanup-pattern, unload-on-route-change feasibility |

### 2.2. Ð Ð°Ð·Ð´ÐµÐ»ÐµÐ½Ð¸Ðµ POTENTIAL vs MEASURED (ÑÐ²Ð½Ð¾ Ñ‚Ñ€ÐµÐ±Ð¾Ð²Ð°Ð»Ð¾ÑÑŒ)

| Ð¢Ð¸Ð¿ | Ð§Ñ‚Ð¾ ÑÑ‚Ð¾ | ÐšÐ°Ðº Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¾ |
|---|---|---|
| **POTENTIAL** | Ð§Ñ‚Ð¾ ÐºÐ¾Ð´ **Ð¼Ð¾Ð¶ÐµÑ‚** Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð»ÑÑ‚ÑŒ â€” ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð· Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¾Ð², Ñ‚Ð°Ð¹Ð¼ÐµÑ€Ð¾Ð², Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ¾Ðº | `grep`, `find`, Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ Ð¸ÑÑ…Ð¾Ð´Ð½Ð¸ÐºÐ¾Ð² |
| **PATTERN** | ÐšÐ°ÐºÐ¾Ð¹ **Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½** Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ â€” lazy vs eager, cleanup vs no-cleanup | Ð°Ð½Ð°Ð»Ð¸Ð· `useEffect`, `route-imports` |
| **EVIDENCE** | **Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾ Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ð°** â€” Ð½Ð°Ð¿Ñ€Ð¸Ð¼ÐµÑ€, `usePolling` auto-pauses on hidden tab | Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸ |
| **MEASURED** | Ð ÐµÐ°Ð»ÑŒÐ½Ñ‹Ðµ Ñ†Ð¸Ñ„Ñ€Ñ‹ heap/CPU/network Ð² runtime | **ÐÐ•Ð¢** â€” Ð¿Ñ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ Ð½Ðµ Ð·Ð°Ð¿ÑƒÑÐºÐ°Ð»Ð¾ÑÑŒ |

> **Ð’ÐµÐ·Ð´Ðµ Ð½Ð¸Ð¶Ðµ, Ð³Ð´Ðµ Ð½Ð°Ð¿Ð¸ÑÐ°Ð½Ð¾ Â«Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð»ÑÐµÑ‚ XÂ» â€” ÑÑ‚Ð¾ POTENTIAL.** Ð“Ð´Ðµ Ð½Ð°Ð¿Ð¸ÑÐ°Ð½Ð¾ Â«Ð´Ð¾ÐºÐ°Ð·Ð°Ð½Ð¾, Ñ‡Ñ‚Ð¾ YÂ» â€” ÑÑ‚Ð¾ EVIDENCE Ð¸Ð· ÐºÐ¾Ð´Ð°. Ð“Ð´Ðµ Ð½ÐµÑ‚ Ð´Ð°Ð½Ð½Ñ‹Ñ… â€” ÑÐ²Ð½Ð¾ Ð¾Ñ‚Ð¼ÐµÑ‡ÐµÐ½Ð¾ UNKNOWN.

---

## 3. Ð§Ñ‚Ð¾ Ð·Ð°Ð³Ñ€ÑƒÐ¶Ð°ÐµÑ‚ÑÑ Ð¿Ñ€Ð¸ ÑÑ‚Ð°Ñ€Ñ‚Ðµ Ð¿Ñ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ñ

### 3.1. Eager-Ð·Ð°Ð³Ñ€ÑƒÐ¶Ð°ÐµÐ¼Ð¾Ðµ (ÑÑ€Ð°Ð·Ñƒ Ð¿Ñ€Ð¸ `main.tsx`)

`src/App.tsx` (Ð¼Ð¸Ð½Ð¸Ð¼Ð°Ð»ÑŒÐ½Ñ‹Ð¹, 17 ÑÑ‚Ñ€Ð¾Ðº):

```tsx
const App: React.FC = () => (
    <ResponsiveShell>
        <AppLayout />
        <CommandPalette />
    </ResponsiveShell>
);
```

**Eager-Ð·Ð°Ð³Ñ€ÑƒÐ¶Ð°ÐµÐ¼Ñ‹Ðµ Ð¼Ð¾Ð´ÑƒÐ»Ð¸:**

| ÐœÐ¾Ð´ÑƒÐ»ÑŒ | Ð—Ð°Ñ‡ÐµÐ¼ | ÐžÑ†ÐµÐ½ÐºÐ° |
|---|---|---|
| `AppLayout` | Layout, Sidebar, routes | ðŸŸ¢ Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾ |
| `ResponsiveShell` | ÐÐ´Ð°Ð¿Ñ‚Ð¸Ð²Ð½Ð¾ÑÑ‚ÑŒ | ðŸŸ¢ Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾ |
| `CommandPalette` | Cmd+K palette | ðŸŸ¡ Ð¼Ð¾Ð¶Ð½Ð¾ lazy |
| `ErrorBoundary` (Common) | Error catching | ðŸŸ¢ Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾ |
| `PanelSkeleton` | Loading fallback | ðŸŸ¢ Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾ |
| `TECHNIQUE_PANEL_COMPONENTS` bundle | 62 technique panels registry | ðŸŸ¡ **Ð¼Ð¾Ð¶Ð½Ð¾ lazy** â€” ÑÐµÐ¹Ñ‡Ð°Ñ eager |

**Eager Ð±Ð°Ð½Ð´Ð»:** layout + sidebar + route registry (4 Ñ„Ð°Ð¹Ð»Ð° `route-registry-*.ts`) + i18n + 3 shared components + TECHNIQUE_PANEL_COMPONENTS. ÐžÑ†ÐµÐ½ÐºÐ° ~150â€“200 KB JS (POTENTIAL, Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾).

### 3.2. Bootstrap ÑÐ´Ñ€Ð° (8 tiers, Ð¿Ð¾ÑÐ»ÐµÐ´Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾)

`src/kernel/bootstrap.ts` + `bootstrap-phases.ts` â€” 8 tiers Ð¸Ð½Ð¸Ñ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸:

| Tier | Ð¡ÐµÑ€Ð²Ð¸ÑÑ‹ | ÐšÐ¾Ð³Ð´Ð° |
|---|---|---|
| **Tier 0** | `configService`, `logger` | no deps, first |
| **Tier 1** | `routerConfigManager`, `eventSourcingService`, `keyService`, `pricingService` | depends on config |
| **Tier 2** | `budgetService`, `keyStateStore`, `rotationService`, `keyVault` | depends on keyService |
| **Tier 3** | `providerRuntimeService`, `healthScoreService`, `probeService` | depends on keyStateStore |
| **Tier 4** | `groupManagerService`, `cacheService`, `policyService` | depends on probeService |
| **Tier 5** | `debateService`, `orchestrator`, `agentService`, `chatService`, `memoryOrchestrator`, `memoryService`, `advisorService`, `debateKnowledgeSync`, `contributionService`, `cognitiveIntelligenceService`, `pressureMapService` | application services |
| **Tier 6** | `memoryMcpServer`, `sessionMemoryService`, `workflowDistiller`, `embeddingService` | MCP + session |
| **Tier 7** | `*` (everything else) | remaining |

**CRITICAL_SERVICES** (must init): `kernel`, `configService`, `keyService`, `pricingService`.

**ÐÐ½Ð°Ð»Ð¸Ð·:**
- Tier 0â€“6 â€” **Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÑŒÐ½Ñ‹ Ð¿Ñ€Ð¸ ÑÑ‚Ð°Ñ€Ñ‚Ðµ** (â‰ˆ24 ÑÐµÑ€Ð²Ð¸ÑÐ°). POTENTIAL memory footprint: Ð·Ð½Ð°Ñ‡Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ñ‹Ð¹, Ð½Ð¾ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾.
- Tier 7 = `'*'` â€” **Ð²ÑÐµ Ð¾ÑÑ‚Ð°Ð»ÑŒÐ½Ñ‹Ðµ ÑÐµÑ€Ð²Ð¸ÑÑ‹ Ð¸Ð½ÑÑ‚Ð°Ð½Ñ†Ð¸Ñ€ÑƒÑŽÑ‚ÑÑ Ð¿Ñ€Ð¸ ÑÑ‚Ð°Ñ€Ñ‚Ðµ**. Ð­Ñ‚Ð¾ ~525 ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² (549 âˆ’ 24). **POTENTIAL risk:** ÐµÑÐ»Ð¸ Tier 7 Ð¸Ð½ÑÑ‚Ð°Ð½Ñ†Ð¸Ñ€ÑƒÐµÑ‚ Ð²ÑÑ‘, startup Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ Ñ‚ÑÐ¶Ñ‘Ð»Ñ‹Ð¼.
- lazyService **proxy** â€” ÑÐµÑ€Ð²Ð¸Ñ Ð½Ðµ ÑÐ¾Ð·Ð´Ð°Ñ‘Ñ‚ÑÑ, Ð¿Ð¾ÐºÐ° Ð½Ðµ Ð¿Ð¾Ð¿Ñ€Ð¾ÑÑÑ‚. ÐÐ¾ `LifecycleManager.startAll()` Ð¼Ð¾Ð¶ÐµÑ‚ Ð²Ñ‹Ð·Ð²Ð°Ñ‚ÑŒ `.start()` Ð½Ð° Ð²ÑÐµÑ… Ð·Ð°Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ñ…. **Ð­Ñ‚Ð¾ UNKNOWN** â€” Ð·Ð°Ð²Ð¸ÑÐ¸Ñ‚ Ð¾Ñ‚ Ñ‚Ð¾Ð³Ð¾, Ñ‡Ñ‚Ð¾ `startAll()` Ñ€ÐµÐ°Ð»ÑŒÐ½Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚.

### 3.3. ÐŸÐ°Ð½ÐµÐ»Ð¸, Ð·Ð°Ð³Ñ€ÑƒÐ¶Ð°ÐµÐ¼Ñ‹Ðµ Ð¾Ð´Ð½Ð¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾ (Ð½Ð° Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¾Ð¼ Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ðµ)

ÐŸÑ€Ð¸ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð¸Ð¸ Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð° `/chat`:

| Ð§Ñ‚Ð¾ Ð³Ñ€ÑƒÐ·Ð¸Ñ‚ÑÑ | Ð¢Ð¸Ð¿ | Ð¡Ñ‚Ð°Ñ‚ÑƒÑ |
|---|---|---|
| `AppLayout` + Sidebar + Topbar | eager | ðŸŸ¢ Ð²ÑÐµÐ³Ð´Ð° |
| `route-registry` (4 Ñ„Ð°Ð¹Ð»Ð°) | eager | ðŸŸ¢ Ð²ÑÐµÐ³Ð´Ð° |
| `ChatPanel.tsx` (609 ÑÑ‚Ñ€Ð¾Ðº) + subtree | lazy on demand | ðŸŸ¢ Ð¿Ñ€Ð¸ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð¸Ð¸ /chat |
| `ChatSidebar`, `ChatInputArea`, `ChatHeader`, `ChatMessagesSection`, `MarkdownRenderer`, `MermaidDiagram` | ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ñ‹ Ð²Ð½ÑƒÑ‚Ñ€Ð¸ ChatPanel | ðŸŸ¡ Ñ‚ÑÐ½ÑƒÑ‚ÑÑ Ð·Ð° ChatPanel |
| `MessageSearchPanel` (663 ÑÑ‚Ñ€Ð¾ÐºÐ¸) | conditional render | ðŸŸ¡ Ð¿Ñ€Ð¸ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð¸Ð¸ Ð¿Ð¾Ð¸ÑÐºÐ° |
| `ChatExportOverlay` | conditional render | ðŸŸ¡ Ð¿Ñ€Ð¸ ÑÐºÑÐ¿Ð¾Ñ€Ñ‚Ðµ |

**ÐŸÑ€Ð¸ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð¸Ð¸ `/debate`:** DebateArena + (lazy) DebatePanel + 9 Ð¿Ð¾Ð´ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð² + framer-motion (165 Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»ÑŒÐ½Ð¾, Ð½Ð¾ tree-shaking Ð´Ð¾Ð»Ð¶ÐµÐ½ ÑƒÐ¼ÐµÐ½ÑŒÑˆÐ¸Ñ‚ÑŒ).

**Simultaneous load: Ð¾Ð±Ñ‹Ñ‡Ð½Ð¾ 1 Ð¿Ð°Ð½ÐµÐ»ÑŒ + layout + shared services.** Ð­Ñ‚Ð¾ **Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾** â€” lazy-loading Ð´ÐµÐ»Ð°ÐµÑ‚ ÑÐ²Ð¾ÑŽ Ñ€Ð°Ð±Ð¾Ñ‚Ñƒ.

---

## 4. Ð¡ÐµÑ€Ð²Ð¸ÑÑ‹, Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‰Ð¸Ðµ Ð¿Ð¾ÑÑ‚Ð¾ÑÐ½Ð½Ð¾ (background)

### 4.1. Background `setInterval` Ð² ÑÐ´Ñ€Ðµ (POTENTIAL â€” Ð¿Ð¾ÑÑ‚Ð¾ÑÐ½Ð½Ð¾)

**39 `setInterval` Ð² `src/kernel/services/`**, 15+ Ð°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ñ… Ñ„Ð¾Ð½Ð¾Ð²Ñ‹Ñ… Ð¿Ñ€Ð¾Ñ†ÐµÑÑÐ¾Ð²:

| Ð¡ÐµÑ€Ð²Ð¸Ñ | Ð§Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ | Ð˜Ð½Ñ‚ÐµÑ€Ð²Ð°Ð» | Ð¡Ñ‚Ð¾Ð¿Ð°ÐµÑ‚ÑÑ? |
|---|---|---:|---|
| `agent-health-monitor` | heartbeat Ð°Ð³ÐµÐ½Ñ‚Ð¾Ð² | `HEARTBEAT_INTERVAL_MS` | ðŸŸ¢ probably on stop() |
| `logger-service` | flush persist buffer | 30 000 ms (30s) | ðŸŸ¢ `persistTimer` |
| `runtime-intelligence/diagnostic-service` | auto-diagnostics | ? | ðŸŸ¢ `autoInterval` |
| `runtime-intelligence/pressure-map-service` | refresh pressure | ? | ðŸŸ¢ `refreshInterval` |
| `truth-consistency-monitor` | check truth | ? | ðŸŸ¢ `checkTimer` |
| `chat-executor` | stale detection | ? | ðŸŸ¢ `_staleTimer` |
| `metrics-service` | cleanup old metrics | ? | ðŸŸ¢ `cleanupInterval` |
| `metrics-service` | capture metrics | ? | ðŸŸ¢ `captureInterval` |
| `advisor-service` | periodic suggestions | ? | ðŸŸ¢ `periodicInterval` |
| `blackboard-service` | evict expired | 30 000 ms | ðŸŸ¢ `cleanupTimer` |
| `orchestration-service` | heap log | 5 000 ms | ðŸŸ¡ `if (DEBUG)` gated |
| `monitoring-service` | snapshot | ? | ðŸŸ¢ `snapshotInterval` |
| `cache-service` | evict expired | 60 000 ms | ðŸŸ¢ `evictionTimer` |
| `rotation-service` | tick rotation | 60 000 ms | ðŸŸ¢ `monitorInterval` |
| `topology-manager` | check topology | ? | ðŸŸ¢ `checkInterval` |

**EVIDENCE:** Ð²ÑÐµ 15+ Ñ‚Ð°Ð¹Ð¼ÐµÑ€Ð¾Ð² Ð¸Ð¼ÐµÑŽÑ‚ **Ð¸Ð¼ÐµÐ½Ð¾Ð²Ð°Ð½Ð½Ñ‹Ðµ ÑÑÑ‹Ð»ÐºÐ¸** (`this.xxxTimer`), Ñ‡Ñ‚Ð¾ Ð¿Ð¾Ð·Ð²Ð¾Ð»ÑÐµÑ‚ cleanup. Ð­Ñ‚Ð¾ **Ñ…Ð¾Ñ€Ð¾ÑˆÐ¸Ð¹ Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½**.

**POTENTIAL risk:** ÑÑ‚Ð¸ Ñ‚Ð°Ð¹Ð¼ÐµÑ€Ñ‹ **Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‚, Ð´Ð°Ð¶Ðµ ÐµÑÐ»Ð¸ Ð½Ð¸ Ð¾Ð´Ð½Ð° Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð½Ðµ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð°**. ÐŸÐ¾ÑÐ»Ðµ `bootstrap.start()` Ð¾Ð½Ð¸ Ñ‚Ð¸ÐºÐ°ÑŽÑ‚, Ð¿Ð¾ÐºÐ° Ð¿Ñ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ Ð¶Ð¸Ð²Ð¾. ÐÐ° single-page app ÑÑ‚Ð¾ Ð½Ð¾Ñ€Ð¼Ð°Ð»ÑŒÐ½Ð¾, Ð½Ð¾ **15+ Ð¾Ð´Ð½Ð¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ñ‹Ñ… Ð¸Ð½Ñ‚ÐµÑ€Ð²Ð°Ð»Ð¾Ð²** â€” ÑÑ‚Ð¾ Ñ„Ð¾Ð½Ð¾Ð²Ð°Ñ CPU/IO Ð½Ð°Ð³Ñ€ÑƒÐ·ÐºÐ°.

### 4.2. `MemoryWatchdog` â€” Ð²ÑÑ‚Ñ€Ð¾ÐµÐ½Ð½Ñ‹Ð¹ Ð¼Ð¾Ð½Ð¸Ñ‚Ð¾Ñ€Ð¸Ð½Ð³

`src/kernel/utils/memory-watchdog.ts` â€” Ð»Ð¾Ð³Ð¸Ñ€ÑƒÐµÑ‚ heap ÐºÐ°Ð¶Ð´Ñ‹Ðµ 5 ÑÐµÐº, warns Ð¿Ñ€Ð¸ growth > 100 MB Ð¸Ð»Ð¸ absolute > 200 MB. **EVIDENCE:** Ð¿Ñ€Ð¾ÐµÐºÑ‚ **ÑÐ°Ð¼ Ð¾ÑÐ¾Ð·Ð½Ð°Ñ‘Ñ‚** resource pressure Ð¸ Ð¼Ð¾Ð½Ð¸Ñ‚Ð¾Ñ€Ð¸Ñ‚ ÐµÐ³Ð¾.

### 4.3. ILifecycle-ÑÐµÑ€Ð²Ð¸ÑÑ‹ (325 ÑˆÑ‚.)

**325 ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ð¸Ð¼ÐµÑŽÑ‚ `async init()`/`start()`** â€” ÑÑ‚Ð¾ Ð·Ð½Ð°Ñ‡Ð¸Ñ‚, Ñ‡Ñ‚Ð¾ Ð¿Ñ€Ð¸ `LifecycleManager.startAll()` Ð¾Ð½Ð¸ Ð¼Ð¾Ð³ÑƒÑ‚ Ð·Ð°Ð¿ÑƒÑÐºÐ°Ñ‚ÑŒ Ñ„Ð¾Ð½Ð¾Ð²ÑƒÑŽ Ñ€Ð°Ð±Ð¾Ñ‚Ñƒ. **POTENTIAL** â€” Ð½Ð¾ Ñ€ÐµÐ°Ð»ÑŒÐ½Ñ‹Ðµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ UNKNOWN.

---

## 5. ÐŸÐ¾Ð´Ð¿Ð¸ÑÐºÐ¸: Ð³Ð´Ðµ ÑÐ¾Ð·Ð´Ð°ÑŽÑ‚ÑÑ Ð»Ð¸ÑˆÐ½Ð¸Ðµ

### 5.1. Ð Ð°ÑÐ¿Ñ€ÐµÐ´ÐµÐ»ÐµÐ½Ð¸Ðµ `eventBus.on` Ð¿Ð¾ ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ð¼

**97 Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ¾Ðº Ð² 46 Ñ„Ð°Ð¹Ð»Ð°Ñ… ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð²** (Ð²ÑÐµÐ³Ð¾ 997 eventBus-Ð²Ñ‹Ð·Ð¾Ð²Ð¾Ð² Ð²Ð¾ Ð²ÑÑ‘Ð¼ src).

**Ð¢Ð¾Ð¿-15 Ð¿Ð¾Ð´Ð¿Ð¸ÑÑ‡Ð¸ÐºÐ¾Ð²:**

| Ð¤Ð°Ð¹Ð» | `eventBus.on` count |
|---|---:|
| `DebateRuntimePanel.tsx` | 6 |
| `KeyTable/SandboxTab.tsx` | 5 |
| `SchedulerPanel.tsx` | 4 |
| `ProviderMarketplace.tsx` | 4 |
| `ArgumentGraphPanel.tsx` | 4 |
| `SREAgentPanel.tsx` | 3 |
| `ProviderManager/QuickTestSection.tsx` | 3 |
| `ProviderManager/ProviderTableRow.tsx` | 3 |
| `ProviderManager/OpenRouterKeyTable.tsx` | 3 |
| `ProviderManager/GroqKeyTable.tsx` | 3 |
| `NvidiaEnterprise/NvidiaKeyTable.tsx` | 3 |
| `LiveCognition/MissionControl.tsx` | 3 |
| `KnowledgeGenPanel.tsx` | 3 |
| `KeyTable/OverviewTab.tsx` | 3 |
| `JunctionPanel.tsx` | 3 |

### 5.2. ÐŸÐ¾Ð´Ð¿Ð¸ÑÐºÐ¸ Ð½Ð° Ð²Ñ‹ÑÐ¾ÐºÐ¾Ñ‡Ð°ÑÑ‚Ð¾Ñ‚Ð½Ñ‹Ðµ ÑÐ¾Ð±Ñ‹Ñ‚Ð¸Ñ (POTENTIAL â€” hot path)

**ÐŸÐ¾Ð´Ð¿Ð¸ÑÐºÐ¸ Ð½Ð° `EVENTS.MESSAGE_RESPONSE`** (ÑÐ¼Ð¼Ð¸Ñ‚Ð¸Ñ‚ÑÑ Ð½Ð° ÐºÐ°Ð¶Ð´Ñ‹Ð¹ Ð¾Ñ‚Ð²ÐµÑ‚ LLM, Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ 10+ Ð² ÑÐµÐºÑƒÐ½Ð´Ñƒ Ð¿Ñ€Ð¸ ÑÑ‚Ñ€Ð¸Ð¼Ð¸Ð½Ð³Ðµ):

| Ð¤Ð°Ð¹Ð» | ÐŸÐ¾Ð´Ð¿Ð¸ÑÐºÐ° |
|---|---|
| `KeyTable/SandboxTab.tsx` | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)` |
| `KeyTable/OverviewTab.tsx` | `EVENTS.MESSAGE_RESPONSE` |
| `AquariumPanel/hooks/useAquariumEngine.ts` | `eventBus.on(EVENTS.MESSAGE_RESPONSE, handleResponse)` |
| `ProviderManager/QuickTestSection.tsx` | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)` |
| `ProviderManager/GroqKeyTable.tsx` | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)` |
| `ProviderManager/OpenRouterKeyTable.tsx` | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)` |
| `ProviderManager/ProviderTableRow.tsx` | `eventBus.on(EVENTS.MESSAGE_RESPONSE, ...)` |

**POTENTIAL risk:** **7+ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ°Ð½Ñ‹ Ð½Ð° `MESSAGE_RESPONSE`**. Ð•ÑÐ»Ð¸ Ð²ÑÐµ 7 Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ñ‹ Ð¾Ð´Ð½Ð¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾ (Ð¼Ð°Ð»Ð¾Ð²ÐµÑ€Ð¾ÑÑ‚Ð½Ð¾, Ð½Ð¾ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ñ‡ÐµÑ€ÐµÐ· split-view), ÐºÐ°Ð¶Ð´Ñ‹Ð¹ LLM-Ð¾Ñ‚Ð²ÐµÑ‚ Ñ‚Ñ€Ð¸Ð³Ð³ÐµÑ€Ð¸Ñ‚ 7 Ð¾Ð±Ñ€Ð°Ð±Ð¾Ñ‚Ñ‡Ð¸ÐºÐ¾Ð². **ÐÐµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾.**

**ÐŸÐ¾Ð´Ð¿Ð¸ÑÐºÐ¸ Ð½Ð° `EVENTS.TRACE_UPDATED`** (ÑÐ¼Ð¼Ð¸Ñ‚Ð¸Ñ‚ÑÑ Ð½Ð° ÐºÐ°Ð¶Ð´Ñ‹Ð¹ ÑˆÐ°Ð³ Ð°Ð³ÐµÐ½Ñ‚Ð°):

| Ð¤Ð°Ð¹Ð» | ÐŸÐ¾Ð´Ð¿Ð¸ÑÐºÐ° |
|---|---|
| `TasksPanel.tsx` | `eventBus.on(EVENTS.TRACE_UPDATED, ...)` |

### 5.3. Cleanup-Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ñ‹ (PATTERN analysis)

**461 `useEffect` Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ…, Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 77 Ñ cleanup (17%).**

**EVIDENCE â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾:** `usePolling` hook **ÑÐ°Ð¼ ÑƒÐ¿Ñ€Ð°Ð²Ð»ÑÐµÑ‚ cleanup** (ÑÐ¼. `src/components/Common/usePolling.ts`): `clearInterval` Ð² `stop()`, `document.removeEventListener('visibilitychange', ...)`. Ð’ÑÐµ 79 polling-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð½Ð°ÑÐ»ÐµÐ´ÑƒÑŽÑ‚ ÑÑ‚Ð¾Ñ‚ cleanup.

**EVIDENCE â€” Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ¸:** Ð¸Ð· 461 `useEffect` Ð±ÐµÐ· cleanup â€” Ð¼Ð½Ð¾Ð³Ð¸Ðµ one-shot (fetch on mount), Ð½Ð¾ **Ñ‚Ðµ, Ñ‡Ñ‚Ð¾ Ð¿Ð¾Ð´Ð¿Ð¸ÑÑ‹Ð²Ð°ÑŽÑ‚ÑÑ Ð½Ð° eventBus Ð±ÐµÐ· cleanup, â€” leak**. ÐŸÑ€Ð¸Ð¼ÐµÑ€Ñ‹ Ð´Ð»Ñ Ñ€ÐµÐ²ÑŒÑŽ:

| Ð¡Ð»ÑƒÑ‡Ð°Ð¹ | Ð Ð¸ÑÐº |
|---|---|
| `eventBus.on(...)` Ð² `useEffect` Ð±ÐµÐ· `return () => unsub()` | ðŸ”´ leak â€” Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ° Ð¾ÑÑ‚Ð°Ñ‘Ñ‚ÑÑ Ð¿Ð¾ÑÐ»Ðµ unmount |
| `setInterval` Ð² `useEffect` Ð±ÐµÐ· `return () => clearInterval(id)` | ðŸ”´ leak â€” Ñ‚Ð°Ð¹Ð¼ÐµÑ€ Ñ‚Ð¸ÐºÐ°ÐµÑ‚ Ð²ÐµÑ‡Ð½Ð¾ |
| `fetch()` Ð² `useEffect` Ð±ÐµÐ· abort | ðŸŸ¡ stale state update Ð¿Ð¾ÑÐ»Ðµ unmount (Ð½Ðµ leak, Ð½Ð¾ warning) |

**Top-15 Ð¿Ð¾Ð´Ð¿Ð¸ÑÑ‡Ð¸ÐºÐ¾Ð² Ð²ÑÐµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÑŽÑ‚ `const unsub = eventBus.on(...)` Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½ Ñ `return () => unsub()`** (Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ Ð² `TasksPanel.tsx:363` â€” `const unsub = eventBus.on(EVENTS.TRACE_UPDATED, ...)` + cleanup). **EVIDENCE:** Ð¾ÑÐ½Ð¾Ð²Ð½Ñ‹Ðµ Ð¿Ð°Ð½ÐµÐ»Ð¸ ÐºÐ¾Ñ€Ñ€ÐµÐºÑ‚Ð½Ð¾ Ñ‡Ð¸ÑÑ‚ÑÑ‚ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸.

### 5.4. Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ðµ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸ (POTENTIAL waste)

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¾panels Ð¿Ð¾Ð´Ð¿Ð¸ÑÑ‹Ð²Ð°ÑŽÑ‚ÑÑ Ð½Ð° **Ð¾Ð´Ð½Ð¾ Ð¸ Ñ‚Ð¾ Ð¶Ðµ ÑÐ¾Ð±Ñ‹Ñ‚Ð¸Ðµ** Ð´Ð»Ñ Ð¿Ð¾Ð»ÑƒÑ‡ÐµÐ½Ð¸Ñ **Ð¾Ð´Ð½Ð¸Ñ… Ð¸ Ñ‚ÐµÑ… Ð¶Ðµ Ð´Ð°Ð½Ð½Ñ‹Ñ…**. ÐŸÑ€Ð¸Ð¼ÐµÑ€: 4 Ð¿Ð°Ð½ÐµÐ»Ð¸ `ProviderManager/*` (QuickTestSection, GroqKeyTable, OpenRouterKeyTable, ProviderTableRow) â€” Ð²ÑÐµ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ°Ð½Ñ‹ Ð½Ð° `MESSAGE_RESPONSE` Ð´Ð»Ñ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ð¸Ñ ÑÐ²Ð¾Ð¸Ñ… stats.

**ÐÐ»ÑŒÑ‚ÐµÑ€Ð½Ð°Ñ‚Ð¸Ð²Ð°:** Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ° Ñ‡ÐµÑ€ÐµÐ· Zustand store (`useKeyStore`), ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ð¹ ÑÐ°Ð¼ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ°Ð½ Ð½Ð° eventBus Ð¾Ð´Ð¸Ð½ Ñ€Ð°Ð· Ð¸ Ñ€Ð°Ð·Ð´Ð°Ñ‘Ñ‚ state Ñ‡ÐµÑ€ÐµÐ· selectors. Ð­Ñ‚Ð¾ **ÑƒÐ¶Ðµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ** (ÑÐ¼. `useKeyStore`, `useChatStore`, `useSystemStatus`).

**EVIDENCE:** Ð¿Ñ€Ð¾ÐµÐºÑ‚ **Ð·Ð½Ð°ÐµÑ‚** Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½ store-as-single-subscriber, Ð½Ð¾ Ð½Ðµ Ð²ÑÐµ Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð¸Ð¼ Ð¿Ð¾Ð»ÑŒÐ·ÑƒÑŽÑ‚ÑÑ â€” Ð½ÐµÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ðµ Ð¿Ð¾Ð´Ð¿Ð¸ÑÑ‹Ð²Ð°ÑŽÑ‚ÑÑ Ð½Ð°Ð¿Ñ€ÑÐ¼ÑƒÑŽ.

---

## 6. ÐšÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ñ‹ Ñ Ñ‚ÑÐ¶Ñ‘Ð»Ð¾Ð¹ memory-Ð½Ð°Ð³Ñ€ÑƒÐ·ÐºÐ¾Ð¹

### 6.1. Ð¢ÑÐ¶Ñ‘Ð»Ñ‹Ðµ Ð±Ð¸Ð±Ð»Ð¸Ð¾Ñ‚ÐµÐºÐ¸ Ð² Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð°Ñ… (POTENTIAL)

| Ð‘Ð¸Ð±Ð»Ð¸Ð¾Ñ‚ÐµÐºÐ° | Ð¤Ð°Ð¹Ð»Ð¾Ð² Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÑŽÑ‚ | Ð¢Ð¸Ð¿Ð¸Ñ‡Ð½Ñ‹Ð¹ Ñ€Ð°Ð·Ð¼ÐµÑ€ | Ð Ð¸ÑÐº |
|---|---:|---|---|
| **framer-motion** | **165** | ~50 KB gzip | ðŸŸ¡ **ÑˆÐ¸Ñ€Ð¾ÐºÐ¾** â€” Ñ‚Ð°Ñ‰Ð¸Ñ‚ÑÑ Ð² ÐºÐ°Ð¶Ð´Ñ‹Ð¹ chunk Ñ Ð°Ð½Ð¸Ð¼Ð°Ñ†Ð¸ÐµÐ¹ |
| React Flow (`@xyflow/react`) | 6 | ~80 KB gzip | ðŸŸ¡ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ BuilderPanel Ð¸ Ð²Ð¸Ð·ÑƒÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸ |
| vis-network | 5 | ~200 KB gzip | ðŸŸ¡ NavGraph, GraphWorkbench |
| Monaco editor | 2 | ~3 MB (!), Ð½Ð¾ lazy-loadable | ðŸŸ¢ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Monaco-using panels |
| TipTap | 2 | ~100 KB gzip | ðŸŸ¢ Ð¾Ð³Ñ€Ð°Ð½Ð¸Ñ‡ÐµÐ½Ð½Ð¾Ðµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ |
| Mermaid | 1 | ~500 KB gzip | ðŸŸ¢ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ MarkdownRenderer |
| Orama (BM25) | Ñ‡ÐµÑ€ÐµÐ· memory.worker | ~100 KB | ðŸŸ¢ Ð² Web Worker |
| Transformers.js | Ñ‡ÐµÑ€ÐµÐ· memory.worker | ~10 MB Ð¼Ð¾Ð´ÐµÐ»ÑŒ | ðŸŸ¡ **Ð¼Ð¾Ð´ÐµÐ»ÑŒ Ñ‚Ð°Ñ‰Ð¸Ñ‚ÑÑ Ð² worker** |
| Dexie | pervasive | ~30 KB gzip | ðŸŸ¢ ÑÑ‚Ð°Ð½Ð´Ð°Ñ€Ñ‚ |

**POTENTIAL risk â€” framer-motion:** 165 Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÑŽÑ‚ `motion` Ð¸Ð»Ð¸ `AnimatePresence`. Ð”Ð°Ð¶Ðµ Ñ tree-shaking, **ÐºÐ°Ð¶Ð´Ñ‹Ð¹ chunk Ñ framer-motion Ð¿Ð»Ð°Ñ‚Ð¸Ñ‚ ~30â€“50 KB**. Ð•ÑÐ»Ð¸ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð¾Ñ‚ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ 5 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ Ð°Ð½Ð¸Ð¼Ð°Ñ†Ð¸ÑÐ¼Ð¸, ÑÑ‚Ð¾ 5 chunks Ñ framer-motion.

**EVIDENCE â€” Monaco lazy:** Monaco editor Ð³Ñ€ÑƒÐ·Ð¸Ñ‚ÑÑ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ ÐºÐ¾Ð³Ð´Ð° Ð½ÑƒÐ¶ÐµÐ½ (Ñ‡ÐµÑ€ÐµÐ· `@monaco-editor/react` ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ð¹ ÑÐ°Ð¼ lazy).

### 6.2. Web Workers (Ð¸Ð·Ð¾Ð»ÑÑ†Ð¸Ñ CPU-heavy)

**2 worker-Ñ„Ð°Ð¹Ð»Ð°:**

| Worker | Ð—Ð°Ñ‡ÐµÐ¼ | Ð—Ð°Ð³Ñ€ÑƒÐ·ÐºÐ° CPU |
|---|---|---|
| `kernel/workers/sandbox.worker.ts` | Sandbox code execution (eval-banned) | ðŸŸ¢ Ð¸Ð·Ð¾Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½ |
| `kernel/workers/memory.worker.ts` | BM25 index + embeddings | ðŸŸ¡ Ñ‚ÑÐ¶Ñ‘Ð»Ð°Ñ (Transformers.js) |

**EVIDENCE:** CPU-heavy Ñ€Ð°Ð±Ð¾Ñ‚Ð° Ð²Ñ‹Ð½ÐµÑÐµÐ½Ð° Ð² workers â€” **Ñ…Ð¾Ñ€Ð¾ÑˆÐ¸Ð¹ Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½**, Ð½Ðµ Ð±Ð»Ð¾ÐºÐ¸Ñ€ÑƒÐµÑ‚ main thread.

### 6.3. In-memory Zustand stores (53 Ñ„Ð°Ð¹Ð»Ð°)

**53 store-Ñ„Ð°Ð¹Ð»Ð° Ð² `src/stores/`.** Ð’ÑÐµ state Ð² Ð¿Ð°Ð¼ÑÑ‚Ð¸ (Ð² Ð±Ñ€Ð°ÑƒÐ·ÐµÑ€Ðµ), Ð¿ÐµÑ€ÑÐ¸ÑÑ‚ÐµÐ½Ñ‚Ð½Ð¾ÑÑ‚ÑŒ Ñ‡ÐµÑ€ÐµÐ· ÑÐµÑ€Ð²Ð¸ÑÑ‹ (Dexie).

**Top stores Ð¿Ð¾ Ð¾Ð±ÑŠÑ‘Ð¼Ñƒ Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»ÑŒÐ½Ð¾Ð³Ð¾ state:**

| Store | Ð§Ñ‚Ð¾ Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ | Ð Ð¸ÑÐº |
|---|---|---|
| `useChatStore` | Ð’ÑÐµ ÑÐµÑÑÐ¸Ð¸, Ð²ÑÐµ ÑÐ¾Ð¾Ð±Ñ‰ÐµÐ½Ð¸Ñ | ðŸŸ¡ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ Ð±Ð¾Ð»ÑŒÑˆÐ¾Ð¹ Ð¿Ñ€Ð¸ Ð´Ð¾Ð»Ð³Ð¾Ð¼ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ð¸ |
| `useKeyStore` | Ð’ÑÐµ ÐºÐ»ÑŽÑ‡Ð¸ + stats + reputation | ðŸŸ¢ Ð¾Ð³Ñ€Ð°Ð½Ð¸Ñ‡ÐµÐ½Ð¾ |
| `debateLiveStore` | Live events debate | ðŸŸ¡ Ñ€Ð°ÑÑ‚Ñ‘Ñ‚ Ñ Ð´Ð»Ð¸Ð½Ð¾Ð¹ debate |
| `debate-session-store` | All sessions | ðŸŸ¡ |
| `useSystemStatus` | Health vitals | ðŸŸ¢ Ð¼Ð°Ð»ÐµÐ½ÑŒÐºÐ¸Ð¹ |
| `topologyTraceStore` | Trace steps | ðŸŸ¡ Ð¼Ð¾Ð¶ÐµÑ‚ Ñ€Ð°ÑÑ‚Ð¸ |
| `directorStore`, `crewStore`, `councilStore` | Director/crew/council state | ðŸŸ¢ Ð¾Ð³Ñ€Ð°Ð½Ð¸Ñ‡ÐµÐ½Ð¾ |
| `personaStore`, `trustStore`, `frontierStore` | Persona/trust/frontier | ðŸŸ¢ |

**POTENTIAL risk:** `useChatStore` Ð¸ `debateLiveStore` Ð¼Ð¾Ð³ÑƒÑ‚ Ñ€Ð°ÑÑ‚Ð¸ Ð±ÐµÐ· bounds. **ÐÐµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾.**

### 6.4. ÐšÑÑˆÐ¸ Ð² ÑÐµÑ€Ð²Ð¸ÑÐ°Ñ… (in-memory)

| Ð¡ÐµÑ€Ð²Ð¸Ñ | Ð§Ñ‚Ð¾ ÐºÑÑˆÐ¸Ñ€ÑƒÐµÑ‚ | Eviction |
|---|---|---|
| `cache-service` | LLM responses | ðŸŸ¢ 60s `evictionTimer` |
| `blackboard-service` | blackboard entries | ðŸŸ¢ 30s `cleanupTimer` |
| `metrics-service` | metrics | ðŸŸ¢ cleanup interval |
| `monitoring-service` | snapshots | ðŸŸ¢ interval |

**EVIDENCE:** Ð²ÑÐµ major caches Ð¸Ð¼ÐµÑŽÑ‚ **auto-eviction**. Ð­Ñ‚Ð¾ **Ñ…Ð¾Ñ€Ð¾ÑˆÐ¸Ð¹ Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½**.

---

## 7. ÐŸÐ¾Ð²Ñ‚Ð¾Ñ€ÑÑŽÑ‰Ð¸ÐµÑÑ Ð·Ð°Ð¿Ñ€Ð¾ÑÑ‹ (polling duplication)

### 7.1. Polling panels â€” 79 Ð²Ñ‹Ð·Ð¾Ð²Ð¾Ð² `usePolling`

**Ð Ð°ÑÐ¿Ñ€ÐµÐ´ÐµÐ»ÐµÐ½Ð¸Ðµ Ð¸Ð½Ñ‚ÐµÑ€Ð²Ð°Ð»Ð¾Ð²:**

| Ð˜Ð½Ñ‚ÐµÑ€Ð²Ð°Ð» | ÐšÐ¾Ð»-Ð²Ð¾ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | ÐŸÑ€Ð¸Ð¼ÐµÑ€Ñ‹ |
|---:|---:|---|
| 15 000 ms (15s) | **9** | GuardiansPanel, SessionBindingsPanel, DiagnosticPanel, BudgetAlertsPanel, RotationView, DebateSystemResearch, PromptAudit |
| 10 000 ms (10s) | 5 | (various) |
| 5 000 ms (5s) | **5** | SREAgentPanel, GroqSpeedDashboard, PricingPanel, DebateReplayPanel |
| 30 000 ms (30s) | 1 | BudgetPanel |
| 60 000 ms (60s) | 1 | RotationsPanel |
| 3 000 ms (3s) | 1 | (various) |
| 2 000 ms (2s) | 1 | TutorialPanel |
| 1 500 ms (1.5s) | 1 | AudiencePanel |
| **300 ms** | **1** | **GeminiLivePanel** âš  |

**âš  GeminiLivePanel â€” 300ms polling** â€” **3.3 Ð·Ð°Ð¿Ñ€Ð¾ÑÐ° Ð² ÑÐµÐºÑƒÐ½Ð´Ñƒ**. POTENTIAL: ÐµÑÐ»Ð¸ Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð°, ÑÑ‚Ð¾ 200 fetches/Ð¼Ð¸Ð½. **ÐÐµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾**, Ð½Ð¾ ÑÑ‚Ð¾ **ÑÐ°Ð¼Ñ‹Ð¹ Ð°Ð³Ñ€ÐµÑÑÐ¸Ð²Ð½Ñ‹Ð¹ poll Ð² Ð¿Ñ€Ð¾ÐµÐºÑ‚Ðµ**.

### 7.2. Ð”ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ polling Ð¾Ð´Ð½Ð¾Ð¹ Ð¸ Ñ‚Ð¾Ð¹ Ð¶Ðµ data (POTENTIAL)

**ÐŸÑ€Ð¸Ð¼ÐµÑ€:** Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€ stats.

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð§Ñ‚Ð¾ polled | Ð˜Ð½Ñ‚ÐµÑ€Ð²Ð°Ð» |
|---|---|---:|
| `ProviderDashboard` | `usePolling(() => { ... })` | (Ð¸Ð· Ñ‚Ð¾Ð¿-20) |
| `GroqSpeedDashboard` | `usePolling(load, 5000)` | 5s |
| `RotationView` | `usePolling(refresh, 15000)` | 15s |
| `ProviderManager/ProviderTableRow` | (subscribes events) | â€” |
| `ProviderManager/QuickTestSection` | (subscribes events) | â€” |

**POTENTIAL:** ÐµÑÐ»Ð¸ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð¾Ñ‚ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ `ProviderDashboard` + `GroqSpeedDashboard` Ð¾Ð´Ð½Ð¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾ (split-view), Ð¾Ð±Ð° poll Ñ€Ð°Ð· Ð² 5s â†’ 2 fetches ÐºÐ°Ð¶Ð´Ñ‹Ðµ 5s Ð½Ð° Ñ‚Ñƒ Ð¶Ðµ data. **ÐÐµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾.**

### 7.3. Ð”ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ Ð²Ñ‹Ð·Ð¾Ð²Ð¾Ð² ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² (static analysis)

| Ð¡ÐµÑ€Ð²Ð¸Ñ | ÐšÐ¾Ð»-Ð²Ð¾ Ð²Ñ‹Ð·Ð¾Ð²Ð¾Ð² Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ… | Ð Ð°ÑÐ¿Ñ€ÐµÐ´ÐµÐ»ÐµÐ½Ð¸Ðµ |
|---|---:|---|
| `eventBus.*` | **248** | pervasive (Ð½Ð¾Ñ€Ð¼Ð°Ð»ÑŒÐ½Ð¾) |
| `keyService.*` | 78 | 6+ provider panels â€” POTENTIAL overlap |
| `advisorService.*` | 25 | SRE + Budget |
| `debateEngine.*` | 26 | debate panels |
| `budgetService.*` | 18 | budget panels |
| `memoryEngine.*` | 0 | Ñ‡ÐµÑ€ÐµÐ· hooks (Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾!) |

**EVIDENCE â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾:** `memoryEngine` Ð½Ðµ Ð²Ñ‹Ð·Ñ‹Ð²Ð°ÐµÑ‚ÑÑ Ð¸Ð· ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð² Ð½Ð°Ð¿Ñ€ÑÐ¼ÑƒÑŽ (0 calls), Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ‡ÐµÑ€ÐµÐ· hooks â€” Ð·Ð½Ð°Ñ‡Ð¸Ñ‚, **Ð¾Ð´Ð¸Ð½ subscription point** Ð² hook. Ð­Ñ‚Ð¾ **Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ñ‹Ð¹ Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½**.

**POTENTIAL â€” Ð²Ð½Ð¸Ð¼Ð°Ð½Ð¸Ðµ:** `keyService` Ð²Ñ‹Ð·Ñ‹Ð²Ð°ÐµÑ‚ÑÑ Ð¸Ð· 78 Ð¼ÐµÑÑ‚ Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ… â€” ÐµÑÐ»Ð¸ ÐºÐ°Ð¶Ð´Ñ‹Ð¹ Ð²Ñ‹Ð·Ð¾Ð² Ð¸Ð´Ñ‘Ñ‚ Ð² IndexedDB, ÑÑ‚Ð¾ 78 Ñ‚Ð¾Ñ‡ÐµÐº Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð°. ÐÐ¾ `useKeyStore` (Zustand) Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð°Ð³Ñ€ÐµÐ³Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ.

---

## 8. Ð§Ñ‚Ð¾ Ð¼Ð¾Ð¶Ð½Ð¾ Ð·Ð°Ð¿ÑƒÑÐºÐ°Ñ‚ÑŒ Ð»ÐµÐ½Ð¸Ð²Ð¾ (lazy candidates)

### 8.1. Ð£Ð¶Ðµ lazy â€” 209 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹

`src/route-imports.ts` â€” **209 `React.lazy()` Ð¸Ð· 268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹** (78%). Ð’ÑÐµ Ð¾ÑÐ½Ð¾Ð²Ð½Ñ‹Ðµ Ð¿Ð°Ð½ÐµÐ»Ð¸ (ChatPanel, ProviderManager, DebateArena, MemoryPanel, HealthPanel, SREAgentPanel, BuilderPanel Ð¸ Ñ‚.Ð´.) â€” lazy.

**EVIDENCE:** Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð° Ð¿Ð¾ÑÐ»ÐµÐ´Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾ Ð»ÐµÐ½Ð¸Ð²Ð°Ñ.

### 8.2. ÐÐ• lazy â€” ÐºÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚Ñ‹ Ð½Ð° Ð»ÐµÐ½Ð¸Ð²Ð¾ÑÑ‚ÑŒ

| Ð§Ñ‚Ð¾ ÑÐµÐ¹Ñ‡Ð°Ñ eager | ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ | ÐœÐ¾Ð¶Ð½Ð¾ Ð»Ð¸ lazy? |
|---|---|---|
| `TECHNIQUE_PANEL_COMPONENTS` bundle | Ð˜Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÐµÑ‚ÑÑ Ð² `route-imports.ts` ÑÐ²ÐµÑ€Ñ…Ñƒ | ðŸŸ¡ **Ð”Ð** â€” ÑÐ°Ð¼Ð¸ technique panels lazy Ð²Ð½ÑƒÑ‚Ñ€Ð¸ bundle, Ð½Ð¾ bundle registry Ð¼Ð¾Ð¶Ð½Ð¾ Ð³Ñ€ÑƒÐ·Ð¸Ñ‚ÑŒ lazy |
| `CommandPalette` | Ð˜Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÐµÑ‚ÑÑ Ð² `App.tsx` Ð½Ð°Ð¿Ñ€ÑÐ¼ÑƒÑŽ | ðŸŸ¡ **Ð”Ð** â€” Cmd+K Ð½Ðµ Ð½ÑƒÐ¶ÐµÐ½ ÑÑ€Ð°Ð·Ñƒ |
| `AppLayout` | Ð’ `App.tsx` | ðŸ”´ ÐÐ•Ð¢ â€” Ð½ÑƒÐ¶ÐµÐ½ Ð²ÑÐµÐ³Ð´Ð° |
| `ResponsiveShell` | Ð’ `App.tsx` | ðŸ”´ ÐÐ•Ð¢ â€” Ð½ÑƒÐ¶ÐµÐ½ Ð²ÑÐµÐ³Ð´Ð° |
| `route-registry-*.ts` (4 Ñ„Ð°Ð¹Ð»Ð°) | Ð˜Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÑŽÑ‚ÑÑ Ð² `AppLayout` | ðŸŸ¡ Ñ‡Ð°ÑÑ‚Ð¸Ñ‡Ð½Ð¾ â€” Ð¸ÐºÐ¾Ð½ÐºÐ¸ Ð¼Ð¾Ð¶Ð½Ð¾ lazy |
| Sidebar | Ð’ `AppLayout` | ðŸŸ¡ Ð¼Ð¾Ð¶Ð½Ð¾ lazy-prefetch |

### 8.3. Ð¡ÐµÑ€Ð²Ð¸ÑÑ‹ Tier 7 (`*` â€” all remaining)

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** `INIT_TIERS[7] = ['*']` â€” Ð¾Ð·Ð½Ð°Ñ‡Ð°ÐµÑ‚ Â«Ð²ÑÐµ Ð¾ÑÑ‚Ð°Ð»ÑŒÐ½Ñ‹Ðµ ÑÐµÑ€Ð²Ð¸ÑÑ‹Â». Ð•ÑÐ»Ð¸ `LifecycleManager.startAll()` Ð¸Ð½ÑÑ‚Ð°Ð½Ñ†Ð¸Ñ€ÑƒÐµÑ‚ Ð²ÑÐµ 525 remaining ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ð¿Ñ€Ð¸ ÑÑ‚Ð°Ñ€Ñ‚Ðµ â€” ÑÑ‚Ð¾ **Ð±Ð¾Ð»ÑŒÑˆÐ°Ñ startup-Ð½Ð°Ð³Ñ€ÑƒÐ·ÐºÐ°**.

**EVIDENCE:** lazyService ÑÐ¾Ð·Ð´Ð°Ñ‘Ñ‚ proxy, Ð½Ðµ ÑÐ°Ð¼ ÑÐµÑ€Ð²Ð¸Ñ â€” Ð¸Ð½ÑÑ‚Ð°Ð½Ñ†Ð¸Ð°Ñ†Ð¸Ñ Ð¿Ñ€Ð¾Ð¸ÑÑ…Ð¾Ð´Ð¸Ñ‚ Ð¿Ñ€Ð¸ Ð¿ÐµÑ€Ð²Ð¾Ð¼ Ð¾Ð±Ñ€Ð°Ñ‰ÐµÐ½Ð¸Ð¸. **ÐÐž** ÐµÑÐ»Ð¸ `startAll()` Ð²Ñ‹Ð·Ñ‹Ð²Ð°ÐµÑ‚ `.start()` Ð½Ð° Ð²ÑÐµÑ…, Ñ‚Ð¾Ð³Ð´Ð° ÑÑ‚Ð°Ñ€Ñ‚ÑƒÑŽÑ‚ **background timers** Ð²ÑÐµÑ… 39+ ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ñ `setInterval`.

**UNKNOWN:** Ð½Ðµ ÑÑÐ½Ð¾ Ð¸Ð· ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¾Ð³Ð¾ Ð°Ð½Ð°Ð»Ð¸Ð·Ð°, Ð²Ñ‹Ð·Ñ‹Ð²Ð°ÐµÑ‚ Ð»Ð¸ `startAll()` Ñ‚Ð¾Ð»ÑŒÐºÐ¾ CRITICAL_SERVICES Ð¸Ð»Ð¸ Ð²ÑÐµ. **Ð¢Ñ€ÐµÐ±ÑƒÐµÑ‚ runtime-Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ¸.**

### 8.4. Phase-by-phase registration (81 phase file)

**549 service registrations** Ñ€Ð°Ð·Ð±Ð¸Ñ‚Ñ‹ Ð½Ð° 81 phase-Ñ„Ð°Ð¹Ð» (`phase0-event-bridge.ts` â†’ `phase81-wiki-brain.ts`). Ð­Ñ‚Ð¾ **Ð³Ð¾Ñ‚Ð¾Ð²Ð°Ñ Ð¸Ð½Ñ„Ñ€Ð°ÑÑ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ð° Ð´Ð»Ñ Ð»ÐµÐ½Ð¸Ð²Ð¾Ð¹ Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ð¸** â€” Ð½Ð¾ ÑÐµÐ¹Ñ‡Ð°Ñ Ð²ÑÐµ phase-Ñ„Ð°Ð¹Ð»Ñ‹ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÑŽÑ‚ÑÑ Ð² `service-registration/index.ts` eagerly.

**POTENTIAL optimization:** Ð´Ð¸Ð½Ð°Ð¼Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ `import('./phase75-provider-embeddings')` Ñ‚Ð¾Ð»ÑŒÐºÐ¾ ÐºÐ¾Ð³Ð´Ð° Ð¾Ñ‚ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ÑÑ ÑÐ¾Ð¾Ñ‚Ð²ÐµÑ‚ÑÑ‚Ð²ÑƒÑŽÑ‰Ð°Ñ Ð¿Ð°Ð½ÐµÐ»ÑŒ.

---

## 9. ÐšÐ°ÐºÐ¸Ðµ Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð¼Ð¾Ð¶Ð½Ð¾ Ð²Ñ‹Ð³Ñ€ÑƒÐ¶Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¸ Ð¾Ñ‚ÑÑƒÑ‚ÑÑ‚Ð²Ð¸Ð¸ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ñ

### 9.1. Ð¢ÐµÐºÑƒÑ‰Ð¸Ð¹ Ð¼ÐµÑ…Ð°Ð½Ð¸Ð·Ð¼ Ð²Ñ‹Ð³Ñ€ÑƒÐ·ÐºÐ¸

**React.lazy + Suspense + ErrorBoundary** â€” ÐºÐ¾Ð³Ð´Ð° Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ ÑƒÑ…Ð¾Ð´Ð¸Ñ‚ Ñ Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð°, React unmount'Ð¸Ñ‚ ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚, garbage collector Ð¾Ñ‡Ð¸Ñ‰Ð°ÐµÑ‚ state.

**ÐžÐ”ÐÐÐšÐž:**

1. **Ð¡ÐµÑ€Ð²Ð¸ÑÑ‹ ÑÐ´Ñ€Ð° Ð½Ðµ Ð²Ñ‹Ð³Ñ€ÑƒÐ¶Ð°ÑŽÑ‚ÑÑ** â€” 407 lazyService-ÑÐ¸Ð½Ð³Ð»Ñ‚Ð¾Ð½Ð¾Ð² Ð¶Ð¸Ð²ÑƒÑ‚ Ð²ÐµÑ‡Ð½Ð¾ Ð¿Ð¾ÑÐ»Ðµ Ð¿ÐµÑ€Ð²Ð¾Ð³Ð¾ Ð¾Ð±Ñ€Ð°Ñ‰ÐµÐ½Ð¸Ñ. Ð”Ð°Ð¶Ðµ ÐµÑÐ»Ð¸ Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð·Ð°ÐºÑ€Ñ‹Ñ‚Ð°, ÑÐµÑ€Ð²Ð¸Ñ Ð¾ÑÑ‚Ð°Ñ‘Ñ‚ÑÑ.
2. **Background timers Ð½Ðµ Ð¾ÑÑ‚Ð°Ð½Ð°Ð²Ð»Ð¸Ð²Ð°ÑŽÑ‚ÑÑ** â€” 15+ `setInterval` Ñ‚Ð¸ÐºÐ°ÑŽÑ‚, Ð¿Ð¾ÐºÐ° Ð¿Ñ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ Ð¶Ð¸Ð²Ð¾.
3. **eventBus subscriptions** â€” ÐµÑÐ»Ð¸ Ð¿Ð°Ð½ÐµÐ»ÑŒ ÐºÐ¾Ñ€Ñ€ÐµÐºÑ‚Ð½Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ cleanup Ð² `useEffect`, Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ° ÑÐ½Ð¸Ð¼Ð°ÐµÑ‚ÑÑ. Ð•ÑÐ»Ð¸ Ð½ÐµÑ‚ â€” Ð¾ÑÑ‚Ð°Ñ‘Ñ‚ÑÑ (ÑÐ¼. Â§5.3).
4. **Zustand stores** â€” state Ð¿ÐµÑ€ÐµÐ¶Ð¸Ð²Ð°ÐµÑ‚ unmount ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°. `useChatStore` Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ Ð²ÑÐµ ÑÐµÑÑÐ¸Ð¸, Ð´Ð°Ð¶Ðµ ÐµÑÐ»Ð¸ ChatPanel Ð·Ð°ÐºÑ€Ñ‹Ñ‚.

### 9.2. Cleanup-ÑÑ‚Ð°Ñ‚ÑƒÑ Ð¿Ð¾ Ñ‚Ð¾Ð¿-15 polling panels

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | usePolling cleanup? | eventBus cleanup? | Verdict |
|---|---|---|---|
| `SREAgentPanel` | ðŸŸ¢ auto (usePolling) | ðŸŸ¢ yes | ðŸŸ¢ Ð²Ñ‹Ð³Ñ€ÑƒÐ¶Ð°ÐµÑ‚ÑÑ ÐºÐ¾Ñ€Ñ€ÐµÐºÑ‚Ð½Ð¾ |
| `BudgetPanel` | ðŸŸ¢ auto | ðŸŸ¡ check | ðŸŸ¢ Ð²ÐµÑ€Ð¾ÑÑ‚Ð½Ð¾ ÐžÐš |
| `AudiencePanel` (1500ms) | ðŸŸ¢ auto | ðŸŸ¡ check | ðŸŸ¢ Ð²ÐµÑ€Ð¾ÑÑ‚Ð½Ð¾ ÐžÐš |
| `GeminiLivePanel` (300ms!) | ðŸŸ¢ auto | ðŸŸ¡ check | ðŸŸ¡ poll Ñ‡Ð°ÑÑ‚Ñ‹Ð¹, Ð½Ð¾ cleanup ÐµÑÑ‚ÑŒ |
| `DebateReplayPanel` | ðŸŸ¢ auto | ðŸŸ¡ check | ðŸŸ¢ Ð²ÐµÑ€Ð¾ÑÑ‚Ð½Ð¾ ÐžÐš |
| `GroqSpeedDashboard` | ðŸŸ¢ auto | ðŸŸ¡ check | ðŸŸ¢ Ð²ÐµÑ€Ð¾ÑÑ‚Ð½Ð¾ ÐžÐš |
| `DiagnosticPanel` | ðŸŸ¢ auto | ðŸŸ¡ check | ðŸŸ¢ Ð²ÐµÑ€Ð¾ÑÑ‚Ð½Ð¾ ÐžÐš |
| `PerformanceProfilerPanel` | ðŸŸ¢ auto | ðŸŸ¡ check | ðŸŸ¢ Ð²ÐµÑ€Ð¾ÑÑ‚Ð½Ð¾ ÐžÐš |

**EVIDENCE:** `usePolling` hook **Ð³Ð°Ñ€Ð°Ð½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ð¾ Ñ‡Ð¸ÑÑ‚Ð¸Ñ‚ interval** Ð¿Ñ€Ð¸ unmount + Ð¿Ñ€Ð¸ visibility hidden. Ð­Ñ‚Ð¾ **Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾** â€” 79 polling panels Ð½Ðµ ÑƒÑ‚ÐµÐºÐ°ÑŽÑ‚.

### 9.3. ÐšÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚Ñ‹ Ð½Ð° Ð°Ð³Ñ€ÐµÑÑÐ¸Ð²Ð½ÑƒÑŽ Ð²Ñ‹Ð³Ñ€ÑƒÐ·ÐºÑƒ (POTENTIAL)

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ | Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ |
|---|---|---|
| `AquariumPanel` (experimental, framer-motion heavy) | Decorative, Ð½Ðµ core | ðŸŸ¡ unload on route change + remount on visit |
| `FederatedMemoryPanel` (experimental) | Rarely used | ðŸŸ¡ prefetch low priority |
| 62 TechniquePanels | Uniform, ÐºÐ¾Ð½Ñ„Ð¸Ð³ÑƒÑ€Ð°Ñ†Ð¸Ñ | ðŸŸ¡ **Ð¾Ð±ÑŠÐµÐ´Ð¸Ð½Ð¸Ñ‚ÑŒ Ð² 1 catalog** (ÑÐ¼. Feature Value Map) â€” Ð¼ÐµÐ½ÑŒÑˆÐµ chunks |
| `TimeMachinePanel` | Situative | ðŸŸ¡ OK as is (lazy) |
| `DeployPanel` (782 ÑÑ‚Ñ€Ð¾ÐºÐ¸) | Heavy, rare | ðŸŸ¡ prefetch on BuilderPanel hover |

### 9.4. Prefetch strategy (POTENTIAL)

Ð¡ÐµÐ¹Ñ‡Ð°Ñ lazy-loading **Ñ€ÐµÐ°ÐºÑ‚Ð¸Ð²Ð½Ñ‹Ð¹** â€” Ð³Ñ€ÑƒÐ·Ð¸Ñ‚ÑÑ Ð¿Ñ€Ð¸ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð¸Ð¸ Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð°. Ð’Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð° **Ð¿Ñ€Ð¾Ð°ÐºÑ‚Ð¸Ð²Ð½Ð°Ñ prefetch**:

- ÐÐ° hover Ð¿Ð¾ Sidebar-ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ñƒ â†’ prefetch chunk
- ÐŸÐ¾ÑÐ»Ðµ Ð·Ð°Ð³Ñ€ÑƒÐ·ÐºÐ¸ ChatPanel â†’ prefetch DebateArena + ProviderManager (Ð²ÐµÑ€Ð¾ÑÑ‚Ð½Ð¾ ÑÐ»ÐµÐ´ÑƒÑŽÑ‰Ð¸Ðµ)
- Ð’ idle Ð²Ñ€ÐµÐ¼Ñ â†’ prefetch Ñ‚Ð¾Ð¿-10 Ñ‡Ð°ÑÑ‚Ñ‹Ñ… Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹

**Ð¡ÐµÐ¹Ñ‡Ð°Ñ ÑÑ‚Ð¾Ð³Ð¾ Ð½ÐµÑ‚** (POTENTIAL optimization, Ð½Ðµ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð¾Ð²Ð°Ð½Ð¾).

---

## 10. Ð¡Ð²Ð¾Ð´Ð½Ð°Ñ ÐºÐ°Ñ€Ñ‚Ð° Ñ€ÐµÑÑƒÑ€ÑÐ¾Ð² Ð¿Ð¾ Ñ€Ð°Ð·Ð´ÐµÐ»Ð°Ð¼

| Ð Ð°Ð·Ð´ÐµÐ» | Lazy panels | Polling | Subscriptions | Heavy libs | Ð Ð¸ÑÐº |
|---|---:|---:|---:|---|---|
| Ð§Ð°Ñ‚ | 4/4 | 0 | ~10 | framer-motion, Mermaid (via Markdown) | ðŸŸ¢ LOW |
| Ð”ÐµÐ±Ð°Ñ‚Ñ‹ | 14/14 | 1 (DebateReplay 5s) | ~20 (DebateRuntime 6!) | framer-motion, React Flow (ArgumentGraph) | ðŸŸ¡ MED |
| Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | 62/62 (bundle) | 0 | ~5 | framer-motion | ðŸŸ¢ LOW |
| ÐÐ³ÐµÐ½Ñ‚Ñ‹ | 12/12 | 0 | ~10 | framer-motion | ðŸŸ¢ LOW |
| Ð”Ð¸Ð°Ð³Ð½Ð¾ÑÑ‚Ð¸ÐºÐ° | 17/17 | 3 (Diagnostic, PressureMap, PerformanceProfiler) | ~10 | vis-network (DependencyMap) | ðŸŸ¡ MED |
| Ð‘ÑŽÐ´Ð¶ÐµÑ‚ AI | 8/8 | 4 (Budget 30s, BudgetAlerts 15s, CostAnalytics, PricingPanel 5s) | ~5 | â€” | ðŸŸ¡ MED (overlap) |
| ÐŸÐ°Ð½ÐµÐ»ÑŒ (Dashboard) | ~21/21 | 1 (ProviderDashboard) | ~5 | framer-motion | ðŸŸ¢ LOW |
| AI Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ñ‹ | ~6/6 | 3 (GroqSpeed 5s, RotationView 15s, ProviderDashboard) | ~15 (4 KeyTables Ã— 3 subs) | â€” | ðŸŸ¡ MED (overlap) |
| SRE | 1/1 | 1 (SREAgent 5s) | 3 | â€” | ðŸŸ¢ LOW |
| Ð—Ð½Ð°Ð½Ð¸Ñ | ~5/5 | 0 | ~5 | Orama (worker) | ðŸŸ¢ LOW |
| Ð¡Ð¸ÑÑ‚ÐµÐ¼Ð½Ð°Ñ Ð¿Ð°Ð¼ÑÑ‚ÑŒ | ~6/6 | 0 | ~3 | Transformers.js (worker) | ðŸŸ¡ MED (model) |
| Ð˜Ð½Ñ‚ÐµÐ³Ñ€Ð°Ñ†Ð¸Ð¸ | ~10/10 | 0 | ~5 | â€” | ðŸŸ¢ LOW |
| Ð›Ð°Ð±Ð¾Ñ€Ð°Ñ‚Ð¾Ñ€Ð¸Ñ | ~6/6 | 0 | ~3 | framer-motion (Aquarium heavy) | ðŸŸ¡ MED |
| ÐžÑÑ‚Ð°Ð»ÑŒÐ½Ð¾Ðµ | ~15/15 | 1 (GeminiLivePanel **300ms**!) | ~10 | Monaco (2 panels) | ðŸŸ¡ MED |

---

## 11. ÐŸÐ¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»ÑŒÐ½Ð°Ñ vs Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð½Ð°Ñ Ð½Ð°Ð³Ñ€ÑƒÐ·ÐºÐ° â€” ÑÐ²Ð¾Ð´ÐºÐ°

| Ð§Ñ‚Ð¾ | POTENTIAL (ÑÑ‚Ð°Ñ‚Ð¸ÐºÐ°) | EVIDENCE (Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½) | MEASURED (runtime) |
|---|---|---|---|
| Ð¡Ñ‚Ð°Ñ€Ñ‚Ð¾Ð²Ñ‹Ð¹ Ð±Ð°Ð½Ð´Ð» | ~150â€“200 KB eager JS | ðŸŸ¢ Ð¼Ð¸Ð½Ð¸Ð¼Ð°Ð»ÑŒÐ½Ñ‹Ð¹ eager | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Bootstrap Ð²Ñ€ÐµÐ¼Ñ | 8 tiers Ã— ~24 ÑÐµÑ€Ð²Ð¸ÑÐ° + Tier 7 = 525 | lazyService proxy Ð·Ð°Ð´ÐµÑ€Ð¶Ð¸Ð²Ð°ÐµÑ‚ Ð¸Ð½ÑÑ‚Ð°Ð½Ñ†Ð¸Ð°Ñ†Ð¸ÑŽ | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Background CPU | 15+ `setInterval` Ð¿Ð¾ÑÑ‚Ð¾ÑÐ½Ð½Ð¾ | ðŸŸ¢ Ð²ÑÐµ Ñ Ð¸Ð¼ÐµÐ½Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¼Ð¸ timer refs Ð´Ð»Ñ cleanup | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Memory framer-motion | 165 Ñ„Ð°Ð¹Ð»Ð¾Ð², ~50 KB per chunk | ðŸŸ¢ tree-shaking Ð´Ð¾Ð»Ð¶ÐµÐ½ ÑƒÐ¼ÐµÐ½ÑŒÑˆÐ¸Ñ‚ÑŒ | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Memory Monaco | 2 Ð¿Ð°Ð½ÐµÐ»Ð¸, ~3 MB | ðŸŸ¢ lazy Ñ‡ÐµÑ€ÐµÐ· @monaco-editor/react | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Memory Transformers.js | Ñ‡ÐµÑ€ÐµÐ· memory.worker | ðŸŸ¡ Ð¼Ð¾Ð´ÐµÐ»ÑŒ ~10 MB Ð² worker | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Polling load | 79 polls, 9Ã—15s, 5Ã—5s, 1Ã—300ms | ðŸŸ¢ usePolling auto-pauses on hidden | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Subscriptions leak risk | 461 useEffect, 77 Ñ cleanup (17%) | ðŸŸ¡ Ð¾ÑÐ½Ð¾Ð²Ð½Ñ‹Ðµ Ð¿Ð°Ð½ÐµÐ»Ð¸ ÐºÐ¾Ñ€Ñ€ÐµÐºÑ‚Ð½Ñ‹, Ð½Ð¾ 84% need review | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Stores memory | 53 Zustand stores | ðŸŸ¡ useChatStore Ð¼Ð¾Ð¶ÐµÑ‚ Ñ€Ð°ÑÑ‚Ð¸ Ð±ÐµÐ· bounds | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Caches | 4+ major caches | ðŸŸ¢ Ð²ÑÐµ Ñ auto-eviction | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Service duplication | keyService 78 calls, eventBus 248 | ðŸŸ¢ useKeyStore Ð°Ð³Ñ€ÐµÐ³Ð¸Ñ€ÑƒÐµÑ‚ | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |
| Web Workers CPU | 2 workers (sandbox, memory) | ðŸŸ¢ Ð¸Ð·Ð¾Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ñ‹ Ð¾Ñ‚ main thread | âŒ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾ |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ð²Ñ‹Ð²Ð¾Ð´:** **Ð’Ð¡Ð• Ñ†Ð¸Ñ„Ñ€Ñ‹ â€” POTENTIAL, Ð½Ð¸Ñ‡ÐµÐ³Ð¾ Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¾.** ÐÑ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð° Ñ…Ð¾Ñ€Ð¾ÑˆÐ°Ñ (lazy Ð²ÐµÐ·Ð´Ðµ, cleanup Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ñ‹, auto-eviction), Ð½Ð¾ **Ñ€ÐµÐ°Ð»ÑŒÐ½ÑƒÑŽ Ð½Ð°Ð³Ñ€ÑƒÐ·ÐºÑƒ Ð¼Ð¾Ð¶Ð½Ð¾ Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ‡ÐµÑ€ÐµÐ· Chrome DevTools Performance + Memory tabs** Ð¿Ñ€Ð¸ Ñ€ÐµÐ°Ð»ÑŒÐ½Ð¾Ð¼ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ð¸.

**MemoryWatchdog** (`src/kernel/utils/memory-watchdog.ts`) â€” Ð²ÑÑ‚Ñ€Ð¾ÐµÐ½Ð½Ñ‹Ð¹ Ð¼Ð¾Ð½Ð¸Ñ‚Ð¾Ñ€Ð¸Ð½Ð³ heap (5s interval, warns at +100 MB growth Ð¸Ð»Ð¸ >200 MB absolute). **Ð­Ñ‚Ð¾ ÐµÐ´Ð¸Ð½ÑÑ‚Ð²ÐµÐ½Ð½Ñ‹Ð¹ Ð¸Ð·Ð¼ÐµÑ€Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ñ‹Ð¹ Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚ Ð² Ð¿Ñ€Ð¾ÐµÐºÑ‚Ðµ**, Ð½Ð¾ ÐµÐ³Ð¾ Ð²Ñ‹Ð²Ð¾Ð´Ñ‹ Ð¸Ð´ÑƒÑ‚ Ð² logger, Ð½Ðµ Ð² UI.

---

## 12. Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ð¸ Ð¿Ð¾ Ð¾Ð¿Ñ‚Ð¸Ð¼Ð¸Ð·Ð°Ñ†Ð¸Ð¸ Ñ€ÐµÑÑƒÑ€ÑÐ¾Ð²

### Ð‘Ñ‹ÑÑ‚Ñ€Ñ‹Ðµ Ð¿Ð¾Ð±ÐµÐ´Ñ‹ (high-ROI, low-effort)

1. **Ð¡Ð½Ð¸Ð·Ð¸Ñ‚ÑŒ `GeminiLivePanel` polling Ñ 300ms Ð´Ð¾ 1000ms+** â€” ÑÐµÐ¹Ñ‡Ð°Ñ 3.3 fetches/sec, ÑÑ‚Ð¾ **ÑÐ°Ð¼Ñ‹Ð¹ Ð´Ð¾Ñ€Ð¾Ð³Ð¾Ð¹ poll Ð² Ð¿Ñ€Ð¾ÐµÐºÑ‚Ðµ**. Ð•ÑÐ»Ð¸ panel Ð´Ð¾Ð»Ð¶Ð½Ð° Ð±Ñ‹Ñ‚ÑŒ real-time, Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÑŒ WebSocket / SSE Ð²Ð¼ÐµÑÑ‚Ð¾ polling.
2. **Prefetch Ñ‚Ð¾Ð¿-5 likely-next panels** Ð½Ð° hover Ð¿Ð¾ Sidebar â€” ChatPanel â†’ DebateArena + ProviderManager + MemoryPanel. React.lazy + `import()` Ð² `onMouseEnter`.
3. **Lazy-load `TECHNIQUE_PANEL_COMPONENTS` bundle** â€” ÑÐµÐ¹Ñ‡Ð°Ñ eager Ð² `route-imports.ts`, Ð½Ð¾ Ð½ÑƒÐ¶ÐµÐ½ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð¿Ñ€Ð¸ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð¸Ð¸ `/techniques/*` Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð°.
4. **Lazy-load `CommandPalette`** Ð² `App.tsx` â€” Ð½ÑƒÐ¶ÐµÐ½ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð¿Ñ€Ð¸ Cmd+K, Ð¼Ð¾Ð¶Ð½Ð¾ prefetch Ð¿Ð¾ÑÐ»Ðµ idle.
5. **ÐÑƒÐ´Ð¸Ñ‚ 461 `useEffect` Ð±ÐµÐ· cleanup** â€” Ð½Ð°Ð¹Ñ‚Ð¸ Ñ‚Ðµ, Ñ‡Ñ‚Ð¾ Ð¿Ð¾Ð´Ð¿Ð¸ÑÑ‹Ð²Ð°ÑŽÑ‚ÑÑ Ð½Ð° eventBus/setInterval Ð±ÐµÐ· cleanup, Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ cleanup. ~50â€“100 wahrscheinlich-leak ÑÑ„Ñ„ÐµÐºÑ‚Ð¾Ð².

### Ð¡Ñ€ÐµÐ´Ð½ÐµÑÑ€Ð¾Ñ‡Ð½Ñ‹Ðµ (ÐºÐ²Ð°Ñ€Ñ‚Ð°Ð»)

6. **ÐžÐ±ÑŠÐµÐ´Ð¸Ð½Ð¸Ñ‚ÑŒ 5 budget panels + 4 health panels + 4 provider UIs** Ð² Ñ‚Ð°Ð±Ð¾Ð²-Ñ…Ð°Ð±Ñ‹ (ÑÐ¼. Feature Value Map Â§6.2) â€” Ð¼ÐµÐ½ÑŒÑˆÐµ Ð¾Ð´Ð½Ð¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ñ‹Ñ… polling panels.
7. **Ð’Ð½ÐµÐ´Ñ€Ð¸Ñ‚ÑŒ cache layer Ð´Ð»Ñ polling** â€” ÐµÑÐ»Ð¸ 2 Ð¿Ð°Ð½ÐµÐ»Ð¸ poll Ð¾Ð´Ð½Ñƒ data, debounce Ñ‡ÐµÑ€ÐµÐ· shared Zustand selector. ÐŸÑ€Ð¸Ð¼ÐµÑ€: `useKeyStore` ÑƒÐ¶Ðµ ÑÑ‚Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ Ð´Ð»Ñ keys â€” Ñ€Ð°ÑÐ¿Ñ€Ð¾ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ Ð½Ð° `budgetService`, `advisorService`.
8. **Centralize subscriptions Ñ‡ÐµÑ€ÐµÐ· stores** â€” ÑƒÐ±Ñ€Ð°Ñ‚ÑŒ Ð¿Ñ€ÑÐ¼Ñ‹Ðµ `eventBus.on` Ð¸Ð· ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð² (97 Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ¾Ðº), Ð·Ð°Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ Ð½Ð° store selectors.
9. **Service registration lazy-by-phase** â€” `import('./phase75-provider-embeddings')` Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð¿Ñ€Ð¸ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð¸Ð¸ ÑÐ¾Ð¾Ñ‚Ð²ÐµÑ‚ÑÑ‚Ð²ÑƒÑŽÑ‰ÐµÐ¹ Ð¿Ð°Ð½ÐµÐ»Ð¸. Ð¡ÐµÐ¹Ñ‡Ð°Ñ Ð²ÑÐµ 81 phase-Ñ„Ð°Ð¹Ð»Ð° Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÑŽÑ‚ÑÑ eagerly.
10. **RFC: Ð²Ñ‹Ð³Ñ€ÑƒÐ·ÐºÐ° ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²** â€” ÑÐµÐ¹Ñ‡Ð°Ñ lazyService singleton Ð¶Ð¸Ð²Ñ‘Ñ‚ Ð²ÐµÑ‡Ð½Ð¾ Ð¿Ð¾ÑÐ»Ðµ Ð¿ÐµÑ€Ð²Ð¾Ð³Ð¾ Ð¾Ð±Ñ€Ð°Ñ‰ÐµÐ½Ð¸Ñ. Ð”Ð»Ñ rarely-used ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² (FederatedMemory, Aquarium, CrystalVault) â€” Ñ€Ð°ÑÑÐ¼Ð¾Ñ‚Ñ€ÐµÑ‚ÑŒ `idleTimeout` eviction.

### Ð¡Ñ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ

11. **Runtime observability dashboard** â€” `MemoryWatchdog` ÑƒÐ¶Ðµ ÑÐ¾Ð±Ð¸Ñ€Ð°ÐµÑ‚ heap data, Ð²Ñ‹Ð²ÐµÑÑ‚Ð¸ ÑÑ‚Ð¾ Ð² UI-Ð¿Ð°Ð½ÐµÐ»ÑŒ (HealthPanel Ð¸Ð»Ð¸ Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð°Ñ ResourceMonitorPanel). Ð¡ÐµÐ¹Ñ‡Ð°Ñ Ð´Ð°Ð½Ð½Ñ‹Ðµ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ….
12. **Bundle analyzer** â€” `vite-bundle-visualizer` Ð² CI, Ð¾Ñ‚ÑÐ»ÐµÐ¶Ð¸Ð²Ð°Ñ‚ÑŒ chunk sizes. Ð¡ 165 framer-motion Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð»ÐµÐ³ÐºÐ¾ Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ñ‚ÑŒ fat chunks.
13. **Service worker for caching** â€” LLM responses cacheable Ñ‡ÐµÑ€ÐµÐ· service worker (offline support + Ð¼ÐµÐ½ÑŒÑˆÐµ Ð¿Ð¾Ð²Ñ‚Ð¾Ñ€Ð½Ñ‹Ñ… fetch).
14. **Web Worker Ð´Ð»Ñ MarkdownRenderer** â€” Mermaid rendering Ñ‚ÑÐ¶Ñ‘Ð»Ñ‹Ð¹, Ð²Ñ‹Ð½ÐµÑÑ‚Ð¸ Ð² worker.
15. **Ð˜Ð·Ð¼ÐµÑ€Ð¸Ñ‚ÑŒ startup time** â€” Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ `performance.mark` Ð² `bootstrap.ts` Ð½Ð° ÐºÐ°Ð¶Ð´Ð¾Ð¼ tier, Ð¿Ð¸ÑÐ°Ñ‚ÑŒ Ð² logger. Ð¡ÐµÐ¹Ñ‡Ð°Ñ 8 tiers Ð¸Ð½Ð¸Ñ†Ð¸Ð°Ð»Ð¸Ð·Ð¸Ñ€ÑƒÑŽÑ‚ÑÑ Ð¿Ð¾ÑÐ»ÐµÐ´Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾, Ð½Ð¾ Ð²Ñ€ÐµÐ¼Ñ Ð½Ðµ Ñ‚Ñ€ÐµÐºÐ°ÐµÑ‚ÑÑ.

---

## 13. Ð˜Ñ‚Ð¾Ð³Ð¾Ð²Ñ‹Ð¹ Ð²ÐµÑ€Ð´Ð¸ÐºÑ‚ Ð¿Ð¾ Ñ€ÐµÑÑƒÑ€ÑÐ°Ð¼

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | ÐžÑ†ÐµÐ½ÐºÐ° | ÐšÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¹ |
|---|:---:|---|
| Lazy-loading Ð¾Ñ…Ð²Ð°Ñ‚ | **9/10** | 209/268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ lazy, Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 3 eager |
| Bootstrap Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð° | **8/10** | 8 tiers, ÑÐ²Ð½Ñ‹Ð¹ Ð¿Ð¾Ñ€ÑÐ´Ð¾Ðº, CRITICAL_SERVICES Ð¾Ð¿Ñ€ÐµÐ´ÐµÐ»ÐµÐ½Ñ‹ |
| Cleanup Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ñ‹ | **7/10** | usePolling ÐºÐ¾Ñ€Ñ€ÐµÐºÑ‚Ð½Ñ‹Ð¹, Ð½Ð¾ 84% useEffect Ð±ÐµÐ· cleanup (Ð½ÑƒÐ¶ÐµÐ½ Ð°ÑƒÐ´Ð¸Ñ‚) |
| Background timers | **6/10** | 15+ Ð¿Ð¾ÑÑ‚Ð¾ÑÐ½Ð½Ð¾ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‰Ð¸Ñ…, Ð½Ð¾ Ð²ÑÐµ Ñ cleanup refs |
| Polling discipline | **6/10** | 79 polls, Ð¾Ð´Ð¸Ð½ 300ms (Ð°Ð³Ñ€ÐµÑÑÐ¸Ð²Ð½Ñ‹Ð¹), Ð¾ÑÑ‚Ð°Ð»ÑŒÐ½Ð¾Ðµ Ñ€Ð°Ð·ÑƒÐ¼Ð½Ð¾Ðµ |
| Memory hygiene | **7/10** | Caches Ñ eviction, MemoryWatchdog, Ð½Ð¾ stores Ð±ÐµÐ· bounds |
| Subscription discipline | **6/10** | 97 Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ¾Ðº Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ…, 7+ Ð½Ð° MESSAGE_RESPONSE â€” ÑÑ‚Ð¾Ð¸Ñ‚ centralize |
| Web Worker usage | **8/10** | 2 workers Ð´Ð»Ñ CPU-heavy (sandbox, memory) |
| Prefetch strategy | **3/10** | Ð½ÐµÑ‚ proactive prefetch, Ñ‚Ð¾Ð»ÑŒÐºÐ¾ reactive lazy |
| Ð˜Ð·Ð¼ÐµÑ€ÐµÐ½Ð¸Ðµ Ñ€ÐµÑÑƒÑ€ÑÐ¾Ð² | **4/10** | Ñ‚Ð¾Ð»ÑŒÐºÐ¾ MemoryWatchdog Ð² Ð»Ð¾Ð³Ð°Ñ…, Ð½ÐµÑ‚ UI dashboard |
| **Overall Resource Score** | **6.5/10** | Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð° Ñ…Ð¾Ñ€Ð¾ÑˆÐ°Ñ, Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð¸Ð¹ Ð¼Ð°Ð»Ð¾ |

**Ð¡Ð¸Ð»ÑŒÐ½Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- 78% Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ lazy-loaded
- 407 lazyService singletons â€” Ð²ÑÐµ proxy, Ð½Ðµ eager
- 8-tier bootstrap Ñ ÑÐ²Ð½Ñ‹Ð¼ Ð¿Ð¾Ñ€ÑÐ´ÐºÐ¾Ð¼
- `usePolling` auto-pauses Ð½Ð° hidden tab â€” **ÑÑ‚Ð¾ Ñ€ÐµÐ´ÐºÐ°Ñ Ð¸ Ñ…Ð¾Ñ€Ð¾ÑˆÐ°Ñ Ð¿Ñ€Ð°ÐºÑ‚Ð¸ÐºÐ°**
- 2 Web Workers Ð¸Ð·Ð¾Ð»Ð¸Ñ€ÑƒÑŽÑ‚ CPU-heavy
- MemoryWatchdog Ð²ÑÑ‚Ñ€Ð¾ÐµÐ½
- Ð’ÑÐµ major caches Ñ auto-eviction
- Cleanup refs Ñƒ Ð²ÑÐµÑ… background timers

**Ð¡Ð»Ð°Ð±Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- 165 Ñ„Ð°Ð¹Ð»Ð¾Ð² Ñ framer-motion â€” Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»ÑŒÐ½Ð¾ fat chunks
- 1 Ð¿Ð°Ð½ÐµÐ»ÑŒ Ñ polling 300ms (GeminiLivePanel)
- 84% `useEffect` Ð±ÐµÐ· cleanup (Ð½ÑƒÐ¶ÐµÐ½ Ð°ÑƒÐ´Ð¸Ñ‚ Ð½Ð° leaks)
- 97 Ð¿Ñ€ÑÐ¼Ñ‹Ñ… `eventBus.on` Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ… Ð²Ð¼ÐµÑÑ‚Ð¾ store selectors
- ÐÐµÑ‚ proactive prefetch
- ÐÐµÑ‚ runtime resource dashboard Ð² UI
- Tier 7 = `'*'` â€” Ð²ÑÐµ remaining ÑÐµÑ€Ð²Ð¸ÑÑ‹ Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð¸Ñ€ÑƒÑŽÑ‚ÑÑ eagerly
- Ð’ÑÐµ 81 phase-Ñ„Ð°Ð¹Ð»Ð° Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€ÑƒÑŽÑ‚ÑÑ Ð² `index.ts` eagerly

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ñ€Ð¸ÑÐº:** **Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð½Ð°Ñ Ð½Ð°Ð³Ñ€ÑƒÐ·ÐºÐ° Ð½ÐµÐ¸Ð·Ð²ÐµÑÑ‚Ð½Ð°.** ÐÑ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð° Ð²Ñ‹Ð³Ð»ÑÐ´Ð¸Ñ‚ Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾, Ð½Ð¾ Ð±ÐµÐ· runtime profiling Ð½ÐµÐ»ÑŒÐ·Ñ ÑÐºÐ°Ð·Ð°Ñ‚ÑŒ, **Ñ€ÐµÐ°Ð»ÑŒÐ½Ð¾ Ð»Ð¸** 15 background timers Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ð½Ñ‹, **Ñ€ÐµÐ°Ð»ÑŒÐ½Ð¾ Ð»Ð¸** 300ms polling Ñ€Ð¾Ð½ÑÐµÑ‚ CPU, **Ñ€ÐµÐ°Ð»ÑŒÐ½Ð¾ Ð»Ð¸** stores Ñ€Ð°ÑÑ‚ÑƒÑ‚ Ð±ÐµÐ· bounds.

**Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ â„–1:** Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ runtime observability Ð² UI (Ñ€Ð°ÑÑˆÐ¸Ñ€Ð¸Ñ‚ÑŒ `HealthPanel` Ð¸Ð»Ð¸ ÑÐ¾Ð·Ð´Ð°Ñ‚ÑŒ `ResourceMonitorPanel`) â€” Ð²Ñ‹Ð²ÐµÑÑ‚Ð¸ heap, eventBus throughput, active subscriptions, polling count. Ð¡ÐµÐ¹Ñ‡Ð°Ñ ÐµÑÑ‚ÑŒ `MemoryWatchdog` Ð² Ð»Ð¾Ð³Ð°Ñ…, Ð½ÑƒÐ¶Ð½Ð¾ Ð² UI.

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ A. Ð’ÑÐµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ Ð² Ñ†Ð¸Ñ„Ñ€Ð°Ñ…

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð¢Ð¸Ð¿ | Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº |
|---|---:|---|---|
| Lazy panels | 209/268 | POTENTIAL | `route-imports.ts` (`grep -c "React.lazy"`) |
| Eager imports | 3 | POTENTIAL | `route-imports.ts` |
| lazyService singletons | 407 | POTENTIAL | `kernel/instances/*.ts` |
| Service registrations | 549 | POTENTIAL | `service-registration/*.ts` |
| Init tiers | 8 | ARCHITECTURE | `bootstrap-phases.ts` |
| Background `setInterval` (services) | 39 (15+ active) | POTENTIAL | `grep setInterval src/kernel/services` |
| `usePolling` calls | 79 | POTENTIAL | `grep usePolling src/components` |
| Polling interval 300ms | 1 (GeminiLivePanel) | POTENTIAL | grep |
| Polling interval 1500ms | 1 (AudiencePanel) | POTENTIAL | grep |
| Polling interval 15s | 9 panels | POTENTIAL | grep |
| `eventBus.on` in components | 97 | POTENTIAL | grep |
| Files with subscriptions | 46 | PATTERN | grep |
| Total `eventBus.*` calls | 997 | POTENTIAL | grep |
| `useEffect` total | 461 | POTENTIAL | grep |
| `useEffect` with cleanup | 77 (17%) | PATTERN | grep |
| framer-motion importers | 165 | POTENTIAL | grep |
| React Flow importers | 6 | POTENTIAL | grep |
| vis-network importers | 5 | POTENTIAL | grep |
| Monaco importers | 2 | POTENTIAL | grep |
| TipTap importers | 2 | POTENTIAL | grep |
| Mermaid importers | 1 | POTENTIAL | grep |
| Web Workers | 2 | ARCHITECTURE | `find src -name "*.worker.ts"` |
| Zustand stores | 53 | POTENTIAL | `ls src/stores` |
| ILifecycle services | 325 | POTENTIAL | grep |
| Service phase files | 81 | ARCHITECTURE | `ls service-registration` |
| `keyService` calls in components | 78 | POTENTIAL | grep |
| `eventBus` calls in components | 248 | POTENTIAL | grep |
| `MESSAGE_RESPONSE` subscribers | 7+ | POTENTIAL | grep |
| `MemoryWatchdog` | 1 | EVIDENCE | `kernel/utils/memory-watchdog.ts` |
| `usePolling` auto-pause on hidden | âœ… yes | EVIDENCE | `Common/usePolling.ts` |
| Cache eviction timers | 4+ | EVIDENCE | services |

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ B. Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð¸ Ð¼ÐµÑ‚Ð¾Ð´

| Ð§Ñ‚Ð¾ | Ð“Ð´Ðµ | ÐšÐ°Ðº Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ |
|---|---|---|
| Lazy imports | `src/route-imports.ts` | `grep -cE "React.lazy\|lazy\("` |
| Eager imports | `src/route-imports.ts` | `grep -E "^import.*from '\./components"` |
| Singleton pattern | `src/kernel/instances/*.ts` | `grep -rE "lazyService<"` |
| Bootstrap tiers | `src/kernel/bootstrap-phases.ts` | Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ `INIT_TIERS`, `CRITICAL_SERVICES` |
| Service registrations | `src/kernel/service-registration/*.ts` | `grep -rE "register\("` |
| Background timers | `src/kernel/services/*.ts` | `grep -rE "setInterval\("` |
| Polling | `src/components/**` | `grep -rE "usePolling\("` |
| Subscriptions | `src/components/**` | `grep -rE "eventBus\.on\("` |
| Cleanup patterns | `src/components/**` | `grep -rE "return \(\) =>.*clear"` |
| Heavy libs | `src/**` | `grep -rlE "from 'framer-motion'\|@xyflow/react\|vis-network\|@monaco-editor\|@tiptap\|from 'mermaid'"` |
| Web Workers | `src/**` | `find -name "*.worker.ts"` |
| Stores | `src/stores/` | `ls` |
| Service duplication | `src/components/**` | `grep -rE "keyService\.\|memoryEngine\.\|debateEngine\.\|eventBus\.\|budgetService\."` |
| Memory watchdog | `src/kernel/utils/memory-watchdog.ts` | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| usePolling implementation | `src/components/Common/usePolling.ts` | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |

---

*ÐžÑ‚Ñ‡Ñ‘Ñ‚ ÑÐ³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð¾Ð²Ð°Ð½ 2026-10-31 Ð½Ð° Ð¾ÑÐ½Ð¾Ð²Ðµ ÐºÐ¾Ð¼Ð¼Ð¸Ñ‚Ð° `e08ab8e`. Ð’ÑÐµ Ð¾Ñ†ÐµÐ½ÐºÐ¸ â€” ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð·; **Ñ€ÐµÐ°Ð»ÑŒÐ½Ð°Ñ Ð½Ð°Ð³Ñ€ÑƒÐ·ÐºÐ° ÐÐ• Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ð°**, Ð¿Ñ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ Ð½Ðµ Ð·Ð°Ð¿ÑƒÑÐºÐ°Ð»Ð¾ÑÑŒ. ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð¾Ñ‚Ñ‡Ñ‘Ñ‚Ñ‹: Â«ÐšÐ°Ñ€Ñ‚Ð° Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ð¸ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹Â» (ÐºÐ°Ñ‡ÐµÑÑ‚Ð²Ð¾), Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð¹ Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸Â» (Ð·Ð°Ñ‡ÐµÐ¼ Ð½ÑƒÐ¶Ð½Ð¾), Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ‚ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¾Ð³Ð¾ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÑÂ» (Ð·Ð´Ð¾Ñ€Ð¾Ð²ÑŒÐµ ÐºÐ¾Ð´Ð°).*
