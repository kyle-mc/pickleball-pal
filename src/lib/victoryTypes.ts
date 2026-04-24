// Victory type definitions for pickleball games

export interface VictoryType {
  id: string;
  name: string;
  description: string;
  emoji: string;
  multiplier: number;
  bonus: number;
  color: string;
  bgColor: string;
}

export const VICTORY_TYPES: Record<string, VictoryType> = {
  golden_pickle: {
    id: 'golden_pickle',
    name: 'Golden Pickle',
    description: '11-0 and losing team never served',
    emoji: '🏆',
    multiplier: 2.0,
    bonus: 0,
    color: 'text-amber-300',
    bgColor: 'bg-amber-300/20',
  },
  pickled: {
    id: 'pickled',
    name: 'Pickled',
    description: '11-0 shutout',
    emoji: '🥒',
    multiplier: 1.5,
    bonus: 0,
    color: 'text-green-400',
    bgColor: 'bg-green-400/20',
  },
  steamroller: {
    id: 'steamroller',
    name: 'The Steamroller',
    description: '11-1 to 11-4',
    emoji: '🚂',
    multiplier: 1.2,
    bonus: 0,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20',
  },
  standard: {
    id: 'standard',
    name: 'The Standard',
    description: '11-5 to 11-8',
    emoji: '⭐',
    multiplier: 1.0,
    bonus: 0,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
  },
  squeaker: {
    id: 'squeaker',
    name: 'The Squeaker',
    description: '11-9 close game',
    emoji: '🐁',
    multiplier: 0.9,
    bonus: 0,
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/20',
  },
  clutch_god: {
    id: 'clutch_god',
    name: 'The Clutch God',
    description: 'Overtime win by 2',
    emoji: '🔥',
    multiplier: 1.0,
    bonus: 2,
    color: 'text-red-500',
    bgColor: 'bg-red-500/20',
  },
};

export function getVictoryTypeFromScore(winningScore: number, losingScore: number, neverServed?: boolean): VictoryType {
  if (winningScore === 11 && losingScore === 0) {
    return neverServed ? VICTORY_TYPES.golden_pickle : VICTORY_TYPES.pickled;
  }
  if (winningScore === 11 && losingScore >= 1 && losingScore <= 4) {
    return VICTORY_TYPES.steamroller;
  }
  if (winningScore === 11 && losingScore >= 5 && losingScore <= 8) {
    return VICTORY_TYPES.standard;
  }
  if (winningScore === 11 && losingScore === 9) {
    return VICTORY_TYPES.squeaker;
  }
  if (winningScore >= 12 && (winningScore - losingScore) === 2) {
    return VICTORY_TYPES.clutch_god;
  }
  return VICTORY_TYPES.standard;
}

export function getVictoryTypeById(id: string): VictoryType {
  return VICTORY_TYPES[id] || VICTORY_TYPES.standard;
}
