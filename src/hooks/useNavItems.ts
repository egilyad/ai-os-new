import { useMemo } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { NAV_SECTIONS } from '../route-registry';
import type { NavItemRef } from '../kernel/utils/cross-panel-links';

export function useNavItems(): NavItemRef[] {
    const { t } = useTranslation();
    return useMemo(
        () =>
            NAV_SECTIONS.flatMap((section) =>
                section.items.map((item) => ({
                    id: item.id,
                    label: t(item.labelKey),
                    sectionId: section.id,
                })),
            ),
        [t],
    );
}
