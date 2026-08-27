import type { IBiddingTimeService, Bid } from '../../contracts/debate-bidding-time';
export class BiddingTimeService implements IBiddingTimeService {
    rank(bids: Bid[]): string[] { return [...bids].sort((a,b)=>b.bid-a.bid).map(b=>b.agentId); }
}
