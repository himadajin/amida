import React, { useState } from 'react';
import { AmidaBoard } from './components/AmidaBoard';
import { generateAmida, tracePath, type AmidaBoardData } from './logic/amida';
import { RefreshCw, RotateCcw, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  // Participant and Result States (initialized to defaults A-E and 1-5)
  const [participants, setParticipants] = useState<string[]>(['A', 'B', 'C', 'D', 'E']);
  const [results, setResults] = useState<string[]>(['1', '2', '3', '4', '5']);
  
  // Automatically generate Amida board on initial load
  const [boardData, setBoardData] = useState<AmidaBoardData>(() => 
    generateAmida({ cols: 5, levels: 12 })
  );
  
  const [tracedPaths, setTracedPaths] = useState<Map<number, number>>(new Map());
  const [activeTracing, setActiveTracing] = useState<{ col: number; progress: number } | null>(null);

  // Handle participant input changes in-place
  const handleParticipantChange = (index: number, value: string) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // Handle result input changes in-place
  const handleResultChange = (index: number, value: string) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // Animate the path-tracing for a participant
  const handleStartTrace = (colIndex: number) => {
    if (activeTracing !== null) return;

    const path = tracePath(boardData, colIndex);
    const colWidth = 600 / boardData.cols;
    const levelHeight = 35;

    // Calculate total physical path length in SVG pixels
    let physicalLength = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const dx = (path[i + 1].x - path[i].x) * colWidth;
      const dy = (path[i + 1].y - path[i].y) * levelHeight;
      physicalLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Fixed velocity (900 pixels per second)
    const speed = 900;
    const duration = (physicalLength / speed) * 1000;

    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      setActiveTracing({ col: colIndex, progress });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation finished
        const finalX = path[path.length - 1].x;

        setTracedPaths((prev) => {
          const next = new Map(prev);
          next.set(colIndex, finalX);
          return next;
        });
        setActiveTracing(null);
      }
    };

    requestAnimationFrame(animate);
  };

  // Clear all tracing paths
  const handleResetTracing = () => {
    setTracedPaths(new Map());
    setActiveTracing(null);
  };

  // Action: Recreate Amida board with the same inputs
  const handleRecreateBoard = () => {
    const newBoard = generateAmida({ cols: 5, levels: 12 });
    setBoardData(newBoard);
    setTracedPaths(new Map());
    setActiveTracing(null);
  };

  const isCompleted = tracedPaths.size === boardData.cols;

  return (
    <div className="min-h-screen py-8 md:py-16 flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Core Amida Board (direct in-place inputs inside labels) */}
        <AmidaBoard
          boardData={boardData}
          participants={participants}
          results={results}
          tracedPaths={tracedPaths}
          activeTracing={activeTracing}
          onStartTrace={handleStartTrace}
          onChangeParticipant={handleParticipantChange}
          onChangeResult={handleResultChange}
        />

        {/* Action Options Row */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleResetTracing}
            disabled={activeTracing !== null || tracedPaths.size === 0}
            className={`inline-flex items-center space-x-1.5 px-5 py-3 rounded-2xl border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-600 font-bold text-xs shadow-sm transition-all ${
              activeTracing !== null || tracedPaths.size === 0
                ? 'opacity-50 cursor-not-allowed shadow-none'
                : 'cursor-pointer hover:-translate-y-0.5'
            }`}
          >
            <RotateCcw size={13} />
            <span>リセット</span>
          </button>

          <button
            onClick={handleRecreateBoard}
            disabled={activeTracing !== null}
            className={`inline-flex items-center space-x-1.5 px-5 py-3 rounded-2xl border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-600 font-bold text-xs shadow-sm transition-all ${
              activeTracing !== null
                ? 'opacity-50 cursor-not-allowed shadow-none'
                : 'cursor-pointer hover:-translate-y-0.5'
            }`}
          >
            <RefreshCw size={13} />
            <span>あみだを作り直す</span>
          </button>
        </div>

        {/* Collapsible Inline Result Mappings (revealed below the board when completed) */}
        {isCompleted && (
          <div className="max-w-2xl mx-auto w-full px-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="py-6 space-y-4">
              <h3 className="font-outfit text-base font-extrabold text-slate-700 border-b border-slate-200 pb-3 text-center">
                結果一覧
              </h3>

              <div className="divide-y divide-slate-200">
                {Array.from(tracedPaths.entries())
                  .map(([partIdx, resIdx]) => ({
                    partIdx,
                    partName: participants[partIdx] || String.fromCharCode(65 + partIdx),
                    resIdx,
                    resName: results[resIdx] || `${resIdx + 1}`,
                  }))
                  .sort((a, b) => a.partIdx - b.partIdx)
                  .map((mapping, idx) => (
                     <div
                       key={`mapping-${idx}`}
                       className="flex items-center justify-between py-3.5 px-2 rounded-2xl hover:bg-slate-50/50 transition-colors"
                     >
                       <div className="flex items-center space-x-3">
                         <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold font-outfit">
                           {String.fromCharCode(65 + mapping.partIdx)}
                         </span>
                         <span className="font-bold text-slate-700 text-sm">
                           {mapping.partName}
                         </span>
                       </div>

                       <ArrowRight size={14} className="text-slate-300" />

                       <div className="flex items-center space-x-3 text-right">
                         <span className="font-extrabold text-indigo-600 text-sm">
                           {mapping.resName}
                         </span>
                         <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold font-outfit">
                           {mapping.resIdx + 1}
                         </span>
                       </div>
                     </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
