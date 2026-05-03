import { describe, expect, it } from 'vitest';
import {
  createLadder,
  createResultAssignments,
  createSeededRandom,
  traceLadder,
  validateLadder,
  type Ladder,
} from './amida';

describe('createLadder', () => {
  it('指定した人数であみだくじを生成できる', () => {
    const ladder = createLadder(5, createSeededRandom(1));

    expect(ladder.laneCount).toBe(5);
    expect(ladder.lines.length).toBeGreaterThanOrEqual(7);
    expect(ladder.lines.length).toBeLessThanOrEqual(12);
  });

  it('横線は隣接する縦軸同士だけを接続し、同じ高さで重ならない', () => {
    const ladder = createLadder(5, createSeededRandom(10));
    const levels = new Set(ladder.lines.map((line) => line.level));

    expect(validateLadder(ladder)).toEqual([]);
    expect(levels.size).toBe(ladder.lines.length);
    expect(
      ladder.lines.every((line) => line.toLane - line.fromLane === 1),
    ).toBe(true);
  });

  it('生成結果を決定的に扱える', () => {
    expect(createLadder(5, createSeededRandom(99))).toEqual(
      createLadder(5, createSeededRandom(99)),
    );
  });
});

describe('traceLadder', () => {
  it('参加者が正しい経路をたどり、対応する結果に到達する', () => {
    const ladder: Ladder = {
      laneCount: 3,
      levelCount: 6,
      lines: [
        { id: 'a', level: 2, fromLane: 0, toLane: 1 },
        { id: 'b', level: 4, fromLane: 1, toLane: 2 },
      ],
    };

    const trace = traceLadder(ladder, 0);

    expect(trace.endLane).toBe(2);
    expect(trace.segments).toEqual([
      { kind: 'vertical', lane: 0, fromLevel: 0, toLevel: 2 },
      { kind: 'horizontal', level: 2, fromLane: 0, toLane: 1 },
      { kind: 'vertical', lane: 1, fromLevel: 2, toLevel: 4 },
      { kind: 'horizontal', level: 4, fromLane: 1, toLane: 2 },
      { kind: 'vertical', lane: 2, fromLevel: 4, toLevel: 6 },
    ]);
  });

  it('真下の結果へ到達する経路も有効に扱える', () => {
    const ladder: Ladder = {
      laneCount: 3,
      levelCount: 6,
      lines: [{ id: 'a', level: 3, fromLane: 0, toLane: 1 }],
    };

    expect(traceLadder(ladder, 2).endLane).toBe(2);
  });

  it('結果の対応に重複がない', () => {
    const ladder = createLadder(5, createSeededRandom(17));
    const assignments = createResultAssignments(ladder);

    expect(new Set(assignments).size).toBe(5);
  });
});
