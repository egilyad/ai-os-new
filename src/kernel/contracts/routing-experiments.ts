export interface RoutingExperimentResult {
  provider: string;
  model: string;
  strategy: string;
  avgLatency: number;
  avgTokens: number;
  errorRate: number;
  cost: number;
  repetition: number;
  uniqueness: number;
}

export interface RoutingExperimentRun {
  id: string;
  timestamp: number;
  providers: string[];
  models: string[];
  strategies: string[];
  runsPerCell: number;
  totalRuns: number;
  results: RoutingExperimentResult[];
  estimatedCost: number;
  realMode: boolean;
}

export interface RoutingExperimentConfig {
  providers: string[];
  models: string[];
  strategies: string[];
  runsPerCell: number;
  realMode?: boolean;
}

export interface StrategyComparison {
  strategy: string;
  avgLatency: number;
  avgCost: number;
  avgErrorRate: number;
  avgUniqueness: number;
}

export interface IRoutingExperimentsService {
  estimateCost(config: RoutingExperimentConfig): number;
  totalRuns(config: RoutingExperimentConfig): number;
  generateMockResults(config: RoutingExperimentConfig, seed?: number): RoutingExperimentResult[];
  computeComparison(results: RoutingExperimentResult[]): StrategyComparison[];
  getHistory(): Promise<RoutingExperimentRun[]>;
  saveRun(run: RoutingExperimentRun): Promise<void>;
  deleteRun(id: string): Promise<void>;
  runExperiment(
    config: RoutingExperimentConfig,
    onProgress?: (message: string) => void,
  ): Promise<RoutingExperimentRun>;
}
