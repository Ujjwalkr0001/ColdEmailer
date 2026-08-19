export function getRandomDelaySeconds(min = 0, max = 300): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}