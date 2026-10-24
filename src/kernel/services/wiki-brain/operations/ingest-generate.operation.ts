import { z } from 'zod';
import { extractJson } from '../json-extract';
import { WikiPageFrontmatterSchema } from '../../../contracts/wiki-brain/types';
import type { WikiLlmClient } from '../../../contracts/wiki-brain/wiki-llm';
import type { IngestGenerateInput, IngestGenerateOutput } from '../../../contracts/wiki-brain/wiki-ingest.service';

const GENERATED_PAGE = z.object({
    frontmatter: WikiPageFrontmatterSchema,
    body: z.string(),
});

const OUTPUT_SCHEMA = z.object({
    pages: z.array(GENERATED_PAGE),
    links: z.array(
        z.object({
            fromSlug: z.string(),
            toSlug: z.string(),
            context: z.string().optional(),
            kind: z.enum(['wikilink', 'mention', 'citation']).default('wikilink'),
            weight: z.number().min(0).max(1).default(1),
        }),
    ),
    logEntry: z.object({
        op: z.literal('ingest'),
        actor: z.literal('llm'),
        summary: z.string(),
        details: z.record(z.string(), z.unknown()),
    }),
    lintFlags: z.array(z.object({ rule: z.string(), payload: z.unknown() })).default([]),
});

const SYSTEM_PROMPT = `You are a wiki-page generator following Karpathy's LLM Wiki pattern.
Output JSON only — no markdown fences.
Rules:
- First page MUST be source-summary (type="source-summary") with the source listed in frontmatter.sources.
- Entity/concept pages must cross-link via [[slug]] syntax in the body.
- Use kebab-case slugs. Each slug must be unique.
- Body is markdown, no YAML frontmatter in body (we serialize it separately).
- Append to log.md as a single entry summarizing what was added/updated.`;

export class IngestGenerateOperation {
    constructor(private llm: WikiLlmClient) {}

    async run(input: IngestGenerateInput): Promise<IngestGenerateOutput> {
        const userPrompt = [
            '# SOURCE',
            `id: ${input.source.id}`,
            `title: ${input.source.title}`,
            `language: ${input.language}`,
            '',
            '# ANALYSIS',
            JSON.stringify(input.analysis, null, 2),
            '',
            '# EXISTING SLUGS (do not duplicate)',
            input.existingSlugs.slice(0, 1000).join(', '),
            '',
            'Generate wiki pages JSON per schema.',
        ].join('\n');

        const raw = await this.llm.chat([
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
        ]);
        return OUTPUT_SCHEMA.parse(extractJson(raw.content));
    }
}
