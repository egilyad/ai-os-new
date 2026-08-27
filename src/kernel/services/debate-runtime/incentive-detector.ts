import type {
    IIncentiveDetector,
    IncentiveAnalysis,
    IncentiveProfile,
} from '../../contracts/debate-incentives';

const STAKEHOLDER_PATTERNS: Array<{
    trigger: RegExp;
    stakeholder: string;
    stake: string;
    direction: 'for' | 'against';
}> = [
    {
        trigger: /\b(profit|revenue|market|shareholder|investor|roi)\b/i,
        stakeholder: 'Corporate shareholders',
        stake: 'Financial returns',
        direction: 'for',
    },
    {
        trigger: /\b(regulat|compliance|law|legal|policy|mandate)\b/i,
        stakeholder: 'Regulatory bodies',
        stake: 'Compliance and legal power',
        direction: 'for',
    },
    {
        trigger: /\b(tax|subsidy|government|public funding|state)\b/i,
        stakeholder: 'Government',
        stake: 'Tax revenue and public spending',
        direction: 'for',
    },
    {
        trigger: /\b(patent|ip|intellectual.?property|copyright|license)\b/i,
        stakeholder: 'IP holders',
        stake: 'Exclusive rights and licensing fees',
        direction: 'for',
    },
    {
        trigger: /\b(open.?source|free.?software|community)\b/i,
        stakeholder: 'Open-source community',
        stake: 'Access and freedom',
        direction: 'for',
    },
    {
        trigger: /\b(privacy|surveillance|data.?collection|tracking)\b/i,
        stakeholder: 'Surveillance industry',
        stake: 'Access to personal data',
        direction: 'for',
    },
    {
        trigger: /\b(ai|automation|algorithm|llm|neural)\b/i,
        stakeholder: 'AI companies',
        stake: 'Market adoption and data access',
        direction: 'for',
    },
    {
        trigger: /\b(worker|employee|union|labor|job|hire)\b/i,
        stakeholder: 'Workers and unions',
        stake: 'Job security and wages',
        direction: 'for',
    },
    {
        trigger: /\b(consumer|customer|user|buyer)\b/i,
        stakeholder: 'Consumers',
        stake: 'Product affordability and choice',
        direction: 'for',
    },
    {
        trigger: /\b(pharma|drug|medicine|health.?care|hospital)\b/i,
        stakeholder: 'Pharmaceutical industry',
        stake: 'Drug pricing and market share',
        direction: 'for',
    },
    {
        trigger: /\b(media|news|press|journalist|broadcast)\b/i,
        stakeholder: 'Media organizations',
        stake: 'Audience attention and advertising',
        direction: 'for',
    },
    {
        trigger: /\b(environment|climate|emission|pollut|carbon|green)\b/i,
        stakeholder: 'Environmental groups',
        stake: 'Ecological outcomes',
        direction: 'for',
    },
];

export class IncentiveDetector implements IIncentiveDetector {
    analyze(
        agentId: string,
        agentName: string,
        content: string,
        topic: string,
    ): IncentiveAnalysis | null {
        const profiles: IncentiveProfile[] = [];
        const seen = new Set<string>();

        for (const pattern of STAKEHOLDER_PATTERNS) {
            if (seen.has(pattern.stakeholder)) continue;
            const match = content.match(pattern.trigger);
            if (match) {
                seen.add(pattern.stakeholder);
                profiles.push({
                    stakeholder: pattern.stakeholder,
                    stake: pattern.stake,
                    direction: pattern.direction,
                    estimatedValue: this.estimateValue(content, pattern.stakeholder),
                    credibilityImpact: this.computeImpact(pattern.direction),
                });
            }
        }

        if (topic) {
            const topicMatch = STAKEHOLDER_PATTERNS.find((p) => topic.match(p.trigger));
            if (topicMatch && !seen.has(topicMatch.stakeholder)) {
                profiles.push({
                    stakeholder: topicMatch.stakeholder,
                    stake: topicMatch.stake,
                    direction: topicMatch.direction,
                    estimatedValue: 'Direct stake in topic outcome',
                    credibilityImpact: this.computeImpact(topicMatch.direction),
                });
            }
        }

        if (profiles.length === 0) return null;

        const conflictOfInterest = profiles.length >= 2;

        const disclosurePrompt = conflictOfInterest
            ? `⚠️ Potential conflict of interest detected: ${agentName} argues in favor of positions that benefit ${profiles.map((p) => p.stakeholder).join(', ')}. Consider disclosing any personal or financial stake in these outcomes.`
            : '';

        return {
            agentId,
            agentName,
            profiles,
            conflictOfInterest,
            disclosurePrompt,
        };
    }

    private estimateValue(content: string, stakeholder: string): string {
        const hasNumbers = content.match(/\b(\d+[kKmMbB]?)\b/);
        if (hasNumbers && stakeholder.match(/profit|revenue|market|pharma/i)) {
            return `Estimated ${hasNumbers[1]} in play`;
        }
        return 'Non-quantified interest';
    }

    private computeImpact(direction: 'for' | 'against'): number {
        return direction === 'for' ? -0.15 : 0.05;
    }
}
