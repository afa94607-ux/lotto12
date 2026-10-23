import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Play, FastForward, Clock } from 'lucide-react';
import { RoundResult } from '../types/yuki';
import { GoldenBowl } from './GoldenBowl';
import { ZodiacCard } from './ZodiacCardArt';
import { BigSmallStreakRoad } from './BigSmallStreakRoad';
import { sound } from '../utils/audio';

export interface ActiveDrawSequence {
  line1: number[]; // 6 numbers
  line2: number[]; // 5 numbers
  finalResult: RoundResult; // The 1 final number taken as winning result!
}

interface Side2BowlArenaProps {
  countdownSeconds: number;
  totalCycleSeconds: number;
  currentRoundId: string;
  isDrawing: boolean;
  activeDrawSequence: ActiveDrawSequence | null;
  lastFinalResult: RoundResult | null;
  pastResults: RoundResult[];
  onTriggerDrawNow: () => void;
  onRevealComplete: () => void;
  fastMode: boolean;
  setFastMode: (fast: boolean) => void;
  lang: 'km' | 'en';
}

export const Side2BowlArena: React.FC<Side2BowlArenaProps> = ({
  countdownSeconds,
  totalCycleSeconds,
  currentRoundId,
  isDrawing,
  activeDrawSequence,
  lastFinalResult,
  pastResults,
  onTriggerDrawNow,
  onRevealComplete,
  fastMode,
  setFastMode,
  lang,
}) => {
  const [selectedHistoricalRound, setSelectedHistoricalRound] = useState<RoundResult | null>(null);

  // revealedStep: 0 means all hidden.
  // 1 to 6: Line 1 bowls revealing one by one.
  // 7 to 11: Line 2 bowls revealing one by one.
  // 12: Line 3 (the 1 final winning number) reveals!
  const [revealedStep, setRevealedStep] = useState<number>(0);
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);


  // Step-by-step one-by-one animation when draw begins
  useEffect(() => {
    // Clear any pending timers
    animationTimersRef.current.forEach((t) => clearTimeout(t));
    animationTimersRef.current = [];

    if (isDrawing && activeDrawSequence) {
      setRevealedStep(0);
      sound.playBowlShuffle();

      // Step-by-step one-by-one reveal
      // Line 1: 6 bowls (steps 1 through 6)
      // Line 2: 5 bowls (steps 7 through 11)
      // Line 3: 1 bowl (step 12 - the winning final result)
      const stepInterval = 240; // 240ms per bowl

      for (let s = 1; s <= 11; s++) {
        const tid = setTimeout(() => {
          setRevealedStep(s);
          sound.playChip();
        }, s * stepInterval);
        animationTimersRef.current.push(tid);
      }

      // Final Step 12: Reveal Line 3 with dramatic fanfare
      const finalTid = setTimeout(() => {
        setRevealedStep(12);
        sound.playReveal();

        // Signal completion so App updates balance, bet slips, and bead road
        const completeTid = setTimeout(() => {
          onRevealComplete();
        }, 400);
        animationTimersRef.current.push(completeTid);
      }, 12 * stepInterval + 300); // brief suspense pause before final card

      animationTimersRef.current.push(finalTid);

      return () => {
        animationTimersRef.current.forEach((t) => clearTimeout(t));
      };
    } else if (!isDrawing) {
      // If we are in the middle of active countdown, hide all bowls!
      // Keep showing result only during the first 12 seconds after draw celebration
      const celebrationSeconds = fastMode ? 5 : 12;
      const isCelebrating = countdownSeconds > (totalCycleSeconds - celebrationSeconds) && revealedStep === 12;
      if (!isCelebrating) {
        // Hide all results! All 3 lines closed!
        setRevealedStep(0);
      }
    }
  }, [isDrawing, activeDrawSequence, countdownSeconds, fastMode, totalCycleSeconds]);

  // Determine current active cards for the 3 lines
  const line1Cards = activeDrawSequence?.line1 || [1, 5, 10, 8, 9, 11];
  const line2Cards = activeDrawSequence?.line2 || [4, 2, 12, 3, 7];
  const line3Card = activeDrawSequence?.finalResult.number || lastFinalResult?.number || 6;



  return (
    <div className="flex flex-col gap-2.5 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm h-full overflow-y-auto select-none">
      {/* 1. Header with 3-minute schedule info & fast test toggle */}
      <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200/60 px-3 py-1.5 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <span className="font-bold text-blue-900">
              {lang === 'km' ? 'វេនចេញលទ្ធផលរៀងរាល់ 3 នាទី' : 'Draws Every 3 Minutes'}
            </span>
            <span className="text-slate-500 text-[11px] ml-1.5 font-mono">
              ({currentRoundId})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Fast demo mode toggle */}
          <button
            onClick={() => setFastMode(!fastMode)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition border ${
              fastMode
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle between 3-minute official timer and 15-second fast demo"
          >
            <FastForward className="w-3 h-3" />
            <span>{fastMode ? (lang === 'km' ? 'តេស្តលឿន (15s)' : 'Fast 15s') : (lang === 'km' ? 'ធម្មតា 3m' : '3-Min')}</span>
          </button>

          {/* Draw now button for instant testing */}
          <button
            onClick={onTriggerDrawNow}
            disabled={isDrawing}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs transition"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{lang === 'km' ? 'ចេញភ្លាម' : 'Draw Now'}</span>
          </button>
        </div>
      </div>

      {/* 2. Three Lines Golden Bowls Arena:
             Line 1: 6 numbers
             Line 2: 5 numbers
             Line 3: 1 number (THE NUMBER WE TAKE AS THE WINNING AND LAST RESULT)
             Hidden first, then revealed step by step one by one! */}
      <div
        className="relative bg-[#f8fafc] rounded-xl p-3 sm:p-4 text-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[350px] border border-slate-200 overflow-hidden max-w-full"
        style={{ height: '350.3px', width: '900.2px' }}
      >
        {/* Status indicator bar */}
        <div className="mb-2.5 text-center">
          {revealedStep === 12 ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-1 rounded-full shadow-xs animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>
                {lang === 'km'
                  ? `លទ្ធផលឈ្នះផ្លូវការចុងក្រោយ: លេខ ${line3Card}`
                  : `Winning Final Result: #${line3Card}`}
              </span>
            </div>
          ) : isDrawing ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full shadow-xs animate-pulse font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>
                {lang === 'km'
                  ? `កំពុងបើកម្តងមួយៗ... (${revealedStep}/12)`
                  : `Revealing step-by-step... (${revealedStep}/12)`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>
                {lang === 'km'
                  ? 'លទ្ធផលត្រូវបានលាក់ទុកសិន (នឹងបើកម្តងមួយៗរៀងរាល់ 3 នាទី)'
                  : 'Results hidden under bowls (Reveals step-by-step after 3 minutes)'}
              </span>
              <span className="font-mono font-bold text-blue-800 bg-white px-2 py-0.2 rounded border border-slate-200 text-[10px]">
                {Math.floor(countdownSeconds / 60)}:{(countdownSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* LINE 1: 6 Numbers (Positions 1 to 6) */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full mb-2 z-10">
          {line1Cards.map((num, idx) => {
            const isRevealed = revealedStep >= idx + 1;
            return (
              <div
                key={`line1-card-${idx}`}
                className="transition-transform duration-300 transform hover:scale-105"
              >
                {isRevealed ? (
                  <div className="animate-in flip-in-y duration-300">
                    <ZodiacCard num={num} />
                  </div>
                ) : (
                  <GoldenBowl />
                )}
              </div>
            );
          })}
        </div>

        {/* LINE 2: 5 Numbers (Positions 7 to 11) */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full mb-2.5 z-10">
          {line2Cards.map((num, idx) => {
            const isRevealed = revealedStep >= 6 + idx + 1;
            return (
              <div
                key={`line2-card-${idx}`}
                className="transition-transform duration-300 transform hover:scale-105"
              >
                {isRevealed ? (
                  <div className="animate-in flip-in-y duration-300">
                    <ZodiacCard num={num} />
                  </div>
                ) : (
                  <GoldenBowl />
                )}
              </div>
            );
          })}
        </div>

        {/* LINE 3: 1 Final Number (THE NUMBER WE TAKE AS THE WINNING AND LAST RESULT) */}
        <div className="z-10 flex flex-col items-center mt-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 font-mono flex items-center gap-1.5">
            {revealedStep === 12 ? (
              <span className="text-amber-700 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-md shadow-xs animate-pulse">
                ★ {lang === 'km' ? 'លេខឈ្នះផ្លូវការចុងក្រោយ (យកលេខនេះជាលទ្ធផល)' : 'THE FINAL WINNING RESULT (OFFICIAL)'} ★
              </span>
            ) : (
              <span className="text-slate-500">
                {lang === 'km' ? 'កែវលទ្ធផលឈ្នះចុងក្រោយ (ជួរទី 3)' : 'Line 3 Final Winning Result'}
              </span>
            )}
          </div>

          <div className="transition-all duration-500">
            {revealedStep === 12 ? (
              <div className="animate-in zoom-in-75 duration-400">
                <ZodiacCard num={line3Card} isLarge isFinalResult />
              </div>
            ) : (
              <div className={isDrawing && revealedStep === 11 ? 'animate-bounce' : ''}>
                <GoldenBowl isLarge />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Old Bet Results (Bead Road & Straight Lines) */}
      <div className="border border-slate-200 rounded-lg p-2 bg-white flex flex-col flex-1">
        {/* Bead Road & Big/Small Road */}
        <BigSmallStreakRoad
          pastResults={pastResults}
          onSelectRound={setSelectedHistoricalRound}
          selectedRound={selectedHistoricalRound}
          lang={lang}
        />

        {/* Detail inspection tooltip/card if user clicked a bead or row */}
        {selectedHistoricalRound && (
          <div className="mt-2 p-2 rounded bg-blue-50 border border-blue-200 flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-900">
                {selectedHistoricalRound.roundId} ({selectedHistoricalRound.drawTime})
              </span>
              <span className="font-bold text-slate-800">
                #{selectedHistoricalRound.number} {selectedHistoricalRound.khmerName} ({selectedHistoricalRound.englishName})
              </span>
              <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border text-slate-600">
                {selectedHistoricalRound.isBig ? 'Big ធំ' : 'Small តូច'} | {selectedHistoricalRound.color.toUpperCase()} |{' '}
                {selectedHistoricalRound.isEven ? 'Even គូ' : 'Odd សេស'}
              </span>
            </div>
            <button
              onClick={() => setSelectedHistoricalRound(null)}
              className="text-slate-400 hover:text-slate-600 text-[10px] font-bold"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
