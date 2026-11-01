import { useCallback, useState } from 'react';
import { provenanceLinker } from '../kernel/instances';
import type { ProvenanceRef, ProvenanceLink } from '../kernel/contracts/provenance-link';

/**
 * useProvenance — доступ к связям происхождения (cognitive provenance).
 * Позволяет прослеживать «что на что повлияло».
 */
export function useProvenance() {
    const [links, setLinks] = useState<ProvenanceLink[]>(() => provenanceLinker.get());
    const [trail, setTrail] = useState<ProvenanceRef[]>([]);

    const refresh = useCallback(() => {
        setLinks(provenanceLinker.get());
    }, []);

    const trace = useCallback((start: ProvenanceRef, maxDepth = 5) => {
        setTrail(provenanceLinker.getTrail(start, maxDepth));
    }, []);

    return { links, trail, refresh, trace };
}
