import React, { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { BetCategory } from '../types/yuki';
import { sound } from '../utils/audio';

export interface BetModalTarget {
  category: BetCategory;
  label: string;
  multiplier: number;
  targetNumber?: number;
  notes?: string;
}

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: BetModalTarget | null;
  currentRoundId: string;
  onConfirmBet: (amount: number, target: BetModalTarget, notes?: string) => void;
  balance: number;
  lang: 'km' | 'en';
}

const YELLOW_CHIPS = [
  { label: '1ពាន់', value: 1000 },
  { label: '2ពាន់', value: 2000 },
  { label: '5ពាន់', value: 5000 },
  { label: '1ម៉ឺន', value: 10000 },
  { label: '2ម៉ឺន', value: 20000 },
  { label: '5ម៉ឺន', value: 50000 },
  { label: '20ម៉ឺន', value: 200000 },
  { label: '50ម៉ឺន', value: 500000 },
];

export const BettingModal: React.FC<BettingModalProps> = ({
  isOpen,
  onClose,
  target,
  currentRoundId,
  onConfirmBet,
  balance,
  lang,
}) => {
  const [betAmount, setBetAmount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSinglePost, setIsSinglePost] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Live clock: e.g. 15:07:46
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-GB', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setBetAmount(0);
      setNotes(target?.notes || '');
    }
  }, [isOpen, target]);

  if (!isOpen || !target) return null;

  const handleAddChip = (val: number) => {
    sound.playChip();
    setBetAmount((prev) => Math.min(prev + val, 1000000));
  };

  const handleClear = () => {
    sound.playChip();
    setBetAmount(0);
    setNotes('');
  };

  const handleBet = () => {
    if (betAmount < 100) {
      alert(lang === 'km' ? 'ចំនួនតិចបំផុតគឺ 100៛' : 'Minimum bet is 100 Riel');
      return;
    }
    if (betAmount > balance) {
      alert(lang === 'km' ? 'សមតុល្យមិនគ្រប់គ្រាន់ទេ!' : 'Insufficient balance!');
      return;
    }
    sound.playChip();
    onConfirmBet(betAmount, target, notes.trim() || undefined);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const headerTime = currentTime ? currentTime.substring(0, 5) : '15:08';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[540px] overflow-hidden border border-slate-300 font-sans">
        {/* Top Header: Round ID & Time, Print & Close X (Exact replica of photo) */}
        <div className="bg-[#1f3a8a] px-4 py-2.5 flex items-center justify-between text-white">
          <div className="text-base sm:text-lg font-bold font-mono tracking-wide">
            {currentRoundId} {headerTime}
          </div>
          <div className="flex items-center gap-2">
            {/* Green Print Button */}
            <button
              onClick={handlePrint}
              className="w-8 h-8 rounded bg-[#16a34a] hover:bg-[#15803d] text-white flex items-center justify-center shadow-xs transition cursor-pointer"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
            {/* Red Close X Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded bg-[#dc2626] hover:bg-[#b91c1c] text-white font-black text-sm flex items-center justify-center shadow-xs transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Subheader Strip: 3 segment table (ប្រភេទភ្នាល់, ពហុគុណ, ម៉ោង) matching photo exactly */}
        <div className="bg-[#172554] border-t border-b border-blue-900 grid grid-cols-3 text-xs sm:text-sm text-white divide-x divide-blue-800">
          {/* Segment 1: ប្រភេទភ្នាល់ */}
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <span className="font-khmer text-slate-100 font-bold">ប្រភេទភ្នាល់:</span>
            <span className="text-[#22c55e] font-khmer font-black text-sm sm:text-base ml-1">
              {target.label}
            </span>
          </div>

          {/* Segment 2: ពហុគុណ */}
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <span className="font-khmer text-slate-100 font-bold">ពហុគុណ:</span>
            <span className="text-[#22c55e] font-mono font-black text-sm sm:text-base ml-1">
              {target.multiplier}
            </span>
          </div>

          {/* Segment 3: ម៉ោង */}
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <span className="font-khmer text-slate-100 font-bold">ម៉ោង:</span>
            <span className="text-[#22c55e] font-mono font-black text-xs sm:text-sm ml-1">
              {currentTime}
            </span>
          </div>
        </div>

        {/* Main Blue Container Box (Deep Blue #1c398e matching photo) */}
        <div className="p-4 bg-white">
          <div className="bg-[#1c398e] rounded-xl p-5 text-white shadow-md flex flex-col gap-6">
            {/* Top row: លុយភ្នាល់: and white input field */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-lg sm:text-xl font-black font-khmer text-white tracking-wide">
                លុយភ្នាល់:
              </span>
              <div className="flex-1 max-w-[240px]">
                <div className="bg-white rounded-md px-3 py-2 text-left shadow-inner flex items-center">
                  <span className="font-mono font-black text-xl sm:text-2xl text-[#16a34a] leading-none">
                    {betAmount === 0 ? '0' : betAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 8 Big Circular Yellow Chips (2 rows x 4 columns) with Red Khmer Labels */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 justify-items-center py-1">
              {YELLOW_CHIPS.map((chip, idx) => (
                <button
                  key={`yellow-chip-${idx}`}
                  onClick={() => handleAddChip(chip.value)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#ffe600] hover:bg-[#ffd700] active:scale-95 shadow-lg shadow-black/40 border-2 border-[#fff368] flex items-center justify-center transition-transform cursor-pointer group"
                  title={`+${chip.value.toLocaleString()} ៛`}
                >
                  <span className="text-[#dc2626] font-black text-sm sm:text-base font-khmer leading-none drop-shadow-xs group-hover:scale-105 transition-transform">
                    {chip.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Under blue container: Limits & Checkbox matching photo */}
          <div className="mt-4 flex flex-col gap-2.5 px-1 text-xs sm:text-sm font-bold text-slate-800">
            <div className="flex items-center justify-between text-slate-900 font-khmer">
              <div>
                <span>ចំនួនតិចបំផុត: </span>
                <span className="font-mono font-bold text-slate-800">100</span>
              </div>
              <div>
                <span>ចំនួនច្រើនបំផុត: </span>
                <span className="font-mono font-bold text-slate-800">1,000,000</span>
              </div>
            </div>

            {/* Checkbox: បញ្ជូនមួយប៉ុស្តិ៍ (as in photo) */}
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-normal">
              <input
                type="checkbox"
                checked={isSinglePost}
                onChange={(e) => setIsSinglePost(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 cursor-pointer"
              />
              <span className="font-khmer text-xs sm:text-sm text-slate-700">
                បញ្ជូនមួយប៉ុស្តិ៍
              </span>
            </label>

            {/* Additional Notes Field: Can be edited as long as bet has not been placed yet! */}
            <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 font-khmer">
                <span className="flex items-center gap-1 text-slate-700">
                  <span>📝</span>
                  <span>{lang === 'km' ? 'កំណត់ចំណាំបន្ថែម (Notes):' : 'Additional Note (Optional):'}</span>
                </span>
                <span className="text-[10px] text-blue-600 font-normal">
                  {lang === 'km' ? 'កែប្រែមុនពេលភ្នាល់' : 'Edit before placing'}
                </span>
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  lang === 'km'
                    ? 'វាយបញ្ចូលកំណត់ចំណាំ (ឧ. ឈ្មោះអ្នកលេង, តុ, សាខា...)'
                    : 'Enter note (e.g., Player Name, Desk, Branch, Memo)...'
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>
          </div>

          {/* Bottom Action Buttons: Green ភ្នាល់ (Bet) & Dark Red លុប (Clear) matching photo */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <button
              onClick={handleBet}
              disabled={betAmount < 100}
              className="bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white font-black text-base sm:text-lg py-2.5 sm:py-3 rounded-lg shadow-md transition font-khmer cursor-pointer"
            >
              ភ្នាល់
            </button>
            <button
              onClick={handleClear}
              className="bg-[#b91c1c] hover:bg-[#991b1b] text-white font-black text-base sm:text-lg py-2.5 sm:py-3 rounded-lg shadow-md transition font-khmer cursor-pointer"
            >
              លុប
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
