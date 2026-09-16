import type { IAdaptiveOrderService, Order } from '../../contracts/debate-adaptive-order';
export class AdaptiveOrderService implements IAdaptiveOrderService {
    order(ids: string[], scores: number[]): Order {
        const paired=ids.map((id,i)=>({id, score: scores[i]??0}));
        paired.sort((a,b)=>b.score-a.score);
        return { order: paired.map(p=>p.id) };
    }
}
