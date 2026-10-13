/**
 * SidecarComputerExecutor — Phase 71 (+gateway-режим). Исполнитель
 * computer-действий loop'а двумя путями:
 *
 * 1. direct (default): POST { action, ...params, ticketId?, allowedDomains? }
 *    на URL из localStorage `browserUse.actUrl` / env `VITE_BROWSER_USE_ACT_URL`
 *    (fallback `http://localhost:3100/act`). Ответ: `{ screenshot?, output?, error? }`.
 * 2. gateway: если direct-URL НЕ задан явно, но задана тройка
 *    gatewayUrl+gatewaySecret+companyId — каждое действие идёт отдельным
 *    run'ом (`POST /api/companies/:cid/runs` → `POST /api/runs/:id/execute`
 *    с adapter `computer-act`; gateway закрывает run после каждого вызова).
 *    Для удалённых HTTPS-сетапов, где браузер не достаёт sidecar напрямую.
 *
 * Не валидирует сами действия (allowlist — на стороне sidecar/шлюза, рядом
 * с исполнителем): здесь только транспорт — timeout/abort/redirect-guard.
 */

import type { ComputerExecutor, ComputerActionInput, ComputerActionResult } from './computer-use-loop-service';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('SidecarComputerExecutor');

export const DEFAULT_ACT_URL = 'http://localhost:3100/act';
const EXEC_TIMEOUT_MS = 60_000;

export interface SidecarComputerConfig {
    actUrl?: string;
    allowedDomains?: string[];
    gatewayUrl?: string;
    gatewaySecret?: string;
    companyId?: string;
}

function readDefaultConfig(): SidecarComputerConfig {
    const cfg: SidecarComputerConfig = {};
    try {
        const env = (import.meta as unknown as { env?: Record<string, string> })?.env;
        if (env?.['VITE_BROWSER_USE_ACT_URL']) cfg.actUrl = env['VITE_BROWSER_USE_ACT_URL'];
        if (env?.['VITE_COMPANY_GATEWAY_URL']) cfg.gatewayUrl = env['VITE_COMPANY_GATEWAY_URL'];
    } catch {
        /* нет import.meta в тестах */
    }
    try {
        if (typeof localStorage !== 'undefined') {
            const url = localStorage.getItem('browserUse.actUrl');
            if (url) cfg.actUrl = url;
            const gw = localStorage.getItem('companyGateway.url');
            if (gw) cfg.gatewayUrl = gw;
            const secret = localStorage.getItem('companyGateway.secret');
            if (secret) cfg.gatewaySecret = secret;
            const cid = localStorage.getItem('browserUse.companyId');
            if (cid) cfg.companyId = cid;
        }
    } catch {
        /* private mode / worker без localStorage */
    }
    for (const k of ['actUrl', 'gatewayUrl', 'gatewaySecret', 'companyId'] as const) {
        if (typeof cfg[k] === 'string' && !(cfg[k] as string).trim()) delete cfg[k];
    }
    return cfg;
}

function gatewayTriple(cfg: SidecarComputerConfig): { url: string; secret: string; companyId: string } | null {
    if (cfg.gatewayUrl && cfg.gatewaySecret && cfg.companyId) {
        return { url: cfg.gatewayUrl, secret: cfg.gatewaySecret, companyId: cfg.companyId };
    }
    return null;
}

export class SidecarComputerExecutor implements ComputerExecutor {
    private getConfig: () => SidecarComputerConfig;

    constructor(opts: { getConfig?: () => SidecarComputerConfig } = {}) {
        this.getConfig = opts.getConfig ?? readDefaultConfig;
    }

    async init(): Promise<void> {
        LOGGER.info('SidecarComputerExecutor', 'init', { actUrl: this.actUrl() });
    }

    async destroy(): Promise<void> {
        // stateless (per-request AbortController) — нечего закрывать
    }

    actUrl(): string {
        try {
            const raw = this.getConfig().actUrl?.trim();
            if (raw) return raw.replace(/\/$/, '');
        } catch {
            /* ignore */
        }
        return DEFAULT_ACT_URL;
    }

    /** Куда едет действие: явный direct-URL, иначе gateway, иначе default-direct. */
    describeRoute(): 'direct' | 'gateway' | 'direct-default' {
        let cfg: SidecarComputerConfig = {};
        try {
            cfg = this.getConfig();
        } catch {
            /* ignore */
        }
        if (cfg.actUrl?.trim()) return 'direct';
        if (gatewayTriple(cfg)) return 'gateway';
        return 'direct-default';
    }

    async execute(action: ComputerActionInput, ctx: { ticketId?: string }): Promise<ComputerActionResult> {
        let cfg: SidecarComputerConfig = {};
        try {
            cfg = this.getConfig();
        } catch {
            /* ignore — default'ы ниже */
        }
        if (!cfg.actUrl?.trim() && gatewayTriple(cfg)) {
            try {
                return await this.executeViaGateway(action, ctx, cfg);
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                throw new Error(`computer actuator failed: ${msg}`, { cause: e });
            }
        }
        const url = this.actUrl();
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), EXEC_TIMEOUT_MS);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...action,
                    ticketId: ctx.ticketId,
                    allowedDomains: cfg.allowedDomains,
                }),
                signal: ctl.signal,
                redirect: 'manual',
            });
            if (res.status >= 300 && res.status < 400) {
                throw new Error(`actuator refused redirect (HTTP ${res.status})`);
            }
            const data = (await res.json().catch(() => ({}))) as {
                screenshot?: unknown;
                output?: unknown;
                error?: unknown;
            };
            if (!res.ok) {
                throw new Error(
                    typeof data.error === 'string' && data.error
                        ? data.error.slice(0, 500)
                        : `actuator HTTP ${res.status}`,
                );
            }
            return {
                screenshotBase64: typeof data.screenshot === 'string' ? data.screenshot : undefined,
                output: typeof data.output === 'string' ? data.output.slice(0, 2000) : undefined,
                error: typeof data.error === 'string' && data.error ? data.error.slice(0, 2000) : undefined,
            };
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            LOGGER.warn('SidecarComputerExecutor', 'execute failed', { action: action.action, error: msg });
            throw new Error(`computer actuator failed: ${msg}`, { cause: e });
        } finally {
            clearTimeout(timer);
        }
    }

    private async executeViaGateway(
        action: ComputerActionInput,
        ctx: { ticketId?: string },
        cfg: SidecarComputerConfig,
    ): Promise<ComputerActionResult> {
        // Зеркало BrowserUseService.viaGateway под adapter 'computer-act'.
        const gw = gatewayTriple(cfg);
        if (!gw) throw new Error('computer actuator gateway not configured');
        const base = gw.url.replace(/\/$/, '');
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${gw.secret}` };
        const runRes = await fetch(`${base}/api/companies/${encodeURIComponent(gw.companyId)}/runs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ trigger: 'manual', input: { action: action.action } }),
            signal: AbortSignal.timeout(10_000),
        });
        const runBody = (await runRes.json().catch(() => ({}))) as {
            run?: { id?: string };
            id?: string;
            error?: string;
        };
        if (!runRes.ok) throw new Error(`gateway create run failed: ${runBody.error || `HTTP ${runRes.status}`}`);
        const runId = runBody.run?.id ?? runBody.id;
        if (!runId) throw new Error('gateway create run: no run id in response');

        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), EXEC_TIMEOUT_MS);
        try {
            const exRes = await fetch(`${base}/api/runs/${encodeURIComponent(runId)}/execute`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    adapter: 'computer-act',
                    config: { allowedDomains: cfg.allowedDomains },
                    input: { ...action, ticketId: ctx.ticketId },
                }),
                signal: ctl.signal,
            });
            const exBody = (await exRes.json().catch(() => ({}))) as { stdout?: string; error?: string };
            if (!exRes.ok) throw new Error(`gateway execute failed: ${exBody.error || `HTTP ${exRes.status}`}`);
            let data: { screenshot?: unknown; output?: unknown; error?: unknown } = {};
            try {
                const parsed: unknown = JSON.parse(String(exBody.stdout ?? ''));
                if (typeof parsed === 'object' && parsed !== null) {
                    data = parsed as typeof data;
                }
            } catch {
                data = { output: String(exBody.stdout ?? '').slice(0, 2000) };
            }
            return {
                screenshotBase64: typeof data.screenshot === 'string' ? data.screenshot : undefined,
                output: typeof data.output === 'string' ? data.output.slice(0, 2000) : undefined,
                error: typeof data.error === 'string' && data.error ? data.error.slice(0, 2000) : undefined,
            };
        } finally {
            clearTimeout(timer);
        }
    }
}
