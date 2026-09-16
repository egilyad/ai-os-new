// ── StakeholderMapper (P1.24) ─────────────────────────────────────────────
// Keyword-based stakeholder identification from debate topic.
// No ResearchEngine needed for MVP — uses topic keyword matching.

import type { IStakeholderMapper, Stakeholder } from '../../contracts/debate-stakeholder';

interface StakeholderTemplate {
    id: string;
    labelEn: string;
    labelRu: string;
    keywords: string[];
    concernEn: string;
    concernRu: string;
}

const STAKEHOLDER_TEMPLATES: StakeholderTemplate[] = [
    {
        id: 'patients',
        labelEn: 'Patients & Healthcare recipients',
        labelRu: 'Пациенты и получатели медпомощи',
        keywords: [
            'health',
            'medical',
            'hospital',
            'healthcare',
            'medicine',
            'patient',
            'vaccine',
            'drug',
            'treatment',
            'здоров',
            'медицин',
            'больниц',
            'пациент',
            'лечени',
        ],
        concernEn: 'How does this affect access to care, treatment quality, and health outcomes?',
        concernRu: 'Как это влияет на доступ к помощи, качество лечения и здоровье?',
    },
    {
        id: 'taxpayers',
        labelEn: 'Taxpayers & Citizens',
        labelRu: 'Налогоплательщики и граждане',
        keywords: [
            'tax',
            'budget',
            'public spending',
            'fiscal',
            'government',
            'funding',
            'налог',
            'бюджет',
            'госрасход',
            'фискальн',
            'финансирован',
        ],
        concernEn: 'What is the cost to taxpayers? Is this the best use of public funds?',
        concernRu: 'Каковы затраты налогоплательщиков? Это лучшее использование бюджета?',
    },
    {
        id: 'business',
        labelEn: 'Businesses & Industry',
        labelRu: 'Бизнес и промышленность',
        keywords: [
            'business',
            'industry',
            'market',
            'economy',
            'trade',
            'commerce',
            'corporate',
            'enterprise',
            'бизнес',
            'рынок',
            'экономик',
            'торговл',
            'корпоратив',
        ],
        concernEn: 'How does this affect competitiveness, regulation burden, and market dynamics?',
        concernRu: 'Как это влияет на конкурентоспособность, регуляторную нагрузку и рынок?',
    },
    {
        id: 'environment',
        labelEn: 'Environment & Future Generations',
        labelRu: 'Окружающая среда и будущие поколения',
        keywords: [
            'environment',
            'climate',
            'pollution',
            'nature',
            'ecosystem',
            'sustainability',
            'green',
            'emission',
            'экологи',
            'климат',
            'загрязнен',
            'природ',
            'устойчив',
        ],
        concernEn: 'What are the environmental externalities and long-term sustainability impacts?',
        concernRu: 'Каковы экологические последствия и влияние на устойчивость?',
    },
    {
        id: 'workers',
        labelEn: 'Workers & Labor Force',
        labelRu: 'Работники и трудовые ресурсы',
        keywords: [
            'worker',
            'employ',
            'job',
            'labor',
            'wage',
            'salary',
            'union',
            'workforce',
            'unemployment',
            'работник',
            'занятост',
            'рабоч',
            'труд',
            'зарплат',
            'безработ',
        ],
        concernEn: 'How does this affect employment, working conditions, and wages?',
        concernRu: 'Как это влияет на занятость, условия труда и зарплаты?',
    },
    {
        id: 'minorities',
        labelEn: 'Minorities & Vulnerable Groups',
        labelRu: 'Меньшинства и уязвимые группы',
        keywords: [
            'minority',
            'equality',
            'discrimination',
            'inequality',
            'marginalized',
            'vulnerable',
            'rights',
            'justice',
            'равенств',
            'дискриминац',
            'меньшинств',
            'уязвим',
            'права',
        ],
        concernEn: 'Does this reduce or increase inequality? How are the most vulnerable affected?',
        concernRu: 'Уменьшает или усиливает это неравенство? Как затрагиваются самые уязвимые?',
    },
    {
        id: 'education',
        labelEn: 'Students & Education System',
        labelRu: 'Студенты и система образования',
        keywords: [
            'education',
            'school',
            'student',
            'university',
            'learning',
            'curriculum',
            'academic',
            'training',
            'образован',
            'школ',
            'студент',
            'университет',
            'обучение',
        ],
        concernEn: 'How does this affect educational quality, access, and future opportunities?',
        concernRu: 'Как это влияет на качество образования, доступ и будущие возможности?',
    },
    {
        id: 'consumers',
        labelEn: 'Consumers & End Users',
        labelRu: 'Потребители и конечные пользователи',
        keywords: [
            'consumer',
            'customer',
            'price',
            'cost',
            'product',
            'service',
            'user',
            'affordability',
            'потребител',
            'цен',
            'стоимост',
            'продукт',
            'пользовател',
            'доступност',
        ],
        concernEn: 'How does this affect prices, product quality, and consumer choice?',
        concernRu: 'Как это влияет на цены, качество продуктов и выбор потребителей?',
    },
    {
        id: 'government',
        labelEn: 'Government & Public Sector',
        labelRu: 'Государство и госсектор',
        keywords: [
            'government',
            'regulation',
            'policy',
            'law',
            'compliance',
            'bureaucracy',
            'administration',
            'правительств',
            'регулирован',
            'политик',
            'закон',
            'бюрократи',
        ],
        concernEn:
            'What are the administrative costs, enforcement challenges, and policy implications?',
        concernRu:
            'Каковы административные издержки, сложности внедрения и политические последствия?',
    },
    {
        id: 'international',
        labelEn: 'International Community & Trade Partners',
        labelRu: 'Международное сообщество и торговые партнеры',
        keywords: [
            'international',
            'global',
            'foreign',
            'trade',
            'diplomacy',
            'treaty',
            'sanction',
            'alliance',
            'международ',
            'глобальн',
            'иностран',
            'дипломат',
            'союзник',
        ],
        concernEn: 'How does this affect international relations, trade, and global standing?',
        concernRu: 'Как это влияет на международные отношения, торговлю и глобальный статус?',
    },
];

export class StakeholderMapper implements IStakeholderMapper {
    analyzeTopic(topic: string): Stakeholder[] {
        const lower = topic.toLowerCase();
        const matched: Stakeholder[] = [];

        for (const tpl of STAKEHOLDER_TEMPLATES) {
            const matchedKeywords = tpl.keywords.filter((k) => lower.includes(k));
            if (matchedKeywords.length > 0) {
                const relevanceScore = Math.min(1, matchedKeywords.length / 4);
                matched.push({
                    id: tpl.id,
                    label:
                        lower.includes('рус') || lower.includes('росси')
                            ? tpl.labelRu
                            : tpl.labelEn,
                    relevanceScore,
                    keyConcern:
                        lower.includes('рус') || lower.includes('росси')
                            ? tpl.concernRu
                            : tpl.concernEn,
                });
            }
        }

        return matched.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    getFormattedStakeholders(stakeholders: Stakeholder[], language = 'Russian'): string {
        if (stakeholders.length === 0) return '';

        const top3 = stakeholders.slice(0, 3);

        const lines = top3.map(
            (s) =>
                `### ${s.label}\n${s.keyConcern}\n` +
                `After stating your position, explicitly address the strongest objection from this stakeholder's perspective.`,
        );

        if (language === 'Russian') {
            return (
                '\n\n### Stakeholder Impact Analysis Required\n' +
                'Your argument MUST address how your position affects key stakeholders. For each:\n\n' +
                lines.join('\n\n')
            );
        }

        return (
            '\n\n### Stakeholder Impact Analysis Required\n' +
            'Your argument MUST address how your position affects key stakeholders. For each:\n\n' +
            lines.join('\n\n')
        );
    }

    clearSession(): void {
        // No state to clear — stateless service
    }
}
