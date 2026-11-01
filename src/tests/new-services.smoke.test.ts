import { describe, expect, it } from 'vitest';
import { AuthorizationService } from '../kernel/services/permissions/authorization-service';
import { MetricsService } from '../kernel/services/ops/metrics-service';
import { EmbeddingService } from '../kernel/services/embedding-service';
import { EvalHub } from '../kernel/services/eval/eval-hub';
import { AgentRuntime } from '../kernel/services/agent-runtime/agent-runtime';
import { PluginRegistry } from '../kernel/services/plugins/plugin-registry';
import { interpret, draft } from '../kernel/services/debate-runtime/strategy-interpreter';
import { TokenCodec } from '../kernel/services/auth/token-codec';
import { AgentSecurityGuard } from '../kernel/services/security/agent-security-guard';
import { A2AClient } from '../kernel/services/interop/a2a-client';
import { ProvenanceLinker } from '../kernel/services/trust/provenance-linker';
import { BuilderNodeCatalog } from '../kernel/services/builder/node-catalog';
import { seal as vaultSeal, open as vaultOpen } from '../kernel/services/key-management/crypto/vault-crypto';

describe('smoke: новые сервисы (Фаза 0 + SPEC-каркасы)', () => {
    it('AuthorizationService: default deny', async () => {
        const svc = new AuthorizationService();
        expect((await svc.evaluate({ actor: 'a', actorType: 'agent', action: 'x', resource: 'y' })).effect).toBe('deny');
    });

    it('MetricsService: inc/snapshot', () => {
        const m = new MetricsService();
        m.inc('smoke.counter');
        expect(m.snapshot()['smoke.counter'].summary.sum).toBe(1);
    });

    it('EmbeddingService: без провайдеров бросает', async () => {
        const hub = new EmbeddingService();
        await expect(hub.embed(['x'])).rejects.toThrow(/No embedding provider/);
    });

    it('EvalHub: пустой набор → нулевой отчёт', async () => {
        const hub = new EvalHub({ runPrompt: async () => ({ output: '' }) });
        const report = await hub.run([]);
        expect(report.summary.total).toBe(0);
    });

    it('AgentRuntime: run с заглушкой LLM', async () => {
        const runtime = new AgentRuntime({ callLlm: async () => ({ content: 'ok' }) });
        const res = await runtime.run({ text: 'hi' }, { role: 'r' });
        expect(res.output).toBe('ok');
    });

    it('PluginRegistry: регистрация валидного манифеста', async () => {
        const reg = new PluginRegistry();
        const ok = await reg.register({
            id: 'smoke.p',
            name: 'P',
            version: '1.0.0',
            engines: { os: '4.0.0' },
            contributes: {},
        });
        expect(ok).toBe(true);
    });

    it('StrategyInterpreter: sequence → linear', () => {
        const p = interpret(draft('smoke', 'sequence'));
        expect(p.topology.kind).toBe('linear');
    });

    it('TokenCodec: round-trip', async () => {
        const codec = new TokenCodec('smoke-secret-1234567890');
        const token = await codec.issue({ tenantId: 't', userId: 'u', roles: [] });
        expect(await codec.verify(token)).not.toBeNull();
    });

    it('AgentSecurityGuard: redact', () => {
        const guard = new AgentSecurityGuard();
        expect(guard.redactSensitive('sk-abcdefghijklmnopqrstuvwxyz123456')).not.toContain('sk-abcdef');
    });

    it('A2AClient: конструктор не бросает', () => {
        expect(() => new A2AClient()).not.toThrow();
    });

    it('ProvenanceLinker: link/get', () => {
        const linker = new ProvenanceLinker();
        linker.link({ kind: 'debate', id: 'd' }, { kind: 'crystal', id: 'c' }, 'derived_from');
        expect(linker.get()).toHaveLength(1);
    });

    it('BuilderNodeCatalog: core exposed', () => {
        const catalog = new BuilderNodeCatalog();
        expect(catalog.get('agent')?.exposed).toBe(true);
    });

    it('VaultCrypto: seal/open', async () => {
        const pkg = await vaultSeal('pass', new TextEncoder().encode('data'));
        const opened = await vaultOpen('pass', pkg);
        expect(new TextDecoder().decode(opened as Uint8Array)).toBe('data');
    });
});
