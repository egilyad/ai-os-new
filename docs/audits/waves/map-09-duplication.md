# ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð³Ð¾ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ â€” Duplication Map
## SuperAgents OS (`egilyad/ai-os-new`)

> **Ð’ÐµÑ€ÑÐ¸Ñ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°:** commit `e08ab8e` (Oct 31, 2026, Ð²ÐµÑ‚ÐºÐ° `main`)
> **Ð”Ð°Ñ‚Ð° Ð°Ð½Ð°Ð»Ð¸Ð·Ð°:** 2026-10-31
> **ÐœÐµÑ‚Ð¾Ð´:** ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð·: Ð³Ñ€ÑƒÐ¿Ð¿Ð¸Ñ€Ð¾Ð²ÐºÐ° Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð¿Ð¾ Ð¸Ð¼ÐµÐ½Ð°Ð¼, Ð¿Ð¾Ð¸ÑÐº Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ð¾Ð² Ñ„Ð°Ð¹Ð»Ð¾Ð² (`find -name | uniq -d`), Ð°Ð½Ð°Ð»Ð¸Ð· `IMemoryStore` Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¹, Ð¿Ð¾Ð¸ÑÐº Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ñ… ÐºÐ¾Ð½Ñ‚Ñ€Ð°ÐºÑ‚Ð¾Ð² Ð¸ ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²
> **ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ñ‹:** Â«ÐšÐ°Ñ€Ñ‚Ð° Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ð¸ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹Â» + Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð¹ Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸Â» + Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ‚ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¾Ð³Ð¾ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÑÂ» + Â«ÐšÐ°Ñ€Ñ‚Ð° Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ñ Ñ€ÐµÑÑƒÑ€ÑÐ¾Ð²Â»
> **Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚:** Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾ **7 ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¹ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ**, **28 ÐºÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚Ð¾Ð² Ð½Ð° Ð¾Ð±ÑŠÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ðµ** + **12 â€” ÑÐ¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ Ð½ÐµÐ·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÑŒ**.

---

## 1. Ð˜ÑÐ¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾Ðµ Ñ€ÐµÐ·ÑŽÐ¼Ðµ

Ð’ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ðµ **Ð¼Ð½Ð¾Ð³Ð¾ Ð¿Ñ€ÐµÐ´Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð½Ð¾Ð³Ð¾ Ð¸ Ð½ÐµÐ¿Ñ€ÐµÐ´Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð½Ð¾Ð³Ð¾ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ**. Ð§Ð°ÑÑ‚ÑŒ â€” Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð½Ð¾Ðµ Ñ€Ð°Ð·Ð´ÐµÐ»ÐµÐ½Ð¸Ðµ (8 Ñ‚Ð¸Ð¿Ð¾Ð² Ð¿Ð°Ð¼ÑÑ‚Ð¸ = 8 Ñ€Ð°Ð·Ð½Ñ‹Ñ… `IMemoryStore` Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¹), Ñ‡Ð°ÑÑ‚ÑŒ â€” research-Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ðµ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸ (19 `rivals/` Ð¿Ð¾Ð´ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð² = ~175 Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ñ… ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²), Ñ‡Ð°ÑÑ‚ÑŒ â€” Ð½Ð°ÑÑ‚Ð¾ÑÑ‰Ð°Ñ Ð¸Ð·Ð±Ñ‹Ñ‚Ð¾Ñ‡Ð½Ð¾ÑÑ‚ÑŒ (5 budget-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹, 4 health-Ð¿Ð°Ð½ÐµÐ»Ð¸, 4 provider-UI, 97 ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð² Ñ Ð´ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ð¼ `const [error, setError]` Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ð¾Ð¼).

**Ð¡Ð²Ð¾Ð´Ð½Ñ‹Ðµ Ð½Ð°Ñ…Ð¾Ð´ÐºÐ¸:**

| ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ | ÐšÐ¾Ð»-Ð²Ð¾ ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ð¾Ð² | Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ ÑÐºÐ·ÐµÐ¼Ð¿Ð»ÑÑ€ | Ð Ð¸ÑÐº |
|---|---:|---|---|
| Budget-Ð¿Ð°Ð½ÐµÐ»Ð¸ (UI overlap) | **7** | AnalyticsPanel + 4 budget + CostsPanel + KeyUsageAnalytics | ðŸŸ¡ MED |
| Health-Ð¿Ð°Ð½ÐµÐ»Ð¸ (UI overlap) | **4** | HealthPanel, SystemHealth, DocsHealth, HealthSla | ðŸŸ¡ MED |
| Provider-UI (4 Ñ‚Ð¾Ñ‡ÐºÐ¸ Ð²Ñ…Ð¾Ð´Ð°) | **4** | ProviderManager, ProviderDashboard, ProviderMarketplace, OpenRouterPanel | ðŸŸ¡ MED |
| Memory-Ð¿Ð°Ð½ÐµÐ»Ð¸ | **6+** | MemoryPanel, MemoryCenter, FederatedMemory, MemoryTransfer, KnowledgePanel, WikiBrain | ðŸŸ¡ MED |
| Marketplace-Ð¿Ð°Ð½ÐµÐ»Ð¸ | **4** | AgentMarketplace, PersonaMarketplace, ProviderMarketplace, RivalsCatalog | ðŸŸ¡ LOW |
| Hub-Ð¿Ð°Ð½ÐµÐ»Ð¸ | **6** | CommunityHub, LearnHub, MemoryCenter, ProviderDashboard, SessionHub, DebatesManager | ðŸŸ¡ LOW |
| 62 TechniquePanels (uniform) | **62** | `TechniquePanels/*.tsx` (diff = 4 ÑÑ‚Ñ€Ð¾ÐºÐ¸) | ðŸŸ¡ MED |
| `rivals/` subdir (parallel impl) | **19 ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð², ~175 Ñ„Ð°Ð¹Ð»Ð¾Ð²** | `rivals/`, `rivals2/`â€¦`rivals20/` | ðŸ”´ HIGH |
| 8 `IMemoryStore` impl | **8** | working/procedural/semantic/episodic/social/service-backed/spatial/emotional | ðŸŸ¢ architectural |
| 6 memory-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ð²ÐµÑ€Ñ…Ð½ÐµÐ³Ð¾ ÑƒÑ€Ð¾Ð²Ð½Ñ | **6** | memory-engine, memory-orchestrator, memory-transfer, federated-memory, session-memory, project-memory | ðŸŸ¡ MED |
| 10 memory-contract Ñ„Ð°Ð¹Ð»Ð¾Ð² | **10** | memory-store/memory-transfer/memory/federated-memory/project-memory/session-memory | ðŸŸ¡ MED |
| 16 key-management Ñ„Ð°Ð¹Ð»Ð¾Ð² | **16** | key-alerts/analytics/diagnostics/fingerprints/health/lifecycle/metrics/models/pool-selector/quotas/registry-utils/registry/service/status/types/vault | ðŸŸ¢ LOW (modular) |
| 14 router-related Ñ„Ð°Ð¹Ð»Ð¾Ð² | **14** | provider-router, route-rules, router-config-manager, â€¦ 12 router-* | ðŸŸ¡ MED |
| 5 health-related contracts | **5** | agent-health, health-check, health-sla, health, probe | ðŸŸ¡ MED |
| 5 health-related services | **5** | agent-health-monitor, health-sla-service, monitoring-service, probe-service, router-latency-monitor | ðŸŸ¡ MED |
| Ð”ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ñ‹ Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð² rivals/ | **7 Ð¿Ð°Ñ€** | cache-serviceÃ—3, project-serviceÃ—2, policy-serviceÃ—2, persona-serviceÃ—2, n8n-serviceÃ—2, blackboard-serviceÃ—2, assistant-serviceÃ—2 | ðŸ”´ HIGH |
| Error-handling Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½ | **97 Ñ„Ð°Ð¹Ð»Ð¾Ð²** Ñ `const [error, setError]` + **26** Ñ `useAutoClearError` hook | ðŸŸ¡ MED (Ð½ÑƒÐ¶Ð½Ð° ÑÑ‚Ð°Ð½Ð´Ð°Ñ€Ñ‚Ð¸Ð·Ð°Ñ†Ð¸Ñ) |
| 2 cache-ÑÐµÑ€Ð²Ð¸ÑÐ° | **2** | cache-service.ts + gemini-cache-service.ts | ðŸŸ¡ LOW |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ ÐºÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚Ñ‹ Ð½Ð° Ð¾Ð±ÑŠÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ðµ:**
1. **5 budget + 4 health + 4 provider panels** â†’ Ñ‚Ð°Ð±-hub'Ñ‹ (3 Ð²Ð¼ÐµÑÑ‚Ð¾ 13)
2. **62 TechniquePanels** â†’ 1 ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³
3. **97 Ñ€ÑƒÑ‡Ð½Ñ‹Ñ… `setError`** â†’ 1 `useAutoClearError` hook
4. **6 memory-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ð²ÐµÑ€Ñ…Ð½ÐµÐ³Ð¾ ÑƒÑ€Ð¾Ð²Ð½Ñ** â†’ `MemoryOrchestrator` ÐºÐ°Ðº single entry
5. **19 `rivals/` Ð¿Ð¾Ð´ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð²** â†’ **Ð¿ÐµÑ€ÐµÐ¼ÐµÑÑ‚Ð¸Ñ‚ÑŒ Ð² `experimental/` Ð¸Ð»Ð¸ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ**, Ð¾ÑÑ‚Ð°Ð²Ð¸Ñ‚ÑŒ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ live

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ ÐºÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚Ñ‹ Ð¡ÐžÐ¥Ð ÐÐÐ˜Ð¢Ð¬ ÐÐ•Ð—ÐÐ’Ð˜Ð¡Ð˜ÐœÐ«ÐœÐ˜:**
1. **8 Ñ‚Ð¸Ð¿Ð¾Ð² Ð¿Ð°Ð¼ÑÑ‚Ð¸** (`IMemoryStore` implementations) â€” Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð½Ð¾ Ñ€Ð°Ð·Ð½Ñ‹Ðµ (semantic vs episodic vs emotionalâ€¦)
2. **14 router-* Ñ„Ð°Ð¹Ð»Ð¾Ð²** â€” decomposition Ð¾Ð´Ð½Ð¾Ð³Ð¾ ÑÐ»Ð¾Ð¶Ð½Ð¾Ð³Ð¾ Ð´Ð¾Ð¼ÐµÐ½Ð° (scoring, ranking, fallback, recordingâ€¦)
3. **16 key-management Ñ„Ð°Ð¹Ð»Ð¾Ð²** â€” fine-grained separation of concerns
4. **LLM adapters (12 Ñ„Ð°Ð¹Ð»Ð¾Ð²)** â€” Ð¿Ð¾ Ð¾Ð´Ð½Ð¾Ð¼Ñƒ Ð½Ð° Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð°, Ð¾Ð±ÑÐ·Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾

---

## 2. ÐœÐµÑ‚Ð¾Ð´Ð¾Ð»Ð¾Ð³Ð¸Ñ: 6 Ñ‚Ð¸Ð¿Ð¾Ð² Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ

| # | Ð¢Ð¸Ð¿ | Ð§Ñ‚Ð¾ Ð¸Ñ‰ÐµÐ¼ | ÐŸÑ€Ð¸Ð·Ð½Ð°Ðº |
|---|---|---|---|
| 1 | **ÐŸÐ°Ð½ÐµÐ»Ð¸ Ñ Ð¿Ð¾Ñ…Ð¾Ð¶Ð¸Ð¼Ð¸ Ñ„ÑƒÐ½ÐºÑ†Ð¸ÑÐ¼Ð¸** | UI-Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ñ‹ | Ð¿Ð¾Ñ…Ð¾Ð¶Ð¸Ðµ Ð¸Ð¼ÐµÐ½Ð°, overlap Ð² Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾ÑÑ‚Ð¸ |
| 2 | **ÐŸÐ¾Ð²Ñ‚Ð¾Ñ€ÑÑŽÑ‰Ð¸ÐµÑÑ ÑÐµÑ€Ð²Ð¸ÑÑ‹** | Ð¡ÐµÑ€Ð²Ð¸Ñ-Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ñ‹ | Ð¾Ð´Ð½Ð¾ Ð¸Ð¼Ñ Ñ„Ð°Ð¹Ð»Ð° Ð² Ñ€Ð°Ð·Ð½Ñ‹Ñ… ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð°Ñ… |
| 3 | **Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸ÐµÑÑ Ð¼ÐµÑ…Ð°Ð½Ð¸Ð·Ð¼Ñ‹** | Pattern-Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ñ‹ | `setError`, `useEffect`, `polling` |
| 4 | **ÐÐµÑÐºÐ¾Ð»ÑŒÐºÐ¾ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¹ Ð¾Ð´Ð½Ð¾Ð¹ Ð·Ð°Ð´Ð°Ñ‡Ð¸** | Parallel impl | Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¾ ÐºÐ»Ð°ÑÑÐ¾Ð² Ñ Ð¾Ð´Ð¸Ð½Ð°ÐºÐ¾Ð²Ñ‹Ð¼ Ð¸Ð½Ñ‚ÐµÑ€Ñ„ÐµÐ¹ÑÐ¾Ð¼ |
| 5 | **ÐŸÐ¾Ð²Ñ‚Ð¾Ñ€ÑÑŽÑ‰Ð¸ÐµÑÑ Ð¸Ð½Ñ‚ÐµÑ€Ñ„ÐµÐ¹ÑÑ‹** | Contract-Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ñ‹ | Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¾ `IXxx` Ð´Ð»Ñ Ð¾Ð´Ð½Ð¾Ð³Ð¾ ÐºÐ¾Ð½Ñ†ÐµÐ¿Ñ‚Ð° |
| 6 | **ÐŸÐ°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ðµ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð¾Ð´Ð½Ð¸Ñ… Ð´Ð°Ð½Ð½Ñ‹Ñ…** | Source-Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ñ‹ | Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¾ ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ñ‡Ð¸Ñ‚Ð°ÑŽÑ‚ Ð¾Ð´Ð¸Ð½ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº |

**ÐšÐ»Ð°ÑÑÐ¸Ñ„Ð¸ÐºÐ°Ñ†Ð¸Ñ Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚Ð°:**
- ðŸŸ¢ **KEEP INDEPENDENT** â€” Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ Ð¿Ñ€ÐµÐ´Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð½Ð¾Ðµ (Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð½Ð¾Ðµ, modular, plugin-pattern)
- ðŸŸ¡ **MERGE CANDIDATE** â€” ÑÑ‚Ð¾Ð¸Ñ‚ Ð¾Ð±ÑŠÐµÐ´Ð¸Ð½Ð¸Ñ‚ÑŒ Ð² Ð¾Ð±Ñ‰Ð¸Ð¹ ÑÐµÑ€Ð²Ð¸Ñ/Ð¿Ð°Ð½ÐµÐ»ÑŒ
- ðŸ”´ **DUPLICATE / REMOVE** â€” Ð½Ð°ÑÑ‚Ð¾ÑÑ‰Ð°Ñ Ð¸Ð·Ð±Ñ‹Ñ‚Ð¾Ñ‡Ð½Ð¾ÑÑ‚ÑŒ, ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¸Ð»Ð¸ Ð¿ÐµÑ€ÐµÐ¼ÐµÑÑ‚Ð¸Ñ‚ÑŒ Ð² experimental

---

## 3. ÐŸÐ°Ð½ÐµÐ»Ð¸ Ñ Ð¿Ð¾Ñ…Ð¾Ð¶Ð¸Ð¼Ð¸ Ñ„ÑƒÐ½ÐºÑ†Ð¸ÑÐ¼Ð¸ (UI overlap)

### 3.1. Budget-Ð´Ð¾Ð¼ÐµÐ½ â€” 7 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ ðŸ”´ DUPLICATE

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð§Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ | Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÐµÑ‚? |
|---|---:|---|---|
| `BudgetPanel.tsx` | 179 | Ð‘ÑŽÐ´Ð¶ÐµÑ‚ setting + spend view | â€” (Ð³Ð»Ð°Ð²Ð½Ð°Ñ) |
| `BudgetPanel/` | (dir) | Ð¢Ð¾Ð¶Ðµ Budget | ðŸ”´ duplicate route |
| `BudgetAlertsPanel.tsx` | 322 | Alerts Ð¿Ñ€Ð¸ Ð¿Ñ€ÐµÐ²Ñ‹ÑˆÐµÐ½Ð¸Ð¸ budget | ðŸŸ¡ subset of Budget |
| `CostOptimizationPanel.tsx` | 339 | Cost optimization recommendations | ðŸŸ¡ overlap Ñ SRE |
| `CostAnalyticsPanel.tsx` | 453 | Analytics ÑÑ‚Ð¾Ð¸Ð¼Ð¾ÑÑ‚Ð¸ | ðŸŸ¡ overlap Ñ AnalyticsPanel |
| `CostsPanel.tsx` | 203 | Ð¢Ñ€Ð°Ñ‚Ñ‹ ÐºÐ¾Ð¼Ð¿Ð°Ð½Ð¸Ð¹ (gateway) | ðŸŸ¡ overlap Ñ Budget |
| `AnalyticsPanel/AnalyticsPanel.tsx` | â€” | ÐÐ½Ð°Ð»Ð¸Ñ‚Ð¸ÐºÐ° Ð¾Ð±Ñ‰Ð°Ñ | ðŸŸ¡ Ð²ÐºÐ»ÑŽÑ‡Ð°ÐµÑ‚ cost-analytics |
| `KeyUsageAnalyticsPanel.tsx` | 297 | Usage per key | ðŸŸ¡ subset of analytics |

**Verdict:** ðŸ”´ **MERGE Ð² 1 `BudgetHub`** Ñ Ñ‚Ð°Ð±Ð°Ð¼Ð¸: Overview / Spend / Alerts / Optimization / Per-Key / Companies. **Ð¡ÑÐºÐ¾Ð½Ð¾Ð¼Ð¸Ñ‚ 6 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð¾Ð² Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸.**

### 3.2. Health-Ð´Ð¾Ð¼ÐµÐ½ â€” 4 Ð¿Ð°Ð½ÐµÐ»Ð¸ ðŸŸ¡ MERGE

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð§Ñ‚Ð¾ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ | Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÐµÑ‚? |
|---|---|---|
| `HealthPanel.tsx` (530 ÑÑ‚Ñ€Ð¾Ðº) | Vitals + kernel services + probe + timeline + score | â€” (Ð³Ð»Ð°Ð²Ð½Ð°Ñ) |
| `SystemHealthPanel.tsx` (219) | Ð¡Ð¸ÑÑ‚ÐµÐ¼Ð½Ð¾Ðµ Ð·Ð´Ð¾Ñ€Ð¾Ð²ÑŒÐµ | ðŸŸ¡ subset |
| `DocsHealthPanel.tsx` (218) | Ð”Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð°Ñ†Ð¸Ñ health | ðŸŸ¢ Ð´Ñ€ÑƒÐ³Ð¾Ðµ (Ð½Ð¾ UI-Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½ Ñ‚Ð¾Ñ‚ Ð¶Ðµ) |
| `HealthSlaPanel.tsx` (441) | SLA-Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ | ðŸŸ¡ `@deprecated MOCK` (ÑÐ¼. Tech Health Map) |

**Verdict:** ðŸŸ¡ **MERGE SystemHealth + HealthSla Ð² HealthPanel** Ñ Ñ‚Ð°Ð±Ð°Ð¼Ð¸. DocsHealth Ð¾ÑÑ‚Ð°Ð²Ð¸Ñ‚ÑŒ Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð¾Ð¹ (Ð´Ñ€ÑƒÐ³Ð¾Ð¹ Ð´Ð¾Ð¼ÐµÐ½). **HealthSlaPanel â€” ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ** (`@deprecated MOCK`).

### 3.3. Provider-Ð´Ð¾Ð¼ÐµÐ½ â€” 4 Ñ‚Ð¾Ñ‡ÐºÐ¸ Ð²Ñ…Ð¾Ð´Ð° ðŸ”´ DUPLICATE

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð§Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ | Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÐµÑ‚? |
|---|---|---|
| `ProviderManager/` (1765 ÑÑ‚Ñ€Ð¾Ðº, 4 views) | Keys + models + rotation + routing + pools | â€” (Ð³Ð»Ð°Ð²Ð½Ð°Ñ) |
| `ProviderDashboard.tsx` (670) | Ð”Ð°ÑˆÐ±Ð¾Ñ€Ð´ Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð¾Ð² | ðŸŸ¡ subset (overview) |
| `ProviderMarketplace.tsx` (347) | ÐœÐ°Ñ€ÐºÐµÑ‚Ð¿Ð»ÐµÐ¹Ñ Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð¾Ð² | ðŸŸ¢ Ð´Ñ€ÑƒÐ³Ð¾Ðµ (discover) |
| `OpenRouterPanel.tsx` (29 ÑÑ‚Ñ€Ð¾Ðº!) | ÐœÐ¸ÐºÑ€Ð¾-Ð¾Ð±Ñ‘Ñ€Ñ‚ÐºÐ° | ðŸ”´ **Ð¿Ð¾Ð»Ð½Ñ‹Ð¹ Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚**, Ð´ÐµÐ»ÐµÐ³Ð¸Ñ€ÑƒÐµÑ‚ Ð² ProviderManager |

**Verdict:** ðŸ”´ **Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ `OpenRouterPanel`** (29 ÑÑ‚Ñ€Ð¾Ðº, ÑÐ²Ð½Ñ‹Ð¹ Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚). `ProviderDashboard` MERGE Ð² ProviderManager ÐºÐ°Ðº Â«OverviewÂ» Ñ‚Ð°Ð±. `ProviderMarketplace` â€” Ð¾ÑÑ‚Ð°Ð²Ð¸Ñ‚ÑŒ Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð¾Ð¹ (discover vs manage â€” Ñ€Ð°Ð·Ð½Ñ‹Ðµ Ð·Ð°Ð´Ð°Ñ‡Ð¸).

### 3.4. Memory-Ð´Ð¾Ð¼ÐµÐ½ â€” 6+ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ ðŸŸ¡ MERGE PARTIAL

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð§Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ | Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÐµÑ‚? |
|---|---|---|
| `MemoryPanel/` | BM25 + semantic search, chunks | â€” (Ð³Ð»Ð°Ð²Ð½Ð°Ñ) |
| `MemoryCenterPanel/` | Ð¥Ð°Ð± Ð¿Ð°Ð¼ÑÑ‚Ð¸ | ðŸŸ¡ overlap (hub) |
| `FederatedMemoryPanel.tsx` (517) | Federated memory (experimental) | ðŸŸ¢ Ð´Ñ€ÑƒÐ³Ð¾Ðµ (federation) |
| `MemoryTransferPanel.tsx` | Transfer memory | ðŸŸ¢ Ð´Ñ€ÑƒÐ³Ð¾Ðµ (export/import) |
| `KnowledgePanel/` | RAG documents | ðŸŸ¢ Ð´Ñ€ÑƒÐ³Ð¾Ðµ (knowledge) |
| `WikiBrainPanel/` | RAG Ð¿Ð¾ wiki | ðŸŸ¢ Ð´Ñ€ÑƒÐ³Ð¾Ðµ (wiki) |

**Verdict:** ðŸŸ¡ `MemoryCenterPanel` Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð±Ñ‹Ñ‚ÑŒ **entry point hub** (Ð¾Ð±Ð·Ð¾Ñ€ Ð²ÑÐµÑ… memory-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²), Ð° Ð½Ðµ Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚ MemoryPanel. ÐžÑÑ‚Ð°Ð»ÑŒÐ½Ñ‹Ðµ â€” **ÑÐ¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ Ð½ÐµÐ·Ð°Ð²Ð¸ÑÐ¸Ð¼Ñ‹Ð¼Ð¸** (Ñ€Ð°Ð·Ð½Ñ‹Ðµ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð´Ð°Ð½Ð½Ñ‹Ñ…).

### 3.5. Marketplace-Ð´Ð¾Ð¼ÐµÐ½ â€” 4 Ð¿Ð°Ð½ÐµÐ»Ð¸ ðŸŸ¢ KEEP

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð§Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ |
|---|---|
| `AgentMarketplacePanel.tsx` (102) | ÐœÐ°Ñ€ÐºÐµÑ‚Ð¿Ð»ÐµÐ¹Ñ Ð°Ð³ÐµÐ½Ñ‚Ð¾Ð² |
| `PersonaMarketplacePanel.tsx` (259) | ÐœÐ°Ñ€ÐºÐµÑ‚Ð¿Ð»ÐµÐ¹Ñ Ð¿ÐµÑ€ÑÐ¾Ð½ |
| `ProviderMarketplace.tsx` (347) | ÐœÐ°Ñ€ÐºÐµÑ‚Ð¿Ð»ÐµÐ¹Ñ Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð¾Ð² |
| `RivalsCatalogPanel.tsx` (85) | ÐšÐ°Ñ‚Ð°Ð»Ð¾Ð³ Ð²Ð°Ñ€Ð¸Ð°Ð½Ñ‚Ð¾Ð² |

**Verdict:** ðŸŸ¢ **KEEP INDEPENDENT** â€” Ñ€Ð°Ð·Ð½Ñ‹Ðµ Ð´Ð¾Ð¼ÐµÐ½Ñ‹ (agents vs personas vs providers). UI-Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½ Ð¾Ð´Ð¸Ð½Ð°ÐºÐ¾Ð²Ñ‹Ð¹ â€” Ð¼Ð¾Ð¶Ð½Ð¾ Ð²Ñ‹Ð½ÐµÑÑ‚Ð¸ `MarketplaceLayout` shared-ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚, Ð½Ð¾ Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð¾ÑÑ‚Ð°Ð²Ð¸Ñ‚ÑŒ.

### 3.6. Hub-Ð´Ð¾Ð¼ÐµÐ½ â€” 6 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ ðŸŸ¡ PARTIAL MERGE

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð§Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ |
|---|---:|---|
| `CommunityHubPanel.tsx` (310) | Community |
| `LearnHubPanel.tsx` (67) | Hub: Tutorials + Docs + Patterns + DecisionLog |
| `MemoryCenterPanel/` | Hub Ð¿Ð°Ð¼ÑÑ‚Ð¸ |
| `ProviderDashboard.tsx` (670) | Dashboard Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð¾Ð² |
| `SessionHubPanel.tsx` (564) | Ð¥Ð°Ð± ÑÐµÑÑÐ¸Ð¹ |
| `DebatesManagerPanel.tsx` (714) | ÐœÐµÐ½ÐµÐ´Ð¶ÐµÑ€ Ð´ÐµÐ±Ð°Ñ‚Ð¾Ð² |

**Verdict:** ðŸŸ¡ Hub-Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½ Ð¿Ð¾Ð²Ñ‚Ð¾Ñ€ÑÐµÑ‚ÑÑ. `LearnHubPanel` (67 ÑÑ‚Ñ€Ð¾Ðº) â€” Ñ‚Ð¾Ð½ÐºÐ°Ñ Ð¾Ð±Ñ‘Ñ€Ñ‚ÐºÐ° Ð½Ð°Ð´ 4 Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ñ‹Ð¼Ð¸ Ð¿Ð°Ð½ÐµÐ»ÑÐ¼Ð¸. Ð•ÑÐ»Ð¸ Ð¾Ð½Ð¸ ÑƒÐ¶Ðµ Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹ Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸ Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð¾ â€” `LearnHubPanel` Ð´ÑƒÐ±Ð»Ð¸Ñ€ÑƒÐµÑ‚. ÐžÑÑ‚Ð°Ð»ÑŒÐ½Ñ‹Ðµ â€” ÑÐ°Ð¼Ð¾ÑÑ‚Ð¾ÑÑ‚ÐµÐ»ÑŒÐ½Ñ‹Ðµ.

### 3.7. 62 TechniquePanels â€” ðŸŸ¡ MERGE (Ð¾Ð´Ð¸Ð½ ÑˆÐ°Ð±Ð»Ð¾Ð½)

**Ð’ÑÐµ 62 Ñ„Ð°Ð¹Ð»Ð° Ð² `TechniquePanels/*.tsx` â€” 234 ÑÑ‚Ñ€Ð¾ÐºÐ¸, Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ‡Ð½Ñ‹ ÐºÑ€Ð¾Ð¼Ðµ:**
- `TECHNIQUE_ID` (humor/critic/steelman/â€¦)
- `CATEGORY` (P0/P1/P2)
- `mode` FocusSection (`arguments` vs `agents`)

```bash
$ diff <(sed -E 's/humor|Humor/XXX/g' HumorPanel.tsx) \
       <(sed -E 's/critic|Critic/XXX/g' CriticPanel.tsx) | wc -l
4
```

**Verdict:** ðŸŸ¡ **MERGE Ð² 1 `<TechniquePanel techniqueId="humor" />` generic-ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚ + 1 ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³-ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ñƒ.** Ð¡ÑÐºÐ¾Ð½Ð¾Ð¼Ð¸Ñ‚ ~14 500 LOC Ð¸ 61 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚.

### 3.8. DebateReplay â€” 5 Ñ„Ð°Ð¹Ð»Ð¾Ð², ÑÑ‚Ð¾ decomposition ðŸŸ¢ KEEP

`DebateReplayControls.tsx` (207) + `DebateReplayEventDetail.tsx` (88) + `DebateReplaySidebar.tsx` (112) + `DebateReplayTimeline.tsx` (199) + `DebateReplayLiveControls.tsx` (50) + `DebateReplayPanel.tsx` (328) + `DebateReplayTypes.ts`.

**Verdict:** ðŸŸ¢ **KEEP INDEPENDENT** â€” ÑÑ‚Ð¾ decomposition Ð¾Ð´Ð½Ð¾Ð¹ Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð½Ð° 6 Ð¿Ð¾Ð´-ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð¾Ð². ÐÐµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ.

---

## 4. ÐŸÐ¾Ð²Ñ‚Ð¾Ñ€ÑÑŽÑ‰Ð¸ÐµÑÑ ÑÐµÑ€Ð²Ð¸ÑÑ‹ â€” `rivals/` parallel implementations ðŸ”´ HIGH

### 4.1. 19 `rivals/` Ð¿Ð¾Ð´ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð² â€” Ð³Ð»Ð°Ð²Ð½Ð°Ñ Ð½Ð°Ñ…Ð¾Ð´ÐºÐ°

```
src/kernel/services/
â”œâ”€â”€ rivals/     19 files
â”œâ”€â”€ rivals2/    10 files
â”œâ”€â”€ rivals3/    10 files
â”œâ”€â”€ rivals4/    11 files
â”œâ”€â”€ rivals5/    10 files
â”œâ”€â”€ rivals6/    10 files
â”œâ”€â”€ rivals7/    10 files
â”œâ”€â”€ rivals9/     4 files
â”œâ”€â”€ rivals10/  10 files
â”œâ”€â”€ rivals11/   9 files
â”œâ”€â”€ rivals12/  10 files
â”œâ”€â”€ rivals13/   3 files
â”œâ”€â”€ rivals14/   8 files
â”œâ”€â”€ rivals15/  10 files
â”œâ”€â”€ rivals16/  10 files
â”œâ”€â”€ rivals17/  10 files
â”œâ”€â”€ rivals18/  10 files
â”œâ”€â”€ rivals19/  11 files
â”œâ”€â”€ rivals20/   4 files
TOTAL:        ~175 files
```

ÐšÐ°Ð¶Ð´Ñ‹Ð¹ `rivalsN/` ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³ ÑÐ¾Ð´ÐµÑ€Ð¶Ð¸Ñ‚ **Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ðµ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸** ÑÑ…Ð¾Ð¶Ð¸Ñ… ÐºÐ¾Ð½Ñ†ÐµÐ¿Ñ‚Ð¾Ð²: `cache-service.ts`, `project-service.ts`, `policy-service.ts`, `persona-service.ts`, `n8n-service.ts`, `blackboard-service.ts`, `assistant-service.ts`.

### 4.2. Ð”ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ñ‹ Ñ„Ð°Ð¹Ð»Ð¾Ð² (Ñ‚Ð¾ Ð¶Ðµ Ð¸Ð¼Ñ, Ñ€Ð°Ð·Ð½Ñ‹Ðµ ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¸) ðŸ”´

| Ð¤Ð°Ð¹Ð»-Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚ | Ð“Ð´Ðµ | Ð Ð°Ð·Ð¼ÐµÑ€ |
|---|---|---|
| `cache-service.ts` | `services/` (337) + `rivals10/` (97) + `rivals14/` (34) | **3 ÐºÐ¾Ð¿Ð¸Ð¸** |
| `project-service.ts` | `services/` (263) + `rivals14/` (23) | 2 ÐºÐ¾Ð¿Ð¸Ð¸ |
| `policy-service.ts` | `services/` (565) + `rivals18/` (15) | 2 ÐºÐ¾Ð¿Ð¸Ð¸ |
| `persona-service.ts` | `services/` (468) + `persona/` (200) | 2 ÐºÐ¾Ð¿Ð¸Ð¸ |
| `n8n-service.ts` | `services/` (101) + `rivals6/` (151) | 2 ÐºÐ¾Ð¿Ð¸Ð¸ |
| `blackboard-service.ts` | `services/` (108) + `rivals17/` (19) | 2 ÐºÐ¾Ð¿Ð¸Ð¸ |
| `assistant-service.ts` | `services/` (489) + `rivals4/` (115) | 2 ÐºÐ¾Ð¿Ð¸Ð¸ |

**ÐŸÑ€Ð¾Ð²ÐµÑ€ÐºÐ° ÑÐ¾Ð´ÐµÑ€Ð¶Ð¸Ð¼Ð¾Ð³Ð¾ (cache-service):**
- `services/cache-service.ts` (337 ÑÑ‚Ñ€Ð¾Ðº) â€” `CacheService implements ICacheService`, LLM response cache
- `rivals10/cache-service.ts` (97 ÑÑ‚Ñ€Ð¾Ðº) â€” `CacheRegistryService implements ICacheRegistryService`, Gemini context-cache manager
- `rivals14/cache-service.ts` (34 ÑÑ‚Ñ€Ð¾ÐºÐ¸) â€” Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð°Ñ stub

**Verdict:** ðŸ”´ **rivalsN â€” research/experimental implementations**. ÐšÐ°Ð¶Ð´Ð°Ñ `rivalsN` = Â«Ð¿Ð¾Ð¿Ñ‹Ñ‚ÐºÐ° â„–NÂ» Ð¿ÐµÑ€ÐµÐ¾Ð¿Ñ€ÐµÐ´ÐµÐ»Ð¸Ñ‚ÑŒ ÑÐµÑ€Ð²Ð¸Ñ. **Ð”Ð¾Ð»Ð¶Ð½Ñ‹ Ð±Ñ‹Ñ‚ÑŒ:**
- ÐŸÐµÑ€ÐµÐ¼ÐµÑ‰ÐµÐ½Ñ‹ Ð² `src/experimental/rivals/` Ð¸Ð»Ð¸ `src/research/`
- Ð˜Ð»Ð¸ ÑƒÐ´Ð°Ð»ÐµÐ½Ñ‹, ÐµÑÐ»Ð¸ Ð½Ðµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÑŽÑ‚ÑÑ (Ð½ÑƒÐ¶Ð½Ð° Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ° Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¾Ð²)
- ÐžÑÑ‚Ð°Ð²Ð»ÐµÐ½Ñ‹ Ð² `services/` Ñ‚Ð¾Ð»ÑŒÐºÐ¾ canonical Ð²ÐµÑ€ÑÐ¸Ð¸

**POTENTIAL waste:** ~175 Ñ„Ð°Ð¹Ð»Ð¾Ð² Ã— ÑÑ€ÐµÐ´Ð½Ð¸Ð¹ 100 ÑÑ‚Ñ€Ð¾Ðº = **~17 500 LOC research-ÐºÐ¾Ð´Ð° Ð² Ð¾ÑÐ½Ð¾Ð²Ð½Ð¾Ð¹ ÐºÐ¾Ð´Ð¾Ð²Ð¾Ð¹ Ð±Ð°Ð·Ðµ**.

### 4.3. `rivals20/` â€” Ð¸Ð½Ñ„Ñ€Ð°ÑÑ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ð½Ñ‹Ðµ ÑÐµÑ€Ð²Ð¸ÑÑ‹

```
rivals20/codex-services.ts
rivals20/infra-services.ts
rivals20/interpreter-services.ts
rivals20/live-backends.test.ts
```

Ð’ÐºÐ»ÑŽÑ‡Ð°ÐµÑ‚ `LangfuseService`, `LangsmithService` (Ð·Ð°Ð³Ð»ÑƒÑˆÐºÐ°), `WhaleService` Ð¸ Ñ‚.Ð´. â€” **3-5 Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ñ… observability-backend Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¹**.

**Verdict:** ðŸ”´ **Ð”ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ observability-backends.** ÐžÑÑ‚Ð°Ð²Ð¸Ñ‚ÑŒ 1 canonical (Langfuse ÐµÑÐ»Ð¸ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ), Ð¾ÑÑ‚Ð°Ð»ÑŒÐ½Ñ‹Ðµ â€” experimental.

---

## 5. ÐÐµÑÐºÐ¾Ð»ÑŒÐºÐ¾ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¹ Ð¾Ð´Ð½Ð¾Ð¹ Ð·Ð°Ð´Ð°Ñ‡Ð¸

### 5.1. 8 `IMemoryStore` Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¹ ðŸŸ¢ KEEP (architectural)

Ð’ÑÐµ Ñ€ÐµÐ°Ð»Ð¸Ð·ÑƒÑŽÑ‚ `IMemoryStore`:

| Ð ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð¢Ð¸Ð¿ Ð¿Ð°Ð¼ÑÑ‚Ð¸ |
|---|---:|---|
| `working-memory.ts` | 101 | Ð Ð°Ð±Ð¾Ñ‡Ð°Ñ (ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚) |
| `procedural-memory.ts` | 84 | ÐŸÑ€Ð¾Ñ†ÐµÐ´ÑƒÑ€Ð½Ð°Ñ (skills) |
| `semantic-memory.ts` | 122 | Ð¡ÐµÐ¼Ð°Ð½Ñ‚Ð¸Ñ‡ÐµÑÐºÐ°Ñ (meaning) |
| `episodic-memory.ts` | 109 | Ð­Ð¿Ð¸Ð·Ð¾Ð´Ð¸Ñ‡ÐµÑÐºÐ°Ñ (events) |
| `social-memory.ts` | 81 | Ð¡Ð¾Ñ†Ð¸Ð°Ð»ÑŒÐ½Ð°Ñ (relations) |
| `service-backed-memory.ts` | 177 | Bridge Ðº Ð²Ð½ÐµÑˆÐ½ÐµÐ¼Ñƒ ÑÐµÑ€Ð²Ð¸ÑÑƒ |
| `spatial-memory.ts` | 113 | ÐŸÑ€Ð¾ÑÑ‚Ñ€Ð°Ð½ÑÑ‚Ð²ÐµÐ½Ð½Ð°Ñ |
| `emotional-memory.ts` | 99 | Ð­Ð¼Ð¾Ñ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð°Ñ |

**Verdict:** ðŸŸ¢ **KEEP INDEPENDENT** â€” ÑÑ‚Ð¾ **Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð½Ð¾Ðµ** Ñ€Ð°Ð·Ð´ÐµÐ»ÐµÐ½Ð¸Ðµ Ð¿Ð¾ Ñ‚Ð¸Ð¿Ð°Ð¼ Ð¿Ð°Ð¼ÑÑ‚Ð¸ (ÐºÐ¾Ð³Ð½Ð¸Ñ‚Ð¸Ð²Ð½Ð°Ñ Ð¿ÑÐ¸Ñ…Ð¾Ð»Ð¾Ð³Ð¸Ñ). ÐšÐ°Ð¶Ð´Ð°Ñ â€” Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ñ‹Ð¹ cognitive memory system. **ÐÐµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ.**

### 5.2. 6 memory-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ð²ÐµÑ€Ñ…Ð½ÐµÐ³Ð¾ ÑƒÑ€Ð¾Ð²Ð½Ñ ðŸŸ¡ MERGE (single entry)

| Ð¡ÐµÑ€Ð²Ð¸Ñ | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð—Ð°Ñ‡ÐµÐ¼ |
|---|---:|---|
| `memory-engine.ts` | 1 088 | Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ð´Ð²Ð¸Ð¶Ð¾Ðº (BM25 + semantic) |
| `memory-orchestrator.ts` | 224 | ÐžÑ€ÐºÐµÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€ (Ð²ÐºÐ»ÑŽÑ‡Ð°ÐµÑ‚ sub-services) |
| `memory-transfer-service.ts` | 359 | Export/import |
| `federated-memory-service.ts` | 257 | Federated sync |
| `session-memory-service.ts` | 205 | Session-scoped memory |
| `project-memory-service.ts` | 225 | Project-scoped memory |

**Verdict:** ðŸŸ¡ `memory-orchestrator` Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð±Ñ‹Ñ‚ÑŒ **single entry point** Ð´Ð»Ñ Ð²Ð½ÐµÑˆÐ½Ð¸Ñ… Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»ÐµÐ¹. Ð¡ÐµÐ¹Ñ‡Ð°Ñ Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð¼Ð¾Ð³ÑƒÑ‚ Ð¸Ð¼Ð¿Ð¾Ñ€Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ `memory-engine` Ð½Ð°Ð¿Ñ€ÑÐ¼ÑƒÑŽ (Ñ…Ð¾Ñ‚Ñ Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ… `memoryEngine.*` = 0 Ð²Ñ‹Ð·Ð¾Ð²Ð¾Ð², Ð²ÑÑ‘ Ñ‡ÐµÑ€ÐµÐ· hooks â€” **ÑÑ‚Ð¾ ÑƒÐ¶Ðµ Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾**). Ð’Ð½ÑƒÑ‚Ñ€ÐµÐ½Ð½ÑÑ ÑÑ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ð° â€” Ð¼Ð½Ð¾Ð³Ð¾ÑÐ»Ð¾Ð¹Ð½Ð°Ñ, Ð½Ð¾ **Ð²Ð½ÐµÑˆÐ½Ð¸Ð¹ API Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð±Ñ‹Ñ‚ÑŒ 1 Ñ‚Ð¾Ñ‡ÐºÐ°**.

### 5.3. LLM Adapters (12 Ñ„Ð°Ð¹Ð»Ð¾Ð²) ðŸŸ¢ KEEP (plugin pattern)

12 Ð°Ð´Ð°Ð¿Ñ‚ÐµÑ€Ð¾Ð²: gemini, openrouter, groq, nvidia, openai-compatible, anthropic, cloudflare, kimi, qwen, deepseek, minimax, mock.

**Verdict:** ðŸŸ¢ **KEEP INDEPENDENT** â€” plugin pattern, Ð¿Ð¾ Ð¾Ð´Ð½Ð¾Ð¼Ñƒ Ð°Ð´Ð°Ð¿Ñ‚ÐµÑ€Ñƒ Ð½Ð° Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð°. Ð­Ñ‚Ð¾ Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾.

### 5.4. Router â€” 14 Ñ„Ð°Ð¹Ð»Ð¾Ð² decomposition ðŸŸ¢ KEEP

`provider-router.ts` + `route-rules.ts` + 11 `router-*.ts` (config-manager, debate-selector, decision-recorder, fallback-resolver, latency-monitor, ranking, request-classifier, scoring, services, types) + `smart-routing-service.ts` + `routing-experiments-service.ts`.

**Verdict:** ðŸŸ¢ **KEEP INDEPENDENT** â€” decomposition ÑÐ»Ð¾Ð¶Ð½Ð¾Ð³Ð¾ Ð´Ð¾Ð¼ÐµÐ½Ð° (Ñ€Ð¾ÑƒÑ‚Ð¸Ð½Ð³) Ð½Ð° Ð¿Ð¾Ð´Ð·Ð°Ð´Ð°Ñ‡Ð¸: classification â†’ scoring â†’ ranking â†’ fallback â†’ recording â†’ monitoring. **ÐÐµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ, Ð° ÑÐ»Ð¾Ð¸.**

### 5.5. Key-management â€” 16 Ñ„Ð°Ð¹Ð»Ð¾Ð² ðŸŸ¢ KEEP (modular)

`key-alerts.ts`, `key-analytics.ts`, `key-diagnostics.ts`, `key-fingerprints.ts`, `key-health.ts`, `key-lifecycle.ts`, `key-metrics-handler.ts`, `key-models.ts`, `key-pool-selector.ts`, `key-quotas.ts`, `key-registry-utils.ts`, `key-registry.ts`, `key-service.ts` (1 098), `key-status.ts`, `key-types.ts`, `key-vault.ts`.

**Verdict:** ðŸŸ¢ **KEEP INDEPENDENT** â€” fine-grained separation of concerns (alerts / analytics / diagnostics / health / lifecycle / metrics / pool / quotas / registry / vault â€” **Ñ€Ð°Ð·Ð½Ñ‹Ðµ responsibilities**). Barrel-ÑÐºÑÐ¿Ð¾Ñ€Ñ‚ Ñ‡ÐµÑ€ÐµÐ· `key-management/index.ts`.

---

## 6. ÐŸÐ¾Ð²Ñ‚Ð¾Ñ€ÑÑŽÑ‰Ð¸ÐµÑÑ Ð¸Ð½Ñ‚ÐµÑ€Ñ„ÐµÐ¹ÑÑ‹ (contracts)

### 6.1. Memory-related contracts â€” 10 Ñ„Ð°Ð¹Ð»Ð¾Ð² ðŸŸ¡ MERGE

| Ð¤Ð°Ð¹Ð» | Ð¡Ñ‚Ñ€Ð¾Ðº | ÐšÐ¾Ð»-Ð²Ð¾ interfaces |
|---|---:|---:|
| `memory-store.ts` | 69 | 4 |
| `memory-transfer.ts` | 27 | 3 |
| `memory.ts` | 52 | 3 |
| `federated-memory.ts` | 46 | 4 |
| `session-memory.ts` | 40 | 3 |
| `project-memory.ts` | 25 | 1 |
| (Ñ‚Ð°ÐºÐ¶Ðµ Ð² `meta.ts`, `persona.ts`, `viz/memory-graph.ts`, `debate-runtime.ts`) | â€” | â€” |

**Verdict:** ðŸŸ¡ **MERGE Ð² 1 `contracts/memory/index.ts`** barrel Ñ Ð¿Ð¾Ð´-ÑÐºÑÐ¿Ð¾Ñ€Ñ‚Ð°Ð¼Ð¸. Ð¡ÐµÐ¹Ñ‡Ð°Ñ 10 Ñ„Ð°Ð¹Ð»Ð¾Ð² Ñ Ð¿ÐµÑ€ÐµÐºÑ€Ñ‹Ð²Ð°ÑŽÑ‰Ð¸Ð¼Ð¸ÑÑ `IMemory*` Ð¸Ð½Ñ‚ÐµÑ€Ñ„ÐµÐ¹ÑÐ°Ð¼Ð¸ â€” ÑÐ»Ð¾Ð¶Ð½Ð¾ Ð½Ð°Ð¹Ñ‚Ð¸ canonical.

### 6.2. Health-related contracts â€” 5 Ñ„Ð°Ð¹Ð»Ð¾Ð² ðŸŸ¡ MERGE

`agent-health.ts`, `health-check.ts`, `health-sla.ts`, `health.ts`, `probe.ts`.

**Verdict:** ðŸŸ¡ **MERGE Ð² 1 `contracts/health.ts`** (Ð¸Ð»Ð¸ `contracts/health/index.ts`). 5 Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð´Ð»Ñ Ð¾Ð´Ð½Ð¾Ð³Ð¾ Ð´Ð¾Ð¼ÐµÐ½Ð° Â«healthÂ» â€” Ð¸Ð·Ð±Ñ‹Ñ‚Ð¾Ñ‡Ð½Ð¾.

### 6.3. Routing-related contracts â€” 3 Ñ„Ð°Ð¹Ð»Ð° ðŸŸ¡ PARTIAL

`routing-experiments.ts`, `routing-policy.ts`, `smart-routing.ts` + `routing/` subdir.

**Verdict:** ðŸŸ¡ **PARTIAL MERGE** â€” `smart-routing.ts` Ð¸ `routing-policy.ts` Ð¼Ð¾Ð³ÑƒÑ‚ Ð±Ñ‹Ñ‚ÑŒ Ð¾Ð±ÑŠÐµÐ´Ð¸Ð½ÐµÐ½Ñ‹. `routing-experiments.ts` Ð¾ÑÑ‚Ð°Ð²Ð¸Ñ‚ÑŒ (research).

### 6.4. Cache contracts â€” 2 Ñ„Ð°Ð¹Ð»Ð° ðŸŸ¡ KEEP (different)

`cache.ts` (ICacheService) + `gemini-cache.ts` (ICacheRegistryService).

**Verdict:** ðŸŸ¢ **KEEP INDEPENDENT** â€” `ICacheService` = generic LLM cache; `ICacheRegistryService` = Gemini-specific context-cache. Ð Ð°Ð·Ð½Ñ‹Ðµ ÐºÐ¾Ð½Ñ‚Ñ€Ð°ÐºÑ‚Ñ‹.

### 6.5. Contracts barrel `index.ts` â€” 1 241 ÑÑ‚Ñ€Ð¾ÐºÐ°

`src/kernel/contracts/index.ts` â€” barrel-ÑÐºÑÐ¿Ð¾Ñ€Ñ‚ Ð¸Ð· Ð²ÑÐµÑ… contract-Ñ„Ð°Ð¹Ð»Ð¾Ð². 1 241 ÑÑ‚Ñ€Ð¾ÐºÐ° = **Ð¾Ð³Ñ€Ð¾Ð¼Ð½Ñ‹Ð¹ barrel**, Ð½Ð¾ ÑÑ‚Ð¾ **Ð½Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ**, Ð° ÑƒÐ´Ð¾Ð±Ð½Ñ‹Ð¹ single-entry.

---

## 7. ÐŸÐ°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ðµ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð¾Ð´Ð½Ð¸Ñ… Ð´Ð°Ð½Ð½Ñ‹Ñ…

### 7.1. Keys data â€” 4 Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ° ðŸŸ¡ ARCHITECTURE

| Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº | Ð Ð¾Ð»ÑŒ | Ð“Ð´Ðµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ |
|---|---|---|
| `keyService` | CRUD keys | 78 calls Ð² components |
| `keyStateStore` | In-memory state | useKeyStore hook |
| `keyVault` | Encrypted storage | (legacy / future) |
| `keyRegistry` | Registry of providers | key-registry.ts (942 ÑÑ‚Ñ€Ð¾ÐºÐ¸) |

**47 Ð²Ñ‹Ð·Ð¾Ð²Ð¾Ð² `keyService.getKeys/getAll/list` Ð² kernel services** â€” Ð¼Ð½Ð¾Ð³Ð¾ Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ñ… readers.

**Verdict:** ðŸŸ¡ **ARCHITECTURE** â€” ÑÑ‚Ð¾ **ÑÐ»Ð¾Ð¸** (vault = storage, registry = metadata, stateStore = cache, service = API). ÐÐ¾ **47 callers Ð² kernel** â€” ÑÑ‚Ð¾Ð¸Ñ‚ Ñ†ÐµÐ½Ñ‚Ñ€Ð°Ð»Ð¸Ð·Ð¾Ð²Ð°Ñ‚ÑŒ Ñ‡ÐµÑ€ÐµÐ· 1 `keyAggregator`. Ð¡ÐµÐ¹Ñ‡Ð°Ñ ÐºÐ°Ð¶Ð´Ñ‹Ð¹ service Ð»ÐµÐ·ÐµÑ‚ Ðº keyService Ð½Ð°Ð¿Ñ€ÑÐ¼ÑƒÑŽ.

### 7.2. Memory data â€” Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ðµ sources ðŸŸ¡ PARTIAL

8 `IMemoryStore` Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¹ + 6 top-level memory services + MemoryPanel UI. Ð’ÑÐµ Ñ‡Ð¸Ñ‚Ð°ÑŽÑ‚/Ð¿Ð¸ÑˆÑƒÑ‚ memory, Ð½Ð¾ **Ñ‡ÐµÑ€ÐµÐ· Ñ€Ð°Ð·Ð½Ñ‹Ðµ Ñ‚Ð¸Ð¿Ñ‹** (episodic vs semantic vs emotionalâ€¦).

**Verdict:** ðŸŸ¢ **ARCHITECTURE** â€” Ñ€Ð°Ð·Ð½Ñ‹Ðµ Ñ‚Ð¸Ð¿Ñ‹ Ð¿Ð°Ð¼ÑÑ‚Ð¸ = Ñ€Ð°Ð·Ð½Ñ‹Ðµ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸. Ð­Ñ‚Ð¾ Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾.

### 7.3. Provider health â€” 3 Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ° ðŸŸ¡ OVERLAP

| Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº | Ð§Ñ‚Ð¾ |
|---|---|
| `probeService` | Active probe |
| `agent-health-monitor` | Heartbeat |
| `monitoring-service` | Snapshot monitoring |
| `router-latency-monitor` | Latency tracking |
| `truth-consistency-monitor` | Truth consistency |

**5+ Ð¼Ð¾Ð½Ð¸Ñ‚Ð¾Ñ€Ð¸Ð½Ð³-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²** â€” ÐºÐ°Ð¶Ð´Ñ‹Ð¹ ÑÐ¾ ÑÐ²Ð¾Ð¸Ð¼ `setInterval`, ÐºÐ°Ð¶Ð´Ñ‹Ð¹ Ð³ÐµÐ½ÐµÑ€Ð¸Ñ‚ events.

**Verdict:** ðŸŸ¡ **POTENTIAL OVERLAP.** HealthPanel (530 ÑÑ‚Ñ€Ð¾Ðº) Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð°Ð³Ñ€ÐµÐ³Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð²ÑÐµ 5 Ð² single UI. Ð¡ÐµÐ¹Ñ‡Ð°Ñ Ð¾Ð½Ð¸ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‚ Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ð¾, Ð¼Ð¾Ð³ÑƒÑ‚ Ð´Ð°Ð²Ð°Ñ‚ÑŒ **conflicting signals**.

### 7.4. Storage adapters â€” 3 Ñ„Ð°Ð¹Ð»Ð° ðŸŸ¢ KEEP

`storage-adapter.ts` (interface), `dexie-storage.ts` (IndexedDB impl), `local-storage-adapter.ts` (localStorage impl).

**Verdict:** ðŸŸ¢ **KEEP INDEPENDENT** â€” 3 Ñ€Ð°Ð·Ð½Ñ‹Ñ… storage backend. Ð­Ñ‚Ð¾ plugin pattern.

---

## 8. Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸ÐµÑÑ Ð¼ÐµÑ…Ð°Ð½Ð¸Ð·Ð¼Ñ‹ (patterns)

### 8.1. Error handling â€” 2 ÐºÐ¾Ð½ÐºÑƒÑ€Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ñ… Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ð° ðŸŸ¡ STANDARDIZE

| ÐŸÐ°Ñ‚Ñ‚ÐµÑ€Ð½ | Ð“Ð´Ðµ | ÐšÐ¾Ð»-Ð²Ð¾ |
|---|---|---:|
| `const [error, setError] = useState<string\|null>(null)` | components | **97** |
| `useAutoClearError` hook | components | **26** |

**Verdict:** ðŸŸ¡ **STANDARDIZE Ð½Ð° `useAutoClearError` hook.** 97 Ñ€ÑƒÑ‡Ð½Ñ‹Ñ… `setError` â€” Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ Ð»Ð¾Ð³Ð¸ÐºÐ¸ auto-clear, dismiss timer. Hook ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚, Ð½Ð¾ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² 26 Ñ„Ð°Ð¹Ð»Ð°Ñ…. **Migration: 97 â†’ 1 hook usage.**

### 8.2. Polling â€” 1 canonical âœ…

`usePolling` hook Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ð² **79 Ð¼ÐµÑÑ‚Ð°Ñ…**, Ð±ÐµÐ· Ð°Ð»ÑŒÑ‚ÐµÑ€Ð½Ð°Ñ‚Ð¸Ð²Ñ‹. **0 manual `setInterval` in `useEffect`** Ð² components.

**Verdict:** ðŸŸ¢ **EXCELLENT** â€” ÐµÐ´Ð¸Ð½Ñ‹Ð¹ Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½ polling. Ð­Ñ‚Ð¾ Ð»ÑƒÑ‡ÑˆÐ¸Ð¹ result Ð¿Ð¾ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸ÑŽ Ð² Ð¿Ñ€Ð¾ÐµÐºÑ‚Ðµ.

### 8.3. Subscriptions â€” 1 canonical, Ð½Ð¾ Ð¾Ð±Ñ…Ð¾Ð´ÑÑ‚ ðŸŸ¡ STANDARDIZE

`eventBus.on(event, handler)` Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‰Ð°ÐµÑ‚ `unsub`. Ð¢Ð¾Ð¿-15 Ð¿Ð¾Ð´Ð¿Ð¸ÑÑ‡Ð¸ÐºÐ¾Ð² Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÑŽÑ‚ `const unsub = eventBus.on(...); return () => unsub();`.

**ÐÐž:** 97 Ð¿Ñ€ÑÐ¼Ñ‹Ñ… Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ¾Ðº Ð² components vs ~50 Ñ‡ÐµÑ€ÐµÐ· Zustand stores. **Ð¡Ñ‚Ð¾Ð¸Ñ‚ centralize Ñ‡ÐµÑ€ÐµÐ· stores.**

**Verdict:** ðŸŸ¡ **POTENTIAL centralization.** Pattern canonical, Ð½Ð¾ Ð¿Ñ€Ð¸Ð¼ÐµÐ½ÑÐµÑ‚ÑÑ Ð½ÐµÐ¿Ð¾ÑÐ»ÐµÐ´Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒÐ½Ð¾.

### 8.4. Loading state â€” duplicating ðŸŸ¡

Ð’ `TasksPanel` (903 ÑÑ‚Ñ€Ð¾ÐºÐ¸) â€” **11 `useState`** Ð´Ð»Ñ loading/error/data/etc. Ð¢Ð¾ Ð¶Ðµ Ð² Ð´Ñ€ÑƒÐ³Ð¸Ñ… Ð±Ð¾Ð»ÑŒÑˆÐ¸Ñ… Ð¿Ð°Ð½ÐµÐ»ÑÑ….

**Verdict:** ðŸŸ¡ **STANDARDIZE Ð½Ð° `useAsyncData` hook** (load + loading + error + data Ð² Ð¾Ð´Ð½Ð¾Ð¼). Ð¡ÐµÐ¹Ñ‡Ð°Ñ ÐºÐ°Ð¶Ð´Ñ‹Ð¹ Ð¿Ð¸ÑˆÐµÑ‚ ÑÐ²Ð¾Ð¹.

### 8.5. Demo seeding â€” duplicating ðŸŸ¢ LOW

`seedChatDemo`, `seedTasksDemo`, `seedCrystalsDemo`, `seedSynthesisDemo`, `seedDebatesDemo`, `memory-demo-seed.ts`, `generator-demo-seed.ts` â€” Ð¿Ð¾ Ð¾Ð´Ð½Ð¾Ð¼Ñƒ seed-Ñ„Ð°Ð¹Ð»Ñƒ Ð½Ð° Ð´Ð¾Ð¼ÐµÐ½.

**Verdict:** ðŸŸ¢ **OK** â€” ÐºÐ°Ð¶Ð´Ñ‹Ð¹ Ð´Ð¾Ð¼ÐµÐ½ Ð¸Ð¼ÐµÐµÑ‚ ÑÐ²Ð¾Ð¹ demo-seed. Ð­Ñ‚Ð¾ **Ð½Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ**, Ð° **per-domain feature**.

---

## 9. ÐšÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚Ñ‹ Ð½Ð° Ð¾Ð±ÑŠÐµÐ´Ð¸Ð½ÐµÐ½Ð¸Ðµ â€” Ð¿Ð¾Ð»Ð½Ñ‹Ð¹ ÑÐ¿Ð¸ÑÐ¾Ðº

| # | Ð§Ñ‚Ð¾ | Ð¡ÐµÐ¹Ñ‡Ð°Ñ | Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ñ | Ð’Ñ‹Ð³Ð¾Ð´Ð° |
|---|---|---|---|---|
| 1 | **5 budget panels** | 5 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð¾Ð² | MERGE Ð² `BudgetHub` Ñ Ñ‚Ð°Ð±Ð°Ð¼Ð¸ | -4 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð°, unified UX |
| 2 | **3 health panels** (System + SLA + Health) | 3 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð° | MERGE Ð² `HealthPanel` Ñ Ñ‚Ð°Ð±Ð°Ð¼Ð¸; ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ HealthSlaPanel (MOCK) | -2 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð°, remove deprecated |
| 3 | **`OpenRouterPanel`** | 29 ÑÑ‚Ñ€Ð¾Ðº Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚ | DELETE | -1 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚, -29 LOC |
| 4 | **`ProviderDashboard`** | 670 ÑÑ‚Ñ€Ð¾Ðº overlap | MERGE Ð² ProviderManager ÐºÐ°Ðº Â«OverviewÂ» Ñ‚Ð°Ð± | -1 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚ |
| 5 | **62 TechniquePanels** | 62 Ã— 234 ÑÑ‚Ñ€Ð¾Ðº | MERGE Ð² 1 `<TechniquePanel id="â€¦" />` + 1 catalog | **-14 500 LOC, -61 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚** |
| 6 | **6 memory top-level services** | 6 entry points | MERGE Ð½Ð° `MemoryOrchestrator` ÐºÐ°Ðº single API | ÑƒÐ¿Ñ€Ð¾ÑÑ‚Ð¸Ñ‚ consumer API |
| 7 | **10 memory contracts** | 10 Ñ„Ð°Ð¹Ð»Ð¾Ð² | MERGE Ð² `contracts/memory/index.ts` barrel | -10 Ñ„Ð°Ð¹Ð»Ð¾Ð², +1 |
| 8 | **5 health contracts** | 5 Ñ„Ð°Ð¹Ð»Ð¾Ð² | MERGE Ð² `contracts/health.ts` | -5 Ñ„Ð°Ð¹Ð»Ð¾Ð², +1 |
| 9 | **19 `rivals/` subdirs** | ~175 Ñ„Ð°Ð¹Ð»Ð¾Ð² | MOVE Ð² `src/experimental/rivals/` Ð¸Ð»Ð¸ DELETE unused | **-175 Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð² main codebase** |
| 10 | **7 duplicate service files** (cacheÃ—3, projectÃ—2, policyÃ—2, personaÃ—2, n8nÃ—2, blackboardÃ—2, assistantÃ—2) | 7 Ð¿Ð°Ñ€ | KEEP canonical Ð² `services/`, MOVE rest Ð² experimental | -10-15 Ñ„Ð°Ð¹Ð»Ð¾Ð² |
| 11 | **`SocialLeaderboardPanel`** | 34 ÑÑ‚Ñ€Ð¾ÐºÐ¸ Ð¾Ð±Ñ‘Ñ€Ñ‚ÐºÐ° | DELETE (EloLeaderboard ÑƒÐ¶Ðµ Ð² AgentsPanel) | -1 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚ |
| 12 | **`LearnHubPanel`** | 67 ÑÑ‚Ñ€Ð¾Ðº hub | Ð•ÑÐ»Ð¸ 4 Ñ€ÐµÐ±Ñ‘Ð½ÐºÐ° Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸ â€” DELETE; Ð¸Ð½Ð°Ñ‡Ðµ KEEP | -1 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚ |
| 13 | **97 Ñ€ÑƒÑ‡Ð½Ñ‹Ñ… setError** | 97 Ñ„Ð°Ð¹Ð»Ð¾Ð² | MIGRATE Ð½Ð° `useAutoClearError` hook | consistency, -1000 LOC |
| 14 | **`BudgetPanel/` Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚** | dir + .tsx same name | DELETE one | -1 dup |
| 15 | **`rivals20/` observability backends** | 3-5 parallel (Langfuse, Langsmith, Whale) | KEEP 1, MOVE rest Ð² experimental | -3-4 Ñ„Ð°Ð¹Ð»Ð¾Ð² |
| 16 | **`AssistantPanel` + `Assistant/`** | dir + standalone | MERGE Ð² `Assistant/AssistantPanel` | consistency |
| 17 | **`AgentJournalPanel` dir + .tsx** | 2 entry points | DELETE standalone .tsx | -1 dup |
| 18 | **`DecisionLogPanel` dir + .tsx** | 2 entry points | DELETE standalone .tsx | -1 dup |
| 19 | **`KeyNotesPanel` dir + .tsx** | 2 entry points | DELETE standalone .tsx | -1 dup |
| 20 | **5 monitoring services** (probe, agent-health, monitoring, router-latency, truth-consistency) | 5 Ð¿Ð°Ñ€Ð°Ð»Ð»ÐµÐ»ÑŒÐ½Ñ‹Ñ… | Centralize Ñ‡ÐµÑ€ÐµÐ· `HealthAggregator` | consistency |

---

## 10. ÐšÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚Ñ‹ Ð¡ÐžÐ¥Ð ÐÐÐ˜Ð¢Ð¬ ÐÐ•Ð—ÐÐ’Ð˜Ð¡Ð˜ÐœÐ«ÐœÐ˜

| # | Ð§Ñ‚Ð¾ | ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ |
|---|---|---|
| 1 | **8 `IMemoryStore` impl** (working/procedural/semantic/episodic/social/service-backed/spatial/emotional) | ÐÑ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð½Ð¾Ðµ Ñ€Ð°Ð·Ð´ÐµÐ»ÐµÐ½Ð¸Ðµ Ð¿Ð¾ Ñ‚Ð¸Ð¿Ð°Ð¼ Ð¿Ð°Ð¼ÑÑ‚Ð¸ (ÐºÐ¾Ð³Ð½Ð¸Ñ‚Ð¸Ð²Ð½Ð°Ñ Ð¿ÑÐ¸Ñ…Ð¾Ð»Ð¾Ð³Ð¸Ñ) |
| 2 | **12 LLM adapters** | Plugin pattern, Ð¿Ð¾ Ð¾Ð´Ð½Ð¾Ð¼Ñƒ Ð½Ð° Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð° |
| 3 | **14 router-* Ñ„Ð°Ð¹Ð»Ð¾Ð²** | Decomposition ÑÐ»Ð¾Ð¶Ð½Ð¾Ð³Ð¾ Ð´Ð¾Ð¼ÐµÐ½Ð° (scoring, ranking, fallback, recording) |
| 4 | **16 key-management Ñ„Ð°Ð¹Ð»Ð¾Ð²** | Fine-grained SoC (alerts/diagnostics/health/lifecycle/pool/quotas/registry/vault) |
| 5 | **3 storage adapters** | Plugin pattern (dexie/local-storage/adapter-interface) |
| 6 | **4 marketplace panels** | Ð Ð°Ð·Ð½Ñ‹Ðµ Ð´Ð¾Ð¼ÐµÐ½Ñ‹ (agents/personas/providers/catalog) |
| 7 | **5 debate-replay files** | Decomposition Ð¾Ð´Ð½Ð¾Ð¹ Ð¿Ð°Ð½ÐµÐ»Ð¸ |
| 8 | **8 zone-audit docs** | Ð˜ÑÑ‚Ð¾Ñ€Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ Ð·Ð°Ð¿Ð¸ÑÐ¸ (ÑÐ¼. Tech Health Map) |
| 9 | **2 cache services** (`cache-service` + `gemini-cache-service`) | Ð Ð°Ð·Ð½Ñ‹Ðµ ÐºÐ¾Ð½Ñ‚Ñ€Ð°ÐºÑ‚Ñ‹ (`ICacheService` vs `ICacheRegistryService`) |
| 10 | **3 routing contracts** (`routing-experiments` + `routing-policy` + `smart-routing`) | Ð Ð°Ð·Ð½Ñ‹Ðµ ÑƒÑ€Ð¾Ð²Ð½Ð¸ (experiments/research, policy/rules, smart/heuristic) |
| 11 | **Demo seeds (Ð¿Ð¾ Ð¾Ð´Ð½Ð¾Ð¼Ñƒ Ð½Ð° Ð´Ð¾Ð¼ÐµÐ½)** | Per-domain feature, Ð½Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ |
| 12 | **3 storage layers** (`vault`/`registry`/`stateStore`) | Ð¡Ð»Ð¾Ð¸ Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ñ‹ |

---

## 11. Ð¡Ð²Ð¾Ð´Ð½Ð°Ñ Ð¼Ð°Ñ‚Ñ€Ð¸Ñ†Ð° Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ

| ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ | ÐšÐ¾Ð»-Ð²Ð¾ ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ð¾Ð² | Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ ÑÐºÐ·ÐµÐ¼Ð¿Ð»ÑÑ€ | Verdict |
|---|---:|---|---|
| Budget-Ð¿Ð°Ð½ÐµÐ»Ð¸ | 7 | BudgetPanel | ðŸ”´ MERGE Ð² BudgetHub |
| Health-Ð¿Ð°Ð½ÐµÐ»Ð¸ | 4 | HealthPanel | ðŸŸ¡ MERGE (DocsHealth keep) |
| Provider-UI | 4 | ProviderManager | ðŸ”´ DELETE OpenRouter, MERGE Dashboard |
| Memory-Ð¿Ð°Ð½ÐµÐ»Ð¸ | 6 | MemoryPanel | ðŸŸ¡ MemoryCenter = hub, rest KEEP |
| Marketplace | 4 | â€” | ðŸŸ¢ KEEP (different domains) |
| Hub-Ð¿Ð°Ð½ÐµÐ»Ð¸ | 6 | â€” | ðŸŸ¡ LearnHub = thin wrapper |
| Technique-Ð¿Ð°Ð½ÐµÐ»Ð¸ | 62 | (uniform) | ðŸŸ¡ MERGE Ð² 1 generic + catalog |
| Debate-replay files | 5 | â€” | ðŸŸ¢ KEEP (decomposition) |
| **`rivals/` subdirs** | **19 (~175 Ñ„Ð°Ð¹Ð»Ð¾Ð²)** | â€” | ðŸ”´ MOVE Ð² experimental |
| Duplicate service files | 7 Ð¿Ð°Ñ€ | â€” | ðŸ”´ KEEP canonical, rest experimental |
| 8 `IMemoryStore` impl | 8 | â€” | ðŸŸ¢ KEEP (architectural) |
| 6 memory top-level services | 6 | MemoryOrchestrator | ðŸŸ¡ MERGE Ð½Ð° single API |
| 10 memory contracts | 10 | â€” | ðŸŸ¡ MERGE Ð² barrel |
| 5 health contracts | 5 | â€” | ðŸŸ¡ MERGE |
| 5 health services | 5 | â€” | ðŸŸ¡ Centralize via HealthAggregator |
| 16 key-management files | 16 | â€” | ðŸŸ¢ KEEP (modular) |
| 14 router-* files | 14 | â€” | ðŸŸ¢ KEEP (decomposition) |
| 12 LLM adapters | 12 | â€” | ðŸŸ¢ KEEP (plugin pattern) |
| 3 storage adapters | 3 | â€” | ðŸŸ¢ KEEP (plugin pattern) |
| 2 cache services | 2 | â€” | ðŸŸ¢ KEEP (different contracts) |
| Error-handling patterns | 97 setError + 26 useAutoClearError | useAutoClearError | ðŸŸ¡ STANDARDIZE |
| Polling patterns | 79 usePolling, 0 manual | usePolling | ðŸŸ¢ EXCELLENT |
| Subscription patterns | 97 direct + ~50 via stores | store selector | ðŸŸ¡ CENTRALIZE |

---

## 12. Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ð¸

### ðŸ”´ P0 â€” ÐºÑ€Ð¸Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¾Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ (ÑÐ¾ÐºÑ€Ð°Ñ‚Ð¸Ñ‚ÑŒ Ð½ÐµÐ¼ÐµÐ´Ð»ÐµÐ½Ð½Ð¾)

1. **`rivals/` 19 Ð¿Ð¾Ð´ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð² (~175 Ñ„Ð°Ð¹Ð»Ð¾Ð²) â†’ Ð¿ÐµÑ€ÐµÐ¼ÐµÑÑ‚Ð¸Ñ‚ÑŒ Ð² `src/experimental/rivals/`** Ð¸Ð»Ð¸ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ Ð½ÐµÐ¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÐ¼Ñ‹Ðµ. Ð­Ñ‚Ð¾ **17 500 LOC** Ð² Ð¾ÑÐ½Ð¾Ð²Ð½Ð¾Ð¹ ÐºÐ¾Ð´Ð¾Ð²Ð¾Ð¹ Ð±Ð°Ð·Ðµ, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ðµ Ð·Ð°Ñ‚Ñ€ÑƒÐ´Ð½ÑÑŽÑ‚ Ð¿Ð¾Ð¸ÑÐº canonical-Ð²ÐµÑ€ÑÐ¸Ð¸ ÑÐµÑ€Ð²Ð¸ÑÐ°. ÐšÐ°Ð¶Ð´Ñ‹Ð¹, ÐºÑ‚Ð¾ Ð¸Ñ‰ÐµÑ‚ `cache-service.ts`, Ð½Ð°Ñ…Ð¾Ð´Ð¸Ñ‚ 3 ÐºÐ¾Ð¿Ð¸Ð¸.

2. **7 Ð¿Ð°Ñ€ Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ð¾Ð² Ñ„Ð°Ð¹Ð»Ð¾Ð² (cacheÃ—3, projectÃ—2, policyÃ—2, personaÃ—2, n8nÃ—2, blackboardÃ—2, assistantÃ—2) â†’ Ð¾ÑÑ‚Ð°Ð²Ð¸Ñ‚ÑŒ canonical Ð² `services/`, Ð¾ÑÑ‚Ð°Ð»ÑŒÐ½Ñ‹Ðµ Ð² experimental**.

3. **62 TechniquePanels â†’ 1 generic `<TechniquePanel techniqueId="humor" />` + 1 catalog**. Ð¡ÑÐºÐ¾Ð½Ð¾Ð¼Ð¸Ñ‚ **~14 500 LOC Ð¸ 61 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚**.

### ðŸŸ¡ P1 â€” Ð²Ð°Ð¶Ð½Ð¾Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ (Ð¾Ð¿Ñ‚Ð¸Ð¼Ð¸Ð·Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð² ÐºÐ²Ð°Ñ€Ñ‚Ð°Ð»)

4. **5 budget panels â†’ `BudgetHub`** Ñ Ñ‚Ð°Ð±Ð°Ð¼Ð¸: Overview / Spend / Alerts / Optimization / Per-Key / Companies.

5. **3 health panels (System + SLA + Health) â†’ `HealthPanel`** Ñ Ñ‚Ð°Ð±Ð°Ð¼Ð¸. `HealthSlaPanel` ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ (`@deprecated MOCK`).

6. **`OpenRouterPanel` (29 ÑÑ‚Ñ€Ð¾Ðº) â†’ DELETE** â€” Ð¿Ð¾Ð»Ð½Ñ‹Ð¹ Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚.

7. **`ProviderDashboard` â†’ MERGE Ð² `ProviderManager`** ÐºÐ°Ðº Â«OverviewÂ» Ñ‚Ð°Ð±.

8. **97 Ñ€ÑƒÑ‡Ð½Ñ‹Ñ… `setError` â†’ MIGRATE Ð½Ð° `useAutoClearError` hook**. Hook ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÐµÑ‚, Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ð² 26 Ñ„Ð°Ð¹Ð»Ð°Ñ…, Ð½ÑƒÐ¶Ð½Ð¾ Ñ€Ð°ÑÐ¿Ñ€Ð¾ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ.

9. **10 memory contracts â†’ 1 barrel `contracts/memory/index.ts`**.

10. **5 health contracts â†’ 1 `contracts/health.ts`**.

11. **4 standalone `.tsx` Ñ Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ð¾Ð¼ Ð² Ð´Ð¸Ñ€ÐµÐºÑ‚Ð¾Ñ€Ð¸Ð¸** (`AgentJournalPanel`, `DecisionLogPanel`, `KeyNotesPanel`, `AssistantPanel`) â†’ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ standalone Ð²ÐµÑ€ÑÐ¸Ð¸.

### ðŸŸ¢ P2 â€” ÑÑ‚Ð°Ð½Ð´Ð°Ñ€Ñ‚Ð¸Ð·Ð°Ñ†Ð¸Ñ (Ð¿Ð¾ÑÑ‚Ð¾ÑÐ½Ð½Ð¾)

12. **Centralize eventBus subscriptions Ñ‡ÐµÑ€ÐµÐ· Zustand stores** â€” 97 Ð¿Ñ€ÑÐ¼Ñ‹Ñ… Ð¿Ð¾Ð´Ð¿Ð¸ÑÐ¾Ðº Ð² ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð°Ñ… Ð·Ð°Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ Ð½Ð° store selectors.

13. **Standardize async-data pattern** â€” `useAsyncData` hook (load + loading + error + data) Ð´Ð»Ñ Ð·Ð°Ð¼ÐµÐ½Ñ‹ 11-`useState` Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ð° Ð² Ð±Ð¾Ð»ÑŒÑˆÐ¸Ñ… Ð¿Ð°Ð½ÐµÐ»ÑÑ….

14. **HealthAggregator service** â€” centralize 5 monitoring services (probe + agent-health + monitoring + router-latency + truth-consistency) Ð² Ð¾Ð´Ð¸Ð½ consumer-facing API.

15. **MemoryOrchestrator ÐºÐ°Ðº single API entry** â€” Ð²ÑÐµ consumers Ð´Ð¾Ð»Ð¶Ð½Ñ‹ Ð¸Ð´Ñ‚Ð¸ Ñ‡ÐµÑ€ÐµÐ· orchestrator, Ð½Ðµ Ñ‡ÐµÑ€ÐµÐ· memory-engine Ð½Ð°Ð¿Ñ€ÑÐ¼ÑƒÑŽ.

### ðŸŸ¢ KEEP INDEPENDENT â€” Ð½Ðµ Ñ‚Ñ€Ð¾Ð³Ð°Ñ‚ÑŒ

16. **8 `IMemoryStore` impl** â€” Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð½Ð¾Ðµ Ñ€Ð°Ð·Ð´ÐµÐ»ÐµÐ½Ð¸Ðµ Ð¿Ð¾ Ñ‚Ð¸Ð¿Ð°Ð¼ Ð¿Ð°Ð¼ÑÑ‚Ð¸.
17. **12 LLM adapters** â€” plugin pattern.
18. **14 router-* Ñ„Ð°Ð¹Ð»Ð¾Ð²** â€” decomposition.
19. **16 key-management Ñ„Ð°Ð¹Ð»Ð¾Ð²** â€” modular SoC.
20. **3 storage adapters** â€” plugin pattern.
21. **4 marketplace panels** â€” Ñ€Ð°Ð·Ð½Ñ‹Ðµ Ð´Ð¾Ð¼ÐµÐ½Ñ‹.
22. **5 debate-replay files** â€” decomposition.

---

## 13. Ð˜Ñ‚Ð¾Ð³Ð¾Ð²Ñ‹Ð¹ Ð²ÐµÑ€Ð´Ð¸ÐºÑ‚ Ð¿Ð¾ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸ÑŽ

| Ð¢Ð¸Ð¿ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ | ÐžÐ±ÑŠÑ‘Ð¼ | ÐžÑ†ÐµÐ½ÐºÐ° | Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ |
|---|---|:---:|---|
| **Architectural** (8 memory stores, 12 adapters, 14 router-files, 16 key-mgmt) | ~30 ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ð¾Ð² | ðŸŸ¢ 9/10 | KEEP â€” Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾ |
| **Decomposition** (debate-replay 5 Ñ„Ð°Ð¹Ð»Ð¾Ð², debate-strategy 33 Ñ„Ð°Ð¹Ð»Ð° Ð² Ð¾Ð´Ð½Ð¾Ð¼) | ~40 ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ð¾Ð² | ðŸŸ¢ 8/10 | KEEP â€” Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾ |
| **Plugin pattern** (storage adapters, LLM adapters) | 15 ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ð¾Ð² | ðŸŸ¢ 9/10 | KEEP â€” Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾ |
| **UI overlap** (budget 5, health 4, provider 4) | 13 ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ð¾Ð² | ðŸŸ¡ 5/10 | MERGE Ð² hub'Ñ‹ |
| **Uniform-generated** (62 TechniquePanels) | 62 ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ð° | ðŸŸ¡ 4/10 | MERGE Ð² 1 generic |
| **Research parallel** (`rivals/` 19 subdirs) | ~175 Ñ„Ð°Ð¹Ð»Ð¾Ð² | ðŸ”´ 3/10 | MOVE Ð² experimental |
| **Duplicate files** (7 Ð¿Ð°Ñ€) | 7 Ð¿Ð°Ñ€ | ðŸ”´ 3/10 | KEEP canonical |
| **Pattern duplication** (97 setError, 97 eventBus.on) | 194 ÑÐ»ÐµÐ¼ÐµÐ½Ñ‚Ð° | ðŸŸ¡ 5/10 | STANDARDIZE Ð½Ð° hooks/stores |

**Overall Duplication Score: 5.5/10** â€” Ð¼Ð½Ð¾Ð³Ð¾ Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð½Ð¾ Ð¿Ñ€Ð°Ð²Ð¸Ð»ÑŒÐ½Ð¾Ð³Ð¾ Â«Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸ÑÂ» (memory types, adapters, modular services), Ð½Ð¾ **Ñ€ÐµÐ°Ð»ÑŒÐ½Ð°Ñ Ð¸Ð·Ð±Ñ‹Ñ‚Ð¾Ñ‡Ð½Ð¾ÑÑ‚ÑŒ** Ð² `rivals/` (175 Ñ„Ð°Ð¹Ð»Ð¾Ð²), UI overlap (13 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹), 62 uniform technique panels Ð¸ pattern-duplication (97 setError) â€” Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ cleanup.

**ÐŸÐ¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»ÑŒÐ½Ð°Ñ ÑÐºÐ¾Ð½Ð¾Ð¼Ð¸Ñ Ð¾Ñ‚ cleanup:**
- ~17 500 LOC (rivals moved out)
- ~14 500 LOC (technique panels merged)
- ~1 000 LOC (setError â†’ hook)
- ~10 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð¾Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸ (budget/health/provider/technique consolidation)
- **Ð˜Ñ‚Ð¾Ð³Ð¾: ~33 000 LOC Ð¸ 10+ Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð¾Ð²** Ð¼Ð¾Ð¶Ð½Ð¾ ÑƒÐ±Ñ€Ð°Ñ‚ÑŒ Ð±ÐµÐ· Ð¿Ð¾Ñ‚ÐµÑ€Ð¸ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾ÑÑ‚Ð¸.

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ A. Ð’ÑÐµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð½Ñ‹Ðµ Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ñ‹ Ð² Ñ†Ð¸Ñ„Ñ€Ð°Ñ…

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð¢Ð¸Ð¿ |
|---|---:|---|
| Budget-ÑÐ²ÑÐ·Ð°Ð½Ð½Ñ‹Ñ… Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | 7 | UI overlap |
| Health-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | 4 | UI overlap |
| Provider-UI Ñ‚Ð¾Ñ‡ÐµÐº Ð²Ñ…Ð¾Ð´Ð° | 4 | UI overlap |
| Memory-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | 6 | UI overlap |
| Marketplace-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | 4 | KEEP |
| Hub-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | 6 | UI overlap |
| Technique-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ (uniform) | 62 | MERGE candidate |
| `rivals/` Ð¿Ð¾Ð´ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð² | 19 (~175 Ñ„Ð°Ð¹Ð»Ð¾Ð²) | research parallel |
| Ð”ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ð¾Ð² Ñ„Ð°Ð¹Ð»Ð¾Ð² (Ñ‚Ð¾ Ð¶Ðµ Ð¸Ð¼Ñ) | 7 Ð¿Ð°Ñ€ | DUPLICATE |
| `IMemoryStore` Ñ€ÐµÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¹ | 8 | architectural |
| Memory-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ð²ÐµÑ€Ñ…Ð½ÐµÐ³Ð¾ ÑƒÑ€Ð¾Ð²Ð½Ñ | 6 | MERGE candidate |
| Memory-contract Ñ„Ð°Ð¹Ð»Ð¾Ð² | 10 | MERGE candidate |
| Health-contract Ñ„Ð°Ð¹Ð»Ð¾Ð² | 5 | MERGE candidate |
| Health-ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² | 5 | centralize candidate |
| Key-management Ñ„Ð°Ð¹Ð»Ð¾Ð² | 16 | KEEP (modular) |
| Router-related Ñ„Ð°Ð¹Ð»Ð¾Ð² | 14 | KEEP (decomposition) |
| LLM adapters | 12 | KEEP (plugin) |
| Storage adapters | 3 | KEEP (plugin) |
| Cache services | 2 | KEEP (different contracts) |
| Ð¤Ð°Ð¹Ð»Ð¾Ð² Ñ `const [error, setError]` | 97 | STANDARDIZE |
| Ð¤Ð°Ð¹Ð»Ð¾Ð² Ñ `useAutoClearError` | 26 | canonical pattern |
| Ð¤Ð°Ð¹Ð»Ð¾Ð² Ñ `usePolling` | 79 | canonical pattern |
| Ð¤Ð°Ð¹Ð»Ð¾Ð² Ñ `eventBus.on` (direct) | 46 | centralize candidate |
| ÐœÐ°Ñ€ÑˆÑ€ÑƒÑ‚Ð¾Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸ (Ð²ÑÐµÐ³Ð¾) | 268 | â€” |
| ÐšÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚Ð¾Ð² Ð½Ð° MERGE/DELETE | 20 Ð³Ñ€ÑƒÐ¿Ð¿ | â€” |
| ÐšÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚Ð¾Ð² Ð½Ð° KEEP INDEPENDENT | 12 Ð³Ñ€ÑƒÐ¿Ð¿ | â€” |

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ B. Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð¸ Ð¼ÐµÑ‚Ð¾Ð´

| Ð§Ñ‚Ð¾ | Ð“Ð´Ðµ | ÐšÐ°Ðº Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ |
|---|---|---|
| ÐŸÐ°Ð½ÐµÐ»Ð¸ Ð¿Ð¾ Ð³Ñ€ÑƒÐ¿Ð¿Ð°Ð¼ | `ls src/components/` | `grep -iE "budget\|health\|provider\|â€¦"` |
| Ð”ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚Ñ‹ Ñ„Ð°Ð¹Ð»Ð¾Ð² | `src/kernel/services/` | `find -name | sed | sort | uniq -d` |
| `rivals/` Ð¿Ð¾Ð´ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¸ | `src/kernel/services/` | `ls \| grep rivals` |
| `IMemoryStore` impl | `src/kernel/services/memory/` | `grep -rl "implements IMemoryStore"` |
| Memory contracts | `src/kernel/contracts/` | `ls \| grep -i memory` |
| Health contracts | `src/kernel/contracts/` | `ls \| grep -i health` |
| Error pattern | `src/components/` | `grep -rE "const \[error, setError\]"` |
| Service duplication | `src/kernel/services/` | `find -name "*-service.ts" \| sort \| uniq -c` |
| Polling pattern | `src/components/` | `grep -rE "usePolling\("` |
| Subscription pattern | `src/components/` | `grep -rE "eventBus\.on\("` |
| Technique panel uniformity | `TechniquePanels/` | `diff` Ð¿Ð¾ÑÐ»Ðµ sed-Ð½Ð¾Ñ€Ð¼Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸ |
| Key management modularity | `key-management/` | `ls` |
| Router decomposition | `services/` | `ls \| grep router` |

---

*ÐžÑ‚Ñ‡Ñ‘Ñ‚ ÑÐ³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð¾Ð²Ð°Ð½ 2026-10-31 Ð½Ð° Ð¾ÑÐ½Ð¾Ð²Ðµ ÐºÐ¾Ð¼Ð¼Ð¸Ñ‚Ð° `e08ab8e`. ÐÐ½Ð°Ð»Ð¸Ð· ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹; runtime-Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ñ… Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹/ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² Ð½Ðµ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÑÐ»Ð¾ÑÑŒ. ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð¾Ñ‚Ñ‡Ñ‘Ñ‚Ñ‹: Â«ÐšÐ°Ñ€Ñ‚Ð° Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ð¸ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð¹ Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ‚ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¾Ð³Ð¾ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÑÂ», Â«ÐšÐ°Ñ€Ñ‚Ð° Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ñ Ñ€ÐµÑÑƒÑ€ÑÐ¾Ð²Â».*
