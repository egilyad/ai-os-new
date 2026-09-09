/**
 * EntityService — I.2 (Kore.ai-style extractors, stateless).
 *
 * list (closed vocabulary), pattern (validated regex), datetime (relative +
 * absolute expressions in EN/RU). Used by DialogueService slots and the Kore
 * dialog runner.
 */
import type { IEntityService } from '../../contracts/rivals4';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Entity');

const RU_MONTHS: Record<string, number> = {
    'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
    'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11,
};

const EN_MONTHS: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

export class EntityService implements IEntityService {
    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async extractList(text: string, values: string[]): Promise<string[]> {
        const lower = text.toLowerCase();
        return values.filter((v) => v && lower.includes(v.toLowerCase()));
    }

    async extractPattern(text: string, pattern: string): Promise<string[]> {
        let re: RegExp;
        try {
            re = new RegExp(pattern, 'gi');
        } catch {
            throw new Error(`Invalid entity pattern: ${pattern}`);
        }
        const out: string[] = [];
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null && out.length < 20) {
            out.push(m[0]);
            if (m[0].length === 0) re.lastIndex += 1;
        }
        return out;
    }

    async extractDatetime(text: string): Promise<string[]> {
        const out: string[] = [];
        const lower = text.toLowerCase();
        const today = new Date();
        const fmt = (d: Date): string => d.toISOString().slice(0, 10);

        if (/сегодня|today/.test(lower)) out.push(fmt(today));
        if (/завтра|tomorrow/.test(lower)) {
            out.push(fmt(new Date(today.getTime() + 86400000)));
        }
        if (/вчера|yesterday/.test(lower)) {
            out.push(fmt(new Date(today.getTime() - 86400000)));
        }
        const iso = lower.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
        if (iso) out.push(`${iso[1]}-${iso[2]}-${iso[3]}`);
        const eu = lower.match(/\b(\d{1,2})[./](\d{1,2})[./](20\d{2})\b/);
        if (eu) out.push(`${eu[3]}-${eu[2]!.padStart(2, '0')}-${eu[1]!.padStart(2, '0')}`);
        const ru = lower.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(20\d{2}))?/);
        if (ru) {
            const year = ru[3] ? Number(ru[3]) : today.getFullYear();
            out.push(`${year}-${String((RU_MONTHS[ru[2] as string] ?? 0) + 1).padStart(2, '0')}-${ru[1]!.padStart(2, '0')}`);
        }
        const en = lower.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,\s*(20\d{2}))?/);
        if (en) {
            const year = en[3] ? Number(en[3]) : today.getFullYear();
            out.push(`${year}-${String((EN_MONTHS[en[1] as string] ?? 0) + 1).padStart(2, '0')}-${en[2]!.padStart(2, '0')}`);
        }
        const time = lower.match(/\b(\d{1,2}):(\d{2})\b/);
        if (time) out.push(`${time[1]!.padStart(2, '0')}:${time[2]}`);
        return [...new Set(out)];
    }
}
