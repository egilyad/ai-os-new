import type {
    IArchitectureGraphService,
    ArchitectureGraphData,
    ArchitectureGraphSource,
} from '../../contracts/viz/architecture-graph';

const DOMAIN_RULES: Array<[RegExp, string]> = [
    [/memory|ltmemory|cogmemory|recall|archive/i, 'memory'],
    [/debate|rival|forum|council|crew/i, 'debate'],
    [/key|pricing|budget|cost|billing/i, 'economics'],
    [/^tool|tooling|sandbox|executor/i, 'tools'],
    [/agent|assistant|persona|fleet/i, 'agents'],
    [/provider|llm|adapter|embedding|model/i, 'llm'],
    [/event|kernel|container|bootstrap|runtime|registry/i, 'core'],
];

function classify(id: string): string {
    for (const [re, domain] of DOMAIN_RULES) {
        if (re.test(id)) return domain;
    }
    return 'service';
}

export class ArchitectureGraphService implements IArchitectureGraphService {
    build(source: ArchitectureGraphSource): ArchitectureGraphData {
        const services = source.getServices();
        const deps = source.getDependencies();

        const degree = new Map<string, number>();
        const bump = (id: string) => degree.set(id, (degree.get(id) ?? 0) + 1);

        const edges: ArchitectureGraphData['edges'] = [];
        const seen = new Set<string>();
        for (const from of services) {
            for (const to of deps[from] ?? []) {
                if (!services.includes(to)) continue;
                const key = from < to ? `${from}|${to}` : `${to}|${from}`;
                if (seen.has(key)) continue;
                seen.add(key);
                bump(from);
                bump(to);
                edges.push({ id: `e-${edges.length}`, source: from, target: to, kind: 'dependency', weight: 1 });
            }
        }

        const nodes: ArchitectureGraphData['nodes'] = services
            .map((id) => ({
                id,
                label: id,
                type: classify(id),
                degree: degree.get(id) ?? 0,
            }))
            .sort((a, b) => a.id.localeCompare(b.id));

        return { nodes, edges };
    }
}
