export interface PromptVersion {
    id: string;
    promptId: string;
    content: string;
    version: number;
    author: string;
    createdAt: number;
    comment: string;
}

export interface PromptMeta {
    id: string;
    name: string;
    currentVersion: number;
    createdAt: number;
    updatedAt: number;
}

export interface IPromptVersionService {
    getPrompts(): PromptMeta[];
    getVersions(promptId: string): PromptVersion[];
    saveVersion(
        promptId: string,
        name: string,
        content: string,
        author: string,
        comment: string,
    ): PromptVersion;
    deletePrompt(promptId: string): void;
}
