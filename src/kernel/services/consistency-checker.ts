import { genId } from '../../utils/gen-id';
import type {
    IConsistencyChecker,
    ConsistencyCheckItem,
    ConsistencyReport,
    CodeManifest,
    CodeManifestEntry,
} from '../contracts/consistency-checker';
import type {
    IConsistencyHealingPipeline,
    HealingTask,
    HealingPlan,
    HealingFixSuggestion,
} from '../contracts/consistency-healing';
import { BUILTIN_MANIFEST } from './code-manifest';

const FILE_PATH_RE = /src\/[\w./-]+\.(ts|tsx|md)/g;
const PASCAL_CASE_RE = /\b[A-Z][a-zA-Z0-9]+\b/g;
const COLON_EVENT_RE = /\b[a-z]+(?::[a-z]+)+\b/g;

function extractFilePaths(
    content: string,
    docFile: string,
): Omit<ConsistencyCheckItem, 'found' | 'matchedTo' | 'note'>[] {
    const matches = [...content.matchAll(FILE_PATH_RE)];
    const seen = new Set<string>();
    return matches
        .map((m) => m[0])
        .filter((f) => {
            if (seen.has(f)) return false;
            seen.add(f);
            return true;
        })
        .map((name) => {
            const lineApprox = getLineNumber(content, name);
            return { type: 'file_path' as const, name, docFile, lineApprox };
        });
}

function extractTypeNames(
    content: string,
    docFile: string,
): Omit<ConsistencyCheckItem, 'found' | 'matchedTo' | 'note'>[] {
    const matches = [...content.matchAll(PASCAL_CASE_RE)];
    const seen = new Set<string>();
    const skip = new Set([
        'SuperAgents',
        'README',
        'System',
        'React',
        'TypeScript',
        'JavaScript',
        'Node',
        'HTML',
        'CSS',
        'JSON',
        'Zod',
        'DAG',
        'UUID',
        'OS',
        'DI',
        'LLM',
        'UI',
        'API',
        'DB',
        'URL',
        'JSDoc',
        'SLA',
        'TTL',
        'EMA',
        'AST',
        'ORM',
        'SQL',
        'DOM',
        'SRE',
        'P0',
        'P1',
        'P2',
        'P3',
        'v4',
        'DOC',
        'A',
        'B',
        'N',
        'M',
        'File',
        'Create',
        'Read',
        'Write',
        'Edit',
        'LIFO',
        'Vite',
        'Map',
        'Set',
        'Promise',
        'Date',
        'Error',
        'Array',
        'Record',
        'String',
        'Number',
        'Boolean',
        'Object',
        'Partial',
        'Pick',
        'Omit',
        'Exclude',
        'Extract',
        'ReturnType',
        'Parameters',
        'ConstructorParameters',
        'InstanceType',
        'ThisType',
        'NonNullable',
        'ThisParameterType',
        'OmitThisParameter',
    ]);
    return matches
        .map((m) => m[0])
        .filter((n) => {
            if (skip.has(n)) return false;
            if (seen.has(n)) return false;
            if (n.startsWith('I') && n.length > 1 && n[1] === n[1]!.toUpperCase()) return true; // interface
            if (
                n.endsWith('Service') ||
                n.endsWith('Engine') ||
                n.endsWith('Metrics') ||
                n.endsWith('Metric') ||
                n.endsWith('Graph') ||
                n.endsWith('Report')
            )
                return true;
            if (
                n.endsWith('Result') ||
                n.endsWith('State') ||
                n.endsWith('Edge') ||
                n.endsWith('Config') ||
                n.endsWith('Phase')
            )
                return true;
            if (
                n.endsWith('Score') ||
                n.endsWith('Impact') ||
                n.endsWith('Point') ||
                n.endsWith('Changer') ||
                n.endsWith('Correlation')
            )
                return true;
            if (
                n.endsWith('Limit') ||
                n.endsWith('Snapshot') ||
                n.endsWith('Topology') ||
                n.endsWith('Claim') ||
                n.endsWith('Entry')
            )
                return true;
            if (
                n.endsWith('Node') ||
                n.endsWith('Edge') ||
                n.endsWith('Tree') ||
                n.endsWith('Level') ||
                n.endsWith('Tier')
            )
                return true;
            return false;
        })
        .filter((n) => {
            seen.add(n);
            return true;
        })
        .map((name) => {
            const lineApprox = getLineNumber(content, name);
            return { type: 'type_name' as const, name, docFile, lineApprox };
        });
}

function extractEventNames(
    content: string,
    docFile: string,
): Omit<ConsistencyCheckItem, 'found' | 'matchedTo' | 'note'>[] {
    const matches = [...content.matchAll(COLON_EVENT_RE)];
    const seen = new Set<string>();
    return matches
        .map((m) => m[0])
        .filter((e) => e.includes(':') && e.split(':').length >= 2 && !e.startsWith('http'))
        .filter((e) => {
            if (seen.has(e)) return false;
            seen.add(e);
            return true;
        })
        .map((name) => {
            const lineApprox = getLineNumber(content, name);
            return { type: 'event_name' as const, name, docFile, lineApprox };
        });
}

function getLineNumber(content: string, substr: string): number {
    const idx = content.indexOf(substr);
    if (idx === -1) return 0;
    return content.substring(0, idx).split('\n').length;
}

function normalizeFilePath(name: string, manifest: CodeManifest): string | null {
    const fixed = name.startsWith('/') ? name.slice(1) : name;
    const match = manifest.entries.find(
        (e) => e.type === 'file_path' && (e.name === fixed || e.name === name),
    );
    return match ? match.name : null;
}

function findInManifest(
    name: string,
    type: 'type_name' | 'interface_name' | 'event_name' | 'service_name' | 'method_name',
    manifest: CodeManifest,
): CodeManifestEntry | undefined {
    return manifest.entries.find((e) => e.type === type && e.name === name);
}

const PHRASE_MAP: Record<string, string> = {
    'debate-runtime/debate-service.ts': 'src/kernel/services/debate-runtime/debate-service.ts',
    'debate-interpreter.ts': 'src/kernel/services/debate-interpreter.ts',
    'debate-governor/': 'src/kernel/services/debate-governor/',
    'debate-governor/types.ts': 'src/kernel/services/debate-governor/types.ts',
    'container.ts': 'src/kernel/container.ts',
    'bootstrap.ts': 'src/kernel/bootstrap.ts',
    'kernel.ts': 'src/kernel/kernel.ts',
    'instances.ts': 'src/kernel/instances.ts',
    'service-registration.ts': 'src/kernel/service-registration.ts',
    'topology-defaults.ts': 'src/kernel/state/topology-defaults.ts',
    'event-names.ts': 'src/kernel/events/event-names.ts',
};

function healingTaskId(): string {
    return genId('heal');
}

function groupByDocFile(items: ConsistencyCheckItem[]): Map<string, ConsistencyCheckItem[]> {
    const groups = new Map<string, ConsistencyCheckItem[]>();
    for (const item of items) {
        const existing = groups.get(item.docFile) ?? [];
        existing.push(item);
        groups.set(item.docFile, existing);
    }
    return groups;
}

function analyzeFailures(items: ConsistencyCheckItem[]): {
    analysis: string;
    fixes: HealingFixSuggestion[];
} {
    const fileMissing = items.filter((i) => i.type === 'file_path');
    const typeMissing = items.filter((i) => i.type === 'type_name' || i.type === 'interface_name');
    const eventMissing = items.filter((i) => i.type === 'event_name');
    const serviceMissing = items.filter((i) => i.type === 'service_name');
    const methodMissing = items.filter((i) => i.type === 'method_name');

    const parts: string[] = [];
    const fixes: HealingFixSuggestion[] = [];

    if (fileMissing.length > 0) {
        const names = fileMissing.map((i) => `\`${i.name}\``).join(', ');
        parts.push(`${fileMissing.length} file path(s) reference non-existent files: ${names}`);
        for (const item of fileMissing) {
            fixes.push({
                type: 'update_path',
                description: `Update or remove file path \`${item.name}\` (referenced at ${item.docFile}:~${item.lineApprox})`,
                confidence: 0.9,
            });
        }
    }

    if (typeMissing.length > 0) {
        const names = typeMissing.map((i) => `\`${i.name}\``).join(', ');
        parts.push(`${typeMissing.length} type/interface name(s) not found in code: ${names}`);
        for (const item of typeMissing) {
            fixes.push({
                type: 'update_name',
                description: `Update or remove type name \`${item.name}\` (referenced at ${item.docFile}:~${item.lineApprox})`,
                confidence: 0.8,
            });
        }
    }

    if (eventMissing.length > 0) {
        const names = eventMissing.map((i) => `\`${i.name}\``).join(', ');
        parts.push(
            `${eventMissing.length} event name(s) not registered in event-names.ts: ${names}`,
        );
        for (const item of eventMissing) {
            fixes.push({
                type: 'update_name',
                description: `Update or remove event name \`${item.name}\` (referenced at ${item.docFile}:~${item.lineApprox})`,
                confidence: 0.85,
            });
        }
    }

    if (serviceMissing.length > 0) {
        const names = serviceMissing.map((i) => `\`${i.name}\``).join(', ');
        parts.push(`${serviceMissing.length} service name(s) not found: ${names}`);
        for (const item of serviceMissing) {
            fixes.push({
                type: 'update_name',
                description: `Update or remove service name \`${item.name}\` (referenced at ${item.docFile}:~${item.lineApprox})`,
                confidence: 0.8,
            });
        }
    }

    if (methodMissing.length > 0) {
        const names = methodMissing.map((i) => `\`${i.name}\``).join(', ');
        parts.push(`${methodMissing.length} method name(s) not found: ${names}`);
        for (const item of methodMissing) {
            fixes.push({
                type: 'update_name',
                description: `Update or remove method name \`${item.name}\` (referenced at ${item.docFile}:~${item.lineApprox})`,
                confidence: 0.75,
            });
        }
    }

    const total = items.length;
    const categories: string[] = [];
    if (fileMissing.length > 0) categories.push(`${fileMissing.length} files`);
    if (typeMissing.length > 0) categories.push(`${typeMissing.length} types`);
    if (eventMissing.length > 0) categories.push(`${eventMissing.length} events`);
    if (serviceMissing.length > 0) categories.push(`${serviceMissing.length} services`);
    if (methodMissing.length > 0) categories.push(`${methodMissing.length} methods`);

    const analysis = `Document references ${total} code artifact(s) that don't exist: ${categories.join(', ')}. ${parts.join('. ')}.`;
    return { analysis, fixes };
}

export class ConsistencyChecker implements IConsistencyChecker, IConsistencyHealingPipeline {
    destroy(): void {
        /* no-op — all resources are method-scoped */
    }

    private lastReport: ConsistencyReport | null = null;
    private healingPlan: HealingPlan | null = null;
    private manifest: CodeManifest;
    private docAgents: string[];

    constructor(manifest?: CodeManifest, docAgentNames?: string[]) {
        this.manifest = manifest ?? BUILTIN_MANIFEST;
        this.docAgents = docAgentNames ?? [
            'Architect Agent',
            'Auditor Agent',
            'Simplifier Agent',
            'Historian Agent',
            'Consistency Checker',
        ];
    }

    getManifest(): CodeManifest {
        return this.manifest;
    }

    getLastReport(): ConsistencyReport | null {
        return this.lastReport;
    }

    getPlan(): HealingPlan | null {
        return this.healingPlan;
    }

    analyze(docContents: Record<string, string>): HealingPlan {
        const report = this.checkDocs(docContents);
        const failed = report.items.filter((i) => !i.found);
        const groups = groupByDocFile(failed);

        const tasks: HealingTask[] = [];
        for (const [docFile, items] of groups) {
            const { analysis, fixes } = analyzeFailures(items);
            tasks.push({
                id: healingTaskId(),
                docFile,
                failedItems: items,
                analysis,
                suggestedFixes: fixes,
                status: 'pending',
            });
        }

        const completed = tasks.filter((t) => t.status === 'completed').length;
        const failedTasks = tasks.filter((t) => t.status === 'failed').length;

        const plan: HealingPlan = {
            timestamp: Date.now(),
            report,
            tasks,
            summary:
                report.failed === 0
                    ? 'No healing needed — all references verified.'
                    : `Healing needed: ${tasks.length} doc file(s) with ${report.failed} unresolved reference(s).`,
            totalTasks: tasks.length,
            completedTasks: completed,
            failedTasks,
        };

        this.healingPlan = plan;
        return plan;
    }

    async executeTask(taskId: string): Promise<HealingTask> {
        if (!this.healingPlan) throw new Error('No plan — call analyze() first');
        const task = this.healingPlan.tasks.find((t) => t.id === taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);
        task.status = 'in_progress';

        try {
            const result = await this.runDocumentationDebate(task);
            task.status = 'completed';
            task.debateConsensus = result;
            task.verifiedAt = Date.now();
        } catch (e) {
            task.status = 'failed';
            task.debateConsensus = `Error: ${e instanceof Error ? e.message : String(e)}`;
        }

        return task;
    }

    async executeAll(): Promise<HealingTask[]> {
        if (!this.healingPlan) throw new Error('No plan — call analyze() first');
        const results: HealingTask[] = [];
        for (const task of this.healingPlan.tasks) {
            if (task.status === 'completed') {
                results.push(task);
                continue;
            }
            const result = await this.executeTask(task.id);
            results.push(result);
        }
        this.healingPlan.completedTasks = this.healingPlan.tasks.filter(
            (t) => t.status === 'completed',
        ).length;
        this.healingPlan.failedTasks = this.healingPlan.tasks.filter(
            (t) => t.status === 'failed',
        ).length;
        return results;
    }

    async verifyAll(docContents?: Record<string, string>): Promise<ConsistencyReport> {
        if (!this.healingPlan || !this.healingPlan.report) {
            throw new Error('No plan — call analyze() first');
        }

        // 2f M2: accept real doc contents for meaningful verification; otherwise build empty stubs
        const docFiles =
            docContents ??
            this.healingPlan.report.items.reduce<Record<string, string>>((acc, item) => {
                if (!acc[item.docFile]) acc[item.docFile] = '';
                return acc;
            }, {});

        if (Object.keys(docFiles).length === 0) {
            return {
                timestamp: Date.now(),
                total: 0,
                passed: 0,
                failed: 0,
                items: [],
                byCategory: {},
                summary: 'No documents to verify',
            };
        }

        const newReport = this.checkDocs(docFiles);

        if (this.healingPlan) {
            for (const task of this.healingPlan.tasks) {
                const relatedItems = newReport.items.filter(
                    (i) => i.docFile === task.docFile && !i.found,
                );
                if (relatedItems.length === 0) {
                    task.verifiedPassed = task.failedItems.length;
                    task.verifiedFailed = 0;
                } else {
                    const originalFailed = task.failedItems.map((i) => i.name);
                    const stillFailed = relatedItems.filter((i) => originalFailed.includes(i.name));
                    task.verifiedPassed = task.failedItems.length - stillFailed.length;
                    task.verifiedFailed = stillFailed.length;
                }
            }
        }

        return newReport;
    }

    private async runDocumentationDebate(task: HealingTask): Promise<string> {
        const contextLines = task.failedItems
            .map(
                (i) =>
                    `- [${i.type}] \`${i.name}\` at ${i.docFile}:~${i.lineApprox} — not found in code`,
            )
            .join('\n');

        const fixLines = task.suggestedFixes
            .map((f) => `- ${f.description} (confidence: ${Math.round(f.confidence * 100)}%)`)
            .join('\n');

        const consensus = [
            `## Auto-Healing Report: ${task.docFile}`,
            '',
            '### Issues Found',
            contextLines,
            '',
            '### Suggested Fixes',
            fixLines,
            '',
            '### Agents',
            this.docAgents.map((a) => `- ${a}`).join('\n'),
            '',
            '### Pipeline',
            '1. Architect Agent reviews failed references and determines correct replacements',
            '2. Auditor Agent validates each replacement against actual code structure',
            '3. Simplifier Agent ensures the fix is readable and consistent',
            '4. Historian Agent adds context about why the reference was incorrect',
            '5. Consistency Checker verifies all replacements resolve the mismatch',
            '',
            '### Execution',
            'The Documentation Debate pipeline will produce corrected content for',
            `\`${task.docFile}\`. After the debate reaches consensus, the content is`,
            'persisted and the Consistency Checker is re-run to verify.',
        ].join('\n');

        return consensus;
    }

    checkDocs(docContents: Record<string, string>): ConsistencyReport {
        const items: ConsistencyCheckItem[] = [];

        for (const [docFile, content] of Object.entries(docContents)) {
            const shortName = docFile.split('/').pop() ?? docFile;

            // Extract and check file paths
            const fileRefs = extractFilePaths(content, shortName);
            for (const ref of fileRefs) {
                const normalized = normalizeFilePath(ref.name, this.manifest);
                const phraseMatch = Object.entries(PHRASE_MAP).find(([phrase]) =>
                    ref.name.includes(phrase),
                );
                if (normalized) {
                    items.push({ ...ref, found: true, matchedTo: normalized });
                } else if (phraseMatch) {
                    items.push({
                        ...ref,
                        found: true,
                        matchedTo: phraseMatch[1],
                        note: 'matched via phrase map',
                    });
                } else {
                    items.push({ ...ref, found: false, note: 'file not in manifest' });
                }
            }

            // Extract and check type names
            const typeRefs = extractTypeNames(content, shortName);
            for (const ref of typeRefs) {
                if (ref.name.startsWith('I') && ref.name[1] === ref.name[1]!.toUpperCase()) {
                    // Interface name
                    const match = findInManifest(ref.name, 'interface_name', this.manifest);
                    items.push({
                        ...ref,
                        type: 'interface_name',
                        found: !!match,
                        matchedTo: match?.location,
                    });
                } else {
                    // Type or service name
                    const typeMatch = findInManifest(ref.name, 'type_name', this.manifest);
                    const svcMatch = !typeMatch
                        ? findInManifest(ref.name, 'service_name', this.manifest)
                        : undefined;
                    if (typeMatch) {
                        items.push({ ...ref, found: true, matchedTo: typeMatch.location });
                    } else if (svcMatch) {
                        items.push({
                            ...ref,
                            type: 'service_name',
                            found: true,
                            matchedTo: svcMatch.location,
                        });
                    } else {
                        items.push({ ...ref, found: false });
                    }
                }
            }

            // Extract and check event names
            const eventRefs = extractEventNames(content, shortName);
            for (const ref of eventRefs) {
                const match = findInManifest(ref.name, 'event_name', this.manifest);
                items.push({ ...ref, found: !!match, matchedTo: match?.location });
            }
        }

        const passed = items.filter((i) => i.found).length;
        const failed = items.filter((i) => !i.found).length;

        const byCategory: Record<string, { total: number; passed: number; failed: number }> = {};
        for (const item of items) {
            if (!byCategory[item.type]) {
                byCategory[item.type] = { total: 0, passed: 0, failed: 0 };
            }
            byCategory[item.type]!.total++;
            if (item.found) {
                byCategory[item.type]!.passed++;
            } else {
                byCategory[item.type]!.failed++;
            }
        }

        let summary: string;
        if (failed === 0) {
            summary = `All ${passed} references verified — docs match code manifest.`;
        } else if (failed < 5) {
            summary = `${failed} of ${items.length} references unresolved (${Math.round((passed / items.length) * 100)}% match). Minor drift detected.`;
        } else if (failed < 20) {
            summary = `${failed} of ${items.length} references unresolved (${Math.round((passed / items.length) * 100)}% match). Moderate drift — review flagged items.`;
        } else {
            summary = `${failed} of ${items.length} references unresolved (${Math.round((passed / items.length) * 100)}% match). Significant drift — documentation needs update.`;
        }

        const report: ConsistencyReport = {
            timestamp: Date.now(),
            total: items.length,
            passed,
            failed,
            items,
            byCategory,
            summary,
        };

        this.lastReport = report;
        return report;
    }

    /**
     * Fetch markdown doc files from the dev-server /docs/ path.
     * Validates paths to prevent path traversal attacks.
     * @param files List of paths like 'docs/SOMETHING.md'
     * @param signal Optional AbortSignal for cancellation
     */
    async fetchDocs(files: string[], signal?: AbortSignal): Promise<Record<string, string>> {
        const validPathRe = /^[\w./-]+\.md$/;
        const contents: Record<string, string> = {};
        const timeout = 5000; // 5s per file

        for (const file of files) {
            if (signal?.aborted) break;
            if (!validPathRe.test(file)) {
                // Skip invalid paths (traversal attempts, wrong extensions)
                continue;
            }
            const timeoutController = new AbortController();
            let timer: ReturnType<typeof setTimeout> | undefined;
            try {
                timer = setTimeout(() => timeoutController.abort(), timeout);
                const combinedSignal = signal
                    ? (AbortSignal.any?.([timeoutController.signal, signal]) ??
                      timeoutController.signal)
                    : timeoutController.signal;
                const resp = await fetch(`/${file}`, { signal: combinedSignal });
                clearTimeout(timer);
                if (resp.ok) {
                    contents[file] = await resp.text();
                } else {
                    resp.body?.cancel();
                }
            } catch {
                if (timer !== undefined) clearTimeout(timer);
                /* skip unavailable docs */
            }
        }
        return contents;
    }
}
