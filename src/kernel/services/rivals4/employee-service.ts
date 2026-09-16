/**
 * EmployeeService — I.2 (Lindy-style AI employees, additive).
 *
 * An employee binds persona + toolkit + trigger phrases (kv). `runOnTrigger`
 * matches triggers and runs each matched employee through the Planner;
 * the inbox reuses mobile notifications (no second inbox system).
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IPlannerService } from '../../contracts/rivals';
import type { IMobileAccessService } from '../../contracts/ops';
import type { IEmployeeService } from '../../contracts/rivals4';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Employee');

interface EmployeeDoc {
    id: string;
    name: string;
    personaId?: string;
    toolkitId?: string;
    triggers: string[];
    createdAt: number;
}

export class EmployeeService implements IEmployeeService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private planner?: IPlannerService,
        private inbox?: IMobileAccessService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async hire(input: {
        name: string;
        personaId?: string;
        toolkitId?: string;
        triggers?: string[];
    }): Promise<string> {
        const doc: EmployeeDoc = {
            id: genId('empl'),
            name: input.name.slice(0, 120),
            personaId: input.personaId,
            toolkitId: input.toolkitId,
            triggers: (input.triggers ?? []).map((t) => t.toLowerCase()).slice(0, 20),
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`employees/${doc.id}`, doc);
        this.events.emit(EVENTS.LINDY_HIRED, { employeeId: doc.id });
        return doc.id;
    }

    async fire(employeeId: string): Promise<void> {
        await this.dal.kv.delete(`employees/${employeeId}`);
    }

    async listEmployees(): Promise<Array<{ id: string; name: string; triggers: string[] }>> {
        const rows = await this.dal.kv.list('employees/');
        return rows.map((r) => {
            const d = r.value as EmployeeDoc;
            return { id: d.id, name: d.name, triggers: d.triggers };
        });
    }

    async runOnTrigger(trigger: string, payload = ''): Promise<string[]> {
        const employees = await this.listEmployees();
        const lower = trigger.toLowerCase();
        const matched = employees.filter((e) => e.triggers.some((t) => lower.includes(t)));
        const out: string[] = [];
        for (const emp of matched) {
            const full = await this.dal.kv.get<EmployeeDoc>(`employees/${emp.id}`);
            const task = `[${emp.name}] trigger "${trigger}": ${payload.slice(0, 500)}${full?.personaId ? ` (persona ${full.personaId})` : ''}`;
            let result = '(no planner)';
            if (this.planner) {
                try {
                    result = await this.planner.plan(task, 'function_calling');
                } catch (e) {
                    result = `(failed: ${e instanceof Error ? e.message : String(e)})`;
                }
            }
            out.push(`${emp.name}: ${result.slice(0, 500)}`);
            if (this.inbox) {
                try {
                    await this.inbox.notify({
                        title: `Employee ${emp.name} ran`,
                        body: result.slice(0, 300),
                        actionRef: `employee:${emp.id}`,
                    });
                } catch {
                    // inbox is best-effort
                }
            }
        }
        return out;
    }
}
