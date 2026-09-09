/**
 * Phase 9 — Research Engine.
 *
 * A-04: All services now use registerFactory (lazy instantiation).
 */
import type { Phase } from './helpers';
import { ResearchEngineService } from '../services/research-engine-service';
import { GeminiAugmentedResearchService } from '../services/gemini-research-service';
import type { GoogleGenAIService } from '../services/google-genai-service';

export const registerPhase9: Phase = ({ register }) => {
    register('researchEngine', (c) => {
        const eventBus = c.get<{ emit: (event: string, data?: unknown) => void }>('eventBus');
        const sourceAdapterRegistry = c.get('sourceAdapterRegistry');
        return new ResearchEngineService({ eventBus, sourceAdapterRegistry });
    });

    register('geminiResearchService', (c) => {
        const researchEngine = c.get<ResearchEngineService>('researchEngine');
        const googleGenAI = c.get<GoogleGenAIService>('googleGenAIService');
        return new GeminiAugmentedResearchService({
            googleGenAI,
            researchEngine,
        });
    });
};
