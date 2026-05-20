import React from 'react';
import { Check } from 'lucide-react';
import { type AmidaBoardData, type Point, tracePath } from '../logic/amida';

interface AmidaBoardProps {
  boardData: AmidaBoardData;
  participants: string[];
  results: string[];
  tracedPaths: Map<number, number>; // Map<participantCol, resultCol>
  startedPaths: Record<number, boolean>;
  activeTracings: Record<number, number>;
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

  // Helper to convert board coordinates to SVG coordinates
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

  // Check if a result slot is revealed
  const isResultRevealed = (resultIdx: number): boolean => {
    return Array.from(tracedPaths.values()).includes(resultIdx);
  };

  // Find which participant is connected to a revealed result slot
  const getParticipantForResult = (resultIdx: number): string | null => {
    for (const [partIdx, resIdx] of tracedPaths.entries()) {
      if (resIdx === resultIdx) {
        return participants[partIdx];
      }
    }
    return null;
  };

  // Generate SVG polyline path string from Points
  const getPolylinePointsStr = (points: Point[]): string => {
    return points
      .map((pt) => {
        const coords = getSvgCoords(pt);
        return `${coords.x},${coords.y}`;
      })
      .join(' ');
  };

  const hasAnyStarted = Object.keys(startedPaths).length > 0;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top: Participant Selection Cards */}
      <div className="w-full grid grid-cols-5 gap-0 mb-[1vh]">
        {participants.map((name, index) => {
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
                className="text-center font-bold text-slate-700 text-xs md:text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full px-1 transition-colors disabled:opacity-85 disabled:cursor-not-allowed"
                placeholder={String.fromCharCode(65 + index)}
              />
            </div>
          );
        })}
      </div>

      {/* Middle: SVG Amida Board */}
      <div className="w-full py-0 mb-[1.5vh] flex justify-center">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
        >
          {/* Filters for premium glow effects */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            
            <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.4" />
              <stop offset="10%" stopColor="#e2e8f0" />
              <stop offset="90%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.4" />
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

          {/* Completed Traced Paths (Semi-transparent background paths) */}
          {Array.from(tracedPaths.keys()).map((partCol) => {
            // If this is currently being traced, don't draw the static completed path yet
            if (activeTracings[partCol] !== undefined) return null;

            const path = tracePath(boardData, partCol);
            return (
              <polyline
                key={`traced-path-${partCol}`}
                points={getPolylinePointsStr(path)}
                fill="none"
                stroke="#6366f1"
                strokeWidth={3}
                strokeOpacity={0.3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Active Tracing Paths (Can be multiple!) */}
          {Object.entries(activeTracings).map(([colStr, progress]) => {
            const colIdx = Number(colStr);
            const path = tracePath(boardData, colIdx);
            const subPath = getSubPath(path, progress);
            const tipPt = getSvgCoords(subPath[subPath.length - 1]);

            return (
              <g key={`active-trace-${colIdx}`}>
                {/* Glowing core path */}
                <polyline
                  points={getPolylinePointsStr(subPath)}
                  fill="none"
                  stroke="url(#indigoGrad)"
                  strokeWidth={5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="path-active"
                />

                {/* Pulsing indicator dot at the path tip */}
                <circle
                  cx={tipPt.x}
                  cy={tipPt.y}
                  r={7}
                  fill="#ffffff"
                  stroke="#4f46e5"
                  strokeWidth={3.5}
                  filter="url(#glow)"
                  className="pulse-glow"
                />
              </g>
            );
          })}

          {/* Column indicators / clickable action buttons at the top */}
          {Array.from({ length: cols }).map((_, colIdx) => {
            const pt = getSvgCoords({ x: colIdx, y: 0 });
            const isTraced = !!startedPaths[colIdx];

            // Define styles based on button state to match requested designs perfectly
            let circleFill = "#4f46e5"; // Indigo-600 (Play Button)
            let circleStroke = "#e0e7ff"; // Indigo-100
            let circleClass = "hover:fill-[#6366f1] transition-all"; // Hover: Indigo-500
            let iconType = "play";
            let iconColor = "#ffffff";

            if (isTraced) {
              // Traced/Completed: Light Indigo bg, subtle indigo stroke, Indigo checkmark (already pressed look)
              circleFill = "#f0f2fe"; // Indigo-50
              circleStroke = "#e0e7ff"; // Indigo-100
              circleClass = "";
              iconType = "check";
              iconColor = "#4f46e5"; // Indigo-600
            }

            const isUnclickable = isTraced;
            const buttonClass = isUnclickable
              ? "pointer-events-none outline-none"
              : "transition-all duration-150 cursor-pointer outline-none";

            return (
              <g
                key={`top-btn-${colIdx}`}
                className={buttonClass}
                onClick={() => !isUnclickable && onStartTrace(colIdx)}
                tabIndex={isUnclickable ? -1 : 0}
                role="button"
                aria-disabled={isUnclickable}
                aria-label={isTraced ? "たどり完了" : "たどる"}
              >
                {/* Circular Button Background (Appropriate Radius 12) */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={12}
                  fill={circleFill}
                  stroke={circleStroke}
                  strokeWidth={1.5}
                  className={circleClass}
                />

                {/* Centered Icons (Width 12, Height 12) */}
                {iconType === "play" && (
                  <g transform={`translate(${pt.x - 6}, ${pt.y - 6})`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={iconColor} stroke="none">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </g>
                )}

                {iconType === "check" && (
                  <g transform={`translate(${pt.x - 6}, ${pt.y - 6})`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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
            return (
              <circle
                key={`bot-dot-${colIdx}`}
                cx={pt.x}
                cy={pt.y}
                r={5}
                fill="#cbd5e1"
              />
            );
          })}
        </svg>
      </div>

      {/* Bottom: Result Slots */}
      <div className="w-full grid grid-cols-5 gap-0 mt-[1vh]">
        {results.map((val, index) => {
          const revealed = isResultRevealed(index);
          const partName = getParticipantForResult(index);

          return (
            <div
              key={`card-res-${index}`}
              className={`text-center flex flex-col justify-between items-center pt-0.5 pb-2 px-1.5 sm:px-3 h-20 w-full rounded-2xl transition-all duration-500 ${
                revealed ? 'bg-indigo-50/45' : ''
              }`}
            >
              <input
                type="text"
                value={val}
                onChange={(e) => onChangeResult(index, e.target.value)}
                disabled={hasAnyStarted}
                maxLength={12}
                className="text-center font-extrabold text-slate-800 text-xs md:text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full px-1 transition-colors disabled:opacity-85 disabled:cursor-not-allowed"
                placeholder={`${index + 1}`}
              />

              {revealed && partName ? (
                <div className="bg-indigo-50 text-indigo-700 text-[10px] md:text-xs font-bold px-2 py-1.5 rounded-xl border border-indigo-100 w-full animate-in fade-in zoom-in duration-300 flex items-center justify-center space-x-1">
                  <Check size={12} className="text-indigo-600 shrink-0" />
                  <span className="truncate">{partName}</span>
                </div>
              ) : (
                <div className="text-[10px] font-semibold text-slate-300 py-1 bg-slate-100/30 border border-slate-100/10 rounded-xl w-full select-none flex items-center justify-center">
                  <span className="text-xs font-bold font-outfit">?</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
