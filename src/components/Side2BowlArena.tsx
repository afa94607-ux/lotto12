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

  // revealedStep tracking:
  // 0: All hidden (while betting, all bowls are closed)
  // 1 to 6: Line 1 numbers uncover one by one
  // 7 to 11: Line 2 numbers uncover one by one
  // 12: Line 3 (the last line) uncovers the REAL WINNING RESULT!
  const [revealedStep, setRevealedStep] = useState<number>(0);
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);
  const onRevealCompleteRef = useRef(onRevealComplete);
  onRevealCompleteRef.current = onRevealComplete;

  // Track the active draw round so the animation sequence runs through to Step 12 without interruption
  const activeDrawIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isDrawing && activeDrawSequence) {
      // Use round ID + timestamp to identify this specific draw run
      const drawRunKey = `${activeDrawSequence.finalResult.roundId}-${activeDrawSequence.finalResult.number}`;
      if (activeDrawIdRef.current === drawRunKey) {
        // Animation for this draw is already scheduled/running, do not restart or interrupt it!
        return;
      }
      activeDrawIdRef.current = drawRunKey;

      // Clear any prior pending timers
      animationTimersRef.current.forEach((t) => clearTimeout(t));
      animationTimersRef.current = [];

      // Step 0: Ensure all bowls are closed first
      setRevealedStep(0);
      sound.playBowlShuffle();

      // Uniform timestamp interval: exactly 1500ms across all lines (Line 1, Line 2, Line 3)
      const interval = fastMode ? 500 : 1500;
      const celebrationHold = fastMode ? 3500 : 7000;

      let currentTime = interval;

      // All 12 numbers reveal at the exact same 1500ms timestamp interval across all lines:
      // Line 1: steps 1 to 6 (1500ms each)
      // Line 2: steps 7 to 11 (1500ms each)
      // Line 3: step 12 (1500ms - exact same timestamp interval!)
      for (let step = 1; step <= 12; step++) {
        const s = step;
        const tid = setTimeout(() => {
          setRevealedStep(s);
          if (s === 12) {
            sound.playReveal();

            // Hold display of full results and winning number on the last line
            const completeTid = setTimeout(() => {
              onRevealCompleteRef.current();
              // Reset to hide while betting for the new round
              setRevealedStep(0);
              activeDrawIdRef.current = null;
            }, celebrationHold);
            animationTimersRef.current.push(completeTid);
          } else {
            sound.playBowlFlip(s);
          }
        }, currentTime);

        animationTimersRef.current.push(tid);
        currentTime += interval;
      }
    } else if (!isDrawing) {
      // While betting, all results are hide
      activeDrawIdRef.current = null;
      setRevealedStep(0);
    }
  }, [isDrawing, activeDrawSequence, fastMode]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach((t) => clearTimeout(t));
      animationTimersRef.current = [];
    };
  }, []);

  // Current active cards for the 3 lines
  const line1Cards = activeDrawSequence?.line1 || [1, 5, 10, 8, 9, 11];
  const line2Cards = activeDrawSequence?.line2 || [4, 2, 12, 3, 7];
  const line3Card = activeDrawSequence?.finalResult.number || lastFinalResult?.number || 6;
  const line3FinalResult = activeDrawSequence?.finalResult || lastFinalResult;

  return (
    <div className="flex flex-col gap-2.5 bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm h-full overflow-y-auto select-none">
      {/* 1. Header with schedule info & demo buttons */}
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
             Line 1: 6 numbers (reveals one by one)
             Line 2: 5 numbers (reveals one by one)
             Line 3: 1 number (THE REAL RESULT FROM THE LAST LINE)
             - Hidden while betting
             - Reveals step by step from Line 1 to Line 2 to the last line */}
      <div className="relative bg-[#f8fafc] rounded-xl p-3 sm:p-4 text-slate-800 shadow-sm flex flex-col items-center justify-center min-h-[350px] border border-slate-200 overflow-hidden w-full">
        {/* Status indicator bar */}
        <div className="mb-2.5 text-center">
          {revealedStep === 12 ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-1 rounded-full shadow-xs animate-bounce">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>
                {lang === 'km'
                  ? `លទ្ធផលឈ្នះពិតប្រាកដ (ជួរចុងក្រោយ): លេខ ${line3Card}`
                  : `Real Winning Result (Last Line): #${line3Card}`}
              </span>
            </div>
          ) : isDrawing ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-3.5 py-1 rounded-full shadow-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>
                {revealedStep === 0
                  ? (lang === 'km' ? 'កំពុងរៀបចំចាប់ឆ្នោត...' : 'Preparing Draw...')
                  : revealedStep <= 6
                  ? (lang === 'km'
                      ? `ជួរទី ១: បើកម្ដងមួយៗ (${revealedStep}/6)...`
                      : `Line 1: Revealing one by one (${revealedStep}/6)...`)
                  : revealedStep < 11
                  ? (lang === 'km'
                      ? `ជួរទី ២: បើកម្ដងមួយៗ (${revealedStep - 6}/5)...`
                      : `Line 2: Revealing one by one (${revealedStep - 6}/5)...`)
                  : (lang === 'km'
                      ? 'ជួរចុងក្រោយ: ត្រៀមបើកលេខឈ្នះពិតប្រាកដ...'
                      : 'Last Line: Opening real winning result...')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>
                {lang === 'km'
                  ? 'លទ្ធផលត្រូវបានលាក់ទុកសិនពេលកំពុងចាក់ (នឹងបើកម្ដងមួយៗពីជួរទី ១ ដល់ជួរចុងក្រោយ)'
                  : 'Results hidden while betting (reveals one by one to the last line)'}
              </span>
              <span className="font-mono font-bold text-blue-800 bg-white px-2 py-0.2 rounded border border-slate-200 text-[10px]">
                {Math.floor(countdownSeconds / 60)}:{(countdownSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* LINE 1: 6 Numbers (reveals one by one from first number) */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full mb-2 z-10">
          {line1Cards.map((num, idx) => {
            const stepNum = idx + 1;
            const isRevealed = revealedStep >= stepNum;
            const isJustRevealed = isDrawing && revealedStep === stepNum;
            return (
              <div
                key={`line1-card-${idx}`}
                className={`transition-all duration-300 transform ${
                  isJustRevealed ? 'scale-110 z-20 drop-shadow-md' : 'hover:scale-105'
                }`}
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

        {/* LINE 2: 5 Numbers (reveals one by one) */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full mb-2.5 z-10">
          {line2Cards.map((num, idx) => {
            const stepNum = 6 + idx + 1;
            const isRevealed = revealedStep >= stepNum;
            const isJustRevealed = isDrawing && revealedStep === stepNum;
            return (
              <div
                key={`line2-card-${idx}`}
                className={`transition-all duration-300 transform ${
                  isJustRevealed ? 'scale-110 z-20 drop-shadow-md' : 'hover:scale-105'
                }`}
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

        {/* LINE 3: 1 Final Number
            *** THE REAL RESULT WE TAKE FROM THE LAST LINE *** */}
        <div className="z-10 flex flex-col items-center mt-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 font-mono flex items-center gap-1.5">
            {revealedStep === 12 ? (
              <span className="text-amber-700 bg-amber-50 border border-amber-300 px-3 py-0.5 rounded-md shadow-xs animate-pulse">
                ★ {lang === 'km' ? 'លទ្ធផលឈ្នះពិតប្រាកដពីជួរចុងក្រោយ' : 'REAL WINNING RESULT (FROM LAST LINE)'} ★
              </span>
            ) : isDrawing && revealedStep >= 10 ? (
              <span className="text-amber-700 bg-amber-100 border border-amber-400 px-3 py-0.5 rounded-md shadow-xs animate-bounce font-bold">
                ⏳ {lang === 'km' ? 'កំពុងរង់ចាំបើកកែវឈ្នះចុងក្រោយ...' : 'Anticipating Last Line Result...'} ⏳
              </span>
            ) : (
              <span className="text-slate-500">
                {lang === 'km' ? 'កែវលទ្ធផលឈ្នះពិតប្រាកដ (ជួរចុងក្រោយ)' : 'Last Line (Real Winning Result)'}
              </span>
            )}
          </div>

          <div className="transition-all duration-500">
            {revealedStep === 12 ? (
              <div className="animate-in zoom-in-75 duration-400 flex flex-col items-center">
                <ZodiacCard num={line3Card} isLarge isFinalResult />
                {line3FinalResult && (
                  <div className="mt-1.5 text-center">
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded">
                      #{line3FinalResult.number} {line3FinalResult.khmerName} ({line3FinalResult.englishName})
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className={isDrawing && revealedStep >= 10 ? 'animate-bounce' : ''}>
                <GoldenBowl isLarge />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Old Bet Results (Bead Road & Straight Lines) */}
      <div className="border border-slate-200 rounded-lg p-2 bg-white flex flex-col flex-1">
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
