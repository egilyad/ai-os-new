/**
 * CharacterService — G.3 (Eliza-style characters + clients, additive).
 *
 * Imports character.json docs into the real persona stack (PersonProfile +
 * Voice + PersonaDepth) and keeps a client-adapter registry (discord /
 * telegram / web / custom) in DAL kv; `routeFromClient()` funnels inbound
 * client text through the gateway so clients behave like any other protocol.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IPersonaService } from '../../contracts/persona';
import type { IGatewayService } from '../../contracts/interop';
import type { ICharacterService } from '../../contracts/rivals2';
import type { CharacterDoc } from '../../types/rival2-types';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Character');

export class CharacterService implements ICharacterService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private personas: IPersonaService,
        private gateway?: IGatewayService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Character', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async importCharacter(doc: CharacterDoc): Promise<string> {
        if (!doc.name) throw new Error('Character needs a name');
        const samples = [
            ...(doc.bio ?? []),
            ...(doc.lore ?? []),
            ...(doc.style?.chat ?? []),
            ...(doc.style?.post ?? []),
        ].slice(0, 30);
        const ownerId = `character:${doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const person = await this.personas.distillPerson({
            ownerId,
            displayName: doc.name,
            samples: samples.length > 0 ? samples : [doc.name],
        });
        await this.personas.distillVoice(person.id, samples, 'character');
        await this.personas.setDepth({
            ownerId,
            beliefs: [...(doc.topics ?? []), ...(doc.lore ?? []).slice(0, 10)],
            commStyle: doc.style?.chat?.[0]?.slice(0, 300),
            quirks: (doc.adjectives ?? []).slice(0, 12),
        });
        this.events.emit(EVENTS.CHARACTER_IMPORTED, { personId: person.id, name: doc.name });
        return person.id;
    }

    async registerClient(name: string, kind: string): Promise<string> {
        const id = `client:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        await this.dal.kv.set(`clients/${id}`, { name, kind, at: Date.now() });
        return id;
    }

    async listClients(): Promise<Array<{ name: string; kind: string }>> {
        const rows = await this.dal.kv.list('clients/');
        return rows.map((r) => r.value as { name: string; kind: string });
    }

    async routeFromClient(client: string, text: string): Promise<string> {
        if (this.gateway) {
            const envelope = await this.gateway.ingress({
                from: `client:${client}`,
                to: 'local-os',
                protocol: 'websocket',
                kind: 'task',
                payload: { text: text.slice(0, 4000) },
            });
            return envelope.id;
        }
        return `client:${client} (no gateway): ${text.slice(0, 200)}`;
    }
}
