export interface ArchitectureGraphSource {
    getServices(): string[];
    getDependencies(): Record<string, string[]>;
}

export interface ArchitectureGraphNode {
    id: string;
    label: string;
    type: string;
    degree: number;
}

export interface ArchitectureGraphEdge {
    id: string;
    source: string;
    target: string;
    kind: 'dependency';
    weight: number;
}

export interface ArchitectureGraphData {
    nodes: ArchitectureGraphNode[];
    edges: ArchitectureGraphEdge[];
}

export interface IArchitectureGraphService {
    build(source: ArchitectureGraphSource): ArchitectureGraphData;
}
