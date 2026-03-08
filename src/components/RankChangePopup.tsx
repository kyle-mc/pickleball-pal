import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getRankFromMmr, TIER_COLORS, TIER_BG_COLORS, TIER_ICONS } from "@/lib/ranks";
import { cn } from "@/lib/utils";

interface RankChangePopupProps {
  playerName: string;
  currentMmr: number;
  gamesPlayed: number;
}

const RANK_STORAGE_KEY = "pickle_last_known_rank_tier_";

export function RankChangePopup({ playerName, currentMmr, gamesPlayed }: RankChangePopupProps) {
  const [open, setOpen] = useState(false);
  const [changeType, setChangeType] = useState<"promoted" | "demoted">("promoted");
  const [oldTier, setOldTier] = useState("");
  const [newTier, setNewTier] = useState("");

  useEffect(() => {
    if (!playerName || gamesPlayed === 0) return;

    const storageKey = RANK_STORAGE_KEY + playerName;
    const currentRank = getRankFromMmr(currentMmr);
    const storedTier = localStorage.getItem(storageKey);

    if (storedTier && storedTier !== currentRank.tier) {
      // Tier changed! Show popup
      const oldRank = getRankFromMmr(
        storedTier === "supersonic_legend" ? 2700 :
        storedTier === "grand_champion" ? 2500 :
        storedTier === "champion" ? 2200 :
        storedTier === "diamond" ? 1900 :
        storedTier === "platinum" ? 1600 :
        storedTier === "gold" ? 1200 :
        storedTier === "silver" ? 700 : 200
      );
      
      const oldTierIndex = ["bronze", "silver", "gold", "platinum", "diamond", "champion", "grand_champion", "supersonic_legend"].indexOf(storedTier);
      const newTierIndex = ["bronze", "silver", "gold", "platinum", "diamond", "champion", "grand_champion", "supersonic_legend"].indexOf(currentRank.tier);
      
      setChangeType(newTierIndex > oldTierIndex ? "promoted" : "demoted");
      setOldTier(storedTier);
      setNewTier(currentRank.tier);
      setOpen(true);
    }

    // Always update stored tier
    localStorage.setItem(storageKey, currentRank.tier);
  }, [playerName, currentMmr, gamesPlayed]);

  const currentRank = getRankFromMmr(currentMmr);
  const isPromotion = changeType === "promoted";

  const tierLabel = (tier: string) => {
    return tier === "grand_champion" ? "Grand Champion" : 
           tier === "supersonic_legend" ? "Supersonic Legend" :
           tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-card border-border overflow-hidden p-0">
        <div className="relative">
          {/* Animated background */}
          <div className={cn(
            "absolute inset-0 opacity-20",
            isPromotion 
              ? "bg-gradient-to-br from-primary via-transparent to-accent" 
              : "bg-gradient-to-br from-destructive via-transparent to-muted"
          )} />
          
          <div className="relative p-8 flex flex-col items-center text-center">
            {/* Icon with animation */}
            <div className={cn(
              "text-7xl mb-4 animate-scale-in",
            )}>
              {TIER_ICONS[newTier] || "🎖️"}
            </div>

            {/* Title */}
            <h2 className={cn(
              "font-display text-3xl mb-2 animate-fade-in",
              isPromotion ? "text-primary" : "text-destructive"
            )}>
              {isPromotion ? "RANK UP!" : "RANK DOWN"}
            </h2>

            {/* Tier change */}
            <div className="flex items-center gap-3 mb-4 animate-fade-in">
              <span className={cn("text-lg", TIER_COLORS[oldTier])}>
                {TIER_ICONS[oldTier]} {tierLabel(oldTier)}
              </span>
              <span className="text-2xl text-muted-foreground">→</span>
              <span className={cn("text-lg font-bold", TIER_COLORS[newTier])}>
                {TIER_ICONS[newTier]} {tierLabel(newTier)}
              </span>
            </div>

            {/* Current rank detail */}
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4",
              TIER_BG_COLORS[currentRank.tier],
              TIER_COLORS[currentRank.tier],
            )}>
              {currentRank.name} — {currentMmr} MMR
            </div>

            {/* Sparkle effects for promotion */}
            {isPromotion && (
              <>
                <div className="absolute top-4 left-8 text-2xl animate-ping">✨</div>
                <div className="absolute top-12 right-8 text-2xl animate-ping" style={{ animationDelay: "150ms" }}>✨</div>
                <div className="absolute bottom-16 left-12 text-2xl animate-ping" style={{ animationDelay: "300ms" }}>✨</div>
                <div className="absolute bottom-8 right-12 text-2xl animate-ping" style={{ animationDelay: "450ms" }}>✨</div>
              </>
            )}

            <p className="text-sm text-muted-foreground">
              {isPromotion 
                ? "Keep up the great work! 🎉" 
                : "Don't worry — you'll climb back! 💪"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
