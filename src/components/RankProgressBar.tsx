import { getRankFromMmr, TIER_COLORS, TIER_BG_COLORS, TIER_ICONS, TIERS } from "@/lib/ranks";
import { cn } from "@/lib/utils";
import { usePlacementEnabled } from "@/hooks/usePlacementEnabled";

interface RankProgressBarProps {
  mmr: number;
  gamesPlayed: number;
  hideMmr?: boolean;
}

const MAX_MMR = 3500;

export function RankProgressBar({ mmr, gamesPlayed, hideMmr = false }: RankProgressBarProps) {
  const { placementEnabled } = usePlacementEnabled();
  const isUnranked = placementEnabled && gamesPlayed < 10;
  const currentRank = getRankFromMmr(mmr);
  const positionPercent = hideMmr ? 0 : Math.min(100, Math.max(0, (mmr / MAX_MMR) * 100));

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <div className="flex h-4 rounded-full overflow-hidden bg-muted/30 border border-border">
          {TIERS.map((tier, index) => {
            const width = ((tier.maxMmr - tier.minMmr + 1) / MAX_MMR) * 100;
            const isCurrentTier = !isUnranked && !hideMmr && currentRank.tier === tier.tier;
            return (
              <div key={tier.tier} className={cn("relative transition-all", isCurrentTier ? "opacity-100" : "opacity-50", index > 0 && "border-l border-border/50")} style={{ width: `${width}%` }}>
                <div className={cn("h-full",
                  tier.tier === "bronze" && "bg-gradient-to-r from-amber-700 to-amber-800",
                  tier.tier === "silver" && "bg-gradient-to-r from-gray-400 to-gray-500",
                  tier.tier === "gold" && "bg-gradient-to-r from-yellow-500 to-yellow-600",
                  tier.tier === "platinum" && "bg-gradient-to-r from-cyan-400 to-cyan-500",
                  tier.tier === "diamond" && "bg-gradient-to-r from-blue-400 to-blue-500",
                  tier.tier === "champion" && "bg-gradient-to-r from-purple-500 to-purple-600",
                  tier.tier === "grand_champion" && "bg-gradient-to-r from-red-500 to-red-600",
                  tier.tier === "supersonic_legend" && "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500"
                )} />
              </div>
            );
          })}
        </div>

        {!hideMmr && (
          <div className="absolute top-1/2 -translate-y-1/2 transform transition-all duration-500" style={{ left: `${positionPercent}%`, transform: `translateX(-50%) translateY(-50%)` }}>
            <div className="relative flex flex-col items-center">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg border-2",
                isUnranked ? "bg-muted border-border" : cn(TIER_BG_COLORS[currentRank.tier], "border-current"),
                !isUnranked && TIER_COLORS[currentRank.tier])}>
                {isUnranked ? "❓" : TIER_ICONS[currentRank.tier]}
              </div>
              <div className={cn("absolute -bottom-6 text-xs font-bold whitespace-nowrap px-1.5 py-0.5 rounded",
                isUnranked ? "text-muted-foreground bg-muted" : cn(TIER_COLORS[currentRank.tier], TIER_BG_COLORS[currentRank.tier]))}>
                {mmr}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex text-[9px] sm:text-[10px] text-muted-foreground mt-6">
        {TIERS.map((tier) => {
          const width = ((tier.maxMmr - tier.minMmr + 1) / MAX_MMR) * 100;
          const isCurrentTier = !isUnranked && !hideMmr && currentRank.tier === tier.tier;
          return (
            <div key={tier.tier} className={cn("text-center truncate", isCurrentTier && TIER_COLORS[tier.tier])} style={{ width: `${width}%` }}>
              <span className="hidden sm:inline">{TIER_ICONS[tier.tier]} </span>
              {tier.label}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-2">
        {isUnranked ? (
          <div className="text-muted-foreground">
            <span className="font-medium">Unranked</span>
            <span className="text-sm ml-2">({gamesPlayed}/10 placement games)</span>
          </div>
        ) : (
          <div className={cn("font-medium", TIER_COLORS[currentRank.tier])}>
            {TIER_ICONS[currentRank.tier]} {currentRank.name}
          </div>
        )}
      </div>
    </div>
  );
}
