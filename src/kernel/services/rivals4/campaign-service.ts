/**
 * CampaignService — I.2 (Yellow.ai-style outbound campaigns, additive).
 *
 * Audience lists in DAL kv; broadcast funnels each message through the
 * gateway ingress (so campaigns behave like any other protocol source);
 * delivered/opened ticks in kv for funnel stats.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IGatewayService } from '../../contracts/interop';
import type { ICampaignService } from '../../contracts/rivals4';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Campaign');

interface CampaignDoc {
    id: string;
    name: string;
    message: string;
    audience: string[];
    createdAt: number;
}

export class CampaignService implements ICampaignService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private gateway?: IGatewayService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async createCampaign(name: string, message: string, audience: string[] = []): Promise<string> {
        const doc: CampaignDoc = {
            id: genId('camp'),
            name: name.slice(0, 120),
            message: message.slice(0, 2000),
            audience: [...new Set(audience)].slice(0, 10000),
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`campaigns/${doc.id}`, doc);
        return doc.id;
    }

    async addAudience(campaignId: string, userId: string): Promise<void> {
        const doc = await this.require(campaignId);
        if (!doc.audience.includes(userId)) doc.audience.push(userId);
        await this.dal.kv.set(`campaigns/${campaignId}`, doc);
    }

    async broadcast(campaignId: string): Promise<{ delivered: number }> {
        const doc = await this.require(campaignId);
        let delivered = 0;
        for (const userId of doc.audience.slice(0, 1000)) {
            try {
                if (this.gateway) {
                    await this.gateway.ingress({
                        from: `campaign:${campaignId}`,
                        to: userId,
                        protocol: 'websocket',
                        kind: 'task',
                        payload: { message: doc.message },
                    });
                }
                delivered += 1;
                await this.dal.kv.set(`campaign-ticks/${campaignId}/delivered`, delivered);
            } catch (e) {
                LOGGER.warn('campaign delivery failed', {
                    userId,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        this.events.emit(EVENTS.YELLOW_SENT, { campaignId, delivered });
        return { delivered };
    }

    async stats(campaignId: string): Promise<Record<string, number>> {
        const delivered = (await this.dal.kv.get<number>(`campaign-ticks/${campaignId}/delivered`)) ?? 0;
        const opened = (await this.dal.kv.get<number>(`campaign-ticks/${campaignId}/opened`)) ?? 0;
        return { delivered, opened };
    }

    private async require(id: string): Promise<CampaignDoc> {
        const doc = await this.dal.kv.get<CampaignDoc>(`campaigns/${id}`);
        if (!doc) throw new Error(`Campaign not found: ${id}`);
        return doc;
    }
}
