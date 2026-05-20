import { describe, expect, it } from 'vitest';
import {
  clampProgress,
  easeInCubic,
  easeInWithInitialMomentum,
  traceProgressEasing,
} from './easing';

describe('easing', () => {
  it('clamps progress to the animation range', () => {
    expect(clampProgress(-0.2)).toBe(0);
    expect(clampProgress(0.4)).toBe(0.4);
    expect(clampProgress(1.2)).toBe(1);
  });

  it('keeps the same start and end points while easing in', () => {
    expect(easeInCubic(0)).toBe(0);
    expect(easeInCubic(0.5)).toBeLessThan(0.5);
    expect(easeInCubic(1)).toBe(1);
  });

  it('adds some initial momentum while still accelerating overall', () => {
    expect(easeInWithInitialMomentum(0)).toBe(0);
    expect(easeInWithInitialMomentum(0.1)).toBeGreaterThan(easeInCubic(0.1));
    expect(easeInWithInitialMomentum(0.5)).toBeLessThan(0.5);
    expect(easeInWithInitialMomentum(1)).toBe(1);
  });

  it('uses a replaceable easing function for tracing progress', () => {
    expect(traceProgressEasing).toBe(easeInWithInitialMomentum);
  });
});
