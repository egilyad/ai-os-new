import type {
    BuilderNodeDefinition,
    BuilderNodeKind,
    IBuilderNodeCatalog,
} from '../../contracts/builder-node';

const NODES: BuilderNodeDefinition[] = [
    // core — уже существуют в Builder
    { kind: 'agent', labelKey: 'builder.node.agent', category: 'core', exposed: true },
    { kind: 'router', labelKey: 'builder.node.router', category: 'core', exposed: true },
    { kind: 'guardrail', labelKey: 'builder.node.guardrail', category: 'core', exposed: true },
    { kind: 'tool', labelKey: 'builder.node.tool', category: 'core', exposed: true },
    // cognitive — killer-сервисы (map-06: сейчас НЕ exposed)
    { kind: 'crystal', labelKey: 'builder.node.crystal', descriptionKey: 'builder.node.crystal.desc', category: 'cognitive', exposed: false },
    { kind: 'synthesis', labelKey: 'builder.node.synthesis', descriptionKey: 'builder.node.synthesis.desc', category: 'cognitive', exposed: false },
    { kind: 'lens', labelKey: 'builder.node.lens', descriptionKey: 'builder.node.lens.desc', category: 'cognitive', exposed: false },
    { kind: 'memory', labelKey: 'builder.node.memory', descriptionKey: 'builder.node.memory.desc', category: 'cognitive', exposed: false },
    { kind: 'time-machine', labelKey: 'builder.node.timeMachine', descriptionKey: 'builder.node.timeMachine.desc', category: 'cognitive', exposed: false },
    { kind: 'forum', labelKey: 'builder.node.forum', descriptionKey: 'builder.node.forum.desc', category: 'cognitive', exposed: false },
    { kind: 'director', labelKey: 'builder.node.director', descriptionKey: 'builder.node.director.desc', category: 'cognitive', exposed: false },
    { kind: 'memory-orchestrator', labelKey: 'builder.node.memoryOrchestrator', descriptionKey: 'builder.node.memoryOrchestrator.desc', category: 'cognitive', exposed: false },
];

/**
 * BuilderNodeCatalog — реестр доступных типов узлов Builder (SPEC/ROADMAP).
 * Позволяет постепенно переводить killer-сервисы из `exposed:false` в
 * `exposed:true` без правки палитры напрямую.
 */
export class BuilderNodeCatalog implements IBuilderNodeCatalog {
    private map = new Map<BuilderNodeKind, BuilderNodeDefinition>();

    constructor() {
        for (const n of NODES) this.map.set(n.kind, n);
    }

    list(): BuilderNodeDefinition[] {
        return [...this.map.values()];
    }

    get(kind: BuilderNodeKind): BuilderNodeDefinition | undefined {
        return this.map.get(kind);
    }

    getExposed(): BuilderNodeDefinition[] {
        return this.list().filter((n) => n.exposed);
    }

    expose(kind: BuilderNodeKind, exposed: boolean): void {
        const n = this.map.get(kind);
        if (n) this.map.set(kind, { ...n, exposed });
    }
}
