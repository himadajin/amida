import React, { useState } from 'react';
import { Header } from './components/Header';
import { InputArea } from './components/InputArea';
import { AmidaBoard } from './components/AmidaBoard';
import { ResultSummary } from './components/ResultSummary';
import { generateAmida, tracePath, type AmidaBoardData } from './logic/amida';
import { Edit2, RefreshCw } from 'lucide-react';

type Step = 'input' | 'generated' | 'completed';

const App: React.FC = () => {
  const [step, setStep] = useState<Step>('input');
  
  // Participant and Result States (initialized to defaults A-E and 1-5)
  const [participants, setParticipants] = useState<string[]>(['A', 'B', 'C', 'D', 'E']);
  const [results, setResults] = useState<string[]>(['1', '2', '3', '4', '5']);
  
  const [boardData, setBoardData] = useState<AmidaBoardData | null>(null);
  const [tracedPaths, setTracedPaths] = useState<Map<number, number>>(new Map());
  const [activeTracing, setActiveTracing] = useState<{ col: number; progress: number } | null>(null);

  // Handle participant input changes
  const handleParticipantChange = (index: number, value: string) => {
    setParticipants((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // Handle result input changes
  const handleResultChange = (index: number, value: string) => {
    setResults((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  // Generate a brand new Amidakuji board
  const handleGenerateBoard = () => {
    // 5 vertical lines, 12 levels of potential horizontal connections
    const newBoard = generateAmida({ cols: 5, levels: 12 });
    setBoardData(newBoard);
    setTracedPaths(new Map());
    setActiveTracing(null);
    setStep('generated');
  };

  // Animate the path-tracing for a participant
  const handleStartTrace = (colIndex: number) => {
    if (activeTracing !== null || !boardData) return;

    let start: number | null = null;
    const duration = 2200; // Smooth 2.2 seconds tracing

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);

      setActiveTracing({ col: colIndex, progress });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation finished
        const path = tracePath(boardData, colIndex);
        const finalX = path[path.length - 1].x;

        setTracedPaths((prev) => {
          const next = new Map(prev);
          next.set(colIndex, finalX);

          // If all participants have been traced, transition to completed step
          if (next.size === boardData.cols) {
            setStep('completed');
          }
          return next;
        });
        setActiveTracing(null);
      }
    };

    requestAnimationFrame(animate);
  };

  // Action: Reset/Edit Inputs
  const handleEditInputs = () => {
    setStep('input');
    // Keep boardData intact but reset tracing states
    setTracedPaths(new Map());
    setActiveTracing(null);
  };

  // Action: Recreate Amida board with the same inputs
  const handleRecreateBoard = () => {
    handleGenerateBoard();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between pb-12">
      <div className="flex-grow">
        {/* Header Component */}
        <Header />

        {/* Dynamic Views based on State */}
        {step === 'input' && (
          <InputArea
            participants={participants}
            results={results}
            onChangeParticipant={handleParticipantChange}
            onChangeResult={handleResultChange}
            onGenerate={handleGenerateBoard}
          />
        )}

        {step === 'generated' && boardData && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <AmidaBoard
              boardData={boardData}
              participants={participants}
              results={results}
              tracedPaths={tracedPaths}
              activeTracing={activeTracing}
              onStartTrace={handleStartTrace}
            />

            {/* Mid-stage options row */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleEditInputs}
                disabled={activeTracing !== null}
                className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-600 font-bold text-xs shadow-sm transition-all ${
                  activeTracing !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <Edit2 size={12} />
                <span>入力を編集する</span>
              </button>

              <button
                onClick={handleRecreateBoard}
                disabled={activeTracing !== null}
                className={`inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-600 font-bold text-xs shadow-sm transition-all ${
                  activeTracing !== null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <RefreshCw size={12} />
                <span>あみだを作り直す</span>
              </button>
            </div>
          </div>
        )}

        {step === 'completed' && boardData && (
          <div className="space-y-12">
            {/* Celebration Summary Card */}
            <ResultSummary
              participants={participants}
              results={results}
              tracedPaths={tracedPaths}
              onRecreate={handleRecreateBoard}
              onEdit={handleEditInputs}
            />

            {/* Visual Board Review */}
            <div className="pt-4 border-t border-slate-200/50 max-w-4xl mx-auto w-full">
              <div className="text-center mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  あみだくじ経路のふりかえり
                </span>
              </div>
              <AmidaBoard
                boardData={boardData}
                participants={participants}
                results={results}
                tracedPaths={tracedPaths}
                activeTracing={null}
                onStartTrace={handleStartTrace}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modern Footer */}
      <footer className="text-center text-slate-400 text-xs mt-16 select-none font-outfit">
        &copy; {new Date().getFullYear()} Amida Studio. Crafted for absolute fairness.
      </footer>
    </div>
  );
};

export default App;
