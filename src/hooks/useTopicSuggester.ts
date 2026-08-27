import { useMemo, useState, useCallback } from 'react';
import { suggestTopics, TOPIC_CATEGORIES } from '../kernel/utils/topic-suggestions';
import type { TopicSuggestion } from '../kernel/utils/topic-suggestions';

export function useTopicSuggester(initialCount = 5) {
  const [count, setCount] = useState(initialCount);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<TopicSuggestion['category'][]>([]);
  const [seed, setSeed] = useState(0);

  const topics = useMemo(() => {
    return suggestTopics({
      count,
      avoid: excluded,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, excluded, selectedCategories, seed]);

  const refresh = useCallback(() => setSeed(s => s + 1), []);
  const exclude = useCallback((topic: string) => {
    setExcluded(prev => prev.includes(topic) ? prev : [...prev, topic]);
  }, []);
  const reset = useCallback(() => {
    setExcluded([]);
    setSelectedCategories([]);
  }, []);

  const toggleCategory = useCallback((cat: TopicSuggestion['category']) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  }, []);

  return { topics, refresh, exclude, reset, count, setCount, categories: TOPIC_CATEGORIES, selectedCategories, toggleCategory };
}
