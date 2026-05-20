export type EasingFunction = (progress: number) => number;

export const clampProgress = (progress: number): number => Math.min(Math.max(progress, 0), 1);

export const easeInCubic: EasingFunction = (progress) => {
  const clamped = clampProgress(progress);
  return clamped ** 3;
};

export const easeInWithInitialMomentum: EasingFunction = (progress) => {
  const clamped = clampProgress(progress);
  return clamped * 0.62 + clamped ** 3 * 0.38;
};

export const traceProgressEasing: EasingFunction = easeInWithInitialMomentum;
