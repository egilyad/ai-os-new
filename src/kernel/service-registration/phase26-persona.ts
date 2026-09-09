/**
 * Phase 26 — Persona & Context (Roadmap Wave 4).
 *
 * Registers:
 *   - `personaRepository` (DAL over ltMemories + memoryLinks + personaProfiles
 *     + voices + personaDepths + sharedContexts + contextEntries + goals)
 *   - `ltMemoryService` (long-term API + core/recall/archival + graph links)
 *   - `personaService` (Person/Voice distillation + deep persona)
 *   - `sharedContextService` (team contexts + goals)
 *
 * Additive — Memory Mesh, roles and workspace are untouched.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DatabaseService } from '../services/database-service';
import { PersonaRepository } from '../dal/persona-repository';
import { LtMemoryService } from '../services/persona/lt-memory-service';
import { PersonaService } from '../services/persona/persona-service';
import { SharedContextService } from '../services/persona/shared-context-service';

export const registerPhase26: Phase = ({ register }) => {
    register('personaRepository', (c: IContainer) => {
        return new PersonaRepository(c.get<DatabaseService>('database'));
    });

    register('ltMemoryService', (c: IContainer) => {
        return new LtMemoryService(
            c.get<PersonaRepository>('personaRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('personaService', (c: IContainer) => {
        return new PersonaService(
            c.get<PersonaRepository>('personaRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });

    register('sharedContextService', (c: IContainer) => {
        return new SharedContextService(
            c.get<PersonaRepository>('personaRepository'),
            c.get<IEventBus>('eventBus'),
        );
    });
};
