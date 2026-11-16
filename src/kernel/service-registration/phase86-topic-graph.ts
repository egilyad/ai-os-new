/**
 * Phase 86 — Topic Graph (самостоятельный домен знаний).
 *
 *  - topicGraphService: накопление/структурирование знаний по темам:
 *    ingest → нормализация → дедупликация → противоречия → связи → полнота.
 */
import type { Phase } from './helpers';
import { TopicGraphServiceImpl } from '../services/topic-graph/topic-graph-service';
import { createTopicGraphDB } from '../services/topic-graph/topic-graph-dexie';

export const registerPhase86: Phase = ({ register }) => {
    register('topicGraphService', () => {
        createTopicGraphDB();
        return new TopicGraphServiceImpl();
    });
};
