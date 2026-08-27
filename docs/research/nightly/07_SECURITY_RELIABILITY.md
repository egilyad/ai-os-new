# SECURITY / RELIABILITY FINDINGS

Mode: RESEARCH ONLY — no code changes. Findings reference primary IDs (EB/IN/FE) where applicable.

## SEC-01 (CONFIRMED, Medium) — Key-compromise signal wiring is asymmetric: `compromiseKey()` emits unconsumed `KEY_COMPROMISED` while `COMPROMISE_SIGNAL` is consumed

- Category: Security / Integration
- Location: `key-management/key-status.ts:162-181` (`compromiseKey` → inline quarantine + `emitOnce(KEY_COMPROMISED)`); `compromise-webhook-service.ts` (emits `COMPROMISE_SIGNAL` / `COMPROMISE_SIGNAL_REJECTED`); `notification-webhook-service.ts:178-179` (consumes `COMPROMISE_SIGNAL`).
- Evidence: `compromiseKey()` does the protective work inline (`modifyKey` → `health.compromiseKey` → `saveKeys` → `notify`) and THEN emits `KEY_COMPROMISED`, which has NO subscriber (IN-06). Meanwhile external compromise webhooks go through `COMPROMISE_SIGNAL`, which IS wired to the notification service. Two separate compromise signal names with different consumption fates.
- Why it matters: the internal quarantine path and the external webhook path use different event names, so a key quarantined by `compromiseKey()` never reaches the `COMPROMISE_SIGNAL`/notification pipeline unless something else bridges them. The dedicated `KEY_COMPROMISED` event is dead weight. (Severity downgraded from the original High "blind spot" because the key IS quarantined inline — the gap is observability/telemetry, not protection.)
- Confidence: High.
- Suggested direction: unify the two signals — have `compromiseKey()` also emit/forward `COMPROMISE_SIGNAL`, or subscribe an audit/telemetry listener to `KEY_COMPROMISED`. Document a single canonical compromise event. Flag only.
- Related: IN-06, IN-08, SEC-02.

## SEC-02 (CONFIRMED, Medium) — `webhookSecret` is generated and stored in `localStorage` in plaintext

- Category: Security / Secrets handling
- Location: `kernel/services/config-registry.ts:308-323` (`webhookSecret = localStorage.getItem(STORAGE_KEY)`; if absent, `crypto.randomUUID()` then `localStorage.setItem(STORAGE_KEY, webhookSecret)`).
- Evidence:
  ```ts
  const STORAGE_KEY = 'superagents_webhook_secret';
  webhookSecret = localStorage.getItem(STORAGE_KEY) || undefined;
  if (!webhookSecret) {
    webhookSecret = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, webhookSecret); // plaintext
  }
  ```
- Why it matters: a webhook secret persisted in `localStorage` is readable by any script running in the page origin (XSS). For a local-first single-user app the threat surface is smaller, but any injected script (e.g., via a malicious agent output rendered unsanitized, or a compromised dependency) can exfiltrate the secret and forge/intercept webhook traffic. Secrets should not live in plaintext web-storage.
- Confidence: High.
- Suggested direction: store the webhook secret in the encrypted vault (the `SecurityService` already exists and encrypts API keys at rest — see SEC-04 strength), or derive it from the vault key; avoid plaintext `localStorage`. At minimum, document the threat model. Flag only.
- Related: SEC-01, SEC-04, SEC-03.

## SEC-03 (CONFIRMED, Low) — `adminToken` is dead/unenforced config in `ConfigRegistry.security`

- Category: Security / Dead config / Code health
- Location: `kernel/services/config-registry.ts:305-307` (`adminToken` kept "for forward-compat with future server mode; no longer enforced (single-user local-first app — it was only JS-heap obfuscation, not real auth)").
- Evidence: the comment itself states it is not enforced; `crypto.randomUUID()` is used as a default. No auth check references it.
- Why it matters: carrying an "auth" token that does nothing is misleading — a future maintainer may assume authentication exists. It is phantom security posture. Low impact (no false sense of auth is enforced), but worth removing or clearly gating behind a real server-mode auth implementation.
- Confidence: High.
- Suggested direction: remove `adminToken` from the runtime defaults, or implement real server-mode auth if that mode is ever built. Flag only.
- Related: SEC-02, SEC-01.

## SEC-04 (VERIFIED STRENGTH, not a defect) — API keys ARE encrypted at rest via `SecurityService` (PBKDF2 + AES-GCM)

- Category: Security / Positive verification
- Location: `kernel/security.ts` (`SecurityService` — PBKDF2 100k iterations, AES-GCM 256); `kernel/runtime.ts:240` registers it; `kernel/dal/key-migration.ts:120-121` (`if (!securityService.isLocked()) await securityService.encrypt(k.key)`); `key-vault.ts:98` uses `crypto.subtle.encrypt` directly.
- Evidence: key migration encrypts the raw key through `SecurityService.encrypt` when the vault is unlocked; the salt is stored in `localStorage` (acceptable — salt is not secret).
- Why it matters: contrary to a naive "keys stored plaintext" fear, the system does encrypt API keys at rest behind a password-derived key. This is a genuine strength and should be preserved. Note there are TWO encryption code paths (`SecurityService` and raw `crypto.subtle` in `key-vault.ts`) — a consolidation opportunity, not a defect.
- Confidence: High.
- Suggested direction: converge `key-vault.ts` onto `SecurityService` to remove the dual path. Flag only (opportunity, not a bug).
- Related: SEC-02 (the webhook secret does NOT use this path — that is the gap).

---

_Next areas appended as research continues._
