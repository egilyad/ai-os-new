import type { ICredibilityScorer, SourceCredibility } from '../../contracts/debate-credibility';

// Domain authority tiers: lower = more credible
const DOMAIN_TIERS: Array<{ pattern: RegExp; tier: number; label: string }> = [
    // Tier 1 — peer-reviewed journals, gov databases
    { pattern: /\.(edu|gov|int|nih|who|un|europa)\b/i, tier: 1, label: 'Academic/Gov' },
    {
        pattern: /\b(doi\.org|pubmed|arxiv|ieee|acm|springer|elsevier|nature|science)\b/i,
        tier: 1,
        label: 'Academic',
    },
    {
        pattern: /\b(sciencedirect|wiley|taylorfrancis|sagepub|oxford|cambridge|jstor)\b/i,
        tier: 1,
        label: 'Academic Publisher',
    },

    // Tier 2 — established news, research orgs
    {
        pattern:
            /\b(reuters|apnews|bbc|npr|pbs|nytimes|wsj|washingtonpost|economist|bloomberg|ft\.com)\b/i,
        tier: 2,
        label: 'Major News',
    },
    {
        pattern: /\b(brookings|rand|pewresearch|nber|worldbank|imf|oecd|ipsos|gallup)\b/i,
        tier: 2,
        label: 'Research Org',
    },
    { pattern: /\b(statista|ourworldindata|census|data\.gov)\b/i, tier: 2, label: 'Data Source' },

    // Tier 3 — reputable industry, less-established news
    {
        pattern: /\b(forbes|hbr|technologyreview|wired|theguardian|politico|thehill|usatoday)\b/i,
        tier: 3,
        label: 'Major Media',
    },
    {
        pattern: /\b(gartner|idc|forrester|mckinsey|deloitte|pwc)\b/i,
        tier: 3,
        label: 'Industry Analysis',
    },
    { pattern: /\b(github|gitlab|npm|pypi|dockerhub)\b/i, tier: 3, label: 'Developer Platform' },

    // Tier 4 — quality blogs, smaller outlets
    {
        pattern: /\b(medium|substack|dev\.to|hackernoon|towardsdatascience)\b/i,
        tier: 4,
        label: 'Blog Platform',
    },
    {
        pattern: /\b(arstechnica|theverge|techcrunch|zdnet|infoworld|theregister)\b/i,
        tier: 4,
        label: 'Tech News',
    },

    // Tier 5 — forums, social, user-generated
    {
        pattern: /\b(reddit|quora|stackexchange|stackoverflow|twitter|x\.com|facebook|linkedin)\b/i,
        tier: 5,
        label: 'Social/Forum',
    },
    { pattern: /\b(wikipedia|fandom|wikihow)\b/i, tier: 5, label: 'Wiki' },
];

// Year detection to adjust score based on recency
const YEAR_PATTERN = /\b(19\d{2}|20[012]\d|202[0-6])\b/;

const TIER_BASE_SCORES: Record<number, number> = {
    1: 0.9,
    2: 0.75,
    3: 0.6,
    4: 0.4,
    5: 0.2,
};

export class CredibilityScorer implements ICredibilityScorer {
    scoreSource(source: string): SourceCredibility {
        const sourceLower = source.slice(0, 200).toLowerCase();

        // Find matching domain tier
        let domainTier = 5;
        let domainLabel = 'Unknown/Unverified';

        for (const entry of DOMAIN_TIERS) {
            if (entry.pattern.test(sourceLower)) {
                domainTier = entry.tier;
                domainLabel = entry.label;
                break;
            }
        }

        // Start with base tier score
        let score = TIER_BASE_SCORES[domainTier] ?? 0.2;

        // Recency bonus: if source mentions a year
        const yearMatch = source.match(YEAR_PATTERN);
        if (yearMatch) {
            const year = parseInt(yearMatch[1]!, 10);
            const currentYear = 2026;
            const age = currentYear - year;
            if (age <= 2)
                score += 0.1; // Very recent
            else if (age <= 5)
                score += 0.05; // Recent
            else if (age > 15) score -= 0.1; // Outdated
        }

        // Authority bonus: has volume/issue/page numbers (journal article format)
        if (/\bvol\.?\s*\d+|\(\d{4}\)\s*,\s*\d+\s*[–-]\s*\d+|pp?\.\s*\d+/i.test(source)) {
            score += 0.1;
        }

        return {
            source: source.slice(0, 100),
            domainTier,
            domainLabel,
            score: Math.max(0, Math.min(1, score)),
        };
    }

    scoreSources(sources: string[]): {
        scores: SourceCredibility[];
        average: number;
        lowestTier: number;
    } {
        const scores = sources.map((s) => this.scoreSource(s));
        const average =
            scores.length > 0 ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length : 0;
        const lowestTier = scores.length > 0 ? Math.max(...scores.map((s) => s.domainTier)) : 5;
        return { scores, average, lowestTier };
    }
}
