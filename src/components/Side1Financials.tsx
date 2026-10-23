import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  History,
  Clock,
  Printer,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  Calendar,
} from 'lucide-react';
import { BetSlipRecord, RoundResult } from '../types/yuki';

interface Side1FinancialsProps {
  balance: number;
  activeBetsTotal: number;
  betSlips: BetSlipRecord[];
  recentResults: RoundResult[];
  onTopUp: () => void;
  onResetBalance: () => void;
  onClearBetHistory?: () => void;
  lang: 'km' | 'en';
  currentRoundId?: string;
  currentTimeString?: string;
}

interface TicketGroup {
  ticketNumber: string;
  roundId: string;
  date: string;
  time: string;
  slips: BetSlipRecord[];
  totalStake: number;
  totalPayout: number;
  totalPotentialPayback: number;
  isPending: boolean;
  hasWon: boolean;
}

interface RoundGroup {
  roundId: string;
  date: string;
  time: string;
  tickets: TicketGroup[];
}

export const Side1Financials: React.FC<Side1FinancialsProps> = ({
  balance,
  activeBetsTotal,
  betSlips,
  recentResults,
  onTopUp,
  onResetBalance,
  onClearBetHistory,
  lang,
}) => {
  const [betFilter, setBetFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');
  const listScrollRef = useRef<HTMLDivElement>(null);
  const [printModalData, setPrintModalData] = useState<{
    ticketNumber: string;
    roundId: string;
    date: string;
    time: string;
    slips: BetSlipRecord[];
  } | null>(null);

  const pendingCount = betSlips.filter((s) => s.result === 'pending').length;
  const wonCount = betSlips.filter((s) => s.result === 'won').length;
  const lostCount = betSlips.filter((s) => s.result === 'lost').length;

  const filteredSlips = betSlips.filter((slip) => {
    if (betFilter === 'all') return true;
    return slip.result === betFilter;
  });

  const totalWon = betSlips
    .filter((s) => s.result === 'won')
    .reduce((acc, curr) => acc + curr.payout, 0);

  const totalStaked = betSlips.reduce((acc, curr) => acc + curr.stake, 0);
  const netProfit = totalWon - totalStaked;

  // Group bet slips by roundId and ticketNumber
  const groupedRounds = React.useMemo(() => {
    const rounds: RoundGroup[] = [];
    const roundMap = new Map<string, { date: string; time: string; ticketMap: Map<string, BetSlipRecord[]> }>();

    filteredSlips.forEach((slip) => {
      const rId = slip.roundId;
      if (!roundMap.has(rId)) {
        roundMap.set(rId, {
          date: slip.date || '2026-10-23',
          time: slip.time,
          ticketMap: new Map(),
        });
      }
      const rData = roundMap.get(rId)!;
      const tNum = slip.ticketNumber || '444444400';
      if (!rData.ticketMap.has(tNum)) {
        rData.ticketMap.set(tNum, []);
      }
      rData.ticketMap.get(tNum)!.push(slip);
    });

    roundMap.forEach((rData, rId) => {
      const tickets: TicketGroup[] = [];
      rData.ticketMap.forEach((ticketSlips, tNum) => {
        const totalStake = ticketSlips.reduce((s, b) => s + b.stake, 0);
        const totalPayout = ticketSlips.reduce((s, b) => s + b.payout, 0);
        const totalPotentialPayback = ticketSlips.reduce(
          (s, b) => s + (b.potentialPayback || Math.round(b.stake * b.multiplier)),
          0
        );
        const isPending = ticketSlips.some((b) => b.result === 'pending');
        const hasWon = ticketSlips.some((b) => b.result === 'won');
        const firstSlip = ticketSlips[0];

        tickets.push({
          ticketNumber: tNum,
          roundId: rId,
          date: firstSlip?.date || rData.date,
          time: firstSlip?.time || rData.time,
          slips: ticketSlips,
          totalStake,
          totalPayout,
          totalPotentialPayback,
          isPending,
          hasWon,
        });
      });
      rounds.push({
        roundId: rId,
        date: rData.date,
        time: rData.time,
        tickets,
      });
    });

    return rounds;
  }, [filteredSlips]);

  // Smooth scroll helpers
  const handleScrollStep = (direction: 'up' | 'down') => {
    if (!listScrollRef.current) return;
    const delta = direction === 'up' ? -200 : 200;
    listScrollRef.current.scrollBy({ top: delta, behavior: 'smooth' });
  };

  const handlePrintTicket = (
    ticketNumber: string,
    slips: BetSlipRecord[],
    roundId: string,
    date: string,
    time: string
  ) => {
    setPrintModalData({
      ticketNumber,
      roundId,
      date,
      time,
      slips,
    });
  };

  return (
    <div className="flex flex-col gap-3 bg-white border border-slate-200 rounded-lg p-3 shadow-sm h-full">
      {/* 1. Financial Overview (សមតុល្យទឹកប្រាក់ / លុយដាក់ក្នុងក្ដារ) */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>{lang === 'km' ? 'លទ្ធផលហិរញ្ញវត្ថុ' : 'Financial Results'}</span>
          </div>
          <button
            onClick={onResetBalance}
            className="text-[11px] text-slate-500 hover:text-slate-800 underline transition cursor-pointer"
            title="Reset wallet to default"
          >
            {lang === 'km' ? 'កំណត់ឡើងវិញ' : 'Reset'}
          </button>
        </div>

        {/* Balance Row */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'km' ? 'សមតុល្យទឹកប្រាក់' : 'Account Balance'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-base text-emerald-600">
              {balance.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-700">៛</span>
            <button
              onClick={onTopUp}
              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded ml-1 transition cursor-pointer"
              title="Add 100,000 Riel"
            >
              +100K
            </button>
          </div>
        </div>

        {/* Active Bet on Table */}
        <div className="flex items-center justify-between py-1 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'km' ? 'លុយដាក់ក្នុងក្ដារ' : 'Active Bets (In-Play)'}
            </span>
          </div>
          <div>
            <span className="font-mono font-bold text-sm text-amber-600">
              {activeBetsTotal.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-amber-700 ml-1">៛</span>
          </div>
        </div>

        {/* Net Profit / Loss */}
        <div className="flex items-center justify-between py-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${netProfit >= 0 ? 'bg-blue-500' : 'bg-rose-500'}`}></span>
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'km' ? 'ចំណេញ / ខាត សរុប' : 'Net Win / Loss'}
            </span>
          </div>
          <div>
            <span
              className={`font-mono font-bold text-sm ${
                netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'
              }`}
            >
              {netProfit >= 0 ? `+${netProfit.toLocaleString()}` : netProfit.toLocaleString()}
            </span>
            <span className="text-xs font-bold ml-1 text-slate-600">៛</span>
          </div>
        </div>
      </div>

      {/* 2. Latest Results Summary (លទ្ធផលចុងក្រោយ ២០ វេន) */}
      <div className="border border-slate-200 rounded-lg p-2.5 bg-white shrink-0">
        <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'km' ? 'លទ្ធផលចុងក្រោយ' : 'Recent Draws'}</span>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded font-mono">
            {recentResults.slice(0, 20).length} វេន
          </span>
        </div>

        {/* Results list displaying historical draws */}
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[105px] pr-0.5 smooth-scroll-area">
          {recentResults.slice(0, 15).map((r, idx) => (
            <div
              key={`${r.roundId}-${idx}`}
              className="flex items-center justify-between text-xs py-0.5 px-2 rounded bg-slate-50 border border-slate-100 font-mono"
            >
              <div className="text-slate-600 text-[11px] font-semibold flex items-center gap-1.5">
                <span className="text-slate-800 font-bold">{r.roundId}</span>
                <span className="text-slate-400 text-[10px]">{r.drawTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`px-1 py-0.1 rounded text-[9px] font-bold ${
                    r.isBig ? 'bg-rose-500 text-white' : 'bg-cyan-500 text-white'
                  }`}
                >
                  {r.isBig ? 'ធំ' : 'តូច'}
                </span>
                <span className="font-bold text-slate-800 text-[10px] bg-amber-100 text-amber-950 px-1 py-0.1 rounded border border-amber-200">
                  #{r.number} {r.khmerName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Clean Bet Slips History - No overlapping text, clean receipt layout, smooth scrolling */}
      <div className="border border-slate-200 rounded-lg p-2.5 bg-white flex-1 flex flex-col min-h-[380px]">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
          <div className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">
              {lang === 'km' ? 'ប្រវត្តិសំបុត្រភ្នាល់' : 'Bet Slips History'}
            </h3>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded font-mono">
              {betSlips.length}
            </span>
          </div>

          {/* Quick Actions: Scroll Up/Down & Clear */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleScrollStep('up')}
              className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-slate-100 transition cursor-pointer"
              title="Scroll Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScrollStep('down')}
              className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-slate-100 transition cursor-pointer"
              title="Scroll Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            {onClearBetHistory && betSlips.length > 0 && (
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      lang === 'km'
                        ? 'តើអ្នកពិតជាចង់សម្អាតប្រវត្តិភ្នាល់ទាំងអស់មែនទេ?'
                        : 'Clear all bet history?'
                    )
                  ) {
                    onClearBetHistory();
                  }
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer ml-1"
                title={lang === 'km' ? 'សម្អាតប្រវត្តិ' : 'Clear History'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Segmented Control */}
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-md mb-2.5 text-center">
          {(['all', 'pending', 'won', 'lost'] as const).map((filter) => {
            const count =
              filter === 'all'
                ? betSlips.length
                : filter === 'pending'
                ? pendingCount
                : filter === 'won'
                ? wonCount
                : lostCount;

            const label =
              filter === 'all'
                ? lang === 'km' ? 'ទាំងអស់' : 'All'
                : filter === 'pending'
                ? lang === 'km' ? 'រង់ចាំ' : 'Pending'
                : filter === 'won'
                ? lang === 'km' ? 'ឈ្នះ' : 'Won'
                : lang === 'km' ? 'ចាញ់' : 'Lost';

            return (
              <button
                key={filter}
                onClick={() => setBetFilter(filter)}
                className={`py-1 px-1 rounded text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  betFilter === filter
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[9px] px-1 rounded-full ${
                    betFilter === filter ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Smooth Scrollable Container */}
        <div
          ref={listScrollRef}
          className="smooth-scroll-area flex-1 overflow-y-auto space-y-2.5 pr-0.5 max-h-[460px]"
        >
          {filteredSlips.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center gap-2">
              <History className="w-8 h-8 text-slate-300" />
              <span>
                {lang === 'km'
                  ? 'មិនទាន់មានការភ្នាល់ទេ សូមជ្រើសរើសលេខលើក្ដារដើម្បីភ្នាល់'
                  : 'No bets placed yet. Click on the board to place a bet!'}
              </span>
            </div>
          ) : (
            groupedRounds.map((rg) => (
              <div
                key={rg.roundId}
                className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs"
              >
                {/* 1. Round Bar: Round ID on left, Date & Time on right */}
                <div className="bg-slate-100 px-2.5 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-blue-900 font-mono">{rg.roundId}</span>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {rg.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {rg.time}
                    </span>
                  </div>
                </div>

                {/* 2. Tickets inside this round */}
                <div className="divide-y divide-slate-100">
                  {rg.tickets.map((t) => (
                    <div key={t.ticketNumber} className="p-2.5 bg-white space-y-2">
                      {/* Ticket header line */}
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {lang === 'km' ? 'សំបុត្រ:' : 'Ticket:'}
                          </span>
                          <button
                            onClick={() =>
                              handlePrintTicket(t.ticketNumber, t.slips, t.roundId, t.date, t.time)
                            }
                            className="text-blue-600 hover:text-blue-800 font-mono font-bold text-xs underline cursor-pointer"
                            title="View/Print ticket"
                          >
                            #{t.ticketNumber}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              t.isPending
                                ? 'bg-amber-100 text-amber-800'
                                : t.hasWon
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.isPending
                              ? lang === 'km' ? 'រង់ចាំ' : 'Pending'
                              : t.hasWon
                              ? lang === 'km' ? 'ឈ្នះ' : 'Won'
                              : lang === 'km' ? 'ចាញ់' : 'Lost'}
                          </span>
                          <button
                            onClick={() =>
                              handlePrintTicket(t.ticketNumber, t.slips, t.roundId, t.date, t.time)
                            }
                            className="w-5 h-5 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition cursor-pointer shadow-2xs"
                            title="Print receipt"
                          >
                            <Printer className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Bet Items List - Stacked Layout to Prevent ANY text overlap */}
                      <div className="space-y-1.5">
                        {t.slips.map((slip) => {
                          const displayTarget = slip.displayTarget || slip.label;
                          const potentialPayback =
                            slip.potentialPayback || Math.round(slip.stake * slip.multiplier);

                          return (
                            <div
                              key={slip.id}
                              className={`p-2 rounded-md border text-xs flex flex-col gap-1.5 transition ${
                                slip.result === 'won'
                                  ? 'bg-emerald-50/60 border-emerald-200'
                                  : slip.result === 'lost'
                                  ? 'bg-slate-50 border-slate-200'
                                  : 'bg-amber-50/50 border-amber-200'
                              }`}
                            >
                              {/* Row 1: Target Badge on left, Stake & Multiplier on right */}
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-bold font-khmer shrink-0 shadow-2xs ${
                                    slip.category === 'number'
                                      ? 'bg-blue-600 text-white'
                                      : slip.category === 'big'
                                      ? 'bg-rose-600 text-white'
                                      : slip.category === 'small'
                                      ? 'bg-cyan-600 text-white'
                                      : 'bg-slate-800 text-white'
                                  }`}
                                >
                                  {displayTarget}
                                </span>

                                <span className="font-mono text-xs font-bold text-slate-800">
                                  {slip.stake.toLocaleString()}៛ × {slip.multiplier}
                                </span>
                              </div>

                              {/* Row 2: Status label on left, Payback amount on right */}
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                                <span className="text-slate-500 font-medium">
                                  {slip.result === 'pending'
                                    ? lang === 'km' ? 'រំពឹងសង:' : 'Expected Pay:'
                                    : slip.result === 'won'
                                    ? lang === 'km' ? 'ឈ្នះសង:' : 'Payout:'
                                    : lang === 'km' ? 'លទ្ធផល:' : 'Result:'}
                                </span>

                                {slip.result === 'pending' ? (
                                  <span className="font-mono font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded">
                                    {potentialPayback.toLocaleString()}៛
                                  </span>
                                ) : slip.result === 'won' ? (
                                  <span className="font-mono font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    +{slip.payout.toLocaleString()}៛ (#{slip.winningNumber}{' '}
                                    {slip.wonAnimal || ''})
                                  </span>
                                ) : (
                                  <span className="font-mono text-slate-500">
                                    0៛ (#{slip.winningNumber} {slip.wonAnimal || ''})
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Ticket Total Summary */}
                      <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-700 font-bold font-khmer">
                          {lang === 'km' ? 'សរុបសំបុត្រ:' : 'Ticket Total:'}
                        </span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-slate-800">
                            {t.totalStake.toLocaleString()}៛
                          </span>
                          <span className="text-slate-400">/</span>
                          {t.isPending ? (
                            <span className="text-amber-600">
                              រំពឹង: {t.totalPotentialPayback.toLocaleString()}៛
                            </span>
                          ) : t.totalPayout > 0 ? (
                            <span className="text-emerald-600 font-extrabold">
                              +{t.totalPayout.toLocaleString()}៛
                            </span>
                          ) : (
                            <span className="text-slate-400">0៛</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {printModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-sm w-full p-4 font-mono text-xs text-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-300">
              <span className="font-black text-sm text-[#1a73e8]">
                YUKI 12 LOTTERY SLIP
              </span>
              <button
                onClick={() => setPrintModalData(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket No:</span>
                <span className="font-bold text-[#1a73e8]">#{printModalData.ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Round ID:</span>
                <span className="font-bold">{printModalData.roundId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{printModalData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time:</span>
                <span>{printModalData.time}</span>
              </div>
            </div>

            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1.5">
              {printModalData.slips.map((s) => (
                <div key={s.id} className="flex justify-between items-center text-xs">
                  <span className="font-khmer font-bold">{s.displayTarget || s.label}</span>
                  <span>
                    {s.stake.toLocaleString()} X {s.multiplier} ={' '}
                    <b
                      className={
                        s.result === 'pending'
                          ? 'text-[#ea4335]'
                          : s.result === 'won'
                          ? 'text-emerald-600'
                          : 'text-slate-400'
                      }
                    >
                      {s.result === 'pending'
                        ? '???'
                        : s.result === 'won'
                        ? `+${s.payout.toLocaleString()}៛`
                        : '0៛'}
                    </b>
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2.5 flex justify-between font-bold text-sm">
              <span>សរុប (Total):</span>
              <span>
                {printModalData.slips.reduce((a, b) => a + b.stake, 0).toLocaleString()}៛ /{' '}
                <span className="text-[#1a73e8]">
                  {printModalData.slips.some((s) => s.result === 'pending')
                    ? '???'
                    : `+${printModalData.slips.reduce((a, b) => a + b.payout, 0).toLocaleString()}៛`}
                </span>
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-[#1a73e8] hover:bg-blue-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>បោះពុម្ព (Print)</span>
              </button>
              <button
                onClick={() => setPrintModalData(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg font-bold cursor-pointer"
              >
                បិទ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
