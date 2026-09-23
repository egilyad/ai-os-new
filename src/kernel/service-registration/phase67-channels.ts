/**
 * Phase 67 — Agent Channels registration.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import { ChannelService } from '../services/channel-service';

export const registerPhase67: Phase = ({ register }) => {
    register('channelService', (c: IContainer) => {
        return new ChannelService(c.get<IEventBus>('eventBus'));
    });
};
