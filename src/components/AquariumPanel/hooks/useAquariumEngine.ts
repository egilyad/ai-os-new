import { useState, useEffect, useRef } from 'react';
import { eventBus, EVENTS, rootLogger } from '../../../kernel/instances';
const LOGGER = rootLogger.child('useAquariumEngine');
import { providerColors } from '../../../styles/common';
import type { ChatResponse } from '../../../types/chat';
import type { FishState, Food, Bubble } from '../types';
import type { ApiKey } from '../../../kernel/types/metrics-types';
import { useLatest } from './useLatest';

export const useAquariumEngine = (
    keys: ApiKey[],
    t: (key: string) => string,
    setError: (err: string | null) => void,
    clearError: () => void,
    mousePosRef: React.MutableRefObject<{ x: number; y: number }>,
    isMountedRef: React.MutableRefObject<boolean>,
    isPaused: boolean,
) => {
    const [fishes, setFishes] = useState<FishState[]>([]);
    const [bubbles, setBubbles] = useState<Bubble[]>(() =>
        Array.from({ length: 25 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: 110,
            size: 4 + Math.random() * 8,
            duration: 5 + Math.random() * 10,
            delay: Math.random() * 5,
            type: 'oxygen' as const,
        })),
    );
    const [food, setFood] = useState<Food[]>([]);
    const [bot, setBot] = useState({ x: 10, y: 92, direction: 1 });

    const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const foodRef = useLatest(food);
    const keysRef = useLatest(keys);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFishes((prev) =>
            keys.map((k) => {
                const existing = prev.find((f) => f.id === k.id);
                if (existing) {
                    const newStatus = k.status;
                    let newEnergy = existing.energy;
                    if (
                        newStatus === 'active' &&
                        existing.status !== 'active' &&
                        existing.energy < 80
                    ) {
                        newEnergy = 100;
                    }
                    return {
                        ...existing,
                        status: newStatus,
                        energy: newEnergy,
                        color: providerColors[k.provider.toLowerCase()] || providerColors.default!,
                    };
                }
                return {
                    id: k.id,
                    provider: k.provider,
                    x: Math.random() * 80 + 10,
                    y: Math.random() * 60 + 20,
                    scale: 0.8 + Math.random() * 0.5,
                    speed: 2 + Math.random() * 3,
                    direction: Math.random() > 0.5 ? 1 : -1,
                    color: providerColors[k.provider.toLowerCase()]! || providerColors.default!,
                    energy: 100,
                    status: k.status,
                    personality: (['brave', 'shy', 'lazy', 'hyper'] as const)[
                        Math.floor(Math.random() * 4)
                    ]!,
                    wagDuration: 0.5 + Math.random() * 0.5,
                };
            }),
        );
    }, [keys]);

    useEffect(() => {
        const handleResponse = (res: ChatResponse) => {
            if (!isMountedRef.current) return;
            try {
                setFishes((prev) =>
                    prev.map((f) => {
                        if (
                            f.provider.toLowerCase() === (res.provider as string)?.toLowerCase() ||
                            f.id === (res as unknown as Record<string, unknown>).keyId
                        ) {
                            const content = res.content || '';
                            const lastWords =
                                content.length > 30 ? content.substring(0, 27) + '...' : content;
                            const bubbleIds: number[] = [];
                            const dataBubbles = Array.from({ length: 5 }).map((_, i) => {
                                const bid = Date.now() + i;
                                bubbleIds.push(bid);
                                return {
                                    id: bid,
                                    x: f.x + (Math.random() - 0.5) * 5,
                                    y: f.y,
                                    size: 3 + Math.random() * 5,
                                    duration: 2 + Math.random() * 3,
                                    delay: 0,
                                    type: 'data' as const,
                                };
                            });
                            setBubbles((prevB) => [...prevB, ...dataBubbles]);

                            const existingTimer = timeoutRefs.current.get(f.id);
                            if (existingTimer) clearTimeout(existingTimer);
                            timeoutRefs.current.set(
                                f.id,
                                setTimeout(() => {
                                    if (isMountedRef.current) {
                                        setBubbles((prevB) =>
                                            prevB.filter(
                                                (b) =>
                                                    !(
                                                        b.type === 'data' &&
                                                        bubbleIds.includes(b.id)
                                                    ),
                                            ),
                                        );
                                        timeoutRefs.current.delete(f.id);
                                    }
                                }, 5000),
                            );

                            return {
                                ...f,
                                isPulsing: true,
                                energy: Math.min(100, f.energy + 20),
                                lastWords,
                            };
                        }
                        return f;
                    }),
                );

                const pulseTimerId = 'pulse-' + Date.now() + Math.random();
                timeoutRefs.current.set(
                    pulseTimerId,
                    setTimeout(() => {
                        if (isMountedRef.current) {
                            setFishes((prev) =>
                                prev.map((f) =>
                                    f.isPulsing
                                        ? { ...f, isPulsing: false, lastWords: undefined }
                                        : f,
                                ),
                            );
                            timeoutRefs.current.delete(pulseTimerId);
                        }
                    }, 3000),
                );
            } catch (e) {
                LOGGER.warn('Error processing message event', String(e));
                if (isMountedRef.current) {
                    setError(t('aquarium.error_message'));
                    clearError();
                }
            }
        };

        const unsub = eventBus.on(EVENTS.MESSAGE_RESPONSE, handleResponse);
        const timers = timeoutRefs.current;
        return () => {
            unsub();
            for (const timer of timers.values()) {
                clearTimeout(timer);
            }
            timers.clear();
        };
    }, [clearError, isMountedRef, setError, t]);

    const fishesRef = useLatest(fishes);

    useEffect(() => {
        let frameId = 0;
        let lastStep = performance.now();

        const step = () => {
            if (!isMountedRef.current) return;
            if (isPaused) {
                frameId = requestAnimationFrame(animate);
                return;
            }
            const prevFood = foodRef.current;
            const fallenFood = prevFood
                .map((p) => ({ ...p, y: p.y + 0.5 }))
                .filter((p) => p.y < 100);
            const eatenIds = new Set<string>();
            const newFish = computeNewFish(fishesRef.current, fallenFood, eatenIds);
            const remaining = fallenFood.filter((p) => !eatenIds.has(p.id));
            foodRef.current = remaining;
            setFishes(newFish);
            setFood(remaining);
            setBot((prev) => {
                let newX = prev.x + 0.2 * prev.direction,
                    newDir = prev.direction;
                if (newX > 90) {
                    newX = 90;
                    newDir = -1;
                }
                if (newX < 10) {
                    newX = 10;
                    newDir = 1;
                }
                return { ...prev, x: newX, direction: newDir };
            });
        };

        const computeNewFish = (
            prevFish: FishState[],
            fallenFood: Food[],
            eatenIds: Set<string>,
        ): FishState[] => {
            return prevFish.map((f) => {
                const keyData = keysRef.current.find((k) => k.id === f.id);
                const reputation = keyData?.stats?.extended?.reputationScore || 100;
                const currentStatus = keyData?.status || 'inactive';
                const isDead = currentStatus !== 'active';

                if (isDead) {
                    let newY = f.y - 0.5;
                    if (newY < 12) newY = 12 + Math.sin(Date.now() / 1000) * 2;
                    return {
                        ...f,
                        y: newY,
                        x: f.x + Math.sin(Date.now() / 2000) * 0.05,
                        status: currentStatus,
                        energy: 0,
                    };
                }

                let speedMultiplier = 0.1;
                if (f.personality === 'hyper') speedMultiplier = 0.2;
                if (f.personality === 'lazy') speedMultiplier = 0.05;
                const baseSpeed = f.speed * speedMultiplier * (reputation / 100);
                let newX = f.x,
                    newY = f.y,
                    newDirection = f.direction;

                const hungerThreshold =
                    f.personality === 'brave' ? 90 : f.personality === 'lazy' ? 40 : 80;
                const currentFood = fallenFood;
                const closestFood =
                    currentFood.length > 0
                        ? currentFood.reduce((prev, curr) => {
                              const dPrev = Math.hypot(prev.x - f.x, prev.y - f.y);
                              const dCurr = Math.hypot(curr.x - f.x, curr.y - f.y);
                              return dCurr < dPrev ? curr : prev;
                          })
                        : null;
                if (closestFood && f.energy < hungerThreshold) {
                    const dx = closestFood.x - f.x,
                        dy = closestFood.y - f.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 3) {
                        eatenIds.add(closestFood.id);
                        return { ...f, energy: Math.min(100, f.energy + 15), isPulsing: true };
                    }
                    const chaseSpeed = f.personality === 'hyper' ? 2.5 : 1.5;
                    newX += (dx / dist) * baseSpeed * chaseSpeed;
                    newY += (dy / dist) * baseSpeed * chaseSpeed;
                    newDirection = dx > 0 ? 1 : -1;
                } else {
                    newX += baseSpeed * f.direction;
                    const mdx = f.x - mousePosRef.current.x,
                        mdy = f.y - mousePosRef.current.y;
                    const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
                    const fearDistance =
                        f.personality === 'shy' ? 25 : f.personality === 'brave' ? 8 : 15;
                    if (mdist < fearDistance) {
                        newDirection = mdx > 0 ? 1 : -1;
                        newX += newDirection * (f.personality === 'hyper' ? 0.8 : 0.5);
                    }
                    newY += Math.sin(Date.now() / 1000 + f.x) * 0.4;
                    newY += (Math.random() - 0.5) * 0.5;
                    let repulseX = 0,
                        repulseY = 0;
                    prevFish.forEach((otherFish) => {
                        if (otherFish.id !== f.id && otherFish.status === 'active') {
                            const dx = newX - otherFish.x,
                                dy = newY - otherFish.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist > 0 && dist < 8) {
                                repulseX += (dx / dist) * 0.3;
                                repulseY += (dy / dist) * 0.3;
                            }
                        }
                    });
                    newX += repulseX;
                    newY += repulseY;
                    if (reputation < 50) newY += 0.2;
                }
                if (newX > 92) {
                    newX = 92;
                    newDirection = -1;
                }
                if (newX < 8) {
                    newX = 8;
                    newDirection = 1;
                }
                return {
                    ...f,
                    x: newX,
                    y: Math.max(15, Math.min(85, newY)),
                    direction: newDirection,
                    energy: Math.max(20, f.energy - 0.05),
                    status: currentStatus,
                };
            });
        };

        const animate = (now: number) => {
            if (now - lastStep >= 250) {
                lastStep = now;
                step();
            }
            frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMountedRef, isPaused, mousePosRef]);

    return { fishes, bubbles, food, bot, setFood, setRipples: () => {} };
};
