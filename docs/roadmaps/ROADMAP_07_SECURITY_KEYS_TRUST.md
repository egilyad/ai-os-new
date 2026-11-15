# Роадмап: Безопасность, ключи, секреты, доверие, аудит

> Область кода: `src/kernel/services/` → key-management/, permissions/, trust/, capability-trust/,
> storage/, utils/pii-redact.ts, security.ts; панели KeyTable/AddKeyModal/GovernancePanel/ProvenancePanel и др.

## Что есть сегодня

### Ключи и секреты (`key-management/`, 17 файлов)

- `KeyVault`, `KeyRegistry`, `KeyHealthService`, `KeyQuotaService`, `KeyAnalytics`,
  `KeyFingerprintService`, `KeyAlertService`, `KeyLifecycle`, `KeyPoolSelector`, `VirtualKeyService`, …
- Хранение: боликривые API-ключи сейчас в **IndexedDB в открытом виде** (см. `dev-status-critical`).
- `KeyVault` — **fail-open** + `deviceKey` в plaintext (localStorage).

### Политики и разрешения

- `PolicyService` (~565 стр.) — политики, default-deny для MCP.
- `AgentPermissionService` (~279 стр.) — режимы доступа (read-only/guarded/workspace/full).
- `GuardrailService` — guardrails.
- МодуGovernanceService` (~197 стр.) — capability-гранты, trust-EMA, роли. **evaluate == fail-open (allow)**.

### Доверие и аудит

- `TrustService`, `ProvenanceService`, `CapabilityTrustService` (ledger честности: declared → discovered → verified).
- `AuditService` (~88 стр.) — append-only hash-chained fnv1a. Плюс ещё один параллельный аудит-лог.
- PII: `utils/pii-redact.ts` — маскировка PII в трейсах/памяти/чате/инструментах/логах событий.
- Список блокировки «опасного» контента (CSAM/самоповреждение/оружие/наркотики).

---

## Критические проблемы (из `dev-status-critical.md`)

1. **KeyVault fail-open + deviceKey в plaintext** — шифрование обесценивается; нужен passphrase-UI.
2. **API-ключи/секреты в открытом виде в IndexedDB**.
3. **Multi-tenant IDOR / общий SYNC_SECRET / WS cross-tenant leak** — нужен server-скоупинг.
4. **CSAM/модерация изображений отсутствует** — нужен внешний сервис.
5. **MamanceService.evaluate — fail-open** (allow) при capability-проверке fail-closed.
6. **Unbounded-провайдеры разрешены по умолчанию**.

---

## Роадмап

### P0 — Критические (обязательно, перед публичным использованием)

- [ ] **Passphrase-UI + шифрование ключей**: WebCrypto (AES-GCM), ключ из passphrase (PBKDF2), не хранить deviceKey в plaintext.
- [ ] Убрать fail-open в KeyVault и GovernanceService (fail-closed для секретов).
- [ ] **Server-скоупинг** для sync-server: per-tenant секреты, изоляция WS (убрать общий SYNC_SECRET).
- [ ] **Модерация изображений** (CSAM и пр.) — внешний сервис или локальная модель; заблокировать без неё.
- [ ] Ограничить unbounded-провайдеры по умолчанию (бюджет/allowlist).

### P1 — Единая модель прав

- [ ] Ввести единый `IAuthorizationService` (RBAC/ABAC), консолидировать PolicyService/AgentPermissionService/GovernanceService.
- [ ] Связать политики с фактическим исполнением инструментов (сейчас дефолтные политики не подключены к исполнению).
- [ ] Закрыть неаутентифицированные мутации PolicyService.

### P2 — Доверие и provenance

- [ ] Единый AuditService (убрать параллельный лог), + аудит «кто что изменил в политиках».
- [ ] CapabilityTrust: автоматическая верификация заявленных способностей агентов.

### P3 — Расширения

- [ ] **WebAuthn / биометрия** для разблокировки хранилища секретов.
- [ ] **Экспорт/импорт шифрованных ключей** (portable, с passphrase).

---

## Критерии «готово»

- Ключи зашифрованы; нет plaintext в IndexedDB; KeyVault fail-closed.
- Нет общего SYNC_SECRET; WS изолирован по tenant.
- Модерация изображений работает (или включена блокировка).
- Единый AuditService, политики применяются к исполнению.

---

## Уточнения по коду (после глубокого изучения, 2026-10)

- **KeyVault** (`key-management/key-vault.ts`) существует (AES-GCM-256, PBKDF2 600k, salt 16B, IV 12B, `extractable:false`), но **не встроен**: шапка файла — «Vault system removed». `encryptAllKeys/decryptAllKeys` короткозамыкаются при locked; `decryptKey` возвращает ciphertext как есть.
- **deviceKey** (`key-service.ts:399`) — 32 случайных байта, хранится в localStorage (`key-vault:device-key`); fail-open. `SecurityService` (`security.ts`) есть, но не инициализируется паролем.
- **Canonical хранение** — таблица `apiKeys` (Dexie) plaintext; `useKeyStore.refresh` читает напрямую из Dexie (в обход vault).
- **Fail-open**: `GovernanceService.evaluate` (нет совпадения → allow), `AgentPermissionService`/`BASE_PERMISSION_RULES` (всё allow, last-match), `decryptKey` при locked.
- **LocalSecretStore** — plaintext в Dexie keyValue; set/delete неатомарны (индекс+значение).
- **AuditService** — единственный настоящий hash-chain (FNV-1a; не криптостойкий). `provenance-service.ts` — граф, не hash-chain.
- **Passphrase-UI отсутствует**; `SettingsPanel.tsx:365` прямо предупреждает.
- События vault/passphrase в реестре отсутствуют.
- **→ Полная спецификация: `SPEC_01_CRYPTO_VAULT.md` и `SPEC_08_AUTHORIZATION_LAYER.md`.**
