import { useMemo } from "react";
import { RANKS, getRankFromMmr, TIER_COLORS, TIER_BG_COLORS } from "@/lib/ranks";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { usePlayerAvatars, getPlayerAvatar } from "@/hooks/usePlayerAvatars";

interface Player {
  name: string;
  mmr: number;
  gamesPlayed: number;
  isPlacement?: boolean;
}

interface AllPlayersRankChartProps {
  players: Player[];
  highlightedPlayer?: string | null;
  showPlacementMMR?: boolean;
}

const TIER_ICONS: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  diamond: "💠",
  champion: "🏆",
  grand_champion: "👑",
  supersonic_legend: "⚡",
};

const TIERS = [
  { tier: "bronze", label: "Bronze", minMmr: 0, maxMmr: 499 },
  { tier: "silver", label: "Silver", minMmr: 500, maxMmr: 999 },
  { tier: "gold", label: "Gold", minMmr: 1000, maxMmr: 1499 },
  { tier: "platinum", label: "Platinum", minMmr: 1500, maxMmr: 1799 },
  { tier: "diamond", label: "Diamond", minMmr: 1800, maxMmr: 2099 },
  { tier: "champion", label: "Champion", minMmr: 2100, maxMmr: 2399 },
  { tier: "grand_champion", label: "GC", minMmr: 2400, maxMmr: 2699 },
  { tier: "supersonic_legend", label: "SSL", minMmr: 2700, maxMmr: 3500 },
];

const MAX_MMR = 3500;

const PLAYER_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#14b8a6",
];

export function AllPlayersRankChart({ players, highlightedPlayer, showPlacementMMR = false }: AllPlayersRankChartProps) {
  const { data: avatarMap } = usePlayerAvatars();

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.mmr - a.mmr);
  }, [players]);

  return (
    <Card className="bg-card/50 border-border mb-8">
      <CardHeader>
        <CardTitle className="text-foreground">All Players Rank Positions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main progress bar container */}
          <div className="relative">
            {/* Tier segments */}
            <div className="flex h-6 rounded-full overflow-hidden bg-muted/30 border border-border">
              {TIERS.map((tier, index) => {
                const width = ((tier.maxMmr - tier.minMmr + 1) / MAX_MMR) * 100;
                
                return (
                  <div
                    key={tier.tier}
                    className={cn(
                      "relative transition-all opacity-70",
                      index > 0 && "border-l border-border/50"
                    )}
                    style={{ width: `${width}%` }}
                  >
                    <div
                      className={cn(
                        "h-full",
                        tier.tier === "bronze" && "bg-gradient-to-r from-amber-700 to-amber-800",
                        tier.tier === "silver" && "bg-gradient-to-r from-gray-400 to-gray-500",
                        tier.tier === "gold" && "bg-gradient-to-r from-yellow-500 to-yellow-600",
                        tier.tier === "platinum" && "bg-gradient-to-r from-cyan-400 to-cyan-500",
                        tier.tier === "diamond" && "bg-gradient-to-r from-blue-400 to-blue-500",
                        tier.tier === "champion" && "bg-gradient-to-r from-purple-500 to-purple-600",
                        tier.tier === "grand_champion" && "bg-gradient-to-r from-red-500 to-red-600",
                        tier.tier === "supersonic_legend" && "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"
                      )}
                    />
                  </div>
                );
              })}
            </div>

            {/* Player position markers */}
            {sortedPlayers.map((player, index) => {
              const isUnranked = (player.isPlacement) && player.gamesPlayed < 10;
              const positionPercent = Math.min(100, Math.max(0, (player.mmr / MAX_MMR) * 100));
              const isHighlighted = highlightedPlayer === player.name;
              const color = PLAYER_COLORS[index % PLAYER_COLORS.length];

              return (
                <div
                  key={player.name}
                  className="absolute top-1/2 transform transition-all duration-500"
                  style={{ 
                    left: `${positionPercent}%`, 
                    transform: `translateX(-50%) translateY(-50%)`,
                    zIndex: isHighlighted ? 20 : 10 - index,
                  }}
                >
                  <div className={cn(
                    "relative flex flex-col items-center group cursor-pointer",
                  )}>
                    <div 
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg border-2 transition-transform hover:scale-125",
                        isHighlighted && "scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background"
                      )}
                      style={{ 
                        backgroundColor: color,
                        borderColor: isHighlighted ? 'hsl(var(--primary))' : color,
                      }}
                    >
                      <span className="text-[10px] font-bold text-white">
                        {player.name.charAt(0)}
                      </span>
                    </div>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                      <div className="bg-card border border-border rounded px-2 py-1 shadow-lg whitespace-nowrap">
                        <div className="text-xs font-medium text-foreground">{player.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {isUnranked && !showPlacementMMR ? "Placing" : `${player.mmr} MMR`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tier labels below */}
          <div className="flex text-[9px] sm:text-[10px] text-muted-foreground mt-4">
            {TIERS.map((tier) => {
              const width = ((tier.maxMmr - tier.minMmr + 1) / MAX_MMR) * 100;
              
              return (
                <div
                  key={tier.tier}
                  className="text-center truncate"
                  style={{ width: `${width}%` }}
                >
                  <span className="hidden sm:inline">{TIER_ICONS[tier.tier]} </span>
                  {tier.label}
                </div>
              );
            })}
          </div>

          {/* Player legend */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
            {sortedPlayers.map((player, index) => {
              const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
              const isHighlighted = highlightedPlayer === player.name;
              const isUnranked = (player.isPlacement) && player.gamesPlayed < 10;
              
              return (
                <div 
                  key={player.name}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                    isHighlighted ? "bg-primary/10 ring-1 ring-primary" : "bg-muted/30"
                  )}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-medium text-foreground">{player.name}</span>
                  <span className="text-muted-foreground">
                    {isUnranked && !showPlacementMMR ? 'Placing' : player.mmr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
