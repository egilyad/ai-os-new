import { getTranslation } from '../../i18n/translations';
import type { Locale } from '../../i18n/translations';

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: Locale): Intl.NumberFormat {
    const key = locale === 'ru' ? 'ru-RU' : 'en-US';
    if (!formatters.has(key)) {
        formatters.set(
            key,
            new Intl.NumberFormat(key, {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
            }),
        );
    }
    return formatters.get(key)!;
}

export function formatCost(cost: number, locale: Locale = 'en'): string {
    if (cost < 0.001) {
        return getTranslation(locale, 'common.cost_negligible');
    }
    return getFormatter(locale).format(cost);
}

export function formatCostShort(cost: number, locale: Locale = 'en'): string {
    if (cost < 0.001) return getTranslation(locale, 'common.cost_negligible');
    if (cost >= 1) return getFormatter(locale).format(cost);
    if (cost >= 0.001) return getFormatter(locale).format(cost);
    return getFormatter(locale).format(cost);
}
