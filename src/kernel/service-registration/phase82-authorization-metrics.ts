/**
 * Phase 82 — единый слой авторизации и метрический слой (SPEC_08, SPEC_03).
 *
 *  - authorizationService: единый decision point прав с семантикой default deny
 *    (закрывает fail-open в GovernanceService/AgentPermissionService).
 *  - metricsService: единый in-memory метрический слой (counters/histograms/
 *    gauges) с опциональным персистентным storage.
 */
import type { Phase } from './helpers';
import type { IEventBus } from '../types/interfaces';
import type { IMetricsService } from '../contracts/metrics';
import type { IProvenanceLinker } from '../contracts/provenance-link';
import { AuthorizationService } from '../services/permissions/authorization-service';
import { MetricsService } from '../services/ops/metrics-service';
import { DexieMetricsStorage } from '../services/ops/metrics-dexie-storage';
import { MetricsCollector } from '../services/ops/metrics-collector';
import { EmbeddingService } from '../services/embedding-service';
import { EmbeddingPortAdapter } from '../services/interop/embedding-port-adapter';
import { DefaultEmbeddingService } from '../services/parity/default-embedding-service';
import { PluginRegistry } from '../services/plugins/plugin-registry';
import { AgentSecurityGuard } from '../services/security/agent-security-guard';
import { AgentRuntime } from '../services/agent-runtime/agent-runtime';
import { EvalHub } from '../services/eval/eval-hub';
import { ProvenanceLinker } from '../services/trust/provenance-linker';
import { ProvenanceCollector } from '../services/trust/provenance-collector';

export const registerPhase82: Phase = (helpers, ctx) => {
    const { register } = helpers;

    register('authorizationService', () => new AuthorizationService());

    register('metricsService', () => new MetricsService(new DexieMetricsStorage()));

    register('embeddingServiceHub', () => {
        const hub = new EmbeddingService();
        // Дефолтный офлайн-хэш-бэкенд (детерминированный, без сети).
        hub.register(new EmbeddingPortAdapter(new DefaultEmbeddingService(), 'offline-hash'));
        return hub;
    });

    register('pluginRegistry', () => new PluginRegistry());

    register('agentSecurityGuard', () => new AgentSecurityGuard());

    register('agentRuntime', () =>
        new AgentRuntime({
            // Дефолтная заглушка; реальный LLM-вызов подключается при первом
            // прогоне/интеграции с routerService.
            callLlm: async () => ({ content: '' }),
        }),
    );

    register('evalHub', () =>
        new EvalHub({
            runPrompt: async () => ({ output: '' }),
        }),
    );

    register('provenanceLinker', () => new ProvenanceLinker());

    register('provenanceCollector', (c) => {
        const collector = new ProvenanceCollector(
            c.get<IEventBus>('eventBus'),
            c.get<IProvenanceLinker>('provenanceLinker'),
        );
        collector.start();
        return collector;
    });

    // Eager-старт коллектора provenance.
    void ctx.container.get('provenanceCollector');

    register('metricsCollector', (c) => {
        const collector = new MetricsCollector(
            c.get<IEventBus>('eventBus'),
            c.get<IMetricsService>('metricsService'),
        );
        collector.start();
        return collector;
    });

    // Eager-старт коллектора: подписки должны жить с самого начала.
    void ctx.container.get('metricsCollector');

    void ctx;
};
