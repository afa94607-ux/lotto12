import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Database,
  CheckCircle2,
  Table as TableIcon,
  LayoutGrid,
  TrendingUp,
  BarChart3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Sparkles,
  Flame,
  Award,
} from 'lucide-react';
import { RoundResult } from '../types/yuki';
import { ZODIAC_ITEMS } from '../data/zodiac';
import { HotColdAnalytics } from './HotColdAnalytics';
import { BigSmallStreakRoad } from './BigSmallStreakRoad';

interface ResultsHistoryManagerProps {
  pastResults: RoundResult[];
  availableDates: string[];
  todayDate: string;
  lang: 'km' | 'en';
  onRefreshHistory?: () => void;
  onBackToBoard?: () => void;
}

type ViewMode = 'cards' | 'table' | 'beadroad' | 'analytics';

export const ResultsHistoryManager: React.FC<ResultsHistoryManagerProps> = ({
  pastResults,
  availableDates,
  todayDate,
  lang,
  onRefreshHistory,
  onBackToBoard,
}) => {
  // Filters state
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [selectedBigSmall, setSelectedBigSmall] = useState<'all' | 'big' | 'small'>('all');
  const [selectedColor, setSelectedColor] = useState<'all' | 'red' | 'green' | 'blue'>('all');
  const [selectedParity, setSelectedParity] = useState<'all' | 'even' | 'odd'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [pageSize, setPageSize] = useState<number>(48);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Recent results (latest 20 draws)
  const recentDraws = useMemo(() => {
    return pastResults.slice(0, 15);
  }, [pastResults]);

  // Filtered results
  const filteredResults = useMemo(() => {
    let list = [...pastResults];

    // Filter by date
    if (selectedDate !== 'all') {
      list = list.filter((r) => r.drawDate === selectedDate);
    }

    // Filter by number (1-12)
    if (selectedNumber !== null) {
      list = list.filter((r) => r.number === selectedNumber);
    }

    // Filter by Big / Small
    if (selectedBigSmall === 'big') {
      list = list.filter((r) => r.isBig);
    } else if (selectedBigSmall === 'small') {
      list = list.filter((r) => !r.isBig);
    }

    // Filter by Color
    if (selectedColor !== 'all') {
      list = list.filter((r) => r.color === selectedColor);
    }

    // Filter by Parity (Even / Odd)
    if (selectedParity === 'even') {
      list = list.filter((r) => r.isEven);
    } else if (selectedParity === 'odd') {
      list = list.filter((r) => !r.isEven);
    }

    // Search query (Round ID or animal name)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => {
        const round = (r.roundId || '').toLowerCase();
        const khmer = (r.khmerName || '').toLowerCase();
        const english = (r.englishName || '').toLowerCase();
        const numStr = r.number.toString();
        return (
          round.includes(q) ||
          khmer.includes(q) ||
          english.includes(q) ||
          numStr === q
        );
      });
    }

    // Sort order
    if (sortOrder === 'oldest') {
      list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    } else {
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    return list;
  }, [
    pastResults,
    selectedDate,
    selectedNumber,
    selectedBigSmall,
    selectedColor,
    selectedParity,
    searchQuery,
    sortOrder,
  ]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, selectedNumber, selectedBigSmall, selectedColor, selectedParity, searchQuery, sortOrder]);

  // Pagination calculation
  const totalItems = filteredResults.length;
  const effectivePageSize = pageSize === -1 ? totalItems : pageSize;
  const totalPages = effectivePageSize > 0 ? Math.ceil(totalItems / effectivePageSize) : 1;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const paginatedResults = pageSize === -1 ? filteredResults : filteredResults.slice(startIndex, startIndex + effectivePageSize);

  // Quick statistics for current filtered view
  const stats = useMemo(() => {
    const total = filteredResults.length;
    if (total === 0) return null;
    let bigCount = 0;
    let smallCount = 0;
    let evenCount = 0;
    let oddCount = 0;
    const colorCounts = { red: 0, green: 0, blue: 0 };

    filteredResults.forEach((r) => {
      if (r.isBig) bigCount++;
      else smallCount++;
      if (r.isEven) evenCount++;
      else oddCount++;
      if (r.color === 'red') colorCounts.red++;
      else if (r.color === 'green') colorCounts.green++;
      else if (r.color === 'blue') colorCounts.blue++;
    });

    return {
      total,
      bigCount,
      smallCount,
      bigPercent: Math.round((bigCount / total) * 100),
      smallPercent: Math.round((smallCount / total) * 100),
      evenCount,
      oddCount,
      evenPercent: Math.round((evenCount / total) * 100),
      oddPercent: Math.round((oddCount / total) * 100),
      colorCounts,
      redPercent: Math.round((colorCounts.red / total) * 100),
      greenPercent: Math.round((colorCounts.green / total) * 100),
      bluePercent: Math.round((colorCounts.blue / total) * 100),
    };
  }, [filteredResults]);

  // Export handlers
  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const url = `/api/results/export?format=${format}&date=${selectedDate}`;
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `yuki12_history_${selectedDate}_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        // Client fallback export
        const content =
          format === 'json'
            ? JSON.stringify(filteredResults, null, 2)
            : [
                'Round ID,Draw Date,Draw Time,Number,Khmer Name,English Name,Big/Small,Even/Odd,Color',
                ...filteredResults.map(
                  (r) =>
                    `"${r.roundId}","${r.drawDate}","${r.drawTime}",${r.number},"${r.khmerName}","${r.englishName}",${
                      r.isBig ? 'Big' : 'Small'
                    },${r.isEven ? 'Even' : 'Odd'},"${r.color}"`
                ),
              ].join('\n');
        const blob = new Blob([content], {
          type: format === 'json' ? 'application/json' : 'text/csv',
        });
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `yuki12_history_local_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch {
      // ignore
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-12">
      {/* 1. Header & Permanent Storage Guarantee Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white rounded-xl p-4 sm:p-5 shadow-sm border border-blue-700/50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-blue-950 font-black flex items-center justify-center text-xl shadow-inner border border-amber-300">
            <Database className="w-6 h-6 text-blue-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-wide font-khmer">
                {lang === 'km' ? 'ប្រវត្តិលទ្ធផលចេញទាំងអស់ & ថ្មីៗ' : 'Draw Results History & Archive'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{lang === 'km' ? 'រក្សាទុកអចិន្ត្រៃយ៍' : 'Permanently Preserved'}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-200 mt-0.5 font-khmer">
              {lang === 'km'
                ? 'ទិន្នន័យត្រូវបានរក្សាទុកជាអចិន្ត្រៃយ៍លើ Server និង Browser ទោះបីជា Reload ឬបិទកុំព្យូទ័រក៏មិនបាត់បង់ដែរ'
                : 'All historical and recent results are permanently preserved across reloads and device restarts.'}
            </p>
          </div>
        </div>

        {/* Action Controls & Total Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-blue-200 block font-bold">
                {lang === 'km' ? 'ប្រវត្តិសរុបទាំងអស់' : 'Total Records'}
              </span>
              <span className="text-base font-black font-mono text-amber-300">
                {pastResults.length.toLocaleString()} {lang === 'km' ? 'វេន' : 'Rounds'}
              </span>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-blue-200 block font-bold">
                {lang === 'km' ? 'ថ្ងៃនេះ' : 'Today'}
              </span>
              <span className="text-base font-black font-mono text-emerald-300">
                {pastResults.filter((r) => r.drawDate === todayDate).length} {lang === 'km' ? 'វេន' : 'Rounds'}
              </span>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2 rounded-lg border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
              title="Download full JSON history"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-3 py-2 rounded-lg border border-white/20 flex items-center gap-1.5 transition cursor-pointer"
              title="Download CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            {onRefreshHistory && (
              <button
                onClick={onRefreshHistory}
                className="bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-bold px-3 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                title="Refresh from server"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'km' ? 'ទាញយកឡើងវិញ' : 'Sync'}</span>
              </button>
            )}
            {onBackToBoard && (
              <button
                onClick={onBackToBoard}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition cursor-pointer"
              >
                {lang === 'km' ? 'ត្រឡប់ទៅក្ដារឆ្នោត' : 'Back to Board'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Recent Draws Live Spotlight (លទ្ធផលថ្មីៗ ១៥ វេនចុងក្រោយ) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide font-khmer">
              {lang === 'km' ? 'លទ្ធផលថ្មីៗ ១៥ វេនចុងក្រោយ' : 'Recent 15 Draws (Live Feed)'}
            </h2>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-mono">
              Live
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {lang === 'km' ? 'វេនចុងក្រោយបង្អស់' : 'Latest round'}:{' '}
            <strong className="text-blue-700">{pastResults[0]?.roundId || 'N/A'}</strong> ({pastResults[0]?.drawTime || '--:--'})
          </span>
        </div>

        {/* Horizontal scrollable recent cards */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 smooth-scroll-area">
          {recentDraws.map((r, idx) => {
            const isLatest = idx === 0;
            const colorClass =
              r.color === 'red'
                ? 'border-red-300 bg-red-50/60 text-red-900'
                : r.color === 'green'
                ? 'border-emerald-300 bg-emerald-50/60 text-emerald-900'
                : 'border-blue-300 bg-blue-50/60 text-blue-900';

            return (
              <div
                key={`recent-${r.drawDate}-${r.roundId}-${idx}`}
                onClick={() => {
                  setSearchQuery(r.roundId);
                }}
                className={`shrink-0 w-[145px] p-2.5 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  isLatest
                    ? 'border-amber-400 bg-amber-50/90 shadow-sm ring-2 ring-amber-300/60'
                    : colorClass
                }`}
              >
                {/* Header: Round ID & Time */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 mb-1">
                  <span className="font-bold text-blue-900">{r.roundId}</span>
                  <span className="text-[10px] text-slate-500">{r.drawTime}</span>
                </div>

                {/* Winning Number & Animal */}
                <div className="flex items-center justify-between my-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-slate-900">
                      #{r.number}
                    </span>
                    <span className="text-xs font-bold font-khmer text-slate-800 truncate">
                      {r.khmerName}
                    </span>
                  </div>
                  {isLatest && (
                    <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded-full uppercase animate-pulse">
                      New
                    </span>
                  )}
                </div>

                {/* Category Pills (Big/Small, Parity, Color) */}
                <div className="flex items-center gap-1 text-[10px] font-bold mt-1.5">
                  <span
                    className={`px-1.5 py-0.2 rounded text-white ${
                      r.isBig ? 'bg-rose-500' : 'bg-cyan-500'
                    }`}
                  >
                    {r.isBig ? (lang === 'km' ? 'ធំ' : 'Big') : lang === 'km' ? 'តូច' : 'Small'}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-white ${
                      r.color === 'red'
                        ? 'bg-red-500'
                        : r.color === 'green'
                        ? 'bg-emerald-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    {r.color}
                  </span>
                  <span className="px-1 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-mono">
                    {r.isEven ? (lang === 'km' ? 'គូ' : 'Even') : lang === 'km' ? 'សេស' : 'Odd'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Comprehensive Past History Explorer */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col gap-4">
        {/* Navigation & View Mode Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 font-khmer flex items-center gap-2">
              <span>{lang === 'km' ? 'ប័ណ្ណសារប្រវត្តិលទ្ធផលទាំងអស់' : 'All Historical Draw Archive'}</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {totalItems.toLocaleString()} {lang === 'km' ? 'វេន' : 'Records'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-khmer mt-0.5">
              {lang === 'km'
                ? 'ស្វែងរក និងច្រោះលទ្ធផលតាមកាលបរិច្ឆេទ លេខសត្វ ១២ ឬប្រភេទភ្នាល់'
                : 'Browse, search, and filter results by date, zodiac number, and category.'}
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'កាត' : 'Cards'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'តារាង' : 'Table'}</span>
            </button>
            <button
              onClick={() => setViewMode('beadroad')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                viewMode === 'beadroad'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'តារាងគ្រាប់' : 'Bead Road'}</span>
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
                viewMode === 'analytics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'ស្ថិតិ' : 'Analytics'}</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          {/* 1. Date Selector */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 font-khmer">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'km' ? 'កាលបរិច្ឆេទ' : 'Draw Date'}</span>
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              >
                <option value="all">
                  {lang === 'km' ? 'កាលបរិច្ឆេទទាំងអស់' : 'All Dates'} ({pastResults.length})
                </option>
                {todayDate && (
                  <option value={todayDate}>
                    {lang === 'km' ? 'ថ្ងៃនេះ' : 'Today'} - {todayDate} (
                    {pastResults.filter((r) => r.drawDate === todayDate).length})
                  </option>
                )}
                {availableDates
                  .filter((d) => d !== todayDate)
                  .map((d) => (
                    <option key={`date-opt-${d}`} value={d}>
                      {d} ({pastResults.filter((r) => r.drawDate === d).length})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 2. Search by Round ID or Animal */}
          <div className="md:col-span-5 flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1 font-khmer">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'km' ? 'ស្វែងរកវេន ឬឈ្មោះសត្វ' : 'Search Round / Animal'}</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'km'
                    ? 'វាយបញ្ចូលលេខវេន (ឧទាហរណ៍ 309, #195) ឬឈ្មោះសត្វ...'
                    : 'Search by round #, animal name, or number...'
                }
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 font-khmer"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3. Sort Order & Clear Filters */}
          <div className="md:col-span-3 flex items-end justify-between gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
              <span>{sortOrder === 'newest' ? (lang === 'km' ? 'ថ្មីទៅចាស់' : 'Newest First') : lang === 'km' ? 'ចាស់ទៅថ្មី' : 'Oldest First'}</span>
            </button>

            {(selectedDate !== 'all' ||
              selectedNumber !== null ||
              selectedBigSmall !== 'all' ||
              selectedColor !== 'all' ||
              selectedParity !== 'all' ||
              searchQuery) && (
              <button
                onClick={() => {
                  setSelectedDate('all');
                  setSelectedNumber(null);
                  setSelectedBigSmall('all');
                  setSelectedColor('all');
                  setSelectedParity('all');
                  setSearchQuery('');
                }}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1.5 rounded-lg transition"
              >
                {lang === 'km' ? 'សម្អាតច្រោះ' : 'Reset'}
              </button>
            )}
          </div>

          {/* 4. Secondary Category Filters (Big/Small, Color, Parity) */}
          <div className="md:col-span-12 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs">
            {/* Big / Small */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
              <span className="text-[10px] font-bold text-slate-500 px-1.5 font-khmer">
                {lang === 'km' ? 'ទំហំ' : 'Size'}:
              </span>
              <button
                onClick={() => setSelectedBigSmall('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedBigSmall === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'km' ? 'ទាំងអស់' : 'All'}
              </button>
              <button
                onClick={() => setSelectedBigSmall('big')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedBigSmall === 'big'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'km' ? 'ធំ (7-12)' : 'Big (7-12)'}
              </button>
              <button
                onClick={() => setSelectedBigSmall('small')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedBigSmall === 'small'
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'km' ? 'តូច (1-6)' : 'Small (1-6)'}
              </button>
            </div>

            {/* Color */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
              <span className="text-[10px] font-bold text-slate-500 px-1.5 font-khmer">
                {lang === 'km' ? 'ពណ៌' : 'Color'}:
              </span>
              <button
                onClick={() => setSelectedColor('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedColor === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'km' ? 'ទាំងអស់' : 'All'}
              </button>
              <button
                onClick={() => setSelectedColor('red')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedColor === 'red'
                    ? 'bg-red-600 text-white'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                {lang === 'km' ? 'ក្រហម' : 'Red'}
              </button>
              <button
                onClick={() => setSelectedColor('green')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedColor === 'green'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {lang === 'km' ? 'បៃតង' : 'Green'}
              </button>
              <button
                onClick={() => setSelectedColor('blue')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedColor === 'blue'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
              >
                {lang === 'km' ? 'ខៀវ' : 'Blue'}
              </button>
            </div>

            {/* Parity (Even / Odd) */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-0.5">
              <span className="text-[10px] font-bold text-slate-500 px-1.5 font-khmer">
                {lang === 'km' ? 'គូ/សេស' : 'Parity'}:
              </span>
              <button
                onClick={() => setSelectedParity('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedParity === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'km' ? 'ទាំងអស់' : 'All'}
              </button>
              <button
                onClick={() => setSelectedParity('even')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedParity === 'even'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'km' ? 'គូ (Even)' : 'Even'}
              </button>
              <button
                onClick={() => setSelectedParity('odd')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  selectedParity === 'odd'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'km' ? 'សេស (Odd)' : 'Odd'}
              </button>
            </div>

            {/* Filter by Number (1-12 Zodiac) Chips */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              <span className="text-[10px] font-bold text-slate-500 shrink-0 font-khmer">
                {lang === 'km' ? 'លេខសត្វ' : 'Number'}:
              </span>
              {ZODIAC_ITEMS.map((z) => {
                const isSelected = selectedNumber === z.number;
                return (
                  <button
                    key={`zodiac-chip-${z.number}`}
                    onClick={() => setSelectedNumber(isSelected ? null : z.number)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold shrink-0 transition flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <span className="font-mono">#{z.number}</span>
                    <span className="font-khmer text-[10px]">{z.khmerName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Statistical Summary Bar for filtered selection */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            {/* Big vs Small */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold">
                <span>{lang === 'km' ? 'ធំ / តូច' : 'Big / Small'}</span>
                <span>
                  {stats.bigPercent}% / {stats.smallPercent}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex bg-slate-200">
                <div style={{ width: `${stats.bigPercent}%` }} className="bg-rose-500" title={`Big: ${stats.bigCount}`} />
                <div style={{ width: `${stats.smallPercent}%` }} className="bg-cyan-500" title={`Small: ${stats.smallCount}`} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Big: {stats.bigCount}</span>
                <span>Small: {stats.smallCount}</span>
              </div>
            </div>

            {/* Even vs Odd */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold">
                <span>{lang === 'km' ? 'គូ / សេស' : 'Even / Odd'}</span>
                <span>
                  {stats.evenPercent}% / {stats.oddPercent}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex bg-slate-200">
                <div style={{ width: `${stats.evenPercent}%` }} className="bg-indigo-600" title={`Even: ${stats.evenCount}`} />
                <div style={{ width: `${stats.oddPercent}%` }} className="bg-amber-500" title={`Odd: ${stats.oddCount}`} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Even: {stats.evenCount}</span>
                <span>Odd: {stats.oddCount}</span>
              </div>
            </div>

            {/* Color Distribution */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold">
                <span>{lang === 'km' ? 'ពណ៌ (ក្រហម / បៃតង / ខៀវ)' : 'Colors (Red / Green / Blue)'}</span>
                <span>
                  {stats.redPercent}% / {stats.greenPercent}% / {stats.bluePercent}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex bg-slate-200">
                <div style={{ width: `${stats.redPercent}%` }} className="bg-red-500" title={`Red: ${stats.colorCounts.red}`} />
                <div style={{ width: `${stats.greenPercent}%` }} className="bg-emerald-600" title={`Green: ${stats.colorCounts.green}`} />
                <div style={{ width: `${stats.bluePercent}%` }} className="bg-blue-600" title={`Blue: ${stats.colorCounts.blue}`} />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Red: {stats.colorCounts.red}</span>
                <span>Green: {stats.colorCounts.green}</span>
                <span>Blue: {stats.colorCounts.blue}</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Main Body: Switchable View Modes */}
        {viewMode === 'analytics' ? (
          /* Analytics View */
          <HotColdAnalytics
            pastResults={filteredResults}
            lang={lang}
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            todayDate={todayDate}
          />
        ) : viewMode === 'beadroad' ? (
          /* Bead Road Matrix View */
          <div className="border border-slate-200 rounded-xl p-3 bg-white">
            <BigSmallStreakRoad pastResults={filteredResults} lang={lang} />
          </div>
        ) : viewMode === 'table' ? (
          /* High-Density Ledger Table View */
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-mono">#</th>
                  <th className="p-2.5">{lang === 'km' ? 'លេខវេន' : 'Round ID'}</th>
                  <th className="p-2.5">{lang === 'km' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Date & Time'}</th>
                  <th className="p-2.5">{lang === 'km' ? 'លេខឈ្នះ' : 'Winning #'}</th>
                  <th className="p-2.5">{lang === 'km' ? 'សត្វរាសីចក្រ' : 'Zodiac Animal'}</th>
                  <th className="p-2.5">{lang === 'km' ? 'ទំហំ' : 'Big / Small'}</th>
                  <th className="p-2.5">{lang === 'km' ? 'ពណ៌' : 'Color'}</th>
                  <th className="p-2.5">{lang === 'km' ? 'គូ/សេស' : 'Parity'}</th>
                  <th className="p-2.5 font-mono">{lang === 'km' ? 'អត្រាសង' : 'Payback'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      {lang === 'km'
                        ? 'មិនមានលទ្ធផលត្រូវតាមការច្រោះនេះទេ'
                        : 'No draw records match your current filters.'}
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((r, i) => {
                    const rowNum = startIndex + i + 1;
                    return (
                      <tr key={`tbl-${r.drawDate}-${r.roundId}-${i}`} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-mono text-slate-400">{rowNum}</td>
                        <td className="p-2.5 font-mono font-bold text-blue-700">{r.roundId}</td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {r.drawDate} {r.drawTime}
                        </td>
                        <td className="p-2.5">
                          <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            #{r.number}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold font-khmer text-slate-800">
                          {r.khmerName}{' '}
                          <span className="text-[11px] font-normal text-slate-500">({r.englishName})</span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                              r.isBig ? 'bg-rose-500' : 'bg-cyan-500'
                            }`}
                          >
                            {r.isBig ? 'ធំ (Big)' : 'តូច (Small)'}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                              r.color === 'red'
                                ? 'bg-red-500'
                                : r.color === 'green'
                                ? 'bg-emerald-600'
                                : 'bg-blue-600'
                            }`}
                          >
                            {r.color}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600">
                          {r.isEven ? (lang === 'km' ? 'គូ' : 'Even') : lang === 'km' ? 'សេស' : 'Odd'}
                        </td>
                        <td className="p-2.5 font-mono font-bold text-emerald-700">11x</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Cards Grid View (Default) */
          <div>
            {paginatedResults.length === 0 ? (
              <div className="text-center py-14 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                {lang === 'km'
                  ? 'មិនមានលទ្ធផលត្រូវតាមការច្រោះនេះទេ'
                  : 'No draw records match your current filters.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {paginatedResults.map((r, i) => {
                  const colorBorder =
                    r.color === 'red'
                      ? 'border-red-200 hover:border-red-400'
                      : r.color === 'green'
                      ? 'border-emerald-200 hover:border-emerald-400'
                      : 'border-blue-200 hover:border-blue-400';

                  return (
                    <div
                      key={`card-${r.drawDate}-${r.roundId}-${i}`}
                      className={`p-3 rounded-xl border bg-slate-50/70 hover:bg-white flex flex-col gap-1.5 shadow-2xs hover:shadow-md transition ${colorBorder}`}
                    >
                      {/* Top Row: Round ID & Time */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span className="font-bold text-blue-900">{r.roundId}</span>
                        <span>{r.drawTime}</span>
                      </div>
                      {r.drawDate && (
                        <div className="text-[10px] font-mono text-slate-400 -mt-1">{r.drawDate}</div>
                      )}

                      {/* Main Winner: Big Number & Zodiac Animal */}
                      <div className="flex items-center justify-between my-1">
                        <span className="text-2xl font-black text-slate-900 font-mono">#{r.number}</span>
                        <div className="text-right">
                          <div className="font-bold text-xs font-khmer text-slate-900">{r.khmerName}</div>
                          <div className="text-[9px] text-slate-400 truncate max-w-[80px]">
                            {r.englishName}
                          </div>
                        </div>
                      </div>

                      {/* Badges: Big/Small, Color, Parity */}
                      <div className="flex items-center gap-1 text-[10px] font-bold pt-1 border-t border-slate-200/60">
                        <span
                          className={`px-1.5 py-0.2 rounded text-white ${
                            r.isBig ? 'bg-rose-500' : 'bg-cyan-500'
                          }`}
                        >
                          {r.isBig ? 'Big' : 'Small'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-white ${
                            r.color === 'red'
                              ? 'bg-red-500'
                              : r.color === 'green'
                              ? 'bg-emerald-600'
                              : 'bg-blue-600'
                          }`}
                        >
                          {r.color}
                        </span>
                        <span className="ml-auto text-[10px] text-slate-400 font-mono">
                          {r.isEven ? 'Even' : 'Odd'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. Pagination Controls Footer */}
        {viewMode !== 'analytics' && viewMode !== 'beadroad' && totalItems > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
            {/* Page info & Page Size */}
            <div className="flex items-center gap-3">
              <span className="text-slate-600 font-mono">
                {lang === 'km' ? 'បង្ហាញ' : 'Showing'}{' '}
                <strong>
                  {startIndex + 1} - {Math.min(startIndex + effectivePageSize, totalItems)}
                </strong>{' '}
                {lang === 'km' ? 'នៃ' : 'of'} <strong>{totalItems.toLocaleString()}</strong>{' '}
                {lang === 'km' ? 'វេន' : 'rounds'}
              </span>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-500">{lang === 'km' ? 'ក្នុងមួយទំព័រ' : 'Per page'}:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-mono"
                >
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                  <option value={96}>96</option>
                  <option value={200}>200</option>
                  <option value={-1}>{lang === 'km' ? 'ទាំងអស់' : 'All'}</option>
                </select>
              </div>
            </div>

            {/* Page Navigator */}
            {pageSize !== -1 && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 px-2 font-mono font-bold text-slate-800">
                  <span>{currentPage}</span>
                  <span className="text-slate-400">/</span>
                  <span className="text-slate-600">{totalPages}</span>
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 transition"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
