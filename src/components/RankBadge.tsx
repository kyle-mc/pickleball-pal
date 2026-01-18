import { useState, useEffect } from "react";
import { getRankFromMmr, getMmrProgressToNextRank, getNextRank, TIER_COLORS, TIER_BG_COLORS, Rank } from "@/lib/ranks";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

export function RankBadge({ 
  mmr, 
  gamesPlayed, 
  showMmr = true, 
  size = "md",
  showProgress = false,
  animate = false,
}: RankBadgeProps) {
  const isUnranked = gamesPlayed < 10;
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

interface PlacementRevealProps {
  mmr: number;
  onComplete?: () => void;
}

export function PlacementReveal({ mmr, onComplete }: PlacementRevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [displayedMmr, setDisplayedMmr] = useState(2000);
  const rank = getRankFromMmr(mmr);

  useEffect(() => {
    // Start the reveal animation after a delay
    const revealTimeout = setTimeout(() => {
      setRevealed(true);
      
      // Animate MMR count-up
      const startMmr = 2000;
      const duration = 2000;
      const startTime = Date.now();
      
      const animateMmr = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        
        const currentMmr = Math.round(startMmr + (mmr - startMmr) * eased);
        setDisplayedMmr(currentMmr);
        
        if (progress < 1) {
          requestAnimationFrame(animateMmr);
        } else {
          onComplete?.();
        }
      };
      
      requestAnimationFrame(animateMmr);
    }, 500);

    return () => clearTimeout(revealTimeout);
  }, [mmr, onComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center p-8 rounded-xl bg-card border border-border overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
      
      {!revealed ? (
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="text-6xl animate-pulse">❓</div>
          <div className="text-lg text-muted-foreground">Rank Reveal...</div>
          <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center gap-4 animate-scale-in">
          <div className="text-6xl">
            {TIER_ICONS[rank.tier]}
          </div>
          <div className={cn(
            "text-2xl font-bold",
            TIER_COLORS[rank.tier]
          )}>
            {rank.name}
          </div>
          <div className="text-4xl font-display text-foreground">
            {displayedMmr} MMR
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Placements Complete!
          </div>
        </div>
      )}
      
      {/* Sparkle effects when revealed */}
      {revealed && (
        <>
          <div className="absolute top-4 left-4 text-yellow-400 animate-ping">✨</div>
          <div className="absolute top-8 right-8 text-yellow-400 animate-ping delay-100">✨</div>
          <div className="absolute bottom-8 left-8 text-yellow-400 animate-ping delay-200">✨</div>
          <div className="absolute bottom-4 right-4 text-yellow-400 animate-ping delay-300">✨</div>
        </>
      )}
    </div>
  );
}
