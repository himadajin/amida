import { describe, it, expect } from 'vitest';
import { generateAmida, tracePath, calculateAllResults, type AmidaBoardData, getPointAtProgress } from './amida';

// Simple seedable random generator for deterministic testing
function createSeededRandom(seed: number) {
  let s = seed;
  return function () {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };
}

describe('Amida Core Logic', () => {
  describe('generateAmida', () => {
    it('should generate a board with specified columns and levels', () => {
      const board = generateAmida({ cols: 5, levels: 10 });
      expect(board.cols).toBe(5);
      expect(board.levels).toBe(10);
      expect(Array.isArray(board.horizontalLines)).toBe(true);
    });

    it('should not contain adjacent horizontal lines on the same level (no shared endpoints)', () => {
      const board = generateAmida({ cols: 5, levels: 15 });
      
      // Check each level
      for (let y = 1; y <= board.levels; y++) {
        const linesAtLevel = board.horizontalLines.filter((l) => l.y === y);
        
        // Check for adjacent horizontal lines
        for (let i = 0; i < linesAtLevel.length; i++) {
          for (let j = i + 1; j < linesAtLevel.length; j++) {
            const diff = Math.abs(linesAtLevel[i].x - linesAtLevel[j].x);
            expect(diff).not.toBe(1); // Cannot be adjacent (e.g. x=0 and x=1 on the same level)
            expect(diff).not.toBe(0); // Cannot be duplicate
          }
        }
      }
    });

    it('should be completely deterministic with a seeded random function', () => {
      const rng1 = createSeededRandom(12345);
      const rng2 = createSeededRandom(12345);

      const board1 = generateAmida({ cols: 5, levels: 12, random: rng1 });
      const board2 = generateAmida({ cols: 5, levels: 12, random: rng2 });

      expect(board1.horizontalLines).toEqual(board2.horizontalLines);
    });
  });

  describe('tracePath & calculateAllResults', () => {
    it('should correctly trace through a simple manual board', () => {
      // Manual board:
      // cols = 3, levels = 3
      // Line at y=1, x=0 (connects 0 and 1)
      // Line at y=2, x=1 (connects 1 and 2)
      // Line at y=3, x=0 (connects 0 and 1)
      const manualBoard: AmidaBoardData = {
        cols: 3,
        levels: 3,
        horizontalLines: [
          { id: '1', x: 0, y: 1 },
          { id: '2', x: 1, y: 2 },
          { id: '3', x: 0, y: 3 },
        ],
      };

      // Tracing index 0:
      // Start (0, 0)
      // y=1: hits x=0 line -> moves to x=1. Points: (0, 1) -> (1, 1)
      // y=2: hits x=1 line -> moves to x=2. Points: (1, 2) -> (2, 2)
      // y=3: no line connected to x=2.
      // End: (2, 4)
      const path0 = tracePath(manualBoard, 0);
      expect(path0[0]).toEqual({ x: 0, y: 0 });
      expect(path0[path0.length - 1]).toEqual({ x: 2, y: 4 });

      // Tracing index 1:
      // Start (1, 0)
      // y=1: hits x=0 line -> moves to x=0. Points: (1, 1) -> (0, 1)
      // y=2: no line connected to x=0 (line is at x=1, connecting 1 and 2)
      // y=3: hits x=0 line -> moves to x=1. Points: (0, 3) -> (1, 3)
      // End: (1, 4)
      const path1 = tracePath(manualBoard, 1);
      expect(path1[0]).toEqual({ x: 1, y: 0 });
      expect(path1[path1.length - 1]).toEqual({ x: 1, y: 4 });

      // Tracing index 2:
      // Start (2, 0)
      // y=1: no line connected to x=2
      // y=2: hits x=1 line -> moves to x=1. Points: (2, 2) -> (1, 2)
      // y=3: hits x=0 line -> but currentX is 1, so wait... is there a line at x=0? Yes, connecting 0 and 1!
      // So at y=3, currentX=1 hits x=0 line -> moves to x=0. Points: (1, 3) -> (0, 3)
      // End: (0, 4)
      const path2 = tracePath(manualBoard, 2);
      expect(path2[0]).toEqual({ x: 2, y: 0 });
      expect(path2[path2.length - 1]).toEqual({ x: 0, y: 4 });
    });

    it('should always result in a perfect 1-to-1 mapping for any generated board', () => {
      // Test across multiple randomly generated boards
      for (let seed = 1; seed <= 20; seed++) {
        const rng = createSeededRandom(seed);
        const board = generateAmida({ cols: 5, levels: 15, random: rng });
        const results = calculateAllResults(board);

        expect(results.size).toBe(5);
        
        // Ensure every result index (0 to 4) is mapped to exactly once
        const targetIndices = Array.from(results.values());
        expect(targetIndices.sort()).toEqual([0, 1, 2, 3, 4]);
      }
    });

    it('should interpolate points along path correctly', () => {
      const path = [
        { x: 0, y: 0 },
        { x: 0, y: 2 },
        { x: 2, y: 2 },
      ];
      // Total length = 2 + 2 = 4
      expect(getPointAtProgress(path, 0)).toEqual({ x: 0, y: 0 });
      expect(getPointAtProgress(path, 0.25)).toEqual({ x: 0, y: 1 }); // 25% of 4 is 1 (halfway in first segment)
      expect(getPointAtProgress(path, 0.5)).toEqual({ x: 0, y: 2 });  // 50% is at first turn (end of first segment)
      expect(getPointAtProgress(path, 0.75)).toEqual({ x: 1, y: 2 }); // 75% is halfway in second segment
      expect(getPointAtProgress(path, 1.0)).toEqual({ x: 2, y: 2 });  // 100% is at the end
    });
  });
});
