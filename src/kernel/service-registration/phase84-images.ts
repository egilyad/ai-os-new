/**
 * Phase 84 — image generation facade.
 *
 *  - imageGenerationService: text-to-image facade (stub provider by default;
 *    future providers plug in via IImageGenerator contract).
 */
import type { Phase } from './helpers';
import { ImageGenerationService } from '../services/images/image-generation-service';

export const registerPhase84: Phase = ({ register }) => {
    register('imageGenerationService', () => new ImageGenerationService());
};
