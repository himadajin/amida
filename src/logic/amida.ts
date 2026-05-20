export interface HorizontalLine {
  id: string;
  x: number; // Left vertical line index (0 <= x < cols - 1)
  y: number; // Vertical level (1 <= y <= levels)
}

export interface AmidaBoardData {
  cols: number;
  levels: number;
  horizontalLines: HorizontalLine[];
}

export interface Point {
  x: number;
  y: number;
}

export interface GenerateOptions {
  cols: number;
  levels: number;
  random?: () => number;
}

/**
 * Generates an Amidakuji board with horizontal lines randomly placed.
 * Ensures no two horizontal lines touch on the same level (no shared endpoints).
 * Supports a custom random function for determinism.
 */
export function generateAmida(options: GenerateOptions): AmidaBoardData {
  const { cols, levels, random = Math.random } = options;

  if (cols < 2) {
    throw new Error('Number of columns must be at least 2');
  }
  if (levels < 1) {
    throw new Error('Number of levels must be at least 1');
  }

  let attempt = 0;
  const maxAttempts = 100;

  while (attempt < maxAttempts) {
    attempt++;
    const horizontalLines: HorizontalLine[] = [];
    let idCounter = 0;

    // We generate level by level (from 1 to levels)
    for (let y = 1; y <= levels; y++) {
      let x = 0;
      while (x < cols - 1) {
        // Decide whether to place a horizontal line with 45% probability
        if (random() < 0.45) {
          horizontalLines.push({
            id: `line-${y}-${x}-${idCounter++}`,
            x,
            y,
          });
          // Skip the next index to avoid horizontal lines sharing an endpoint on the same level
          x += 2;
        } else {
          x += 1;
        }
      }
    }

    // Validation:
    // 1. Ensure every column is connected to at least some horizontal lines (if cols > 2)
    // 2. Ensure total horizontal line count is sufficient (e.g. at least cols * 1.5 lines)
    const colConnections = new Array(cols).fill(0);
    for (const line of horizontalLines) {
      colConnections[line.x]++;
      colConnections[line.x + 1]++;
    }

    const hasEmptyCol = colConnections.some((count) => count === 0);
    const hasEnoughLines = horizontalLines.length >= cols - 1;

    // If it's a valid board or we reached max attempts, return it
    if ((!hasEmptyCol && hasEnoughLines) || attempt === maxAttempts) {
      // Sort lines by y, then x for deterministic traversal and UI rendering
      horizontalLines.sort((a, b) => a.y - b.y || a.x - b.x);
      return {
        cols,
        levels,
        horizontalLines,
      };
    }
  }

  // Fallback (should not be reached under normal circumstances)
  return { cols, levels, horizontalLines: [] };
}

/**
 * Traces the path for a participant starting at startingCol (0-indexed).
 * Returns the sequence of points (x, y) representing the path from top to bottom.
 * The levels go from y = 0 (top) to y = levels + 1 (bottom).
 */
export function tracePath(board: AmidaBoardData, startingCol: number): Point[] {
  const { cols, levels, horizontalLines } = board;
  if (startingCol < 0 || startingCol >= cols) {
    throw new Error(`Invalid starting column: ${startingCol}`);
  }

  const path: Point[] = [];
  let currentX = startingCol;
  
  // Start at the very top (y = 0)
  path.push({ x: currentX, y: 0 });

  // Traverse level by level
  for (let currentY = 1; currentY <= levels; currentY++) {
    // Check if there is a horizontal line connected to currentX at level currentY
    const leftLine = horizontalLines.find(
      (l) => l.y === currentY && l.x === currentX
    );
    const rightLine = horizontalLines.find(
      (l) => l.y === currentY && l.x === currentX - 1
    );

    if (leftLine) {
      // Line to the right (connecting currentX and currentX + 1)
      path.push({ x: currentX, y: currentY }); // segment down to the line
      currentX = currentX + 1;
      path.push({ x: currentX, y: currentY }); // move right
    } else if (rightLine) {
      // Line to the left (connecting currentX - 1 and currentX)
      path.push({ x: currentX, y: currentY }); // segment down to the line
      currentX = currentX - 1;
      path.push({ x: currentX, y: currentY }); // move left
    }
    // If no horizontal line exists at this level for this column, we just continue going down
  }

  // Finally, go down to the very bottom (y = levels + 1)
  path.push({ x: currentX, y: levels + 1 });

  // Optimize path: collapse consecutive vertical segments on the same column
  // (e.g. if we went straight down through levels with no lines, we only need start and end)
  const optimizedPath: Point[] = [];
  for (let i = 0; i < path.length; i++) {
    const pt = path[i];
    const prev = optimizedPath[optimizedPath.length - 1];
    const next = path[i + 1];

    if (prev && next && prev.x === pt.x && pt.x === next.x) {
      // Middle of a straight vertical line, skip it
      continue;
    }
    optimizedPath.push(pt);
  }

  return optimizedPath;
}

/**
 * Calculates results for all participants.
 * Returns a map of participant starting index to their ending result index.
 */
export function calculateAllResults(board: AmidaBoardData): Map<number, number> {
  const results = new Map<number, number>();
  for (let i = 0; i < board.cols; i++) {
    const path = tracePath(board, i);
    const finalPoint = path[path.length - 1];
    results.set(i, finalPoint.x);
  }
  return results;
}

/**
 * Gets the interpolated point along a path for a progress value between 0 and 1.
 */
export function getPointAtProgress(path: Point[], progress: number): Point {
  if (path.length === 0) return { x: 0, y: 0 };
  if (path.length === 1) return path[0];
  if (progress <= 0) return path[0];
  if (progress >= 1) return path[path.length - 1];

  // Calculate the length of each segment
  const segments = [];
  let totalLength = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    const len = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    segments.push({ p1, p2, len });
    totalLength += len;
  }

  const targetDist = progress * totalLength;
  let currentDist = 0;

  for (const seg of segments) {
    if (currentDist + seg.len >= targetDist) {
      const segProgress = (targetDist - currentDist) / seg.len;
      return {
        x: seg.p1.x + (seg.p2.x - seg.p1.x) * segProgress,
        y: seg.p1.y + (seg.p2.y - seg.p1.y) * segProgress,
      };
    }
    currentDist += seg.len;
  }

  return path[path.length - 1];
}

