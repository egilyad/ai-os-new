import { z } from 'zod';

export const WikiPageFrontmatterSchema = z.object({
    slug: z.string().min(1),
    title: z.string().min(1),
    type: z.enum(['source-summary', 'entity', 'concept', 'overview', 'index', 'log', 'curated']),
    sources: z
        .array(
            z.object({
                sourceId: z.string(),
                title: z.string(),
                sha256: z.string(),
                ranges: z.array(z.string()).optional(),
            }),
        )
        .default([]),
    aliases: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    language: z.enum(['en', 'ru', 'mixed']).default('en'),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    reviewState: z.enum(['auto', 'flagged', 'approved', 'rejected']).default('auto'),
    graphIn: z.number().int().nonnegative().default(0),
    graphOut: z.number().int().nonnegative().default(0),
});
export type TWikiPageFrontmatter = z.infer<typeof WikiPageFrontmatterSchema>;

export const WikiPageSchema = z.object({
    id: z.string(),
    slug: z.string(),
    frontmatter: WikiPageFrontmatterSchema,
    body: z.string(),
    sha256: z.string(),
    rawMarkdown: z.string(),
});
export type TWikiPage = z.infer<typeof WikiPageSchema>;

export const WikiSourceSchema = z.object({
    id: z.string(),
    kind: z.enum(['pdf', 'docx', 'epub', 'mobi', 'org', 'markdown', 'html', 'url', 'image', 'plain']),
    title: z.string(),
    origin: z.string(),
    sha256: z.string(),
    sizeBytes: z.number().int().nonnegative(),
    language: z.enum(['en', 'ru', 'mixed', 'auto']).default('auto'),
    contentText: z.string(),
    meta: z.record(z.string(), z.unknown()).default({}),
    importedAt: z.string().datetime(),
});
export type TWikiSource = z.infer<typeof WikiSourceSchema>;

export const WikiLinkSchema = z.object({
    id: z.string(),
    fromSlug: z.string(),
    toSlug: z.string(),
    context: z.string().optional(),
    kind: z.enum(['wikilink', 'mention', 'citation']).default('wikilink'),
    weight: z.number().min(0).max(1).default(1),
});
export type TWikiLink = z.infer<typeof WikiLinkSchema>;

export const WikiLogEntrySchema = z.object({
    id: z.string(),
    ts: z.string().datetime(),
    op: z.enum(['ingest', 'query', 'lint', 'index-refresh', 'export', 'import', 'delete']),
    actor: z.enum(['user', 'llm', 'system']),
    sourceId: z.string().optional(),
    pageIds: z.array(z.string()).default([]),
    summary: z.string(),
    details: z.record(z.string(), z.unknown()).default({}),
});
export type TWikiLogEntry = z.infer<typeof WikiLogEntrySchema>;

export const WikiQueueTaskSchema = z.object({
    id: z.string(),
    sourceId: z.string(),
    status: z.enum(['pending', 'processing', 'done', 'failed', 'cancelled']),
    attempts: z.number().int().nonnegative().default(0),
    lastError: z.string().optional(),
    startedAt: z.string().datetime().optional(),
    finishedAt: z.string().datetime().optional(),
    priority: z.number().int().default(0),
});
export type TWikiQueueTask = z.infer<typeof WikiQueueTaskSchema>;

export const WikiLintIssueSchema = z.object({
    id: z.string(),
    rule: z.enum([
        'dead-wikilink',
        'duplicate-entity',
        'missing-frontmatter',
        'orphan-page',
        'stale-source',
        'circular-link',
        'low-cohesion-cluster',
    ]),
    severity: z.enum(['info', 'warn', 'error']),
    pageId: z.string().optional(),
    fromSlug: z.string().optional(),
    toSlug: z.string().optional(),
    message: z.string(),
    detectedAt: z.string().datetime(),
});
export type TWikiLintIssue = z.infer<typeof WikiLintIssueSchema>;
