# Исследование: WebCrypto, local-first sync, атомарность Dexie

## (а) Зашифрованный «пакет» для секретов

Нативные WebCrypto: PBKDF2 и HKDF (KDF), AES-GCM (аутентифицированное). Argon2 — нет (нужен WASM).

Формат пакета (v1):

```jsonc
{
  "version": 1,
  "kdf": {
    "name": "PBKDF2",
    "hash": "SHA-256",
    "salt": "<base64 16B>",
    "iterations": 600000,
  },
  "cipher": {
    "name": "AES-GCM",
    "iv": "<base64 12B>",
    "aad": "<base64, опц.>",
  },
  "ciphertext": "<base64>",
}
```

Принципы: PBKDF2 ≥600k итераций (OWASP); IV 12B новый на каждое шифрование; salt рандомный; версионирование `version` + параметры в пакете (позволяет миграцию на Argon2id); PBKDF2 в Web Worker (не блокировать UI).

Псевдокод:

```js
async function deriveKey(passphrase, kdf) {
  const material = await crypto.subtle.importKey(
    'raw',
    encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}
async function seal(passphrase, plaintext) {
  /* salt, iv, encrypt → pkg */
}
async function open(passphrase, pkg) {
  /* GCM сам отклоняет неверный пароль */
}
```

## (б) Мастер-ключ и разблокировка

- Сырой ключ НЕ хранить (ни localStorage, ни IndexedDB). Варианты: passphrase (PBKDF2/Argon2) — портативно; WebAuthn (device-bound, анти-фишинг); биометрия.
- Гибрид: WebAuthn-ключ устройства оборачивает мастер-ключ (wrap), обёрнутый хранится в IndexedDB; для переноса — экспорт через безопасный канал или passphrase-fallback.
- localStorage vs IndexedDB: оба читаемы при XSS — шифровать в любом случае. IndexedDB предпочтителен (объём + Blob/ArrayBuffer + транзакции).

## (в) Local-first sync

- CRDT (Yjs/Automerge), operational transform, «файлы как база данных», Ink&Switch манифест.
- Для vault: весь vault — один зашифрованный блоб; внутри CRDT-семантика почти бесполезна (нужна расшифровка). Рекомендация: начать с простого «один блоб + write queue + LWW по версии/времени»; CRDT — только если требуется конкурентное редактирование полей с нескольких устройств (Yjs быстрый, Automerge хранит историю).
- Логически разбить на записи (id → encrypted record) + версия; синк per-record LWW или Yjs внутри шифрования.

## (г) Атомарность в Dexie

```js
await db.transaction('rw', db.secrets, db.meta, async () => {
  await db.secrets.bulkPut([/*...*/]);
  await db.meta.update('vaultVersion', (v) => v + 1);
});
```

- Все операции в одном колбэке; исключение → abort (откат).
- bulкPut/bulkAdd — одна транзакция.
- Одна запись = целый зашифрованный пакет (атомарно по построению).
- `durability: 'strict'` для критичных данных (IDBTransaction.durability).

Источники: MDN (SubtleCrypto.deriveKey/encrypt/deriveBits, IDBTransaction, indexedDB), OWASP Password Storage Cheat Sheet, dexie.org/docs/Transaction, docs.yjs.dev, automerge.org, inkandswitch.com/local-first.html.
