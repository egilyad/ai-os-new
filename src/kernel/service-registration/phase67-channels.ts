/**
 * Phase 67 — Agent Channels registration.
 */
import type { Phase } from './types';
import type { IContainer } from '../kernel/contracts/container';
import type { IEventBus } from '../kernel/types/interfaces';
import { ChannelService } from '../services/channel-service';

export const registerPhase67: Phase = ({ register }) => {
    register('channelService', (c: IContainer) => {
        return new ChannelService(c.get<IEventBus>('eventBus'));
    });
};
