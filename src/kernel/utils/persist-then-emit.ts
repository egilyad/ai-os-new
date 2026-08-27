export async function persistThenEmit<T>(persist: () => Promise<T>, emit: () => void): Promise<T> {
    const result = await persist();
    emit();
    return result;
}

export class Outbox {
    private persists: Array<() => Promise<void>> = [];
    private emits: Array<{ event: string; data?: unknown }> = [];

    deferPersist(fn: () => Promise<void>): void {
        this.persists.push(fn);
    }

    deferEmit(event: string, data?: unknown): void {
        this.emits.push({ event, data });
    }

    async commit(eventBus: { emit: (event: string, data?: unknown) => void }): Promise<void> {
        for (const p of this.persists) {
            await p();
        }
        for (const { event, data } of this.emits) {
            eventBus.emit(event, data);
        }
    }

    get hasPending(): boolean {
        return this.persists.length > 0 || this.emits.length > 0;
    }

    clear(): void {
        this.persists = [];
        this.emits = [];
    }
}
