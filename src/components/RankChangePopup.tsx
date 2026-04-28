import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getRankFromMmr, TIER_COLORS, TIER_BG_COLORS, TIER_ICONS } from "@/lib/ranks";
import { cn } from "@/lib/utils";

interface RankChangePopupProps {
  playerName: string;
  currentMmr: number;
  gamesPlayed: number;
  /**
   * The MMR before the most recent game. When provided, the popup uses this
   * (DB-sourced) value to determine rank change direction, which avoids stale
   * localStorage state showing the wrong direction across devices/PWA sessions.
   */
  previousMmr?: number;
}

const RANK_STORAGE_KEY = "pickle_last_known_mmr_";

const TIER_ORDER = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "champion",
  "grand_champion",
  "supersonic_legend",
];

const fireConfetti = () => {
  const duration = 2500;
  const end = Date.now() + duration;

  const colors = ["#22c55e", "#16a34a", "#fbbf24", "#a78bfa", "#60a5fa"];

  // Initial burst
  confetti({
    particleCount: 120,
    spread: 90,
    origin: { y: 0.4 },
    colors,
    zIndex: 9999,
  });

  // Sustained side cannons
  const interval = window.setInterval(() => {
    if (Date.now() > end) {
      window.clearInterval(interval);
      return;
    }
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors,
      zIndex: 9999,
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors,
      zIndex: 9999,
    });
  }, 350);
};

export function RankChangePopup({ playerName, currentMmr, gamesPlayed, previousMmr }: RankChangePopupProps) {
  const [open, setOpen] = useState(false);
  const [changeType, setChangeType] = useState<"promoted" | "demoted">("promoted");
  const [oldTier, setOldTier] = useState("");
  const [newTier, setNewTier] = useState("");
  // Sequential reveal: 0 = old tier, 1 = arrow + sparkles, 2 = new tier reveal
  const [phase, setPhase] = useState(0);
  const phaseTimers = useRef<number[]>([]);

  useEffect(() => {
    if (!playerName || gamesPlayed === 0) return;

    const storageKey = RANK_STORAGE_KEY + playerName;
    const currentRank = getRankFromMmr(currentMmr);

    // Prefer the DB-sourced previousMmr (mmr_before of the most recent game).
    // Fall back to last-seen MMR from localStorage to detect changes between visits.
    const storedMmrStr = localStorage.getItem(storageKey);
    const storedMmr = storedMmrStr ? Number(storedMmrStr) : NaN;

    const prevMmr = typeof previousMmr === "number" && !Number.isNaN(previousMmr)
      ? previousMmr
      : (!Number.isNaN(storedMmr) ? storedMmr : null);

    if (prevMmr !== null) {
      const prevRank = getRankFromMmr(prevMmr);
      if (prevRank.tier !== currentRank.tier) {
        const oldIdx = TIER_ORDER.indexOf(prevRank.tier);
        const newIdx = TIER_ORDER.indexOf(currentRank.tier);
        const promoted = newIdx > oldIdx;
        setChangeType(promoted ? "promoted" : "demoted");
        setOldTier(prevRank.tier);
        setNewTier(currentRank.tier);
        setOpen(true);
        setPhase(0);

        // Sequential reveal
        phaseTimers.current.forEach(id => window.clearTimeout(id));
        phaseTimers.current = [
          window.setTimeout(() => setPhase(1), 700),
          window.setTimeout(() => setPhase(2), 1400),
          window.setTimeout(() => {
            if (promoted) fireConfetti();
          }, 1500),
        ];
      }
    }

    // Always update stored MMR so future returns compare against the latest known value
    localStorage.setItem(storageKey, String(currentMmr));

    return () => {
      phaseTimers.current.forEach(id => window.clearTimeout(id));
    };
  }, [playerName, currentMmr, gamesPlayed, previousMmr]);

  const currentRank = getRankFromMmr(currentMmr);
  const isPromotion = changeType === "promoted";

  const tierLabel = (tier: string) => {
    return tier === "grand_champion"
      ? "Grand Champion"
      : tier === "supersonic_legend"
        ? "Supersonic Legend"
        : tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-card border-border overflow-hidden p-0">
        <div className="relative">
          {/* Animated background */}
          <div className={cn(
            "absolute inset-0 opacity-20 transition-opacity duration-700",
            isPromotion 
              ? "bg-gradient-to-br from-primary via-transparent to-accent" 
              : "bg-gradient-to-br from-destructive via-transparent to-muted"
          )} />
          
          <div className="relative p-8 flex flex-col items-center text-center min-h-[420px]">
            {/* Title */}
            <h2 className={cn(
              "font-display text-3xl mb-4 animate-fade-in",
              isPromotion ? "text-primary" : "text-destructive"
            )}>
              {isPromotion ? "RANK UP!" : "RANK DOWN"}
            </h2>

            {/* Sequential tier reveal */}
            <div className="flex flex-col items-center gap-4 mb-6">
              {/* Old tier */}
              <div className={cn(
                "flex flex-col items-center transition-all duration-500",
                phase >= 0 ? "opacity-100 scale-100" : "opacity-0 scale-90"
              )}>
                <div className="text-5xl mb-1">{TIER_ICONS[oldTier]}</div>
                <div className={cn("text-base", TIER_COLORS[oldTier])}>{tierLabel(oldTier)}</div>
              </div>

              {/* Arrow */}
              <div className={cn(
                "text-3xl transition-all duration-500",
                phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4",
                isPromotion ? "text-primary" : "text-destructive"
              )}>
                {isPromotion ? "▲" : "▼"}
              </div>

              {/* New tier — big reveal */}
              <div className={cn(
                "flex flex-col items-center transition-all duration-700",
                phase >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-50"
              )}>
                <div className="text-7xl mb-2 drop-shadow-lg">{TIER_ICONS[newTier] || "🎖️"}</div>
                <div className={cn("text-2xl font-bold", TIER_COLORS[newTier])}>
                  {tierLabel(newTier)}
                </div>
              </div>
            </div>

            {/* Current rank detail */}
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-3 transition-opacity duration-500",
              TIER_BG_COLORS[currentRank.tier],
              TIER_COLORS[currentRank.tier],
              phase >= 2 ? "opacity-100" : "opacity-0"
            )}>
              {currentRank.name} — {currentMmr} MMR
            </div>

            {/* Sparkle effects for promotion */}
            {isPromotion && phase >= 1 && (
              <>
                <div className="absolute top-4 left-8 text-2xl animate-ping">✨</div>
                <div className="absolute top-12 right-8 text-2xl animate-ping" style={{ animationDelay: "150ms" }}>✨</div>
                <div className="absolute bottom-16 left-12 text-2xl animate-ping" style={{ animationDelay: "300ms" }}>✨</div>
                <div className="absolute bottom-8 right-12 text-2xl animate-ping" style={{ animationDelay: "450ms" }}>✨</div>
              </>
            )}

            <p className={cn(
              "text-sm text-muted-foreground transition-opacity duration-500",
              phase >= 2 ? "opacity-100" : "opacity-0"
            )}>
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
