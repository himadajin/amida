import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center py-8 md:py-12 select-none">
      <h1 className="font-outfit text-4xl md:text-5xl font-extrabold tracking-tight text-slate-800">
        あみだくじ <span className="text-indigo-600">SPA</span>
      </h1>
    </header>
  );
};
