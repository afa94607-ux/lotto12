import React, { useState } from 'react';
import { RoundResult } from '../types/yuki';
import { TrendingUp, Flame, Waves, Scale, Zap, Info } from 'lucide-react';

interface BeadRoadTrendIndicatorProps {
  pastResults: RoundResult[];
  lang: 'km' | 'en';
}

export const BeadRoadTrendIndicator: React.FC<BeadRoadTrendIndicatorProps> = ({
  pastResults,
  lang,
}) => {
  // Configurable analysis window: last 10 draws or last 20 draws
  const [windowSize, setWindowSize] = useState<10 | 20>(10);

  // Take the recent window of draws (pastResults[0] is newest)
  const windowResults = pastResults.slice(0, windowSize);
  const total = windowResults.length || 1;

  const bigCount = windowResults.filter((r) => r.isBig).length;
  const smallCount = windowResults.filter((r) => !r.isBig).length;

  const bigPercent = Math.round((bigCount / total) * 100);
  const smallPercent = 100 - bigPercent;

  // Determine trend status
  const isPredominantlyBig = bigCount > smallCount;
  const isPredominantlySmall = smallCount > bigCount;
  const isBalanced = bigCount === smallCount;

  // Determine current active streak (consecutive same results starting from index 0)
  let activeStreakCount = 0;
  let activeStreakIsBig: boolean | null = null;
  if (pastResults.length > 0) {
    activeStreakIsBig = pastResults[0].isBig;
    for (const r of pastResults) {
      if (r.isBig === activeStreakIsBig) {
        activeStreakCount++;
      } else {
        break;
      }
    }
  }

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border bg-white shadow-xs">
      {/* 1. Header with Window Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100/70 text-blue-700">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 tracking-wide font-khmer">
              {lang === 'km' ? 'និន្នាការគ្រាប់ តូច/ធំ បច្ចុប្បន្ន' : 'Current Big/Small Bead Trend'}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium">
              {lang === 'km'
                ? `វិភាគក្នុង ${windowSize} វេនចុងក្រោយ`
                : `Analyzed over last ${windowSize} draws`}
            </span>
          </div>
        </div>

        {/* 10 vs 20 Window Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setWindowSize(10)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
              windowSize === 10
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'km' ? '១០ វេន' : 'Last 10'}
          </button>
          <button
            onClick={() => setWindowSize(20)}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
              windowSize === 20
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'km' ? '២០ វេន' : 'Last 20'}
          </button>
        </div>
      </div>

      {/* 2. Primary Visual Trend Hero Banner (Highlighting Predominantly Big or Small) */}
      <div
        className={`p-3 rounded-lg border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
          isPredominantlyBig
            ? 'bg-gradient-to-r from-pink-50 via-rose-50 to-rose-100/70 border-rose-300 text-rose-950 shadow-xs'
            : isPredominantlySmall
            ? 'bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-100/70 border-cyan-300 text-cyan-950 shadow-xs'
            : 'bg-gradient-to-r from-slate-50 via-amber-50 to-slate-100 border-amber-300 text-slate-900 shadow-xs'
        }`}
      >
        {/* Left Side: Status & Label */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              isPredominantlyBig
                ? 'bg-rose-500 text-white animate-pulse'
                : isPredominantlySmall
                ? 'bg-cyan-500 text-white animate-pulse'
                : 'bg-amber-500 text-white'
            }`}
          >
            {isPredominantlyBig ? (
              <Flame className="w-5 h-5 fill-current" />
            ) : isPredominantlySmall ? (
              <Waves className="w-5 h-5 fill-current" />
            ) : (
              <Scale className="w-5 h-5" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black tracking-wide font-khmer">
                {isPredominantlyBig
                  ? (lang === 'km' ? 'ទំនោរលទ្ធផល: «ធំ» ច្រើនជាង' : 'PREDOMINANTLY BIG TREND')
                  : isPredominantlySmall
                  ? (lang === 'km' ? 'ទំនោរលទ្ធផល: «តូច» ច្រើនជាង' : 'PREDOMINANTLY SMALL TREND')
                  : (lang === 'km' ? 'ទំនោរលទ្ធផល: ស្មើគ្នា' : 'BALANCED 50/50 TREND')}
              </span>
              <span
                className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded shadow-xs ${
                  isPredominantlyBig
                    ? 'bg-rose-600 text-white'
                    : isPredominantlySmall
                    ? 'bg-cyan-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {isPredominantlyBig
                  ? `BIG ${bigPercent}%`
                  : isPredominantlySmall
                  ? `SMALL ${smallPercent}%`
                  : '50% / 50%'}
              </span>
            </div>
            <span className="text-[11px] opacity-80 mt-0.5 font-medium leading-tight">
              {isPredominantlyBig
                ? (lang === 'km'
                    ? `លេខ ៧-១២ ចេញច្រើន (${bigCount}/${total} វេន) ក្នុង ${windowSize} វេនចុងក្រោយ`
                    : `Numbers 7-12 are dominating (${bigCount}/${total} draws) in the last ${windowSize} rounds`)
                : isPredominantlySmall
                ? (lang === 'km'
                    ? `លេខ ១-៦ ចេញច្រើន (${smallCount}/${total} វេន) ក្នុង ${windowSize} វេនចុងក្រោយ`
                    : `Numbers 1-6 are dominating (${smallCount}/${total} draws) in the last ${windowSize} rounds`)
                : (lang === 'km'
                    ? `លទ្ធផល ធំ និង តូច ចេញស្មើគ្នា (${bigCount} vs ${smallCount})`
                    : `Big and Small are currently equal (${bigCount} vs ${smallCount})`)}
            </span>
          </div>
        </div>

        {/* Right Side: Active Streak Badge */}
        {activeStreakIsBig !== null && (
          <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0">
            <span className="text-[10px] text-slate-500 font-semibold hidden md:inline">
              {lang === 'km' ? 'វេនបច្ចុប្បន្ន:' : 'Active Run:'}
            </span>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black shadow-xs font-mono border ${
                activeStreakIsBig
                  ? 'bg-rose-500 text-white border-rose-600'
                  : 'bg-cyan-500 text-white border-cyan-600'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current animate-bounce" />
              <span>
                {activeStreakIsBig
                  ? (lang === 'km' ? `ធំ x${activeStreakCount}` : `BIG x${activeStreakCount}`)
                  : (lang === 'km' ? `តូច x${activeStreakCount}` : `SMALL x${activeStreakCount}`)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Visual Ratio Bar (Cyan Small vs Rose Big) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-cyan-700 flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-cyan-500 bg-white inline-block" />
            <span>{lang === 'km' ? 'តូច SMALL (1-6)' : 'SMALL (1-6)'}</span>
            <span className="font-mono text-cyan-900">
              {smallCount} ({smallPercent}%)
            </span>
          </span>
          <span className="text-rose-700 flex items-center gap-1">
            <span className="font-mono text-rose-900">
              ({bigPercent}%) {bigCount}
            </span>
            <span>{lang === 'km' ? 'ធំ BIG (7-12)' : 'BIG (7-12)'}</span>
            <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-500 bg-white inline-block" />
          </span>
        </div>

        {/* The Split Progress Gauge */}
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 shadow-inner">
          <div
            className="h-full bg-cyan-500 transition-all duration-500 flex items-center justify-center relative"
            style={{ width: `${smallPercent}%` }}
            title={`Small: ${smallPercent}%`}
          >
            {smallPercent >= 20 && (
              <span className="text-[9px] font-mono font-black text-white px-1 leading-none drop-shadow-xs">
                {smallPercent}%
              </span>
            )}
          </div>
          <div
            className="h-full bg-rose-500 transition-all duration-500 flex items-center justify-center relative"
            style={{ width: `${bigPercent}%` }}
            title={`Big: ${bigPercent}%`}
          >
            {bigPercent >= 20 && (
              <span className="text-[9px] font-mono font-black text-white px-1 leading-none drop-shadow-xs">
                {bigPercent}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Mini Sequence of Recent Draws (Bead Trail matching photo rings) */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[10px]">
        <span className="text-slate-500 font-semibold shrink-0">
          {lang === 'km' ? 'លំដាប់ចេញចុងក្រោយ:' : 'Recent sequence:'}
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {windowResults.map((r, idx) => {
            const isLatest = idx === 0;
            return (
              <div
                key={`trend-dot-${r.roundId}-${idx}`}
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-black text-[10px] text-slate-800 bg-white shrink-0 shadow-xs border-2 transition-transform hover:scale-125 ${
                  r.isBig
                    ? 'border-[#f43f5e]'
                    : 'border-[#0ea5e9]'
                } ${isLatest ? 'ring-2 ring-amber-400 ring-offset-1' : ''}`}
                title={`Round ${r.roundId}: #${r.number} (${r.isBig ? 'Big ធំ' : 'Small តូច'})`}
              >
                {r.number}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
