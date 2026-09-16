import type { IPredictionMarketService, MarketPrediction } from '../../contracts/debate-prediction-market';
export class PredictionMarketService implements IPredictionMarketService {
    predict(agents: string[], topic: string): MarketPrediction[] {
        return agents.map(id=>({ agentId:id, predictedWinner: agents[0], confidence: 0.5 + (topic.length%5)*0.05 }));
    }
}
