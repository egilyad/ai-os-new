export interface TopicSuggestion {
  topic: string;
  category: 'ethics' | 'technology' | 'society' | 'science' | 'philosophy' | 'politics' | 'creative' | 'business';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rationale: string;
}

const SEED_TOPICS: TopicSuggestion[] = [
  { topic: 'Should AI have legal personhood?', category: 'ethics', difficulty: 'advanced', rationale: 'Frontier of legal philosophy and AI rights' },
  { topic: 'Is open-source AI safer than closed?', category: 'technology', difficulty: 'intermediate', rationale: 'Real-world tradeoffs in transparency vs. control' },
  { topic: 'Are universal basic income programs viable in the AGI era?', category: 'society', difficulty: 'advanced', rationale: 'Combines economics, automation, and labor' },
  { topic: 'Will fusion energy arrive before 2040?', category: 'science', difficulty: 'intermediate', rationale: 'Active research with measurable milestones' },
  { topic: 'Is consciousness substrate-independent?', category: 'philosophy', difficulty: 'advanced', rationale: 'Classic mind-body problem in modern context' },
  { topic: 'Should voting be mandatory?', category: 'politics', difficulty: 'intermediate', rationale: 'Civic engagement vs. individual freedom' },
  { topic: 'Is dark matter a real phenomenon or a model artifact?', category: 'science', difficulty: 'advanced', rationale: 'Active scientific debate with competing theories' },
  { topic: 'Will remote work persist after 2030?', category: 'society', difficulty: 'beginner', rationale: 'Post-pandemic trajectory discussion' },
  { topic: 'Are social media platforms publishers?', category: 'politics', difficulty: 'intermediate', rationale: 'Section 230 and content moderation' },
  { topic: 'Is education obsolete in the age of AI tutors?', category: 'society', difficulty: 'intermediate', rationale: 'Transformation of learning paradigms' },
  { topic: 'Should we colonize Mars or fix Earth first?', category: 'ethics', difficulty: 'intermediate', rationale: 'Resource allocation and priorities' },
  { topic: 'Is cryptocurrency a currency or an asset?', category: 'business', difficulty: 'intermediate', rationale: 'Volatile regulatory landscape' },
  { topic: 'Can art created by AI be considered original?', category: 'philosophy', difficulty: 'advanced', rationale: 'Creativity, authorship, and intent' },
  { topic: 'Should genetic engineering of humans be banned?', category: 'ethics', difficulty: 'advanced', rationale: 'CRISPR and bioethics at scale' },
  { topic: 'Is privacy a fundamental right in the digital age?', category: 'politics', difficulty: 'beginner', rationale: 'GDPR, surveillance, and personal data' },
  { topic: 'Will paper books survive another century?', category: 'creative', difficulty: 'beginner', rationale: 'Format preferences and nostalgia' },
  { topic: 'Are driverless cars safer than human drivers?', category: 'technology', difficulty: 'intermediate', rationale: 'Liability, edge cases, statistics' },
  { topic: 'Should billionaires exist?', category: 'society', difficulty: 'advanced', rationale: 'Wealth distribution and social contract' },
  { topic: 'Is space exploration worth the cost?', category: 'science', difficulty: 'beginner', rationale: 'Inspiration vs. practical returns' },
  { topic: 'Will nuclear power be the bridge to renewables?', category: 'technology', difficulty: 'intermediate', rationale: 'Climate change and energy policy' },
  { topic: 'Is democracy the best form of government?', category: 'politics', difficulty: 'advanced', rationale: 'Comparative political systems' },
  { topic: 'Should we fear superintelligent AI?', category: 'technology', difficulty: 'advanced', rationale: 'Existential risk and alignment' },
  { topic: 'Is the four-day work week the future?', category: 'business', difficulty: 'beginner', rationale: 'Productivity experiments worldwide' },
  { topic: 'Can algorithms be biased even with good intentions?', category: 'ethics', difficulty: 'intermediate', rationale: 'Real-world ML fairness case studies' },
  { topic: 'Should we bring back extinct species?', category: 'science', difficulty: 'intermediate', rationale: 'De-extinction technology and ecology' },
  { topic: 'Is long-term monogamy natural for humans?', category: 'philosophy', difficulty: 'advanced', rationale: 'Anthropology and evolutionary psychology' },
  { topic: 'Should voting age be lowered to 16?', category: 'politics', difficulty: 'beginner', rationale: 'Youth civic engagement' },
  { topic: 'Will AR glasses replace smartphones?', category: 'technology', difficulty: 'intermediate', rationale: 'Apple Vision Pro, Meta Ray-Ban' },
  { topic: 'Is mental health awareness overdiagnosed?', category: 'society', difficulty: 'advanced', rationale: 'Diagnostic trends and cultural shifts' },
  { topic: 'Should athletes be role models?', category: 'society', difficulty: 'beginner', rationale: 'Public figure responsibilities' },
  { topic: 'Is competition better than cooperation?', category: 'philosophy', difficulty: 'intermediate', rationale: 'Game theory and evolution' },
  { topic: 'Can AI truly understand language?', category: 'philosophy', difficulty: 'advanced', rationale: 'Chinese Room and modern LLMs' },
  { topic: 'Should we terraform other planets?', category: 'science', difficulty: 'advanced', rationale: 'Ethics of planetary-scale engineering' },
  { topic: 'Is age just a number in relationships?', category: 'society', difficulty: 'beginner', rationale: 'Social norms and personal choice' },
  { topic: 'Will quantum computers break current encryption?', category: 'technology', difficulty: 'advanced', rationale: 'Post-quantum cryptography' },
  { topic: 'Is parenting harder than ever?', category: 'society', difficulty: 'beginner', rationale: 'Generational comparison' },
  { topic: 'Should homework be abolished?', category: 'society', difficulty: 'beginner', rationale: 'Active pedagogy debate' },
  { topic: 'Is cancel culture accountability or mob justice?', category: 'society', difficulty: 'advanced', rationale: 'Free speech and consequences' },
  { topic: 'Will traditional journalism survive?', category: 'society', difficulty: 'intermediate', rationale: 'Citizen journalism and AI news' },
  { topic: 'Is ambition a virtue?', category: 'philosophy', difficulty: 'intermediate', rationale: 'Personal development ethics' },
];

const CATEGORY_WEIGHTS: Record<TopicSuggestion['category'], number> = {
  ethics: 1.0,
  technology: 1.2,
  society: 0.9,
  science: 1.1,
  philosophy: 0.8,
  politics: 0.7,
  creative: 0.6,
  business: 0.8,
};

function hashStringToInt(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function suggestTopics(options: { count?: number; avoid?: string[]; categories?: TopicSuggestion['category'][] } = {}): TopicSuggestion[] {
  const { count = 5, avoid = [], categories } = options;
  const avoidSet = new Set(avoid.map(t => t.toLowerCase().trim()));
  const pool = SEED_TOPICS.filter(t => !avoidSet.has(t.topic.toLowerCase()));
  const filtered = categories && categories.length > 0 ? pool.filter(t => categories.includes(t.category)) : pool;
  if (filtered.length === 0) return [];
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const scored = filtered.map((t, i) => {
    const seed = hashStringToInt(`${day}:${t.topic}:${i}`);
    const catBoost = CATEGORY_WEIGHTS[t.category] ?? 1;
    const random = ((seed % 1000) / 1000) * 0.5 + 0.5;
    return { topic: t, score: random * catBoost };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(s => s.topic);
}

export function suggestByDifficulty(difficulty: TopicSuggestion['difficulty'], count = 5): TopicSuggestion[] {
  return SEED_TOPICS.filter(t => t.difficulty === difficulty).slice(0, count);
}

export function suggestByCategory(category: TopicSuggestion['category'], count = 5): TopicSuggestion[] {
  return SEED_TOPICS.filter(t => t.category === category).slice(0, count);
}

export const TOPIC_CATEGORIES: TopicSuggestion['category'][] = ['ethics', 'technology', 'society', 'science', 'philosophy', 'politics', 'creative', 'business'];
export const TOPIC_DIFFICULTIES: TopicSuggestion['difficulty'][] = ['beginner', 'intermediate', 'advanced'];
