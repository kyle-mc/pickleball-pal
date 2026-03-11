import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RANKS, TIER_COLORS, TIER_BG_COLORS, TIER_ICONS, TIERS } from "@/lib/ranks";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface RanksChartDialogProps {
  currentMmr?: number;
  trigger?: React.ReactNode;
}

export function RanksChartDialog({ currentMmr, trigger }: RanksChartDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-muted-foreground text-xs gap-1">
            <Info className="w-3 h-3" />
            View All Ranks
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground flex items-center gap-2">
            🎖️ Rank System
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-1 mt-2">
          {TIERS.slice().reverse().map((tier) => {
            const tierRanks = RANKS.filter(r => r.tier === tier.tier);
            const icon = TIER_ICONS[tier.tier];
            const isCurrentTier = currentMmr !== undefined && 
              currentMmr >= tier.minMmr && currentMmr <= tier.maxMmr;
            
            return (
              <div 
                key={tier.tier}
                className={cn(
                  "rounded-lg p-3 transition-all",
                  isCurrentTier 
                    ? cn(TIER_BG_COLORS[tier.tier], "ring-1 ring-primary") 
                    : "bg-muted/20"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{icon}</span>
                  <span className={cn("font-display text-lg", TIER_COLORS[tier.tier])}>
                    {tier.label === "GC" ? "Grand Champion" : 
                     tier.label === "SSL" ? "Supersonic Legend" : tier.label}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {tier.minMmr}–{tier.tier === "supersonic_legend" ? "∞" : tier.maxMmr} MMR
                  </span>
                </div>
                
                {tierRanks.length > 1 && (
                  <div className="grid grid-cols-3 gap-1">
                    {tierRanks.map((rank) => {
                      const isCurrent = currentMmr !== undefined && 
                        currentMmr >= rank.minMmr && currentMmr <= rank.maxMmr;
                      
                      return (
                        <div 
                          key={rank.name}
                          className={cn(
                            "text-center py-1.5 px-2 rounded text-xs",
                            isCurrent 
                              ? cn("ring-2 ring-primary font-bold", TIER_BG_COLORS[rank.tier], TIER_COLORS[rank.tier])
                              : "bg-muted/30 text-muted-foreground"
                          )}
                        >
                          <div className="font-medium">
                            {rank.division ? `Div ${rank.division}` : rank.name}
                          </div>
                          <div className="text-[10px] opacity-70">
                            {rank.minMmr}–{rank.maxMmr > 9000 ? "∞" : rank.maxMmr}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {tierRanks.length === 1 && (
                  <div className={cn(
                    "text-center py-2 px-3 rounded text-xs",
                    currentMmr !== undefined && currentMmr >= tierRanks[0].minMmr
                      ? cn("ring-2 ring-primary font-bold", TIER_BG_COLORS[tier.tier], TIER_COLORS[tier.tier])
                      : "bg-muted/30 text-muted-foreground"
                  )}>
                    <div className="font-medium">2700+ MMR</div>
                    <div className="text-[10px] opacity-70">The pinnacle of pickleball</div>
                  </div>
                )}

                {isCurrentTier && currentMmr !== undefined && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-primary font-medium">You are here ({currentMmr} MMR)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong className="text-foreground">22 total ranks:</strong> 3 divisions for each of 7 main ranks, plus Supersonic Legend</p>
            <p>Your rank is determined by your MMR (Matchmaking Rating), calculated using the Glicko-2 algorithm.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
