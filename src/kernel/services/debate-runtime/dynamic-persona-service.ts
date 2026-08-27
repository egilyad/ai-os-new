import type { IDynamicPersonaService, PersonaVariant } from '../../contracts/debate-dynamic-persona';
export class DynamicPersonaService implements IDynamicPersonaService {
    select(topic: string): PersonaVariant {
        if (/climate|energy|environment/i.test(topic)) return { variant: 'scientist', reason: 'topic matched science' };
        if (/economy|market|policy/i.test(topic)) return { variant: 'economist', reason: 'topic matched economy' };
        return { variant: 'generalist', reason: 'default' };
    }
}
