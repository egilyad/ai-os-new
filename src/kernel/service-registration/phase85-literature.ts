/**
 * Phase 85 — literature fetcher (F5b: SciAgents-pattern).
 *
 *  - literatureFetcherService: external literature retrieval (arXiv API,
 *    web stub) with optional ingestion into TWikiSource records.
 */
import type { Phase } from './helpers';
import { LiteratureFetcherService } from '../services/research/literature-fetcher-service';

export const registerPhase85: Phase = ({ register }) => {
    register(
        'literatureFetcherService',
        (c) =>
            new LiteratureFetcherService({
                store: c.has('wikiStore') ? c.get('wikiStore') : undefined,
            }),
    );
};
