/** Phase 99 — AgentVerse-style environment rule pipeline. */
import type { Phase } from './helpers';
import { EnvironmentRuleService } from '../services/simulation/environment-rule-service';

export const registerPhase99: Phase = ({ register }) => {
    register('environmentRuleService', () => new EnvironmentRuleService());
};
