import React, { useState } from 'react';
import { TrendingUp, History, Clock, Printer, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { BetSlipRecord, RoundResult } from '../types/yuki';

interface Side1FinancialsProps {
  balance: number;
  activeBetsTotal: number;
  betSlips: BetSlipRecord[];
  recentResults: RoundResult[];
  onTopUp: () => void;
  onResetBalance: () => void;
  lang: 'km' | 'en';
  currentRoundId?: string;
  currentTimeString?: string;
}

interface TicketGroup {
  ticketNumber: string;
  slips: BetSlipRecord[];
  totalStake: number;
  totalPayout: number;
  isPending: boolean;
}

interface RoundGroup {
  roundId: string;
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
  lang,
}) => {
  const [betFilter, setBetFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');
  const [printModalData, setPrintModalData] = useState<{
    ticketNumber: string;
    roundId: string;
    time: string;
    slips: BetSlipRecord[];
  } | null>(null);

  const filteredSlips = betSlips.filter((slip) => {
    if (betFilter === 'all') return true;
    return slip.result === betFilter;
  });

  const totalWon = betSlips
    .filter((s) => s.result === 'won')
    .reduce((acc, curr) => acc + curr.payout, 0);

  const totalStaked = betSlips.reduce((acc, curr) => acc + curr.stake, 0);
  const netProfit = totalWon - totalStaked;

  // Group bet slips by roundId and ticketNumber matching {A2800126-730B-4CE0-BAD7-414F03771C6C}.png
  const groupedRounds = React.useMemo(() => {
    const rounds: RoundGroup[] = [];
    const roundMap = new Map<string, { time: string; ticketMap: Map<string, BetSlipRecord[]> }>();

    filteredSlips.forEach((slip) => {
      const rId = slip.roundId;
      if (!roundMap.has(rId)) {
        roundMap.set(rId, {
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
        const isPending = ticketSlips.some((b) => b.result === 'pending');
        tickets.push({
          ticketNumber: tNum,
          slips: ticketSlips,
          totalStake,
          totalPayout,
          isPending,
        });
      });
      rounds.push({
        roundId: rId,
        time: rData.time,
        tickets,
      });
    });

    return rounds;
  }, [filteredSlips]);

  const handlePrintTicket = (ticketNumber: string, slips: BetSlipRecord[], roundId: string, time: string) => {
    setPrintModalData({
      ticketNumber,
      roundId,
      time,
      slips,
    });
  };

  return (
    <div className="flex flex-col gap-3 bg-white border border-slate-200 rounded-lg p-3 shadow-sm h-full overflow-y-auto">
      {/* 1. Financial Overview (សមតុល្យទឹកប្រាក់ / លុយដាក់ក្នុងក្ដារ) */}
      <div
        className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2 max-w-full"
        style={{ height: '160.5px' }}
      >
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
      <div
        className="border border-slate-200 rounded-lg p-2.5 bg-white max-w-full"
        style={{ height: '168px' }}
      >
        <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-slate-200">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'km' ? 'លទ្ធផលចុងក្រោយ' : 'Recent Draws'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded font-mono">
              {recentResults.slice(0, 20).length} វេន
            </span>
          </div>
        </div>

        {/* Results list displaying historical draws */}
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[118px] pr-0.5">
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

      {/* 3. Detailed Bet Slips (Exact Replica of {A2800126-730B-4CE0-BAD7-414F03771C6C}.png) */}
      <div className="border border-slate-200 rounded-lg p-2.5 bg-white flex-1 flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200">
          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'km' ? 'ប្រវត្តិសំបុត្រភ្នាល់' : 'Bet Slips History'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded font-mono">
              {betSlips.length} សំបុត្រ
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 mb-2">
          {(['all', 'pending', 'won', 'lost'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setBetFilter(filter)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition cursor-pointer ${
                betFilter === filter
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter === 'all'
                ? lang === 'km' ? 'ទាំងអស់' : 'All'
                : filter === 'pending'
                ? lang === 'km' ? 'រង់ចាំ ???' : 'Pending'
                : filter === 'won'
                ? lang === 'km' ? 'ឈ្នះ' : 'Won'
                : lang === 'km' ? 'ចាញ់' : 'Lost'}
            </button>
          ))}
        </div>

        {/* Ticket List matching {A2800126-730B-4CE0-BAD7-414F03771C6C}.png */}
        <div className="flex-1 overflow-y-auto max-h-[380px] flex flex-col gap-2.5 pr-0.5 select-none">
          {groupedRounds.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {lang === 'km'
                ? 'មិនទាន់មានការភ្នាល់ទេ សូមជ្រើសរើសលេខលើក្ដារដើម្បីភ្នាល់'
                : 'No bets placed yet. Click on the board to place a bet!'}
            </div>
          ) : (
            groupedRounds.map((rg) => (
              <div
                key={rg.roundId}
                className="border border-slate-200 rounded-md overflow-hidden bg-white shadow-2xs"
              >
                {/* Round Header Bar e.g. "1989#374 21:31" */}
                <div className="bg-[#eef4fc] px-3 py-1.5 font-bold text-slate-900 text-sm font-sans tracking-wide border-b border-slate-200 flex items-center justify-between">
                  <span>
                    {rg.roundId} {rg.time}
                  </span>
                </div>

                {/* Tickets list */}
                <div className="divide-y divide-slate-200">
                  {rg.tickets.map((t) => (
                    <div key={t.ticketNumber} className="p-2 sm:p-2.5 bg-white">
                      {/* Ticket Number & Blue Print Button */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          onClick={() => handlePrintTicket(t.ticketNumber, t.slips, rg.roundId, rg.time)}
                          className="text-[#1a73e8] font-bold font-mono text-sm underline underline-offset-2 tracking-wide cursor-pointer hover:text-blue-800"
                          title="Click to view/print receipt"
                        >
                          {t.ticketNumber}
                        </span>
                        <button
                          onClick={() => handlePrintTicket(t.ticketNumber, t.slips, rg.roundId, rg.time)}
                          className="w-6 h-6 rounded bg-[#1a73e8] hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-xs transition cursor-pointer"
                          title="បោះពុម្ពវិក្កយបត្រ (Print Ticket)"
                        >
                          <Printer className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                      </div>

                      {/* Ticket Bets */}
                      <div className="flex flex-col gap-1 text-sm font-sans">
                        {t.slips.map((slip) => {
                          const displayTarget = slip.displayTarget || slip.label;
                          return (
                            <div key={slip.id} className="flex items-center">
                              {/* Left Column: Target Name / Number (e.g. "តូច", "2", "1") */}
                              <span className="w-14 text-center font-black text-slate-900 font-khmer shrink-0 text-sm sm:text-base">
                                {displayTarget}
                              </span>

                              {/* Right Column: Formula & Result */}
                              <div className="flex items-center font-bold text-slate-900 font-sans tracking-tight text-sm sm:text-base">
                                <span>
                                  {slip.stake.toLocaleString()} X {slip.multiplier} ={' '}
                                </span>
                                {slip.result === 'pending' ? (
                                  <span className="text-[#ea4335] font-black ml-1.5 font-mono">
                                    ???
                                  </span>
                                ) : slip.result === 'won' ? (
                                  <span className="text-[#1a73e8] font-black ml-1.5 font-mono">
                                    {slip.payout.toLocaleString()}៛
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-bold ml-1.5 font-mono">
                                    0៛
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Summary Line: សរុប 2,000៛ / 22,000៛ */}
                        {(t.slips.length > 1 || !t.isPending) && (
                          <div className="flex items-center pt-1 border-t border-slate-100 mt-0.5">
                            <span className="w-14 text-center font-black text-slate-900 font-khmer shrink-0 text-sm">
                              សរុប
                            </span>
                            <div className="font-bold text-slate-900 font-sans text-sm sm:text-base">
                              <span>{t.totalStake.toLocaleString()}៛ / </span>
                              {t.isPending ? (
                                <span className="text-[#ea4335] font-black ml-1 font-mono">
                                  ???
                                </span>
                              ) : (
                                <span className="text-[#1a73e8] font-black ml-1 font-mono">
                                  {t.totalPayout.toLocaleString()}៛
                                </span>
                              )}
                            </div>
                          </div>
                        )}
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
                <span className="font-bold text-[#1a73e8]">{printModalData.ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Round ID:</span>
                <span className="font-bold">{printModalData.roundId}</span>
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
                          ? 'text-[#1a73e8]'
                          : 'text-slate-400'
                      }
                    >
                      {s.result === 'pending'
                        ? '???'
                        : s.result === 'won'
                        ? `${s.payout.toLocaleString()}៛`
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
                    : `${printModalData.slips.reduce((a, b) => a + b.payout, 0).toLocaleString()}៛`}
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
