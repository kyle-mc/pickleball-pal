import { getRankFromMmr, getMmrProgressToNextRank, getNextRank, TIER_COLORS, TIER_BG_COLORS, TIER_ICONS } from "@/lib/ranks";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { usePlacementEnabled } from "@/hooks/usePlacementEnabled";

interface RankBadgeProps {
  mmr: number;
  gamesPlayed: number;
  showMmr?: boolean;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  animate?: boolean;
}

const SIZE_CLASSES = {
  sm: "text-xs px-2 py-1",
  md: "text-sm px-3 py-1.5",
  lg: "text-base px-4 py-2",
};

const ICON_SIZES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export function RankBadge({ 
  mmr, 
  gamesPlayed, 
  showMmr = true, 
  size = "md",
  showProgress = false,
  animate = false,
}: RankBadgeProps) {
  const { placementEnabled } = usePlacementEnabled();
  const isUnranked = placementEnabled && gamesPlayed < 10;
  const rank = getRankFromMmr(mmr);
  const nextRank = getNextRank(rank);
  const progress = getMmrProgressToNextRank(mmr, rank);
  const placementProgress = (gamesPlayed / 10) * 100;

  if (isUnranked) {
    return (
      <div className="flex flex-col gap-2">
        <div className={cn(
          "inline-flex items-center gap-2 rounded-full font-medium",
          "bg-muted/50 border border-border text-muted-foreground",
          SIZE_CLASSES[size],
        )}>
          <span className={ICON_SIZES[size]}>❓</span>
          <span>Unranked</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Placement Progress</span>
            <span>{gamesPlayed}/10 games</span>
          </div>
          <Progress value={placementProgress} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className={cn(
        "inline-flex items-center gap-2 rounded-full font-medium",
        TIER_BG_COLORS[rank.tier],
        TIER_COLORS[rank.tier],
        SIZE_CLASSES[size],
        animate && "animate-scale-in",
      )}>
        <span className={ICON_SIZES[size]}>{TIER_ICONS[rank.tier]}</span>
        <span>{rank.name}</span>
        {showMmr && (
          <span className="opacity-75">({mmr})</span>
        )}
      </div>
      
      {showProgress && nextRank && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Next: {nextRank.name}</span>
            <span>{nextRank.minMmr - mmr} MMR to go</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}
