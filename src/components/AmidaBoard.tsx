import React from 'react';
import { Play, RotateCcw, Check } from 'lucide-react';
import { type AmidaBoardData, type Point, tracePath } from '../logic/amida';

interface AmidaBoardProps {
  boardData: AmidaBoardData;
  participants: string[];
  results: string[];
  tracedPaths: Map<number, number>; // Map<participantCol, resultCol>
  activeTracing: { col: number; progress: number } | null;
  onStartTrace: (col: number) => void;
  onChangeParticipant: (index: number, value: string) => void;
  onChangeResult: (index: number, value: string) => void;
}

export const AmidaBoard: React.FC<AmidaBoardProps> = ({
  boardData,
  participants,
  results,
  tracedPaths,
  activeTracing,
  onStartTrace,
  onChangeParticipant,
  onChangeResult,
}) => {
  const { cols, levels, horizontalLines } = boardData;

  // Layout parameters
  const svgWidth = 600;
  const colWidth = svgWidth / cols;
  const startX = colWidth / 2;

  const startY = 60;
  const levelHeight = 35;
  const endY = startY + (levels + 1) * levelHeight;
  const svgHeight = endY + 70;

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
      const len = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
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

  return (
    <div className="w-full max-w-2xl mx-auto px-4 flex flex-col items-center">
      {/* Top: Participant Selection Cards */}
      <div className="w-full grid grid-cols-5 gap-0 mb-6">
        {participants.map((name, index) => {
          const isTraced = tracedPaths.has(index);
          const isActive = activeTracing?.col === index;
          const isAnyTracing = activeTracing !== null;

          return (
            <div
              key={`card-part-${index}`}
              className={`text-center flex flex-col items-center justify-between py-2 px-1.5 sm:px-3 transition-all duration-300 rounded-2xl ${
                isActive ? 'bg-indigo-50/45' : ''
              }`}
            >
              <div className="flex flex-col items-center space-y-1 mb-2.5 w-full">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold font-outfit">
                  {String.fromCharCode(65 + index)}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onChangeParticipant(index, e.target.value)}
                  disabled={isAnyTracing}
                  maxLength={12}
                  className="text-center font-bold text-slate-700 text-xs md:text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full px-1 transition-colors disabled:opacity-85 disabled:cursor-not-allowed"
                  placeholder={String.fromCharCode(65 + index)}
                />
              </div>

              <button
                onClick={() => onStartTrace(index)}
                disabled={isAnyTracing}
                className={`w-full py-1.5 px-2 rounded-xl flex items-center justify-center space-x-1 text-[11px] font-bold transition-all shadow-sm ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 cursor-not-allowed'
                    : isTraced
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer'
                    : isAnyTracing
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-100 cursor-pointer hover:-translate-y-0.5'
                }`}
              >
                {isActive ? (
                  <span className="flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                    <span>たどり中</span>
                  </span>
                ) : isTraced ? (
                  <>
                    <RotateCcw size={11} />
                    <span className="hidden sm:inline">もう一度</span>
                  </>
                ) : (
                  <>
                    <Play size={10} fill="currentColor" />
                    <span>たどる</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Middle: SVG Amida Board */}
      <div className="w-full py-4 mb-6 flex justify-center">
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
            // If this is currently being traced, don't draw the static completed path
            if (activeTracing?.col === partCol) return null;

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

          {/* Active Tracing Path */}
          {activeTracing !== null && (
            (() => {
              const path = tracePath(boardData, activeTracing.col);
              const subPath = getSubPath(path, activeTracing.progress);
              const tipPt = getSvgCoords(subPath[subPath.length - 1]);

              return (
                <g>
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
            })()
          )}

          {/* Column indicators at the top */}
          {Array.from({ length: cols }).map((_, colIdx) => {
            const pt = getSvgCoords({ x: colIdx, y: 0 });
            return (
              <circle
                key={`top-dot-${colIdx}`}
                cx={pt.x}
                cy={pt.y}
                r={5}
                fill="#cbd5e1"
              />
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
      <div className="w-full grid grid-cols-5 gap-0 mt-2">
        {results.map((val, index) => {
          const revealed = isResultRevealed(index);
          const partName = getParticipantForResult(index);

          return (
            <div
              key={`card-res-${index}`}
              className={`text-center flex flex-col justify-between items-center py-2 px-1.5 sm:px-3 h-28 w-full rounded-2xl transition-all duration-500 ${
                revealed ? 'bg-indigo-50/45' : ''
              }`}
            >
              <div className="flex flex-col items-center space-y-0.5 w-full">
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold font-outfit">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onChangeResult(index, e.target.value)}
                  disabled={activeTracing !== null}
                  maxLength={12}
                  className="text-center font-extrabold text-slate-800 text-xs md:text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none w-full px-1 transition-colors disabled:opacity-85 disabled:cursor-not-allowed"
                  placeholder={`${index + 1}`}
                />
              </div>

              {revealed && partName ? (
                <div className="bg-indigo-50 text-indigo-700 text-[10px] md:text-xs font-bold px-2 py-1.5 rounded-xl border border-indigo-100 w-full animate-in fade-in zoom-in duration-300 flex items-center justify-center space-x-1">
                  <Check size={12} className="text-indigo-600 shrink-0" />
                  <span className="truncate">{partName}</span>
                </div>
              ) : (
                <div className="text-[10px] font-semibold text-slate-300 py-1 bg-slate-100/30 border border-slate-100/10 rounded-xl w-full select-none flex items-center justify-center">
                  <span>未到達</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
