import React from 'react';
import { ZODIAC_ITEMS } from '../data/zodiac';
import { BetCategory } from '../types/yuki';
import { Volume2 } from 'lucide-react';
import { BetModalTarget } from './BettingModal';
import { KHMER_COUNTDOWN_MAP, KHMER_GOODLUCK_MESSAGE } from '../utils/audio';

interface Side3BettingBoardProps {
  countdownSeconds: number;
  currentRoundId: string;
  currentTimeString: string;
  selectedChip: number;
  setSelectedChip: (val: number) => void;
  stagedBets: Record<string, number>;
  onAddBet: (key: string, category: BetCategory, label: string, multiplier: number, targetNumber?: number) => void;
  onOpenBetModal: (target: BetModalTarget) => void;
  onClearBets: () => void;
  onDoubleBets: () => void;
  onRebet: () => void;
  onConfirmBets: () => void;
  hasPreviousBets: boolean;
  balance: number;
  isDrawing: boolean;
  lang: 'km' | 'en';
}

export const Side3BettingBoard: React.FC<Side3BettingBoardProps> = ({
  countdownSeconds,
  currentRoundId,
  currentTimeString,
  selectedChip: _selectedChip,
  setSelectedChip: _setSelectedChip,
  stagedBets,
  onAddBet: _onAddBet,
  onOpenBetModal,
  onClearBets: _onClearBets,
  onDoubleBets: _onDoubleBets,
  onRebet: _onRebet,
  onConfirmBets: _onConfirmBets,
  hasPreviousBets: _hasPreviousBets,
  balance: _balance,
  isDrawing,
  lang,
}) => {

  const handleBetClick = (
    key: string,
    category: BetCategory,
    label: string,
    multiplier: number,
    targetNumber?: number
  ) => {
    if (isDrawing) return;
    // Opens the authentic betting pad popup from photo
    onOpenBetModal({
      category,
      label,
      multiplier,
      targetNumber,
    });
  };

  const isLast10Seconds = countdownSeconds <= 10 && countdownSeconds >= 1;
  const khmerItem = KHMER_COUNTDOWN_MAP[countdownSeconds];

  return (
    <div
      className="flex flex-col gap-2.5 bg-white border border-slate-200 rounded-lg shadow-sm h-full overflow-y-auto select-none font-bold"
      style={{
        width: '530px',
        paddingLeft: '11px',
        paddingRight: '11px',
        paddingTop: '11px',
        paddingBottom: '50px',
        fontWeight: 'bold',
      }}
    >
      {/* 1. Header Bar: Red Countdown Box & Dark Blue Round Info (matching authentic system) */}
      <div className="flex items-stretch gap-1.5 h-13 shrink-0">
        {/* Large Red Countdown Box with 10s Khmer audio indicator */}
        <div
          className={`w-24 ${
            isLast10Seconds
              ? 'bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 ring-2 ring-amber-400 animate-pulse'
              : 'bg-[#c91818]'
          } rounded-md flex flex-col items-center justify-center text-white shadow-xs shrink-0 transition-all px-1`}
        >
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black font-mono leading-none tracking-tight">
              {countdownSeconds}
            </span>
            {isLast10Seconds && khmerItem && (
              <span className="text-sm font-extrabold text-amber-300 font-khmer">
                {khmerItem.numeral}
              </span>
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-red-100 mt-0.5 truncate max-w-full">
            {isLast10Seconds && khmerItem ? (
              <span className="flex items-center gap-0.5 text-amber-200">
                <Volume2 className="w-2.5 h-2.5 inline animate-bounce" />
                {khmerItem.word}
              </span>
            ) : countdownSeconds === 0 ? (
              'ចប់ភ្នាល់'
            ) : (
              lang === 'km' ? 'វិនាទី' : 'SEC'
            )}
          </span>
        </div>

        {/* Dark Blue Round & Live Clock Box */}
        <div className="flex-1 bg-[#1a3875] rounded-md px-3 flex items-center justify-between text-white shadow-xs font-mono">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-amber-300">
              {currentRoundId}
            </span>
            <span className="text-[10px] text-blue-200">
              {lang === 'km' ? 'វេនបច្ចុប្បន្ន (រៀងរាល់ 3 នាទី)' : 'Current Round (Every 3 mins)'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-extrabold text-white tracking-widest">
              {currentTimeString}
            </span>
            <div className="text-[10px] text-emerald-300 flex items-center gap-1 justify-end font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isDrawing ? (lang === 'km' ? 'បិទភ្នាល់' : 'DRAWING') : (lang === 'km' ? 'កំពុងបើកភ្នាល់' : 'BETTING OPEN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 10-Second Khmer Voice Countdown Announcement Banner */}
      {isLast10Seconds && (
        <div className="bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white rounded-md px-3 py-1.5 flex items-center justify-between shadow animate-pulse border border-amber-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Volume2 className="w-3.5 h-3.5 text-amber-200" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-extrabold text-amber-200">
                សំឡេងរាប់ថយក្រោយ ១០ វិនាទីចុងក្រោយ (Khmer Voice)
              </span>
              <span className="text-[12px] font-bold tracking-wide">
                {khmerItem?.numeral} ({khmerItem?.word}) — ជិតបិទការចាក់ភ្នាល់!
              </span>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-xs text-white px-2 py-0.5 rounded font-black font-mono text-sm border border-white/30">
            {countdownSeconds}s
          </div>
        </div>
      )}

      {/* 0-Second Good Luck Announcement */}
      {countdownSeconds === 0 && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white rounded-md px-3 py-2 flex items-center justify-center gap-2 shadow-md border-2 border-amber-300 animate-pulse">
          <Volume2 className="w-4 h-4 text-amber-200 animate-bounce" />
          <span className="text-sm font-extrabold text-white font-khmer tracking-wide">
            {KHMER_GOODLUCK_MESSAGE} (Wish you good luck!)
          </span>
        </div>
      )}

      {/* 2. THE TOP MACRO BETTING GRID (Exact Replica of Photo 1) */}
      {/* 5 Equal-height Columns:
          - Col 1: [តូច 1.95] / [សេស 1.95]
          - Col 2: [ធំ 1.95] / [គូ 1.95]
          - Col 3: [ក្រហម | 1 4 7 10 | 2.95]
          - Col 4: [បៃតង | 2 5 8 11 | 2.95]
          - Col 5: [ខៀវ | 3 6 9 12 | 2.95] */}
      <div
        className="grid grid-cols-5 gap-1.5 shrink-0 text-white"
        style={{ height: '169px', width: '423.344px' }}
      >
        {/* Column 1: Sky Blue [តូច] top & Orange [សេស] bottom */}
        <div className="flex flex-col gap-1.5" style={{ width: '98.8594px' }}>
          {/* Small: តូច */}
          <button
            onClick={() => handleBetClick('small', 'small', 'តូច', 1.95)}
            disabled={isDrawing}
            className="flex-1 bg-[#00b4d8] hover:bg-[#0096c7] active:scale-95 disabled:opacity-50 rounded-md py-2 px-1 flex flex-col items-center justify-between shadow-xs transition cursor-pointer relative"
            style={{
              width: '79.8438px',
              height: '85.5px',
              paddingTop: '8px',
              paddingLeft: '4px',
              fontSize: '16px',
            }}
          >
            <span className="font-black text-xl sm:text-2xl font-khmer leading-none drop-shadow-xs">
              តូច
            </span>
            <span className="bg-white text-slate-900 font-mono font-black text-sm sm:text-base px-3 py-0.5 rounded-full shadow-xs mt-1">
              1.95
            </span>
            {stagedBets['small'] && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-blue-950 font-black text-[10px] px-1.5 rounded-full shadow border border-yellow-200 font-mono z-10">
                {stagedBets['small'].toLocaleString()}៛
              </span>
            )}
          </button>

          {/* Odd: សេស */}
          <button
            onClick={() => handleBetClick('odd', 'odd', 'សេស', 1.95)}
            disabled={isDrawing}
            className="flex-1 bg-[#f97316] hover:bg-[#ea580c] active:scale-95 disabled:opacity-50 rounded-md py-2 px-1 flex flex-col items-center justify-between shadow-xs transition cursor-pointer relative"
            style={{ width: '79.8594px', fontSize: '16px' }}
          >
            <span className="font-black text-xl sm:text-2xl font-khmer leading-none drop-shadow-xs">
              សេស
            </span>
            <span className="bg-white text-slate-900 font-mono font-black text-sm sm:text-base px-3 py-0.5 rounded-full shadow-xs mt-1">
              1.95
            </span>
            {stagedBets['odd'] && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-blue-950 font-black text-[10px] px-1.5 rounded-full shadow border border-yellow-200 font-mono z-10">
                {stagedBets['odd'].toLocaleString()}៛
              </span>
            )}
          </button>
        </div>

        {/* Column 2: Pink [ធំ] top & Golden Amber [គូ] bottom */}
        <div className="flex flex-col gap-1.5">
          {/* Big: ធំ */}
          <button
            onClick={() => handleBetClick('big', 'big', 'ធំ', 1.95)}
            disabled={isDrawing}
            className="flex-1 bg-[#f43f5e] hover:bg-[#e11d48] active:scale-95 disabled:opacity-50 rounded-md py-2 px-1 flex flex-col items-center justify-between shadow-xs transition cursor-pointer relative"
            style={{ fontSize: '16px' }}
          >
            <span className="font-black text-xl sm:text-2xl font-khmer leading-none drop-shadow-xs">
              ធំ
            </span>
            <span className="bg-white text-slate-900 font-mono font-black text-sm sm:text-base px-3 py-0.5 rounded-full shadow-xs mt-1">
              1.95
            </span>
            {stagedBets['big'] && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-blue-950 font-black text-[10px] px-1.5 rounded-full shadow border border-yellow-200 font-mono z-10">
                {stagedBets['big'].toLocaleString()}៛
              </span>
            )}
          </button>

          {/* Even: គូ (with distinctive yellow-red accent border as in photo) */}
          <button
            onClick={() => handleBetClick('even', 'even', 'គូ', 1.95)}
            disabled={isDrawing}
            className="flex-1 bg-[#f59e0b] hover:bg-[#d97706] active:scale-95 disabled:opacity-50 rounded-md py-2 px-1 flex flex-col items-center justify-between shadow-xs transition cursor-pointer relative border-2 border-amber-300 ring-1 ring-red-500/80"
            style={{ fontSize: '16px' }}
          >
            <span className="font-black text-xl sm:text-2xl font-khmer leading-none drop-shadow-xs">
              គូ
            </span>
            <span className="bg-white text-slate-900 font-mono font-black text-sm sm:text-base px-3 py-0.5 rounded-full shadow-xs mt-1">
              1.95
            </span>
            {stagedBets['even'] && (
              <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-blue-950 font-black text-[10px] px-1.5 rounded-full shadow border border-yellow-200 font-mono z-10">
                {stagedBets['even'].toLocaleString()}៛
              </span>
            )}
          </button>
        </div>

        {/* Column 3: Red [ក្រហម] with 1 4 7 10 & 2.95 */}
        <button
          onClick={() => handleBetClick('red', 'red', 'ក្រហម', 2.95)}
          disabled={isDrawing}
          className="bg-[#dc2626] hover:bg-[#b91c1c] active:scale-95 disabled:opacity-50 rounded-md p-2 flex flex-col items-center justify-between shadow-xs transition cursor-pointer relative"
          style={{ fontSize: '16px' }}
        >
          <div className="flex flex-col items-center w-full">
            <span className="font-black text-lg sm:text-xl font-khmer leading-tight drop-shadow-xs">
              ក្រហម
            </span>
            {/* White box with numbers 1 4 7 10 */}
            <div className="bg-white text-slate-900 font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded w-full text-center mt-2 tracking-wider shadow-xs">
              1 4 7 10
            </div>
          </div>
          {/* White pill with 2.95 */}
          <span className="bg-white text-slate-900 font-mono font-black text-sm sm:text-base px-3 py-0.5 rounded-full shadow-xs mt-auto">
            2.95
          </span>
          {stagedBets['red'] && (
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-blue-950 font-black text-[10px] px-1.5 rounded-full shadow border border-yellow-200 font-mono z-10">
              {stagedBets['red'].toLocaleString()}៛
            </span>
          )}
        </button>

        {/* Column 4: Green [បៃតង] with 2 5 8 11 & 2.95 */}
        <button
          onClick={() => handleBetClick('green', 'green', 'បៃតង', 2.95)}
          disabled={isDrawing}
          className="bg-[#16a34a] hover:bg-[#15803d] active:scale-95 disabled:opacity-50 rounded-md p-2 flex flex-col items-center justify-between shadow-xs transition cursor-pointer relative"
          style={{ fontSize: '16px' }}
        >
          <div className="flex flex-col items-center w-full">
            <span className="font-black text-lg sm:text-xl font-khmer leading-tight drop-shadow-xs">
              បៃតង
            </span>
            {/* White box with numbers 2 5 8 11 */}
            <div className="bg-white text-slate-900 font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded w-full text-center mt-2 tracking-wider shadow-xs">
              2 5 8 11
            </div>
          </div>
          {/* White pill with 2.95 */}
          <span className="bg-white text-slate-900 font-mono font-black text-sm sm:text-base px-3 py-0.5 rounded-full shadow-xs mt-auto">
            2.95
          </span>
          {stagedBets['green'] && (
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-blue-950 font-black text-[10px] px-1.5 rounded-full shadow border border-yellow-200 font-mono z-10">
              {stagedBets['green'].toLocaleString()}៛
            </span>
          )}
        </button>

        {/* Column 5: Deep Blue [ខៀវ] with 3 6 9 12 & 2.95 */}
        <button
          onClick={() => handleBetClick('blue', 'blue', 'ខៀវ', 2.95)}
          disabled={isDrawing}
          className="bg-[#1e3a8a] hover:bg-[#1e40af] active:scale-95 disabled:opacity-50 rounded-md p-2 flex flex-col items-center justify-between shadow-xs transition cursor-pointer relative"
          style={{ fontSize: '16px' }}
        >
          <div className="flex flex-col items-center w-full">
            <span className="font-black text-lg sm:text-xl font-khmer leading-tight drop-shadow-xs">
              ខៀវ
            </span>
            {/* White box with numbers 3 6 9 12 */}
            <div className="bg-white text-slate-900 font-mono font-black text-xs sm:text-sm px-2 py-0.5 rounded w-full text-center mt-2 tracking-wider shadow-xs">
              3 6 9 12
            </div>
          </div>
          {/* White pill with 2.95 */}
          <span className="bg-white text-slate-900 font-mono font-black text-sm sm:text-base px-3 py-0.5 rounded-full shadow-xs mt-auto">
            2.95
          </span>
          {stagedBets['blue'] && (
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-blue-950 font-black text-[10px] px-1.5 rounded-full shadow border border-yellow-200 font-mono z-10">
              {stagedBets['blue'].toLocaleString()}៛
            </span>
          )}
        </button>
      </div>

      {/* 3. THE 12 ZODIAC NUMBER CARDS (Exact Replica of Photo 1) */}
      {/* 2 Rows x 6 Columns:
          - Row 1: Cards 1 (ជូត), 2 (ឆ្លូវ), 3 (ខាល), 4 (ថោះ), 5 (រោង), 6 (ម្សាញ់)
          - Row 2: Cards 7 (មមី), 8 (មមែ), 9 (វក), 10 (រកា), 11 (ច), 12 (កុរ) */}
      <div className="flex-1 flex flex-col">
        <div
          className="grid grid-cols-6 gap-1.5 flex-1 max-w-full rounded-lg p-1.5"
          style={{
            width: '511px',
            height: '651.5px',
            paddingBottom: '300px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: '#ede8e8',
          }}
        >
          {ZODIAC_ITEMS.map((item) => {
            const betKey = `num-${item.number}`;
            const betAmount = stagedBets[betKey] || 0;
            const colorHex =
              item.color === 'red'
                ? '#dc2626'
                : item.color === 'green'
                ? '#16a34a'
                : '#1e40af';

            return (
              <button
                key={`zodiac-card-btn-${item.number}`}
                onClick={() =>
                  handleBetClick(
                    betKey,
                    'number',
                    `លេខ ${item.number} (${item.khmerName})`,
                    11,
                    item.number
                  )
                }
                disabled={isDrawing}
                className={`relative flex flex-col justify-between p-2 rounded-lg border-2 transition-all select-none text-left cursor-pointer overflow-hidden h-[150px] ${
                  betAmount > 0
                    ? 'border-amber-400 ring-2 ring-amber-300'
                    : 'border-[#ccbe9b] hover:border-blue-400 hover:shadow-md'
                }`}
                style={{ backgroundColor: '#fef8dc', height: '150px' }}
                title={`លេខ ${item.number} (${item.khmerName}) - សង 11 ដង`}
              >
                {/* Top-Left: Khmer Animal Name in the card's authentic color */}
                <div className="flex items-start justify-between w-full">
                  <span
                    className="font-black font-moul tracking-wide drop-shadow-xs"
                    style={{
                      color: colorHex,
                      fontSize: '23px',
                      lineHeight: '21px',
                    }}
                  >
                    {item.khmerName}
                  </span>
                </div>

                {/* Bottom Row: Large Number on Bottom-Left & Multiplier 11 on Bottom-Right */}
                <div className="flex items-end justify-between w-full mt-auto pt-2">
                  <span
                    className="font-black font-sans tracking-tight"
                    style={{
                      color: colorHex,
                      fontSize: '50px',
                      lineHeight: '51px',
                    }}
                  >
                    {item.number}
                  </span>
                  <span
                    className="font-black font-sans leading-none text-xs sm:text-sm"
                    style={{ color: colorHex }}
                  >
                    11
                  </span>
                </div>

                {/* Placed Chip Badge on this number */}
                {betAmount > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-blue-950 font-black text-[9px] px-1.5 py-0.5 rounded-full shadow border border-yellow-200 z-10 font-mono">
                    {betAmount.toLocaleString()}៛
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
