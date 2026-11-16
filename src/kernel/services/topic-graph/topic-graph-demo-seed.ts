import deepseekDoc from './demo/deepseek.md?raw';
import perplexityDoc from './demo/perplexity.md?raw';
import qwenDoc from './demo/qwen.md?raw';
import zaiDoc from './demo/zai.md?raw';
import { getContainer } from '../../service-helper';
import type { Topic, TopicGraphService } from '../../contracts/topic-graph';

export const TOPIC_GRAPH_DEMO_TITLE = 'OpenCode Desktop 1.19.4 (4 модели)';

const DEMO_DOCS: Array<{ ref: string; title: string; content: string }> = [
    { ref: 'deepseek', title: 'DeepSeek answer', content: deepseekDoc },
    { ref: 'perplexity', title: 'Perplexity answer', content: perplexityDoc },
    { ref: 'qwen', title: 'Qwen answer', content: qwenDoc },
    { ref: 'zai', title: 'Z.ai answer', content: zaiDoc },
];

/**
 * Идемпотентный сид: создаёт демо-тему из 4 документов (ответы моделей)
 * и ингестит их. Повторный вызов ничего не дублирует.
 */
export async function ensureTopicGraphDemo(): Promise<Topic> {
    const svc = getContainer().get<TopicGraphService>('topicGraphService');
    const existing = await svc.listTopics();
    const found = existing.find((t) => t.title === TOPIC_GRAPH_DEMO_TITLE);
    if (found) return found;
    const topic = await svc.createTopic(
        TOPIC_GRAPH_DEMO_TITLE,
        'Демо: ответы 4 моделей про OpenCode Desktop 1.19.4',
    );
    for (const doc of DEMO_DOCS) {
        await svc.ingest(topic.id, {
            kind: 'document',
            ref: doc.ref,
            title: doc.title,
            content: doc.content,
        });
    }
    return topic;
}
