import React, { useState, useRef } from 'react';
import { AmidaBoard } from './components/AmidaBoard';
import { generateAmida, tracePath, type AmidaBoardData } from './logic/amida';

const App: React.FC = () => {
  // Participant and Result States (initialized to defaults A-E and 1-5)
  const [participants, setParticipants] = useState<string[]>(['A', 'B', 'C', 'D', 'E']);
  const [results, setResults] = useState<string[]>(['1', '2', '3', '4', '5']);

  // Automatically generate Amida board on initial load
  const [boardData, setBoardData] = useState<AmidaBoardData>(() =>
    generateAmida({ cols: 5, levels: 12 }),
  );

  const [tracedPaths, setTracedPaths] = useState<Map<number, number>>(new Map());
  const [startedPaths, setStartedPaths] = useState<Record<number, boolean>>({});
  const [activeTracings, setActiveTracings] = useState<Record<number, number>>({});
  const [startedOrder, setStartedOrder] = useState<number[]>([]); // Track order of clicking start buttons
  const resetCounterRef = useRef<number>(0);

  // Core layout metrics - entirely CSS-driven and evaluated by the browser natively
  const levelHeight = 40;
  const svgHeight = 24 + (boardData.levels + 1) * levelHeight + 8;
  const aspectRatio = 600 / svgHeight;
  const boardMaxWidthCSS = `min(600px, max(280px, calc((85vh - 160px) * ${aspectRatio})))`;

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

    // Fixed velocity (500 pixels per second)
    const speed = 500;
    const duration = (physicalLength / speed) * 1000;

    // Immediately mark the path as started (renders as checkmark and disables button click)
    setStartedPaths((prev) => ({
      ...prev,
      [colIndex]: true,
    }));

    // Ensure the first render after clicking starts at the top instead of
    // briefly treating the path as completed before requestAnimationFrame runs.
    setActiveTracings((prev) => ({
      ...prev,
      [colIndex]: 0,
    }));

    // Record the start order
    setStartedOrder((prev) => [...prev, colIndex]);

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
    setStartedOrder([]);
  };

  // Action: Recreate Amida board with the same inputs
  const handleRecreateBoard = () => {
    resetCounterRef.current++;
    const newBoard = generateAmida({ cols: 5, levels: 12 });
    setBoardData(newBoard);
    setTracedPaths(new Map());
    setStartedPaths({});
    setActiveTracings({});
    setStartedOrder([]);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col justify-between items-center pt-[3vh] pb-[2vh] px-4 bg-[var(--slate-2)]">
      <div
        className="w-full flex-grow flex flex-col justify-center items-center pt-[2vh] animate-in fade-in duration-500"
        style={{ maxWidth: boardMaxWidthCSS }}
      >
        {/* Core Amida Board (direct in-place inputs inside labels) */}
        <AmidaBoard
          boardData={boardData}
          participants={participants}
          results={results}
          tracedPaths={tracedPaths}
          startedPaths={startedPaths}
          activeTracings={activeTracings}
          startedOrder={startedOrder}
          onStartTrace={handleStartTrace}
          onChangeParticipant={handleParticipantChange}
          onChangeResult={handleResultChange}
          levelHeight={levelHeight}
        />
      </div>

      {/* Action Options Row - Fixed at screen bottom */}
      <div
        className="w-full grid grid-cols-2 gap-3 pt-[2vh] pb-[1vh] border-t border-[var(--slate-6)] shrink-0"
        style={{ maxWidth: boardMaxWidthCSS }}
      >
        <button
          onClick={handleResetTracing}
          disabled={tracedPaths.size === 0 && Object.keys(startedPaths).length === 0}
          className={`inline-flex h-11 w-full items-center justify-center whitespace-nowrap px-3 rounded-2xl border border-[var(--slate-6)] bg-[var(--slate-1)] text-[var(--slate-11)] font-bold text-xs shadow-sm transition-[background-color,transform,box-shadow,opacity] duration-200 ${
            tracedPaths.size === 0 && Object.keys(startedPaths).length === 0
              ? 'opacity-40 cursor-not-allowed shadow-none'
              : 'cursor-pointer hover:bg-[var(--slate-3)] active:bg-[var(--slate-4)] hover:-translate-y-0.5'
          }`}
        >
          <span>Reset</span>
        </button>

        <button
          onClick={handleRecreateBoard}
          className="inline-flex h-11 w-full items-center justify-center whitespace-nowrap px-3 rounded-2xl border border-[var(--slate-6)] bg-[var(--slate-1)] hover:bg-[var(--slate-3)] active:bg-[var(--slate-4)] text-[var(--slate-11)] font-bold text-xs shadow-sm transition-[background-color,transform,box-shadow] duration-200 cursor-pointer hover:-translate-y-0.5"
        >
          <span>Shuffle</span>
        </button>
      </div>
    </div>
  );
};

export default App;
