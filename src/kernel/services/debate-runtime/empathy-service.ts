import type { IEmpathyService, EmpathyMirror } from '../../contracts/debate-empathy';
export class EmpathyService implements IEmpathyService {
    mirror(p: string): EmpathyMirror {
        if (!p || p.length<10) return { acknowledgement: '', hasEmpathy: false };
        return { acknowledgement: `I understand that ${p.slice(0,60)} matters because it reflects underlying values.`, hasEmpathy: true };
    }
    hasEmpathy(text: string): boolean {
        return /i understand|i see why|it makes sense that|i appreciate/i.test(text);
    }
}
