const memory = new Map<string, string>();

function hasLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
}

export const ssrSafeStorage = {
    getItem(key: string): string | null {
        try {
            return hasLocalStorage() ? localStorage.getItem(key) : (memory.get(key) ?? null);
        } catch {
            return null;
        }
    },

    setItem(key: string, value: string): void {
        try {
            if (hasLocalStorage()) {
                localStorage.setItem(key, value);
            } else {
                memory.set(key, value);
            }
        } catch {
            /* silent */
        }
    },

    removeItem(key: string): void {
        try {
            if (hasLocalStorage()) {
                localStorage.removeItem(key);
            } else {
                memory.delete(key);
            }
        } catch {
            /* silent */
        }
    },

    clear(): void {
        try {
            if (hasLocalStorage()) {
                localStorage.clear();
            } else {
                memory.clear();
            }
        } catch {
            /* silent */
        }
    },

    get length(): number {
        try {
            return hasLocalStorage() ? localStorage.length : memory.size;
        } catch {
            return 0;
        }
    },

    key(index: number): string | null {
        try {
            if (hasLocalStorage()) {
                return localStorage.key(index);
            }
            const keys = [...memory.keys()];
            return keys[index] ?? null;
        } catch {
            return null;
        }
    },
};
