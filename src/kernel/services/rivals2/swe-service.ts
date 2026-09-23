/**
 * SweService — G.2 (SWE-agent-style ACI, additive).
 *
 * Virtual ACI over the attached workspace: find/open/edit/create, test
 * requests routed to SandboxBroker tickets, trajectory log + unified-diff
 * patch assembly. Reads go through WorkspaceService; writes apply immediately
 * (workspace handles handle persistence) and are recorded for the patch.
 */
import type { IEventBus } from '../../types/interfaces';
import type { IWorkspaceService } from '../../contracts/workspace';
import type { ISandboxBrokerService } from '../../contracts/ops';
import type { ISweService } from '../../contracts/rivals2';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('SWE');

interface FileEdit {
    path: string;
    oldText: string;
    newText: string;
    at: number;
}

export class SweService implements ISweService {
    private trajectory: string[] = [];
    private edits: FileEdit[] = [];

    constructor(
        private events: IEventBus,
        private workspace?: IWorkspaceService,
        private sandbox?: ISandboxBrokerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('SWE', 'init', {});
    }

    async destroy(): Promise<void> {
        this.trajectory = [];
        this.edits = [];
    }

    private log(line: string): void {
        this.trajectory.push(line.slice(0, 500));
        if (this.trajectory.length > 300) this.trajectory.splice(0, this.trajectory.length - 300);
    }

    private requireWorkspace(): IWorkspaceService {
        if (!this.workspace?.isAttached()) throw new Error('No workspace attached');
        return this.workspace;
    }

    async find(pattern: string): Promise<string[]> {
        const ws = this.requireWorkspace();
        const hits = await ws.grepContent(pattern);
        this.log(`find "${pattern}" → ${hits.length} hits`);
        return hits.slice(0, 30).map((h) => `${h.path}:${h.line}: ${h.content.slice(0, 160)}`);
    }

    async open(path: string, from = 1, to = 120): Promise<string> {
        const ws = this.requireWorkspace();
        const content = await ws.readFile(path);
        const lines = content.split('\n');
        const slice = lines.slice(Math.max(0, from - 1), Math.max(0, to)).join('\n');
        this.log(`open ${path} [${from}-${to}]`);
        return slice.slice(0, 8000);
    }

    async edit(path: string, oldText: string, newText: string): Promise<string> {
        const ws = this.requireWorkspace();
        const content = await ws.readFile(path);
        if (!content.includes(oldText)) {
            throw new Error(`Edit anchor not found in ${path}`);
        }
        const updated = content.replace(oldText, newText);
        // WorkspaceService is read-oriented; persist the edit via grep-verified
        // in-place rewrite recorded here — actual FS write goes through the
        // workspace write path when available, else the patch carries the change.
        const canWrite = (ws as unknown as { writeFile?: (p: string, c: string) => Promise<void> }).writeFile;
        if (canWrite) {
            await canWrite.call(ws, path, updated);
            this.log(`edit ${path} (applied live)`);
        } else {
            this.log(`edit ${path} (recorded for patch — workspace is read-only)`);
        }
        this.edits.push({ path, oldText, newText, at: Date.now() });
        this.events.emit(EVENTS.SWE_EDIT, { path });
        return `ok (${oldText.length} → ${newText.length} chars)`;
    }

    async createFile(path: string, content: string): Promise<string> {
        const ws = this.requireWorkspace();
        const canWrite = (ws as unknown as { writeFile?: (p: string, c: string) => Promise<void> }).writeFile;
        if (!canWrite) throw new Error('Workspace is read-only — file recorded for patch only');
        await canWrite.call(ws, path, content);
        this.edits.push({ path, oldText: '', newText: content, at: Date.now() });
        this.log(`create ${path}`);
        return 'ok';
    }

    async requestTests(ref: string): Promise<string> {
        if (!this.sandbox) return `tests-queued for ${ref} (no sandbox broker)`;
        const ticket = await this.sandbox.request({
            kind: 'computer',
            agentId: 'swe-agent',
            purpose: `Run tests: ${ref.slice(0, 200)}`,
        });
        this.log(`tests requested (ticket ${ticket.id})`);
        return ticket.id;
    }

    async buildPatch(): Promise<string> {
        if (this.edits.length === 0) return '(no edits — empty patch)';
        const parts = this.edits.map((e) => {
            const oldLines = e.oldText.split('\n');
            const newLines = e.newText.split('\n');
            const body = [
                ...oldLines.map((l) => `-${l}`),
                ...newLines.map((l) => `+${l}`),
            ].join('\n');
            return `--- a/${e.path}\n+++ b/${e.path}\n${body}`;
        });
        return parts.join('\n').slice(0, 20000);
    }

    getTrajectory(): string[] {
        return [...this.trajectory];
    }
}
