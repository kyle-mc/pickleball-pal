import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGames, getPlayerMMR, getPlayerSeasonGamesCount } from "@/hooks/useGames";
import { getCurrentSeason } from "@/lib/seasons";
import { VICTORY_TYPES, VictoryType } from "@/lib/victoryTypes";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";
import { TrendingUp, TrendingDown, Percent } from "lucide-react";

interface MatchPreviewProps {
  team1: string[];
  team2: string[];
}

export function MatchPreview({ team1, team2 }: MatchPreviewProps) {
  const currentSeason = getCurrentSeason();
  const { data: allGames = [] } = useGames("all");
  
  const preview = useMemo(() => {
    if (team1.length !== 2 || team2.length !== 2) return null;
    
    // Get MMRs and RDs for all players
    const team1Mmrs = team1.map(p => getPlayerMMR(p, allGames));
    const team2Mmrs = team2.map(p => getPlayerMMR(p, allGames));
    
    const team1AvgMmr = (team1Mmrs[0] + team1Mmrs[1]) / 2;
    const team2AvgMmr = (team2Mmrs[0] + team2Mmrs[1]) / 2;
    
    // Calculate win probability using Glicko formula (simplified)
    const mmrDiff = team1AvgMmr - team2AvgMmr;
    const team1WinProb = 1 / (1 + Math.pow(10, -mmrDiff / 400));
    const team2WinProb = 1 - team1WinProb;
    
    // Estimate MMR changes for different victory types
    const baseK = 32; // Base K-factor for estimation
    const expectedScore1 = team1WinProb;
    
    const getEstimatedChange = (victoryType: VictoryType, isWinner: boolean) => {
      const actualScore = isWinner ? 1 : 0;
      const expected = isWinner ? expectedScore1 : (1 - expectedScore1);
      let change = baseK * (actualScore - expected);
      change = change * victoryType.multiplier;
      if (victoryType.bonus) change += victoryType.bonus * (isWinner ? 1 : -1);
      return Math.round(change);
    };
    
    // Get placement status for each player
    const placementStatus = [...team1, ...team2].map(p => ({
      name: p,
      gamesPlayed: getPlayerSeasonGamesCount(p, allGames, currentSeason.id),
      isPlacement: getPlayerSeasonGamesCount(p, allGames, currentSeason.id) < 10,
    }));
    
    return {
      team1: { players: team1, mmrs: team1Mmrs, avgMmr: team1AvgMmr, winProb: team1WinProb },
      team2: { players: team2, mmrs: team2Mmrs, avgMmr: team2AvgMmr, winProb: team2WinProb },
      victoryPreviews: Object.values(VICTORY_TYPES).map(vt => ({
        type: vt,
        team1Win: getEstimatedChange(vt, true),
        team1Lose: getEstimatedChange(vt, false),
        team2Win: getEstimatedChange(vt, true) * -1, // Inverse for display
        team2Lose: getEstimatedChange(vt, false) * -1,
      })),
      placementStatus,
    };
  }, [team1, team2, allGames, currentSeason.id]);
  
  if (!preview) return null;
  
  const { team1: t1, team2: t2, victoryPreviews, placementStatus } = preview;
  
  return (
    <Card className="bg-muted/30 border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Percent className="w-4 h-4" />
          Match Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win Probability */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t1.players.join(" & ")}</span>
            <span>{t2.players.join(" & ")}</span>
          </div>
          <div className="relative h-6 rounded-full overflow-hidden bg-muted">
            <div 
              className="absolute left-0 top-0 h-full bg-primary transition-all"
              style={{ width: `${t1.winProb * 100}%` }}
            />
            <div 
              className="absolute right-0 top-0 h-full bg-destructive transition-all"
              style={{ width: `${t2.winProb * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center gap-4 text-xs font-medium">
              <span className="text-primary-foreground drop-shadow">{(t1.winProb * 100).toFixed(0)}%</span>
              <span className="text-destructive-foreground drop-shadow">{(t2.winProb * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Avg MMR: {Math.round(t1.avgMmr)}</span>
            <span>Avg MMR: {Math.round(t2.avgMmr)}</span>
          </div>
        </div>
        
        {/* Placement Status */}
        {placementStatus.some(p => p.isPlacement) && (
          <div className="text-xs bg-primary/10 text-primary rounded p-2">
            <span className="font-medium">Placement Boost (2x):</span>{' '}
            {placementStatus.filter(p => p.isPlacement).map(p => 
              `${p.name} (${p.gamesPlayed}/10)`
            ).join(', ')}
          </div>
        )}
        
        {/* Potential MMR Changes */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">
            Potential MMR Changes (if Team 1 wins):
          </div>
          <div className="grid gap-1.5">
            {victoryPreviews.slice(0, 3).map(({ type, team1Win }) => (
              <div key={type.id} className="flex items-center justify-between text-xs">
                <VictoryTypeBadge victoryTypeId={type.id} size="sm" />
                <span className="flex items-center gap-1 text-primary">
                  <TrendingUp className="w-3 h-3" />
                  +{team1Win}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}