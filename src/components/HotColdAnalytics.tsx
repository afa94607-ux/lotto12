import React, { useMemo, useState } from 'react';
import { Flame, Snowflake, TrendingUp, BarChart3, Award, Info, Sparkles, Calendar, Clock, ShieldCheck } from 'lucide-react';
import { RoundResult } from '../types/yuki';
import { ZODIAC_ITEMS } from '../data/zodiac';

interface HotColdAnalyticsProps {
  pastResults: RoundResult[];
  lang: 'km' | 'en';
  availableDates?: string[];
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  todayDate?: string;
}

type SortMode = 'number' | 'hot' | 'cold' | 'overdue';

export const HotColdAnalytics: React.FC<HotColdAnalyticsProps> = ({
  pastResults,
  lang,
  availableDates = [],
  selectedDate = 'all',
  onSelectDate,
  todayDate,
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('hot');

  // Filter results if selectedDate is specified and not 'all'
  const displayResults = useMemo(() => {
    if (!selectedDate || selectedDate === 'all') return pastResults;
    return pastResults.filter((r) => r.drawDate === selectedDate);
  }, [pastResults, selectedDate]);

  // Compute stats for all 12 numbers across historical rounds
  const analytics = useMemo(() => {
    const totalRounds = displayResults.length;
    if (totalRounds === 0) {
      return {
        numberStats: [],
        hotNumbers: [],
        coldNumbers: [],
        totalRounds: 0,
        bigCount: 0,
        smallCount: 0,
        colorCounts: { red: 0, green: 0, blue: 0 },
        evenCount: 0,
        oddCount: 0,
      };
    }

    // Frequency map
    const counts: Record<number, number> = {};
    const lastSeenIndex: Record<number, number> = {};

    for (let i = 1; i <= 12; i++) {
      counts[i] = 0;
      lastSeenIndex[i] = -1; // -1 means never seen in history
    }

    // displayResults is ordered newest to oldest (index 0 is newest)
    displayResults.forEach((round, idx) => {
      const num = round.number;
      if (counts[num] !== undefined) {
        counts[num] += 1;
        if (lastSeenIndex[num] === -1) {
          lastSeenIndex[num] = idx;
        }
      }
    });

    // Counts for Big/Small, Colors, Even/Odd
    let bigCount = 0;
    let smallCount = 0;
    let evenCount = 0;
    let oddCount = 0;
    const colorCounts = { red: 0, green: 0, blue: 0 };

    displayResults.forEach((round) => {
      if (round.isBig) bigCount++;
      else smallCount++;

      if (round.isEven) evenCount++;
      else oddCount++;

      if (round.color === 'red') colorCounts.red++;
      else if (round.color === 'green') colorCounts.green++;
      else if (round.color === 'blue') colorCounts.blue++;
    });

    // Build array for each 1-12
    const stats = ZODIAC_ITEMS.map((item) => {
      const count = counts[item.number] || 0;
      const percentage = (count / totalRounds) * 100;
      const roundsAgo = lastSeenIndex[item.number] !== -1 ? lastSeenIndex[item.number] : totalRounds;

      return {
        ...item,
        count,
        percentage,
        roundsAgo,
      };
    });

    // Sort by count to identify Hot vs Cold thresholds
    const sortedByCount = [...stats].sort((a, b) => b.count - a.count);
    const maxCount = sortedByCount[0]?.count || 1;
    const minCount = sortedByCount[sortedByCount.length - 1]?.count || 0;

    // Hot: top 3 count, Cold: bottom 3 count (or count <= minCount + 1)
    const hotCutoff = sortedByCount[2]?.count ?? maxCount;
    const coldCutoff = sortedByCount[sortedByCount.length - 3]?.count ?? minCount;

    const decorated = stats.map((item) => {
      let status: 'hot' | 'cold' | 'neutral' = 'neutral';
      if (item.count >= hotCutoff && item.count > 0) {
        status = 'hot';
      } else if (item.count <= coldCutoff) {
        status = 'cold';
      }

      return {
        ...item,
        status,
        maxCount,
      };
    });

    const hotList = decorated.filter((d) => d.status === 'hot').sort((a, b) => b.count - a.count);
    const coldList = decorated.filter((d) => d.status === 'cold').sort((a, b) => a.count - b.count || b.roundsAgo - a.roundsAgo);

    return {
      numberStats: decorated,
      hotNumbers: hotList,
      coldNumbers: coldList,
      totalRounds,
      bigCount,
      smallCount,
      colorCounts,
      evenCount,
      oddCount,
    };
  }, [displayResults]);

  // Sorted items based on user selection
  const sortedStats = useMemo(() => {
    const list = [...analytics.numberStats];
    switch (sortMode) {
      case 'hot':
        return list.sort((a, b) => b.count - a.count || a.number - b.number);
      case 'cold':
        return list.sort((a, b) => a.count - b.count || b.roundsAgo - a.roundsAgo);
      case 'overdue':
        return list.sort((a, b) => b.roundsAgo - a.roundsAgo);
      case 'number':
      default:
        return list.sort((a, b) => a.number - b.number);
    }
  }, [analytics.numberStats, sortMode]);

  return (
    <div className="flex flex-col gap-4 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs select-none">
      {/* 24/7 Live Operation & Persistent History Assurance Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white rounded-xl p-3 sm:p-4 shadow-sm border border-blue-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                {lang === 'km' ? 'ប្រព័ន្ធដំណើរការ ២៤ម៉ោង/៧ថ្ងៃ (24/7 Continuous)' : '24/7 Live Continuous Engine'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">
              {lang === 'km'
                ? 'ប្រវត្តិទាំងអស់ត្រូវបានរក្សាទុកជាអចិន្ត្រៃយ៍ មិនបាត់បង់ទោះ Reload ឬប្តូរឧបករណ៍'
                : 'All historical draw results are preserved permanently across reloads & devices'}
            </h4>
            <p className="text-[11px] text-blue-200 mt-0.5">
              {lang === 'km'
                ? '⭐ ថ្ងៃថ្មីនាំមកនូវលទ្ធផលថ្មី — ៤៨០ វេនជារៀងរាល់ថ្ងៃ (៣នាទីម្តង) ដំណើរការឥតឈប់ឈរ'
                : '⭐ A new day brings new results — 480 live draws every 24 hours without interruption'}
            </p>
          </div>
        </div>

        {/* Date Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-blue-950/60 p-1.5 rounded-lg border border-blue-400/30 text-xs">
          <span className="text-[11px] text-blue-200 font-bold px-1.5 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            {lang === 'km' ? 'កាលបរិច្ឆេទ:' : 'Date:'}
          </span>
          <button
            onClick={() => onSelectDate && onSelectDate('all')}
            className={`px-2.5 py-1 rounded font-bold transition text-xs ${
              selectedDate === 'all'
                ? 'bg-amber-400 text-blue-950 shadow-xs'
                : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            {lang === 'km' ? 'ទាំងអស់ (All)' : 'All History'}
          </button>
          {todayDate && (
            <button
              onClick={() => onSelectDate && onSelectDate(todayDate)}
              className={`px-2.5 py-1 rounded font-bold transition text-xs flex items-center gap-1 ${
                selectedDate === todayDate
                  ? 'bg-emerald-400 text-blue-950 shadow-xs'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <span>{lang === 'km' ? 'ថ្ងៃនេះ' : 'Today'}</span>
              <span className="font-mono text-[10px]">({todayDate})</span>
            </button>
          )}
          {availableDates
            .filter((d) => d !== todayDate)
            .slice(0, 3)
            .map((d) => (
              <button
                key={`date-tab-${d}`}
                onClick={() => onSelectDate && onSelectDate(d)}
                className={`px-2 py-1 rounded font-bold font-mono transition text-xs ${
                  selectedDate === d
                    ? 'bg-amber-400 text-blue-950 shadow-xs'
                    : 'text-blue-100 hover:bg-white/10'
                }`}
              >
                {d}
              </button>
            ))}
        </div>
      </div>

      {/* 1. Header with Title & Sort Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-xs">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg text-slate-800 flex items-center gap-2">
              <span>{lang === 'km' ? 'វិភាគស្ថិតិលេខ ហត & ខូល (Hot & Cold)' : 'Hot & Cold Numbers Analytics'}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {analytics.totalRounds} {lang === 'km' ? 'វេន' : 'Rounds'}
                {selectedDate && selectedDate !== 'all' ? ` (${selectedDate})` : ''}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'km'
                ? 'តាមដានប្រេកង់នៃការចេញលេខទាំង 12 នៅក្នុងប្រវត្តិឆ្នោតដែលបានជ្រើសរើស'
                : 'Frequency and drought tracking for all 12 numbers across selected date'}
            </p>
          </div>
        </div>

        {/* Sorting Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold border border-slate-200">
          <button
            onClick={() => setSortMode('hot')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
              sortMode === 'hot' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'ចេញច្រើន (Hot)' : 'Hottest'}</span>
          </button>
          <button
            onClick={() => setSortMode('cold')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
              sortMode === 'cold' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'ចេញតិច (Cold)' : 'Coldest'}</span>
          </button>
          <button
            onClick={() => setSortMode('overdue')}
            className={`px-2.5 py-1 rounded transition ${
              sortMode === 'overdue' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{lang === 'km' ? 'ខានចេញយូរ' : 'Overdue'}</span>
          </button>
          <button
            onClick={() => setSortMode('number')}
            className={`px-2.5 py-1 rounded transition ${
              sortMode === 'number' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>1–12</span>
          </button>
        </div>
      </div>

      {/* 2. Key Insights Highlights Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Hot Champions */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 mb-1">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400" />
              {lang === 'km' ? 'លេខចេញញឹកញាប់ (Hot)' : 'Hottest Numbers'}
            </span>
            <span className="text-[10px] bg-amber-200/80 px-1.5 py-0.2 rounded font-mono">Top Pick</span>
          </div>
          <div className="flex items-center gap-2 my-1">
            {analytics.hotNumbers.slice(0, 3).map((item) => (
              <div
                key={`hot-badge-${item.number}`}
                className="flex items-center gap-1 bg-white border border-amber-300 rounded-lg px-2 py-1 shadow-xs"
              >
                <span className="font-mono font-black text-amber-900 text-sm">#{item.number}</span>
                <span className="text-[11px] font-bold text-slate-700">{item.khmerName}</span>
                <span className="text-[10px] font-mono text-orange-600 font-bold ml-0.5">({item.count}x)</span>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-amber-700/80 mt-1">
            {lang === 'km' ? 'អត្រាឈ្នះខ្ពស់ជាងមធ្យម' : 'Drawn above average frequency'}
          </span>
        </div>

        {/* Cold Numbers */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1">
            <span className="flex items-center gap-1">
              <Snowflake className="w-3.5 h-3.5 text-blue-500" />
              {lang === 'km' ? 'លេខចេញតិច (Cold)' : 'Coldest Numbers'}
            </span>
            <span className="text-[10px] bg-blue-200/80 px-1.5 py-0.2 rounded font-mono">Overdue</span>
          </div>
          <div className="flex items-center gap-2 my-1">
            {analytics.coldNumbers.slice(0, 3).map((item) => (
              <div
                key={`cold-badge-${item.number}`}
                className="flex items-center gap-1 bg-white border border-blue-200 rounded-lg px-2 py-1 shadow-xs"
              >
                <span className="font-mono font-black text-blue-900 text-sm">#{item.number}</span>
                <span className="text-[11px] font-bold text-slate-700">{item.khmerName}</span>
                <span className="text-[10px] font-mono text-blue-600 font-bold ml-0.5">({item.count}x)</span>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-blue-700/80 mt-1">
            {lang === 'km' ? 'ខានចេញយូរ អាចមានឱកាសចេញ' : 'Least drawn / long drought cycle'}
          </span>
        </div>

        {/* Big vs Small Distribution */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
            <span>{lang === 'km' ? 'ធំ 7-12 / តូច 1-6' : 'Big (7-12) vs Small (1-6)'}</span>
            <span className="font-mono text-[10px] text-slate-500">{analytics.totalRounds} Draws</span>
          </div>
          <div className="space-y-1 my-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-blue-700">Big: {Math.round((analytics.bigCount / (analytics.totalRounds || 1)) * 100)}%</span>
              <span className="text-emerald-700">Small: {Math.round((analytics.smallCount / (analytics.totalRounds || 1)) * 100)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200">
              <div
                className="bg-blue-600 h-full transition-all duration-500"
                style={{ width: `${(analytics.bigCount / (analytics.totalRounds || 1)) * 100}%` }}
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(analytics.smallCount / (analytics.totalRounds || 1)) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-500">
            {analytics.bigCount} Big ធំ | {analytics.smallCount} Small តូច
          </span>
        </div>

        {/* Color Share */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
            <span>{lang === 'km' ? 'សមាមាត្រពណ៌ (Colors)' : 'Color Share'}</span>
            <span className="text-[10px] font-mono text-slate-500">2.95x Pay</span>
          </div>
          <div className="space-y-1 my-1">
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200">
              <div
                className="bg-red-500 h-full"
                style={{ width: `${(analytics.colorCounts.red / (analytics.totalRounds || 1)) * 100}%` }}
              />
              <div
                className="bg-emerald-600 h-full"
                style={{ width: `${(analytics.colorCounts.green / (analytics.totalRounds || 1)) * 100}%` }}
              />
              <div
                className="bg-blue-600 h-full"
                style={{ width: `${(analytics.colorCounts.blue / (analytics.totalRounds || 1)) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
              <span className="text-red-600">Red {analytics.colorCounts.red}</span>
              <span className="text-emerald-700">Green {analytics.colorCounts.green}</span>
              <span className="text-blue-700">Blue {analytics.colorCounts.blue}</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">
            {lang === 'km' ? 'គូ/សេស: ' : 'Even/Odd: '}
            <span className="font-mono">{analytics.evenCount} គូ / {analytics.oddCount} សេស</span>
          </span>
        </div>
      </div>

      {/* 3. Detailed 12-Zodiac Heat Frequency Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 mt-1">
        {sortedStats.map((item) => {
          const isHot = item.status === 'hot';
          const isCold = item.status === 'cold';
          const barWidth = Math.max(8, Math.round((item.count / (item.maxCount || 1)) * 100));

          return (
            <div
              key={`hotcold-card-${item.number}`}
              className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 ${
                isHot
                  ? 'border-amber-300 bg-gradient-to-r from-amber-50/70 to-orange-50/40 shadow-xs'
                  : isCold
                  ? 'border-blue-200 bg-gradient-to-r from-blue-50/50 to-slate-50 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              {/* Card Header: Number & Animal Name */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-base text-white shadow-xs shrink-0"
                    style={{ backgroundColor: item.colorHex }}
                  >
                    #{item.number}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 leading-none">
                      <span className="font-black text-sm text-slate-900 font-khmer">{item.khmerName}</span>
                      <span className="text-xs text-slate-500">({item.englishName})</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>{item.isBig ? 'Big ធំ' : 'Small តូច'}</span>
                      <span>•</span>
                      <span style={{ color: item.colorHex }} className="font-bold">
                        {item.color.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hot / Cold / Neutral Badge */}
                <div>
                  {isHot ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                      <Flame className="w-3 h-3 fill-current" />
                      HOT
                    </span>
                  ) : isCold ? (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs">
                      <Snowflake className="w-3 h-3" />
                      COLD
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Normal
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Frequency Bar */}
              <div className="space-y-1 my-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold text-slate-700">
                    {item.count} {lang === 'km' ? 'ដង' : 'Wins'} ({item.percentage.toFixed(1)}%)
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {item.roundsAgo === 0
                      ? (lang === 'km' ? 'ទើបចេញវេននេះ' : 'Won last round')
                      : (lang === 'km' ? `ខានចេញ ${item.roundsAgo} វេន` : `${item.roundsAgo} rounds ago`)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHot
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : isCold
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
                        : 'bg-slate-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              {/* Card Footer: 11x Payout note */}
              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 font-mono text-slate-400">
                <span>{lang === 'km' ? 'សង 11 ដង' : '11x Single Payout'}</span>
                <span className="font-bold text-slate-600">
                  {item.count > 0 ? `${(analytics.totalRounds / item.count).toFixed(1)} avg gap` : 'No wins yet'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
