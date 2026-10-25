export type BetCategory =
  | 'small' // 1-6 (1.95x)
  | 'big' // 7-12 (1.95x)
  | 'odd' // 1,3,5,7,9,11 (1.95x)
  | 'even' // 2,4,6,8,10,12 (1.95x)
  | 'red' // 1,4,7,10 (2.95x)
  | 'green' // 2,5,8,11 (2.95x)
  | 'blue' // 3,6,9,12 (2.95x)
  | 'number'; // 1-12 (11x)

export type ColorType = 'red' | 'green' | 'blue';

export interface ZodiacItem {
  number: number;
  khmerName: string;
  englishName: string;
  color: ColorType;
  colorKhmer: string;
  isBig: boolean;
  isEven: boolean;
  payoutMultiplier: number; // 11
  colorHex: string;
  bgGradient: string;
  iconSymbol: string;
  luckyPlant: string;
}

export interface PlacedBet {
  id: string;
  category: BetCategory;
  targetNumber?: number; // 1-12 if category === 'number'
  label: string;
  amount: number;
  multiplier: number;
  timestamp: string;
  roundId: string;
  notes?: string;
}

export interface BetSlipRecord {
  id: string;
  ticketNumber?: string;
  roundId: string;
  date: string;
  time: string;
  category: BetCategory;
  targetNumber?: number;
  label: string;
  displayTarget?: string;
  stake: number;
  multiplier: number;
  potentialPayback?: number;
  result: 'won' | 'lost' | 'pending';
  payout: number;
  winningNumber?: number;
  wonAnimal?: string;
  timestamp?: number;
  notes?: string;
  deletedFromHistory?: boolean;
}

export interface RoundResult {
  roundId: string;
  drawDate: string;
  drawTime: string;
  number: number;
  khmerName: string;
  englishName: string;
  isBig: boolean; // 7-12
  isEven: boolean;
  color: ColorType;
  timestamp: number;
}

export interface PlantCareResult {
  name: string;
  scientificName: string;
  family: string;
  confidence: number;
  description: string;
  careInstructions: {
    light: string;
    watering: string;
    soil: string;
    temperature: string;
    humidity: string;
    fertilizer: string;
  };
  healthCheck: {
    status: string;
    diagnosis: string;
  };
  toxicity: string;
  luckyYukiConnection?: {
    number: number;
    animal: string;
    color: string;
    category: string;
    meaning: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
