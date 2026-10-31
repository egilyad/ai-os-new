# ÐšÐ°Ñ€Ñ‚Ð° Ñ‚ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¾Ð³Ð¾ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ñ â€” Technical Health Map
## SuperAgents OS (`egilyad/ai-os-new`)

> **Ð’ÐµÑ€ÑÐ¸Ñ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°:** commit `e08ab8e` (Oct 31, 2026, Ð²ÐµÑ‚ÐºÐ° `main`)
> **Ð”Ð°Ñ‚Ð° Ð°Ð½Ð°Ð»Ð¸Ð·Ð°:** 2026-10-31
> **ÐœÐµÑ‚Ð¾Ð´:** ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð· ÐºÐ¾Ð´Ð° + Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ `wc`/`grep`/`find` + Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ `package.json`, `CHANGELOG.md`, `.github/workflows/ci.yml`, `docs/wiki/zone-*.md` (26 zone audits), `docs/wiki/diagnostics.md`
> **ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ñ‹:** Â«ÐšÐ°Ñ€Ñ‚Ð° Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ð¸ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹Â» (ÐºÐ°Ñ‡ÐµÑÑ‚Ð²Ð¾ 1â€“10) + Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð¹ Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸Â» (Ð·Ð°Ñ‡ÐµÐ¼ Ð½ÑƒÐ¶Ð½Ð¾). Ð—Ð´ÐµÑÑŒ â€” **Ð·Ð´Ð¾Ñ€Ð¾Ð²ÑŒÐµ ÐºÐ¾Ð´Ð° Ð¸ Ñ€Ð¸ÑÐºÐ¸**.

---

## 1. Ð˜ÑÐ¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾Ðµ Ñ€ÐµÐ·ÑŽÐ¼Ðµ

SuperAgents OS â€” **ÐºÑ€ÑƒÐ¿Ð½Ð°Ñ ÐºÐ¾Ð´Ð¾Ð²Ð°Ñ Ð±Ð°Ð·Ð°**: ~509 K LOC TypeScript/TSX Ð² 3 114 Ñ„Ð°Ð¹Ð»Ð°Ñ…, Ñ ÑÐ´Ñ€Ð¾Ð¼ 239 K LOC (1 754 Ñ„Ð°Ð¹Ð»Ð°) Ð¸ UI-ÑÐ»Ð¾ÐµÐ¼ 229 K LOC (1 103 Ñ„Ð°Ð¹Ð»Ð°). 58 npm-Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÐµÐ¹, 48 ÑÐºÑ€Ð¸Ð¿Ñ‚Ð¾Ð², 26 zone-audits Ñ **199 Ð·Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¼Ð¸ Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸ÑÐ¼Ð¸** Ð¸ **101 Ð¾Ñ‚Ð»Ð¾Ð¶ÐµÐ½Ð½Ð¾Ð¹ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ð¾Ð¹**.

**Ð¡Ð²Ð¾Ð´Ð½Ñ‹Ðµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ Ð·Ð´Ð¾Ñ€Ð¾Ð²ÑŒÑ:**

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | ÐžÑ†ÐµÐ½ÐºÐ° |
|---|---:|:---:|
| ÐžÐ±ÑŠÑ‘Ð¼ ÐºÐ¾Ð´Ð° | 509 K LOC, 3 114 Ñ„Ð°Ð¹Ð»Ð¾Ð² | â€” |
| Ð¤Ð°Ð¹Ð»Ð¾Ð² > 500 ÑÑ‚Ñ€Ð¾Ðº (ÑÐ»Ð¾Ð¶Ð½Ð¾ÑÑ‚ÑŒ) | **169** | ðŸŸ¡ ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾ |
| Ð¤Ð°Ð¹Ð»Ð¾Ð² > 1000 ÑÑ‚Ñ€Ð¾Ðº | **18** | ðŸŸ¡ ÐµÑÑ‚ÑŒ Ñ‚ÑÐ¶Ñ‘Ð»Ñ‹Ðµ |
| Production deps | 25 | ðŸŸ¢ Ñ€Ð°Ð·ÑƒÐ¼Ð½Ð¾ |
| TODO/FIXME/HACK/XXX | **2 / 0 / 0 / 0** | ðŸŸ¢ðŸŸ¢ Ð¸ÑÐºÐ»ÑŽÑ‡Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾ Ñ‡Ð¸ÑÑ‚Ð¾ |
| `as any`/`as unknown` | 828 | ðŸŸ¡ ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾ |
| `eslint-disable` | 256 | ðŸŸ¡ ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾ |
| `@ts-ignore` / `@ts-expect-error` | **1** | ðŸŸ¢ðŸŸ¢ Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ð¾ |
| Explicit `throw new Error` | 992 | ðŸŸ¢ Ñ…Ð¾Ñ€Ð¾ÑˆÐ°Ñ Ð¾Ð±Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐ° |
| Ð¢ÐµÑÑ‚Ð¾Ð² Ð²ÑÐµÐ³Ð¾ | 514 (486 unit + 17 e2e + 8 server + 3 scripts) | ðŸŸ¡ ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾ |
| Ð—Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ñ… Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ð¹ | **199** | ðŸŸ¢ Ð·Ñ€ÐµÐ»Ð°Ñ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ |
| ÐžÑ‚Ð»Ð¾Ð¶ÐµÐ½Ð½Ñ‹Ñ… Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼ | **101** | ðŸŸ¡ Ñ‚ÐµÑ…Ð´Ð¾Ð»Ð³ |
| Ð˜Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ñ… Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼ (diagnostics.md) | **5 Ð³Ð»Ð¾Ð±Ð°Ð»ÑŒÐ½Ñ‹Ñ…** | ðŸŸ¡ |
| CI jobs | 5 (typecheck/lint/build/test/coverage/audit/e2e) | ðŸŸ¢ Ð·Ñ€ÐµÐ»Ñ‹Ð¹ |
| Lint warning baseline | **5600** max-warnings | ðŸ”´ Ð¾Ñ‡ÐµÐ½ÑŒ Ð²Ñ‹ÑÐ¾ÐºÐ¸Ð¹ |
| Security audit job | âœ… ÐµÑÑ‚ÑŒ | ðŸŸ¢ |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ð²Ñ‹Ð²Ð¾Ð´:** ÐºÐ¾Ð´Ð¾Ð²Ð°Ñ Ð±Ð°Ð·Ð° **Ð² Ñ…Ð¾Ñ€Ð¾ÑˆÐµÐ¼ ÑÐ°Ð½Ð¸Ñ‚Ð°Ñ€Ð½Ð¾Ð¼ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ð¸** Ð´Ð»Ñ ÑÐ²Ð¾ÐµÐ³Ð¾ Ð¾Ð±ÑŠÑ‘Ð¼Ð°. 2 TODO Ð½Ð° 509K LOC â€” ÑÑ‚Ð¾ **Ð±ÐµÑÐ¿Ñ€ÐµÑ†ÐµÐ´ÐµÐ½Ñ‚Ð½Ð¾ Ñ‡Ð¸ÑÑ‚Ð¾**. CI Ð·Ñ€ÐµÐ»Ñ‹Ð¹ (5 jobs + security audit). 199 Ð·Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ñ… Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ð¹ Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÑŽÑ‚ Ð°ÐºÑ‚Ð¸Ð²Ð½ÑƒÑŽ Ñ€Ð°Ð±Ð¾Ñ‚Ñƒ. **Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ Ñ€Ð¸ÑÐºÐ¸:** 5600-warning baseline, 828 type-escapes, API-ÐºÐ»ÑŽÑ‡Ð¸ Ð² plaintext, 101 Ð¾Ñ‚Ð»Ð¾Ð¶ÐµÐ½Ð½Ð°Ñ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ð°, 18 Ñ„Ð°Ð¹Ð»Ð¾Ð² > 1000 ÑÑ‚Ñ€Ð¾Ðº.

**Health score: 7.0 / 10** â€” Ð·Ñ€ÐµÐ»Ð¾, Ð½Ð¾ Ñ Ð¸Ð·Ð¼ÐµÑ€Ð¸Ð¼Ñ‹Ð¼ Ñ‚ÐµÑ…Ð´Ð¾Ð»Ð³Ð¾Ð¼.

---

## 2. ÐœÐµÑ‚Ð¾Ð´Ð¾Ð»Ð¾Ð³Ð¸Ñ: 8 ÐºÑ€Ð¸Ñ‚ÐµÑ€Ð¸ÐµÐ² + 3 ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ñ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼

### 2.1. Ð’Ð¾ÑÐµÐ¼ÑŒ ÐºÑ€Ð¸Ñ‚ÐµÑ€Ð¸ÐµÐ² Ð¾Ñ†ÐµÐ½ÐºÐ¸

| # | ÐšÑ€Ð¸Ñ‚ÐµÑ€Ð¸Ð¹ | Ð§Ñ‚Ð¾ Ð¸Ð·Ð¼ÐµÑ€ÑÐµÐ¼ | Ð“Ð´Ðµ Ð´Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾ |
|---|---|---|---|
| 1 | **ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ñ… Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼** | Ð¡ÐºÐ¾Ð»ÑŒÐºÐ¾ Ð·Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¾ | `docs/wiki/zone-*.md`, `diagnostics.md`, `dev-status-*.md` |
| 2 | **ÐšÑ€Ð¸Ñ‚Ð¸Ñ‡Ð½Ð¾ÑÑ‚ÑŒ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼** | P0/P1/P2 Ñ€Ð°ÑÐ¿Ñ€ÐµÐ´ÐµÐ»ÐµÐ½Ð¸Ðµ | `CHANGELOG.md`, zone audits |
| 3 | **Ð¢ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð´Ð¾Ð»Ð³** | ÐžÑ‚Ð»Ð¾Ð¶ÐµÐ½Ð½Ñ‹Ðµ issues + mock-ÑÐµÑ€Ð²Ð¸ÑÑ‹ + stub-Ð¿Ð°Ð½ÐµÐ»Ð¸ | zone audits Â«ÐžÑ‚Ð»Ð¾Ð¶ÐµÐ½Ð¾Â», `@deprecated MOCK` |
| 4 | **Ð¡Ð»Ð¾Ð¶Ð½Ð¾ÑÑ‚ÑŒ ÐºÐ¾Ð´Ð°** | Ð¤Ð°Ð¹Ð»Ñ‹ > 500/1000 ÑÑ‚Ñ€Ð¾Ðº, ÑÑ€ÐµÐ´Ð½Ð¸Ð¹ Ñ€Ð°Ð·Ð¼ÐµÑ€, Ñ†Ð¸ÐºÐ»Ð¾Ð¼Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ°Ñ ÑÐ»Ð¾Ð¶Ð½Ð¾ÑÑ‚ÑŒ | `wc -l`, hotspot-Ð°Ð½Ð°Ð»Ð¸Ð· |
| 5 | **ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÐµÐ¹** | Production + dev deps, Ñ‚Ñ€Ð°Ð½Ð·Ð¸Ñ‚Ð¸Ð²Ð½Ñ‹Ðµ | `package.json` |
| 6 | **ÐÐ°Ð»Ð¸Ñ‡Ð¸Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ** | ÐžÐ´Ð¸Ð½Ð°ÐºÐ¾Ð²Ñ‹Ðµ Ñ„Ð°Ð¹Ð»Ñ‹, copy-paste Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ñ‹ | `diff`, Ð°Ð½Ð°Ð»Ð¸Ð· TechniquePanels |
| 7 | **Ð¡Ð¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ Ñ‚ÐµÑÑ‚Ð¾Ð²** | ÐšÐ¾Ð»-Ð²Ð¾, Ð¿Ð¾ÐºÑ€Ñ‹Ñ‚Ð¸Ðµ, Ñ‡Ñ‚Ð¾ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÑÑŽÑ‚ | `**/*.test.tsx`, `dev-tests-catalog.md` |
| 8 | **Ð£ÑÐ·Ð²Ð¸Ð¼Ð¾ÑÑ‚Ð¸ Ð¸ Ñ€Ð¸ÑÐºÐ¸** | Security audit, plaintext, eval, innerHTML, CSP | `grep` Ð¿Ð¾ Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ð°Ð¼, CI audit job |

### 2.2. Ð¢Ñ€Ð¸ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ñ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼ (ÑÐ²Ð½Ð¾ Ñ‚Ñ€ÐµÐ±Ð¾Ð²Ð°Ð»Ð¾ÑÑŒ Ð² Ð·Ð°Ð´Ð°Ð½Ð¸Ð¸)

| Ð¡Ð¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ | ÐžÐ±Ð¾Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº | Ð§Ñ‚Ð¾ Ñ Ð½Ð¸Ð¼ Ð´ÐµÐ»Ð°Ñ‚ÑŒ |
|---|---|---|---|
| **Ð˜Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ðµ** | ðŸŸ¡ KNOWN | Ð—Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ñ‹ Ð² zone audits / diagnostics | Ð’ Ñ€Ð°Ð±Ð¾Ñ‚Ðµ Ð¸Ð»Ð¸ Ð² backlog |
| **Ð˜ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð½Ñ‹Ðµ** | ðŸŸ¢ FIXED | Ð’ Ñ€Ð°Ð·Ð´ÐµÐ»Ðµ Â«Ð§Ñ‚Ð¾ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ Ð¸ Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¾Â» zone audits + CHANGELOG | ÐÑ€Ñ…Ð¸Ð², Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº ÑƒÑ€Ð¾ÐºÐ¾Ð² |
| **ÐÐµ Ð¸ÑÑÐ»ÐµÐ´Ð¾Ð²Ð°Ð½Ð½Ñ‹Ðµ** | ðŸ”´ UNINVESTIGATED | ÐÐµ ÑƒÐ¿Ð¾Ð¼ÑÐ½ÑƒÑ‚Ñ‹ Ð½Ð¸Ð³Ð´Ðµ, Ð½Ð¾ Ð²Ð¸Ð´Ð½Ñ‹ Ð¿Ð¾ ÐºÐ¾Ð´Ñƒ / Ð½ÐµÑ‚ Ñ‚ÐµÑÑ‚Ð¾Ð² | Ð¢Ñ€ÐµÐ±ÑƒÑŽÑ‚ Ð°ÑƒÐ´Ð¸Ñ‚Ð° |

---

## 3. Ð”Ð°ÑˆÐ±Ð¾Ñ€Ð´: Ð°Ð³Ñ€ÐµÐ³Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ðµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸

### 3.1. ÐžÐ±ÑŠÑ‘Ð¼ Ð¸ ÑÐ»Ð¾Ð¶Ð½Ð¾ÑÑ‚ÑŒ

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ |
|---|---:|
| TS/TSX Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð² `src/` | **3 114** |
| Total LOC | **508 976** |
| Ð¡Ñ€ÐµÐ´Ð½Ð¸Ð¹ Ñ€Ð°Ð·Ð¼ÐµÑ€ Ñ„Ð°Ð¹Ð»Ð° | **163 ÑÑ‚Ñ€Ð¾ÐºÐ¸** |
| Ð¤Ð°Ð¹Ð»Ð¾Ð² > 500 ÑÑ‚Ñ€Ð¾Ðº | **169** (5.4% Ñ„Ð°Ð¹Ð»Ð¾Ð²) |
| Ð¤Ð°Ð¹Ð»Ð¾Ð² > 1000 ÑÑ‚Ñ€Ð¾Ðº | **18** (0.6% Ñ„Ð°Ð¹Ð»Ð¾Ð²) |
| Largest file | `wiki-articles.ts` â€” 5 021 ÑÑ‚Ñ€Ð¾ÐºÐ° (generated) |
| Largest non-generated file | `dexie-schema.ts` â€” 3 764 ÑÑ‚Ñ€Ð¾ÐºÐ¸ |

**ÐŸÐ¾ ÑÐ»Ð¾ÑÐ¼:**

| Ð¡Ð»Ð¾Ð¹ | Ð¤Ð°Ð¹Ð»Ð¾Ð² | LOC | Ð”Ð¾Ð»Ñ | Ð¡Ñ€ÐµÐ´Ð½Ð¸Ð¹ Ñ€Ð°Ð·Ð¼ÐµÑ€ |
|---|---:|---:|---:|---:|
| `kernel/` | 1 754 | 239 832 | 47% | 136 |
| `components/` | 1 103 | 228 813 | 45% | 207 |
| `llm/` | 79 | 12 299 | 2% | 155 |
| `stores/` | 53 | 8 993 | 2% | 169 |
| `i18n/` | 48 | 8 618 | 2% | 179 |
| `generated/` | 23 | 2 112 | <1% | 91 |
| `hooks/` | 15 | 1 350 | <1% | 90 |

### 3.2. Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸

| ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ñ | ÐšÐ¾Ð»-Ð²Ð¾ | Ð¢ÑÐ¶Ñ‘Ð»Ñ‹Ðµ |
|---|---:|---|
| `dependencies` (production) | **25** | React 19, Vite 8, Dexie 4, React Flow 12, Mermaid 12, Monaco 0.52, TipTap 3, Zod 4, Zustand 4, Orama 3, framer-motion 12, vis-network 10, @google/generative-ai, groq-sdk |
| `devDependencies` | **33** | Vitest, Playwright, ESLint, Prettier, TypeScript 6, madge, dependency-cruiser, husky, commitlint |
| Ð’ÑÐµÐ³Ð¾ | **58** | â€” |
| npm scripts | **48** | â€” |

**Ð—Ñ€ÐµÐ»Ñ‹Ðµ** Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸ (React, Vite, Dexie, Zod) â€” stable. **Risk:** `@google/generative-ai@^0.24.1` â€” pre-1.0, API Ð¼Ð¾Ð¶ÐµÑ‚ Ð»Ð¾Ð¼Ð°Ñ‚ÑŒÑÑ. `lucide-react@^1.14.0` â€” Ð½ÐµÑÑ‚Ð°Ð½Ð´Ð°Ñ€Ñ‚Ð½Ð°Ñ Ð²ÐµÑ€ÑÐ¸Ñ (Ð¾Ð±Ñ‹Ñ‡Ð½Ð¾ 0.x).

### 3.3. ÐšÐ°Ñ‡ÐµÑÑ‚Ð²Ð¾ ÐºÐ¾Ð´Ð° (ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ Ð¼Ð°Ñ€ÐºÐµÑ€Ñ‹)

| ÐœÐ°Ñ€ÐºÐµÑ€ | ÐšÐ¾Ð»-Ð²Ð¾ | Ð’ÐµÑ€dict |
|---|---:|---|
| `TODO` | **2** | ðŸŸ¢ðŸŸ¢ Ð¸ÑÐºÐ»ÑŽÑ‡Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾ Ñ‡Ð¸ÑÑ‚Ð¾ (509K LOC / 2 TODO) |
| `FIXME` | 0 | ðŸŸ¢ |
| `HACK` | 0 | ðŸŸ¢ |
| `XXX` | 0 | ðŸŸ¢ |
| `as any` / `as unknown` | **828** | ðŸŸ¡ ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾ (0.16% Ð¾Ñ‚ LOC â€” Ð¿Ñ€Ð¸ÐµÐ¼Ð»ÐµÐ¼Ð¾) |
| `eslint-disable` | **256** | ðŸŸ¡ ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾ |
| `@ts-ignore` / `@ts-expect-error` | **1** | ðŸŸ¢ðŸŸ¢ Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ð¾ |
| `throw new Error/TypeError` | **992** | ðŸŸ¢ Ñ…Ð¾Ñ€Ð¾ÑˆÐ°Ñ error-ÐºÑƒÐ»ÑŒÑ‚ÑƒÑ€Ð° |
| `console.error` | 72 | ðŸŸ¡ Ð¿Ñ€Ð¸ÐµÐ¼Ð»ÐµÐ¼Ð¾ |
| `console.warn` | 16 | ðŸŸ¢ |
| `@deprecated MOCK` | 1 ÑÐµÑ€Ð²Ð¸Ñ (`HealthSlaService`) | ðŸŸ¡ |

**2 TODO Ð½Ð° 509K LOC â€” ÑÑ‚Ð¾ Ð°Ð½Ð¾Ð¼Ð°Ð»ÑŒÐ½Ð¾ Ñ‡Ð¸ÑÑ‚Ð¾.** Ð‘Ð¾Ð»ÑŒÑˆÐ¸Ð½ÑÑ‚Ð²Ð¾ Ð·Ñ€ÐµÐ»Ñ‹Ñ… Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð¾Ð² Ð¸Ð¼ÐµÑŽÑ‚ 50â€“500 TODO. Ð­Ñ‚Ð¾ Ð³Ð¾Ð²Ð¾Ñ€Ð¸Ñ‚ Ð¾ **ÑÑ‚Ñ€Ð¾Ð³Ð¾Ð¹ ÐºÑƒÐ»ÑŒÑ‚ÑƒÑ€Ðµ ÑƒÐ±Ð¾Ñ€ÐºÐ¸**.

### 3.4. Ð¢ÐµÑÑ‚Ñ‹

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ |
|---|---:|
| Unit/ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð½Ñ‹Ñ… Ñ‚ÐµÑÑ‚Ð¾Ð² (src) | **486** |
| Server-Ñ‚ÐµÑÑ‚Ð¾Ð² | 8 |
| Ð¡ÐºÑ€Ð¸Ð¿Ñ‚-Ñ‚ÐµÑÑ‚Ð¾Ð² | 3 |
| E2E (Playwright) | **17** |
| Ð’ÑÐµÐ³Ð¾ | **514** |
| Ð¢ÐµÑÑ‚Ð¾Ð²Ñ‹Ñ… Ñ„Ð°Ð¹Ð»Ð¾Ð² Ð² `src/components` | 164 |
| ÐšÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð² Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ Ñ‚ÐµÑÑ‚Ð¾Ð¼ | 104 Ð¸Ð· ~180 |
| Stable CI gate (`test:stable`) | 34 Ð¿ÑƒÑ‚Ð¸ |
| Coverage job | âœ… ÐµÑÑ‚ÑŒ (`test:coverage`) |

### 3.5. CI / Quality gates

`.github/workflows/ci.yml` â€” 5 jobs:

| Job | Ð§Ñ‚Ð¾ Ð´ÐµÐ»Ð°ÐµÑ‚ | Ð¡Ñ‚Ð°Ñ‚ÑƒÑ |
|---|---|---|
| **Type-check & Lint** | `npx tsc -b --noEmit` + `npm run lint -- --max-warnings 5600` + `docs:health` + `check:circular-kernel` (madge) + `check:deps` (depcruise) + 16 `gen:*` ÑÐºÑ€Ð¸Ð¿Ñ‚Ð¾Ð² | ðŸŸ¢ Ð·Ñ€ÐµÐ»Ð¾, **Ð½Ð¾ 5600 warnings â€” Ð²Ñ‹ÑÐ¾ÐºÐ¸Ð¹ baseline** |
| **Build** | `npm run build` (typecheck + production build) | ðŸŸ¢ |
| **Unit Tests** | `npm run test:stable` + `npm run test:server` | ðŸŸ¢ |
| **Test Coverage** | `npm run test:coverage` | ðŸŸ¢ |
| **Security Audit** | (details Ð² workflow) | ðŸŸ¢ ÐµÑÑ‚ÑŒ |
| **E2E** | `npm run test:e2e -- ${{ matrix.spec }}` (matrix Ð¸Ð· 17 specs) | ðŸŸ¢ |

**Ð”Ð¾Ð¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾:** `check:circular-kernel` (madge) Ð¿Ñ€Ð¾Ð²ÐµÑ€ÑÐµÑ‚ Ñ†Ð¸ÐºÐ»Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸ Ð² `src/kernel/`. `check:deps` (dependency-cruiser) â€” Ð¿Ð¾ `.dependency-cruiser.cjs`.

---

## 4. Ð£Ñ‡Ñ‘Ñ‚ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼: Ð˜Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ðµ / Ð˜ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð½Ñ‹Ðµ / ÐÐµ Ð¸ÑÑÐ»ÐµÐ´Ð¾Ð²Ð°Ð½Ð½Ñ‹Ðµ

### 4.1. Ð˜ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð½Ñ‹Ðµ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹ ðŸŸ¢ â€” 199 (Ð·Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ñ‹)

Ð˜Ð· **26 zone-audit Ñ„Ð°Ð¹Ð»Ð¾Ð²** Ð² `docs/wiki/zone-*.md`. ÐšÐ°Ð¶Ð´Ñ‹Ð¹ zone ÑÐ¾Ð´ÐµÑ€Ð¶Ð¸Ñ‚ Ñ€Ð°Ð·Ð´ÐµÐ» **Â«Ð§Ñ‚Ð¾ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ Ð¸ Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¾Â»**.

**Ð Ð°ÑÐ¿Ñ€ÐµÐ´ÐµÐ»ÐµÐ½Ð¸Ðµ Ð¿Ð¾ Ð·Ð¾Ð½Ð°Ð¼ (Ñ‚Ð¾Ð¿-10):**

| Zone | Ð§Ñ‚Ð¾ Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¾ | Ðž Ñ‡Ñ‘Ð¼ Ð·Ð¾Ð½Ð° |
|---|---:|---|
| zone-26 | ~25 | ÐžÑÑ‚Ð°Ñ‚ÐºÐ¸ (PolicyEditor, Analytics, Performance, Drift, VulnTargeting, Aquarium, Bookmarks, CausalDebugger, RivalsHub, AgentJournal, AlertLayer, NvidiaEnterprise, Fleet) â€” guards Ð¾Ñ‚ missing arrays/NaN |
| zone-1 | ~12 | ÐŸÐ°Ð½ÐµÐ»Ð¸ Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð¾Ð² Ð¸ Ñ‡Ð°Ñ‚Ð° |
| zone-4 | ~10 | ÐŸÐ°Ð¼ÑÑ‚ÑŒ Ð¸ Ð·Ð½Ð°Ð½Ð¸Ñ |
| zone-3 | ~10 | ÐÐ³ÐµÐ½Ñ‚Ñ‹ Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸ |
| zone-2 | ~10 | Ð”ÐµÐ±Ð°Ñ‚Ñ‹ |
| zone-5 | ~8 | Ð¡Ð¸ÑÑ‚ÐµÐ¼Ð° Ð¸ Ð¼Ð¾Ð½Ð¸Ñ‚Ð¾Ñ€Ð¸Ð½Ð³ |
| zone-25 | ~8 | ÐšÐ¾Ð½ÑÑ‚Ñ€ÑƒÐºÑ‚Ð¾Ñ€Ñ‹ |
| zone-6 | ~8 | Governance Ð¸ Ð¿Ð¾Ð»Ð¸Ñ‚Ð¸ÐºÐ¸ |
| zone-7 | ~7 | Ð˜Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚Ñ‹ Ð¸ MCP |
| â€¦ | â€¦ | â€¦ |
| **Total** | **199** | â€” |

**ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸Ð¸ Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ð¹ (Ð¿Ð¾ CHANGELOG + zones):**

1. **Guards Ð¾Ñ‚ missing fields** (Ð±Ð¾Ð»ÑŒÑˆÐ¸Ð½ÑÑ‚Ð²Ð¾ zone-26) â€” `where('metadata.timestamp')` â†’ `where('metadata.timestamp]')` (Dexie compound index syntax); optional chaining Ð²ÐµÐ·Ð´Ðµ; `Array.isArray()` Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ¸
2. **Provider audit sprint** (v4.4.0) â€” 100 tasks: CircuitBreaker `updateAndGetState()` for auto-transition, priority queue starvation fix, `destroy()` Ð½Ð° adapter interface
3. **Auto-debate default model fix** (v4.4.1) â€” `auto-debate-service.ts:96` hardcoded `'gpt-3.5-turbo'` â†’ `undefined` (Ð±Ñ‹Ð» 404 Ð½Ð° Ð²ÑÐµÑ… Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð°Ñ…)
4. **NVIDIA proxy** â€” `baseURL` Ð¾Ñ‚ direct `https://integrate.api.nvidia.com/v1` Ðº `/proxy/nvidia` (CORS fix)
5. **UI layout fix** â€” root `overflowY: 'auto'` â†’ `overflow: 'hidden'` (Ð°Ñ€Ð³ÑƒÐ¼ÐµÐ½Ñ‚Ñ‹ ÑÐºÑ€Ð¾Ð»Ð»ÑÑ‚ÑÑ Ð² ÐºÐ¾Ð½Ñ‚ÐµÐ¹Ð½ÐµÑ€Ðµ, Ð½Ðµ Ð²ÐµÑÑŒ panel)
6. **InstalledProvidersView crash fixes** â€” `ProviderCard` declares `status`, `reputation`, `modelCount` (was missing)
7. **Removed global LLM backoff** â€” `failedProviders` + adapter-level circuit breakers Ð²Ð¼ÐµÑÑ‚Ð¾ `llmBackoffUntil`
8. **Promise-in-state guards** â€” `HealthPanel` ÑÐ²Ð½Ð¾ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÑÐµÑ‚ `initial instanceof Promise ? null : initial`
9. **Empty list vs load failure** â€” `GovernancePanel` Ñ€Ð°Ð·Ð»Ð¸Ñ‡Ð°ÐµÑ‚ `error_load` Ð¸ `empty_roles`
10. **Sandbox CSP** â€” `sandbox.worker.ts` Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·ÑƒÐµÑ‚ Ð½Ðµ `new Function()`/eval(), Ð° safe alternative

### 4.2. Ð˜Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ðµ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹ ðŸŸ¡ â€” 101 Ð¾Ñ‚Ð»Ð¾Ð¶ÐµÐ½Ð½Ð°Ñ + 5 Ð³Ð»Ð¾Ð±Ð°Ð»ÑŒÐ½Ñ‹Ñ…

**5 Ð³Ð»Ð¾Ð±Ð°Ð»ÑŒÐ½Ñ‹Ñ… Ð¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ñ… Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼** (`docs/wiki/diagnostics.md` â€” Â«Ð˜Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ðµ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹ (Ð½Ðµ ÑÐºÑ€Ñ‹Ð²Ð°ÐµÐ¼)Â»):

| # | ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð° | ÐšÑ€Ð¸Ñ‚Ð¸Ñ‡Ð½Ð¾ÑÑ‚ÑŒ | Ð“Ð´Ðµ |
|---|---|:---:|---|
| 1 | **API-ÐºÐ»ÑŽÑ‡Ð¸ Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ð¾Ð² Ð² plaintext Ð² IndexedDB** | ðŸ”´ HIGH | design choice (single-user) |
| 2 | **EventBus Ð±ÐµÐ· Ð¿ÐµÑ€ÑÐ¸ÑÑ‚ÐµÐ½Ñ‚Ð½Ð¾ÑÑ‚Ð¸ Ð¸ Ð¿Ð¾Ñ€ÑÐ´ÐºÐ°** â€” Ñ‚Ð¾Ð»ÑŒÐºÐ¾ live-Ð´ÐµÐ»ÑŒÑ‚Ð° | ðŸŸ¡ MED | ÑÐ´Ñ€Ð¾ Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ñ‹ |
| 3 | **Ð§Ð°ÑÑ‚ÑŒ UI Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ in-memory Ð´Ð°Ð½Ð½Ñ‹Ðµ** (Ð½Ðµ Ð²ÑÑ‘ ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¾) | ðŸŸ¡ MED | various panels |
| 4 | **ÐžÑ‚Ð´ÐµÐ»ÑŒÐ½Ñ‹Ðµ Ñ‚ÐµÑÑ‚Ñ‹ Ð¿Ñ€Ð¾Ñ‚ÑƒÑ…Ð»Ð¸** (Ð¿Ñ€Ð¸Ð¼ÐµÑ€: ChatPanel, ProviderManager) â€” harness'Ñ‹ Ð²Ð¸ÑÑÑ‚ | ðŸŸ¡ MED | test files |
| 5 | **Unbounded-Ð¿Ñ€Ð¾Ð²Ð°Ð¹Ð´ÐµÑ€Ñ‹ Ñ€Ð°Ð·Ñ€ÐµÑˆÐµÐ½Ñ‹ Ð¿Ð¾ ÑƒÐ¼Ð¾Ð»Ñ‡Ð°Ð½Ð¸ÑŽ** | ðŸŸ¡ MED | provider config |

**101 Ð¾Ñ‚Ð»Ð¾Ð¶ÐµÐ½Ð½Ð°Ñ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ð°** (Ð¸Ð· zone audits Â«ÐžÑ‚Ð»Ð¾Ð¶ÐµÐ½Ð¾, Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ¸Â»):

| Zone | ÐžÑ‚Ð»Ð¾Ð¶ÐµÐ½Ð¾ | Ð¥Ð°Ñ€Ð°ÐºÑ‚ÐµÑ€Ð¸ÑÑ‚Ð¸ÐºÐ° |
|---|---:|---|
| zone-4 | 8 | ÐŸÐ°Ð¼ÑÑ‚ÑŒ: Ð¸ÐºÐ¾Ð½ÐºÐ¸, ÑÐ¸Ð½Ñ‚ÐµÐ· Ð±ÐµÐ· ÑÐ¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¸Ñ, SLA-fallback, autodiscovery off |
| zone-1 | 7 | Ð”ÑƒÐ±Ð»Ð¸Ñ€ÑƒÑŽÑ‰Ð¸Ðµ Ð¸ÐºÐ¾Ð½ÐºÐ¸ Ð¿Ð¾Ð¸ÑÐºÐ°, Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ñ‹Ð¹ Ñ†Ð²ÐµÑ‚ Ð±ÐµÐ· persist, stale-Ð·Ð°Ð´ÐµÑ€Ð¶ÐºÐ¸ |
| zone-3 | 6 | ÐÐ³ÐµÐ½Ñ‚Ñ‹/Ð·Ð°Ð´Ð°Ñ‡Ð¸: i18n-Ð¿Ñ€Ð¾Ð±ÐµÐ»Ñ‹ |
| zone-23 | 5 | ÐšÐ¾Ð¼Ð¼ÑƒÐ½Ð¸ÐºÐ°Ñ†Ð¸Ð¸-2 |
| zone-24 | 5 | Ð—Ð½Ð°Ð½Ð¸Ñ-2 |
| zone-5 | 5 | Ð¡Ð¸ÑÑ‚ÐµÐ¼Ð°/Ð¼Ð¾Ð½Ð¸Ñ‚Ð¾Ñ€Ð¸Ð½Ð³ |
| zone-2 | 4 | Ð”ÐµÐ±Ð°Ñ‚Ñ‹ |
| zone-6 | 4 | Governance/Ð¿Ð¾Ð»Ð¸Ñ‚Ð¸ÐºÐ¸ |
| zone-7 | 4 | Ð˜Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚Ñ‹/MCP |
| zone-8 | 4 | Ð Ð¾ÑƒÑ‚ÐµÑ€ |
| zone-15 | 4 | Ð˜ÑÑÐ»ÐµÐ´Ð¾Ð²Ð°Ð½Ð¸Ñ |
| â€¦ | â€¦ | â€¦ |
| **Total** | **101** | â€” |

**Ð¨Ð°Ð±Ð»Ð¾Ð½Ñ‹ Ð¾Ñ‚Ð»Ð¾Ð¶ÐµÐ½Ð½Ñ‹Ñ… Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼:**

- **i18n Ð¿Ñ€Ð¾Ð±ÐµÐ»Ñ‹** â€” Ð°Ð½Ð³Ð»Ð¸Ð¹ÑÐºÐ¸Ðµ ÑÑ‚Ñ€Ð¾ÐºÐ¸ Ð² Ð¿Ð°Ð½ÐµÐ»ÑÑ… (Ð½Ðµ Ð»Ð¾ÐºÐ°Ð»Ð¸Ð·Ð¾Ð²Ð°Ð½Ñ‹)
- **Stale-Ð´Ð°Ð½Ð½Ñ‹Ðµ** â€” Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÑŽÑ‚ Ð·Ð°Ð´ÐµÑ€Ð¶ÐºÐ¸/ÑÑ‚Ð°Ñ€Ñ‹Ðµ Ð·Ð½Ð°Ñ‡ÐµÐ½Ð¸Ñ Ð±ÐµÐ· refresh
- **Autodiscovery Ð²Ñ‹ÐºÐ»ÑŽÑ‡ÐµÐ½Ð¾** â€” ÐºÐ¾Ð¼Ð¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹ ÐºÐ¾Ð´
- **Ð›Ð¾ÐºÐ°Ð»ÑŒÐ½Ð¾Ðµ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ Ð±ÐµÐ· persist** â€” Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ UI Ñ‚ÐµÑ€ÑÑŽÑ‚ÑÑ Ð¿Ñ€Ð¸ reload
- **Gamified-Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸** â€” ÑÐ¸Ð½Ñ‚ÐµÐ·Ð¸Ñ€Ð¾Ð²Ð°Ð½Ñ‹ Ð¸Ð· ÑÑ‡Ñ‘Ñ‚Ñ‡Ð¸ÐºÐ¾Ð², Ð½Ðµ Ð¸Ð·Ð¼ÐµÑ€ÐµÐ½Ñ‹ Ñ€ÐµÐ°Ð»ÑŒÐ½Ð¾

### 4.3. ÐÐµ Ð¸ÑÑÐ»ÐµÐ´Ð¾Ð²Ð°Ð½Ð½Ñ‹Ðµ ðŸ”´ â€” Ñ‡Ñ‚Ð¾ Ð²Ð¸Ð´Ð½Ð¾ Ð¿Ð¾ ÐºÐ¾Ð´Ñƒ, Ð½Ð¾ Ð½Ðµ Ð² zone audits

Ð­Ñ‚Ð¸ **Ð½Ðµ Ð·Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ñ‹** Ð½Ð¸ Ð² diagnostics.md, Ð½Ð¸ Ð² zone audits â€” Ð½Ð°Ð¹Ð´ÐµÐ½Ñ‹ ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¼ Ð°Ð½Ð°Ð»Ð¸Ð·Ð¾Ð¼.

| # | ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ð° | Ð”Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾ | ÐšÑ€Ð¸Ñ‚Ð¸Ñ‡Ð½Ð¾ÑÑ‚ÑŒ |
|---|---|:---:|---|
| 1 | **5600-warning lint baseline** | `.github/workflows/ci.yml`: `npm run lint -- --max-warnings 5600` | ðŸŸ¡ MED â€” ÐºÐ¾Ð¿Ð¸Ñ‚ÑÑ Ñ‚Ð¸Ñ…Ð¾ |
| 2 | **HealthSlaService = `@deprecated MOCK`** | `wiki-components.ts` + `health-sla-service.ts` | ðŸŸ¡ MED â€” UI Ð¿Ð¾ÐºÐ°Ð·Ñ‹Ð²Ð°ÐµÑ‚ ÑÐ¸Ð¼ÑƒÐ»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ðµ Ð´Ð°Ð½Ð½Ñ‹Ðµ |
| 3 | **828 `as any`/`as unknown` type escapes** | `grep -rE "as (any\|unknown)" src/` | ðŸŸ¡ MED â€” 0.16% Ð¾Ñ‚ LOC, Ð½Ð¾é›†ä¸­çš„ Ð² Kernel/PersonalityCard/DistillationPanel |
| 4 | **256 `eslint-disable` directives** | `grep -rE "eslint-disable"` | ðŸŸ¡ MED â€” Ð½ÑƒÐ¶Ð½Ð¾ Ñ€ÐµÐ²ÑŒÑŽ |
| 5 | **80 `localStorage` plain-text calls** | `grep -rE "localStorage\.(setItem\|getItem)"` | ðŸŸ¡ LOW-MED â€” prefs + SRE keyId |
| 6 | **62 Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ‡Ð½Ñ‹Ðµ TechniquePanels** | `diff HumorPanel.tsx CriticPanel.tsx` = 4 ÑÑ‚Ñ€Ð¾ÐºÐ¸ | ðŸŸ¡ MED â€” maintainability risk |
| 7 | **18 Ñ„Ð°Ð¹Ð»Ð¾Ð² > 1000 ÑÑ‚Ñ€Ð¾Ðº** | `find â€¦ wc -l` | ðŸŸ¡ MED â€” complexity hotspots |
| 8 | **`dexie-schema.ts` 3 764 ÑÑ‚Ñ€Ð¾ÐºÐ¸** | largest non-generated file | ðŸŸ¡ MED â€” schema Ð¼Ð¾Ð½Ð¾Ð»Ð¸Ñ‚ |
| 9 | **`event-registry.ts` 2 772 ÑÑ‚Ñ€Ð¾ÐºÐ¸** | 198 ÑÑ…ÐµÐ¼ ÑÐ¾Ð±Ñ‹Ñ‚Ð¸Ð¹ Ð² Ð¾Ð´Ð½Ð¾Ð¼ Ñ„Ð°Ð¹Ð»Ðµ | ðŸŸ¡ MED |
| 10 | **`sandbox-interpreter.ts` 1 906 ÑÑ‚Ñ€Ð¾Ðº** | workers/sandbox | ðŸŸ¡ MED â€” security-critical code |
| 11 | **`wiki-articles.ts` 5 021 ÑÑ‚Ñ€Ð¾ÐºÐ°** | generated, Ð½Ð¾ Ð² src/ | ðŸŸ¢ LOW (generated) |
| 12 | **`panel-actions-catalog.ts` 4 832 ÑÑ‚Ñ€Ð¾ÐºÐ¸** | generated | ðŸŸ¢ LOW (generated) |
| 13 | **Tests stale** â€” `diagnostics.md` Ð¿Ñ€Ð¸Ð·Ð½Ð°Ñ‘Ñ‚: Â«harness'Ñ‹ Ð²Ð¸ÑÑÑ‚, Ñ‡Ð¸Ð½ÑÑ‚ÑÑ Ñ‚Ð¾Ñ‡ÐµÑ‡Ð½Ð¾Â» | ðŸŸ¡ MED |
| 14 | **`dev-status-critical.md`, `dev-status-debt.md`, `dev-status-done.md`, `dev-status-bugs.md`, `dev-status-blocked.md` â€” Ð¿ÑƒÑÑ‚Ñ‹Ðµ Ð·Ð°Ð³Ð»ÑƒÑˆÐºÐ¸** | WebFetch Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð´Ð¸Ð»: Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ» | ðŸŸ¡ MED â€” Ð½ÐµÑ‚ formal issue tracking |
| 15 | **Open `/audit/` directory empty** | `ls docs/audits/` â†’ empty | ðŸŸ¡ MED â€” Ð½ÐµÑ‚ audit reports |
| 16 | **Coverage threshold Ð½Ðµ Ð·Ð°Ð´Ð°Ð½ Ð² CI** | `test:coverage` Ð·Ð°Ð¿ÑƒÑÐºÐ°ÐµÑ‚ÑÑ, Ð½Ð¾ threshold-gate Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½ | ðŸŸ¡ MED |
| 17 | **Mock-ÑÐµÑ€Ð²Ð¸ÑÑ‹ Ð² production code path** | DemoGate + DemoBadge + `featureFlags.mockServices.enabled` | ðŸŸ¡ LOW (gated) |

---

## 5. Ð”ÐµÑ‚Ð°Ð»ÑŒÐ½Ñ‹Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð· Ð¿Ð¾ 8 ÐºÑ€Ð¸Ñ‚ÐµÑ€Ð¸ÑÐ¼

### 5.1. ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ñ… Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼

**ÐžÑ†ÐµÐ½ÐºÐ°: 6/10**

- **199 Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð½Ñ‹Ñ…** + **101 Ð¾Ñ‚Ð»Ð¾Ð¶ÐµÐ½Ð½Ñ‹Ñ…** + **5 Ð³Ð»Ð¾Ð±Ð°Ð»ÑŒÐ½Ñ‹Ñ…** + **~17 Ð½Ðµ Ð¸ÑÑÐ»ÐµÐ´Ð¾Ð²Ð°Ð½Ð½Ñ‹Ñ…** = **~322 Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼-Ñ‚Ð¾Ñ‡ÐºÐ¸** Ð½Ð° Ð¶Ð¸Ð·Ð½Ð¸ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°.
- ÐÐ° 509K LOC ÑÑ‚Ð¾ **0.63 Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹ Ð½Ð° 1K LOC** â€” **Ð² Ð½Ð¾Ñ€Ð¼Ðµ** Ð´Ð»Ñ Ð·Ñ€ÐµÐ»Ð¾Ð¹ ÐºÐ¾Ð´Ð¾Ð²Ð¾Ð¹ Ð±Ð°Ð·Ñ‹.
- **ÐŸÐ¾ÐºÑ€Ñ‹Ñ‚Ð¸Ðµ Ð°ÑƒÐ´Ð¸Ñ‚Ð¾Ð¼:** 26 zone audits + `diagnostics.md` + CHANGELOG â€” Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ð°Ñ Ð·Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ð¾ÑÑ‚ÑŒ.
- **Gap:** `dev-status-*.md` (5 Ñ„Ð°Ð¹Ð»Ð¾Ð²) â€” Ð¿ÑƒÑÑ‚Ñ‹Ðµ Ð·Ð°Ð³Ð»ÑƒÑˆÐºÐ¸. Ð­Ñ‚Ð¾ Ð·Ð½Ð°Ñ‡Ð¸Ñ‚, Ñ‡Ñ‚Ð¾ **Ñ„Ð¾Ñ€Ð¼Ð°Ð»ÑŒÐ½Ð¾Ð³Ð¾ issue tracker Ð² wiki Ð½ÐµÑ‚**, Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ zone audits.

### 5.2. ÐšÑ€Ð¸Ñ‚Ð¸Ñ‡Ð½Ð¾ÑÑ‚ÑŒ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼

**ÐžÑ†ÐµÐ½ÐºÐ°: 7/10** (ÐºÑ€Ð¸Ñ‚Ð¸Ñ‡Ð½Ð¾ÑÑ‚ÑŒ Ð½Ð¸Ð·ÐºÐ°Ñ = Ñ…Ð¾Ñ€Ð¾ÑˆÐ°Ñ Ð¾Ñ†ÐµÐ½ÐºÐ°)

**P0 ÐºÑ€Ð¸Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ (Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾):**
- âœ… FIXED: auto-debate default model 404 (v4.4.1)
- âœ… FIXED: NVIDIA proxy CORS
- âœ… FIXED: InstalledProvidersView crash (missing `status`/`reputation`/`modelCount`)
- âœ… FIXED: MemoryEngine compound index syntax
- ðŸŸ¡ KNOWN: API keys plaintext Ð² IndexedDB (design choice, Ð½Ðµ bug)
- ðŸŸ¡ KNOWN: EventBus no persistence (architectural)

**P1 Ð²Ð°Ð¶Ð½Ñ‹Ðµ:**
- ðŸŸ¡ KNOWN: Tests stale (ChatPanel, ProviderManager)
- ðŸŸ¡ KNOWN: HealthSlaService = MOCK
- ðŸŸ¡ KNOWN: 5600-warning lint baseline
- ðŸŸ¡ KNOWN: Unbounded providers by default

**P2 Ð¼Ð¸Ð½Ð¾Ñ€Ð½Ñ‹Ðµ:**
- ðŸŸ¡ 101 deferred issue Ð² zone audits (i18n Ð¿Ñ€Ð¾Ð±ÐµÐ»Ñ‹, stale-Ð´Ð°Ð½Ð½Ñ‹Ðµ, Ð»Ð¾ÐºÐ°Ð»ÑŒÐ½Ñ‹Ðµ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸ Ð±ÐµÐ· persist)
- ðŸŸ¡ 828 type escapes
- ðŸŸ¡ 256 eslint-disable

**P0 Ð² production Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾.** Ð’ÑÐµ ÐºÑ€Ð¸Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ñ ÑƒÐ¶Ðµ Ð² CHANGELOG. Ð­Ñ‚Ð¾ **Ñ…Ð¾Ñ€Ð¾ÑˆÐ¸Ð¹ Ð·Ð½Ð°Ðº**.

### 5.3. Ð¢ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð´Ð¾Ð»Ð³

**ÐžÑ†ÐµÐ½ÐºÐ°: 6/10**

| Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº Ð´Ð¾Ð»Ð³Ð° | ÐžÐ±ÑŠÑ‘Ð¼ | Ð’ÐµÑ€Ð´Ð¸ÐºÑ‚ |
|---|---|---|
| 101 Ð¾Ñ‚Ð»Ð¾Ð¶ÐµÐ½Ð½Ð°Ñ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ð° (zone audits) | Ð¸Ð·Ð¼ÐµÑ€Ð¸Ð¼Ñ‹Ð¹, Ð·Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½ | ðŸŸ¡ ÑƒÐ¿Ñ€Ð°Ð²Ð»ÑÐµÐ¼Ñ‹Ð¹ |
| `@deprecated MOCK` ÑÐµÑ€Ð²Ð¸ÑÑ‹ | 1 (`HealthSlaService`) | ðŸŸ¢ Ð¼Ð°Ð»Ñ‹Ð¹ |
| Stub-Ð¿Ð°Ð½ÐµÐ»Ð¸ | 3 (`GovernancePanel`, `OpenRouterPanel`, `SocialLeaderboardPanel`) | ðŸŸ¡ Ð¼Ð°Ð»Ñ‹Ð¹ |
| 62 Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ‡Ð½Ñ‹Ðµ TechniquePanels | ÐºÐ¾Ð´Ð¾Ð³ÐµÐ½ÐµÑ€Ð°Ñ†Ð¸Ñ, Ð½Ðµ Ñ€ÑƒÑ‡Ð½Ð¾Ð¹ ÐºÐ¾Ð¿Ð¸Ð¿Ð°ÑÑ‚ | ðŸŸ¡ medium-term maintainability |
| 18 Ñ„Ð°Ð¹Ð»Ð¾Ð² > 1000 ÑÑ‚Ñ€Ð¾Ðº | hotspots | ðŸŸ¡ Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ Ñ€ÐµÑ„Ð°ÐºÑ‚Ð¾Ñ€Ð¸Ð½Ð³Ð° |
| 5600 lint warnings | ÐºÐ¾Ð¿ÑÑ‚ÑÑ Ñ‚Ð¸Ñ…Ð¾ | ðŸŸ¡ Ð½ÑƒÐ¶ÐµÐ½ cleanup |
| `dev-status-*.md` Ð¿ÑƒÑÑ‚Ñ‹Ðµ | Ð½ÐµÑ‚ formal tracking | ðŸŸ¡ Ð¿Ñ€Ð¾Ñ†ÐµÑÑÐ½Ñ‹Ð¹ Ð´Ð¾Ð»Ð³ |
| Tests stale | Ñ‚Ð¾Ñ‡ÐµÑ‡Ð½Ð¾ Ñ‡Ð¸Ð½ÑÑ‚ÑÑ | ðŸŸ¡ ÑÑ‚Ð°Ð±Ð¸Ð»ÑŒÐ½Ñ‹Ð¹ Ð´Ð¾Ð»Ð³ |
| 828 type escapes | 0.16% Ð¾Ñ‚ LOC | ðŸŸ¢ Ð¿Ñ€Ð¸ÐµÐ¼Ð»ÐµÐ¼Ð¾ |
| 256 eslint-disable | Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ Ñ€ÐµÐ²ÑŒÑŽ | ðŸŸ¡ |

**Ð”Ð¾Ð»Ð³ Ð² Ð¾ÑÐ½Ð¾Ð²Ð½Ð¾Ð¼ Â«Ð¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ð¹ Ð¸ Ð·Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹Â»** â€” ÑÑ‚Ð¾ **controlled debt**, Ð½Ðµ ÑÐºÑ€Ñ‹Ñ‚Ñ‹Ð¹. Ð Ð°Ð·Ð´ÐµÐ»ÐµÐ½Ð¸Ðµ Â«Ð§Ñ‚Ð¾ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ Ð¸ Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¾Â» / Â«ÐžÑ‚Ð»Ð¾Ð¶ÐµÐ½Ð¾Â» Ð² zone audits = Ñ…Ð¾Ñ€Ð¾ÑˆÐ°Ñ Ð¿Ñ€Ð°ÐºÑ‚Ð¸ÐºÐ°.

### 5.4. Ð¡Ð»Ð¾Ð¶Ð½Ð¾ÑÑ‚ÑŒ ÐºÐ¾Ð´Ð°

**ÐžÑ†ÐµÐ½ÐºÐ°: 6/10**

**Top-15 ÐºÑ€ÑƒÐ¿Ð½ÐµÐ¹ÑˆÐ¸Ñ… Ñ„Ð°Ð¹Ð»Ð¾Ð² (hotspots):**

| Ð¤Ð°Ð¹Ð» | Ð¡Ñ‚Ñ€Ð¾Ðº | Ð¢Ð¸Ð¿ | Ð Ð¸ÑÐº |
|---|---:|---|---|
| `WikiPanel/wiki-articles.ts` | 5 021 | generated | ðŸŸ¢ LOW â€” Ð°Ð²Ñ‚Ð¾Ð³ÐµÐ½ÐµÑ€Ð°Ñ†Ð¸Ñ |
| `Assistant/panel-actions-catalog.ts` | 4 832 | generated | ðŸŸ¢ LOW |
| `WikiPanel/wiki-components.ts` | 4 104 | generated | ðŸŸ¢ LOW |
| **`kernel/services/dexie-schema.ts`** | **3 764** | hand-written | ðŸ”´ HIGH â€” schema Ð¼Ð¾Ð½Ð¾Ð»Ð¸Ñ‚ |
| `kernel/events/event-registry.ts` | 2 772 | 198 event ÑÑ…ÐµÐ¼ | ðŸŸ¡ MED â€” ÐµÐ´Ð¸Ð½Ñ‹Ð¹ Ñ€ÐµÐµÑÑ‚Ñ€ |
| `styles/common.ts` | 1 968 | styling tokens | ðŸŸ¡ MED |
| **`kernel/workers/sandbox-interpreter.ts`** | **1 906** | security-critical | ðŸ”´ HIGH â€” sandbox logic |
| `generated/wiki-connections.ts` | 1 594 | generated | ðŸŸ¢ LOW |
| **`debate-runtime/debate-llm-prompt-context.ts`** | **1 392** | logic | ðŸŸ¡ MED |
| `research-adapters/source-adapters.ts` | 1 291 | adapters | ðŸŸ¡ MED |
| `kernel/contracts/index.ts` | 1 241 | contracts barrel | ðŸŸ¢ LOW (barrel) |
| **`FleetPanel/FleetPanel.tsx`** | **1 235** | UI | ðŸŸ¡ MED |
| **`kernel/services/agent-service.ts`** | **1 234** | core service | ðŸ”´ HIGH |
| **`PolicyPanel/PolicyPanel.tsx`** | **1 184** | UI | ðŸŸ¡ MED |
| **`debate-strategy-definitions.ts`** | **1 157** | 33 ÑÑ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ð¸ | ðŸŸ¡ MED (Ð½Ð¾ ÑƒÐ¼ÐµÑÑ‚Ð½Ð¾) |
| **`key-service.ts`** | **1 098** | security-critical | ðŸ”´ HIGH |
| `assistant/assistant-actions.ts` | 1 098 | logic | ðŸŸ¡ MED |
| **`memory-engine.ts`** | **1 088** | core | ðŸŸ¡ MED |

**Verdict:**
- **Generated Ñ„Ð°Ð¹Ð»Ñ‹** (4 Ð¸Ð· Ñ‚Ð¾Ð¿-5) â€” Ð½Ðµ Ñ€ÐµÐ°Ð»ÑŒÐ½Ð°Ñ ÑÐ»Ð¾Ð¶Ð½Ð¾ÑÑ‚ÑŒ, Ð°Ð²Ñ‚Ð¾Ð³ÐµÐ½ÐµÑ€Ð°Ñ†Ð¸Ñ.
- **Hand-written hotspots** â€” `dexie-schema.ts` (3 764), `sandbox-interpreter.ts` (1 906), `agent-service.ts` (1 234), `key-service.ts` (1 098) â€” **Ñ‚Ñ€ÐµÐ±ÑƒÑŽÑ‚ Ð´ÐµÐºÐ¾Ð¼Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ð¸**.
- **169 Ñ„Ð°Ð¹Ð»Ð¾Ð² > 500 ÑÑ‚Ñ€Ð¾Ðº** (5.4% Ð¾Ñ‚ 3 114) â€” Ð¿Ñ€Ð¸ÐµÐ¼Ð»ÐµÐ¼Ð¾, Ð½Ð¾ Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ Ð²Ð½Ð¸Ð¼Ð°Ð½Ð¸Ñ.
- **Ð¡Ñ€ÐµÐ´Ð½Ð¸Ð¹ Ñ€Ð°Ð·Ð¼ÐµÑ€ 163 ÑÑ‚Ñ€Ð¾ÐºÐ¸** â€” Ð² Ð½Ð¾Ñ€Ð¼Ðµ Ð´Ð»Ñ React/TypeScript Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð°.

### 5.5. ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÐµÐ¹

**ÐžÑ†ÐµÐ½ÐºÐ°: 8/10** (Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾)

| Ð“Ñ€ÑƒÐ¿Ð¿Ð° | ÐšÐ¾Ð»-Ð²Ð¾ | Ð Ð¸ÑÐº |
|---|---:|---|
| Production deps | 25 | ðŸŸ¢ Ñ€Ð°Ð·ÑƒÐ¼Ð½Ð¾ |
| Dev deps | 33 | ðŸŸ¢ ÑÑ‚Ð°Ð½Ð´Ð°Ñ€Ñ‚ |
| Ð’ÑÐµÐ³Ð¾ | **58** | ðŸŸ¢ |
| npm scripts | 48 | ðŸŸ¢ automation Ð·Ñ€ÐµÐ»Ð°Ñ |

**ÐžÑ†ÐµÐ½ÐºÐ° Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÐµÐ¹:**

| Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÑŒ | Ð’ÐµÑ€ÑÐ¸Ñ | Ð—Ñ€ÐµÐ»Ð¾ÑÑ‚ÑŒ | Ð Ð¸ÑÐº |
|---|---|---|---|
| `react` | ^19.2.5 | ðŸŸ¢ stable | â€” |
| `vite` (dev) | ^8 | ðŸŸ¢ stable | â€” |
| `dexie` | ^4.4.2 | ðŸŸ¢ stable | â€” |
| `zod` | ^4.4.3 | ðŸŸ¢ stable (Zod 4 â€” latest) | â€” |
| `@xyflow/react` | ^12.10.2 | ðŸŸ¢ stable | â€” |
| `mermaid` | ^12.2.0 | ðŸŸ¢ stable | â€” |
| `monaco-editor` | ^0.52.2 | ðŸŸ¡ pre-1.0 | low |
| `@tiptap/react` | ^3.27.1 | ðŸŸ¢ stable | â€” |
| `@google/generative-ai` | ^0.24.1 | ðŸ”´ pre-0.x | **API Ð¼Ð¾Ð¶ÐµÑ‚ Ð»Ð¾Ð¼Ð°Ñ‚ÑŒÑÑ** |
| `groq-sdk` | ^1.4.0 | ðŸŸ¢ stable | â€” |
| `vis-network` | ^10.1.2 | ðŸŸ¢ stable | â€” |
| `framer-motion` | ^12.38.0 | ðŸŸ¢ stable | â€” |
| `lucide-react` | ^1.14.0 | ðŸŸ¡ Ð½ÐµÑÑ‚Ð°Ð½Ð´Ð°Ñ€Ñ‚Ð½Ð°Ñ Ð²ÐµÑ€ÑÐ¸Ñ (Ð¾Ð±Ñ‹Ñ‡Ð½Ð¾ 0.x) | low |
| `meriyah` | ^7.1.0 | ðŸŸ¢ stable (parser) | â€” |
| `dompurify` | ^3.4.12 | ðŸŸ¢ stable (security) | â€” |
| `@orama/orama` | ^3.1.18 | ðŸŸ¢ stable | â€” |
| `@tanstack/react-virtual` | ^3.14.2 | ðŸŸ¢ stable | â€” |
| `zustand` | ^4.5.7 | ðŸŸ¢ stable | â€” |
| `react-router-dom` | ^7.15.0 | ðŸŸ¢ stable | â€” |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ð¹ Ñ€Ð¸ÑÐº:** `@google/generative-ai@^0.24.1` â€” pre-1.0, Google Ñ‡Ð°ÑÑ‚Ð¾ Ð¼ÐµÐ½ÑÐµÑ‚ API Ð¼ÐµÐ¶Ð´Ñƒ minor Ð²ÐµÑ€ÑÐ¸ÑÐ¼Ð¸.

**Ð”Ð¾Ð¿Ð¾Ð»Ð½Ð¸Ñ‚ÐµÐ»ÑŒÐ½Ð¾:** `madge` (circular dep checker) + `dependency-cruiser` â€” ÑÑ‚Ð¾ **Ð¸Ð½ÑÑ‚Ñ€ÑƒÐ¼ÐµÐ½Ñ‚Ñ‹ ÐºÐ¾Ð½Ñ‚Ñ€Ð¾Ð»Ñ Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÐµÐ¹ Ð² CI**, Ñ‡Ñ‚Ð¾ ÐºÐ¾Ð¼Ð¿ÐµÐ½ÑÐ¸Ñ€ÑƒÐµÑ‚ Ñ€Ð¸ÑÐºÐ¸.

### 5.6. ÐÐ°Ð»Ð¸Ñ‡Ð¸Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ

**ÐžÑ†ÐµÐ½ÐºÐ°: 5/10** (ÐµÑÑ‚ÑŒ Ð¸Ð·Ð¼ÐµÑ€Ð¸Ð¼Ð¾Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ)

| Ð¢Ð¸Ð¿ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ | Ð“Ð´Ðµ | ÐžÐ±ÑŠÑ‘Ð¼ | Ð Ð¸ÑÐº |
|---|---|---|---|
| **62 Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ‡Ð½Ñ‹Ðµ TechniquePanels** | `src/components/TechniquePanels/*.tsx` | 62 Ã— 234 ÑÑ‚Ñ€Ð¾Ðº = ~14 500 LOC | ðŸŸ¡ MED â€” **generator-produced**, Ð½Ð¾ Ð½Ðµ Ð²Ñ‹Ð½ÐµÑÐµÐ½Ð¾ Ð² Ð¾Ð±Ñ‰Ð¸Ð¹ ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚ |
| **Multiple budget panels** | BudgetPanel + BudgetAlertsPanel + CostOptimizationPanel + CostAnalyticsPanel + CostsPanel | 5 UI-Ñ‚Ð¾Ñ‡ÐµÐº Ð²Ñ…Ð¾Ð´Ð° | ðŸŸ¡ MED â€” overlapping UI |
| **Multiple health panels** | HealthPanel + SystemHealthPanel + DocsHealthPanel + HealthSlaPanel | 4 health-Ñ‚Ð¾Ñ‡ÐºÐ¸ | ðŸŸ¡ MED |
| **Multiple provider UIs** | ProviderManager + ProviderDashboard + ProviderMarketplace + OpenRouterPanel | 4 Ñ‚Ð¾Ñ‡ÐºÐ¸ | ðŸŸ¡ MED |
| **Generated wiki files** | `wiki-articles.ts` (5K) + `wiki-components.ts` (4K) + `wiki-connections.ts` (1.5K) | generated | ðŸŸ¢ LOW (auto) |
| **Inline-ÑÑ‚Ð¸Ð»Ð¸ Ñ Ñ†Ð²ÐµÑ‚Ð¾Ð²Ñ‹Ð¼Ð¸ Ð»Ð¸Ñ‚ÐµÑ€Ð°Ð»Ð°Ð¼Ð¸** | `'#3b82f6'`, `'#10b981'` Ð² Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¸Ñ… Ð¿Ð°Ð½ÐµÐ»ÑÑ… | violation of `fa-02` token convention | ðŸŸ¡ LOW-MED |

**Ð¢ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ diff TechniquePanels:**

```bash
$ diff <(sed -E 's/humor|Humor/XXX/g' HumorPanel.tsx) \
       <(sed -E 's/critic|Critic/XXX/g' CriticPanel.tsx) | wc -l
4
```

Ð¢Ð¾Ð»ÑŒÐºÐ¾ 4 ÑÑ‚Ñ€Ð¾ÐºÐ¸ Ñ€Ð°Ð·Ð»Ð¸Ñ‡Ð¸Ð¹ (TECHNIQUE_ID, CATEGORY, name, mode). **Ð­Ñ‚Ð¾ ÑÐ²Ð½Ñ‹Ð¹ ÐºÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚ Ð½Ð° Ñ€ÐµÑ„Ð°ÐºÑ‚Ð¾Ñ€Ð¸Ð½Ð³** â€” Ð²Ñ‹Ð½ÐµÑÑ‚Ð¸ Ð² `<TechniquePanel techniqueId="humor" />` generic-ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚.

### 5.7. Ð¡Ð¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ Ñ‚ÐµÑÑ‚Ð¾Ð²

**ÐžÑ†ÐµÐ½ÐºÐ°: 6/10**

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | ÐžÑ†ÐµÐ½ÐºÐ° |
|---|---:|---|
| Unit/ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð½Ñ‹Ñ… Ñ‚ÐµÑÑ‚Ð¾Ð² | 486 | ðŸŸ¡ |
| E2E specs | 17 | ðŸŸ¢ Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾ |
| Total tests | 514 | ðŸŸ¡ ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾ |
| Test files Ð² components | 164 | ðŸŸ¡ |
| ÐšÐ°Ñ‚Ð°Ð»Ð¾Ð³Ð¾Ð² Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ Ñ Ñ‚ÐµÑÑ‚Ð¾Ð¼ | 104 / ~180 | ðŸŸ¡ 58% |
| Stable CI gate | 34 Ð¿ÑƒÑ‚Ð¸ | ðŸŸ¡ |
| Coverage threshold | Ð½Ðµ Ð·Ð°Ð´Ð°Ð½ | ðŸ”´ Ð½ÐµÑ‚ gate |
| Tests stale | Ð½ÐµÑÐºÐ¾Ð»ÑŒÐºÐ¾ (diagnostics.md Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´Ð°ÐµÑ‚) | ðŸŸ¡ |
| `test:stable` pool | `forks` (vmThreads lacks `crypto.subtle`) | ðŸŸ¢ workaround ÐµÑÑ‚ÑŒ |

**Coverage Ð¿Ð¾ ÑÐ»Ð¾ÑÐ¼** (Ð¸Ð· `dev-tests-catalog.md`):

| ÐžÐ±Ð»Ð°ÑÑ‚ÑŒ | Ð¢ÐµÑÑ‚Ð¾Ð² |
|---|---:|
| `src/kernel` | 290 |
| `src/components` | 157 |
| `src/llm` | 20 |
| `src/stores` | 14 |
| `src/hooks` | 3 |
| `src/i18n` | 1 |
| `src` (root) | 1 |

**ÐŸÑ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹ Ñ‚ÐµÑÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ:**

1. **Coverage threshold Ð½Ðµ Ð·Ð°Ð´Ð°Ð½ Ð² CI** â€” `test:coverage` Ð·Ð°Ð¿ÑƒÑÐºÐ°ÐµÑ‚ÑÑ, Ð½Ð¾ gate Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½. Coverage Ð¼Ð¾Ð¶ÐµÑ‚ Ð¿Ð°Ð´Ð°Ñ‚ÑŒ Ñ‚Ð¸Ñ…Ð¾.
2. **Ð¢Ð¾Ð»ÑŒÐºÐ¾ 34 Ð¿ÑƒÑ‚Ð¸ Ð² `test:stable`** â€” Ð¼Ð½Ð¾Ð³Ð¸Ðµ ÐºÐ¾Ð¼Ð¿Ð¾Ð½ÐµÐ½Ñ‚Ð½Ñ‹Ðµ Ñ‚ÐµÑÑ‚Ñ‹ ÑÑƒÑ‰ÐµÑÑ‚Ð²ÑƒÑŽÑ‚, Ð½Ð¾ **Ð½Ðµ Ð² CI gate** (`dev-status-testing.md` Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´Ð°ÐµÑ‚).
3. **`vmThreads` pool lacks `crypto.subtle`** â€” workaround Ñ‡ÐµÑ€ÐµÐ· `forks` pool, Ð½Ð¾ ÐµÑÑ‚ÑŒ Â«environment issues with forks pool when running with high parallelismÂ».
4. **`panel-smoke-tests.test.tsx`** â€” Ð¿Ð¾ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 6 Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹ (BudgetPanel, CostOptimizationPanel, DebateAnalysisPanel, RotationsPanel, WebhooksPanel, DecisionLogPanel) Ð¸Ð· ~268.
5. **`technique-panels-smoke.test.tsx`** â€” Ð¿Ð¾ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ 62 Ñ‚ÐµÑ…Ð½Ð¸ÐºÐ¸, Ð½Ð¾ Ñ‚Ð¾Ð»ÑŒÐºÐ¾ render (Ð½Ðµ Ð»Ð¾Ð³Ð¸ÐºÑƒ).
6. **17 E2E specs** â€” Ñ…Ð¾Ñ€Ð¾ÑˆÐ¾: data-chat, data-debate, data-dialogs, data-fleet, data-forum, data-health, data-keys, data-knowledge, data-organizer, data-projects, data-research, data-room, data-runtime, data-sync, routes-a-flow, routes-b-flow, basic-flow.

### 5.8. Ð£ÑÐ·Ð²Ð¸Ð¼Ð¾ÑÑ‚Ð¸ Ð¸ Ñ€Ð¸ÑÐºÐ¸

**ÐžÑ†ÐµÐ½ÐºÐ°: 6/10**

| Ð Ð¸ÑÐº | Severity | Ð“Ð´Ðµ | Ð¡Ñ‚Ð°Ñ‚ÑƒÑ |
|---|:---:|---|---|
| **API keys Ð² plaintext Ð² IndexedDB** | ðŸ”´ HIGH | design choice (single-user) | KNOWN, Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¾ Ð² README Ð¸ diagnostics.md |
| **Sandbox code execution** (`sandbox-interpreter.ts` 1 906 ÑÑ‚Ñ€Ð¾Ðº) | ðŸŸ¡ MED | `kernel/workers/` | ðŸŸ¢ mitigated: `validateSandboxCode()` Ð±Ð°Ð½Ð½Ð¸Ñ‚ `eval()` Ð¸ `new Function()` (ÑÐ¼. tests); Web Worker isolation; CSP |
| **innerHTML usage** | ðŸŸ¢ LOW | 7 ÑÐ»ÑƒÑ‡Ð°ÐµÐ², 5 Ð² tests, 2 Ð² production | ðŸŸ¢ mitigated: 56 DOMPurify usages |
| **localStorage plain-text** | ðŸŸ¡ LOW-MED | 80 ÑÐ»ÑƒÑ‡Ð°ÐµÐ² (prefs, SRE keyId) | ðŸŸ¡ acceptable for non-secret prefs |
| **External fetch** | ðŸŸ¢ LOW | 4 ÑÐ»ÑƒÑ‡Ð°Ñ | ðŸŸ¢ acceptable |
| **`@google/generative-ai@^0.24.1`** (pre-1.0) | ðŸŸ¡ MED | package.json | ðŸŸ¡ supply-chain risk |
| **Mock services Ð² code path** | ðŸŸ¡ LOW | DemoGate + `featureFlags.mockServices.enabled` | ðŸŸ¢ gated |
| **No hardcoded secrets Ð² ÐºÐ¾Ð´Ðµ** | ðŸŸ¢ | Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² `prompt-security-service.test.ts` (testing detection) | ðŸŸ¢ Ð¾Ñ‚Ð»Ð¸Ñ‡Ð½Ð¾ |
| **`@ts-ignore` Ñ‚Ð¾Ð»ÑŒÐºÐ¾ 1** | ðŸŸ¢ | type safety ÑÐ¸Ð»ÑŒÐ½Ð°Ñ | ðŸŸ¢ |
| **`throw new Error` 992** | ðŸŸ¢ | Ñ…Ð¾Ñ€Ð¾ÑˆÐ°Ñ error-ÐºÑƒÐ»ÑŒÑ‚ÑƒÑ€Ð° | ðŸŸ¢ |
| **Security audit CI job** | ðŸŸ¢ | `.github/workflows/ci.yml` | ðŸŸ¢ ÐµÑÑ‚ÑŒ |
| **`eslint-disable` 256** | ðŸŸ¡ | Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ Ñ€ÐµÐ²ÑŒÑŽ | ðŸŸ¡ unknown content |
| **Unbounded providers by default** | ðŸŸ¡ MED | diagnostics.md | KNOWN |
| **Husky + commitlint** | ðŸŸ¢ | conventional commits enforced | ðŸŸ¢ |
| **dependabot** | Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½ | â€” | ðŸ”´ Ð½ÐµÑ‚ auto-dependency-update |

**Security CI:** `npm audit` presumably Ð² Security Audit job. `check:deps` (dependency-cruiser) ÐºÐ¾Ð½Ñ‚Ñ€Ð¾Ð»Ð¸Ñ€ÑƒÐµÑ‚ Ð°Ñ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð½Ñ‹Ðµ Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸.

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ security-Ñ€Ð¸ÑÐºÐ¸:**
1. **API keys plaintext** â€” design choice Ð´Ð»Ñ single-user, Ð½Ð¾ **ÐµÑÐ»Ð¸ ÐºÑ‚Ð¾-Ñ‚Ð¾ Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ñ‚ Ð´Ð¾ÑÑ‚ÑƒÐ¿ Ðº IndexedDB â€” Ð²ÑÐµ ÐºÐ»ÑŽÑ‡Ð¸ Ð²Ð¸Ð´Ð½Ñ‹**. README ÑÐ²Ð½Ð¾ Ð¿Ñ€ÐµÐ´ÑƒÐ¿Ñ€ÐµÐ¶Ð´Ð°ÐµÑ‚: Â«Ð½Ðµ Ð¸ÑÐ¿Ð¾Ð»ÑŒÐ·Ð¾Ð²Ð°Ñ‚ÑŒ Ð½Ð° Ð¾Ð±Ñ‰Ð¸Ñ… Ð¼Ð°ÑˆÐ¸Ð½Ð°Ñ…Â».
2. **`@google/generative-ai` pre-1.0** â€” supply-chain risk.
3. **`sandbox-interpreter.ts` 1 906 ÑÑ‚Ñ€Ð¾Ðº** â€” security-critical ÐºÐ¾Ð´, Ñ‚Ñ€ÐµÐ±ÑƒÑŽÑ‰Ð¸Ð¹ audit.

**Ð¥Ð¾Ñ€Ð¾ÑˆÐ¸Ðµ security-Ð¿Ñ€Ð°ÐºÑ‚Ð¸ÐºÐ¸:**
- DOMPurify Ð´Ð»Ñ HTML sanitization
- Web Worker + CSP Ð´Ð»Ñ sandbox
- `validateSandboxCode()` ban list
- `key-vault` service (ÐµÑÑ‚ÑŒ Ñ‚ÐµÑÑ‚ `key-vault.test.ts` Ð² stable gate)
- `local-secret-store` + `external-secrets-service` (ÐµÑÑ‚ÑŒ Ñ‚ÐµÑÑ‚Ñ‹)
- `prompt-security-service` (ÐµÑÑ‚ÑŒ Ñ‚ÐµÑÑ‚Ñ‹ â€” detect leaked keys Ð² prompts)
- Husky pre-commit hooks
- `persist-credentials: false` Ð² CI checkout (L-9)

---

## 6. Ð¢Ð¾Ð¿-10 complexity hotspots â€” Ð¿Ñ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚Ñ‹ Ñ€ÐµÑ„Ð°ÐºÑ‚Ð¾Ñ€Ð¸Ð½Ð³Ð°

| # | Ð¤Ð°Ð¹Ð» | LOC | ÐŸÐ¾Ñ‡ÐµÐ¼Ñƒ Ð²Ð°Ð¶Ð½Ð¾ |
|---|---|---:|---|
| 1 | `kernel/services/dexie-schema.ts` | 3 764 | Schema Ð¼Ð¾Ð½Ð¾Ð»Ð¸Ñ‚ â€” Ñ€Ð°Ð·Ð±Ð¸Ñ‚ÑŒ Ð½Ð° per-table definitions |
| 2 | `kernel/workers/sandbox-interpreter.ts` | 1 906 | Security-critical, Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ audit + decomposition |
| 3 | `kernel/services/key-management/key-service.ts` | 1 098 | Security-critical, manage keys |
| 4 | `kernel/services/agent-service.ts` | 1 234 | Core service, central |
| 5 | `kernel/services/debate-runtime/debate-llm-prompt-context.ts` | 1 392 | Prompt construction logic |
| 6 | `kernel/services/research-adapters/source-adapters.ts` | 1 291 | Adapters bundle |
| 7 | `FleetPanel/FleetPanel.tsx` | 1 235 | Largest UI panel |
| 8 | `PolicyPanel/PolicyPanel.tsx` | 1 184 | UI complexity |
| 9 | `kernel/services/memory-engine.ts` | 1 088 | Core memory logic |
| 10 | `kernel/services/key-management/key-registry.ts` | 942 | Key registry |

**Ð’ÑÐµ 10 â€” Ð² `kernel/services/` ÐºÑ€Ð¾Ð¼Ðµ 2 UI-Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹.** Ð­Ñ‚Ð¾ Ð·Ð½Ð°Ñ‡Ð¸Ñ‚, Ñ‡Ñ‚Ð¾ **ÑÐ´Ñ€Ð¾ â€” Ð³Ð»Ð°Ð²Ð½Ñ‹Ð¹ ÐºÐ°Ð½Ð´Ð¸Ð´Ð°Ñ‚ Ð½Ð° Ñ€ÐµÑ„Ð°ÐºÑ‚Ð¾Ñ€Ð¸Ð½Ð³**.

---

## 7. Ð¢ÐµÑ…Ð´Ð¾Ð»Ð³-Ñ€ÐµÐµÑÑ‚Ñ€ (Ð¿Ð¾ Ð¿Ñ€Ð¸Ð¾Ñ€Ð¸Ñ‚ÐµÑ‚Ð°Ð¼)

### P0 â€” ÐºÑ€Ð¸Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð´Ð¾Ð»Ð³ (Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ Ð²Ð½Ð¸Ð¼Ð°Ð½Ð¸Ñ)

| # | Ð”Ð¾Ð»Ð³ | Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ |
|---|---|---|
| 1 | API keys plaintext Ð² IndexedDB | Ð”Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ warning (ÑƒÐ¶Ðµ ÐµÑÑ‚ÑŒ) + Ñ€Ð°ÑÑÐ¼Ð°Ñ‚Ñ€Ð¸Ð²Ð°Ñ‚ÑŒ WebCrypto encryption Ð´Ð»Ñ multi-user future |
| 2 | `dexie-schema.ts` 3 764 ÑÑ‚Ñ€Ð¾ÐºÐ¸ Ð¼Ð¾Ð½Ð¾Ð»Ð¸Ñ‚ | Ð Ð°Ð·Ð±Ð¸Ñ‚ÑŒ Ð½Ð° per-table schema files |
| 3 | `sandbox-interpreter.ts` 1 906 ÑÑ‚Ñ€Ð¾Ðº security-critical | Ð’Ð½ÐµÑˆÐ½Ð¸Ð¹ security audit + decomposition |
| 4 | 5 600-warning lint baseline | Ð¡Ð½Ð¸Ð·Ð¸Ñ‚ÑŒ Ð´Ð¾ < 1000 Ð·Ð° ÐºÐ²Ð°Ñ€Ñ‚Ð°Ð» |
| 5 | Coverage threshold Ð½Ðµ Ð·Ð°Ð´Ð°Ð½ Ð² CI | Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ minimum coverage gate (80% kernel, 60% components) |

### P1 â€” Ð²Ð°Ð¶Ð½Ñ‹Ð¹ Ð´Ð¾Ð»Ð³

| # | Ð”Ð¾Ð»Ð³ | Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ |
|---|---|---|
| 6 | 62 Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ‡Ð½Ñ‹Ðµ TechniquePanels | Ð ÐµÑ„Ð°ÐºÑ‚Ð¾Ñ€Ð¸Ð½Ð³ Ð² generic `<TechniquePanel id="â€¦" />` |
| 7 | `dev-status-*.md` Ð¿ÑƒÑÑ‚Ñ‹Ðµ (5 Ñ„Ð°Ð¹Ð»Ð¾Ð²) | Ð—Ð°Ð¿Ð¾Ð»Ð½Ð¸Ñ‚ÑŒ Ð¸Ð»Ð¸ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¸Ð· wiki-Ð¼ÐµÐ½ÑŽ |
| 8 | Tests stale (ChatPanel, ProviderManager) | ÐŸÐ¾Ñ‡Ð¸Ð½Ð¸Ñ‚ÑŒ harness'Ñ‹ |
| 9 | HealthSlaService `@deprecated MOCK` | Ð›Ð¸Ð±Ð¾ Ñ€ÐµÐ°Ð»Ð¸Ð·Ð¾Ð²Ð°Ñ‚ÑŒ, Ð»Ð¸Ð±Ð¾ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ |
| 10 | Stub-Ð¿Ð°Ð½ÐµÐ»Ð¸: Governance, OpenRouter, SocialLeaderboard | Ð Ð°ÑÑˆÐ¸Ñ€Ð¸Ñ‚ÑŒ Ð¸Ð»Ð¸ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ |
| 11 | `@google/generative-ai` pre-1.0 | Pin Ð²ÐµÑ€ÑÐ¸Ñ + Ð¼Ð¾Ð½Ð¸Ñ‚Ð¾Ñ€Ð¸Ñ‚ÑŒ breaking changes |
| 12 | 828 type escapes | Ð ÐµÐ²ÑŒÑŽ, Ð·Ð°Ð¼ÐµÐ½Ð¸Ñ‚ÑŒ Ð½Ð° proper types Ð³Ð´Ðµ Ð²Ð¾Ð·Ð¼Ð¾Ð¶Ð½Ð¾ |

### P2 â€” Ð¼Ð¸Ð½Ð¾Ñ€Ð½Ñ‹Ð¹ Ð´Ð¾Ð»Ð³

| # | Ð”Ð¾Ð»Ð³ | Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ |
|---|---|---|
| 13 | 256 eslint-disable | Ð ÐµÐ²ÑŒÑŽ ÑÐ¾Ð´ÐµÑ€Ð¶Ð¸Ð¼Ð¾Ð³Ð¾ |
| 14 | 101 deferred issue Ð¸Ð· zone audits | ÐŸÐ¾ÑÑ‚ÐµÐ¿ÐµÐ½Ð½Ð¾ Ð·Ð°ÐºÑ€Ñ‹Ð²Ð°Ñ‚ÑŒ |
| 15 | i18n Ð¿Ñ€Ð¾Ð±ÐµÐ»Ñ‹ (Ð°Ð½Ð³Ð»Ð¸Ð¹ÑÐºÐ¸Ðµ ÑÑ‚Ñ€Ð¾ÐºÐ¸ Ð² RU-Ð¿Ð°Ð½ÐµÐ»ÑÑ…) | Ð›Ð¾ÐºÐ°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ |
| 16 | Multiple budget/health/provider panels overlap | ÐžÐ±ÑŠÐµÐ´Ð¸Ð½Ð¸Ñ‚ÑŒ (ÑÐ¼. Feature Value Map) |
| 17 | `docs/audits/` Ð¿ÑƒÑÑ‚Ð°Ñ | Ð—Ð°Ð²ÐµÑÑ‚Ð¸ audit reports |
| 18 | Dependabot Ð½Ðµ Ð½Ð°ÑÑ‚Ñ€Ð¾ÐµÐ½ | Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ auto-PR Ð´Ð»Ñ deps |

---

## 8. Ð¡Ð²Ð¾Ð´Ð½Ð°Ñ Ð¾Ñ†ÐµÐ½Ð¾Ñ‡Ð½Ð°Ñ Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ð° Ð¿Ð¾ 8 ÐºÑ€Ð¸Ñ‚ÐµÑ€Ð¸ÑÐ¼

| # | ÐšÑ€Ð¸Ñ‚ÐµÑ€Ð¸Ð¹ | ÐžÑ†ÐµÐ½ÐºÐ° | Ð“Ð»Ð°Ð²Ð½Ð¾Ðµ Ð´Ð¾ÐºÐ°Ð·Ð°Ñ‚ÐµÐ»ÑŒÑÑ‚Ð²Ð¾ |
|---|---|:---:|---|
| 1 | ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð¸Ð·Ð²ÐµÑÑ‚Ð½Ñ‹Ñ… Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼ | **6/10** | 199 fixed + 101 deferred + 5 global + ~17 uninvestigated â‰ˆ 322 problem-points |
| 2 | ÐšÑ€Ð¸Ñ‚Ð¸Ñ‡Ð½Ð¾ÑÑ‚ÑŒ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼ | **7/10** | P0 Ð² production Ð½Ðµ Ð½Ð°Ð¹Ð´ÐµÐ½Ð¾; Ð²ÑÐµ ÐºÑ€Ð¸Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ ÑƒÐ¶Ðµ fixed Ð² CHANGELOG |
| 3 | Ð¢ÐµÑ…Ð½Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð´Ð¾Ð»Ð³ | **6/10** | 101 deferred, 1 MOCK, 3 stubs, 62 duplicated panels, 18 files >1000 LOC |
| 4 | Ð¡Ð»Ð¾Ð¶Ð½Ð¾ÑÑ‚ÑŒ ÐºÐ¾Ð´Ð° | **6/10** | 169 files >500 LOC, 18 >1000 LOC; `dexie-schema` 3764, `sandbox` 1906 |
| 5 | ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð·Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚ÐµÐ¹ | **8/10** | 58 deps (25 prod + 33 dev), Ð²ÑÐµ major stable; risk: `@google/generative-ai` pre-1.0 |
| 6 | ÐÐ°Ð»Ð¸Ñ‡Ð¸Ðµ Ð´ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ñ | **5/10** | 62 Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ‡Ð½Ñ‹Ðµ TechniquePanels (diff=4 ÑÑ‚Ñ€Ð¾ÐºÐ¸); 5 budget / 4 health / 4 provider UI overlap |
| 7 | Ð¡Ð¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ Ñ‚ÐµÑÑ‚Ð¾Ð² | **6/10** | 514 tests (486 unit + 17 e2e), 104/180 panel dirs tested, Ð½Ð¾ coverage threshold Ð½Ðµ Ð·Ð°Ð´Ð°Ð½, tests stale |
| 8 | Ð£ÑÐ·Ð²Ð¸Ð¼Ð¾ÑÑ‚Ð¸ Ð¸ Ñ€Ð¸ÑÐºÐ¸ | **6/10** | API keys plaintext (design), DOMPurify 56, sandbox CSP, security CI job; risk: sandbox code, pre-1.0 dep |
| **Overall** | | **6.9/10** | Ð—Ñ€ÐµÐ»Ð¾, Ñ Ð¸Ð·Ð¼ÐµÑ€Ð¸Ð¼Ñ‹Ð¼ ÐºÐ¾Ð½Ñ‚Ñ€Ð¾Ð»Ð¸Ñ€ÑƒÐµÐ¼Ñ‹Ð¼ Ð´Ð¾Ð»Ð³Ð¾Ð¼ |

---

## 9. Ð ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ð¸

### Ð‘Ñ‹ÑÑ‚Ñ€Ñ‹Ðµ Ð¿Ð¾Ð±ÐµÐ´Ñ‹ (high-ROI, low-effort)

1. **Ð—Ð°Ð¿Ð¾Ð»Ð½Ð¸Ñ‚ÑŒ `dev-status-*.md`** (5 Ñ„Ð°Ð¹Ð»Ð¾Ð² ÑÐµÐ¹Ñ‡Ð°Ñ Ð¿ÑƒÑÑ‚Ñ‹Ðµ Â«Ñ‚ÐµÐºÑÑ‚ Ð² Ñ€Ð°Ð·Ñ€Ð°Ð±Ð¾Ñ‚ÐºÐµÂ»). Ð›Ð¸Ð±Ð¾ Ð·Ð°Ð¿Ð¾Ð»Ð½Ð¸Ñ‚ÑŒ, Ð»Ð¸Ð±Ð¾ ÑƒÐ´Ð°Ð»Ð¸Ñ‚ÑŒ Ð¸Ð· wiki-Ð½Ð°Ð²Ð¸Ð³Ð°Ñ†Ð¸Ð¸. Ð¡ÐµÐ¹Ñ‡Ð°Ñ ÑÑ‚Ð¾ ÑÐ¾Ð·Ð´Ð°Ñ‘Ñ‚ Ð²Ð¿ÐµÑ‡Ð°Ñ‚Ð»ÐµÐ½Ð¸Ðµ Ð½ÐµÐ·Ð°Ð²ÐµÑ€ÑˆÑ‘Ð½Ð½Ð¾ÑÑ‚Ð¸.
2. **Ð—Ð°Ð²ÐµÑÑ‚Ð¸ `docs/audits/`** Ñ Ñ…Ð¾Ñ‚Ñ Ð±Ñ‹ 1 Ð°ÑƒÐ´Ð¸Ñ‚Ð¾Ð¼ (security Ð¸Ð»Ð¸ complexity). ÐŸÐ°Ð¿ÐºÐ° Ð¿ÑƒÑÑ‚Ð°Ñ.
3. **Ð¡Ð½Ð¸Ð·Ð¸Ñ‚ÑŒ lint warning baseline** Ñ 5600 Ð´Ð¾ 4000 Ð·Ð° ÑÐ¿Ñ€Ð¸Ð½Ñ‚ ( delegated cleanup). `-max-warnings 5600` â€” ÑÑ‚Ð¾ Ð·ÐµÐ»Ñ‘Ð½Ñ‹Ð¹ light Ð´Ð»Ñ ÐºÐ¾Ð¿Ð»ÐµÐ½Ð¸Ñ.
4. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ coverage threshold** Ð² CI: `npm run test:coverage` ÑƒÐ¶Ðµ Ð·Ð°Ð¿ÑƒÑÐºÐ°ÐµÑ‚ÑÑ, Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ `--check-coverage --lines 70 --branches 60`.
5. **Ð£Ð´Ð°Ð»Ð¸Ñ‚ÑŒ `OpenRouterPanel.tsx`** (29 ÑÑ‚Ñ€Ð¾Ðº, Ð´ÑƒÐ±Ð»Ð¸ÐºÐ°Ñ‚) Ð¸ `SocialLeaderboardPanel.tsx` (34 ÑÑ‚Ñ€Ð¾ÐºÐ¸, Ð¾Ð±Ñ‘Ñ€Ñ‚ÐºÐ°). Ð­Ñ‚Ð¾ Ñ‡Ð¸ÑÑ‚Ð°Ñ Ñ‡Ð¸ÑÑ‚ÐºÐ°.
6. **Pin `@google/generative-ai`** Ðº ÐºÐ¾Ð½ÐºÑ€ÐµÑ‚Ð½Ð¾Ð¹ Ð²ÐµÑ€ÑÐ¸Ð¸ + Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Ñ‚ÐµÑÑ‚ Ð½Ð° API compatibility.
7. **Ð”Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ Dependabot config** (`.github/dependabot.yml`) Ð´Ð»Ñ auto-PR Ð½Ð° dep updates.

### Ð¡Ñ€ÐµÐ´Ð½ÐµÑÑ€Ð¾Ñ‡Ð½Ñ‹Ðµ (ÐºÐ²Ð°Ñ€Ñ‚Ð°Ð»)

8. **Ð ÐµÑ„Ð°ÐºÑ‚Ð¾Ñ€Ð¸Ð½Ð³ TechniquePanels** â€” Ð²Ñ‹Ð½ÐµÑÑ‚Ð¸ Ð² generic `<TechniquePanel techniqueId="humor" />`. Ð¡ÑÐºÐ¾Ð½Ð¾Ð¼Ð¸Ñ‚ ~14 500 LOC Ð¸ ÑÐ´ÐµÐ»Ð°ÐµÑ‚ Ð´Ð¾Ð±Ð°Ð²Ð»ÐµÐ½Ð¸Ðµ Ð½Ð¾Ð²Ñ‹Ñ… Ñ‚Ñ€Ð¸Ð²Ð¸Ð°Ð»ÑŒÐ½Ñ‹Ð¼.
9. **Ð”ÐµÐºÐ¾Ð¼Ð¿Ð¾Ð·Ð¸Ñ†Ð¸Ñ `dexie-schema.ts`** (3 764 ÑÑ‚Ñ€Ð¾ÐºÐ¸) â€” Ñ€Ð°Ð·Ð±Ð¸Ñ‚ÑŒ Ð½Ð° per-table schema files (`dexie-schema/keys.ts`, `dexie-schema/chat.ts`, Ð¸ Ñ‚.Ð´.).
10. **Security audit `sandbox-interpreter.ts`** (1 906 ÑÑ‚Ñ€Ð¾Ðº) â€” Ð²Ð½ÐµÑˆÐ½Ð¸Ð¹ review, Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚ÑŒ fuzzing tests.
11. **Ð—Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ 101 deferred issue** Ð¸Ð· zone audits â€” schedule Ð¿Ð¾ 10 Ð·Ð° ÑÐ¿Ñ€Ð¸Ð½Ñ‚ = 10 ÑÐ¿Ñ€Ð¸Ð½Ñ‚Ð¾Ð².
12. **ÐŸÐ¾Ñ‡Ð¸Ð½Ð¸Ñ‚ÑŒ stale tests** (ChatPanel, ProviderManager harnesses).
13. **ÐžÐ±ÑŠÐµÐ´Ð¸Ð½Ð¸Ñ‚ÑŒ 5 budget / 4 health / 4 provider panels** (ÑÐ¼. Feature Value Map Ñ€ÐµÐºÐ¾Ð¼ÐµÐ½Ð´Ð°Ñ†Ð¸Ð¸).

### Ð¡Ñ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ñ‡ÐµÑÐºÐ¸Ðµ

14. **Ð’Ð½ÐµÐ´Ñ€Ð¸Ñ‚ÑŒ formal issue tracker** â€” ÑÐµÐ¹Ñ‡Ð°Ñ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼Ñ‹ Ñ€Ð°Ð·Ð±Ñ€Ð¾ÑÐ°Ð½Ñ‹ Ð¿Ð¾ 26 zone audits + `diagnostics.md` + `dev-status-*.md` (Ð¿ÑƒÑÑ‚Ñ‹Ðµ) + CHANGELOG. Ð•Ð´Ð¸Ð½Ð¾Ð³Ð¾ Ñ€ÐµÐµÑÑ‚Ñ€Ð° Ð½ÐµÑ‚. GitHub Issues Ñ labels `P0/P1/P2`, `bug/debt/feature` â€” Ð¸ ÑÑÑ‹Ð»ÐºÐ°Ð¼Ð¸ Ð½Ð° zone audits.
15. **Coverage dashboard** â€” Ð¾Ð¿ÑƒÐ±Ð»Ð¸ÐºÐ¾Ð²Ð°Ñ‚ÑŒ coverage report (Codecov / Coveralls) Ð´Ð»Ñ Ð¿Ñ€Ð¾Ð·Ñ€Ð°Ñ‡Ð½Ð¾ÑÑ‚Ð¸.
16. **Complexity budget** â€” ÑƒÑÑ‚Ð°Ð½Ð¾Ð²Ð¸Ñ‚ÑŒ Ð»Ð¸Ð¼Ð¸Ñ‚: Ð½Ð¸ Ð¾Ð´Ð¸Ð½ Ñ„Ð°Ð¹Ð» Ð½Ðµ Ð´Ð¾Ð»Ð¶ÐµÐ½ Ð¿Ñ€ÐµÐ²Ñ‹ÑˆÐ°Ñ‚ÑŒ 1000 ÑÑ‚Ñ€Ð¾Ðº Ð±ÐµÐ· ADR (Architecture Decision Record).
17. **Migration plan Ð´Ð»Ñ API keys** â€” Ð´Ð°Ð¶Ðµ Ð´Ð»Ñ single-user, Ñ€Ð°ÑÑÐ¼Ð¾Ñ‚Ñ€ÐµÑ‚ÑŒ WebCrypto encryption Ð´Ð»Ñ at-rest keys. Ð­Ñ‚Ð¾ Ð·Ð°ÐºÑ€Ð¾ÐµÑ‚ Ð³Ð»Ð°Ð²Ð½Ñ‹Ð¹ security risk.
18. **Ð’Ð½ÐµÑˆÐ½Ð¸Ð¹ security audit** â€” Ð´Ð»Ñ Ð¿Ñ€Ð¾ÐµÐºÑ‚Ð° Ñ‚Ð°ÐºÐ¾Ð³Ð¾ Ñ€Ð°Ð·Ð¼ÐµÑ€Ð° Ð¸ Ñ security-critical ÐºÐ¾Ð´Ð¾Ð¼ (sandbox, keys, prompt-security), Ñ€Ð°Ð·Ð¾Ð²Ñ‹Ð¹ Ð²Ð½ÐµÑˆÐ½Ð¸Ð¹ audit Ð±ÑƒÐ´ÐµÑ‚ Ð¿Ð¾Ð»ÐµÐ·ÐµÐ½.

---

## 10. Ð˜Ñ‚Ð¾Ð³Ð¾Ð²Ñ‹Ð¹ Ð²ÐµÑ€Ð´Ð¸ÐºÑ‚ Ð¿Ð¾ Ð·Ð´Ð¾Ñ€Ð¾Ð²ÑŒÑŽ ÐºÐ¾Ð´Ð°

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | ÐžÑ†ÐµÐ½ÐºÐ° |
|---|:---:|
| Ð¡Ð°Ð½Ð¸Ñ‚Ð°Ñ€Ð½Ð¾Ðµ ÑÐ¾ÑÑ‚Ð¾ÑÐ½Ð¸Ðµ (TODO/FIXME/HACK) | ðŸŸ¢ðŸŸ¢ 9/10 |
| ÐÑ€Ñ…Ð¸Ñ‚ÐµÐºÑ‚ÑƒÑ€Ð° (DI, EventBus, contracts) | ðŸŸ¢ 8/10 |
| CI/CD Ð·Ñ€ÐµÐ»Ð¾ÑÑ‚ÑŒ | ðŸŸ¢ 8/10 (5 jobs + security + circular + deps) |
| Ð¢ÐµÑÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ | ðŸŸ¡ 6/10 (ÑƒÐ¼ÐµÑ€ÐµÐ½Ð½Ð¾, Ð±ÐµÐ· coverage gate) |
| Ð¡Ð»Ð¾Ð¶Ð½Ð¾ÑÑ‚ÑŒ | ðŸŸ¡ 6/10 (18 hotspots) |
| Ð”ÑƒÐ±Ð»Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ | ðŸŸ¡ 5/10 (62 Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ‡Ð½Ñ‹Ðµ + overlapping UIs) |
| Security | ðŸŸ¡ 6/10 (plaintext keys + pre-1.0 dep, Ð½Ð¾ Ñ…Ð¾Ñ€Ð¾ÑˆÐ¸Ðµ mitigations) |
| Ð”Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼ | ðŸŸ¢ 8/10 (26 zone audits + diagnostics, Ð½Ð¾ dev-status Ð¿ÑƒÑÑ‚Ñ‹Ðµ) |
| Ð¢ÐµÑ…Ð´Ð¾Ð»Ð³ | ðŸŸ¡ 6/10 (controlled, Ð¸Ð·Ð¼ÐµÑ€Ð¸Ð¼Ñ‹Ð¹, Ð½Ð¾ copÐ¸Ñ‚ÑÑ) |

**Overall Health Score: 6.9 / 10** â€” Ð·Ñ€ÐµÐ»Ð°Ñ ÐºÐ¾Ð´Ð¾Ð²Ð°Ñ Ð±Ð°Ð·Ð° Ñ Ð¸Ð·Ð¼ÐµÑ€Ð¸Ð¼Ñ‹Ð¼ ÐºÐ¾Ð½Ñ‚Ñ€Ð¾Ð»Ð¸Ñ€ÑƒÐµÐ¼Ñ‹Ð¼ Ð´Ð¾Ð»Ð³Ð¾Ð¼.

**Ð¡Ñ€Ð°Ð²Ð½ÐµÐ½Ð¸Ðµ Ñè¡Œä¸šæ ‡å‡†:**

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | SuperAgents OS | Ð¢Ð¸Ð¿Ð¸Ñ‡Ð½Ñ‹Ð¹ Ð·Ñ€ÐµÐ»Ñ‹Ð¹ Ð¿Ñ€Ð¾ÐµÐºÑ‚ | Verdict |
|---|:---:|:---:|---|
| TODO per KLOC | 0.004 | 0.1â€“1.0 | ðŸŸ¢ðŸŸ¢ Ð² 25â€“250 Ñ€Ð°Ð· Ñ‡Ð¸Ñ‰Ðµ |
| `@ts-ignore` per KLOC | 0.002 | 0.05â€“0.5 | ðŸŸ¢ðŸŸ¢ Ð² 25â€“250 Ñ€Ð°Ð· Ñ‡Ð¸Ñ‰Ðµ |
| Files > 1000 LOC | 18 (0.6%) | 1â€“3% | ðŸŸ¢ Ð»ÑƒÑ‡ÑˆÐµ ÑÑ€ÐµÐ´Ð½ÐµÐ³Ð¾ |
| Test-to-code ratio | 514 tests / 3114 files = 0.17 | 0.2â€“0.5 | ðŸŸ¡ Ð½Ð¸Ð¶Ðµ ÑÑ€ÐµÐ´Ð½ÐµÐ³Ð¾ |
| CI jobs | 5 + security + e2e matrix | 3â€“5 | ðŸŸ¢ Ð²Ñ‹ÑˆÐµ ÑÑ€ÐµÐ´Ð½ÐµÐ³Ð¾ |
| Dependencies | 58 | 50â€“150 | ðŸŸ¢ Ñ€Ð°Ð·ÑƒÐ¼Ð½Ð¾ |

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ ÑÐ¸Ð»ÑŒÐ½Ñ‹Ðµ ÑÑ‚Ð¾Ñ€Ð¾Ð½Ñ‹:**
- **Ð‘ÐµÑÐ¿Ñ€ÐµÑ†ÐµÐ´ÐµÐ½Ñ‚Ð½Ð¾ Ñ‡Ð¸ÑÑ‚Ñ‹Ð¹ ÐºÐ¾Ð´** Ð¿Ð¾ Ð¼Ð°Ñ€ÐºÐµÑ€Ð°Ð¼ TODO/FIXME/HACK/`@ts-ignore`
- **Ð—Ñ€ÐµÐ»Ñ‹Ð¹ CI** Ñ typecheck + lint + build + tests + coverage + security + e2e + circular-dep + dep-cruiser
- **199 Ð·Ð°Ð´Ð¾ÐºÑƒÐ¼ÐµÐ½Ñ‚Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ñ… Ð¸ÑÐ¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ð¹** â€” ÐºÑƒÐ»ÑŒÑ‚ÑƒÑ€Ð° Ð°ÑƒÐ´Ð¸Ñ‚Ð°
- **26 zone audits** â€” Ð¿Ð¾ÑˆÐ°Ð³Ð¾Ð²Ð°Ñ Ð¸ÑÑ‚Ð¾Ñ€Ð¸Ñ Ñ€Ð°Ð±Ð¾Ñ‚
- **Ð¡Ð¸Ð»ÑŒÐ½Ð°Ñ error-ÐºÑƒÐ»ÑŒÑ‚ÑƒÑ€Ð°** (992 explicit throws)
- **Security mitigations** (DOMPurify, sandbox CSP, key-vault, prompt-security-service)

**Ð“Ð»Ð°Ð²Ð½Ñ‹Ðµ Ñ€Ð¸ÑÐºÐ¸:**
- **5 600-warning lint baseline** â€” ÐºÐ¾Ð¿Ð¸Ñ‚ÑÑ Ñ‚Ð¸Ñ…Ð¾
- **Coverage threshold Ð½Ðµ Ð·Ð°Ð´Ð°Ð½** â€” Ð¼Ð¾Ð¶ÐµÑ‚ Ð¿Ð°Ð´Ð°Ñ‚ÑŒ
- **62 Ð¸Ð´ÐµÐ½Ñ‚Ð¸Ñ‡Ð½Ñ‹Ðµ TechniquePanels** â€” maintainability
- **API keys plaintext** â€” design risk
- **18 complexity hotspots** â€” Ñ‚Ñ€ÐµÐ±ÑƒÑŽÑ‚ Ñ€ÐµÑ„Ð°ÐºÑ‚Ð¾Ñ€Ð¸Ð½Ð³Ð°
- **`dev-status-*.md` Ð¿ÑƒÑÑ‚Ñ‹Ðµ** â€” Ð½ÐµÑ‚ formal issue tracking
- **`@google/generative-ai` pre-1.0** â€” supply-chain

**Ð˜Ñ‚Ð¾Ð³:** Ð¿Ñ€Ð¾ÐµÐºÑ‚ **Ð³Ð¾Ñ‚Ð¾Ð² Ðº production** Ð´Ð»Ñ single-user scenarios (ÐºÐ°Ðº Ð·Ð°ÑÐ²Ð»ÐµÐ½Ð¾ Ð² README), Ð½Ð¾ Ñ‚Ñ€ÐµÐ±ÑƒÐµÑ‚ **Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð½Ð¾Ð¹ Ñ„Ð¾ÐºÑƒÑÐ¸Ñ€Ð¾Ð²ÐºÐ¸** (ÑÐ¼. Feature Value Map) Ð¸ **Ð´Ð¾Ð»Ð³Ð¾Ð²Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾Ð¹ ÑÑ‚Ñ€Ð°Ñ‚ÐµÐ³Ð¸Ð¸ Ð¿Ð¾ ÑÐ¾ÐºÑ€Ð°Ñ‰ÐµÐ½Ð¸ÑŽ complexity hotspots Ð¸ lint baseline**.

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ A. ÐœÐµÑ‚Ñ€Ð¸ÐºÐ¸ Ð² Ñ†Ð¸Ñ„Ñ€Ð°Ñ… (Ð´Ð»Ñ ÑÑ€Ð°Ð²Ð½ÐµÐ½Ð¸Ñ)

| ÐœÐµÑ‚Ñ€Ð¸ÐºÐ° | Ð—Ð½Ð°Ñ‡ÐµÐ½Ð¸Ðµ | Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸Ðº |
|---|---:|---|
| Total TS/TSX files | 3 114 | `find src -name "*.ts" -o -name "*.tsx" \| wc -l` |
| Total LOC | 508 976 | sum of `wc -l` per file |
| Avg LOC/file | 163 | total/files |
| Files > 500 LOC | 169 | complexity indicator |
| Files > 1000 LOC | 18 | hotspot indicator |
| TODO | 2 | `grep -rE "TODO" src/` |
| FIXME | 0 | `grep -rE "FIXME" src/` |
| HACK | 0 | `grep -rE "HACK" src/` |
| `as any` / `as unknown` | 828 | `grep -rE "as (any\|unknown)"` |
| `eslint-disable` | 256 | `grep -rE "eslint-disable"` |
| `@ts-ignore` | 1 | `grep -rE "@ts-ignore"` |
| `throw new Error` | 992 | `grep -rE "throw new (Error\|TypeError)"` |
| `console.error` | 72 | `grep -rE "console.error"` |
| `console.warn` | 16 | `grep -rE "console.warn"` |
| Production deps | 25 | `package.json` |
| Dev deps | 33 | `package.json` |
| npm scripts | 48 | `package.json` |
| Unit tests | 486 | `dev-tests-catalog.md` |
| E2E specs | 17 | `ls e2e/*.spec.ts` |
| Total tests | 514 | sum |
| Test files in components | 164 | `find src/components -name "*.test.tsx"` |
| Zone audits | 26 | `ls docs/wiki/zone-*.md` |
| Fixed issues (documented) | 199 | sum across zones |
| Deferred issues | 101 | sum across zones |
| Global known issues | 5 | `diagnostics.md` |
| Lint warning CI baseline | 5600 | `.github/workflows/ci.yml` |
| CI jobs | 5 + e2e matrix | `.github/workflows/ci.yml` |
| innerHTML usages | 7 (5 Ð² tests) | `grep -rE "innerHTML"` |
| DOMPurify usages | 56 | `grep -rE "DOMPurify\|dompurify\|sanitize"` |
| localStorage usages | 80 | `grep -rE "localStorage"` |
| External fetch calls | 4 | `grep -rE "fetch\(['\"]https?://"` |
| Hardcoded API keys | 0 (Ñ‚Ð¾Ð»ÑŒÐºÐ¾ Ð² tests Ð´Ð»Ñ prompt-security) | `grep -rE "sk-[a-zA-Z0-9]{20,}"` |

---

## ÐŸÑ€Ð¸Ð»Ð¾Ð¶ÐµÐ½Ð¸Ðµ B. Ð˜ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¸ Ð¸ Ð¼ÐµÑ‚Ð¾Ð´ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐºÐ¸

| Ð§Ñ‚Ð¾ | Ð“Ð´Ðµ | ÐšÐ°Ðº Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾ |
|---|---|---|
| ÐžÐ±ÑŠÑ‘Ð¼ ÐºÐ¾Ð´Ð° | `src/**` | `find` + `wc -l` per file |
| Ð—Ð°Ð²Ð¸ÑÐ¸Ð¼Ð¾ÑÑ‚Ð¸ | `package.json` | `node -e` parse |
| ÐšÐ°Ñ‡ÐµÑÑ‚Ð²Ð¾ ÐºÐ¾Ð´Ð° | `src/**` | `grep -rE` Ð¿Ð¾ Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ð°Ð¼ |
| CI | `.github/workflows/ci.yml` | Ð¿Ð¾Ð»Ð½Ñ‹Ð¹ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| CHANGELOG | `CHANGELOG.md` | `head -100`, `grep` |
| Zone audits | `docs/wiki/zone-*.md` (26 Ñ„Ð°Ð¹Ð»Ð¾Ð²) | awk-Ñ„Ð¸Ð»ÑŒÑ‚Ñ€ Â«Ð§Ñ‚Ð¾ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÐµÐ½Ð¾Â» / Â«ÐžÑ‚Ð»Ð¾Ð¶ÐµÐ½Ð¾Â» + sum |
| Diagnostics | `docs/wiki/diagnostics.md` | Ð¿Ð¾Ð»Ð½Ñ‹Ð¹ Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ |
| Dev status | `docs/wiki/dev-status-*.md` | WebFetch (5 Ñ„Ð°Ð¹Ð»Ð¾Ð² â€” Ð¿ÑƒÑÑ‚Ñ‹Ðµ) |
| Tests | `**/*.test.tsx`, `dev-tests-catalog.md` | `find`, Ñ‡Ñ‚ÐµÐ½Ð¸Ðµ catalog |
| Hotspots | top-15 largest files | `find + wc -l + sort` |
| Duplication | TechniquePanels | `diff` Ð¿Ð¾ÑÐ»Ðµ sed-Ð½Ð¾Ñ€Ð¼Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ð¸ |
| Security | `grep` Ð¿Ð¾ 8 Ð¿Ð°Ñ‚Ñ‚ÐµÑ€Ð½Ð°Ð¼ (eval, innerHTML, fetch, localStorage, secrets) | comprehensive scan |

---

*ÐžÑ‚Ñ‡Ñ‘Ñ‚ ÑÐ³ÐµÐ½ÐµÑ€Ð¸Ñ€Ð¾Ð²Ð°Ð½ 2026-10-31 Ð½Ð° Ð¾ÑÐ½Ð¾Ð²Ðµ ÐºÐ¾Ð¼Ð¼Ð¸Ñ‚Ð° `e08ab8e`. Ð’ÑÐµ Ð¼ÐµÑ‚Ñ€Ð¸ÐºÐ¸ â€” ÑÑ‚Ð°Ñ‚Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ Ð°Ð½Ð°Ð»Ð¸Ð·; runtime-Ð¿Ð¾Ð²ÐµÐ´ÐµÐ½Ð¸Ðµ Ð¸ Ñ€ÐµÐ°Ð»ÑŒÐ½Ñ‹Ð¹ CI run Ð½Ðµ Ð¿Ñ€Ð¾Ð²ÐµÑ€ÑÐ»Ð¸ÑÑŒ. ÐŸÐ°Ñ€Ð½Ñ‹Ðµ Ð¾Ñ‚Ñ‡Ñ‘Ñ‚Ñ‹: Â«ÐšÐ°Ñ€Ñ‚Ð° Ð³Ð¾Ñ‚Ð¾Ð²Ð½Ð¾ÑÑ‚Ð¸ Ð¿Ð°Ð½ÐµÐ»ÐµÐ¹Â» (ÐºÐ°Ñ‡ÐµÑÑ‚Ð²Ð¾) Ð¸ Â«ÐšÐ°Ñ€Ñ‚Ð° Ñ„ÑƒÐ½ÐºÑ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ð¾Ð¹ Ñ†ÐµÐ½Ð½Ð¾ÑÑ‚Ð¸Â» (Ð·Ð°Ñ‡ÐµÐ¼ Ð½ÑƒÐ¶Ð½Ð¾) â€” dort.*
