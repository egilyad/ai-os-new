import type {
    ServiceObsInfo,
    DocEvent,
    DocEventCoverage,
    ObsCoverage,
    ObsGapsReport,
    ObsReadFile,
    IObsGapsService,
} from '../contracts/obs-gaps';

const STATIC_SERVICES: ServiceObsInfo[] = [
    {
        name: 'configService',
        hasEvents: false,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'settingsService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'keyService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: true,
        hasTracing: false,
    },
    {
        name: 'toolService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'sandboxService',
        hasEvents: false,
        hasLogger: false,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
        notes: 'No events, no logger',
    },
    {
        name: 'agentService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'memoryService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: true,
        hasTracing: false,
    },
    {
        name: 'cognitiveService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: true,
    },
    {
        name: 'policyService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'roleService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'snapshotService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'debateService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'metricsService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: true,
    },
    {
        name: 'advisorService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'pricingService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'budgetService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'usageTracker',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'cacheService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'chatService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: true,
    },
    {
        name: 'timelineService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: true,
    },
    {
        name: 'adminService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: true,
        hasTracing: false,
    },
    {
        name: 'monitoringService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: true,
        hasTracing: true,
    },
    {
        name: 'routingPolicyService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'whatIfService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'pressureMapService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: true,
    },
    {
        name: 'diagnosticService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: true,
    },
    {
        name: 'notificationWebhookService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'compromiseWebhookService',
        hasEvents: true,
        hasLogger: false,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
        notes: 'No logger',
    },
    {
        name: 'externalSecretsService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'workspaceService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'probeService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    {
        name: 'consistencyChecker',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
    // consistencyHealingPipeline: same class as consistencyChecker
    {
        name: 'groupManagerService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
        notes: 'Recently migrated',
    },
    {
        name: 'systemStatusService',
        hasEvents: true,
        hasLogger: true,
        hasLifecycle: true,
        hasHealthCheck: false,
        hasTracing: false,
    },
];

const SERVICE_FILE_MAP: Record<string, string> = {
    configService: 'src/kernel/services/config-service.ts',
    settingsService: 'src/kernel/services/settings-service.ts',
    keyService: 'src/kernel/services/key-management/key-service.ts',
    toolService: 'src/kernel/services/tool-executor.ts',
    sandboxService: 'src/kernel/services/sandbox-service.ts',
    agentService: 'src/kernel/services/agent-service.ts',
    memoryService: 'src/kernel/services/memory-engine.ts',
    cognitiveService: 'src/kernel/services/cognitive-service.ts',
    policyService: 'src/kernel/services/policy-service.ts',
    roleService: 'src/kernel/services/role-service.ts',
    snapshotService: 'src/kernel/services/snapshot-service.ts',
    debateService: 'src/kernel/services/debate-runtime/debate-sync-manager.ts',
    metricsService: 'src/kernel/services/metrics-service.ts',
    advisorService: 'src/kernel/services/advisor-service.ts',
    pricingService: 'src/kernel/services/pricing-service.ts',
    budgetService: 'src/kernel/services/budget-service.ts',
    usageTracker: 'src/kernel/services/usage-tracker.ts',
    cacheService: 'src/kernel/services/cache-service.ts',
    chatService: 'src/kernel/services/chat-executor.ts',
    timelineService: 'src/kernel/services/timeline-service.ts',
    adminService: 'src/kernel/services/admin-service.ts',
    healthScoreService: 'src/kernel/services/health-score-service.ts',
    monitoringService: 'src/kernel/services/monitoring-service.ts',
    routingPolicyService: 'src/kernel/services/provider-router.ts',
    whatIfService: 'src/kernel/services/runtime-intelligence/whatif-service.ts',
    pressureMapService: 'src/kernel/services/runtime-intelligence/pressure-map-service.ts',
    diagnosticService: 'src/kernel/services/runtime-intelligence/diagnostic-service.ts',
    notificationWebhookService: 'src/kernel/services/notification-webhook-service.ts',
    compromiseWebhookService: 'src/kernel/services/compromise-webhook-service.ts',
    externalSecretsService: 'src/kernel/services/external-secrets-service.ts',
    workspaceService: 'src/kernel/services/workspace-service.ts',
    probeService: 'src/kernel/services/probe-service.ts',
    consistencyChecker: 'src/kernel/services/consistency-checker.ts',
    // consistencyHealingPipeline: same class as consistencyChecker
    groupManagerService: 'src/kernel/services/group-manager.ts',
    systemStatusService: 'src/kernel/services/system-status-service.ts',
};

function staticFallback(name: string): ServiceObsInfo {
    return (
        STATIC_SERVICES.find((s) => s.name === name) ?? {
            name,
            hasEvents: false,
            hasLogger: false,
            hasLifecycle: false,
            hasHealthCheck: false,
            hasTracing: false,
        }
    );
}

function buildRecommendations(
    coverage: ObsCoverage,
    services: ServiceObsInfo[],
    docEventCount: number,
): string[] {
    const recs: string[] = [];
    if (coverage.eventScore < 100) {
        recs.push(
            `Add event emission to ${services
                .filter((s) => !s.hasEvents)
                .map((s) => s.name)
                .join(', ')}`,
        );
    }
    if (coverage.loggerScore < 100) {
        recs.push(
            `Add ILogger to ${services
                .filter((s) => !s.hasLogger)
                .map((s) => s.name)
                .join(', ')}`,
        );
    }
    if (coverage.healthScore < 80) {
        recs.push(
            `Implement health checks for more services (${coverage.withHealth}/${coverage.total})`,
        );
    }
    if (coverage.tracingScore < 50) {
        recs.push(
            `Add tracing spans to high-value services: ${services
                .filter((s) => !s.hasTracing && s.hasEvents)
                .map((s) => s.name)
                .join(', ')}`,
        );
    }
    if (coverage.lifecycleScore < 100) {
        recs.push(
            `Ensure all services implement ILifecycle: ${services
                .filter((s) => !s.hasLifecycle)
                .map((s) => s.name)
                .join(', ')}`,
        );
    }
    if (docEventCount > 0) {
        recs.push(`Events.md documents ${docEventCount} events — verify all are actively emitted`);
    }
    return recs;
}

/**
 * @deprecated STATIC — service inventory snapshot. Update `STATIC_SERVICES` and `SERVICE_FILE_MAP`
 * whenever a new service is added to bootstrap. Use `registerService()` at runtime for dynamic additions.
 */
const MAX_SERVICES = 200;

export class ObsGapsService implements IObsGapsService {
    private dynamicServices: Map<string, ServiceObsInfo> = new Map();

    registerService(info: ServiceObsInfo): void {
        this.dynamicServices.set(info.name, info);
        if (this.dynamicServices.size > MAX_SERVICES) {
            const oldest = this.dynamicServices.keys().next().value;
            if (oldest !== undefined) this.dynamicServices.delete(oldest);
        }
    }

    registerServices(infos: ServiceObsInfo[]): void {
        for (const info of infos) {
            this.dynamicServices.set(info.name, info);
        }
        while (this.dynamicServices.size > MAX_SERVICES) {
            const oldest = this.dynamicServices.keys().next().value;
            if (oldest !== undefined) this.dynamicServices.delete(oldest);
            else break;
        }
    }

    getStaticInventory(): ServiceObsInfo[] {
        const staticCopy = STATIC_SERVICES.map((s) => ({ ...s }));
        const dynamicCopy: ServiceObsInfo[] = [];
        for (const info of this.dynamicServices.values()) {
            dynamicCopy.push({ ...info });
        }
        return [...staticCopy, ...dynamicCopy];
    }

    getServiceCount(): number {
        return STATIC_SERVICES.length + this.dynamicServices.size;
    }

    parseEventsDocumentation(content: string): DocEvent[] {
        const events: DocEvent[] = [];
        const tableRegex = /\| `([^`]+)`/g;
        const sections = content.match(/### [^\n]+/g) || [];
        let match: RegExpExecArray | null;
        while ((match = tableRegex.exec(content)) !== null) {
            const section = sections.find(
                (s) => content.indexOf(s) < match!.index && content.indexOf(s) > match!.index - 200,
            );
            const source = section ? section.replace('### ', '').trim() : 'unknown';
            events.push({ name: match[1]!, source });
        }
        return Array.from(new Map(events.map((e) => [e.name, e])).values());
    }

    analyzeServiceContent(name: string, content: string): ServiceObsInfo {
        const staticMeta = STATIC_SERVICES.find((s) => s.name === name);
        return {
            name,
            hasEvents: /\.emit\(/.test(content) || /EVENTS\./.test(content),
            hasLogger:
                /ILogger/.test(content) ||
                /LOGGER/.test(content) ||
                /logger\.(info|warn|error|debug)\(/i.test(content),
            hasLifecycle:
                /ILifecycle/.test(content) ||
                (/init\(|start\(|destroy\(/.test(content) && /class/.test(content)),
            hasHealthCheck:
                /IHealthCheck/.test(content) ||
                /healthCheck/.test(content) ||
                /getHealth\(/.test(content),
            hasTracing:
                /ITraceContext/.test(content) ||
                /TraceContext/.test(content) ||
                /traceId/.test(content),
            notes: staticMeta?.notes,
        };
    }

    async scanServices(readFile?: ObsReadFile): Promise<ServiceObsInfo[]> {
        const services: ServiceObsInfo[] = [];
        const fetchFile: ObsReadFile =
            readFile ??
            (async (path: string) => {
                const res = await fetch(path, { signal: AbortSignal.timeout(10000) });
                if (!res.ok) {
                    res.body?.cancel()?.catch(() => {});
                    throw new Error(`Failed to fetch ${path}`);
                }
                return res.text();
            });
        for (const [name, filePath] of Object.entries(SERVICE_FILE_MAP)) {
            try {
                const content = await fetchFile(filePath);
                services.push(this.analyzeServiceContent(name, content));
            } catch {
                services.push(staticFallback(name));
            }
        }
        return services;
    }

    computeCoverage(services: ServiceObsInfo[]): ObsCoverage {
        const total = services.length || 1;
        const withEvents = services.filter((s) => s.hasEvents).length;
        const withLogger = services.filter((s) => s.hasLogger).length;
        const withLifecycle = services.filter((s) => s.hasLifecycle).length;
        const withHealth = services.filter((s) => s.hasHealthCheck).length;
        const withTracing = services.filter((s) => s.hasTracing).length;
        const gaps = services.filter((s) => !s.hasEvents || !s.hasLogger || !s.hasTracing).length;
        const eventScore = Math.round((withEvents / total) * 100);
        const loggerScore = Math.round((withLogger / total) * 100);
        const lifecycleScore = Math.round((withLifecycle / total) * 100);
        const healthScore = Math.round((withHealth / total) * 100);
        const tracingScore = Math.round((withTracing / total) * 100);
        const overall = Math.round((eventScore + loggerScore + healthScore + tracingScore) / 4);
        return {
            total: services.length,
            withEvents,
            withLogger,
            withLifecycle,
            withHealth,
            withTracing,
            gaps,
            eventScore,
            loggerScore,
            lifecycleScore,
            healthScore,
            tracingScore,
            overall,
        };
    }

    crossReferenceEvents(docEvents: DocEvent[], services: ServiceObsInfo[]): DocEventCoverage[] {
        if (docEvents.length === 0) return [];
        const serviceEventNames = services.filter((s) => s.hasEvents).map((s) => s.name);
        return docEvents.map((d) => ({
            ...d,
            covered: serviceEventNames.some((sn) =>
                d.source.toLowerCase().includes(sn.replace(/Service$/i, '').toLowerCase()),
            ),
        }));
    }

    buildReport(services: ServiceObsInfo[], docEvents: DocEvent[] = []): ObsGapsReport {
        const coverage = this.computeCoverage(services);
        return {
            timestamp: Date.now(),
            coverage,
            services,
            documentedEvents: docEvents,
            recommendations: buildRecommendations(coverage, services, docEvents.length),
        };
    }
}
