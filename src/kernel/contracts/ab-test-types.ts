export interface ABTestRequest {
    prompt: string;
    providerA: string;
    modelA: string;
    providerB: string;
    modelB: string;
    temperature?: number;
}

export interface ABTestResult {
    request: ABTestRequest;
    responseA: ABTestResponse;
    responseB: ABTestResponse;
    comparison: ABTestComparison;
    timestamp: number;
}

export interface ABTestResponse {
    provider: string;
    model: string;
    content: string;
    latency: number;
    tokens: number;
    cost: number;
    error?: string;
}

export interface ABTestComparison {
    latencyDiff: number;
    latencyWinner: 'A' | 'B' | 'tie';
    costDiff: number;
    costWinner: 'A' | 'B' | 'tie';
    lengthDiff: number;
    lengthWinner: 'A' | 'B' | 'tie';
    contentSimilarity: number;
}

export interface ABTestHistory {
    id: string;
    timestamp: number;
    prompt: string;
    providerA: string;
    modelA: string;
    providerB: string;
    modelB: string;
    latencyWinner: string;
    costWinner: string;
}
