import React from 'react';
import { RefreshCw, Volume2, VolumeX, Sparkles, Sprout, Bot, HelpCircle, Wallet } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  balance: number;
  activeBetsTotal: number;
  activeTab: 'lottery' | 'financials' | 'results' | 'plants';
  setActiveTab: (tab: 'lottery' | 'financials' | 'results' | 'plants') => void;
  openPlantModal: () => void;
  openChatModal: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  lang: 'km' | 'en';
  setLang: (l: 'km' | 'en') => void;
  onTopUp: () => void;
  roundId: string;
}

export const Header: React.FC<HeaderProps> = ({
  balance,
  activeBetsTotal,
  activeTab,
  setActiveTab,
  openPlantModal,
  openChatModal,
  soundEnabled,
  toggleSound,
  lang,
  setLang,
  onTopUp,
  roundId,
}) => {
  return (
    <header className="w-full bg-[#2c5cb7] text-white shadow-md select-none">
      {/* Top Main Navigation Bar */}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-blue-400/30">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 mr-2 sm:mr-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-200 text-blue-900 font-extrabold flex items-center justify-center shadow text-lg tracking-wider border border-yellow-300">
              Y12
            </div>
            <div>
              <div className="font-extrabold text-base tracking-wide flex items-center gap-1.5 leading-none">
                <span>YUKI 12</span>
                <span className="text-[10px] font-semibold bg-amber-400 text-blue-950 px-1.5 py-0.5 rounded-full uppercase">
                  Live
                </span>
              </div>
              <div className="text-[11px] text-blue-200 font-khmer leading-none mt-0.5">
                វេទិកាឆ្នោត យូគី ១២ & FloraBot
              </div>
            </div>
          </div>

          {/* Navigation Tabs (matching screenshot) */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('lottery')}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'lottery'
                  ? 'bg-amber-400 text-blue-950 shadow-sm'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <span>{lang === 'km' ? 'ឆ្នោត' : 'Lottery'}</span>
            </button>
            <button
              onClick={() => setActiveTab('financials')}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'financials'
                  ? 'bg-amber-400 text-blue-950 shadow-sm'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <span>{lang === 'km' ? 'ឈ្នះចាញ់' : 'Win/Loss'}</span>
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'results'
                  ? 'bg-amber-400 text-blue-950 shadow-sm'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <span>{lang === 'km' ? 'លទ្ធផល' : 'Results'}</span>
            </button>
            <button
              onClick={openPlantModal}
              className="px-3 py-1.5 rounded text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-white transition-all flex items-center gap-1.5 shadow-sm ml-1"
              title="Identify plants and get care guides"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>{lang === 'km' ? 'រុក្ខជាតិ & AI' : 'Plant AI'}</span>
            </button>
          </nav>
        </div>

        {/* User Balance & Actions */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          {/* Quick Balance Pill */}
          <div className="hidden md:flex items-center gap-2 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-400/30">
            <Wallet className="w-3.5 h-3.5 text-amber-300" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-blue-200">
                {lang === 'km' ? 'សមតុល្យ (KHR)' : 'Balance (KHR)'}
              </span>
              <span className="font-mono font-bold text-amber-300 text-sm leading-tight">
                {balance.toLocaleString()} ៛
              </span>
            </div>
            <button
              onClick={onTopUp}
              className="ml-1 bg-amber-400 hover:bg-amber-300 text-blue-950 px-2 py-0.5 rounded font-bold text-[11px] transition shadow"
              title="Add Play Balance"
            >
              + 100,000៛
            </button>
          </div>

          {/* AI Chatbot Launcher */}
          <button
            onClick={openChatModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg shadow transition"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>FloraBot AI</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded hover:bg-white/10 text-blue-200 hover:text-white transition"
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-300" />}
          </button>

          {/* Language Switch */}
          <button
            onClick={() => setLang(lang === 'km' ? 'en' : 'km')}
            className="bg-blue-800/80 hover:bg-blue-700 text-white px-2 py-1 rounded text-[11px] font-bold border border-blue-400/30 transition"
          >
            {lang === 'km' ? '🇰🇭 ខ្មែរ' : '🇺🇸 ENG'}
          </button>
        </div>
      </div>

      {/* Subheader Strip: Date, Currency & Serial as in Screenshot */}
      <div className="bg-[#244f9c] px-3 sm:px-5 py-1 text-[11px] sm:text-xs text-blue-200 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-white font-semibold">2026-10-18 (KHR)</span>
          <span className="text-blue-300">PPRTFFDV001</span>
          <span className="bg-blue-900/60 text-amber-300 px-1.5 py-0.5 rounded text-[10px]">
            {roundId}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="hover:text-white transition inline-flex items-center"
            title="Refresh game data"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-blue-100">
          <span className="hidden sm:inline">
            {lang === 'km'
              ? 'វេននីមួយៗ 3 នាទី | សង 11 ដងលើលេខនីមួយៗ'
              : 'Every 3 min draw | 11x payout on single numbers'}
          </span>
        </div>
      </div>
    </header>
  );
};
