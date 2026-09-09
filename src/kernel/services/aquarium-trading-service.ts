import type { IAquariumTradingService, TradeOffer } from '../contracts/aquarium-trading';

const genId = () => crypto.randomUUID();

const MAX_TRADES = 1000;

const CREATURES = [
    { id: 'c1', name: 'Golden Koi', rarity: 'Legendary' },
    { id: 'c2', name: 'Neon Tetra', rarity: 'Common' },
    { id: 'c3', name: 'Dragon Fish', rarity: 'Epic' },
    { id: 'c4', name: 'Bubble Coral', rarity: 'Uncommon' },
    { id: 'c5', name: 'Phantom Jelly', rarity: 'Rare' },
    { id: 'c6', name: 'Crystal Shrimp', rarity: 'Common' },
    { id: 'c7', name: 'Ember Angelfish', rarity: 'Rare' },
    { id: 'c8', name: 'Starlight Betta', rarity: 'Epic' },
];

export class AquariumTradingService implements IAquariumTradingService {
    private trades: TradeOffer[] = [
        {
            id: genId(),
            offeredCreatureId: 'c2',
            offeredCreatureName: 'Neon Tetra',
            requestedCreatureId: 'c6',
            requestedCreatureName: 'Crystal Shrimp',
            offeredBy: 'User1',
            offeredTo: null,
            status: 'open',
            createdAt: Date.now() - 86400000 * 2,
            note: 'Looking for shrimp',
        },
        {
            id: genId(),
            offeredCreatureId: 'c5',
            offeredCreatureName: 'Phantom Jelly',
            requestedCreatureId: 'c7',
            requestedCreatureName: 'Ember Angelfish',
            offeredBy: 'User2',
            offeredTo: 'User1',
            status: 'pending',
            createdAt: Date.now() - 86400000,
            note: 'Fair trade?',
        },
    ];

    getActiveTrades(): TradeOffer[] {
        return this.trades
            .filter((t) => t.status === 'open' || t.status === 'pending')
            .map((t) => ({ ...t }));
    }

    getTradeHistory(): TradeOffer[] {
        return [...this.trades].map((t) => ({ ...t }));
    }

    createOffer(offeredCreatureId: string, requestedCreatureId: string, note?: string): TradeOffer {
        const offered = CREATURES.find((c) => c.id === offeredCreatureId);
        const requested = CREATURES.find((c) => c.id === requestedCreatureId);
        if (!offered || !requested) throw new Error('Creature not found');
        const offer: TradeOffer = {
            id: genId(),
            offeredCreatureId,
            offeredCreatureName: offered.name,
            requestedCreatureId,
            requestedCreatureName: requested.name,
            offeredBy: 'You',
            offeredTo: null,
            status: 'open',
            createdAt: Date.now(),
            note,
        };
        if (this.trades.length >= MAX_TRADES) {
            this.trades.shift();
        }
        this.trades.push(offer);
        return { ...offer };
    }

    createDirectOffer(
        offeredCreatureId: string,
        requestedCreatureId: string,
        targetUser: string,
        note?: string,
    ): TradeOffer {
        const offered = CREATURES.find((c) => c.id === offeredCreatureId);
        const requested = CREATURES.find((c) => c.id === requestedCreatureId);
        if (!offered || !requested) throw new Error('Creature not found');
        const offer: TradeOffer = {
            id: genId(),
            offeredCreatureId,
            offeredCreatureName: offered.name,
            requestedCreatureId,
            requestedCreatureName: requested.name,
            offeredBy: 'You',
            offeredTo: targetUser,
            status: 'pending',
            createdAt: Date.now(),
            note,
        };
        if (this.trades.length >= MAX_TRADES) {
            this.trades.shift();
        }
        this.trades.push(offer);
        return { ...offer };
    }

    acceptTrade(tradeId: string): void {
        const t = this.trades.find((td) => td.id === tradeId);
        if (t) t.status = 'accepted';
    }

    declineTrade(tradeId: string): void {
        const t = this.trades.find((td) => td.id === tradeId);
        if (t) t.status = 'declined';
    }

    cancelTrade(tradeId: string): void {
        const t = this.trades.find((td) => td.id === tradeId);
        if (t) t.status = 'cancelled';
    }

    getCreatureList(): { id: string; name: string; rarity: string }[] {
        return [...CREATURES];
    }
}
