/**
 * Aquarium Screenshots Service
 * Save/share aquarium state
 */

import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../../../kernel/instances';
import { eventBus } from '../../../kernel/instances';
import { EVENTS } from '../../../kernel/events/event-names';
import { BucketStorageAdapter } from '../../../kernel/services/storage-adapter';

const LOGGER = rootLogger.child('AquariumScreenshots');

const MAX_SCREENSHOTS = 50;

export interface Screenshot {
    id: string;
    dataUrl: string;
    thumbnail?: string;
    timestamp: number;
    caption?: string;
    providers: string[];
}

class AquariumScreenshotsService {
    private storage: BucketStorageAdapter;
    private screenshots: Map<string, Screenshot> = new Map();

    constructor() {
        this.storage = BucketStorageAdapter.UI;
    }

    async init(): Promise<void> {
        const saved = await this.storage.get<[string, Screenshot][]>('screenshots');
        if (saved) {
            for (const [id, ss] of saved) {
                this.screenshots.set(id, ss);
            }
        }
        LOGGER.info('AquariumScreenshots', `Initialized with ${this.screenshots.size} screenshots`);
    }

    /**
     * Capture screenshot from canvas
     */
    async capture(canvas: HTMLCanvasElement, providers: string[]): Promise<Screenshot> {
        const id = genId('ss');

        // Get full resolution
        const dataUrl = canvas.toDataURL('image/png', 1.0);

        // Create thumbnail (resize to 200px width)
        const thumbCanvas = document.createElement('canvas');
        const scale = 200 / canvas.width;
        thumbCanvas.width = 200;
        thumbCanvas.height = canvas.height * scale;
        const ctx = thumbCanvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
        }
        const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

        const screenshot: Screenshot = {
            id,
            dataUrl,
            thumbnail,
            timestamp: Date.now(),
            providers,
        };

        this.screenshots.set(id, screenshot);
        // P1-20: evict oldest screenshots when over limit
        if (this.screenshots.size > MAX_SCREENSHOTS) {
            const sorted = Array.from(this.screenshots.entries()).sort(
                ([, a], [, b]) => a.timestamp - b.timestamp,
            );
            const toRemove = sorted.slice(0, this.screenshots.size - MAX_SCREENSHOTS);
            for (const [evictId] of toRemove) this.screenshots.delete(evictId);
        }
        await this.save();

        eventBus.emit(EVENTS.AQUARIUM_SCREENSHOT_CAPTURED, screenshot);
        LOGGER.info('AquariumScreenshots', 'Screenshot captured', { id });

        return screenshot;
    }

    /**
     * Add caption to screenshot
     */
    async addCaption(id: string, caption: string): Promise<void> {
        const screenshot = this.screenshots.get(id);
        if (!screenshot) return;

        screenshot.caption = caption;
        await this.save();
    }

    /**
     * Get screenshot by ID
     */
    get(id: string): Screenshot | undefined {
        return this.screenshots.get(id);
    }

    /**
     * Get all screenshots
     */
    getAll(): Screenshot[] {
        return Array.from(this.screenshots.values()).sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Delete screenshot
     */
    async delete(id: string): Promise<boolean> {
        const deleted = this.screenshots.delete(id);
        if (deleted) {
            await this.save();
        }
        return deleted;
    }

    /**
     * Export screenshot as file
     */
    exportAsFile(id: string): void {
        const screenshot = this.screenshots.get(id);
        if (!screenshot) return;

        const link = document.createElement('a');
        link.href = screenshot.dataUrl;
        link.download = `aquarium-${Date.now()}.png`;
        link.click();
    }

    /**
     * Get screenshot stats
     */
    getStats(): { total: number; byProvider: Record<string, number> } {
        const byProvider: Record<string, number> = {};

        for (const ss of this.screenshots.values()) {
            for (const provider of ss.providers) {
                byProvider[provider] = (byProvider[provider] || 0) + 1;
            }
        }

        return {
            total: this.screenshots.size,
            byProvider,
        };
    }

    private async save(): Promise<void> {
        const entries = Array.from(this.screenshots.entries());
        await this.storage.set('screenshots', entries);
    }
}

// Singleton
export const aquariumScreenshotsService = new AquariumScreenshotsService();
