import type {
    IPromptVersionService,
    PromptMeta,
    PromptVersion,
} from '../contracts/prompt-version-history';
import { ssrSafeStorage } from '../utils/ssr-storage';

const STORAGE_KEY = 'prompt_version_data';
const MAX_VERSIONS_PER_PROMPT = 50;

function id(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface PersistedData {
    prompts: PromptMeta[];
    versions: PromptVersion[];
}

export class PromptVersionService implements IPromptVersionService {
    private prompts: PromptMeta[] = [];
    private versions: PromptVersion[] = [];
    private _initialized = false;

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
        try {
            const raw = ssrSafeStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw) as PersistedData;
                this.prompts = data.prompts ?? [];
                this.versions = data.versions ?? [];
                return;
            }
        } catch {
            /* silent */
        }

        this.prompts = [
            {
                id: 'p1',
                name: 'System Prompt Default',
                currentVersion: 2,
                createdAt: Date.now() - 86400000 * 5,
                updatedAt: Date.now() - 86400000,
            },
            {
                id: 'p2',
                name: 'Debate Judge Prompt',
                currentVersion: 3,
                createdAt: Date.now() - 86400000 * 3,
                updatedAt: Date.now() - 3600000,
            },
            {
                id: 'p3',
                name: 'Code Review Template',
                currentVersion: 1,
                createdAt: Date.now() - 86400000,
                updatedAt: Date.now() - 86400000,
            },
        ];
        this.versions = [
            {
                id: 'v1',
                promptId: 'p1',
                content: 'You are a helpful assistant.',
                version: 1,
                author: 'system',
                createdAt: Date.now() - 86400000 * 5,
                comment: 'Initial',
            },
            {
                id: 'v2',
                promptId: 'p1',
                content: 'You are a helpful assistant. Be concise and accurate.',
                version: 2,
                author: 'admin',
                createdAt: Date.now() - 86400000,
                comment: 'Added conciseness',
            },
            {
                id: 'v3',
                promptId: 'p2',
                content: 'Evaluate the debate fairly based on logic, evidence, and rhetoric.',
                version: 1,
                author: 'system',
                createdAt: Date.now() - 86400000 * 3,
                comment: 'Initial',
            },
            {
                id: 'v4',
                promptId: 'p2',
                content:
                    'Evaluate the debate fairly based on logic, evidence, rhetoric, and adherence to debate format.',
                version: 2,
                author: 'admin',
                createdAt: Date.now() - 86400000,
                comment: 'Added format adherence',
            },
            {
                id: 'v5',
                promptId: 'p2',
                content:
                    'Evaluate the debate fairly. Score each criterion 1-10 and provide justification. Consider logic, evidence, rhetoric, and adherence to debate format.',
                version: 3,
                author: 'admin',
                createdAt: Date.now() - 3600000,
                comment: 'Added scoring system',
            },
            {
                id: 'v6',
                promptId: 'p3',
                content:
                    'Review the code for bugs, performance issues, and code style violations. Provide actionable feedback.',
                version: 1,
                author: 'system',
                createdAt: Date.now() - 86400000,
                comment: 'Initial',
            },
        ];
    }

    start(): Promise<void> {
        return Promise.resolve();
    }

    destroy(): void {
        this.prompts = [];
        this.versions = [];
    }

    private persist(): void {
        try {
            ssrSafeStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ prompts: this.prompts, versions: this.versions }),
            );
        } catch {
            /* silent */
        }
    }

    getPrompts(): PromptMeta[] {
        return this.prompts;
    }

    getVersions(promptId: string): PromptVersion[] {
        return this.versions
            .filter((v) => v.promptId === promptId)
            .sort((a, b) => b.version - a.version);
    }

    saveVersion(
        promptId: string,
        name: string,
        content: string,
        author: string,
        comment: string,
    ): PromptVersion {
        let meta = this.prompts.find((p) => p.id === promptId);
        if (!meta) {
            meta = {
                id: promptId,
                name,
                currentVersion: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            this.prompts.push(meta);
        }
        meta.currentVersion++;
        meta.updatedAt = Date.now();
        meta.name = name;
        const v: PromptVersion = {
            id: id(),
            promptId,
            content,
            version: meta.currentVersion,
            author,
            createdAt: Date.now(),
            comment,
        };
        this.versions.push(v);
        const promptVersions = this.versions.filter((pv) => pv.promptId === promptId);
        if (promptVersions.length > MAX_VERSIONS_PER_PROMPT) {
            const toRemove = promptVersions
                .sort((a, b) => a.createdAt - b.createdAt)
                .slice(0, promptVersions.length - MAX_VERSIONS_PER_PROMPT);
            const removeIds = new Set(toRemove.map((r) => r.id));
            this.versions = this.versions.filter((pv) => !removeIds.has(pv.id));
        }
        if (this.versions.length > 1000) {
            this.versions = this.versions.slice(-1000);
        }
        this.persist();
        return v;
    }

    deletePrompt(promptId: string): void {
        this.prompts = this.prompts.filter((p) => p.id !== promptId);
        this.versions = this.versions.filter((v) => v.promptId !== promptId);
        this.persist();
    }
}
