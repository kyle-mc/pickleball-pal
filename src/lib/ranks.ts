// Rocket League-style rank system
// 7 main ranks × 3 divisions + Supersonic Legend = 22 ranks

export interface Rank {
  name: string;
  tier: string;
  division?: number;
  minMmr: number;
  maxMmr: number;
  color: string;
  gradient: string;
}

// Rank definitions with Rocket League-inspired names
export const RANKS: Rank[] = [
  // Bronze (0-499)
  { name: 'Bronze I', tier: 'bronze', division: 1, minMmr: 0, maxMmr: 166, color: '#CD7F32', gradient: 'from-amber-700 to-amber-900' },
  { name: 'Bronze II', tier: 'bronze', division: 2, minMmr: 167, maxMmr: 333, color: '#CD7F32', gradient: 'from-amber-700 to-amber-900' },
  { name: 'Bronze III', tier: 'bronze', division: 3, minMmr: 334, maxMmr: 499, color: '#CD7F32', gradient: 'from-amber-700 to-amber-900' },
  
  // Silver (500-999)
  { name: 'Silver I', tier: 'silver', division: 1, minMmr: 500, maxMmr: 666, color: '#C0C0C0', gradient: 'from-gray-400 to-gray-600' },
  { name: 'Silver II', tier: 'silver', division: 2, minMmr: 667, maxMmr: 833, color: '#C0C0C0', gradient: 'from-gray-400 to-gray-600' },
  { name: 'Silver III', tier: 'silver', division: 3, minMmr: 834, maxMmr: 999, color: '#C0C0C0', gradient: 'from-gray-400 to-gray-600' },
  
  // Gold (1000-1499)
  { name: 'Gold I', tier: 'gold', division: 1, minMmr: 1000, maxMmr: 1166, color: '#FFD700', gradient: 'from-yellow-400 to-yellow-600' },
  { name: 'Gold II', tier: 'gold', division: 2, minMmr: 1167, maxMmr: 1333, color: '#FFD700', gradient: 'from-yellow-400 to-yellow-600' },
  { name: 'Gold III', tier: 'gold', division: 3, minMmr: 1334, maxMmr: 1499, color: '#FFD700', gradient: 'from-yellow-400 to-yellow-600' },
  
  // Platinum (1500-1799)
  { name: 'Platinum I', tier: 'platinum', division: 1, minMmr: 1500, maxMmr: 1599, color: '#4DD0E1', gradient: 'from-cyan-400 to-cyan-600' },
  { name: 'Platinum II', tier: 'platinum', division: 2, minMmr: 1600, maxMmr: 1699, color: '#4DD0E1', gradient: 'from-cyan-400 to-cyan-600' },
  { name: 'Platinum III', tier: 'platinum', division: 3, minMmr: 1700, maxMmr: 1799, color: '#4DD0E1', gradient: 'from-cyan-400 to-cyan-600' },
  
  // Diamond (1800-2099)
  { name: 'Diamond I', tier: 'diamond', division: 1, minMmr: 1800, maxMmr: 1899, color: '#B9F2FF', gradient: 'from-blue-300 to-blue-500' },
  { name: 'Diamond II', tier: 'diamond', division: 2, minMmr: 1900, maxMmr: 1999, color: '#B9F2FF', gradient: 'from-blue-300 to-blue-500' },
  { name: 'Diamond III', tier: 'diamond', division: 3, minMmr: 2000, maxMmr: 2099, color: '#B9F2FF', gradient: 'from-blue-300 to-blue-500' },
  
  // Champion (2100-2399)
  { name: 'Champion I', tier: 'champion', division: 1, minMmr: 2100, maxMmr: 2199, color: '#C77DFF', gradient: 'from-purple-400 to-purple-600' },
  { name: 'Champion II', tier: 'champion', division: 2, minMmr: 2200, maxMmr: 2299, color: '#C77DFF', gradient: 'from-purple-400 to-purple-600' },
  { name: 'Champion III', tier: 'champion', division: 3, minMmr: 2300, maxMmr: 2399, color: '#C77DFF', gradient: 'from-purple-400 to-purple-600' },
  
  // Grand Champion (2400-2699)
  { name: 'Grand Champion I', tier: 'grand_champion', division: 1, minMmr: 2400, maxMmr: 2499, color: '#FF5252', gradient: 'from-red-400 to-red-600' },
  { name: 'Grand Champion II', tier: 'grand_champion', division: 2, minMmr: 2500, maxMmr: 2599, color: '#FF5252', gradient: 'from-red-400 to-red-600' },
  { name: 'Grand Champion III', tier: 'grand_champion', division: 3, minMmr: 2600, maxMmr: 2699, color: '#FF5252', gradient: 'from-red-400 to-red-600' },
  
  // Supersonic Legend (2700+)
  { name: 'Supersonic Legend', tier: 'supersonic_legend', minMmr: 2700, maxMmr: 9999, color: '#FFE082', gradient: 'from-amber-300 via-yellow-200 to-amber-400' },
];

export function getRankFromMmr(mmr: number): Rank {
  return RANKS.find(r => mmr >= r.minMmr && mmr <= r.maxMmr) || RANKS[0];
}

export function getNextRank(currentRank: Rank): Rank | null {
  const currentIndex = RANKS.findIndex(r => r.name === currentRank.name);
  return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
}

export function getPreviousRank(currentRank: Rank): Rank | null {
  const currentIndex = RANKS.findIndex(r => r.name === currentRank.name);
  return currentIndex > 0 ? RANKS[currentIndex - 1] : null;
}

export function getMmrProgressToNextRank(mmr: number, rank: Rank): number {
  const rangeSize = rank.maxMmr - rank.minMmr + 1;
  const progress = mmr - rank.minMmr;
  return Math.min(100, Math.round((progress / rangeSize) * 100));
}

// Tier colors for CSS
export const TIER_COLORS: Record<string, string> = {
  bronze: 'text-amber-600',
  silver: 'text-gray-400',
  gold: 'text-yellow-500',
  platinum: 'text-cyan-400',
  diamond: 'text-blue-400',
  champion: 'text-purple-400',
  grand_champion: 'text-red-500',
  supersonic_legend: 'text-amber-300',
};

export const TIER_BG_COLORS: Record<string, string> = {
  bronze: 'bg-amber-600/20',
  silver: 'bg-gray-400/20',
  gold: 'bg-yellow-500/20',
  platinum: 'bg-cyan-400/20',
  diamond: 'bg-blue-400/20',
  champion: 'bg-purple-400/20',
  grand_champion: 'bg-red-500/20',
  supersonic_legend: 'bg-gradient-to-r from-amber-300/20 via-yellow-200/20 to-amber-400/20',
};

export const TIER_ICONS: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  diamond: "💠",
  champion: "🏆",
  grand_champion: "👑",
  supersonic_legend: "⚡",
};

export const TIERS = [
  { tier: "bronze", label: "Bronze", minMmr: 0, maxMmr: 499 },
  { tier: "silver", label: "Silver", minMmr: 500, maxMmr: 999 },
  { tier: "gold", label: "Gold", minMmr: 1000, maxMmr: 1499 },
  { tier: "platinum", label: "Platinum", minMmr: 1500, maxMmr: 1799 },
  { tier: "diamond", label: "Diamond", minMmr: 1800, maxMmr: 2099 },
  { tier: "champion", label: "Champion", minMmr: 2100, maxMmr: 2399 },
  { tier: "grand_champion", label: "GC", minMmr: 2400, maxMmr: 2699 },
  { tier: "supersonic_legend", label: "SSL", minMmr: 2700, maxMmr: 3500 },
];
