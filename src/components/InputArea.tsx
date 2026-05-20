import React from 'react';
import { Users, Trophy, ChevronRight, AlertCircle } from 'lucide-react';

interface InputAreaProps {
  participants: string[];
  results: string[];
  onChangeParticipant: (index: number, value: string) => void;
  onChangeResult: (index: number, value: string) => void;
  onGenerate: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  participants,
  results,
  onChangeParticipant,
  onChangeResult,
  onGenerate,
}) => {
  // Simple validation check: no empty values allowed
  const participantErrors = participants.map((name) => name.trim() === '');
  const resultErrors = results.map((val) => val.trim() === '');
  const hasErrors = participantErrors.some((err) => err) || resultErrors.some((err) => err);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Participants Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl">
              <Users size={20} />
            </div>
            <div>
              <h2 className="font-outfit text-xl font-bold text-slate-800">参加者名 (5名)</h2>
              <p className="text-slate-400 text-xs">上部に表示されるメンバー名</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {participants.map((name, index) => (
              <div key={`part-${index}`} className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-outfit text-xs font-semibold group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-colors">
                  {String.fromCharCode(65 + index)}
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => onChangeParticipant(index, e.target.value)}
                  placeholder={`参加者 ${index + 1}`}
                  maxLength={15}
                  className={`w-full pl-13 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    participantErrors[index]
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-100 focus:border-indigo-400 focus:ring-indigo-50/50'
                  }`}
                />
                {participantErrors[index] && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-500 flex items-center" title="名前を入力してください">
                    <AlertCircle size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Results Card */}
        <div className="glass-card rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="font-outfit text-xl font-bold text-slate-800">結果・賞品 (5件)</h2>
              <p className="text-slate-400 text-xs">下部に表示される到達先の結果</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {results.map((val, index) => (
              <div key={`res-${index}`} className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-outfit text-xs font-semibold group-focus-within:bg-emerald-100 group-focus-within:text-emerald-600 transition-colors">
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onChangeResult(index, e.target.value)}
                  placeholder={`結果 ${index + 1}`}
                  maxLength={15}
                  className={`w-full pl-13 pr-4 py-3 bg-slate-50 border rounded-2xl text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    resultErrors[index]
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-slate-100 focus:border-emerald-400 focus:ring-emerald-50/50'
                  }`}
                />
                {resultErrors[index] && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-rose-500 flex items-center" title="結果を入力してください">
                    <AlertCircle size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Alert Banner */}
      {hasErrors && (
        <div className="flex items-center space-x-2 bg-rose-50 border border-rose-100 text-rose-600 px-5 py-3 rounded-2xl text-sm justify-center max-w-lg mx-auto font-medium">
          <AlertCircle size={18} />
          <span>すべての入力欄を入力してください。空欄のままでは開始できません。</span>
        </div>
      )}

      {/* Action Button */}
      <div className="text-center pt-2">
        <button
          onClick={onGenerate}
          disabled={hasErrors}
          className={`group inline-flex items-center space-x-2 px-8 py-4.5 rounded-2xl font-bold tracking-wide transition-all duration-300 shadow-lg ${
            hasErrors
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-200/50 hover:shadow-indigo-200 hover:-translate-y-0.5 cursor-pointer'
          }`}
        >
          <span className="font-outfit text-base">あみだくじを作る</span>
          <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
