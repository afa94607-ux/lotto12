import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support base64 image uploads and JSON payloads up to 15MB
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Persistent file storage for historical draw results across devices and reloads
const HISTORY_FILE = path.resolve(process.cwd(), 'data_history_results.json');
const BACKUP_HISTORY_FILE = path.resolve(process.cwd(), 'data_history_results.backup.json');
let serverHistoryResults: any[] = [];

// Persistent file storage for ALL bets (permanent bet history & owner win/loss reporting)
const BETS_HISTORY_FILE = path.resolve(process.cwd(), 'data_history_bets.json');
const BACKUP_BETS_HISTORY_FILE = path.resolve(process.cwd(), 'data_history_bets.backup.json');
let serverHistoryBets: any[] = [];

// 12 Zodiac master list for server-side draw generation
const ZODIAC_ITEMS_SERVER = [
  { number: 1, khmerName: 'ជូត', englishName: 'Mouse / Rat', color: 'red', isBig: false, isEven: false },
  { number: 2, khmerName: 'ឆ្លូវ', englishName: 'Ox / Steed', color: 'green', isBig: false, isEven: true },
  { number: 3, khmerName: 'ខាល', englishName: 'Tiger / Champion', color: 'blue', isBig: false, isEven: false },
  { number: 4, khmerName: 'ថោះ', englishName: 'Rabbit / Deity', color: 'red', isBig: false, isEven: true },
  { number: 5, khmerName: 'រោង', englishName: 'Dragon / Naga King', color: 'green', isBig: false, isEven: false },
  { number: 6, khmerName: 'ម្សាញ់', englishName: 'Snake', color: 'blue', isBig: false, isEven: true },
  { number: 7, khmerName: 'មមី', englishName: 'Horse / Stallion', color: 'red', isBig: true, isEven: false },
  { number: 8, khmerName: 'មមែ', englishName: 'Goat', color: 'green', isBig: true, isEven: true },
  { number: 9, khmerName: 'វក', englishName: 'Monkey', color: 'blue', isBig: true, isEven: false },
  { number: 10, khmerName: 'រកា', englishName: 'Rooster / Sun Bird', color: 'red', isBig: true, isEven: true },
  { number: 11, khmerName: 'ច', englishName: 'Dog / Guardian', color: 'green', isBig: true, isEven: false },
  { number: 12, khmerName: 'កុរ', englishName: 'Pig / Treasure', color: 'blue', isBig: true, isEven: true },
];

// Helper: deduplicate results preserving authentic first appearance
function deduplicateResults(list: any[]): any[] {
  const map = new Map<string, any>();
  for (const r of list) {
    if (!r || !r.roundId) continue;
    const dateKey = r.drawDate || 'unknown';
    const key = `${dateKey}__${r.roundId}`;
    if (!map.has(key)) {
      map.set(key, r);
    }
  }
  const clean = Array.from(map.values());
  clean.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return clean;
}

try {
  if (fs.existsSync(HISTORY_FILE)) {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      serverHistoryResults = deduplicateResults(parsed);
      // Create backup copy on server start to guarantee 100% preservation
      fs.writeFileSync(BACKUP_HISTORY_FILE, JSON.stringify(serverHistoryResults, null, 2));
    }
  } else if (fs.existsSync(BACKUP_HISTORY_FILE)) {
    const raw = fs.readFileSync(BACKUP_HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      serverHistoryResults = deduplicateResults(parsed);
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(serverHistoryResults, null, 2));
    }
  }
} catch (e) {
  console.error('Failed to load history file on server start:', e);
}

// Initial seed bets if no bet history file exists yet
const INITIAL_SEED_BETS = [
  {
    id: 'seed-slip-1',
    ticketNumber: '444444464',
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

// Helper: deduplicate and sort bets
function deduplicateBets(list: any[]): any[] {
  const map = new Map<string, any>();
  for (const b of list) {
    if (!b || !b.id) continue;
    if (!map.has(b.id)) {
      map.set(b.id, b);
    } else {
      map.set(b.id, { ...map.get(b.id), ...b });
    }
  }
  const clean = Array.from(map.values());
  clean.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  return clean;
}

// Load persistent bet history from file
try {
  if (fs.existsSync(BETS_HISTORY_FILE)) {
    const raw = fs.readFileSync(BETS_HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      serverHistoryBets = deduplicateBets(parsed);
      fs.writeFileSync(BACKUP_BETS_HISTORY_FILE, JSON.stringify(serverHistoryBets, null, 2));
    } else {
      serverHistoryBets = [...INITIAL_SEED_BETS];
      fs.writeFileSync(BETS_HISTORY_FILE, JSON.stringify(serverHistoryBets, null, 2));
    }
  } else if (fs.existsSync(BACKUP_BETS_HISTORY_FILE)) {
    const raw = fs.readFileSync(BACKUP_BETS_HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      serverHistoryBets = deduplicateBets(parsed);
      fs.writeFileSync(BETS_HISTORY_FILE, JSON.stringify(serverHistoryBets, null, 2));
    } else {
      serverHistoryBets = [...INITIAL_SEED_BETS];
      fs.writeFileSync(BETS_HISTORY_FILE, JSON.stringify(serverHistoryBets, null, 2));
    }
  } else {
    serverHistoryBets = [...INITIAL_SEED_BETS];
    fs.writeFileSync(BETS_HISTORY_FILE, JSON.stringify(serverHistoryBets, null, 2));
    fs.writeFileSync(BACKUP_BETS_HISTORY_FILE, JSON.stringify(serverHistoryBets, null, 2));
  }
} catch (e) {
  console.error('Failed to load bets history file on server start:', e);
  serverHistoryBets = [...INITIAL_SEED_BETS];
}

// Safe atomic file writer for bets
function saveBetsToFile() {
  try {
    const tmpFile = `${BETS_HISTORY_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(serverHistoryBets, null, 2));
    fs.renameSync(tmpFile, BETS_HISTORY_FILE);
  } catch (err) {
    console.error('Failed to write bets file:', err);
    try {
      fs.writeFileSync(BETS_HISTORY_FILE, JSON.stringify(serverHistoryBets, null, 2));
    } catch (e) {
      console.error('Direct write fallback for bets failed:', e);
    }
  }
}

// Helper: compute owner win/loss accounting summary
// "when any bet loss is mean not win so that is mean owner win + wit amount"
function computeOwnerSummary(bets: any[]) {
  let totalStake = 0;
  let totalLostStake = 0; // When bet loss = Owner win + amount
  let lostBetsCount = 0;
  let totalWonPayout = 0; // Payout paid out to players
  let wonBetsCount = 0;
  let wonBetsStake = 0;
  let pendingStake = 0;
  let pendingBetsCount = 0;

  for (const b of bets) {
    const stake = Number(b.stake) || 0;
    totalStake += stake;
    if (b.result === 'lost') {
      totalLostStake += stake; // OWNER WINS THIS STAKE
      lostBetsCount += 1;
    } else if (b.result === 'won') {
      const payout = Number(b.payout) || 0;
      totalWonPayout += payout;
      wonBetsCount += 1;
      wonBetsStake += stake;
    } else {
      pendingStake += stake;
      pendingBetsCount += 1;
    }
  }

  const netOwnerProfit = totalStake - totalWonPayout;
  const resolvedCount = lostBetsCount + wonBetsCount;
  const ownerWinRate = resolvedCount > 0 ? (lostBetsCount / resolvedCount) * 100 : 0;
  const profitMargin = totalStake > 0 ? (netOwnerProfit / totalStake) * 100 : 0;

  return {
    totalStake,
    totalLostStake, // Owner Win from Lost Bets (+amount)
    lostBetsCount,
    totalWonPayout, // Total Payout to Winners
    wonBetsCount,
    wonBetsStake,
    pendingStake,
    pendingBetsCount,
    netOwnerProfit, // Net House Gain / Loss
    ownerWinRate: Math.round(ownerWinRate * 10) / 10,
    profitMargin: Math.round(profitMargin * 10) / 10,
  };
}

// 24/7 Engine Constants: 180 seconds (3 minutes) per round, 480 rounds per day
const CYCLE_DURATION_SECONDS = 180;
const TOTAL_DAY_ROUNDS = 480;

// Safe atomic file writer: writes to a tmp file first then renames, preventing corruption
function saveHistoryToFile() {
  try {
    const tmpFile = `${HISTORY_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(serverHistoryResults, null, 2));
    fs.renameSync(tmpFile, HISTORY_FILE);
  } catch (err) {
    console.error('Failed to write history file:', err);
    try {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(serverHistoryResults, null, 2));
    } catch (e) {
      console.error('Direct write fallback failed:', e);
    }
  }
}

// Helper: Get current day and round index (1-480) for 24/7 continuous operation
function get247RoundInfo(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const secondsSinceMidnight = Math.max(0, Math.floor((now.getTime() - midnight) / 1000));
  const roundNumber = Math.min(TOTAL_DAY_ROUNDS, Math.floor(secondsSinceMidnight / CYCLE_DURATION_SECONDS) + 1);
  const secondsRemaining = CYCLE_DURATION_SECONDS - (secondsSinceMidnight % CYCLE_DURATION_SECONDS);
  const elapsedInCycle = secondsSinceMidnight % CYCLE_DURATION_SECONDS;
  const roundId = `1989#${roundNumber}`;

  return {
    dateStr,
    roundNumber,
    roundId,
    secondsRemaining,
    elapsedInCycle,
    totalDayRounds: TOTAL_DAY_ROUNDS,
    timestamp: now.getTime(),
  };
}

// Helper: Generate a single fair draw result
function createDrawResult(roundId: string, dateStr: string, drawTime: string, timestamp: number, forcedNumber?: number) {
  const winNum = forcedNumber || Math.floor(Math.random() * 12) + 1;
  const zodiac = ZODIAC_ITEMS_SERVER.find((z) => z.number === winNum) || ZODIAC_ITEMS_SERVER[0];

  const finalResult = {
    roundId,
    drawDate: dateStr,
    drawTime,
    number: winNum,
    khmerName: zodiac.khmerName,
    englishName: zodiac.englishName,
    isBig: zodiac.isBig,
    isEven: zodiac.isEven,
    color: zodiac.color,
    timestamp,
  };

  const others = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((n) => n !== winNum);
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);

  const drawSequence = {
    line1: shuffledOthers.slice(0, 6),
    line2: shuffledOthers.slice(6, 11),
    finalResult,
  };

  return { finalResult, drawSequence };
}

// Ensure 24/7 history continuity: fill any missing rounds for today or recent history without duplicate creation
function ensureHistoryContinuity() {
  const currentInfo = get247RoundInfo();
  const existingMap = new Map<string, any>();
  serverHistoryResults.forEach((r) => existingMap.set(`${r.drawDate}__${r.roundId}`, r));

  let addedNew = false;
  // If today has completed rounds that aren't recorded yet, generate them chronologically
  const completedTodayRounds = Math.max(0, currentInfo.roundNumber - 1);
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

  for (let r = 1; r <= completedTodayRounds; r++) {
    const rId = `1989#${r}`;
    const key = `${currentInfo.dateStr}__${rId}`;
    if (!existingMap.has(key)) {
      const roundTimeMs = midnight + (r * CYCLE_DURATION_SECONDS - 10) * 1000;
      const roundDate = new Date(roundTimeMs);
      const drawTime = roundDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const { finalResult } = createDrawResult(rId, currentInfo.dateStr, drawTime, roundTimeMs);
      serverHistoryResults.push(finalResult);
      existingMap.set(key, finalResult);
      addedNew = true;
    }
  }

  // Sort newest first
  serverHistoryResults.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  // NEVER truncate or delete historical records - preserve entire history permanently!
  if (addedNew) {
    saveHistoryToFile();
  }
}

// Run initial continuity check on server start
ensureHistoryContinuity();

// Active 24/7 state tracker in server memory
let currentActiveDraw: {
  roundId: string;
  dateStr: string;
  drawSequence: any;
  finalResult: any;
  phase: 'betting' | 'revealing' | 'completed';
} | null = null;

// Background 24/7 Tick Loop (runs every 1 second continuously)
setInterval(() => {
  const info = get247RoundInfo();

  // Check if current round has already been drawn and completed
  const alreadyCompleted = serverHistoryResults.some(
    (r) => r.roundId === info.roundId && r.drawDate === info.dateStr
  );

  // Reveal window is the first 24 seconds of a new round
  const isRevealingWindow = info.elapsedInCycle < 24;

  if (isRevealingWindow && !alreadyCompleted) {
    // If we haven't generated the draw sequence for this round yet
    if (!currentActiveDraw || currentActiveDraw.roundId !== info.roundId || currentActiveDraw.dateStr !== info.dateStr) {
      const now = new Date();
      const drawTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const { finalResult, drawSequence } = createDrawResult(info.roundId, info.dateStr, drawTime, now.getTime());

      currentActiveDraw = {
        roundId: info.roundId,
        dateStr: info.dateStr,
        drawSequence,
        finalResult,
        phase: 'revealing',
      };
    }
  } else {
    // Reveal window has ended or round is completed -> Mark completed and save to history
    if (currentActiveDraw && currentActiveDraw.phase === 'revealing') {
      currentActiveDraw.phase = 'completed';
      const alreadyHas = serverHistoryResults.some(
        (r) => r.roundId === currentActiveDraw!.roundId && r.drawDate === currentActiveDraw!.dateStr
      );
      if (!alreadyHas) {
        serverHistoryResults.unshift(currentActiveDraw.finalResult);
        serverHistoryResults.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        saveHistoryToFile();
      }
    }
  }
}, 1000);

// API 0a. Authoritative 24/7 Game State API (Synchronizes all devices and reloads)
app.get('/api/game-state', (_req, res) => {
  const info = get247RoundInfo();
  
  // A round result appears strictly ONLY ONCE per 3 minutes!
  // If already saved in history or phase is completed, isDrawing is strictly FALSE.
  const alreadySavedInHistory = serverHistoryResults.some(
    (r) => r.roundId === info.roundId && r.drawDate === info.dateStr
  );
  const isCompleted = alreadySavedInHistory || (currentActiveDraw?.roundId === info.roundId && currentActiveDraw?.phase === 'completed');

  const isDrawing = !isCompleted && info.elapsedInCycle < 24 && currentActiveDraw?.phase === 'revealing';
  const lastResult = serverHistoryResults[0] || null;

  // Extract unique dates available in history for date filtering
  const availableDates = Array.from(new Set(serverHistoryResults.map((r) => r.drawDate).filter(Boolean))).sort(
    (a, b) => (b > a ? 1 : -1)
  );

  return res.json({
    serverTime: Date.now(),
    dateStr: info.dateStr,
    roundNumber: info.roundNumber,
    roundId: info.roundId,
    totalDayRounds: info.totalDayRounds,
    secondsRemaining: info.secondsRemaining,
    cycleDuration: CYCLE_DURATION_SECONDS,
    isDrawing,
    drawPhase: isDrawing ? 'revealing' : 'betting',
    activeDrawSequence: isDrawing && currentActiveDraw ? currentActiveDraw.drawSequence : null,
    lastFinalResult: lastResult,
    system24_7: {
      status: 'ONLINE_24_7',
      labelKm: 'ប្រព័ន្ធដំណើរការ ២៤ម៉ោង/៧ថ្ងៃ - រក្សាទុកអចិន្ត្រៃយ៍',
      labelEn: '24/7 Live Continuous Lottery Engine - 100% Permanently Preserved',
      todayDrawsCount: serverHistoryResults.filter((r) => r.drawDate === info.dateStr).length,
      totalHistoryCount: serverHistoryResults.length,
      availableDates,
    },
  });
});

// API 0b. Historical Results API with optional date filtering & full persistence
app.get('/api/results', (req, res) => {
  const filterDate = req.query.date as string | undefined;
  const limitParam = req.query.limit as string | undefined;
  const pageParam = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const pageSizeParam = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined;

  let filtered = serverHistoryResults;
  if (filterDate && filterDate !== 'all') {
    filtered = serverHistoryResults.filter((r) => r.drawDate === filterDate);
  }

  let results: any[];
  if (pageParam && pageSizeParam) {
    const start = (pageParam - 1) * pageSizeParam;
    results = filtered.slice(start, start + pageSizeParam);
  } else if (limitParam && limitParam !== 'all') {
    const num = parseInt(limitParam, 10);
    results = isNaN(num) ? filtered : filtered.slice(0, num);
  } else {
    // By default, return the complete history so no data is ever lost or truncated
    results = filtered;
  }

  const availableDates = Array.from(new Set(serverHistoryResults.map((r) => r.drawDate).filter(Boolean))).sort(
    (a, b) => (b > a ? 1 : -1)
  );

  const info = get247RoundInfo();

  return res.json({
    results,
    total: filtered.length,
    totalAllTime: serverHistoryResults.length,
    todayDate: info.dateStr,
    availableDates,
    todayRoundNumber: info.roundNumber,
  });
});

// API 0b-2. Export Historical Results (JSON or CSV)
app.get('/api/results/export', (req, res) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const filterDate = req.query.date as string | undefined;

  let list = serverHistoryResults;
  if (filterDate && filterDate !== 'all') {
    list = serverHistoryResults.filter((r) => r.drawDate === filterDate);
  }

  if (format === 'csv') {
    const headers = ['Round ID', 'Draw Date', 'Draw Time', 'Number', 'Khmer Name', 'English Name', 'Big/Small', 'Even/Odd', 'Color', 'Timestamp'];
    const rows = list.map((r) => [
      `"${r.roundId}"`,
      `"${r.drawDate}"`,
      `"${r.drawTime}"`,
      r.number,
      `"${r.khmerName}"`,
      `"${r.englishName}"`,
      r.isBig ? '"Big"' : '"Small"',
      r.isEven ? '"Even"' : '"Odd"',
      `"${r.color}"`,
      r.timestamp || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="yuki12_history_${filterDate || 'all'}.csv"`);
    return res.send(csvContent);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="yuki12_history_${filterDate || 'all'}.json"`);
  return res.json(list);
});

// API 0c. Authoritative Draw Synchronization (Strict 3-minute rule: only 1 result per 3 minutes)
app.post('/api/draw-now', (req, res) => {
  try {
    const info = get247RoundInfo();

    // Check if current round has already been drawn and completed in history or memory
    const alreadyDrawn = serverHistoryResults.find(
      (r) => r.drawDate === info.dateStr && r.roundId === info.roundId
    );
    const isCompleted = alreadyDrawn || (currentActiveDraw && currentActiveDraw.roundId === info.roundId && currentActiveDraw.phase === 'completed');

    if (isCompleted) {
      // Must wait another 3 minutes before obtaining a new result!
      return res.status(429).json({
        error: 'A new result is generated only once every 3 minutes. Please wait another 3 minutes before the next result.',
        secondsRemaining: info.secondsRemaining,
      });
    }

    // If a draw for the current 3-minute round is already actively revealing, return it
    if (currentActiveDraw && currentActiveDraw.roundId === info.roundId && currentActiveDraw.dateStr === info.dateStr && currentActiveDraw.phase === 'revealing') {
      return res.json({
        success: true,
        result: currentActiveDraw.finalResult,
        drawSequence: currentActiveDraw.drawSequence,
        roundNumber: info.roundNumber,
      });
    }

    const now = new Date();
    const drawTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const { finalResult, drawSequence } = createDrawResult(info.roundId, info.dateStr, drawTime, now.getTime());

    currentActiveDraw = {
      roundId: info.roundId,
      dateStr: info.dateStr,
      drawSequence,
      finalResult,
      phase: 'revealing',
    };

    return res.json({ success: true, result: finalResult, drawSequence, roundNumber: info.roundNumber });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// API 0d. POST /api/results (Safe Non-Destructive Merge: Saves history AFTER new results have been updated)
app.post('/api/results', (req, res) => {
  try {
    const { result, allResults } = req.body;
    let added = false;

    // Mark active draw completed if this matches
    if (result && currentActiveDraw && currentActiveDraw.roundId === result.roundId) {
      currentActiveDraw.phase = 'completed';
    }

    if (Array.isArray(allResults)) {
      // Non-destructive merge: update or add items preserving all data permanently
      const existingMap = new Map<string, any>();
      serverHistoryResults.forEach((r) => existingMap.set(`${r.drawDate}__${r.roundId}`, r));

      allResults.forEach((r) => {
        if (!r || !r.roundId) return;
        const key = `${r.drawDate || ''}__${r.roundId}`;
        if (!existingMap.has(key)) {
          serverHistoryResults.push(r);
          existingMap.set(key, r);
          added = true;
        } else {
          // If already exists, ensure latest details are updated
          const idx = serverHistoryResults.findIndex(
            (item) => item.roundId === r.roundId && item.drawDate === r.drawDate
          );
          if (idx >= 0) {
            serverHistoryResults[idx] = { ...serverHistoryResults[idx], ...r };
          }
        }
      });
    } else if (result && result.roundId) {
      const existsIndex = serverHistoryResults.findIndex(
        (r) => r.roundId === result.roundId && r.drawDate === result.drawDate
      );
      if (existsIndex >= 0) {
        // Update existing record with the new confirmed result data
        serverHistoryResults[existsIndex] = result;
        added = true;
      } else {
        // Add new confirmed result at top of history
        serverHistoryResults.unshift(result);
        added = true;
      }
    }

    if (added) {
      serverHistoryResults.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      saveHistoryToFile();
    }

    return res.json({
      success: true,
      count: serverHistoryResults.length,
      added,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// API 0e. GET /api/bets (Complete Persistent Bet History & Owner Accounting Report)
app.get('/api/bets', (req, res) => {
  const filterDate = req.query.date as string | undefined;
  const filterStatus = req.query.status as string | undefined;
  const filterRound = req.query.roundId as string | undefined;

  let filtered = serverHistoryBets;

  if (filterDate && filterDate !== 'all') {
    filtered = filtered.filter((b) => b.date === filterDate);
  }

  if (filterRound && filterRound !== 'all') {
    filtered = filtered.filter((b) => b.roundId === filterRound);
  }

  if (filterStatus && filterStatus !== 'all') {
    filtered = filtered.filter((b) => b.result === filterStatus);
  }

  // Available unique dates in bet records
  const availableDates = Array.from(new Set(serverHistoryBets.map((b) => b.date).filter(Boolean))).sort(
    (a, b) => (b > a ? 1 : -1)
  );

  const ownerSummary = computeOwnerSummary(filtered);
  const allTimeOwnerSummary = computeOwnerSummary(serverHistoryBets);

  return res.json({
    success: true,
    bets: filtered,
    total: filtered.length,
    totalAllTime: serverHistoryBets.length,
    ownerSummary,
    allTimeOwnerSummary,
    availableDates,
  });
});

// API 0f. POST /api/bets (Save & Update Bet History with 100% Persistence)
app.post('/api/bets', (req, res) => {
  try {
    const { bet, allBets } = req.body;
    let modified = false;

    if (Array.isArray(allBets) && allBets.length > 0) {
      const map = new Map<string, any>();
      serverHistoryBets.forEach((b) => map.set(b.id, b));

      allBets.forEach((b) => {
        if (!b || !b.id) return;
        if (!map.has(b.id)) {
          serverHistoryBets.unshift(b);
          map.set(b.id, b);
          modified = true;
        } else {
          const current = map.get(b.id);
          // If status, payout, winningNumber, or notes changed
          if (
            current.result !== b.result ||
            current.payout !== b.payout ||
            current.winningNumber !== b.winningNumber ||
            current.notes !== b.notes ||
            current.deletedFromHistory !== b.deletedFromHistory
          ) {
            const idx = serverHistoryBets.findIndex((item) => item.id === b.id);
            if (idx >= 0) {
              serverHistoryBets[idx] = { ...serverHistoryBets[idx], ...b };
              modified = true;
            }
          }
        }
      });
    } else if (bet && bet.id) {
      const idx = serverHistoryBets.findIndex((b) => b.id === bet.id);
      if (idx >= 0) {
        serverHistoryBets[idx] = { ...serverHistoryBets[idx], ...bet };
        modified = true;
      } else {
        serverHistoryBets.unshift(bet);
        modified = true;
      }
    }

    if (modified) {
      serverHistoryBets.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      saveBetsToFile();
    }

    const ownerSummary = computeOwnerSummary(serverHistoryBets);

    return res.json({
      success: true,
      count: serverHistoryBets.length,
      ownerSummary,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// API 0f-2. DELETE /api/bets (Manual Delete All Bet Entries - Strictly on explicit user request, never auto-delete)
app.delete('/api/bets', (_req, res) => {
  try {
    serverHistoryBets = [];
    saveBetsToFile();
    return res.json({
      success: true,
      count: 0,
      message: 'All bet slips history deleted successfully upon explicit user request.',
      ownerSummary: computeOwnerSummary([]),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// API 0g. GET /api/bets/export (Export Owner Accounting & Bet History CSV/JSON)
app.get('/api/bets/export', (req, res) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const filterDate = req.query.date as string | undefined;

  let list = serverHistoryBets;
  if (filterDate && filterDate !== 'all') {
    list = serverHistoryBets.filter((b) => b.date === filterDate);
  }

  if (format === 'csv') {
    const headers = [
      'Ticket Number',
      'Date',
      'Time',
      'Round ID',
      'Category',
      'Target / Choice',
      'Stake (KHR)',
      'Multiplier',
      'Player Result',
      'Player Payout (KHR)',
      'Owner Outcome',
      'Owner Win/Loss (KHR)',
      'Winning Number',
      'Won Animal',
      'Notes',
    ];

    const rows = list.map((b) => {
      const isLost = b.result === 'lost';
      const isWon = b.result === 'won';
      const ownerWinLoss = isLost ? b.stake : isWon ? -(b.payout - b.stake) : 0;
      const ownerOutcome = isLost
        ? 'Owner Won (+Stake)'
        : isWon
        ? 'Owner Paid Out'
        : 'Pending';

      return [
        `"${b.ticketNumber || b.id}"`,
        `"${b.date}"`,
        `"${b.time}"`,
        `"${b.roundId}"`,
        `"${b.category}"`,
        `"${b.displayTarget || b.label}"`,
        b.stake,
        b.multiplier,
        `"${b.result}"`,
        b.payout || 0,
        `"${ownerOutcome}"`,
        ownerWinLoss,
        b.winningNumber || '',
        `"${b.wonAnimal || ''}"`,
        `"${(b.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="yuki12_owner_report_${filterDate || 'all'}.csv"`);
    return res.send(csvContent);
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="yuki12_owner_report_${filterDate || 'all'}.json"`);
  return res.json({
    summary: computeOwnerSummary(list),
    bets: list,
  });
});

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Multi-turn Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!ai) {
      // Graceful fallback if API key is not yet set
      const lastMsg = messages[messages.length - 1]?.text || '';
      return res.json({
        text: `FloraBot: I received your query about "${lastMsg}". Note: GEMINI_API_KEY is not configured yet in Secrets. For plant care: ensure adequate indirect sunlight and water when the topsoil feels dry. For Yuki 12: numbers 1-6 are Small (1.95x), 7-12 are Big (1.95x), and exact numbers pay 11x!`,
      });
    }

    // Default to gemini-3.8-flash for rapid, high-quality responses
    const chosenModel = model || 'gemini-3.8-flash';

    // Format chat contents
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const defaultSystemInstruction =
      systemInstruction ||
      'You are FloraBot & Yuki Master, a dual-specialist AI assistant: 1) A world-class gardening and botany expert providing plant identification, watering schedules, pest diagnosis, and care tips. 2) An expert analyst for the Yuki 12 Khmer lottery game, explaining odds (11x for single numbers 1-12, 1.95x for Small 1-6 / Big 7-12, 2.95x for Red/Green/Blue colors), statistics, and lucky plant connections. Always be helpful, precise, friendly, and bilingual (English and Khmer friendly).';

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents,
      config: {
        systemInstruction: defaultSystemInstruction,
      },
    });

    const replyText = response.text || 'I could not generate a response. Please try again.';
    return res.json({ text: replyText });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process chat message',
      fallbackText: 'Sorry, there was an issue connecting to Gemini. Please try again in a moment.',
    });
  }
});

// 2. Plant Identification and Care Analysis API
app.post('/api/identify-plant', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Clean base64 string
    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    if (!ai) {
      // Return realistic mock analysis if key is not active
      return res.json({
        name: 'Money Tree (Pachira aquatica)',
        scientificName: 'Pachira aquatica',
        family: 'Malvaceae',
        confidence: 0.94,
        description:
          'A popular braided indoor plant known for bringing good fortune and prosperity. Features lush five-lobed green leaves.',
        careInstructions: {
          light: 'Medium to bright indirect sunlight; avoid harsh direct afternoon sun.',
          watering: 'Water thoroughly once every 7 to 10 days, allowing the top 2-3 inches of soil to dry out between waterings.',
          soil: 'Rich, well-draining peat-moss potting mix with perlite.',
          temperature: '65°F to 80°F (18°C to 27°C). Protect from cold drafts.',
          humidity: 'Prefers 50%+ humidity; mist leaves occasionally.',
          fertilizer: 'Balanced liquid houseplant fertilizer once a month in spring and summer.',
        },
        healthCheck: {
          status: 'Healthy',
          diagnosis: 'Foliage appears vibrant and well-hydrated. Keep up regular drainage to prevent root rot.',
        },
        toxicity: 'Non-toxic to cats and dogs (pet-friendly).',
        luckyYukiConnection: {
          number: 8,
          animal: 'Goat (មមែ)',
          color: 'Green (បៃតង)',
          category: 'Big (ធំ 7-12)',
          meaning: 'Associated with wood energy, prosperity, and steady financial growth.',
        },
      });
    }

    // Model selection: try gemini-4-argon or fallback to gemini-3.8-flash
    const targetModel = 'gemini-3.8-flash';

    const systemPrompt = `You are an expert botanist, horticulturist, and plant pathologist.
Analyze the provided plant photo and return a strict JSON object with:
{
  "name": "Common Name",
  "scientificName": "Genus species",
  "family": "Plant Family",
  "confidence": 0.95,
  "description": "Brief description of the plant and its notable characteristics.",
  "careInstructions": {
    "light": "Specific light requirements",
    "watering": "Frequency and amount instructions",
    "soil": "Soil type and drainage needs",
    "temperature": "Optimal temperature range",
    "humidity": "Humidity preference",
    "fertilizer": "Feeding schedule"
  },
  "healthCheck": {
    "status": "Healthy / Needs Attention / Diseased",
    "diagnosis": "Visual observations of pests, yellowing, underwatering, or overall vigor."
  },
  "toxicity": "Toxicity warning for dogs, cats, or humans",
  "luckyYukiConnection": {
    "number": 1-12,
    "animal": "Zodiac animal (1: Rat, 2: Ox, 3: Tiger, 4: Rabbit, 5: Dragon, 6: Snake, 7: Horse, 8: Goat, 9: Monkey, 10: Rooster, 11: Dog, 12: Pig)",
    "color": "Red (1,4,7,10) or Green (2,5,8,11) or Blue (3,6,9,12)",
    "category": "Small (1-6) or Big (7-12)",
    "meaning": "Cultural or feng-shui meaning connected to this plant's vitality and fortune."
  }
}
Return only pure JSON without markdown code fences.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanedBase64,
      },
    };

    const textPart = {
      text: prompt || 'Identify this plant, assess its health, provide care instructions, and give its lucky Yuki 12 number connection.',
    };

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      // Clean possible fences
      const cleaned = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Plant ID error:', error);
    return res.status(500).json({
      error: error.message || 'Plant identification failed',
    });
  }
});

// 3. Khmer Audio Status & Verification Endpoint
app.get('/api/audio/status', (_req, res) => {
  const audioDir = path.resolve(process.cwd(), 'public/audio/khmer');
  const files = ['10.wav', '9.wav', '8.wav', '7.wav', '6.wav', '5.wav', '4.wav', '3.wav', '2.wav', '1.wav', 'goodluck.wav'];
  const status: Record<string, { exists: boolean; size: number }> = {};
  let allReady = true;

  files.forEach((f) => {
    const full = path.join(audioDir, f);
    if (fs.existsSync(full)) {
      status[f] = { exists: true, size: fs.statSync(full).size };
    } else {
      status[f] = { exists: false, size: 0 };
      allReady = false;
    }
  });

  return res.json({
    ready: allReady,
    phrases: {
      countdownKhmer: '១០ ៩ ៨ ៧ ៦ ៥ ៤ ៣ ២ ១',
      goodluckKhmer: 'សូមជូនពរឱ្យសំណាងល្អ',
    },
    files: status,
  });
});

// Setup Vite middleware or static serving
async function startServer() {
  const isStartScript = process.env.npm_lifecycle_event === 'start';
  const distPath = path.resolve(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || isStartScript || (hasDist && process.env.NODE_ENV !== 'development');

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    const publicPath = path.resolve(process.cwd(), 'public');
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
    }
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
