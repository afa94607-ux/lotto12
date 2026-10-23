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
import { sound } from './utils/audio';

const OFFICIAL_CYCLE_SECONDS = 180; // 3 minutes
const FAST_CYCLE_SECONDS = 15; // 15 seconds for rapid testing

const INITIAL_SEED_SLIPS: BetSlipRecord[] = [
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
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
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

  // Game Engine & Timer State
  const [fastMode, setFastMode] = useState<boolean>(false);
  const cycleDuration = fastMode ? FAST_CYCLE_SECONDS : OFFICIAL_CYCLE_SECONDS;
  const [countdownSeconds, setCountdownSeconds] = useState<number>(cycleDuration);
  const [currentRoundNumber, setCurrentRoundNumber] = useState<number>(195);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [winningResult, setWinningResult] = useState<RoundResult | null>(null);
  const [activeDrawSequence, setActiveDrawSequence] = useState<ActiveDrawSequence | null>(null);
  const [lastFinalResult, setLastFinalResult] = useState<RoundResult | null>(INITIAL_PAST_RESULTS[0]);
  const [pastResults, setPastResults] = useState<RoundResult[]>(INITIAL_PAST_RESULTS);

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

  // Switch between fast demo mode and official 3-minute mode
  useEffect(() => {
    setCountdownSeconds((prev) => Math.min(prev, fastMode ? FAST_CYCLE_SECONDS : OFFICIAL_CYCLE_SECONDS));
  }, [fastMode]);

  // 1. Start the 3-minute draw sequence (Line 1: 6 numbers, Line 2: 5 numbers, Line 3: 1 final winning number)
  const executeDraw = (customNumber?: number) => {
    if (isDrawing) return;

    // Determine the 1 final winning number (1-12)
    const winNum = customNumber || Math.floor(Math.random() * 12) + 1;
    const zodiacItem = ZODIAC_ITEMS.find((z) => z.number === winNum)!;

    const now = new Date();
    const drawDate = now.toISOString().split('T')[0];
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

    // Prepare candidate numbers: remaining 11 numbers shuffled across Line 1 (6) and Line 2 (5)
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
  // Ensures 100% synchronization between the revealed card, bet history, bead road, and payouts!
  const handleRevealComplete = () => {
    if (!activeDrawSequence) return;
    const finalResult = activeDrawSequence.finalResult;
    const winNum = finalResult.number;
    const zodiacItem = ZODIAC_ITEMS.find((z) => z.number === winNum)!;

    // Resolve Active Bets and update pending betSlips for this round
    let roundWonAmount = 0;

    setBetSlips((prevSlips) =>
      prevSlips.map((slip) => {
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
            result: isWon ? 'won' : 'lost',
            payout,
            potentialPayback,
            winningNumber: winNum,
            wonAnimal: zodiacItem.khmerName,
          };
        }
        return slip;
      })
    );

    // Credit financial balance if won
    if (roundWonAmount > 0) {
      setBalance((prev) => prev + roundWonAmount);
      setLastTotalWon(roundWonAmount);
      setIsWinModalOpen(true);
      sound.playWin();
    }

    // Add to historical bead road & Side 1 recent results
    setPastResults((prev) => [finalResult, ...prev]);

    // Save final result and reset active bets
    setLastFinalResult(finalResult);
    setLastRoundBets(activeBets);
    setActiveBets([]);
    setStagedBets({});
    setIsDrawing(false);

    // Increment round ID and reset countdown
    setCurrentRoundNumber((prev) => prev + 1);
    setCountdownSeconds(fastMode ? FAST_CYCLE_SECONDS : OFFICIAL_CYCLE_SECONDS);
  };

  // Main countdown ticker loop with 10-second anticipation warning sound
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (isDrawing) return prev;
        if (prev <= 10 && prev > 1) {
          sound.playCountdownWarning(prev - 1);
        }
        if (prev <= 1) {
          executeDraw();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDrawing, fastMode, currentRoundNumber]);

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
    setBetSlips((prev) => [newSlip, ...prev]);
  };

  // Open the authentic modal from photo
  const handleOpenBetModal = (target: BetModalTarget) => {
    setModalTarget(target);
    setIsBetModalOpen(true);
  };

  // Confirm bet placed through the yellow chips modal
  const handleConfirmModalBet = (amount: number, target: BetModalTarget) => {
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
    };
    setBetSlips((prev) => [newSlip, ...prev]);
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
    setBetSlips((prev) => [...rebetSlips, ...prev]);

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

  // Clear bet history if user explicitly requests
  const handleClearBetHistory = () => {
    setBetSlips([]);
    try {
      localStorage.removeItem('yuki_bet_history');
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
                onTriggerDrawNow={() => executeDraw()}
                onRevealComplete={handleRevealComplete}
                fastMode={fastMode}
                setFastMode={setFastMode}
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
          /* Financials Full-Screen View */
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center justify-between">
              <span>{lang === 'km' ? 'របាយការណ៍ហិរញ្ញវត្ថុ និងប្រវត្តិឈ្នះចាញ់' : 'Financial Statement & Bet Slips'}</span>
              <button
                onClick={() => setActiveTab('lottery')}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg"
              >
                {lang === 'km' ? 'ត្រឡប់ទៅក្ដារឆ្នោត' : 'Back to Game Board'}
              </button>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-bold block">Current Balance</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">{balance.toLocaleString()} ៛</span>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-xs text-blue-800 font-bold block">Total Won Payouts</span>
                <span className="text-2xl font-black text-blue-700 font-mono">
                  {betSlips.filter((s) => s.result === 'won').reduce((a, b) => a + b.payout, 0).toLocaleString()} ៛
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-600 font-bold block">Total Staked</span>
                <span className="text-2xl font-black text-slate-800 font-mono">
                  {betSlips.reduce((a, b) => a + b.stake, 0).toLocaleString()} ៛
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Round ID</th>
                    <th className="p-2.5">Betted Choice / Number</th>
                    <th className="p-2.5">Bet Amount</th>
                    <th className="p-2.5">Pay Back Formula</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Pay Back Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {betSlips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400">
                        No bet records yet. Place a bet on the lottery board!
                      </td>
                    </tr>
                  ) : (
                    betSlips.map((slip) => {
                      const potential = slip.potentialPayback || Math.round(slip.stake * slip.multiplier);
                      const display = slip.displayTarget || slip.label;
                      return (
                        <tr key={slip.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-600">
                            {slip.date} {slip.time}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-blue-700">{slip.roundId}</td>
                          <td className="p-2.5 font-bold font-khmer text-slate-900">{display}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800">
                            {slip.stake.toLocaleString()} ៛
                          </td>
                          <td className="p-2.5 font-mono text-slate-600">
                            {slip.stake.toLocaleString()} × {slip.multiplier} = {potential.toLocaleString()} ៛
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                slip.result === 'won'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : slip.result === 'lost'
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {slip.result === 'won'
                                ? 'ឈ្នះ (Won)'
                                : slip.result === 'lost'
                                ? 'ចាញ់ (Lost)'
                                : 'រង់ចាំ (Pending)'}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono font-bold">
                            {slip.result === 'won' ? (
                              <span className="text-emerald-700">+{slip.payout.toLocaleString()} ៛</span>
                            ) : slip.result === 'lost' ? (
                              <span className="text-slate-400">0 ៛</span>
                            ) : (
                              <span className="text-amber-700">រំពឹងសង: {potential.toLocaleString()} ៛</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Past Results Table */
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center justify-between">
              <span>{lang === 'km' ? 'ប្រវត្តិលទ្ធផលចេញទាំងអស់' : 'Historical Draw Results'}</span>
              <button
                onClick={() => setActiveTab('lottery')}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg"
              >
                {lang === 'km' ? 'ត្រឡប់ទៅក្ដារឆ្នោត' : 'Back to Game Board'}
              </button>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {pastResults.map((r, i) => (
                <div key={`hist-${i}`} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>{r.roundId}</span>
                    <span>{r.drawTime}</span>
                  </div>
                  <div className="flex items-center gap-2 my-1">
                    <span className="text-2xl font-black text-slate-900 font-mono">#{r.number}</span>
                    <span className="font-bold text-xs font-khmer">{r.khmerName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold">
                    <span className={`px-1.5 py-0.2 rounded text-white ${r.isBig ? 'bg-rose-500' : 'bg-cyan-500'}`}>
                      {r.isBig ? 'Big' : 'Small'}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-white ${
                        r.color === 'red' ? 'bg-red-500' : r.color === 'green' ? 'bg-emerald-600' : 'bg-blue-600'
                      }`}
                    >
                      {r.color}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Floating Plant & AI Assistant Quick Pill for Instant Access */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsPlantModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-white transition transform hover:scale-105"
          title="Identify plants and get care guides"
        >
          <span className="text-base">🌿</span>
          <span className="text-xs hidden sm:inline">Plant Care AI</span>
        </button>

        <button
          onClick={() => setIsChatModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-white transition transform hover:scale-105"
          title="Open Gemini chatbot"
        >
          <span className="text-base">🤖</span>
          <span className="text-xs">FloraBot</span>
        </button>
      </div>

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
    </div>
  );
}
