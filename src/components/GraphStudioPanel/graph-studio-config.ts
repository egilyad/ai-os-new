export interface GraphStudioConfig {
    semantics: {
        proximityThreshold: number; // 0..100
        hideOrphans: boolean;
        query: string;
    };
    physics: {
        repulsion: number;
        springLength: number;
        springConstant: number;
        gravity: number;
        frozen: boolean;
    };
    style: {
        nodeSizeMode: 'fixed' | 'degree';
        palette: 'default' | 'neon' | 'clusters';
        edgeThicknessScale: number;
    };
    interaction: {
        highlightNeighbors: boolean;
        dimOthers: boolean;
        dragNodes: boolean;
    };
}

export const DEFAULT_GRAPH_STUDIO_CONFIG: GraphStudioConfig = {
    semantics: { proximityThreshold: 0, hideOrphans: false, query: '' },
    physics: {
        repulsion: 3500,
        springLength: 160,
        springConstant: 0.04,
        gravity: 0.25,
        frozen: false,
    },
    style: { nodeSizeMode: 'degree', palette: 'default', edgeThicknessScale: 1 },
    interaction: { highlightNeighbors: true, dimOthers: true, dragNodes: true },
};

export interface GraphStudioPreset {
    id: string;
    label: string;
    config: Omit<GraphStudioConfig, 'semantics' | 'interaction'> & {
        semantics: { proximityThreshold: number; hideOrphans: boolean; query: string };
        interaction: { highlightNeighbors: boolean; dimOthers: boolean; dragNodes: boolean };
    };
}

export const GRAPH_STUDIO_PRESETS: GraphStudioPreset[] = [
    {
        id: 'default',
        label: 'Default',
        config: DEFAULT_GRAPH_STUDIO_CONFIG,
    },
    {
        id: 'dense',
        label: 'Плотный клубок',
        config: {
            semantics: { proximityThreshold: 30, hideOrphans: true, query: '' },
            physics: {
                repulsion: 6500,
                springLength: 90,
                springConstant: 0.08,
                gravity: 0.1,
                frozen: false,
            },
            style: { nodeSizeMode: 'fixed', palette: 'default', edgeThicknessScale: 0.8 },
            interaction: { highlightNeighbors: true, dimOthers: true, dragNodes: true },
        },
    },
    {
        id: 'clusters',
        label: 'Карта кластеров',
        config: {
            semantics: { proximityThreshold: 10, hideOrphans: true, query: '' },
            physics: {
                repulsion: 4500,
                springLength: 180,
                springConstant: 0.05,
                gravity: 0.3,
                frozen: false,
            },
            style: { nodeSizeMode: 'degree', palette: 'clusters', edgeThicknessScale: 1.2 },
            interaction: { highlightNeighbors: true, dimOthers: true, dragNodes: true },
        },
    },
    {
        id: 'neon',
        label: 'Ночной неон',
        config: {
            semantics: { proximityThreshold: 0, hideOrphans: false, query: '' },
            physics: {
                repulsion: 5000,
                springLength: 160,
                springConstant: 0.04,
                gravity: 0.25,
                frozen: false,
            },
            style: { nodeSizeMode: 'degree', palette: 'neon', edgeThicknessScale: 1.4 },
            interaction: { highlightNeighbors: true, dimOthers: true, dragNodes: true },
        },
    },
];

const STORAGE_KEY = 'graph-studio-config-v1';

export function loadGraphStudioConfig(): GraphStudioConfig {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_GRAPH_STUDIO_CONFIG;
        const parsed = JSON.parse(raw) as Partial<GraphStudioConfig>;
        return {
            ...DEFAULT_GRAPH_STUDIO_CONFIG,
            ...parsed,
            semantics: { ...DEFAULT_GRAPH_STUDIO_CONFIG.semantics, ...parsed.semantics },
            physics: { ...DEFAULT_GRAPH_STUDIO_CONFIG.physics, ...parsed.physics },
            style: { ...DEFAULT_GRAPH_STUDIO_CONFIG.style, ...parsed.style },
            interaction: {
                ...DEFAULT_GRAPH_STUDIO_CONFIG.interaction,
                ...parsed.interaction,
            },
        };
    } catch {
        return DEFAULT_GRAPH_STUDIO_CONFIG;
    }
}

export function saveGraphStudioConfig(config: GraphStudioConfig): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch {
        /* storage unavailable */
    }
}
