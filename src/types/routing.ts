import type React from 'react';
import type { TranslationKey } from '../i18n/translations';
import type { FeatureFlag } from '../kernel/contracts/feature-flags';

export interface RouteMeta {
    id: string;
    path?: string;
    labelKey: TranslationKey;
    icon: React.ReactNode;
    color: string;
    lazy?: boolean;
    featureFlag?: FeatureFlag;
    /** Marks a cognitive-aux / research panel — shows an "Experimental" badge in the UI (P1.21). */
    experimental?: boolean;
    /** Lifecycle status for nav visibility (UX-001): live = real, planned = ComingSoon stub */
    status?: 'live' | 'beta' | 'planned';
}

export interface NavSection {
    id: string;
    labelKey: TranslationKey;
    items: RouteMeta[];
}

export type {
    StrategyWeightConfig,
    AutoDynamicAdjustment,
    LatencyVarianceBand,
    ScoringConfig,
    ClassificationConfig,
    AffinityConfig,
    PriorityBonuses,
    ProviderComplexityMapping,
    RouterConfig,
} from '../kernel/types/routing-types';
