import type { ApiKey } from '../../types/metrics';
import { safeJsonParse } from '../../kernel/utils/safe-json';

export interface ProviderExportData {
    version: 1;
    exportedAt: string;
    providers: Array<{
        id: string;
        provider: string;
        label: string;
        key: string;
        status: string;
        availableModels?: string[];
        stats?: ApiKey['stats'];
    }>;
}

export class ExportProvidersCommand {
    readonly #getExportData: () => string;

    constructor(getExportData: () => string) {
        this.#getExportData = getExportData;
    }

    execute(): { data: string; filename: string } {
        const data = this.#getExportData();
        const filename = `providers-export-${new Date().toISOString().slice(0, 10)}.json`;
        return { data, filename };
    }

    download(): void {
        const { data, filename } = this.execute();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

export interface ImportValidationError {
    line: number;
    message: string;
}

export class ImportProvidersCommand {
    readonly #importFn: (jsonData: string) => number;

    constructor(importFn: (jsonData: string) => number) {
        this.#importFn = importFn;
    }

    validate(raw: string): { valid: boolean; count: number; errors: ImportValidationError[] } {
        const errors: ImportValidationError[] = [];
        if (!raw?.trim()) {
            errors.push({ line: 0, message: 'File is empty' });
            return { valid: false, count: 0, errors };
        }

        let parsed: unknown;
        try {
            parsed = safeJsonParse(raw);
        } catch {
            errors.push({ line: 0, message: 'Invalid JSON format' });
            return { valid: false, count: 0, errors };
        }

        if (!Array.isArray(parsed)) {
            errors.push({ line: 0, message: 'Expected a JSON array' });
            return { valid: false, count: 0, errors };
        }

        if (parsed.length === 0) {
            errors.push({ line: 0, message: 'Array is empty' });
            return { valid: false, count: 0, errors };
        }

        for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i] as Record<string, unknown>;
            if (!item.provider) errors.push({ line: i + 1, message: 'Missing "provider" field' });
            if (!item.label) errors.push({ line: i + 1, message: 'Missing "label" field' });
        }

        if (errors.length > 0) return { valid: false, count: 0, errors };

        return { valid: true, count: parsed.length, errors: [] };
    }

    execute(raw: string): number {
        const validation = this.validate(raw);
        if (!validation.valid) {
            const details = validation.errors.map((e) => `[${e.line}] ${e.message}`).join('; ');
            throw new Error(`Validation failed: ${details}`);
        }
        return this.#importFn(raw);
    }
}
