import React from 'react';
import { GitMerge } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="text-center py-8 md:py-12 select-none">
      <div className="inline-flex items-center justify-center space-x-3 mb-3 bg-white/60 px-5 py-2 rounded-full border border-slate-100 shadow-sm backdrop-blur-sm">
        <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-200">
          <GitMerge size={24} className="rotate-90" />
        </div>
        <span className="font-outfit font-bold text-xl tracking-wide bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          Amida Studio
        </span>
      </div>
      <h1 className="font-outfit text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800 mb-3">
        あみだくじ <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">SPA</span>
      </h1>
      <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base leading-relaxed px-4">
        結果までの経路を1人ずつ美しくたどる。
        <br />
        公平かつランダムに生成される、モダンなあみだくじアプリケーション。
      </p>
    </header>
  );
};
