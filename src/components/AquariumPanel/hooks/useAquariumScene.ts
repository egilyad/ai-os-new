import { genId } from '../../../utils/gen-id';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Ripple, Jellyfish, Seaweed, Food } from '../types';

export const useAquariumScene = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  setMousePointer: (pos: { x: number; y: number }) => void,
  setFood: React.Dispatch<React.SetStateAction<Food[]>>,
  fishesCount: number
) => {
  const sceneIsMountedRef = useRef(true);
  const timeoutRefs = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => { 
    sceneIsMountedRef.current = true; 
    const timers = timeoutRefs.current;
    return () => { 
      sceneIsMountedRef.current = false; 
      timers.forEach(clearTimeout);
      timers.clear();
    }; 
  }, []);
  const [jellyfishes] = useState<Jellyfish[]>(() =>
    Array.from({ length: 4 }).map((_, i) => ({
      id: i, x: 15 + Math.random() * 70, size: 30 + Math.random() * 40,
      speed: 20 + Math.random() * 15, delay: Math.random() * 10,
      tentacles: Array.from({ length: 4 }).map(() => ({
        minHeight: 15 + Math.random() * 10, maxHeight: 25 + Math.random() * 15, duration: 1.5 + Math.random()
      }))
    }))
  );
  const [seaweeds] = useState<Seaweed[]>(() =>
    Array.from({ length: 10 }).map((_, i) => ({
      id: i, left: 3 + Math.random() * 94, width: 10 + Math.random() * 20, height: 40 + Math.random() * 80,
      minRotate: -5 + Math.random() * -10, maxRotate: 5 + Math.random() * 10,
      duration: 3 + Math.random() * 3, delay: Math.random() * 2
    }))
  );
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const generateId = (): string => genId();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePointer({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    });
  }, [containerRef, setMousePointer]);

  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.aquarium-legend, .aquarium-hint, .aquarium-speech-bubble, .aquarium-close-btn, .aquarium-info-panel, .aquarium-feed-btn')) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    const timer = setTimeout(() => { 
      if (sceneIsMountedRef.current) setRipples(prev => prev.filter(r => r.id !== id)); 
      timeoutRefs.current.delete(timer);
    }, 1000);
    timeoutRefs.current.add(timer);

    const newFood: Food = { id: generateId(), x, y, size: 4 + Math.random() * 4 };
    setFood(prev => [...prev, newFood]);
  }, [containerRef, setFood]);

  const feedAllFishes = useCallback(() => {
    const newFoods = Array.from({ length: fishesCount * 3 }).map((_, i) => ({
      id: `food-${Date.now()}-${i}`,
      x: 10 + Math.random() * 80,
      y: -10 - Math.random() * 30,
      size: 3 + Math.random() * 5
    }));
    setFood(prev => [...prev, ...newFoods]);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const id = Date.now() + 1;
      setRipples(prev => [...prev, { id, x: rect.width / 2, y: 0, width: 200, height: 20 }]);
      const timer = setTimeout(() => { 
        if (sceneIsMountedRef.current) setRipples(prev => prev.filter(r => r.id !== id)); 
        timeoutRefs.current.delete(timer);
      }, 1000);
      timeoutRefs.current.add(timer);
    }
  }, [fishesCount, setFood, containerRef]);

  return { jellyfishes, seaweeds, ripples, handleMouseMove, handleContainerClick, feedAllFishes };
};
