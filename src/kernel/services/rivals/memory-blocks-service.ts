/**
 * MemoryBlocksService — F.2 (Letta-style core blocks, additive).
 *
 * Editable human/persona/system sections with char limits (append refuses
 * overflow, set truncates with a `[truncated]` marker). `corePrompt()` renders
 * the assembled block text for system prompts. Registers agent-callable
 * memory tools into ToolRunner when wired (phase33).
 */
import type { IEventBus } from '../../types/interfaces';
import type { RivalRepository } from '../../dal/rival-repository';
import type { IMemoryBlocksService } from '../../contracts/rivals';
import type { MemoryBlock } from '../../types/rival-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('MemoryBlocks');

function now(): number {
    return Date.now();
}

export const DEFAULT_BLOCK_LIMIT = 2000;

export class MemoryBlocksService implements IMemoryBlocksService {
    constructor(
        private repo: RivalRepository,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('MemoryBlocks', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async setBlock(
        ownerId: string,
        section: MemoryBlock['section'],
        content: string,
        charLimit = DEFAULT_BLOCK_LIMIT,
    ): Promise<MemoryBlock> {
        const existing = await this.find(ownerId, section);
        const t = now();
        const trimmed =
            content.length > charLimit ? content.slice(0, charLimit) + ' [truncated]' : content;
        if (existing) {
            existing.content = trimmed;
            existing.charLimit = charLimit;
            existing.updatedAt = t;
            await this.repo.putBlock(existing);
            return existing;
        }
        const block: MemoryBlock = {
            id: genId('mblock'),
            ownerId,
            section,
            content: trimmed,
            charLimit,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putBlock(block);
        this.events.emit(EVENTS.BLOCK_SET, { ownerId, section });
        return block;
    }

    async appendBlock(ownerId: string, section: MemoryBlock['section'], text: string): Promise<MemoryBlock> {
        const existing = await this.find(ownerId, section);
        if (!existing) return this.setBlock(ownerId, section, text);
        const next = existing.content ? `${existing.content}\n${text}` : text;
        if (next.length > existing.charLimit) {
            throw new Error(
                `Block ${section} overflow (${next.length} > ${existing.charLimit}) — rewrite it shorter first`,
            );
        }
        existing.content = next;
        existing.updatedAt = now();
        await this.repo.putBlock(existing);
        return existing;
    }

    async getBlocks(ownerId: string): Promise<MemoryBlock[]> {
        const all = await this.repo.listBlocks();
        return all.filter((b) => b.ownerId === ownerId);
    }

    async corePrompt(ownerId: string): Promise<string> {
        const blocks = await this.getBlocks(ownerId);
        const order: Array<MemoryBlock['section']> = ['persona', 'human', 'system'];
        blocks.sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section));
        if (blocks.length === 0) return '';
        return blocks.map((b) => `<${b.section}_block>\n${b.content}\n</${b.section}_block>`).join('\n');
    }

    private async find(ownerId: string, section: MemoryBlock['section']): Promise<MemoryBlock | null> {
        const all = await this.repo.listBlocks();
        return all.find((b) => b.ownerId === ownerId && b.section === section) ?? null;
    }
}
