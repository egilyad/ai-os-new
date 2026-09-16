/**
 * CognitiveRepository — DAL wrapper for skills, connectors, and cognitive traces
 *
 * Provides typed access to cognitive/agent capabilities and traces.
 */

import type { DatabaseService } from '../services/database-service';
import type { CognitiveTrace, CognitiveSkill, Connector } from '../types/domain-types';

export class CognitiveRepository {
    private db: DatabaseService;

    constructor(db: DatabaseService) {
        this.db = db;
    }

    // Skills
    async getAllSkills(): Promise<CognitiveSkill[]> {
        return this.db.skills.limit(1000).toArray();
    }

    async getSkill(id: string): Promise<CognitiveSkill | undefined> {
        return this.db.skills.get(id);
    }

    async saveSkill(skill: CognitiveSkill): Promise<void> {
        await this.db.skills.put(skill);
    }

    async deleteSkill(id: string): Promise<void> {
        await this.db.skills.delete(id);
    }

    // Connectors
    async getAllConnectors(): Promise<Connector[]> {
        return this.db.connectors.limit(1000).toArray();
    }

    async getConnector(id: string): Promise<Connector | undefined> {
        return this.db.connectors.get(id);
    }

    async saveConnector(connector: Connector): Promise<void> {
        await this.db.connectors.put(connector);
    }

    async deleteConnector(id: string): Promise<void> {
        await this.db.connectors.delete(id);
    }

    // Cognitive Traces
    async getAllCognitiveTraces(limit = 500): Promise<CognitiveTrace[]> {
        return this.db.cognitiveTraces.limit(limit).toArray();
    }

    async getCognitiveTrace(id: string): Promise<CognitiveTrace | undefined> {
        return this.db.cognitiveTraces.get(id);
    }

    async saveCognitiveTrace(trace: CognitiveTrace): Promise<void> {
        await this.db.cognitiveTraces.put(trace);
    }

    async deleteCognitiveTrace(id: string): Promise<void> {
        await this.db.cognitiveTraces.delete(id);
    }
}
