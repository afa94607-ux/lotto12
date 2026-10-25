import React, { useState } from 'react';
import { RoundResult } from '../types/yuki';
import { LayoutGrid, ListFilter, Info, Sparkles } from 'lucide-react';

export interface StreakLine {
  id: string;
  lineIndex: number;
  isBig: boolean;
  results: RoundResult[];
}

export function groupResultsIntoBigSmallStreaks(results: RoundResult[]): StreakLine[] {
  if (!results || results.length === 0) return [];

  // In pastResults, index 0 is newest, index N-1 is oldest.
  // Chronological order: oldest to newest
  const chronological = [...results].reverse();
  const streaks: StreakLine[] = [];
  let current: StreakLine | null = null;
  let counter = 1;

  for (const r of chronological) {
    if (!current || current.isBig !== r.isBig) {
      current = {
        id: `streak-line-${counter}`,
        lineIndex: counter++,
        isBig: r.isBig,
        results: [r],
      };
      streaks.push(current);
    } else {
      current.results.push(r);
    }
  }

  return streaks;
}

interface BigSmallStreakRoadProps {
  pastResults: RoundResult[];
  onSelectRound?: (r: RoundResult) => void;
  selectedRound?: RoundResult | null;
  lang: 'km' | 'en';
}

export const BigSmallStreakRoad: React.FC<BigSmallStreakRoadProps> = ({
  pastResults,
  onSelectRound,
  selectedRound,
  lang,
}) => {
  // Default to 'matrix' which matches the user's authentic screenshot
  const [displayMode, setDisplayMode] = useState<'matrix' | 'lines'>('matrix');
  const [sortOrder, setSortOrder] = useState<'newest' | 'chronological'>('newest');

  const chronologicalStreaks = groupResultsIntoBigSmallStreaks(pastResults);
  const displayStreaks =
    sortOrder === 'newest'
      ? [...chronologicalStreaks].reverse()
      : chronologicalStreaks;

  const latestResult = pastResults[0];

  // Build standard 6-row casino Big Road matrix matching the screenshot exactly
  const NUM_ROWS = 6;
  const MIN_COLS = 18;
  const numCols = Math.max(MIN_COLS, chronologicalStreaks.length + 3);

  // Initialize 6 x numCols grid with nulls
  const grid: (RoundResult | null)[][] = Array.from({ length: NUM_ROWS }, () =>
    Array(numCols).fill(null)
  );

  chronologicalStreaks.forEach((streak, colIdx) => {
    if (colIdx < numCols) {
      streak.results.forEach((r, itemIdx) => {
        if (itemIdx < NUM_ROWS) {
          grid[itemIdx][colIdx] = r;
        } else {
          // Dragon tail turns right along bottom row if streak > 6
          const overCol = colIdx + (itemIdx - (NUM_ROWS - 1));
          if (overCol < numCols) {
            grid[NUM_ROWS - 1][overCol] = r;
          }
        }
      });
    }
  });

  return (
    <div className="flex flex-col gap-2.5">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-bold text-slate-800">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#f43f5e] bg-white inline-block" />
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#0ea5e9] bg-white inline-block" />
            <span className="font-khmer">
              {lang === 'km' ? 'តារាងគ្រាប់ លេខ / តូចធំ' : 'Big & Small Bead Road'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            {chronologicalStreaks.length} {lang === 'km' ? 'ជួរឈរ' : 'Columns'}
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded">
            <button
              onClick={() => setDisplayMode('matrix')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                displayMode === 'matrix'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Classic 6-row Casino Big Road grid"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>{lang === 'km' ? 'តារាង 2D (លេខ/តូចធំ)' : '2D Grid'}</span>
            </button>
            <button
              onClick={() => setDisplayMode('lines')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition flex items-center gap-1 ${
                displayMode === 'lines'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Show as straight horizontal lines per Big/Small outcome"
            >
              <ListFilter className="w-3 h-3" />
              <span>{lang === 'km' ? 'ជួរផ្តេក' : 'Lines'}</span>
            </button>
          </div>

          {displayMode === 'lines' && (
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === 'newest' ? 'chronological' : 'newest'))
              }
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-1 rounded transition"
            >
              {sortOrder === 'newest'
                ? (lang === 'km' ? '⚡ ថ្មីបំផុតខាងលើ' : '⚡ Newest Top')
                : (lang === 'km' ? '⏱️ លំដាប់កាលបរិច្ឆេទ' : '⏱️ Chronological')}
            </button>
          )}
        </div>
      </div>

      {/* VIEW A: AUTHENTIC 2D BIG ROAD GRID MATCHING SCREENSHOT EXACTLY */}
      {displayMode === 'matrix' ? (
        <div className="border-2 border-[#93c5fd] rounded-xl overflow-hidden bg-white shadow-xs flex flex-col">
          {/* Header Title Bar matching screenshot: "លេខ / តូចធំ" */}
          <div className="bg-[#dbeafe] text-[#1e3a8a] py-1.5 px-3 text-center font-bold text-sm sm:text-base font-khmer border-b-2 border-[#93c5fd] tracking-wider select-none flex items-center justify-center gap-2">
            <span>លេខ / តូចធំ</span>
          </div>

          {/* 6-Row Grid */}
          <div className="overflow-x-auto p-2 bg-[#f8fafc] scrollbar-thin">
            <div
              className="inline-grid border border-[#bfdbfe] bg-white rounded shadow-inner"
              style={{
                gridTemplateRows: 'repeat(6, 42px)',
                gridTemplateColumns: `repeat(${numCols}, 42px)`,
              }}
            >
              {Array.from({ length: NUM_ROWS }).map((_, rIdx) =>
                Array.from({ length: numCols }).map((__, cIdx) => {
                  const cell = grid[rIdx][cIdx];
                  const isLatest = cell && cell.roundId === latestResult?.roundId;
                  const isSelected = cell && selectedRound?.roundId === cell.roundId;

                  return (
                    <div
                      key={`grid-cell-${rIdx}-${cIdx}`}
                      onClick={() => cell && onSelectRound && onSelectRound(cell)}
                      className={`w-[42px] h-[42px] border-r border-b border-[#bfdbfe] flex items-center justify-center transition-colors relative ${
                        cell ? 'cursor-pointer hover:bg-blue-50/70' : 'bg-white'
                      }`}
                    >
                      {cell && (
                        <div
                          className={`w-[36px] h-[36px] rounded-full bg-white flex items-center justify-center font-black font-mono leading-none text-slate-900 border-[3.5px] transition-transform hover:scale-115 relative shadow-xs ${
                            cell.isBig
                              ? 'border-[#f43f5e]' // Pink/Magenta ring for Big (7-12)
                              : 'border-[#0ea5e9]' // Cyan/Sky ring for Small (1-6)
                          } ${
                            isSelected
                              ? 'ring-4 ring-yellow-400 scale-110'
                              : isLatest
                              ? 'ring-2 ring-amber-400 ring-offset-1 animate-pulse'
                              : ''
                          }`}
                          style={{ fontSize: '20px' }}
                          title={`Round: ${cell.roundId}\nTime: ${cell.drawTime}\n#${cell.number} (${cell.khmerName})\n${cell.isBig ? 'Big ធំ' : 'Small តូច'}`}
                        >
                          {cell.number}

                          {/* Latest indicator */}
                          {isLatest && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white animate-ping" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW B: STRAIGHT HORIZONTAL LINES */
        <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
          {displayStreaks.map((streak) => {
            const isBig = streak.isBig;
            const isLatestStreak = streak.results.some((r) => r.roundId === latestResult?.roundId);

            return (
              <div
                key={streak.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg border transition-all ${
                  isBig
                    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                    : 'bg-cyan-50/60 border-cyan-200 hover:border-cyan-300'
                } ${isLatestStreak ? 'ring-2 ring-amber-400/80 shadow-xs' : ''}`}
              >
                {/* Line Tag */}
                <div className="flex items-center justify-between sm:justify-start gap-2 sm:w-44 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-black tracking-wide flex items-center gap-1 shadow-xs ${
                        isBig
                          ? 'bg-rose-600 text-white'
                          : 'bg-cyan-600 text-white'
                      }`}
                    >
                      <span>{isBig ? '🔴' : '🔵'}</span>
                      <span>{isBig ? (lang === 'km' ? 'ធំ BIG' : 'BIG') : (lang === 'km' ? 'តូច SMALL' : 'SMALL')}</span>
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-500">
                      {isBig ? '(7-12)' : '(1-6)'}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      isBig
                        ? 'bg-rose-100 text-rose-900 border-rose-200'
                        : 'bg-cyan-100 text-cyan-900 border-cyan-200'
                    }`}
                  >
                    {streak.results.length} {lang === 'km' ? 'គ្រាប់' : 'draws'}
                  </span>
                </div>

                {/* Number beads in straight line */}
                <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 bg-white/90 rounded-md border border-slate-200/80 flex-1 shadow-inner scrollbar-thin">
                  {streak.results.map((r, idx) => {
                    const isLatest = r.roundId === latestResult?.roundId;
                    const isSelected = selectedRound?.roundId === r.roundId;

                    return (
                      <div
                        key={`line-item-${r.roundId}-${idx}`}
                        onClick={() => onSelectRound && onSelectRound(r)}
                        className="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer group"
                        title={`Round: ${r.roundId}\n#${r.number} (${r.isBig ? 'Big ធំ' : 'Small តូច'})`}
                      >
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center font-black leading-none font-mono border-[3.5px] shadow-sm transition-all transform group-hover:scale-110 relative text-slate-900 ${
                            r.isBig ? 'border-[#f43f5e]' : 'border-[#0ea5e9]'
                          } ${
                            isSelected
                              ? 'ring-4 ring-yellow-400 scale-105'
                              : isLatest
                              ? 'ring-3 ring-amber-400 ring-offset-1 animate-pulse'
                              : ''
                          }`}
                          style={{ fontSize: '20px' }}
                        >
                          {r.number}
                          {isLatest && (
                            <span className="absolute -top-1.5 -right-1 bg-yellow-400 text-blue-950 text-[8px] font-black px-1 rounded-full border border-yellow-200 leading-tight">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 group-hover:text-slate-800 font-semibold">
                          {r.drawTime}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
