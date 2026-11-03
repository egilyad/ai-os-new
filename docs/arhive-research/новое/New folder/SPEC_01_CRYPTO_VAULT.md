# Спецификация: Зашифрованное хранилище ключей (crypto vault) + passphrase-UI

> Статус: готово к реализации. Приоритет: P0 (критично, см. `dev-status-critical`).
> Связано: `ROADMAP_07`, `PREP_01 (R-A4)`, `ROADMAP_00` Фаза 0.1.

---

## 1. Проблема (факты из кода)

- `KeyVault` (`src/kernel/services/key-management/key-vault.ts`) существует (AES-GCM-256, PBKDF2 600k), но **не встроен**: «Vault system removed — keys stored as plaintext».
- `KeyService.unlockVault()` (`key-service.ts:399`) создаёт `deviceKey` (32 байта) и **хранит его в localStorage** (`key-vault:device-key`) — защита косметическая (fail-open).
- Каноническое хранение ключей — таблица `apiKeys` в IndexedDB (Dexie) в открытом виде. Отражение через `useKeyStore.refresh` читает напрямую из Dexie (в обход vault).
- `SecurityService` (`src/kernel/security.ts`) есть, но нигде не инициализируется паролем.
- UI: в `SettingsPanel.tsx:365` прямо признаётся «passphrase encryption via KeyVault is not wired up yet».
- `LocalSecretStore` — plaintext в Dexie keyValue, неатомарные set/delete.

## 2. Цель

- У всех секретов (API-ключи, локальные секреты) — шифрование at rest; расшифровка только при введённой passphrase.
- Passphrase не хранится; мастер-ключ не хранится (выводится из passphrase).
- Fail-closed: при заблокированном vault операции записи/чтения/экспорта отклоняются (не падать в plaintext).

## 3. Формат зашифрованного пакета (v1)

```jsonc
{
  "version": 1,
  "kdf": {
    "name": "PBKDF2",
    "hash": "SHA-256",
    "salt": "<base64 16B>",
    "iterations": 600000,
  },
  "cipher": { "name": "AES-GCM", "iv": "<base64 12B>" },
  "ciphertext": "<base64>",
}
```

- GCM уже включает auth-тег (целостность/аутентификация).
- `extractable: false` для мастер-ключа.
- При желании позже — `kdf.name = "Argon2id"` (WASM), формат пакета не меняется.

## 4. Ключевые реализации

### 4.1 `VaultCrypto` (новый, чистый, в `src/kernel/services/key-management/crypto/vault-crypto.ts`)

```ts
interface VaultPackage { version: 1; kdf: {...}; cipher: {iv}; ciphertext: string }
async function deriveKey(passphrase: string, kdf): Promise<CryptoKey>   // PBKDF2 → AES-GCM-256, extractable:false
async function seal(passphrase: string, plaintext: Uint8Array): Promise<VaultPackage>
async function open(passphrase: string, pkg: VaultPackage): Promise<Uint8Array | null> // null при неверном пароле
async function verify(passphrase: string, verifier: VaultPackage): Promise<boolean>    // для UX «неверный пароль»
```

- Выполнять deriveKey в **Web Worker** (не блокировать UI; 600k итераций).

### 4.2 `KeyVault` (доработка существующего)

- Убрать `deviceKey`-логику. Вместо неё: `unlock(passphrase)`, `lock()`, `isLocked()`.
- Заменить `encryptAllKeys` (при locked возвращает как есть) на **fail-closed**: при locked — бросать `VaultLockedError` и отклонять запись/чтение.
- Убрать catch-«молчаливое глотание» в `unlockVault`.

### 4.3 `KeyRegistry.doSaveKeysWithSnapshot` (`key-registry.ts:586`)

- Запись: `vault.encryptAllKeys(snapshot)` под реальной passphrase → `keyStore.bulkPut` (одна Dexie-запись = один зашифрованный пакет).
- Чтение: расшифровка при разблокированном vault.
- `exportKeys`: при locked — отклонять (уже fail-closed).

### 4.4 `LocalSecretStore` / `ExternalSecretsService`

- Секреты шифровать тем же VaultCrypto.
- Атомарность: обернуть set/delete в одну Dexie-транзакцию (`db.transaction('rw', [secrets, index], async () => {...})`), см. `PREP_03`/research по Dexie.

### 4.5 Passphrase-UI (новое)

- Компонент `VaultUnlockScreen` (или интеграция в `SettingsPanel`): при первом входе — задать passphrase (+ подтверждение, + подсказки); далее — «Разблокировать/Заблокировать».
- Выход/неактивность → `lock()`; после lock UI показывает только заблокированное состояние.
- Не хранить passphrase нигде; не логировать.

## 5. События (добавить в event-registry)

```
key:vault:locked     z.object({})
key:vault:unlocked   z.object({})
key:vault:created     z.object({ at: z.string() })
key:vault:error       z.object({ reason: z.string() })
```

## 6. Интеграция и флоу

- Bootstrap: при старте vault locked → UI показывает разблокировку перед активной работой с ключами.
- `useKeyStore`: вместо чтения `apiKeys` напрямую — через `KeyService` (vault-aware).
- Отражение в `AddKeyModal`/`KeyTable`: если locked — требуется разблокировать.

## 7. Миграция

- Скрипт: если не ` `apiKeys` (plaintext) — при создании vault предложить «зашифровать сейчас» (записи в новый пакет) и удалить старые plaintext-записи.
- Не оставлять legacy `super_agents_api_keys` (localStorage) — мигрировать и удалить.

## 8. Тесты (обязательно)

- Крипто: seal/open round-trip; неверный пароль → null; смена пароля; XOR-байты.
- Фаил-closed: все операции при locked отклоняются.
- Атомарность LocalSecretStore (set/delete в транзакции; сбой → откат).
- Интеграция: KeyService с vault (добавить/изменить/экспорт/импорт).
- UI: passphrase-экран, блокировка/разблокировка.

## 9. Definition of Done

- Нет plaintext apiKeys/secretов в хранилище; vault fail-closed; passphrase-UI работает; миграция выполнена; события добавлены; тесты зелёные.
