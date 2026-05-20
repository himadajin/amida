import React from 'react';
import { type AmidaBoardData, type Point, tracePath } from '../logic/amida';

// High-fidelity vibrant Radix Colors for the 5 users
const USER_COLORS = [
  '#e54d2e', // Tomato (Vibrant Red-Orange)
  '#ffb224', // Amber (Vibrant Yellow-Gold)
  '#29a383', // Jade (Vibrant Teal-Green)
  '#0090ff', // Blue (Vibrant Cyan-Blue)
  '#8e4ec6', // Violet (Vibrant Purple)
];

// Softer Radix palette step for disabled completed start buttons.
const USER_COLORS_LIGHT = [
  '#fdbdaf', // Tomato 6
  '#f3d673', // Amber 6
  '#acdec8', // Jade 6
  '#acd8fc', // Blue 6
  '#e0c4f4', // Purple 6
];

interface AmidaBoardProps {
  boardData: AmidaBoardData;
  participants: string[];
  results: string[];
  tracedPaths: Map<number, number>; // Map<participantCol, resultCol>
  startedPaths: Record<number, boolean>;
  activeTracings: Record<number, number>;
  startedOrder: number[]; // In chronological order of clicking start buttons
  onStartTrace: (col: number) => void;
  onChangeParticipant: (index: number, value: string) => void;
  onChangeResult: (index: number, value: string) => void;
  levelHeight: number;
}

export const AmidaBoard: React.FC<AmidaBoardProps> = ({
  boardData,
  participants,
  results,
  tracedPaths,
  startedPaths,
  activeTracings,
  startedOrder,
  onStartTrace,
  onChangeParticipant,
  onChangeResult,
  levelHeight,
}) => {
  const { cols, levels, horizontalLines } = boardData;

  // Layout parameters
  const svgWidth = 600;
  const colWidth = svgWidth / cols;
  const startX = colWidth / 2;

  const startY = 24;
  const endY = startY + (levels + 1) * levelHeight;
  const svgHeight = endY + 8;

  // Helper to convert standard grid coordinates to SVG coordinates
  const getSvgCoords = (pt: Point): { x: number; y: number } => {
    return {
      x: startX + pt.x * colWidth,
      y: startY + pt.y * levelHeight,
    };
  };

  // Helper to get partially traced path
  const getSubPath = (path: Point[], progress: number): Point[] => {
    if (progress <= 0) return [path[0]];
    if (progress >= 1) return path;

    const subPath: Point[] = [];
    const segments = [];
    let totalLength = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const dx = (p2.x - p1.x) * colWidth;
      const dy = (p2.y - p1.y) * levelHeight;
      const len = Math.sqrt(dx ** 2 + dy ** 2);
      segments.push({ p1, p2, len });
      totalLength += len;
    }

    const targetDist = progress * totalLength;
    let currentDist = 0;

    subPath.push(path[0]);

    for (const seg of segments) {
      if (currentDist + seg.len >= targetDist) {
        const segProgress = (targetDist - currentDist) / seg.len;
        subPath.push({
          x: seg.p1.x + (seg.p2.x - seg.p1.x) * segProgress,
          y: seg.p1.y + (seg.p2.y - seg.p1.y) * segProgress,
        });
        break;
      } else {
        subPath.push(seg.p2);
        currentDist += seg.len;
      }
    }
    return subPath;
  };

  // Helper to map a sequence of points (and sub-paths) to shifted SVG coordinates
  const getPathSvgPoints = (
    originalPath: Point[],
    colIdx: number,
    startedOrder: number[],
    subPath: Point[] = originalPath,
  ): { x: number; y: number }[] => {
    return subPath.map((pt) => {
      let offsetY = 0;

      // Round the y coordinate to find the nearest integer level
      const hLineY = Math.round(pt.y);

      // Check if this point is exactly at level hLineY (meaning it is on a horizontal segment or corner)
      if (Math.abs(pt.y - hLineY) < 0.001) {
        // Find if originalPath has a horizontal segment at this level
        let hLineX = -1;
        for (let i = 0; i < originalPath.length - 1; i++) {
          const p1 = originalPath[i];
          const p2 = originalPath[i + 1];
          if (p1.y === hLineY && p2.y === hLineY && p1.x !== p2.x) {
            hLineX = Math.min(p1.x, p2.x);
            break;
          }
        }

        // If a horizontal segment exists for this path at this level
        if (hLineX !== -1) {
          // Find all columns in startedOrder that traverse this same horizontal line
          const traversingCols = startedOrder.filter((c) => {
            const cPath = tracePath(boardData, c);
            return cPath.some((p, cIdx) => {
              const nextP = cPath[cIdx + 1];
              return (
                nextP && p.y === hLineY && nextP.y === hLineY && Math.min(p.x, nextP.x) === hLineX
              );
            });
          });

          const pos = traversingCols.indexOf(colIdx);
          if (pos > 0) {
            // Shift upward by 3.5px per subsequent path traversing this same horizontal line
            offsetY = pos * -3.5;
          }
        }
      }

      return {
        x: startX + pt.x * colWidth,
        y: startY + pt.y * levelHeight + offsetY,
      };
    });
  };

  // Check if a result slot is revealed
  const isResultRevealed = (resultIdx: number): boolean => {
    return Array.from(tracedPaths.values()).includes(resultIdx);
  };

  // Find which participant index is connected to a revealed result slot
  const getParticipantIndexForResult = (resultIdx: number): number | null => {
    for (const [partIdx, resIdx] of tracedPaths.entries()) {
      if (resIdx === resultIdx) {
        return partIdx;
      }
    }
    return null;
  };

  const hasAnyStarted = Object.keys(startedPaths).length > 0;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top: Participant Selection Cards */}
      <div className="w-full grid grid-cols-5 gap-0 mb-[1vh]">
        {participants.map((name, index) => {
          const userColor = USER_COLORS[index % USER_COLORS.length];

          return (
            <div
              key={`card-part-${index}`}
              className="text-center flex flex-col items-center pt-1 pb-1 px-1.5 sm:px-3 rounded-2xl w-full"
            >
              <input
                type="text"
                value={name}
                onChange={(e) => onChangeParticipant(index, e.target.value)}
                disabled={hasAnyStarted}
                maxLength={12}
                className="text-center font-bold text-xs md:text-sm bg-transparent border-b border-transparent hover:border-[var(--slate-6)] focus:border-[var(--slate-12)] outline-none w-full px-1 transition-colors disabled:opacity-85 disabled:cursor-not-allowed"
                style={{ color: userColor }}
                placeholder={String.fromCharCode(65 + index)}
              />
            </div>
          );
        })}
      </div>

      {/* Middle: SVG Amida Board */}
      <div className="w-full py-0 mb-[1.5vh] flex justify-center">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
          <defs>
            <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--slate-11)" stopOpacity="0.4" />
              <stop offset="10%" stopColor="var(--slate-11)" />
              <stop offset="90%" stopColor="var(--slate-11)" />
              <stop offset="100%" stopColor="var(--slate-11)" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Grid lines (vertical columns) */}
          {Array.from({ length: cols }).map((_, colIdx) => {
            const topPt = getSvgCoords({ x: colIdx, y: 0 });
            const botPt = getSvgCoords({ x: colIdx, y: levels + 1 });
            return (
              <line
                key={`col-${colIdx}`}
                x1={topPt.x}
                y1={topPt.y}
                x2={botPt.x}
                y2={botPt.y}
                className="amida-grid-line"
                stroke="url(#gridGrad)"
              />
            );
          })}

          {/* Horizontal lines */}
          {horizontalLines.map((line) => {
            const leftPt = getSvgCoords({ x: line.x, y: line.y });
            const rightPt = getSvgCoords({ x: line.x + 1, y: line.y });
            return (
              <line
                key={line.id}
                x1={leftPt.x}
                y1={leftPt.y}
                x2={rightPt.x}
                y2={rightPt.y}
                className="amida-horizontal-line"
              />
            );
          })}

          {/* Started Paths (both active and completed, drawn in chronological start order) */}
          {startedOrder.map((colIdx) => {
            const path = tracePath(boardData, colIdx);
            const isActive = activeTracings[colIdx] !== undefined;
            const progress = isActive ? activeTracings[colIdx] : 1;
            const subPath = getSubPath(path, progress);

            // Shift horizontal coords dynamically
            const svgPoints = getPathSvgPoints(path, colIdx, startedOrder, subPath);
            const pointsStr = svgPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');

            const tipPt = svgPoints[svgPoints.length - 1];
            const userColor = USER_COLORS[colIdx % USER_COLORS.length];

            return (
              <g key={`traced-path-${colIdx}`}>
                <polyline
                  points={pointsStr}
                  fill="none"
                  stroke={userColor}
                  strokeWidth={4.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isActive ? 'path-active' : ''}
                />

                {/* If actively tracing, render the pulsing tip indicator dot */}
                {isActive && (
                  <circle
                    cx={tipPt.x}
                    cy={tipPt.y}
                    r={6.5}
                    fill="#ffffff"
                    stroke={userColor}
                    strokeWidth={3}
                    className="pulse-glow"
                  />
                )}
              </g>
            );
          })}

          {/* Column start buttons at the top (hollow wireframe design in user colors) */}
          {Array.from({ length: cols }).map((_, colIdx) => {
            const pt = getSvgCoords({ x: colIdx, y: 0 });
            const isTraced = !!startedPaths[colIdx];
            const userColor = USER_COLORS[colIdx % USER_COLORS.length];
            const buttonColor = isTraced
              ? USER_COLORS_LIGHT[colIdx % USER_COLORS_LIGHT.length]
              : userColor;

            const isUnclickable = isTraced;
            const buttonClass = isUnclickable
              ? 'pointer-events-none outline-none -translate-y-px transition-transform duration-150'
              : 'group cursor-pointer outline-none transition-transform duration-150 hover:-translate-y-px';

            return (
              <g
                key={`top-btn-${colIdx}`}
                className={buttonClass}
                onClick={() => !isUnclickable && onStartTrace(colIdx)}
                tabIndex={isUnclickable ? -1 : 0}
                role="button"
                aria-disabled={isUnclickable}
                aria-label={isTraced ? 'たどり完了' : 'たどる'}
              >
                {/* Circular Button Background: Hollow wireframe, thicker on group hover */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={13.25}
                  fill="#ffffff"
                  stroke={buttonColor}
                  strokeWidth={3}
                  className="transition-all duration-150 group-hover:stroke-[3.3] group-hover:fill-[var(--slate-2)]"
                />

                {/* Draw Play icon (triangle) if untraced, or Checkmark if traced */}
                {!isTraced ? (
                  <g transform={`translate(${pt.x - 5}, ${pt.y - 5})`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={userColor} stroke="none">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  </g>
                ) : (
                  <g transform={`translate(${pt.x - 5}, ${pt.y - 5})`}>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={buttonColor}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </g>
                )}
              </g>
            );
          })}

          {/* Column indicators at the bottom */}
          {Array.from({ length: cols }).map((_, colIdx) => {
            const pt = getSvgCoords({ x: colIdx, y: levels + 1 });
            const participantIdx = getParticipantIndexForResult(colIdx);
            const fill =
              participantIdx === null
                ? 'var(--slate-11)'
                : USER_COLORS[participantIdx % USER_COLORS.length];

            return (
              <circle
                key={`bot-dot-${colIdx}`}
                data-testid={`bottom-dot-${colIdx}`}
                cx={pt.x}
                cy={pt.y}
                r={4.5}
                fill={fill}
                className="transition-colors duration-300"
              />
            );
          })}
        </svg>
      </div>

      {/* Bottom: Result Slots (Monochrome base theme) */}
      <div className="w-full grid grid-cols-5 gap-0 mt-[1vh]">
        {results.map((val, index) => {
          const revealed = isResultRevealed(index);
          const participantIdx = getParticipantIndexForResult(index);
          const partName = participantIdx === null ? null : participants[participantIdx];
          const participantColor =
            participantIdx === null
              ? 'var(--slate-8)'
              : USER_COLORS[participantIdx % USER_COLORS.length];

          return (
            <div
              key={`card-res-${index}`}
              className="text-center flex flex-col justify-between items-center pt-0.5 pb-2 px-1.5 sm:px-3 h-16 w-full bg-transparent border border-transparent"
            >
              {revealed && partName ? (
                <div
                  className="text-[10px] md:text-xs font-bold w-full animate-in fade-in duration-300 flex items-center justify-center py-1 -mt-1"
                  style={{ color: participantColor }}
                >
                  <span className="truncate">{partName}</span>
                </div>
              ) : (
                <div className="text-[10px] font-bold text-[var(--slate-8)] py-1 -mt-1 w-full select-none flex items-center justify-center">
                  <span className="text-xs font-bold font-outfit">?</span>
                </div>
              )}

              <input
                type="text"
                value={val}
                onChange={(e) => onChangeResult(index, e.target.value)}
                disabled={hasAnyStarted}
                maxLength={12}
                className="text-center font-extrabold text-[var(--slate-12)] text-xs md:text-sm bg-transparent border-b border-transparent hover:border-[var(--slate-6)] focus:border-[var(--slate-12)] outline-none w-full px-1 transition-colors disabled:opacity-85 disabled:cursor-not-allowed"
                placeholder={`${index + 1}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
