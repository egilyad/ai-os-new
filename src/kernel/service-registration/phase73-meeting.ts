/**
 * Phase 73 — Meeting Service (AGEMS port, Phase 5).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IDatabaseService } from '../types/interfaces';
import { MeetingService } from '../services/meeting-service';

export const registerPhase73: Phase = ({ register }) => {
    register('meetingService', (c: IContainer) => {
        const db = c.get<IDatabaseService>('database');
        return new MeetingService({
            meetings: db.meetings,
            meetingDecisions: db.meetingDecisions,
            meetingMessages: db.meetingMessages,
        });
    });
};
