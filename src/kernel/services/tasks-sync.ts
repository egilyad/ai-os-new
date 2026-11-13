import { agemsTaskService } from './agems-task-service';

export interface TasksSyncDeps {
    baseUrl?: string;
    token?: string;
}

/**
 * TasksSync — pushes a full AGEMS snapshot to the sync-server mirror
 * (`PUT /api/tasks/sync`). Source of truth stays in Dexie; the server
 * copy is what external agents (OpenCode CLI) consume via REST.
 */
export async function syncTasksToServer(
    deps?: TasksSyncDeps,
): Promise<{ ok: boolean; count: number; error?: string }> {
    const baseUrl = deps?.baseUrl ?? 'http://localhost:3001';
    const token = deps?.token ?? '';
    try {
        const tasks = await agemsTaskService.list();
        const res = await fetch(`${baseUrl}/api/tasks/sync`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ tasks }),
        });
        if (!res.ok) {
            return { ok: false, count: 0, error: `sync failed: ${res.status}` };
        }
        return { ok: true, count: tasks.length };
    } catch (e) {
        return { ok: false, count: 0, error: e instanceof Error ? e.message : String(e) };
    }
}
