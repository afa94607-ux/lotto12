import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Award,
  DollarSign,
  Clock,
  Calendar,
  Search,
  Download,
  Printer,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Layers,
  FileSpreadsheet,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import { BetSlipRecord } from '../types/yuki';

interface OwnerWinLossReportProps {
  betSlips: BetSlipRecord[];
  balance: number;
  lang: 'km' | 'en';
  onBackToGame: () => void;
  availableDates?: string[];
  todayDate?: string;
  onRefreshBets?: () => void;
  onUpdateSlipNotes?: (slipId: string, notes: string) => void;
}

export const OwnerWinLossReport: React.FC<OwnerWinLossReportProps> = ({
  betSlips,
  balance,
  lang,
  onBackToGame,
  availableDates = [],
  todayDate,
  onRefreshBets,
  onUpdateSlipNotes,
}) => {
  // View mode: 'owner' (Owner & House Profit Report) vs 'player' (Player Statement)
  const [viewMode, setViewMode] = useState<'owner' | 'player'>('owner');

  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'lost' | 'won' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'slips' | 'rounds' | 'categories'>('slips');

  // Notes inline editing state
  const [editingSlipId, setEditingSlipId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');

  const handleStartEditNote = (slipId: string, currentNote?: string) => {
    setEditingSlipId(slipId);
    setEditingNoteText(currentNote || '');
  };

  const handleSaveNote = (slipId: string) => {
    if (onUpdateSlipNotes) {
      onUpdateSlipNotes(slipId, editingNoteText);
    }
    setEditingSlipId(null);
  };

  const handleCancelNote = () => {
    setEditingSlipId(null);
    setEditingNoteText('');
  };

  // Unique dates extracted from bet records
  const datesList = useMemo(() => {
    const set = new Set<string>();
    if (todayDate) set.add(todayDate);
    availableDates.forEach((d) => set.add(d));
    betSlips.forEach((b) => {
      if (b.date) set.add(b.date);
    });
    return Array.from(set).sort((a, b) => (b > a ? 1 : -1));
  }, [betSlips, availableDates, todayDate]);

  // Filtered bet slips
  const filteredSlips = useMemo(() => {
    return betSlips.filter((slip) => {
      // Date filter
      if (selectedDate !== 'all' && slip.date !== selectedDate) return false;

      // Status filter
      if (statusFilter !== 'all' && slip.result !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all') {
        if (categoryFilter === 'number' && slip.category !== 'number') return false;
        if (categoryFilter === 'big_small' && slip.category !== 'big' && slip.category !== 'small') return false;
        if (categoryFilter === 'odd_even' && slip.category !== 'odd' && slip.category !== 'even') return false;
        if (categoryFilter === 'colors' && !['red', 'green', 'blue'].includes(slip.category)) return false;
      }

      // Search query (ticketNumber, roundId, displayTarget, label, wonAnimal, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const ticket = (slip.ticketNumber || slip.id || '').toLowerCase();
        const round = (slip.roundId || '').toLowerCase();
        const target = (slip.displayTarget || slip.label || '').toLowerCase();
        const animal = (slip.wonAnimal || '').toLowerCase();
        const note = (slip.notes || '').toLowerCase();
        if (!ticket.includes(q) && !round.includes(q) && !target.includes(q) && !animal.includes(q) && !note.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [betSlips, selectedDate, statusFilter, categoryFilter, searchQuery]);

  // Comprehensive Owner Accounting Summary
  // USER REQUIREMENT: "when any bet loss is mean not win so that is mean owner win + wit amount"
  const ownerSummary = useMemo(() => {
    let totalStake = 0;
    let ownerWinFromLosses = 0; // Total stake collected from all lost bets
    let lostCount = 0;

    let totalPayoutToWinners = 0; // Total payouts paid to players on won bets
    let wonCount = 0;
    let wonStake = 0;

    let pendingStake = 0;
    let pendingCount = 0;

    filteredSlips.forEach((slip) => {
      const stake = Number(slip.stake) || 0;
      totalStake += stake;

      if (slip.result === 'lost') {
        // When bet loss = OWNER WINS 100% of the stake!
        ownerWinFromLosses += stake;
        lostCount += 1;
      } else if (slip.result === 'won') {
        const payout = Number(slip.payout) || 0;
        totalPayoutToWinners += payout;
        wonCount += 1;
        wonStake += stake;
      } else {
        pendingStake += stake;
        pendingCount += 1;
      }
    });

    // Net Owner Profit: Total Stake - Total Payout (or Owner Win from Losses - (Payout - WonStake))
    const netOwnerProfit = totalStake - totalPayoutToWinners;
    const resolvedCount = lostCount + wonCount;
    const ownerWinRate = resolvedCount > 0 ? (lostCount / resolvedCount) * 100 : 0;
    const houseMargin = totalStake > 0 ? (netOwnerProfit / totalStake) * 100 : 0;

    return {
      totalStake,
      ownerWinFromLosses,
      lostCount,
      totalPayoutToWinners,
      wonCount,
      wonStake,
      netOwnerProfit,
      pendingStake,
      pendingCount,
      resolvedCount,
      ownerWinRate: Math.round(ownerWinRate * 10) / 10,
      houseMargin: Math.round(houseMargin * 10) / 10,
    };
  }, [filteredSlips]);

  // Round-by-Round Breakdown for Owner
  const roundBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        roundId: string;
        date: string;
        time: string;
        winningNumber?: number;
        wonAnimal?: string;
        totalBets: number;
        totalStake: number;
        ownerWinFromLosses: number;
        payouts: number;
        netProfit: number;
        pendingBets: number;
      }
    >();

    filteredSlips.forEach((slip) => {
      const rId = slip.roundId || 'Unknown';
      if (!map.has(rId)) {
        map.set(rId, {
          roundId: rId,
          date: slip.date || '',
          time: slip.time || '',
          winningNumber: slip.winningNumber,
          wonAnimal: slip.wonAnimal,
          totalBets: 0,
          totalStake: 0,
          ownerWinFromLosses: 0,
          payouts: 0,
          netProfit: 0,
          pendingBets: 0,
        });
      }
      const entry = map.get(rId)!;
      entry.totalBets += 1;
      const stake = Number(slip.stake) || 0;
      entry.totalStake += stake;

      if (slip.winningNumber !== undefined && entry.winningNumber === undefined) {
        entry.winningNumber = slip.winningNumber;
        entry.wonAnimal = slip.wonAnimal;
      }

      if (slip.result === 'lost') {
        entry.ownerWinFromLosses += stake;
      } else if (slip.result === 'won') {
        entry.payouts += Number(slip.payout) || 0;
      } else {
        entry.pendingBets += 1;
      }
      entry.netProfit = entry.totalStake - entry.payouts;
    });

    return Array.from(map.values()).sort((a, b) => (b.roundId > a.roundId ? 1 : -1));
  }, [filteredSlips]);

  // Category Breakdown for Owner
  const categoryBreakdown = useMemo(() => {
    const categories: Record<
      string,
      {
        nameKm: string;
        nameEn: string;
        betsCount: number;
        totalStake: number;
        ownerWon: number;
        payouts: number;
        netProfit: number;
      }
    > = {
      number: { nameKm: 'ចាក់លេខ ១-១២ (សង ១១ដង)', nameEn: 'Single Numbers 1-12 (11x)', betsCount: 0, totalStake: 0, ownerWon: 0, payouts: 0, netProfit: 0 },
      big_small: { nameKm: 'តូច / ធំ (សង ១.៩៥ដង)', nameEn: 'Small / Big (1.95x)', betsCount: 0, totalStake: 0, ownerWon: 0, payouts: 0, netProfit: 0 },
      odd_even: { nameKm: 'សេស / គូ (សង ១.៩៥ដង)', nameEn: 'Odd / Even (1.95x)', betsCount: 0, totalStake: 0, ownerWon: 0, payouts: 0, netProfit: 0 },
      colors: { nameKm: 'ពណ៌ ក្រហម/បៃតង/ខៀវ (សង ២.៩៥ដង)', nameEn: 'Colors Red/Green/Blue (2.95x)', betsCount: 0, totalStake: 0, ownerWon: 0, payouts: 0, netProfit: 0 },
    };

    filteredSlips.forEach((s) => {
      let catKey = 'number';
      if (s.category === 'small' || s.category === 'big') catKey = 'big_small';
      else if (s.category === 'odd' || s.category === 'even') catKey = 'odd_even';
      else if (['red', 'green', 'blue'].includes(s.category)) catKey = 'colors';

      const target = categories[catKey];
      if (target) {
        target.betsCount += 1;
        const stake = Number(s.stake) || 0;
        target.totalStake += stake;
        if (s.result === 'lost') {
          target.ownerWon += stake;
        } else if (s.result === 'won') {
          target.payouts += Number(s.payout) || 0;
        }
        target.netProfit = target.totalStake - target.payouts;
      }
    });

    return Object.entries(categories);
  }, [filteredSlips]);

  // Export to CSV
  const handleExportCSV = () => {
    window.open(`/api/bets/export?format=csv&date=${selectedDate}`, '_blank');
  };

  // Export to JSON
  const handleExportJSON = () => {
    window.open(`/api/bets/export?format=json&date=${selectedDate}`, '_blank');
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 flex flex-col gap-5 select-none">
      {/* Top Banner & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-blue-950 px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider">
              {lang === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រង' : 'Management'}
            </span>
            <span className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {lang === 'km' ? 'រក្សាទុកអចិន្ត្រៃយ៍ ១០០%' : '100% Permanently Preserved'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-khmer mt-1">
            {lang === 'km'
              ? 'របាយការណ៍ឈ្នះ/ចាញ់ & ប្រាក់ចំណេញម្ចាស់ឆ្នោត'
              : 'Win/Loss & House Owner Profit Accounting Report'}
          </h1>
          <p className="text-xs text-slate-500 font-khmer mt-0.5">
            {lang === 'km'
              ? 'ប្រវត្តិការភ្នាល់ទាំងអស់ត្រូវបានរក្សាទុកមិនបាត់បង់ • ពេលកីឡាករចាញ់ = ម្ចាស់ឈ្នះ + ចំនួនប្រាក់'
              : 'All bet history permanently saved • When any bet is lost, the owner wins + that amount'}
          </p>
        </div>

        {/* View Mode Toggle & Back Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-300">
            <button
              onClick={() => setViewMode('owner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'owner'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👑</span>
              <span>{lang === 'km' ? 'របាយការណ៍ម្ចាស់ (Owner)' : 'Owner Win Report'}</span>
            </button>
            <button
              onClick={() => setViewMode('player')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'player'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👤</span>
              <span>{lang === 'km' ? 'ទិដ្ឋភាពអ្នកលេង (Player)' : 'Player View'}</span>
            </button>
          </div>

          <button
            onClick={onBackToGame}
            className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>{lang === 'km' ? '← ត្រឡប់ទៅក្ដារឆ្នោត' : '← Back to Lottery'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          KEY PERFORMANCE INDICATORS (KPIs) FOR THE OWNER
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Betting Volume / Handle */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-900 mb-1.5">
            <span className="text-xs font-bold uppercase font-khmer">
              {lang === 'km' ? 'ចំណូលភ្នាល់សរុប (Total Stake)' : 'Total Betting Handle'}
            </span>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-950">
            {ownerSummary.totalStake.toLocaleString()} <span className="text-sm font-bold">៛</span>
          </div>
          <div className="text-[11px] text-blue-700 font-khmer mt-1 flex items-center justify-between">
            <span>{filteredSlips.length} សន្លឹកចាក់សរុប</span>
            <span className="font-mono font-semibold">100% Inflow</span>
          </div>
        </div>

        {/* KPI 2: OWNER WIN FROM LOSSES (CRITICAL USER REQUEST HIGHLIGHT) */}
        <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/40 to-teal-50 border-2 border-emerald-400 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 opacity-10 text-emerald-950 pointer-events-none">
            <Award className="w-24 h-24" />
          </div>
          <div className="flex items-center justify-between text-emerald-900 mb-1.5">
            <span className="text-xs font-extrabold uppercase font-khmer flex items-center gap-1.5">
              <span>🏆</span>
              {lang === 'km' ? 'ម្ចាស់ឈ្នះពីសន្លឹកចាញ់' : 'Owner Win from Losses'}
            </span>
            <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              +100%
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700 flex items-center gap-1">
            <span>+{ownerSummary.ownerWinFromLosses.toLocaleString()}</span>
            <span className="text-sm font-bold">៛</span>
          </div>
          <div className="text-[11px] text-emerald-900 font-khmer mt-1 font-semibold flex items-center justify-between">
            <span>{ownerSummary.lostCount} សន្លឹកចាញ់ (ម្ចាស់ឈ្នះ)</span>
            <span className="font-mono text-emerald-700 bg-emerald-200/60 px-1 rounded">
              Win Rate: {ownerSummary.ownerWinRate}%
            </span>
          </div>
        </div>

        {/* KPI 3: Total Paid Out to Winners */}
        <div className="bg-gradient-to-br from-rose-50 to-red-50/60 border border-rose-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-900 mb-1.5">
            <span className="text-xs font-bold uppercase font-khmer">
              {lang === 'km' ? 'ម្ចាស់ទូទាត់សង (Total Payouts)' : 'Total Paid Out'}
            </span>
            <ArrowDownRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700">
            -{ownerSummary.totalPayoutToWinners.toLocaleString()} <span className="text-sm font-bold">៛</span>
          </div>
          <div className="text-[11px] text-rose-700 font-khmer mt-1 flex items-center justify-between">
            <span>{ownerSummary.wonCount} សន្លឹកត្រូវរង្វាន់</span>
            <span className="font-mono font-semibold">
              Stake: {ownerSummary.wonStake.toLocaleString()} ៛
            </span>
          </div>
        </div>

        {/* KPI 4: NET OWNER PROFIT / GROSS GAMING REVENUE */}
        <div
          className={`rounded-xl p-4 shadow-sm border-2 ${
            ownerSummary.netOwnerProfit >= 0
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-400'
              : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-black uppercase font-khmer">
              {lang === 'km' ? 'ចំណេញសុទ្ធរបស់ម្ចាស់ (Net Profit)' : 'House Net Profit'}
            </span>
            <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
              Margin: {ownerSummary.houseMargin}%
            </span>
          </div>
          <div className="text-2xl font-black font-mono flex items-center gap-1">
            <span>
              {ownerSummary.netOwnerProfit >= 0 ? '+' : ''}
              {ownerSummary.netOwnerProfit.toLocaleString()}
            </span>
            <span className="text-sm font-bold">៛</span>
          </div>
          <div className="text-[11px] font-khmer mt-1 flex items-center justify-between opacity-95">
            <span>
              {ownerSummary.netOwnerProfit >= 0
                ? (lang === 'km' ? '✓ ម្ចាស់មានផលចំណេញ' : '✓ House in Profit')
                : (lang === 'km' ? 'កីឡាករឈ្នះច្រើន' : 'Players Ahead')}
            </span>
            <span className="text-xs">
              {ownerSummary.pendingCount > 0 && `(រង់ចាំ: ${ownerSummary.pendingStake.toLocaleString()}៛)`}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          FILTER TOOLBAR & ACTIONS
          ========================================================================= */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Selector */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">{lang === 'km' ? 'កាលបរិច្ឆេទទាំងអស់ (All Dates)' : 'All Dates'}</option>
              {datesList.map((d) => (
                <option key={d} value={d}>
                  {d} {d === todayDate ? (lang === 'km' ? '(ថ្ងៃនេះ)' : '(Today)') : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">{lang === 'km' ? 'ស្ថានភាព: ទាំងអស់ (All)' : 'Status: All'}</option>
              <option value="lost">
                {lang === 'km' ? '🏆 ម្ចាស់ឈ្នះ (សន្លឹកចាញ់)' : 'Owner Won (Lost Bets)'}
              </option>
              <option value="won">
                {lang === 'km' ? '💸 ម្ចាស់សង (សន្លឹកឈ្នះ)' : 'Owner Paid (Won Bets)'}
              </option>
              <option value="pending">
                {lang === 'km' ? '⏳ កំពុងរង់ចាំ (Pending)' : 'Pending Bets'}
              </option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">{lang === 'km' ? 'ប្រភេទ: ទាំងអស់ (All)' : 'Category: All'}</option>
              <option value="number">{lang === 'km' ? 'លេខ ១-១២ (11x)' : 'Numbers 1-12 (11x)'}</option>
              <option value="big_small">{lang === 'km' ? 'តូច / ធំ (1.95x)' : 'Small / Big (1.95x)'}</option>
              <option value="odd_even">{lang === 'km' ? 'សេស / គូ (1.95x)' : 'Odd / Even (1.95x)'}</option>
              <option value="colors">{lang === 'km' ? 'ពណ៌ (2.95x)' : 'Colors (2.95x)'}</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'km' ? 'ស្វែងរកសំបុត្រ/ជុំ/សត្វ...' : 'Search ticket / round...'}
              className="bg-transparent text-xs text-slate-800 focus:outline-none w-36 sm:w-44"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2">
          {onRefreshBets && (
            <button
              onClick={onRefreshBets}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
              title="Sync with server"
            >
              <RefreshCw className="w-3 h-3 text-blue-600" />
              <span>{lang === 'km' ? 'ធ្វើសមកាលកម្ម' : 'Sync'}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            title="Download CSV for Excel Accounting"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'ទាញយក CSV' : 'Export CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            title="Print statement"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{lang === 'km' ? 'បោះពុម្ព' : 'Print'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB NAVIGATION FOR DETAILED REPORTS
          ========================================================================= */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('slips')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'slips'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {lang === 'km' ? 'របាយការណ៍សន្លឹកឆ្នោតនីមួយៗ' : 'Individual Bet Slips'} ({filteredSlips.length})
        </button>

        <button
          onClick={() => setActiveTab('rounds')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'rounds'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {lang === 'km' ? 'របាយការណ៍សង្ខេបតាមជុំ (Round Breakdown)' : 'Round-by-Round Breakdown'} ({roundBreakdown.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-extrabold transition-all border-b-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {lang === 'km' ? 'របាយការណ៍តាមប្រភេទភ្នាល់ (Categories)' : 'Category Performance'}
        </button>
      </div>

      {/* =========================================================================
          TAB CONTENT: 1. INDIVIDUAL BET SLIPS WITH EXPLICIT OWNER WIN/LOSS
          ========================================================================= */}
      {activeTab === 'slips' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">{lang === 'km' ? 'កាលបរិច្ឆេទ & ម៉ោង' : 'Date & Time'}</th>
                <th className="p-3">{lang === 'km' ? 'លេខសំបុត្រ' : 'Ticket #'}</th>
                <th className="p-3">{lang === 'km' ? 'ជុំ (Round)' : 'Round ID'}</th>
                <th className="p-3">{lang === 'km' ? 'ជម្រើសភ្នាល់' : 'Bet Choice'}</th>
                <th className="p-3 text-right">{lang === 'km' ? 'ប្រាក់ចាក់' : 'Stake'}</th>
                <th className="p-3 text-center">{lang === 'km' ? 'លទ្ធផលជុំ' : 'Draw Result'}</th>
                <th className="p-3 text-center">{lang === 'km' ? 'លទ្ធផលអ្នកលេង' : 'Player Result'}</th>
                <th className="p-3 text-right bg-blue-50/70 border-l border-blue-200 text-blue-950 font-black">
                  {lang === 'km' ? 'លទ្ធផលម្ចាស់ឆ្នោត (Owner Win/Loss)' : 'Owner Win / Loss'}
                </th>
                <th className="p-3 text-center">{lang === 'km' ? 'កំណត់ចំណាំ (Notes)' : 'Notes'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSlips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-khmer">
                    {lang === 'km'
                      ? 'មិនមានប្រវត្តិការភ្នាល់ត្រូវនឹងលក្ខខណ្ឌជ្រើសរើសទេ'
                      : 'No bet history matching current filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredSlips.map((slip) => {
                  const isLost = slip.result === 'lost';
                  const isWon = slip.result === 'won';
                  const isPending = slip.result === 'pending';
                  const display = slip.displayTarget || slip.label;

                  // OWNER WIN / LOSS CALCULATION:
                  // "when any bet loss is mean not win so that is mean owner win + wit amount"
                  const ownerWonAmount = isLost ? slip.stake : 0;
                  const ownerPaidAmount = isWon ? slip.payout : 0;
                  const ownerNetDiff = isLost ? slip.stake : isWon ? slip.stake - slip.payout : 0;

                  return (
                    <tr
                      key={slip.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLost ? 'bg-emerald-50/20' : isWon ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Date & Time */}
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                        <div>{slip.date}</div>
                        <div className="text-[10px] text-slate-400">{slip.time}</div>
                      </td>

                      {/* Ticket Number */}
                      <td className="p-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {slip.ticketNumber || slip.id.slice(-8)}
                          </span>
                          {slip.deletedFromHistory && (
                            <span
                              className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded font-sans font-medium"
                              title={
                                lang === 'km'
                                  ? 'បានលុបចេញពីប្រវត្តិសំបុត្រភ្នាល់ (ទិន្នន័យនៅតែរក្សាទុកក្នុងរបាយការណ៍)'
                                  : 'Deleted from Bet Slips History (Permanently preserved in Win/Loss Report)'
                              }
                            >
                              {lang === 'km' ? 'លុបពីប្រវត្តិ' : 'Hidden from Slips'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Round ID */}
                      <td className="p-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {slip.roundId}
                      </td>

                      {/* Bet Choice */}
                      <td className="p-3 font-khmer font-bold text-slate-900">
                        <div>{display}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          × {slip.multiplier} Payout
                        </div>
                      </td>

                      {/* Stake */}
                      <td className="p-3 font-mono font-bold text-slate-800 text-right whitespace-nowrap">
                        {slip.stake.toLocaleString()} ៛
                      </td>

                      {/* Draw Result */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {slip.winningNumber !== undefined ? (
                          <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-bold text-amber-900 font-khmer">
                            <span>#{slip.winningNumber}</span>
                            <span>{slip.wonAnimal || ''}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Player Result */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {isWon ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>
                              {lang === 'km'
                                ? `ឈ្នះ (សងពេញ: +${slip.payout.toLocaleString()}៛)`
                                : `Won (Full Payback: +${slip.payout.toLocaleString()} KHR)`}
                            </span>
                          </span>
                        ) : isLost ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>{lang === 'km' ? 'មិនឈ្នះ (Did not win)' : 'Did not win'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[11px] font-bold border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{lang === 'km' ? 'រង់ចាំលទ្ធផល' : 'Pending'}</span>
                          </span>
                        )}
                      </td>

                      {/* OWNER WIN / LOSS (HIGHLIGHTED COLUMN) */}
                      <td className="p-3 text-right font-mono font-bold whitespace-nowrap bg-blue-50/50 border-l border-blue-200">
                        {isLost ? (
                          /* USER REQUIREMENT: when any bet loss is mean not win so that is mean owner win + wit amount */
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-700 font-black text-sm flex items-center gap-1">
                              <span className="text-xs">🏆</span>
                              <span>+{slip.stake.toLocaleString()} ៛</span>
                            </span>
                            <span className="text-[10px] font-khmer text-emerald-800 bg-emerald-100 px-1 rounded font-bold">
                              ម្ចាស់ឈ្នះ (+100%)
                            </span>
                          </div>
                        ) : isWon ? (
                          <div className="flex flex-col items-end">
                            <span className="text-rose-700 font-black text-sm">
                              -{slip.payout.toLocaleString()} ៛
                            </span>
                            <span className="text-[10px] font-khmer text-rose-700 bg-rose-100 px-1 rounded font-semibold">
                              ម្ចាស់សងរង្វាន់ (Net: {ownerNetDiff.toLocaleString()}៛)
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="text-amber-700 text-xs font-semibold">
                              តម្កល់ {slip.stake.toLocaleString()} ៛
                            </span>
                            <span className="text-[10px] font-khmer text-amber-800 bg-amber-100 px-1 rounded">
                              រង់ចាំចេញលទ្ធផល
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Notes Column with Inline View & Edit */}
                      <td className="p-3 whitespace-nowrap">
                        {editingSlipId === slip.id ? (
                          <div className="flex items-center gap-1 min-w-[170px]">
                            <input
                              type="text"
                              autoFocus
                              value={editingNoteText}
                              onChange={(e) => setEditingNoteText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNote(slip.id);
                                if (e.key === 'Escape') handleCancelNote();
                              }}
                              placeholder={lang === 'km' ? 'វាយកំណត់ចំណាំ...' : 'Enter note...'}
                              className="bg-white border border-blue-400 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans w-28 sm:w-36"
                            />
                            <button
                              onClick={() => handleSaveNote(slip.id)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                              title={lang === 'km' ? 'រក្សាទុក' : 'Save'}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelNote}
                              className="p-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs cursor-pointer"
                              title={lang === 'km' ? 'បោះបង់' : 'Cancel'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : slip.notes ? (
                          <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200/80 rounded-lg px-2.5 py-1 text-xs text-slate-800 max-w-[200px]">
                            <span className="text-[11px]">📝</span>
                            <span className="font-semibold truncate text-slate-900" title={slip.notes}>
                              {slip.notes}
                            </span>
                            {onUpdateSlipNotes && (
                              <button
                                onClick={() => handleStartEditNote(slip.id, slip.notes)}
                                className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition cursor-pointer ml-auto shrink-0"
                                title={lang === 'km' ? 'កែប្រែកំណត់ចំណាំ' : 'Edit note'}
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ) : onUpdateSlipNotes ? (
                          <button
                            onClick={() => handleStartEditNote(slip.id, '')}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 border border-dashed border-slate-300 hover:border-blue-400 px-2 py-0.5 rounded-lg transition cursor-pointer"
                            title={lang === 'km' ? 'បន្ថែមចំណាំ' : 'Add note'}
                          >
                            <span>📝</span>
                            <span>{lang === 'km' ? '+ កំណត់ចំណាំ' : '+ Note'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT: 2. ROUND-BY-ROUND HOUSE BREAKDOWN
          ========================================================================= */}
      {activeTab === 'rounds' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">{lang === 'km' ? 'ជុំ (Round ID)' : 'Round ID'}</th>
                <th className="p-3">{lang === 'km' ? 'កាលបរិច្ឆេទ' : 'Date & Time'}</th>
                <th className="p-3 text-center">{lang === 'km' ? 'លេខឈ្នះ' : 'Winning Result'}</th>
                <th className="p-3 text-center">{lang === 'km' ? 'សន្លឹកភ្នាល់' : 'Total Bets'}</th>
                <th className="p-3 text-right">{lang === 'km' ? 'ប្រាក់ចាក់សរុប' : 'Total Stake'}</th>
                <th className="p-3 text-right text-emerald-800 font-extrabold">
                  {lang === 'km' ? 'ម្ចាស់ឈ្នះពីសន្លឹកចាញ់ (+)' : 'Owner Win from Losses (+)'}
                </th>
                <th className="p-3 text-right text-rose-800 font-extrabold">
                  {lang === 'km' ? 'ម្ចាស់សងរង្វាន់ (-)' : 'Payout to Winners (-)'}
                </th>
                <th className="p-3 text-right bg-blue-50/70 border-l border-blue-200 text-blue-950 font-black">
                  {lang === 'km' ? 'ចំណេញសុទ្ធជុំនេះ (Net Round Profit)' : 'Net Round Profit'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roundBreakdown.map((r) => (
                <tr key={r.roundId} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-blue-700">{r.roundId}</td>
                  <td className="p-3 font-mono text-slate-600">
                    {r.date} {r.time}
                  </td>
                  <td className="p-3 text-center">
                    {r.winningNumber ? (
                      <span className="bg-amber-100 border border-amber-300 text-amber-900 px-2 py-0.5 rounded-full font-bold font-khmer">
                        #{r.winningNumber} {r.wonAnimal || ''}
                      </span>
                    ) : (
                      <span className="text-slate-400">កំពុងដំណើរការ</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono font-bold">{r.totalBets} សន្លឹក</td>
                  <td className="p-3 text-right font-mono font-bold">{r.totalStake.toLocaleString()} ៛</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-700">
                    +{r.ownerWinFromLosses.toLocaleString()} ៛
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-rose-700">
                    -{r.payouts.toLocaleString()} ៛
                  </td>
                  <td className="p-3 text-right font-mono font-black border-l border-blue-200 bg-blue-50/40">
                    <span className={r.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {r.netProfit >= 0 ? '+' : ''}
                      {r.netProfit.toLocaleString()} ៛
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* =========================================================================
          TAB CONTENT: 3. CATEGORY PERFORMANCE BREAKDOWN
          ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryBreakdown.map(([key, cat]) => (
            <div key={key} className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                <span className="font-extrabold text-slate-900 font-khmer text-sm">
                  {lang === 'km' ? cat.nameKm : cat.nameEn}
                </span>
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-xs font-mono font-bold">
                  {cat.betsCount} bets
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px] font-khmer">ប្រាក់ចាក់សរុប (Total Stake)</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {cat.totalStake.toLocaleString()} ៛
                  </span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  <span className="text-emerald-800 block text-[11px] font-khmer font-bold">
                    ម្ចាស់ឈ្នះពីសន្លឹកចាញ់ (+)
                  </span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    +{cat.ownerWon.toLocaleString()} ៛
                  </span>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                  <span className="text-rose-800 block text-[11px] font-khmer">ម្ចាស់សងរង្វាន់ (-)</span>
                  <span className="font-mono font-bold text-rose-700 text-sm">
                    -{cat.payouts.toLocaleString()} ៛
                  </span>
                </div>
                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
                  <span className="text-blue-800 block text-[11px] font-khmer font-bold">
                    ចំណេញសុទ្ធរបស់ម្ចាស់ (Net)
                  </span>
                  <span className={`font-mono font-black text-sm ${cat.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {cat.netProfit >= 0 ? '+' : ''}
                    {cat.netProfit.toLocaleString()} ៛
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer System Preservation Guarantee */}
      <div className="bg-slate-100 rounded-xl p-3 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 border border-slate-200">
        <div className="flex items-center gap-2 font-khmer">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {lang === 'km'
              ? 'ប្រព័ន្ធរក្សាទុកប្រវត្តិការភ្នាល់ទាំងអស់ជាអចិន្ត្រៃយ៍ក្នុង Server File (data_history_bets.json) និង LocalStorage — មិនបាត់បង់ទិន្នន័យឡើយទោះបី Reload ទំព័រ។'
              : 'All bet history is permanently preserved in server storage (data_history_bets.json) and localStorage.'}
          </span>
        </div>
        <div className="font-mono font-bold text-slate-700 text-xs">
          Total Inflow: {ownerSummary.totalStake.toLocaleString()} ៛ | Net: {ownerSummary.netOwnerProfit.toLocaleString()} ៛
        </div>
      </div>
    </div>
  );
};
