import type { ApiKey } from '../types/metrics-types';

/**
 * IKeyVaultService — контракт хранилища секретов.
 *
 * SPEC_01 (ROADMAP_07): целевая модель — passphrase-защищённое шифрование
 * at-rest. Мастер-ключ выводится из passphrase при каждой разблокировке и
 * никогда не хранится. При заблокированном vault операции чтения/записи
 * отклоняются (fail-closed), а НЕ молчаливо возвращают открытый текст.
 */
export interface IKeyVaultService {
    /** Разблокировка по passphrase (легаси-вход, проверяет верификатор при наличии). */
    unlock(password: string): Promise<boolean>;
    /** Блокировка vault. Если переданы ключи — маскирует их значения. */
    lock(keys?: ApiKey[]): void;
    isLocked(): boolean;

    /** Принудительное создание/пересоздание vault (новая соль + верификатор). */
    createVault(passphrase: string): Promise<boolean>;
    /** Есть ли уже созданный vault (т.е. хранится ли верификатор). */
    hasVault(): boolean;
    /** Проверка пароля без разблокировки (для UX). */
    verifyPassphrase(passphrase: string): Promise<boolean>;
    /** Разблокировка с проверкой верификатора (fail-closed при неверном пароле). */
    unlockWithPassphrase(passphrase: string): Promise<boolean>;

    /** Fail-closed: при locked возвращает null. */
    encryptKey(plaintext: string): Promise<string | null>;
    /** Fail-closed: при locked возвращает null (не ciphertext). */
    decryptKey(ciphertext: string): Promise<string | null>;
    decryptAllKeys(keys: ApiKey[]): Promise<ApiKey[]>;
    encryptAllKeys(keys: ApiKey[]): Promise<ApiKey[]>;
    stripPlaintextKeys(keys: ApiKey[]): ApiKey[];
    purgeKey(key: ApiKey): void;
    purgeAll(keys: ApiKey[]): void;
}
