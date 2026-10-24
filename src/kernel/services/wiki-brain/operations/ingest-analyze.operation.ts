import { z } from 'zod';
import { extractJson } from '../json-extract';
import type { WikiLlmClient } from '../../../contracts/wiki-brain/wiki-llm';
import type { IngestAnalyzeInput, IngestAnalyzeOutput } from '../../../contracts/wiki-brain/wiki-ingest.service';

const OUTPUT_SCHEMA = z.object({
    entities: z.array(
        z.object({ name: z.string(), type: z.string(), aliases: z.array(z.string()).default([]) }),
    ),
    concepts: z.array(z.object({ name: z.string(), summary: z.string() })),
    arguments: z.array(z.object({ claim: z.string(), evidence: z.string() })),
    crossLinks: z.array(z.object({ toSlug: z.string(), reason: z.string() })),
    contradictions: z.array(z.object({ with: z.string(), description: z.string() })),
    wikiStructureHint: z.object({
        sections: z.array(z.string()),
        suggestedPages: z.array(z.string()),
    }),
});

const SYSTEM_PROMPT = `You are a wiki-ingest analyzer. Read the source and produce structured JSON.
Rules:
- "toSlug" in crossLinks MUST match existing slugs only (use kebab-case).
- Surface contradictions with EXISTING wiki knowledge, not just internal.
- Each entity must have a type: person | org | place | technology | concept | event | work | other.
- Output JSON only, no markdown fences.`;

export class IngestAnalyzeOperation {
    constructor(private llm: WikiLlmClient) {}

    async run(input: IngestAnalyzeInput): Promise<IngestAnalyzeOutput> {
        const userPrompt = [
            '# SOURCE',
            `title: ${input.source.title}`,
            `kind: ${input.source.kind}`,
            `language: ${input.source.language}`,
            `origin: ${input.source.origin}`,
            '',
            '--- CONTENT ---',
            input.source.contentText.slice(0, 32000),
            '',
            '--- EXISTING WIKI CONTEXT (use for crossLinks, contradictions) ---',
            `slugs: ${input.existingSlugs.slice(0, 500).join(', ')}`,
            `entities: ${input.existingEntities.slice(0, 500).join(', ')}`,
            '',
            'Produce JSON matching the schema. Do NOT include markdown fences.',
        ].join('\n');

        const raw = await this.llm.chat([
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
        ]);
        return OUTPUT_SCHEMA.parse(extractJson(raw.content));
    }
}
