// ── On-Demand Expert Witness Summoner (P1.14) ─────────────────────────
// Maintains a library of domain experts. When an agent's argument
// signals a need for specialized knowledge, the best-matching expert's
// testimony is injected into the prompt. No actual agent spawning.

import type { IExpertWitnessService, ExpertWitness } from '../../contracts/debate-expert-witness';

const EXPERTS: ExpertWitness[] = [
    {
        id: 'expert-econ',
        domain: 'economics',
        title: 'Dr. Amartya Sen, Economist',
        credential: 'Nobel laureate in economics, specialist in welfare economics and development.',
        perspective:
            'Markets alone do not guarantee fair outcomes — institutional design and capability-based approaches are essential.',
    },
    {
        id: 'expert-climate',
        domain: 'climate',
        title: 'Dr. Katharine Hayhoe, Climate Scientist',
        credential:
            'Leading climate scientist and science communicator, distinguished professor at Texas Tech.',
        perspective:
            'Climate change is not just an environmental issue — it intersects with every dimension of human well-being.',
    },
    {
        id: 'expert-ai',
        domain: 'artificial intelligence',
        title: 'Dr. Yoshua Bengio, AI Researcher',
        credential: 'Turing Award winner, pioneer of deep learning, director of Mila AI Institute.',
        perspective:
            'AI safety and alignment are not solvable by technical means alone — governance frameworks must evolve alongside capabilities.',
    },
    {
        id: 'expert-ethics',
        domain: 'ethics',
        title: 'Dr. Martha Nussbaum, Philosopher',
        credential:
            'Leading moral philosopher, Capabilities Approach framework, professor at University of Chicago.',
        perspective:
            'Ethical frameworks must account for human dignity and pluralistic values — utilitarian calculus alone is insufficient.',
    },
    {
        id: 'expert-public-health',
        domain: 'public health',
        title: 'Dr. Anthony Fauci, Immunologist',
        credential:
            'Leading infectious disease expert, former director of NIAID, key figure in global pandemic response.',
        perspective:
            'Public health policy must balance individual liberty with collective well-being through evidence-based interventions.',
    },
    {
        id: 'expert-tech-policy',
        domain: 'technology policy',
        title: 'Dr. Lawrence Lessig, Legal Scholar',
        credential:
            'Leading internet law scholar, founder of Creative Commons, professor at Harvard Law.',
        perspective:
            'Code is law — the architecture of digital systems shapes rights and freedoms more than legislation does.',
    },
    {
        id: 'expert-security',
        domain: 'security',
        title: 'Dr. Bruce Schneier, Security Technologist',
        credential:
            'World-renowned security expert, author of Applied Cryptography, fellow at Harvard Berkman Center.',
        perspective:
            'Security is not a product — it is a process of risk management that must account for human factors.',
    },
    {
        id: 'expert-sociology',
        domain: 'sociology',
        title: 'Dr. Zygmunt Bauman, Sociologist',
        credential:
            'Influential social theorist, known for concept of "liquid modernity," professor emeritus at Leeds.',
        perspective:
            'Social structures are increasingly fluid — policy responses must adapt to the erosion of traditional institutions.',
    },
    {
        id: 'expert-law',
        domain: 'law',
        title: 'Dr. Cass Sunstein, Legal Scholar',
        credential:
            'Leading constitutional law scholar, co-author of Nudge theory, former administrator of OIRA.',
        perspective:
            'Regulatory systems should be designed for choice architecture that preserves freedom while steering toward beneficial outcomes.',
    },
    {
        id: 'expert-ecology',
        domain: 'ecology',
        title: 'Dr. Jane Goodall, Primatologist',
        credential:
            'World-renowned conservationist, UN Messenger of Peace, founder of the Jane Goodall Institute.',
        perspective:
            'The fate of humanity and nature are intertwined — ecological preservation is not a luxury but a necessity.',
    },
];

const EXPERT_KEYWORDS: Array<{ keywords: string[]; expertId: string }> = [
    {
        keywords: ['economic', 'gdp', 'market', 'inflation', 'inequality', 'poverty'],
        expertId: 'expert-econ',
    },
    {
        keywords: ['climate', 'global warming', 'carbon', 'emissions', 'renewable', 'environment'],
        expertId: 'expert-climate',
    },
    {
        keywords: ['ai', 'artificial intelligence', 'machine learning', 'neural', 'automation'],
        expertId: 'expert-ai',
    },
    {
        keywords: ['ethical', 'moral', 'rights', 'justice', 'fairness', 'dignity'],
        expertId: 'expert-ethics',
    },
    {
        keywords: ['health', 'disease', 'pandemic', 'vaccine', 'medical', 'public health'],
        expertId: 'expert-public-health',
    },
    {
        keywords: ['regulation', 'internet', 'privacy', 'copyright', 'platform', 'digital'],
        expertId: 'expert-tech-policy',
    },
    {
        keywords: ['security', 'cyber', 'defense', 'threat', 'risk', 'vulnerability'],
        expertId: 'expert-security',
    },
    {
        keywords: ['society', 'community', 'social', 'inequality', 'demographic', 'culture'],
        expertId: 'expert-sociology',
    },
    {
        keywords: ['legal', 'law', 'constitutional', 'regulatory', 'jurisdiction', 'policy'],
        expertId: 'expert-law',
    },
    {
        keywords: ['ecology', 'biodiversity', 'conservation', 'species', 'wildlife', 'sustainable'],
        expertId: 'expert-ecology',
    },
];

export class ExpertWitnessService implements IExpertWitnessService {
    private summoned = new Set<string>();
    private experts: ExpertWitness[];

    constructor(experts: ExpertWitness[] = EXPERTS) {
        this.experts = experts;
    }

    findExpert(topic: string, query?: string): ExpertWitness | undefined {
        const text = (query || topic).toLowerCase();
        // Score each expert by keyword match count
        let bestScore = 0;
        let bestId: string | undefined;

        for (const mapping of EXPERT_KEYWORDS) {
            let score = 0;
            for (const kw of mapping.keywords) {
                if (text.includes(kw)) score++;
            }
            if (score > bestScore) {
                bestScore = score;
                bestId = mapping.expertId;
            }
        }

        if (bestId) {
            const found = this.experts.find((e) => e.id === bestId);
            if (found) return found;
        }

        // Fallback: check the topic directly against expert domains
        let bestExpert: ExpertWitness | undefined;
        let bestExpertScore = 0;
        for (const expert of this.experts) {
            const domainWords = expert.domain.toLowerCase().split(/\s+/);
            let score = 0;
            for (const w of domainWords) {
                if (text.includes(w)) score++;
            }
            if (score > bestExpertScore) {
                bestExpertScore = score;
                bestExpert = expert;
            }
        }

        return bestExpertScore > 0 ? bestExpert : undefined;
    }

    generateTestimony(expert: ExpertWitness, topic: string, language = 'English'): string {
        if (language === 'Russian') {
            return `### Экспертное мнение\n${expert.title} (${expert.credential})\nПерспектива: ${expert.perspective}\n\nРассмотрите эту экспертизу при построении своего аргумента по теме «${topic}».`;
        }
        return `### Expert Witness Testimony\n${expert.title} (${expert.credential})\nPerspective: ${expert.perspective}\n\nConsider this expert testimony when forming your argument on "${topic}".`;
    }

    markSummoned(expertId: string): void {
        this.summoned.add(expertId);
    }

    wasSummoned(expertId: string): boolean {
        return this.summoned.has(expertId);
    }

    clearSession(): void {
        this.summoned.clear();
    }
}
