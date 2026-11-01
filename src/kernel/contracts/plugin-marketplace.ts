import type { PluginManifest } from './plugin';

/** Запись локального каталога плагинов (SPEC_06 §8). */
export interface MarketplaceEntry {
    manifest: PluginManifest;
    /** Описание для витрины (если отличается от manifest.description). */
    blurb?: string;
    /** Категория для группировки. */
    category?: string;
}
