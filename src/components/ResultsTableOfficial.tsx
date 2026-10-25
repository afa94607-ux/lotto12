import React, { useState, useMemo } from 'react';
import { RoundResult } from '../types/yuki';
import {
  Calendar,
  Search,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  List,
} from 'lucide-react';
import { HotColdAnalytics } from './HotColdAnalytics';

interface ResultsTableOfficialProps {
  pastResults: RoundResult[];
  availableDates: string[];
  todayDate: string;
  lang: 'km' | 'en';
  onBackToBoard?: () => void;
  onRefreshHistory?: () => void;
}

export const ResultsTableOfficial: React.FC<ResultsTableOfficialProps> = ({
  pastResults,
  availableDates,
  todayDate,
  lang,
  onBackToBoard,
  onRefreshHistory,
}) => {
  // Date filter: defaults to todayDate or 'all'
  const [selectedDate, setSelectedDate] = useState<string>(todayDate || '2026-10-25');
  const [viewTab, setViewTab] = useState<'table' | 'analytics'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50); // 50 items per page or -1 for all
  const [isRefreshing, setIsRefreshing] = useState(false);

  // List of all unique dates in chronological/descending order
  const allUniqueDates = useMemo(() => {
    const set = new Set<string>();
    if (todayDate) set.add(todayDate);
    availableDates.forEach((d) => set.add(d));
    pastResults.forEach((r) => {
      if (r.drawDate) set.add(r.drawDate);
    });
    return Array.from(set).sort((a, b) => (b > a ? 1 : -1));
  }, [pastResults, availableDates, todayDate]);

  // Handle "ទាញយកលទ្ធផល" button click
  const handleFetchResults = () => {
    setIsRefreshing(true);
    if (onRefreshHistory) {
      onRefreshHistory();
    }
    // Also trigger server sync
    fetch(`/api/results?date=${selectedDate}&limit=all`)
      .catch(() => {})
      .finally(() => {
        setTimeout(() => setIsRefreshing(false), 500);
      });
  };

  // Filtered and sorted results: permanent, lossless retention
  const filteredResults = useMemo(() => {
    let list = [...pastResults];

    // Date filter: if not 'all', filter by the exact selected date
    if (selectedDate && selectedDate !== 'all') {
      list = list.filter((r) => r.drawDate === selectedDate);
    }

    // Search query: round ID (e.g. 1996#342, #342) or winning number
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => {
        const round = (r.roundId || '').toLowerCase();
        const time = (r.drawTime || '').toLowerCase();
        const numStr = r.number.toString();
        const khmer = (r.khmerName || '').toLowerCase();
        return round.includes(q) || time.includes(q) || numStr === q || khmer.includes(q);
      });
    }

    // Sort: newest first (chronological reverse)
    list.sort((a, b) => {
      if (a.drawDate && b.drawDate && a.drawDate !== b.drawDate) {
        return b.drawDate.localeCompare(a.drawDate);
      }
      return (b.timestamp || 0) - (a.timestamp || 0);
    });

    return list;
  }, [pastResults, selectedDate, searchQuery]);

  // Reset page on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, searchQuery, pageSize]);

  // Pagination calculation
  const totalItems = filteredResults.length;
  const effectivePageSize = pageSize === -1 ? totalItems : pageSize;
  const totalPages = effectivePageSize > 0 ? Math.ceil(totalItems / effectivePageSize) : 1;
  const startIndex = (currentPage - 1) * effectivePageSize;
  const paginatedResults =
    pageSize === -1
      ? filteredResults
      : filteredResults.slice(startIndex, startIndex + effectivePageSize);

  // Export to CSV
  const handleExportCSV = () => {
    window.open(`/api/results/export?format=csv&date=${selectedDate}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5">
      {/* =========================================================================
          TOP BAR: Matches User's Screenshot Exactly
          កាលបរិច្ឆេទ: [ 25-10-2026 ] [ ទាញយកលទ្ធផល ]
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        {/* Left side: Date Input & Retrieve Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="text-sm sm:text-base font-bold font-khmer text-slate-800 flex items-center gap-1.5">
            <span>កាលបរិច្ឆេទ:</span>
          </label>

          {/* Date Picker Input */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={selectedDate === 'all' ? '' : selectedDate}
              onChange={(e) => setSelectedDate(e.target.value || 'all')}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs cursor-pointer min-w-[150px]"
            />

            {/* Quick dropdown for available historical dates */}
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1.5 text-xs font-mono text-slate-700 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              title="Select from recorded dates"
            >
              <option value="all">
                {lang === 'km' ? 'កាលបរិច្ឆេទទាំងអស់ (All)' : 'All Recorded Dates'} ({pastResults.length})
              </option>
              {allUniqueDates.map((d) => (
                <option key={`date-opt-${d}`} value={d}>
                  {d} {d === todayDate ? (lang === 'km' ? '(ថ្ងៃនេះ)' : '(Today)') : ''} (
                  {pastResults.filter((r) => r.drawDate === d).length} វេន)
                </option>
              ))}
            </select>
          </div>

          {/* Retrieve Results Button: "ទាញយកលទ្ធផល" in Authentic Blue */}
          <button
            onClick={handleFetchResults}
            disabled={isRefreshing}
            className="bg-[#4867aa] hover:bg-[#3b5998] active:scale-95 text-white font-bold font-khmer text-xs sm:text-sm px-4 py-1.5 rounded shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="ទាញយកលទ្ធផលប្រវត្តិពីប្រព័ន្ធ (Retrieve Results)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>ទាញយកលទ្ធផល</span>
          </button>

          {/* Search Input for Quick Round Lookup */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'km' ? 'ស្វែងរកលេខវេន...' : 'Search round #...'}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 pl-7 w-36 sm:w-44 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right side: View Tabs, Export, Back to Board */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher: Table View (Exact Screenshot) vs Analytics */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewTab('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition cursor-pointer ${
                viewTab === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'តារាងលទ្ធផល' : 'Results Table'}</span>
            </button>
            <button
              onClick={() => setViewTab('analytics')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition cursor-pointer ${
                viewTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'ស្ថិតិ & ក្តារគ្រាប់' : 'Analytics'}</span>
            </button>
          </div>

          {/* Export to CSV */}
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            title="Download CSV report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>

          {/* Back to Lottery Board */}
          {onBackToBoard && (
            <button
              onClick={onBackToBoard}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'ត្រឡប់' : 'Back'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Summary Subheader */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 px-1 font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 font-khmer">
            {lang === 'km' ? 'ទិន្នន័យប្រវត្តិ:' : 'Historical Records:'}
          </span>
          <span className="bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded font-mono">
            {totalItems} វេន (Rounds)
          </span>
          {selectedDate !== 'all' && (
            <span className="text-slate-500 font-mono">
              [{selectedDate}]
            </span>
          )}
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 font-khmer">បង្ហាញ:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white text-slate-700 font-mono focus:outline-none"
          >
            <option value={25}>25 វេន</option>
            <option value={50}>50 វេន</option>
            <option value={100}>100 វេន</option>
            <option value={-1}>ទាំងអស់ (All {totalItems})</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          VIEW A: RESULTS TABLE (MATCHING USER SCREENSHOT EXACTLY)
          Header: Deep Blue #355393
          Columns: ល.រ | កាលបរិច្ឆេទ | លេខការឡុក | លទ្ធផល | តូច / ធំ | សេស / គូ | ពណ៌ | Jackpot
          ========================================================================= */}
      {viewTab === 'table' ? (
        <div className="overflow-x-auto border border-slate-300 rounded-sm">
          <table className="w-full border-collapse text-xs sm:text-sm">
            {/* Header: Solid Deep Blue with White Text */}
            <thead>
              <tr className="bg-[#355393] text-white font-bold font-khmer select-none">
                <th className="py-2.5 px-3 border border-[#4867aa] text-center w-14 font-khmer">
                  ល.រ
                </th>
                <th className="py-2.5 px-3 border border-[#4867aa] text-center w-32 font-khmer">
                  កាលបរិច្ឆេទ
                </th>
                <th className="py-2.5 px-4 border border-[#4867aa] text-center font-khmer">
                  លេខការឡុក
                </th>
                <th className="py-2.5 px-3 border border-[#4867aa] text-center w-24 font-khmer">
                  លទ្ធផល
                </th>
                <th className="py-2.5 px-3 border border-[#4867aa] text-center w-36 font-khmer">
                  តូច / ធំ
                </th>
                <th className="py-2.5 px-3 border border-[#4867aa] text-center w-28 font-khmer">
                  សេស / គូ
                </th>
                <th className="py-2.5 px-3 border border-[#4867aa] text-center w-36 font-khmer">
                  ពណ៌
                </th>
                <th className="py-2.5 px-3 border border-[#4867aa] text-center w-24 font-khmer">
                  Jackpot
                </th>
              </tr>
            </thead>

            {/* Body Rows */}
            <tbody className="divide-y divide-slate-200 font-mono">
              {paginatedResults.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-khmer text-sm">
                    {lang === 'km'
                      ? 'មិនមានលទ្ធផលសម្រាប់កាលបរិច្ឆេទនេះទេ'
                      : 'No draw results found for the selected date.'}
                  </td>
                </tr>
              ) : (
                paginatedResults.map((r, idx) => {
                  const rowNumber = startIndex + idx + 1;
                  const isBig = r.isBig;
                  const isEven = r.isEven;
                  const color = r.color; // 'red' | 'green' | 'blue'
                  const colorKhmer =
                    color === 'green' ? 'បៃតង' : color === 'red' ? 'ក្រហម' : 'ខៀវ';
                  const parityKhmer = isEven ? 'គូ' : 'សេស';
                  const bigSmallKhmer = isBig ? 'ធំ' : 'តូច';

                  return (
                    <tr
                      key={`res-${r.drawDate}-${r.roundId}-${idx}`}
                      className="hover:bg-blue-50/40 transition-colors bg-white text-slate-800 h-10 sm:h-11"
                    >
                      {/* 1. ល.រ (Row Index: 1, 2, 3...) */}
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-mono text-slate-700">
                        {rowNumber}
                      </td>

                      {/* 2. កាលបរិច្ឆេទ (Date: 2026-10-25) */}
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-mono whitespace-nowrap text-slate-700">
                        {r.drawDate || todayDate}
                      </td>

                      {/* 3. លេខការឡុក (Draw / Round # & Time: e.g. 1996#342 19:41) */}
                      <td className="py-1.5 px-3 border border-slate-300 text-center whitespace-nowrap">
                        <span
                          onClick={() => setSearchQuery(r.roundId)}
                          className="text-[#1a73e8] hover:underline cursor-pointer font-bold font-mono tracking-wide"
                          title={`Click to filter round ${r.roundId}`}
                        >
                          {r.roundId} {r.drawTime}
                        </span>
                      </td>

                      {/* 4. លទ្ធផល (Winning Result Number: 1-12) */}
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-bold font-mono text-base text-slate-900">
                        {r.number}
                      </td>

                      {/* 5. តូច / ធំ (Small / Big with authentic color badges from screenshot) */}
                      {/* Big (ធំ): Vibrant Pink/Rose #ff4d94 */}
                      {/* Small (តូច): Vibrant Cyan/Sky #00c2ff */}
                      <td className="p-1 border border-slate-300 text-center">
                        <div
                          className={`w-[85%] mx-auto py-1 px-2 rounded text-white font-bold font-khmer text-xs sm:text-sm text-center shadow-2xs leading-tight ${
                            isBig ? 'bg-[#ff4d94]' : 'bg-[#00c2ff]'
                          }`}
                        >
                          {bigSmallKhmer}
                        </div>
                      </td>

                      {/* 6. សេស / គូ (Odd / Even - plain text, centered) */}
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-bold font-khmer text-slate-800 text-xs sm:text-sm">
                        {parityKhmer}
                      </td>

                      {/* 7. ពណ៌ (Color with authentic full-colored badge from screenshot) */}
                      {/* Green (បៃតង): #00a82d */}
                      {/* Red (ក្រហម): #e50914 */}
                      {/* Blue (ខៀវ): #001299 */}
                      <td className="p-1 border border-slate-300 text-center">
                        <div
                          className={`w-[85%] mx-auto py-1 px-2 rounded text-white font-bold font-khmer text-xs sm:text-sm text-center shadow-2xs leading-tight ${
                            color === 'green'
                              ? 'bg-[#00a82d]'
                              : color === 'red'
                              ? 'bg-[#e50914]'
                              : 'bg-[#001299]'
                          }`}
                        >
                          {colorKhmer}
                        </div>
                      </td>

                      {/* 8. Jackpot (-- centered) */}
                      <td className="py-1.5 px-2 border border-slate-300 text-center font-mono text-slate-500 font-bold">
                        --
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* VIEW B: HOT & COLD ANALYTICS FOR POWER USERS */
        <div className="pt-2">
          <HotColdAnalytics
            pastResults={filteredResults}
            lang={lang}
            availableDates={allUniqueDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            todayDate={todayDate}
          />
        </div>
      )}

      {/* =========================================================================
          PAGINATION CONTROLS (WHEN PAGE SIZE IS NOT 'ALL')
          ========================================================================= */}
      {pageSize !== -1 && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 text-xs">
          <div className="text-slate-500 font-mono">
            {lang === 'km' ? 'បង្ហាញពី' : 'Showing'} {startIndex + 1} -{' '}
            {Math.min(startIndex + pageSize, totalItems)} {lang === 'km' ? 'នៃ' : 'of'}{' '}
            {totalItems} {lang === 'km' ? 'វេន' : 'rounds'}
          </div>

          <div className="flex items-center gap-1 font-mono">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Current Page Indicator */}
            <span className="px-3 py-1 font-bold bg-blue-50 text-blue-800 rounded border border-blue-200">
              {currentPage} / {totalPages}
            </span>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
