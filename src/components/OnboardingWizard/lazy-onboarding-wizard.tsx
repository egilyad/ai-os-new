import { lazy } from 'react';

export const LazyOnboardingWizard = lazy(() =>
    import('./OnboardingWizard').then((m) => ({ default: m.OnboardingWizard })),
);
