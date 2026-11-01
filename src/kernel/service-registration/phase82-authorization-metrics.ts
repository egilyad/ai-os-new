/**
 * Phase 82 â€” ÐµÐ´Ð¸Ð½Ñ‹Ð¹ ÑÐ»Ð¾Ð¹ Ð°Ð²Ñ‚Ð¾Ñ€Ð¸Ð·Ð°Ñ†Ð¸Ð¸ Ð¸ Ð¼ÐµÑ‚Ñ€Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ ÑÐ»Ð¾Ð¹ (SPEC_08, SPEC_03).
 *
 *  - authorizationService: ÐµÐ´Ð¸Ð½Ñ‹Ð¹ decision point Ð¿Ñ€Ð°Ð² Ñ ÑÐµÐ¼Ð°Ð½Ñ‚Ð¸ÐºÐ¾Ð¹ default deny
 *    (Ð·Ð°ÐºÑ€Ñ‹Ð²Ð°ÐµÑ‚ fail-open Ð² GovernanceService/AgentPermissionService).
 *  - metricsService: ÐµÐ´Ð¸Ð½Ñ‹Ð¹ in-memory Ð¼ÐµÑ‚Ñ€Ð¸Ñ‡ÐµÑÐºÐ¸Ð¹ ÑÐ»Ð¾Ð¹ (counters/histograms/
 *    gauges) Ñ Ð¾Ð¿Ñ†Ð¸Ð¾Ð½Ð°Ð»ÑŒÐ½Ñ‹Ð¼ Ð¿ÐµÑ€ÑÐ¸ÑÑ‚ÐµÐ½Ñ‚Ð½Ñ‹Ð¼ storage.
 */
import type { Phase } from './helpers';
import type { IEventBus } from '../types/interfaces';
import type { IMetricsService } from '../contracts/metrics';
import type { IProvenanceLinker } from '../contracts/provenance-link';
import type { IAgentSecurityGuard } from '../contracts/agent-security';
import type { IAgentRuntime } from '../contracts/agent-runtime';
import { AuthorizationService } from '../services/permissions/authorization-service';
import { MetricsService } from '../services/ops/metrics-service';
import { DexieMetricsStorage } from '../services/ops/metrics-dexie-storage';
import { MetricsCollector } from '../services/ops/metrics-collector';
import { EmbeddingService } from '../services/embedding-service';
import { DefaultEmbeddingService } from '../services/parity/default-embedding-service';
import { PluginRegistry } from '../services/plugins/plugin-registry';
import { PluginHost } from '../services/plugins/plugin-host';
import { PluginLoader } from '../services/plugins/plugin-loader';
import { AgentSecurityGuard } from '../services/security/agent-security-guard';
import { AgentRuntime } from '../services/agent-runtime/agent-runtime';
import { createAgentCallLlm, type AgentLlmDeps } from '../services/agent-runtime/agent-runtime-llm';
import { EvalHub } from '../services/eval/eval-hub';
import { AgentEvalDriver } from '../services/eval/agent-eval-driver';
import { ProvenanceLinker } from '../services/trust/provenance-linker';
import { ProvenanceCollector } from '../services/trust/provenance-collector';
import { BuilderNodeCatalog } from '../services/builder/node-catalog';

export const registerPhase82: Phase = (helpers, ctx) => {
    const { register } = helpers;

    register('authorizationService', () => new AuthorizationService());

    register('realtimeMetricsService', () => new MetricsService(new DexieMetricsStorage()));

    register('embeddingServiceHub', () => {
        const hub = new EmbeddingService();
        // Ð”ÐµÑ„Ð¾Ð»Ñ‚Ð½Ñ‹Ð¹ Ð¾Ñ„Ð»Ð°Ð¹Ð½-Ñ…ÑÑˆ-Ð±ÑÐºÐµÐ½Ð´ (Ð´ÐµÑ‚ÐµÑ€Ð¼Ð¸Ð½Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð½Ñ‹Ð¹, Ð±ÐµÐ· ÑÐµÑ‚Ð¸).
        const offline = new DefaultEmbeddingService();
        hub.register({
            id: 'offline-hash',
            isAvailable: () => true,
            embed: async ({ texts }) => {
                const vectors = await offline.embed(texts);
                return { vectors, dimensions: 384, provider: 'offline-hash' };
            },
        });
        return hub;
    });

    register('pluginRegistry', () => new PluginRegistry());

    register('pluginHost', () => new PluginHost());

    register('pluginLoader', (c) => {
        return new PluginLoader({
            registry: c.get<PluginRegistry>('pluginRegistry'),
            host: c.get<PluginHost>('pluginHost'),
        });
    });

    register('agentSecurityGuard', () => new AgentSecurityGuard());

    register(
        'agentRuntime',
        (c) =>
            new AgentRuntime({
                callLlm: createAgentCallLlm({
                    adapterRegistry: c.get<AgentLlmDeps['adapterRegistry']>('adapterRegistry'),
                    keyService: c.get<AgentLlmDeps['keyService']>('keyService'),
                }),
                securityGuard: c.get<IAgentSecurityGuard>('agentSecurityGuard'),
                metrics: c.get<IMetricsService>('realtimeMetricsService'),
            }),
    );

    register('evalHub', (c) => {
        const driver = new AgentEvalDriver(c.get<IAgentRuntime>('agentRuntime'));
        return new EvalHub({ runPrompt: (p) => driver.runPrompt(p) });
    });

    register('agentEvalDriver', (c) => new AgentEvalDriver(c.get<IAgentRuntime>('agentRuntime')));

    register('provenanceLinker', () => new ProvenanceLinker());

    register('builderNodeCatalog', () => new BuilderNodeCatalog());

    register('provenanceCollector', (c) => {
        const collector = new ProvenanceCollector(
            c.get<IEventBus>('eventBus'),
            c.get<IProvenanceLinker>('provenanceLinker'),
        );
        collector.start();
        return collector;
    });

    // Eager-ÑÑ‚Ð°Ñ€Ñ‚ ÐºÐ¾Ð»Ð»ÐµÐºÑ‚Ð¾Ñ€Ð° provenance.
    void ctx.container.get('provenanceCollector');

    register('metricsCollector', (c) => {
        const collector = new MetricsCollector(
            c.get<IEventBus>('eventBus'),
            c.get<IMetricsService>('realtimeMetricsService'),
        );
        collector.start();
        return collector;
    });

    // Eager-ÑÑ‚Ð°Ñ€Ñ‚ ÐºÐ¾Ð»Ð»ÐµÐºÑ‚Ð¾Ñ€Ð°: Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ¸ Ð´Ð¾Ð»Ð¶Ð½Ñ‹ Ð¶Ð¸Ñ‚ÑŒ Ñ ÑÐ°Ð¼Ð¾Ð³Ð¾ Ð½Ð°Ñ‡Ð°Ð»Ð°.
    void ctx.container.get('metricsCollector');

    void ctx;
};
