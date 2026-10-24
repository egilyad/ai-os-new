export interface WikiVaultSyncResult {
    attached: boolean;
    name: string | null;
    exported: number;
    imported: number;
    skipped: number;
}

export interface WikiVaultAttachOptions {
    mode?: 'read' | 'readwrite';
}

export interface IWikiVaultSyncService {
    isAttached(): boolean;
    getVaultName(): string | null;
    attachVault(opts?: WikiVaultAttachOptions): Promise<WikiVaultSyncResult>;
    detachVault(): Promise<void>;
    /**
     * Write wiki pages (wiki/*.md) and sources (raw/*.md) from IndexedDB into
     * the attached folder as an Obsidian-style vault.
     */
    exportToVault(): Promise<WikiVaultSyncResult>;
    /**
     * Scan the vault's raw/ folder, turn each markdown file into a source (if
     * not already imported by sha256) and enqueue it for ingest.
     */
    importFromVault(): Promise<WikiVaultSyncResult>;
}
