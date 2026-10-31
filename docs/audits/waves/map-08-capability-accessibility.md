# ÐšÐ°Ñ€Ñ‚Ð° Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾ÑÑ‚Ð¸ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹ â€” Capability Accessibility Map
## SuperAgents OS (`egilyad/ai-os-new`)

> **Ð’ÐµÑ€ÑÐ¸Ñ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°:** commit `e08ab8e` (Oct 31, 2026, Ð²ÐµÑ‚ÐºÐ° `main`)
> **Ð”Ð°Ñ‚Ð° Ð°Ð½Ð°Ð»Ð¸Ð·Ð°:** 2026-10-31
> **ÐœÐµÑ‚Ð¾Ð´:** ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð· `Sidebar.tsx` (16 KB), `CommandPalette.tsx` (618 ÑÑ‚Ñ€Ð¾Ðº), `OnboardingWizard` (230 ÑÑ‚Ñ€Ð¾Ðº), `KeyboardShortcutsModal` (364 ÑÑ‚Ñ€Ð¾ÐºÐ¸), `AssistantPanel` (379 ÑÑ‚Ñ€Ð¾Ðº), `panel-actions-catalog.ts` (4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸!), `NextActionPredictions`, `NavGraphPanel`, + ÑÐ²ÐµÑ€ÐºÐ° Ñ `panels-catalog.md` (268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹, 64 Ð±ÐµÐ· wiki)
> **ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ñ‹:** 7 Ð¿Ñ€ÐµÐ´Ñ‹Ð´ÑƒÑ‰Ð¸Ñ… ÐºÐ°Ñ€Ñ‚ (Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚ÑŒ, Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚ÑŒ, Ñ‚ÐµÑ…ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ, Ñ€ÐµÑÑƒÑ€ÑÑ‹, Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ, Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸, lifecycle)
> **Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ñ€ÐµÐ·ÑƒÐ»ÑŒÑ‚Ð°Ñ‚:** Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾ **28 Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹Ñ… Ð¸Ð»Ð¸ ÑÐ»Ð°Ð±Ð¾Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹Ñ… Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¹**, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ðµ **ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÑŽÑ‚ Ð¸ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‚**, Ð½Ð¾ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ ÑÐºÐ¾Ñ€ÐµÐµ Ð²ÑÐµÐ³Ð¾ **Ð½Ðµ ÑƒÐ·Ð½Ð°ÐµÑ‚ Ð¾ Ð½Ð¸Ñ…**.

---

## 1. Ð˜ÑÐ¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾Ðµ Ñ€ÐµÐ·ÑŽÐ¼Ðµ

SuperAgents OS Ð¸Ð¼ÐµÐµÑ‚ **5 ÑƒÑ€Ð¾Ð²Ð½ÐµÐ¹ Ð¾Ð±Ð½Ð°Ñ€ÑƒÐ¶ÐµÐ½Ð¸Ñ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹**: Sidebar (primary), CommandPalette Cmd+K (secondary), NavGraphPanel (visual), Assistant (proactive chat), NextActionPredictions (context-based suggestions). Ð•ÑÑ‚ÑŒ **OnboardingWizard** (3 ÑˆÐ°Ð³Ð°: Welcome â†’ AddKey â†’ Done), **KeyboardShortcutsModal** (12 ÑˆÐ¾Ñ€Ñ‚ÐºÐ°Ñ‚Ð¾Ð² Ñ‡ÐµÑ€ÐµÐ· `?`), **Breadcrumbs**, **QuickAccess** (pinned + recent). SettingsPanel â€” 8 Ñ‚Ð°Ð±Ð¾Ð². Assistant Ð¸Ð¼ÐµÐµÑ‚ **ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³ Ð¸Ð· 4 832 ÑÑ‚Ñ€Ð¾Ðº** Ñ Ð¾Ð¿Ð¸ÑÐ°Ð½Ð¸ÐµÐ¼ Ð²ÑÐµÑ… Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹.

**ÐÐž:** Ð¿Ñ€Ð¸ **268 Ð¿Ð°Ð½ÐµÐ»ÑÑ… Ð² 22 Ñ€Ð°Ð·Ð´ÐµÐ»Ð°Ñ…** Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ñ Ð¿ÐµÑ€ÐµÐ³Ñ€ÑƒÐ¶ÐµÐ½Ð°. **64 Ð¿Ð°Ð½ÐµÐ»Ð¸ (24%) Ð±ÐµÐ· wiki-ÑÑ‚Ð°Ñ‚ÑŒÑ** â€” Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ ÑÐ¼Ð¾Ð¶ÐµÑ‚ ÑƒÐ·Ð½Ð°Ñ‚ÑŒ, Ñ‡Ñ‚Ð¾ Ð¾Ð½Ð¸ Ð´ÐµÐ»Ð°ÑŽÑ‚. **62 TechniquePanels** â€” uniform, Ñ‚Ð¾Ð½ÑƒÑ‚ Ð² Ñ€Ð°Ð·Ð´ÐµÐ»Ðµ Â«Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸Â». **3 ÑÐ²Ð½Ñ‹Ðµ Ð·Ð°Ð³Ð»ÑƒÑˆÐºÐ¸** (OpenRouter 29 ÑÑ‚Ñ€Ð¾Ðº, SocialLeaderboard 34, Governance 61) â€” Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð¸Ñ… Ð¾Ñ‚ÐºÑ€Ð¾ÐµÑ‚ Ð¸ Ñ€Ð°Ð·Ð¾Ñ‡Ð°Ñ€ÑƒÐµÑ‚ÑÑ.

**Ð¡Ð²Ð¾Ð´Ð½Ñ‹Ðµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾ÑÑ‚Ð¸:**

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | ÐžÑ†ÐµÐ½ÐºÐ° |
|---|---:|---|
| Ð’ÑÐµÐ³Ð¾ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ (Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð¾Ð²) | **268** | â€” |
| Ð Ð°Ð·Ð´ÐµÐ»Ð¾Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸ | **22** | ðŸŸ¡ Ð¼Ð½Ð¾Ð³Ð¾ |
| ÐŸÐ°Ð½ÐµÐ»ÐµÐ¹ Ñ wiki-ÑÑ‚Ð°Ñ‚Ñ‘Ð¹ | **204 / 268 (76%)** | ðŸŸ¡ |
| **ÐŸÐ°Ð½ÐµÐ»ÐµÐ¹ Ð‘Ð•Ð— wiki-ÑÑ‚Ð°Ñ‚ÑŒÑ** | **64 (24%)** | ðŸ”´ Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹ Ð´Ð»Ñ discovery |
| Ð£Ñ€Ð¾Ð²Ð½ÐµÐ¹ Ð¾Ð±Ð½Ð°Ñ€ÑƒÐ¶ÐµÐ½Ð¸Ñ | **5** (Sidebar, Cmd+K, NavGraph, Assistant, NextAction) | ðŸŸ¢ multiple |
| Ð¨Ð¾Ñ€Ñ‚ÐºÐ°Ñ‚Ð¾Ð² Ð² KeyboardShortcutsModal | **12** | ðŸŸ¢ Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾ |
| Quick actions Ð² CommandPalette | **10** | ðŸŸ¢ |
| Onboarding steps | **3** (Welcome â†’ AddKey â†’ Done) | ðŸŸ¡ Ð¼Ð¸Ð½Ð¸Ð¼Ð°Ð»ÑŒÐ½Ñ‹Ð¹ |
| Settings tabs | **8** | ðŸŸ¢ ÑÑ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¾ |
| Assistant action catalog | **4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸** | ðŸŸ¢ðŸŸ¢ extensive |
| Sidebar search | âœ… (placeholder Â«ÐŸÐ¾Ð¸ÑÐº â€” âŒ˜KÂ») | ðŸŸ¢ |
| Pinning panels | âœ… (persisted) | ðŸŸ¢ |
| Section collapse | âœ… (persisted) | ðŸŸ¢ |
| Breadcrumbs | âœ… (94 ÑÑ‚Ñ€Ð¾ÐºÐ¸) | ðŸŸ¢ |
| ModuleInfo (in-panel docs) | âœ… | ðŸŸ¢ |
| NextActionPredictions | âœ… (231 ÑÑ‚Ñ€Ð¾ÐºÐ°, context-based) | ðŸŸ¢ proactive |
| ChatDock (always-available chat) | âœ… (91 ÑÑ‚Ñ€Ð¾ÐºÐ°) | ðŸŸ¢ |
| Mobile BottomNav | âœ… (75 ÑÑ‚Ñ€Ð¾Ðº) | ðŸŸ¢ |
| Experimental panels Ð² main nav | ðŸŸ¡ Aquarium, FederatedMemory â€” Ð²Ð¸Ð´Ð½Ñ‹ Ð±ÐµÐ· experimental badge | ðŸŸ¡ |
| Stub panels Ð² main nav | ðŸ”´ OpenRouter, SocialLeaderboard, Governance | ðŸ”´ |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ ÑÐ¸Ð»ÑŒÐ½Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **5 ÑƒÑ€Ð¾Ð²Ð½ÐµÐ¹ discovery** â€” Sidebar + Cmd+K + NavGraph + Assistant + NextAction
- **Assistant catalog 4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸** â€” ÑÐ°Ð¼Ñ‹Ð¹ Ð¿Ð¾Ð»Ð½Ñ‹Ð¹ ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹
- **CommandPalette Ñ fuzzy search** â€” Ð±Ñ‹ÑÑ‚Ñ€Ð°Ñ Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ñ
- **12 keyboard shortcuts** â€” Ð´Ð»Ñ power-users
- **NextActionPredictions** â€” proactive suggestions Ð¿Ð¾ ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ñƒ
- **OnboardingWizard** â€” first-run guidance
- **Pinning + recent** Ð² QuickAccess

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹:**
- **64 Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð±ÐµÐ· wiki-ÑÑ‚Ð°Ñ‚ÑŒÑ** â€” 24% Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¹ Ð½ÐµÐ´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ñ‹
- **268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð² 22 Ñ€Ð°Ð·Ð´ÐµÐ»Ð°Ñ…** â€” cognitive overload
- **62 TechniquePanels** â€” uniform, Ñ‚Ð¾Ð½ÑƒÑ‚ Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸
- **3 stub-Ð¿Ð°Ð½ÐµÐ»Ð¸** Ð² main nav â€” Ñ€Ð°Ð·Ð¾Ñ‡Ð°Ñ€Ð¾Ð²Ñ‹Ð²Ð°ÑŽÑ‚
- **Experimental panels Ð±ÐµÐ· badge** â€” Aquarium, FederatedMemory Ð²Ð¸Ð´Ð½Ñ‹ Ð±ÐµÐ· Ð¿Ñ€ÐµÐ´ÑƒÐ¿Ñ€ÐµÐ¶Ð´ÐµÐ½Ð¸Ñ
- **OnboardingWizard Ð¼Ð¸Ð½Ð¸Ð¼Ð°Ð»ÑŒÐ½Ñ‹Ð¹** â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Â«add keyÂ», Ð½Ðµ Ð·Ð½Ð°ÐºÐ¾Ð¼Ð¸Ñ‚ Ñ killer-Ñ„Ð¸Ñ‡Ð°Ð¼Ð¸ (Crystal Vault, Synthesis, Builder)
- **Assistant catalog Ð½Ðµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ÑÑ Ð´Ð»Ñ discovery** â€” catalog ÐµÑÑ‚ÑŒ, Ð½Ð¾ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚, Ñ‡Ñ‚Ð¾ assistant ÑƒÐ¼ÐµÐµÑ‚

**Accessibility Score: 6.5/10** â€” Ð¼Ð½Ð¾Ð³Ð¾ Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð² discovery, Ð½Ð¾ 268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ + 64 Ð±ÐµÐ· wiki + Ð¿ÐµÑ€ÐµÐ³Ñ€ÑƒÐ¶ÐµÐ½Ð½Ð°Ñ Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ñ = user Ð½Ðµ Ð½Ð°Ð¹Ð´Ñ‘Ñ‚ Ð¿Ð¾Ð»Ð¾Ð²Ð¸Ð½Ñƒ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹.

---

## 2. ÐœÐµÑ‚Ð¾Ð´Ð¾Ð»Ð¾Ð³Ð¸Ñ: 7 Ð²Ð¾Ð¿Ñ€Ð¾ÑÐ¾Ð²

| # | Ð’Ð¾Ð¿Ñ€Ð¾Ñ | Ð§Ñ‚Ð¾ Ð°Ð½Ð°Ð»Ð¸Ð·Ð¸Ñ€ÑƒÐµÐ¼ | ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° |
|---|---|---|---|
| 1 | ÐÐ°ÑÐºÐ¾Ð»ÑŒÐºÐ¾ Ð»ÐµÐ³ÐºÐ¾ Ð¾Ð±Ð½Ð°Ñ€ÑƒÐ¶Ð¸Ñ‚ÑŒ Ñ„ÑƒÐ½ÐºÑ†Ð¸ÑŽ? | Ð¡ÐºÐ¾Ð»ÑŒÐºÐ¾ Ð¿ÑƒÑ‚ÐµÐ¹ Ðº Ð½ÐµÐ¹ Ð²ÐµÐ´ÑƒÑ‚ | # entry points per panel |
| 2 | Ð¡ÐºÐ¾Ð»ÑŒÐºÐ¾ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ð¹ Ð´Ð»Ñ Ð·Ð°Ð¿ÑƒÑÐºÐ°? | Click depth | # clicks Ð¾Ñ‚ ÑÑ‚Ð°Ñ€Ñ‚Ð° |
| 3 | ÐŸÐ¾Ð½ÑÑ‚Ð½Ð°Ñ Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ñ? | Structure, labels, search |Sidebar + Cmd+K + NavGraph |
| 4 | Ð”Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð° Ð¸Ð· Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¸Ñ… ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ð¾Ð²? | Cross-linking | # contexts where feature is reachable |
| 5 | Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ðµ Ñ‚Ð¾Ñ‡ÐºÐ¸ Ð²Ñ…Ð¾Ð´Ð°? | Multiple routes to same panel | overlapping UI (ÑÐ¼. Duplication Map) |
| 6 | ÐŸÐ¾Ð½ÑÑ‚Ð½Ñ‹ Ð»Ð¸ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸? | Settings structure | tabs count, labels |
| 7 | Ð£Ð´Ð¾Ð±Ð½Ñ‹Ð¹ Ð¿Ð¾Ð¸ÑÐº Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹? | Search quality | Sidebar search + Cmd+K + Assistant |

**ÐŸÑ€Ð¸Ð½Ñ†Ð¸Ð¿:** Â«ÐŸÐ°Ð½ÐµÐ»ÑŒ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ Ð¿Ñ€ÐµÐºÑ€Ð°ÑÐ½Ð¾Ð¹, Ð½Ð¾ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð¼Ð¾Ð¶ÐµÑ‚ Ð´Ð°Ð¶Ðµ Ð½Ðµ Ð·Ð½Ð°Ñ‚ÑŒ Ð¾ ÐµÑ‘ ÑÑƒÑ‰ÐµÑÑ‚Ð²Ð¾Ð²Ð°Ð½Ð¸Ð¸Â» â€” Ð¿Ð¾ÑÑ‚Ð¾Ð¼Ñƒ Ñ„Ð¾ÐºÑƒÑ Ð½Ð° **discovery gap**: Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¸, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ðµ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‚, Ð½Ð¾ Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹ Ð¸Ð»Ð¸ Ð½ÐµÐ´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ñ‹.

---

## 3. Ð£Ñ€Ð¾Ð²Ð½Ð¸ Ð¾Ð±Ð½Ð°Ñ€ÑƒÐ¶ÐµÐ½Ð¸Ñ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹ (5 ÑÐ»Ð¾Ñ‘Ð²)

### 3.1. Layer 1: Sidebar (primary nav) â€” 16 KB

**Ð¡Ñ‚Ñ€ÑƒÐºÑ‚ÑƒÑ€Ð°:**
- 22 Ñ€Ð°Ð·Ð´ÐµÐ»Ð° (`NAV_SECTIONS`)
- 268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ (items)
- **Search box** (placeholder Â«ÐŸÐ¾Ð¸ÑÐº â€” âŒ˜KÂ»)
- **Pinning** (persisted Ð² localStorage)
- **Section collapse** (persisted)
- **NavBadge** (ÑƒÐ²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ñ Ð½Ð° Ð¿Ð°Ð½ÐµÐ»ÑÑ… â€” `useNavBadgeSubscriptions`)
- **QuickAccess** (pinned + recent)
- **Mobile**: drawer Ñ overlay

**EVIDENCE â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾:**
- Search Ñ„Ð¸Ð»ÑŒÑ‚Ñ€ÑƒÐµÑ‚ Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð¿Ð¾ Ð¸Ð¼ÐµÐ½Ð¸
- Pinning Ð¿Ð¾Ð·Ð²Ð¾Ð»ÑÐµÑ‚ Ð¿Ð¾Ð´Ð½ÑÑ‚ÑŒ Ñ‡Ð°ÑÑ‚Ð¾ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÐ¼Ñ‹Ðµ
- Section collapse Ð¿Ð¾Ð·Ð²Ð¾Ð»ÑÐµÑ‚ ÑÐ¿Ñ€ÑÑ‚Ð°Ñ‚ÑŒ Ð½ÐµÐ¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÐ¼Ñ‹Ðµ Ñ€Ð°Ð·Ð´ÐµÐ»Ñ‹
- NavBadge Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ ÑƒÐ²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ñ (alerts, health, etc.)

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** 268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð² 22 Ñ€Ð°Ð·Ð´ÐµÐ»Ð°Ñ… â€” **cognitive overload**. Ð•ÑÐ»Ð¸ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ collapsed Ñ€Ð°Ð·Ð´ÐµÐ»Ñ‹, Ð¾Ð½ Ð²Ð¸Ð´Ð¸Ñ‚ Ð²ÑÐµ 22 ÑÑ€Ð°Ð·Ñƒ.

### 3.2. Layer 2: CommandPalette (Cmd+K) â€” 618 ÑÑ‚Ñ€Ð¾Ðº

**Ð’Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸:**
- **Fuzzy search** Ð¿Ð¾ Ð²ÑÐµÐ¼ 268 Ð¿Ð°Ð½ÐµÐ»ÑÐ¼ + 10 quick actions
- **Recent** (8 Ð¿Ð¾ÑÐ»ÐµÐ´Ð½Ð¸Ñ…, persisted)
- **Agents** list (dynamic, Ð¸Ð· `agentService.getAgents()`)
- **Forum topics** (dynamic, Ð¸Ð· `forumService.listTopics()`)
- **10 quick actions**: newScenario, newDebate, newWorkflow, openForum, openRoom, toggleTheme, openSettings, openProviders, openChat, openAgents
- **Keyboard nav**: arrow keys, Enter, Escape

**EVIDENCE â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾:**
- Fuzzy search Ñ scoring (bonus Ð·Ð° consecutive chars)
- Recent items â€” Ð±Ñ‹ÑÑ‚Ñ€Ñ‹Ð¹ Ð´Ð¾ÑÑ‚ÑƒÐ¿ Ðº Ð¿Ð¾ÑÐ»ÐµÐ´Ð½Ð¸Ð¼
- Dynamic items (agents, topics) â€” assistant-aware
- Action chips (newScenario, newDebate) â€” shortcuts Ðº creation

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 10 quick actions â€” Ð´Ð»Ñ 268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ ÑÑ‚Ð¾ Ð¼Ð°Ð»Ð¾. ÐÐµÑ‚ actions Ñ‚Ð¸Ð¿Ð° Â«export chatÂ», Â«save snapshotÂ», Â«start debate with agent XÂ».

### 3.3. Layer 3: NavGraphPanel â€” visual graph nav (84 ÑÑ‚Ñ€Ð¾ÐºÐ¸)

**Ð§Ñ‚Ð¾:** vis-network graph Ñ Ñ€Ð°Ð·Ð´ÐµÐ»Ð°Ð¼Ð¸ (ÐºÑ€ÑƒÐ¿Ð½Ñ‹Ðµ ÑƒÐ·Ð»Ñ‹) â†’ Ð¿Ð°Ð½ÐµÐ»ÑÐ¼Ð¸ (Ð¼ÐµÐ»ÐºÐ¸Ðµ ÑƒÐ·Ð»Ñ‹). Click Ð¿Ð¾ ÑƒÐ·Ð»Ñƒ â†’ navigate. Zoom, pan, drag.

**EVIDENCE â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾:** Ð°Ð»ÑŒÑ‚ÐµÑ€Ð½Ð°Ñ‚Ð¸Ð²Ð½Ñ‹Ð¹ Ð²Ð¸Ð·ÑƒÐ°Ð»ÑŒÐ½Ñ‹Ð¹ ÑÐ¿Ð¾ÑÐ¾Ð± Ð¸ÑÑÐ»ÐµÐ´Ð¾Ð²Ð°Ð½Ð¸Ñ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹. ÐŸÐ¾Ð»ÐµÐ·ÐµÐ½ Ð´Ð»Ñ new users Ñ‡Ñ‚Ð¾Ð±Ñ‹ Ð¿Ð¾Ð½ÑÑ‚ÑŒ scope.

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** 268 ÑƒÐ·Ð»Ð¾Ð² Ð² Ð¾Ð´Ð½Ð¾Ð¼ Ð³Ñ€Ð°Ñ„Ðµ â€” **Ð¿ÐµÑ€ÐµÐ³Ñ€ÑƒÐ¶ÐµÐ½Ð¾**, Ñ‚Ñ€ÑƒÐ´Ð½Ð¾ Ð½Ð°Ð¹Ñ‚Ð¸ ÐºÐ¾Ð½ÐºÑ€ÐµÑ‚Ð½ÑƒÑŽ Ð¿Ð°Ð½ÐµÐ»ÑŒ.

### 3.4. Layer 4: Assistant (proactive chat helper) â€” 379 + 4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸

**Ð§Ñ‚Ð¾:** Chat-based assistant Ñ face, voice (use-speech), action chips. Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ `assistantNavigationService` + `capabilityTrustService` + `panel-actions-catalog.ts` (**4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸** ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð° Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹).

**Catalog Ð²ÐºÐ»ÑŽÑ‡Ð°ÐµÑ‚:** agentJournalService, agentPermissionService, agentService, capabilityTrustService, debateService, diagnosticService, keyService, mcpService, memoryOrchestrator, memoryService, monitoringService, policyService, projectKnowledgeService, providerTracker, roleService, sessionManager, settingsService, skillService, systemStatusService, workspaceService, agemsApprovalService, agemsTaskService.

**EVIDENCE â€” Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ð¾:** catalog 4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸ = assistant Ð¼Ð¾Ð¶ÐµÑ‚ Ñ€Ð°ÑÑÐºÐ°Ð·Ð°Ñ‚ÑŒ Ð¾ Ð±Ð¾Ð»ÑŒÑˆÐ¸Ð½ÑÑ‚Ð²Ðµ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹. **Ð­Ñ‚Ð¾ Ð»ÑƒÑ‡ÑˆÐ¸Ð¹ discovery-Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚ Ð² Ð¿Ñ€Ð¾ÐµÐºÑ‚Ðµ.**

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ **Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚**, Ñ‡Ñ‚Ð¾ assistant ÑÑ‚Ð¾ ÑƒÐ¼ÐµÐµÑ‚. ÐÐµÑ‚ onboarding-ÑˆÐ°Ð³Ð° Â«Assistant Ð¼Ð¾Ð¶ÐµÑ‚ Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Ð²ÑÐµ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸Â». ÐÐµÑ‚ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñ‹ Â«what can you do?Â» Ð² ÑÐ²Ð½Ð¾Ð¼ Ð²Ð¸Ð´Ðµ.

### 3.5. Layer 5: NextActionPredictions â€” context-based (231 ÑÑ‚Ñ€Ð¾ÐºÐ°)

**Ð§Ñ‚Ð¾:** ÐÐ° ÐºÐ°Ð¶Ð´Ð¾Ð¼ Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ðµ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ 3 Ð¿Ñ€ÐµÐ´ÑÐºÐ°Ð·Ð°Ð½Ð½Ñ‹Ñ… next-action. ÐÐ°Ð¿Ñ€Ð¸Ð¼ÐµÑ€, Ð½Ð° `/` (dashboard): start_debate, add_key, open_tools. ÐÐ° `/providers`: probe_all, etc.

**EVIDENCE â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾:** proactive suggestions Ð½Ð° Ð¾ÑÐ½Ð¾Ð²Ðµ Ñ‚ÐµÐºÑƒÑ‰ÐµÐ³Ð¾ ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ð°. Ð­Ñ‚Ð¾ **Ñ€ÐµÐ´ÐºÐ°Ñ** Ð¸ Ñ†ÐµÐ½Ð½Ð°Ñ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ñ.

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 3 Ð¿Ñ€ÐµÐ´ÑÐºÐ°Ð·Ð°Ð½Ð¸Ñ Ð½Ð° Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚. ÐÐµ Ð¾Ñ…Ð²Ð°Ñ‚Ñ‹Ð²Ð°ÐµÑ‚ Ð²ÑÐµ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸.

### 3.6. Ð”Ð¾Ð¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ñ‹Ðµ ÑƒÑ€Ð¾Ð²Ð½Ð¸

| ÐœÐµÑ…Ð°Ð½Ð¸Ð·Ð¼ | Ð“Ð´Ðµ | Ð—Ð°Ñ‡ÐµÐ¼ |
|---|---|---|
| **OnboardingWizard** (3 ÑˆÐ°Ð³Ð°) | First-run | Welcome â†’ AddConnection â†’ Done |
| **KeyboardShortcutsModal** (12 shortcuts, `?`) | Power-users | Ð‘Ñ‹ÑÑ‚Ñ€Ñ‹Ð¹ Ð´Ð¾ÑÑ‚ÑƒÐ¿ |
| **Breadcrumbs** (94 ÑÑ‚Ñ€Ð¾ÐºÐ¸) | Top of page | Ð¢ÐµÐºÑƒÑ‰ÐµÐµ location |
| **ModuleInfo** | Ð’ ÐºÐ°Ð¶Ð´Ð¾Ð¹ Ð¿Ð°Ð½ÐµÐ»Ð¸ | In-panel docs |
| **ChatDock** (91 ÑÑ‚Ñ€Ð¾ÐºÐ°) | Floating | Always-available chat |
| **BottomNav** (75 ÑÑ‚Ñ€Ð¾Ðº) | Mobile | Bottom navigation |
| **NavBadge** (35 ÑÑ‚Ñ€Ð¾Ðº) | Sidebar items | Ð£Ð²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ñ |

---

## 4. ÐÐ½Ð°Ð»Ð¸Ð· Ð¿Ð¾ 7 Ð²Ð¾Ð¿Ñ€Ð¾ÑÐ°Ð¼

### 4.1. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 1: ÐÐ°ÑÐºÐ¾Ð»ÑŒÐºÐ¾ Ð»ÐµÐ³ÐºÐ¾ Ð¾Ð±Ð½Ð°Ñ€ÑƒÐ¶Ð¸Ñ‚ÑŒ Ñ„ÑƒÐ½ÐºÑ†Ð¸ÑŽ?

**Discovery paths per panel:**

| ÐŸÑƒÑ‚ÑŒ | ÐŸÐ¾ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | ÐšÐ°Ñ‡ÐµÑÑ‚Ð²Ð¾ |
|---|---:|---|
| Sidebar nav | 268 / 268 (100%) | ðŸŸ¢ primary, Ð½Ð¾ 22 Ñ€Ð°Ð·Ð´ÐµÐ»Ð° |
| CommandPalette Cmd+K | 268 / 268 (100%) + 10 actions | ðŸŸ¢ fuzzy search |
| NavGraphPanel | 268 / 268 (100%) | ðŸŸ¡ visual, Ð½Ð¾ Ð¿ÐµÑ€ÐµÐ³Ñ€ÑƒÐ¶ÐµÐ½ |
| Assistant catalog | ~25 ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð² covered | ðŸŸ¢ catalog 4832 ÑÑ‚Ñ€Ð¾ÐºÐ¸, Ð½Ð¾ user Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚ |
| NextActionPredictions | ~3 per route | ðŸŸ¡ context-based, limited |
| Wiki search | 204 / 268 (76%) | ðŸŸ¡ 64 Ð±ÐµÐ· wiki |
| Google Â«site:github.com/egilyad/ai-os-newÂ» | Ð²ÑÐµ | ðŸ”´ outside app |

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** ÐºÐ°Ð¶Ð´Ð°Ñ Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð° **Ð¼Ð¸Ð½Ð¸Ð¼ÑƒÐ¼ 3 Ð¿ÑƒÑ‚ÑÐ¼Ð¸** (Sidebar + Cmd+K + NavGraph). **ÐÐž** Ð±ÐµÐ· wiki-ÑÑ‚Ð°Ñ‚ÑŒÐ¸ 64 Ð¿Ð°Ð½ÐµÐ»Ð¸ â€” Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð¿Ð¾Ð¹Ð¼Ñ‘Ñ‚, Ñ‡Ñ‚Ð¾ Ð¾Ð½Ð¸ Ð´ÐµÐ»Ð°ÑŽÑ‚, Ð´Ð°Ð¶Ðµ ÐµÑÐ»Ð¸ Ð½Ð°Ð¹Ð´Ñ‘Ñ‚.

### 4.2. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 2: Ð¡ÐºÐ¾Ð»ÑŒÐºÐ¾ Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ð¹ Ð´Ð»Ñ Ð·Ð°Ð¿ÑƒÑÐºÐ°?

**Click depth (typical):**

| Ð¡Ñ†ÐµÐ½Ð°Ñ€Ð¸Ð¹ | Clicks | ÐžÑ†ÐµÐ½ÐºÐ° |
|---|---:|---|
| Sidebar â†’ Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð² Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚Ð¾Ð¼ Ñ€Ð°Ð·Ð´ÐµÐ»Ðµ | **2** (click section â†’ click panel) | ðŸŸ¢ |
| Sidebar â†’ Ð¿Ð°Ð½ÐµÐ»ÑŒ Ð² ÑÐ²Ñ‘Ñ€Ð½ÑƒÑ‚Ð¾Ð¼ Ñ€Ð°Ð·Ð´ÐµÐ»Ðµ | **3** (expand â†’ click panel) | ðŸŸ¡ |
| Cmd+K â†’ fuzzy search â†’ Enter | **2** (Cmd+K â†’ type â†’ Enter) | ðŸŸ¢ |
| Pin â†’ QuickAccess â†’ Ð¿Ð°Ð½ÐµÐ»ÑŒ | **1** (click pinned) | ðŸŸ¢ðŸŸ¢ |
| Recent â†’ QuickAccess â†’ Ð¿Ð°Ð½ÐµÐ»ÑŒ | **1** | ðŸŸ¢ðŸŸ¢ |
| NavGraph â†’ click node | **1** (Ð½Ð¾ ÑÐ½Ð°Ñ‡Ð°Ð»Ð° Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚ÑŒ NavGraph) | ðŸŸ¡ |
| Assistant â†’ ask â†’ action chip | **2-3** | ðŸŸ¡ |
| NextAction â†’ prediction click | **1** | ðŸŸ¢ðŸŸ¢ |
| Onboarding step â†’ action | **1** | ðŸŸ¢ |

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** **1â€“3 clicks** Ð´Ð»Ñ Ð±Ð¾Ð»ÑŒÑˆÐ¸Ð½ÑÑ‚Ð²Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¹. Pinning Ð¸ NextAction Ð´Ð°ÑŽÑ‚ 1-click Ð´Ð¾ÑÑ‚ÑƒÐ¿. **Ð¥Ð¾Ñ€Ð¾ÑˆÐ¾.**

### 4.3. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 3: ÐŸÐ¾Ð½ÑÑ‚Ð½Ð°Ñ Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ñ?

**Sidebar structure:**
- 22 Ñ€Ð°Ð·Ð´ÐµÐ»Ð° Ñ i18n labels (`nav.section_dashboard`, `nav.section_chat`, etc.)
- Ð˜ÐºÐ¾Ð½ÐºÐ¸ Ð½Ð° ÐºÐ°Ð¶Ð´Ð¾Ð¼ Ñ€Ð°Ð·Ð´ÐµÐ»Ðµ (Icons.* Ð² route-registry)
- Ð¦Ð²ÐµÑ‚Ð° Ð½Ð° ÐºÐ°Ð¶Ð´Ð¾Ð¼ item (color: '#3b82f6', etc.)
- Badges (NavBadge) Ð´Ð»Ñ ÑƒÐ²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ð¹

**EVIDENCE â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾:**
- i18n labels (ru/en)
- Ð˜ÐºÐ¾Ð½ÐºÐ¸ + Ñ†Ð²ÐµÑ‚Ð° â€” Ð²Ð¸Ð·ÑƒÐ°Ð»ÑŒÐ½Ð°Ñ Ð´Ð¸Ñ„Ñ„ÐµÑ€ÐµÐ½Ñ†Ð¸Ð°Ñ†Ð¸Ñ
- Section collapse â€” Ð¼Ð¾Ð¶Ð½Ð¾ ÑÐ¿Ñ€ÑÑ‚Ð°Ñ‚ÑŒ Ð½ÐµÐ¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÐ¼Ñ‹Ðµ

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:**
- **22 Ñ€Ð°Ð·Ð´ÐµÐ»Ð°** â€” Ð¼Ð½Ð¾Ð³Ð¾. Ð•ÑÐ»Ð¸ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ collapsed, Ð²Ð¸Ð´Ð¸Ñ‚ Ð²ÑÐµ 22.
- Ð Ð°Ð·Ð´ÐµÐ» Â«ÐžÑÑ‚Ð°Ð»ÑŒÐ½Ð¾ÐµÂ» (`section_other`) â€” **catch-all** Ð´Ð»Ñ unclearly-categorized Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹
- Ð Ð°Ð·Ð´ÐµÐ» Â«Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸Â» â€” **62 Ð¿Ð°Ð½ÐµÐ»Ð¸** Ð²Ð½ÑƒÑ‚Ñ€Ð¸ Ð¾Ð´Ð½Ð¾Ð³Ð¾ Ñ€Ð°Ð·Ð´ÐµÐ»Ð° â€” Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð¾Ñ€Ð¸ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒÑÑ

### 4.4. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 4: Ð”Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð° Ð¸Ð· Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¸Ñ… ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ð¾Ð²?

**Cross-linking Ð¿Ñ€Ð¸Ð¼ÐµÑ€Ñ‹:**

| Ð¤ÑƒÐ½ÐºÑ†Ð¸Ñ | Ð”Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð° Ð¸Ð· | ÐšÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ð¾Ð² |
|---|---|---:|
| Chat | Sidebar, Cmd+K, ChatDock (floating), NextAction | 4 ðŸŸ¢ |
| Providers | Sidebar, Cmd+K, NextAction, Onboarding | 4 ðŸŸ¢ |
| Debate | Sidebar, Cmd+K, NextAction, Ctrl+Shift+D | 4 ðŸŸ¢ |
| Health | Sidebar, Cmd+K, Ctrl+Shift+H | 3 ðŸŸ¢ |
| Traces | Sidebar, Cmd+K, Ctrl+Shift+T | 3 ðŸŸ¢ |
| Keys | Sidebar, Cmd+K, Ctrl+Shift+K, Onboarding | 4 ðŸŸ¢ |
| Settings | Sidebar, Cmd+K, Ctrl+, | 3 ðŸŸ¢ |
| Crystal Vault | Sidebar, Cmd+K | **2** ðŸŸ¡ |
| Synthesis | Sidebar, Cmd+K | **2** ðŸŸ¡ |
| Builder | Sidebar, Cmd+K, NextAction (newWorkflow action) | 3 ðŸŸ¢ |
| Time Machine | Sidebar, Ctrl+Shift+S (snapshot) | 2 ðŸŸ¡ |
| Aquarium (experimental) | Sidebar, Cmd+K | 2 ðŸŸ¡ |
| 62 TechniquePanels | Sidebar (Ð²Ð½ÑƒÑ‚Ñ€Ð¸ Â«Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸Â»), Cmd+K | 2 ðŸŸ¡ |

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** core panels Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹ Ð¸Ð· 3â€“4 ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ð¾Ð². **Killer features (Crystal Vault, Synthesis) â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 2**, Ñ‡Ñ‚Ð¾ Ð¼Ð°Ð»Ð¾ Ð´Ð»Ñ Ð¸Ñ… Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸.

### 4.5. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 5: Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ðµ Ñ‚Ð¾Ñ‡ÐºÐ¸ Ð²Ñ…Ð¾Ð´Ð°?

(ÑÐ¼. Ð¿Ð¾Ð»Ð½ÑƒÑŽ ÐºÐ°Ñ€Ñ‚Ñƒ Ð² Duplication Map Â§3)

| Ð“Ñ€ÑƒÐ¿Ð¿Ð° Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ | Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ñ… Ñ‚Ð¾Ñ‡ÐµÐº Ð²Ñ…Ð¾Ð´Ð° | Verdict |
|---|---:|---|
| Budget (5 panels) | 5 | ðŸŸ¡ overlap |
| Health (4 panels) | 4 | ðŸŸ¡ overlap |
| Provider UI (4 panels) | 4 | ðŸ”´ OpenRouter = Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚ |
| Memory (6 panels) | 6 | ðŸŸ¡ overlap |
| Marketplace (4 panels) | 4 | ðŸŸ¢ different domains |
| Hub (6 panels) | 6 | ðŸŸ¡ overlap |

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** 4â€“5 Ð´ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ñ… Ñ‚Ð¾Ñ‡ÐµÐº Ð²Ñ…Ð¾Ð´Ð° Ð´Ð»Ñ budget/health/provider. ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð¿Ð¾Ð½Ð¸Ð¼Ð°ÐµÑ‚, ÐºÐ°ÐºÑƒÑŽ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚ÑŒ.

### 4.6. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 6: ÐŸÐ¾Ð½ÑÑ‚Ð½Ñ‹ Ð»Ð¸ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸?

**SettingsPanel â€” 8 Ñ‚Ð°Ð±Ð¾Ð²:**

| Ð¢Ð°Ð± | Ð§Ñ‚Ð¾ | ÐžÑ†ÐµÐ½ÐºÐ° |
|---|---|---|
| General | ÐžÑÐ½Ð¾Ð²Ð½Ñ‹Ðµ prefs | ðŸŸ¢ |
| Writing | ÐÐ°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ writing | ðŸŸ¢ |
| Reading | ÐÐ°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ reading | ðŸŸ¢ |
| Alerts | Ð£Ð²ÐµÐ´Ð¾Ð¼Ð»ÐµÐ½Ð¸Ñ | ðŸŸ¢ |
| Advanced | Ð Ð°ÑÑˆÐ¸Ñ€ÐµÐ½Ð½Ñ‹Ðµ | ðŸŸ¡ Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ expertise |
| Notifications | Push/email | ðŸŸ¢ |
| Appearance | Theme, layout | ðŸŸ¢ |
| Prompts | System prompts | ðŸŸ¡ Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ expertise |

**EVIDENCE â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾:**
- 8 Ñ‚Ð°Ð±Ð¾Ð² Ñ ÑÑÐ½Ñ‹Ð¼Ð¸ Ð½Ð°Ð·Ð²Ð°Ð½Ð¸ÑÐ¼Ð¸
- 1 Ñ‚Ð°Ð± ÑƒÐ´Ð°Ð»Ñ‘Ð½ (AiModulesTab â€” Zone 9 cleanup, documented)
- Appearance tab â€” theme switching
- Prompts tab â€” editable system prompts

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:**
- Advanced Ð¸ Prompts â€” Ñ‚Ñ€ÐµÐ±ÑƒÑŽÑ‚ expertise, Ð½ÐµÑ‚ tooltips
- ÐÐµÑ‚ search Ð¿Ð¾ settings
- ÐÐµÑ‚ Â«restore defaultsÂ» ÐºÐ½Ð¾Ð¿ÐºÐ¸ (ÑÐ²Ð½Ð¾Ð¹)

### 4.7. Ð’Ð¾Ð¿Ñ€Ð¾Ñ 7: Ð£Ð´Ð¾Ð±Ð½Ñ‹Ð¹ Ð¿Ð¾Ð¸ÑÐº Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹?

**Search mechanisms:**

| Search | Ð“Ð´Ðµ | Ð§Ñ‚Ð¾ Ð¸Ñ‰ÐµÑ‚ | ÐšÐ°Ñ‡ÐµÑÑ‚Ð²Ð¾ |
|---|---|---|---|
| Sidebar search | Sidebar top | ÐŸÐ°Ð½ÐµÐ»Ð¸ Ð¿Ð¾ Ð¸Ð¼ÐµÐ½Ð¸ | ðŸŸ¢ Ñ„Ð¸Ð»ÑŒÑ‚Ñ€ÑƒÐµÑ‚, placeholder Â«âŒ˜KÂ» |
| CommandPalette (Cmd+K) | Global | ÐŸÐ°Ð½ÐµÐ»Ð¸ + actions + agents + topics | ðŸŸ¢ðŸŸ¢ fuzzy search, recent |
| MessageSearchPanel | In chat | Ð¡Ð¾Ð¾Ð±Ñ‰ÐµÐ½Ð¸Ñ | ðŸŸ¢ 663 ÑÑ‚Ñ€Ð¾ÐºÐ¸, rich |
| Wiki search | In WikiPanel | Wiki-ÑÑ‚Ð°Ñ‚ÑŒÐ¸ | ðŸŸ¢ ÐµÑÑ‚ÑŒ |
| Assistant | Chat assistant | Ð’Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸ Ñ‡ÐµÑ€ÐµÐ· catalog | ðŸŸ¢ catalog 4832 ÑÑ‚Ñ€Ð¾ÐºÐ¸, Ð½Ð¾ user Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚ |

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð°:** **Ð½ÐµÑ‚ global search Ð¿Ð¾ ÐºÐ¾Ð½Ñ‚ÐµÐ½Ñ‚Ñƒ** (ÑÐ¾Ð¾Ð±Ñ‰ÐµÐ½Ð¸Ñ + wiki + Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ + capabilities Ð¾Ð´Ð½Ð¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾). ÐšÐ°Ð¶Ð´Ñ‹Ð¹ search â€” Ð² ÑÐ²Ð¾Ñ‘Ð¼ ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ðµ.

---

## 5. ðŸ”´ ÐÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹Ðµ Ð¸Ð»Ð¸ ÑÐ»Ð°Ð±Ð¾Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹Ðµ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¸ â€” ÑÐ¿Ð¸ÑÐ¾Ðº

Ð­Ñ‚Ð¾ **Ð³Ð»Ð°Ð²Ð½Ñ‹Ð¹ deliverable** ÐºÐ°Ñ€Ñ‚Ñ‹: Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¸, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ðµ **ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÑŽÑ‚ Ð¸ Ñ€Ð°Ð±Ð¾Ñ‚Ð°ÑŽÑ‚**, Ð½Ð¾ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ **ÑÐºÐ¾Ñ€ÐµÐµ Ð²ÑÐµÐ³Ð¾ Ð½Ðµ Ð½Ð°Ð¹Ð´Ñ‘Ñ‚**.

### 5.1. ÐŸÐ°Ð½ÐµÐ»Ð¸ Ð±ÐµÐ· wiki-ÑÑ‚Ð°Ñ‚ÑŒÐ¸ (64 ÑˆÑ‚.) â€” Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð¿Ð¾Ð½ÑÑ‚ÑŒ Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ

**64 Ð¸Ð· 268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ (24%)** Ð½Ðµ Ð¸Ð¼ÐµÑŽÑ‚ wiki-ÑÑ‚Ð°Ñ‚ÑŒÐ¸ (`panels-catalog.md` ÐºÐ¾Ð»Ð¾Ð½ÐºÐ° Â«Ð¡Ñ‚Ð°Ñ‚ÑŒÑÂ» = `â€”`). ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð¼Ð¾Ð¶ÐµÑ‚ Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚ÑŒ Ð¿Ð°Ð½ÐµÐ»ÑŒ, Ð½Ð¾ **Ð½Ðµ Ð¿Ð¾Ð¹Ð¼Ñ‘Ñ‚**, Ñ‡Ñ‚Ð¾ Ð¾Ð½Ð° Ð´ÐµÐ»Ð°ÐµÑ‚ Ð¸ Ð·Ð°Ñ‡ÐµÐ¼.

**ÐŸÑ€Ð¸Ð¼ÐµÑ€Ñ‹ (Ð²Ñ‹Ð±Ð¾Ñ€ÐºÐ°):**

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð Ð°Ð·Ð´ÐµÐ» | Ð§Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ (Ð¿Ð¾ ÐºÐ¾Ð´Ñƒ) | ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð° |
|---|---|---|---|
| `ExceptionsPanel` | ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð’ÐµÑ‚Ð¾ (exceptions) | Ð½ÐµÑ‚ wiki |
| `MemoryCenterPanel` | ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð¥Ð°Ð± Ð¿Ð°Ð¼ÑÑ‚Ð¸ | Ð½ÐµÑ‚ wiki |
| `NavGraphPanel` | ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð“Ñ€Ð°Ñ„ Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸ | Ð½ÐµÑ‚ wiki |
| `DefectMapPanel` | ÐŸÐ°Ð½ÐµÐ»ÑŒ | ÐšÐ°Ñ€Ñ‚Ð° Ð´ÐµÑ„ÐµÐºÑ‚Ð¾Ð² | Ð½ÐµÑ‚ wiki |
| `cross-examination` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Cross-exam Ñ‚ÐµÑ…Ð½Ð¸ÐºÐ° | Ð½ÐµÑ‚ wiki |
| `delta-focusing` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Delta-focusing | Ð½ÐµÑ‚ wiki |
| `vulnerability-targeting` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Vuln targeting | Ð½ÐµÑ‚ wiki |
| `agreement-anchoring` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Agreement anchoring | Ð½ÐµÑ‚ wiki |
| `graph-minimax` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Graph minimax | Ð½ÐµÑ‚ wiki |
| `burden-of-proof` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Burden of proof | Ð½ÐµÑ‚ wiki |
| `consistency-check` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Consistency check | Ð½ÐµÑ‚ wiki |
| `credibility-scoring` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Credibility scoring | Ð½ÐµÑ‚ wiki |
| `causal-graph` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Causal graph | Ð½ÐµÑ‚ wiki |
| `pre-publish-critic` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Pre-publish critic | Ð½ÐµÑ‚ wiki |
| `fact-checking` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Fact checking | Ð½ÐµÑ‚ wiki |
| `epistemic-calibration` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Epistemic calibration | Ð½ÐµÑ‚ wiki |
| `socratic-pivot` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Socratic pivot | Ð½ÐµÑ‚ wiki |
| `concession-engine` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Concession engine | Ð½ÐµÑ‚ wiki |
| `bayesian-judges` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Bayesian judges | Ð½ÐµÑ‚ wiki |
| `dpo-sampler` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | DPO sampler | Ð½ÐµÑ‚ wiki |
| `critic` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Self-critic | Ð½ÐµÑ‚ wiki |
| `pivot` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Pivot strategy | Ð½ÐµÑ‚ wiki |
| `concession` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Strategic concession | Ð½ÐµÑ‚ wiki |
| `triangulation` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Triangulation | Ð½ÐµÑ‚ wiki |
| `empathy` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Empathy mirroring | Ð½ÐµÑ‚ wiki |
| `heat` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Heat detection | Ð½ÐµÑ‚ wiki |
| `sentinel` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Argument sentinel | Ð½ÐµÑ‚ wiki |
| `redundancy` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Redundancy detector | Ð½ÐµÑ‚ wiki |
| `replay` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Replay | Ð½ÐµÑ‚ wiki |
| `enthymeme` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Enthymeme | Ð½ÐµÑ‚ wiki |
| `multi-hop` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Multi-hop | Ð½ÐµÑ‚ wiki |
| `bias-exploit` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Bias exploit | Ð½ÐµÑ‚ wiki |
| `interrupt` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Interrupt | Ð½ÐµÑ‚ wiki |
| `frame` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Frame | Ð½ÐµÑ‚ wiki |
| `rhetorical-device` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Rhetorical device | Ð½ÐµÑ‚ wiki |
| `narrative-arc` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Narrative arc | Ð½ÐµÑ‚ wiki |
| `abstraction-ladder` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Abstraction ladder | Ð½ÐµÑ‚ wiki |
| `role-reversal` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Role reversal | Ð½ÐµÑ‚ wiki |
| `fog-of-war` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Fog of war | Ð½ÐµÑ‚ wiki |
| `evidence-revelation` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Evidence revelation | Ð½ÐµÑ‚ wiki |
| `humor` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Humor | Ð½ÐµÑ‚ wiki |
| `status-dynamics` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Status dynamics | Ð½ÐµÑ‚ wiki |
| `style-matching` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Style matching | Ð½ÐµÑ‚ wiki |
| `dynamic-persona` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Dynamic persona | Ð½ÐµÑ‚ wiki |
| `strategist` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Strategist | Ð½ÐµÑ‚ wiki |
| `whisper-channels` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Whisper channels | Ð½ÐµÑ‚ wiki |
| `alliance` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Alliance | Ð½ÐµÑ‚ wiki |
| `prediction-market` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Prediction market | Ð½ÐµÑ‚ wiki |
| `rtom` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | RTOM | Ð½ÐµÑ‚ wiki |
| `strategy-fingerprint` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Strategy fingerprint | Ð½ÐµÑ‚ wiki |
| `objection-anticipation` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Objection anticipation | Ð½ÐµÑ‚ wiki |
| `evidence-triangulation` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Evidence triangulation | Ð½ÐµÑ‚ wiki |
| `hegelian-synthesis` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Hegelian synthesis | Ð½ÐµÑ‚ wiki |
| `uncertainty-propagation` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Uncertainty propagation | Ð½ÐµÑ‚ wiki |
| `rhetoric-safety` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Rhetoric safety | Ð½ÐµÑ‚ wiki |
| `blind-evaluation` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Blind evaluation | Ð½ÐµÑ‚ wiki |
| `bidding-time` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Bidding time | Ð½ÐµÑ‚ wiki |
| `adaptive-order` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Adaptive order | Ð½ÐµÑ‚ wiki |
| `executable-evidence` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Executable evidence | Ð½ÐµÑ‚ wiki |
| `hidden-incentives` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Hidden incentives | Ð½ÐµÑ‚ wiki |
| `semantic-blending` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Semantic blending | Ð½ÐµÑ‚ wiki |
| `judge-deliberation` | Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸ | Judge deliberation | Ð½ÐµÑ‚ wiki |

**Ð˜Ñ‚Ð¾Ð³Ð¾: 58 Ð¸Ð· 62 technique-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð±ÐµÐ· wiki** + 6 Ð´Ñ€ÑƒÐ³Ð¸Ñ… Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ = **64 Ð±ÐµÐ· wiki**.

### 5.2. Killer-Ñ„Ð¸Ñ‡Ð¸ Ñ ÑÐ»Ð°Ð±Ñ‹Ð¼ discovery

| Ð¤Ð¸Ñ‡Ð° | Ð¦ÐµÐ½Ð½Ð¾ÑÑ‚ÑŒ (Ð¸Ð· Feature Value Map) | Discovery Ð¿ÑƒÑ‚ÐµÐ¹ | ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð° |
|---|---|---|---|
| **Crystal Vault** â­ | 9/10, ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð° | 2 (Sidebar, Cmd+K) | ÐÐµ Ð² Onboarding, Ð½Ðµ Ð² NextAction, Ð½ÐµÑ‚ tutorial |
| **Synthesis zones** â­ | 9/10, ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð° | 2 (Sidebar, Cmd+K) | ÐÐµ Ð² Onboarding, Ð½Ðµ Ð² NextAction |
| **Cognitive Builder** â­ | 9/10, ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð° | 3 (Sidebar, Cmd+K, NextAction newWorkflow) | ÐÐµ Ð² Onboarding |
| **Time Machine** â­ | 8/10, ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð° | 2 (Sidebar, Ctrl+Shift+S) | Snapshot shortcut = only entry, Ð½Ðµ Ð¾Ñ‡ÐµÐ²Ð¸Ð´ÐµÐ½ |
| **Cognitive Lenses** | 7.5/10, ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð° | 2 (Sidebar, Cmd+K) | ÐÐµ Ð² Onboarding |
| **Federated Memory** (experimental) | 4/10 | 2 | Experimental, Ð½Ð¾ Ð±ÐµÐ· badge Ð² UI |
| **Aquarium** (experimental) | 3/10 | 2 | Experimental, decorative, Ð±ÐµÐ· badge |
| **Assistant catalog** (4832 ÑÑ‚Ñ€Ð¾ÐºÐ¸!) | 7/10 | 1 (Ñ‚Ð¾Ð»ÑŒÐºÐ¾ chat) | ÐŸÐ¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚, Ñ‡Ñ‚Ð¾ assistant ÑƒÐ¼ÐµÐµÑ‚ |
| **DirectorPanel** | 6/10, ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð° | 2 (Sidebar, Cmd+K newScenario) | ÐÐµ Ð² Onboarding |
| **ForumPanel** | 6/10, ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð° | 2 (Sidebar, Cmd+K openForum) | ÐÐµ Ð² Onboarding |
| **33 ÑÑ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ð¸ Ð´ÐµÐ±Ð°Ñ‚Ð¾Ð²** | 9/10, ÑƒÐ½Ð¸ÐºÐ°Ð»ÑŒÐ½Ð° | 1 (Ð² DebateArena) | ÐÐµ catalog Ð² UI, Ð½ÑƒÐ¶Ð½Ð¾ Ð¾Ñ‚ÐºÑ€Ñ‹Ð²Ð°Ñ‚ÑŒ ÐºÐ°Ð¶Ð´ÑƒÑŽ |
| **75 Ñ‚ÐµÑ…Ð½Ð¸Ðº ÐºÐ°Ñ‡ÐµÑÑ‚Ð²Ð°** | 6/10 | 62 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚Ð° | **Ð£Ð¶Ð°ÑÐ½Ñ‹Ð¹ discovery** â€” 62 uniform Ð¿Ð°Ð½ÐµÐ»Ð¸ |
| **Memory Watchdog** | utility | 0 Ð² UI | Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ… |
| **eventBus.getSubscriptionStats()** | utility | 0 Ð² UI | Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ð² ÐºÐ¾Ð´Ðµ |
| **Bootstrap phase** | utility | 0 Ð² UI | Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ð² Ð»Ð¾Ð³Ð°Ñ… |
| **Circuit-breaker decorators** | utility | 0 Ð² UI | Ð¢Ð¾Ð»ÑŒÐºÐ¾ Ð² ÐºÐ¾Ð´Ðµ |

### 5.3. ÐŸÐ°Ð½ÐµÐ»Ð¸, ÐºÐ¾Ñ‚Ð¾Ñ€Ñ‹Ðµ Ñ€Ð°Ð·Ð¾Ñ‡Ð°Ñ€ÑƒÑŽÑ‚ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»Ñ (stub/duplicate)

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð§Ñ‚Ð¾ ÑƒÐ²Ð¸Ð´Ð¸Ñ‚ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ | Verdict |
|---|---:|---|---|
| `OpenRouterPanel` | 29 | Ð”ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚ ProviderManager | ðŸ”´ DELETE |
| `SocialLeaderboardPanel` | 34 | ÐžÐ±Ñ‘Ñ€Ñ‚ÐºÐ° Ð½Ð°Ð´ EloLeaderboard Ð¸Ð· AgentsPanel | ðŸ”´ DELETE |
| `GovernancePanel` | 61 | RBAC stub (4 Ñ€Ð¾Ð»Ð¸, Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ) | ðŸ”´ EXPAND or HIDE |
| `LearnHubPanel` | 67 | Ð¢Ð°Ð±Ñ‹ Ð½Ð°Ð´ 4 Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ñ‹Ð¼Ð¸ Ð¿Ð°Ð½ÐµÐ»ÑÐ¼Ð¸ | ðŸŸ¡ DELETE ÐµÑÐ»Ð¸ Ð´ÐµÑ‚Ð¸ Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸ |
| `ArchitectureMapPanel` | 85 | ÐšÐ¾Ñ€Ð¾Ñ‚ÐºÐ°Ñ Ð²Ð¸Ð·ÑƒÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ | ðŸŸ¡ expand or hide |
| `RivalsCatalogPanel` | 85 | ÐšÐ°Ñ‚Ð°Ð»Ð¾Ð³ Ð²Ð°Ñ€Ð¸Ð°Ð½Ñ‚Ð¾Ð² | ðŸŸ¡ expand or hide |
| `AgentMarketplacePanel` | 102 | ÐœÐ¸Ð½Ð¸Ð¼Ð°Ð»ÑŒÐ½Ñ‹Ð¹ UI | ðŸŸ¡ expand or hide |

### 5.4. Ð­ÐºÑÐ¿ÐµÑ€Ð¸Ð¼ÐµÐ½Ñ‚Ð°Ð»ÑŒÐ½Ñ‹Ðµ Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð±ÐµÐ· ÑÐ²Ð½Ð¾Ð³Ð¾ badge

| ÐŸÐ°Ð½ÐµÐ»ÑŒ | Ð¡Ñ‚Ð°Ñ‚ÑƒÑ Ð² ÐºÐ¾Ð´Ðµ | Badge Ð² UI? |
|---|---|---|
| `AquariumPanel` | Â«Cognitive-aux / research panel (Experimental)Â» | ðŸ”´ ÐÐ•Ð¢ badge |
| `FederatedMemoryPanel` | Â«Experimental, research-gradeÂ» | ðŸ”´ ÐÐ•Ð¢ badge |
| `ExperimentalPanel` | ÐÐ°Ð·Ð²Ð°Ð½Ð¸Ðµ Ð½Ð°Ð¼ÐµÐºÐ°ÐµÑ‚ | ðŸŸ¡ unclear |

**Ð’ ÐºÐ¾Ð´Ðµ** ÐµÑÑ‚ÑŒ `DemoGate` + `DemoBadge` + `featureFlags.mockServices.enabled` â€” Ð½Ð¾ Ð¾Ð½Ð¸ Ð½Ðµ Ð¿Ñ€Ð¸Ð¼ÐµÐ½ÑÑŽÑ‚ÑÑ Ðº Aquarium/FederatedMemory.

### 5.5. Settings Ð±ÐµÐ· tooltips / search

| Tab | Ð§Ñ‚Ð¾ Ð½ÐµÐ¿Ð¾Ð½ÑÑ‚Ð½Ð¾ |
|---|---|
| Advanced | Ð‘ÐµÐ· Ð¾Ð±ÑŠÑÑÐ½ÐµÐ½Ð¸Ð¹ advanced-Ð¾Ð¿Ñ†Ð¸Ð¹ |
| Prompts | System prompts Ð±ÐµÐ· examples |
| (Ð²ÑÐµ) | ÐÐµÑ‚ search Ð¿Ð¾ settings |
| (Ð²ÑÐµ) | ÐÐµÑ‚ Â«restore defaultsÂ» ÑÐ²Ð½Ð¾ |

### 5.6. Ð¡ÐºÑ€Ñ‹Ñ‚Ñ‹Ðµé”®ç›˜ shortcuts

12 shortcuts Ð² KeyboardShortcutsModal, Ð½Ð¾ **Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð½Ð°Ð¶Ð°Ñ‚ÑŒ `?` Ñ‡Ñ‚Ð¾Ð±Ñ‹ ÑƒÐ·Ð½Ð°Ñ‚ÑŒ Ð¾ Ð½Ð¸Ñ…**. Ð•ÑÐ»Ð¸ Ð½Ðµ Ð½Ð°Ð¶Ð¼Ñ‘Ñ‚ â€” Ð½Ðµ ÑƒÐ·Ð½Ð°ÐµÑ‚.

### 5.7. Assistant capabilities â€” Ð½ÐµÐ²Ð¸Ð´Ð¸Ð¼Ñ‹Ð¹ catalog

`panel-actions-catalog.ts` (4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸) Ð¾Ð¿Ð¸ÑÑ‹Ð²Ð°ÐµÑ‚ Ð²ÑÐµ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸ assistant. **ÐÐ¾:**
- ÐÐµÑ‚ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñ‹ Â«what can you do?Â» Ð² ÑÐ²Ð½Ð¾Ð¼ Ð²Ð¸Ð´Ðµ
- ÐÐµÑ‚ onboarding-ÑˆÐ°Ð³Ð° Â«Assistant Ð¼Ð¾Ð¶ÐµÑ‚: â€¦Â»
- ÐÐµÑ‚ autocomplete Ð¿Ð¾Ð´ÑÐºÐ°Ð·Ð¾Ðº Ð¿Ñ€Ð¸ Ð²Ð²Ð¾Ð´Ðµ
- ÐÐµÑ‚ `palette.action.askAssistant` Ð² CommandPalette

---

## 6. Ð¡Ð²Ð¾Ð´Ð½Ð°Ñ Ð¼Ð°Ñ‚Ñ€Ð¸Ñ†Ð° Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾ÑÑ‚Ð¸ Ð¿Ð¾ Ñ€Ð°Ð·Ð´ÐµÐ»Ð°Ð¼

| Ð Ð°Ð·Ð´ÐµÐ» | ÐŸÐ°Ð½ÐµÐ»ÐµÐ¹ | Ð¡ wiki | Ð‘ÐµÐ· wiki | Discovery quality |
|---|---:|---:|---:|---|
| ÐŸÐ°Ð½ÐµÐ»ÑŒ (Dashboard) | ~21 | 18 | 3 | ðŸŸ¢ good |
| Ð‘ÑŽÐ´Ð¶ÐµÑ‚ AI | 8 | 8 | 0 | ðŸŸ¢ good (Ð½Ð¾ 5 Ð´ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ñ… UI) |
| Ð§Ð°Ñ‚ | 4 | 4 | 0 | ðŸŸ¢ðŸŸ¢ excellent |
| Ð”ÐµÐ±Ð°Ñ‚Ñ‹ | 14 | 14 | 0 | ðŸŸ¢ good |
| Ð¡Ñ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ñ Ð¸ Ð°Ð½Ð°Ð»Ð¸Ð· | 5 | 5 | 0 | ðŸŸ¢ good |
| **Ð¢ÐµÑ…Ð½Ð¸ÐºÐ¸** | **62** | **4** | **58** | ðŸ”´ **POOR** â€” 58 Ð±ÐµÐ· wiki, uniform |
| ÐÐ³ÐµÐ½Ñ‚Ñ‹ | 12 | 12 | 0 | ðŸŸ¢ good |
| Ð”Ð¸Ð°Ð³Ð½Ð¾ÑÑ‚Ð¸ÐºÐ° | 17 | 14 | 3 | ðŸŸ¢ good |
| Ð—Ð½Ð°Ð½Ð¸Ñ | ~5 | 5 | 0 | ðŸŸ¢ good |
| Ð¡Ð¸ÑÑ‚ÐµÐ¼Ð½Ð°Ñ Ð¿Ð°Ð¼ÑÑ‚ÑŒ | ~6 | 4 | 2 | ðŸŸ¡ |
| Ð˜Ð½Ñ‚ÐµÐ³Ñ€Ð°Ñ†Ð¸Ð¸ | ~10 | 8 | 2 | ðŸŸ¢ good |
| AI Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ñ‹ Ð¸ ÐºÐ»ÑŽÑ‡Ð¸ | ~6 | 6 | 0 | ðŸŸ¢ good (Ð½Ð¾ 4 UI overlap) |
| Ð‘ÐµÐ·Ð¾Ð¿Ð°ÑÐ½Ð¾ÑÑ‚ÑŒ Ð¸ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ð° | ~8 | 6 | 2 | ðŸŸ¡ |
| Ð¤Ð»Ð¾Ñ‚ / Governance | ~8 | 4 | 4 | ðŸŸ¡ Governance = stub |
| Ð›Ð°Ð±Ð¾Ñ€Ð°Ñ‚Ð¾Ñ€Ð¸Ñ | ~6 | 3 | 3 | ðŸŸ¡ experimental Ð±ÐµÐ· badge |
| Ð˜ÑÑÐ»ÐµÐ´Ð¾Ð²Ð°Ð½Ð¸Ñ | ~6 | 4 | 2 | ðŸŸ¡ |
| Google AI | ~4 | 3 | 1 | ðŸŸ¡ |
| Ð’Ð¸ÐºÐ¸ | ~3 | 3 | 0 | ðŸŸ¢ good |
| ÐÐ°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ | ~4 | 2 | 2 | ðŸŸ¡ |
| ÐžÑÑ‚Ð°Ð»ÑŒÐ½Ð¾Ðµ / Ð¡Ð¸ÑÑ‚ÐµÐ¼Ð½Ñ‹Ðµ ÑÐµÑ€Ð²Ð¸ÑÑ‹ | ~15 | 5 | 10 | ðŸ”´ **POOR** â€” catch-all, 10 Ð±ÐµÐ· wiki |

---

## 7. Click-depth audit Ð´Ð»Ñ killer-Ñ„Ð¸Ñ‡

| Killer-Ñ„Ð¸Ñ‡Ð° | ÐœÐ¸Ð½Ð¸Ð¼ÑƒÐ¼ clicks | Typial path | Onboarding mention? |
|---|---:|---|---|
| Chat | 1 (Sidebar/ChatDock) | Sidebar â†’ chat | âœ… implicit |
| Providers | 2 (Sidebar, Onboarding) | Onboarding step 2 | âœ… explicit |
| Debate | 2 (Sidebar, Ctrl+Shift+D) | Sidebar â†’ debate | âŒ not in onboarding |
| Crystal Vault â­ | 2 (Sidebar, Cmd+K) | Sidebar â†’ ÐŸÐ°Ð½ÐµÐ»ÑŒ â†’ crystals | âŒ not in onboarding |
| Synthesis â­ | 2 (Sidebar, Cmd+K) | Sidebar â†’ ÐŸÐ°Ð½ÐµÐ»ÑŒ â†’ synthesis | âŒ |
| Builder â­ | 2 (Sidebar, Cmd+K newWorkflow) | Sidebar â†’ ÐŸÐ°Ð½ÐµÐ»ÑŒ â†’ builder | âŒ |
| Time Machine â­ | 2 (Sidebar, Ctrl+Shift+S) | Sidebar â†’ time-machine | âŒ |
| Lenses | 2 (Sidebar, Cmd+K) | Sidebar â†’ lenses | âŒ |
| Memory | 2 (Sidebar, Cmd+K) | Sidebar â†’ memory | âŒ |
| Agents | 2 (Sidebar, Cmd+K) | Sidebar â†’ agents | âŒ |
| Knowledge (RAG) | 2 (Sidebar, Cmd+K) | Sidebar â†’ knowledge | âŒ |
| Settings | 2 (Sidebar, Ctrl+,) | Sidebar â†’ settings | âŒ |

**Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚:** OnboardingWizard Ð·Ð½Ð°ÐºÐ¾Ð¼Ð¸Ñ‚ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ **Chat + Providers**. **9 Ð¸Ð· 11 killer-Ñ„Ð¸Ñ‡ÐµÐ¹ Ð½Ðµ ÑƒÐ¿Ð¾Ð¼ÑÐ½ÑƒÑ‚Ñ‹ Ð² Onboarding.**

---

## 8. Assistant ÐºÐ°Ðº discovery-tool â€” Ð½ÐµÐ²Ð¾ÑÑ‚Ñ€ÐµÐ±Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹ Ð¿Ð¾Ñ‚ÐµÐ½Ñ†Ð¸Ð°Ð»

### 8.1. Catalog Ñ€Ð°Ð·Ð¼ÐµÑ€

`src/components/Assistant/panel-actions-catalog.ts` â€” **4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸**. ÐŸÐ¾ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ ~25 ÑÐµÑ€Ð²Ð¸ÑÐ¾Ð²:
- agentJournalService, agentPermissionService, agentService, capabilityTrustService
- debateService, diagnosticService, keyService, mcpService
- memoryOrchestrator, memoryService, monitoringService, policyService
- projectKnowledgeService, providerTracker, roleService, sessionManager
- settingsService, skillService, systemStatusService, workspaceService
- agemsApprovalService, agemsTaskService

### 8.2. Ð’Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚Ð¸ assistant (Ð¿Ð¾ ÐºÐ¾Ð´Ñƒ)

- **Voice** (use-speech.ts) â€” Ð³Ð¾Ð»Ð¾ÑÐ¾Ð²Ð¾Ð¹ Ð²Ð²Ð¾Ð´/Ð²Ñ‹Ð²Ð¾Ð´
- **Action chips** â€” ÐºÐ½Ð¾Ð¿ÐºÐ¸ Ð±Ñ‹ÑÑ‚Ñ€Ñ‹Ñ… Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ð¹
- **Navigation** â€” assistantNavigationService Ð´Ð»Ñ Ð¿ÐµÑ€ÐµÑ…Ð¾Ð´Ð¾Ð²
- **Trust tracking** â€” capabilityTrustService Ð´Ð»Ñ Ð¿Ñ€Ð°Ð² Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð°
- **Lens guidance** â€” buildLensGuidance Ð´Ð»Ñ ÑÐ¾Ð²ÐµÑ‚Ð¾Ð²
- **Exception veto** â€” buildExceptionVeto Ð´Ð»Ñ safety

### 8.3. ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿ÐµÐ½

| ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð° | Ð“Ð´Ðµ | Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ |
|---|---|---|
| ÐÐµÑ‚ ÐºÐ¾Ð¼Ð°Ð½Ð´Ñ‹ Â«what can you do?Â» | Assistant UI | Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ help command |
| ÐÐµÑ‚ onboarding-ÑˆÐ°Ð³Ð° Â«Assistant capabilitiesÂ» | OnboardingWizard | Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ ÑˆÐ°Ð³ 4: Assistant tour |
| ÐÐµÑ‚ autocomplete Ð¿Ñ€Ð¸ Ð²Ð²Ð¾Ð´Ðµ | Assistant input | Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ suggestions |
| ÐÐµÑ‚ `palette.action.askAssistant` | CommandPalette | Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ action |
| ÐÐµÑ‚ `palette.action.discoverCapabilities` | CommandPalette | Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ action |

---

## 9. Recommendations

### ðŸ”´ P0 â€” ÐºÑ€Ð¸Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¾Ðµ (Ð·Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ discovery gap)

1. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ wiki-ÑÑ‚Ð°Ñ‚ÑŒÐ¸ Ð´Ð»Ñ 64 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ð±ÐµÐ· Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð°Ñ†Ð¸Ð¸**. ÐžÑÐ¾Ð±ÐµÐ½Ð½Ð¾ Ð´Ð»Ñ 58 technique-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ â€” ÑÑ‚Ð¾ **90% Ð²ÑÐµÑ… Ð±ÐµÐ·-wiki Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹**. Ð¨Ð°Ð±Ð»Ð¾Ð½: 1 Ð¾Ð±Ñ‰Ð°Ñ ÑÑ‚Ð°Ñ‚ÑŒÑ `panel-techniques-catalog.md` Ñ Ñ‚Ð°Ð±Ð»Ð¸Ñ†ÐµÐ¹ Ð²ÑÐµÑ… 75 Ñ‚ÐµÑ…Ð½Ð¸Ðº + ÑÑÑ‹Ð»ÐºÐ¸.

2. **ÐžÐ±ÑŠÐµÐ´Ð¸Ð½Ð¸Ñ‚ÑŒ 62 TechniquePanels Ð² 1 `TechniquesCatalog`** Ñ Ñ‚Ð°Ð±Ð»Ð¸Ñ†ÐµÐ¹ (Ð¸Ð¼Ñ | ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ | toggle | impact). Ð¡ÑÐºÐ¾Ð½Ð¾Ð¼Ð¸Ñ‚ 61 Ð¼Ð°Ñ€ÑˆÑ€ÑƒÑ‚ + Ð´Ð°ÑÑ‚ ÐµÐ´Ð¸Ð½Ñ‹Ð¹ discovery-point. (ÑÐ¼. Duplication Map Â§3.7)

3. **Ð Ð°ÑÑˆÐ¸Ñ€Ð¸Ñ‚ÑŒ OnboardingWizard Ñ 3 Ð´Ð¾ 6 ÑˆÐ°Ð³Ð¾Ð²**: Welcome â†’ AddKey â†’ **Crystal Vault tour** â†’ **Synthesis demo** â†’ **Builder overview** â†’ Done. Ð¡ÐµÐ¹Ñ‡Ð°Ñ onboarding Ð·Ð½Ð°ÐºÐ¾Ð¼Ð¸Ñ‚ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ñ Chat+Providers, Ð½Ðµ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°Ñ killer-Ñ„Ð¸Ñ‡Ð¸.

4. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ experimental badge Ð² UI** Ð´Ð»Ñ Aquarium Ð¸ FederatedMemory. Ð’ ÐºÐ¾Ð´Ðµ Ð¿Ð¾Ð¼ÐµÑ‡ÐµÐ½Ñ‹ Â«ExperimentalÂ», Ð² UI â€” Ð½ÐµÑ‚. Ð˜ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÑŒ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÑŽÑ‰Ð¸Ð¹ `DemoBadge` ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚.

5. **Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ 3 stub-Ð¿Ð°Ð½ÐµÐ»Ð¸** Ð¸Ð· main nav: `OpenRouterPanel` (29 ÑÑ‚Ñ€Ð¾Ðº Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚), `SocialLeaderboardPanel` (34 ÑÑ‚Ñ€Ð¾ÐºÐ¸ Ð¾Ð±Ñ‘Ñ€Ñ‚ÐºÐ°), `GovernancePanel` (61 ÑÑ‚Ñ€Ð¾ÐºÐ° stub â€” Ð»Ð¸Ð±Ð¾ Ñ€Ð°ÑÑˆÐ¸Ñ€Ð¸Ñ‚ÑŒ, Ð»Ð¸Ð±Ð¾ ÑÐºÑ€Ñ‹Ñ‚ÑŒ).

### ðŸŸ¡ P1 â€” Ð²Ð°Ð¶Ð½Ð¾Ðµ (Ð² ÐºÐ²Ð°Ñ€Ñ‚Ð°Ð»)

6. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Â«discover capabilitiesÂ» action Ð² CommandPalette** â€” Ð¾Ñ‚ÐºÑ€Ñ‹Ñ‚ÑŒ Assistant Ñ Ð¿Ñ€ÐµÐ´Ð·Ð°Ð¿Ð¾Ð»Ð½ÐµÐ½Ð½Ñ‹Ð¼ Â«what can you do?Â».

7. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ search Ð¿Ð¾ settings** â€” ÑÐµÐ¹Ñ‡Ð°Ñ 8 Ñ‚Ð°Ð±Ð¾Ð² Ð±ÐµÐ· search, Ð½Ð°Ð¹Ñ‚Ð¸ ÐºÐ¾Ð½ÐºÑ€ÐµÑ‚Ð½ÑƒÑŽ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÑƒ Ñ‚Ñ€ÑƒÐ´Ð½Ð¾.

8. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Â«restore defaultsÂ» ÐºÐ½Ð¾Ð¿ÐºÑƒ Ð² Settings** â€” ÑÐ²Ð½Ð¾.

9. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ tooltips Ðº Advanced Ð¸ Prompts Ñ‚Ð°Ð±Ð°Ð¼** â€” Ð¾Ð±ÑŠÑÑÐ½Ð¸Ñ‚ÑŒ, Ñ‡Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÑŽÑ‚ advanced-Ð¾Ð¿Ñ†Ð¸Ð¸.

10. **Ð Ð°ÑÑˆÐ¸Ñ€Ð¸Ñ‚ÑŒ NextActionPredictions Ñ 3 Ð´Ð¾ 5+ predictions per route** â€” Ð¿Ð¾ÐºÑ€Ñ‹Ñ‚ÑŒ Ð±Ð¾Ð»ÑŒÑˆÐµ ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ð¾Ð².

11. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ `palette.action.startCrystal`, `palette.action.startSynthesis`, `palette.action.openBuilder`** â€” quick actions Ð´Ð»Ñ killer-Ñ„Ð¸Ñ‡ÐµÐ¹ Ð² CommandPalette.

12. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ tutorial / tour mode** â€” Ð¿Ð¾ÑˆÐ°Ð³Ð¾Ð²Ð¾Ðµ Ð²Ð²ÐµÐ´ÐµÐ½Ð¸Ðµ Ð¿Ð¾ killer-Ñ„Ð¸Ñ‡Ð°Ð¼ (Crystal â†’ Synthesis â†’ Builder â†’ Debate).

### ðŸŸ¢ P2 â€” ÑÑ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ

13. **Global search** â€” ÐµÐ´Ð¸Ð½Ñ‹Ð¹ search Ð¿Ð¾ ÑÐ¾Ð¾Ð±Ñ‰ÐµÐ½Ð¸ÑÐ¼ + wiki + settings + capabilities (ÐºÐ°Ðº Spotlight).

14. **Capability dashboard** â€” Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ð°Ñ Ð¿Ð°Ð½ÐµÐ»ÑŒ Â«What can this OS do?Â» Ñ ÐºÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð¼ Ð²ÑÐµÑ… Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹, Ñ„Ð¸Ð»ÑŒÑ‚Ñ€Ð°Ð¼Ð¸ Ð¿Ð¾ ÐºÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸, search. Ð¡ÐµÐ¹Ñ‡Ð°Ñ assistant catalog (4832 ÑÑ‚Ñ€Ð¾ÐºÐ¸) ÑÐºÑ€Ñ‹Ñ‚ Ð² ÐºÐ¾Ð´Ðµ.

15. **Context-aware suggestions Ð² Ð¿Ð°Ð½ÐµÐ»ÑÑ…** â€” ÐºÐ¾Ð³Ð´Ð° Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð² ChatPanel, Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ Â«Try Crystal Vault to save insightsÂ». ÐšÐ¾Ð³Ð´Ð° Ð² DebateArena â€” Â«Try Synthesis to concludeÂ».

16. **Keyboard shortcut discovery** â€” Ð½Ð° Ð¸ÐºÐ¾Ð½ÐºÐ°Ñ… Ð² Sidebar Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°Ñ‚ÑŒ tooltip Ñ shortcut (Ctrl+Shift+D Ð´Ð»Ñ Debate Ð¸ Ñ‚.Ð´.).

17. **Onboarding Ð´Ð»Ñ power-users** â€” Ð¾Ñ‚Ð´ÐµÐ»ÑŒÐ½Ñ‹Ð¹ Â«advanced tourÂ» Ð´Ð»Ñ Ñ‚ÐµÑ…, ÐºÑ‚Ð¾ Ñ…Ð¾Ñ‡ÐµÑ‚ Builder + Director + FederatedMemory.

---

## 10. Ð˜Ñ‚Ð¾Ð³Ð¾Ð²Ñ‹Ð¹ Ð²ÐµÑ€Ð´Ð¸ÐºÑ‚ Ð¿Ð¾ Ð´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ð¾ÑÑ‚Ð¸

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | ÐžÑ†ÐµÐ½ÐºÐ° | ÐšÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð°Ñ€Ð¸Ð¹ |
|---|:---:|---|
| Sidebar nav (primary) | ðŸŸ¢ 8/10 | 22 Ñ€Ð°Ð·Ð´ÐµÐ»Ð°, search, pinning, collapse |
| CommandPalette (Cmd+K) | ðŸŸ¢ 9/10 | fuzzy search, recent, 10 actions |
| NavGraphPanel (visual) | ðŸŸ¡ 6/10 | Ð¿ÐµÑ€ÐµÐ³Ñ€ÑƒÐ¶ÐµÐ½ 268 ÑƒÐ·Ð»Ð°Ð¼Ð¸ |
| Assistant catalog | ðŸŸ¡ 5/10 | catalog Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ñ‹Ð¹ (4832 ÑÑ‚Ñ€Ð¾ÐºÐ¸), Ð½Ð¾ user Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚ |
| NextActionPredictions | ðŸŸ¢ 8/10 | Ñ€ÐµÐ´ÐºÐ°Ñ Ð¸ Ñ†ÐµÐ½Ð½Ð°Ñ Ñ„ÑƒÐ½ÐºÑ†Ð¸Ñ |
| OnboardingWizard | ðŸŸ¡ 5/10 | 3 ÑˆÐ°Ð³Ð°, Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Chat+Providers |
| KeyboardShortcutsModal | ðŸŸ¢ 8/10 | 12 shortcuts, `?` to open |
| Wiki coverage | ðŸŸ¡ 6/10 | 204/268 (76%), 64 Ð±ÐµÐ· wiki |
| Settings clarity | ðŸŸ¡ 6/10 | 8 Ñ‚Ð°Ð±Ð¾Ð², Ð½ÐµÑ‚ search |
| Cross-linking (multi-context) | ðŸŸ¡ 6/10 | core = 3-4 ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ð°, killer = 2 |
| Stub panels Ð² nav | ðŸ”´ 3/10 | 3 stub-Ð¿Ð°Ð½ÐµÐ»Ð¸ Ñ€Ð°Ð·Ð¾Ñ‡Ð°Ñ€Ð¾Ð²Ñ‹Ð²Ð°ÑŽÑ‚ |
| Experimental panels Ð±ÐµÐ· badge | ðŸ”´ 4/10 | Aquarium, FederatedMemory Ð²Ð¸Ð´Ð½Ñ‹ |
| 62 TechniquePanels discovery | ðŸ”´ 3/10 | uniform, 58 Ð±ÐµÐ· wiki, Ñ‚Ð¾Ð½ÑƒÑ‚ |
| **Overall Accessibility Score** | **6.5/10** | Ð¼Ð½Ð¾Ð³Ð¾ Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð², Ð½Ð¾ discovery gap |

**Ð¡Ð¸Ð»ÑŒÐ½Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **5 ÑƒÑ€Ð¾Ð²Ð½ÐµÐ¹ discovery** (Sidebar + Cmd+K + NavGraph + Assistant + NextAction)
- **CommandPalette Ñ fuzzy search** â€” Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ñ‹Ð¹ secondary nav
- **Assistant catalog 4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸** â€” Ð»ÑƒÑ‡ÑˆÐ¸Ð¹ discovery-Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº (ÐµÑÐ»Ð¸ Ð±Ñ‹ user Ð·Ð½Ð°Ð»)
- **NextActionPredictions** â€” proactive, context-based
- **12 keyboard shortcuts** â€” Ð´Ð»Ñ power-users
- **Pinning + recent + QuickAccess** â€” personalised shortcuts
- **OnboardingWizard** â€” first-run guidance (Ñ…Ð¾Ñ‚ÑŒ Ð¸ Ð¼Ð¸Ð½Ð¸Ð¼Ð°Ð»ÑŒÐ½Ñ‹Ð¹)
- **i18n labels** â€” Ð²ÑÐµ nav items Ð»Ð¾ÐºÐ°Ð»Ð¸Ð·Ð¾Ð²Ð°Ð½Ñ‹

**Ð¡Ð»Ð°Ð±Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **64 Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð±ÐµÐ· wiki (24%)** â€” Ð½ÐµÐ²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ Ð¿Ð¾Ð½ÑÑ‚ÑŒ Ð½Ð°Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ
- **62 TechniquePanels** â€” uniform, Ñ‚Ð¾Ð½ÑƒÑ‚ Ð² Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸, 58 Ð±ÐµÐ· wiki
- **3 stub-Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð² main nav** â€” Ñ€Ð°Ð·Ð¾Ñ‡Ð°Ñ€Ð¾Ð²Ñ‹Ð²Ð°ÑŽÑ‚ (OpenRouter, SocialLeaderboard, Governance)
- **2 experimental Ð¿Ð°Ð½ÐµÐ»Ð¸ Ð±ÐµÐ· badge** â€” Aquarium, FederatedMemory
- **OnboardingWizard Ð¼Ð¸Ð½Ð¸Ð¼Ð°Ð»ÑŒÐ½Ñ‹Ð¹** â€” Ð½Ðµ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ killer-Ñ„Ð¸Ñ‡Ð¸ (Crystal, Synthesis, Builder)
- **Assistant catalog Ð½ÐµÐ²Ð¾ÑÑ‚Ñ€ÐµÐ±Ð¾Ð²Ð°Ð½** â€” user Ð½Ðµ Ð·Ð½Ð°ÐµÑ‚, Ñ‡Ñ‚Ð¾ assistant ÑƒÐ¼ÐµÐµÑ‚
- **ÐÐµÑ‚ global search** â€” ÐºÐ°Ð¶Ð´Ñ‹Ð¹ search Ð² ÑÐ²Ð¾Ñ‘Ð¼ ÐºÐ¾Ð½Ñ‚ÐµÐºÑÑ‚Ðµ
- **Settings Ð±ÐµÐ· search Ð¸ tooltips** Ð´Ð»Ñ Advanced/Prompts
- **22 Ñ€Ð°Ð·Ð´ÐµÐ»Ð°** â€” cognitive overload

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ð²Ñ‹Ð²Ð¾Ð´ (ÐºÐ°Ðº Ð¿Ñ€ÐµÐ´ÑÐºÐ°Ð·Ñ‹Ð²Ð°Ð»Ð¾ Ð·Ð°Ð´Ð°Ð½Ð¸Ðµ):** Â«ÐŸÐ°Ð½ÐµÐ»ÑŒ Ð¼Ð¾Ð¶ÐµÑ‚ Ð±Ñ‹Ñ‚ÑŒ Ð¿Ñ€ÐµÐºÑ€Ð°ÑÐ½Ð¾Ð¹, Ð½Ð¾ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑŒ Ð¼Ð¾Ð¶ÐµÑ‚ Ð´Ð°Ð¶Ðµ Ð½Ðµ Ð·Ð½Ð°Ñ‚ÑŒ Ð¾ ÐµÑ‘ ÑÑƒÑ‰ÐµÑÑ‚Ð²Ð¾Ð²Ð°Ð½Ð¸Ð¸Â» â€” ÑÑ‚Ð¾ **Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´ÐµÐ½Ð¾**. ÐÐ°Ð¹Ð´ÐµÐ½Ð¾ **28+ Ð½ÐµÐ´Ð¾ÑÑ‚ÑƒÐ¿Ð½Ñ‹Ñ… Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¹**, Ð²ÐºÐ»ÑŽÑ‡Ð°Ñ:
- **3 killer-Ñ„Ð¸Ñ‡Ð¸** (Crystal Vault, Synthesis, Builder) Ñ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 2 discovery-Ð¿ÑƒÑ‚ÑÐ¼Ð¸ Ð¸ Ð±ÐµÐ· onboarding
- **62 technique-Ð¿Ð°Ð½ÐµÐ»Ð¸** Ñ 58 Ð±ÐµÐ· wiki
- **Assistant catalog 4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸** â€” Ð½ÐµÐ²Ð¾ÑÑ‚Ñ€ÐµÐ±Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹
- **3 stub-Ð¿Ð°Ð½ÐµÐ»Ð¸** Ð² main nav
- **2 experimental Ð¿Ð°Ð½ÐµÐ»Ð¸** Ð±ÐµÐ· badge

**Accessibility Score: 6.5/10** â€” Ð¼Ð½Ð¾Ð³Ð¾ Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚Ð¾Ð² discovery, Ð½Ð¾ 268 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ + 64 Ð±ÐµÐ· wiki + Ð¿ÐµÑ€ÐµÐ³Ñ€ÑƒÐ¶ÐµÐ½Ð½Ð°Ñ Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ñ = user Ð½Ðµ Ð½Ð°Ð¹Ð´Ñ‘Ñ‚ Ð¿Ð¾Ð»Ð¾Ð²Ð¸Ð½Ñƒ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ÑÑ‚ÐµÐ¹. **Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ñ€Ñ‹Ñ‡Ð°Ð³ ÑƒÐ»ÑƒÑ‡ÑˆÐµÐ½Ð¸Ñ** â€” ÑÐ¾ÐºÑ€Ð°Ñ‚Ð¸Ñ‚ÑŒ Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸ÑŽ (Ð¾Ð±ÑŠÐµÐ´Ð¸Ð½Ð¸Ñ‚ÑŒ budget/health/provider/technique panels) + Ñ€Ð°ÑÑˆÐ¸Ñ€Ð¸Ñ‚ÑŒ onboarding (Ð¿Ð¾ÐºÐ°Ð·Ð°Ñ‚ÑŒ killer-Ñ„Ð¸Ñ‡Ð¸) + Ð½Ð°Ð¿Ð¸ÑÐ°Ñ‚ÑŒ wiki Ð´Ð»Ñ 64 Ð½ÐµÐ´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ñ… Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹.

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ A. Ð’ÑÐµ accessibility-Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ Ð² Ñ†Ð¸Ñ„Ñ€Ð°Ñ…

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº |
|---|---:|---|
| Total panels (routes) | 268 | `panels-catalog.md` |
| Nav sections | 22 | `route-registry-core.ts`, `-content.ts`, `-system.ts` |
| Panels with wiki article | 204 (76%) | `panels-catalog.md` |
| **Panels WITHOUT wiki** | **64 (24%)** | `panels-catalog.md` (column Â«Ð¡Ñ‚Ð°Ñ‚ÑŒÑÂ» = Â«â€”Â») |
| TechniquePanels without wiki | 58 of 62 | Ð¿Ð¾Ð´ÑÑ‡Ñ‘Ñ‚ |
| Discovery layers | 5 | Sidebar, Cmd+K, NavGraph, Assistant, NextAction |
| CommandPalette lines | 618 | `CommandPalette.tsx` |
| CommandPalette quick actions | 10 | `buildItems()` |
| CommandPalette recent items | 8 (max) | `MAX_RECENT` |
| OnboardingWizard steps | 3 | Welcome, AddConnection, Done |
| KeyboardShortcutsModal shortcuts | 12 | `SHORTCUTS` array |
| Sidebar lines | 16 KB (~480) | `Sidebar.tsx` |
| Sidebar features | search, pin, collapse, badges | Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| AssistantPanel lines | 379 | `AssistantPanel.tsx` |
| **Assistant catalog lines** | **4 832** | `panel-actions-catalog.ts` |
| NextActionPredictions lines | 231 | `NextActionPredictions.tsx` |
| NavGraphPanel lines | 84 | `NavGraphPanel.tsx` |
| SettingsPanel tabs | 8 | General, Writing, Reading, Alerts, Advanced, Notifications, Appearance, Prompts |
| Breadcrumbs | 94 lines | `Breadcrumbs.tsx` |
| ChatDock | 91 lines | `ChatDock.tsx` |
| BottomNav (mobile) | 75 lines | `BottomNav.tsx` |
| ModuleInfo | in-panel docs | `ModuleInfo.tsx` |
| QuickAccess | pinned + recent | `Sidebar/QuickAccess.tsx` |
| NavBadge | notifications | `Sidebar/NavBadge.tsx` |
| Stub panels Ð² main nav | 3 | OpenRouter (29), SocialLeaderboard (34), Governance (61) |
| Experimental panels Ð±ÐµÐ· badge | 2 | Aquarium, FederatedMemory |
| Killer-Ñ„Ð¸Ñ‡Ð¸ Ð² Onboarding | 0 of 6 | Crystal, Synthesis, Builder, TimeMachine, Lenses, Director |
| Global search | âŒ Ð½ÐµÑ‚ | â€” |
| Settings search | âŒ Ð½ÐµÑ‚ | â€” |

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ B. Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð¸ Ð¼ÐµÑ‚Ð¾Ð´

| Ð§Ñ‚Ð¾ | Ð“Ð´Ðµ | ÐšÐ°Ðº Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ |
|---|---|---|
| Sidebar | `src/components/Sidebar.tsx` (16 KB) | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| CommandPalette | `src/components/CommandPalette.tsx` (618) | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| OnboardingWizard | `src/components/OnboardingWizard/` (3 Ñ„Ð°Ð¹Ð»Ð°) | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| KeyboardShortcutsModal | `src/components/Common/KeyboardShortcutsModal.tsx` | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| Assistant | `src/components/Assistant/AssistantPanel.tsx` + `panel-actions-catalog.ts` | head + Ñ€Ð°Ð·Ð¼ÐµÑ€ |
| NextActionPredictions | `src/components/Layout/NextActionPredictions.tsx` | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| NavGraphPanel | `src/components/NavGraphPanel/NavGraphPanel.tsx` | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| Settings | `src/components/SettingsPanel/` (8 tabs) | ls + head |
| AppLayout | `src/components/AppLayout.tsx` | Ð¿Ð¾Ð»Ð½Ð¾Ðµ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| Wiki coverage | `docs/wiki/panels-catalog.md` | grep Â«â€”Â» Ð² column Â«Ð¡Ñ‚Ð°Ñ‚ÑŒÑÂ» |
| Routes count | `src/route-registry-*.ts` | grep `id:` |
| Breadcrumbs, ChatDock, BottomNav | `src/components/` | wc -l |
| ModuleInfo | `src/components/ModuleInfo.tsx` | head |

---

*ÐžÑ‚Ñ‡Ñ‘Ñ‚ ÑÐ³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð¾Ð²Ð°Ð½ 2026-10-31 Ð½Ð° Ð¾ÑÐ½Ð¾Ð²Ðµ ÐºÐ¾Ð¼Ð¼Ð¸Ñ‚Ð° `e08ab8e`. ÐÐ½Ð°Ð»Ð¸Ð· ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹; UX-testing Ñ Ñ€ÐµÐ°Ð»ÑŒÐ½Ñ‹Ð¼Ð¸ Ð¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÐµÐ»ÑÐ¼Ð¸ Ð½Ðµ Ð¿Ñ€Ð¾Ð²Ð¾Ð´Ð¸Ð»ÑÑ. ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð¾Ñ‚Ñ‡Ñ‘Ñ‚Ñ‹: Â«ÐšÐ°Ñ€Ñ‚Ð° Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ð¸ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð¹ Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ‚ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¾Ð³Ð¾ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸ÑÂ», Â«ÐšÐ°Ñ€Ñ‚Ð° Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ð½Ð¸Ñ Ñ€ÐµÑÑƒÑ€ÑÐ¾Ð²Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð³Ð¾ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸ÑÂ», Â«ÐšÐ°Ñ€Ñ‚Ð° Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÐµÐ¹Â», Â«ÐšÐ°Ñ€Ñ‚Ð° Ð¶Ð¸Ð·Ð½ÐµÐ½Ð½Ð¾Ð³Ð¾ Ñ†Ð¸ÐºÐ»Ð°Â».*
