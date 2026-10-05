import type { ICouncilService } from '../../contracts/council';
import type { CouncilSession } from '../../types/council-types';

/**
 * Demo seed for the Council: one session on notification quiet hours with
 * three participants and one forum message each (plus a researcher fact).
 * Fully static — no LLM needed.
 *
 * Idempotent: sessions with DEMO_COUNCIL_TOPIC are reused.
 */
export const DEMO_COUNCIL_TOPIC = 'Демо: вводить ли тихие часы для уведомлений?';

export async function seedCouncilDemo(service: ICouncilService): Promise<CouncilSession> {
    const existing = (await service.listSessions()).find((s) => s.topic === DEMO_COUNCIL_TOPIC);
    if (existing) {
        const full = await service.getSession(existing.id);
        if (full) return full;
    }

    const session = await service.createSession({
        topic: DEMO_COUNCIL_TOPIC,
        config: { topic: DEMO_COUNCIL_TOPIC, doubleBlind: false, factGathering: true },
        participants: [
            { name: 'Marcus Hale', kind: 'proponent' },
            { name: 'Rafael Stone', kind: 'opponent' },
            { name: 'Elena Marchetti', kind: 'researcher' },
        ],
    });
    const byName = new Map(session.participants.map((p) => [p.name, p.id]));
    const marcus = byName.get('Marcus Hale')!;
    const rafael = byName.get('Rafael Stone')!;
    const elena = byName.get('Elena Marchetti')!;

    // Fact first: facts are only accepted in proposal/fact_gathering phases,
    // while the first forum message advances the session into debate.
    await service.submitFact(session.id, elena, 'Ночной спам — причина №1 отключения уведомлений (опрос команды).');
    await service.postMessage(
        session.id,
        marcus,
        'Предлагаю: с 23:00 до 7:00 бот молчит, всё срочное копит к утру. Простое правило, легко объяснить.',
    );
    await service.postMessage(
        session.id,
        rafael,
        'Возражение: «срочное» у всех разное. Нужен список прорывных событий, иначе тихие часы превратятся в чёрную дыру.',
    );
    await service.postMessage(
        session.id,
        elena,
        'Исследование: 8 из 10 опрошенных отключают уведомления именно из-за ночного спама. Прорыв — только звонок человека, не бота.',
    );

    return (await service.getSession(session.id)) ?? session;
}
