/**
 * Builder как IDE (ROADMAP_09 §P3, map-06).
 *
 * Сейчас Builder вызывает только 4 типа узлов (agent/router/guardrail/tool).
 * Этот контракт декларирует расширенный каталог, включая «killer»-сервисы
 * (crystal/synthesis/lens/memory/time-machine/forum/director), чтобы палитра
 * Builder могла их expose.
 */

export type BuilderNodeKind =
    | 'agent'
    | 'router'
    | 'guardrail'
    | 'tool'
    | 'crystal'
    | 'synthesis'
    | 'lens'
    | 'memory'
    | 'time-machine'
    | 'forum'
    | 'director'
    | 'memory-orchestrator';

export type BuilderNodeCategory = 'core' | 'cognitive' | 'experimental';

export interface BuilderNodeDefinition {
    kind: BuilderNodeKind;
    labelKey: string;
    descriptionKey?: string;
    category: BuilderNodeCategory;
    /** Доступен ли узел в палитре Builder (exposed). */
    exposed: boolean;
    defaultConfig?: Record<string, unknown>;
}

export interface IBuilderNodeCatalog {
    list(): BuilderNodeDefinition[];
    get(kind: BuilderNodeKind): BuilderNodeDefinition | undefined;
    getExposed(): BuilderNodeDefinition[];
}
