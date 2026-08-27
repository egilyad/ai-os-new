export function estimateTokens(text: string, divisor = 4): number {
  if (!text) return 0;
  return Math.ceil(text.length / divisor);
}
