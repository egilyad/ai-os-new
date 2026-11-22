/** Phase 97 — OpenAPI spec → agent tools. */
import type { Phase } from './helpers';
import { OpenApiToolService } from '../services/tools/openapi-tool-service';

export const registerPhase97: Phase = ({ register }) => {
    register('openApiToolService', () => new OpenApiToolService());
};
