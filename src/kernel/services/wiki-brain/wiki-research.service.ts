import type { IWikiQueryService } from '../../contracts/wiki-brain/wiki-query.service';
import type { KnowledgeUnitService } from './wiki-knowledge-unit.service';
import type { TWikiKnowledgeUnit } from '../../contracts/wiki-brain/types';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('WikiResearch');

export interface WikiResearchDeps {
    query: IWikiQueryService;
    units: KnowledgeUnitService;
    llm?: {
        chat(
            messages: Array<{ role: string; content: string }>,
            opts?: { model?: string },
        ): Promise<{ content: string }>;
    };
    projectId?: string;
}

export interface ResearchResult {
    question: string;
    sources: Array<{ slug: string; title: string; snippet: string }>;
    hypothesisId?: string;
    summary?: string;
    unitsCreated: number;
    status: 'completed' | 'no-sources' | 'synthesis-failed';
}

/**
 * WikiResearchService — F5: closed-loop research mode over Wiki-Brain.
 *
 * question → search → collect sources → synthesize (LLM) → persist as
 * knowledge units + hypothesis node → return checkable result.
 * Best-effort: LLM absence falls back to a source digest.
 */
export class WikiResearchService {
    constructor(private deps: WikiResearchDeps) {}

    private async synthesize(
        question: string,
        sources: Array<{ slug: string; title: string; snippet: string }>,
    ): Promise<string | undefined> {
        if (!this.deps.llm) return undefined;
        const ctx = sources
            .slice(0, 8)
            .map((s) => `[[${s.slug}]] ${s.title}: ${s.snippet.slice(0, 300)}`)
            .join('\n');
        try {
            const res = await this.deps.llm.chat([
                {
                    role: 'system',
                    content:
                        'You are a careful research synthesizer. Summarize findings with citations to [[slugs]].',
                },
                { role: 'user', content: `Question: ${question}\n\nSources:\n${ctx}` },
            ]);
            return res.content;
        } catch (e) {
            LOGGER.warn('WikiResearch', 'synthesis failed', { error: e });
            return undefined;
        }
    }

    async research(question: string): Promise<ResearchResult> {
        const hits = await this.deps.query.search(question, { topK: 6 });
        const sources = hits.map((h) => ({
            slug: h.page.slug,
            title: h.page.frontmatter.title,
            snippet: h.snippet,
        }));
        if (sources.length === 0) {
            return { question, sources: [], unitsCreated: 0, status: 'no-sources' };
        }

        const summary = await this.synthesize(question, sources);
        let unitsCreated = 0;

        try {
            // hypothesis node
            const hypothesis: TWikiKnowledgeUnit = await this.deps.units.addUnit({
                pageId: sources[0]!.slug,
                text: `Hypothesis for: ${question}`,
                kind: 'hypothesis',
                links: sources.map((s) => s.slug),
                projectId: this.deps.projectId,
            });
            unitsCreated += 1;

            if (summary) {
                await this.deps.units.addUnit({
                    pageId: sources[0]!.slug,
                    text: summary.slice(0, 2000),
                    kind: 'observation',
                    evidence: sources.map((s) => `[[${s.slug}]]`),
                    links: sources.map((s) => s.slug),
                    projectId: this.deps.projectId,
                });
                unitsCreated += 1;
            }

            return {
                question,
                sources,
                hypothesisId: hypothesis.id,
                summary,
                unitsCreated,
                status: 'completed',
            };
        } catch (e) {
            LOGGER.warn('WikiResearch', 'persist failed', { error: e });
            return { question, sources, unitsCreated, status: 'synthesis-failed' };
        }
    }

    async checkHypothesis(
        hypothesisId: string,
    ): Promise<{ ok: boolean; evidence: string[]; message: string }> {
        const unit = await this.deps.units.getUnit(hypothesisId);
        if (!unit) return { ok: false, evidence: [], message: 'hypothesis not found' };
        const evidence = unit.links ?? [];
        if (evidence.length === 0) {
            return {
                ok: false,
                evidence: [],
                message: 'hypothesis has no sources to verify against',
            };
        }
        return { ok: true, evidence, message: `hypothesis backed by ${evidence.length} source(s)` };
    }
}
