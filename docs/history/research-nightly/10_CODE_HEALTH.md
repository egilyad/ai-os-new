# CODE HEALTH — duplication, dead code, sprawl

RESEARCH-ONLY. Each item links to a primary finding; some are re-lensed from earlier cycles for the code-health view.

## CH-01 (CONFIRMED, Medium) — Three incompatible `StatusBadge` implementations

- Category: Code health / Duplication
- Location: `components/Common/status-vocabulary.tsx:128`, `components/ResearchPanel/research-constants.tsx:69`, `components/ResearchPanel/ResearchSharedComponents.tsx:5`.
- Evidence: three `StatusBadge` components with different prop signatures; `Common/index.ts` exports only `ErrorBoundary`. (Primary: FE-04.)
- Why it matters: a status-rendering bug fix must be applied in 3+ places; visual inconsistency. `src/styles/common.ts` tokens exist but are unused for this.
- Related: FE-04, OP-08.

## CH-02 (CONFIRMED, Medium) — Dual API-key encryption paths

- Category: Code health / Duplication
- Location: `kernel/security.ts` (`SecurityService` PBKDF2+AES-GCM) vs `kernel/services/key-management/key-vault.ts:98` (raw `crypto.subtle.encrypt`).
- Evidence: `key-migration.ts:120` uses `SecurityService.encrypt`; `key-vault.ts:98` uses `crypto.subtle` directly. (Primary: SEC-04 strength, re-lensed here as duplication.)
- Why it matters: two key-derivation/encryption schemes in the codebase can drift (different KDF params, different failure modes). One should be canonical.
- Related: SEC-04, OQ-08, OP-12.

## CH-03 (CONFIRMED, Low) — Dead event contract entry `KEY_COMPROMISE_SIGNAL`

- Category: Code health / Dead code
- Location: `kernel/events/event-registry.ts:56`.
- Evidence: defined, never emitted, never consumed (distinct from `KEY_COMPROMISED` and `COMPROMISE_SIGNAL`). (Primary: IN-08.)
- Why it matters: dead contract entries mislead integrators and inflate the event namespace.
- Related: IN-08, DOC-01, OQ-06.

## CH-04 (CONFIRMED, Low) — Dead/unenforced `adminToken` config

- Category: Code health / Dead config
- Location: `kernel/services/config-registry.ts:305-307` (comment: "no longer enforced … only JS-heap obfuscation, not real auth").
- Evidence: generated via `crypto.randomUUID()` but no auth path consumes it. (Primary: SEC-03.)
- Why it matters: phantom security posture; a future maintainer may assume auth exists.
- Related: SEC-03.

## CH-05 (CONFIRMED, Medium) — Pervasive inline-style sprawl

- Category: Code health / Maintainability
- Location: across `src/**/*.tsx` — verified **2576** `style={{` blocks (prior audit estimated ~9694 across all file types; the .tsx count alone is 2576).
- Evidence: `grep -c "style=\{\{"` over `src/**/*.tsx` = 2576.
- Why it matters: inline styles bypass the token module (`src/styles/common.ts`), block theming/dark-mode consistency, and create duplicated styling logic that must be maintained per-component. This is the structural driver behind FE-04 (no design system) and slows every UI change.
- Related: FE-04, OP-08.

## CH-06 (CONFIRMED, High) — `debate-llm-caller.ts` is a 1168-line untested god-function

- Category: Code health / Testability
- Location: `kernel/services/debate-runtime/debate-llm-caller.ts`.
- Evidence: 1168 lines; error classification via `includes(...)` + regex; NO `debate-llm-caller.test.ts`. (Primary: EB-16.)
- Why it matters: largest single untested risk; the fragile classifier was the root of the G-01..G-03 turn-loss fixes and remains brittle. Extract + unit-test the classifier.
- Related: EB-16, TE-01, OP-07.

## CH-07 (CONFIRMED, Medium) — `lazyService` DI-bypass at scale (~72 global accessors)

- Category: Code health / Architecture erosion
- Location: `kernel/instances/services-extras.ts` — verified **72** `lazyService(...)` exports; plus `services-core.ts`.
- Evidence: `grep -c "lazyService" services-extras.ts` = 72.
- Why it matters: every service adds a module-global lazy accessor that bypasses the container's construction graph (AR-01). The container becomes a registry-of-globals rather than an authority over wiring; it also makes the `invocation-types` LSP false-positive class possible (module-level resolution) and complicates testing isolation. This is the structural root behind several findings (FE-01 adjacency, AR-01).
- Related: AR-01, RH-02 (the LSP noise is a symptom of module-level resolution).

---

_Next: continue residual source areas (Director RunTab, cognitive panels, cross-module) or refine existing findings as long as STOP is not given._
