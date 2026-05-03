export type LadderLine = {
  id: string;
  level: number;
  fromLane: number;
  toLane: number;
};

export type Ladder = {
  laneCount: number;
  levelCount: number;
  lines: LadderLine[];
};

export type PathSegment =
  | {
      kind: 'vertical';
      lane: number;
      fromLevel: number;
      toLevel: number;
    }
  | {
      kind: 'horizontal';
      level: number;
      fromLane: number;
      toLane: number;
    };

export type TraceResult = {
  startLane: number;
  endLane: number;
  segments: PathSegment[];
};

export type RandomSource = () => number;

export const DEFAULT_LANE_COUNT = 5;
export const DEFAULT_PARTICIPANTS = ['A', 'B', 'C', 'D', 'E'];
export const DEFAULT_RESULTS = ['1', '2', '3', '4', '5'];

const DEFAULT_LEVELS_PER_LANE = 4;

export function createSeededRandom(seed: number): RandomSource {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function createLadder(
  laneCount = DEFAULT_LANE_COUNT,
  random: RandomSource = Math.random,
): Ladder {
  if (!Number.isInteger(laneCount) || laneCount < 2) {
    throw new Error('laneCount must be an integer greater than 1');
  }

  const lineCount = chooseLineCount(laneCount, random);
  const levelCount = Math.max(
    lineCount * 2 + 2,
    laneCount * DEFAULT_LEVELS_PER_LANE,
  );
  const usedLevels = new Set<number>();
  const lines: LadderLine[] = [];

  while (lines.length < lineCount) {
    const level = 1 + Math.floor(random() * (levelCount - 1));

    if (usedLevels.has(level)) {
      continue;
    }

    const fromLane = Math.floor(random() * (laneCount - 1));
    usedLevels.add(level);
    lines.push({
      id: `line-${level}-${fromLane}`,
      level,
      fromLane,
      toLane: fromLane + 1,
    });
  }

  return {
    laneCount,
    levelCount,
    lines: lines.sort((a, b) => a.level - b.level),
  };
}

export function traceLadder(ladder: Ladder, startLane: number): TraceResult {
  validateLane(ladder, startLane);

  const segments: PathSegment[] = [];
  let currentLane = startLane;
  let currentLevel = 0;

  for (const line of ladder.lines) {
    if (line.level < currentLevel) {
      throw new Error('ladder lines must be sorted from top to bottom');
    }

    if (line.fromLane !== currentLane && line.toLane !== currentLane) {
      continue;
    }

    if (line.level > currentLevel) {
      segments.push({
        kind: 'vertical',
        lane: currentLane,
        fromLevel: currentLevel,
        toLevel: line.level,
      });
    }

    const nextLane =
      line.fromLane === currentLane ? line.toLane : line.fromLane;
    segments.push({
      kind: 'horizontal',
      level: line.level,
      fromLane: currentLane,
      toLane: nextLane,
    });

    currentLane = nextLane;
    currentLevel = line.level;
  }

  if (currentLevel < ladder.levelCount) {
    segments.push({
      kind: 'vertical',
      lane: currentLane,
      fromLevel: currentLevel,
      toLevel: ladder.levelCount,
    });
  }

  return {
    startLane,
    endLane: currentLane,
    segments,
  };
}

export function createResultAssignments(ladder: Ladder): number[] {
  return Array.from(
    { length: ladder.laneCount },
    (_, lane) => traceLadder(ladder, lane).endLane,
  );
}

export function validateNames(
  participants: string[],
  results: string[],
): string[] {
  const errors: string[] = [];

  participants.forEach((name, index) => {
    if (name.trim() === '') {
      errors.push(`参加者${index + 1}の名前を入力してください。`);
    }
  });

  results.forEach((name, index) => {
    if (name.trim() === '') {
      errors.push(`結果${index + 1}の名前を入力してください。`);
    }
  });

  return errors;
}

export function validateLadder(ladder: Ladder): string[] {
  const errors: string[] = [];
  const levels = new Set<number>();

  ladder.lines.forEach((line) => {
    if (line.toLane - line.fromLane !== 1) {
      errors.push(`${line.id} は隣接する縦線だけを接続していません。`);
    }

    if (line.fromLane < 0 || line.toLane >= ladder.laneCount) {
      errors.push(`${line.id} は縦線の範囲外です。`);
    }

    if (line.level <= 0 || line.level >= ladder.levelCount) {
      errors.push(`${line.id} は上下端に近すぎます。`);
    }

    if (levels.has(line.level)) {
      errors.push(`${line.id} は他の横線と同じ高さです。`);
    }

    levels.add(line.level);
  });

  return errors;
}

function chooseLineCount(laneCount: number, random: RandomSource): number {
  const min = Math.max(laneCount + 2, Math.floor(laneCount * 1.6));
  const max = Math.max(min, Math.floor(laneCount * 2.4));

  return min + Math.floor(random() * (max - min + 1));
}

function validateLane(ladder: Ladder, lane: number) {
  if (!Number.isInteger(lane) || lane < 0 || lane >= ladder.laneCount) {
    throw new Error('lane is out of range');
  }
}
