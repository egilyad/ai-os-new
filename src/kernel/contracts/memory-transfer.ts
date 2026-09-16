export type ExportFormat = 'json' | 'csv' | 'markdown';

export interface MemoryExport {
    format: ExportFormat;
    sections: string[];
    data: string;
    createdAt: number;
    size: number;
}

export interface MemoryImport {
    id: string;
    source: string;
    format: ExportFormat;
    entriesCount: number;
    status: 'pending' | 'completed' | 'failed';
    createdAt: number;
    error?: string;
}

export interface IMemoryTransferService {
    export(format: ExportFormat, sections: string[]): MemoryExport;
    getExportHistory(): MemoryExport[];
    import(data: string, format: ExportFormat): Promise<MemoryImport>;
    getImportHistory(): MemoryImport[];
    previewImport(data: string, format: ExportFormat): { sections: string[]; entries: number };
}
