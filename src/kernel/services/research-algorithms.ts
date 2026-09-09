import { genId } from '../../utils/gen-id';
import type {
    ResearchSession,
    ResearchSource,
    ResearchClaim,
    ResearchSynthesis,
    CitationGraph,
    CitationNode,
    CitationLink,
    KnowledgeGraph,
    KnowledgeEntity,
    KnowledgeRelation,
    KnowledgeCluster,
    SystematicReview,
    SystematicReviewConfig,
    PrismaFlow,
    BiasAssessment,
    FactCheckReport,
    FactCheckResult,
    AnomalyReport,
    ResearchAnomaly,
    SummarizationResult,
    SummaryStyle,
    SummaryLength,
    CitationExport,
    CitationEntry,
    CitationFormat,
    PeerReview,
    PeerReviewComment,
    DiscoveryResult,
    DiscoveryTopic,
} from '../contracts/research-engine';
import type { ISourceAdapter, SourceAdapterConfig } from '../contracts/research-adapter';

export function getNextQuestion(session: ResearchSession): string {
    if (session.loops.length === 0) return session.initialQuestion;
    const last = session.loops[session.loops.length - 1]!;
    if (last.synthesis?.newQuestions.length) {
        return last.synthesis.newQuestions[0]!;
    }
    return `${session.initialQuestion} (deeper analysis, iteration ${session.loops.length + 1})`;
}

export async function searchSources(
    query: string,
    registry: {
        searchAll(query: string): Promise<Map<string, ResearchSource[]>>;
        getAllAdapters(): ISourceAdapter[];
        getConfig(): SourceAdapterConfig;
    },
): Promise<ResearchSource[]> {
    const sources: ResearchSource[] = [];
    try {
        const results = await registry.searchAll(query);
        for (const [, adapterSources] of results) {
            sources.push(...adapterSources);
        }
    } catch {
        /* caller logs */
    }
    if (sources.length === 0) {
        const restricted = registry.getAllAdapters().filter((a) => a.isRestricted);
        for (const adapter of restricted) {
            try {
                const r = await adapter.search(query, registry.getConfig());
                sources.push(...r);
            } catch {
                /* skip */
            }
        }
    }
    return sources.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 20);
}

export function extractClaims(sources: ResearchSource[], _question: string): ResearchClaim[] {
    const claims: ResearchClaim[] = [];
    for (const source of sources) {
        if (!source.snippet) continue;
        const sentences = source.snippet.split(/[.!?]+/).filter((s) => s.trim().length > 20);
        for (const sentence of sentences.slice(0, 3)) {
            claims.push({
                id: genId('cl'),
                text: sentence.trim(),
                sourceId: source.id,
                confidence: source.relevanceScore * (sentence.length > 50 ? 0.8 : 0.5),
                contradictions: [],
                timestamp: Date.now(),
            });
        }
    }
    detectContradictions(claims);
    return claims;
}

export function detectContradictions(claims: ResearchClaim[]): void {
    for (let i = 0; i < claims.length; i++) {
        for (let j = i + 1; j < claims.length; j++) {
            const wordsA = new Set(claims[i]!.text.toLowerCase().split(/\s+/));
            const wordsB = new Set(claims[j]!.text.toLowerCase().split(/\s+/));
            const overlap = [...wordsA].filter((w) => wordsB.has(w)).length;
            const total = new Set([...wordsA, ...wordsB]).size;
            const jaccard = total > 0 ? overlap / total : 0;
            if (jaccard > 0.6 && jaccard < 0.95) {
                claims[i]!.contradictions.push(claims[j]!.id);
                claims[j]!.contradictions.push(claims[i]!.id);
            }
        }
    }
}

export function synthesize(claims: ResearchClaim[], question: string): ResearchSynthesis {
    const keyFindings = claims
        .filter((c) => c.confidence > 0.4 && c.contradictions.length === 0)
        .map((c) => c.text)
        .slice(0, 5);

    const contradictory = claims.filter((c) => c.contradictions.length > 0);
    const gaps =
        contradictory.length > 0
            ? [`${contradictory.length} contradictory claims need resolution`]
            : [];

    if (claims.length === 0) gaps.push('No sources found — try a different query');

    const newQuestions =
        keyFindings.length > 0
            ? [
                  `What are the implications of: ${keyFindings[0]!.slice(0, 80)}?`,
                  `How does ${question} compare with alternative approaches?`,
                  `What evidence contradicts the finding that ${keyFindings[0]?.slice(0, 60) || question}?`,
              ]
            : [`Refine search for: ${question}`];

    return {
        summary:
            keyFindings.length > 0
                ? `Found ${keyFindings.length} key findings from ${claims.length} claims across ${new Set(claims.map((c) => c.sourceId)).size} sources.`
                : 'No significant findings in this iteration.',
        keyFindings,
        confidence:
            claims.length > 0 ? claims.reduce((s, c) => s + c.confidence, 0) / claims.length : 0,
        gaps,
        newQuestions: newQuestions.slice(0, 3),
        timestamp: Date.now(),
    };
}

export function trimSessions(sessions: Map<string, ResearchSession>, max: number): void {
    if (sessions.size > max) {
        const sorted = Array.from(sessions.entries()).sort(
            ([, a], [, b]) => a.createdAt - b.createdAt,
        );
        const toDelete = sorted.slice(0, sessions.size - max);
        for (const [id] of toDelete) sessions.delete(id);
    }
}

export function allText(session: ResearchSession): string {
    return session.loops
        .flatMap((l) => [
            l.question.text,
            ...l.sources.map((s) => s.snippet),
            l.synthesis?.summary || '',
        ])
        .join(' ');
}

export function computeCitationGraph(
    allClaims: ResearchClaim[],
    allSources: ResearchSource[],
): CitationGraph {
    const nodes: CitationNode[] = allSources.map((s) => ({
        id: s.id,
        title: s.title,
        authors: s.authors && s.authors.length > 0 ? s.authors : ['Unknown'],
        year: s.year ?? new Date(s.timestamp).getFullYear(),
        source: s.sourceType,
        citationsCount: s.citationCount ?? 0,
        influenceScore:
            s.relevanceScore *
            (allClaims.filter((c) => c.sourceId === s.id).length / Math.max(1, allClaims.length)),
    }));

    const links: CitationLink[] = [];
    for (const claim of allClaims) {
        if (claim.contradictions.length === 0) continue;
        const sourceId = claim.sourceId;
        for (const targetClaimId of claim.contradictions) {
            const targetClaim = allClaims.find((c) => c.id === targetClaimId);
            if (targetClaim && targetClaim.sourceId !== sourceId) {
                if (
                    !links.some((l) => l.source === sourceId && l.target === targetClaim.sourceId)
                ) {
                    links.push({ source: sourceId, target: targetClaim.sourceId, weight: 0.3 });
                }
            }
        }
    }

    return {
        nodes,
        links,
        totalPapers: nodes.length,
        totalCitations: nodes.reduce((s, n) => s + n.citationsCount, 0),
        avgInfluence:
            nodes.length > 0 ? nodes.reduce((s, n) => s + n.influenceScore, 0) / nodes.length : 0,
        hIndex: 0,
    };
}

export function computeKnowledgeGraph(session: ResearchSession): KnowledgeGraph {
    const allText_ = session.loops
        .flatMap((l) => [l.question.text, ...(l.synthesis?.keyFindings || [])])
        .join(' ');

    const entityMap = new Map<string, KnowledgeEntity>();
    const titleWords = allText_.split(/\s+/).filter((w) => w.length > 4 && /^[A-Z]/.test(w));

    for (const word of [...new Set(titleWords)].slice(0, 20)) {
        const id = genId('ke');
        entityMap.set(word, {
            id,
            name: word,
            type: 'concept',
            aliases: [word.toLowerCase()],
            mentions: titleWords.filter((w) => w === word).length,
            confidence: 0.7,
        });
    }

    const entities = Array.from(entityMap.values());
    const relations: KnowledgeRelation[] = [];
    const eArr = Array.from(entityMap.keys());
    for (let i = 0; i < eArr.length && i < 10; i++) {
        for (let j = i + 1; j < eArr.length && j < 10; j++) {
            const entI = entityMap.get(eArr[i]!)!;
            const entJ = entityMap.get(eArr[j]!)!;
            relations.push({
                id: genId('kr'),
                source: entI.id,
                target: entJ.id,
                type: 'related_to',
                weight: 0.5,
                evidence: [],
            });
        }
    }

    const clusters: KnowledgeCluster[] = [
        {
            id: genId('kc'),
            label: 'Core Concepts',
            entityIds: entities.slice(0, Math.min(5, entities.length)).map((e) => e.id),
            centralConcept: entities[0]?.name || 'Unknown',
            cohesion: 0.6,
        },
    ];

    return {
        entities,
        relations,
        // 2b E6: undirected graph — max edges = n*(n-1)/2, not n*(n-1)
        density:
            entities.length > 1
                ? relations.length / ((entities.length * (entities.length - 1)) / 2)
                : 0,
        clusters,
    };
}

export function computeSystematicReview(
    session: ResearchSession,
    config: SystematicReviewConfig,
): SystematicReview {
    const allSources = session.loops.flatMap((l) => l.sources);
    const total = allSources.length;

    const excludedSources: { source: ResearchSource; reason: string }[] = [];
    const includedSources: ResearchSource[] = [];
    const exclusionReasons: Record<string, number> = {};

    for (const source of allSources) {
        let excluded = false;
        for (const crit of config.exclusionCriteria) {
            const fieldVal = (source as unknown as Record<string, unknown>)[crit.field];
            if (typeof fieldVal === 'string') {
                const matches =
                    crit.operator === 'contains'
                        ? fieldVal.toLowerCase().includes(crit.value.toLowerCase())
                        : crit.operator === 'equals'
                          ? fieldVal === crit.value
                          : false;
                if (matches) {
                    exclusionReasons[crit.value] = (exclusionReasons[crit.value] || 0) + 1;
                    excludedSources.push({
                        source,
                        reason: `${crit.field} ${crit.operator} ${crit.value}`,
                    });
                    excluded = true;
                    break;
                }
            }
        }
        if (!excluded) {
            let included = true;
            if (config.inclusionCriteria.length > 0) {
                included = false;
                for (const crit of config.inclusionCriteria) {
                    const fieldVal = source[crit.field as keyof ResearchSource] as
                        string | undefined;
                    if (typeof fieldVal === 'string') {
                        const matches =
                            crit.operator === 'contains'
                                ? fieldVal.toLowerCase().includes(crit.value.toLowerCase())
                                : crit.operator === 'equals'
                                  ? fieldVal === crit.value
                                  : false;
                        if (matches) {
                            included = true;
                            break;
                        }
                    }
                }
            }
            if (included) includedSources.push(source);
            else {
                excludedSources.push({ source, reason: 'Failed inclusion criteria' });
                exclusionReasons['Failed inclusion criteria'] =
                    (exclusionReasons['Failed inclusion criteria'] || 0) + 1;
            }
        }
    }

    // Dedup sources by URL
    const seenUrls = new Set<string>();
    const deduped = allSources.filter((s) => {
        if (!s.url) return true;
        if (seenUrls.has(s.url)) return false;
        seenUrls.add(s.url);
        return true;
    });
    const dedupCount = total - deduped.length;

    const prismaFlow: PrismaFlow = {
        identification: total,
        afterDedup: deduped.length,
        dedupRemoved: dedupCount,
        screened: deduped.length,
        excludedAtScreening: Object.entries(exclusionReasons).map(([reason, count]) => ({
            reason,
            count,
        })),
        fullTextAssessed: includedSources.length,
        excludedAtFullText:
            includedSources.length < deduped.length
                ? [
                      {
                          reason: 'Failed quality check',
                          count: deduped.length - includedSources.length,
                      },
                  ]
                : [],
        included: includedSources.length,
    };

    const biasAssessment: BiasAssessment = {
        selectionBias:
            includedSources.length < total * 0.3
                ? 'high'
                : includedSources.length < total * 0.6
                  ? 'medium'
                  : 'low',
        informationBias: 'medium',
        publicationBias: 'low',
        overall: 'medium',
        notes: [`Reviewed ${total} sources, included ${includedSources.length}`],
    };

    return {
        id: genId('sr'),
        sessionId: session.id,
        query: session.initialQuestion,
        prismaFlow,
        includedSources,
        excludedSources,
        config,
        biasAssessment,
        createdAt: Date.now(),
    };
}

export function computeFactCheck(
    session: ResearchSession,
    maxClaims = 30,
): Omit<FactCheckReport, 'createdAt'> {
    const allClaims = session.loops.flatMap((l) => l.claims);
    const allSources = session.loops.flatMap((l) => l.sources);
    const sourceMap = new Map(allSources.map((s) => [s.id, s]));

    const claimsToCheck = allClaims.length > maxClaims ? allClaims.slice(0, maxClaims) : allClaims;
    const checks: FactCheckResult[] = claimsToCheck.map((claim) => {
        const contradictingIds = claim.contradictions;
        const contradictingSources = contradictingIds
            .map((cid) => {
                const c = allClaims.find((cl) => cl.id === cid);
                return c ? sourceMap.get(c.sourceId) : undefined;
            })
            .filter((s): s is ResearchSource => !!s);

        const supportingIds = allClaims.filter(
            (c) => c.id !== claim.id && c.text.includes(claim.text.slice(0, 50)),
        );
        const supportingSources = supportingIds
            .map((c) => sourceMap.get(c.sourceId))
            .filter((s): s is ResearchSource => !!s && s.id !== claim.sourceId);

        let status: FactCheckResult['status'];
        if (contradictingSources.length > 0 && supportingSources.length === 0) {
            status = 'contradicted';
        } else if (contradictingSources.length > 0 && supportingSources.length > 0) {
            status = 'partially_supported';
        } else if (claim.confidence > 0.5) {
            status = 'supported';
        } else {
            status = 'unverifiable';
        }

        return {
            id: genId('fc'),
            claim: claim.text,
            status,
            supportingSources,
            contradictingSources,
            confidence: claim.confidence,
            explanation: `${status}: ${claim.text.slice(0, 60)}...`,
            timestamp: Date.now(),
        };
    });

    return {
        sessionId: session.id,
        checks,
        overallAccuracy:
            checks.filter((c) => c.status === 'supported' || c.status === 'partially_supported')
                .length / Math.max(1, checks.length),
        verifiedCount: checks.filter((c) => c.status === 'supported').length,
        contradictedCount: checks.filter((c) => c.status === 'contradicted').length,
        unverifiableCount: checks.filter((c) => c.status === 'unverifiable').length,
    };
}

export function computeAnomalies(session: ResearchSession): AnomalyReport {
    const anomalies: ResearchAnomaly[] = [];
    const allClaims = session.loops.flatMap((l) => l.claims);

    for (const claim of allClaims) {
        if (claim.contradictions.length > 0) {
            anomalies.push({
                id: genId('an'),
                type: 'contradiction',
                severity: 'warning',
                description: `Claim contradicts ${claim.contradictions.length} other claims`,
                sources: [claim.sourceId],
                affectedClaims: [claim.id, ...claim.contradictions],
                recommendation: 'Cross-reference sources to resolve contradiction',
                timestamp: Date.now(),
            });
        }
    }

    for (const loop of session.loops) {
        const oldSources = loop.sources.filter(
            (s) => s.timestamp < Date.now() - 365 * 24 * 60 * 60 * 1000,
        );
        if (oldSources.length > 2) {
            anomalies.push({
                id: genId('an'),
                type: 'outdated_info',
                severity: 'info',
                description: `${oldSources.length} sources are over 1 year old`,
                sources: oldSources.map((s) => s.id),
                affectedClaims: allClaims
                    .filter((c) => oldSources.some((s) => s.id === c.sourceId))
                    .map((c) => c.id),
                recommendation: 'Search for more recent sources',
                timestamp: Date.now(),
            });
        }
    }

    if (allClaims.length < 3) {
        anomalies.push({
            id: genId('an'),
            type: 'data_gap',
            severity: 'warning',
            description: 'Very few claims extracted — insufficient data for analysis',
            sources: [],
            affectedClaims: [],
            recommendation: 'Run more epistemic loops to gather data',
            timestamp: Date.now(),
        });
    }

    return {
        sessionId: session.id,
        anomalies,
        criticalCount: anomalies.filter((a) => a.severity === 'critical').length,
        warningCount: anomalies.filter((a) => a.severity === 'warning').length,
        infoCount: anomalies.filter((a) => a.severity === 'info').length,
        createdAt: Date.now(),
    };
}

export function computeSummary(
    session: ResearchSession,
    style: SummaryStyle,
    length: SummaryLength,
): Omit<SummarizationResult, 'id' | 'sessionId' | 'createdAt'> {
    const allText_ = session.loops
        .flatMap((l) => [
            l.question.text,
            ...l.sources.map((s) => s.snippet),
            ...(l.synthesis?.keyFindings || []),
            l.synthesis?.summary || '',
        ])
        .filter(Boolean);

    const wordLimit = length === 'brief' ? 100 : length === 'normal' ? 300 : 800;
    const sentences = allText_
        .join(' ')
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);

    const scored = sentences.map((s) => ({
        sentence: s.trim(),
        score: allText_.filter((t) => t.toLowerCase().includes(s.toLowerCase().slice(0, 20)))
            .length,
    }));
    scored.sort((a, b) => b.score - a.score);

    const selected = scored.slice(0, Math.ceil(wordLimit / 30));
    const summary = selected.map((s) => s.sentence + '.').join(' ');

    const totalWords = allText_.join(' ').split(/\s+/).length;
    const summaryWords = summary.split(/\s+/).length;

    return {
        style,
        length,
        summary: summary || 'Insufficient data for summary.',
        sourceCount: session.loops.reduce((s, l) => s + l.sources.length, 0),
        compressionRatio: totalWords > 0 ? summaryWords / totalWords : 0,
        keyPoints: selected.slice(0, 5).map((s) => s.sentence),
    };
}

export function computeCitations(session: ResearchSession, format: CitationFormat): CitationExport {
    const allSources = [
        ...new Map(session.loops.flatMap((l) => l.sources).map((s) => [s.id, s])).values(),
    ];

    const entries: CitationEntry[] = allSources.map((source) => {
        const title = source.title || 'Unknown Title';
        const cleanTitle = title.replace(/[^\w\s]/g, '');
        const key = cleanTitle.split(/\s+/).slice(0, 3).join('_').toLowerCase() || 'ref';
        const year = source.year ?? new Date(source.timestamp).getFullYear();

        return {
            id: source.id,
            source,
            bibtex: `@misc{${key}_${year},\n  title = {{${title}}},\n  url = {${source.url}},\n  year = {${year}},\n  note = {[${source.sourceType}]}\n}`,
            apa: `${title}. (${year}). Retrieved from ${source.url}`,
            mla: `"${title}." ${source.url}. Accessed ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`,
            chicago: `${title}. ${source.url} (accessed ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}).`,
        };
    });

    const allContent = entries.map((e) => e[format]).join('\n---\n');

    return { entries, format, content: allContent };
}

export function computePeerReview(session: ResearchSession): PeerReview {
    const reviewers = [
        { id: genId('prv'), name: 'Dr. Methodology', expertise: 'Research Methodology' },
        { id: genId('prv'), name: 'Prof. Domain', expertise: 'Domain Expertise' },
        { id: genId('prv'), name: 'Dr. Statistics', expertise: 'Statistical Analysis' },
    ];

    const comments: PeerReviewComment[] = [];
    const allKeyFindings = session.loops.flatMap((l) => l.synthesis?.keyFindings || []);
    const allGaps = session.loops.flatMap((l) => l.synthesis?.gaps || []);

    for (const reviewer of reviewers) {
        if (allKeyFindings.length > 0) {
            comments.push({
                id: genId('prc'),
                reviewerId: reviewer.id,
                section: 'Key Findings',
                comment: `The findings section presents ${allKeyFindings.length} key points. Consider strengthening with quantitative evidence.`,
                type: 'suggestion',
                severity: 'minor',
            });
        }
        if (allGaps.length > 0) {
            comments.push({
                id: genId('prc'),
                reviewerId: reviewer.id,
                section: 'Limitations',
                comment: `The identified gaps (${allGaps.join('; ')}) are noted but lack proposed mitigation strategies.`,
                type: 'major_issue',
                severity: 'major',
            });
        }
        comments.push({
            id: genId('prc'),
            reviewerId: reviewer.id,
            section: 'Methodology',
            comment: `Research approach uses epistemic loop methodology with ${session.loops.length} iterations. ${
                session.loops.length < 3
                    ? 'Consider additional iterations for robustness.'
                    : 'Iteration count is adequate.'
            }`,
            type: session.loops.length < 3 ? 'major_issue' : 'praise',
            severity: session.loops.length < 3 ? 'major' : 'cosmetic',
        });
    }

    const avgConfidence =
        session.loops.length > 0
            ? session.loops.reduce((s, l) => s + (l.synthesis?.confidence || 0), 0) /
              session.loops.length
            : 0;

    const overallScore = avgConfidence * 100;
    const scores = {
        originality: Math.min(100, Math.round(overallScore + 10)),
        methodology: Math.min(100, Math.round(overallScore + session.loops.length * 5)),
        clarity: Math.min(100, Math.round(overallScore + 15)),
        significance: Math.min(100, Math.round(overallScore + 5)),
        overall: Math.min(100, Math.round(overallScore)),
    };

    const avgScore =
        (scores.originality + scores.methodology + scores.clarity + scores.significance) / 4;
    let recommendation: PeerReview['recommendation'];
    if (avgScore >= 75) recommendation = 'accept';
    else if (avgScore >= 60) recommendation = 'minor_revision';
    else if (avgScore >= 40) recommendation = 'major_revision';
    else recommendation = 'reject';

    return {
        id: genId('pr'),
        reportId: session.id,
        reportTitle: session.title,
        reviewers,
        comments,
        scores,
        recommendation,
        summary: `Peer review completed by ${reviewers.length} reviewers. Overall score: ${scores.overall}/100. Recommendation: ${recommendation}.`,
        createdAt: Date.now(),
    };
}

export function computeDiscovery(allSessions: ResearchSession[]): DiscoveryResult {
    const allLoops = allSessions.flatMap((s) => s.loops);
    const allText_ = allLoops
        .flatMap((l) => [l.question.text, ...(l.synthesis?.keyFindings || [])])
        .join(' ');

    const wordFreq = new Map<string, number>();
    const words = allText_.split(/\s+/).filter((w) => w.length > 5 && /^[A-Za-z]/.test(w));
    for (const w of words) {
        wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
    }

    const sorted = [...wordFreq.entries()].sort((a, b) => b[1] - a[1]);

    // 2b E11: determine trend by comparing recent vs older session frequency
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentText = allSessions
        .filter((s) => s.createdAt >= thirtyDaysAgo)
        .flatMap((s) => s.loops)
        .flatMap((l) => [l.question.text, ...(l.synthesis?.keyFindings || [])])
        .join(' ');
    const olderText = allSessions
        .filter((s) => s.createdAt < thirtyDaysAgo)
        .flatMap((s) => s.loops)
        .flatMap((l) => [l.question.text, ...(l.synthesis?.keyFindings || [])])
        .join(' ');

    const countWords = (text: string): Map<string, number> => {
        const map = new Map<string, number>();
        const toks = text.split(/\s+/).filter((w) => w.length > 5 && /^[A-Za-z]/.test(w));
        for (const w of toks) {
            map.set(w, (map.get(w) || 0) + 1);
        }
        return map;
    };

    const recentFreq = countWords(recentText);
    const olderFreq = countWords(olderText);

    const determineTrend = (word: string): 'rising' | 'stable' | 'falling' | 'emerging' => {
        const rf = recentFreq.get(word) || 0;
        const of = olderFreq.get(word) || 0;
        if (rf > 0 && of === 0) return 'emerging';
        if (of === 0) return 'stable';
        const ratio = rf / of;
        if (ratio > 1.2) return 'rising';
        if (ratio < 0.8) return 'falling';
        return 'stable';
    };

    const topics: DiscoveryTopic[] = sorted.slice(0, 8).map(([word, freq]) => ({
        id: genId('dt'),
        name: word,
        description: `Frequently discussed concept: "${word}" appears ${freq} times across research sessions`,
        sourceKeywords: [word.toLowerCase()],
        frequency: freq,
        trend: determineTrend(word),
        relevanceScore: Math.min(1, freq / Math.max(1, sorted[0]?.[1] || 1)),
        relatedTopics: sorted
            .slice(0, 3)
            .map(([w]) => w)
            .filter((w) => w !== word),
        lastObserved: Date.now(),
    }));

    const emergingTopics = topics.filter((t) => t.trend === 'emerging');
    const recommendations = topics.slice(0, 3).map((t) => ({
        topicId: t.id,
        reason: `High-frequency concept "${t.name}" warrants deeper investigation`,
    }));

    return {
        topics,
        trends: topics.map((t) => ({
            topic: t.name,
            change:
                t.trend === 'rising'
                    ? 0.3
                    : t.trend === 'falling'
                      ? -0.2
                      : t.trend === 'emerging'
                        ? 0.5
                        : 0,
        })),
        emergingTopics,
        recommendations,
        analyzedAt: Date.now(),
    };
}
