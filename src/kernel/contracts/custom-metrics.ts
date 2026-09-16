export type MetricAggregation = 'avg' | 'sum' | 'max' | 'min' | 'count' | 'p50' | 'p95' | 'p99';

export interface CustomMetric {
    id: string;
    name: string;
    description: string;
    category: string;
    aggregation: MetricAggregation;
    source: 'provider' | 'debate' | 'memory' | 'system';
    field: string;
    filter?: Record<string, unknown>;
    unit: string;
    color: string;
    createdAt: number;
}

export interface MetricValue {
    metricId: string;
    value: number;
    timestamp: number;
    label?: string;
}

export interface MetricDashboard {
    id: string;
    name: string;
    metricIds: string[];
    layout: 'grid' | 'list' | 'chart';
    createdAt: number;
}

export interface ICustomMetricsService {
    listMetrics(): Promise<CustomMetric[]>;
    getMetric(id: string): Promise<CustomMetric | undefined>;
    createMetric(metric: Omit<CustomMetric, 'id' | 'createdAt'>): Promise<string>;
    updateMetric(id: string, updates: Partial<CustomMetric>): Promise<void>;
    deleteMetric(id: string): Promise<void>;
    computeValue(metricId: string): Promise<MetricValue>;
    getHistory(metricId: string, limit?: number): Promise<MetricValue[]>;
    listDashboards(): Promise<MetricDashboard[]>;
    createDashboard(name: string, metricIds: string[]): Promise<string>;
    deleteDashboard(id: string): Promise<void>;
}
