import React, { useState, useRef, useEffect } from 'react';
import { AmidaBoard } from './components/AmidaBoard';
import { generateAmida, tracePath, type AmidaBoardData } from './logic/amida';
import { RefreshCw, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  // Participant and Result States (initialized to defaults A-E and 1-5)
  const [participants, setParticipants] = useState<string[]>(['A', 'B', 'C', 'D', 'E']);
  const [results, setResults] = useState<string[]>(['1', '2', '3', '4', '5']);
  
  // Automatically generate Amida board on initial load
  const [boardData, setBoardData] = useState<AmidaBoardData>(() => 
    generateAmida({ cols: 5, levels: 12 })
  );
  
  const [tracedPaths, setTracedPaths] = useState<Map<number, number>>(new Map());
  const [startedPaths, setStartedPaths] = useState<Record<number, boolean>>({});
  const [activeTracings, setActiveTracings] = useState<Record<number, number>>({});
  const resetCounterRef = useRef<number>(0);

  // Dynamically calculate level height and max board width based on window height and levels
  const [levelHeight, setLevelHeight] = useState(35);
  const [boardMaxWidth, setBoardMaxWidth] = useState(600);

  useEffect(() => {
    const calculateLayout = () => {
      const H = window.innerHeight;
      
      // Dynamic padding overhead (13.5% of viewport height)
      const dynamicPadding = H * 0.135;
      // Fixed heights overhead (inputs: 32px + 80px, bottom buttons: 40px, SVG startY/endPadding: 32px)
      const fixedOverhead = 184; 
      
      const availableHeight = H - dynamicPadding - fixedOverhead;
      const levelCount = boardData.levels + 1;
      
      // Calculate level height
      const calculatedHeight = availableHeight / levelCount;
      // Clamp between 18px and 50px
      const clampedHeight = Math.max(18, Math.min(50, calculatedHeight));
      setLevelHeight(clampedHeight);

      // SVG size calculations
      const svgWidth = 600;
      const svgHeight = 24 + levelCount * clampedHeight + 8;

      // Calculate max board width to fit within availableHeight
      const calculatedWidth = availableHeight * (svgWidth / svgHeight);
      // Clamp board width between 280px and 600px
      const clampedWidth = Math.max(280, Math.min(600, calculatedWidth));
      setBoardMaxWidth(clampedWidth);
    };

    calculateLayout();
    window.addEventListener('resize', calculateLayout);
    return () => window.removeEventListener('resize', calculateLayout);
  }, [boardData.levels]);

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
    if (startedPaths[colIndex]) return;

    const path = tracePath(boardData, colIndex);
    const colWidth = 600 / boardData.cols;

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

    // Immediately mark the path as started (renders as checkmark and disables button click)
    setStartedPaths((prev) => ({
      ...prev,
      [colIndex]: true,
    }));

    let start: number | null = null;
    const currentResetCount = resetCounterRef.current;

    const animate = (timestamp: number) => {
      // Abort if board was reset or recreated
      if (resetCounterRef.current !== currentResetCount) {
        return;
      }

      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      setActiveTracings((prev) => ({
        ...prev,
        [colIndex]: progress,
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation finished
        const finalX = path[path.length - 1].x;

        // Reveal the result slot at the bottom
        setTracedPaths((prev) => {
          const next = new Map(prev);
          next.set(colIndex, finalX);
          return next;
        });

        // Clean up from active tracings
        setActiveTracings((prev) => {
          const next = { ...prev };
          delete next[colIndex];
          return next;
        });
      }
    };

    requestAnimationFrame(animate);
  };

  // Clear all tracing paths
  const handleResetTracing = () => {
    resetCounterRef.current++;
    setTracedPaths(new Map());
    setStartedPaths({});
    setActiveTracings({});
  };

  // Action: Recreate Amida board with the same inputs
  const handleRecreateBoard = () => {
    resetCounterRef.current++;
    const newBoard = generateAmida({ cols: 5, levels: 12 });
    setBoardData(newBoard);
    setTracedPaths(new Map());
    setStartedPaths({});
    setActiveTracings({});
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col justify-between items-center pt-[3vh] pb-[2vh] px-4 bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-200/30">
      <div 
        className="w-full flex-grow flex flex-col justify-center items-center pt-[2vh] animate-in fade-in duration-500"
        style={{ maxWidth: `${boardMaxWidth}px` }}
      >
        {/* Core Amida Board (direct in-place inputs inside labels) */}
        <AmidaBoard
          boardData={boardData}
          participants={participants}
          results={results}
          tracedPaths={tracedPaths}
          startedPaths={startedPaths}
          activeTracings={activeTracings}
          onStartTrace={handleStartTrace}
          onChangeParticipant={handleParticipantChange}
          onChangeResult={handleResultChange}
          levelHeight={levelHeight}
        />
      </div>

      {/* Action Options Row - Fixed at screen bottom */}
      <div 
        className="w-full flex items-center justify-center space-x-4 pt-[2vh] pb-[1vh] border-t border-slate-100/60 shrink-0"
        style={{ maxWidth: `${boardMaxWidth}px` }}
      >
        <button
          onClick={handleResetTracing}
          disabled={tracedPaths.size === 0 && Object.keys(startedPaths).length === 0}
          className={`inline-flex items-center space-x-1.5 px-5 py-3 rounded-2xl border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-600 font-bold text-xs shadow-sm transition-all ${
            tracedPaths.size === 0 && Object.keys(startedPaths).length === 0
              ? 'opacity-50 cursor-not-allowed shadow-none'
              : 'cursor-pointer hover:-translate-y-0.5'
          }`}
        >
          <RotateCcw size={13} />
          <span>リセット</span>
        </button>

        <button
          onClick={handleRecreateBoard}
          className="inline-flex items-center space-x-1.5 px-5 py-3 rounded-2xl border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-600 font-bold text-xs shadow-sm transition-all cursor-pointer hover:-translate-y-0.5"
        >
          <RefreshCw size={13} />
          <span>あみだを作り直す</span>
        </button>
      </div>
    </div>
  );
};

export default App;
