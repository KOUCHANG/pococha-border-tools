export const FIREWORK_POINTS = 4_000

export interface FireworkCalculation {
  remainingPoints: number
  requiredFireworks: number
}

export function calculateRequiredFireworks(
  currentPoints: number,
  targetPoints: number,
): FireworkCalculation {
  if (
    !Number.isSafeInteger(currentPoints) ||
    currentPoints < 0 ||
    !Number.isSafeInteger(targetPoints) ||
    targetPoints < 0
  ) {
    throw new Error('Points must be non-negative safe integers')
  }

  const remainingPoints = Math.max(targetPoints - currentPoints, 0)
  return {
    remainingPoints,
    requiredFireworks: Math.ceil(remainingPoints / FIREWORK_POINTS),
  }
}
