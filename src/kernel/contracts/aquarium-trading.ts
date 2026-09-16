export type TradeStatus = 'open' | 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface TradeOffer {
    id: string;
    offeredCreatureId: string;
    offeredCreatureName: string;
    requestedCreatureId: string;
    requestedCreatureName: string;
    offeredBy: string;
    offeredTo: string | null;
    status: TradeStatus;
    createdAt: number;
    note?: string;
}

export interface IAquariumTradingService {
    getActiveTrades(): TradeOffer[];
    getTradeHistory(): TradeOffer[];
    createOffer(offeredCreatureId: string, requestedCreatureId: string, note?: string): TradeOffer;
    createDirectOffer(
        offeredCreatureId: string,
        requestedCreatureId: string,
        targetUser: string,
        note?: string,
    ): TradeOffer;
    acceptTrade(tradeId: string): void;
    declineTrade(tradeId: string): void;
    cancelTrade(tradeId: string): void;
    getCreatureList(): { id: string; name: string; rarity: string }[];
}
