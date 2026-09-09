import type { TimelineEntry } from '../kernel/contracts/debate-runtime';

export type PlayerStatus = 'idle' | 'playing' | 'paused' | 'completed';

export interface TimelineEvent {
    sequence: number;
    event: string;
    data: unknown;
    timestamp: number;
    checksum: string;
}

export function toTimelineEvent(entry: TimelineEntry, index: number): TimelineEvent {
    return {
        sequence: index,
        event: entry.type,
        data: entry.payload,
        timestamp: entry.timestamp ?? Date.now(),
        checksum: `${entry.id}-${index}`,
    };
}

export const statusColor: Record<string, string> = {
    completed: '#22c55e',
    failed: '#ef4444',
    cancelled: '#f59e0b',
    active: '#3b82f6',
    deliberating: '#8b5cf6',
    paused: '#a855f7',
};

export const replayStatusLabel: Record<string, string> = {
    idle: 'Idle',
    playing: 'Playing',
    paused: 'Paused',
    completed: 'Done',
};

export const replayStatusColor: Record<string, string> = {
    idle: '#6b7280',
    playing: '#22c55e',
    paused: '#a855f7',
    completed: '#3b82f6',
};

export const btn = (bg: string, color: string, disabled = false): React.CSSProperties => ({
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: disabled ? 'rgba(255,255,255,0.03)' : bg,
    color: disabled ? '#555' : color,
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.7rem',
    fontWeight: 600,
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.15s',
});

export class TimelinePlayer {
    private events: TimelineEvent[] = [];
    private currentIndex = -1;
    private status: PlayerStatus = 'idle';
    private timer: ReturnType<typeof setTimeout> | null = null;
    private speed = 1;
    private stepMode: 'auto' | 'manual' = 'manual';
    private _onEvent: ((event: TimelineEvent, index: number) => void) | null = null;
    private _onRewind: ((oldIndex: number, newIndex: number) => void) | null = null;
    private _onStatusChange: ((status: PlayerStatus) => void) | null = null;

    load(events: TimelineEvent[]): void {
        this.events = [...events].sort((a, b) => a.sequence - b.sequence);
        this.currentIndex = -1;
        this.status = 'idle';
        this.clearTimer();
        this._onStatusChange?.(this.status);
    }

    play(): boolean {
        if (this.events.length === 0) return false;
        if (this.status === 'completed') this.currentIndex = -1;
        this.status = 'playing';
        this._onStatusChange?.(this.status);
        this.processNext();
        return true;
    }

    pause(): void {
        if (this.status !== 'playing') return;
        this.status = 'paused';
        this.clearTimer();
        this._onStatusChange?.(this.status);
    }

    stop(): void {
        this.clearTimer();
        this.status = 'idle';
        this.currentIndex = -1;
        this._onStatusChange?.(this.status);
    }

    stepForward(): TimelineEvent | null {
        if (this.currentIndex >= this.events.length - 1) return null;
        this.currentIndex++;
        const event = this.events[this.currentIndex]!;
        this._onEvent?.(event, this.currentIndex);
        if (this.currentIndex >= this.events.length - 1) {
            this.status = 'completed';
            this._onStatusChange?.(this.status);
        }
        return event;
    }

    stepBackward(): TimelineEvent | null {
        if (this.currentIndex <= 0) return null;
        const oldIndex = this.currentIndex;
        this.currentIndex--;
        const event = this.events[this.currentIndex]!;
        if (this.status === 'completed') {
            this.status = 'playing';
            this._onStatusChange?.(this.status);
        }
        this.processNext();
        this._onRewind?.(oldIndex, this.currentIndex);
        this._onEvent?.(event, this.currentIndex);
        return event;
    }

    jumpTo(index: number): TimelineEvent | null {
        if (index < 0 || index >= this.events.length) return null;
        const oldIndex = this.currentIndex;
        this.currentIndex = index;
        if (this.currentIndex < oldIndex) this._onRewind?.(oldIndex, this.currentIndex);
        const event = this.events[this.currentIndex]!;
        this._onEvent?.(event, this.currentIndex);
        return event;
    }

    setSpeed(speed: number): void {
        this.speed = Math.max(0.1, speed);
    }

    setStepMode(mode: 'auto' | 'manual'): void {
        this.stepMode = mode;
        if (mode === 'auto' && this.status === 'playing') {
            this.clearTimer();
            this.processNext();
        }
    }

    onEvent(cb: (event: TimelineEvent, index: number) => void): void {
        this._onEvent = cb;
    }
    onRewind(cb: (oldIndex: number, newIndex: number) => void): void {
        this._onRewind = cb;
    }
    onStatusChange(cb: (status: PlayerStatus) => void): void {
        this._onStatusChange = cb;
    }

    destroy(): void {
        this.clearTimer();
        this._onEvent = null;
        this.events = [];
    }

    private processNext(): void {
        if (this.status !== 'playing') return;
        if (this.currentIndex >= this.events.length - 1) {
            this.status = 'completed';
            this._onStatusChange?.(this.status);
            return;
        }
        if (this.stepMode === 'manual') return;
        const event = this.stepForward();
        if (!event) {
            this.status = 'completed';
            this._onStatusChange?.(this.status);
            return;
        }
        const delay = this.speed > 0 ? Math.max(1, 1000 / this.speed) : 0;
        this.timer = setTimeout(() => this.processNext(), delay);
    }

    private clearTimer(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}
