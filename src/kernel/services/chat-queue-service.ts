/**
 * Chat Queue Service — AGEMS port, Phase 11.3.
 * In-process message queue for busy agents.
 */
import { rootLogger } from './logger-service';

const log = rootLogger.child('ChatQueueService');

export interface QueuedMessage {
    id: string;
    agentId: string;
    sessionId: string;
    content: string;
    sender: string;
    timestamp: number;
    status: 'pending' | 'processing' | 'sent' | 'failed';
    retryCount: number;
    maxRetries: number;
}

let counter = 0;

export class ChatQueueService {
    private queue: QueuedMessage[] = [];
    private processing = new Set<string>(); // agentIds currently processing

    private genId(): string {
        return `msg-${Date.now()}-${++counter}`;
    }

    /**
     * Enqueue a message for an agent. If the agent is free, process immediately.
     */
    async enqueue(input: {
        agentId: string;
        sessionId: string;
        content: string;
        sender: string;
        maxRetries?: number;
    }): Promise<QueuedMessage> {
        const msg: QueuedMessage = {
            id: this.genId(),
            ...input,
            maxRetries: input.maxRetries ?? 3,
            timestamp: Date.now(),
            status: 'pending',
            retryCount: 0,
        };
        this.queue.push(msg);
        log.info('enqueue', `Message queued for agent ${input.agentId}: ${msg.id}`);

        // Try to process immediately if agent is free
        if (!this.processing.has(input.agentId)) {
            this.processNext(input.agentId);
        }
        return msg;
    }

    /**
     * Process next message in queue for a given agent.
     */
    private async processNext(agentId: string): Promise<void> {
        const next = this.queue.find(m => m.agentId === agentId && m.status === 'pending');
        if (!next) {
            this.processing.delete(agentId);
            return;
        }

        this.processing.add(agentId);
        next.status = 'processing';

        try {
            // In production, this would call the chat service
            // For now, just mark as sent
            next.status = 'sent';
            log.info('processNext', `Message processed: ${next.id}`);
        } catch (err) {
            next.retryCount++;
            if (next.retryCount >= next.maxRetries) {
                next.status = 'failed';
                log.error('processNext', `Message failed after ${next.maxRetries} retries: ${next.id}`);
            } else {
                next.status = 'pending';
                log.warn('processNext', `Message retry ${next.retryCount}/${next.maxRetries}: ${next.id}`);
            }
        }

        // Process next
        this.processNext(agentId);
    }

    /**
     * Get queue status for an agent.
     */
    getStatus(agentId: string): { pending: number; processing: number; sent: number; failed: number } {
        const agentMessages = this.queue.filter(m => m.agentId === agentId);
        return {
            pending: agentMessages.filter(m => m.status === 'pending').length,
            processing: agentMessages.filter(m => m.status === 'processing').length,
            sent: agentMessages.filter(m => m.status === 'sent').length,
            failed: agentMessages.filter(m => m.status === 'failed').length,
        };
    }

    /**
     * Get all queued messages for an agent.
     */
    getQueue(agentId: string): QueuedMessage[] {
        return this.queue.filter(m => m.agentId === agentId);
    }

    /**
     * Clear sent/failed messages for an agent.
     */
    clearCompleted(agentId: string): void {
        this.queue = this.queue.filter(m => m.agentId === agentId && (m.status === 'pending' || m.status === 'processing'));
    }

    /**
     * Cancel a pending message.
     */
    cancel(messageId: string): boolean {
        const msg = this.queue.find(m => m.id === messageId);
        if (!msg || msg.status !== 'pending') return false;
        msg.status = 'failed';
        return true;
    }
}
