import { MessageSquare, Users, Target } from 'lucide-react';

export const STEPS = [
    { key: 'topic', icon: MessageSquare, labelKey: 'debate.wizard_step1' },
    { key: 'agents', icon: Users, labelKey: 'debate.wizard_step2' },
    { key: 'review', icon: Target, labelKey: 'debate.wizard_step3' },
];

export const TEMP_LABELS = [
    'Pure Logic',
    'Mostly Logic',
    'Slightly Logical',
    'Analytical',
    'Leaning Logic',
    'Balanced',
    'Leaning Emotion',
    'Passionate',
    'Very Emotional',
    'Intense',
    'Pure Emotion',
];

export function strategyName(s: string): string {
    const names: Record<string, string> = {
        round_robin: 'Round Robin',
        moderated: 'Moderated',
        free_for_all: 'Free-for-all',
        socratic: 'Socratic',
        argument_tree: 'Argument Tree',
        constrained: 'Constrained',
    };
    return names[s] || s;
}
