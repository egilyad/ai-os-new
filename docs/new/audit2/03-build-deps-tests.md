# BUILD-1 — Build, Dependencies & Tests Audit

**Project:** ai-os-new v4.5.0
**Path:** `/home/z/my-project/audit/ai-os-new`
**Audit date:** 2026-07-30
**Agent:** general-purpose (senior build/devops engineer)
**Prior audits:** ARCH-1 (7/10), SEC-1 (4/10, flagged 6 npm vulns), PANELS-CORE (6.3/10), PANELS-SYS-AGENTS (6.3/10), PANELS-DEBATES (~6.3/10), UX-PERF-DOCS (07).

---

## Overview

This audit covers the build pipeline, dependency tree, TypeScript & ESLint configuration, test coverage, Docker/Compose, CI/CD, Husky hooks, and dependency-graph enforcement for ai-os-new v4.5.0.

**Headline results (all from real command output, not inferred):**

| Check                                         | Result                                                       | Status            |
| --------------------------------------------- | ------------------------------------------------------------ | ----------------- |
| `npm run typecheck:fast`                      | exit 0, **0 errors**                                         | ✅ Green          |
| `npm run lint`                                | exit 1, **38 errors + 204 warnings = 242 problems**          | 🔴 Red            |
| CI lint gate (`--max-warnings 0`)             | Would **fail** on 204 warnings                               | 🔴 Red            |
| CI security-audit gate (`--audit-level=high`) | Would **fail** on 5 high vulns                               | 🔴 Red            |
| `npm audit`                                   | **6 vulnerabilities** (1 moderate direct, 5 high transitive) | 🟡 Fixable        |
| `npx vitest run --coverage`                   | **Timed out at 280s**                                        | ⚠️ Slow suite     |
| Test files                                    | **84** (vitest.config comment claims 46 — stale)             | ℹ️                |
| Dependency graph enforcement                  | depcruise config exists but **not run in CI**                | 🟡 Gap            |
| Docker hardening                              | Multi-stage, non-root, read-only, cap_drop ALL               | ✅ Strong         |
| Husky pre-commit                              | lint-staged + `tsc -b --noEmit`                              | ✅ Present (slow) |

**Bottom line:** The type system is clean and the Docker/CI scaffolding is sophisticated, but **CI is currently red** because lint emits 38 errors and 204 warnings (CI passes `--max-warnings 0`), and `npm audit --audit-level=high` fails on 5 high-severity transitive vulns. The project also rides the bleeding edge (TypeScript 6.0.3 released Oct 2025, Vite 8.0.16, ESLint 10.3.0, Vitest 4.1.5, eslint-plugin-react-hooks 7.1.1) which is a stability risk for a production app, and the `madge` peer-dep conflict forces `--legacy-peer-deps` across every install surface (Dockerfile, CI, `.npmrc`).

**Score: 5 / 10** — strong tooling investment undermined by a red CI gate, bleeding-edge deps, and test-suite performance that times out before producing coverage.

---

## Dependency Analysis

### 1.1 `package.json` — version stability concerns

`/home/z/my-project/audit/ai-os-new/package.json` lines 45-103. Installed versions (from `npm ls` + `node -p require(...).version`):

| Package                     | Declared   | Installed  | Released | Concern                                                                                                                                                                                                      |
| --------------------------- | ---------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `typescript`                | `~6.0.2`   | **6.0.3**  | Oct 2025 | 🔴 Very new major. TS 6.0 released 2025-10; this audit is 2026-07 so ~9 months old, but 6.0.x is the first major in the 6.x line and `~6.0.2` pins to patch only — any 6.1 release will require manual bump. |
| `vite`                      | `^8.0.10`  | **8.0.16** | 2025     | 🔴 Vite 8 is a very new major. `^8.0.10` allows 8.x minors. Watch for breaking minors.                                                                                                                       |
| `eslint`                    | `^10.2.1`  | **10.3.0** | 2025     | 🟡 ESLint 10 is new major; flat-config only.                                                                                                                                                                 |
| `vitest`                    | `^4.1.5`   | **4.1.5**  | 2025     | 🟡 Vitest 4 is new major.                                                                                                                                                                                    |
| `eslint-plugin-react-hooks` | `^7.1.1`   | **7.1.1**  | 2025     | 🟡 v7 introduced many new rules (purity, refs, immutability, static-components) — all enabled as `warn` here, producing 100+ of the 204 warnings.                                                            |
| `react` / `react-dom`       | `^19.2.5`  | 19.2.5     | 2025     | ✅ React 19.2 stable.                                                                                                                                                                                        |
| `react-router-dom`          | `^7.15.0`  | **7.17.0** | 2025     | 🔴 Vulnerable (see §1.4). Fix at 7.18.0.                                                                                                                                                                     |
| `lucide-react`              | `^1.14.0`  | 1.14.0     | 2025     | ℹ️ v1.x is the new major line (post-2025).                                                                                                                                                                   |
| `zod`                       | `^4.4.3`   | 4.4.3      | 2025     | 🟡 Zod 4 is a new major with breaking changes from 3.x.                                                                                                                                                      |
| `@types/node`               | `^24.12.2` | 24.12.2    | 2025     | ✅ Matches Node 22 engine? Node 24 types with Node 22 engine — slight mismatch but harmless.                                                                                                                 |
| `node` engine               | `>=22.0.0` | n/a        | —        | ✅ Reasonable. No upper bound (could allow untested Node 24+).                                                                                                                                               |
| `framer-motion`             | `^12.38.0` | 12.38.0    | 2025     | ℹ️ Large bundle; the ARCH-1 audit noted AppLayout claims it was removed but it's still a dep.                                                                                                                |
| `monaco-editor`             | `^0.52.2`  | 0.52.2     | 2025     | ℹ️ Heavy (~5MB).                                                                                                                                                                                             |

**Total deps:** 103 prod + 613 dev + 67 optional = **721 transitive** (`npm audit` metadata). That is a large tree for a frontend-only app, driven by dev tooling (eslint, playwright, vitest, jsdom, madge, dependency-cruiser).

### 1.2 Peer-dep conflict → `--legacy-peer-deps` everywhere

`/home/z/my-project/audit/ai-os-new/.npmrc`:

```
legacy-peer-deps=true
fund=false
audit=false   # M6 (3c): suppresses npm audit warnings — trade-off
```

`madge@8.0.0` declares `typescript ^5.4.4` as a peer, but the project pins `typescript ~6.0.2`. This forces `--legacy-peer-deps` in:

- `.npmrc` (local installs)
- `Dockerfile:37` — `RUN npm ci --legacy-peer-deps --no-fund`
- `.github/workflows/ci.yml` lines 36, 73, 121, 146, 174, 201 — every `npm ci` uses `--legacy-peer-deps`

**Fix:** Either (a) drop `madge` (the CI `circular-check` job uses it, but `dependency-cruiser` already enforces `no-circular` and could replace it), or (b) patch madge's peer to accept TS 6 via `overrides` in package.json. Removing `legacy-peer-deps` would surface real peer conflicts earlier.

### 1.3 Duplicate TypeScript in the tree

`package-lock.json` shows two TypeScript copies:

- `node_modules/typescript` → **6.0.3** (top-level, used by tsc/eslint)
- `node_modules/dependency-tree/node_modules/typescript` → **5.9.3** (nested under madge's `dependency-tree` dep)

This is benign (madge uses its own TS for parsing) but inflates `node_modules` and means `madge` parses source with TS 5.9 semantics while `tsc` type-checks with TS 6.0 — a subtle source of disagreement on edge-case syntax.

### 1.4 `npm audit` — 6 vulnerabilities

Command: `npm audit --json` (exit 0 because `.npmrc` sets `audit=false`; the JSON still renders).

```
METADATA: {
  "vulnerabilities": { "info":0, "low":0, "moderate":1, "high":5, "critical":0, "total":6 },
  "dependencies": { "prod":103, "dev":613, "optional":67, "total":721 }
}
```

| Package            | Severity | Direct?                             | Installed   | Fix     | Advisory                                                                                                                                                                            |
| ------------------ | -------- | ----------------------------------- | ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-router-dom` | moderate | **yes**                             | 7.17.0      | 7.18.0  | GHSA-wrjc-x8rr-h8h6 (open redirect), GHSA-h8fp-f39c-q6mh (RSC XSS), GHSA-337j-9hxr-rhxg (deserializeErrors injection), GHSA-chx6-hx7r-mcp5 (DoS), GHSA-qwww-vcr4-c8h2 (CSRF bypass) |
| `react-router`     | high     | no (transitive of react-router-dom) | 7.17.0      | 7.18.0  | same advisories                                                                                                                                                                     |
| `undici`           | high     | no                                  | 7.25.0      | 7.28.0  | GHSA-vmh5-mc38-953g (TLS bypass via SOCKS5), GHSA-p88m-4jfj-68fv (header injection via Set-Cookie) + 3 more                                                                         |
| `postcss`          | high     | no (vite dev dep)                   | ≤8.5.17     | 8.5.18+ | GHSA-r28c-9q8g-f849 (path traversal in source-map auto-loading) — build-time only                                                                                                   |
| `fast-uri`         | high     | no (vite/esbuild dep)               | 3.0.0-3.1.3 | 3.1.4+  | GHSA-v2hh-gcrm-f6hx (host confusion) — build-time only                                                                                                                              |
| `brace-expansion`  | high     | no (madge dep)                      | ≤5.0.7      | 5.0.8+  | GHSA-3jxr-9vmj-r5cp + GHSA-mh99-v99m-4gvg (DoS) — dev-only                                                                                                                          |

**All 6 have fixes available.** 4 of 6 are dev/build-time only (postcss, fast-uri, brace-expansion, undici-via-vite). The user-facing risk is `react-router-dom` (open redirect, XSS, DoS, CSRF bypass) — upgrade to `^7.18.0` immediately.

> ⚠️ The SEC-1 audit (worklog 2026-07-30) already flagged these as P1-6. They remain unfixed at audit time. The CI `security-audit` job (`npm audit --audit-level=high`) **will fail** on every PR until `react-router-dom` and `undici` are bumped.

**Recommended fix:**

```bash
npm install react-router-dom@^7.18.0
# undici is transitive via vite; bump vite to latest 8.x to pull undici 7.28+
npm install vite@latest
# postcss/fast-uri resolve by bumping vite; brace-expansion resolves by bumping madge or removing it
```

### 1.5 `engines.node` — no upper bound

`package.json:11-13`:

```json
"engines": { "node": ">=22.0.0" }
```

No upper bound means Node 24, 25 (future) are accepted. CI pins Node 22 (`ci.yml:10`). Recommend `">=22.0.0 <23.0.0"` to match CI and Docker (`node:22-alpine`).

---

## Build Health

### 2.1 `vite.config.ts` analysis

`/home/z/my-project/audit/ai-os-new/vite.config.ts` (177 LOC). Key observations:

**Strengths:**

- **Manual chunk splitting** (lines 51-99): 9 vendor chunks (`vendor-react`, `vendor-xyflow`, `vendor-utils`, `vendor-motion`, `vendor-ast`, `vendor-tiptap`, `vendor-aria`, `vendor-orama`, `vendor-dompurify`) + 2 source chunks (`kernel-debate`, `kernel-llm`). Good for caching.
- **Dev CSP** (lines 105-112): `default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; connect-src` allowlist. Reasonable for dev.
- **Proxy error handler** (`withProxyErrorHandler`, lines 7-29): returns 502 JSON on proxy error instead of hanging. Good.
- **7 LLM provider proxies** + `/proxy/fetch` + `/api` — all configurable via env.
- `chunkSizeWarningLimit: 700` — tight, will surface bundle bloat.
- `define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version) }` — clean version injection.

**Issues:**

- 🔴 **`sourcemap: false`** (line 46) — production has **no sourcemaps**. This makes production debugging nearly impossible. Recommend `sourcemap: 'hidden'` (generates maps but doesn't reference them in output; upload to Sentry/Datadog).
- 🟡 **`build.target: 'es2023'`** (line 44) — excludes Safari <17.4, iOS <17.4, and any browser released before mid-2023. No `browserslist` field in package.json to document this. If older-browser support is needed, drop to `es2020`. If not, document it.
- 🟡 **No `optimizeDeps` config** — large deps (monaco-editor, @xyflow, @tiptap, @orama) may cause slow dev cold-starts. Consider `optimizeDeps: { include: ['react','react-dom','react-router-dom','zustand','dexie','framer-motion'] }`.
- 🟡 **`manualChunks` falls through to `return;` for unmatched node_modules** (line 90) — comment says "keep other node_modules in the entry chunk", but this actually lets Rollup decide. Minor.
- 🟡 **No `assetsInlineLimit`** — default 4KB. Monaco wasm and fonts may be emitted as separate files unnecessarily.
- ℹ️ **`server.headers` CSP includes `'unsafe-inline'` for script-src** (line 107) — acceptable in dev (HMR needs it) but should be tightened in prod (the nginx.conf does this correctly).
- ℹ️ **`base: process.env.VITE_BASE_PATH || '/'`** (line 33) — fine for GitHub Pages subpath deploys.
- ℹ️ **`preview.host: true`** (line 175) — binds to 0.0.0.0; fine for local preview, but flag if used in shared environments.

### 2.2 `package.json` scripts

Lines 14-36. Notable:

| Script                  | Command                                          | Concern                                                                                                                                                               |
| ----------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`                 | `tsc -b && vite build`                           | ✅ Typecheck-then-bundle. Correct order.                                                                                                                              |
| **`build:unsafe`**      | `vite build` (no typecheck)                      | 🔴 **Skips typecheck.** Anyone running `npm run build:unsafe` ships untyped bundles. Should be renamed `build:skip-typecheck` and gated behind a warning, or removed. |
| `typecheck`             | `tsc -b --noEmit`                                | ✅ Full project references.                                                                                                                                           |
| `typecheck:fast`        | `tsc --noEmit --project tsconfig.app.json`       | ✅ Bypasses project-references build graph; fast. **Passes clean** (exit 0).                                                                                          |
| `lint`                  | `eslint .`                                       | ✅ Default. **Currently exits 1** (38 errors).                                                                                                                        |
| `lint:staged`           | `lint-staged`                                    | ✅ Wired into husky pre-commit.                                                                                                                                       |
| `test`                  | `vitest run`                                     | ✅                                                                                                                                                                    |
| `test:e2e`              | `playwright test`                                | ✅                                                                                                                                                                    |
| `check:circular-kernel` | `madge --circular`                               | ⚠️ Uses **madge**, not depcruise. Inconsistent with `check:deps` which uses depcruise.                                                                                |
| `check:deps`            | `depcruise --config .dependency-cruiser.cjs src` | ✅                                                                                                                                                                    |
| `check:deps:graph`      | depcruise → dot → svg                            | ✅ Nice.                                                                                                                                                              |
| `prepare`               | `husky`                                          | ✅                                                                                                                                                                    |

**Memory:** All `node` invocations use `--max-old-space-size=4096` (4GB heap). Reasonable for a large TS project, but indicates the typecheck/build is memory-heavy.

### 2.3 TypeScript config

`tsconfig.json` (solution-style, `files: []` with references to `tsconfig.app.json` + `tsconfig.node.json`).

`tsconfig.app.json` (the app config):

```json
{
  "compilerOptions": {
    "target": "es2023",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"] // 🔴 TESTS NOT TYPE-CHECKED
}
```

**Strictness — what's present (good):**

- `strict: true`, `strictNullChecks`, `noImplicitAny` ✅
- `noUnusedLocals`, `noUnusedParameters` ✅
- `noFallthroughCasesInSwitch` ✅
- `verbatimModuleSyntax: true` ✅ (enforces `import type`)
- `moduleDetection: force` ✅
- `allowImportingTsExtensions` ✅ (bundler mode)

**Strictness — what's MISSING (gap):**

- 🔴 **`noUncheckedIndexedAccess`** — `arr[i]` returns `T` instead of `T | undefined`. This is the single most impactful strict flag for catching runtime bugs in a codebase with heavy array/map access.
- 🟡 **`exactOptionalPropertyTypes`** — distinguishes `{ a?: string }` from `{ a: string | undefined }`. Catches a class of bugs but is noisy to retrofit.
- 🟡 **`noImplicitOverride`** — requires `override` keyword on subclass methods.
- 🟡 **`noPropertyAccessFromIndexSignature`** — forces bracket access for index signatures.
- ℹ️ `forceConsistentCasingInFileNames` — enabled by default in TS 6 but worth pinning.

🔴 **Critical gap: test files are excluded from typechecking.**

```json
"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
```

**84 test files** are never type-checked by `typecheck`, `typecheck:fast`, `tsc -b`, the pre-commit hook, or CI. Type errors in tests (e.g. wrong mock signature, changed service API) only surface at `vitest run` time — which is slow and timed out in this audit. **Recommendation:** create a `tsconfig.test.json` that includes `src/**/*.test.ts(x)` with `"composite": true` referencing `tsconfig.app.json`, and add it to the solution `tsconfig.json` references. Or simply remove the `exclude` and let test files be type-checked alongside source (vitest transpiles them separately anyway via esbuild).

`tsconfig.node.json` (for `vite.config.ts`):

- `strict: true`, `target: es2023`, `types: ["node"]` ✅
- `erasableSyntaxOnly: false` — TS 6 flag; allowing non-erasable syntax (enums, parameter properties) in a config file is fine.

### 2.4 ESLint config

`/home/z/my-project/audit/ai-os-new/eslint.config.js` (122 LOC) — flat config, ESLint 10.

**Strengths (sophisticated):**

- `@typescript-eslint/no-explicit-any: 'error'` (line 23) — hard error, not warning.
- `@typescript-eslint/no-unused-vars: ['error', { argsIgnorePattern: '^_' }]` ✅
- `react-hooks/exhaustive-deps: 'error'` ✅
- `react-refresh/only-export-components: 'warn'` ✅
- **react-hooks v7 rules** (lines 27-30): `set-state-in-effect`, `refs`, `purity`, `immutability` all `warn`. These are the source of most of the 204 warnings.
- **Layering rules** (lines 31-51, 64-80, 94-121):
  - `dexieDb` import restricted to DAL/storage/database-service ✅
  - `eventBus`/`EVENTS` must come from `kernel/events/event-bus`, not parent modules ✅
  - `src/components/**` and `src/stores/**` cannot import from `kernel/services/` (must use `lazyService` or `contracts/`) ✅
  - `src/kernel/**` cannot import React/zustand/lucide/framer-motion or `components/stores/llm` ✅
- **Custom rule** `kernel-lifecycle/mandatory-lifecycle` (lines 81-93 + `eslint/rule-mandatory-lifecycle.mjs`): enforces that exported kernel service classes using EventBus subscriptions / `setTimeout`/`setInterval` / `AbortController` must implement `destroy()`. This is excellent for preventing memory leaks.

**Issues:**

- 🔴 **Lint currently emits 38 errors** → `npm run lint` exits 1. CI runs `npm run lint -- --max-warnings 0` which **fails on 204 warnings too**. CI is red.
- 🟡 The `no-restricted-imports` rules for `src/kernel/**` importing `llm/**` are `warn`, not `error`. There are **62 such warnings**, mostly kernel services importing `../../llm/utils/token-counter` and `../../llm/http/llm-http-client`. This indicates the kernel/LLM layer boundary is leaking. Either tighten to `error` and fix, or formalise the exception (token-counting is genuinely cross-cutting).
- 🟡 `globalIgnores(['dist','audit','docs','e2e','coverage','prompt-vault'])` (line 10) — `docs` and `e2e` are not linted. The `docs/ocs/` folder contains files like `erorrrrr799.md`, `eroor.md` which suggest scratch content; not linting docs is fine but those files should be cleaned up.
- ℹ️ `react-hooks/*` v7 rules at `warn` produce 100+ warnings. Consider promoting `react-hooks/set-state-in-effect` to `error` after fixing the 73 call sites, or suppressing with `// eslint-disable-next-line` for legitimate initial-load effects.

### 2.5 Lint output — full breakdown

Command: `npm run lint` → exit 1. Final line: `✖ 242 problems (38 errors, 204 warnings)`.

**By rule (counted from real output):**

| Rule                                      | Severity  | Count   | Notes                                                    |
| ----------------------------------------- | --------- | ------- | -------------------------------------------------------- |
| `react-hooks/set-state-in-effect`         | warn      | 73      | setState in effect body — cascading renders              |
| `no-restricted-imports`                   | warn      | 62      | kernel importing llm/; stores importing kernel/services/ |
| `react-refresh/only-export-components`    | warn      | 36      | non-component exports in .tsx files (HMR)                |
| `@typescript-eslint/no-explicit-any`      | **error** | 29      | `any` usage — blocks lint exit                           |
| `react-hooks/refs`                        | warn      | 17      | ref write during render                                  |
| `react-hooks/purity`                      | warn      | 10      | impure call during render (e.g. `Date.now()`)            |
| `react-hooks/exhaustive-deps`             | **error** | 5       | missing deps in useEffect/useMemo                        |
| `react-hooks/static-components`           | warn      | 3       |                                                          |
| `react-hooks/immutability`                | warn      | 3       |                                                          |
| `react-hooks/incompatible-library`        | warn      | 2       |                                                          |
| `no-empty`                                | **error** | 2       | empty catch/block                                        |
| `react-hooks/preserve-manual-memoization` | warn      | 1       |                                                          |
| **Total errors**                          |           | **38**  | (29 any + 5 exhaustive-deps + 2 no-empty + 2 others)     |
| **Total warnings**                        |           | **204** |                                                          |

**13 files contain errors** (the errors block the lint exit code):

- `src/components/ChatAdminPanel/ChatAdminPanel.tsx`
- `src/components/ComingSoonPanel/ComingSoonPanel.tsx`
- `src/components/CommunityHub/CommunityHubPanel.tsx`
- `src/components/DebateResearch/ArchitectureReview.tsx`
- `src/components/EvalDatasets/EvalDatasetPanel.tsx`
- `src/components/KeyTable/HistoryTab.tsx`
- `src/components/KeyTable/OverviewSignalCards.tsx`
- `src/components/ProviderManager/PersonalityCard.tsx`
- `src/components/RolesPanel/RoleCard.tsx`
- `src/components/RolesPanel/ShapePicker.tsx`
- `src/components/RolesPanel/TeamWizard.tsx`
- `src/kernel/service-registration/phase8-roles-consortia.ts`
- `src/kernel/services/database-service.ts`

**Sample error from `src/kernel/bootstrap.ts:307:72`:**

```
307:72  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
```

**Fix priority:** The 29 `no-explicit-any` errors are the highest-leverage fix (they block lint and the CI gate). Most are likely `as any` casts that can be replaced with proper types or `unknown` + narrowing.

---

## Type/Lint Status

### 3.1 Typecheck

| Command                                 | Exit           | Errors                       | Time                 |
| --------------------------------------- | -------------- | ---------------------------- | -------------------- |
| `npm run typecheck:fast`                | 0              | 0                            | ~within 5-min budget |
| `npx tsc -b --noEmit` (CI / pre-commit) | not run (slow) | presumed 0 (same source set) | —                    |

**Verdict:** Type system is clean for `src/**` (excluding tests). The 84 test files are excluded from typechecking (see §2.3).

### 3.2 Lint

| Command                                 | Exit  | Errors                                                | Warnings |
| --------------------------------------- | ----- | ----------------------------------------------------- | -------- |
| `npm run lint`                          | **1** | 38                                                    | 204      |
| `npm run lint -- --max-warnings 0` (CI) | **1** | 38 (errors trigger) + 204 (warnings trigger via flag) | —        |

**Verdict:** 🔴 **CI quality gate is red.** Both the `quality` job's lint step and the `security-audit` job will fail on every PR. This either means CI is being skipped, overridden, or the project has been merging despite red CI.

---

## Test Coverage

### 4.1 Test file inventory

Command: `find src -name "*.test.ts*" -type f | wc -l` → **84 test files**.

The `vitest.config.ts:21` comment claims "46 test files cover UI + LLM only" — **stale**. The actual count is 84, with strong kernel coverage.

**Breakdown by area (from file paths):**

| Area                            | Count | Examples                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/**` (UI panels) | 28    | `ChatPanel.test.tsx`, `DashboardPanel.test.tsx`, `MemoryPanel.test.tsx`, `SkillsPanel.test.tsx`, `TasksPanel.test.tsx`, `AgentsPanel.test.tsx`, `AlertLayer.test.tsx`, `AddKeyModal.test.tsx`, etc.                                                                                                                                                                                                        |
| `src/kernel/services/**`        | 50    | `ChatService.test.ts`, `chat-executor.test.ts`, `prompt-security-service.test.ts`, `budget-service.test.ts`, `cache-service.test.ts`, `config-registry.test.ts`, `debate-runtime/*.test.ts` (6 debate tests), `router-services.test.ts`, `lifecycle-manager.test.ts`, `pricing-service.test.ts`, `virtual-key-service.test.ts`, `notification-webhook-service.test.ts`, `fact-check-service.test.ts`, etc. |
| `src/kernel/` (core)            | 3     | `container.test.ts`, `events/event-bus.test.ts`, `integration.test.ts`                                                                                                                                                                                                                                                                                                                                     |
| `src/llm/**`                    | 4     | `core/flyweight.test.ts`, `core/middleware-pipeline.test.ts`, `decorators/cache-decorator.test.ts`, `gemini/gemini-adapter.test.ts`                                                                                                                                                                                                                                                                        |
| E2E (`e2e/`)                    | 1     | `basic-flow.spec.ts` (4 tests: load dashboard, navigate keys, navigate agents, open chat)                                                                                                                                                                                                                                                                                                                  |

**Critical paths tested:**

- ✅ DI container (`container.test.ts`) + integration test
- ✅ Event bus
- ✅ ChatService (auto-routing + main), chat-executor, chat-bookmarks
- ✅ Prompt security scanner (`prompt-security-service.test.ts`)
- ✅ Router services, route-rules, runtime-intelligence/whatif
- ✅ Budget service + alerts, pricing service, virtual-key service
- ✅ Lifecycle manager, execution-governor, execution-queue, race-executor
- ✅ 6 debate-runtime services (budget, conclusion, consensus, evaluator, memory, orchestrator)
- ✅ Key services: compromise-webhook, external-secrets, notification-webhook, config-history, config-service, config-registry, consistency-checker, fact-check, health-sla, llm-client, metrics, policy, reconnection, scheduler, session-manager, skill, snapshot, system-status, task-handoff, time-machine, usage-tracker, workflow

**Gaps:**

- 🔴 **`src/stores/` has zero test files** — 17 store files including the 1081-LOC `chat/store.ts` (flagged as god-store in ARCH-1) have no tests.
- 🟡 **`src/llm/` has only 4 tests** for a layer with adapters for Gemini, OpenAI, Groq, NVIDIA, Cerebras, Cloudflare, OpenRouter.
- 🟡 **`src/utils/`, `src/shared/`, `src/hooks/` have no tests** — `chat-export.ts`, `research-export.ts`, `sanitize.ts`, `safe-json.ts`, `format-cost.ts`, `useRoutingIntelligence.ts` etc.
- 🟡 **E2E is minimal** — 4 happy-path tests, no failure modes, no cross-browser, no mobile viewport.
- ℹ️ No `*.test.ts` for `src/kernel/services/key-management/` (key-vault, key-service, key-registry) — the security-critical path flagged P0-1 in SEC-1.

### 4.2 Vitest config

`/home/z/my-project/audit/ai-os-new/vitest.config.ts`:

```ts
test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup-light.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    testTimeout: 15000,
    hookTimeout: 15000,
    coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/**/*.test.*', 'src/**/*.d.ts', 'src/types/**'],
        thresholds: {
            statements: 20,   // 🔴 very low
            branches: 10,
            functions: 15,
            lines: 20,
        },
    },
}
```

**Issues:**

- 🔴 **Coverage thresholds intentionally low** (20/10/15/20). The comment admits "Most kernel services lack tests." This means coverage can drop to 20% without failing CI. Should be raised incrementally.
- 🟡 **`setupFiles` uses `setup-light.ts`** (no runtime boot) — good for speed. But `src/tests/setup.ts` (which boots `runtime.start()`) exists and is presumably used by tests that need a live DI container. There's no per-file setup selection; tests needing the full runtime must import it themselves.
- 🟡 **`testTimeout: 15000`** — generous; suggests some tests are slow (async service init, fake-indexeddb).
- ℹ️ `globals: true` — `describe`/`it`/`expect` available without imports. Fine.
- ℹ️ No `pool: 'forks'` config — default is forks; jsdom + fake-indexeddb may benefit from `pool: 'threads'`.

### 4.3 Coverage run — TIMED OUT

Command: `timeout 280 npx vitest run --coverage 2>&1 | tail -120`

**Result:** `context deadline exceeded` — the run did not complete within 280 seconds (4.7 minutes).

**Likely causes:**

1. 84 test files, many booting fake-indexeddb and jsdom.
2. Some tests may import `src/tests/setup.ts` which calls `await runtime.start()` — full kernel bootstrap with 188 services.
3. `testTimeout: 15000` × many slow tests.
4. v8 coverage instrumentation adds overhead.

**Recommendation:**

- Run coverage in CI with a longer budget (10 min) or shard.
- Identify slow tests with `vitest run --reporter=verbose` and profile.
- Consider `pool: 'forks'` with `poolOptions: { forks: { singleFork: false } }` for parallelism.
- The full `setup.ts` (runtime boot) should be opt-in per test file, not a global default; the config correctly uses `setup-light.ts` globally, but tests that import `setup.ts` pay the full boot cost.

### 4.4 Playwright / E2E

`/home/z/my-project/audit/ai-os-new/e2e/playwright.config.ts`:

```ts
timeout: 60000, retries: 1, webServer: { command: 'npm run dev', port: 5173, reuseExistingServer: true }
```

`e2e/basic-flow.spec.ts` — 4 tests:

1. `should load dashboard` — checks "Mission Control" visible
2. `should navigate to keys page and show providers` — clicks "add new provider key"
3. `should navigate to agents page` — `/agents`
4. `should open chat panel` — `/chat`, checks textbox

**Issues:**

- 🟡 `webServer.command: 'npm run dev'` boots the **dev server** (not a preview of the production build). E2E should test `vite preview` against the built `dist/` to catch build-time issues. Recommend `command: 'npm run build && npm run preview'` with `port: 5173`.
- 🟡 No `projects` config — only Chromium (default). No Firefox/WebKit/mobile.
- 🟡 Only 4 happy-path tests. No tests for: adding a key, sending a chat message, debate flow, error states, network failure, CSP violations.
- ℹ️ `retries: 1` — reasonable for flake resistance.

---

## Docker/Deploy

### 5.1 `Dockerfile`

`/home/z/my-project/audit/ai-os-new/Dockerfile` (81 LOC). Two-stage build.

**Stage 1 — build** (`node:22-alpine`):

- `apk add --no-cache libc6-compat git` (line 32) — libc6-compat for sql.js native bindings, git for esbuild postinstall. Documented. ✅
- `COPY package*.json ./` (line 34) before `COPY . .` (line 39) — **layer caching for node_modules** ✅
- `RUN npm ci --legacy-peer-deps --no-fund` (line 37) — deterministic install, no funding noise. Peer-dep bypass documented (line 35-36). ✅
- Build args for `VITE_*` env injection at build time (lines 41-63) — 10 args. ✅
- `RUN ... npm run build` (line 63) — runs `tsc -b && vite build`. ✅

**Stage 2 — runtime** (`nginxinc/nginx-unprivileged:1.27-alpine`):

- `nginx-unprivileged` — **non-root, listens on 8080** ✅
- `COPY --from=build /app/dist /usr/share/nginx/html` (line 72) — only built artifacts, no source. ✅
- `COPY --chown=nginx:nginx docker/${NGINX_CONFIG} /etc/nginx/conf.d/default.conf.template` (line 73) — config as template for envsubst. ✅
- `COPY --chmod=755 docker/entrypoint.sh /entrypoint.sh` (line 76) ✅
- `EXPOSE 8080` + `EXPOSE 8443` (lines 78, 80) — 8080 for HTTP, 8443 for TLS (nginx-unprivileged can't bind 443). ✅
- OCI labels (lines 5-9) ✅

**Issues:**

- 🟡 **No `HEALTHCHECK` in Dockerfile** — healthcheck is defined only in `docker-compose.yml`. If the image is run via `docker run` without compose, no healthcheck. Recommend adding `HEALTHCHECK` to the Dockerfile as a default.
- 🟡 **No `.dockerignore` for `dist/`** — wait, `.dockerignore` does exclude `dist` (line 14). ✅ Good. But the build stage rebuilds `dist/` anyway, so this is fine.
- 🟡 **`nginx-unprivileged:1.27-alpine`** — pinned to 1.27. Check for 1.28+ with security fixes.
- ℹ️ Build stage doesn't `RUN npm run typecheck` or `npm run lint` — relies on CI for that. Acceptable but means a local `docker build` can produce a broken image if types are wrong (tsc -b in `npm run build` will catch type errors though).
- ℹ️ No `LABEL org.opencontainers.image.version` — version label is added in compose, not Dockerfile.

### 5.2 `docker-compose.yml`

`/home/z/my-project/audit/ai-os-new/docker-compose.yml` (114 LOC). Two profiles: `dev` (HTTP on 127.0.0.1:80) and `prod` (HTTPS on 443, HTTP→HTTPS redirect on 80).

**Strengths:**

- `restart: unless-stopped` ✅
- `healthcheck` (lines 51-56): `wget -qO- http://127.0.0.1:8080/`, 30s interval, 3s timeout, 3 retries, 10s start_period ✅
- `security_opt: [no-new-privileges:true]` (line 59) ✅
- `cap_drop: [ALL]` (line 61) ✅
- `read_only: true` (line 62) with `tmpfs: [/tmp, /var/run]` (lines 63-65) ✅
- `logging: json-file` with 10m × 3 files (lines 66-70) ✅
- `deploy.resources.limits: memory 512M, cpus 1.0` (lines 71-75) ✅
- Dev profile binds to `127.0.0.1:80` (line 88) — prevents remote MITM over plain HTTP ✅ (H-15)
- Prod profile mounts `./certs:/etc/nginx/ssl:ro` (line 113) ✅
- Custom bridge network with fixed subnet (lines 13-18) ✅

**Issues:**

- 🟡 **Dev profile doesn't specify `security_opt`/`cap_drop`/`read_only`** — `app-dev` extends `app` so it inherits them ✅. Confirmed via `extends: service: app` (line 81).
- 🟡 **No `version:` field** — fine for compose v2+.
- 🟡 **`app-prod` build args override `NGINX_CONFIG: nginx-ssl.conf`** (line 101) but the `app-dev` and base `app` services don't explicitly set it for dev. The default `${NGINX_CONFIG:-nginx.conf}` handles this. ✅
- ℹ️ No `depends_on` / external services (no DB, no Redis) — single-container app. Fine for a client-side app.
- ℹ️ `API_UPSTREAM` env var (line 49) — but the Dockerfile doesn't pass it as a build arg (only VITE_* are build args). It's a runtime env consumed by `entrypoint.sh` envsubst. ✅ Correct separation.

### 5.3 `docker/entrypoint.sh`

- `set -e` ✅
- Defaults for all 9 proxy env vars (lines 8-19) ✅
- `PROXY_FETCH` defaults to empty (line 18) — "fail closed" if not set. SEC-07 comment documents this. ✅
- `envsubst` renders the nginx template (lines 24-30) ✅
- TLS cert validation (lines 32-43): if rendered config contains `listen.*ssl`, verifies `cert.pem` and `key.pem` exist, exits 1 with self-signed cert instructions if missing. ✅
- `exec nginx -g "daemon off;"` (line 45) — proper PID 1. ✅

### 5.4 `docker/nginx.conf`

Strong production CSP (line 37):

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';   // no unsafe-eval — sandbox worker fails closed in prod
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
connect-src 'self' https://*.openrouter.ai https://*.openai.com https://*.anthropic.com
            https://generativelanguage.googleapis.com https://*.cloudflare.com
            https://*.cerebras.ai https://*.groq.com https://*.nvidia.com;
frame-src 'self' blob:; object-src 'none'; base-uri 'self';
worker-src 'self' blob:; child-src 'self' blob:; form-action 'self';
upgrade-insecure-requests
```

- Security headers repeated in static-asset location (lines 51-56) because nginx `add_header` doesn't inherit into child blocks. ✅ (BLD-09 comment documents this gotcha.)
- 7 provider proxy locations + `/proxy/fetch/` + `/api/` + catch-all `deny all` for unknown `/proxy/*` (lines 158-161) ✅
- `proxy_ssl_verify on`, `proxy_ssl_server_name on` on all proxy locations ✅
- `proxy_buffering off`, `proxy_cache off` for streaming ✅
- SPA fallback `try_files $uri $uri/ /index.html` ✅
- Static asset caching `expires 30d` + `Cache-Control: public, immutable` ✅
- `server_tokens off` ✅

**Issues:**

- 🟡 **No `frame-ancestors` CSP directive** — only `X-Frame-Options: SAMEORIGIN` (line 25). Modern browsers ignore `X-Frame-Options` when CSP `frame-ancestors` is present; since it's absent, `X-Frame-Options` is the only clickjacking protection. Add `frame-ancestors 'self'` to CSP. (Flagged as P2-7 in SEC-1.)
- 🟡 **No HSTS in HTTP nginx.conf** — correct (HSTS over HTTP is ignored), but the `nginx-ssl.conf` (not read in this audit) should add `Strict-Transport-Security`. SEC-1 flagged P3-2 to verify.
- ℹ️ `X-XSS-Protection: 1; mode=block` (line 27) — deprecated in modern browsers but harmless.

---

## CI/CD

### 6.1 `.github/workflows/ci.yml`

Single workflow, 7 jobs. Triggers on push/PR to `main`/`master`.

| Job              | Needs        | Runs on | Key steps                                                         | Status                                                           |
| ---------------- | ------------ | ------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| `quality`        | —            | ubuntu  | `tsc -b --noEmit`, `npm run lint -- --max-warnings 0`             | 🔴 **Red** (lint has 204 warnings + 38 errors)                   |
| `build`          | quality      | ubuntu  | `npm run build`, bundle-size check (>30MB warns), upload artifact | ✅ (assuming quality passes)                                     |
| `test`           | quality      | ubuntu  | `npm run test` (vitest run)                                       | ⚠️ Slow (timed out in audit at 280s; CI has no timeout override) |
| `security-audit` | —            | ubuntu  | `npm audit --audit-level=high`                                    | 🔴 **Red** (5 high vulns)                                        |
| `circular-check` | quality      | ubuntu  | `npm run check:circular-kernel` (madge)                           | ✅                                                               |
| `e2e`            | quality      | ubuntu  | `npx playwright install --with-deps chromium`, `npm run test:e2e` | ⚠️ Tests dev server, not prod build                              |
| `deploy`         | [build, e2e] | ubuntu  | Upload to GitHub Pages, only on main/master push                  | ✅                                                               |

**Strengths:**

- 7 jobs with proper `needs` dependencies (build/test/e2e/circular all need quality; deploy needs build+e2e).
- `permissions` specified per job (least privilege: `contents: read`, plus `pages: write`/`id-token: write` only for deploy). ✅
- `actions/cache@v4` for `node_modules` keyed on `package-lock.json` hash — avoids reinstall. ✅
- `actions/setup-node@v4` with `cache: 'npm'`. ✅
- Playwright browser cache. ✅
- Bundle size check (warns at 30MB). ✅
- Build artifact upload (7-day retention). ✅
- GitHub Pages deploy with proper environment + id-token. ✅
- `npm ci --legacy-peer-deps` everywhere (consistent with `.npmrc` and Dockerfile). ✅

**Issues:**

- 🔴 **`quality` job is red** — `npm run lint -- --max-warnings 0` fails on 204 warnings. Either CI is being ignored, or merges are happening with red CI. This is the single most critical CI issue.
- 🔴 **`security-audit` job is red** — `npm audit --audit-level=high` fails on 5 high vulns. Same concern.
- 🟡 **No `test` job coverage upload** — `vitest run` doesn't include `--coverage` in CI. Coverage thresholds in `vitest.config.ts` are never enforced. Add `--coverage` and a coverage gate.
- 🟡 **`test` job has no timeout** — GitHub Actions default is 360 min; if vitest hangs, it wastes runner minutes. Add `timeout-minutes: 15`.
- 🟡 **`e2e` job uses `npm run dev` server** (via playwright config) — should test the production build (`vite preview`). See §4.4.
- 🟡 **`circular-check` uses madge**, but `check:deps` (depcruise) is **not run in CI**. The depcruise config (`.dependency-cruiser.cjs`) enforces `no-react-in-kernel`, `no-ui-in-kernel`, `no-kernel-business-services-in-llm` — these are never enforced in CI. Add a `dep-graph` job: `npm run check:deps`.
- 🟡 **No matrix** — only `ubuntu-latest`. No macOS/Windows. For a frontend app this is usually fine, but Node 22-only is a single point of failure.
- 🟡 **No `concurrency` group** — PRs can queue multiple runs. Add:
  ```yaml
  concurrency:
    group: ${{ github.workflow }}-${{ github.ref }}
    cancel-in-progress: true
  ```
- ℹ️ Deploy only on `main`/`master` push — fine.
- ℹ️ No Slack/Discord notification on failure.

### 6.2 Husky / pre-commit

`/home/z/my-project/audit/ai-os-new/.husky/pre-commit`:

```sh
npx lint-staged
npx tsc -b --noEmit  # BLD-C3: solution-style tsconfig
```

`/home/z/my-project/audit/ai-os-new/.husky/commit-msg`:

```sh
npx --no -- commitlint --edit $1
```

**Issues:**

- 🟡 **`tsc -b --noEmit` in pre-commit is slow** — full project-references build on every commit. With 84+ source files and TS 6, this likely takes 20-60s. Developers may bypass with `--no-verify`. Consider moving full typecheck to CI and using only `lint-staged` (which runs eslint --fix on staged files) in pre-commit. Or use `typecheck:fast` instead of `tsc -b`.
- 🟡 **`lint-staged` runs `eslint --fix` on staged `*.{ts,tsx}`** (package.json lines 37-44) — but if a staged file has unfixable errors (e.g. `no-explicit-any`), the commit fails. Good, but with 38 current errors already in the tree, developers hitting `--fix` on a new file may be blocked by pre-existing errors in adjacent staged files.
- ✅ `commitlint` with `@commitlint/config-conventional` — enforces conventional commits. Good.
- ✅ `prepare: husky` script — installs hooks on `npm install`.

### 6.3 `.dependency-cruiser.cjs`

`/home/z/my-project/audit/ai-os-new/.dependency-cruiser.cjs` (54 LOC). 4 rules:

1. **`no-circular`** (error) — any circular dependency. ✅
2. **`no-react-in-kernel`** (error) — `src/kernel/` cannot import `react|react-dom|react-router-dom|zustand|lucide-react|framer-motion`. ✅
3. **`no-ui-in-kernel`** (error) — `src/kernel/` (except `service-registration/`) cannot import `src/(components|stores)/`. ✅ Exception for composition root is correct.
4. **`no-kernel-business-services-in-llm`** (warn) — `src/llm/` cannot import kernel services except `logger-service|config-registry|cross-tab-state`. ✅

Options: `tsPreCompilationDeps: true`, uses `tsconfig.json`, excludes `node_modules/dist/test/spec/worker`.

**Issues:**

- 🔴 **depcruise is NOT run in CI.** The `check:deps` script exists but no CI job invokes it. Only `check:circular-kernel` (madge) runs in CI, which only checks circular deps in `src/kernel/`, not the full layering rules. **The 4 depcruise rules are unenforced.**
- 🟡 Rule 4 is `warn` not `error` — won't fail `depcruise` even if added to CI.
- ✅ The rules are well-designed and complement the ESLint `no-restricted-imports` rules.

**Recommendation:** Add a CI job:

```yaml
dep-graph:
  name: Dependency Graph
  runs-on: ubuntu-latest
  needs: quality
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: '22', cache: 'npm' }
    - run: npm ci --legacy-peer-deps
    - run: npm run check:deps
```

---

## Critical Issues

Ranked by severity × impact.

### C1. 🔴 CI is red — lint gate fails on every PR

- **Files:** `.github/workflows/ci.yml:46` (`npm run lint -- --max-warnings 0`), `eslint.config.js`, 13 files with errors (listed §2.5).
- **Evidence:** `npm run lint` → exit 1, `✖ 242 problems (38 errors, 204 warnings)`. CI adds `--max-warnings 0` so warnings also fail.
- **Impact:** Either CI is being skipped/overridden, or PRs cannot merge. If the former, the quality gate is theatre. If the latter, development is blocked.
- **Fix:** (a) Fix the 38 errors (29 `no-explicit-any` + 5 `exhaustive-deps` + 2 `no-empty` + 2 others). (b) Either fix the 204 warnings or temporarily relax `--max-warnings` to e.g. `--max-warnings 250` and ratchet down. (c) Promote `react-hooks/set-state-in-effect` and `no-restricted-imports` handling to a tracked cleanup epic.

### C2. 🔴 CI security-audit is red — 5 high vulnerabilities unfixed

- **Files:** `package.json` (`react-router-dom ^7.15.0`, transitive `undici`, `postcss`, `fast-uri`, `brace-expansion`), `.github/workflows/ci.yml:148` (`npm audit --audit-level=high`).
- **Evidence:** `npm audit` → 6 vulnerabilities (1 moderate, 5 high). `react-router-dom@7.17.0` installed; fix at `7.18.0`. Already flagged P1-6 in SEC-1 (2026-07-30) — still unfixed.
- **Impact:** Open redirect, XSS, DoS, CSRF bypass in the routing layer. CI fails on every PR.
- **Fix:** `npm install react-router-dom@^7.18.0 vite@latest` (vite bump pulls undici 7.28+). Re-run `npm audit` to confirm 0.

### C3. 🔴 Test files excluded from typechecking (84 files)

- **File:** `tsconfig.app.json:33` — `"exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]`
- **Impact:** Type errors in tests only surface at `vitest run` time (which is slow — timed out at 280s). Refactors that break test mocks/contracts go undetected until CI's `test` job.
- **Fix:** Remove the exclude, or add a `tsconfig.test.json` composite project referencing `tsconfig.app.json` and include it in `tsconfig.json` references.

### C4. 🔴 Coverage thresholds at 20% and never enforced in CI

- **File:** `vitest.config.ts:22-27` (thresholds 20/10/15/20), `ci.yml:124` (`npm run test` — no `--coverage`).
- **Impact:** Coverage can erode to 20% without any signal. The `test` CI job doesn't even generate coverage, so thresholds are dead code.
- **Fix:** Add `--coverage` to CI test step. Raise thresholds to current actual coverage + 1% and ratchet. The coverage run timed out in this audit — fix test performance first (§4.3).

### C5. 🔴 `depcruise` rules not enforced in CI

- **File:** `.dependency-cruiser.cjs` (4 rules), `.github/workflows/ci.yml` (no `check:deps` job).
- **Impact:** The 4 layering rules (no-circular, no-react-in-kernel, no-ui-in-kernel, no-kernel-services-in-llm) are unenforced. The ESLint `no-restricted-imports` rules partially cover this but only as `warn`. Architecture can rot silently.
- **Fix:** Add a `dep-graph` CI job running `npm run check:deps` (see §6.3).

### C6. 🟡 `build:unsafe` script ships untyped bundles

- **File:** `package.json:17` — `"build:unsafe": "node ... vite.js build"` (no `tsc -b`).
- **Impact:** If anyone (or a deploy script) runs `npm run build:unsafe`, TypeScript errors are silently ignored and a broken bundle ships.
- **Fix:** Remove the script, or rename to `build:skip-typecheck` and add `echo "WARNING: skipping typecheck" >&2`.

### C7. 🟡 Production build has no sourcemaps

- **File:** `vite.config.ts:46` — `sourcemap: false`.
- **Impact:** Production runtime errors have no source mapping — debugging from minified stack traces is near-impossible.
- **Fix:** Set `sourcemap: 'hidden'` and upload maps to an error-tracking service (Sentry/Datadog). Hidden maps don't leak source to clients but are uploadable.

### C8. 🟡 Bleeding-edge dependency majors

- **Files:** `package.json` — `typescript ~6.0.2`, `vite ^8.0.10`, `eslint ^10.2.1`, `vitest ^4.1.5`, `eslint-plugin-react-hooks ^7.1.1`, `zod ^4.4.3`, `lucide-react ^1.14.0`.
- **Impact:** All are first-year major releases. TS 6.0.3 is the first 6.x patch. Combined with the madge peer-dep conflict forcing `--legacy-peer-deps`, the toolchain is fragile.
- **Fix:** Pin known-good versions. Consider downgrading TypeScript to `~5.9.x` to restore madge peer compatibility and remove `legacy-peer-deps`. Track upstream changelogs for Vite 8 / ESLint 10 / Vitest 4 breakages.

---

## Recommendations

### P0 — Immediate (blocks CI)

1. **Fix the 38 lint errors.** Start with the 29 `no-explicit-any` errors (replace `any` with `unknown` + narrowing, or proper types). Then 5 `exhaustive-deps`, 2 `no-empty`, 2 others. Files listed in §2.5.
2. **Bump `react-router-dom` to `^7.18.0`** and `vite` to latest 8.x to clear 5/6 npm audit vulns. Re-run `npm audit`.
3. **Decide on the 204 warnings.** Either fix them (best), or temporarily set CI to `--max-warnings 250` and ratchet down by 10/week. The 73 `react-hooks/set-state-in-effect` and 62 `no-restricted-imports` are the bulk.

### P1 — Within 1 sprint

4. **Add `--coverage` to CI `test` job** and raise thresholds from 20% to actual + 2%. Fix the coverage-run timeout first (profile slow tests, consider `pool: 'forks'`).
5. **Add a `dep-graph` CI job** running `npm run check:deps`. Promote rule 4 (`no-kernel-business-services-in-llm`) from `warn` to `error`.
6. **Remove `exclude` of test files from `tsconfig.app.json`** or add a `tsconfig.test.json` composite project. Type-check the 84 test files.
7. **Set `sourcemap: 'hidden'` in `vite.config.ts`** and upload maps to an error tracker.
8. **Add `concurrency` to CI workflow** to cancel superseded runs.
9. **Add `timeout-minutes: 15` to the `test` job** and `timeout-minutes: 20` to `e2e`.
10. **Switch E2E to test the production build** (`vite preview` not `vite dev`).

### P2 — Within 1 month

11. **Remove `build:unsafe`** or rename with a warning.
12. **Add `noUncheckedIndexedAccess` to `tsconfig.app.json`** — fix the resulting errors incrementally.
13. **Add `frame-ancestors 'self'` to nginx CSP** (both `nginx.conf` and `nginx-ssl.conf`).
14. **Add `HEALTHCHECK` to the Dockerfile** (not just compose).
15. **Reduce pre-commit cost** — replace `tsc -b --noEmit` with `typecheck:fast`, or move full typecheck to CI only.
16. **Pin `engines.node` to `">=22.0.0 <23.0.0"`** to match CI and Docker.
17. **Resolve the madge peer-dep conflict** — either drop madge (depcruise already does circular detection) or add an `overrides` field. Remove `legacy-peer-deps` from `.npmrc`, `Dockerfile`, and `ci.yml`.
18. **Add Playwright projects** for Firefox + WebKit + a mobile viewport.
19. **Add tests for `src/stores/`** (0 tests for 17 stores including the 1081-LOC chat store).
20. **Bump `nginx-unprivileged` to latest 1.27.x or 1.28.x.**

### P3 — Backlog

21. Consider `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`.
22. Document the `build.target: 'es2023'` browser support matrix.
23. Add `optimizeDeps.include` for common vendor libs to speed dev cold-start.
24. Add a `dependabot.yml` for automated dependency PRs.
25. Add Slack/Discord failure notifications to CI.

---

## Score: 5 / 10

**Rationale:**

| Dimension             | Score | Notes                                                                                                                                                          |
| --------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency health     | 4/10  | 6 unfixed vulns (5 high), bleeding-edge majors, madge peer-dep conflict forces `legacy-peer-deps` everywhere, duplicate TS in tree.                            |
| Build config          | 6/10  | Vite chunking is good; sourcemaps disabled; target es2023 undocumented; `build:unsafe` script is a footgun.                                                    |
| TypeScript strictness | 7/10  | `strict: true` + many flags, but missing `noUncheckedIndexedAccess` and test files are excluded from typechecking.                                             |
| ESLint                | 7/10  | Sophisticated config with custom lifecycle rule + layering rules; but 38 errors + 204 warnings = red CI.                                                       |
| Test coverage         | 5/10  | 84 test files (good kernel coverage), but 0 store tests, only 4 LLM tests, 4 e2e tests, coverage run times out, thresholds at 20% and not enforced in CI.      |
| Docker                | 8/10  | Excellent hardening (non-root, read-only, cap_drop, no-new-privileges, tmpfs, resource limits, multi-stage, layer caching). Missing HEALTHCHECK in Dockerfile. |
| CI/CD                 | 4/10  | 7 well-structured jobs, but 2 are red (lint + audit), coverage not enforced, depcruise not run, no concurrency, e2e tests dev not prod.                        |
| Husky/hooks           | 7/10  | Pre-commit + commit-msg present and correct; pre-commit typecheck is slow.                                                                                     |
| Dep-graph enforcement | 5/10  | depcruise config is well-designed but not run in CI; madge circular check is a subset.                                                                         |
| `.env.example`        | 9/10  | Well-documented, no secrets, clear warnings, all vars listed.                                                                                                  |

**Weighted average: ~5.4, rounded to 5.**

The tooling investment is genuine and sophisticated (custom ESLint lifecycle rule, depcruise layering rules, multi-stage hardened Docker, 7-job CI). But the **CI is currently red on two gates** (lint + audit), **test files escape typechecking**, **coverage is unenforced and times out**, and the **depcruise rules are dead code**. Fixing P0 items (lint errors + react-router-dom bump) would move this to 7/10. Adding depcruise to CI, enforcing coverage, and typechecking tests would move it to 8/10.

---

## Appendix — Command Output Excerpts

### A1. `npm run typecheck:fast`

```
> ai-os-new@4.5.0 typecheck:fast
> node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit --project tsconfig.app.json
===EXIT:0===
```

### A2. `npm run lint` (tail)

```
✖ 242 problems (38 errors, 204 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.
===EXIT:1===
```

### A3. `npm audit` metadata

```json
{
  "vulnerabilities": {
    "info": 0,
    "low": 0,
    "moderate": 1,
    "high": 5,
    "critical": 0,
    "total": 6
  },
  "dependencies": { "prod": 103, "dev": 613, "optional": 67, "total": 721 }
}
```

### A4. Lint rule breakdown

```
73 react-hooks/set-state-in-effect
62 no-restricted-imports
36 react-refresh/only-export-components
29 @typescript-eslint/no-explicit-any   (error)
17 react-hooks/refs
10 react-hooks/purity
 5 react-hooks/exhaustive-deps          (error)
 3 react-hooks/static-components
 3 react-hooks/immutability
 2 react-hooks/incompatible-library
 2 no-empty                             (error)
 1 react-hooks/preserve-manual-memoization
```

### A5. `npm ls --depth=0` (top-level, 51 packages)

```
ai-os-new@4.5.0
├── @commitlint/cli@19.8.1
├── @commitlint/config-conventional@19.8.1
├── @eslint/js@10.0.1
├── @google/generative-ai@0.24.1
├── @monaco-editor/react@4.7.0
├── @orama/orama@3.1.18
├── @playwright/test@1.61.0
├── @react-aria/focus@3.22.0
├── @tanstack/react-virtual@3.14.2
├── @testing-library/dom@10.4.1
├── @testing-library/jest-dom@6.9.1
├── @testing-library/react@16.3.2
├── @tiptap/extension-placeholder@3.27.1
├── @tiptap/pm@3.27.1
├── @tiptap/react@3.27.1
├── @tiptap/starter-kit@3.27.1
├── @types/node@24.12.2
├── @types/react-dom@19.2.3
├── @types/react@19.2.14
├── @vitejs/plugin-react@6.0.1
├── @vitest/coverage-v8@4.1.10
├── @vitest/ui@4.1.5
├── @xyflow/react@12.10.2
├── commitlint@21.2.1
├── dependency-cruiser@18.0.0
├── dexie@4.4.2
├── dompurify@3.4.12
├── esbuild@0.28.1
├── eslint-plugin-react-hooks@7.1.1
├── eslint-plugin-react-refresh@0.5.2
├── eslint@10.3.0
├── fake-indexeddb@6.2.5
├── framer-motion@12.38.0
├── globals@17.6.0
├── groq-sdk@1.4.0
├── husky@9.1.7
├── jsdom@29.1.1
├── lint-staged@17.0.7
├── lucide-react@1.14.0
├── madge@8.0.0
├── meriyah@7.1.0
├── monaco-editor@0.52.2
├── prettier@3.9.1
├── react-dom@19.2.5
├── react-is@19.2.7
├── react-router-dom@7.17.0
├── react@19.2.5
├── tsx@4.23.1
├── typescript-eslint@8.59.2
├── typescript@6.0.3
├── vite@8.0.16
├── vitest@4.1.5
├── ws@8.21.0
├── zod@4.4.3
└── zustand@4.5.7
```

### A6. `npx vitest run --coverage`

```
=== Timed out at 280s (context deadline exceeded) ===
```
