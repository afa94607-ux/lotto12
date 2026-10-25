import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Side1Financials } from './components/Side1Financials';
import { Side2BowlArena, ActiveDrawSequence } from './components/Side2BowlArena';
import { Side3BettingBoard } from './components/Side3BettingBoard';
import { PlantCareModal } from './components/PlantCareModal';
import { GeminiChatbot } from './components/GeminiChatbot';
import { WinModal } from './components/WinModal';
import { BettingModal, BetModalTarget } from './components/BettingModal';
import { ZODIAC_ITEMS, INITIAL_PAST_RESULTS } from './data/zodiac';
import { BetCategory, BetSlipRecord, PlacedBet, RoundResult } from './types/yuki';
import { sound, KHMER_COUNTDOWN_MAP, KHMER_GOODLUCK_MESSAGE } from './utils/audio';
import { HotColdAnalytics } from './components/HotColdAnalytics';
import { ResultsTableOfficial } from './components/ResultsTableOfficial';
import { OwnerWinLossReport } from './components/OwnerWinLossReport';
import { Volume2 } from 'lucide-react';

const OFFICIAL_CYCLE_SECONDS = 180; // Strictly 3 minutes (180 seconds) per draw

const INITIAL_SEED_SLIPS: BetSlipRecord[] = [
  {
    id: 'seed-slip-ex-1',
    ticketNumber: '444444465',
    roundId: '1989#195',
    date: '2026-10-23',
    time: '21:31:20',
    category: 'number',
    targetNumber: 7,
    label: 'លេខ 7 (មមី)',
    displayTarget: 'លេខ 7 (មមី)',
    stake: 1000,
    multiplier: 11,
    potentialPayback: 11000,
    result: 'won',
    payout: 11000,
    winningNumber: 7,
    wonAnimal: 'មមី',
    timestamp: Date.now() - 180000,
  },
  {
    id: 'seed-slip-ex-2',
    ticketNumber: '444444465',
    roundId: '1989#195',
    date: '2026-10-23',
    time: '21:31:20',
    category: 'number',
    targetNumber: 3,
    label: 'លេខ 3 (ខាល)',
    displayTarget: 'លេខ 3 (ខាល)',
    stake: 1000,
    multiplier: 11,
    potentialPayback: 11000,
    result: 'lost',
    payout: 0,
    winningNumber: 7,
    wonAnimal: 'មមី',
    timestamp: Date.now() - 180000,
  },
  {
    id: 'seed-slip-1',
    ticketNumber: '444444463',
    roundId: '1989#194',
    date: '2026-10-23',
    time: '21:28:15',
    category: 'number',
    targetNumber: 5,
    label: 'លេខ 5 (រោង)',
    displayTarget: 'លេខ 5 (រោង)',
    stake: 10000,
    multiplier: 11,
    potentialPayback: 110000,
    result: 'won',
    payout: 110000,
    winningNumber: 5,
    wonAnimal: 'រោង',
    timestamp: Date.now() - 360000,
  },
  {
    id: 'seed-slip-2',
    ticketNumber: '444444463',
    roundId: '1989#194',
    date: '2026-10-23',
    time: '21:28:15',
    category: 'big',
    label: 'ធំ (Big 7-12)',
    displayTarget: 'ធំ (Big 7-12)',
    stake: 20000,
    multiplier: 1.95,
    potentialPayback: 39000,
    result: 'lost',
    payout: 0,
    winningNumber: 5,
    wonAnimal: 'រោង',
    timestamp: Date.now() - 360000,
  },
  {
    id: 'seed-slip-3',
    ticketNumber: '444444462',
    roundId: '1989#193',
    date: '2026-10-23',
    time: '21:25:04',
    category: 'small',
    label: 'តូច (Small 1-6)',
    displayTarget: 'តូច (Small 1-6)',
    stake: 5000,
    multiplier: 1.95,
    potentialPayback: 9750,
    result: 'won',
    payout: 9750,
    winningNumber: 2,
    wonAnimal: 'ឆ្លូវ',
    timestamp: Date.now() - 540000,
  },
  {
    id: 'seed-slip-4',
    ticketNumber: '444444461',
    roundId: '1989#192',
    date: '2026-10-23',
    time: '21:22:30',
    category: 'number',
    targetNumber: 1,
    label: 'លេខ 1 (ជូត)',
    displayTarget: 'លេខ 1 (ជូត)',
    stake: 2000,
    multiplier: 11,
    potentialPayback: 22000,
    result: 'won',
    payout: 22000,
    winningNumber: 1,
    wonAnimal: 'ជូត',
    timestamp: Date.now() - 720000,
  },
];

const loadSavedBetSlips = (): BetSlipRecord[] => {
  try {
    const saved = localStorage.getItem('yuki_bet_history');
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.some((s: BetSlipRecord) => s.id === 'seed-slip-ex-1')) {
          return [INITIAL_SEED_SLIPS[0], INITIAL_SEED_SLIPS[1], ...parsed];
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return INITIAL_SEED_SLIPS;
};

const getDisplayTarget = (category: BetCategory, targetNumber?: number): string => {
  if (category === 'number' && targetNumber !== undefined) {
    const item = ZODIAC_ITEMS.find((z) => z.number === targetNumber);
    return item ? `លេខ ${targetNumber} (${item.khmerName})` : `លេខ ${targetNumber}`;
  }
  switch (category) {
    case 'small':
      return 'តូច (Small 1-6)';
    case 'big':
      return 'ធំ (Big 7-12)';
    case 'odd':
      return 'សេស (Odd)';
    case 'even':
      return 'គូ (Even)';
    case 'red':
      return 'ក្រហម (Red)';
    case 'green':
      return 'បៃតង (Green)';
    case 'blue':
      return 'ខៀវ (Blue)';
    default:
      return category;
  }
};

export default function App() {
  // Navigation & Language
  const [activeTab, setActiveTab] = useState<'lottery' | 'financials' | 'results' | 'plants'>('lottery');
  const [lang, setLang] = useState<'km' | 'en'>('km');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isWinModalOpen, setIsWinModalOpen] = useState(false);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<BetModalTarget | null>(null);
  const [lastTotalWon, setLastTotalWon] = useState(0);

  // Financial State
  const [balance, setBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('yuki_balance');
      if (saved) return Number(saved) || 200000;
    } catch {
      // ignore
    }
    return 200000;
  });
  const [selectedChip, setSelectedChip] = useState<number>(10000); // 10,000 KHR default
  const [stagedBets, setStagedBets] = useState<Record<string, number>>({});
  const [activeBets, setActiveBets] = useState<PlacedBet[]>([]);
  const [lastRoundBets, setLastRoundBets] = useState<PlacedBet[]>([]);
  const [betSlips, setBetSlips] = useState<BetSlipRecord[]>(loadSavedBetSlips);
  const getInitialTicketCounter = () => {
    let maxNum = 444444469;
    try {
      const saved = localStorage.getItem('yuki_bet_history');
      if (saved) {
        const parsed: BetSlipRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          for (const s of parsed) {
            if (s.ticketNumber) {
              const num = parseInt(s.ticketNumber, 10);
              if (!isNaN(num) && num > maxNum) {
                maxNum = num;
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return maxNum;
  };
  const ticketCounterRef = useRef<number>(getInitialTicketCounter());

  const getNextTicketNumber = () => {
    ticketCounterRef.current += 1;
    return ticketCounterRef.current.toString();
  };

  // Persist balance and bet history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('yuki_balance', balance.toString());
    } catch {
      // ignore
    }
  }, [balance]);

  useEffect(() => {
    try {
      localStorage.setItem('yuki_bet_history', JSON.stringify(betSlips));
    } catch {
      // ignore
    }
  }, [betSlips]);

  // Game Engine & Timer State: Strictly 3 minutes (180 seconds) per round
  const cycleDuration = OFFICIAL_CYCLE_SECONDS;
  const [countdownSeconds, setCountdownSeconds] = useState<number>(OFFICIAL_CYCLE_SECONDS);
  const lastDrawExecutedAtRef = useRef<number>(0);
  const lastDrawCompletedAtRef = useRef<number>(0);
  const completedRoundKeysRef = useRef<Set<string>>(new Set());
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(195);
  const [todayDate, setTodayDate] = useState<string>('2026-10-24');
  const [availableDates, setAvailableDates] = useState<string[]>(['2026-10-24', '2026-10-18']);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>('all');
  const totalDayRounds = 480;

  const loadSavedPastResults = (): RoundResult[] => {
    try {
      const saved = localStorage.getItem('yuki_past_results');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_PAST_RESULTS;
  };

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const isDrawingRef = useRef<boolean>(false);
  const [winningResult, setWinningResult] = useState<RoundResult | null>(null);
  const [activeDrawSequence, setActiveDrawSequence] = useState<ActiveDrawSequence | null>(null);
  const [pastResults, setPastResults] = useState<RoundResult[]>(loadSavedPastResults);
  const [lastFinalResult, setLastFinalResult] = useState<RoundResult | null>(() => {
    const initialList = loadSavedPastResults();
    return initialList[0] || INITIAL_PAST_RESULTS[0];
  });

  // Keep isDrawingRef synchronized with isDrawing
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  // 24/7 Engine Synchronizer: Sync with server authoritative state across all devices and reloads
  useEffect(() => {
    let isMounted = true;

    const syncServerGameState = async () => {
      // Do not sync game state during active local draw animation
      if (isDrawingRef.current) return;

      try {
        const res = await fetch('/api/game-state');
        if (res.ok && isMounted && !isDrawingRef.current) {
          const state = await res.json();
          if (state.dateStr) setTodayDate(state.dateStr);
          if (state.roundNumber) setCurrentRoundNumber(state.roundNumber);
          if (state.system24_7?.availableDates) {
            setAvailableDates(state.system24_7.availableDates);
          }

          const roundKey = `${state.dateStr}__${state.roundId}`;

          // Synchronize countdown timer strictly with server authoritative 180-second clock
          if (typeof state.secondsRemaining === 'number') {
            setCountdownSeconds((prev) => {
              if (Math.abs(prev - state.secondsRemaining) > 2) {
                return state.secondsRemaining;
              }
              return prev;
            });
          }

          // A round result appears strictly ONLY ONCE per 3 minutes!
          // If already drawn or revealed on this client, NEVER re-trigger!
          if (
            state.isDrawing &&
            state.activeDrawSequence &&
            !isDrawingRef.current &&
            !completedRoundKeysRef.current.has(roundKey)
          ) {
            completedRoundKeysRef.current.add(roundKey);
            setActiveDrawSequence(state.activeDrawSequence);
            setWinningResult(state.activeDrawSequence.finalResult);
            isDrawingRef.current = true;
            setIsDrawing(true);
          }

          if (state.lastFinalResult && (!lastFinalResult || lastFinalResult.roundId !== state.lastFinalResult.roundId)) {
            setLastFinalResult(state.lastFinalResult);
          }
        }
      } catch {
        // Continue smoothly with local loop
      }
    };

    const syncHistoryList = async () => {
      // Do not overwrite or save history while a draw is in progress!
      // This ensures old results are not saved before the new ones have been entered.
      if (isDrawingRef.current) return;

      try {
        const res = await fetch('/api/results');
        if (res.ok && isMounted && !isDrawingRef.current) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0) {
            setPastResults((prev) => {
              const map = new Map<string, RoundResult>();
              data.results.forEach((r: RoundResult) => map.set(`${r.drawDate || ''}_${r.roundId}`, r));
              prev.forEach((r) => {
                const key = `${r.drawDate || ''}_${r.roundId}`;
                if (!map.has(key)) map.set(key, r);
              });
              const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              try {
                localStorage.setItem('yuki_past_results', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
          if (Array.isArray(data.availableDates)) {
            setAvailableDates(data.availableDates);
          }
          if (data.todayDate) {
            setTodayDate(data.todayDate);
          }
        }
      } catch {}
    };

    const syncBetHistory = async () => {
      try {
        const res = await fetch('/api/bets');
        if (res.ok && isMounted) {
          const data = await res.json();
          if (Array.isArray(data.bets)) {
            if (data.bets.length === 0) {
              setBetSlips((prev) => {
                if (prev.length === 0) return prev;
                try {
                  localStorage.setItem('yuki_bet_history', JSON.stringify([]));
                } catch {}
                return [];
              });
            } else {
              setBetSlips((prev) => {
                const map = new Map<string, BetSlipRecord>();
                data.bets.forEach((b: BetSlipRecord) => map.set(b.id, b));
                // Only merge unsaved pending local bets from current session
                prev.forEach((b) => {
                  if (!map.has(b.id) && b.result === 'pending') {
                    map.set(b.id, b);
                    fetch('/api/bets', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ bet: b }),
                    }).catch(() => {});
                  }
                });
                const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                try {
                  localStorage.setItem('yuki_bet_history', JSON.stringify(merged));
                } catch {}
                return merged;
              });
            }
          }
        }
      } catch {}
    };

    syncServerGameState();
    syncHistoryList();
    syncBetHistory();

    // 24/7 background sync interval every 3 seconds
    const interval = setInterval(() => {
      syncServerGameState();
      syncHistoryList();
      syncBetHistory();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isDrawing]);

  // Save past results to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('yuki_past_results', JSON.stringify(pastResults));
    } catch {
      // ignore
    }
  }, [pastResults]);

  const roundId = `1989#${currentRoundNumber}`;

  // Digital live clock
  const [currentTimeString, setCurrentTimeString] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeString(
        now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync sound toggle with sound utility
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sound.enabled = next;
  };

  // 1. Start the 3-minute draw sequence (Line 1: 6 numbers, Line 2: 5 numbers, Line 3: 1 final winning number)
  // STRICT RULE: A new result is generated once every 3 minutes.
  // After a result has been released, you must wait another 3 minutes before you can obtain a new one.
  // Exactly 1 result per 3 minutes!
  const executeDraw = async () => {
    if (isDrawing || isDrawingRef.current) return;

    const currentRoundKey = `${todayDate}__${roundId}`;
    if (completedRoundKeysRef.current.has(currentRoundKey)) {
      console.log('Strict 3-minute rule: this round has already been drawn.');
      return;
    }

    // Strict 3-minute lock: must wait at least 160 seconds after previous draw completed
    const currentTimeMs = Date.now();
    if (lastDrawCompletedAtRef.current > 0 && currentTimeMs - lastDrawCompletedAtRef.current < 160000) {
      console.log('Strict 3-minute rule: must wait another 3 minutes before obtaining a new result.');
      return;
    }
    completedRoundKeysRef.current.add(currentRoundKey);
    lastDrawExecutedAtRef.current = currentTimeMs;
    isDrawingRef.current = true;

    // First attempt to trigger/get authoritative synchronized draw from server
    try {
      const res = await fetch('/api/draw-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.drawSequence && data.result) {
          setActiveDrawSequence(data.drawSequence);
          setWinningResult(data.result);
          setIsDrawing(true);
          return;
        }
      }
    } catch {
      // Fallback to local RNG if network disconnected
    }

    // Local Fallback: Determine the 1 final winning number (1-12)
    const winNum = Math.floor(Math.random() * 12) + 1;
    const zodiacItem = ZODIAC_ITEMS.find((z) => z.number === winNum) || ZODIAC_ITEMS[0];

    const now = new Date();
    const drawDate = todayDate || now.toISOString().split('T')[0];
    const drawTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const finalResult: RoundResult = {
      roundId,
      drawDate,
      drawTime,
      number: winNum,
      khmerName: zodiacItem.khmerName,
      englishName: zodiacItem.englishName,
      isBig: zodiacItem.isBig,
      isEven: zodiacItem.isEven,
      color: zodiacItem.color,
      timestamp: Date.now(),
    };

    const allOthers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((n) => n !== winNum);
    const shuffledOthers = [...allOthers].sort(() => Math.random() - 0.5);

    const seq: ActiveDrawSequence = {
      line1: shuffledOthers.slice(0, 6),
      line2: shuffledOthers.slice(6, 11),
      finalResult,
    };

    setActiveDrawSequence(seq);
    setWinningResult(finalResult);
    setIsDrawing(true);
  };

  // 2. Triggered when Side2BowlArena completes revealing Line 3 (the 1 final winning number)
  // Ensures that the result history is saved ONLY AFTER the new results have been updated.
  // Old results are NOT saved before the new ones have been entered.
  const handleRevealComplete = () => {
    if (!activeDrawSequence) return;
    const finalResult = activeDrawSequence.finalResult;
    const winNum = finalResult.number;
    const zodiacItem = ZODIAC_ITEMS.find((z) => z.number === winNum) || ZODIAC_ITEMS[0];

    // Mark as permanently completed for this round to prevent any duplicate reveal
    const roundKey = `${finalResult.drawDate}__${finalResult.roundId}`;
    completedRoundKeysRef.current.add(roundKey);

    // =========================================================================
    // SEQUENCE STEP 1: Update the NEW RESULTS in state first!
    // =========================================================================

    // 1a. Calculate winning payouts and resolve all pending bet slips for this round with the new result
    let roundWonAmount = 0;
    const updatedBetSlips = betSlips.map((slip) => {
      if (slip.roundId === roundId && slip.result === 'pending') {
        let isWon = false;

        if (slip.category === 'number' && slip.targetNumber === winNum) {
          isWon = true; // 11x Payout
        } else if (slip.category === 'small' && winNum <= 6) {
          isWon = true; // 1.95x
        } else if (slip.category === 'big' && winNum >= 7) {
          isWon = true; // 1.95x
        } else if (slip.category === 'odd' && winNum % 2 !== 0) {
          isWon = true; // 1.95x
        } else if (slip.category === 'even' && winNum % 2 === 0) {
          isWon = true; // 1.95x
        } else if (slip.category === 'red' && zodiacItem.color === 'red') {
          isWon = true; // 2.95x
        } else if (slip.category === 'green' && zodiacItem.color === 'green') {
          isWon = true; // 2.95x
        } else if (slip.category === 'blue' && zodiacItem.color === 'blue') {
          isWon = true; // 2.95x
        }

        const potentialPayback = Math.round(slip.stake * slip.multiplier);
        const payout = isWon ? potentialPayback : 0;
        if (isWon) {
          roundWonAmount += payout;
        }

        return {
          ...slip,
          result: isWon ? ('won' as const) : ('lost' as const),
          payout,
          potentialPayback,
          winningNumber: winNum,
          wonAnimal: zodiacItem.khmerName,
        };
      }
      return slip;
    });

    // Apply updated slips to state and permanently persist
    setBetSlips(updatedBetSlips);
    try {
      localStorage.setItem('yuki_bet_history', JSON.stringify(updatedBetSlips));
    } catch {}
    fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allBets: updatedBetSlips }),
    }).catch(() => {});

    // 1b. Credit financial balance if won
    if (roundWonAmount > 0) {
      setBalance((prev) => prev + roundWonAmount);
      setLastTotalWon(roundWonAmount);
      setIsWinModalOpen(true);
      sound.playWin();
    }

    // 1c. Set the newly entered result as the active and latest result in game state FIRST
    setWinningResult(finalResult);
    setLastFinalResult(finalResult);
    setLastRoundBets(activeBets);
    setActiveBets([]);
    setStagedBets({});

    // =========================================================================
    // SEQUENCE STEP 2: Save the result history ONLY AFTER the new results have been updated!
    // =========================================================================
    // Construct new history array with the verified new result at index 0.
    // Do NOT save old results before the new ones have been entered.
    setPastResults((prevHistory) => {
      // Filter out any duplicate of this exact round
      const filtered = prevHistory.filter(
        (r) => !(r.roundId === finalResult.roundId && r.drawDate === finalResult.drawDate)
      );

      // Prepend the new result directly to the history
      const updatedHistory = [finalResult, ...filtered];

      // Immediately save the updated history (now containing the new result) to localStorage
      try {
        localStorage.setItem('yuki_past_results', JSON.stringify(updatedHistory));
      } catch (err) {
        console.error('Failed to save past results to localStorage:', err);
      }

      // Persist the new result and updated history to server storage
      fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: finalResult, allResults: updatedHistory }),
      }).catch(() => {});

      return updatedHistory;
    });

    // =========================================================================
    // SEQUENCE STEP 3: Complete draw and wait another FULL 3 minutes
    // =========================================================================
    // After a result has been released, you must wait another 3 minutes before you can obtain a new one!
    // Result appears strictly ONLY ONCE! Clear active sequence immediately and close bowls.
    lastDrawCompletedAtRef.current = Date.now();
    setActiveDrawSequence(null);
    setIsDrawing(false);
    isDrawingRef.current = false;
    setCurrentRoundNumber((prev) => prev + 1);
    setCountdownSeconds(OFFICIAL_CYCLE_SECONDS); // Strictly 180 seconds
  };

  // Reference to prevent duplicate audio plays within the same second
  const lastSpokenSecRef = useRef<number>(-1);

  // Monitor countdownSeconds to trigger Khmer audio countdown when 10 seconds remain
  // Speak: ១០ ៩ ៨ ៧ ៦ ៥ ៤ ៣ ២ ១ សូមជូនពរឱ្យសំណាងល្អ
  useEffect(() => {
    if (countdownSeconds >= 1 && countdownSeconds <= 10) {
      if (!isDrawing && lastSpokenSecRef.current !== countdownSeconds) {
        lastSpokenSecRef.current = countdownSeconds;
        sound.playKhmerCountdown(countdownSeconds);
      }
    } else if (countdownSeconds === 0) {
      if (lastSpokenSecRef.current !== 0) {
        lastSpokenSecRef.current = 0;
        sound.playKhmerGoodLuck();
      }
    } else {
      lastSpokenSecRef.current = countdownSeconds;
    }
  }, [countdownSeconds, isDrawing]);

  // Main countdown ticker loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (isDrawing || isDrawingRef.current) return prev;
        if (prev <= 1) {
          executeDraw();
          return OFFICIAL_CYCLE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDrawing, currentRoundNumber]);

  // Preload Khmer audio assets on mount and first user gesture to unlock browser AudioContext / HTML5 Audio
  useEffect(() => {
    sound.preloadKhmerAudio();

    const handleFirstGesture = () => {
      sound.preloadKhmerAudio();
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('pointerdown', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Dedicated 10-Second Khmer Voice Countdown Test Trigger
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [testVoiceCount, setTestVoiceCount] = useState<number | null>(null);
  const testVoiceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTestKhmerVoice = () => {
    if (isTestingVoice) return;
    setIsTestingVoice(true);
    sound.preloadKhmerAudio();

    let sec = 10;
    setTestVoiceCount(10);
    sound.playKhmerCountdown(sec);

    const runNext = () => {
      sec -= 1;
      if (sec >= 1) {
        setTestVoiceCount(sec);
        sound.playKhmerCountdown(sec);
        testVoiceTimerRef.current = setTimeout(runNext, 1000);
      } else if (sec === 0) {
        setTestVoiceCount(0);
        sound.playKhmerGoodLuck();
        testVoiceTimerRef.current = setTimeout(() => {
          setIsTestingVoice(false);
          setTestVoiceCount(null);
        }, 2500);
      }
    };

    testVoiceTimerRef.current = setTimeout(runNext, 1000);
  };

  useEffect(() => {
    return () => {
      if (testVoiceTimerRef.current) clearTimeout(testVoiceTimerRef.current);
    };
  }, []);

  // Stage a Bet (Clicking on buttons with currently selected chip)
  const handleAddBet = (
    key: string,
    category: BetCategory,
    label: string,
    multiplier: number,
    targetNumber?: number
  ) => {
    if (balance < selectedChip) {
      alert(lang === 'km' ? 'សមតុល្យមិនគ្រប់គ្រាន់ទេ! សូមបន្ថែមទឹកប្រាក់។' : 'Insufficient balance! Please add funds.');
      return;
    }

    sound.playChip();

    // Deduct from playable balance and place on table
    setBalance((prev) => prev - selectedChip);

    setStagedBets((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + selectedChip,
    }));

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];
    const displayTarget = getDisplayTarget(category, targetNumber);

    // Update active bets list
    setActiveBets((prev) => {
      const existing = prev.find((b) => b.category === category && b.targetNumber === targetNumber);
      if (existing) {
        return prev.map((b) =>
          b.id === existing.id ? { ...b, amount: b.amount + selectedChip } : b
        );
      } else {
        return [
          ...prev,
          {
            id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            category,
            targetNumber,
            label,
            amount: selectedChip,
            multiplier,
            timestamp: timeStr,
            roundId,
          },
        ];
      }
    });

    // IMMEDIATELY SAVE & DISPLAY ON LEFT SIDE AS PENDING:
    const ticketNumber = getNextTicketNumber();
    const potentialPayback = Math.round(selectedChip * multiplier);
    const newSlip: BetSlipRecord = {
      id: `slip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketNumber,
      roundId,
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      category,
      targetNumber,
      label,
      displayTarget,
      stake: selectedChip,
      multiplier,
      potentialPayback,
      result: 'pending',
      payout: 0,
    };
    setBetSlips((prev) => {
      const next = [newSlip, ...prev];
      try {
        localStorage.setItem('yuki_bet_history', JSON.stringify(next));
      } catch {}
      return next;
    });
    fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet: newSlip }),
    }).catch(() => {});
  };

  // Open the authentic modal from photo
  const handleOpenBetModal = (target: BetModalTarget) => {
    setModalTarget(target);
    setIsBetModalOpen(true);
  };

  // Confirm bet placed through the yellow chips modal
  const handleConfirmModalBet = (amount: number, target: BetModalTarget, notes?: string) => {
    if (balance < amount) {
      alert(lang === 'km' ? 'សមតុល្យមិនគ្រប់គ្រាន់ទេ!' : 'Insufficient balance!');
      return;
    }

    setBalance((prev) => prev - amount);

    const key = target.category === 'number' ? `num-${target.targetNumber}` : target.category;
    setStagedBets((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + amount,
    }));

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
    const displayTarget = getDisplayTarget(target.category, target.targetNumber);
    const potentialPayback = Math.round(amount * target.multiplier);

    setActiveBets((prev) => {
      const existing = prev.find(
        (b) => b.category === target.category && b.targetNumber === target.targetNumber
      );
      if (existing) {
        return prev.map((b) =>
          b.id === existing.id ? { ...b, amount: b.amount + amount } : b
        );
      } else {
        return [
          ...prev,
          {
            id: `bet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            category: target.category,
            targetNumber: target.targetNumber,
            label: target.label,
            amount,
            multiplier: target.multiplier,
            timestamp: timeStr,
            roundId,
          },
        ];
      }
    });

    // IMMEDIATELY SAVE & DISPLAY ON LEFT SIDE AS PENDING:
    const ticketNumber = getNextTicketNumber();
    const newSlip: BetSlipRecord = {
      id: `slip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketNumber,
      roundId,
      date: dateStr,
      time: timeStr,
      timestamp: now.getTime(),
      category: target.category,
      targetNumber: target.targetNumber,
      label: target.label,
      displayTarget,
      stake: amount,
      multiplier: target.multiplier,
      potentialPayback,
      result: 'pending',
      payout: 0,
      notes: notes || undefined,
    };
    setBetSlips((prev) => {
      const next = [newSlip, ...prev];
      try {
        localStorage.setItem('yuki_bet_history', JSON.stringify(next));
      } catch {}
      return next;
    });
    fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bet: newSlip }),
    }).catch(() => {});
  };

  // Update notes on an existing placed bet slip (works in Bet Slips History & Win/Loss report)
  const handleUpdateSlipNotes = (slipId: string, notes: string) => {
    const trimmed = notes.trim();
    setBetSlips((prev) => {
      const next = prev.map((s) => (s.id === slipId ? { ...s, notes: trimmed || undefined } : s));
      try {
        localStorage.setItem('yuki_bet_history', JSON.stringify(next));
      } catch {}
      return next;
    });

    fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bet: {
          id: slipId,
          notes: trimmed || undefined,
        },
      }),
    }).catch(() => {});
  };

  // Clear Staged Bets
  const handleClearBets = () => {
    const totalToRefund = activeBets.reduce((a, b) => a + b.amount, 0);
    setBalance((prev) => prev + totalToRefund);
    setActiveBets([]);
    setStagedBets({});
    // Remove pending slips from current round
    setBetSlips((prev) => prev.filter((s) => !(s.roundId === roundId && s.result === 'pending')));
    sound.playChip();
  };

  // Double Current Bets
  const handleDoubleBets = () => {
    const totalCurrent = activeBets.reduce((a, b) => a + b.amount, 0);
    if (balance < totalCurrent) {
      alert(lang === 'km' ? 'សមតុល្យមិនគ្រប់គ្រាន់សម្រាប់ទ្វេដងទេ!' : 'Insufficient balance to double!');
      return;
    }

    setBalance((prev) => prev - totalCurrent);
    setActiveBets((prev) => prev.map((b) => ({ ...b, amount: b.amount * 2 })));
    setStagedBets((prev) => {
      const doubled: Record<string, number> = {};
      Object.entries(prev).forEach(([k, v]) => {
        doubled[k] = v * 2;
      });
      return doubled;
    });
    sound.playChip();
  };

  // Repeat Previous Round Bets (Rebet)
  const handleRebet = () => {
    if (lastRoundBets.length === 0) return;
    const totalNeeded = lastRoundBets.reduce((a, b) => a + b.amount, 0);
    if (balance < totalNeeded) {
      alert(lang === 'km' ? 'សមតុល្យមិនគ្រប់គ្រាន់ទេ!' : 'Insufficient balance to rebet!');
      return;
    }

    setBalance((prev) => prev - totalNeeded);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    const newActive = lastRoundBets.map((b) => ({
      ...b,
      id: `rebet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      roundId,
      timestamp: timeStr,
    }));
    setActiveBets(newActive);

    const newStaged: Record<string, number> = {};
    newActive.forEach((b) => {
      const key = b.category === 'number' ? `num-${b.targetNumber}` : b.category;
      newStaged[key] = (newStaged[key] || 0) + b.amount;
    });
    setStagedBets(newStaged);

    // Save and display rebet tickets on left side immediately!
    const rebetTicketNumber = getNextTicketNumber();
    const rebetSlips: BetSlipRecord[] = newActive.map((bet) => ({
      id: `slip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ticketNumber: rebetTicketNumber,
      roundId,
      date: dateStr,
      time: timeStr,
      category: bet.category,
      targetNumber: bet.targetNumber,
      label: bet.label,
      displayTarget: getDisplayTarget(bet.category, bet.targetNumber),
      stake: bet.amount,
      multiplier: bet.multiplier,
      potentialPayback: Math.round(bet.amount * bet.multiplier),
      result: 'pending',
      payout: 0,
    }));
    setBetSlips((prev) => {
      const next = [...rebetSlips, ...prev];
      try {
        localStorage.setItem('yuki_bet_history', JSON.stringify(next));
      } catch {}
      return next;
    });
    fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allBets: rebetSlips }),
    }).catch(() => {});

    sound.playChip();
  };

  // Confirm bet (already active on table, plays confirmation sound)
  const handleConfirmBets = () => {
    sound.playChip();
  };

  // Top up balance
  const handleTopUp = () => {
    setBalance((prev) => prev + 100000);
    sound.playChip();
  };

  // Reset balance
  const handleResetBalance = () => {
    handleClearBets();
    setBalance(200000);
  };

  // Delete individual bet slip from Bet Slips History: cannot be retrieved/restored in History, preserved on Win/Loss
  const handleDeleteSlipFromHistory = (slipId: string) => {
    let updatedSlips: BetSlipRecord[] = [];
    setBetSlips((prev) => {
      updatedSlips = prev.map((s) => (s.id === slipId ? { ...s, deletedFromHistory: true } : s));
      try {
        localStorage.setItem('yuki_bet_history', JSON.stringify(updatedSlips));
      } catch {}
      return updatedSlips;
    });

    fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bet: {
          id: slipId,
          deletedFromHistory: true,
        },
      }),
    }).catch(() => {});
  };

  // Delete entire ticket from Bet Slips History: cannot be retrieved/restored in History, preserved on Win/Loss
  const handleDeleteTicketFromHistory = (ticketNumber: string) => {
    let updatedSlips: BetSlipRecord[] = [];
    setBetSlips((prev) => {
      updatedSlips = prev.map((s) =>
        s.ticketNumber === ticketNumber ? { ...s, deletedFromHistory: true } : s
      );
      try {
        localStorage.setItem('yuki_bet_history', JSON.stringify(updatedSlips));
      } catch {}
      return updatedSlips;
    });

    fetch('/api/bets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        allBets: updatedSlips,
      }),
    }).catch(() => {});
  };

  // Clear all bet slips from History section: non-restorable in History, but 100% PRESERVED on Win/Loss page
  const handleClearBetHistory = async () => {
    let updatedSlips: BetSlipRecord[] = [];
    setBetSlips((prev) => {
      updatedSlips = prev.map((s) => ({ ...s, deletedFromHistory: true }));
      try {
        localStorage.setItem('yuki_bet_history', JSON.stringify(updatedSlips));
      } catch {}
      return updatedSlips;
    });

    try {
      await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allBets: updatedSlips }),
      });
    } catch {
      // ignore
    }
  };

  const activeBetsTotal = activeBets.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Top Application Header */}
      <Header
        balance={balance}
        activeBetsTotal={activeBetsTotal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openPlantModal={() => setIsPlantModalOpen(true)}
        openChatModal={() => setIsChatModalOpen(true)}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        lang={lang}
        setLang={setLang}
        onTopUp={handleTopUp}
        roundId={roundId}
        currentDate={todayDate}
        roundNumber={currentRoundNumber}
        totalDayRounds={totalDayRounds}
        onTestVoice={handleTestKhmerVoice}
      />

      {/* Main Content Area: 3-Side Yuki Platform */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-2 sm:p-3 flex flex-col gap-3">
        {activeTab === 'lottery' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch min-h-[calc(100vh-125px)]">
            {/* FIRST SIDE (Left): Financial Results & Bet Slips with Date & Time (~25% width) */}
            <section className="lg:col-span-3 h-full">
              <Side1Financials
                balance={balance}
                activeBetsTotal={activeBetsTotal}
                betSlips={betSlips}
                recentResults={pastResults}
                onTopUp={handleTopUp}
                onResetBalance={handleResetBalance}
                onClearBetHistory={handleClearBetHistory}
                lang={lang}
                currentRoundId={roundId}
                currentTimeString={currentTimeString}
                onOpenOwnerReport={() => setActiveTab('financials')}
                onUpdateSlipNotes={handleUpdateSlipNotes}
                onDeleteSlip={handleDeleteSlipFromHistory}
                onDeleteTicket={handleDeleteTicketFromHistory}
              />
            </section>

            {/* SECOND SIDE (Center): 3-Minute Draw Result & 20+ Old Results Bead Road (~45% width) */}
            <section className="lg:col-span-5 h-full">
              <Side2BowlArena
                countdownSeconds={countdownSeconds}
                totalCycleSeconds={cycleDuration}
                currentRoundId={roundId}
                isDrawing={isDrawing}
                activeDrawSequence={activeDrawSequence}
                lastFinalResult={lastFinalResult}
                pastResults={pastResults}
                onRevealComplete={handleRevealComplete}
                lang={lang}
              />
            </section>

            {/* THIRD SIDE (Right): Where to Bet (Small 1-6, Big 7-12, Colors, Numbers 1-12 with 11x payback) (~30% width) */}
            <section className="lg:col-span-4 h-full">
              <Side3BettingBoard
                countdownSeconds={countdownSeconds}
                currentRoundId={roundId}
                currentTimeString={currentTimeString}
                selectedChip={selectedChip}
                setSelectedChip={setSelectedChip}
                stagedBets={stagedBets}
                onAddBet={handleAddBet}
                onOpenBetModal={handleOpenBetModal}
                onClearBets={handleClearBets}
                onDoubleBets={handleDoubleBets}
                onRebet={handleRebet}
                onConfirmBets={handleConfirmBets}
                hasPreviousBets={lastRoundBets.length > 0}
                balance={balance}
                isDrawing={isDrawing}
                lang={lang}
              />
            </section>
          </div>
        ) : activeTab === 'financials' ? (
          <OwnerWinLossReport
            betSlips={betSlips}
            balance={balance}
            lang={lang}
            onBackToGame={() => setActiveTab('lottery')}
            availableDates={availableDates}
            todayDate={todayDate}
            onUpdateSlipNotes={handleUpdateSlipNotes}
            onRefreshBets={() => {
              fetch('/api/bets')
                .then((r) => r.json())
                .then((data) => {
                  if (Array.isArray(data.bets)) {
                    setBetSlips(data.bets);
                    try {
                      localStorage.setItem('yuki_bet_history', JSON.stringify(data.bets));
                    } catch {}
                  }
                })
                .catch(() => {});
            }}
          />
        ) : (
          /* Results Tab: Matches Exact Official Screenshot Layout with 100% Platform Data Retention */
          <ResultsTableOfficial
            pastResults={pastResults}
            availableDates={availableDates}
            todayDate={todayDate}
            lang={lang}
            onBackToBoard={() => setActiveTab('lottery')}
            onRefreshHistory={() => {
              fetch('/api/results?limit=all')
                .then((r) => r.json())
                .then((data) => {
                  if (Array.isArray(data.results) && data.results.length > 0) {
                    setPastResults((prev) => {
                      const map = new Map<string, RoundResult>();
                      data.results.forEach((r: RoundResult) => map.set(`${r.drawDate || ''}_${r.roundId}`, r));
                      prev.forEach((r) => {
                        const key = `${r.drawDate || ''}_${r.roundId}`;
                        if (!map.has(key)) map.set(key, r);
                      });
                      const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                      try {
                        localStorage.setItem('yuki_past_results', JSON.stringify(merged));
                      } catch {}
                      return merged;
                    });
                  }
                  if (Array.isArray(data.availableDates)) {
                    setAvailableDates(data.availableDates);
                  }
                })
                .catch(() => {});
            }}
          />
        )}
    </main>



      {/* Modals */}
      <PlantCareModal
        isOpen={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        lang={lang}
      />

      <GeminiChatbot
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        lang={lang}
      />

      <WinModal
        isOpen={isWinModalOpen}
        onClose={() => setIsWinModalOpen(false)}
        winningResult={winningResult}
        totalWon={lastTotalWon}
        lang={lang}
      />

      <BettingModal
        isOpen={isBetModalOpen}
        onClose={() => setIsBetModalOpen(false)}
        target={modalTarget}
        currentRoundId={roundId}
        onConfirmBet={handleConfirmModalBet}
        balance={balance}
        lang={lang}
      />

      {/* Test Voice Simulation Floating Banner */}
      {isTestingVoice && testVoiceCount !== null && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl border-2 border-amber-300 flex items-center gap-4 animate-bounce">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-amber-200 shrink-0">
            <Volume2 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-amber-200 uppercase tracking-wide">
              {lang === 'km' ? 'សាកល្បងសំឡេងខ្មែរ (Khmer Audio Countdown)' : 'Khmer Audio Countdown Test'}
            </div>
            <div className="text-base sm:text-lg font-extrabold font-khmer">
              {testVoiceCount > 0 ? (
                <span>
                  រាប់ថយក្រោយ: <span className="text-yellow-300 text-2xl font-mono">{testVoiceCount}</span> ({KHMER_COUNTDOWN_MAP[testVoiceCount]?.numeral} - {KHMER_COUNTDOWN_MAP[testVoiceCount]?.word})
                </span>
              ) : (
                <span className="text-yellow-200 text-lg">
                  🎉 {KHMER_GOODLUCK_MESSAGE}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
