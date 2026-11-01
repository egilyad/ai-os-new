/**
 * Командный режим (SPEC_10) — мини-контракты авторизации.
 *
 * Цель: tenant-изоляция и роли на серверном/синк-режиме, где сейчас единый
 * SYNC_SECRET без разграничения пользователей.
 */

export interface TenantContext {
    tenantId: string;
    userId: string;
    roles: string[];
}

export interface ITokenCodec {
    /** Выпуск подписанного opaque-токена. */
    issue(ctx: TenantContext, ttlMs?: number): Promise<string>;
    /** Верификация и разбор токена. Возвращает null при невалидном/протухшем. */
    verify(token: string): Promise<TenantContext | null>;
}
