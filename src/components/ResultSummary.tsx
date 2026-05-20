import React from 'react';
import { Sparkles, ArrowRight, RotateCw, Edit, Trophy } from 'lucide-react';

interface ResultSummaryProps {
  participants: string[];
  results: string[];
  tracedPaths: Map<number, number>; // Map<participantCol, resultCol>
  onRecreate: () => void;
  onEdit: () => void;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({
  participants,
  results,
  tracedPaths,
  onRecreate,
  onEdit,
}) => {
  // Sort the final mappings by participant index
  const mappings = Array.from(tracedPaths.entries()).map(([partIdx, resIdx]) => ({
    partIdx,
    partName: participants[partIdx],
    resIdx,
    resName: results[resIdx],
  })).sort((a, b) => a.partIdx - b.partIdx);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Celebration Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 bg-amber-50 text-amber-600 rounded-3xl animate-bounce">
          <Trophy size={28} />
        </div>
        <h2 className="font-outfit text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center justify-center space-x-1.5">
          <Sparkles size={20} className="text-amber-500" />
          <span>結果が決定しました！</span>
          <Sparkles size={20} className="text-amber-500" />
        </h2>
        <p className="text-slate-400 text-xs md:text-sm">全員の経路がたどり終わりました。結果は以下の通りです。</p>
      </div>

      {/* Summary Mapping Cards */}
      <div className="glass-card rounded-3xl p-6 md:p-8 space-y-4 shadow-lg bg-white/60">
        <h3 className="font-outfit text-lg font-bold text-slate-700 border-b border-slate-100 pb-3 flex items-center space-x-2">
          <span>最終結果一覧</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {mappings.map((mapping, idx) => (
            <div
              key={`mapping-${idx}`}
              className="flex items-center justify-between py-4 group hover:bg-slate-50/50 px-2 rounded-2xl transition-colors"
            >
              <div className="flex items-center space-x-3.5">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold font-outfit">
                  {String.fromCharCode(65 + mapping.partIdx)}
                </span>
                <span className="font-bold text-slate-700 text-sm md:text-base">
                  {mapping.partName}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              <div className="flex items-center space-x-3.5 text-right">
                <span className="font-extrabold text-emerald-600 text-sm md:text-base">
                  {mapping.resName}
                </span>
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold font-outfit">
                  {mapping.resIdx + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <button
          onClick={onEdit}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all shadow-sm cursor-pointer"
        >
          <Edit size={16} />
          <span>入力を編集する</span>
        </button>

        <button
          onClick={onRecreate}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 cursor-pointer"
        >
          <RotateCw size={16} />
          <span>もう一度あみだを作る</span>
        </button>
      </div>
    </div>
  );
};
