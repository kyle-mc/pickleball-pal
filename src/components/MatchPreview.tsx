import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGames, getPlayerMMR, getPlayerSeasonGamesCount } from "@/hooks/useGames";
import { usePlayerAvatars, getPlayerAvatar } from "@/hooks/usePlayerAvatars";
import { getCurrentSeason } from "@/lib/seasons";
import { VICTORY_TYPES, VictoryType } from "@/lib/victoryTypes";
import { VictoryTypeBadge } from "@/components/VictoryTypeBadge";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ArrowLeftRight, BarChart3 } from "lucide-react";
import { usePlacementEnabled } from "@/hooks/usePlacementEnabled";

interface MatchPreviewProps {
  team1: string[];
  team2: string[];
  onSwapTeams?: () => void;
}

export function MatchPreview({ team1, team2, onSwapTeams }: MatchPreviewProps) {
  const currentSeason = getCurrentSeason();
  const { data: allGames = [] } = useGames("all");
  const { data: avatarMap } = usePlayerAvatars();
  
  const preview = useMemo(() => {
    if (team1.length !== 2 || team2.length !== 2) return null;
    
    const team1Mmrs = team1.map(p => getPlayerMMR(p, allGames));
    const team2Mmrs = team2.map(p => getPlayerMMR(p, allGames));
    
    const team1AvgMmr = (team1Mmrs[0] + team1Mmrs[1]) / 2;
    const team2AvgMmr = (team2Mmrs[0] + team2Mmrs[1]) / 2;
    
    const mmrDiff = team1AvgMmr - team2AvgMmr;
    const team1WinProb = 1 / (1 + Math.pow(10, -mmrDiff / 400));
    const team2WinProb = 1 - team1WinProb;
    
    const baseK = 32;
    const expectedScore1 = team1WinProb;
    const expectedScore2 = team2WinProb;
    
    const getEstimatedChange = (victoryType: VictoryType, isWinner: boolean, isTeam1: boolean) => {
      const actualScore = isWinner ? 1 : 0;
      const expected = isTeam1 ? (isWinner ? expectedScore1 : expectedScore2) : (isWinner ? expectedScore2 : expectedScore1);
      let change = baseK * (actualScore - expected);
      change = change * victoryType.multiplier;
      if (victoryType.bonus) change += victoryType.bonus * (isWinner ? 1 : -1);
      return Math.round(change);
    };
    
    const placementStatus = [...team1, ...team2].map(p => ({
      name: p,
      gamesPlayed: getPlayerSeasonGamesCount(p, allGames, currentSeason.id),
      isPlacement: placementEnabled && getPlayerSeasonGamesCount(p, allGames, currentSeason.id) < 10,
    }));
    
    return {
      team1: { players: team1, mmrs: team1Mmrs, avgMmr: team1AvgMmr, winProb: team1WinProb },
      team2: { players: team2, mmrs: team2Mmrs, avgMmr: team2AvgMmr, winProb: team2WinProb },
      victoryPreviews: Object.values(VICTORY_TYPES).map(vt => ({
        type: vt,
        winnerChange: getEstimatedChange(vt, true, true),
        loserChange: getEstimatedChange(vt, false, false),
      })),
      placementStatus,
    };
  }, [team1, team2, allGames, currentSeason.id]);
  
  if (!preview) return null;
  
  const { team1: t1, team2: t2, victoryPreviews, placementStatus } = preview;

  const t1ProbPct = t1.winProb * 100;
  const t2ProbPct = t2.winProb * 100;
  const t1TextOutside = t1ProbPct < 15;
  const t2TextOutside = t2ProbPct < 15;
  
  return (
    <Card className="bg-muted/30 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Match Preview
          </CardTitle>
          {onSwapTeams && (
            <Button variant="ghost" size="sm" onClick={onSwapTeams} className="text-muted-foreground hover:text-foreground h-7 text-xs">
              <ArrowLeftRight className="w-3 h-3 mr-1" />
              Swap Teams
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win Probability */}
        <div className="space-y-2">
          {/* Team names - 2 rows */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <div className="flex flex-col gap-0.5">
              {t1.players.map((p) => (
                <div key={p} className="flex items-center gap-1">
                  <PlayerAvatar name={p} avatarUrl={getPlayerAvatar(p, avatarMap)} size="xs" />
                  <span className="text-primary font-medium">{p}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-0.5 items-end">
              {t2.players.map((p) => (
                <div key={p} className="flex items-center gap-1">
                  <span className="text-destructive font-medium">{p}</span>
                  <PlayerAvatar name={p} avatarUrl={getPlayerAvatar(p, avatarMap)} size="xs" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Win probability bar */}
          <div className="relative h-6 rounded-full overflow-visible bg-muted">
            <div className="relative h-full rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-primary transition-all flex items-center justify-center"
                style={{ width: `${t1ProbPct}%` }}
              >
                {!t1TextOutside && (
                  <span className="text-xs font-medium text-primary-foreground drop-shadow">{t1ProbPct.toFixed(0)}%</span>
                )}
              </div>
              <div 
                className="absolute right-0 top-0 h-full bg-destructive transition-all flex items-center justify-center"
                style={{ width: `${t2ProbPct}%` }}
              >
                {!t2TextOutside && (
                  <span className="text-xs font-medium text-destructive-foreground drop-shadow">{t2ProbPct.toFixed(0)}%</span>
                )}
              </div>
            </div>
            {/* Leader lines for text that doesn't fit - pointing to middle of bar */}
            {t1TextOutside && (
              <div className="absolute top-full mt-1 flex items-start" style={{ left: `${Math.max(t1ProbPct / 2, 2)}%`, transform: 'translateX(-50%)' }}>
                <div className="flex flex-col items-center">
                  <div className="w-px h-3 bg-primary" />
                  <span className="text-[10px] font-medium text-primary">{t1ProbPct.toFixed(0)}%</span>
                </div>
              </div>
            )}
            {t2TextOutside && (
              <div className="absolute top-full mt-1 flex items-start" style={{ right: `${Math.max(t2ProbPct / 2, 2)}%`, transform: 'translateX(50%)' }}>
                <div className="flex flex-col items-center">
                  <div className="w-px h-3 bg-destructive" />
                  <span className="text-[10px] font-medium text-destructive">{t2ProbPct.toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground" style={{ marginTop: (t1TextOutside || t2TextOutside) ? '1.75rem' : undefined }}>
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
            Potential MMR Changes:
          </div>
          
          {/* Header with team names as 2 rows */}
          <div className="grid grid-cols-3 text-xs gap-1">
            <div className="text-muted-foreground">Victory Type</div>
            <div className="text-center">
              <div className="text-primary font-medium">{t1.players[0]}</div>
              <div className="text-primary font-medium">{t1.players[1]}</div>
            </div>
            <div className="text-center">
              <div className="text-destructive font-medium">{t2.players[0]}</div>
              <div className="text-destructive font-medium">{t2.players[1]}</div>
            </div>
          </div>
          
          <div className="grid gap-1">
            {victoryPreviews.map(({ type, winnerChange, loserChange }) => (
              <div key={type.id} className="grid grid-cols-3 items-center text-xs gap-1">
                <VictoryTypeBadge victoryTypeId={type.id} size="sm" />
                <div className="text-center text-primary font-mono">+{winnerChange}</div>
                <div className="text-center text-destructive font-mono">{loserChange}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
