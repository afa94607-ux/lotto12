import React from 'react';
import { Trophy, Sparkles, Check, X } from 'lucide-react';
import { RoundResult } from '../types/yuki';

interface WinModalProps {
  isOpen: boolean;
  onClose: () => void;
  winningResult: RoundResult | null;
  totalWon: number;
  lang: 'km' | 'en';
}

export const WinModal: React.FC<WinModalProps> = ({
  isOpen,
  onClose,
  winningResult,
  totalWon,
  lang,
}) => {
  if (!isOpen || !winningResult || totalWon <= 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className="bg-gradient-to-b from-blue-900 via-indigo-950 to-blue-950 text-white rounded-2xl p-6 shadow-2xl border-2 border-yellow-400 max-w-sm w-full text-center relative overflow-hidden">
        {/* Confetti / Sparkle background effects */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 animate-pulse" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-blue-200 hover:text-white p-1 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-blue-950 mx-auto flex items-center justify-center mb-3 shadow-lg shadow-yellow-500/40 ring-4 ring-yellow-400/40">
          <Trophy className="w-8 h-8 text-blue-950" />
        </div>

        <h3 className="text-xl font-black text-amber-300 uppercase tracking-wider font-mono">
          {lang === 'km' ? 'អបអរសាទរ! ឈ្នះរង្វាន់!' : 'CONGRATULATIONS!'}
        </h3>
        <p className="text-xs text-blue-200 mt-1">
          {lang === 'km' ? 'វេនចេញលទ្ធផល:' : 'Round Result:'} <b>{winningResult.roundId}</b>
        </p>

        {/* Revealed Number & Badge */}
        <div className="my-4 py-3 px-4 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center gap-3">
          <div className="text-4xl font-black text-yellow-300 font-mono">
            {winningResult.number}
          </div>
          <div className="text-left">
            <div className="font-extrabold text-base text-white font-khmer">
              {winningResult.khmerName} ({winningResult.englishName})
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs">
              <span
                className={`px-1.5 py-0.2 rounded font-bold ${
                  winningResult.isBig ? 'bg-rose-500' : 'bg-cyan-500'
                }`}
              >
                {winningResult.isBig ? 'Big ធំ' : 'Small តូច'}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded font-bold text-white ${
                  winningResult.color === 'red'
                    ? 'bg-red-500'
                    : winningResult.color === 'green'
                    ? 'bg-emerald-600'
                    : 'bg-blue-600'
                }`}
              >
                {winningResult.color.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Total Won Payout */}
        <div className="bg-amber-400 text-blue-950 rounded-xl p-3 shadow-md mb-4">
          <span className="text-[11px] font-bold uppercase tracking-wider block">
            {lang === 'km' ? 'ទឹកប្រាក់ឈ្នះសរុប' : 'Total Payout Won'}
          </span>
          <span className="text-2xl font-black font-mono">
            +{totalWon.toLocaleString()} ៛
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-xl shadow transition"
        >
          {lang === 'km' ? 'បន្តលេង' : 'Continue Playing'}
        </button>
      </div>
    </div>
  );
};
