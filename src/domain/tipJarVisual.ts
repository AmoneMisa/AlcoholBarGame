/** Visual fullness follows the current balance, including after collection or theft. */
export function tipJarStage(amount: number, capacity: number): 0 | 1 | 2 | 3 | 4 {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  if (!Number.isFinite(capacity) || capacity <= 0) return 1;
  const fullness = amount / capacity;
  if (fullness >= 1) return 4;
  if (fullness >= 2 / 3) return 3;
  if (fullness >= 1 / 3) return 2;
  return 1;
}
